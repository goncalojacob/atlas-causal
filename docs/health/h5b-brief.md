# Build brief — H5b: the envelope

Health cycle; after H5a is merged and H2 is done. Read
`docs/health-plan-2026-09-05.md` (decisions 2, 5, 9, H5b),
`docs/health-review-2026-09-05-A.md` findings 7, 8, 22, 23, 24,
`docs/health-review-2026-09-05-B.md` findings 16, 17, 31,
`docs/review-2026-09-05-health-plan.md` findings 4, 15, 16, 25,
`tools/import/identity.mjs`, `tools/import/cshapes.mjs` (`ownedBy`),
`tools/import/wikidata.mjs` (`handWritten`), `src/review/sign.js`,
`src/contribute/bundle.js` (`ENVELOPE_KEYS`), `src/review/queue.js`
(`DIGEST_KEYS`). This run rewrites every record once through the
migration chain and regenerates `data/index/`; it owns both.

Follow review finding 15's checklist in this order, one commit each:

1. **Schemas**: `origin`, `retraction`, `review.status`, `review.signedBy`
   optional in `schema/common/provenance.json` **and** in all eight kind
   schemas; `review` no longer requires `flags`; `names` on events;
   `sitelinks` as `{ count, on }`.
2. **Migration 004** (on H5a's chain): `origin` on every record from what
   is known today (`{ tool: 'cshapes' }`, `{ tool: 'wikidata' }`,
   `{ tool: 'assistant' }` for the draft marker, absent for hand-written);
   `review.status` from the marker; `retraction: { on, reason }` from the
   retraction text in `review.note`, the text removed; `sitelinks`
   reshaped; applied to disk with `apply.mjs`.
3. **`ENVELOPE_KEYS`** and **`DIGEST_KEYS`** gain the new keys; the
   byte-identity round-trip test is the safety net and is never edited
   to pass.
4. **The four predicates** move onto `origin`/`review.status` in one
   commit: rule 12's licence hole, `isDraft`, `handWritten`, `ownedBy`;
   **an import never rewrites a record whose `review.status` is
   `reviewed`** (it reports instead); a test simulates a CShapes re-run
   over a signed actor and asserts the signature survives.
5. **Rules** 27 onward: `retraction` present iff `status` is `retracted`;
   `review.status: reviewed` requires `signedBy`; `origin` written only
   by a creator (the import's additive pass never sets it — extend
   `identity.mjs`'s rule and its test).
6. **Sign** keeps `review.citations`; the dashboard defines "unreviewed"
   by `review.status`; region provenance on imported places
   (`regionNote`); licence and attribution per directory in
   `data/LICENSE` and the manifest, and the attribution line on
   NC-derived cards and entry pages.
7. Docs: `ARCHITECTURE.md`, `CONTRIBUTING.md`, `CLAUDE.md`'s exception
   paragraph now points at `origin` and `review.status`.

Done when: every record migrated and validating; the round-trip test
green untouched; the re-run test green; `node tools/validate.mjs --index`
byte-identical; `node --test` green; `H5b done`.
