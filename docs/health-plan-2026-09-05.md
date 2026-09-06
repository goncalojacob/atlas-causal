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
agree on the serious things. This plan folds both, and was **revised at 13:00 Lisbon** after an independent Opus review of it (28 findings, `docs/review-2026-09-05-health-plan.md`).

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

1. **The index splits, but less than first written.** A *spine* read whole
   by every page: for every record its id, kind, status, aliases,
   `wikidata`; for events `title`, start and end year, `place`, `region`,
   `weight`, `actors[].actor`, `citationCount`; for actors `name`,
   `actorType`, `when`; for sources `creators`, `title`, `year`,
   `citationCount`; for presences `actor`, `when`, `geometry.key`; edges
   as `[from, to, type, confidence]` with the id synthesised on load
   (derived ids are now load-bearing); tombstones keep `title`, `when`,
   `wikidata`. Period *shards* carry what a card or a mark needs beyond
   that: `wikipedia`, `actors[].role` and `note`, `regionMethod`,
   `capital`, `presenceType`. Citer rows per source on demand;
   `retractionPlan` takes a pre-fetched map. A search shard is emitted by
   the index. The H3 brief carries a table of page × index file. This
   amends "topology whole" in `ARCHITECTURE.md`; the convergence
   guarantee needs only the spine.
2. **Envelope fields.** `origin: { tool, run? }` written only by a
   record's creator, never by an enrichment pass; `review.status: draft |
   reviewed` with the signature in `review.signedBy`; `retraction: { on,
   reason }` that nothing deletes; Sign keeps `review.citations`. The four
   author-string predicates (rule 12, `isDraft`, the Wikidata import's
   `handWritten`, the CShapes import's `ownedBy`) move onto them in one
   commit, and **an import never rewrites a record that carries a human
   signature**. Migration 001 is additive at `schema: 1`.
3. **Ids stay derived**; `src/validate/migrate.js` is the pure, ordered
   migration chain, applied by `tools/lib/read.mjs` and by the browser,
   with `tools/migrate/apply.mjs` rewriting disk in the same commit as the
   schema change, and a trivial reversible migration 002 proving the
   chain. Narrative steps and `review.citations` keys resolve through
   aliases (A20) before the first rename ships.
4. **`entry.html?id=` stays the address.** `sources.html`,
   `narratives.html` and the entries that carry a `body` are prerendered
   by `tools/build-index.mjs` from the same pure functions and committed
   like the index, the script only enhancing; the build prints the file
   count and bytes. No bundler; `python3 -m http.server` still runs it.
5. **Events get `names`** (rule 18's shape), from Wikidata labels where
   the import has them and by hand otherwise; search folds them and the
   first sentence of the summary at low rank through the search shard.
6. **`shortestPaths` stays by hops.** Ranking by confidence and type is a
   separate ordering of the answer lists (horizon, convergence grouped by
   depth with counts); the walked chain never changes silently.
7. **A generated walk never enters `data/`.** `?walk=` is reserved; a
   generated path lives in the session only, with a provenance line on
   the card. The directory question returns with the Why mode (M35).
8. **`discuss` carries the record's URL only; the world box is never
   written; placeless events are in view when their region's box, derived
   at load from `data/geo/regions.json`, intersects the viewport.**
9. **Unchanged by decision:** the timeline's scale stays as M6 decided;
   `?chain=` stays a list of edge ids and there is no `?edge=`; the
   reading-mode URL stays `narrative` and `step`; the store notifies
   synchronously (URL writes coalesce to a frame); clustering covers the
   same set as today and only drawing is culled; `sitelinks` becomes
   `{ count, on }`; `?fixtures=1` stays on the deployed site
   (`tests/fixtures/data/` allowlisted); the registry is code
   (`src/kinds.js`, `src/vocab.js`, leaf modules), checked against the
   schema enums by test.

## Milestones, in order, one run each

- **H1a — four one-line defects.** The search box widens only when the
  year is outside the window (B8, at the call site; `windowAt` untouched);
  `horizon` cleared when the selection changes (B9); failed fetches not
  cached (B13/A14); a shared chain filtered to active edges (B34); the NUL
  separator in `rules.js` replaced. Tests for each.
- **H1b — render and URL.** A render key for the panel of openings +
  `chain` + `horizon` + resolved window, window-dependent bits updated in
  place, the cluster list surviving view-only changes (B12/A3/A5); URL
  writes for replace-type changes coalesced to a frame, `notify`
  synchronous; `popstate` restoring the whole state from the URL and
  writing it, reading mode untouched (B14/A6); the graph's arrangement key
  fixed for the narrative lens and lane membership. Browser tests.
- **H1c — map maths and reach.** Pointer maths through `getScreenCTM`,
  `bbox` from the real visible rectangle, `ResizeObserver` (A4); no world
  box, placeless events in view by region box derived at load (B15);
  `discuss` with the record's URL only (A33); marks and bars
  keyboard-reachable (B11); the phone sheet and the panes agreeing (A32);
  one shared `walkOrSelect` (B10).
- **H2 — the registry.** `src/kinds.js` and `src/vocab.js` as leaf
  modules; `state.js`, `rules.js`, `lens.js`, `lanes.js`, `bundle.js`,
  `read.mjs`, `new-record.mjs`, `bundle-to-files.mjs`, `wikidata.mjs`
  importing from them; `src/emphasis.js` (`workingSet`) consumed by the
  three views; consistency tests (registry = schema enums; KINDS =
  KIND_DIRS). No URL and no record changes.
- **H3a — the spine beside the old topology.** `build-index.mjs` emits
  the spine, the period shards, the search shard, the citers files and
  `citationCount`s **in addition to** the topology; `data.js` can load
  either; nothing switches; fixtures gain a record straddling a period
  boundary. **Opus review of the brief.**
- **H3b — the pages switch over**, one page per commit: the atlas, entry,
  narratives, sources, contribute, review; views draw only the window's
  events plus a margin with a faded stub beyond it; unchanged renders
  skipped by explicit keys; tombstones stripped; records served with
  `?v=`; `retractionPlan` on a pre-fetched map.
- **H3c — the old topology removed**; `ARCHITECTURE.md`'s index section
  and "Scale, for the record" rewritten with B's table.
- **H4a — clustering and the map.** The grid under the four identity
  conditions with a test against the greedy output including `centre`;
  once at rest and per zoom bucket rounded down, `coreZoom` exempt;
  presences by interval index with cached paths and zoom simplification.
- **H4b — the graph.** Crossing count pruned by sweep line and bounding
  boxes over the same predicate, deterministic early stop, layout and
  `stackLayout` restricted to the window and memoised on the fixed key;
  no Worker unless a measured number demands it.
- **H4c — the timeline, the queries, search.** Sorted-sweep packing,
  window only, DOM kept, a density strip beyond; horizon and convergence
  memoised; search debounced, the index shard used past 50 ms.
- **H4d — the tools.** Validator indexes for rules 11 and 17, precompiled
  patterns; `validate --index` doing the work once with bounded reads and
  a hashed palette; `serve.mjs` with a save queue, the topology patched in
  memory, a background rebuild and `/__status`; `tests/bench/run.mjs`
  with a seeded generator and numbers in `STATUS.md`.
- **H5a — aliases and the migration chain.** A20's alias-resolving helper;
  `src/validate/migrate.js`, `tools/migrate/apply.mjs`, migrations 001
  (additive) and 002 (trivial, reversible); `--index` on the PR gate for
  `data/` changes.
- **H5b — the envelope.** `origin`, `review.status`/`signedBy`,
  `retraction`, `names` on events, `sitelinks` as `{ count, on }`, region
  provenance on imported places, licence and attribution per directory
  and on NC-derived cards, following the checklist of review finding 15
  (schemas → migration → `ENVELOPE_KEYS` → `DIGEST_KEYS` → the four
  predicates → rules → docs); the byte-identity round-trip test is the
  safety net and is never edited to pass.
- **H6a — the contributor.** The reference picker on the search shard for
  every reference field, duplicate search for every kind including
  identifiers, validation of the changed record against a universe built
  once with an incremental cycle check; "Edit this record" prefilling the
  form; contributions landing flagged `contributed` with the issue number,
  the PR body linking `review.html?open=<id>`, the identifier check before
  the PR, the retraction cascade offered by the Action.
- **H6b — the reviewer.** A virtual list over digests sharded by kind,
  sort keys, an edge-in-context view, a generated per-record history file
  and a diff against the draft, an optional claim, "unreviewed" defined by
  `review.status`.
- **H7 — the reader.** The intro card; search over `names` and summaries;
  predecessor and successor events on the actor card along `succeeded`,
  years beside actors in search; ranking as an ordering of the answer
  lists, convergence grouped by depth; `subgraph(atlas, ids, depth)` with
  a bundled explanations fetch by period; narrative steps allowed to cite
  an actor, a relation or a presence; `?walk=` reserved.
- **H8 — generated pages and the artifact.** Decision 4; the deploy
  allowlist with `tests/fixtures/data/`; a banner on `review.html` off
  localhost; `STATUS.md` cut to a hundred lines with `docs/history/`.

Order and parallelism: H1a → H1b → H1c → H2 on `m0`; H5a and H5b may run
on a side branch in parallel with H1–H2 **without committing
`data/index/`**, merged with one rebuild commit; H3a–c after H2 and the
merge; H4a–d after H3c, two of them in parallel on side branches when they
touch different files; H6a/b and H7 after H5b and H3c; H8 last. A Fable
review of the result after H8, and the cycle repeats if it says so.
M30a–M38 follow the cycle and are rewritten against the registry and the
spine.

## Left out on purpose

Anonymous contributions and everything about publishing (out of scope by
the owner's decision); the timeline's lanes following the window (M6's
decision stands); `?edge=` and a shorter chain; offices, parents and the
base map (M30–M38). B's finding 33 (roles) is M32; the Why mode (M35)
stands on H7's `subgraph` and the session-only walk.

## After the closing review (6 September)

The closing review (`docs/health-review-2026-09-06-result.md`) counted 48
of 70 findings resolved, measured the hot paths 5–600× cheaper, and
found the state acceptable only after one corrective run, **H9**
(`docs/health/h9-brief.md`: R7 the graph from a narrow window, R8 the
implicit lens emptying the atlas, R10 imports and scaffolds bypassing the
queue, R1 the deploy's shallow histories, R2/R12 the contribution gate,
and the smaller items). A **second cycle on the index** follows beside
M30a–M35 and before M40–M43: the spine compact (R5, in H9), presences out
of the whole-corpus file into the period index, attributes by period, the
history directory sharded, the graph's stacks memoised per bucket, the
lane cap, the rename tool before `led` is retired, `names` on events and
`succeeded` relations for the colony/state pairs, and the Why mode's
missing ground (a generated marker, a producer for `?walk=`, condition
endpoints).
