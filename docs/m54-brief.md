# Build brief — M54: a territory shows everything that happened on it

The owner, 17 September, having selected Brazil and found three events where
four centuries belonged:

> **"The important thing is that when I select a territory I can see all
> events that are related to that territory independent of the timespan I
> select"**

That sentence is the whole brief, and it is simpler than the succession walk
first proposed. **A reader who clicks a territory has clicked a polygon.** The
events that belong to it are the events whose place lies **inside that polygon,
at any date** — regardless of which polity held the ground then, and
regardless of whether a `succeeded` relation happens to exist. Porto Seguro in
1500 is inside the outline the reader clicked; that is the entire argument.

Read `src/lens.js` **whole** (M48 built the three sets this reuses),
`src/parts.js`, `docs/m48-brief.md` (**`grounds` is the pass this extends**),
`tools/build-index.mjs`, `data/presences/`, `schema/v1/presence.json`, the
lens and panel browser tests for the idioms, and `docs/m53-brief.md`.

## 1. What is wrong today

M48 made an actor's events include the events on its ground — **but only
territory that actor held at the event's own date**. So `brazil`, a CShapes
record beginning in 1886, cannot reach a colonial event however close it sits,
and the atlas answers a click on Brazil with three twentieth-century events.
The rule is right for the question *what did this polity do*. It is wrong for
the question the reader is actually asking.

Measured, 17 September: of the two M50 chains, **every early event grounds to
no actor at all** — `porto-seguro` (1500), `salvador` (1530), `vila-rica`
(1695), `bridgetown` (1640) each return nothing, because no presence covers
those points at those dates.

## 2. What to build

**A territorial lens.** Selecting a polity on the map means **the ground it
is drawn as**, and its events are every event whose place falls inside that
outline — **with no date test on the containment at all**.

- The outline is the presence the map drew for that actor: take **the union of
  that actor's presences** so a territory that grew is not punished for
  growing, and say in `STATUS.md` what that union costs to compute.
- **Dates still matter for what is emphasised, not for what is found.** The
  actor's own span decides `set`; everything else on its ground is `near` —
  dimmed, the way M48's one-hop neighbours are. **No new token, no new hex
  value, no new type size: dimmed already means "related, not chosen".**
- **Compute this in `tools/build-index.mjs`**, beside M48's `grounds` pass, and
  keep that pass: *events the actor did* and *events on its ground* are
  different questions and both have readers. Point-in-polygon per keystroke
  remains forbidden.

## 3. The timespan, which is the other half of the sentence

**A territorial selection lists everything it found, and the band fades what
is outside the window rather than removing it.** This idiom already exists and
is already tested — *"a place's faded rows follow the band without rebuilding
the card"* — so follow it exactly rather than inventing a second behaviour.

The count in the hint says how many are inside the window, as it does for a
place. **A reader who narrows the band must never be told a territory has no
history; they must be shown its history, faded.**

## 4. Succession, demoted but not dropped

Following `succeeded` relations is no longer how the events are found — ground
finds them. It stays worth doing for **naming**: the chips on an event should
let a reader step to the polity that held that ground before or after, and
M53 writes those relations. **Build it only if it costs nothing beyond the
relations already there; if it grows this milestone, say so and leave it.**

## 5. What must stay true

- **No new record, no historical claim, no new date.** Containment is
  geometry: writing down that a point is inside a polygon is reading two
  records, not deciding between them — M48 settled that.
- No new runtime dependency, build step, map library or tiles.
- **First paint costs what it does today.** The new file is fetched when a
  lens first asks, as `grounds-*.json` is, and until it lands the lens is what
  it is now: a frame of the old picture, never a wrong one.
- A dimmed or faded event stays reachable by search and by walking.
- `validate --index` clean; `build-index.mjs` committed with any index change;
  tests before the behaviour they judge (711, 717).
- **The known shard defect is not yours**: a long event's attribute row lives
  in its start century's shard and its bar reads "still loading" for ever
  (M50). Do not fix it; do not let it fail your tests silently.

## 6. Tests

1. **A lens on `brazil` includes `portuguese-landfall-in-brazil-1500`** and the
   rest of the Brazilian chain, dimmed — the case the owner reported.
2. Events the actor itself did stay **full**, not dimmed.
3. **Narrowing the band fades rows and removes none**, and the hint counts
   those inside it.
4. A territory with no events on it is unchanged from today.
5. First paint fetches no new file; the lens fetches it on first ask.
6. No test pins a count of events.

## 7. Done when

Selecting Brazil shows the Brazilian chain from 1500, dimmed and unremoved by
the band; the union outline is computed in the index; screenshots under
`docs/screens/m54-territory.png` with the rest restored; `STATUS.md` says how
many events each of the twenty largest territories gained, what the union
costs, and what the new index file weighs; `validate --index` clean; tests
green; `M54 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
