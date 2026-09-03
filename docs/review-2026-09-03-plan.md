# Plan review — 3 September 2026

Adversarial review of the M6–M13 briefs and of the overnight scheduling
(gates, fallback branches, the shepherd) by an independent Fable agent, before
the chain ran. Findings are summarised; every accepted fix is in
`docs/run-protocol.md` or in the "Amendments after review" section of the
brief it concerns. Numbering follows the reviewer's ranking.

1. **Fallback branches cascade into unmergeable work** (fix before tonight).
   Each milestone is a serial edit of the same files; a run that branched off
   `m0` after a timeout would never see the previous milestone's done line,
   and every later run would branch from the wrong base. *Fixed:* no fallback
   branches; gated runs wait then stop; the shepherd is the only continuation.
2. **"Before 17:00Z" read as a clock time** would silence the shepherd from
   midnight to 17:20. *Fixed:* an absolute instant in the decision script.
3. **Two agents on one milestone**: no claim, and a 45-minute quiet rule
   shorter than a run's reading phase. *Fixed:* a `M<n> started …` claim line
   as the first pushed commit; a rejected push means stop; the shepherd's
   activity rule uses the claim age and the last push (5 h / 90 min / 60 min).
4. **The timeline cannot both zoom to the window and be its only control.**
   *Fixed:* the lanes stay on the full extent; the band is drawn over them.
5. **Default window ends past the last territory shard.** *Fixed:* territories
   clamp to the last shard with the marker "borders as of 2019".
6. **M8's `web` sources would carry a fabricated `accessed` date.** *Fixed:*
   no `web` sources; `primary` with repository and reference, or the books;
   every date listed for review.
7. **M9 before M8**, three ordered commits, an idempotent migration, only
   events migrate, the place-id rule, the list of readers of `event.where`.
   *Fixed* as stated; the schedule reordered 6 → 7 → 9 → 8 → 10 → 11 → 12 → 13.
8. **The done line underspecified.** *Fixed:* `M<n> done` as its own line under
   `## Milestones landed`, checked with `grep -qxF`; the shepherd checks the
   brief's Done-when before continuing a milestone.
9. **`tools/serve.mjs` was CSRF-able.** *Fixed:* loopback bind, Host and Origin
   checks, no CORS or OPTIONS, JSON only, kind and id checked before any path.
10. **The editor would wipe the envelope.** *Fixed:* `valuesFromRecord`
    round-trip; saves preserve the envelope; saves are bundles so Retract can
    cascade.
11. **Reading mode versus chain contiguity and URL authority.** *Fixed:*
    reading mode is authoritative; chain = longest contiguous run; edge steps
    select `to`; the previous state is remembered and restored.
12. **M6 needs the CShapes file to re-run the import.** *Fixed:* the retrieval
    recipe is in the brief; never hand-edit presences; splits on feature
    boundaries only.
13. **`?year` legacy and "map at Y".** *Fixed:* `from`/`to` may be null (data
    bound); `?year=X` → `{from: null, to: X}`; "map at Y" sets `to = Y`.
14. **Graph x on the window's scale contradicted "whole graph visible".**
    *Fixed:* full-extent scale; tie-breaks by id then weight.
15. **Usage accounting of pollers.** *Fixed:* gates poll from shell loops in
    ten-minute Bash calls; the shepherd's first call is one decision script.
16. **Card precedence** across `selected`, `source`, `place`, `actor`. *Fixed*
    in M9 and M10.
17. **Relation ids and rules.** *Fixed:* a `RELATION_ID` pattern in all four
    places; per-type acyclicity; an actor-type table.
18. **The mapping file outside every reader.** *Fixed:* `readImportMaps`,
    tool-side validation, the report to `docs/cshapes-entities.md`.
19. **The dated exception did not cover places, relations, narratives.**
    *Fixed* in `CLAUDE.md`.
20. **Sign is free-text attribution.** *Fixed:* recorded as the one local
    exception in the ARCHITECTURE amendment.
21. **Window semantics for open intervals.** *Fixed:* named via `extent()`.
22. **Done-when clauses without numbers.** *Fixed:* each brief now gives
    counts to assert.
23. **`panel.js` absorbs four more cards.** *Fixed:* M9 splits it first.

Not verifiable in advance: how routines meter a waiting session; whether the
CRAN mirror is reachable tonight; M8's dates (same source as the agent's).
