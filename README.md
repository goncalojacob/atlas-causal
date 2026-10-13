# Atlas causal

A map and a timeline drawn from one graph. Historical events are the points of
the graph. Places are where the events happened. Actors are the people, states
and institutions in them. Presences are the land those actors held. Edges are
causal links, and each edge has a type, a confidence level and a written
argument with its sources. Pick an event and follow its consequences. The atlas
also shows which other branches led to the same event, so one chain does not
look like the whole explanation.

The first part is Portuguese expansion, 1415 to 1580. A language model wrote
none of it. A person wrote and cited every record.

## Running it

There are no dependencies and no build step. The tools need Node, and nothing
else needs installing.

```bash
python3 -m http.server 8000        # http://localhost:8000/
```

`data/` holds a test dataset for the 20th and 21st centuries. An assistant
drafted it and nobody has reviewed it yet (see `CLAUDE.md` and `STATUS.md`).
The interface also has a mode with invented data:
<http://localhost:8000/?fixtures=1> loads `tests/fixtures/data/`. It holds
twelve invented events and two invented actors, enough to test the map, the
timeline, the chain, the actor card and the search for other branches (the
convergence query). A badge in the header marks this mode. None of it is
history.

```bash
node tools/validate.mjs            # schemas, cross-record rules, region derivation
node --test                        # every test under tests/
node tools/new-record.mjs event <id> --title … --start … --place lisbon   # scaffold a record
node tools/new-record.mjs place <id> --names "Lisbon; Lisboa" --lon … --lat …
node tools/new-record.mjs actor <id> --type person --names "…" --start …
node tools/new-record.mjs relation <from> <to> <type> --start … --end …
node tools/new-record.mjs narrative <id> --title "…" --step <event or edge id> --step …
node tools/build-index.mjs         # regenerate data/index/ after changing data/
node tools/import/cshapes.mjs --source cshapes_2_gw.topojson   # territories, rarely
```

The **territories** layer shows who held which land in the last year of the
window, the span of years on screen. Its data comes from CShapes 2.0 and covers
1886 to 2019 only. Before 1886 the layer is empty, and after 2019 it shows 2019.
A band on the timeline says so. The switch in the header turns the layer off.
The layer is an import, and nobody here wrote it: see the licence note below
and `about.html`.

The tools use Node 22 (`.nvmrc`). CI runs `tools/validate.mjs` and
`node --test` on every pull request.

## The pages

| | |
|---|---|
| `index.html` | the atlas |
| `about.html` | one screen: what the atlas is, who makes it, how to read confidence, and the licences |
| `essay.html` | how the atlas is drawn, at length. `about.html` links to it at its foot |
| `contribute.html` | the contribution form. The atlas does not link to it while contributions are closed |

## The documents

| | |
|---|---|
| `CLAUDE.md` | the rules, including the fixed constraints |
| `CONTEXT.md` | the reasons behind the design, including the ideas tried and dropped |
| `ARCHITECTURE.md` | the structure: data model, modules, pipeline, invariants, milestones |
| `STATUS.md` | where the project stands right now, and what comes next |
| `CONTRIBUTING.md` | the contribution flow, the review checklist, the record format |
| `docs/` | the critical review that the architecture answers, and the build briefs |

## Licences

There are four, because one licence cannot cover the code, the written records
and two imported datasets.

- **Code** (`src/`, `tools/`, `tests/`): MIT, in `LICENSE`.
- **Records** (everything under `data/`): CC BY-SA 4.0, in `data/LICENSE`.
- **Geometry** (`data/geo/`): the licence of its source, in
  `data/geo/LICENSE`. The coastlines and the lane polygons (one outline per
  row of the timeline) come from
  [Natural Earth](https://www.naturalearthdata.com/), which is public domain
  and credited there.
- **Territories** (`data/geo/presences/`, `data/presences/` and the actor
  records the import created): CC BY-NC-SA 4.0, because
  [CShapes 2.0](https://icr.ethz.ch/data/cshapes/) is. The citation is Schvitz, Girardin,
  Rüegger, Weidmann, Cederman & Gleditsch, *Mapping the International System,
  1886-2019*, Journal of Conflict Resolution 66(1), 2022,
  [doi:10.1177/00220027211013563](https://doi.org/10.1177/00220027211013563).
  That licence forbids commercial use, so the repository keeps these files
  apart from the CC BY-SA records, and every one of them names its licence.
  The full attribution is in `data/geo/LICENSE`.

Once the project merges someone else's writing, it can no longer change the
licence of the records. `about.html` explains why that is deliberate.
