# Standing orders for the assistant

Written 22 September 2026 at the owner's request — *"Escreve este processo
todo e as regras que te dei num documento para que o sigas sempre e não te
esqueceres"* — before a week away. This is the process the assistant
follows and the rules the owner has given, in one place. It is read at the
start of every session and is the authority over the assistant's memory
notes where they differ.

## 1. What the project is, in the owner's words

- **A demo to show the platform**, to win funding. *"I'm not going to review
  anything yet... for now we are building a demo to show the platform and
  if I get funding we'll worry about building the contribution and review
  part."* Review, contribution, the `CONTRIBUTION_PAT` secret and record
  standing are not on any list until the owner reopens them.
- **A world atlas.** *"We want the whole world, Africa, Asia, South
  America."* *"The goal is to have chains throughout the globe and time"*,
  from 1492 onward.
- **Real events only.** *"Do not use synthetic events, go on Wikipedia and
  complete with real events all over the world."* The sources are Wikipedia
  and Wikidata; confidence `probable`; `consensus` only through a work
  Wikipedia itself cites.
- **Not accuracy, a demo.** *"No need to wait for me, we are not looking for
  accuracy but instead to have a demo."* What a run can settle from a cited
  source, it settles. Nothing is assigned to a person.

## 2. The rules that never bend

- **No AI-written historical claim** outside the dated exception in
  `CLAUDE.md`; **no invented date**. A span may be read from the record's
  own cited article at a named revision (A7); a place from Wikidata's own
  coordinates (A9); a summary from the Wikipedia lead at a revision. If the
  source does not state it, the record stays without it.
- **The resting picture is the main events** (M65): at rest every view
  draws the events that are part of nothing. Choosing an event narrows the
  three views to it and its children. A period historians name is an
  umbrella (A6), an event may have several (M79, A8), and **the main count
  must not rise** with volume.
- **No new hex value, token or type size**; no runtime dependency, no build
  step, no map library, no database (`CLAUDE.md`).
- **Tests before the behaviour they judge** (711, 717); **records first,
  rebuild, then commit the index** (798); `validate --index` clean; no test
  pins a count or a pixel; the check is honest (M63) and its waits are the
  thing they assert (M78).
- **`delete_branch_on_merge` stays false** and is checked before every
  merge; `m0` must survive every merge.

## 3. The lanes, and who pushes where

- **Lane A, display**, one milestone at a time on its own branch `mNN`,
  gated on its predecessor's done line on `m0` and its brief on `m0`. The
  queue is written in `STATUS.md`'s "Next" and in the assistant's memory.
- **Lane B, records**: **M42** (Africa and Asia, and the daily curation
  fire) on `m42`; **M42b** (the Americas, and Europe before 1900) on `m42b`.
  Both under `docs/m42-brief.md` and its amendments, which override the
  body where they differ and are read last. **No ceiling**: they run until
  the owner writes a done condition.
- **Lane runs never push to `m0` or `main`.** The assistant lands branches
  into `m0` with `land.sh` (`--snapshot` for a records branch mid-milestone),
  opens the pull request to `main`, waits for the check, merges. **When the
  assistant has not landed for six hours, the landing routine does it**
  (run protocol, 22 September amendment).
- **Every routine is hourly, idempotent and gated**: it stops at once if
  its milestone's done line is on `m0` or its branch, if its predecessor is
  not merged, or if its brief is not on `m0`. A killed run (credits, rate
  limit) is resumed by the next fire under the claim rule (skip if the
  claim is under five hours old and the last push under ninety minutes or
  the claim under sixty). **The assistant disables a routine when its
  milestone lands** and fires one by hand when a run has been silent past
  the claim rule.
- **Every amendment to M42's brief is also written into the routine's
  prompt** (the whole `job_config.ccr`), because a run follows the prompt's
  list of amendments and once ignored one the brief alone carried.

## 4. The week's process (22 to 29 September 2026)

Every supervision tick, roughly every thirty minutes while this machine is
on:

1. Read the monitor and the waiters; re-arm the monitor (`watch2.sh`).
2. Land any lane A branch whose done line is on it; open its PR; merge on
   green; deploy; disable its routine; fire the next lane A milestone.
3. **Land a snapshot of `m42` and of `m42b` into `m0` at least once a day**
   and publish it, so the site keeps growing whatever its size. The day's
   snapshot carries the **daily curation fire** (A11, A13): the first M42
   fire after 02:00Z reviews every active event and the relations between
   them from their cited sources, and imports nothing.
4. Re-fire a records routine whose run is silent past the claim rule.
5. Re-run a check that fell to a browser launch failure or a flake; read a
   red check before assuming load.
6. Keep `STATUS.md`, this document and the memory notes current.

The lane A queue for the week: M80 (a connection selectable, marks by
precision, the count wording) → M81 (the graph stretches time) → **a
review run with fresh eyes** over the code and the live site, producing a
numbered findings file (`docs/review-2026-09-22.md`, done 22 September) →
M82 (the first screen) → M83 (the graph under a lens, the review's display
bugs, first paint; landed 22 September evening, PR #21) → **M84 (the
owner's feedback document, `docs/feedback-2026-09-22.md`: a cross closes a
card; the ring in a distinct colour; landed 22 September, PR #22)** → M85
(`docs/m85-brief.md`: the first review's remainder; landed 22 September
night, PR #23, all nine sections done) → the second Fable review, done
24 September (`docs/review-2026-09-24.md`: part A reader, B display, C
records, with a fix plan) → M86 (what a funder meets first; landed 24
September morning, PR #26, all nine sections done) → M87 (what breaks at
3,000 events; landed 24 September midday, PR #28, all twelve sections
done) → **a third Fable review on 26 September** over the live site, the
code and the records as they stand then (three independent subagents as
before; `docs/review-2026-09-26.md` with a fix plan) → its fixes as M88
onward, landed before the owner returns on 29 September. Lane A is idle
between M87's landing and that review; lane B keeps growing the corpus
with a snapshot landed every day after the 02:00Z curation fire. Lane B runs amendment A14 (the review's data passes) before any
further import.

**25 September, evening (added by the assistant).** The third review ran
a day early, on the evening of 25 September, over `m0` at 12ecb81f and the
live site at snapshot 11 (`docs/review-2026-09-26.md`). Its display
findings are **M88** (`docs/m88-brief.md`, thirteen sections, routine
`trig_01HDQbv9FhZZThmhjdwTRuej`, cron :13, gated on M87 done, fired 17:50Z);
its records findings are **amendment A15** on M42's brief, in force for both
lanes, with M42b's "Europe before 1900" clause paused until Africa and Asia
each hold A10's 303 active events. Part A's findings, if any need code, are
M89, gated on M88 done. Lane A then: land M88, M89, and keep the snapshots
daily until the owner returns.

**1 October, 08:00 Lisbon (added by the assistant).** The owner, back on 30
September, said "Stop at 8am": the assistant's supervision loop stopped at
07:00Z on 1 October. Between 25 September and 30 September the landing
fallback routine (`trig_0136jn2YgnxH85MJ9BRBP9Nr`, cron :50, still enabled)
landed M88 (PR #33), M89 (PR #34) and the daily snapshots up to PR #38; the
assistant landed the 1 October curation snapshot (PR #39) because the
routine skipped it. Left running: M42, M42b and the landing fallback.
Disabled: every lane A routine up to M89. The corpus at the stop: 1,614
event records, 1,374 active, 1,193 edges, 799 places; curation fires on
22, 23, 24, 25, 29, 30 September and 1 October. What waits for the owner is
§6, questions 1 to 12; the third review is `docs/review-2026-09-26.md`.
The protocol for restarting the loop is §4 above and the memory notes.

**Two lessons from 22 September's landings**, for every brief from here:
a test of a display property over the live corpus derives its expectation
from the corpus it runs on and never assumes the corpus of the day happens
to exhibit it (M83's merged-lines test was true at 581 events and false at
668); and the landing script's every `$(... | grep ...)` assignment carries
`|| true`, because an empty match stopped it silently under `set -e`.

**Reviews and coordination are always on Fable.** The owner, 22 September:
*"for the code reviews and coordination always use Fable, even if changes
and coding are made with another model."* The assistant (Fable 5.1)
coordinates; every review — of code, of the live site, of a milestone
before it lands — is run by Fable, as independent subagents of this
session or as a cloud routine whose model is `claude-fable-5-1`, never by
the model that wrote the change. The build routines stay on Opus 5. **Display fixes and structural
improvements from the reviews are briefed and landed without asking.**
Anything that changes what the atlas says about history beyond reading a
cited source, or a new rule about what counts as an event or a parent,
waits for the owner.

Lane B for the week: A9's place pass; A10's lane balance; A11's daily
curation fire, whose first run writes every polity's description (area,
population, geopolitical context from cited sources); batches from the
trailing lanes and centuries; M42b in parallel.

## 5. The owner's instructions this cycle, verbatim, and where each lives

| said | lives in |
| --- | --- |
| "The dates two-handled band should not be hidden" | M75 |
| "If I select portugal, the map timeline... should show only those events" | M76 |
| "Picking up the dates exactly is unnecessary... This can be removed" | M76 |
| "The graph can always show all dates, then one can zoom in and out and pan" | M76 |
| "It looks clouded and there are too many labels on top" | M77 |
| "The timeline has too many events... only parent and main events and the title" | M77, A6 |
| "The grouping function is useless, let's simplify the platform and remove it" | M77 |
| "I agree" (a run may widen an interval from the cited article) | A7 |
| "Can't we have many umbrellas for the same event?" | M79, A8 |
| "I still only see 252 events" (the count says what it counts) | M80 |
| "It should show children events on the map in case they have a place" | A9, M80 |
| "I should be able to select a connection the same way I select an event" | M80 |
| "The platform has mostly events related to Europe. We want the whole world" | A10, M42b |
| "On the graph it should expand more horizontally when I zoom in" | M81 |
| "The curation should be, every now and then, fired to analyze all events globally" | A11 |
| "Each country should have a short description mentioning approximate area, population and... geopolitical situation" | A11 |
| "The site must keep growing until I get back, no matter how many events it has already" | A11, §4 |
| "Run as many things in parallel as feasible" | M42b, §3 |
| "Credits might end every now and then, so you should have a process that will later resume work" | §3, the landing routine |
| "This machine will stay on" | §4 |
| "No ceiling" | A11 |
| "For the code reviews and coordination always use Fable, even if changes and coding are made with another model" | §4 |

## 6. What the assistant asks the owner for feedback on, when they return

The owner writes a feedback document after the current improvements land
(M80, M81, A9, A10, the first curation fire). The assistant's questions:

1. Opening an umbrella on the timeline, the map and the graph: is what
   appears what you expected, and is the way back obvious?
2. The graph with a narrative open, and with an event opened, after M81:
   readable, or still crowded, and where?
3. The band on the map: does dragging it feel like the control you asked
   for, and is the profile useful?
4. A connection's card (M80): is what it shows enough to judge the link?
5. The country descriptions: right length, right facts, right tone?
6. The balance of the world after a week of A10 and M42b: which region or
   century still feels empty?
7. Anything the atlas says that you know to be wrong, with the record's
   id, so the rule that let it in can be found.
8. Since M85 the atlas opens at rest on the whole span, 1492 to the present,
   main events only (the review's finding A4). Is that the first picture
   you want, or the densest century as before?
9. From the 24 September review, part C (each is a rule about what counts,
   so it waits for you): may an event whose item names several countries
   be placed at all (C1)? May a war cause its own battle, and is an
   umbrella one by flag or by having children (C3)? Does a background
   section's mention of an earlier event make a `precondition-of` (C4)?
   Is a partial participant list with a note acceptable, and what is the
   role for a revolution's participants (C7)? Does `parent` satisfy the
   bar of §1, a record earning its place by an edge (C8)? Should the
   Wikipedia cache hold article bodies (C5)?
10. Part A's finding 3: the corpus and the front card still read as
   Portugal in the twentieth century. One non-Portuguese "Start here"
   account is a narrative record and waits for you; which chain would you
   like it to tell?
11. From the 25 September review, part C (asked a fourth time because the
   graph is the second click): 314 active events touch no edge and every
   chain outside the main component is a single war held out by the parent
   rule. One line would settle most of it: *a war may carry an edge to its
   own opening engagement, and an engagement to the next, where the article
   states it; `parent` alone does not earn a record its place.* Also: may a
   partial participant list stand with a note (C11, the 24 September C7,
   853 events name no actor); does the `europe` lane hold Russian Asia
   (deviation 1423, the Romanov record); and the 24 September C1 and C4
   still stand. A15's passes run without you; these do not.
12. From the 25 September review, part A: the tagline says "every event
   linked" and the umbrellas a funder opens first (Scramble for Africa,
   Decolonisation of Africa, Arab Spring) have no link of their own — may
   an umbrella carry the links its parts carry, or may the fire write the
   umbrella's own cited edges (A3)? An actor's lens on Japan shows the
   Winter War because it holds World War II and its parts — should the
   lens show only the events that name the actor (A10)? And which chain
   should the non-Portuguese "Start here" account tell (A4)?

## 7. The planner and the writers (12 October 2026)

The owner paused every cloud routine on 2 October at 19:52Z ("Pausa tudo o
que esteja a correr na cloud imediatamente") and on 12 October resumed the
records lane with a new shape: *"could we have opus deciding which events to
add and how to connect them, and sonnet to write the events?"* The assistant
landed the rest of 2 October's batches (PR #43, snapshot 16: 1,873 records,
1,654 active) and wrote `docs/m90-brief.md`, `docs/m90-rules.md` and the
12 October amendment of `docs/run-protocol.md`. M90 builds the queue schema,
`tools/queue/apply.mjs` and `tools/queue/state.mjs` on branch `m90` (Opus
builds; the assistant reviews on Fable and lands). When M90 lands, the
assistant creates the planner (Opus, daily 03:10Z, branch `plan`) and the two
writers (Sonnet, hourly, `m42` and `m42b`) from the brief's §7 and §8, and
lands the three branches daily. M42, M42b and the landing fallback stay
disabled. The owner named no budget; the assistant set the planner's queue at
about fifty items a day and the writers to stop when the queue is empty, so
the spend is bounded by the queue. The owner's open questions in §6 stand.

13. From the planner's first day (12 October, `docs/plans/2026-10-12*.md`):
    the honest yield of the bar is one to four percent of the sentences read,
    and three rules decide most of what is refused. (a) C8 again: a war may
    not carry an edge to its own opening engagement, nor an engagement to the
    war it opened (Operation Searchlight "ultimately led to the Bangladesh
    Liberation War" is queued with no parent so as not to be its own
    parent's child). (b) The arrow of time compares the two ends' starts, so a
    stated cause of a change *inside* an ongoing event (the fall of Kabul in
    2021 and the insurgency in Khyber Pakhtunkhwa, 2004 onward) is refused;
    nine refusals in one fire. May an edge point into an event that began
    earlier, where the article states it? (c) Two Imjin War dates disagree by
    calendar (`battle-of-chungju` 1592-04-28 against `battle-of-sangju-1592`
    1592-06-03) and `operation-sutton` (1982-05-23) sits after
    `battle-of-san-carlos` (from 1982-05-21): the records, not the rule.

## 8. 13 October: the parent-to-child rule removed

The owner, told that the planner's first day refused its clearest sentences
under A14 (question 13a): *"Ok let's remove the parent to child rule for
now."* Applied the same hour: `tools/queue/queue.mjs` writes such edges,
the test that pinned the refusal now asserts the write, rules card 11 and
M42's amendment A16 record the decision, and the planner's prompt no longer
applies the rule. Question 13b (the arrow of time into an ongoing event) and
13c (two dates) stand.

## 9. 13 October: importance first, the bar withdrawn

The owner, the same evening: *"Right now the priority is to add most events
of historical significance since around 1500, even if for now there is no
parent or child for it. Just add all events that are relevant and connect
them when you can. Start by adding the main and most important historical
event and then progress to adding events that are not as important or that
are children of the main events."* Applied as A17 (`docs/m42-brief.md`),
rules card 7, 12 and 13, M91 (the queue may carry an item with no edge; the
writer imports it; duplicates are caught by title too), and the planner's
prompt: it ranks by Wikipedia's vital-article levels and lists, then by the
children of held main events, lanes as the tiebreak. The owner also has
cloud credits to spend (*"I also have cloud credit sessions that you are
free to use"*): the planner fires four times a day and the writers take ten
items a fire.
