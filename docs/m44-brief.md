# Build brief — M44: the neighbours the atlas is missing, 1890–2025

Owner's request, 8 September 2026: **more events, honestly connected, as soon
as possible.** Third import round, after M40 (the world Portugal answered to)
and M41 (a second Portuguese round, filtered for consequence). This is **not**
M42 — the world at scale, from `docs/m42-brief.md`, which the owner wants last
and which deliberately writes no edges. M44 is the opposite: a small round
chosen so that every record arrives with its edge already argued.

Read first: `CLAUDE.md` (the drafting exception of 2 September and its two
extensions of 5 September; what the Wikidata import may and may not do; rule
22), `STATUS.md` (the M40a/M40b/M41a/M41b paragraphs and deviations 439–469),
`docs/m40-brief.md`, `docs/m41-brief.md`, `docs/m40-retractions.md`,
`docs/m41-retractions.md` — **these two are the brief's real source material** —
`docs/run-protocol.md` with its import amendments, `data/imports/wikidata-seeds.json`,
`tools/import/wikidata.mjs`, `.github/workflows/import-wikidata.yml`,
`data/roles.json`, `data/categories.json`, then this file. Two runs, M44a and
M44b.

## 1. What the corpus actually looks like, 8 September 2026

Measured on `origin/m0` at `2246f23`. "Active" is `status: "active"`;
retracted and merged records are excluded. The whole active corpus is
1899–2025, so "1890+" and "the whole corpus" are the same set. "Portuguese"
means the event has a Portuguese place, or names a Portuguese actor, or says
Portugal in its title; 14 of 210 are arguable under that rule and they are
named in the measurement, not hidden.

| | active | retracted | merged |
|---|---|---|---|
| events | **210** | 194 | 17 |
| edges | **219** | 0 | 0 |
| actors | **462** | 24 | 2 |
| places | **26** | 0 | 0 |

**Events per decade, Portuguese against world.**

| decade | all | PT | world | | decade | all | PT | world |
|---|---|---|---|---|---|---|---|---|
| 1890s | **3** | **0** | 3 | | 1960s | 14 | 12 | 2 |
| 1900s | **5** | 2 | 3 | | 1970s | 33 | 27 | 6 |
| 1910s | 27 | 20 | 7 | | 1980s | 12 | 11 | 1 |
| 1920s | 15 | 8 | 7 | | 1990s | 13 | 12 | 1 |
| 1930s | 11 | 6 | 5 | | 2000s | 12 | 8 | 4 |
| 1940s | 12 | 5 | 7 | | 2010s | 16 | 13 | 3 |
| 1950s | 13 | 5 | 8 | | 2020s | 24 | 16 | 8 |
| | | | | | **total** | **210** | **145** | **65** |

**Categories.** `election` 48, `treaty` 3, `disaster` 2, `death` 1, and
**zero** in `war`, `revolution`, `law`, `founding`, `economy`, `culture`,
`science`, `other`. **156 of 210 carry no category at all.** Of the 168
decade×category cells, 150 are empty and 161 hold two events or fewer. The
1930s has eleven events and not one in a named category.

**Lanes.** europe 156, asia 29, africa 16, americas 9, **oceania 0**.

**Places.** 26 records; Lisbon carries 60 of the 88 placed events; nineteen
places carry exactly one. 122 of 210 events are placeless and stand on a
`region` alone.

**The finding that decides this round.** Of the 65 world events M40b wired,
**45 (69%) touch no Portuguese event at all**, 17 touch one, 3 touch two, and
**none touches three**. Ten active events have no active edge whatsoever, all
of them Portuguese. M40b's one-edge rule — one honest edge to anything already
here — has been quietly building a second atlas that hangs together with itself
and not with the first one.

**Polities.** Of 338 actors of type `polity`, **286 appear in no active event**,
and **285 of those 286 hold ground on the map**: a border, a colour, a
territory, and no history. `angola-under-portugal` has four presences and zero
events; so does every other `*-under-portugal`, because the colonial-war
records name `estado-novo` instead.

**Origin and standing.** Every world event is a Wikidata import; every
assistant-drafted event is Portuguese; **nothing in the active corpus has been
reviewed**. 209 of 210 are `draft`.

## 2. What M44 targets, and why

Not volume. Two rounds already returned 1,873 and 2,217 candidates, and the
candidate list of 6 September is **committed on `m0` at
`docs/wikidata-candidates.md`**: 2,219 rows, of which **1,395 world rows are
not in this atlas today** and **970 of those are typed as an event by the
seeds' own class table**. The pool is not the problem.

The problem is connectability, and the two retraction files say so in prose a
person wrote. M40b retracted 28 of 91 (31%) and M41b 24 of 42 (57%), and the
reason given over and over is the same: *the neighbour is missing*. The atlas
holds the Velvet Revolution and not the fall of the Wall; the second Chechen
war and not the first; the Libyan and Syrian wars and not the Arab Spring; the
war in Afghanistan and not 11 September. Eight of M40b's twenty-eight
retractions name an event that was among the **29 the import refused for want
of a lane** (deviation 447). Fourteen of M41b's twenty-four are companies with
no Portuguese economic history to attach to.

So M44 imports **the named neighbours**, and only then fills thin decades.
Every entry in the two retraction files that says "it would need X first" is a
target, because for each of them a person has already written down what the
edge would argue. This is the fastest route to honestly connected events that
exists in this repository today, and it needs almost no network.

Three things it targets, in order:

1. **The named world neighbours** — Appendix A. Thirty-five of them are
   already in the committed candidate list, none is already a record here, and
   twenty-four of them are among deviation 447's twenty-nine.
2. **The thin decades** — the 1890s (three events, none Portuguese), the
   1900s (five), and the 1930s, 1940s and 1950s (eleven to thirteen each).
3. **The zero categories** — `revolution` and `economy`, which the pool can
   fill from the class table, and `law` and `founding`, which the world
   families cannot fill and which the Portuguese half of M44b writes by hand.

And one thing it targets that is not an import at all: **twelve Portuguese
events, hand-drafted** (§4c), each of which un-retracts at least one record the
atlas has already written off. The `pt2-*` families returned one law and zero
treaties across three candidate runs (deviation 443); asking Wikidata a fourth
time for the Concordat of 1940 is not the move.

Not targeted, and deliberately: the 156 events with no category (a backfill
over records that arrived from `world` before M32b — owner question 6), the
286 event-less polities (M42's problem, at scale), and Oceania (nothing in the
retraction files reaches it; it will come with M42).

## 3. M44a — the ticks and the import

### 3a. Where it runs

**Branch `m44`, cut from `origin/m0` after a fetch** — *not* from `world`.
`origin/world` forked before M32b and has no `data/roles.json`, no
`data/categories.json` and no `category` property in the event schema, which
cost M41b deviation 456 and a whole class of workarounds. Cutting from `m0`
makes rule 25 and the category field available from the first commit.

The import branch is `import/run-m44-<date>`, cut from `m44` and
fast-forward-merged back into it; that merge is the run's own commit, as the
run protocol's amendment of 4 September allows. **Nothing in M44 is merged
into `m0`.** A separate merge run lands `m44` on `m0`, the way `merge-world`
landed `world`, and that run rebuilds the index in one commit of its own.

### 3b. The tick rule, and the number

**140 candidates.** The rule is a rule and not a hand, it is written at the top
of `docs/wikidata-candidates.md` before any tick is made, and it is
reproducible from the file plus `data/` alone — sitelinks and item id are both
in the row, ties break by item id, so the same inputs give the same 140 twice.

"Already held" is recomputed against **today's** `data/`, not read from the
file's `in the atlas` column: that column was computed on a branch cut before
the `world` merge, so it says `—` for the 90 rows that are records now.

The pool is the **world rows only** of the committed list. The four sets, in
order, no row taken twice:

| set | what it keeps | rows |
|---|---|---|
| 1 | **Named**: every world row whose English label matches an entry of Appendix A | ≤ 60 |
| 2 | **Thin decades**: after set 1, the 8 best by sitelinks in each of the 1890s and 1900s, and the 6 best in each of the 1930s, 1940s and 1950s | 34 |
| 3 | **Zero categories**: after sets 1–2, the 8 best the class table types into `revolution` and the 8 into `economy` | 16 |
| 4 | **Remainder to the cap**: the best remaining by sitelinks over the whole world pool | 30 |
| | | **140** |

**Why 140 and not more.** The cap is set by what M44b can draft in one run, not
by what the pool holds. M40a ticked 120, imported 91 (76%) and M40b wired 63 of
them in a single run; M41a ticked 150 and imported 42 (28%) because its classes
were not in the table. M44's pool has M40a's class profile, so 140 ticks is
about 105 records imported and, after refusals for want of a lane, roughly 90
for M44b to write — the size M40b has already proved a single run can carry.
Ticking 300 would produce a second `docs/m41-retractions.md`, and the owner has
two of those already.

**A tick is two edits, not one.** `--import` walks
`data/imports/wikidata-seeds.json` → `items`, and nothing in the tool reads the
markdown; the "How to tick" paragraph the tool generates describes an intention,
not a mechanism. So M44a puts `[x]` in the row **and** the Q-id in `items`, in
the same commit, and the commit body says how many of each. `items` holds 592
ids today and must hold 592 + (the ticks) after, with no duplicate — which
`tests/import-seeds.test.mjs` already checks.

### 3c. Whether the Action runs `--candidates` at all

**By default it does not.** The committed list of 6 September is enough for
sets 1–4, and a candidates run over the present 385 queries takes about **three
hours** of runner time — the resource whose exhaustion stopped every job in
this repository for a full day (deviation 442). `--import`, by contrast, took
**seven minutes** for M41a's 150 items in six batches.

Twelve of the named neighbours are **not** in the committed list, because their
Wikidata classes are not among the eleven the `world-*` queries name: 11
September, the fall of the Berlin Wall, German reunification, the dissolution
of the Soviet Union, the Bosnian War, the Cuban missile crisis, the Prague
Spring, the East German uprising of 1953, the European refugee crisis of 2015,
the collectivisation of Soviet agriculture, the Pact of Steel, and United
States presidential elections. Fetching them is a fourth candidates round with
new classes and new queries. That is **owner question 2**; without it, those
twelve stay on Appendix A as unresolved and M44b's retraction notes say so
rather than guessing at a Q-id the sandbox cannot look up.

### 3d. The Action, and how a resumed run finds where the last one stopped

The Action is the only path to the network: the sandbox's proxy answers
CONNECT with 403 for `query.wikidata.org` and `www.wikidata.org` alike. A push
to `import/**` starts `import-wikidata.yml`, which reads the mode from the
branch name, loops up to forty batches of `--import` → `build-index` →
`validate --index` → `node --test --test-timeout=120000` → commit → **push**,
and finishes with an empty commit. `timeout-minutes` is 330 and `concurrency`
is `import-wikidata` with `cancel-in-progress: false`, so a second push queues
behind the first rather than racing it.

**A run can die — the Action's or this session's — and the next one must not
start over.** The state is in two places and they agree:

1. **The branch's last commit subject.** `git fetch origin` and
   `git log --oneline -8 origin/import/run-m44-<date>`. It is one of:
   - `import: import batch <n>` — the Action reached batch *n* and pushed it.
     Batches 1..*n* stand; everything they wrote is on the branch.
   - `import: done` — the empty marker the last step writes. The walk is
     finished; there is nothing to resume.
   - a hand commit of this run (`M44a: …`) — the Action committed nothing.
     Either it has not started, is still inside its 330 minutes, or it failed
     before its first commit. Check the run on GitHub before pushing again.
   - **no such branch** — nothing was ever pushed; start at §3b.
2. **`data/imports/wikidata-state.json`** on that branch:
   `git show origin/import/run-m44-<date>:data/imports/wikidata-state.json`.
   `runs.import.done` is every item the cursor has dealt with — created,
   enriched or refused — `runs.import.pending` is what is left, and `updated`
   is the day of the last batch. On `m0` today `done` is 592 and `pending` is
   empty, so **M44a's own items are exactly the ids in `done` beyond 592**.

**What a resumed run does.** If `pending` is non-empty, push the branch again —
an empty commit is enough — and the Action resumes from the cursor. **Do not
re-tick, do not re-run `--candidates`, do not edit `items`.** If `pending` is
empty and `done` covers every ticked id, M44a is imported and the next step is
the fast-forward merge into `m44`. If a batch failed, `docs/import-report.md`
on the branch holds **this run's lines only** — the workflow truncates it at
the start — and it is the only readable log, because a job's log is not
something a run here can fetch.

**Rewinding is deliberate and never accidental.** An item in `done` is never
walked again, which is why deviation 447's twenty-nine sit refused and stay
refused. If the owner takes option 2 below, the rewind is an edit to
`wikidata-state.json` removing those ids from `runs.import.done`, in a commit
of its own whose body names them and says why.

**A candidates run has no cursor.** `--candidates` breaks after one pass by
design, so a cut-off candidates round redoes all 385 queries from the start.
That is the second reason §3c prefers not to run one.

### 3e. What M44a must not do

- **No `--candidates` run without the owner's word** (question 2). If one is
  run, it adds queries to the seeds file and changes nothing else under `data/`.
- **Never edit a candidate row** except its tick box. The label, the date, the
  type and the sitelink count are what the query returned; a hand-corrected row
  is a row nobody can reproduce.
- **Never widen the `classes` table to force a yield.** An item of a class
  nobody has decided about is refused and listed, and that is the table
  working. Adding a class is an editorial judgement about what that class *is*,
  and it belongs in a commit of its own with the judgement written down.
- **Never `git add -A` outside the Action.** The Action commits `data/index/`
  because it rebuilds and validates it inside every batch and because
  `tests/validate-cli.test.mjs` runs `--index` against the repository
  (deviation 448); that index is the Action's, never this run's own commit, and
  it is cleared by one `build-index.mjs` commit on top of the merge into `m0`.
- **Never touch `m0`, `main` or `world`.**

### 3f. Done when

`docs/wikidata-candidates.md` carries the rule at its top with the four sets
and their counts; `items` holds 592 + the ticks with no duplicate; the Action
has pushed `import: done`; the branch is fast-forward-merged into `m44`; the
counts — ticked, imported, refused and why, leads cached — are in `STATUS.md`;
`node tools/validate.mjs` without `--index` reports zero errors; the literal
line `M44a done`.

## 4. M44b — the drafting, and the proof that it connected

### 4a. The bar is higher than M40b's, and the measurement is the argument

M40b's rule was one honest edge, in either direction, to anything already here,
and it produced an atlas where 45 of 65 world events reach no Portuguese record.
M44's bar keeps the honesty and adds reach.

A **Portuguese event** is one that (a) carries a place among the seventeen
Portuguese and Portuguese-administered places, or (b) names a Portuguese actor,
or (c) says Portugal or Portuguese in its title. The rule is the measurement's
own and the actor list is written into `docs/m44-connections.md` so that anyone
can recompute it.

A record M44b keeps must be one of:

- **(P) Portuguese-reaching**: it carries at least one honest edge, and a path
  of active edges of length **at most two**, in either direction, joins it to a
  Portuguese event; or
- **(B) a bridge**: it carries an edge to a world event already here that has
  no Portuguese reach, *and* an edge that gives that pair one — so two records
  land connected where one was stranded.

A record that can take an edge only to another world event, leaving both still
unreachable from any Portuguese event, is **retracted** with its reason in
`docs/m44-retractions.md`. And the second half of the one-edge rule stands
exactly as M40b and M41b kept it: **nothing is written in order to keep a
record.** A `precondition-of` from every twentieth-century war to the Cold War
would clear the whole queue and say nothing.

### 4b. How it is proved, edge by edge

`docs/m44-connections.md`: one row per kept record.

| record | edge | other end | hops to a Portuguese event | the sentence that argues it |
|---|---|---|---|---|

The hop count is recomputed from `data/` at the end of the run — not asserted
from memory — and the two numbers that matter go in `STATUS.md`: how many of
M44's own records are Portuguese-reaching, and **how many of the 45 stranded
world events already here stop being stranded** because of an edge M44b wrote.
That second number is what the round is for. No new committed tool is required
for it (owner question 8); the script is written, run, and its output pasted
into the file.

### 4c. The Portuguese half, drafted by hand

Twelve events, written with `tools/new-record.mjs`, `origin: { "tool":
"assistant" }`, `review: { "status": "draft" }` — squarely inside the exception
the owner took on 2 September for twentieth- and twenty-first-century Portugal
— and each chosen because a retraction file names it as the thing that is
missing:

| the record | it un-retracts |
|---|---|
| the Concordat and Missionary Accord of 1940 | `lateran-treaty` |
| the Azores base agreement and its renewal, 1943–1962 | `assassination-of-john-f-kennedy` |
| the Security Council vote against Portugal, 1961 | `assassination-of-john-f-kennedy` |
| the 1-2-3 incident in Macau, December 1966 | `cultural-revolution` |
| the family law reform of 1977 | `convention-on-the-elimination-of-all-forms-of-discrimination-against-women` |
| the extended continental shelf claim of 2009 | `united-nations-convention-on-the-law-of-the-sea` |
| the nationalisation of electricity, summer 1975 | `energias-de-portugal` |
| the creation of EDP, 1976 | `energias-de-portugal` |
| the banking law of the mid-1980s | `banco-comercial-portugues`, `portuguese-investment-bank` |
| the privatisations of the 1990s | `altice-portugal`, `nos`, `brisa-auto-estradas-de-portugal`, `semapa`, `altri`, `the-navigator-company` |
| the decree founding the universities of Lisbon and Porto, 22 March 1911 | `university-of-porto` |
| the ban on the National Syndicalists, 1934 | `national-syndicalists` — "the retraction here most worth undoing" |

**The hard constraint on all twelve.** A record is written only if a source
**already in `data/sources/`** carries it, cited with a locator. If no source
here does, the event is **not written**: it goes on a list at the end of
`docs/m44-connections.md` for the owner, naming the work the atlas would need.
A date that looks confident and is not is worse than a gap, and this is the
half of M44 where that risk is real. Reinstating a retracted record is
`status: "active"` again with the tombstone's flags cleared, in the same commit
as the edge that justifies it, and the reinstatement is named in
`docs/m44-retractions.md`.

### 4d. What M44b must not do

- **No new source record with an invented identifier.** No DOI, no ISBN, no
  URL that has not been read. If a claim needs a work the bibliography does not
  hold, the claim is not made. `tools/lookup-sources.mjs` is a review aid and
  never a gate, and it needs a network it does not have here.
- **No summary beyond what the source says and what the connection argues.** An
  imported record's summary quotes the item's description and says it is not
  this atlas's account of anything; a drafted summary says what the thing was
  and what it meant, and stops. Nothing about consequences the sources do not
  carry.
- **`consensus` never on Wikipedia alone.** Rule 22 is an error, not a warning:
  an edge whose every supporting citation is `wikipedia-en` or `wikipedia-pt`
  may not call itself `consensus`. Cite the scholarship or mark it `probable`.
  Where historians disagree, `disputed` and a `dispute` naming who — M40b wrote
  three and that is the right instinct.
- **Every actor line's role is one of the 31 ids of `data/roles.json`**, with
  the old phrase in `note` if there is one. Rule 25 makes a role outside the
  list an error on an active event. M44 works on a branch cut from `m0`, so
  this is checkable from the first commit.
- **`category` only where the seeds' class table gives one.** The tool writes it
  and a person does not guess it; seventeen classes deliberately have none
  (`STATUS.md` → Open questions), and a record of one of those carries no
  category. Do not backfill the existing 156 here.
- **No record whose `review.status` is `reviewed` is touched**, by the import or
  by hand. There are none in `data/events/` today and the tool would report one
  rather than write to it; if one appears, it is left alone and named.
- **Nothing merged into `m0`, `main` or `world`.**
- **`retraction`/`review` shape**: a tombstone is `status: "retracted"` plus
  `retraction: { on, reason }` — the block `m0` has carried since H5b, which
  `world` did not (deviation 457), so M44 uses it properly and does not repeat
  M41b's `review.note` workaround.
- **The import writes no edge, ever**, and never adds itself to `authors` when
  it enriches. Every edge in M44 is written by a person, in a commit of its own
  decade.

### 4e. Done when

Every imported record is wired under (P) or (B), or retracted with its reason in
`docs/m44-retractions.md`; every hand-drafted Portuguese event cites a source
this atlas holds, or is on the owner's list instead; `docs/m44-connections.md`
holds the row-per-record table and both recomputed numbers; the counts by
decade are in `STATUS.md`; `node tools/validate.mjs` without `--index` is clean
of errors and its warnings are named; `node --test --test-timeout=120000` is
green against a freshly built index; the literal line `M44b done`.

## 5. The tests that pin it

No new test is required — M44 writes records, not code — and if any commit
touches `src/` or `tools/`, that change carries its own test. What already
holds this round, and must stay green:

- `tests/import-seeds.test.mjs` — the seeds schema takes items, queries and
  nothing else; duplicates a shape cannot catch are caught; a class says which
  category its events become, or says nothing; the state schema holds one
  cursor per mode.
- `tests/import-wikidata.test.mjs` — an item is classified only by what the
  seeds file says; a lane comes from the point, then from the country, then not
  at all; a created record validates, cites the item and says it is unchecked;
  enrichment fills gaps, changes nothing and signs nothing; **the cursor walks
  in batches and a resumed run does not redo the finished part**; `--import`
  leaves a signed record alone and says which one; **every record `--import`
  writes survives an unedited save through the form** — the test that caught
  deviations 452 and 464.
- `tests/identity-rules.test.mjs` — rule 21 (one item, one record of a kind),
  **rule 22** (consensus cannot rest on Wikipedia alone), rule 27 (a retraction
  and a tombstone stand or fall together), rule 28, rule 29 (an automated
  writer says so in `origin`).
- `tests/bundle.test.mjs` — an unedited save of a record in `data/` is byte
  identical.
- `tests/rules.test.mjs` and `tests/event-fields.test.mjs` — rule 25
  (`role-unknown`, an error) and the `category-unknown` warning.
- `tests/build-index.test.mjs` and `tests/validate-cli.test.mjs` — the index
  against the tree. These two go red on the branch every time `data/` grows and
  the index is not rebuilt (deviation 453); the gate at each commit is
  `validate.mjs` without `--index`, plus `node --test` against an index rebuilt
  locally and **not staged**.
- `tests/workflows.test.mjs` — the Action's shape, including its timeout.

`node --test` is run with `--test-timeout=120000` everywhere. The unbounded
waits in `tests/browser.mjs` that cost the 7 September run five and a half
hours are **still not fixed** (deviation 445), so a hang is still possible and
the timeout is what turns it into a failed batch instead of a lost run.

## 6. Deviations

Numbered on from the last one in `STATUS.md`, which is **506**, so M44's first
is **507** — unless `m0` has moved past 506 by the time the run starts, in
which case it numbers on from whatever is there when it claims the milestone.
One bold sentence saying what was done differently, then the account, then how
to reverse it; a deviation that is somebody's decision says **whose** and stops
rather than taking it.

M44 works on a branch, so the merge run applies deviation 461's rule: keep both
sides' blocks and renumber the branch's after `m0`'s, moving every
cross-reference inside them with the numbers.

Two things this round should expect to deviate about, named in advance so they
are not surprises: the yield of the tick rule against the pool (whether set 1
really reaches 60), and how many named neighbours the lane refusal takes off the
table.

## 7. The done lines

Written under `## Milestones landed` in `STATUS.md`, each as its own line with
nothing else on it, because the gate reads them with `grep -qxF`:

```
M44a done
M44b done
M44 done
```

`M44 done` goes in only after both halves are in, the counts are in `STATUS.md`
and the section is on pull request #1 — as a comment if the body is still too
large for the tool to rewrite safely, saying at its top where it belongs
(deviations 459 and 506).

## 8. Owner questions

Eight, each with the answer the assistant recommends and would take if
overruled by nothing. Every one is one commit to undo.

1. **Is the round's bar the Portuguese-reaching rule of §4a, or M40b's plain
   one-edge rule?**
   *Recommended: the Portuguese-reaching rule.* 45 of 65 world events reach no
   Portuguese record today, which is what the one-edge rule produces when the
   world is imported faster than it is connected. The cost is a higher
   retraction rate on world-only candidates; the mitigation is that set 1 of the
   tick rule is chosen precisely because somebody already wrote down why each
   one connects.

2. **Does M44a run `--candidates` again — about three hours of runner time — to
   reach the twelve named neighbours the committed list does not hold (11
   September, the fall of the Wall, German reunification, the dissolution of the
   USSR, the Bosnian War, the Cuban missile crisis, the Prague Spring, the East
   German uprising of 1953, the refugee crisis of 2015, Soviet collectivisation,
   the Pact of Steel, US presidential elections)?**
   *Recommended: not in M44a.* Tick from the committed list, import in seven
   minutes, and let M44b tell you what those twelve would have unlocked. Deviation
   442 says roughly six hours of runner time overnight is what stopped this
   repository for a day, and 11 September is worth a round of its own with the
   right classes rather than a third of a round now.

3. **The twenty-nine refused for want of a lane (deviation 447), still open.**
   *Recommended: let a placeless event take a region a seeds entry names* — one
   optional `region` key per query in `data/imports/wikidata-seeds.json`, which
   is data, plus the few lines in `tools/import/wikidata.mjs` that read it.
   Reading a `P276` location's point is the other option and costs a fetch per
   item. Twenty-four of the twenty-nine are in Appendix A: the Cold War, the Arab
   Spring, the War on Terrorism, the first Chechen and first Nagorno-Karabakh
   wars, Sykes–Picot, Kyoto, the 1918 pandemic. Without a fix, a third of set 1
   cannot land. A war fought across four countries has no point and a lane is a
   coarse enough thing to give it one; it draws no map mark, which 122 of the 210
   active events already do not.

4. **Does M44b draft the twelve Portuguese events of §4c by hand, or does M44
   stay an import round?**
   *Recommended: draft them.* They are inside the exception of 2 September,
   the `pt2-*` families returned one law and zero treaties across three
   candidate runs, and each one un-retracts records already written off — the
   Concordat unlocks the Lateran treaty, the privatisations unlock six
   companies at once. It is the cheapest connection in the whole brief. The
   guard is §4c's hard constraint: no record without a source this atlas already
   holds.

5. **Which branch, and when does it land on `m0`?**
   *Recommended: `m44`, cut from `origin/m0`, merged by a separate run.* Not
   `world`, which forked before M32b and cost M41b a whole deviation of
   workarounds. `m0` is mid-index-cycle with I6 claimed, so M44 must not touch
   it; the merge run rebuilds `data/index/` in one commit as `merge-world` did.

6. **The 156 active events with no category — backfill now or later?**
   *Recommended: later, and not inside an import round.* They are the records
   that arrived from `world` before M32b, and
   `tools/migrate/categories.mjs` reads only a title an import copied, a
   decision the owner already took. Mixing a data migration into M44 would make
   both harder to read. It wants its own small run.

7. **The 286 polity actors with no events, 285 of which hold ground on the
   map.** *Recommended: leave them.* Colouring a border for a state whose
   history is empty is exactly what M42 exists to fix, at a scale M44 is not.
   Worth noting for the owner: `angola-under-portugal` and the other
   `*-under-portugal` actors are among them, because the colonial-war records
   name `estado-novo` instead — that one is a real modelling question and not a
   coverage gap.

8. **Should the connection claim become a committed check — a `world-unreachable`
   validator warning — rather than a table and a script?**
   *Recommended: not in M44.* A warning that fires on 45 records the day it
   lands needs its own decision about what to do with them. M44b writes the
   table and the number; if the owner wants the number to stop rotting, it is a
   small milestone of its own.

## Appendix A — the named neighbours

Drawn from the "it would need X first" sentences of `docs/m40-retractions.md`
and `docs/m41-retractions.md`, and from the twenty-nine of deviation 447. Every
row below is in the committed candidate list and **none of them is a record
here today**. The tick rule matches on the English label, whole string first
and then as a substring; a row that matches nothing is left unresolved and
named as such, never guessed at.

| name | item | period | class the row prints | sitelinks |
|---|---|---|---|---|
| Spanish–American War | `Q12583` | 1890s | war | 88 |
| First Sino-Japanese War | `Q178687` | 1890s | war | 77 |
| Philippine–American War | `Q214456` | 1890s | war | 59 |
| Russo-Japanese War | `Q159950` | 1900s | war | 93 |
| Entente Cordiale | `Q464399` | 1900s | treaty | 49 |
| First Balkan War | `Q177918` | 1910s | war | 78 |
| Second Balkan War | `Q184183` | 1910s | war | 70 |
| Balkan Wars | `Q165725` | 1910s | series of wars | 80 |
| Polish–Soviet War | `Q186284` | 1910s | war | 71 |
| Sykes–Picot Agreement | `Q211674` | 1910s | treaty | 67 |
| 1918–1920 flu pandemic | `Q178275` | 1910s | zoonosis | 102 |
| Winter War | `Q134949` | 1930s | war | 93 |
| Cold War | `Q8683` | 1940s | proxy war | 210 |
| Tripartite Pact | `Q153122` | 1940s | treaty | 61 |
| HIV/AIDS | `Q12199` | 1950s | pandemic | 209 |
| Antarctic Treaty System | `Q182814` | 1950s | treaty | 81 |
| Six-Day War | `Q49077` | 1960s | war | 108 |
| Soviet-Afghan War | `Q83085` | 1970s | war | 101 |
| CITES | `Q191836` | 1970s | multilateral treaty | 69 |
| 1976 Argentine coup d'état | `Q1048750` | 1970s | coup d'état | 20 |
| Iran–Iraq War | `Q82664` | 1980s | war | 96 |
| First Nagorno-Karabakh War | `Q381375` | 1980s | war | 67 |
| First Chechen War | `Q29269` | 1990s | war | 78 |
| Kosovo War | `Q190029` | 1990s | war | 73 |
| Yugoslav Wars | `Q242352` | 1990s | ethnic conflict | 64 |
| Dayton Agreement | `Q190315` | 1990s | peace treaty | 59 |
| Rwandan Civil War | `Q426722` | 1990s | civil war | 36 |
| Arusha Accords | `Q1429076` | 1990s | peace treaty | 18 |
| Kyoto Protocol | `Q47359` | 1990s | environmental protocol | 93 |
| European Charter for Regional or Minority Languages | `Q106308` | 1990s | charter | 72 |
| War on Terrorism | `Q185729` | 2000s | war | 73 |
| War in Darfur | `Q190758` | 2000s | civil war | 58 |
| 2009 swine flu pandemic | `Q101452` | 2000s | disease outbreak | 69 |
| 2007–2008 financial crisis | `Q896666` | 2000s | financial crisis | 80 |
| Arab Spring | `Q33761` | 2010s | civil war | 112 |
| South Sudanese Civil War | `Q15353665` | 2010s | civil war | 34 |

**Named and not in the committed list** — question 2's twelve, unresolved
until a candidates round with the right classes fetches them: the September 11
attacks, the fall of the Berlin Wall, German reunification, the dissolution of
the Soviet Union, the Bosnian War, the Cuban missile crisis, the Prague Spring,
the East German uprising of 1953, the European refugee crisis of 2015, the
collectivisation of Soviet agriculture, the Pact of Steel, and any United
States presidential election.
