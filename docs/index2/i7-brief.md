# Build brief — I7: `tools/migrate-ids.mjs`, and a former id that keeps resolving

The seventh run of the second index cycle (`docs/index2-plan.md`, decision
D11; `docs/health-review-2026-09-06-result.md` §5.2.5, review A finding 21).
Plan decision 3 chose derived ids **and** a rename tool; H5a shipped the
safety net — every reference resolves through `aliases` — and the tool was
never written. `tools/migrate/` holds `apply.mjs` and nothing else. Until it
exists a slug can only be corrected by hand across every record that names
it, and M31's ten `allied-with` re-typings and every future correction of a
misspelt id are waiting on it.

**Read**: `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`,
`docs/index2-plan.md` (D11, §6 risk 7),
`docs/health-review-2026-09-06-result.md` §5.2.5, then
`tools/migrate-places.mjs` (the one-off-tool house pattern: run once, kept as
documentation, tested on a scratch copy), `tools/migrate/apply.mjs`,
`tools/lib/read.mjs`, `tools/bundle-to-files.mjs` (the slug check before any
path is built), `src/validate/rules.js` (`resolveId`, `aliasIndex`, rules 2,
3, 11, 20), `src/vocab.js` (`edgeId` and the id patterns), `src/kinds.js`,
`schema/common/provenance.json` (`aliases`, `supersededBy`,
`review.citations`), `tests/aliases.test.mjs`, `tests/led-to-tenures.test.mjs`
(the scratch-copy test pattern).

## The gate

Wait for the literal line `I6 done` on `origin/m0`. Then claim `I7`.

## What this run must not do

- No new dependency; no build step beyond the committed output of a Node
  script already in `tools/`.
- **No historical claim.** A rename changes what a record is filed under and
  nothing about what it says. Not a word of `title`, `summary`,
  `explanation`, `note` or `label` is edited.
- **No record renamed in this run.** The tool is written and tested on a
  scratch copy of the fixtures; the repository's own records are not renamed
  here. The owner and M31 decide what to rename and when.
- No `reviewed` record's `review` block is touched — the signature, the
  `signedBy`, the `flags` and the `citations` audit trail all survive a
  rename unchanged, because a rename is not a change of content.
- No migration consumed: this is a tool a person runs, not a step on
  `src/validate/migrate.js`'s chain. A chain step is one record in, one
  record out, re-applied on every read for ever; a rename is a change of file
  name and record count and cannot be that (M30a amendment A1 said the same
  of the `led` re-filing).
- `node tools/validate.mjs --index` byte-identical at the end (nothing under
  `data/` changes in this run); `node --test` green with `CHROME` set.

## 1. What the tool does

```
node tools/migrate-ids.mjs <kind>/<old-id> <new-id> [--data <dir>] [--dry-run]
```

1. **Refuses before it writes anything**, and says which: the new id is not a
   valid slug for that kind's pattern (`src/vocab.js`, and the same check
   `bundle-to-files.mjs` makes before it builds a path); the new id already
   exists as an id or as an alias of anything (rule 2 keeps both unique); the
   old id does not exist; the record is a tombstone (rename the record that
   superseded it instead).
2. **Renames the file**, sets `id` to the new one, and **appends the old id
   to `aliases`** — that is the whole of "a former id keeps resolving", and
   `resolveId` and `resolve()` already walk it.
3. **Rewrites every reference**, in every record of every kind. The full list,
   because a field left out is a dangling reference the validator will find
   and a reader will not:
   - event: `place`, `actors[].actor`, `parent`, `sources[].source`,
     `supersededBy`;
   - edge: `from`, `to`, `sources[].source`, `dispute.sources[].source`,
     `supersededBy`;
   - relation: `from`, `to`, `sources[].source`, `supersededBy`;
   - office: `of`; tenure: `person`, `office`, `startedBy`,
     `sources[].source`;
   - narrative: `steps[].ref`, `sources[].source`;
   - presence: `actor`, `dependencyOf`, `sources[].source`;
   - every kind: `supersededBy`, and `review.citations`'s **keys**, which are
     source ids (the schema says so, and rule 3 checks them);
   - `data/imports/cshapes-actors.json` and any other file under
     `data/imports/` whose values are actor ids, through `tools/lib/read.mjs`,
     which is where all filesystem access for the tools lives.
4. **Carries the cascade.** An edge's id is `from--to--type` and a relation's
   is `from--to--type`, so renaming an event renames every edge that touches
   it and renaming an actor renames every relation at either end. Each such
   record is renamed too, **its own old id appended to its own `aliases`**, and
   every reference to *it* rewritten in the same pass — narrative steps and
   `review.citations` keys included. The pass repeats until nothing changes,
   which terminates because an id is only ever rewritten once.
5. **Writes `revised`** to the day of the run on every file it rewrites,
   because the file changed and `?v=<revised>` is what tells a cache so. It
   writes nothing else: no `origin`, no `authors`, no `review` field.
6. **Rebuilds the index and validates**, and reports: the records renamed,
   the references rewritten by kind, and the validator's verdict. `--dry-run`
   prints all of that and writes nothing.

## 2. What holds it together

The tool is a thin shell over a **pure** half — the same division
`tools/import/cshapes.mjs` has with `topojson.mjs` and
`tools/migrate/led-to-tenures.mjs` has: `renamePlan(records, kind, oldId,
newId)` returns the renames and the rewrites as data, and the shell writes
them. The pure half is what the tests hold.

The list of reference fields is a **table**, not an if-chain, and it lives
beside `src/kinds.js`'s registry so that a tenth kind adds a row rather than
a branch — the third of the owner's considerations, and the one thing that
makes this tool survive M30–M35.

## Files this run touches

`tools/migrate-ids.mjs` (new) · `tools/lib/rename.mjs` or an exported pure
half inside the tool, whichever leaves the file readable (new) ·
`src/kinds.js` or a leaf module beside it for the reference-field table ·
`CLAUDE.md` (the layout tree names both) · `CONTRIBUTING.md` ("Correcting an
id", beside "Correcting a territory") · `ARCHITECTURE.md` (the ids section:
the tool exists, and a former id resolves through `aliases`) ·
`tests/fixtures/data/` **untouched**; the test builds a scratch copy.

## Tests

A new `tests/migrate-ids.test.mjs`, built the way
`tests/led-to-tenures.test.mjs` is — a scratch copy of the fixtures, the tool
run over it, the result asserted:

- renaming an event rewrites every reference to it and leaves the record's
  own text byte-identical but for `id`, `aliases` and `revised`;
- **the old id still resolves**: `resolveId(old, universe)` answers the
  renamed record, `atlas.resolve(old)` does the same in the browser, and a
  narrative step and a `review.citations` key that named the old id both
  still validate;
- the cascade: renaming an event renames the edges that touch it, each with
  its own old id as an alias, and a `?chain=` link built from the old edge
  ids still walks (`src/chain.js` through `resolve`);
- renaming an actor renames the relations at either end and the presences
  that name it;
- a `reviewed` record keeps `review.status`, `signedBy`, `flags` and
  `citations` across a rename;
- every refusal in §1.1, each with the message it prints and nothing written;
- `--dry-run` writes nothing and prints the same plan;
- after the run, `node tools/validate.mjs` over the scratch copy is green
  with the same warning count it had before, and `--index` is fresh.

## Done when

- `node tools/migrate-ids.mjs event/<old> <new>` renames the record, rewrites
  every reference, carries the derived-id cascade, rebuilds the index and
  validates — on a scratch copy, in a test.
- A former id resolves in the validator and in the browser, and an old
  narrative step and an old `?chain=` link still walk; each has a test.
- The reference-field list is a table beside the registry, and a test asserts
  it covers every kind in `KINDS` and every id-shaped field in the schemas.
- Nothing under `data/` changed: `node tools/validate.mjs --index`
  byte-identical; `node --test` green with `CHROME` set.
- `CONTRIBUTING.md` tells a contributor what to do when an id is wrong, and
  `ARCHITECTURE.md` says the tool exists.
- `STATUS.md` records the run and notes that M31's ten `allied-with`
  re-typings and any pending rename are now unblocked, and carries the
  literal line:

`I7 done`

## Amendments after review

Written 6 September 2026 by an independent Fable reviewer of the plan and
the nine briefs, against `origin/briefs-index2` at `ce81e35` and `origin/m0`
at `8f51af7`, with the ten owner questions of section 5 answered as recommended
and recorded here; the owner may overrule. **These override the body where
they differ** (run protocol section 3). Line numbers are as of `8f51af7`; find the
code by name after M30b.

A0. **Gate and reading unchanged.** `tools/migrate/` holds `apply.mjs` and
`led-to-tenures.mjs` (M30a-2); the new tool is `tools/migrate/ids.mjs`
beside them and `CLAUDE.md` names it there.

A1. **A renamed record keeps its history.** `tools/lib/history.mjs:70-81`
filters `--diff-filter=AM` under git's default rename detection, so the
rename commit is `R` and dropped, and `pathOf` (`:147`) looks up the new
path only: a renamed record falls to `from: 'revised'`. `recordHistories`
also asks for `<kind dir>/<alias>.json` for every alias of the record and
merges those states before the current path's. A test on a scratch clone
with two commits: the versions before the rename are still listed after it.

A2. **Import-owned records are refused.** A record whose `origin.tool` is in
`IMPORT_TOOLS` is not renamed; the tool prints that a territory or an
imported item is corrected in `data/imports/` and by a re-run (`CLAUDE.md`,
"Correcting a territory"). Reason: a CShapes actor's presences are
`<actor>-<year>` and the next `--import` re-derives both from the map. A
test per refusal.

A3. **`data/imports/wikidata-seeds.json` is on the rewrite list** with
`cshapes-actors.json`: its items may name atlas ids. Reading goes through
`tools/lib/read.mjs` (`readImportMaps`); writing back is the tool's, with
the same canonical serialisation the file has.
