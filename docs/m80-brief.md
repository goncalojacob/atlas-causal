# Build brief — M80: a connection can be chosen, marks by precision, and the count says what it counts

Three instructions from the owner on 22 September, each the authority for
its section.

## 1. A connection is selectable on the graph

> **"In the graph I should be able to select a connection the same way I
> select an event, so I can check its sources, description, etc."**

An edge is a record (`data/edges/*.json`): type, `from`, `to`, confidence,
sources with locators, a summary and a note. Today nothing on the page opens
one. After this milestone:

- **Clicking a line on the graph selects it** as clicking a node selects an
  event: the line is drawn as chosen, its two ends are named, and **the
  panel shows the edge's card** — the type in the card's own words (M28's
  vocabulary), *from* and *to* as links to the two events, the confidence
  and what it means (M73), every source with its locator, the summary and
  the note, and the same standing line an event card has.
- **`?edge=<id>` in the URL** opens the atlas on that card, as `?selected=`
  does for an event, and the graph frames the two ends.
- **From an event's card**, each connection listed already names the other
  end; it now also opens the edge's card.
- **Keyboard**: a line is focusable and Enter opens it, as M63 made every
  mark a control with a name.
- Choosing an edge is not a lens: the picture does not narrow (M65 is about
  events). It highlights.

## 2. Marks by precision

Not an owner sentence but the other half of M42's amendment A9, which gives
imported events the place their Wikidata item names. A place has a
`precision` today of `point`, `city` or `region`; **`country` is added** to
`schema/v1/place.json` and `src/vocab.js`, meaning the state's own point
when nothing finer is known. The map draws a `region` or `country` mark
**distinct from a city's** — wider and fainter, never a pin at a capital
pretending to be an address — and the card says the precision in words.
Clusters (`cluster.js`) treat them as marks like any other.

## 3. The masthead count says what it counts

> **"I still only see 252 events."**

The masthead reads "252 of 252 events in view", and 252 is the resting
picture — the main events — of 581. It says so now: **"252 main events of
581 in view"** at rest, and under a lens "17 of 581 events in view", the
whole being the active corpus. The pin and the standing line are unchanged.

## 4. What this run must not do

No new record and no historical claim — A9 writes the places. No new hex
value, token or type size (a vocabulary value is not a token). The lens,
the band, the walk framing unchanged. `validate --index` clean; tests before
behaviour (711, 717); no test pins a count or a pixel. Nothing merged into
`main`; ignore `docs/drafts/`. Lane A numbers deviations on from M79.

## 5. Tests

1. Clicking a line opens the edge's card with its type, ends, confidence,
   sources and summary; `?edge=` opens the same; Enter on a focused line
   opens it; the picture does not narrow.
2. A fixture place with `precision: country` validates and draws a mark
   distinct from a city's; `region` likewise.
3. The masthead reads "N main events of M in view" at rest and "N of M
   events in view" under a lens.

## 6. Done when

The three sentences hold on the real page; screenshots `docs/screens/m80-*`
(an edge chosen with its card; a country mark beside a city mark);
`STATUS.md` section; `M80 done`.
