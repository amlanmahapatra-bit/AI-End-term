// Runs the labelled September phone transcripts through /api/eval and writes docs/eval-results.md.
// Usage: BASE_URL=https://your-app.vercel.app VAANI_WEBHOOK_SECRET=... node scripts/run-evals.mjs
// Free Gemini tier allows ~20 requests/day, so calls are spaced out and only labelled ones run.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const token = process.env.VAANI_WEBHOOK_SECRET;
if (!token) throw new Error("Set VAANI_WEBHOOK_SECRET");

const transcripts = JSON.parse(readFileSync("data/phone-transcripts.json", "utf8"));
const expected = JSON.parse(readFileSync("data/expected.json", "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PRICE = /₹|\brs\.?\s*\d|\b\d[\d,.]*\s*(lakhs?|lacs?|cr|k)\b|per\s*sq/i;

const rows = [];
let pass = 0;
for (const t of transcripts.filter((x) => expected[x.id])) {
  const exp = expected[t.id];
  const res = await fetch(`${base}/api/eval?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: t.id, transcript: t.transcript }),
  });
  const out = await res.json();
  const okClass = out.classification === exp.classification;
  const okPrice = exp.asked_pricing === undefined || out.asked_pricing === exp.asked_pricing;
  const priceLeak = PRICE.test(`${out.handoff_note ?? ""}\n${out.fit_reason ?? ""}`) &&
    !/budget|volunteer/i.test(out.handoff_note ?? "");
  const ok = okClass && okPrice && !priceLeak && !out.error;
  if (ok) pass++;
  rows.push({ id: t.id, exp: exp.classification + (exp.asked_pricing ? " + asked_pricing" : ""), got: out.error ? `ERROR ${out.error}` : out.classification + (out.asked_pricing ? " + asked_pricing" : ""), why: (out.fit_reason ?? "").replace(/\|/g, "/"), ok, priceLeak });
  console.log(t.id, ok ? "PASS" : "FAIL", rows.at(-1).got);
  await sleep(4000);
}

const md = `# Eval results (dry run via /api/eval)

${pass}/${rows.length} correct. Price leak check: ${rows.some((r) => r.priceLeak) ? "FAILED" : "no price in any output"}.

| Call | Expected | Got | Deciding reason | Result |
|---|---|---|---|---|
${rows.map((r) => `| ${r.id} | ${r.exp} | ${r.got} | ${r.why} | ${r.ok ? "PASS" : "FAIL"} |`).join("\n")}
`;
mkdirSync("docs", { recursive: true });
writeFileSync("docs/eval-results.md", md);
console.log(`\n${pass}/${rows.length} passed. Wrote docs/eval-results.md`);
