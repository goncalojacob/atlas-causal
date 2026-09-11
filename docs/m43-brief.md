# Build brief — M43: the map and the timeline before 1886

Owner's request, 5 September 2026: the world at scale (M42) reaches back
past the nineteenth century, so the map's territories and the timeline
must reach back with it. Runs after M39 (the projection) and before M42.
Read `CLAUDE.md` (the CShapes licence paragraph; the exception), `STATUS.md`,
`ARCHITECTURE.md` (presences, "deep time"), `CONTEXT.md`, `docs/m5-brief.md`,
`docs/m27-brief.md`, `tools/import/cshapes.mjs` and `identity.mjs`,
`data/imports/cshapes-actors.json`, `src/timeline-scale.js`, `src/util/window.js`,
`docs/BACKLOG.md` → World scope, then this file. Two runs.

## M43a — territories before 1886, from a second import

1. **Source, chosen by licence and coverage, in the sandbox's reach
   (GitHub only).** Candidates the run evaluates and records in
   `STATUS.md` with the licence text found in the repository: the
   `aourednik/historical-basemaps` world-borders snapshots (many years
   from antiquity to the twentieth century), and any other openly
   licensed snapshot set reachable from GitHub. **Accept CC BY-SA, CC BY,
   CC0 or public domain outright; accept CC BY-NC-SA only under the
   isolation CShapes already has (its own directory, its own licence
   file, `IMPORT_AUTHORS`, rule 12); refuse anything more restrictive and
   say so.** The owner's standing preference is public domain wherever
   there is a choice.
2. **Snapshots become presences with honest confidence.** A snapshot at
   year Y holds until the next snapshot: `when: { start: Y, end: Y' }`,
   `confidence: probable` (a border drawn for one year and assumed until
   the next is a claim, not a record), `sources` the dataset, `origin`
   the import; the outline in a period shard under `data/geo/presences/`;
   the actor by the source's own name through a mapping file
   `data/imports/<source>-actors.json` that is **data, not code**, as
   `cshapes-actors.json` is, with `splits` and reuse of existing actors
   where the name resolves unambiguously (Portugal, Spain, France,
   England, the Ottoman Empire…) and new imported actors otherwise,
   marked. Where the second source overlaps CShapes (1886 on) CShapes
   wins and the snapshot is dropped.
3. **Coverage: 1415 onward**, the atlas's founding period, as far back as
   the source goes with a snapshot at least every fifty years; earlier
   snapshots imported but not required. The palette regenerated over all
   borders; the index rebuilt; sizes reported.
4. `tools/import/<source>.mjs` with pure halves and fixture tests; the
   Action pattern only if the fetch cannot be done from GitHub raw in the
   sandbox (it can, for a repository on GitHub); `data/geo/LICENSE`;
   `about.html`'s territories section.

Done when: the map scrubbed from 1415 to 2019 shows borders at every
year, `probable` outlines hatched or dashed as `about.html` explains;
Portugal's 1500 territory is drawn; validator `--index` byte-identical;
tests green; `M43a done`.

## M43b — the timeline over five centuries

The timeline's extent is the data's own (a null bound is "as far as the
data goes"), so once M42 adds events before 1890 the lanes stretch; what
must change is the **scale**: `src/timeline-scale.js` gains a scale that
is linear inside the band and compressed outside it (or bucketed by
century past a density threshold), the tick labels follow, the band's
handles and the wheel zoom (M24) work at every extent, the density strip
(H4c) covers the compressed part, and the default window opens on the
century with the most events rather than on 1890–2025. Nothing in the
URL changes; `?from=1415&to=1580` opens the founding period.

Done when: with the fixtures extended to 1415, the timeline shows the
whole extent legibly at 1440 px and at phone width (screenshots under
`docs/screens/m43-*.png`); the band can be dragged from 1415 to 2025;
tests green; `M43b done`.
