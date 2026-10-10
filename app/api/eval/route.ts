import { NextResponse } from "next/server";
import { classify } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

// Dry run: classifies a transcript and returns the result. No database row, email or CRM deal.
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.VAANI_WEBHOOK_SECRET || token !== process.env.VAANI_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id, transcript } = (await req.json().catch(() => ({}))) as { id?: string; transcript?: string };
  if (!transcript) return NextResponse.json({ error: "transcript required" }, { status: 400 });
  try {
    const out = await classify(transcript, new Date().toISOString());
    return NextResponse.json({ id, ...out.result, cost_inr: out.costInr, price_lines_removed: out.removedPriceLines.length });
  } catch (e) {
    return NextResponse.json({ id, error: (e as Error).message }, { status: 502 });
  }
}
