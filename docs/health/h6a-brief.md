# Build brief — H6a: the contributor

Health cycle; after H5b and H3c. Read `docs/health-plan-2026-09-05.md`
(H6a), `docs/health-review-2026-09-05-B.md` findings 6, 26, 27,
`docs/health-review-2026-09-05-A.md` findings 10, 29, 30,
`docs/review-2026-09-05-health-plan.md` finding 1. Code only.

1. **A reference picker** (`src/contribute/picker.js`) on the search
   shard: typeahead over the kind's index showing kind, years, place and
   degree beside each hit and the target's existing links; "in this
   bundle" entries first; arrow keys; used for every reference field in
   the form and the review editor; the `<select>`s go.
2. **Duplicate search for every kind**, including identifiers (`wikidata`,
   DOI, ISBN) and names/aliases; debounced.
3. **Validation of the changed record** against a universe built once
   from the spine, with an incremental cycle check from the new edges.
4. **"Edit this record"** on every card, prefilling the form from the
   record (`valuesFromRecord`); field-level corrections through the
   correction template.
5. **The pipeline**: contributions land with `review.flags:
   ['contributed']` and `review.note: 'issue #n'`; the PR body links
   `review.html?open=<id>` (add `?open=`); the identifier check runs
   before the PR and goes into its body; `bundle-to-files.mjs
   --correction` runs `retractionPlan` and adds the cascade or reports
   it.

Done when: a browser test types three letters and picks an event among
20k synthetic ones under 100 ms per keystroke; `node --test` and the
validator green; `H6a done`.
