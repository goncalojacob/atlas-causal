# Build brief — M30a: the schema half of offices, tenures, parents and roles

Written 6 September 2026, after the health cycle, from
`docs/plan-2026-09-05.md` (decisions 1–14, as revised) and the two reviews
that shaped it (`docs/review-2026-09-05-plan.md`, findings 1–30). Runs on
`m0` after H9. Read: `CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md` (the
registry, the spine, the envelope — all changed by the health cycle),
`docs/run-protocol.md`, `docs/plan-2026-09-05.md`, `docs/review-2026-09-05-plan.md`,
`src/kinds.js`, `src/vocab.js`, `src/validate/rules.js`, `src/validate/core.js`
(`buildTopology`, the spine), `src/validate/migrate.js` and
`tools/migrate/apply.mjs`, `src/contribute/bundle.js`, `schema/**`, then this
file and its Amendments after review if present. **Nothing is drawn in this
run** (M30b draws); code only, plus the three Portuguese office records
(title and category, no claim beyond that) and the migration of twelve
`led` relations. Every record the run writes carries `origin` and
`review.status: "draft"` as the envelope now requires.

## 1. Two kinds: `office` and `tenure`

Through the registry (`src/kinds.js`: one entry each, with directory,
schema file, licences, identity and body flags, citation/actor/step lists
and form fields) and the schema files `schema/v1/office.json`,
`schema/v1/tenure.json`; the `provenance.json` kind enum; the bundle's
`oneOf`; `new-record.mjs`; `data/LICENSE`; rule 15's `when` sanity list.
The registry's consistency tests must pass unchanged.

- **office**: the envelope; `of` (an actor id); `title`; `category` from a
  closed set `head-of-state | head-of-government | legislature |
  party-leadership | military-command | religious | other` (in `vocab.js`,
  mirrored by the schema enum and the consistency test); `when`; `summary`;
  identity fields allowed. Three records for Portugal: monarch, president,
  prime minister — `of: portugal`, titles and categories only.
- **tenure**: the envelope; `person` (an actor of type person); `office`
  (an office id); `when`; optional `startedBy` (an event id); `sources`
  (at least one, as a relation). Id free slug (`soares-prime-minister-1976`).
  **Rule 26**: `tenure.person` resolves to a person, `tenure.office` to an
  office, and the office's `of` is the state the tenure belongs to;
  `when` overlaps the office's `when`; two tenures of one office **may**
  overlap (a regency is not a mistake; a year is the finest bound).
  `startedBy` resolves under rule 3, may not name a non-active event
  (rule 11), and warns when the event lies outside the tenure's `when`.
- **`led` retired**: the relation type leaves `vocab.js` and rule 19; a
  migration (H5a's chain, numbered next) turns the twelve `led` records
  into tenures — the two to the regime polity become tenures of
  `prime-minister-of-portugal` (person, dates, sources carried over), the
  ten party leaderships become one `party-leadership` office per party
  (`of` the party, title "Leader") and a tenure each — and the old
  relation files become retracted tombstones with `retraction.reason`
  saying so and `supersededBy` naming the tenure, so old links resolve.
- **`member-of` widened** (plan decision 12): rule 19 lets a polity or an
  institution be `member-of` an institution; M31 re-types Portugal's ten
  `allied-with` memberships.
- **The `degree-zero` warning** counts an event named by an active
  tenure's `startedBy` as connected (plan decision 3).

## 2. Events: `parent`, `scope`, `category`, `names`, `note`, `region`

- `parent`: an event id, optional; **rule 24**: resolves to an active
  event, no cycles, a child whose `span()` is not inside its parent's is a
  *warning*. `parent` never enters the adjacency (owner, 5 September):
  `graph.js`, `horizon.js`, the lens and `?chain=` are untouched. The
  spine carries `parent` and a derived `subtreeWeight` (the sum over the
  subtree, computed in `buildTopology`; `weight` itself unchanged).
- `scope`: optional `regional | worldwide` (in `vocab.js`) for the large
  events M30b draws as bands and washes.
- `category`: optional, from `data/categories.json` (plan decision 13;
  the file lists `war, treaty, election, revolution, law, founding,
  disaster, economy, culture, science, death, other` with a label and a
  one-line description each), read by `tools/lib/read.mjs` as
  `data/roles.json` will be, carried in the topology as
  `categoriesAllowed`, enforced by a **warning** (rule 25b) in this run.
  `data/imports/wikidata-seeds.json` → `classes` gains a `category`
  column and the import writes it for records it creates.
- `names` on events already exists (H5b); nothing to add.
- **Roles**: `data/roles.json` (the owner's approved list of 31 in
  `docs/roles-mapping.md`, with label and description), read into the
  topology as `rolesAllowed`; each actor line becomes `{ actor, role,
  note }` (`note` optional, carried in the spine); **rule 25** *reports*
  a role outside the list as a warning in this run (M32b applies the
  mapping and turns it into an error). The i18n design gains
  `actors[].note` as an index-addressed translatable field.
- `region` optional everywhere (plan decision 5): rule 10 stops requiring
  it on a placeless event; the form's label changes; `deriveRegion` and
  `data/geo/regions.json` stay.
- `historicalNames` on places: optional `[{ name, from, to }]`, read by
  nothing yet (the base map will); `names` untouched.

## 3. State and topology

`?office=<id>` and `?why=<id>` parsed and formatted by `state.js`
(`office` an opening that pushes history; `why` reserved, parsed only);
lens values `event:` and `region:` accepted by `vocab.js`/`lens.js` (H7
made the lens multi-focus; this adds the two kinds); `officesByEvent`
(event id → the office ids whose tenures hold a person the event names,
dated by the event's start) and `tenuresByOffice` in the spine, so
`lanes.js` stays a lookup in M33. `resolve()`, `record()`, `citesCount`
and the search shard cover the two kinds. The review dashboard's digests
gain the two kinds through the registry.

## 4. Migration, validation, docs

One migration on the chain for the `led` records; the index regenerated;
`node tools/validate.mjs --index` byte-identical at the end; every new
rule with tests on fixtures that now include one office, three tenures
(one overlapping pair), one parent with two children, one `scope`, one
`category`, one role note; the round-trip byte-identity test untouched.
`ARCHITECTURE.md` (the two kinds, the fields, rules 24–26, the spine's
new fields), `CONTRIBUTING.md` (how to write an office and a tenure),
`CLAUDE.md`'s data-model section.

Done when: the registry tests pass with nine kinds; `?office=prime-minister-of-portugal`
resolves in the state; the twelve `led` records are tombstones with
tenures in their place; rules 24–26 and the warnings fire on the
fixtures; validator `--index` byte-identical; tests green; `STATUS.md`
with the literal line `M30a done`.

## Amendments after review

Written 6 September 2026 by an independent Opus reviewer of this brief,
against `m0` after H8, with the assistant's answers to its four owner
questions (A2, A4, A13, A16) taken as recommended and recorded here; the
owner may overrule. **These override the body where they differ** (run
protocol §3).

**A0 — the gate and the reading.** The gate line is the literal `H9 done`
on `origin/m0`. Read `docs/health-review-2026-09-06-result.md` §5.1 and
§5.4 as well. H9 re-serialised the spine and the search shard compact and
regenerated `data/index/`; start from `origin/m0` after that commit and
never rebuild the index against a pre-H9 spine.

**A1 — the `led` records are re-filed by a one-off tool, not by the
migration chain.** `src/validate/migrate.js` is not touched and no
migration number is consumed: a chain step is one record in, one record
out, written back to the file it read, re-applied on every read for ever;
this is a change of kind, directory and record count. Write
`tools/migrate/led-to-tenures.mjs`, in the spirit of
`tools/migrate-places.mjs` — run once, kept as documentation, tested on a
scratch copy of the fixtures.

**A2 — `led` is deprecated, not removed.** `led` stays in
`RELATION_TYPES`, in `schema/v1/relation.json`'s `type` enum and `id`
pattern, in the narrative step pattern and in `RELATION_GROUP_ORDER`
(removing the type while that literal names it is a TypeError at module
load); the twelve tombstones and the fixture relation keep validating.
Rule 19 gains: **no active relation may be of type `led`**;
`new-record.mjs` and the form refuse it. No rename tool is a precondition.

**A3 — the tombstones.** The twelve `led` records become retracted, with
`retraction: { on, reason }` naming in prose the tenure that replaced
each, and `supersededBy: null` (the field's schema is the relation id
pattern, and `resolveId` follows it only on a `merged` record). No link
to a relation exists to preserve; a narrative step naming one is rule 11's.

**A4 — what a tenure carries over.** `tenure` has an optional `note`
(string, 1–200, carried in the topology as a relation's is). The tool
carries each relation's `note`, its whole `review` block and
`origin: { tool: "assistant" }` across unchanged, copies `created`;
`revised` is the day of the run. Twelve `date` flags must not leave the
queue. Office titles come from the notes where they give one
(`Secretary-General` for PCP, Partido Socialista and PAIGC; `President`
for FRELIMO) and `Leader` otherwise.

**A5 — rule 26, in three checks.** `tenure.person` resolves to an actor
of type `person`; `tenure.office` resolves to an office; `tenure.when`
overlaps `office.when` by `span()`, skipped where the office has no
`when`. The clause "the office's `of` is the state" is struck. Which
actor type may stand at an office's `of` is decided by its category, in
a table in `vocab.js` beside `RELATION_ENDPOINTS`, mirrored by the schema
and checked by `tests/registry.test.mjs` against `actor.json`'s enum:
`head-of-state`, `head-of-government`, `legislature` → `polity`;
`party-leadership`, `military-command`, `religious`, `other` →
`polity | institution`.

**A6 — the registry's consistency tests, resolved first.**
- `KINDS` order equals `provenance.json`'s enum order: insert `office`
  then `tenure` after `relation` and before `narrative`, in both.
- Both kinds have `fields` and join `CONTRIBUTED_KINDS` after `relation`;
  therefore the two hand-written branch chains in
  `src/contribute/bundle.js` (`buildRecord`, `recordToValues`) gain a
  branch per kind **in this run** — bundle plumbing, not drawing.
- `tenure.citerLabel: "Tenures"`, `office.citerLabel: null`.
- `office.urlParam: "office"` (so `office` joins `OPENINGS` and `CARDS` in
  `state.js`), `tenure.urlParam: null` (read from the office card).
- Licences: both `["CC-BY-SA-4.0"]`.

**A7 — the hand tables, in this order.** (1) `collectRows` in `rules.js`
— add both kinds or they are outside the universe and rules 3, 26 and 11
never see them; (2) `indexEntries` — a tenure pushes its `person` into
the actor referrers, with a test (M31's new persons would otherwise warn
`actor-unused`); (3) `src/data.js`'s `kinds` array and
`topologyFromSpine`; (4) `buildSearchIndex`/`searchIndexFor` — offices
join the shard, tenures do not; (5) `src/contribute/picker.js` and the
hand-built topology objects in `src/contribute/main.js` and
`src/review/main.js`; (6) `comparableIndex` in `bundle.js` and
`KIND_ORDER` in `build-index.mjs`; plus rule 6's kind list and rule 15's
`when` list.

**A8 — `rolesAllowed` and `categoriesAllowed` reach the browser through
the manifest.** `tools/lib/read.mjs` gains `readRoles` and
`readCategories`; `buildTopology` carries them; `manifest.json` carries
them beside `regions`; `src/contribute/main.js` and `src/review/main.js`
put them on the topology objects they build. An **absent** list means no
check at all, never an empty closed set; a test says so.

**A9 — the warnings are named, not numbered.** `role-unknown` and
`category-unknown` are warnings; "rule 25b" does not exist; rule 25 stays
reserved for M32b. In use: 1–15, 17–23, 27–29; 16 is the disk-only index
rule; this run takes 24 and 26.

**A10 — `officesByEvent` and `tenuresByOffice`, defined, in the manifest,
not the spine.** `officesByEvent: { <event id>: [<tenure id>, …] }` — a
tenure is listed when both are active, the tenure's `person` appears in
`event.actors[].actor` under any role, and
`astronomicalBounds(event.when.start).min` lies inside the tenure's
`when` (`end: null` covers every later year); values sorted by id.
`tenuresByOffice: { <office id>: [<tenure id>, …] }` sorted by start then
id. Both emitted by `buildTopology` and written into `manifest.json`.

**A11 — `subtreeWeight`, defined.** The sum of `weight` over the event
and every descendant through `parent`, transitively, computed after
`eventWeights`; omitted where it equals the event's own `weight` (every
leaf); not in `TOMBSTONE_KEYS`; `weight` unchanged; a node in a `parent`
cycle (rule 24's error) gets its own `weight`.

**A12 — `event:` and `region:` lens values are struck.** Both have been
in `FOCUS_KINDS` and `eventsOfFocus` since H7. `event:` keeps its
one-event meaning here; M30b narrows it to the subtree.

**A13 — the office records.** `office.when` is optional and the three
Portuguese offices are written with `when: null`: the atlas asserts the
office exists and what its tenures were, nothing about when it began
(dating the monarchy against an actor that starts in 1886 would be an
invented claim). Rule 26's overlap is skipped where an office has no
`when`. An office does not cite (it joins `source`, `region`, `place` in
rule 6's exemption; `ARCHITECTURE.md` invariant 6 says so); a tenure
cites at least one source. Ids: `monarch-of-portugal`,
`president-of-portugal`, `prime-minister-of-portugal`; party offices
`leadership-of-<party id>`.

**A14 — `?why=` is not added in this run** (`?walk=` reserves the shape;
M35 owns it). `?office=` is parsed and formatted, in `OPENINGS` and
`CARDS`, and `src/panel/panel.js` gains a three-line placeholder card
(title, the actor it belongs to, category) so `?office=` is not an empty
sheet between M30a and M30b.

**A15 — `region` optional, with the warning `no-lane`** in place of rule
10's requirement: an active event with neither `place` nor `region` is
drawn in no lane and the validator says so.

**A16 — `data/roles.json`.** The owner approved `docs/roles-mapping.md`
on 5 September (the assistant records it; M30a-1 writes the approval into
`STATUS.md`'s open questions), so the file is written with the 31 roles
and the `role-unknown` warning fires on real records from this run; M32b
applies the mapping and turns it into an error.

**A17 — the Wikidata class table.** `schema/v1/import-seeds.json` gains an
optional `category` on a class, meaningful only where `kind` is `event`,
checked in `checkImportSeeds` against `data/categories.json`; fill it only
for event classes whose mapping is unambiguous and list the rest in
`STATUS.md`; the import writes no category for a class without one.

**A18 — the indexes and the byte-exact tests.** Rebuild both `data/index/`
and `tests/fixtures/data/index/`; update `manifest.counts` and its exact
assertion in `tests/build-index.test.mjs`; add `of`, `category`,
`person`, `office`, `parent` to `DIGEST_KEYS` in `src/review/queue.js`.

**A19 — M30a runs as three**, each gated on the previous done line:
- **M30a-1 — the two kinds.** Registry, schemas, every list in A6 and A7,
  rules 6/15/26, `?office=` and the placeholder card, the fixtures' one
  office and three tenures (one overlapping pair), both indexes, the
  roles approval recorded. Done line `M30a-1 done`.
- **M30a-2 — `led`.** A1's tool, A2, A3, A4, rule 19 widened for
  `member-of`, the `degree-zero` `startedBy` change. Done line
  `M30a-2 done`.
- **M30a-3 — the event's fields and the vocabularies.** `parent` with
  rule 24, `scope`, `category`, `note` on actor lines, `region` optional
  with `no-lane`, `historicalNames`, `data/categories.json` and
  `data/roles.json` with A8's readers and manifest keys, A9's warnings,
  A10, A11, A17. Done lines `M30a-3 done` and then `M30a done`.

Done when, restated: the registry tests pass with nine kinds;
`?office=prime-minister-of-portugal` parses, formats and opens the
placeholder; the twelve `led` records are retracted tombstones with
twelve tenures and six party offices in their place, and `led` is a type
no active record may take; rules 24 and 26 and the three warnings fire on
the fixtures; `node tools/validate.mjs --index` byte-identical; the
fixture index rebuilt and `?fixtures=1` green in a browser test;
`node --test` green with `CHROME` set; `STATUS.md` with `M30a done`.
