// Classifies the 20 September phone enquiries through /api/eval (dry run) and writes
// supabase/migrations/002_september_baseline.sql. Paste that SQL into the Supabase SQL Editor.
// Usage: BASE_URL=http://localhost:3000 VAANI_WEBHOOK_SECRET=... node scripts/import-september.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const token = process.env.VAANI_WEBHOOK_SECRET;
if (!token) throw new Error("Set VAANI_WEBHOOK_SECRET");

const transcripts = JSON.parse(readFileSync("data/phone-transcripts.json", "utf8"));
const CACHE = "data/september-classified.json";
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "2 September · 10:23am · 4 min 12 sec" -> IST timestamp, duration, after-hours flag
function parseMeta(meta) {
  const [d, t, dur] = meta.split("·").map((x) => x.trim());
  const [day, month] = d.split(" ");
  const m = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  let h = Number(m[1]) % 12 + (m[3].toLowerCase() === "pm" ? 12 : 0);
  const mi = m[2];
  const months = { September: "09" };
  const iso = `2026-${months[month]}-${String(day).padStart(2, "0")}T${String(h).padStart(2, "0")}:${mi}:00+05:30`;
  const dm = (dur ?? "").match(/(\d+)\s*min\s*(\d+)?/);
  return { iso, durationSec: dm ? Number(dm[1]) * 60 + Number(dm[2] ?? 0) : 0, afterHours: h < 10 || h >= 19 };
}

for (const t of transcripts) {
  if (cache[t.id]) continue;
  if (process.env.ALLOW_PARTIAL && !/MISSED CALL/i.test(t.meta)) continue; // no API calls in partial mode
  if (/MISSED CALL/i.test(t.meta)) {
    cache[t.id] = {
      classification: "unclear",
      fit_reason: "Missed call outside office hours; no conversation to classify",
      asked_pricing: false,
      handoff_note: t.transcript.replace(/^NOTE:\s*/gm, ""),
    };
    continue;
  }
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`${base}/api/eval?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: t.id, transcript: t.transcript }),
    });
    const out = await res.json();
    if (!out.error) {
      cache[t.id] = { classification: out.classification, fit_reason: out.fit_reason, asked_pricing: !!out.asked_pricing, handoff_note: out.handoff_note };
      console.log(t.id, out.classification);
      break;
    }
    console.log(t.id, `attempt ${attempt} failed: ${String(out.error).slice(0, 120)}`);
    await sleep(8000 * attempt);
  }
  writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  await sleep(3000);
}
writeFileSync(CACHE, JSON.stringify(cache, null, 1));

const missing = transcripts.filter((t) => !cache[t.id]).map((t) => t.id);
if (missing.length && !process.env.ALLOW_PARTIAL) throw new Error(`Not classified: ${missing.join(", ")}. Re-run to resume, or set ALLOW_PARTIAL=1.`);
if (missing.length) console.log(`Partial import, skipping: ${missing.join(", ")}. Re-run later to add them (SQL uses on conflict do nothing).`);

// E'...' strings with \n escapes keep every row on ONE line, so partial selection or line-based splitting in the SQL editor can't break a string.
const q = (s) => `E'${String(s ?? "").replace(/\\/g, "\\\\").replace(/'/g, "''").replace(/\r?\n/g, "\\n")}'`;
const rows = transcripts.filter((t) => cache[t.id]).map((t) => {
  const m = parseMeta(t.meta);
  const c = cache[t.id];
  return `(${q(t.id)}, '${m.iso}', ${m.afterHours}, ${m.durationSec}, ${q(c.classification)}, ${q(c.fit_reason)}, ${c.asked_pricing}, ${q(c.handoff_note)}, ${q(t.transcript)})`;
});

const sql = `-- September 2026 baseline: the 20 real phone enquiries, classified by the same AI step.
-- Kept in its own table so live call totals and running cost are never mixed with history.
create table if not exists public.imported_enquiries (
  id text primary key,
  channel text default 'phone',
  received_at timestamptz,
  after_hours boolean,
  duration_sec integer default 0,
  classification text check (classification in ('qualified','not_fit','complaint','unclear')),
  fit_reason text,
  asked_pricing boolean default false,
  handoff_note text,
  transcript text,
  source text default 'september_2026_seed'
);
alter table public.imported_enquiries enable row level security;

${rows.map((r) => `insert into public.imported_enquiries (id, received_at, after_hours, duration_sec, classification, fit_reason, asked_pricing, handoff_note, transcript) values ${r} on conflict (id) do nothing;`).join("\n")}
`;
writeFileSync("supabase/migrations/002_september_baseline.sql", sql);
console.log(`Wrote supabase/migrations/002_september_baseline.sql (${rows.length} rows)`);
