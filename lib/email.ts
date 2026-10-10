import type { LeadResult } from "./gemini";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

async function send(to: string, subject: string, html: string, text: string): Promise<string | null> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).id ?? null;
}

const btn = (href: string, label: string, bg: string) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:4px 6px 4px 0;padding:10px 16px;border-radius:6px;background:${bg};color:#fff;text-decoration:none;font-weight:600">${label}</a>`;

export async function emailDesigner(a: {
  to: string;
  designerName: string;
  r: LeadResult;
  callerNumber: string | null;
  bookedSlot: string | null;
  claimUrl: string;
  rescheduleUrl: string;
  bookingUrl: string | null;
  summary: string | null;
}): Promise<string | null> {
  const { r } = a;
  const who = r.lead.name ?? "New caller";
  const slot = a.bookedSlot ? new Date(a.bookedSlot).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) : "slot to be confirmed";
  const subject = `New qualified lead: ${who} · ${r.lead.location ?? "Pune"} · ${slot}`;
  const rows: [string, unknown][] = [
    ["Name", who],
    ["Phone", a.callerNumber ?? r.lead.phone],
    ["Property", r.lead.property_type],
    ["Size", r.lead.area_sqft],
    ["Location", r.lead.location],
    ["Scope", r.lead.scope],
    ["Timeline", r.lead.timeline],
    ["Decision-maker", r.lead.decision_maker],
    ["Heard via", r.lead.source],
    ["Asked about pricing", r.asked_pricing ? "Yes (deflected to consultation)" : "No"],
    ["Consultation", slot],
  ];
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto">
<h2 style="margin:0 0 8px">${esc(who)} · ${esc(r.segment)}</h2>
<p style="color:#555;margin:0 0 12px">Hi ${esc(a.designerName)}, a qualified lead is ready. Everything the front desk would have asked is below.</p>
<pre style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:6px;font-family:inherit">${esc(r.handoff_note)}</pre>
<table style="border-collapse:collapse;width:100%">${rows
    .map(([k, v]) => `<tr><td style="padding:4px 8px;color:#777">${k}</td><td style="padding:4px 8px">${esc(v ?? "n/a")}</td></tr>`)
    .join("")}</table>
<p style="margin:16px 0 4px">${btn(a.claimUrl, "Claim this lead", "#0f766e")}${btn(a.rescheduleUrl, "Reschedule", "#b45309")}${a.bookingUrl ? btn(a.bookingUrl, "Booking link", "#334155") : ""}</p>
<p style="color:#777;font-size:12px">Why it qualified: ${esc(r.fit_reason)}. Pricing is for you to discuss at the consultation; the agent quoted none.</p></div>`;
  const text = `${subject}\n\n${r.handoff_note}\n\nClaim: ${a.claimUrl}\nReschedule: ${a.rescheduleUrl}${a.bookingUrl ? `\nBooking: ${a.bookingUrl}` : ""}`;
  return send(a.to, subject, html, text);
}

/** Complaints, and any failure where the lead must not be lost. A human acts on these. */
export async function emailFrontDesk(subject: string, body: string): Promise<string | null> {
  const to = process.env.FRONT_DESK_EMAIL;
  if (!to) throw new Error("FRONT_DESK_EMAIL not set");
  return send(to, subject, `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${esc(body)}</pre>`, body);
}
