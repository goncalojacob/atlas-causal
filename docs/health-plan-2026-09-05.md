# Health plan — 5 September 2026

The owner's standing instruction (5 September): review the project as it
is against seven considerations, plan the changes, review the plan, make
the changes, review the result, repeat if needed. Two Fable reviewers
worked in parallel on `m0` at 9d1b582 (M20–M29 landed): A on structure,
defects, portability and the pipeline (`docs/health-review-2026-09-05-A.md`,
35 findings, cut off by the usage limit while writing its closing
sections), B on scale, measured on synthetic datasets of 20 000 and
100 000 events, the reader's walk and the contributor's path
(`docs/health-review-2026-09-05-B.md`, 35 findings and a table). The two
agree on the serious things. This plan folds both.

## What the reviews say, in one paragraph each

**Scale.** Every page loads the whole topology and every view rebuilds
from the whole active set on every state change; the map's clustering and
the graph's crossing count are quadratic; the validator's tombstone rule
is quadratic in tombstones, which are 53 % of this dataset; the sources
and review indexes grow with citations and drafts and are loaded whole.
Measured: at 20 000 events the page takes 33 MB, 0.7 s per click, 2 s per
wheel notch on the timeline, the graph tab six minutes; at 100 000 the
validator takes half an hour and the page 235 MB of heap. The graph
queries themselves (consequences, convergence, horizon) are fine at every
size; the cost is in loading and drawing.

**Reader.** Choosing an event from search narrows the window to end at
that year and fades the consequences the reader is about to follow; the
horizon leaks from one selection to the next; a click on a consequence's
mark resets the chain on the map and the timeline but walks it in the
graph; the panel re-renders on view-only changes and closes what is being
read; Back restores what was open but not the picture; a pan writes a
world box that hides every placeless event; nothing on the map or the
timeline is keyboard-reachable; search cannot find "Carnation Revolution";
first contact is 137 marks and "Pick an event"; "why is Angola poor" has
no entry point and the state actor has no events.

**Contributor and reviewer.** Reference fields are `<select>`s of every
record, rebuilt per keystroke (1.2 s at 20 000); duplicate search covers
events only; the whole universe is validated per keystroke; the dashboard
lists 30 000 rows and repaints them per keystroke, downloads every draft's
digest, and every Save rebuilds the whole index inside the request;
signing deletes the citation checks the reviewer just made and the
retraction note; "unreviewed" is one author-name string; no history, no
diff, no claim.

**Structure and portability.** A ninth record kind touches about thirty
files, an edge type ten, a relation type six, a lens value five; the
vocabularies are regexes duplicated in `state.js`, `rules.js` and
`lens.js`; the views compute "what the reader is working with" three
times by hand. Review status, attribution and machine authorship share
one field; the envelope has no `origin`; `schema: 1` has no migration
path; ids embed the type vocabulary and nothing migrates a rename;
derived facts leak into records in two places; the deploy artifact is the
whole repository.

## Decisions the plan takes (owner to confirm or overrule)

1. **The index splits.** A compact *spine* (event id, start and end year,
   place, region, weight, status; edges as `[from, to, type, confidence]`)
   that the graph queries read whole, and *attribute shards by period*
   (titles, actors, wikipedia) fetched for the window. Tombstones keep
   id, status, `supersededBy` and aliases only. The sources index keeps
   bibliographic fields and a `citationCount`; citers per source on
   demand. This amends "topology whole" in `ARCHITECTURE.md`; the
   convergence guarantee needs only the spine.
2. **Envelope fields.** `origin: { tool, run? }` for machine writers and
   `review.status: draft | reviewed` (signature carried in
   `review.signedBy`), keyed by a migration; `IMPORT_AUTHORS`, `isDraft`
   and the licence exception move onto them. Sign keeps
   `review.citations` and never deletes a retraction's reason, which
   moves to `retraction: { on, reason }`.
3. **Ids stay derived** (from--to--type for edges and relations) because
   they guarantee uniqueness and readability; a `tools/migrate/` chain
   with a numbered, idempotent, validated migration per schema change is
   the convention, `tools/migrate/001-rename.mjs` its first member, and
   the validator accepts `schema ≤ SCHEMA_VERSION` running the chain on
   read.
4. **Generated pages are committed like the index**: `entry/<id>.html`,
   `narratives.html` and `sources.html` prerendered by
   `tools/build-index.mjs` from the same pure functions, the script only
   enhancing. Still no bundler and still `python3 -m http.server` to run.
5. **Events get `names`** (rule 18's shape), filled from Wikidata labels
   by the import where they exist and by hand otherwise; search folds them
   and the first sentence of the summary at low rank through a small
   search shard emitted by the index.
6. **Paths are weighted** by confidence and type in `shortestPaths`, and
   convergence is grouped by depth with counts. The convergence
   exclusion set is untouched.
7. **A generated walk is a narrative without a signature**: `?walk=` in
   reading mode resolved against `data/walks/` (generated, marked
   `origin`, never signed) — the shape the Why mode (M35) and an
   on-demand writer both produce.
8. **`discuss` and `bbox`**: the discuss link carries the record's URL
   only; the world box is never written; placeless events are in view
   when their region's box intersects the viewport.

## Milestones, in order

- **H1 — the interaction fixes.** B8 (`windowAt` is a no-op when the year
  is inside the window), B9 (horizon cleared when the selection changes),
  B10 (one `walkOrSelect` for map, timeline and graph), B12/A3/A5 (the
  panel subscribes to openings only; URL writes for replace-type changes
  debounced to a frame), B14/A6 (Back restores the whole state from the
  URL and writes it), B15 (placeless events in view by region box; no
  world box), A4 (pointer maths through `getScreenCTM`; `bbox` from the
  real visible rectangle; `ResizeObserver`), B13/A14 (failed fetches not
  cached), B34 (a shared chain filtered to active edges), A33, A34, A32
  (phone sheet and panes), B11 (marks and bars keyboard-reachable). One
  commit each, browser tests for each. Code only.
- **H2 — the registry.** `src/kinds.js` (every per-kind list: directories,
  schemas, licences, bundle branches, form fields, citation and actor
  lists, identity and body kinds) and `src/vocab.js` (edge and relation
  types with labels, order and endpoint rules; groups; focus kinds), from
  which `state.js`, `rules.js`, `lens.js`, `lanes.js`, `bundle.js`,
  `read.mjs`, `new-record.mjs` and `bundle-to-files.mjs` import; a test
  that adding a fixture kind touches only the registry; `src/emphasis.js`
  (`workingSet(atlas, state)`) consumed by the three views. Code only.
- **H3 — the spine.** Decision 1: the index split, `data.js` loading the
  spine whole and attribute shards for the window, views rendering only
  what overlaps the window plus a margin and culling by viewport before
  clustering, notification on the next frame with unchanged renders
  skipped, tombstones stripped, sources split, citers on demand, records
  served with `?v=<revised>`; `ARCHITECTURE.md`'s "Scale, for the record"
  rewritten with B's table. **Opus review of the brief.**
- **H4 — the hot paths.** Grid clustering with identical results (B2/A13),
  clustering once at rest and per zoom bucket, in-view only; the layout's
  crossing count by adjacent-layer inversion count with early stop, the
  layout and `stackLayout` memoised and restricted to the window, in a
  Worker past a threshold (B3/A2); horizon and convergence memoised
  (B22/A12); timeline packing by sorted sweep, window only, DOM kept, a
  density strip beyond the neighbourhood (B23/A18); validator indexes for
  rules 11 and 17 and precompiled patterns (B4/A11); `validate --index`
  doing the work once with bounded-concurrency reads and a hashed palette
  (B5); `serve.mjs` answering after the write and rebuilding in the
  background with a save queue (B32); search debounced and in a Worker,
  the index shard when the scan passes 50 ms (B19/A19); presences by
  interval index with cached paths and zoom simplification (B24). A
  benchmark script under `tests/bench/` on the 20 000 synthetic set,
  numbers in `STATUS.md`.
- **H5 — the envelope.** Decisions 2 and 3: `origin`, `review.status`,
  `retraction`, Sign keeping citations, `tools/migrate/` with the first
  migration and the on-read chain, region provenance on imported places
  (A23), `sitelinks` dropped or stored as `{ count, on }` (A23), licence
  and attribution per directory in `data/LICENSE` and the manifest and
  the attribution line on NC-derived cards (A24), `names` on events
  (decision 5). Schema, validator, tools, dashboard, docs.
- **H6 — the contributor and the reviewer.** A reference picker on
  `search.js` for every reference field in the form and the editor
  (kind, dates, place, degree, existing links; "in this bundle" first),
  duplicate search for every kind including identifiers, validation of
  the changed record against a universe built once with an incremental
  cycle check (B6/A10/B27); "Edit this record" on every card prefilling
  the form, field-level corrections (B26); contributions landing with
  `review.flags: ['contributed']` and `review.note: 'issue #n'`, the PR
  body linking `review.html?open=<id>`, the identifier check before the
  PR, the retraction cascade offered by the Action (A29/A30); the
  dashboard as a virtual list over digests sharded by kind, sort keys
  (flags, degree, age), an edge-in-context view, a record's history and a
  diff against the draft, an optional claim (B7/A31); "unreviewed" defined
  by `review.status` (A8).
- **H7 — the reader.** An intro card: the narratives, the heaviest events,
  one walkthrough, "start here" (A17); search over `names` and summaries
  (decision 5); predecessor and successor events on the actor card along
  `succeeded`, years beside actors in search (B28); weighted paths and
  grouped convergence (decision 6); `subgraph(atlas, ids, depth)` with a
  bundled explanations fetch by period, narrative steps allowed to cite
  an actor, a relation or a presence, `narrative.subgraph` for mechanical
  checking, `?walk=` and `data/walks/` (decision 7; B18/A16) — the ground
  the Why mode stands on; `?edge=` and the chain as event ids (B25).
- **H8 — generated pages and the artifact.** Decision 4; the deploy
  allowlist and a banner on `review.html` off localhost (A35/B29);
  `STATUS.md` cut to a hundred lines with `docs/history/` (B35).

H1 and H5 touch different files and may run in parallel on side branches;
H2 before H3 because the spine is written against the registry; H4 after
H3 because the hot paths are the spine's consumers; H6 and H7 after H5
because both read the new envelope. A Fable review of the result after
H8, and the cycle repeats if it says so. M30a–M38 follow the cycle and
are rewritten against the registry and the spine.

## Left out on purpose

Anonymous contributions and everything about publishing (out of scope by
the owner's decision); rewriting the timeline's lanes (M33 has it);
offices, parents and the base map (M30–M38). B's finding 33 (roles) is
M32; B's 18 and A's 16 are the Why mode's ground and go in H7 rather than
M35 so that M35 builds on them.
