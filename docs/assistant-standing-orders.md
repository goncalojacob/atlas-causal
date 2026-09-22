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
numbered findings file → fix milestones for the confirmed findings → a
second review mid-week → its fixes.

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
