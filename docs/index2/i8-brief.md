# Build brief — I8: the two gaps the reader notices, closed by the imports

The eighth run of the second index cycle (`docs/index2-plan.md`, decision
D12; `docs/health-review-2026-09-06-result.md` §5.2.6, review B findings 17
and 28, deviations 294 and 295). Two features the health cycle built and left
with no data behind them:

- **"carnation" finds nothing.** H7 taught the search shard to fold an
  event's `names`, and **no event carries `names`** (0 files).
- **`?actor=angola` opens empty.** H7 taught the actor card to draw
  "Before and after" along `succeeded`, and **no `succeeded` relation touches
  `angola`** — nor any of the other 77 colony/state pairs.

Both are data. This cycle is code, and `CLAUDE.md`'s hardest constraint is
that no historical claim is written by the assistant — so neither gap is
filled by hand. They are filled by the two imports, which is the owner's
standing exception of 5 September and the same shape as the imported
summaries that already carry `origin: { tool }`, `review.status: "draft"` and
`review.flags: ["imported-facts"]`.

**Read**: `CLAUDE.md` (the exception, in full), `STATUS.md`,
`docs/run-protocol.md`, `docs/index2-plan.md` (D12, owner questions 3 and 4,
§6 risk 8), `docs/health-review-2026-09-06-result.md` §5.2.6, then
`tools/import/identity.mjs` (the additive rule both imports obey),
`tools/import/wikidata.mjs`, `tools/import/cshapes.mjs`,
`data/imports/cshapes-actors.json`, `src/origin.js`, `src/licensing.js`,
`src/validate/rules.js` (rules 12, 19, 28, 29), `schema/v1/relation.json`,
`src/panel/actor.js` ("Before and after"), `src/search.js`,
`tests/import-wikidata.test.mjs`, `tests/import-cshapes.test.mjs`,
`tests/licensing.test.mjs`.

## The gate

Wait for the literal line `I7 done` on `origin/m0`. Then claim `I8`.

## What this run must not do

- No new dependency; no build step beyond the committed output of a Node
  script already in `tools/`; **no network** — `tools/import/wikidata.mjs`
  has none in this sandbox and runs in
  `.github/workflows/import-wikidata.yml` on an `import/**` branch. This run
  writes and tests the tool against fixtures; the fetching is the Action's.
- **No historical claim written by the assistant.** Every record this run
  creates is written by an import from its own source, carries
  `origin: { tool }`, `review.status: "draft"` and
  `review.flags: ["imported-facts"]`, and has no hand-written summary,
  explanation or note. Nothing is signed and nobody is added to `authors`.
- **No record whose `review.status` is `reviewed` is touched**, by either
  import, for any reason — the rule `tools/import/identity.mjs` already
  states and both imports already obey.
- No existing value changed: a fill adds a field that is absent and never
  replaces one.
- No migration consumed.
- The fixtures' index rebuilt with the repository's; `node
  tools/validate.mjs --index` byte-identical at the end; `node --test` green
  with `CHROME` set.

## 1. `succeeded`, from the split table

`data/imports/cshapes-actors.json` already says which entity code is two
actors over its life and on what date the cut falls: `entries.<code>.actor`
is the colony, `entries.<code>.splits[].actor` the state after it, with
`from` the day. That is exactly a `succeeded` relation and the atlas has 77
of them latent.

`tools/import/cshapes.mjs` gains a pass that writes, for every split,
`data/relations/<colony>--<state>--succeeded.json`:

- `from` the colony's actor id, `to` the state's, `type: "succeeded"`;
- `when` the split's own `from` date, in the shape rule 15 wants;
- `sources` citing `cshapes-2-0`, which is already a source record;
- `origin: { tool: "cshapes", run }`, `review: { status: "draft", flags:
  ["imported-facts"] }`;
- no `note` beyond the one the entry already carries, copied verbatim if
  there is one — the split table's notes are the assistant's own from M27 and
  are already in the atlas.

Additive: a relation whose id already exists is **reported and left alone**,
whatever its standing, which is `identity.mjs`'s rule applied to a record
rather than a field.

**The licence.** A relation derived from CShapes is NC-derived material in
`data/relations/`, which `src/licensing.js` maps to CC BY-SA. `NC_ORIGINS` in
`src/origin.js` is already keyed on `origin.tool` and not on a directory;
`licensing.js` is keyed on the directory. This run makes them agree the way
`docs/index2-plan.md` recommends under **owner question 4**: **the NC
exception follows the origin, not the directory** — a record with
`origin.tool: "cshapes"` carries CC BY-NC-SA wherever it lives, rule 12 reads
`mayBeNonCommercial(record)` rather than a directory list, the card and the
entry page print the attribution line they already print for an actor and a
presence, and the table at the head of `data/LICENSE` and the manifest's
`licenses` block say the same thing. `tests/licensing.test.mjs` holds the
three together and must be extended, not weakened.

If the owner overrules and the exception stays per-directory, the relations
are not written and this half of the run stops with one line in `STATUS.md`;
the `names` half is independent.

## 2. `names`, from Wikidata

`tools/import/wikidata.mjs` gains a `names` fill, under
`tools/import/identity.mjs`'s rule and one clause narrower:

- it writes `names` only where the record has **none**, never adding to or
  reordering an existing list;
- only on a record whose `review.status` is `draft` — never on a `reviewed`
  one, and never on a record with no standing at all;
- the values are the item's own label and aliases in the languages the seeds
  file names, de-duplicated against `title` and against each other, folded
  the way `src/search.js` folds so the shard is not filled with the same
  string twice;
- it adds `imported-names` to `review.flags`, so the reviewer sees where the
  names came from and can clear them;
- it never touches `title`, `summary`, `when`, `place`, `actors` or
  `sources`, and never adds itself to `authors`.

That last clause and the `draft`-only rule are **owner question 3**;
`docs/index2-plan.md` recommends them and this run implements them. Whether
"Carnation Revolution" then actually appears is the Action's to say: the tool
is tested offline against a fixture item that carries the alias, and the
import itself is run by the owner on an `import/**` branch afterwards.

## 3. What a reader should see

Neither half of this run draws anything new. `src/panel/actor.js` already
draws "Before and after" along `succeeded`; `src/search.js` already folds
`names`. The browser tests are that the two features now have something to
show on the fixtures: an actor with a `succeeded` relation shows its
predecessor, and an event with `names` is found by one of them.

## Files this run touches

`tools/import/cshapes.mjs` · `tools/import/wikidata.mjs` ·
`tools/import/identity.mjs` (only if the `draft`-only clause belongs there —
it is the rule both imports obey and probably does) · `src/licensing.js` ·
`src/origin.js` · `src/validate/rules.js` (rule 12) · `data/LICENSE` ·
`data/relations/*.json` (new, drafts) · `tests/fixtures/data/`, one
`succeeded` relation and one event with `names` · `CONTRIBUTING.md` and
`about.html` if the licence line's wording changes · `data/index/` and
`tests/fixtures/data/index/`, rebuilt.

**The hand tables**: `GEOMETRY` and the directory table in
`src/licensing.js`; `NC_ORIGINS` in `src/origin.js`; rule 12's directory
check in `src/validate/rules.js`; the table at the head of `data/LICENSE`;
the manifest's `licenses` block, which `licensingTable()` writes;
`RELATION_TYPES` and the id pattern in `src/vocab.js` and
`schema/v1/relation.json`, which already carry `succeeded` and need no change
— check, do not assume.

## Tests

- `tests/import-cshapes.test.mjs`: every split in a fixture table becomes one
  `succeeded` relation with the split's date, citing `cshapes-2-0`, with
  `origin.tool: "cshapes"`, `review.status: "draft"` and the
  `imported-facts` flag; a relation that already exists is reported and not
  rewritten, including a `reviewed` one; the run is idempotent — a second
  pass writes nothing.
- `tests/import-wikidata.test.mjs`: `names` written where absent; not written
  where present; not written on a `reviewed` record; not written on a record
  with no `review.status`; `title` and every other field untouched;
  `imported-names` in `review.flags`; `authors` untouched.
- `tests/licensing.test.mjs`: a record with `origin.tool: "cshapes"` carries
  CC BY-NC-SA whatever its directory; the three statements — the module,
  `data/LICENSE`'s table and the manifest's block — still agree; a card and
  an entry page carrying such a record print the attribution line.
- `tests/rules.test.mjs`: rule 12 reads the origin and not the directory, and
  a hand-written record in `data/relations/` is still CC BY-SA.
- `tests/actor-card.test.mjs` and a browser test: an actor with a `succeeded`
  relation shows "Before and after" with the predecessor named and openable.
- `tests/search.test.mjs` / `tests/search-shard.test.mjs`: an event with
  `names` is found by one of them and its rank is what H7 decided.
- `tests/validate-cli.test.mjs`: the draft count and the warning totals move
  by exactly the number of records written, and the assertions are updated to
  say so rather than loosened.

## Done when

- Every split in `data/imports/cshapes-actors.json` has a `succeeded`
  relation, drafted by the import, cited, flagged and queued — or, if the
  owner overruled question 4, none is written and `STATUS.md` says why.
- `?actor=angola` shows "Before and after" with its predecessor.
- The Wikidata import writes `names` under the three rules above, tested
  offline on fixtures; `STATUS.md` says the Action has still to be run and by
  whom.
- No `reviewed` record was touched and nothing was signed; every record
  written carries `origin`, `review.status: "draft"` and `imported-facts`.
- The licence boundary says one thing in three places and a test holds them
  together.
- `node tools/validate.mjs --index` byte-identical, with the record counts
  and the draft count updated in every assertion that names them;
  `node --test` green with `CHROME` set.
- `STATUS.md` records the run, the number of relations written and the number
  of drafts now in the queue, and carries the literal line:

`I8 done`

## Amendments after review

Written 6 September 2026 by an independent Fable reviewer of the plan and
the nine briefs, against `origin/briefs-index2` at `ce81e35` and `origin/m0`
at `8f51af7`, with the ten owner questions of section 5 answered as recommended
and recorded here; the owner may overrule. **These override the body where
they differ** (run protocol section 3). Line numbers are as of `8f51af7`; find the
code by name after M30b.

A0. **Gate and reading unchanged.**

A1. **The relation's `when` is stated:** `{ start: <year of split.from>,
end: <the same year>, date: "<split.from>" }` - a succession is a moment -
checked against rule 15 before the first record is written. The count is
checked, not assumed: `origin/m0` has 79 entries carrying `splits`.

A2. **The entry's `note` is always copied** when there is one, verbatim,
because it is where the split table says a cut is doubtful (Cuba: the split
date is earlier than the state's independence). The reviewer may retract a
draft relation and write a CC BY-SA one from another source; the brief's
`STATUS.md` line says so.

A3. **The three places the licence changes:** `KIND.relation.licenses`
gains `'CC-BY-NC-SA-4.0'` (`src/kinds.js:196`); rule 12's clause `r.kind ===
'actor'` (`src/validate/rules.js:926`) becomes "any kind whose licences
include an NC licence, and only where `mayBeNonCommercial(r)`"; the table
at the head of `data/LICENSE`. `licensingTable()` follows the registry and
`tests/licensing.test.mjs` holds the three together. A relation has no
card: the actor card and the entry page print the attribution line once
when any relation they draw is NC-licensed.

A4. **The `names` fill is a new helper**, not `namesFor` (which folds labels
and article titles and not the item's aliases, `wikidata.mjs:460-470`):
labels and aliases in `LANGUAGES` (`wikidata.mjs:68`, a constant), folded
with `foldName`, deduplicated against `title` and each other, and **no
`names` key written when the list is empty** - rule 18 refuses an empty
list.
