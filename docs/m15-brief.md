# Build brief — M15: Wikidata identity on records, and citation checks

Written 4 September 2026 after `docs/review-2026-09-04-plan.md`. Runs
after M14. Read, in this order: `CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md`
(current revision; you write the next), `CONTEXT.md`,
`docs/run-protocol.md` (with its amendments of today), `docs/m2-brief.md`,
`docs/m13-brief.md`, `docs/review-2026-09-04-plan.md`, then this file.
Rules of engagement as in every brief since `docs/m4-brief.md`; **no
network access exists in this sandbox** — everything here is offline; no
historical text.

## Part 1 — identity fields

On `event`, `actor` and `place` records, three **optional** fields:

- `wikidata`: `^Q[1-9][0-9]*$`; unique per kind (rule).
- `wikipedia`: object of language code → article title, e.g.
  `{ "en": "Carnation Revolution", "pt": "Revolução dos Cravos" }`;
  allowed only with `wikidata`.
- `sitelinks`: integer ≥ 0 — the number of language editions, a stored
  fact for a later editorial decision. It does **not** feed `prominence`
  or `weight`; `ARCHITECTURE.md`'s reservation of `prominence` stands.

These are written by the import (M16) or derived by the form from a
pasted Wikipedia/Wikidata URL (`wikidata` only; titles come later from the
import). The dashboard shows them read-only.

**Before any data carries them**: `src/contribute/bundle.js` must preserve
them through a save — add them to the preserved-keys list beside
`ENVELOPE_KEYS` (or as read-only `FIELDS`), and extend the round-trip test
("an unedited save is byte identical") with a fixture record that carries
all three. Same for the citation flag in Part 3.

## Part 2 — the link

Every card (event, actor, place) with a `wikipedia` title shows "Read more
on Wikipedia" in the reader's language when available, else English, else
the first available — an external link built from the language and the
title, `rel="noopener"`, through `safeUrl`. The topology carries
`wikidata` and the titles so the panel needs no extra fetch. Search
indexes the titles as variant names.

## Part 3 — citation checks, as flags not gates

The owner wants to check each cited source, not only the text. Without
touching the citation shape (`sources[].{source, locator}` stays as it
is), a record's optional `review` block gains `citations`: a map from
citation index (or `source` id) to `{ "verified": { "by", "on" } }`. The
dashboard lists the open record's citations with the source's link and a
"verified" toggle each; the validator counts citations without a
verification across the dataset and prints the number; the queue shows
"n citations unverified" per record. **Sign warns when citations are
unverified and does not block.** `place`, `source` and `region` have no
citations and are unaffected.

## Part 4 — source records for the imports to cite

Create `data/sources/wikidata.json` (type `dataset`, creators
`["Wikidata contributors"]`, title "Wikidata", url
`https://www.wikidata.org/`), `wikipedia-en.json` and `wikipedia-pt.json`
(type `web`, creators **identical** on both: `["Wikipedia contributors"]`,
titles "Wikipedia, English edition" / "Wikipedia, Portuguese edition",
url, `accessed` today). All CC-BY-SA-4.0 as source records; the CC0 status
of Wikidata's data and the CC BY-SA of Wikipedia's text are stated in the
records' titles/publisher and in `data/LICENSE`.

New rule: **an edge may not be `consensus` when every supporting citation
is a Wikipedia record**; tested.

## Docs

`ARCHITECTURE.md` next revision: the three fields, the citation flags, the
rule, the source records, and the sentence that identity fields are
additive and import-written. `about.html`: the Wikipedia link and what it
is not (the atlas's own text). `CLAUDE.md` if the layout changes.

## Done when

The schemas accept the fields and reject a `wikipedia` without `wikidata`;
uniqueness and the Wikipedia-consensus rule have passing and failing
fixtures; a fixture record with all fields round-trips byte-identical
through `bundle.js`; a card with a title shows the link (headless
Chromium against `?fixtures=1`, with a fixture carrying a title);
`node tools/validate.mjs` prints the unverified-citation count; tests
green; `STATUS.md` with the literal line `M15 done`; an "M15" section on
PR #1.
