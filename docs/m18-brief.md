# Build brief — M18: the candidate list for the big dataset

Written 4 September 2026 after `docs/review-2026-09-04-plan.md`. Runs
after M17. Read: `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md` (today's
amendments), `docs/m16-brief.md`, `docs/review-2026-09-04-plan.md`, then
this file. **Nothing under `data/` is written in this milestone.**

## What it produces

`docs/m18-candidates.md`: a table of candidate events for 1890–2025 —
Wikidata id, label (en/pt), date, type, sitelink count, whether a record
already exists — grouped by period, for the owner to tick. The owner's
selection, capped at about **120 for the first batch**, is what M19 will
import and draft edges for.

## How

1. Write the queries into `data/imports/wikidata-seeds.json` under
   `queries`, **one query per type per decade** (elections, coups and
   uprisings, treaties and agreements, referendums, massacres, major
   legislation, independences, disasters, battles) restricted to items
   whose country (`P17`) or location is Portugal or a territory it
   administered in that decade, or whose participants include a Portuguese
   state or movement; commit to `m0`.
2. Push `import/candidates-2026-09-04`; the Action runs `--candidates`,
   which executes the queries with `maxlag`, backoff and the call budget,
   writes the table, and commits it to the branch. Poll; `git merge
   --ff-only` into `m0`.
3. Add to the table a short note per period on what the queries missed by
   construction (things Wikidata does not type as events).

## Done when

`docs/m18-candidates.md` exists on `m0` with the counts per period and
a line at the top telling the owner how to tick (a column to fill),
`STATUS.md` says so with the literal line `M18 done`; an "M18" section on
PR #1. The chain stops here for the owner.
