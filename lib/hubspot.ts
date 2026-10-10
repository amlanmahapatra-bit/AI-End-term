import type { LeadResult } from "./gemini";

/** Best-effort deal creation. Returns null when HubSpot is not configured. */
export async function createDeal(r: LeadResult, handoffNote: string): Promise<string | null> {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) return null;
  const name = [r.lead.name ?? "Unknown", r.lead.property_type, r.lead.location].filter(Boolean).join(" · ");
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ properties: { dealname: name, description: handoffNote } }),
  });
  if (!res.ok) throw new Error(`HubSpot ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).id ?? null;
}
