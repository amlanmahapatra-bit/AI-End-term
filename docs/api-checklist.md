# API checklist

| # | Service | What it does | Where to get it | Vercel variable | Status |
|---|---|---|---|---|---|
| 1 | Gemini | Classifies calls (JSON mode) | aistudio.google.com, Get API key. Use model `gemini-3.8-flash`. Free tier has a small daily quota | `GEMINI_API_KEY`, `GEMINI_MODEL` | Set (quota hit during testing) |
| 2 | Supabase | Database | Project Settings, API Keys, Secret keys, copy `sb_secret_...` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | URL set; **secret key rejected, re-paste it** |
| 3 | Resend | Designer + caller emails and `.ics` invites | resend.com, API Keys, Create (Sending access) | `RESEND_API_KEY`, `EMAIL_FROM`, `FRONT_DESK_EMAIL` | **Confirm it is set** |
| 4 | Vaani AI | Voice agent + webhooks | app.vaanivoice.ai (invite code) | `VAANI_WEBHOOK_SECRET` (our own secret, goes in the webhook URL) | Agent + webhook created |
| 5 | HubSpot (optional) | Creates a deal per qualified lead | School account, Settings, Integrations, Private apps; scopes: contacts and deals read/write | `HUBSPOT_PRIVATE_APP_TOKEN` | Not set (skipped when empty) |
| 6 | Cal.com / Calendly (optional) | Fallback booking link in designer email | Copy your 30-minute event link | `CALCOM_BOOKING_URL` | Not set |
| 7 | Vercel | Hosting | Already deployed | `APP_URL`, `LINK_SECRET`, `DASHBOARD_PASSWORD`, `VAANI_RATE_INR_PER_MIN` | Deployed; **set APP_URL to the real URL** |

Notes
- Resend's sandbox sender (`onboarding@resend.dev`) only delivers to your own signup email. Caller invites will not reach real callers until you verify a domain in Resend, so for the demo use your own email as the "caller".
- Gemini free tier: roughly 20 requests/day. Each call costs one request, so avoid repeated tests.
