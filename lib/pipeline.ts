import { db } from "./supabase";
import { classify } from "./gemini";
import { emailCaller, emailDesigner, emailFrontDesk } from "./email";
import { buildInvite } from "./ics";
import { createDeal } from "./hubspot";
import { signedLink } from "./links";
import { durationSec, isAfterHours, type VaaniEvent } from "./vaani";

const log = (...a: unknown[]) => console.log("[pipeline]", ...a);

export async function handleCallStarted(ev: VaaniEvent) {
  const { error } = await db()
    .from("calls")
    .upsert(
      {
        vaani_call_id: ev.callId,
        caller_number: ev.callerNumber,
        started_at: ev.startedAt ?? new Date().toISOString(),
        after_hours: isAfterHours(ev.startedAt ?? new Date().toISOString()),
        status: "in_progress",
      },
      { onConflict: "vaani_call_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}

async function pickDesigner(segment: string) {
  const { data: designers } = await db().from("designers").select("*").eq("active", true);
  if (!designers?.length) return null;
  const fits = designers.filter((d) => !d.specialties?.length || d.specialties.includes(segment));
  const pool = fits.length ? fits : designers;
  // Least-loaded first so leads spread across designers.
  const { data: rows } = await db().from("calls").select("designer_id").not("designer_id", "is", null);
  const load = new Map<string, number>();
  rows?.forEach((r) => load.set(r.designer_id, (load.get(r.designer_id) ?? 0) + 1));
  return [...pool].sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0))[0];
}

export async function handlePostProcessing(ev: VaaniEvent) {
  const sb = db();
  const { data: existing } = await sb.from("calls").select("*").eq("vaani_call_id", ev.callId).maybeSingle();
  // Idempotent: a redelivered webhook for an already-processed call does nothing.
  if (existing?.classification) return { skipped: "already processed" };

  const startedAt = ev.startedAt ?? existing?.started_at ?? null;
  const endedAt = ev.endedAt ?? new Date().toISOString();
  const secs = durationSec(startedAt, endedAt, ev.durationMs);
  const costVoice = (secs / 60) * Number(process.env.VAANI_RATE_INR_PER_MIN ?? 0);

  const base = {
    vaani_call_id: ev.callId,
    caller_number: ev.callerNumber ?? existing?.caller_number ?? null,
    started_at: startedAt,
    ended_at: endedAt,
    after_hours: isAfterHours(startedAt),
    duration_sec: secs,
    recording_url: ev.recordingUrl,
    summary: ev.summary,
    collected: ev.entities,
    transcript: ev.transcriptLines,
    status: "completed",
    cost_voice_inr: costVoice,
  };
  const { data: row, error } = await sb.from("calls").upsert(base, { onConflict: "vaani_call_id" }).select().single();
  if (error) throw error;

  const rawForDesk = `Caller: ${base.caller_number ?? "unknown"}\nCall id: ${ev.callId}\n\n${ev.transcriptRaw || ev.summary || "(no transcript)"}`;

  // Never lose a lead: if classification fails, log it and send the raw transcript to the front desk.
  let out;
  try {
    out = await classify(ev.transcriptRaw, startedAt ?? new Date().toISOString());
  } catch (e) {
    log("classification failed", e);
    await emailFrontDesk(`[Needs human] Aangan call could not be classified`, `AI step failed: ${(e as Error).message}\n\n${rawForDesk}`).catch((x) => log("front desk email failed", x));
    await sb.from("calls").update({ status: "ai_failed" }).eq("id", row.id);
    return { ok: false, reason: "ai_failed" };
  }

  const { result: r, costInr } = out;
  const slot = (ev.entities as any)?.booked_slot ?? r.booked_slot;
  const bookedSlot = slot && Number.isFinite(Date.parse(String(slot))) ? new Date(String(slot)).toISOString() : null;

  const update: Record<string, unknown> = {
    classification: r.classification,
    fit_reason: r.fit_reason,
    asked_pricing: r.asked_pricing,
    handoff_note: r.handoff_note,
    collected: { ...(ev.entities as object), ...r.lead, segment: r.segment },
    cost_llm_inr: costInr,
    booked_slot: r.classification === "qualified" ? bookedSlot : null,
  };

  // Each output is best-effort so one failure never blocks the others.
  if (r.classification === "qualified") {
    const designer = await pickDesigner(r.segment).catch(() => null);
    if (designer) update.designer_id = designer.id;

    const organizer = (process.env.EMAIL_FROM ?? "").match(/<(.+)>/)?.[1] ?? process.env.EMAIL_FROM ?? "";
    const callerEmail = r.lead.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.lead.email) ? r.lead.email : null;
    const ics = bookedSlot
      ? buildInvite({
          uid: row.id,
          startIso: bookedSlot,
          organizerEmail: organizer,
          callerName: r.lead.name,
          attendees: [...(designer?.email ? [{ name: designer.name, email: designer.email }] : []), ...(callerEmail ? [{ name: r.lead.name, email: callerEmail }] : [])],
        })
      : null;

    const jobs = await Promise.allSettled([
      designer?.email
        ? emailDesigner({
            to: designer.email,
            designerName: designer.name,
            r,
            callerNumber: base.caller_number,
            bookedSlot,
            claimUrl: signedLink("claim", row.id, designer.id),
            rescheduleUrl: signedLink("reschedule", row.id, designer.id),
            bookingUrl: process.env.CALCOM_BOOKING_URL ?? null,
            summary: ev.summary,
            ics,
          })
        : Promise.reject(new Error("no designer with an email")),
      createDeal(r, r.handoff_note),
      ics && callerEmail && bookedSlot ? emailCaller({ to: callerEmail, name: r.lead.name, slotIso: bookedSlot, ics }) : Promise.resolve(null),
    ]);
    if (jobs[0].status === "fulfilled") update.email_message_id = jobs[0].value;
    else {
      log("designer email failed", jobs[0].reason);
      await emailFrontDesk(`[Needs human] Qualified lead, designer email failed`, `${(jobs[0].reason as Error).message}\n\n${r.handoff_note}\n\n${rawForDesk}`).catch(() => {});
    }
    if (jobs[1].status === "fulfilled") update.hubspot_deal_id = jobs[1].value;
    else log("hubspot failed", jobs[1].reason);
    // Caller invite is best-effort; record the outcome so the front desk can follow up by phone.
    const invite = jobs[2].status === "fulfilled" ? (jobs[2].value ? "sent" : callerEmail ? "no_slot" : "no_email") : "failed";
    if (jobs[2].status === "rejected") log("caller invite failed", jobs[2].reason);
    update.collected = { ...(update.collected as object), invite };
  } else if (r.classification === "complaint") {
    await emailFrontDesk(`[Complaint] Call from ${base.caller_number ?? "unknown"} needs a human`, `${r.handoff_note}\n\n${rawForDesk}`).catch((x) => log("front desk email failed", x));
  }

  const { error: uerr } = await sb.from("calls").update(update).eq("id", row.id);
  if (uerr) throw uerr;
  return { ok: true, classification: r.classification };
}
