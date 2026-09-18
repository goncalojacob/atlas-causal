# Build brief — M8: the test dataset to 2025

Written 3 September 2026. Runs after M7 (`docs/m7-brief.md`) has landed on
`m0`. Read, completely and in this order: `CLAUDE.md` (including the dated
test-dataset exception), `STATUS.md` ("Dates to verify", the roles in use,
"Entities that could be split"), `ARCHITECTURE.md` (current revision; this
run changes no structure and writes no revision unless forced),
`docs/m4-brief.md` (how the last batch of records was specified), then
this file. Rules of engagement as in every brief since `docs/m4-brief.md`.

**This is a content run.** Everything it writes under `data/` is under the
owner's dated exception in `CLAUDE.md` — assistant-drafted, every record
carrying `authors: [{ "name": "Claude (assistant draft, unreviewed)",
"github": null }]`, hedged where accounts differ, every date you are not
sure of listed under `STATUS.md` → "Dates to verify". Match the style of
the existing records exactly: envelope, `when` with `date` and `calendar`,
`where` with precision, sources by id with `locator: null`, `actors` with
short roles drawn from the vocabulary already in use where one fits.

## Part 1 — events, 2011 → 2025

Extend the 20th–21st century Portugal set from the 2011 bailout to 2025.
Around twenty events; dates below are from memory — verify what you can
against the sources, flag the rest.

| id | what | date | place |
|---|---|---|---|
| `troika-programme-ends-2014` | Portugal leaves the adjustment programme without a precautionary line | 2014-05-17 (verify) | Lisbon |
| `bes-resolution-2014` | Resolution of Banco Espírito Santo; Novo Banco created | 2014-08-03 | Lisbon |
| `legislative-election-2015` | Legislative election; the right wins without a majority | 2015-10-04 | Lisbon |
| `geringonca-2015` | The PS minority government backed by BE, PCP and PEV takes office | 2015-11-26 (verify) | Lisbon |
| `marcelo-elected-president-2016` | Marcelo Rebelo de Sousa elected president | 2016-01-24 | Lisbon |
| `euro-2016-final` | Portugal wins the European Championship | 2016-07-10 | Saint-Denis (region: europe) |
| `pedrogao-grande-fires-2017` | The Pedrógão Grande fires | 2017-06-17 → 2017-06-24 (verify end) | Pedrógão Grande (precision region) |
| `october-fires-2017` | The fires of 15 October 2017 | 2017-10-15 | central Portugal (precision region) |
| `legislative-election-2019` | Legislative election; the PS wins without a majority | 2019-10-06 | Lisbon |
| `covid-state-of-emergency-2020` | First state of emergency of the pandemic | 2020-03-18 → 2020-05-02 (verify) | Lisbon |
| `marcelo-reelected-2021` | Marcelo Rebelo de Sousa re-elected | 2021-01-24 | Lisbon |
| `legislative-election-2022` | Legislative election; PS absolute majority | 2022-01-30 | Lisbon |
| `world-youth-day-2023` | World Youth Day in Lisbon | 2023-08-01 → 2023-08-06 | Lisbon |
| `costa-resigns-2023` | António Costa resigns after the Operation Influencer searches | 2023-11-07 | Lisbon |
| `legislative-election-2024` | Legislative election; AD wins narrowly, Chega quadruples | 2024-03-10 | Lisbon |
| `montenegro-government-2024` | The Montenegro government takes office | 2024-04-02 | Lisbon |
| `fiftieth-anniversary-25-april-2024` | Fifty years of 25 April | 2024-04-25 | Lisbon |
| `government-falls-2025` | The government loses a confidence vote | 2025-03-11 (verify) | Lisbon |
| `iberian-blackout-2025` | The Iberian Peninsula blackout | 2025-04-28 | Lisbon (region: europe) |
| `legislative-election-2025` | Legislative election of May 2025 | 2025-05-18 | Lisbon |

For 2024–2025, write less and hedge more: these are recent, the sources
below barely reach them, and the reviewer will have to rely on primary
sources. Where you cannot cite a work in the bibliography for an event,
add a `web` or `primary` source record for an official publication
(Diário da República, CNE results, Banco de Portugal, INE, DGS) with its
URL and `accessed` date — never an encyclopedia.

## Part 2 — edges

Wire each new event into the graph with at least one edge and an
explanation written as an argument; disputed where accounts differ (the
causes of the 2011–2014 recovery, the reading of the 2024 and 2025
results, the fires' causes are all candidates). Suggested spine:
`troika-bailout-2011 → troika-programme-ends-2014` (caused),
`bes-resolution-2014` reacting to the post-programme banking situation,
`legislative-election-2015 → geringonca-2015` (enabled), `geringonca-2015 →
legislative-election-2019` and `→ legislative-election-2022`
(precondition-of, probable), `costa-resigns-2023 → legislative-election-2024`
(caused), `legislative-election-2024 → montenegro-government-2024` (caused),
`montenegro-government-2024 → government-falls-2025 →
legislative-election-2025` (caused). Keep `consensus` for what really is
consensus; two independent-author sources are required for it.

## Part 3 — actors

Add the actors these events need, with roles on every new event: persons
`antonio-costa` (1961–), `pedro-passos-coelho` (1964–),
`marcelo-rebelo-de-sousa` (1948–), `luis-montenegro` (1973–),
`andre-ventura` (1983–), `ricardo-salgado` (1944–); institutions
`partido-socialista` (1973–), `psd` (1974–), `cds-pp` (1974–), `pcp`
(1921–), `bloco-de-esquerda` (1999–), `chega` (2019–), `banco-espirito-santo`
(1869–2014), `novo-banco` (2014–), `banco-de-portugal` (1846–), `european-central-bank`
(1998–), `european-commission` (1958–). Reuse `imf`, `cavaco-silva`,
`european-economic-community` where they fit (the EEC actor ends in 1993;
do not stretch it — the EU is a different actor if you need one, with its
own dates). Founding dates from memory; verify or flag.

## Part 4 — sources

Add real works only. Candidates you may know: Fernando Alexandre, Pedro
Bação and Miguel Portela on the crisis and adjustment (verify exact title
and year); the IMF's ex-post evaluation of the Portuguese programme
(2016); Marina Costa Lobo on Portuguese politics after 2015; António Costa
Pinto and Conceição Pequito Teixeira (eds.), *Political Institutions and
Democracy in Portugal* (2019); official results from the CNE for each
election. Same identifier rule as the rest: a WorldCat search URL is
acceptable for a book, an official URL with `accessed` for the web
sources.

## Part 5 — the years the territories layer does not reach

CShapes ends in 2019. Make sure the interface says so plainly when the
window's end is later than 2019 — the band marker and the layer's empty
state — rather than silently drawing nothing. If M6 already did this,
verify and move on.

## Done when

The dataset validates with 0 errors; the new events, edges and actors are
in; every date not verified is listed; `STATUS.md` updated with counts,
"Dates to verify", and the literal line `M8 done`; an "M8" section on PR
#1; verified in headless Chromium that the timeline reaches 2025 and the
map handles a window ending after 2019.

## Amendments after review (3 September, afternoon) — these override the body

- **Protocol and order.** M8 now runs **after M9**: gate on `M9 done`;
  follow `docs/run-protocol.md`; `M8 done` as its own line. Events are
  written with `place: "<id>"`, not `where`; create the places that do not
  exist yet (Saint-Denis, Pedrógão Grande, the central-Portugal fire zone)
  as place records in the same style as the migrated ones.
- **You cannot reach the web.** Do not create `web` sources: an `accessed`
  date on a page nobody opened would be a false statement in the one field
  that exists to say the page was seen. Cite the books where they reach;
  for official publications use `type: "primary"` with `repository`
  ("Diário da República", "Comissão Nacional de Eleições", "Banco de
  Portugal", "Instituto Nacional de Estatística") and `reference` (the
  series and number, or "official results, legislative election of
  2025-05-18") where you know it. **List every date** of this batch under
  "Dates to verify" — do not claim to have verified any.
- **Part 5**: the clamp to the last shard is already M6's job; verify it
  and assert: `?to=2025` draws the 2019 outlines with the marker text
  "borders as of 2019" visible.
