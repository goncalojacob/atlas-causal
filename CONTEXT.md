# Context

Background for anyone (human or agent) picking this up. `CLAUDE.md` has the
rules; this file has the reasoning behind them, including the things we tried
and rejected. Read it once, then work from `CLAUDE.md`.

## What this is meant to become

A site where you can explore human history: look at a map at a given moment and
see who lived where, understand how geography shaped geopolitics, and follow how
an event on one side of the world had effects on the other. Colonialism is the
motivating example, in both directions: what it did to the colonised and what it
did to the colonisers.

Portugal 1415 to 1580 is the first slice, chosen because the consequences jump
across continents, which is exactly what the format is for. If the format
survives this slice it generalises. If it doesn't, better to find out now.

## The core insight

The hard part was never the map. Two things fall out of that:

**The narrative is not in the data.** No dataset says colonialism caused
resource extraction on one side and industrialisation on the other. That has to
be written. So the project is editorial work with a map attached, not a data
visualisation.

**The structure is a graph.** Events are nodes. Causal links are edges with a
type, a strength, and a written explanation. The map and the timeline are just
two ways into the same graph. That framing is what makes "click an event, follow
it 400 years forward" a real feature rather than a vague wish.

## Decisions and why

**Two coordinated views, one shared state.** `{ year, selectedEvent, chain }`,
kept in the URL so links are shareable. Dragging the map's year slider moves the
timeline playhead; clicking a timeline bar moves the map. Timeline uses one lane
per continent so simultaneity across the world is visible at a glance, which is
the whole point about effects travelling between regions.

**Five edge types, not one.** `causou`, `permitiu`, `reagiu-a`,
`precondicao-de`, `inspirou`. Collapsing these into plain causation produces
cheap historical determinism. The type is doing real work.

**Confidence is a first-class field.** Historical borders and causal claims are
contested. Presenting a disputed link as fact would be the worst failure this
project could have. Disputed links are shown as disputed. Being able to see the
disagreement is more interesting than a clean answer.

**The convergence query.** When you've walked a chain to some endpoint, the
panel shows the other branches that also fed that endpoint and are not on your
path. This is the antidote to determinism: arriving at 1580 via Asia doesn't
mean Asia explains 1580, and the site says so by surfacing Alcácer Quibir as the
stronger branch. It's deterministic graph traversal, not statistics.

**No borders, only coastlines, for now.** A crisp border is a modern concept.
Drawing sharp lines for most of history projects the nation-state backwards.
When territories are added, diffuse zones of influence need to be
representable.

## Things we tried and rejected

**Excluding all descendants of the chain in the convergence query.** It always
returned empty: in a connected graph almost every node descends from the oldest
one. Excluding only the walked path is correct. Don't "fix" this back.

**Building a community geographic database from scratch.** OpenHistoricalMap
already does this on OSM infrastructure with versioned objects over time, and
Chronas has tens of millions of curated points. The gap nobody fills is the
narrative and causal layer. That's where this project should spend its effort;
consume theirs for geometry when the time comes.

**An AI layer.** Deferred deliberately, not forgotten. If it ever lands, the
rule is that it explains edges that already exist and never invents them.
Language models produce convincing causal narratives about any pair of events,
including unrelated ones. In a history site that's total failure. Any generated
text would be marked as generated, keep the subgraph it came from, be reviewed
by a person before entering the data, and be pre-generated in batch and
committed as static JSON so production never calls an API.

## Community model, when it comes

Two kinds of contribution, handled differently.

Factual data (dates, geometries, edges) goes through Git as JSON with pull
requests and a validator in CI. No sources, no merge.

Narratives are signed by author, not wiki-edited. Opening "why did colonialism
have effect X" to collaborative editing produces permanent edit wars. Better:
several competing narratives over the same period, each attributed, and the
reader compares.

Practical: licence decided early (ODbL or CC-BY-SA, checked against imported
sources, because mixing incompatible licences is irreversible once third parties
contribute), and contributions stay closed until the schema is stable, because
migrating a hundred contributors' data is far harder than migrating your own.

## Current state

19 events, 21 edges, 4 marked disputed. Map, timeline, event panel with
consequences, chain in the URL, convergence query, validator, CI workflow. All
of it runs with `python3 -m http.server 8000` and no dependencies.

The next real work is writing more events and edges, which is the only part the
tooling cannot do. 1580 to 1640 is the test: if the Iberian Union chains
coherently to the Dutch arrival in Asia, the model holds.
