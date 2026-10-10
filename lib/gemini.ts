import { qualifiedMd, servicesMd } from "./knowledge";
import { stripPrices } from "./price-filter";

export type Classification = "qualified" | "not_fit" | "complaint" | "unclear";

export interface LeadResult {
  classification: Classification;
  fit_reason: string;
  asked_pricing: boolean;
  segment: "home" | "office" | "unknown";
  lead: {
    name: string | null;
    property_type: string | null;
    area_sqft: string | null;
    location: string | null;
    scope: string | null;
    timeline: string | null;
    decision_maker: string | null;
    volunteered_budget: string | null;
    source: string | null;
    phone: string | null;
  };
  booked_slot: string | null;
  handoff_note: string;
}

export interface ClassifyOutput {
  result: LeadResult;
  costInr: number;
  removedPriceLines: string[];
}

const nullableString = { type: "STRING", nullable: true };

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    classification: { type: "STRING", enum: ["qualified", "not_fit", "complaint", "unclear"] },
    fit_reason: { type: "STRING" },
    asked_pricing: { type: "BOOLEAN" },
    segment: { type: "STRING", enum: ["home", "office", "unknown"] },
    lead: {
      type: "OBJECT",
      properties: {
        name: nullableString,
        property_type: nullableString,
        area_sqft: nullableString,
        location: nullableString,
        scope: nullableString,
        timeline: nullableString,
        decision_maker: nullableString,
        volunteered_budget: nullableString,
        source: nullableString,
        phone: nullableString,
      },
      required: ["name", "property_type", "area_sqft", "location", "scope", "timeline", "decision_maker", "volunteered_budget", "source", "phone"],
    },
    booked_slot: nullableString,
    handoff_note: { type: "STRING" },
  },
  required: ["classification", "fit_reason", "asked_pricing", "segment", "lead", "booked_slot", "handoff_note"],
};

function systemPrompt(): string {
  return `You classify inbound phone enquiries for Aangan Studio, an interior design studio in Pune.
Use ONLY the two documents below, verbatim, to decide.

=== qualified.md ===
${qualifiedMd()}

=== services.md ===
${servicesMd()}

CLASSIFICATION
- qualified: passes all five criteria. If budget or decision-maker is unclear, it is still qualified: mention the uncertainty in handoff_note. A rented flat with no structural changes and a single room with full execution are both fine. Calling after hours is fine. Asking about price never disqualifies.
- not_fit: fails a criterion. Outside Pune/PCMC; advice, ideas or decor only; restaurant/hotel/retail/gym; structural work; must be ready in under 6 weeks; or a volunteered budget clearly too low for the scope.
- complaint: an existing client with a problem, or an angry caller. A human handles it.
- unclear: dropped/missed call or almost no information.
fit_reason must name the deciding criterion (e.g. "Criterion 2: Nashik is outside Pune/PCMC").

THE CUT (non-negotiable)
- Never write a price, rate, per-sq-ft figure, range or estimate anywhere in your output, even if it appears in the transcript. The only exception is the caller's OWN volunteered budget, which you may report in lead.volunteered_budget, clearly attributed to the caller.
- asked_pricing is true if the caller asked about price/cost at any point.

handoff_note: exactly 8 short lines for a designer reading on a phone. Cover: who, what space and size, where, scope, timeline, decision-maker, caller's own words on budget if any (attributed), and the recommended next step. For not_fit/complaint/unclear, say why and what a human should do (if anything). Plain text, no markdown.

booked_slot: ISO 8601 date-time (Asia/Kolkata) only if a consultation slot was actually agreed in the call, using the call date given below to resolve words like "tomorrow". Otherwise null.

Return JSON only.`;
}

export async function classify(transcript: string, callDateIso: string): Promise<ClassifyOutput> {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!key || !model) throw new Error("GEMINI_API_KEY / GEMINI_MODEL not set");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt() }] },
      contents: [{ role: "user", parts: [{ text: `Call date: ${callDateIso}\n\nTranscript:\n${transcript}` }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const data = await res.json();
  const text: string | undefined = (data?.candidates?.[0]?.content?.parts ?? []).filter((p: any) => !p.thought && p.text).map((p: any) => p.text).join("");
  if (!text) throw new Error("Gemini returned no content");
  const result = JSON.parse(text) as LeadResult;

  // Enforce The Cut in code, not just in the prompt.
  const note = stripPrices(result.handoff_note ?? "");
  const reason = stripPrices(result.fit_reason ?? "");
  result.handoff_note = note.text;
  result.fit_reason = reason.text;

  const inTok = data?.usageMetadata?.promptTokenCount ?? 0;
  const outTok = (data?.usageMetadata?.candidatesTokenCount ?? 0) + (data?.usageMetadata?.thoughtsTokenCount ?? 0);
  const costInr =
    (inTok / 1e6) * Number(process.env.GEMINI_INR_PER_M_INPUT ?? 0) +
    (outTok / 1e6) * Number(process.env.GEMINI_INR_PER_M_OUTPUT ?? 0);

  return { result, costInr, removedPriceLines: [...note.removed, ...reason.removed] };
}
