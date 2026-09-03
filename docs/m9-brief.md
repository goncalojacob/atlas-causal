# Build brief — M9: places as records

Written 3 September 2026. Runs after M8. Read, in this order: `CLAUDE.md`,
`STATUS.md`, `ARCHITECTURE.md` (current revision; you write the next),
`CONTEXT.md`, `docs/m2-brief.md` (rules of engagement), `docs/map-brief.md`,
`docs/m6-brief.md`, then this file. Rules of engagement as in every brief
since `docs/m4-brief.md`; deviations numbered on from the last; no
historical text except what this brief allows.

## Why

Thirty-seven events carry Lisbon's coordinates typed separately. Places
are things with a history of their own; an event should point at one.

## The `place` kind

`schema/v1/place.json`: the envelope (sources optional — a place is a
geographic fact, exempt from "every node cites a source" like `region`
and `source`; say so in the invariants), `names` (display name first,
then variants: "Lisbon", "Lisboa"), `where` (`common/place.json` — lon,
lat, precision, label), `region` override as on events, `summary`
optional. Ids are slugs: `lisbon`, `luanda`, `laventie-flanders`.

Events: `where` is replaced by **`place: "<place id>"`** (required unless
the event is placeless, in which case `place: null` and `region` is
required, as today). The topology carries places; `build-index.mjs` derives
an event's coordinates and region from its place (the override on the
place wins over derivation; an event may still carry its own `region`
override, which wins over the place's). Rule: `place` resolves; a place
referenced by nothing is a warning.

**Migration.** `tools/migrate-places.mjs` (kept, so contributors can see
how it was done): reads every event's `where`, groups by coordinates and
label, writes one place record per group with the label as display name,
rewrites the events to reference it, and prints the mapping. Places
created by the migration carry the assistant-draft `authors` entry like
the events they came from. Then remove `where` from `schema/v1/event.json`.
Presences' `capital` stays as it is (backlog).

## The site

- The map draws events at their place; clusters are now what they always
  were — places with several events — and a coincident cluster's spread
  and panel list are titled with the place's name.
- **A place card** in the panel (`?place=<id>`): name and variants,
  coordinates and precision, every event there in order (with the window
  applied and the rest faded), and the actors most present there. Reached
  by clicking a place name on an event, a cluster's title, or a search
  result — places join the search.
- Contribution form: an event chooses a place from the loaded topology by
  name or adds a new place record in the same bundle (a place needs no
  source; the form says so). `tools/new-record.mjs place …`;
  `bundle-to-files.mjs` writes `data/places/`.
- `CONTRIBUTING.md`, `README.md`, `about.html` where they mention the
  event shape.

## Done when

Every event references a place; `data/places/` exists with one record per
distinct location; the validator is clean; the map and clusters are
unchanged to the eye except for place names; `?place=lisbon` lists the
Lisbon events; the form can pick and create places; tests cover the
migration (on fixtures), the rule, the derivation; `ARCHITECTURE.md`'s
next revision with its dated note; `STATUS.md` with the literal line
`M9 done`; an "M9" section on PR #1.
