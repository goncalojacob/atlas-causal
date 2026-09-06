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
