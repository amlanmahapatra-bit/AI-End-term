// Vaani AI webhook parsing. Webhooks are unsigned, so the route authenticates with ?token=.
// Field names are read defensively because the payload shape is only partly documented.

export interface VaaniEvent {
  event: "call_started" | "call_postprocessing" | "other";
  callId: string;
  callerNumber: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationMs: number | null;
  transcriptRaw: string;
  transcriptLines: { time: string | null; role: string; text: string }[];
  summary: string | null;
  recordingUrl: string | null;
  entities: Record<string, unknown>;
}

const present = (v: unknown) => v !== undefined && v !== null && v !== "";

/** Looks for the first matching key, at the top level first and then up to 3 levels deep. */
const pick = (o: any, ...keys: string[]) => {
  for (const k of keys) if (present(o?.[k])) return o[k];
  const walk = (node: any, depth: number): unknown => {
    if (!node || typeof node !== "object" || depth > 3) return null;
    for (const k of keys) if (present(node[k])) return node[k];
    for (const v of Object.values(node)) {
      const hit = walk(v, depth + 1);
      if (present(hit)) return hit;
    }
    return null;
  };
  return walk(o, 0);
};

/** Key structure only (no values), safe to log when a payload is not recognised. */
export function shape(o: any, depth = 0): unknown {
  if (Array.isArray(o)) return [o.length ? shape(o[0], depth + 1) : "empty"];
  if (o && typeof o === "object") {
    if (depth > 3) return "{...}";
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v, depth + 1)]));
  }
  return typeof o;
}

export function parseTranscript(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(?:\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*)?(AGENT|USER|CALLER|FRONT DESK)\s*:\s*(.*)$/i);
      return m ? { time: m[1] ?? null, role: m[2].toUpperCase(), text: m[3] } : { time: null, role: "NOTE", text: l };
    });
}

export function parseVaani(body: any): VaaniEvent {
  const d = body?.data ?? body ?? {};
  const rawEvent = String(pick(body, "event", "event_type", "type") ?? pick(d, "event", "event_type") ?? "").toLowerCase();
  const event = rawEvent.includes("start") ? "call_started" : rawEvent.includes("post") ? "call_postprocessing" : "other";
  const transcriptRaw = String(pick(d, "transcript", "transcription") ?? "");
  const dur = pick(d, "call_duration", "duration_ms");
  return {
    event,
    callId: String(pick(d, "call_id", "callId", "session_id", "sessionId", "call_uuid", "uuid", "id") ?? ""),
    callerNumber: pick(d, "caller_number", "from_number", "from", "customer_number", "phone_number"),
    startedAt: pick(d, "call_started_at", "start_time", "started_at", "call_start_time"),
    endedAt: pick(d, "call_ended_at", "end_time", "ended_at", "call_end_time"),
    durationMs: dur !== null && Number.isFinite(Number(dur)) ? Number(dur) : null,
    transcriptRaw,
    transcriptLines: parseTranscript(transcriptRaw),
    summary: pick(d, "summary", "call_summary"),
    recordingUrl: pick(d, "recording_url", "recording"),
    entities: (pick(d, "entities", "extracted_data", "extractions") as Record<string, unknown>) ?? {},
  };
}

/** call_duration is milliseconds and sometimes missing: fall back to end minus start. */
export function durationSec(startedAt: string | null, endedAt: string | null, durationMs: number | null): number {
  if (durationMs && durationMs > 0) return Math.round(durationMs / 1000);
  if (startedAt && endedAt) {
    const diff = (Date.parse(endedAt) - Date.parse(startedAt)) / 1000;
    if (Number.isFinite(diff) && diff > 0) return Math.round(diff);
  }
  return 0;
}

/** After hours = outside 10:00-19:00 IST. */
export function isAfterHours(startedAt: string | null): boolean | null {
  if (!startedAt) return null;
  const t = Date.parse(startedAt);
  if (!Number.isFinite(t)) return null;
  const ist = new Date(t + 5.5 * 3600 * 1000);
  const h = ist.getUTCHours();
  return h < 10 || h >= 19;
}
