## What this changes

<!-- One paragraph. For records: which events, edges, sources, and why. -->

## Review checklist — the part no tool does

For every record touched:

- [ ] The sources exist, are locatable by the identifier given, and actually support the claim.
- [ ] The explanation argues rather than asserts.
- [ ] The confidence is honest: `consensus` has two independent sources that really agree; a `disputed` edge names real opponents in `dispute.text` and cites them in `dispute.sources`.
- [ ] The edge type is the right one of the five (`caused`, `enabled`, `reacted-to`, `precondition-of`, `inspired`), not the nearest one.
- [ ] Dates checked against the source; `date` is as the source gives it and `calendar` is right when it matters.
- [ ] Not a duplicate of an existing record under another transliteration; searched titles and aliases.
- [ ] Every word of `summary`, `explanation` and `dispute.text` was written by a person.

For code:

- [ ] `node tools/validate.mjs` and `node --test` pass locally.
- [ ] No runtime dependency, no build step, no map library, no CDN.
- [ ] Nothing under `data/index/` is touched; `main` regenerates it.
