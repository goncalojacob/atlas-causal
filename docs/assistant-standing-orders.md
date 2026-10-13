# Standing orders for the assistant

The assistant wrote this document on 22 September 2026, before the owner
went away for a week. The owner asked for it: *"Escreve este processo
todo e as regras que te dei num documento para que o sigas sempre e não te
esqueceres"*. It holds the process the assistant follows and the rules the
owner has given. The assistant reads it at the start of every session. Where
it differs from the assistant's memory notes, this document wins.

## 1. What the project is, in the owner's words

- **A demo to win funding.** *"I'm not going to review
  anything yet... for now we are building a demo to show the platform and
  if I get funding we'll worry about building the contribution and review
  part."* Review, contribution, the `CONTRIBUTION_PAT` secret and the
  standing of records are on no list until the owner reopens them.
- **A world atlas.** *"We want the whole world, Africa, Asia, South
  America."* *"The goal is to have chains throughout the globe and time"*,
  from 1492 onward.
- **Real events only.** *"Do not use synthetic events, go on Wikipedia and
  complete with real events all over the world."* The sources are Wikipedia
  and Wikidata. Confidence is `probable`. It is `consensus` only through a
  work that Wikipedia itself cites.
- **A demo, and accuracy can wait.** *"No need to wait for me, we are not
  looking for accuracy but instead to have a demo."* A run settles whatever
  it can settle from a cited source. The assistant assigns nothing to a
  person.

## 2. The rules with no exceptions

- **No AI-written historical claim** outside the dated exception in
  `CLAUDE.md`, and **no invented date**. A run may read a span from the
  record's own cited article at a named revision (A7), a place from
  Wikidata's own coordinates (A9) and a summary from the Wikipedia lead at a
  revision. If the source does not state a fact, the record goes without it.
- **With nothing selected, the views show the main events** (M65, choosing
  an event narrows the views). Every view draws the events that are part of
  nothing. Choosing an event narrows the three views to it and its children.
  A period that historians name is an umbrella (A6), and an event may sit
  under several (M79, A8). **The count of main events must not rise** as the
  corpus grows.
- **No new hex value, token or type size.** No runtime dependency, build
  step, map library or database (`CLAUDE.md`).
- **Tests come before the behaviour they judge** (711, 717). **Records
  first, then the rebuild, then the index commit** (798). `validate --index`
  is clean. No test pins a count or a pixel. The check reports what it finds
  (M63), and each of its waits is the thing it asserts (M78).
- **`delete_branch_on_merge` stays false.** The assistant checks it before
  every merge. `m0` must survive every merge.

## 3. The lanes and where each pushes

- **Lane A is the display.** It runs one milestone at a time, each on its
  own branch `mNN`. A milestone starts only when the milestone before it has
  its done line (`MNN done`) on `m0` and its own brief is on `m0`. The order
  of milestones is in the "Next" section of `STATUS.md` and in the
  assistant's memory.
- **Lane B is the records.** **M42** (Africa and Asia, and the daily
  curation fire) runs on `m42`. **M42b** (the Americas, and Europe before
  1900) runs on `m42b`. Both follow `docs/m42-brief.md` and its amendments.
  The amendments override the body where they differ, and a run reads them
  last. **There is no ceiling.** Both lanes run until the owner writes a done
  condition.
- **A lane's runs never push to `m0` or `main`.** The assistant lands
  branches into `m0` with `land.sh` (`--snapshot` for a records branch in the
  middle of its milestone). It then opens the pull request to `main`, waits
  for the check and merges. **When the assistant has not landed for six
  hours, the landing routine lands instead** (run protocol, 22 September
  amendment).
- **Every routine fires hourly, can safely repeat, and checks its gate
  first.** It stops at once in three cases: its milestone's done line is on
  `m0` or on its branch, the milestone before it has not merged, or its brief
  is not on `m0`. When credits or a rate limit kill a run, the next fire
  resumes it under the claim rule. The next fire skips if the claim is under
  five hours old and either the last push is under ninety minutes old or the
  claim is under sixty minutes old. **The assistant disables a routine when
  its milestone lands.** It fires a routine by hand when a run has been
  silent for longer than the claim rule allows.
- **The assistant writes every amendment to the M42 brief into the
  routine's prompt as well** (the whole `job_config.ccr`). A run follows the
  list of amendments in its prompt, and one run once ignored an amendment
  that only the brief carried.

## 4. The process for the week of 22 to 29 September 2026

The assistant runs a supervision tick about every thirty minutes while this
machine is on. Each tick:

1. Read the monitor and the waiters. Re-arm the monitor (`watch2.sh`).
2. Land any lane A branch that carries its done line. Open its PR, merge
   when the check passes, deploy, disable its routine and fire the next
   lane A milestone.
3. **Land a snapshot of `m42` and of `m42b` into `m0` at least once a day**
   and publish it, so the site keeps growing whatever its size. The day's
   snapshot carries the **daily curation fire** (A11, A13). The first M42
   fire after 02:00Z reviews every active event and the relations between
   them from their cited sources, and imports nothing.
4. Fire again a records routine whose run has been silent for longer than
   the claim rule allows.
5. Run again a check that failed because a browser did not launch or a test
   flaked. Read a failed check before assuming the machine was under load.
6. Keep `STATUS.md`, this document and the memory notes current.

The lane A order for the week:

1. M80 (a connection can be selected, marks by precision, the wording of the
   count).
2. M81 (the graph stretches time when it zooms).
3. **A review run with fresh eyes** over the code and the live site. It
   wrote a numbered findings file (`docs/review-2026-09-22.md`, done
   22 September).
4. M82 (the first screen).
5. M83 (the graph under a lens, the display bugs the review found, first
   paint). Landed on the evening of 22 September, PR #21.
6. **M84 (the owner's feedback document, `docs/feedback-2026-09-22.md`: a
   cross closes a card, the ring in its own colour). Landed 22 September,
   PR #22.**
7. M85 (`docs/m85-brief.md`, the rest of the first review). Landed on the
   night of 22 September, PR #23, all nine sections done.
8. The second Fable review, done 24 September (`docs/review-2026-09-24.md`:
   part A the reader, B the display, C the records, with a fix plan).
9. M86 (what a funder meets first). Landed on the morning of 24 September,
   PR #26, all nine sections done.
10. M87 (what breaks at 3,000 events). Landed at midday on 24 September,
    PR #28, all twelve sections done.
11. **A third Fable review on 26 September** over the live site, the code
    and the records as they stand then. Three independent subagents run it
    as before. It writes `docs/review-2026-09-26.md` with a fix plan.
12. Its fixes as M88 onward, landed before the owner returns on
    29 September.

Lane A is idle between M87's landing and that review. Lane B keeps growing
the corpus and lands a snapshot every day after the 02:00Z curation fire.
Lane B runs amendment A14 (the second review's data passes) before any
further import.

**25 September, evening (added by the assistant).** The third review ran a
day early, on the evening of 25 September. It read `m0` at 12ecb81f and the
live site at snapshot 11 (`docs/review-2026-09-26.md`). Its display findings
are **M88** (`docs/m88-brief.md`, thirteen sections, routine
`trig_01HDQbv9FhZZThmhjdwTRuej`, cron :13, gated on M87 done, fired 17:50Z).
Its records findings are **amendment A15** to the M42 brief, in force for
both lanes. M42b's "Europe before 1900" clause is paused until Africa and
Asia each hold A10's 303 active events. Any part A findings that need code
are M89, gated on M88 done. Lane A then lands M88 and M89 and keeps the
snapshots daily until the owner returns.

**1 October, 08:00 Lisbon (added by the assistant).** The owner came back on
30 September and said "Stop at 8am". The assistant's supervision loop
stopped at 07:00Z on 1 October. Between 25 and 30 September the landing
fallback routine (`trig_0136jn2YgnxH85MJ9BRBP9Nr`, cron :50, still enabled)
landed M88 (PR #33), M89 (PR #34) and the daily snapshots up to PR #38. The
assistant landed the 1 October curation snapshot (PR #39) because the
routine skipped it. Still running: M42, M42b and the landing fallback.
Disabled: every lane A routine up to M89. The corpus at the stop: 1,614
event records, 1,374 active, 1,193 edges, 799 places. Curation fires ran on
22, 23, 24, 25, 29 and 30 September and 1 October. Questions 1 to 12 of §6
wait for the owner. The third review is `docs/review-2026-09-26.md`. To
restart the loop, follow §4 above and the memory notes.

**Two lessons from the landings of 22 September**, for every brief from
here:

- A test of a display property over the live corpus derives its expectation
  from the corpus it runs on. It never assumes that the day's corpus shows
  the property. M83's test of merged lines was true at 581 events and false
  at 668.
- Every `$(... | grep ...)` assignment in the landing script carries
  `|| true`. An empty match stopped the script without a message under
  `set -e`.

**Reviews and coordination always run on Fable.** The owner, 22 September:
*"for the code reviews and coordination always use Fable, even if changes
and coding are made with another model."* The assistant (Fable 5.1)
coordinates. Fable runs every review, of code, of the live site and of a
milestone before it lands. It runs as independent subagents of this session
or as a cloud routine whose model is `claude-fable-5-1`. The model that
wrote a change never reviews it. The build routines stay on Opus 5. **The
assistant briefs and lands the display fixes and structural improvements
from the reviews without asking.** The owner decides two kinds of change: a
change to what the atlas says about history beyond reading a cited source,
and a new rule about what counts as an event or a parent.

Lane B for the week:

- A9's place pass.
- A10's balance between lanes.
- A11's daily curation fire. Its first run writes every polity's
  description (area, population and geopolitical context from cited
  sources).
- Batches from the lanes and centuries with the fewest records.
- M42b at the same time.

## 5. The owner's instructions this cycle, verbatim, and where each lives

- "The dates two-handled band should not be hidden": M75.
- "If I select portugal, the map timeline... should show only those events":
  M76.
- "Picking up the dates exactly is unnecessary... This can be removed": M76.
- "The graph can always show all dates, then one can zoom in and out and
  pan": M76.
- "It looks clouded and there are too many labels on top": M77.
- "The timeline has too many events... only parent and main events and the
  title": M77, A6.
- "The grouping function is useless, let's simplify the platform and remove
  it": M77.
- "I agree" (a run may widen an interval from the cited article): A7.
- "Can't we have many umbrellas for the same event?": M79, A8.
- "I still only see 252 events" (the count says what it counts): M80.
- "It should show children events on the map in case they have a place":
  A9, M80.
- "I should be able to select a connection the same way I select an event":
  M80.
- "The platform has mostly events related to Europe. We want the whole
  world": A10, M42b.
- "On the graph it should expand more horizontally when I zoom in": M81.
- "The curation should be, every now and then, fired to analyze all events
  globally": A11.
- "Each country should have a short description mentioning approximate
  area, population and... geopolitical situation": A11.
- "The site must keep growing until I get back, no matter how many events it
  has already": A11, §4.
- "Run as many things in parallel as feasible": M42b, §3.
- "Credits might end every now and then, so you should have a process that
  will later resume work": §3, the landing routine.
- "This machine will stay on": §4.
- "No ceiling": A11.
- "For the code reviews and coordination always use Fable, even if changes
  and coding are made with another model": §4.

## 6. The questions the assistant asks the owner on their return

The owner writes a feedback document after the current improvements land
(M80, M81, A9, A10, the first curation fire). The assistant's questions:

1. When you open an umbrella on the timeline, the map and the graph, does
   what appears match what you expected? Is the way back obvious?
2. Is the graph readable after M81 with a narrative open, and with an event
   opened? If it is still crowded, where?
3. Does dragging the band on the map feel like the control you asked for?
   Is the profile useful?
4. Does a connection's card (M80) show enough to judge the link?
5. Are the country descriptions the right length, with the right facts and
   the right tone?
6. After a week of A10 and M42b, which region or century still feels empty?
7. Is there anything the atlas says that you know to be wrong? Please give
   the record's id, so the assistant can find the rule that let it in.
8. Since M85 the atlas opens with nothing selected on the whole span, 1492
   to the present, with main events only (the review's finding A4). Is that
   the first picture you want, or do you want the densest century as before?
9. These come from part C of the 24 September review. Each is a rule about
   what counts, so each waits for you:
   - May the import place an event whose item names several countries
     (C1)?
   - May a war cause its own battle? Is an umbrella one by its flag or by
     having children (C3)?
   - Does a mention of an earlier event in a background section make a
     `precondition-of` (C4)?
   - Is a partial list of participants with a note acceptable? What is the
     role of a revolution's participants (C7)?
   - Does `parent` meet the rule of §1 that a record earns its place by an
     edge (C8)?
   - Should the Wikipedia cache hold the bodies of articles (C5)?
10. Part A's finding 3: the corpus and the front card still read as
    Portugal in the twentieth century. One "Start here" account outside
    Portugal is a narrative record and waits for you. Which chain would you
    like it to tell?
11. From part C of the 25 September review. This is the fourth time the
    assistant asks, because the graph is the second thing a reader clicks.
    314 active events touch no edge. Every chain outside the main component
    is a single war that the parent rule keeps apart. One line would settle
    most of it: *a war may carry an edge to its own opening engagement, and
    an engagement to the next, where the article states it. `parent` alone
    does not earn a record its place.* The other questions:
    - May a partial list of participants stand with a note (C11, the
      24 September C7)? 853 events name no actor.
    - Does the `europe` lane hold Russian Asia (deviation 1423, the Romanov
      record)?
    - The 24 September C1 and C4 still stand.

    A15's passes run without you. These questions do not.
12. From part A of the 25 September review:
    - The tagline says "every event linked", yet the umbrellas a funder
      opens first (Scramble for Africa, Decolonisation of Africa, Arab
      Spring) have no link of their own. May an umbrella carry the links its
      parts carry, or may the fire write the umbrella's own cited edges
      (A3)?
    - An actor's lens on Japan shows the Winter War, because Japan holds
      World War II and its parts. Should the lens show only the events that
      name the actor (A10)?
    - Which chain should the "Start here" account outside Portugal tell
      (A4)?

## 7. The planner and the writers (12 October 2026)

The owner paused every cloud routine on 2 October at 19:52Z ("Pausa tudo o
que esteja a correr na cloud imediatamente"). On 12 October the owner resumed
the records lane in a new form: *"could we have opus deciding which events to
add and how to connect them, and sonnet to write the events?"* The assistant
landed the rest of the 2 October batches (PR #43, snapshot 16: 1,873 records,
1,654 active). It wrote `docs/m90-brief.md`, `docs/m90-rules.md` and the
12 October amendment of `docs/run-protocol.md`. M90 builds the queue schema,
`tools/queue/apply.mjs` and `tools/queue/state.mjs` on branch `m90`. Opus
builds, and the assistant reviews on Fable and lands. When M90 lands, the
assistant creates three routines from §7 and §8 of the brief: the planner
(Opus, daily at 03:10Z, branch `plan`) and the two writers (Sonnet, hourly,
`m42` and `m42b`). It lands the three branches daily. M42, M42b and the
landing fallback stay disabled. The owner named no budget. The assistant set
the planner's queue at about fifty items a day and told the writers to stop
when the queue is empty, so the queue limits the spend. The owner's open
questions in §6 stand.

13. From the planner's first day (12 October, `docs/plans/2026-10-12*.md`).
    The rule that a record earns its place by an edge yields an edge for one
    to four percent of the sentences the planner reads. Three rules decide
    most of what the planner refuses:
    - (a) C8 again. A war may not carry an edge to its own opening
      engagement, and an engagement may not carry one to the war it opened.
      The planner queued Operation Searchlight ("ultimately led to the
      Bangladesh Liberation War") with no parent, so that it would not be
      its own parent's child.
    - (b) The validator's check that a cause starts before its effect
      compares the starts of the two ends. So the planner refuses a stated
      cause of a change *inside* an ongoing event, such as the fall of Kabul
      in 2021 and the insurgency in Khyber Pakhtunkhwa, 2004 onward. One
      fire had nine such refusals. May an edge point into an event that
      began earlier, where the article states it?
    - (c) Two Imjin War dates disagree by calendar (`battle-of-chungju`
      1592-04-28 against `battle-of-sangju-1592` 1592-06-03), and
      `operation-sutton` (1982-05-23) falls after `battle-of-san-carlos`
      (from 1982-05-21). The fault is in the records, and the rule is sound.

## 8. 13 October: the parent-to-child rule removed

The assistant told the owner that on its first day the planner refused its
clearest sentences under A14 (question 13a). The owner: *"Ok let's remove
the parent to child rule for now."* The assistant applied it the same hour:

- `tools/queue/queue.mjs` writes such edges.
- The test that pinned the refusal now asserts the write.
- Card 11 of the rules card and amendment A16 of the M42 brief record the
  decision.
- The planner's prompt no longer applies the rule.

Questions 13b (an edge into an ongoing event) and 13c (two dates) stand.

## 9. 13 October: the most important events first, and no event needs an edge

The owner, the same evening: *"Right now the priority is to add most events
of historical significance since around 1500, even if for now there is no
parent or child for it. Just add all events that are relevant and connect
them when you can. Start by adding the main and most important historical
event and then progress to adding events that are not as important or that
are children of the main events."* The assistant applied it in four places:

- A17 (`docs/m42-brief.md`).
- Cards 7, 12 and 13 of the rules card.
- M91. The queue may carry an item with no edge, the writer imports it, and
  the duplicate check also matches by title.
- The planner's prompt. The planner ranks by Wikipedia's vital-article
  levels and lists, then by the children of main events the atlas holds,
  with the lanes as the tiebreak.

The owner also has cloud credits to spend (*"I also have cloud credit
sessions that you are free to use"*). The planner fires four times a day and
the writers take ten items a fire.

14. From the planner's fires of 13 October (`docs/plans/2026-10-13-*.md`),
    three decisions that are yours. (a) The import's class table marks
    Q718893, "theatre of war", as a place, so the Pacific War and the other
    theatres and fronts of the two world wars cannot enter as events, though
    the atlas already holds the Eastern Front as one. May a theatre of war
    be an event? (b) The labels for spans of time (the early modern period,
    the modern era, the late modern period, contemporary history) are not
    events on the planner's reading and stay out. Do you want them as
    umbrellas? (c) Three vital articles are held under their own titles with
    no Wikidata id (the Industrial Revolution, the Haitian Revolution, the
    Spanish-American War), so every fire reads them as absent until a
    curation pass writes the id on the record.
