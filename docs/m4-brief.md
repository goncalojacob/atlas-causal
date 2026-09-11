# Build brief — M4: actors, and a denser 20th–21st century test set

Written 2 September 2026. Read, completely and in this order, before
creating any file: `CLAUDE.md`, `STATUS.md` (including all Deviations),
`ARCHITECTURE.md`, `CONTEXT.md`, `docs/m2-brief.md` (rules of engagement),
then this file. `ARCHITECTURE.md` revision 3 is the specification; M4 is its
first revision since the review, and you write revision 4 as part of the
work — no silent edits.

## Rules of engagement

- Branch **`m0`**, pull request #1. Small commits in English, **`git push
  origin m0` immediately after every commit** — runs get cut off by usage
  limits and unpushed work is lost. Before starting, `git log origin/m0` to
  see whether a previous run pushed part of M4; continue, don't redo.
- `node tools/validate.mjs --index` and `node --test` pass at every commit.
- Where the spec cannot be built as written, the closest thing that keeps
  its invariants, recorded in `STATUS.md` → Deviations, numbered on from
  the existing list. Never reinterpret silently.
- Do not change repository visibility, settings, or merge anything.
- **Historical records.** `CLAUDE.md` forbids AI-generated historical
  claims, with one exception the owner decided on 2 September 2026: the
  20th–21st century Portugal records under `data/` are an assistant-drafted
  **test dataset**, every record carrying
  `authors: [{ "name": "Claude (assistant draft, unreviewed)", "github": null }]`.
  Part 3 of this brief extends that dataset **under the same exception and
  the same marking**, and nowhere else. Write from the standard accounts,
  hedge in the text where accounts differ, and put every date you are not
  sure of into `STATUS.md` → "Dates to verify" so the owner's review knows
  where to look. Fixtures under `tests/` stay synthetic.
- Before you stop — finished or blocked — `STATUS.md` (phase, next, open
  questions, deviations, dates to verify) pushed, and PR #1's body updated
  with a section for M4. Final message: what is done, tests, deviations,
  what the owner does next.

## Part 1 — the `actor` kind, end to end

Actors are the people, polities, institutions and peoples that events
involve. They never sit on the timeline alone; they are reached through
events and, later, through presences.

**Schema** `schema/v1/actor.json`, envelope as every record (so an actor
needs at least one source), plus:

- `actorType`: `person | polity | institution | people`.
- `names`: array of strings, at least one; the first is the display name,
  the rest are variants and former names, for search.
- `summary`: string, written like an event summary.
- `when`: `common/interval.json` — birth–death for a person, founding–
  dissolution for the rest; `end: null` when ongoing.
- `where`: `null` or `common/place.json` — birthplace or seat, optional.

**Events** reference actors: `actors: [{ "actor": "<actor id>", "role":
"<short text, 1–60 chars>" }]`. Roles are free text for now (`leader`,
`target`, `signatory`, `author`, `deposed`, `founded`, `victim`…); the
validator lowercases and trims, and `build-index.mjs` emits the set of
roles in use so a closed vocabulary can be decided later. Keep the array
short — the actors *of* the event, not everyone alive.

**Validator** (`src/validate/rules.js`, `tools/validate.mjs`): rule 14
becomes "every `actors[].actor` resolves to an active actor, roles are
non-empty"; actor `when` obeys the interval rules; error if an actor cites
no source (already the envelope rule). Warnings: an event dated entirely
outside an actor's `when` (posthumous events are real, so a warning); an
actor referenced by no event (like `degree-zero`). Rule 2 (ids unique
across kinds, aliases) covers actors. Merged/retracted actors may not be
referenced by active events (extend rule 11).

**Index** (`tools/build-index.mjs`): the topology gains `actors` —
`{ id, actorType, name, names, when, status, aliases, supersededBy }` —
and events carry their `actors: [{ actor, role }]`. Manifest counts gain
`actors`; the manifest lists the roles in use. `data.js` resolves actor
aliases and `supersededBy` like events and builds event↔actor adjacency.
Determinism tests extend to actors.

**Site.** `panel.js`: an event's actors are listed with their roles and
are links. An actor's card: type, dates, `where` if any, summary, the
events it appears in, chronologically, with roles, and its sources. While
an actor is selected the map and timeline highlight its events (the madder
accent is for the followed chain — use a distinct emphasis, from the
existing tokens, for "this actor's events"). The URL carries the selected
actor the same way it carries a selected event (`state.js`; decide the
parameter, record it). Everything through `esc()`; no new hex values.

**Form** (`src/contribute/bundle.js`, `form.js`): `actor` is a third record
type; events get a repeatable actor+role field that searches the loaded
topology's actors (and the bundle's) by name. `tools/new-record.mjs`
scaffolds an actor; `tools/bundle-to-files.mjs` writes to `data/actors/`;
`tools/lib/read.mjs` knows the directory; `src/validate/schemas.js` lists
the schema; `tests/fixtures/data/` gains two synthetic actors and
references from fixture events, with its index rebuilt.

**Docs.** `ARCHITECTURE.md` revision 4: actor moves from ○ to ●; the tree,
data model, invariants, extension points and "Decisions taken" updated,
with a dated note at the top saying what revision 4 changed and why.
`CLAUDE.md` layout; `CONTRIBUTING.md` record format; `README.md` if it
lists kinds.

## Part 2 — ~25 more events, 1915–2008

Add these to the existing set (ids are suggestions; keep the style). Dates
are from memory: verify what you can, list the rest under "Dates to
verify". Each new event needs ≥1 source (the eleven existing source
records may be enough; add a source record only for a real work you are
sure exists, with a WorldCat search URL as identifier like the others) and
at least one edge into the existing graph, with type, confidence and an
explanation written as an argument, disputed where accounts differ.

| id | what | date / interval | place |
|---|---|---|---|
| `pimenta-de-castro-government-1915` | Pimenta de Castro's authoritarian government | 1915-01 → 1915-05-14 | Lisbon |
| `revolt-14-may-1915` | The 14 May revolt restores the Democrats | 1915-05-14 | Lisbon |
| `monarchy-of-the-north-1919` | Paiva Couceiro's monarchist restoration in Porto | 1919-01-19 → 1919-02-13 | Porto |
| `portugal-backs-franco-1936` | Portugal's support for the Nationalists in the Spanish Civil War | 1936-07 → 1939-04 | Lisbon (region: europe) |
| `legiao-portuguesa-founded-1936` | Foundation of the Legião Portuguesa | 1936-09-30 | Lisbon |
| `exposicao-mundo-portugues-1940` | Exposição do Mundo Português | 1940-06-23 → 1940-12-02 | Lisbon (Belém) |
| `constitutional-revision-1959` | Revision ending direct presidential elections | 1959-08 (verify) | Lisbon |
| `santa-maria-hijacking-1961` | Henrique Galvão seizes the liner Santa Maria | 1961-01-22 → 1961-02-02 | Recife, at the end (precision region; region: americas) |
| `botelho-moniz-coup-attempt-1961` | Botelho Moniz's failed move against Salazar | 1961-04-13 | Lisbon |
| `delgado-assassinated-1965` | Humberto Delgado murdered by the PIDE near the Spanish border | 1965-02-13 | Villanueva del Fresno area, Spain (precision region; region: europe) |
| `wiriyamu-massacre-1972` | Wiriyamu massacre | 1972-12-16 | Tete district, Mozambique (precision region) |
| `cabral-assassinated-1973` | Assassination of Amílcar Cabral | 1973-01-20 | Conakry |
| `alvor-agreement-1975` | Alvor Agreement on Angolan independence | 1975-01-15 | Alvor, Algarve |
| `coup-attempt-11-march-1975` | Spínola's failed coup of 11 March | 1975-03-11 | Lisbon |
| `spinola-resigns-1974` | Spínola resigns the presidency after 28 September | 1974-09-30 | Lisbon |
| `legislative-election-1976` | First legislative election under the constitution | 1976-04-25 | Lisbon |
| `eanes-elected-1976` | Ramalho Eanes elected president | 1976-06-27 | Lisbon |
| `imf-agreement-1978` | First IMF stabilisation agreement | 1978-05 (verify) | Lisbon |
| `imf-agreement-1983` | Second IMF stabilisation agreement | 1983-09 (verify) | Lisbon |
| `constitutional-revision-1982` | Revision abolishing the Council of the Revolution | 1982-09-30 (verify) | Lisbon |
| `soares-elected-president-1986` | Mário Soares elected president, first civilian in sixty years | 1986-02-16 | Lisbon |
| `cavaco-absolute-majority-1987` | Cavaco Silva's absolute majority | 1987-07-19 | Lisbon |
| `expo-98` | Expo 98 | 1998-05-22 → 1998-09-30 | Lisbon |
| `euro-adoption-1999` | Portugal adopts the euro | 1999-01-01 | Lisbon |
| `bpn-nationalisation-2008` | Nationalisation of BPN in the financial crisis | 2008-11-02 (verify) | Lisbon |

## Part 3 — ~30 actors, and roles on every event

Create these actors (ids suggested; dates from memory, verify), and attach
actors with roles to **every** event in the dataset, the existing 35
included. Persons: `manuel-ii` (1889–1932), `afonso-costa` (1871–1937),
`sidonio-pais` (1872–1918), `gomes-da-costa` (1863–1929), `salazar`
(1889–1970), `humberto-delgado` (1906–1965), `marcelo-caetano` (1906–1980),
`antonio-de-spinola` (1910–1996), `mario-soares` (1924–2017),
`alvaro-cunhal` (1913–2005), `ramalho-eanes` (1935–), `cavaco-silva`
(1939–), `amilcar-cabral` (1924–1973), `eduardo-mondlane` (1920–1969),
`jawaharlal-nehru` (1889–1964), `henrique-galvao` (1895–1970),
`otelo-saraiva-de-carvalho` (1936–2021), `vasco-goncalves` (1921–2005),
`paiva-couceiro` (1861–1944), `pimenta-de-castro` (1846–1918).
Polities: `first-portuguese-republic` (1910–1926), `military-dictatorship`
(1926–1933), `estado-novo` (1933–1974), `third-portuguese-republic`
(1974–, ongoing), `republic-of-india` (1947–), `indonesia` (1945–),
`european-economic-community` (1957–1993). Institutions:
`partido-democratico` (1912–1926), `pvde-pide-dgs` (1933–1974),
`portuguese-expeditionary-corps` (1916–1919), `legiao-portuguesa`
(1936–1974), `armed-forces-movement` (1973–1975), `council-of-the-revolution`
(1975–1982), `paigc` (1956–), `frelimo` (1962–), `mpla` (1956–), `fnla`
(1962–), `unita` (1966–), `fretilin` (1974–), `nato` (1949–),
`united-nations` (1945–), `imf` (1945–). Every actor: ≥1 source, a
summary, `where` where obvious (seat or birthplace), variant names in
`names` (Portuguese and English forms, acronyms).

Done when: the schema, rules, index, site, form and tools all know actors;
tests cover each (target: every new rule with a passing and a failing
fixture); the dataset validates with 0 errors; the actor card renders in
headless Chromium for at least one person and one institution; PR #1's
body has an M4 section; `STATUS.md` says what the owner reviews next.
