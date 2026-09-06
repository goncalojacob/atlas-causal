# Build brief — M32b: the roles applied, and the categories assigned

Written 6 September 2026 from `docs/plan-2026-09-05.md` (decisions 7 and 13),
`docs/review-2026-09-05-plan.md` (findings 20 and 30) and `docs/roles-mapping.md`,
the table of 163 role strings the owner approved on 5 September (M32a). M30a-3
put both vocabularies in data — `data/roles.json` with the owner's 31 roles and
`data/categories.json` with the twelve kinds of event — and made a role or a
category outside them a **warning**. This is the run that applies them: a
one-off tool re-files every actor line in the corpus onto the 31, keeping what
the old free-text role said as the `note` beside it; `role-unknown` becomes
rule 25, an error; the contribution form's role box stops being free text; and
a second tool gives an event a `category` wherever the mapping is mechanical,
with `category-unknown` staying a warning because most of the corpus will
still have none. It changes what records *say about themselves* and asserts
nothing new about the past: no summary, no date, no edge and no source is
touched. The run follows `docs/run-protocol.md` in full — the gate, the claim,
a push after every commit, validator and tests green at every commit.

## 0. The gate and the reading

The gate line is the literal **`M31 done`** on `origin/m0` (run protocol §1;
§8 gates the second run on the first). It waits for M31 and not for M30b
because M31 writes tenures and reinstates elections, and an election
reinstated after this run would carry role strings nothing had re-filed.

Read: `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`,
`docs/plan-2026-09-05.md` (decisions 7 and 13), `docs/review-2026-09-05-plan.md`
(findings 20, 21, 30), **`docs/roles-mapping.md` in full — it is the owner's
approval and the only authority for the mapping**, `docs/m30a-brief.md`
including its amendments A8, A9, A16 and A17, `docs/m30b-brief.md` including
A16 (which may already have given the form a datalist of roles — §3 checks),
and this file. Then the code: `src/validate/rules.js` (`normalizeRole`, the
`role-unknown` and `category-unknown` warnings, and how an `error(n, …)` is
raised), `src/vocab.js`, `data/roles.json`, `data/categories.json`,
`src/kinds.js`, `src/contribute/bundle.js` (the actor row and its `note`),
`src/contribute/form.js` (the role input at about line 335),
`tools/migrate/led-to-tenures.mjs` and `tests/led-to-tenures.test.mjs` — the
model for a one-off data tool and its test — `tools/migrate-places.mjs`,
`data/imports/wikidata-seeds.json` → `classes`, and `tools/lib/read.mjs`.

Before writing anything, run `node tools/validate.mjs` and `node --test` and
record the numbers. As this brief was written: **1737 records, 0 errors, 1157
warnings**, of which 114 are `role-unknown`; **137 active events**, 133 of them
naming actors; **349 actor lines** in the corpus across all 329 event records;
**163 distinct role strings**, of which 21 are already ids in `data/roles.json`
and 142 are not — which is where `STATUS.md`'s "142 distinct strings" comes
from; and **no event carries a `category` at all**.

## 1. `tools/migrate/roles.mjs`

A one-off tool in the spirit of `tools/migrate/led-to-tenures.mjs`: run once,
kept in the tree as documentation of how the corpus was re-filed, idempotent,
and taking `--data <dir>` and `--dry-run` so it can be tested on a scratch
copy of the fixtures. It is **not** a step of `src/validate/migrate.js`'s
chain: a chain step is re-applied on every read for ever, and a table of 163
historical phrases is not something the reader should carry around in memory
in 2030. `CLAUDE.md`'s layout tree names it in the same commit that adds it,
or `tests/site.test.mjs` fails.

What it does, to every event record in `data/`:

```
{ "actor": "cavaco-silva", "role": "came first and led the government" }
→ { "actor": "cavaco-silva", "role": "head-of-government",
    "note": "came first and led the government" }
```

- **The lookup is on `normalizeRole(role)`** — `trim().toLowerCase()` with
  runs of whitespace collapsed — because that is the key the validator
  compares against, and the corpus already contains strings that differ only
  in case ("won 106 of 163 seats in the Chamber").
- A role already equal to one of the 31 ids is left alone and gains no note.
  Twenty-one of the 163 are in that state.
- A role whose mapping row's *Note kept* column is `—` gains **no** `note`
  key: 31 of the 163 rows, and the note is omitted rather than written empty.
  The other 132 rows carry a note; over the corpus that is **184 of the 349
  actor lines**.
- An actor line that already carries a `note` — none does today, but M31 or a
  contribution may have written one — is **left alone entirely** and reported.
  The tool never overwrites a note a person wrote.
- It runs over **every** event, active, merged and retracted alike. A
  tombstone's roles are part of the record's claim and leaving 163 strings
  alive in the tree behind a closed vocabulary is exactly the state this run
  exists to end.
- `revised` becomes the day of the run on every file it changes. It adds **no
  author and changes no `origin`**: re-filing a phrase is not authorship, and
  `tools/import/identity.mjs` is the house rule for a tool that touches a
  record somebody else wrote. `review.status`, `review.flags` and
  `review.note` are untouched, so nothing leaves or joins the review queue.

**Where the table lives: in the tool, at the top of the file, as
`led-to-tenures.mjs` keeps its two judgement tables.** Not in `data/`. The
reason is that `data/roles.json` is the vocabulary — a live list somebody
edits in a pull request — whereas this is a one-time correspondence between
163 phrases that were written in September 2026 and the list that replaced
them. Putting it in `data/` would say the atlas expects to keep translating
free text into roles, which is the thing rule 25 is about to make impossible.
The owner's authority over it is preserved a better way: **a test parses
`docs/roles-mapping.md` and asserts that the tool's table is exactly that
table** — same 163 keys, same targets, same notes — so the approved document
and the code cannot drift, and changing the mapping means changing the
document the owner signed.

Two facts about the mapping, verified against the corpus while this brief was
written and worth re-verifying rather than trusting: every one of the 163
distinct strings in use has a row, no row matches nothing, and every target is
an id in `data/roles.json`. Two of the 31 roles are the target of no row —
`minister`, which `docs/roles-mapping.md` says outright is there for events
that do not exist yet, and `institution`. Report both; do not remove either.

## 2. Rule 25

`role-unknown` becomes an error. Rule 25 was reserved for this run by M30a
amendment A9 and is free.

- **Scope: active events only**, which is exactly the scope of the warning it
  replaces (`rules.js` skips `r.status !== 'active'`). A tombstone written
  before the vocabulary closed is a record of what the atlas used to say, and
  turning it into a hard error would mean either editing history or refusing
  to validate it. §1 re-files them anyway, so after this run no record carries
  a string outside the list — but the rule does not depend on that and a
  future contribution's tombstone will not break the build.
- **One error per record, naming the roles**, in the shape the warning already
  uses. Not one per line: a reviewer opens the record once, and deviation 346
  settled the same question for the warning.
- The vocabulary is still read from the topology (`rolesAllowed`) and an
  **absent** `data/roles.json` still means no check at all, never an empty
  closed set — a fork with no vocabulary is not a fork whose every record is
  wrong (amendment A8). Rule 25 must keep that property and a test must say
  so; it is the one thing easiest to lose when a warning becomes an error.
- `category-unknown` **stays a warning** (§4).
- `ARCHITECTURE.md`'s invariants section: rule 25 moves out of the warnings
  paragraph and into the numbered list, and the sentence saying both are
  warnings "until M32b applies the mappings" is corrected rather than deleted.
  `docs/roles-mapping.md` gains one line at the top saying when it was
  applied and by what.

## 3. The form's role input

`src/contribute/form.js` draws the role as a free-text `<input>` with a
placeholder. M30b's amendment A16 may already have given it a `datalist` of
`rolesAllowed`; **check the gate commit before writing anything**, and write
only what is missing.

A datalist is a suggestion and rule 25 is now a refusal, so the input becomes
a **closed list**: a `<select>` filled from the manifest's `rolesAllowed`,
with each option's label from the vocabulary and its `title` from the
description, an empty first option so an unfilled row still reports at
`/actors/<i>/role` as it does today, and the free-text box demoted to the
`note` beside it — which is where the phrase the drafting runs wrote now
lives, and is the whole point of the pair. Every label and description from
`data/` goes through `esc()`: data from `data/` is untrusted input.

The review editor is generic over `FIELDS` and `ACTOR_LISTS` and needs
nothing of its own; confirm that rather than assuming it. `src/contribute/bundle.js`
already carries `note` on the actor row (deviation 343), so the bundle needs
no change — confirm that too, including the round-trip byte-identity test.

## 4. The category pass, and what "mechanical" means

Plan decision 13. No event carries a category today, and M30b deferred the
map glyphs to after this run (its amendment A2) precisely because twelve
toggles over an empty field would match nothing.

A second one-off tool, `tools/migrate/categories.mjs`, same shape and same
rules as §1: idempotent, `--data`/`--dry-run`, tested on the fixtures, named
in `CLAUDE.md`.

**Mechanical means: the category is read off a table the owner already
approved, matched on a string the record did not choose for itself.** In
practice there is exactly one such table and one such string:

> `data/imports/wikidata-seeds.json` → `classes` carries, for 50 of its 67
> event classes, an English `label` and the `category` M30a-3 assigned it
> under amendment A17. An imported event's `title` is the source's own label
> for the item. So: for each class with a `category`, longest label first,
> case-insensitively, if the event's `title` contains that label as a whole
> phrase, the event's category is that class's category.

That is mechanical in the sense that matters — the correspondence is a table
somebody signed, the input is a string the atlas copied rather than composed,
and the result is reproducible by re-running the tool. Measured over the
corpus as this brief was written it reaches **192 of the 329 events, 62 of
the 137 active ones**: 159 `election`, 14 `disaster`, 7 `death`, 6 `war`, 6
`treaty`.

Three hard constraints on the tool:

- **It never writes `other`.** `other` is a person's judgement that nothing
  in the list fits, not a fallback for a tool that could not decide. An event
  it cannot place gets no `category` key at all, which is legal and which
  `category-unknown` — a warning about a category *outside* the list, not
  about an absent one — says nothing about.
- **It never overwrites a `category` a record already carries**, whether an
  import wrote it or a person did.
- **It writes nothing else**: not `parent`, not `scope`, not a summary, not
  `revised` on a file it did not change.

**What is left for a person.** The table misses 137 of the 329 records, and
75 of the 137 active ones; 66 of those 75 are the assistant-drafted
Portuguese core, and they are unreachable for a good reason: their titles are
idiomatic rather than
descriptive — the Carnation Revolution is titled "25 April", the 1975 coup
attempt "25 November", `fiftieth-anniversary-25-april-2024` "Fifty years of 25
April". No pattern over a hand-written title is mechanical; it is a guess
dressed as a rule, and a guess that fires on a title is exactly the failure
mode this project cares about. So the tool leaves them, and the run leaves
them: `category` stays absent, `category-unknown` stays a warning, and the
list of what is uncategorised goes into `STATUS.md` — as a count, with the
active ones named, capped at a readable length and with the total given.

The run may *not* close the four groups M30a amendment A17 left open, which
are open because the answer is a judgement and not a synonym: the three
**referendums** (Q43109, Q2515494, Q126723767 — a vote that fills no office
and no chamber, so `election`'s own description in `data/categories.json` does
not cover it), the nine **violent crimes** (Q53706, Q806824, Q2334719,
Q5711091, Q365680, Q891854, Q2223653, Q3199915, Q81672 — `death` fits a
killing and not a robbery or an attempt), the four **empty classes** (Q1190554,
Q1656682, Q13418847, Q3454916, which say nothing about what a thing was) and
**Q102100590**, a NATO operation. They stay uncategorised in the class table
and in the data, and this run repeats them in `STATUS.md` as the owner's.

## 5. What a run may decide, and what it must list

**May decide, and record as a deviation:** where the mapping table lives and
what the test that pins it to `docs/roles-mapping.md` asserts; the exact
wording of rule 25's message; whether the form's closed list is a `<select>`
or a constrained input, as long as a role outside the list cannot be
submitted; the order and shape of the two tools' output; whether the two runs
of §8 are two or, if the first proves smaller than expected, one.

**Must list in `STATUS.md` and must not guess:**

1. Any role string in the corpus with no row in `docs/roles-mapping.md` — the
   count should be zero, and if it is not, the strings are M31's or a
   contribution's and the owner decides where they go. **The tool refuses an
   unmapped role rather than inventing a target**, in the same way the
   Wikidata import refuses an item of a class nobody has decided about.
2. The two roles that are the target of no row (`minister`, `institution`).
3. Every event left without a category: the count, and the active ones by id.
4. A17's four groups, unchanged.
5. Any actor line whose `note` was already filled and was therefore skipped.
6. Anything in `docs/roles-mapping.md` that reads wrong once applied — the
   document is the owner's and this run does not edit its mapping, only
   reports.

## 6. Tests

- **New: `tests/roles-migrate.test.mjs`**, on the model of
  `tests/led-to-tenures.test.mjs`: the tool's table equals
  `docs/roles-mapping.md` row for row; a mapped line gains the right role and
  the right note; a line whose note column is a dash gains no `note` key; a
  line already carrying a note is untouched; a role already in the vocabulary
  is left alone; an unmapped role is refused, not guessed; running the tool
  twice changes nothing the second time; and a scratch copy of the fixtures
  run through it still validates.
- **New: `tests/categories-migrate.test.mjs`** — the class-label bridge, the
  longest-label-wins rule, `other` never written, an existing category never
  overwritten, idempotence, and the fixtures still valid afterwards.
- `tests/event-fields.test.mjs` — its `role-unknown` case becomes rule 25's
  error case; its `category-unknown` cases are unchanged; **its "a dataset
  with no vocabulary is not a dataset whose every role is wrong" case is the
  one that matters most** and must be extended to the error, not just kept;
  and "the 31 roles are the list the owner approved" still holds.
- `tests/rules.test.mjs` and `tests/validate-cli.test.mjs` — the fixture
  warning totals move, because the fixtures have no `data/roles.json` and so
  fire neither the warning nor the error. Confirm the totals rather than
  editing them to fit.
- `tests/build-index.test.mjs` — line 155 asserts
  `notDeepEqual(real.roles, real.rolesAllowed.map(r => r.id))`, that the roles
  *in use* are not the vocabulary itself. After this run the roles in use are
  a subset of the vocabulary (29 of 31 by the mapping's targets), so the
  assertion still holds but for a different reason than the one its comment
  gives. **Update the comment, do not weaken the assertion**, and say so as a
  deviation.
- `tests/bundle.test.mjs` — the round-trip byte-identity test, which is what
  stops the form deleting a `note` it can now see.
- `tests/contribute-browser.test.mjs` and `tests/review-browser.test.mjs` —
  the closed role list in both pages, with `CHROME` set.
- `tests/import-seeds.test.mjs` — `checkImportSeeds` and the class table's
  `category` column, unchanged by this run and confirming it.
- `tests/site.test.mjs` — both new tools named in `CLAUDE.md`'s layout tree.

Then `node tools/build-index.mjs`, `node tools/validate.mjs` with zero errors,
`node tools/validate.mjs --index` byte-identical, `node --test` green with
`CHROME` set and the skipped count reported. As in M31, **a record's history
cannot be right in the commit that adds or changes it** (deviation 328): the
data commit and the `data/index/` regeneration are two commits, and rule 16 is
momentarily false between them.

## 7. Documents

`ARCHITECTURE.md`: rule 25 in the invariants list, the "Vocabularies in data"
section corrected where it says both are warnings until M32b, and the
warnings paragraph losing `role-unknown`. `CLAUDE.md`: the data-model
paragraph that says a role outside the list is a warning "until M32b applies
the mappings and turns the first into an error" becomes the present tense, and
the layout tree gains both tools. `CONTRIBUTING.md`: how to write an actor
line now — a role from the list and the phrase beside it — and that a role
this atlas does not have is a pull request against `data/roles.json`, never a
string in an event. `docs/roles-mapping.md` gains one line at the top saying
it was applied. `about.html` needs nothing: a reader sees roles and not a
vocabulary.

## 8. The two runs, gated

- **M32b-1 — the roles.** Gate: `M31 done`. §1, §2, §3, the two roles tests
  of §6, the index, the documents of §7 that concern roles. Done line
  **`M32b-1 done`**.
- **M32b-2 — the categories.** Gate: `M32b-1 done`. §4, its test, the index,
  and the `STATUS.md` list of what has no category. Done lines
  **`M32b-2 done`** and then, on its own line, **`M32b done`**.

They are split because the first changes every event record in the corpus and
turns a warning into an error in the same run, and because the second is
independent of it: nothing in §4 reads a role. If M32b-1 finishes with time
to spare it may take §4 as well and write both done lines; it may not do the
reverse.

`STATUS.md` is updated by each run: a paragraph under "Last updated", the
claim and done lines, and the deviations. **Deviations are numbered on from
the last one in `STATUS.md` when the run starts** — 351 as this brief was
written, with M30b's and M31's runs still to add to it, so read the file.

**Done when:** no active event in `data/` carries a role outside
`data/roles.json`, and no inactive one does either; rule 25 refuses one, one
error per record, active events only, and a dataset with no `data/roles.json`
is still checked against nothing; 184-odd actor lines carry the phrase they
used to call a role as a `note` beside it, and no note a person wrote was
overwritten; `tools/migrate/roles.mjs` and `tools/migrate/categories.mjs` are
in the tree, idempotent, tested on the fixtures and named in `CLAUDE.md`; a
test holds the roles table to `docs/roles-mapping.md` row for row; the
contribution form and the review editor offer the closed list and cannot
submit a role outside it; every event the class table reaches carries its
category and no event carries `other` from a tool; `category-unknown` is still
a warning; `STATUS.md` names every event left without a category, the two
unused roles and A17's four open groups; `node tools/validate.mjs` reports
zero errors and no `role-unknown`; `node tools/validate.mjs --index` is
byte-identical; `node --test` is green with `CHROME` set; and `STATUS.md`
carries the literal lines `M32b-1 done`, `M32b-2 done` and then, on a line
with nothing else on it, **`M32b done`**.
