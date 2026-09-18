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

## Amendments after review

Written 6 September 2026 by an independent Opus reviewer of this brief, against
`origin/m0` at `cd71524`. **These override the body where they differ** (run
protocol §3). Where an amendment answers a question that is the owner's, it
says so and states the recommendation the run follows until the owner
overrules.

**A0 — the gate, and the numbers verified.** The gate line is the literal
`M31 done` on `origin/m0`. Its reason as given in §0 is wrong — a reinstated
election carries `actors: []` and therefore no role strings at all — but the
gate stands, because M31 and this run both rewrite event files and `revised` on
them and must not overlap. Verified against `origin/m0` and to be taken from
here rather than re-derived: 1737 records, 0 errors, 1157 warnings, of which
114 are `role-unknown` and 0 are `category-unknown`; 329 event files, 137
active, 133 of them naming actors; **349 actor lines, every one of them on an
active event**; 163 distinct role strings raw and 163 after folding, 21 already
ids in `data/roles.json` and 142 not; no event carries a `category`; no actor
line carries a `note`; `data/roles.json` is 31 objects of `{id,label,description}`
and `data/categories.json` twelve of the same shape;
`docs/roles-mapping.md` holds 163 data rows, five columns, every target an id
in `data/roles.json`, no corpus string without a row, no row without a hit, 31
em-dash rows and 132 with a note, reaching 184 of the 349 lines, with
`minister` and `institution` targeted by nothing. The last deviation in
`STATUS.md` when this was written is 351; M30b's and M31's runs will have
added, so read the file.

**A1 — the note written is the record's own string, verbatim.** §1's example
and §6's test disagree about which string becomes the note. The lookup is on
`normalizeRole(role)`, which lower-cases, and twelve of the 163 corpus strings
differ from their folded form by capitalisation alone — `"won 106 of 163 seats
in the Chamber"`, `"the Communities being joined"`, `"as ANP, took all 150
seats"`, `"prime minister from June 1983"` among them. The note the tool writes
is therefore the actor line's **own `role` string, character for character**,
never the folded key and never the document's column. The mapping row decides
two things and no more: which of the 31 ids the line takes, and whether a note
is kept at all — an em-dash in `Note kept` means no `note` key is written.
(Checked: on all 132 non-em-dash rows the `Note kept` column is identical to
the `Role in use` column, so this changes nothing but the capitalisation of
twelve notes.)

**A2 — no tombstone carries a role.** §1's paragraph "It runs over **every**
event, active, merged and retracted alike… leaving 163 strings alive in the
tree behind a closed vocabulary is exactly the state this run exists to end" is
about an empty set: all 349 actor lines sit on the 133 active events that name
actors, and every one of the 175 retracted and 17 merged events has
`actors: []`. The tool still walks every event file, for the day a tombstone
does carry one, and the run reports that it changed none of the 192 inactive
records because none has an actor line. The Done-when's "and no inactive one
does either" is a statement about the tool's scope, not a count of records
changed. §2's defence of rule 25's active-only scope stands on its own reason —
a tombstone is a record of what the atlas used to say — and not on "§1 re-files
them anyway".

**A3 — both writing pages change, and both gain a `note` input.** §3's "the
review editor is generic over `FIELDS` and `ACTOR_LISTS` and needs nothing of
its own" does not hold: `src/review/editor.js:216` defines its own
`renderList`, and `:284-288` calls it for the actor list with `textKey: 'role'`
and the free-text placeholder `'role: leader, signatory, deposed'`. Making the
role a closed list is a change to that file as well as to
`src/contribute/form.js:335-343`, and it must leave the citation `locator`
(`editor.js:300`) and the narrative step `text` (`:293`) as free text.
Separately, **neither page draws the actor line's `note` today** — `form.js`
builds one input for the role and `editor.js:267` creates a row as
`{ [refKey]: '', [textKey]: '' }` — so "the free-text box demoted to the note
beside it" is new work in both files, not a demotion. M32b-1 delivers, in each
page: a closed role control filled from the manifest's `rolesAllowed`, an empty
first option so an unfilled row still reports at `/actors/<i>/role`, and a
`note` text input beside it. `tests/contribute-browser.test.mjs` and
`tests/review-browser.test.mjs` each assert both controls, with `CHROME` set.
`src/contribute/bundle.js:327` and `:622` already carry `note` through a save
(deviation 343), so the round-trip byte-identity test in
`tests/bundle.test.mjs` is what proves nothing is lost; confirm it rather than
change it.

**A4 — how the category tool matches, and the numbers struck.** §4 describes a
whole-phrase match and gives the numbers of a plain substring match. Measured
over `data/events/`: plain substring reaches 192 of 329 and 62 of 137 active,
with the breakdown §4 prints; a `\b…\b` whole-word match reaches 177 and 60;
`\b…s?\b` reaches 191 and 61. Owner question. Until the owner overrules, the
matcher is **case-insensitive `\b<label>s?\b`, longest label first**: it keeps
"elections" and "wildfires", and it cannot match `war` inside "Warsaw" or `law`
inside "outlaw" the first time such a title arrives, which plain substring can.
All the figures in §4 are struck; the reach is whatever the tool measures, and
the tool prints it and the run puts it in `STATUS.md`.

**A5 — the tool matches only what an import titled.** §4 justifies the rule as
"matched on a string the record did not choose for itself" and "the input is a
string the atlas copied rather than composed", and elsewhere says outright that
"no pattern over a hand-written title is mechanical; it is a guess dressed as a
rule." Of the 62 active substring matches, 45 are on records with
`origin.tool: "wikidata"` and 17 on assistant-drafted records with hand-written
titles — including `constitutional-revision-1959`, "The revision that ends
direct presidential elections", which the table would file as `election` and
which is a `law`. Owner question. Until the owner overrules, the tool assigns a
category **only where `origin.tool` is `"wikidata"`**. Every other event is
left uncategorised and named in `STATUS.md` with the category the table would
have given it, as a suggestion for a person. §4's three hard constraints are
unchanged: never `other`, never over an existing `category`, and nothing else
written.

**A6 — the test pins three columns of `docs/roles-mapping.md`, not five.** The
document's `Count` column is stale: it sums to 340 against 349 actor lines and
five rows disagree with the corpus — `government` 8 against 11, `founded` 6
against 8, `admitting body` 2 against 3, `acceded` 1 against 2, `founding
member` 1 against 3. `tests/roles-migrate.test.mjs` asserts the `Role in use`,
`Becomes` and `Note kept` columns row for row and never `Count`. The five
stale counts go into `STATUS.md` under §5 item 6 for the owner;
`docs/roles-mapping.md`'s mapping is not edited, and the only line added to it
is the one §7 asks for, saying when it was applied and by what. The document
parses cleanly — 165 pipe lines, header, separator and 163 data rows of five
cells; `Becomes` and `Example event` are backtick-wrapped and must be stripped,
`Role in use` and `Note kept` are bare.

**A7 — the fixture warning totals do not move.** §6 says they do "because the
fixtures have no `data/roles.json` and so fire neither the warning nor the
error", which is self-contradictory and is the opposite of amendment A8's
guarantee and of the `undefined` guard at `src/validate/rules.js:1379-1385`.
`tests/rules.test.mjs:25` asserts an exact sorted list of every non-`unread`
warning and `tests/validate-cli.test.mjs:24` asserts exactly twenty
`warning [unread]` lines, both over `tests/fixtures/data/`, which has neither
vocabulary file. Neither moves. If either does, the run has broken the
absent-vocabulary rule; it stops and says so in `STATUS.md` rather than editing
the assertion to fit. `tests/event-fields.test.mjs`'s "a dataset with no
vocabulary is not a dataset whose every role is wrong" case is extended to
rule 25 as an error, exactly as §6 says.

**A8 — `esc()` is not used on this code path.** §3's "Every label and
description from `data/` goes through `esc()`" is wrong for
`src/contribute/form.js` and `src/review/editor.js`, which build DOM nodes:
`src/util/dom.js`'s own header says "Attribute values are set with
setAttribute, never by string concatenation into markup, so record text is safe
here; markup built as strings goes through esc() instead." An option's label is
set with `textContent` and its `title` with `setAttribute`; running either
through `esc()` first would print `&` to the reader. `esc()` stays where
markup is built as strings.

**A9 — a signed record is not re-filed.** M32b has no rule for a record whose
`review.status` is `reviewed`, though §1 changes `revised` on every file it
touches and re-files a phrase a signature was given against. There are zero
such records today, but this run gates on `M31 done` and may follow it by days.
Both tools skip any record whose `review.status` is `reviewed`, report it, and
`STATUS.md` names it. `review.status`, `review.flags` and `review.note` are
otherwise untouched, as §1 says, so nothing else leaves or joins the queue.

**A10 — three more sentences that become false.** §7's document list misses
`schema/v1/event.json:82` ("one outside it is the warning `role-unknown` until
M32b applies the mapping and makes it an error"), `schema/v1/event.json:75`
("a category outside the list is the warning `category-unknown`, not an error,
until every event carries one") and the warnings comment block at
`src/validate/rules.js:1362-1372` ("M32b… is the run that turns this into an
error"). All three are corrected in the same commit as rule 25. Both new tools
are named in `CLAUDE.md`'s layout tree in the commit that adds them, or
`tests/site.test.mjs:105-125` — which walks `tools/**.mjs` as well as
`src/**.js` — fails.

**A11 — the index is the last commit of every run.** As in M31: a record's
history cannot be right in the commit that changes it (deviation 328), so the
data commit and the `data/index/` regeneration are two commits — and what §6
does not say is that **the index commit must be last**. §1's tool changes on the
order of 120 event files and every one of their history files under
`data/index/history/`; a further record fix after the index rebuild leaves
`node tools/validate.mjs --index` failing for no visible reason. Every data
commit is followed by a `node tools/build-index.mjs` commit before anything
else is written, and `--index` is run after the last of them.

**A12 — what stays as the brief has it.** `tests/build-index.test.mjs:155`'s
`notDeepEqual(real.roles, real.rolesAllowed.map(r => r.id))` still holds after
this run — 29 ids in use against 31 in the vocabulary, in different orders — so
§6 is right that the comment changes and the assertion does not.
`data/roles.json` and `data/categories.json` reach the browser through
`manifest.rolesAllowed` and `manifest.categoriesAllowed`
(`tests/build-index.test.mjs:145-151`), so no page fetches either file. The two
runs stay two: M32b-1 changes every event record and turns a warning into an
error in one run, and taking §4 as well would put three unrelated failure modes
in one session.

**Done when, restated:** no active event in `data/` carries a role outside
`data/roles.json`; rule 25 refuses one, one error per record, active events
only, and a dataset with no `data/roles.json` is still checked against nothing,
with `tests/event-fields.test.mjs` saying so about the **error** and not only
the warning; 184 actor lines carry, as a `note`, the phrase they used to call a
role, **character for character as the record wrote it**, and no note a person
wrote was overwritten; `tools/migrate/roles.mjs` and
`tools/migrate/categories.mjs` are in the tree, idempotent, `--data`/`--dry-run`,
tested on a scratch copy of the fixtures, skipping and reporting any `reviewed`
record, and named in `CLAUDE.md`'s layout tree; a test holds the roles table to
`docs/roles-mapping.md`'s `Role in use`, `Becomes` and `Note kept` columns row
for row and **not** to its stale `Count` column; both the contribution form and
the review editor offer a closed role list that cannot submit a role outside
it, and a `note` input beside it, each asserted by its own browser test; the
category tool assigns a category only to events whose `origin.tool` is
`"wikidata"`, matching `\b<label>s?\b` case-insensitively with the longest
label first, never writing `other`, never overwriting an existing category and
writing nothing else, with its measured reach printed and recorded rather than
predicted; `category-unknown` is still a warning; `STATUS.md` names every event
left without a category and, for the hand-written ones, the category the table
would have given it, the two unused roles `minister` and `institution`, A17's
four open groups unchanged, the five stale rows of the `Count` column, and any
record skipped as `reviewed`; `ARCHITECTURE.md`, `CLAUDE.md`, `CONTRIBUTING.md`,
`docs/roles-mapping.md`, `schema/v1/event.json` (both descriptions) and the
warnings comment in `src/validate/rules.js` all say what is now true; the last
commit of each run is a `tools/build-index.mjs` commit;
`node tools/validate.mjs` reports zero errors and no `role-unknown`;
`node tools/validate.mjs --index` is byte-identical; `node --test` is green
with `CHROME` set and the skipped count reported; and `STATUS.md` carries the
literal lines `M32b-1 done`, `M32b-2 done` and then, on a line with nothing
else on it, **`M32b done`**.
