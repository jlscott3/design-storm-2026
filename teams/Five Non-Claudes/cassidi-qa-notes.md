# Q&A panel with Cassidi — notes

Notes from the Q&A panel with Cassidi Rosenkrance (Denver Water) on 2026-09-24,
with one point from Jake, plus a later follow-up with Jake and Cassidi on
alkalinity, TOC, and dosing. These are our notes, not a transcript or anything
Denver Water wrote. Where a note is ambiguous, it says so rather than guessing
what was meant.

## The problem, in her words

- **The biggest problem is no visualization.** They have the data and can
  interpolate it, but they can't *see* it. They want to explain different
  conditions across the organization.
- **They have past and current data; they want future predictions.**
- **They need help making decisions.** Not more data: support for choosing what
  to do.

## Water rights are the #1 issue

- Water rights are the top issue. Denver Water has to provide water downstream
  of Denver.
- Water Quantity uses barometric data to answer "what water might we see this
  year?", but not at any finer grain than the year.
- **Public perception is part of the problem.** People complain about being
  under water restrictions while parks are watering, or while Denver Water is
  flushing hydrants. Flushing is needed so water quality doesn't go down, but
  from the street it looks like waste.

## Three personas

| # | Who | What they care about |
|---|---|---|
| 1 | **Water Quantity / Water Rights** (about 50 people) | How much water there will be, and meeting rights obligations |
| 2 | **Water Quality team** | Regulations |
| 3 | **Treatment plants** | Treating efficiently and at low cost. Chemicals are expensive. |

## The 2023 storm

In 2023 a 100-year storm hit the South Platte. Turbidity rose so sharply the
plant almost had to shut down. The sediment clogged the filters; they ended up
treating with chemicals, but the filters were already clogged.

Our takeaway, not something she said: by the time turbidity reaches the plant, it is too late to
react. Warning ahead of arrival is what would have helped.

## Facts about the system and data

- **All sensors have lat/long** for their location.
- **Jake: there are 4 gates up through the reservoir.** Unclear from our notes
  which reservoir, and whether these are intake gates at different depths or
  something else. Ask before building on it.

## Alkalinity, TOC, and the alum dose (follow-up with Jake and Cassidi)

- **The alkalinity sweet spot is 50 to 80** (units not stated; Denver Water's data
  reports alkalinity in mg/L).
- **The state mandates how much TOC must be removed, based on alkalinity**, and
  the requirement changes at **60**. This answers the question in
  the below-60 classifier section of [`guide.md`](../../guide.md): 60 is a
  regulatory line, not just a round number.
- **Why alkalinity matters:** the coagulant chemicals that form floc are acidic.
  If alkalinity is too low, the water can't buffer them, pH drops out of the
  range where floc works, and they can't trap TOC.
- **There's a "happy range" of pH for floc to work.**
- **Above 60 is a tradeoff:** they are required to remove less TOC, but then
  they're fighting alkalinity. (Our reading: more buffering means more acid, or
  more coagulant, to bring the pH down into the floc range.)
- **Today's tool is an Excel sheet.** Operators plug in the incoming TOC and it
  gives a target coagulant dose. Example given: 3 mg of TOC coming in targets
  about **11 of aluminum sulfate (alum)**. Our notes say "11 g"; a dose would
  normally be in mg/L, so treat the unit as unconfirmed.
- **What they want: something plug-and-play**, which we read as: give it the
  predicted incoming TOC and alkalinity, get a dose recommendation. That reading
  is ours; confirm it.

**General knowledge, not from Jake or Cassidi; check it against
`reference/DBP-PRE and DBP Rule Training Slides_DDD conference.pdf`:** the rule
this sounds like is the EPA Stage 1 Disinfectants/Disinfection Byproducts Rule's
*enhanced coagulation* requirement, which Colorado enforces. It sets the required
percent TOC removal from a table of source-water TOC against source-water
alkalinity, with alkalinity bands of 0–60, >60–120, and >120 mg/L as CaCO3. Higher
alkalinity means a lower required percentage. We have not verified the exact
percentages here, so don't put numbers from it into prompts until someone reads
the slides.

## Open questions to follow up on

- Is the alum example 11 mg/L? Is it per 3 mg/L of TOC at a particular
  alkalinity, or does the Excel sheet take alkalinity as an input too?
- Could we get a copy of the Excel sheet (or its formula)? It is the thing a
  plug-and-play tool would replace or wrap.
- What is the "happy range" of pH for floc at Foothills?
- Which reservoir has the 4 gates, and what are they (depth-selective intakes)?
- What does "barometric" mean for Water Quantity's forecast: barometric pressure,
  or another measure recorded under that name?
- Which downstream obligations drive the water rights problem, and on what
  timescale do they bind?
