# Build brief — M90: the planner and the writers

On 12 October 2026 the owner resumed the records lane with a change of
strategy: *"could we have opus deciding which events to add and how to connect
them, and sonnet to write the events?"* M42 and M42b were paused on 2 October
and stay paused. This milestone builds the tooling that split needs, and its
last two sections are the prompts of the two routines the assistant creates
when it lands.

**Why the split needs tooling and not only two prompts.** Every M42 fire was
Opus reading a 5,700-word brief, a 13,000-word review and a pool file of
25,000 lines, then writing a long prose note; the record itself came from the
import tool. The judgement sits in three decisions — which candidate, which
umbrella, which edge with what quote — and nothing else. So the judgement moves
to a **planner** that fires once a day and writes a **queue**, and the rest
becomes a **writer** that takes queue items and applies them mechanically,
with the rules that can be code enforced by code. A writer on a smaller model
is safe only if it has nothing to decide; this brief makes that true.

**Branch `m90`, never `m0`, `m42`, `m42b`, `plan` or `main`.** Gated on
`M89 done` on `origin/m0`. The 21 and 22 September amendments in
`docs/run-protocol.md` and `docs/assistant-standing-orders.md` apply, and the
12 October amendment in `docs/run-protocol.md` (the `plan` branch). Tests
before behaviour (711, 717); no test pins a count; a test over the live corpus
derives its expectation from the corpus; no network in a test (the fetcher is
stubbed); no runtime dependency, build step or database; no display change;
nothing under `data/events`, `data/edges`, `data/places`, `data/actors` —
**this milestone writes no record**. Deviations continue from the last in
`origin/m89`'s `STATUS.md`. `M90 done` on `STATUS.md` when §1 to §6 are.

Read `docs/m90-rules.md` (the card both routines read), `tools/import/wikidata.mjs`
(`main`, `runImportMode`, `eventRecord`, `createFetcher`, `leadRecord`,
`REDIRECT_FLAG`), `tools/cache-evidence.mjs`, `tools/import/citations.mjs`,
`schema/v1/edge.json`, `schema/common/provenance.json`, `src/validate/rules.js`
(rules 2, 4, 7, 8, 9, 24), `docs/m72-sources.md`, and the last "Where the run
stands" in `docs/m42-pool.md` on `origin/m42` and `docs/m42b-pool.md` on
`origin/m42b` for the counts a state tool must reproduce.

## 1. The queue: `schema/import/queue.json` and `data/imports/queue.json`

A queue is a JSON file kept by the planner on the `plan` branch at
`data/imports/queue.json`. **As built (12 October):** the file is an envelope
`{ "schema": 1, "kind": "import-queue", "items": [ ... ] }` and the log is
`{ "schema": 1, "kind": "import-queue-log", "items": [ ... ] }`; an item may
also be `{ "existing": "<event id>", ... }` with no `qid`, for a parent or an
edge added to a record the atlas already holds. Write the schema first, with a
test that rejects each malformed shape below. An item:

```json
{
  "id": "2026-10-13-africa-003",
  "planned": "2026-10-13T03:12Z",
  "lane": "africa",
  "writer": "A",
  "qid": "Q1234567",
  "title": "Tunisian campaign",
  "parents": ["north-african-campaign"],
  "edges": [
    {
      "from": "Q1234567",
      "to": "western-desert-campaign",
      "type": "reacted-to",
      "confidence": "probable",
      "article": "Tunisian campaign",
      "revision": 1370437482,
      "quote": "The Tunisian campaign was a series of battles that took place in Tunisia during the North African campaign of the Second World War, following the Allied landings of Operation Torch.",
      "explanation": "The article \"Tunisian campaign\" (revision 1370437482) opens the campaign as what followed Operation Torch; the edge reads that sentence and nothing more."
    }
  ],
  "why": "Africa trails (256 active against the Americas' 431); the item is a P361 child of a held umbrella and its article names a held event."
}
```

Rules the schema enforces: `id` unique and of the form `<date>-<lane>-<nnn>`;
`lane` one of `data/regions.json`'s ids; `writer` is `A` for `africa`, `asia`,
`europe` and `B` for `americas` (a test asserts the mapping); `qid` matches
`^Q[1-9][0-9]*$`; `parents` is a list of record ids; `edges[].from` and
`edges[].to` are a record id or the item's own `qid` (one of the two must be
the qid: an item earns its place by its own edge); `type` is one of the five;
`confidence` is `probable` or `consensus` (never `disputed` from a queue: a
dispute is the planner's own record, §3); `quote` is at least 40 characters;
`explanation` at least 60; `revision` an integer; `why` at least 20. An item
with no edge is invalid — the bar (rules card 7) is enforced at the queue.

The writer never edits the queue. Its results go to its own branch's
`data/imports/queue-log.json`, an array of `{ "id", "writer", "fired",
"status", "written": { "event", "edges": [ids], "place" }, "refusals": [ {
"edge": <index>, "reason": <code>, "detail": <text> } ] }` with `status` one of
`written`, `partial` (event written, some edges refused), `refused` (nothing
written: no edge could be verified, so no record), `skipped` (already held by
either branch). Schema and test for the log too. The planner reads both
branches' logs; a queue item whose id appears in a log is done.

## 2. The writer's tool: `tools/queue/apply.mjs`

```
node tools/queue/apply.mjs --queue <file> --writer A|B [--max 5] [--data data]
                            [--log data/imports/queue-log.json] [--fetcher stub:<dir>]
```

Takes the next items for its writer whose ids are not in the log and not held
by the other branch (`--held <file>`, a list of ids and qids the routine
extracts from the other branch before the run), at most `--max`, and for each,
in this order, stopping the item at the first step that fails and logging why:

1. **Skip** if a record with that `wikidata` id exists under `data/events`
   (either branch) — `skipped`.
2. **Verify every edge's quote before importing anything.** Fetch the article
   at the named revision through `createFetcher` (the action API, `oldid`,
   plain text of the lead and body), normalise whitespace, quotation marks,
   dashes and soft hyphens on both sides, and require the quote as a verbatim
   substring. Then apply the chronology refusal (rules card 10) to the quote
   as a regular expression over its opening words, and the five-type check
   (the parent rule of card 11 was removed by the owner on 13 October 2026). An edge that fails is a refusal with its code
   (`quote-not-found`, `chronology`, `parent-to-child`, `type`,
   `endpoint-missing` when `to`/`from` is not an active record). **If no edge
   survives, the item is `refused` and nothing is imported.**
3. **Import** the item: append the qid to `data/imports/wikidata-seeds.json`'s
   `items` if absent, run the import for that one item (call
   `runImportMode` with a batch of one, or spawn `--import --batch 1` with
   the cursor set to it — read `runImportMode` and pick the one that imports
   exactly this qid; say which in the tool's header comment). The import does
   what it does today: place, lane, lead, flags. Record the event id it wrote.
4. **File** it: set `parent` to the queue's list after checking each parent is
   an active record whose span contains the event's start (rule 24's checks
   plus the span); a parent that fails is dropped with a refusal entry and the
   event stands if any edge stands.
5. **Write the surviving edges** as records with the envelope of
   `data/edges/voyages-of-christopher-columbus--spanish-colonization-of-the-americas--enabled.json`:
   `authors` the assistant draft line, `origin.tool` `assistant` and
   `origin.run` `m90-writer-<A|B>`, `review.flags` `["edge-drafted",
   "queued"]`, `sources` the article at the revision (the quote is the
   locator's companion in `explanation`; the locator keeps the M72 form
   `"<title>", revision <n>`), `from`/`to` with the qid replaced by the new
   event's id, `confidence` as queued, `dispute: null`. The id is
   `from--to--type` (rule 2).
6. **Append the log entry** and move on. After the last item: `node
   tools/build-index.mjs`, `node tools/validate.mjs --index` (an error here
   is a hard stop: the tool prints it and exits non-zero, nothing is
   committed by the tool — committing is the routine's step), then `node
   tools/cache-evidence.mjs --fill` scoped to the fire's citations.

The tool is pure between network calls: `--fetcher stub:<dir>` reads article
text from `<dir>/<revision>.txt` and item JSON from `<dir>/<qid>.json`, so the
tests run it end to end on `tests/fixtures/data` with a fixture queue that
exercises every refusal code and the written case, and assert the records,
the log and the index. A test asserts that when the network is refused
(the stub throws) the tool writes nothing and exits with a named code the
routine recognises.

## 3. What the planner writes besides the queue

The planner is a routine, not a tool, but two things it writes need a shape:

- **`docs/plans/<date>.md`** on `plan`: the day's note, at most 60 lines —
  what trailed, what was queued per lane with the item ids, what was
  considered and refused with the refusal class, the counts from
  `state.mjs` before, and anything for the assistant. It is the pool file's
  successor and it is short by rule.
- **Disputes and corrections**: where the planner reads an article that
  contradicts an existing edge's type or direction (A13), it queues nothing
  and writes no record, since it pushes only `plan`. It lists the edge id,
  the quote and the revision under `## Disputed` in the day's note, and the
  assistant applies the `disputed` mark on `m0`. `state.mjs` (§4) reads the
  notes' `## Disputed` sections and counts the open ones.

## 4. The state tool: `tools/queue/state.mjs`

```
node tools/queue/state.mjs [--data data] [--queue <file>] [--logs <file>...] [--json]
```

Prints, in under 80 lines, what a planner needs and nothing it does not: the
counts in the form of the pool file's table (active, main, filed, active
edges, components, largest component, events with no edge, edges crossing an
umbrella, active events with no place, validator errors and warnings), the
per-lane and per-century active and main counts (the A10 table), the queue's
state (queued, written, partial, refused, skipped per writer, and the refusal
codes' counts), the held umbrellas with fewer than three children, and the
last three plan notes' headings. `--json` emits the same as an object. Tests
over `tests/fixtures/data` with a fixture queue and logs; the counts are
derived, never pinned.

## 5. The workflow and the protocol

`.github/workflows/validate.yml`'s push pattern `m[1-9]*` already checks
`m90`, `m42` and `m42b`; add `plan` to it (the queue and the notes are
validated by the schema test, and a red `plan` must be visible). Append the
12 October amendment to `docs/run-protocol.md` if the assistant has not
already (it is in `origin/m0` when you read this; do not duplicate it).

## 6. Tests and the done line

Pure tests under `tests/m90-*.test.mjs`: the queue schema (each malformed
shape), the log schema, the writer mapping, `apply.mjs` end to end on the
fixture with the stub fetcher (written, partial, refused, skipped, the
network-refused exit), the normalisation of quotes (curly quotes, en and em
dashes, soft hyphens, line breaks), the chronology regular expression against
the sentences the pool files refused (take ten from `docs/m42-pool.md`'s
A15(5) section and ten they accepted), and `state.mjs`'s derivations. The
live-corpus test: `state.mjs` over `data/` runs clean and its active count
equals the validator's. `M90 done` when all of it is green on `m90`'s head.

## 7. The planner routine (the assistant creates it on landing; Opus; once a day at 03:10Z)

> You are the **planner** of the Atlas causal's records lane. Read
> `docs/m90-rules.md` on `m0` whole; it is the authority, and the M42 brief's
> amendments stand behind it. Repository https://github.com/goncalojacob/atlas-causal.
> **You work on branch `plan`, never on `m0`, `m42`, `m42b` or `main`.** You
> write no record: you write a queue, and the writers write the records.
>
> STEP 0 — `git fetch -q origin`; `git checkout -B plan origin/plan` (or from
> `origin/m0` if `plan` does not exist); `git merge --no-edit origin/m0` keeping
> both sides of any doc. If `docs/plans/<today>.md` exists, stop: planned.
> Claim with a `Planner started <ISO instant>` line in `docs/plans/<today>.md`
> and push it, so a second fire stops here.
>
> STEP 1 — `node tools/queue/state.mjs --queue data/imports/queue.json --logs
> <(git show origin/m42:data/imports/queue-log.json) <(git show
> origin/m42b:data/imports/queue-log.json)` and read it. Mark done every queue
> item whose id a log holds (drop it from `data/imports/queue.json`; the logs
> are the record). Items `refused` for `quote-not-found` come back to you:
> re-read the article once; re-queue with the right quote or drop with a line
> in the note.
>
> STEP 2 — Choose. The lanes that trail come first (rules card 13). Run `node
> tools/import/wikidata.mjs --candidates --to /tmp/candidates.md` and read the
> candidates for those lanes, plus the `P361` children of held umbrellas with
> fewer than three children (the state tool lists them). For each candidate
> you consider, read its English article at its current revision (lead and
> body) and look for a sentence that states a cause, an enabling, a reaction, a
> precondition or an inspiration between it and an event the atlas holds
> (`data/index/search-*.json` or `data/events/` titles and `wikidata` ids).
> Queue it only with that sentence verbatim, the revision, the type, and the
> parents that fit. Apply the chronology refusal and the parent rule yourself;
> the writer applies them again, and its reading of A15(5)'s second half is
> mechanical: **the quoted sentence may name no event the atlas holds other
> than the edge's two ends — not even the umbrella you are filing the item
> under — or the writer refuses the edge as `chronology`.** Pick the sentence
> that states the link and nothing else; a sentence that names three events
> gives the edge to none. **Queue about fifty items a day across the lanes,
> never more than seventy,** so the writers' cost is bounded by the queue.
> Write nothing you cannot quote.
>
> STEP 3 — On Sundays, the curation pass of A11(a) and A13 over every active
> event, as before, but reported in the day's note and applied through the
> queue (a parent or a place for an existing record is an item with
> `"existing": "<id>"` and no `qid`; extend the schema only if §1 did not
> already, and say so) or, for a dispute, under `## Disputed` for the
> assistant.
>
> STEP 4 — Validate the queue against `schema/import/queue.json` (`node
> tools/queue/apply.mjs --check data/imports/queue.json`, run from the
> checkout: it reads `data/regions.json` and the records to resolve ids), write
> `docs/plans/<today>.md` (at most 60 lines: counts before, what trailed,
> what was queued per lane, what was refused and why, disputes, anything for
> the assistant), commit, push `plan`. Deviations continue from 1600.
>
> If the network is refused inside the sandbox (no request leaves), say so,
> write the note with the counts only, and stop; tomorrow's fire retries.
>
> End every commit message with: Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
>
> Final message: items queued per lane and writer, candidates considered and
> refused by class, disputes listed, the counts, deviations.

## 8. The writer routine (two copies; Sonnet; hourly, A at :20 and B at :40)

> You are **writer A** of the Atlas causal's records lane (writer B's copy
> says B, lane `americas`, branch `m42b`). You take `africa`, `asia` and
> `europe` on **branch `m42`, never `m0`, `plan`, `m42b` or `main`.** You
> decide nothing: the planner's queue says what to write, and
> `tools/queue/apply.mjs` writes it under the rules of `docs/m90-rules.md`.
> Repository https://github.com/goncalojacob/atlas-causal.
>
> STEP 0 — `git fetch -q origin`. `git show origin/plan:data/imports/queue.json
> > /tmp/queue.json`. `git checkout -B m42 origin/m42`; `git fetch --unshallow`
> if shallow; `git merge --no-edit origin/m0` keeping both sides of
> `STATUS.md` and dropping and rebuilding `data/index/` on conflict. Apply the
> claim rule of `docs/run-protocol.md` to any `Writer A started` line in
> `STATUS.md`; append yours under `## Milestones landed`, commit alone, push.
> Run `node tools/queue/state.mjs --queue /tmp/queue.json --logs
> data/imports/queue-log.json` and read writer A's waiting count: **if it is
> zero, stop and say "queue empty"** (`apply.mjs` prints the same and exits 0
> if you run it anyway).
>
> STEP 1 — Extract what the other branch holds: `git ls-tree -r --name-only
> origin/m42b data/events | sed 's#.*/##; s#\.json$##' > /tmp/held.txt` and
> the `wikidata` ids of those files appended. Run `node tools/queue/apply.mjs
> --queue /tmp/queue.json --writer A --max 5 --held /tmp/held.txt`. **If it
> exits 3 with `network-refused:` on stderr, the network is refused inside the
> sandbox: discard the working tree (`git checkout -- . && git clean -fd
> data tools/import/cache`), commit nothing, and stop saying so**; the items
> stay queued for the next fire. If `validate --index` fails inside it, stop
> and say which record; do not fix a record by hand.
>
> STEP 2 — Four commits, in this order, and the order matters because the
> index's history shards are built from the commits that touched each record
> (rule 16; the first writer fire went red on exactly this): (1) the records,
> `data/events`, `data/edges`, `data/places`, `data/imports/` (the log, and the
> seeds and state files, which also carry the qids of refused items; that is
> expected), one commit naming the item ids; (2) **then rebuild the index
> (`node tools/build-index.mjs`) and `node tools/validate.mjs --index` must
> print 0 errors**; commit `data/index` and `sources.html`; (3) the cache,
> `tools/import/cache/`; (4) one line appended to `STATUS.md` under
> `## Milestones landed`: `Writer A <ISO instant>: <n> written, <m> partial,
> <k> refused, <j> skipped`. Push `m42`. **Do not wait for the check**: the
> push's check runs on its own and the assistant reads it when landing; a
> routine that waits for a check ends its session without the line it meant
> to write. Stop after the push. The writers' log is
> `data/imports/queue-log.json` on the branch; `schema/import/queue-log.json`
> is its schema.
>
> You write no prose note, no pool section, no deviation; a refusal is a log
> entry for the planner. If `apply.mjs` itself is broken (a stack trace, not
> a refusal), stop, say so with the trace, and write nothing.
>
> End every commit message with: Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
>
> Final message: the item ids and their statuses, the records written, the
> check's result.

## Noted, not asked

- The planner's cost is one Opus fire a day reading the card, the state and
  about fifty articles; the writers' cost is bounded by the queue, since a
  fire with nothing to take stops at STEP 0. The old fires read 40,000 lines
  before writing a batch of two.
- The lead cache stays a lead cache (the owner's C5 is open). The quote check
  fetches the revision each time it verifies; it does not store bodies.
- The landing fallback routine's 24-hour rule never found a snapshot due
  while the assistant landed several times a day. It stays paused; the
  assistant lands `m42`, `m42b` and `plan` (docs only) into `m0` daily.
