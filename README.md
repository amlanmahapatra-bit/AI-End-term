# Aangan Studio: AI call agent (MESA Case 03)

Every inbound phone enquiry is answered in seconds, day or night. Qualified leads reach a designer by email with full context, and Nikhil gets a dashboard of results and running cost. **The agent never quotes a price.**

## Automation brief

- **Pain:** about 48% of ~200 monthly enquiries get no reply within 48 hours; a third arrive after 10am-7pm; a reply within an hour converts 4x better. When a lead does reach a designer it is a forwarded message with no context.
- **User:** Nikhil (owner of the outcome), the 14 designers (receive leads), the 2-person front desk (handle complaints).
- **Outcome:** every call answered; qualified leads booked into a consultation during the call; designer emailed with everything already asked; dashboard with calls, after-hours calls, qualified, booked, show-ups, won, and cost.
- **Journey today:** call -> rings out after 7pm or when desk is busy -> maybe a callback next day -> details forwarded by message -> designer re-asks the same questions -> consultation.

## The Nine Checks

| # | Check | Verdict | Evidence |
|---|---|---|---|
| 01 | Is the problem real? | Yes | 48% unanswered in 48h; 33% after hours; 4x conversion if answered within an hour. T08 (10:47pm) was a missed call. |
| 02 | Is the workflow repeated? | Yes | ~200 enquiries/month; the first four questions are identical on every call. |
| 03 | Is the input available? | Yes / partly | `services.md` and `qualified.md` are enough to answer and qualify. `pricing.md` exists but is deliberately never loaded. |
| 04 | Is the output valuable? | Yes | A booked consultation on an Rs 8-14 lakh project. |
| 05 | Is the impact measurable? | Yes | Time to first response, bookings, show-up rate, all in the dashboard from day one. |
| 06 | Is the failure risk OK? | Yes for answering/qualifying/booking. **No for pricing.** | A price said in the studio's voice is heard as a commitment and cannot be taken back. |
| 07 | Is judgment protected? | Partly | Quoting, committing to site visits or dates, and complaints stay with humans (T09 is routed to the front desk). |
| 08 | Is the ROI worth it? | Yes | ~96 unanswered calls a month; a small lift in conversion covers tool cost many times over. |
| 09 | Is the owner clear? | Yes | Agent qualifies and books; designer owns the relationship; Nikhil owns the price. |

**The Cut:** Nikhil wants the system to quote standard per-sq-ft pricing. Check 06 fails, so the agent says "Your designer will walk you through pricing on the consultation" and nothing more. Enforced three ways: `pricing.md` is never loaded, the prompts forbid it, and `lib/price-filter.ts` strips any price line from AI output (a budget the caller volunteered is allowed through).

## Handoff channel: email, not Telegram

Email carries the full structured note plus transcript summary and signed Claim / Reschedule / Booking buttons, needs no bot or chat-ID setup for 14 designers, and leaves a searchable record. Telegram is faster to notice but weaker at context and audit trail. Complaints and any AI failure go to the front desk by email so no lead is lost.

## Component map

See [docs/component-map.html](docs/component-map.html). Trigger -> Input -> Context -> Processing -> AI -> Output:

- **Trigger:** inbound call to the Vaani agent; webhooks `call_started` and `call_postprocessing`
- **Input:** transcript, caller number, duration, recording URL, extracted entities
- **Context:** `knowledge/qualified.md` + `knowledge/services.md` (verbatim). Never `pricing.md`.
- **Processing:** token-checked, idempotent webhook; log to Supabase; after-hours flag; cost calculation
- **AI:** Gemini Flash in JSON mode classifies (qualified / not_fit / complaint / unclear) and writes an 8-line handoff note
- **Output:** designer email (Resend), HubSpot deal, front-desk email for complaints/failures, dashboard

Extending to WhatsApp and the web form: only the trigger changes; context, AI and outputs are reused.

## Setup

1. Create Supabase project, run `supabase/migrations/001_init.sql` (edit the designer email first).
2. Import the repo in Vercel and add the variables from `.env.example`. Paste secrets in Vercel, never in chat or git. Redeploy after changes.
3. Create the Vaani agent from `vaani/agent-setup.md` and add the webhook.
4. Set `GEMINI_MODEL=gemini-3.8-flash` (tested; `gemini-2.5-flash` is closed to new users).

## Evals

```bash
BASE_URL=https://<your-app>.vercel.app VAANI_WEBHOOK_SECRET=<secret> npm run eval
```

Runs the labelled September phone transcripts (`data/phone-transcripts.json`, expectations in `data/expected.json`) through the dry-run `/api/eval` route (no database row, email or CRM) and writes `docs/eval-results.md`.

## Known assumptions

- The Vaani webhook payload field names are parsed defensively (`lib/vaani.ts`) from the documented shape. Check the first real webhook in Vercel logs and adjust if a field differs.
- Free-tier limits: ~20 Gemini requests/day, Resend sandbox sends only to your signup email, inbound phone numbers on Vaani are paid.
