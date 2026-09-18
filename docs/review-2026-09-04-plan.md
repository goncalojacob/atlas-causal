# Plan review — 4 September 2026 (Wikidata, M15–M18)

Independent Opus review of the plan agreed with the owner this morning,
before briefs were written. Twenty-six findings; the decisions taken on
each are below, and the briefs `docs/m15-brief.md` … `docs/m18-brief.md`
carry them. Numbering follows the reviewer.

1. **The Action could not be dispatched** (workflow_dispatch resolves on
   the default branch, `main`, which has no workflows). *Decided:* the
   Action triggers on **push to `import/**`** branches; the cloud run
   pushes such a branch from `m0`, the Action runs the tool there and
   commits its results to that branch, the run fast-forward-merges it.
2. **The shepherd was hardcoded to M13.** *Fixed:* routine updated —
   order 14 15 16 17 18, complete at `M18 done`, gate instant today.
3. **Action and run both writing `m0` deadlocks.** *Fixed* by 1: the
   Action never touches `m0`; the merge is the run's own commit, and the
   protocol says so (§3 amendment in `docs/run-protocol.md`).
4. **Network only in the Action.** *Fixed:* every brief separates offline
   work (sandbox) from the one online job (runner); the tool's fetch layer
   is injectable and tests use recorded fixtures.
5. **New fields dropped by the dashboard's save.** *Fixed:* M15 adds the
   fields to `bundle.js` (preserved keys) before any data carries them,
   with the round-trip test extended.
6. **Seeds file fails the import-map schema.** *Fixed:* `schema/v1/import-seeds.json`,
   dispatch on the file's `kind`, tool-side list, tests.
7. **A CC0 source record breaks rule 12.** *Fixed:* source records stay
   CC-BY-SA-4.0; the data's CC0/CC BY-SA status is stated in the record
   and in `data/LICENSE`.
8. **`prominence` from sitelinks contradicts its reservation and churns
   the index.** *Decided:* store `sitelinks` as a fact; leave `prominence`
   alone; the map keeps `prominence ?? weight`. Owner decision in backlog.
9. **Draft debt ×5 while signing gets harder.** *Decided:* M18 is split —
   M18 produces a **candidate list** the owner ticks; the import and the
   drafting (M19) run only on ticked candidates, capped at ~120 for the
   first batch; retraction rate is a measured outcome.
10. **"Never overwrite a signed field" undefined.** *Fixed:* the import is
    per-field and additive — writes identity fields only when absent,
    never modifies a non-empty value, never adds an `authors` entry when
    enriching (only when creating).
11. **Re-running the CShapes import wipes ids.** *Fixed:* `cshapes.mjs`
    carries `wikidata`, `wikipedia`, `sitelinks` forward like `created`,
    with a test. (Moot for now — see 23.)
12. **Underivable regions stop the index.** *Fixed:* the import sets
    `region` on places it creates from the item's country, or refuses the
    event; the Action validates and builds the index before committing
    and restores `data/` on failure.
13. **Two-edges rule invites invented edges.** *Fixed in M19:* expected
    retraction rate stated; `docs/m19-retractions.md`; no `consensus` on
    Wikipedia-only support; every drafted edge flagged `edge-drafted`.
14. **Type queries return noise, owner not in the loop.** *Fixed:* M18 is
    the candidate list, nothing under `data/`; the owner ticks.
15. **Rate limits, UA, timeouts unbudgeted.** *Fixed:* UA constant, serial
    requests with delay, `maxlag`, per-decade queries, backoff, a call
    budget, `timeout-minutes`.
16. **Half-finished Action leaves an inconsistent tree.** *Fixed:* cursor
    file, commit per batch of 25, each commit validates.
17. **Wikipedia as a source vs rule 9.** *Fixed:* two records
    `wikipedia-en` / `wikipedia-pt` with identical `creators`; a new rule:
    no `consensus` when every support is Wikipedia; an edge's argument
    must rest on a book or article.
18. **Stored leads unvalidated and published.** *Fixed:* leads live under
    `tools/import/cache/wikipedia/` with a schema-checked envelope
    (qid, lang, title, revid, fetched, licence, url, history url, text),
    excluded from the Pages upload, attributed in `data/LICENSE` and
    `about.html`.
19. **Rewriting summaries destroys owner decisions.** *Decided:* M17
    rewrites summaries with the safeguards — skip records with a `review`
    block, skip signed records, never touch the two date-disagreement
    events, keep the old text in `docs/m17-summaries.md` — because the
    owner asked for longer summaries.
20. **Per-citation verification as a hard gate.** *Decided:* it becomes a
    `review` flag per citation counted by the validator and shown in the
    dashboard; Sign warns, does not block; `place` and `source` have no
    citations. (M15.)
21. **Imported facts vs drafted prose on one record.** *Fixed:* enrichment
    adds no `authors` entry; created records carry the import author;
    imported facts carry `review.flags: ["imported-facts"]` that Sign
    clears.
22. **"Certain match" undefined.** *Fixed:* exact diacritic-insensitive
    name match AND `P31` consistent with the kind/`actorType` AND dates
    within ±1 year AND exactly one candidate; the rest to
    `docs/m17-ambiguous.md`.
23. **CShapes actors and identifiers.** *Decided:* not in this pass; only
    the hand-written ~61 actors, 80 events, 25 places are matched.
24. **Action pushes skip CI.** *Fixed:* the Action runs validator and
    tests before committing, fails without pushing otherwise.
25. **Schedule unrealistic; reorder.** *Adopted:* M15 identity fields +
    link + citation flags; M16 tool + Action; M17 reconcile + summaries;
    M18 candidate list; **stop for the owner**; M19 (import + drafting) is
    briefed after the owner ticks. The daytime schedule supersedes
    "builds after 18:00" for today, at the owner's request.
26. **No M14 brief in the tree.** It lives on `origin/brief-m14` and the
    M14 run copies it in (the reviewer could not see the branch).

Not verified: runner access to Wikidata/Wikipedia (assumed); live rate
limits; Actions minutes on a private repository; `grep` silently empty
in the sandbox — briefs use `awk`/`sed` for checks.
