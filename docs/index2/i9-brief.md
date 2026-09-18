# Build brief — I9: the ground the Why mode stands on

The last run of the second index cycle (`docs/index2-plan.md`, decision D13;
`docs/health-review-2026-09-06-result.md` §5.2.7, review B finding 18, §1.3
item 4). M35 is the Why mode, and plan decision 11 lists what it stands on.
Most of it is built: `subgraph()` (H7), the explanation shards fetched in
bulk, ranking as an ordering of the answer lists, convergence grouped by
depth, the multi-focus lens. Three things are not, and each is a sentence in
`STATUS.md` that the code does not support:

- **`?walk=` has no producer.** `src/state.js:208-216` parses it and reserves
  it; nothing writes one and nothing reads one.
- **A generated path has no provenance.** Plan decision 7 says a generated
  walk lives in the session only, with a provenance line on the card. There
  is no provenance object and no line.
- **A condition endpoint is named nowhere a contributor reads.** Plan
  decision 11a says the schema already allows a process with no point and
  that the drafting guidance should name conditions as events worth writing.
  It does not.

This run builds those three and nothing else. **`?why=` is not added** —
M30a's amendment A14 gave it to M35 and that stands.

**Read**: `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`,
`docs/index2-plan.md` (D13), `docs/plan-2026-09-05.md` decisions 7 and 11,
`docs/health/h7-brief.md`,
`docs/health-review-2026-09-06-result.md` §5.2.7, then `src/state.js`
(`walk`, `parseState`, `formatState`), `src/graph.js` (`subgraph`,
`shortestPaths`, `pathTo`, `stepCost`, `rankByCost`, `convergenceByDepth`),
`src/chain.js`, `src/narrative.js` and `src/narrative-mode.js` (what reading
a walk already does), `src/explanations.js`, `src/panel/event.js` and
`src/panel/horizon.js`, `src/origin.js`, `src/share.js`.

## The gate

Wait for the literal line `I8 done` on `origin/m0`. Then claim `I9`.

## What this run must not do

- No new dependency; no build step beyond the committed output of a Node
  script already in `tools/`.
- **No historical claim, and no generated record.** Plan decision 7 is the
  rule this run exists to keep: a generated walk never enters `data/`. It
  lives in the session, it is not written to a file, it is not a narrative,
  and nothing about it is committed. No record under `data/` is created or
  edited by this run.
- **No new value in `ORIGIN_TOOLS`.** `origin` says who created a *record*;
  a walk is not a record and does not need a writer in that vocabulary. The
  review's own wording offers "a `generated` value for `origin.tool` **or** a
  `provenance` on the walk"; this run takes the second, which is the one that
  does not widen a closed vocabulary for something that is not a record.
- No `reviewed` record touched; no migration consumed; no index change (the
  index is not rebuilt by this run).
- `node tools/validate.mjs --index` byte-identical; `node --test` green with
  `CHROME` set.

## 1. The producer

A new pure module `src/walk.js`: given an atlas, a target and a state, it
produces the walk a reader would otherwise have to click out by hand — the
best path to the target from wherever the question starts — as an ordered
list of edge ids, with its own provenance beside it.

It is built out of what is already there and adds no traversal:
`shortestPaths` and `pathTo` for the path, `stepCost`/`pathCost` for which of
several is best, `subgraph` for what surrounds it. Ordering, never a
different walk: `shortestPaths` is untouched (plan decision 6, and the
health cycle's own rule), and the chain a reader is handed for the same click
is the same chain they would have walked.

The provenance is an object the module returns beside the steps —
`{ by: 'atlas', question, on, steps }` — and it is **the session's**, held in
the store beside the state and never serialised into `data/`. `?walk=<id>`
names it within the session so a state write survives a redraw, which is
exactly what `state.js` reserved the parameter for; a link copied into
another session finds no walk under that id and falls back to the selection,
which the state already tolerates.

## 2. The line on the card

Wherever a generated walk is drawn — the chain, and the card that describes
it — the card says in one line that the atlas put this path together and the
reader did not: who produced it, what question it answers, and that each step
is an edge somebody wrote, with its confidence and its dispute marks
unchanged. A path the reader walked themselves says nothing extra, because
they know.

This is the sentence the review calls "a provenance line" and it is the whole
difference between "the atlas suggests" and "the atlas asserts". It uses the
existing tokens and no new colour or size (`tests/site.test.mjs` forbids a
hex outside `:root`).

## 3. Condition endpoints, said plainly

Three documents, no code:

- **`CONTRIBUTING.md`**: an endpoint can be a **condition** — a process with
  no point and often no end, "Angolan economy dependent on oil, 1975–" — and
  it is written like any other event, with the same sources and the same
  edges. The schema has allowed it since M9 (`place` is optional) and 229
  events already carry `place: null`; what was missing was anybody saying so.
- **`ARCHITECTURE.md`**: the same, in the event section, beside the sentence
  about a placeless event's lane; and the walk's provenance in the state
  section, beside `?walk=`.
- **`about.html`**: one line in "How to read it" — some events are
  conditions rather than moments, and a path the atlas assembled says so.

## Files this run touches

`src/walk.js` (new, pure) · `src/state.js` (the walk held beside the state;
`walk` already parses and formats) · `src/chain.js` and `src/panel/event.js`
(the provenance line) · `CLAUDE.md` (the layout tree names `walk.js` —
`tests/site.test.mjs` fails on the run's own commit otherwise) ·
`ARCHITECTURE.md` · `CONTRIBUTING.md` · `about.html`.

**The hand tables**: none is added. `LAYERS`, `GROUPS`, `FOCUS_KINDS`,
`OPENINGS` and `CARDS` in `src/state.js` are untouched — a walk is not an
opening and not a lens.

## Tests

- A new `tests/walk.test.mjs`, pure: the walk to a target equals the path
  `shortestPaths`/`pathTo` gives for the same pair, so nothing new was
  traversed; a target with no path answers with no steps and says so; the
  provenance carries the question and the day; two calls with the same
  arguments answer the same walk.
- `tests/state.test.mjs`: `?walk=` still parses and formats exactly as it
  does today, `defaultState()` is unchanged, and a walk id that names nothing
  in this session leaves the selection alone. The existing whole-state
  comparisons must pass unedited.
- A browser test: a generated walk draws the chain madder as a walked chain
  is drawn, the card carries the provenance line, and each step still shows
  its own confidence and dispute marks.
- `tests/site.test.mjs`: `CLAUDE.md` names `src/walk.js`; no hex outside
  `:root`.
- Nothing under `data/` changed, so `--index` is byte-identical without a
  rebuild.

## Done when

- `src/walk.js` produces a walk from what `graph.js` already answers, with a
  provenance object beside it, and nothing about it reaches `data/`.
- A generated walk is drawn as a chain and says on the card that the atlas
  assembled it.
- `?walk=` has a producer and a consumer; `?why=` is still M35's and is not
  added.
- `CONTRIBUTING.md`, `ARCHITECTURE.md` and `about.html` say what a condition
  endpoint is.
- `node tools/validate.mjs --index` byte-identical; `node --test` green with
  `CHROME` set, the skipped count reported.
- `STATUS.md` records the run, states that M35 now has the three things plan
  decision 11 asked for, and carries the literal lines `I9 done` and then
  `Index cycle 2 done`.

`I9 done`

## Amendments after review

Written 6 September 2026 by an independent Fable reviewer of the plan and
the nine briefs, against `origin/briefs-index2` at `ce81e35` and `origin/m0`
at `8f51af7`, with the ten owner questions of section 5 answered as recommended
and recorded here; the owner may overrule. **These override the body where
they differ** (run protocol section 3). Line numbers are as of `8f51af7`; find the
code by name after M30b.

A0. **Gate and reading unchanged**, with one name corrected: `rankByCost` is
`src/horizon.js:65`, not `graph.js`.

A1. **Nothing writes `?walk=`.** `state.js` keeps the parameter parsed and
reserved exactly as today; this run adds no session id, no URL write and no
consumer of the parameter. The producer (`src/walk.js`), the provenance
object, the store's `setWalk(walk)` / `clearWalk()`, the chain drawn madder
and the card's line are built and tested - the browser test sets a walk
through the store - and the address of a generated walk is M35's decision
(`?why=<id>`, whose inputs *are* the walk). A URL that means nothing in
another session is a link the atlas would break; the producer is
deterministic, so its address should be its inputs.

A2. **Conditions are not placeless events.** `CONTRIBUTING.md` says an
endpoint may be a condition - a process with no point and often no end -
and that it is written like any other event; it does not cite the 229
events with `place: null` as examples, because a placeless moment is not a
condition.

A3. **Done-when restated:** `src/walk.js` produces a walk from what
`graph.js` answers, with provenance beside it; a walk set through the store
is drawn as a chain and the card says the atlas assembled it; `?walk=`
still parses and formats as today and nothing writes it; the three
documents say what a condition endpoint is; `--index` byte-identical
without a rebuild; `STATUS.md` says M35 has the producer, the provenance
and the wording, and that the URL grammar is M35's; the literal lines
`I9 done` and `Index cycle 2 done`.
