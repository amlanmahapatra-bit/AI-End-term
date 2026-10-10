# Eval results (dry run via /api/eval)

9/10 correct. Price leak check: no price in any output.

| Call | Expected | Got | Deciding reason | Result |
|---|---|---|---|---|
| T01 | qualified | qualified | Criterion 1-5 met: Real project, Pune location, realistic timeline, decision-maker present. | PASS |
| T02 | qualified + asked_pricing | ERROR The operation was aborted due to timeout |  | FAIL |
| T03 | not_fit | not_fit | Criterion 2: Nashik is outside Pune/PCMC service area. | PASS |
| T04 | not_fit | not_fit | Criterion 1: Caller is looking for advice and ideas only, not full design and execution. | PASS |
| T07 | not_fit | not_fit | Criterion 3: Project timeline is impossible for current availability. | PASS |
| T09 | complaint | complaint | Existing client reporting a service issue with an ongoing project. | PASS |
| T10 | not_fit | not_fit + asked_pricing | Criterion 4: Volunteered budget is clearly below the minimum cost for the described scope. | PASS |
| T11 | qualified | qualified | Criterion 1, 2, 3, 4, and 5 are met; project is a 2BHK in Baner with no structural changes. | PASS |
| T14 | qualified | qualified | Criterion 1, 2, 3, 4, and 5 are met or assumed. | PASS |
| T19 | not_fit | not_fit | Criterion 1: Restaurant projects are outside our scope of services. | PASS |
