# Build brief — M54: the lens follows succession

The owner, 17 September, asked for this after selecting **Brazil** and finding
none of the history that happened there:

> **"Yes I do"** — to the question of whether selecting an actor should reach
> back through succession to the polities that preceded it.

A reader who clicks a country means *this place and its past*. The atlas
answers with one record's own span, which for `brazil` is 1889 onwards, so
four centuries of Brazilian history sit one hop away and invisible.

Read `src/lens.js` **whole** (M48 built the three sets this milestone reuses),
`src/parts.js`, `docs/m48-brief.md`, `data/relations/` (the `succeeded` shape),
`docs/m52-brief.md` A1, `docs/m53-brief.md`, `tools/build-index.mjs`, and the
lens browser tests for the idioms.

## 1. What changes

**A lens on an actor includes the events of the actors it succeeds, and of
those that succeed it**, following active `succeeded` relations in
`data/relations/` transitively.

**The predecessors' events are `near`, not `set`** — dimmed, exactly as M48's
one-hop neighbours are. The actor's own events stay full. **This needs no new
token, no new hex value and no new type size: dimmed already means "related,
not chosen" in this interface, and that is precisely what these are.**

**Walk the chain, but bound it.** A retracted actor ends the walk, and so does
a missing relation. **A date gap does not**: the owner relaxed that rule on
17 September, so after M53 the Brazilian chain is Viceroyalty → Empire →
Republic whether or not the dates meet, and the walk follows it. Where a gap
exists the relation carries a note saying so, and **the panel shows that note
on the dimmed rows the gap produced** — the reader is told they have crossed
one, rather than the walk stopping.

**Compute the closure in `tools/build-index.mjs`**, beside M48's `grounds`
pass, not at render time — following relations per keystroke is the mistake
M48 already refused for point-in-polygon.

## 2. What the reader controls

The succession walk is **on by default** — it is what clicking a country
means — and **switchable**, in the masthead where M48 put the graph's filters,
and **in the URL**, so a link opens on the picture its sender saw.

## 3. What must stay true

- **No new record, no historical claim, no new date.** This milestone reads
  relations that already exist; if the Brazilian chain is short, that is M53's
  business and this one reports it rather than inventing a link.
- No new runtime dependency, build step, map library or tiles.
- A hidden or dimmed event stays reachable by search and by walking.
- `validate --index` clean; `build-index.mjs` committed with any index change;
  tests before the behaviour they judge (711, 717).
- **The known shard defect is not yours**: a long event's attribute row lives
  in its start century's shard and its bar reads "still loading" for ever
  (M50). Do not fix it here; do not let it fail your tests silently.

## 4. Tests

1. A lens on `brazil` includes the Empire's **and the Viceroyalty's** events —
   **dimmed, not full**. After M53 both successions exist.
2. A lens on an actor with no succession relation is **unchanged** from today.
3. The walk **crosses a gap** and says so: an actor whose predecessor's dates
   do not meet its own still contributes its events, and the note on the
   relation reaches the reader.
4. A retracted actor ends the walk.
5. The switch is in the URL and survives a reload.
6. No test pins a count of events.

## 5. Done when

Selecting Brazil shows Brazilian history before 1889, dimmed; the switch works
and is in the URL; the closure is computed in the index and first paint costs
what it did; screenshots under `docs/screens/m54-succession.png` with the rest
restored; `STATUS.md` says how many actors gained events this way and how many
walks stopped at a gap; `validate --index` clean; tests green; `M54 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
