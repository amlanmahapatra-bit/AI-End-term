import { NextResponse } from "next/server";
import { parseVaani } from "@/lib/vaani";
import { handleCallStarted, handlePostProcessing } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  // Vaani webhooks are unsigned, so the shared secret travels in the URL.
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.VAANI_WEBHOOK_SECRET || token !== process.env.VAANI_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid json" }, { status: 400 });

  const ev = parseVaani(body);
  if (!ev.callId) return NextResponse.json({ error: "missing call id" }, { status: 400 });

  try {
    if (ev.event === "call_started") {
      await handleCallStarted(ev);
      return NextResponse.json({ ok: true });
    }
    if (ev.event === "call_postprocessing") {
      return NextResponse.json(await handlePostProcessing(ev));
    }
    return NextResponse.json({ ok: true, ignored: true });
  } catch (e) {
    console.error("webhook error", e);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
