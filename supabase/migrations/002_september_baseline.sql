-- September 2026 baseline: the real phone enquiries (T01-T14 loaded; T15-T20 pending Gemini quota), classified by the same AI step.
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

insert into public.imported_enquiries
  (id, received_at, after_hours, duration_sec, classification, fit_reason, asked_pricing, handoff_note, transcript)
values
('T01', '2026-09-02T10:23:00+05:30', false, 252, 'qualified', 'Criterion 1 to 5 passed: full 3BHK redesign in Kothrud with realistic March timeline and aligned decision-makers', false, 'Priya, referred by past client Shruti Joshi
3BHK builder flat, 1,400 sq ft carpet
Dahanukar Colony, Kothrud, Pune
Full redesign of kitchen, living room, and bedrooms with execution
Needs completion by March, relaxed timeline
Priya and husband are owners and aligned to proceed
Budget not mentioned
Call back to schedule consultation', 'AGENT: Good morning, Aangan Studio.
USER: Hi, I’m Priya. I got your number from a friend — Shruti Joshi. She had her flat done by you in Aundh.
AGENT: Of course — thank you for calling. What are you looking to do?
USER: We have a 3BHK in Kothrud — Dahanukar Colony. We bought it two years ago and it still looks like the builder flat. We want to redo the whole thing — kitchen, living room, both bedrooms.
AGENT: That sounds like a complete redesign. How big is the apartment?
USER: About 1,400 sq ft carpet.
AGENT: And your timeline?
USER: We’d like to be done by March. We’re in no rush.
AGENT: Perfect. Are you the owner?
USER: Yes — myself and my husband. He knows we’re calling and is happy to go ahead.
AGENT: Lovely. Can I take your number and schedule a consultation?
USER: Sure. (gives number)'),
('T02', '2026-09-03T14:41:00+05:30', false, 308, 'qualified', 'Criterion 1 and Criterion 2 met: full 2BHK redesign in Wakad with complete execution scope.', true, 'Unnamed caller inquiring via Instagram
2BHK residential flat measuring 950 sq ft
Located in Wakad
Full redesign covering modular kitchen wardrobes living room and bedrooms
Design starting in October with move-in planned for November
Caller appears to be the decision-maker
No budget volunteered though caller asked repeatedly for pricing
Next step is to call back to fix consultation date and align on schedule', 'AGENT: Good afternoon, Aangan Studio.
USER: Hi. I was looking at your work on Instagram. I have a 2BHK in Wakad — can you tell me roughly how much something like that would cost?
AGENT: Our pricing depends on the materials and the scope — the best way to get a clear picture is a consultation with one of our designers, who can walk you through everything. What are you planning to do?
USER: Full redesign — modular kitchen, wardrobes, living room, both bedrooms. About 950 sq ft.
AGENT: Good scope. What’s your timeline?
USER: We move in November — so maybe starting design from October?
AGENT: That works well. Shall I set up a consultation?
USER: Yes, but can you give me a rough ballpark first? Even a range?
AGENT: I genuinely can’t — it varies quite a bit based on materials. Giving you a number without seeing the site would be misleading. The designer will go through all of that with you — the consultation is free and there’s no obligation.
USER: Okay, fair enough. Let’s book it.'),
('T03', '2026-09-03T16:15:00+05:30', false, 160, 'not_fit', 'Criterion 2: Nashik is outside Pune/PCMC', false, 'Caller: Suresh Patil
Space: Home office and study
Location: Nashik
Scope: Redo home office and study
Timeline: Not discussed
Decision-maker: Suresh Patil
Budget: None volunteered
Next step: Not a fit due to service area, no further human action needed', 'AGENT: Good afternoon, Aangan Studio.
USER: Hello, I saw your work on LinkedIn. My name is Suresh Patil. I’m in Nashik — would you be able to take on a project here? I want to redo my home office and study.
AGENT: Thank you for calling. We only work in Pune and PCMC at the moment — we don’t have the vendor network to take on projects outside Pune.
USER: Not even for a smaller project?
AGENT: Even for a smaller project, our execution depends on our contractors being on-site. I’m sorry we can’t help.
USER: Alright, understood. Thanks.'),
('T04', '2026-09-04T11:07:00+05:30', false, 202, 'not_fit', 'Criterion 1: Caller wants ideas and styling advice only, not full design and execution', false, 'Caller: Unidentified prospective client
Space: Living room, dimensions not provided
Location: Not mentioned
Scope: Styling ideas, colour suggestions, and layout advice only
Timeline: Exploring options for now, not executing immediately
Decision-maker: Not confirmed
Budget: None mentioned
Next step: Not a fit under Criterion 1; no designer action required', 'AGENT: Good morning, Aangan Studio.
USER: Hi — can someone come and give us some ideas for our living room? We’re not planning to do the full thing right now. Just want suggestions on colours, furniture arrangement, what to change.
AGENT: We’re a full-service studio — our projects include design and execution together. We don’t do advisory or consultation-only visits. If you’re planning a full redesign with execution, we’d be a great fit.
USER: Oh I see. No, we’re just exploring for now. Maybe later.
AGENT: Of course — feel free to call back when you’re ready to go ahead with a full project.'),
('T05', '2026-09-05T10:52:00+05:30', false, 404, 'qualified', 'Passes all five criteria: full home redesign in Koregaon Park within a viable 4-month timeline', false, 'Aarti Mehta (referred by Vikram Agarwal)
4BHK apartment, 2,400 sq ft carpet
Koregaon Park, Pune
Complete redesign of flooring, kitchen, and all 4 bedrooms
Move-in by February (approx 4 months), site already vacant
Decision-maker is caller Aarti Mehta
No budget mentioned by caller
Follow up to schedule site visit consultation early next week', 'AGENT: Good morning, Aangan Studio.
USER: Hi, this is Aarti Mehta. Vikram Agarwal asked me to call — he’s a close friend of Nikhil’s.
AGENT: Of course, thank you. What are you looking for?
USER: We have a 4BHK in Koregaon Park — about 2,400 sq ft carpet. Complete redesign. New flooring, kitchen, all four bedrooms. We’ve already moved out temporarily.
AGENT: That’s a significant project. Do you have a timeline?
USER: We want to move back in by February. About 4 months.
AGENT: That should work well. Would you prefer a site visit for the consultation?
USER: Yes please — Vikram said your team does that.
AGENT: Absolutely. Can I check your availability for early next week?'),
('T06', '2026-09-05T15:28:00+05:30', false, 301, 'qualified', 'Criteria 1-5: Full commercial office fitout in Baner within service area, realistic December timeline, and founder on call', false, 'Caller is a startup founder looking to fit out a new office.
Space is an 800 sq ft bare shell commercial property.
Site location is in Baner, Pune.
Scope covers end-to-end fitout with 20 workstations, cabin, meeting room, and break area.
Timeline requires the office to be operational by December.
Caller confirmed they are the founder and sole decision-maker.
No budget figure was volunteered during the call.
Recommended next step is to schedule an initial consultation.', 'AGENT: Good afternoon, Aangan Studio.
USER: Hi, I’m calling about a commercial project. We’re a startup — just got our first proper office space in Baner. About 800 sq ft. We need workstations for 20 people, a small cabin, a meeting room, and a break area.
AGENT: We do commercial fitouts up to about 3,000 sq ft. What’s the state of the space right now?
USER: Bare shell — just columns and floor. Nothing else.
AGENT: Full fitout from scratch. And the timeline?
USER: We want to be operational by December. Our team is working from home currently.
AGENT: December is doable. Are you the decision-maker for this?
USER: Yes, I’m the founder.
AGENT: Perfect. Let’s set up a consultation.'),
('T07', '2026-09-08T09:44:00+05:30', true, 195, 'not_fit', 'Criterion 3: Project completion requested before Diwali in 3 weeks, which is well under our minimum execution timeline.', false, 'Caller: Unidentified caller
Space: Living room and kitchen, size unspecified
Location: Not disclosed
Scope: Living room and kitchen redesign
Timeline: Wanted project completed before Diwali in 3 weeks
Decision-maker: Caller, authority unconfirmed
Budget: None stated by caller
Next step: Not fit due to timeline; no action needed unless caller calls back', 'AGENT: Good morning, Aangan Studio.
USER: Hello — I want to redo my living room and kitchen before Diwali. Can you take it up?
AGENT: Diwali is about three weeks away. Our design phase alone takes 3–4 weeks, and execution follows. We couldn’t do justice to a project in that time.
USER: Even just the living room?
AGENT: Even so — a room redesign with execution takes at least 8–10 weeks from start to finish. We wouldn’t want to rush it.
USER: What if I start after Diwali?
AGENT: A November start would work well. Shall I note your details for that?
USER: Let me think and call back.'),
('T08', '2026-09-09T22:47:00+05:30', true, 0, 'unclear', 'Missed call outside office hours; no conversation to classify', false, 'Missed call. No voicemail. Number associated with Nanded City area (Pune). Call-back
attempted following morning at 10:15am — no answer.', 'NOTE: Missed call. No voicemail. Number associated with Nanded City area (Pune). Call-back
NOTE: attempted following morning at 10:15am — no answer.'),
('T09', '2026-09-10T11:32:00+05:30', false, 352, 'complaint', 'Existing client reporting an unresponsive designer on an active project', false, 'Caller is existing client Sheetal Deshpande
Space is a 2BHK flat of unspecified size
Located in Viman Nagar
Ongoing interior project assigned to Aryan
In progress for three months with five days of no response
Caller Sheetal Deshpande is the decision-maker
No budget mentioned by caller
Escalate immediately for Nikhil or senior staff to call back within 15 minutes', 'AGENT: Good morning, Aangan Studio.
USER: I need to speak to someone right now. My project has been going for three months and my designer hasn’t replied in five days. This is not acceptable.
AGENT: I’m very sorry. Can I take your name and project details?
USER: Sheetal Deshpande. My designer is Aryan. Flat in Viman Nagar — 2BHK. I’ve sent three messages and called twice.
AGENT: Sheetal, I’m getting this to our project team right now. Would you prefer to hold for two minutes, or should I have someone senior call you back within 15 minutes?
USER: Callback. And I want it from Nikhil or a senior person — not just whoever picks up.
AGENT: Noted. I’ll make sure of that.
NOTE: Note: Existing project complaint. Escalated to studio head immediately.'),
('T10', '2026-09-11T14:04:00+05:30', false, 220, 'not_fit', 'Criterion 4: Volunteered budget is clearly below the threshold for the described scope.', false, 'Unnamed caller
1BHK apartment of 550 sq ft
Located in Kharadi
Kitchen and one bedroom redesign with full execution
Timeline not specified
Decision-maker not specified
Caller specified a maximum budget insufficient for project scope
Not a fit due to budget misalignment, no follow-up needed', 'AGENT: Good afternoon, Aangan Studio.
USER: Hi. I have a 1BHK in Kharadi — about 550 sq ft. I want to do the kitchen and one bedroom. My budget is 1 to 1.5 lakh maximum for everything. Is that possible with you?
AGENT: I appreciate you sharing that. For a kitchen redesign and a bedroom with full execution — materials, furniture, and contractor work — 1 to 1.5 lakh would be significantly below what a project of that scope would cost with us.
USER: Even for one bedroom?
AGENT: Even for one room. I wouldn’t want to bring you to a consultation if the numbers don’t align. I’d suggest checking with local contractors who work at that price point.
USER: Okay, thank you for being straight.'),
('T11', '2026-09-12T10:18:00+05:30', false, 382, 'qualified', 'Criterion 1 and 2: Rented 2BHK redesign in Baner with no structural changes meets scope and location criteria.', false, 'Caller: Tenant seeking design for rented flat
Space: 2BHK rented apartment, size not specified
Location: Baner, Pune
Scope: Non-structural redesign of living room, bedroom, kitchen
Timeline: Not specified, site currently occupied
Decision-maker: Caller authorised, landlord already approved
Budget: None volunteered by caller
Next step: Call to agree on consultation date and time', 'AGENT: Good morning, Aangan Studio.
USER: Hi — I have a question. I’m in a rented apartment. Can you still take up a project?
AGENT: It depends on the scope. What are you looking to do?
USER: It’s a 2BHK in Baner. I’ve been here a year, I have a 3-year lease, and the place is quite bare. I want to properly design the living room, bedroom, and kitchen — no structural changes, just design and fittings.
AGENT: That’s fine — we’ve done rented apartments before. For the kitchen we’d do a modular unit that can come out cleanly. The rest is largely flooring, lighting, and furniture — all reversible. Have you checked with your landlord?
USER: Yes — they’re fine with it as long as we don’t break walls.
AGENT: Perfect. No wall-breaking from us. Shall we set up a consultation?
USER: Yes please.'),
('T12', '2026-09-15T10:05:00+05:30', false, 450, 'qualified', 'Passes all five criteria: full end-to-end residential project in Kalyani Nagar, realistic move-in timeline for March next year, and owner on the call.', false, 'Caller is Anand Sharma.
New empty villa of 5,500 sq ft across ground plus two floors.
Located in Kalyani Nagar, Pune.
Scope is complete end-to-end design and execution.
Timeline is to move in by March next year.
Decision-maker is the caller himself.
No budget mentioned by caller.
Next step is to check calendar and revert by end of day to book site visit.', 'AGENT: Good morning, Aangan Studio.
USER: I’m calling about a villa project in Kalyani Nagar. My name is Anand Sharma. The property is about 5,500 sq ft — ground plus two floors. Full end-to-end design.
AGENT: That’s a significant project. Is this a new property or an existing home?
USER: New construction. Possession was last month. Completely empty.
AGENT: And your timeline?
USER: March next year to move in. No rush.
AGENT: Good time to start. Would you like our principal designer to come to site for the first consultation?
USER: Yes — this week or next if possible.
AGENT: Let me check the calendar and revert by end of day.'),
('T13', '2026-09-16T12:19:00+05:30', false, 368, 'qualified', 'Passes all criteria: full execution scope for a 3BHK flat in Aundh within Pune service area.', true, 'Caller: Name not provided
Space: 3BHK flat, 1,100 sq ft
Location: Aundh
Scope: Kitchen, wardrobes in two bedrooms, living room
Timeline: Not discussed on call
Decision-maker: Caller
Budget: None volunteered; repeatedly asked for ballpark pricing
Next step: Call back to schedule consultation slot', 'AGENT: Good afternoon, Aangan Studio.
USER: Hi — I want to redo my flat in Aundh. 3BHK, about 1,100 sq ft. What might it cost?
AGENT: Our pricing depends on the materials and scope — the designers go through that at the consultation. What are you planning?
USER: Kitchen, wardrobes in both bedrooms, living room. But seriously — can’t you give me even a rough range? I just want to know if we’re in the same ballpark.
AGENT: I really can’t give a number that would mean anything without seeing the site and the spec. The difference between a standard and a premium kitchen alone can be 3× the cost. The consultation is free — the designer will give you a proper number by the end of it.
USER: Fine. Let’s book then.
AGENT: Perfect. What days work for you?'),
('T14', '2026-09-17T11:41:00+05:30', false, 295, 'qualified', 'Criterion 2: Hadapsar is in Pune service area; Criterion 5: Parents are primary decision-makers and confirmed to attend consultation.', false, 'Caller inquiring on behalf of parents for new possession home.
Space is a 3BHK apartment, exact square footage not stated.
Located in Hadapsar, within Pune service area.
Scope is complete home interior design.
Timeline was not specified during the call.
Decision-makers are parents, confirmed to attend the consultation.
No budget was volunteered on the call.
Recommended next step is to follow up to schedule a consultation.', 'AGENT: Good morning, Aangan Studio.
USER: Hi — I wanted to inquire about an interior project for my parents. They have a 3BHK in Hadapsar — new possession. They want a proper design.
AGENT: That sounds good. Will your parents be involved in the decision?
USER: Yes — I’m doing the initial checking. They don’t really use phones much. I’ll tell them about the consultation and they’ll decide.
AGENT: Sure — just so we know: your parents would be at the consultation, right? Our designers like to understand the brief directly from the people who’ll live in the space.
USER: Yes, they would come. I’m just calling to see if it’s worth pursuing.
AGENT: Absolutely. Should I note your details and explain what the consultation involves?
USER: Please. (gives number)
NOTE: Note: Caller is son. Owners are parents; both will attend consultation. Decision with parents.')
on conflict (id) do nothing;
