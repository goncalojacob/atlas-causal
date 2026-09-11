# Build brief — M27: the colony/state splits, worked down

Written 4 September 2026, evening, from the owner's request to add the
remaining CShapes splits to tonight's work. Runs after M26. Read:
`CLAUDE.md` (the CShapes licence paragraph), `STATUS.md`, `ARCHITECTURE.md`,
`docs/run-protocol.md`, `docs/m5-brief.md`, `CONTRIBUTING.md` →
"Correcting a territory", `data/imports/cshapes-actors.json` (the existing
`splits` for India and Indonesia are the pattern), `tools/import/cshapes.mjs`
and `docs/cshapes-entities.md` (the 89 codes), then this file. This is a
data-mapping milestone under the import's own rules: nothing is written by
hand into a presence, an outline or an imported actor — only the mapping
file changes and the import is re-run. No historical text.

## The rule

The owner decided that a colony and the independent state that followed
it are two actors. Work the report down by that rule and no other:

- Split a code where the source shows it **as a dependency** ("colony" in
  the *Held by another* column) before its *First independent* date, at
  that date. The date is one CShapes itself draws, so the import accepts
  it.
- Do **not** split a code whose only other condition is **occupied**
  (Haiti, Serbia, Montenegro, the two Germanies, Iceland's occupation…):
  an occupied state is the same actor. Where a code shows both — colony
  then occupation, or the reverse — split only at the colony boundary.
- Do not split a code that was independent first and a dependency later
  unless the report's own boundary makes that the *First independent*
  date; list any such case as not split and say why.

The colonial-era actor: an id ending in the sovereign or the source's
own dependency name where it has one (for instance
`gold-coast` if CShapes names the period Gold Coast, else
`<actor>-under-<sovereign>`), `kind: polity`, `names` from the source,
`when` bounded by the period, `dependencyOf` handled as the import
already does for presences, sources = the dataset, the import's author
entry — whatever `cshapes.mjs` writes for a split actor today. If the
tool cannot name a split actor from the source's own fields, extend the
mapping schema minimally (a `title` on a split entry), validate it in
`schema/v1/import-map.json`, and record the deviation. The independent
state keeps the existing actor id, so every event, relation and presence
that already points at it keeps pointing at the right thing.

Batches: commit the mapping file and the re-run's output **one region of
the world at a time** (Caribbean and Americas, Europe, Africa, Asia and
Pacific), pushed at once, validator clean and tests green at every commit;
`docs/cshapes-entities.md` regenerated with `--report` each time so the
remaining list shrinks in the repository. Every split appears as a row in
`docs/m27-splits.md`: code, colonial actor, state actor, date; below it,
the codes deliberately not split, each with its reason.

## Checks

Portugal's own former territories (Cape Verde 402, Guinea-Bissau 404, and
whichever others appear) end up as a colony actor held by `portugal` and a
state actor from independence; the events already in the dataset that name
the state (`angola-independence-1975` and the like) still resolve. The
palette is rebuilt (`tools/build-palette.mjs`) and the index after it. The
CShapes licence paragraph is untouched: nothing derived from the source
enters a CC BY-SA record.

## Done when

The report lists no colony-only code as unsplit; `docs/m27-splits.md`
accounts for all 89; the map at 1960 and at 1975 shows the African
territories changing hands under hover names that differ before and after;
validator (`--index`) and tests green; `STATUS.md` with counts (codes
split, not split, actors created, presences re-derived) and the literal
line `M27 done`; an "M27" section on PR #1.
