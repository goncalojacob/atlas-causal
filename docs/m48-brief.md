# Build brief — M48: what the reader sees

On 16 September the owner spent fifteen minutes clicking around the running
atlas and found four things. Three are in this milestone; the fourth became
M49. They have one cause between them: **the interface has the right machinery
and does not apply it by default.** Nothing here is a new idea. Every part is a
switch that is off, a filter that is not applied, or a computation done at the
wrong time.

Read `CLAUDE.md`, `STATUS.md` (the top and the last deviation number — yours
numbered on from it), `docs/run-protocol.md` **including its amendments**, then
`src/lens.js` **whole and slowly**, `src/narrative.js`, `src/emphasis.js`,
`src/state.js`, `src/graph-view/graph-view.js`, `src/graph-view/layout.js`,
`src/map/layers/events.js`, `tools/build-index.mjs`, `tools/lib/read.mjs`,
`data/geo/presences/`, `schema/v1/presence.json` (`dependencyOf`,
`dependencyKind`), `src/parts.js` — and this file including its "Amendments
after review" if one is present, which override the body where they differ.

## 1. Reading a narrative sets the lens instead of suspending it

`src/lens.js` line ~294 reads `if (state?.narrative) return null;`, under a
comment saying *"Reading a narrative suspends the lens. Reading is a mode and
the walk is…"*. That decision is why a twelve-step argument about how the
colonial war ended the regime is drawn over all 250 events in the corpus, and
why the narrative panel offers a **"Focus on this"** link — the reader is asked
to do by hand what the mode should have done.

**The walk is a focus.** It is the most deliberate one in the atlas: a person
chose those events and put them in order. So reading a narrative **sets** the
lens to `narrative:<id>`, and the three sets already defined in `lens.js` do
exactly what the owner asked for without being changed:

- `set` — the walk's events, drawn in full;
- `near` — their direct causes and consequences, one hop either way, **drawn
  dimmed**, which is the "shadowed" the owner asked for;
- everything else hidden.

The `narrative` lens kind already exists (line ~144) and already collects the
walk through `narrativeEventIds`. **"Focus on this" stays** and comes to mean
narrowing further — to the step rather than the walk — which is what a reader
would expect it to mean once the walk itself is the default frame.

A reader who leaves the narrative leaves the lens with it. `?focus=` written
explicitly by the reader still wins over the implied one; say in `STATUS.md`
which precedence you chose and why.

## 2. An actor's events are the events on its ground, not only the events that name it

`src/lens.js` line ~116 is the whole of the actor lens:

```js
if ((event.actors ?? []).some((a) => a.actor === id)) ids.add(event.id);
```

So selecting Portugal finds events that list Portugal in `actors` and nothing
else. The place lens beside it is as literal — `event.place === id` — so an
event in Lisbon is not found by selecting Portugal either. **The atlas has
6,686 presence polygons with dates and every place carries coordinates**, and
none of it is consulted.

**An event is related to an actor when any of these holds:**

1. the actor is named in the event's `actors` — what happens today;
2. the event's place lies **inside territory that actor held at the event's
   date**;
3. the event's place lies inside territory **a dependency of that actor** held
   at that date — presences carry `dependencyOf`, so Angola under Portugal in
   1960 is reachable without anyone listing colonies by hand.

**Compute it in the index, not at render time.** Point-in-polygon against
thousands of dated presences per selection is not a thing to do while a reader
waits. `tools/build-index.mjs` computes each event's polities once and the
loader reads them, the way everything else here is precomputed. Say what the
build costs and what the shard weighs.

**Containment is geometry, not a claim.** An event whose place sits inside a
polygon the dataset draws is a fact about two records, and writing it down is
reading, not deciding. Where a place has no coordinates, the event simply has
no ground and only rule 1 applies — that is not an error.

## 3. The graph draws what organises, not everything

Measured on 16 September over the 250 active events: **103 of them (41%) have
one edge or none**, 17 have none at all, and **8 carry seven or more**. The
hubs are the labelled nodes the reader can actually see; the rest is haze.

Two filters, and they are not alternatives:

- **A degree floor.** Draw events with at least *n* active edges; *n* = 2 takes
  the graph from 250 nodes to 147, *n* = 3 to 64. It is a **filter and not a
  deletion** — a hidden event is still reachable by walking to it, by search,
  and by the lens. The control belongs where the reader can move it; the
  default is yours to argue in `STATUS.md`.
- **Top-level only.** Draw events with no `parent`; a child appears when its
  parent is opened. **This is today a no-op — 10 of 250 events have a parent —
  and the owner knows it.** Build it anyway, because M42 brings wars with their
  battles and it becomes the main lever the moment hierarchy exists. Say
  plainly in `STATUS.md` that it currently hides ten nodes.

Neither filter applies inside a lens: if the reader has focused on something,
they have already said what they want to see.

## What this run must not do

- **No new record, no historical claim, no data under `data/` except the index
  the build regenerates.**
- **No new hex value, no new token, no new type size.** Dimmed already has a
  meaning in this atlas; use it.
- **No new runtime dependency, no build step, no map library, no tiles.**
- **Do not touch the actor seam.** `russia-soviet-union` and the 39 polities
  split across 1885/1886 are M49's, and M49 is gated on this milestone.
- Nothing merged into `main`; `docs/drafts/` ignored.

## Tests

1. Reading a narrative draws the walk in full, its one-hop neighbours dimmed,
   and nothing else — in the graph **and** on the map, since the lens is shared.
2. Leaving the narrative restores what was drawn before.
3. An explicit `?focus=` while reading behaves as you documented.
4. An event inside a polity's dated territory is related to it with no `actors`
   entry; an event inside a **dependency's** territory is too; an event outside
   is not; an event whose place has no coordinates falls back to `actors`.
5. The degree floor hides a leaf and keeps a hub, and the hidden leaf is still
   reachable by search and by walking.
6. No test pins a count of nodes, events or records: assert the rule. Five runs
   this week met such a test and each rewrote it (`ffd737c`, `522e79e`,
   `00009dce`, eight at once in M43b).
7. `tests/spine-pages.test.mjs` still shows first paint unchanged.

## Done when

Reading a narrative shows the walk and its shadow and nothing else; selecting a
polity finds the events on its ground; the graph draws the events that organise
others; `node tools/validate.mjs --index` clean; tests green; screenshots under
`docs/screens/m48-*.png` of the narrative view and the graph, with every other
picture restored; `M48 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
