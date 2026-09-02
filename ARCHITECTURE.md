# Architecture

What the Atlas causal is meant to become, structurally. `CLAUDE.md` has the
rules, `CONTEXT.md` the reasoning, `STATUS.md` where we are right now. This
file is the target: the shape every milestone builds toward.

Revision 6, 2 September 2026. Sections marked ● exist in v1; things marked ○
are reserved by a line in this file only — no folder, no schema, no code.

**What revision 6 changed, and why.** The `presence` kind moved from ○ to ●,
and with it `data/presences/`, `data/geo/presences/`,
`src/map/layers/presences.js` and `tools/import/` — the last four reserved
names in the tree that had a use waiting for them. Territories were always
going to be an import rather than writing, and the first one, CShapes 2.0,
arrived under CC BY-NC-SA 4.0: a licence CC BY-SA cannot absorb in either
direction. That is the whole reason the architecture kept imported geometry
in its own directory from the start, and the isolation is now real rather
than planned — a licence enum with a fourth value, a per-directory rule, and
one named exception (`IMPORT_AUTHORS`) for the actor records an import has
to create. Three things the data decided rather than this file: a presence
carries `dependencyKind` beside `dependencyOf`, because how a territory was
held is a different fact from by whom; `dependencyKind` may stand without a
`dependencyOf`, because Danzig was a League of Nations mandate and the
League is not a state on this map; and `geometry` names a *list* of files,
because outlines are sharded by period and one presence can span several
shards. Revision 5 is otherwise intact.

**What revision 5 changed, and why.** Nothing in the data model: one derived
field in the index, one new module, one reserved override. The map drew one
circle per event at the event's point, and thirty-seven of the sixty records
in the test dataset share a point in Lisbon, so the map showed one dot and
let the reader click one of thirty-seven events. `map/cluster.js` (pure,
tested) now decides which marks overlap at the current zoom and which of
them no zoom could ever part; `weight` on every topology event says which
member of a stack the mark should show; `prominence` is reserved as the
editorial override of that, so nothing an editor thinks is smuggled into a
derived number. Revision 4 is otherwise intact.

**What revision 4 changed, and why.** The `actor` kind moved from ○ to ●.
It was the first reserved kind to become necessary rather than merely
planned: the 20th–21st century test dataset kept saying "Salazar" in
thirty summaries with nothing to click on, which is exactly the sort of
thing the graph is supposed to hold rather than the prose. Actors were
already designed here and already had a validated-empty `actors[]` on
events, so the extension point was used as written rather than redesigned.
Three things had to be decided in the building, and they are marked below:
roles are free text for now and the manifest reports the vocabulary in use
(not a closed enum yet); an actor has no lane, because it is never on the
timeline alone; and an event outside an actor's dates is a warning, not an
error, because posthumous events are real. Revision 3 is otherwise intact —
no principle, invariant or module boundary changed.

## Five principles

1. **The repo is the database.** Every event, edge and source is one JSON
   file. For *structure* the site reads a generated topology index, always
   whole, in one request. For *text* it reads the record file directly —
   `data/events/<id>.json` is already a static asset and the id is the path.
   The site never scans directories.
2. **Two kinds of things: nodes and edges.** Node *kinds* grow over time —
   event, actor and presence now; narrative later. Edge *types* do not. The five
   stay five. There is no `strength` on edges (dropped from `CONTEXT.md`'s
   original design, 1 September 2026): type and confidence carry that
   information, and convergence orders its results by type, then confidence.
3. **Offline data generation is allowed; the site has no build step.**
   `tools/` produces committed files; the deploy job regenerates them on
   `main`. `python3 -m http.server` still runs the site as-is. Amendment to
   `CLAUDE.md`'s "no build step", agreed 1 September 2026.
4. **Every record carries its own provenance.** Authors, licence, sources,
   confidence, status, schema version — in the data, not in git metadata.
   Nothing enters the graph without a source.
5. **The contribution format is the storage format.** A contribution is a
   bundle of records, as JSON, produced by the form and pasted into one
   issue; the Action writes those records to files unchanged. There is no
   translation layer to drift.

## Directory tree, future state

```
atlas-causal/
├── index.html                    ● the atlas
├── contribute.html               ● the contribution form
├── about.html                    ● licence, how to read confidence, why relicensing is impossible
├── CLAUDE.md  CONTEXT.md         ● rules / reasoning
├── ARCHITECTURE.md  STATUS.md    ● this file / where we are
├── CONTRIBUTING.md               ● contributor guide; PAT expiry date lives here
├── LICENSE                       ● MIT — code only (src/, tools/, tests/)
├── .gitattributes                ● * text=auto eol=lf
├── .nvmrc                        ● Node major pinned to what CI runs
│
├── data/
│   ├── LICENSE                   ● CC BY-SA 4.0 — every record under data/
│   ├── events/<id>.json          ● one file per event
│   ├── edges/<id>.json           ● one file per causal link
│   ├── sources/<id>.json         ● bibliography, shared by reference
│   ├── actors/<id>.json          ● people, polities, institutions, peoples
│   ├── presences/<id>.json       ● who held which ground, and when; CC BY-NC-SA when imported
│   ├── regions.json              ● timeline lanes: id, label, order
│   ├── geo/
│   │   ├── LICENSE               ● per-source: Natural Earth = public domain, CShapes = CC BY-NC-SA 4.0
│   │   ├── land-present.json     ● Natural Earth 110m coastlines
│   │   ├── regions.json          ● lane polygons, GENERATED from Natural Earth by tools/build-regions.mjs
│   │   └── presences/<from>-<to>.json  ● outlines, sharded by period, GENERATED by tools/import/
│   └── index/                    ● GENERATED by tools/build-index.mjs, committed on main by the deploy job
│       ├── manifest.json         ● schema version, counts, hashed file names, roles in use, land epochs, presence shards; never cached
│       ├── topology-<hash>.json  ● every event {id,title,when,where,region,status,actors,weight}, every edge {id,from,to,type,confidence,status}, every actor {id,actorType,name,names,when,status}, every presence {id,actor,presenceType,dependencyOf,dependencyKind,when,geometry,capital,confidence,status}
│       └── sources-<hash>.json   ● every source record; small, needed for citations
│
├── schema/
│   ├── v1/event.json  edge.json  source.json  actor.json  presence.json  region.json  bundle.json  ●
│   └── common/interval.json  place.json  provenance.json  confidence.json  ●
│
├── src/
│   ├── main.js                   ● bootstrap only: load, wire views
│   ├── state.js                  ● { year, selected, actor, chain, layers } ⇄ URL
│   ├── data.js                   ● manifest → topology (whole) → record text on demand; lookup tables, adjacency, events by actor
│   ├── graph.js                  ● consequences, ancestors, convergence; pure functions over adjacency
│   ├── map/
│   │   ├── projection.js         ● lon/lat → SVG and back; the only file a projection change touches
│   │   ├── cluster.js            ● pure: which marks overlap at this zoom, which of them no zoom can part
│   │   ├── map.js                ● SVG scaffold, pan/zoom, year slider, click into a cluster
│   │   └── layers/land.js  presences.js  events.js   ●
│   ├── timeline.js               ● one lane per region; renders only the visible window
│   ├── timeline-scale.js         ● linear now; the scale is injected
│   ├── panel.js                  ● detail, consequences, convergence, citations, the actor card; confidence and dispute shown as such
│   ├── contribute/
│   │   ├── form.js               ● inputs → bundle; searches titles and aliases before allowing a new event; actors chosen by name
│   │   └── submit.js             ● bundle → clipboard + issue template; URL prefill only under ~6 KB
│   ├── validate/
│   │   ├── schema.js             ● JSON Schema subset, fails closed on unknown keywords
│   │   ├── rules.js              ● cross-record rules (arrow of time, DAG, references, consensus, dispute…)
│   │   └── core.js               ● validate(records, topology) — pure; runs in browser and Node
│   ├── util/esc.js  dates.js     ● escaping; toAstronomical(), interval formatting, BCE/CE
│   └── style.css                 ● azulejo tokens
│
├── tools/
│   ├── validate.mjs              ● CLI over validate/core: reads data/, checks every invariant, exit code
│   ├── build-index.mjs           ● writes data/index/*; recursive key sort, code-unit comparator, content hash
│   ├── build-regions.mjs         ● Natural Earth countries → lane polygons in data/geo/regions.json (run once, committed)
│   ├── bundle-to-files.mjs       ● fenced JSON in an issue body → data/<kind>/<id>.json; slug-checked before any path
│   ├── new-record.mjs            ● scaffold a record locally, of any of the four written kinds
│   └── import/topojson.mjs  simplify.mjs  cshapes.mjs   ● offline, zero-dependency import of borders over time
│
├── tests/                        ● node --test, zero deps: schema subset, rules, graph, dates, projection, build-index determinism
│
└── .github/
    ├── ISSUE_TEMPLATE/
    │   ├── contribution.yml      ● one textarea for the bundle JSON + required CC BY-SA checkbox
    │   └── correction.yml        ● same shape; a full replacement record with the same id
    ├── workflows/
    │   ├── validate.yml          ● on PR: validator + tests; never touches data/index/
    │   ├── contribution.yml      ● on label "accepted" (maintainer-only): bundle → validate → branch → PR, using a scoped PAT
    │   └── deploy.yml            ● on push to main, one job: build-index → commit if changed → upload → deploy from the same checkout
    ├── CODEOWNERS                ● data/ and .github/ → owner
    └── PULL_REQUEST_TEMPLATE.md  ● the review checklist
```

Reserved, by this line only ○: `data/narratives/`, `data/i18n/<lang>/`,
`data/geo/land-<epoch>.json`.
Nothing named for AI-generated content exists anywhere in the tree; if that
layer ever comes it gets its own design against the rules in `CONTEXT.md`.

## Data model

**Language.** Everything is in English: file names, code, keys, enum values,
record text, interface, comments, commit messages. Other languages arrive
later as `i18n` overlays; the base never changes.

### Common envelope — every record

```json
{
  "schema": 1,
  "id": "conquest-of-ceuta-1415",
  "kind": "event",
  "status": "active",
  "supersededBy": null,
  "aliases": [],
  "authors": [ { "name": "Gonçalo Jacob", "github": "goncalojacob" } ],
  "license": "CC-BY-SA-4.0",
  "created": "2026-09-01",
  "revised": null,
  "sources": [ { "source": "russell-2000-henry", "locator": "ch. 2" } ]
}
```

- `id`: `^[a-z0-9]+(-[a-z0-9]+)*$`, immutable once merged, equals the file
  name. Former ids go in `aliases`, which must be unique across all ids and
  all other aliases; the index resolves them. `aliases` holds former ids
  only; alternative names for search are a separate field, later.
- `status`: `active | merged | retracted`. A `merged` or `retracted` record
  must have no active edges and, if merged, a `supersededBy` that resolves.
  Nothing is ever deleted; a wrong record becomes a tombstone that still
  resolves old URLs.
- `authors`: set and appended by the Action from the issue opener; never
  free text from the form alone. `created` and `revised` are set by the
  Action or derived from git at index time.
- `license`: enum `CC-BY-SA-4.0 | CC-BY-NC-SA-4.0 | PD | CC0-1.0 | ODbL-1.0`,
  validated per directory. `data/events|edges|sources` → `CC-BY-SA-4.0` only.
  `data/presences/` may also be `CC-BY-NC-SA-4.0`, because a presence is
  usually derived from imported geometry whose licence `data/LICENSE` cannot
  absorb. `data/actors/` may be `CC-BY-NC-SA-4.0` **only** for the actor
  records an import creates: the exception is the list `IMPORT_AUTHORS` in
  `rules.js`, one line per import allowed to create actors, and rule 12
  checks the record's `authors` against it. Nothing else can quietly
  relicense an actor, and nothing NC ever enters an event, an edge or a
  source.
- `sources`: **every node and every edge cites at least one**; only `source`
  and `region` records are exempt.

### Time — an interval, always

```json
"when": { "start": 1415, "end": 1415 }
"when": { "start": 1415, "end": 1415, "date": "1415-08-21", "calendar": "julian" }
"when": { "start": 1415, "end": null }
"when": { "start": { "min": -9600, "max": -9000 }, "end": { "min": -8500, "max": -8000 } }
```

- Integer years, negative for BCE, **no year 0**. Every piece of arithmetic
  — arrow of time, timeline scale, sorting — goes through one
  `toAstronomical()` in `dates.js`; nothing else compares years.
- `end: null` means ongoing.
- `date` is display-only, recorded exactly as the source gives it, and
  `endDate` is the same for the far end when the source dates both — a
  territory valid from one day to another has two, and one field could not
  hold them. `calendar` is `julian | gregorian`, defaulting by year
  (Gregorian from 1582). Only the integer years drive logic.
- A long process (the Atlantic slave trade) is an event with a long interval
  and, usually, no `where`.

### Place — optional

```json
"where": { "lon": -5.319, "lat": 35.889, "precision": "city", "label": "Ceuta" }
```

WGS84 always; the projection lives in one file. `precision` is `point |
city | region`. Optional: a process with no honest point is timeline-only,
not a dot in the ocean. Later an additive `within: <presence-id>` may join
it; `where` itself never changes shape.

### Event ●

```json
{
  "...envelope",
  "kind": "event",
  "title": "Conquest of Ceuta",
  "summary": "<written by a person>",
  "when": { "start": 1415, "end": 1415, "date": "1415-08-21", "calendar": "julian" },
  "where": { "lon": -5.319, "lat": 35.889, "precision": "city", "label": "Ceuta" },
  "region": null,
  "actors": [ { "actor": "salazar", "role": "leader" } ]
}
```

`region` is **derived** at index time by point-in-polygon of `where` against
`data/geo/regions.json`; the field on the record is an optional override for
the honest cases (Tordesillas is about the Americas, signed in Castile) and
required when `where` is absent. Lanes change by editing one polygon file,
never by touching records. `actors` names the actors *of* the event — not
everyone alive — each with the role it played in it; every id must resolve
to an active actor (rule 14). No `tags`: a junk drawer until there is a
closed vocabulary with a reason.

### Edge ● — the value of the project

```json
{
  "...envelope",
  "id": "conquest-of-ceuta-1415--<target>--enabled",
  "kind": "edge",
  "from": "conquest-of-ceuta-1415",
  "to": "<target>",
  "type": "enabled",
  "confidence": "disputed",
  "explanation": "<written by a person: the argument>",
  "dispute": {
    "text": "<required when disputed: who disagrees and why>",
    "sources": [ { "source": "…", "locator": "…" } ]
  }
}
```

- The id is derived, `from--to--type`, so the same argument cannot be filed
  twice. `type` is the closed set of five: `caused`, `enabled`,
  `reacted-to`, `precondition-of`, `inspired`.
- `confidence`, defined by evidence so it can be checked:
  - `consensus` — the link is accepted; **requires at least two sources by
    different authors** (validator checks author overlap between source
    records). Necessary, not sufficient: the reviewer still judges.
  - `probable` — supported by the cited sources, no known dissent.
  - `disputed` — qualified historians disagree about the link itself:
    whether it exists, what type it is, or how much it weighs. It stays in
    the graph (removing it would be picking a side), is drawn differently,
    is never walked through silently by the chain, and **must** carry
    `dispute` with its own sources — the dissenting citations, kept apart
    from the envelope's supporting ones so the panel can show which is
    which.
  - No fourth value.

### Source ●

```json
{ "schema": 1, "id": "russell-2000-henry", "kind": "source", "status": "active",
  "type": "book", "authors": ["Peter Russell"],
  "title": "Prince Henry 'the Navigator': A Life",
  "year": 2000, "publisher": "Yale University Press",
  "isbn": "9780300082333", "doi": null, "url": null, "accessed": null }
```

- `type`: `book | chapter | article | thesis | primary | dataset | web`.
  `dataset` is what an import from Natural Earth or Wikidata cites, so
  "every node has a source" has an honest answer for imported records.
- At least one resolvable identifier is required: `isbn`, `doi`, or `url`;
  for `primary`, `repository` + `reference`. `web` sources require
  `accessed` and should be an archive URL. `url` must be `http(s)`.
- The Action resolves DOI/ISBN against a public API and comments the title
  it found beside the one submitted. Not a runtime dependency; a review aid.
- Fifty records citing the same book cite one file.

### Actor ● — who the events involve

```json
{
  "...envelope",
  "id": "salazar",
  "kind": "actor",
  "actorType": "person",
  "names": [ "António de Oliveira Salazar", "Salazar" ],
  "summary": "<written by a person>",
  "when": { "start": 1889, "end": 1970 },
  "where": { "lon": -8.13, "lat": 40.40, "precision": "city", "label": "Santa Comba Dão" }
}
```

- `actorType` is the closed set of four: `person`, `polity`, `institution`,
  `people`. It is what the panel labels a card with, and later what a
  presence attaches to.
- `names[0]` is the display name; the rest are variants, former names,
  acronyms and other-language forms, so that a search finds "PIDE",
  "Polícia Internacional e de Defesa do Estado" and "DGS" as one record.
  The list must be non-empty — a rule, not a schema keyword, because the
  keyword subset has no `minItems`.
- `when` is birth–death for a person and founding–dissolution for the rest,
  with the same interval shape and the same `end: null` for ongoing.
- `where` is a seat or a birthplace and is optional. An actor has **no
  lane**: unlike an event it is never placed on the timeline on its own,
  so `region` is not required when `where` is absent, and there is no
  `region` field at all.
- An actor cites at least one source like every other node, and is reached
  only through the events that reference it.

**Roles are free text, for now.** `actors[].role` on an event is 1–60
characters of prose — `leader`, `signatory`, `deposed`, `target`,
`author` — compared and counted lowercased and trimmed. Closing the
vocabulary before seeing what people write would be guessing, so
`build-index.mjs` emits the set actually in use in the manifest's `roles`,
and the decision waits for that evidence.

### Presence ● — who held which ground

```json
{
  "...envelope",
  "id": "angola-1905",
  "kind": "presence",
  "license": "CC-BY-NC-SA-4.0",
  "actor": "angola",
  "presenceType": "state",
  "dependencyOf": "portugal",
  "dependencyKind": "colony",
  "when": { "start": 1905, "end": 1975, "date": "1905-05-30", "endDate": "1975-11-10" },
  "geometry": { "files": ["geo/presences/1886-1913.json", "…"], "key": "389" },
  "capital": { "lon": 13.23, "lat": -8.83, "precision": "city", "label": "Luanda" },
  "confidence": "consensus"
}
```

- `actor` points at an actor record and must resolve to an active one. A
  presence is how an actor gets onto the map without being an event: it is
  never on the timeline, and it is reached by clicking the ground it covers.
- `presenceType` is the closed set of four: `state`, `polity`,
  `sphere-of-influence`, `archaeological-culture`. It drives rendering — a
  crisp line is only honest for a state, and a culture will need a diffuse
  field. Everything imported from CShapes is `state`.
- `dependencyOf` is the sovereign, or `null`; `dependencyKind` is `colony |
  protectorate | mandate | occupied`, or `null`. A dependency always says
  which of the four it was (rule 17). **The reverse does not hold**: Danzig
  was a League of Nations mandate and West New Guinea a United Nations
  protectorate, so a kind can stand without a sovereign, because the
  sovereign was not a state on this map. Inventing an actor for the League
  would be inventing a state.
- `geometry` is `{ files, key }`, not one path: outlines are sharded by
  period and a presence that outlives a shard boundary is written into every
  shard it touches, under the same key. Rule 17 checks the files exist, hold
  the key, and between them cover every year the presence claims — a shard
  missing from the middle would make a territory blink out.
- `capital` is a `common/place.json` or `null`, and is the only point a
  presence has; the outline says where it was.
- `confidence` is the same three values as an edge. Imported state borders
  in a well-covered period are `consensus`; the field exists so a hand-made
  presence can say `disputed` and be drawn dashed.
- **A year is the finest bound the model has**, so a border that moved in
  August leaves two presences of one actor sharing that year. That is legal,
  and the map draws the later one. Two presences of one actor with the *same*
  outline over overlapping years are not (rule 17).

### Regions ●

`data/regions.json` is the lane list — `[{ "id": "europe", "label":
"Europe", "order": 1 }]`. `data/geo/regions.json` holds one polygon per lane,
generated once from Natural Earth country unions by `tools/build-regions.mjs`
and committed. Adding Oceania is one entry and one polygon.

### Bundle ● — the unit of contribution

```json
{ "schema": 1, "records": [ { "...event" }, { "...edge" }, { "...source" } ] }
```

Validated as a unit: references may resolve inside the bundle or in the
topology index. Written to one branch, one PR. Warnings (not errors): an
event with degree zero; a source with no citers.

### Index and manifest ● — generated

`manifest.json` — never cached — lists schema version, counts (events,
edges, sources, actors, presences, regions), the hashed file names of the
topology and sources indexes (served `immutable`), the set of `roles` in
use, land files with their epochs, and the presence shards with their year
ranges. The topology carries every presence **without its coordinates**, so
an actor's territory over time is a list the panel draws without fetching
anything; the outlines are fetched one shard at a time, by year, and cached,
so scrubbing the slider inside a period costs nothing. The topology index is always loaded whole because
consequences, ancestors and convergence need the whole graph; loading a
window would make convergence return a subset and present it as complete —
exactly the determinism the query exists to prevent. Record text
(`summary`, `explanation`, `dispute`) is fetched on demand from the record
file. `build-index.mjs` is deterministic: recursive key sort, code-unit
string comparison, trailing newline, tested for byte-identical output.

Every topology event also carries **`weight`**: the number of active edges
touching it, in and out, plus the number of actors it names. It is derived,
never written on a record, and it is **not an editorial judgement** — it is
how much of the graph the record already holds. The map uses it to pick
which event represents a cluster of overlapping marks and which clusters
earn a label at high zoom. An editorial override is reserved as
`prominence` in the extension-points table; until that exists, nobody can
make a mark bigger except by giving it more edges and more actors.

### Reserved ○

- **Narrative** — `kind: narrative`, title, authors, summary, `steps: [{
  ref, text }]`, own sources. The competing signed narratives from
  `CONTEXT.md`.
- **Translation** — `data/i18n/<lang>/<id>.json` overlays text fields only
  and carries `baseRevised`; the validator warns when it differs from the
  base record's `revised`; the panel falls back to English for stale fields.
- **Paleo-coastlines** — `data/geo/land-<epoch>.json`, listed in the
  manifest by year range; `layers/land.js` switches by year.
- **Deep-time scale** — `timeline-scale.js` swapped for a bucketed scale;
  the timeline itself unchanged.

## Site modules

Vanilla ES modules, no framework, no build. Each module has one job;
`main.js` only wires them. State is one object, `{ year, selected, actor, chain,
layers }`, mirrored to the URL so every view is a shareable link. `layers`
is `land`, `territories`, `events`; a layer switched off costs no fetch.

| Module | Job | Must not know |
|---|---|---|
| `state.js` | Owns the state object; parses and writes the URL; notifies views. | Anything about SVG or data files. |
| `data.js` | Reads the manifest, loads the topology whole, fetches record text on demand, resolves aliases and `supersededBy` for every kind, builds adjacency, the events of each actor, and each actor's presences and dependencies; loads and caches one geometry shard per year. | How things are drawn. |
| `graph.js` | Consequences, ancestors, convergence. Pure functions over adjacency; results ordered by type, then confidence. | The DOM. |
| `map/projection.js` | lon/lat → SVG coordinates and back. | Everything else. |
| `map/cluster.js` | Groups projected points that overlap at the current zoom, picks each group's representative by `weight`, says which groups no zoom could part and where a group comes apart. Pure. | The DOM, the projection, what a point means. |
| `map/layers/*` | One layer per thing drawn, in a fixed order: coastlines, then territories, then marks, so an event sits on top of the state it happened in. Renders only records in the visible window. A stack of marks is drawn as one, with a count, and opened by a click. | Each other. |
| `map/layers/presences.js` | The territories of the year on the slider: a thin line for a state, a lighter one over a stronger wash for a dependency, dashed when disputed. Hover names it and its sovereign; click selects the actor. No colour per polity — two hundred of them share one palette. | Which shard the year is in, or how one is fetched. |
| `timeline.js` + `timeline-scale.js` | Lanes from `regions.json`; the scale is injected. | Which regions exist. |
| `panel.js` | Detail, consequences, convergence, supporting and dissenting citations shown apart, confidence and status shown as such; an event's actors with their roles, and an actor's card. | Traversal logic. |
| `validate/core.js` | `validate(records, topology)`: schema subset + cross-record rules, pure. Needs the topology to check references, so the form loads it too. | `fs`. |
| `contribute/*` | Form → bundle → validation → clipboard + issue. | GitHub, beyond one URL in `submit.js`. |

## Contribution pipeline

Strangers add nodes and edges without touching code, on a site with no
server. The repo is the queue, GitHub does the plumbing, a person judges.

1. **`contribute.html`** — the form searches existing titles and aliases
   before allowing a new event; builds a bundle; validates it in the browser
   against the loaded topology; shows errors inline. No sources, no submit
   button.
2. **`submit.js`** — copies the bundle JSON to the clipboard and opens the
   `contribution.yml` issue template: one textarea for the JSON and a
   required checkbox granting CC BY-SA 4.0 and affirming the text is the
   contributor's own. The URL is prefilled only when the encoded body is
   under ~6 KB (GitHub rejects URLs around 8 KB — unverified figure); above
   that the page says "paste".
3. **A maintainer reads the issue and applies the `accepted` label.** Only
   that label triggers the Action; the auto-applied one does not. That is the
   spam gate.
4. **`contribution.yml`** — extracts the fenced JSON; `bundle-to-files.mjs`
   checks every id against the slug regex *before* building any path and
   writes only `data/<kind>/<basename>.json`; the body reaches scripts via
   `env`, never `run:` interpolation; `validate.mjs` runs; a branch and PR are
   opened with a **scoped PAT** (contents + pull-requests on this repo, expiry
   noted in `CONTRIBUTING.md`) so that `validate.yml` actually runs on the
   PR — PRs made with the default Actions token get no CI. `authors[]` is set
   from the issue opener. The branch is deleted on close.
5. **A person reviews** against `PULL_REQUEST_TEMPLATE.md` and merges.
   `CODEOWNERS` covers `data/` and `.github/`. Not a limitation to engineer
   away: this is "no sources, no merge" and "no AI-generated claims" made
   real.
6. **`deploy.yml`**, one job on push to `main`: `build-index`, commit if
   changed with the default token, upload the same checkout, deploy.
   `concurrency: { group: deploy, cancel-in-progress: false }`. PRs never
   touch `data/index/`; freshness is asserted on `main`, not on PRs — two
   open PRs would otherwise conflict on the index every time. Branch
   protection lets the Actions bot push to `main`.

**The review checklist**, the part no tool does: sources exist, are
locatable, and actually support the claim; the explanation argues rather
than asserts; the confidence is honest and a dispute names real opponents;
the edge type is the right one of five; dates checked against the source;
not a duplicate of an existing record under another transliteration.

**Later**, a small serverless relay replaces only the target in `submit.js`
so people without GitHub accounts can submit. Nothing else changes.

## Invariants the validator enforces

Errors:

1. Every file matches its `schema` version; unknown keywords in a schema file
   are an error of the schema itself (the subset validator fails closed).
2. `id` matches the slug regex, is unique across all kinds and all aliases,
   and equals the file name. Aliases are unique across ids and aliases.
3. Every reference resolves — `from`, `to`, `sources[].source`,
   `dispute.sources[].source`, `supersededBy`, `region`.
4. Arrow of time on the lenient bound: `from.start.min ≤ to.start.max`
   (astronomical).
5. The edge graph is a DAG; same-year ties broken by `date` where present.
6. Every node and every edge has at least one source; `source` and `region`
   records are exempt.
7. Every edge has a non-trivial `explanation`.
8. `disputed` ⇒ `dispute.text` and `dispute.sources` present and non-trivial.
9. `consensus` ⇒ at least two sources by different authors.
10. `where`, if present, inside WGS84; `region` required when `where` absent;
    `region` values exist in `regions.json`.
11. `status` rules: `merged` ⇒ `supersededBy` resolves; `merged | retracted`
    ⇒ no active edges.
12. `license` allowed for the directory; `authors` non-empty.
13. Source identifiers present per type; `url` is `http(s)`; `web` has
    `accessed`.
14. Every `actors[].actor` on an event resolves to an actor and carries a
    non-blank `role`; one actor may appear twice in an event only under
    different roles (compared lowercased and trimmed). An actor's `names`
    is non-empty, with no repeats.
15. No year 0; `end` is `null` or ≥ `start`. Actors' intervals too.
16. On `main` only: `data/index/` is byte-identical to what `build-index.mjs`
    produces.
17. A presence holds together: a `dependencyOf` implies a `dependencyKind`
    (the reverse does not — see the Presence section); a presence is not a
    dependency of its own actor; `geometry.files` is non-empty; and one
    actor never holds the *same* outline over overlapping years. The half
    that needs the disk — every file named exists, holds the key, and the
    files between them cover every year the presence claims — is in
    `tools/validate.mjs` beside rule 16.

Rules 3, 6, 10, 11 and 12 reach the newer kinds. An actor and a presence
cite at least one source. An actor's `where` and a presence's `capital`, if
present, are within WGS84, and neither needs a `region`, having no lane. A
merged or retracted actor may not be referenced by an active event **or an
active presence**, and an active presence may not name one. A presence's
`actor` and `dependencyOf` resolve to actor records. And rule 12's licence
check is per directory with exactly one hole in it: `IMPORT_AUTHORS`.

Warnings: arrow of time fails the strict bound (`from.start.max ≤
to.start.min`); an event with degree zero; a source with no citers; an actor
that no event references **and that holds no territory**; an event dated
entirely outside an actor's dates, and a presence likewise — warnings and
not errors, because posthumous events are real, institutions act through
their successors, and the dates of an actor and of an imported outline come
from two sources of which either may be the wrong one.

## Extension points

| Later feature | What it touches | What is reserved now |
|---|---|---|
| Whole world | `regions.json`, one polygon per new lane, more records | `region` derived from geometry, never stored on records |
| Ancient / deep time | `timeline-scale.js`, `land-<epoch>` files, manifest | Interval with four bounds and `end: null`; single `toAstronomical()`; manifest lists land by epoch |
| Territories ● | built in M5: `data/presences/`, `data/geo/presences/`, `schema/v1/presence.json`, rule 17, the topology's `presences`, `layers/presences.js`, `tools/import/` | `presenceType` still has three unused values for diffuse eras; `within: <presence-id>` additive on `where` is untouched |
| Another geometry import | one file under `tools/import/`, one paragraph in `data/geo/LICENSE`, one line in `IMPORT_AUTHORS` | the licence enum and the per-directory rule; shards named `<from>-<to>.json` and listed in the manifest |
| Actors ● | built in M4: `data/actors/`, `schema/v1/actor.json`, rule 14, the topology's `actors`, the card and the highlight | roles still free text; the manifest's `roles` is the evidence for closing the vocabulary |
| Narratives | `narratives/`, a panel mode | steps reference ids that never change; tombstones keep old ids resolving |
| Other languages | `data/i18n/`, `src/i18n/` | overlay design with `baseRevised` |
| Search | `build-index.mjs` emits `search-<hash>.json` | index is generated, so a new output is one function |
| Contributors without GitHub | `submit.js` target only | bundle format is the wire format |
| Tens of thousands of records | render only the visible window; topology stays whole | hashed, immutable index files; manifest uncached |
| Editorial emphasis on the map | a `prominence` field on the event record; `cluster.js` reads `prominence ?? weight` | ○ reserved by this line: derived `weight` in the index is the only measure now, and it is mechanical |

## Scale, for the record

Figures the reviewer supplied; the GitHub ones are recollection, unverified:
Pages site soft-capped at 1 GB, 100 GB/month bandwidth, 10 deploys/hour.
15,000 record files at 1–2 KB is ~25 MB. The topology index at 5,000 events
+ 15,000 edges is ~2.5 MB raw, ~400–600 KB gzipped, one request. A full-text
index at that size would be 5–15 MB, which is why text is not in the index.
SVG holds 5,000 marks comfortably; at 50,000 with pan/zoom it stutters, and
the fix is rendering only the visible window, not a map library.

## Milestones

| Milestone | Delivers | Done when |
|---|---|---|
| M0 | The tree at the ● marks, no reserved folders; `schema/v1` and `schema/common`; schema subset + rules + validator CLI; tests; `validate.yml` and `deploy.yml`; both `LICENSE` files; `.gitattributes`, `.nvmrc`; `build-regions.mjs` and its output. | `node tools/validate.mjs` passes on an empty dataset; `build-index.mjs` is byte-deterministic under test; CI is green. |
| M1 | `src/`: map with own projection, timeline with lanes, panel, chain in URL, convergence. The owner writes the first events, edges and sources. | The atlas `CONTEXT.md` describes runs from `python3 -m http.server 8000`. |
| M2 | `contribute.html`, the two issue templates, `contribution.yml`, `bundle-to-files.mjs`, the PR template, the PAT. Tested by the owner end to end; templates not yet published. | One bundle submitted through the form arrives as a PR with green CI. |
| M3 | GitHub Pages, `CONTRIBUTING.md`, `about.html`. Site public. | A stranger can read it. |
| M4 | The `actor` kind end to end — schema, rules, index, panel card and highlight, form, tools, fixtures — and a denser 20th–21st century test dataset to exercise it. | An actor's card lists its events with roles; the dataset validates with no errors; the manifest reports the roles in use. |
| M5 | The `presence` kind end to end — schema, rule 17, index, the CShapes 2.0 import, the territories layer, the actor card's territory, the attribution. | The map scrubbed from 1886 to 2019 shows borders changing; Portugal's colonies leave as they became independent; hovering names them; clicking opens the actor; the layer switches off; every presence validates; the import is reproducible from the recorded sha256. |
| — | **Opening contributions to strangers**: timing not yet decided (see `STATUS.md`). `CONTEXT.md` argues for waiting until the schema has survived the 1580–1640 test and a few hundred of the owner's own records. | — |

## Decisions taken

All on 1 September 2026, by the owner.

- **Everything in English.** Replaces the pt-PT rule; Portuguese returns as
  an i18n overlay.
- **Historians' numbering.** Integer years, negative for BCE, no year 0; one
  `toAstronomical()` for all arithmetic.
- **`disputed` requires `dispute { text, sources }`.**
- **Every node and edge cites at least one source.** Source records need a
  resolvable identifier.
- **`consensus` requires two sources by different authors** — necessary,
  not sufficient.
- **Licences: MIT for code, CC BY-SA 4.0 for `data/`, per-source under
  `data/geo/`.** Relicensing is impossible once strangers contribute;
  `about.html` says so.
- **GitHub is the backbone**: Pages, one-issue-one-bundle, Action on a
  maintainer label with a scoped PAT, human review, one post-merge deploy job
  that owns the index.
- **Offline data generation in `tools/` is allowed**; the site has no build
  step and reads record files directly for text.
- **No `strength` on edges.**
- **No `data/generated/`, no `tags`, no reserved folders.**
- **Portugal 1415→ is v1.** World, deep time, territories and narratives are
  reserved by lines in this file.
- **Repository lives at `~/atlas-causal`** (WSL-native), not under OneDrive.

On 2 September 2026, in the building of M4:

- **The `actor` kind is real** (`person | polity | institution | people`),
  the second node kind. Reached through events; never on the timeline
  alone, so it has no lane.
- **Roles on `actors[]` are free text for 1–60 characters**, normalised
  lowercased and trimmed for comparison, with the set in use reported in
  the manifest. A closed vocabulary is deferred until there is evidence
  for one.
- **An event outside an actor's dates is a warning, not an error.**
- **`?actor=<id>` is a second selection dimension**, alongside `selected`
  rather than instead of it, so an actor's events stay emphasised while
  they are read.
- **The actor emphasis is cobalt, never madder.** The madder accent means
  "the path you are following" and nothing else.

On 2 September 2026, in the building of M5:

- **The `presence` kind is real**, the third node kind. Reached through the
  map and through an actor's card; never on the timeline.
- **CShapes 2.0 is the first geometry source for territories**, under
  CC BY-NC-SA 4.0, isolated in its own directories with its own licence and
  its own attribution in the interface. Nothing derived from it is merged
  into a CC BY-SA record, in either direction.
- **`CC-BY-NC-SA-4.0` joins the licence enum**, allowed under
  `data/presences/` and — only for the actor records an import creates —
  under `data/actors/`, with `IMPORT_AUTHORS` as the whole of the exception.
- **`dependencyKind` is a field of its own**, beside `dependencyOf`: how a
  territory was held is a different fact from by whom, and one can be known
  without the other.
- **Geometry is sharded by period, not by entity**, and a presence names
  every shard that carries it. The site loads one shard for the year on the
  slider.
- **No colour per polity.** The territories layer is cobalt on white like
  everything else; who was where is answered by hovering and by clicking,
  not by a legend of two hundred hues.

Open: when contributions open to strangers; whether the role vocabulary
closes, and to what; whether an entity that was a colony and then a state —
CShapes gwcode 750 is British India *and* the Republic — should be one
actor or two.
