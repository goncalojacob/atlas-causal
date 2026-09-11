# Build brief — M30b: the interface half

Runs after M30a on `m0`. Read what M30a read plus `docs/health/h7-brief.md`
(the multi-focus lens), `src/emphasis.js`, `src/panel/*`, `src/timeline.js`,
`src/graph-view/*`, `src/map/layers/events.js`, then this file. Code only.

1. **Office card and reach**: `?office=` opens a card (title, the actor
   it belongs to, category, the tenures in order with holders, dates and
   the event that started each); offices in search; the actor card of a
   state shows **one tenure strip per office**, holders as bars over
   time in the timeline's scale, clustered in one dimension with
   `cluster.js` past what fits, click to open the person; an Offices
   grouping is M33's.
2. **Parents**: the card says "Part of" with a link; a parent lists its
   parts in order; the timeline draws a parent as a bracket over its
   children; the graph collapses children into their parent when zoomed
   out — semantic collapse first, then M25's geometric stacks on the
   result, a collapsed parent expanding under the same never-hide rule as
   the selection, the badge summing `subtreeWeight`; the lens's `event:`
   focus narrows to a subtree, "Show only this" on a parent's card.
3. **Large events** (`scope`, or children across more than one lane): a
   band across the whole timeline and a wash over the map rather than a
   mark; the card says which it is.
4. **Categories as glyphs**: `src/map/glyphs.js`, one `<symbol>` per
   category in the azulejo line, coloured and emphasised exactly as marks
   are; the timeline bar carries the glyph at its left; a cluster keeps
   the plain mark with its count; the layer control lists **events by
   category**, one toggle each under "events", `?layers=` carrying them
   as `events:war`; the **coastline toggle removed** (coastlines always
   drawn).
5. **Unplaced count** in the map's corner for the window.
6. **Form and editor**: every new field and both kinds in the
   contribution form and the review editor, through the registry; the
   picker offers offices for a tenure and events for `startedBy` and
   `parent`.
7. `about.html`, `CONTRIBUTING.md`, `ARCHITECTURE.md`.

Done when: browser tests for the office card, the strip on
`?actor=portugal`, a parent's bracket and collapse on the fixtures, a
`scope: worldwide` band, one glyph per category, the category toggles in
the URL, and the form writing a tenure; validator and tests green; the
literal line `M30b done`.

## Amendments after review

Written 6 September 2026 by an independent Opus reviewer of this brief,
against `m0` at `ebe40ec`, with the four owner questions answered as the
assistant recommends and recorded here; the owner may overrule. **These
override the body where they differ** (run protocol §3).

**A0 — the gate and the reading.** The gate line is the literal `M30a done`
on `origin/m0`. Read `docs/m30a-brief.md` *including* its "Amendments after
review" A0-A19 — that is what M30a delivered, and it differs from its body —
plus `docs/health-review-2026-09-06-result.md` §5.1 and §5.4. Before writing
anything, check the gate commit for the six things this brief assumes M30a
left behind: the placeholder office card in `src/panel/panel.js`, `office` in
`OPENINGS`/`CARDS`, `office` and `tenure` in the spine and in
`src/data.js`'s `kinds` array, offices in the search shard, `offices` in
`KINDS_OF` in `src/contribute/picker.js`, and `parent`/`scope`/`category` in
`KIND.event.fields` with descriptors in `src/contribute/bundle.js`. Write
what is missing; do not write again what is there.

**A1 — M30b runs as three**, each gated on the previous done line.
- **M30b-1 — the records a reader could not reach.** The office card and its
  close control, the search entry, the tenure strip on the actor card, "Part
  of" and the parts list on the event card, `historicalNames` on the place
  card, the actor line's `note`. Done line `M30b-1 done`.
- **M30b-2 — the two views.** The parent bracket, the graph's semantic
  collapse, large events as a band and a wash, the `event:` lens narrowed to
  the subtree, the unplaced count. Done line `M30b-2 done`.
- **M30b-3 — the controls and the writing.** The coastline toggle removed
  and `?layers=` widened, the form and the review editor, the documents.
  Done lines `M30b-3 done` and then `M30b done`.

**A2 — the glyphs are not in M30b.** Item 4 waits for M32b, which is the run
that gives events a `category`: until then the vocabulary is written and no
record uses it, so twelve toggles would match nothing and the map would look
exactly as it does today. M30b-3 delivers the coastline half of item 4 (A11)
and nothing else of it; `src/map/glyphs.js` is not written in this milestone.
When it is written, three things hold: the mark stays a `<circle>` and the
glyph is a separate `<use class="glyph">` with no `data-id`, so every browser
test that names `circle.mark`, `circle.hit` or `circle[data-mark]` still
passes and the keyboard path is untouched; an event with no category keeps
the plain circle; and each toggle carries its glyph, because the layer
control is the legend (plan decision 14) and there is no other.

**A3 — the office card's four hand tables.** `render()` in
`src/panel/panel.js` gains an office branch **after `source` and before
`place`**, so opening an office from an actor's strip keeps the actor and
opening an event from a tenure still wins the panel; the click switch gains
`clear-office`; `openingLabel` gains an `office` branch, or Back names this
milestone's own openings "the atlas" (M25); and `OPENING_OF` in
`src/share.js:66-68` gains `office: 'office'`, or Discuss and Edit on the
office card carry the bare page. Each with a test.

**A4 — the office card, stated.** Title, the actor it belongs to (a link to
that actor's card), the category's label, and the tenures in start order:
holder, dates, and the event that started it where `startedBy` names one,
each opening its own card. An office cites nothing (M30a A13), so there is no
Sources section and the card says why, as the place card does. `when: null`
is drawn as no dates at all, never as "unknown".

**A5 — the tenure strip, laid out without measuring.** One strip per office
of the open actor, each an inline `<svg viewBox="0 0 1000 H">` with
`preserveAspectRatio="none"`, so it fits whatever width the pane has and no
card has to measure its container — cards are strings and nothing in
`panel.js` measures. The scale runs over the **actor's own `when`, clamped to
`atlas.extent`**, and does not move with the reader's window, as the rest of
the actor card does not. Bars that overlap are merged by `clusterPoints` at
`k: 1` with the distance expressed in viewBox units, exactly as
`timeline.js` calls it; a merged bar carries `+n` and opens the panel's
cluster list. Clicking a bar opens the holder (`actor`), not the tenure —
a tenure has no card (`tenure.urlParam: null`).

**A6 — the subtree lens, and no new control.** `atlas.childrenOf` is a
`Map<id, id[]>` built once in `createAtlas` from the spine's `parent`, each
list sorted by start year then id. `eventsOfFocus`'s `event` branch returns
the event and its descendants, walked transitively with a visited set so a
`parent` cycle in bad data terminates. **No "Show only this" button is
added**: `src/panel/event.js:289` already draws "Focus on this" and "Focus
only on this" through `ctx.lensControl('event', id)`, and a third control
with the same effect is one control too many. A parent's card says in one
line what the lens would keep.

**A7 — the collapse is post-layout and never in the arrangement key.** A pure
`src/graph-view/collapse.js`, applied to the laid-out layout after
`layoutGraph` and before `stackLayout`, sharing the existing
`` `${laidFor}|${k}|${holdingKey(s)}` `` cache in `graph-view.js`. It remaps a
collapsed child's edge endpoints onto its parent and drops the self-edges
that result. `arrangementKey` (`arrangement.js:57-68`) is not touched: it
excludes the zoom on purpose, and a collapse inside it would relay the graph
out on every wheel notch and undo H4b. The threshold is one named constant
beside `STACK_DISTANCE`. A parent holding anything in `alone` — the
selection, the walked chain, the open actor's events, a narrative's walk — is
never collapsed, which is M25's never-hide rule unchanged. The badge reads
`subtreeWeight ?? weight` (M30a A11 omits the field on every leaf) and shows
the number of collapsed members beside it: a weight is not a count.
`collapse.js` is named in `CLAUDE.md`'s layout tree in the same commit.

**A8 — large events, defined.** An event is large when `scope` is
`regional` or `worldwide`, or when its children fall in more than one
**region lane** — evaluated against the region lanes always, never against
the reader's current grouping, which is `none` by default and has no lanes at
all. On the timeline it is a full-height rect in a new
`<g class="layer layer-bands">` **under** the bars, at `--cobalt-faint`,
with no handles and its title on the axis, so it is never mistaken for the
window band. On the map: a `regional` event washes the polygons of its
`region` from `data/geo/regions.json`, which is already loaded at first
paint; a **`worldwide` event gets no wash** — a tint over the whole viewport
would put a film over every coastline, territory and mark, and several would
stack. Instead the map's corner says "N events in this window span the whole
map", each named and openable. An event with neither place nor region is
timeline-only, as it is today. The card says which of the three it is.

**A9 — the bracket, and where it is not drawn.** A parent whose children are
all in one lane is drawn as a thin rule along the top edge of that lane,
spanning the children's extent, in its own `<g class="layer layer-brackets">`.
A parent whose children cross lanes is a large event and gets A8's band
instead. Nothing is drawn under `group: none`, where the rows are packed and
there is no vertical room (health review §5.2.4); the card's "Part of" line
is where a reader learns about it there. Both the bracket layer and the band
layer hand their children back through `reuse`, or
`tests/timeline-browser.test.mjs:150-208` fails: it asserts fewer than ten
elements added and ten removed on a state change.

**A10 — the unplaced count.** Its own element in the map's **bottom-left**
corner, `--ink-soft` on `--paper` with a `--line` border — not `.map-note`,
which is at the top right, is bordered in `--madder` and means "the picture
is not the one you asked for". It counts the active events with no place
whose interval overlaps the window **and which the lens keeps** — the same
three filters the marks obey — and reads "N events in this window have no
place; they are on the timeline". Zero prints nothing.

**A11 — `?layers=`, widened without breaking a link.** `LAYERS` in
`src/state.js:93` keeps its three names and `land` stays a member, so every
shared `?layers=` link still parses and
`tests/state.test.mjs:109`'s `defaultState()` is unchanged; what goes is the
*checkbox*, and the coastlines are always drawn. `parseState` additionally
accepts any token matching `events:<slug>` without `state.js` learning which
categories exist — that file is deliberately free of the data. The token
`events` means "every category"; turning one off replaces it with one
`events:<id>` token per category still on, which is what `formatState`
writes, so what the reader did is always in the link. This is plumbing only
in M30b: no category toggle is drawn until A2's run.

**A12 — the layer control on a phone.** The three checkboxes stop being
static markup in `index.html` and are built in `main.js` from the manifest,
with every label and id passed through `esc()` — `data/categories.json` is
data from `data/` and data from `data/` is untrusted input. When the category
toggles arrive they go inside a `<details>` labelled "events by category",
collapsed, so the phone drawer keeps one 40px target instead of fifteen
(`src/style.css:544-557`, `tests/phone-browser.test.mjs:134-153`).

**A13 — the spine's two new kinds, checked at the gate.** The office entry
carries `of`, `title`, `category` and `when`; the tenure entry carries
`person`, `office`, `when`, `startedBy` and `note`; neither carries
`summary`. If M30a's `buildSpine` (`src/validate/core.js:482-547`) did not
write them, M30b-1's first commit adds them there and in
`topologyFromSpine`, updates `manifest.counts` and its exact assertion in
`tests/build-index.test.mjs`, rebuilds `data/index/` **and**
`tests/fixtures/data/index/` in the same commit, and ends with
`node tools/validate.mjs --index` byte-identical. Never rebuild against a
pre-H9 spine. Without these fields the strip costs one fetch per tenure —
sixty for Portugal after M31.

**A14 — three fields M30a wrote and nothing reads.** The place card lists
`historicalNames` as a dated line under the variants ("Lourenço Marques,
1895-1976"); dated labels on the base map stay M38's. The actor card's rows
and the event card's chip titles show an actor line's `note` after the role.
An event with no `region` says "no lane" where the card prints
`ctx.laneLabel(event.region)` (`src/panel/event.js:287`), rather than the em
dash `laneLabel` returns for `undefined`.

**A15 — the search box.** `src/search-box.js:136-153` gains an `office`
branch setting `{ office: id, selected: null, chain: [] }`; the "outside the
lens" hint at `:62-66` leaves an office alone, because a lens is about
events.

**A16 — the form and the editor, only where M30a stopped.** Check each at the
gate and write only what is missing:
`fieldsFromRegistry()` (`src/contribute/bundle.js:164-182`) throws at module
load in both directions, so a registry field with no descriptor is a dead
`contribute.html` and `review.html`, not a missing input. Then: descriptors
for the event's `parent` (a record picker over events), `scope` (a select of
`'' | regional | worldwide`) and `category` (a select filled from the
manifest's categories); a third input on the actor row for `note` and a
datalist of `rolesAllowed` for the role, which is free text today
(`src/contribute/form.js:335`) against a list M30a closed; `tenure` added to
`everythingCited` (`bundle.js:968-972`), which hard-codes four kinds and
would otherwise let an uncited tenure look complete; `tenure` added to
`CITER_ORDER` (`src/kinds.js:307`) after `relation`, or a source's card never
shows the tenures that cite it. The review editor is generic over
`FIELDS`/`ACTOR_LISTS`/`CITATION_LISTS` and needs nothing of its own beyond
these.

**A17 — the documents, including `CLAUDE.md`.** `tests/site.test.mjs:105-124`
fails on the run's own commit if a new module under `src/` is not named in
`CLAUDE.md`'s layout tree — `collapse.js` here, `glyphs.js` when it comes.
`ARCHITECTURE.md` gains the office card, the collapse, `?layers=`, and an
amendment to the paragraph at `:1520-1528` ("nobody can make a mark bigger
except by giving it more edges and more actors") saying that `scope` is a
written field the owner decided on 5 September and is not the `prominence`
override, which stays reserved. `about.html` gains offices and tenures, parts
of events and large events, in "How to read it". `CONTRIBUTING.md` says when
to write `parent` and `scope` — and that `scope` is a claim about an event's
reach, not a way to make it look important.

**A18 — no new colour, no new size, no unescaped data.**
`tests/site.test.mjs:63-70` forbids a hex value outside `:root` in the CSS
and anywhere in `src/`. The band, the wash, the bracket and the strip use the
existing tokens; SVG text keeps the user-unit sizes the views already use
(`events.js:31-42`), never a `--text-*` rem; and every string that reaches
the DOM from `data/` — a category label, an office title, a holder's name, a
historical name — goes through `esc()`.

**A19 — nothing here writes a historical claim.** M30b is code. No record
under `data/` is created or edited by it except the index files A13 names,
and no summary, explanation or label states a fact about the past that a
person has not written.

**Done when, restated:** `?office=<id>` opens a real card with its actor, its
category and its tenures in order, closes on its own control, is named by
Back and carries its own address into Discuss and Edit; an office is findable
in the search box and opens from it; `?actor=portugal` shows one tenure strip
per office, merged past what fits and opening the holder; an event's card
says "Part of" and a parent's lists its parts; the timeline draws a bracket
over children in one lane and a band under the bars for a large event; the
graph collapses a subtree at a zoom, post-layout and without relaying out,
expanding anything the reader is holding; "Focus only on this" on a parent
narrows every view to its subtree; the map's bottom-left corner counts the
unplaced events of the window; `?layers=` accepts `events:<slug>` and the
coastline checkbox is gone with `land` still parsing; the form and the review
editor write and read every new field, and a tenure cannot be submitted
uncited; `historicalNames`, an actor line's `note` and an event with no lane
are all visible somewhere; `CLAUDE.md`, `ARCHITECTURE.md`, `about.html` and
`CONTRIBUTING.md` say so; `node tools/validate.mjs --index` byte-identical;
`node --test` green **with `CHROME` set** and the number of skipped tests
reported; `STATUS.md` with the literal lines `M30b-1 done`, `M30b-2 done`,
`M30b-3 done` and then `M30b done`.
