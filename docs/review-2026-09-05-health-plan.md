# Review of the health plan — findings, in short

An independent Opus reviewer read the health plan, the two health reviews
and the code the plan touches, and returned 28 findings. Kept here in
short form so a brief can cite a number; the plan's revision of 5
September, 13:00 Lisbon, folds them.

1. The spine as first written starves search, the form, the editor, the
   dashboard, `loadNarratives` and `checkRules`, all whole-corpus readers.
   → a page × index-file table in the H3 brief; the search shard emitted in
   H3; a whole-universe "rule fields" file for the form and the dashboard.
2. Convergence and the horizon return events at any distance in time, so
   titles cannot live in period shards; edge tuples have no id. → `title`
   stays in the spine; the loader synthesises `from--to--type` ids, which
   are now load-bearing.
3. "Citers on demand" breaks `retractionPlan` and three cards' counts. →
   `citationCount` per record in the spine; citer rows out; `retractionPlan`
   takes a pre-fetched map.
4. Re-keying the licence exception onto `origin` touches four predicates
   (rule 12, `isDraft`, the Wikidata import's `handWritten`, the CShapes
   import's `ownedBy`), and a CShapes re-run drops any field outside
   `ENRICHABLE`, so a signature on an imported actor would be erased. →
   all four in one commit; the import stops owning a record that carries
   a human signature; `origin` written only by the creator.
5. A migration applied on read, not on disk, wedges `validate --index`,
   the deploy and the import loop; the chain must also reach the browser.
   → the chain in `src/validate/migrate.js` (pure, ordered), applied by
   `read.mjs`, with a one-shot writer that rewrites disk in the same
   commit; never a migrated-on-read-only tree.
6. B8 mis-transcribed: `windowAt` is the "map at Y" control. → fix the
   search box's call site only.
7. "Openings only" for the panel is too narrow: the card also renders from
   `chain`, `horizon` and the window. → a render key of openings + chain +
   horizon + resolved window, window-dependent bits updated in place.
8. `?walk=` and `data/walks/` contradict "no reserved folders" and the
   backlog's rule that a generated narrative never enters `data/`; a
   stitched path is itself a claim. → no directory; a generated walk lives
   in the session only, never committed, with a provenance line.
9. Prerendering as `entry/<id>.html` breaks the `entry.html?id=` address
   and puts a file per record in git. → `entry.html?id=` stays the
   address; prerender `sources.html`, `narratives.html` and a bounded set
   of entries; count and bytes printed by the build.
10. No H-milestone had a brief, a "Done when" or a run-sized scope. →
    split (below), one brief each.
11. H1 is not code-only (region boxes in the manifest) and two branches
    that both rebuild the hashed index cannot merge. → region boxes
    derived at load from `data/geo/regions.json`; parallel branches never
    commit `data/index/`; one rebuild commit after the merge.
12. Grid clustering is bit-identical only under four stated conditions;
    in-view-only clustering changes counts; zoom buckets must round down
    and exempt `coreZoom`. → conditions in the brief; cluster the same set
    as today, cull only drawing.
13. Adjacent-layer inversion counting is the wrong crossing metric for a
    continuous time axis and breaks tested promises. → keep `crosses()`,
    prune by sweep line and bounding boxes; deterministic early stop only.
14. A Worker has concrete traps (`?fixtures=1`, relative fetch, cloning
    cost, untestable under `node --test`); the graph's arrangement key is
    already stale (narrative lens, lane membership). → algorithms first;
    Worker only if a number still demands it; fix the key first.
15. Envelope fields touch nine schema files, `ENVELOPE_KEYS` (a silent
    carry-forward allowlist), `DIGEST_KEYS`, rules 24+ for the
    conditional requirements, and the byte-identity round-trip test. →
    checklist in the H5 brief, in order.
16. A `schema` bump rewrites every record; the PR gate does not run
    `--index`. → migration 001 additive at schema 1; a trivial reversible
    002 proves the chain; `--index` added to the PR gate for `data/`.
17. The registry must be leaf modules; `schemas.js` cannot be derived
    from it; the promised "only the registry" test cannot pass. → leaf
    modules; two consistency tests instead (registry = schema enums,
    KINDS = KIND_DIRS).
18. Stripping tombstones to four fields weakens rule 21 and two display
    paths. → tombstones keep `wikidata`, `when`, `title`.
19. Dropped from the reviews: A20 (aliases not resolved by narrative steps
    and citation keys), A18's second half, A31's mechanism, B31's tree,
    a bookkeeping slip in H1. → A20 first commit of H5; timeline scale
    stands as M6 decided; static history file; H1 renumbered.
20. `?edge=` and the chain as event ids break the URL grammar. → dropped.
21. Weighted shortest paths change which chain the atlas hands the reader.
    → `shortestPaths` unchanged; ranking as a separate ordering of the
    answer list.
22. Writing the view into the reading-mode URL contradicts `CLAUDE.md`. →
    popstate fix only; the reading-mode URL stays two parameters.
23. Notifying on the next frame changes the store's contract. → coalesce
    URL writes to a frame; keep `notify` synchronous; explicit render keys.
24. The deploy allowlist would drop `?fixtures=1` and `tools/`. →
    `tests/fixtures/data/` allowlisted; the migration chain under `src/`.
25. `sitelinks` either/or. → stored as `{ count, on }`, additive.
26. The benchmark harness needs a seeded generator, never its output, and
    must not match `*.test.mjs`. → `tests/bench/run.mjs`.
27. Answering a Save before the rebuild makes the dashboard read stale
    state. → a save queue, the topology patched in memory, `/__status`.
28. `rules.js` holds a NUL byte (grep prints nothing); rendering only the
    window's events is a visible design change. → separator changed in a
    one-line commit; out-of-window events keep a faded stub or a density
    strip, recorded in `ARCHITECTURE.md`.
