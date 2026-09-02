# Status

Where the project is right now. Read this first in any new session, after
`CLAUDE.md`. Update it whenever a decision is taken, a milestone moves, or a
session ends. `ARCHITECTURE.md` is the target; this file is the position.

## Last updated

2026-09-02, at the end of M4 (the `actor` kind, and a denser test set).

## Phase

**M0, M1, M2, M3 and M4 built, on branch `m0`, pull request #1 open
against `main`.** `ARCHITECTURE.md` **revision 4** is the specification;
its opening note says what M4 changed and why.

`data/` holds a **test dataset, 20th–21st century Portugal** — **60
events, 73 edges, 42 actors, 11 sources**, 1910 → 2011 — drafted by the
assistant on 2026-09-02 at the owner's request as an exception to the
"written by a person" rule (recorded in `CLAUDE.md`). Every record says so
in `authors`. It validates with **0 errors and 0 warnings**, the index is
built, and the atlas renders it at `http://localhost:8000/` without
`?fixtures=1`. Eight edges are `disputed` with dissenting citations; two
lanes derive by `nearest` (Goa, Macau — both correct); four events use a
`region` override (the Azores, Recife, the Spanish border, Lisbon for the
Spanish war). Every page still serves from `python3 -m http.server 8000`.

**Nothing in it has been read by a person.** See item 4 under Next, and
"Dates to verify" below.

What exists and passes (`node tools/validate.mjs --index`, `node --test`:
127 tests):

- **M0.** Licences (`LICENSE` MIT, `data/LICENSE` CC BY-SA 4.0,
  `data/geo/LICENSE` Natural Earth); `.nvmrc` = 22; `schema/common/` and
  `schema/v1/`; `src/validate/{schema,rules,core}.js`;
  `src/util/{dates,geo}.js`; `tools/{validate,build-index,build-regions,
  new-record}.mjs` and `tools/lib/read.mjs`; `data/geo/land-present.json`
  and `data/geo/regions.json` from Natural Earth v5.1.2; `data/index/` for
  the empty dataset; `tests/fixtures/data/` (twelve events, ten edges, four
  sources, three square lanes) with its own index; `validate.yml`,
  `deploy.yml`, `CODEOWNERS`, PR template.
- **M1.** `index.html`, `src/style.css` (azulejo tokens), `src/main.js`,
  `state.js`, `data.js`, `graph.js`, `map/projection.js` (equirectangular),
  `map/map.js`, `map/layers/{land,events}.js`, `timeline.js`,
  `timeline-scale.js`, `panel.js`, `util/{esc,dom}.js`. State
  `{ year, selected, actor, chain, layers }` in the query string (`actor`
  arrived in M4). Disputed edges
  dashed on the map and marked in the panel.
- **M2.** `contribute.html` and `src/contribute/{bundle,form,submit,main}.js`:
  the form builds a bundle, runs the same `validate()` the CLI runs against
  the loaded topology, shows each error next to the input that caused it, and
  keeps the submit control disabled until the bundle validates, every event
  and edge cites a source, and any near-match to an existing title has been
  acknowledged. `submit.js` copies the bundle and opens the issue template,
  prefilled only while the encoded body is under 6 KB.
  `.github/ISSUE_TEMPLATE/{contribution,correction,config}.yml`;
  `tools/bundle-to-files.mjs` with the hostile-input tests;
  `.github/workflows/contribution.yml` gated on the `accepted` label;
  `tools/lookup-sources.mjs` for the DOI/ISBN reading aid.
- **M3.** `about.html` (linked from the atlas header), `CONTRIBUTING.md`,
  `README.md`; `deploy.yml` re-checked against the current tree.
- **M4.** The **`actor` kind**, end to end. `schema/v1/actor.json`
  (`actorType`, `names`, `summary`, `when`, optional `where`, the usual
  envelope); an event's `actors` is now `[{ actor, role }]`; rule 14
  rewritten and rules 6, 10, 11 and 15 extended to actors, with two new
  warnings (`actor-unused`, `actor-outside-when`); the topology carries
  `actors` and the manifest counts them and lists the `roles` in use;
  `data.js` resolves actor ids and builds `eventsByActor`; `panel.js` shows
  an event's actors and an actor's card; the map and the timeline give an
  actor's events a cobalt emphasis, distinct from the madder path;
  `?actor=<id>` in the URL; the form has an actor record type and an
  actor-and-role row on events; `new-record.mjs actor …`; two synthetic
  actors in `tests/fixtures/`. `ARCHITECTURE.md` revision 4, and
  `CLAUDE.md`, `CONTRIBUTING.md`, `README.md` updated.

Verified in headless Chromium, against `?fixtures=1`: the atlas renders
(marks, lanes, bars, panel); the form derives an id from a title, lists the
bundle's own sources alongside the atlas's, blocks on a near-match until it
is acknowledged, fires the arrow of time and the consensus rule in the
browser, shows the dispute fields only for a disputed edge, and produces the
bundle JSON; the actor entry renders its fields and the event's actor row
lists the actors of the atlas and of the bundle by name.

Verified in headless Chromium against the **real** dataset: the card for a
person (`?actor=salazar` — 14 events) and for an institution
(`?actor=pvde-pide-dgs` — 2 events, with the hedged roles), and an event
view with an actor selected (`?selected=carnation-revolution-1974&actor=salazar`):
six actors listed on the event, the notice, and 14 marks emphasised on the
map.

## Decided

See "Decisions taken" at the end of `ARCHITECTURE.md`. Everything in the
review was accepted except two items the owner chose to defer or drop:
contributions-open timing (deferred), `strength` on edges (left out).

Taken by the building agents, all reversible, all listed under Deviations.

## Next

1. **Owner: create the PAT.** `contribution.yml` needs the repository secret
   `CONTRIBUTION_PAT`: a fine-grained personal access token on this
   repository with *Contents: read and write* and *Pull requests: read and
   write*. Without it the workflow stops at its first step with a message
   saying exactly that. Write its expiry date into `CONTRIBUTING.md`, where
   there is a line waiting for it. (A PAT and not `GITHUB_TOKEN` because a
   pull request opened with `GITHUB_TOKEN` starts no workflows, so the
   contribution PR would arrive with no CI: review finding 2.)
2. **Owner: two repository settings the agent could not set** — the session
   proxy refuses repository-settings writes and the Pages API path (403 from
   the proxy, not a permissions error). Both are one command each with your
   own `gh`:
   - `gh api -X PATCH repos/goncalojacob/atlas-causal -f delete_branch_on_merge=true`
   - **Pages**: Settings → Pages → Source: **GitHub Actions**. Must be done
     before the first merge to `main`, or `deploy.yml` fails at
     `configure-pages`. The repository is private and Pages on a private
     repository needs a paid plan, so this may have to wait until it is
     public — the agent did not change visibility.
   If branch protection is on, let `github-actions[bot]` push to `main`: the
   deploy job commits the regenerated index.
3. **Owner: review and merge PR #1**
   (https://github.com/goncalojacob/atlas-causal/pull/1).
4. **Owner: review the test dataset before anything is public.** Every
   date, coordinate, name, role, explanation and confidence was written by
   the assistant from memory. "Dates to verify" below lists what is least
   certain. The eleven source records carry a WorldCat search URL as their
   identifier, not an ISBN, and every citation has `locator: null` —
   replace with ISBNs and page or chapter references, or retract the
   record. The assistant's `authors` entry stays until a person has
   reviewed the record and signs it. Read in this order: the eight
   `disputed` edges (a wrong dispute is the worst failure this project can
   have), then the roles where responsibility is contested — Wiriyamu,
   the 1961 Luanda attacks, Cabral's killing — then the dates.
5. **Owner: write the first records** of the 1415→ period. `node tools/new-record.mjs event <id>
   --title … --start … --lon … --lat … --label …` (and `edge`, `source`,
   `actor`), fill in the text, then `node tools/validate.mjs` and
   `node tools/build-index.mjs`; open `http://localhost:8000/`. Use `region`
   on the record whenever the derived lane is wrong (strait cities, islands
   absent at 110m).
6. **Owner: test one bundle end to end** once the PAT exists — open
   `contribute.html`, build a bundle, file the issue, apply `accepted`, and
   check that the pull request arrives with green CI. That is the M2
   acceptance criterion and the one thing the agent cannot do for you.
7. **Not yet: publishing the templates.** `contribute.html` is deliberately
   not linked from the atlas or from `about.html`; both pages say
   contributions are not open. Opening them is the owner's call (see the
   first open question).

## Open questions

- **Does the role vocabulary close, and to what?** Roles on
  `actors[].role` are free text for now; the manifest lists the 62 in use
  across the test dataset, which is what a decision should be made from.
  Some are plainly general (`leader`, `target`, `signatory`,
  `belligerent`, `deposed`); some are one-offs written to hedge
  (`claimed responsibility`, `alleged accomplice`). A closed enum would
  make the panel groupable and search possible; it would also force the
  hedges out of the role and into the summary, which may be the right
  place for them. The agent did not decide this.
- When contributions open to strangers. `CONTEXT.md` argues: after the
  1580–1640 chain coheres and a few hundred of the owner's own records exist.
  Owner: "we'll decide later."
- Source records have no field for the container of a chapter or article
  (journal, edited volume). `locator` and the DOI cover locating it; the
  owner decides whether a `container` field is wanted before records exist.
- The Natural Earth `CONTINENT` attribute puts all of Russia in `europe`,
  Turkey and the Caucasus in `asia`, Greenland in `americas`. Overridable
  per record with `region`; acceptable for v1?
- Map semantics: the map shows events whose start is at or before the
  slider year; the timeline always shows everything. Is that the intended
  reading of "look at a map at a given moment"?
- Nearest-lane tolerance is 3° (`NEAREST_TOLERANCE` in `src/util/geo.js`).
  A point in the Strait of Gibraltar (Ceuta) derives by nearest and may land
  on `europe`; Azores and Madeira are absent from 110m Natural Earth. Such
  events need `region` set by hand; the validator says so when nothing is in
  reach, but not when the nearest guess is merely wrong — the owner should
  glance at `regionMethod: "nearest"` entries in the topology index.

## Deviations

Where `ARCHITECTURE.md` or a brief could not be built as written, the
closest thing that keeps the invariants was built. Each is one edit to
reverse. 1–12 are from M0/M1, 13–21 from M2/M3.

1. **Bibliographic authors of a source are `creators`.** The envelope's
   `authors[{name, github}]` is the record's contributors on every kind
   (principle 4, invariant 12, and the Action sets it from the issue
   opener), so the Source example's `"authors": ["Peter Russell"]` had no
   room. `creators: [string]` holds the authors of the work; rule 9
   compares those.
2. **Edge ids do not match the slug regex.** `from--to--type` contains
   `--`, which `^[a-z0-9]+(-[a-z0-9]+)*$` forbids. `schema/v1/edge.json`
   has its own pattern: three slugs joined by `--`, the third one of the
   five types. Still path-safe; rule 2 also checks the id equals
   `${from}--${to}--${type}`.
3. **`node --test tests/` is `node --test`.** Node 22 takes glob patterns,
   not a directory, and errors on `tests/`. The default patterns find
   `tests/*.test.mjs`. CI and `CLAUDE.md` use the bare form.
4. **Region derivation has a nearest-lane fallback.** Point-in-polygon
   first; if the point is in no polygon but within 3° of one, the nearest
   lane, recorded as `regionMethod: "nearest"` in the topology; beyond
   that, `validate.mjs` errors and `build-index.mjs` refuses to write until
   the record sets `region`. Without this, most port cities fail at 110m.
5. **Modules not in the tree:** `src/util/geo.js` (geometry, pure),
   `src/util/dom.js` (SVG/HTML element helpers shared by the views),
   `tools/lib/read.mjs` (every filesystem access of the tools, so
   `src/validate` stays free of `fs`).
6. **Schema files may carry `$schema`, `$id`, `title`, `description`.**
   Annotations without validation semantics, listed in `schema.js`.
   Everything else outside the fourteen keywords fails closed, tested.
7. **The topology index carries a little more than listed.** Events and
   edges also have `aliases` and `supersededBy` (the index is what resolves
   them) and events have `regionMethod`; the manifest also embeds
   `regions` and the `land` list. Text fields stay out.
8. **Rules slightly stricter than the list, in the list's spirit:** a
   `dispute` block on a non-disputed edge is an error (rule 8); an active
   record cannot cite a merged or retracted source (rule 11); `creators`
   must be non-empty (rule 13); "non-trivial" text is at least 40
   characters (`MIN_TEXT_LENGTH`).
9. **`data/geo/*.json` are compact JSON**, keys sorted, no indentation;
   the index files are indented. Pretty-printed coordinates tripled the
   size for no reader.
10. **`build-regions.mjs` downloads GeoJSON, not shapefiles.** The upstream
    repository publishes GeoJSON at the pinned tag v5.1.2, so no converter
    was needed. `--source <dir>` reads local copies when offline.
11. **Fixture mode borrows the real coastlines.** `tests/fixtures/data/`
    has square lane polygons but no land file; `main.js` passes
    `data/geo/land-present.json` as the land layer in `?fixtures=1` so the
    synthetic marks sit on a recognisable map. Everything else in fixture
    mode is synthetic and the header says so.
12. **`chain` in the URL is a list of edge ids**, not event ids: two events
    can be joined by up to five parallel edges of different types, and the
    panel must know which one was walked to show its confidence and
    dispute.
13. **`src/contribute/` has four files, not two.** `bundle.js` holds the
    pure half — the field list, bundle assembly, the duplicate search,
    `validateBundle` — so it is testable under `node --test`, as the brief
    asks; `main.js` is the page's bootstrap, because `tests/site.test.mjs`
    requires every module under `src/` except a `main.js` to import without
    a DOM. `form.js` and `submit.js` are as specified.
14. **`src/validate/schemas.js` lists the schema files.** The site never
    scans directories and has no build step, so the browser cannot discover
    `schema/` the way `tools/lib/read.mjs` does. `tests/schemas.test.mjs`
    asserts the list is exactly what is on disk, so a schema file added
    without touching the list fails CI rather than the form.
15. **The catalogue check is `tools/lookup-sources.mjs`, not inline YAML.**
    The brief puts the DOI/ISBN lookup in `contribution.yml`; as a tool it
    has tests for what it looks up and how it reports, and the workflow step
    stays two lines with `continue-on-error: true`.
16. **Near-matches must be acknowledged, not merely shown.** "Before
    allowing a new event it searches existing titles and aliases" is
    implemented as a blocking checkbox next to the near-matches, not as a
    refusal: a genuine near-match is sometimes a different event, and only
    the contributor can say. The submit control stays disabled until it is
    ticked.
17. **The bundle textarea is not `render:`-ed** in the issue templates.
    A rendered textarea is the one field URL prefill cannot be relied on
    for, and prefill is what makes the form-to-issue hop work.
    `bundle-to-files.mjs` accepts the JSON fenced, unfenced, or embedded in
    an issue-form body, with a brace-balanced scan that respects strings.
18. **An edge's `type` and `confidence` start unselected.** Defaulting
    `confidence` to the first value would make every edge start as
    `consensus`; an unselected required field says "required" instead.
    Review finding 13 is about exactly this drift.
19. **`loadAtlas({ landFile: false })`** loads no coastlines: the form needs
    the topology and nothing that is only drawn. One line in `data.js`.
20. **`contribution.yml` also runs `node --test`** before it pushes a
    branch. Not in the brief's step list; it is seconds, and it means a
    contribution PR is never opened from a tree whose tests fail.
21. **`delete_branch_on_merge` and Pages could not be set.** Both calls come
    back 403 from the session's API proxy — "Repository settings writes are
    not permitted through this proxy" and "Access to this GitHub API path is
    not permitted through this proxy" — which is the environment, not the
    token's permissions. Left for the owner, with the commands, under Next.

22–28 are from M4.

22. **An actor's `names` being non-empty is a rule, not a schema
    keyword.** The subset validator implements fourteen keywords and
    `minItems` is not one of them (adding it would widen the subset for
    one field). Rule 14 checks it instead, and `schema/v1/actor.json` says
    so in its description.
23. **Rule 14 is stricter than the brief in two places, in its spirit.**
    The same actor may appear twice in one event only under *different*
    roles — "deposed" and "signatory" are two facts, "leader" twice is a
    mistake — and an actor's `names` may not repeat a name. Both would
    otherwise pass silently and produce a duplicated line in the panel.
24. **`?actor=` is a second dimension, not an alternative to
    `?selected=`.** The brief says the URL carries the selected actor "the
    same way it carries a selected event"; carrying it *instead* would
    mean the highlight died the moment you opened one of the actor's
    events, which is the opposite of what the highlight is for. So both
    can be set: choosing an actor clears the selected event and the chain
    (as choosing an event already cleared the chain), choosing an event
    keeps the actor, and the panel shows the event when there is one and
    the card otherwise.
25. **The actor card lives in `panel.js`, not its own module.** It shares
    the citation rendering, the event links, the lane labels and the
    load-token discipline with the event view; splitting it would have
    meant threading five closures across a module boundary. `panel.js` is
    now ~370 lines and still has one job. The ~300-line rule in
    `CLAUDE.md` names `main.js` only, but this is the file to watch next.
26. **The form's actor search is a `<select>` of names, not a search
    box.** "Searches the loaded topology's actors (and the bundle's) by
    name" is implemented the way the form already picks events and
    sources: one control listing every active actor, and every actor in
    the bundle being written, by display name and type. A separate
    free-text search would be a second idiom in the same form.
27. **The topology's actor entries carry no `where`.** The brief lists the
    fields — `{ id, actorType, name, names, when, status, aliases,
    supersededBy }` — and `where` is not among them, so the panel fetches
    the record for the seat, as it already does for the summary and the
    sources. Actors are not drawn on the map, so nothing needs it before
    the card opens.
28. **Roles are stored as written and normalised only for comparison.**
    The brief says the validator "lowercases and trims"; doing that to the
    stored value would edit a contributor's record. Instead the
    normalisation (trim, lowercase, collapse inner spaces) is what rule 14
    compares duplicates on and what `build-index.mjs` collects for the
    manifest's `roles`, while the record keeps the text as filed.

## Dates to verify

Everything below was written from memory and is where the owner's review
should look first. The record's own summary says so in the worst cases.

**Events, dates the assistant is least sure of:**

- `pimenta-de-castro-government-1915` — the appointment is given as
  January 1915; the day is not recorded.
- `monarchy-of-the-north-1919` — proclaimed 19 January, and given here as
  collapsing on 13 February. Both ends want checking, and so does whether
  the parallel Lisbon rising belongs in the same record.
- `legiao-portuguesa-founded-1936` — 30 September 1936, from the founding
  decree; check the Diário do Governo.
- `exposicao-mundo-portugues-1940` — 23 June to 2 December 1940.
- `constitutional-revision-1959` — August 1959; the month is a guess and
  the number of the law is not recorded here at all.
- `santa-maria-hijacking-1961` — 22 January to 2 February 1961.
- `botelho-moniz-coup-attempt-1961` — 13 April 1961.
- `delgado-assassinated-1965` — 13 February 1965 is the killing; the
  bodies were found in April. Check which date the sources use.
- `wiriyamu-massacre-1972` — 16 December 1972.
- `imf-agreement-1978` — May 1978.
- `imf-agreement-1983` — September 1983.
- `constitutional-revision-1982` — 30 September 1982.
- `soares-elected-president-1986` — 16 February 1986 (second round).
- `cavaco-absolute-majority-1987` — 19 July 1987.
- `expo-98` — 22 May to 30 September 1998.
- `bpn-nationalisation-2008` — 2 November 2008.

**Actors, dates and places:**

- Birth and death years for `gomes-da-costa` (1863–1929),
  `paiva-couceiro` (1861–1944) and `pimenta-de-castro` (1846–1918) are the
  least certain of the twenty persons. Their `where` is deliberately
  `null`: the assistant would have been guessing.
- Founding years of the movements: `paigc` 1956 (founded under another
  name and renamed — check which year the record should carry), `mpla`
  1956, `fnla` 1962, `unita` 1966, `fretilin` 1974 (formed as ASDT and
  renamed the same year), `frelimo` 1962.
- `armed-forces-movement` is given 1973–1975 and
  `council-of-the-revolution` 1975–1982; both are conventions rather than
  dates in a document.
- `frelimo`'s seat is given as Maputo, though it was founded in Dar es
  Salaam; `eduardo-mondlane`'s birthplace is a point in Gaza province at
  `region` precision, not a village.
- `european-economic-community` is closed at 1993 (Maastricht). Whether
  the record should instead be open and renamed is an editorial choice.

## Where things live

- Repo: `~/atlas-causal`, branch `m0`.
- Pull request #1: https://github.com/goncalojacob/atlas-causal/pull/1
- Architecture page (artifact, now **behind** the repo file — revision 2;
  `ARCHITECTURE.md` is the source of truth):
  https://claude.ai/code/artifact/b3940d66-ad98-4de9-9bfd-aff8c77e6f36
- Assistant memory: `~/.claude/projects/-home-gjacob-atlas-causal/memory/`
  (and a copy under `-mnt-c-Users-gonca` pointing here).
- Build briefs: `docs/m0-brief.md`, `docs/m2-brief.md`, `docs/m4-brief.md`;
  the adversarial review is `docs/review-2026-09-01.md`.

## Uncommitted

Nothing.
