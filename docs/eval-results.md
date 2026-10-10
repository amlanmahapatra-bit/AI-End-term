# Eval results (dry run via /api/eval)

10/10 correct. Price leak check: no price in any output.

| Call | Expected | Got | Deciding reason | Result |
|---|---|---|---|---|
| T01 | qualified | qualified | Passes all criteria: full 3BHK redesign and execution in Kothrud with realistic March timeline and decision-makers aligned. | PASS |
| T02 | qualified + asked_pricing | qualified + asked_pricing | Passes all criteria: full 2BHK redesign in Wakad with execution interest and feasible timeline. | PASS |
| T03 | not_fit | not_fit | Criterion 2: Nashik is outside Pune/PCMC | PASS |
| T04 | not_fit | not_fit | Criterion 1: Caller wants design advice and ideas only, with no execution. | PASS |
| T07 | not_fit | not_fit | Criterion 3: Project needed to be completed before Diwali (3 weeks away), which is under the 6-week minimum timeline. | PASS |
| T09 | complaint | complaint | Existing client with an active project escalating an unresponsive designer issue | PASS |
| T10 | not_fit | not_fit | Criterion 4: Volunteered budget of 1 to 1.5 lakh is clearly below the execution cost for this scope | PASS |
| T11 | qualified | qualified | Passes all five criteria: residential project with no structural changes in Baner (Pune) and landlord approval confirmed | PASS |
| T14 | qualified | qualified | Criterion 1 to 5 passed; Hadapsar is within service area and parents will attend consultation | PASS |
| T19 | not_fit | not_fit | Criterion 1: Restaurant and hospitality projects are outside our scope of services | PASS |
