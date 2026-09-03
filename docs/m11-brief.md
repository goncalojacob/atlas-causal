# Build brief — M11: relations between actors

Written 3 September 2026. Runs after M10. Read, in this order: `CLAUDE.md`
(including the test-dataset exception), `STATUS.md`, `ARCHITECTURE.md`
(current revision; you write the next), `CONTEXT.md`, `docs/m2-brief.md`,
`docs/m4-brief.md`, `docs/m6-brief.md`, then this file. Rules of
engagement as in every brief since `docs/m4-brief.md`.

## The `relation` kind

A typed, dated link between two actors — the relation this project did not
have, named in `STATUS.md` since M5. `schema/v1/relation.json`: the
envelope (sources required, as for edges), `from`, `to` (actor ids),
`type` from a **closed** enum: `regime-of` (a regime to its state:
Estado Novo → Portugal), `succeeded` (British India → Republic of India),
`member-of` (a person to a party or body), `part-of` (an agency to the
state or body it belonged to), `led` (a person to the body they headed),
`allied-with`; `when` (interval, `end: null` allowed); `note` optional
short text. Id derived `from--to--type` like edges. Do not add a generic
type; if one is missing, say so in `STATUS.md`.

Rules: both actors resolve and differ; interval rules; `regime-of` and
`succeeded` are acyclic; a person cannot be `regime-of` anything; the
relation's interval inside both actors' `when` is a warning. The topology
carries relations; `data.js` builds adjacency by actor.

## The site

- The **actor card** shows relations in both directions, grouped by type
  with dates — "Regime of Portugal, 1933–1974"; "Regimes: First Republic
  1910–1926, Military Dictatorship 1926–1933, Estado Novo 1933–1974";
  "Members: …"; "Succeeded by …" — each a link.
- The **graph view** may optionally show actor relations as a second
  layer; only if it stays readable — otherwise the card is enough. Record
  the choice.
- Contribution form: `relation` as a record type; `new-record.mjs
  relation …`; `bundle-to-files.mjs`.

## Records — under the test-dataset exception

Draft the relations the dataset implies, assistant-authored and marked as
every draft record is: the four regimes `regime-of` `portugal` (which
exists since M5) with their dates; `british-india` `succeeded` by
`republic-of-india` and `dutch-east-indies` by `indonesia` (dates from
the mapping file); `pvde-pide-dgs`, `legiao-portuguesa`,
`council-of-the-revolution` `part-of` the regime or republic they belonged
to; persons `led` the bodies they headed where the dataset says so
(Salazar → Estado Novo, Caetano → Estado Novo, Cabral → PAIGC, Mondlane →
FRELIMO, Costa → PS, Montenegro → PSD, Ventura → Chega, etc.);
`member-of` for persons and parties from the M8 batch. Sources as the
records they come from; dates flagged under "Dates to verify" where
unsure.

## Done when

Relations validate; the Portugal card lists its four regimes; Salazar's
card says what he led; tests green; the next `ARCHITECTURE.md` revision;
`STATUS.md` with the literal line `M11 done`; an "M11" section on PR #1.
