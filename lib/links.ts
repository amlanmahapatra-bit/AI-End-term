import { createHmac, timingSafeEqual } from "node:crypto";

// HMAC-signed action links for the designer email. GET only shows a confirm page; POST records
// the action, so email link scanners that auto-click cannot claim or reschedule a lead.

export type LeadAction = "claim" | "reschedule";

const secret = () => {
  const s = process.env.LINK_SECRET;
  if (!s) throw new Error("LINK_SECRET not set");
  return s;
};

const mac = (action: string, callId: string, designerId: string, exp: number) =>
  createHmac("sha256", secret()).update(`${action}|${callId}|${designerId}|${exp}`).digest("hex");

export function signedLink(action: LeadAction, callId: string, designerId: string, ttlDays = 14): string {
  const exp = Math.floor(Date.now() / 1000) + ttlDays * 86400;
  const q = new URLSearchParams({ c: callId, d: designerId, e: String(exp), s: mac(action, callId, designerId, exp) });
  return `${process.env.APP_URL}/api/lead/${action}?${q}`;
}

export function verifyLink(action: LeadAction, p: URLSearchParams): { callId: string; designerId: string } | null {
  const callId = p.get("c") ?? "";
  const designerId = p.get("d") ?? "";
  const exp = Number(p.get("e"));
  const sig = p.get("s") ?? "";
  if (!callId || !designerId || !Number.isFinite(exp) || exp < Date.now() / 1000) return null;
  const expected = Buffer.from(mac(action, callId, designerId, exp));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { callId, designerId };
}
