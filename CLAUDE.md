# Atlas causal

Map and timeline of Portuguese expansion, 1415 to 1580. You pick an event,
follow its consequences, and see which other branches fed into the same
endpoint. First slice of a larger project about human history.

See `CONTEXT.md` for the reasoning behind the constraints below,
`ARCHITECTURE.md` for the target structure, and `STATUS.md` for where the
project stands right now. Read `STATUS.md` first in every new session and
update it whenever a decision is taken or a milestone moves.

Everything is in English: interface, data, code, comments, commit messages.
(Decided 2026-09-01; Portuguese returns later as an i18n overlay.) Talk to me
in whichever language I use.

## Hard constraints

These are not preferences. Ask before breaking any of them.

- **No runtime dependencies.** No npm packages shipped to the browser, no CDN
  script tags. Plain ES modules loaded natively.
- **No build step.** `python3 -m http.server 8000` and it runs. If you think we
  need Vite, say why and wait.
- **No map tiles and no map library.** Coastlines are a local GeoJSON drawn as
  SVG with our own projection in `src/map.js`. No MapLibre, no Leaflet, no API
  keys, no tile servers. This keeps hosting free and keeps modern borders off a
  historical map.
- **No database.** Data is JSON files in the repo, validated on every commit.
- **No AI-generated historical claims.** Every edge explanation is written by a
  person. This one is not negotiable.

## Commands

```bash
node tools/validate.mjs    # schema, referential integrity, arrow of time
python3 -m http.server 8000
```

Run the validator after any change to `data/`. It must pass before you say a
task is done.

## Layout

The layout below is the original prototype's and is superseded by the tree in
`ARCHITECTURE.md`; it will be replaced when M0 lands.

```
data/events.json     events; one point in space and time each
data/edges.json      causal links; the actual value of the project
data/land.json       Natural Earth 110m coastlines, public domain, generated
schema/              JSON Schema for both data files
src/graph.js         traversal: consequences, ancestors, convergence
src/map.js           SVG map; changing projection touches only this file
src/timeline.js      timeline, one lane per continent
src/main.js          state, URL, side panel
tools/validate.mjs   dependency-free validator, also used in CI
```

## The data model

An edge is a small historiographical argument, so `explanation` and `sources`
are required. Five edge types exist (`causou`, `permitiu`, `reagiu-a`,
`precondicao-de`, `inspirou`) specifically so everything does not collapse into
plain causation. Do not add a generic type.

`confidence` separates consensus from debate. The interface shows the
difference. Presenting a disputed link as fact is the worst mistake this project
can make. When historians disagree, mark it `disputada` and say so in the
explanation rather than picking a side.

## The convergence query

In `src/graph.js`. Given a target and the chain the user walked, it returns the
other ancestors of that target that are not on the walked path.

We exclude the walked path only, not everything descending from the starting
event. The wider exclusion was tried and always returned empty, because in a
connected graph nearly every node descends from the oldest one. Do not
"simplify" it back.

## Code conventions

- Vanilla JS, ES modules, no framework, no TypeScript for now.
- Data from `data/` is untrusted input; it becomes community contributions
  later. Escape it before putting it in the DOM. `esc()` in `src/main.js`.
- Comments explain why, not what. In Portuguese.
- Small modules with one job. If `main.js` passes ~300 lines, split it.
- No dark mode yet. Visual direction is azulejo: cold white ground, cobalt
  drawing, one madder red accent for the path being followed. Colors are CSS
  variables in `src/style.css`; use them, do not add new hex values.

## Working with me

- Propose a plan before multi-file changes and wait for me to agree.
- Do not add features I did not ask for.
- When a historical fact is involved and you are not sure, say so instead of
  filling it in. A wrong date that looks confident is worse than a gap.
- Small commits, one logical change each, messages in English.
