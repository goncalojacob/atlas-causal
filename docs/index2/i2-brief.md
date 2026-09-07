# Build brief — I2: every record a row over an id table

The second run of the second index cycle (`docs/index2-plan.md`, decision
D3). The spine stops being nine lists of objects and becomes nine lists of
**positional rows** over one shared table of ids, with the closed
vocabularies as integers. Measured on the built index: **50.0 KB raw against
530.2 KB** on the real data and **1,810.6 KB against 9,475.1 KB** at 10⁴ for
the same information — 10.6× and 5.2×. gzip already hid most of it over the
wire; what this buys is `JSON.parse` and heap, which is where the wall is.

The edge tuple has been a positional row since H3a and
`edgeFromSpine`/`edgeInSpine` read it both ways. This is that idea applied to
the other eight kinds, in one place instead of nine.

**Read**: `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`,
`docs/index2-plan.md` (§0's per-record figures, D3, §4),
`docs/index2/i1-brief.md` and what I1 left behind, then
`src/validate/core.js` (`buildSpine`, `spineEntry`, `envelopeOf`,
`edgeInSpine`, `TOMBSTONE_KEYS`), `src/data.js` (`topologyFromSpine`,
`edgeFromSpine`, `createAtlas`), `src/kinds.js`, `src/vocab.js`,
`tools/build-index.mjs` (`canonical`, `compact`, `hashOf`),
`tests/spine.test.mjs`, `tests/spine-loader.test.mjs`.

## The gate

Wait for the literal line `I1 done` on `origin/m0`, per run protocol §1.
Then claim `I2`.

## What this run must not do

- No new dependency and no build step beyond the committed output of a Node
  script already in `tools/`.
- No historical claim; no record under `data/` touched except `data/index/`.
- No `reviewed` record touched.
- No migration consumed; `tools/migrate/apply.mjs` not run.
- **No binary format.** The index stays JSON, readable in a diff and parsed
  by `JSON.parse`. A row is an array; an absent value is `null` or a trailing
  slot that is not there.
- **No field dropped.** This run changes the encoding and nothing else. If a
  field is not worth carrying, that is I3's question and not this one's.
- The fixtures' index rebuilt with the repository's, in the same commit;
  `node tools/validate.mjs --index` byte-identical at the end; `node --test`
  green with `CHROME` set.

## 1. The encoding

The core file gains three things beside the nine lists:

- **`ids`** — every record id and every id referenced, once, as strings.
  Order is fixed and is the whole of the file's determinism: the kinds in
  `src/kinds.js` registry order, the records within a kind in id order (which
  `buildTopology` already sorts by), then any id first *referenced* and not
  yet listed, appended in the order it is met. An integer everywhere else in
  the file is an index into this table.
- **`vocab`** — the closed vocabularies whose values repeat once per record:
  edge `type`, `confidence`, record `status`, `actorType`, `region` (the lane
  ids, from `regions.json`), office `category`, relation `type`, `scope`.
  Each is a list of strings; a value is its index, `-1` for absent. The lists
  come from `src/vocab.js` and `src/kinds.js` and never from what the data
  happens to contain, so two datasets with different records still produce
  the same table for the same code.
- **`columns`** — for each kind, the names of that kind's slots in order.
  It is written into the file rather than assumed, so the file says what it
  is and a reader that is one generation behind can say so precisely.

A row is `[…slots]` with trailing `null`s trimmed: a short row means "the
rest are absent", which is what puts `parent`, `scope`, `category` and
`subtreeWeight` back to costing nothing on the events that have none.
A tombstone keeps the same slots `TOMBSTONE_KEYS` allowed, the others `null`.

`aliases` and `supersededBy` are the merge hop `resolve()` walks and are on
every record whatever its kind; they move out of the per-kind rows into one
**`merges`** list — `[alias, id]` and `[id, supersededBy]` pairs, both as
integers where the target is a known id — so nine kinds do not each carry two
empty slots per record. On the real data `aliases: []` and
`supersededBy: null` are on all 1,703 spine entries.

## 2. Where the encoder lives

One encoder and one decoder, not nine of each:

- `src/validate/core.js`: `SPINE_COLUMNS`, a table of `kind → [slot names]`,
  and `buildSpine(topology)` becomes a loop over it that reads each slot off
  the topology entry through a small per-slot accessor table. The nine
  hand-written object literals go.
- `src/data.js`: `topologyFromSpine(spine)` becomes the inverse loop, reading
  `spine.columns` rather than a copy of the table, so a file that names its
  own columns is decoded by name and a file with an unknown column is refused
  by name. `edgeFromSpine` folds into it; its "an object when the id is not
  derived" case becomes a slot for the explicit id, which is `null` on every
  edge whose id is `from--to--type`.

A tenth kind is then a row in `SPINE_COLUMNS` and nothing else — which is
what the third of the owner's considerations asks for, and what
`ARCHITECTURE.md` should say after this run.

## 3. The version

`manifest.schema` becomes **3** and the spine file carries the same number.
`src/data.js`'s guard from I1 is extended: a file whose generation is known
is decoded, one that is not throws with both numbers.

## Files this run touches

`src/validate/core.js` · `src/data.js` · `tools/build-index.mjs` (the
manifest's `schema`, nothing else) · `ARCHITECTURE.md` ("Index and
manifest", the two spine tables, the sentence about `when` carried verbatim
— still true, it is a slot) · `CLAUDE.md` (the `data/index/spine-<hash>` line
in the layout tree) · `data/index/` and `tests/fixtures/data/index/`,
rebuilt.

**The hand tables**: `SPINE_COLUMNS` and the accessor table in
`src/validate/core.js`; the vocabulary lists it takes from `src/vocab.js`
and `src/kinds.js`; `TOMBSTONE_KEYS`, which becomes a per-kind slot mask;
the allowed-key table in `tests/spine.test.mjs`; the fixture manifest's
`schema` in `tests/build-index.test.mjs`.

## Tests

- **`tests/spine-loader.test.mjs` is the whole safety net and is not edited.**
  An atlas built from the file and an atlas built from `buildTopology`'s own
  output in memory are the same atlas: the same maps, the same keys, the same
  order, the same `extent`, the same adjacency. If this passes, the encoding
  dropped nothing.
- `tests/spine.test.mjs`: a round trip — `topologyFromSpine(buildSpine(t))`
  deep-equals `t` for every kind, over the fixtures and over the repository;
  a trailing-`null` row decodes to the same record as a full one; an unknown
  column name is refused with that name in the message; `ids` and `vocab` are
  in the defined order and a second build produces the same integers.
- `tests/build-index.test.mjs`: two builds byte-identical; a reordering of
  the source records' keys does not change the bytes (the test that already
  exists); `manifest.schema` is 3.
- `tests/graph.test.mjs`, `tests/horizon.test.mjs`, `tests/lens.test.mjs`,
  the card suites and the browser suites: **unchanged**, and green. They are
  the second proof.
- `tests/prerender.test.mjs` and `--index`: the prerendered pages
  byte-identical to the committed files.
- A size assertion, not a time assertion: the built spine over the fixtures
  is smaller than the same information as objects, and the number is printed.
  No wall-clock gate (the picker test's lesson, R3).

## Done when

- The spine is rows over an id table with the vocabularies as integers, and
  `buildSpine` reads one column table instead of nine literals.
- `tests/spine-loader.test.mjs` passes unedited.
- The built spine on the real data is **under 60 KB raw**, and at 10⁴ — the
  bench dataset, built with `node tools/build-index.mjs --data <dir>` —
  **under 2.0 MB raw and 320 KB gzipped**; both numbers in `STATUS.md`.
- `manifest.schema` is 3; an unknown generation throws.
- `node tools/validate.mjs --index` byte-identical, prerendered pages
  unchanged; `node --test` green with `CHROME` set.
- `STATUS.md` records the run, and carries the literal line:

`I2 done`

## Amendments after review

Written 6 September 2026 by an independent Fable reviewer of the plan and
the nine briefs, against `origin/briefs-index2` at `ce81e35` and `origin/m0`
at `8f51af7`, with the ten owner questions of section 5 answered as recommended
and recorded here; the owner may overrule. **These override the body where
they differ** (run protocol section 3). Line numbers are as of `8f51af7`; find the
code by name after M30b.

A0. **Gate and reading unchanged**, plus I1's amendments.

A1. **The byte targets are the plan's two rows added together**, because
this run drops no field: the built spine on the real data under **175 KB
raw** and at 10^4 under **4.3 MB raw / 460 KB gzipped**. The 60 KB and
2.0 MB figures are I3's core and I4's gate, not this run's.

A2. **The nine literals become the oracle, not a deletion.** The first
commit moves the object literals of `buildSpine`
(`src/validate/core.js:668-755`) into `tests/spine.test.mjs` as
`projectV1(topology)`, unchanged, tombstones through `spineEntry`; the
round-trip test is `topologyFromSpine(buildSpine(t))` deep-equals
`projectV1(t)` per kind, over the fixtures and the repository. "Deep-equals
`t`" in the body is wrong: the topology carries `regionMethod`,
`presenceType`, the sources and their citations, and trims nothing.

A3. **`tests/spine-loader.test.mjs` is edited at one line**, `:227`, the
generation number; nothing else in it changes. It is a surface test (keys,
order, `extent`, `resolve`, `citationCount`, a search result) and A2 is the
deep one.

A4. **Vocabularies in the file, from three sources.** The decoder reads
`spine.vocab` and never a copy. At build time a closed-in-code list comes
from `src/vocab.js` / `src/kinds.js` in that order; a data-defined list
(`region` from `regions.json`, an event's `category` from
`categories.json`) in the data file's order; a value met in a record that is
in no list is appended in first-seen order, which is deterministic because
the records are in id order. An event's `category` is a vocabulary slot; a
test round-trips a record with a category the file does not list.

A5. **Absent and `null` are decided per slot.** `SPINE_COLUMNS` says for
every slot what a trimmed or `null` slot decodes to - `null` for `place`,
`supersededBy`, `note`, `startedBy`, `capital`, `dependencyOf`,
`dependencyKind`, `when` on an office; **no key** for `parent`, `scope`,
`category`, `subtreeWeight`, `wikidata`, `wikipedia` - so A2's oracle holds
without the run discovering the rule by failing.

A6. **Seventeen entries carry `supersededBy`** on the real data (the body
says none); the merges list carries them and the whole-object edge of
`edgeInSpine` folds into it, as the body says.
