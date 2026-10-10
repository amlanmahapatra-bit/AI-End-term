import { NextResponse } from "next/server";
import { db } from "./supabase";
import { verifyLink, type LeadAction } from "./links";

const page = (title: string, body: string) =>
  new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="font-family:system-ui,sans-serif;max-width:420px;margin:15vh auto;padding:0 16px;text-align:center">${body}</body>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );

const LABEL: Record<LeadAction, string> = { claim: "Claim this lead", reschedule: "Request a reschedule" };

/** GET only renders a confirm form, so link scanners that pre-fetch URLs change nothing. */
export function confirmPage(action: LeadAction, req: Request) {
  const url = new URL(req.url);
  if (!verifyLink(action, url.searchParams)) return page("Invalid link", "<h2>This link is invalid or has expired.</h2>");
  return page(
    LABEL[action],
    `<h2>${LABEL[action]}?</h2><form method="POST" action="${url.pathname}${url.search.replace(/&/g, "&amp;")}"><button style="padding:12px 20px;font-size:16px;border-radius:6px;border:0;background:#0f766e;color:#fff">Confirm</button></form>`,
  );
}

export async function applyAction(action: LeadAction, req: Request) {
  const v = verifyLink(action, new URL(req.url).searchParams);
  if (!v) return page("Invalid link", "<h2>This link is invalid or has expired.</h2>");

  const sb = db();
  const { data: designer } = await sb.from("designers").select("name").eq("id", v.designerId).maybeSingle();
  const now = new Date().toISOString();

  if (action === "claim") {
    const { data: call } = await sb.from("calls").select("claimed_by").eq("id", v.callId).maybeSingle();
    if (call?.claimed_by) return page("Already claimed", `<h2>Already claimed by ${call.claimed_by}.</h2>`);
    await sb.from("calls").update({ claimed_by: designer?.name ?? v.designerId, claimed_at: now }).eq("id", v.callId).is("claimed_by", null);
    return page("Claimed", "<h2>Lead claimed.</h2><p>It is yours. Call the lead to confirm the consultation.</p>");
  }
  await sb.from("calls").update({ reschedule_requested_at: now }).eq("id", v.callId);
  return page("Reschedule requested", "<h2>Reschedule noted.</h2><p>The front desk will contact the lead for a new slot.</p>");
}
