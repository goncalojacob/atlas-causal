# Build brief — M17: reconcile the hand-written records, and longer summaries

Written 4 September 2026 after `docs/review-2026-09-04-plan.md`. Runs
after M16. Read, in this order: `CLAUDE.md` (the dated exception),
`STATUS.md`, `ARCHITECTURE.md`, `docs/run-protocol.md` (today's
amendments — the import-branch rule), `docs/m2-brief.md`,
`docs/m16-brief.md`, `docs/review-2026-09-04-plan.md`, then this file.

## Part 1 — reconcile (the Action does the network part)

1. Write `data/imports/wikidata-seeds.json` with `"reconcile": true` and
   no items; commit to `m0`.
2. Push a branch `import/reconcile-2026-09-04` from `m0`. The Action runs
   the tool in `--reconcile` mode over the **hand-written records only**:
   the 80 events, the 25 places, and the actors whose `authors` do not
   name the CShapes import (about 61). The 250 CShapes polity actors are
   **not** matched in this pass (decision 23 of the review).
3. "Certain" is mechanical: exact, case- and diacritic-insensitive match
   of `names[0]` (or the event `title`) to a label or alias **and** the
   item's `P31` consistent with the kind and `actorType` **and** the dates
   agreeing within ±1 year on both bounds **and** exactly one candidate.
   Certain matches get `wikidata`, `wikipedia`, `sitelinks` written
   (additively). Everything else goes to `docs/m17-ambiguous.md` with the
   top three candidates, labels and dates, for the owner. Expect the
   certain set to be a minority; that is correct.
4. Poll the branch until the Action's final commit; `git merge --ff-only`
   into `m0` (your own commit); if the Action failed, record it in
   `STATUS.md` and stop the reconcile part, keep Part 2.

## Part 2 — longer summaries, under the exception

The owner finds the one-line summaries too short. Rewrite summaries to
three to six sentences — what happened, when and where, who, why it is in
the atlas — from the record's existing sources and, where a lead was
fetched in Part 1, the stored Wikipedia lead in
`tools/import/cache/wikipedia/`, **cited** (`wikipedia-en`/`-pt` with the
title and revision id as locator). Hedge where accounts differ. Rules:

- Skip any record that carries a `review` block (flagged dates), any
  record not carrying the assistant-draft author, and the two events
  `east-timor-invasion-1975` and `guinea-bissau-declares-independence-1973`,
  whose summaries carry the owner's decision of 3 September.
- Write every replaced summary's old text into `docs/m17-summaries.md`
  (id, old, new), so the owner can see what changed.
- Never paste Wikipedia text; write in the atlas's voice, citing it.

## Docs and done when

`STATUS.md` with counts (matched / ambiguous / summaries rewritten), the
ambiguous list pointer, the literal line `M17 done`; an "M17" section on
PR #1; validator and tests green at every commit.
