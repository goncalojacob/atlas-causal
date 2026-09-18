# Build brief — M20: resolve the ambiguous matches, import every candidate

Written 4 September 2026, evening, on the owner's decisions: "solve the
ambiguous issues yourself, for now this is a demo, I'll review later" and
"go for all the M18 candidates". Read, in this order: `CLAUDE.md` (the
dated exception), `STATUS.md`, `ARCHITECTURE.md`, `docs/run-protocol.md`
with its amendments, `docs/m2-brief.md`, `docs/m16-brief.md`,
`docs/m17-brief.md`, `docs/m18-brief.md`, `docs/review-2026-09-04-plan.md`,
then this file. This sandbox has no network; the network work happens in
the GitHub Action on an `import/` branch you push.

## Part 1 — the ambiguous matches

`docs/m17-ambiguous.md` lists the hand-written records the reconcile pass
could not match with certainty, with candidates. For each, decide by
judgment — dates, type, description, the record's own summary — which
candidate is the record's item, or none. Write `wikidata` on the record
(and nothing else; titles and sitelinks come from the Action), add
`"wikidata-assigned-by-assistant"` to the record's `review.flags`
(creating the block if absent), and write every decision with one line of
reasoning to `docs/m20-ambiguous-resolved.md` — including the ones left
unmatched and why. The owner reviews later; the flag is how they find
them. Uniqueness of `wikidata` per kind is a rule: do not assign an item
already carried by another record.

## Part 2 — tick everything

In `docs/m18-candidates.md`, put `[x]` in every candidate row. Record in
`STATUS.md` that the owner chose all 250 over the brief's cap of 120 on
4 September, knowingly, for the demo.

## Part 3 — the import

Push `import/run-2026-09-04` from `m0`. The Action runs the tool in
`--import` mode over the ticked rows: it creates the events with their
facts, the places and actors they need (matching by `wikidata` first,
creating otherwise, actor types from `P31`), caches the Wikipedia leads,
and enriches every record that carries a `wikidata` — including the ones
from Part 1 and the 51 from M17 — with `wikipedia` titles and
`sitelinks`. Poll the branch until `import: done` (or failure after 120
minutes), then `git merge --ff-only` into `m0` — your own commit. If the
Action fails part-way, its cursor lets a second push of a new branch
`import/run-2026-09-04b` resume; do that once before recording a
failure.

Every imported record carries the import author entry and
`review.flags: ["imported-facts"]`, as M16 specified. No edges are
written in this milestone; the imported events will show as `degree-zero`
warnings until M21 and M22, and that is expected — say so in `STATUS.md`.

## Done when

The ambiguous list is resolved with a decisions file; every candidate row
is ticked; the import has landed on `m0` with counts (events, places,
actors created; records enriched); validator clean of errors (warnings
expected and counted); tests green; `STATUS.md` with the literal line
`M20 done`; an "M20" section on PR #1.
