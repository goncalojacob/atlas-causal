# Architecture

What the Atlas causal is meant to become, structurally. `CLAUDE.md` has the
rules, `CONTEXT.md` the reasoning, `STATUS.md` where we are right now. This
file is the target: the shape every milestone builds toward.

Revision 22, 5 September 2026. Sections marked ● exist in v1; things marked ○
are reserved by a line in this file only — no folder, no schema, no code.

**What revision 22 changed, and why.** One optional field on the source
record, one new page, and a layout for a screen the atlas did not have one
for. Nothing about the state, and nothing in any link.

*The atlas stacks on a phone* ●. Under 720 pixels the view takes the screen,
the timeline is a fixed strip under it, and the panel is a **sheet** over
both — up when a record is opened, down to its grip when it is in the way.
The search takes a line; the grouping and the layer switches fold behind one
Options button. Nothing about it is state, so a phone and a desktop opening
the same URL see the same records, and the pane sizes of M24 are ignored
because the media query never names them. `src/phone.js` decides what raises
the sheet and what a drag of the grip ends as; everything else is one media
query.

*A source can say what work it is inside* ●. `container` — `{ title, kind }`
with kind `journal | edited-volume | series | website`, plus the `volume`,
`issue` and `pages` that belong to the containing work rather than to this
one. A closed list for the reason the edge types are one. `containerText` in
`citation.js` is the one place the form of it is decided, so the
bibliography, the source card, an event's Sources section and the full
entry's citation list cannot drift apart. Absent on a work that stands alone,
which is every source record written before this revision.

*Narratives have a page, and their steps can be reordered* ●.
`narratives.html` groups every account by the centuries it crosses, so two
accounts of the same years sit side by side — see the narratives section
below. And because the order of a narrative's steps *is* its walk, both
places one is edited let a row move: two controls and Alt with an arrow,
from `contribute/reorder.js`, over the pure `moveItem` in
`contribute/bundle.js`.

**What revision 21 changed, and why.** Nothing in the data model. One new
rule about the browser's history, and the panel's cards rearranged.

*A card is a head, a summary and collapsible sections* ●. The owner's
complaint was that a card showed everything at once — summary, actors,
consequences, convergence, citations, narratives, horizon — and read badly.
It is now progressive disclosure: a **head** (title, one line of when and
where and which lane, an event's actors as chips with the role on hover and
in the `title`, and the quiet links out), the **summary** alone, and then one
**collapsible section per question**, each header carrying its count —
Consequences, Causes, Other branches, Sources, Part of, and on an actor
Relations and Territory. Nothing was removed: the counts say what is behind
a header before it is opened, and one click gets there. `panel/sections.js`
is the one module that decides it, for every card.

The count is the point, and it is where a dispute is announced:
"Consequences (3, 1 disputed)", so that a closed section never presents a
disagreement as settled. **One section is open at a time** — the panel is a
narrow column and two open sections put the second a screenful below the
first — and which one is a *preference*, not state: it stays out of the URL
and lives in `localStorage`, as the pane sizes do. Which opens by itself
follows the arrival: walking a chain opens Consequences, arriving from a
source's card opens Sources, otherwise the reader's remembered choice. The
header is a native `<button>`, which is where Enter and Space come from.

*Convergence splits in two.* **Causes** is the direct incoming links and is
always there; **Other branches** is the convergence query's result and is
drawn only while a path is being walked, because without one there is
nothing to be other than. The query itself is unchanged.

*The walked path is a breadcrumb* at the top of the panel, each earlier step
a link that returns to it and drops what came after — the path is the
argument being followed. Only a disputed step is marked in it; a badge on
every crumb is a row nobody reads.

*Opening a record pushes a history entry.* `state.js` used to write every
change with `replaceState`, so the browser's Back left the atlas. Now a
change of **what is open** — `selected`, `source`, `place`, `actor`,
`narrative`, `step` — pushes, and a change of the **view** only — pan, zoom,
the window, the lanes, the layers, the lens — replaces, or dragging the band
would fill Back with a hundred frames of the same picture. The decision is
one pure function on the patch. The browser will not say what Back returns
to, so the store keeps its own trail of the openings it pushed and `popstate`
walks it; the panel's head names the link ("← Carnation Revolution") with a
Forward twin. On a popstate the URL is the whole truth about what is open —
those fields are taken from it rather than inherited — and `restore` puts a
narrative's derived selection back.

*A citation carries its verification mark.* The flags were already on the
record (`review.citations`, M15) and were only ever read by the dashboard;
the panel now shows them, and says "unchecked" where nobody has opened the
source. All 1,874 of them are, and an atlas that did not admit it would be
claiming more than it can support.

**What revision 20 changed, and why.** Nothing in the data model, nothing in
the state. One reserved line became built, and one module grew two functions.

*The graph view draws a level of detail* ●. It no longer draws one node per
event unconditionally: nodes of one band that are closer together than a
screen constant — `STACK_DISTANCE`, thirteen units at k = 1, a little under
the distance at which two hit targets overlap — are drawn as one mark with a
`+n` badge, and the links between two such marks are drawn as one line,
heavier for how many it carries, in the commonest of their types and dashed
as disputed if **any single one** of them is. Zooming in splits the stacks;
clicking one puts its members in the panel and, when zooming can part it,
goes to the zoom where it does. Merging is **within a band and never across
one**, because a lane is a claim about where a group of events belongs.

*The arrangement and the level of detail are two functions, not one.*
`layoutGraph` places every event once and knows nothing of the zoom;
`stackLayout` reads those coordinates and says what is drawn at a given `k`.
That split is why a stack can open without the picture moving: zooming
changes which marks are drawn, never where a mark is. Both are pure, both are
tested for determinism, and the second is tested against the whole atlas as
well as against the density the feature exists for.

*`cluster.js` is the one module that decides what merges*, for all three
pictures. It gained `alone` — the set of ids that must keep a mark of their
own, which every view used to hand-roll — and `mergeEdges`, the other half of
a level of detail. In the graph the never-stacked set is what the reader is
working with: the selection, the walked chain, the consequences and
converging branches drawn at it, the lens's events, the horizon's reachable
set, a narrative's steps, and the selected actor's events.

**What revision 19 changed, and why.** Nothing in the data model. One field
in the state, one number halved, and one rule about what a click on nothing
means.

*The map's viewport is state.* `bbox`, `[west, south, east, north]` in
degrees, rounded to two decimals in the URL: the part of the world the map is
looking at. Pan and zoom are still not state — how far somebody scrolled is
not worth carrying — but **what they can see** is, because the timeline reads
it and draws only the events placed inside it. Null is the world, and the
timeline's pin restores it. The map writes the box when the movement stops
rather than on every frame, and fits itself to a box it is given in a link;
`src/util/viewport.js` answers the one question — is this event in that box —
for the timeline, and `map/projection.js` owns both conversions between a
transform and a box, because that conversion is the projection's own. **What
the reader is holding is exempt**: the selected event and the steps of the
walked chain stay drawn wherever they happened, since a chain that ran off the
edge of the screen is still a chain. The graph view has no viewport of its own
and is not narrowed by one; it says so rather than leaving the reader to
wonder why the lanes below are shorter.

*The automatic lanes are six.* Twelve was a list with gaps: the seventh lane
down was never looked at, and everything under it was noise with a name. An
explicit `lanes` list is unlimited as before — a reader who names ten actors
has said they want ten.

*A click on nothing puts down what the reader was holding.* On the map and on
the timeline alike, a click that hits no mark, cluster, bar, stack, territory
or handle clears `selected` and `chain`; a drag never does, and a click on a
territory still selects its actor. It cost the timeline its old
click-to-set-the-year, because the empty ground of the lanes is a drag surface
now — the wheel narrows the band around the year under the cursor and a drag
slides it — and one gesture cannot both move time and drop the walked chain.
The year is a double-click away and "Map at 1911" is still on the card.

*Two sizes are a preference and not state.* The edges between the map, the
timeline and the panel can be dragged; `src/panes.js` writes two custom
properties on the grid and remembers them in `localStorage`, per reader, per
browser. They are not in the URL — a link is what somebody is looking at, not
how they arranged their window — and the phone layout, whose media query does
not mention either property, ignores them. `src/share.js` is the other way
out: the correction issue about the record on the open card, and the drawing
on screen as a standalone SVG with the stylesheet and the reader's own
computed tokens inlined.

**What revision 18 changed, and why.** One optional field on the three kinds
that are about a thing in the world, one page, one renderer, and one rule.

*A record may carry its own long form.* `body`, optional, on `event`, `actor`
and `place`: an extensive text about the record, written by a person, in a
**closed Markdown subset**. It is not a second summary. `summary` is what a
card shows while a reader is following links through the graph — a sentence or
two — and `body` is the thing they open when they want to read about the
record rather than traverse it. It is optional and **absent by default**: an
empty field writes no key at all, so a record nobody has written an entry for
looks exactly as it did before the field existed, which is the same rule the
identity fields follow and for the same reason.

*The subset is closed because the data is untrusted.* `src/markdown.js` is
pure, has no DOM, and renders paragraphs, `##`/`###` headings, emphasis,
lists, block quotes, links to records by id (`event:`, `actor:`, `place:`,
`source:`) and to `http(s)` URLs, and citation marks `[^source-id]` /
`[^source-id p. 12]`. Everything else — raw HTML, images, any other scheme —
comes out as the characters somebody typed, escaped like every other string
from `data/`. There is no configuration turning any of that on: a renderer
with a permissive mode is a renderer whose permissive mode will one day be
reached by a contribution. The same function runs in Node for the validator
and in the browser for the page and the two previews, so what a contributor is
shown while writing is what a reader is shown afterwards.

*`entry.html?id=<record id>` is one page for all three kinds*, because a
reader who opens an event, an actor or a place wants the same things about
each: what it is, when it was, what it touches, the text, and where all of it
came from. Every link on it is an `<a href>` and never a button with a
`data-action` — a page's links are the browser's, they open in a new tab and
they can be copied — and a record with no entry gets a page that says so and
asks for one, because most records will have no entry for a long time and a
missing page would read as a broken atlas. The citations are resolved and
listed at the foot, numbered in the order the entry first names each work, so
a mark leads to the work and the work leads to its card.

*Rule 23 is what only the whole record can say.* A citation mark must name a
source the record itself cites — a mark to an uncited work is a footnote to
nothing, and the reader would have nowhere to arrive — and a link by id must
resolve to a record of the kind it names, for the reason rule 3 exists. Both
are reported at `/body`, because a body is prose and has no finer path than
itself. The review digest gains **`entry`**, a boolean and never the prose:
the queue can then say which records have a full entry without the index
carrying the longest text in the atlas.

**What revision 17 changed, and why.** Nothing in the data model, again. One
generated file, one tool that writes it, two typefaces, and one rule about
which of three colours wins.

*Colour on the map is generated, not authored.* The territories used to be
one cobalt wash apiece, which is honest and unreadable: two hundred polities
and no way to tell where one stops. They now carry **eight muted hues**,
tokens in `src/style.css` like every other colour, with a lighter tint of
each for dependencies. Which actor gets which is **data**:
`tools/build-palette.mjs` rasterises the boundaries of every presence shard
onto a grid, works out who touches whom in each period, colours that graph so
that no two neighbours are ever alike, and writes `data/geo/palette.json` —
one small integer per actor. `tools/validate.mjs --index` checks it for
freshness exactly as it checks the index, and the manifest names it so the
site fetches it in one request with the core. A hue is a fact about the
map and not about the polity, which is why it is not a field on the record:
what touches what changes every time the outlines do, and a field would have
to be re-argued by hand each time.

*The hue belongs to the actor, and a dependency borrows its owner's.* So a
territory keeps its colour as the years pass — Angola is one hue in 1975 and
in 2019 — and before independence it is drawn in Portugal's tint, which is
what makes an empire read as one family and its neighbour's empire as
another. Where eight is not enough, which happens to an empire that borders a
quarter of the world, the file records who it had to share a hue with rather
than hiding it.

*The hierarchy of emphasis is now a rule and not a habit.* Territory colour
is the ground; the **selected actor** is cobalt over every hue, drawn last as
well as loudest; the **walked chain** is madder over that. Nothing new may
enter the map above those two. `tests/contrast.test.mjs` holds the whole
contrast table — every pair of ink and ground against WCAG AA, every line
against 3:1, and the cobalt of a mark against each of the eight washes it can
be drawn over — and fails when a token slips.

*The type is self-hosted and there are two of it.* EB Garamond for what the
atlas says and Public Sans for what the interface says, both SIL OFL, both
in `src/fonts/` with their licences beside them, and neither from a CDN: the
no-runtime-dependency rule is about who the reader's browser talks to, not
only about npm. Sizes come from a scale in `style.css` and from nowhere else.

**What revision 16 changed, and why.** Nothing in the data model at all. One
tool, one workflow, two more shapes under `data/imports/`, and a directory
that is deliberately not data.

*The import is a tool, and what it may do is narrow on purpose.*
`tools/import/wikidata.mjs`, zero dependencies like everything else, in three
modes: `--reconcile` matches records that are already here against items,
`--import` creates records for the items a file names, `--candidates` writes
a list of proposals and touches nothing under `data/`. It never writes an
**edge** — a causal link is an argument and a person makes it — and on a
record that already exists it is **additive per field**: it writes
`wikidata`, `wikipedia` and `sitelinks` only where they are absent, never
modifies a non-empty value of any field, never touches `summary`, `title`,
`when`, `place`, `actors` or `sources`, and adds **no `authors` entry** for
enriching, because putting an import's name on somebody's record for having
filled in an identifier would be claiming their work. The rule is in
`tools/import/identity.mjs` rather than in either import, and `cshapes.mjs`
obeys it too: an identifier added between two runs of that import survives
the next one, the way `created` does. Records the import *creates* carry
`authors: [{ name: "Wikidata import (tools/import/wikidata.mjs)" }]`,
`review.flags: ["imported-facts"]`, and a summary that quotes the item's own
description and says it is not this atlas's account of anything.

*What an item means here is data, not code.* Which Wikidata class becomes an
event of this atlas, and which makes an actor a person rather than an
institution, is an editorial decision, so it lives in
`data/imports/wikidata-seeds.json` → `classes` and is argued with in a pull
request. An item whose classes are not in that table is **refused and listed
with its labels**; nothing is guessed. The same file names the `items` the
import walks and the `queries` that propose more of them, and
`schema/v1/import-seeds.json` is its shape. This is the same principle
revision 7 applied to `cshapes-actors.json`, and it is now the rule for every
import rather than a thing one of them happened to do.

*A cut-off run has somewhere to resume from.* `data/imports/wikidata-state.json`
(`schema/v1/import-state.json`) holds one cursor per mode — what is pending,
what is done, when it was last written — and the tool walks in batches of 25,
each batch leaving the tree validating. A job that dies halfway has lost at
most one batch, which matters because the only machine with network access is
a GitHub runner on a job with a wall-clock limit. `data/imports/` now holds
three kinds of file and `tools/lib/read.mjs` dispatches on the file's `kind`;
a file that names no kind is a map, which is what the directory held before
there was anything else.

*The one job with a network runs on a branch of its own.*
`.github/workflows/import-wikidata.yml` triggers on a **push to `import/**`**
and never on `workflow_dispatch`, which would resolve the workflow on the
default branch, where no workflows live. The branch name carries the mode
(`import/reconcile-…`, `import/candidates-…`, `import/run-…`) and reaches the
script through `env`, never through `${{ }}` in a `run:`. Every batch is
validated, tested and indexed **before** it is committed, a failure restores
`data/` and exits, and the job commits to its own branch and never to `m0` —
the merge back is the run's own commit, which is what keeps two writers off
one branch.

*Cached Wikipedia leads are not data.* `tools/import/cache/wikipedia/<QID>.<lang>.json`
keeps an article's opening paragraphs with the revision they came from, the
licence, and a link to the history where the attribution actually lives. It
is outside `data/`, is never a record, is checked against
`schema/v1/wikipedia-lead.json` by `tools/validate.mjs` all the same, and
`deploy.yml` removes it before the Pages upload: publishing it would be
republishing Wikipedia. `data/LICENSE` and `about.html` say what it is.

**What revision 15 changed, and why.** Three optional fields on a record, one
optional block inside another, and two rules. No new kind, nothing removed,
and nothing that was drawn before is drawn differently.

*A record may say where else the same thing is catalogued.* `wikidata`
(`^Q[1-9][0-9]*$`), `wikipedia` (language code → article title) and
`sitelinks` (`{ count, on }` — a count of somebody else's database with the
day it was read, not a fact of the thing), all optional, on `event`, `actor`
and `place` —
the three kinds that are about a thing in the world. An edge and a narrative
are arguments *about* things, and nobody else's database has an item for
them. The fields are **additive and import-written**: M16's tool writes them
where they are absent and never over a value, the contribution form derives
`wikidata` alone from a pasted Wikidata URL, and the review dashboard shows
all three read-only, because a wrong item is corrected on Wikidata and
re-imported rather than typed in here. A record that has never been near the
import looks exactly as it did before they existed — no key, no null.

*They are identifiers and never evidence.* What the atlas asserts is in the
record; this only says where to find the same thing elsewhere, so that a
machine can find a record again and a reader can go and read somebody else's
account. The card offers **"Read more on Wikipedia"** in the reader's
language when there is an article in it, else English, else the first there
is, always saying which — `src/wikipedia.js`, pure, and the language is
checked against a pattern before it becomes a hostname. The titles join the
search as further names, and the label stays the atlas's own. **`sitelinks`
feeds nothing**: not `prominence`, whose reservation below stands, and not
`weight`. It is a stored fact for an editorial decision nobody has taken,
and storing it is cheaper than fetching it again when they do — which is
also why it is the one of the three the index does not carry.

*Rule 21* is what only the set of records can say: one item is claimed by at
most one record **of a kind** (two kinds may claim it, because a polity and
the place it is named after are two records and the atlas does not decide
they are one thing); a `wikipedia` title stands only beside the item it
belongs to, a title with nothing behind it being a guess about which article
is meant; and a language key is a language code. *Rule 22* is what the
citation list can say: an edge may not be `consensus` when **every**
supporting citation is a Wikipedia record. An encyclopedia reports
scholarship rather than being it. `WIKIPEDIA_SOURCES` in `rules.js` is that
list, and adding an edition adds a line to it, exactly as adding an import
adds one to `NC_ORIGINS` in `src/origin.js`. Deliberately not folded into rule 9: that rule
asks whether two authors are independent and this one asks what kind of
thing was cited.

*A citation can be checked, and that is a flag rather than a gate.*
`review.citations` maps a cited source's id to `{ verified: { by, on } }`.
Whether the record's text is right and whether each book says what the record
says it says are two acts, often days apart, so the second is recorded per
citation instead of being folded into the signature. The dashboard lists
every source the open record rests on with a way to the work itself and a box
that stamps the tick; the queue says how many are unchecked; the validator
prints the count across the dataset; **Sign warns and signs anyway**, because
a reviewer who has read the record and not yet got hold of the book is
further along than nobody having read it at all. Rule 3 checks that a key
names a source the record actually cites — a flag left behind by a citation
that was edited away would otherwise count as checked for ever — and signing
clears the block with the rest of `review`. `place`, `source` and `region`
cite nothing and are untouched by all of it.

*Three source records exist for the imports to cite*: `wikidata` (a
`dataset`) and `wikipedia-en` / `wikipedia-pt` (`web`, with **identical**
`creators`, which is what keeps rule 9 from counting two editions as two
independent authorities). All three are CC BY-SA 4.0 *as records*; the CC0 of
Wikidata's data and the CC BY-SA of Wikipedia's text are stated on the
records and at the head of `data/LICENSE`, which also says that nothing here
holds Wikipedia prose — only titles, which are names and not the article.

**What revision 14 changed, and why.** Nothing in the data model. Two ideas
the interface had been confusing with others, separated and given a file
each.

*A lane is a grouping, and there are four of them.* The timeline's lanes and
the graph view's bands were both "one per region", written twice. They are
one thing now — `src/lanes.js`, pure and tested — and which grouping is a
choice in the state: `none`, `actor`, `place`, `region`. **The default is
`none`**, which has no named lanes at all: the timeline packs the bars into
as many unlabelled rows as it takes for none of them to overlap at the
current width, and the graph drops its bands and lets the barycentre place a
node wherever its links want it. That is the arrangement that makes the
fewest claims about the data, which is why a visitor sees it first. `region`
may well come back as the default when the data is world-scale and a
continent is again the most useful thing to say; the choice is one value in
the state, not a rewrite.

*An event is drawn in exactly one lane.* An event with four actors is one
event, and drawing it in four lanes would turn a count of events into a count
of participations without saying so. The rule is mechanical — the heaviest of
its actors among the lanes on screen, "heaviest" being the actor with the
most events in the window, the same number that ordered the lanes — and the
event card **states it**, with what else the event involves. A rule the
reader cannot see is a rule they cannot check. The lanes themselves are the
six with the most events in the window plus "Other" (twelve until revision
19), or exactly the
reader's own `lanes` list in the reader's own order. The **window decides
which lanes there are and never which events are in them**: a bar outside the
band is drawn faded, and a lane it had been counted out of would leave it
nowhere to be drawn.

*Filtering is not grouping, and neither is selecting.* `?focus=actor:salazar`
is a **lens**: the three views hold only the events that record is involved
in — an actor in `actors[]`, a place equal, a region equal, a source cited by
the event or by an edge at it, an event itself, a narrative's whole walk — and
everything else is **removed**, not dimmed. Dimming is what selection does,
and if both faded neither would mean anything. The lens is offered on every
card, said in the header, and carried in the URL. It never narrows the search:
a record outside it is still found and listed, and marked as outside, because
answering "nothing by that name" about a record that is right there would be a
lie. **Reading a narrative suspends the lens**: reading is a mode, and a step
that vanished because a lens was left on would be the atlas hiding the thing
it was asked to show.

**Since H7 the lens takes any number of foci, of any of six kinds**, and keeps
two sets rather than one (owner, 5 September). `?focus=` is a comma-separated
list of `kind:id`; the **focus set** is the union of what each focus keeps and
`&focusAll=1` makes it the intersection. Around it is the **ring**: everything
one hop out over an active edge, in either direction, from one depth of
`subgraph()`. A view draws the focus set in full, the ring dimmed
(`.lens-near`), and nothing else — a neighbourhood with no edges leaving it
would look like an atlas in which nothing else happened. Each focus is a chip
in the header with its own ×; every card offers "Focus on this", which adds,
and "Focus only on this", which replaces.

**An open actor or place with no `?focus=` is a lens on itself.**
`?actor=angola` drew the whole atlas with nine marks emphasised in it, which
answers a question nobody asked. So the absence of the parameter now *means*
something, and `?focus=none` is the value a reader writes to say no to it
while keeping the card open. A place before an actor, which is the precedence
the panel shows its cards in; a selected event does not take it away, because
a reader walking out of a place's list is still inside that place.

**What revision 13 changed, and why.** The dataset the interface was built
against is a draft nobody has read, and this revision is the machinery for
reading it.

*A record can say what wants checking.* An optional `review: { flags, note }`
in the envelope: slug-shaped flags and one sentence about how much the record
has been read. It is never a claim about the world, only about the record's
own standing, and signing removes it. `tools/seed-review-flags.mjs` put
`STATUS.md`'s "Dates to verify" onto ninety-five records once; after that the
field is written by whoever drafts.

*The index gains a third hashed file.* `review-<hash>.json`: a digest of every
record still carrying the draft marker — the dozen fields a list needs and no
prose — the number of reviewable records, and the validator's own warnings.
The browser cannot read a thousand record files, and the index drops
`authors` because the atlas never shows them; without this file the dashboard
would either be blind or reimplement the rules. **Since H6b it is a summary
and one shard per kind**, plus a history file per record; see the index tree
above.

*`review.html` is a maintainer's page, unlinked from the atlas.* The queue on
the left — **since H6b a list of any length with only the rows on screen in
the DOM** (`src/review/list.js`, the row in `row.js`), read in four orders
(flags, degree, oldest, kind) and narrowed by kind, by flag and by which
writer made the record — one record open on the right in the contribution
form's own fields —
`FIELDS` and the three list definitions are imported, not copied — validated
against the loaded graph on every keystroke by the same `validateBundle()`
the form runs. Sign replaces the draft marker with the reviewer and sets
`revised`; Retract sets `status: retracted` and, for an event or an edge,
carries the edges and narratives that cannot outlive it, refusing instead of
cascading where records would have to be rewritten rather than retracted.
Beside the record since H6b: both ends of a link with their summaries and
their standing, the record's history out of the repository's commits, an
optional `review.claimedBy` that expires after a week and is never a lock,
and — from the first keystroke — the fields that have changed since the
draft.

*The amendment to "no backend", and it is narrow.* Saving needs a writer, and
the public site has none and keeps none. `tools/serve.mjs` is a **local
development tool that is never deployed**: it serves the repository as
`python3 -m http.server` does and adds `PUT /__records/<kind>/<id>`, which
validates a bundle as a unit against what is on disk before anything is
written and rebuilds `data/index/` after. It binds `127.0.0.1`, refuses a
`Host` that is not this machine and any foreign `Origin`, sends no CORS
headers and answers no `OPTIONS`, and judges the kind and the id against
`KIND_DIRS` and the kind's pattern before a path exists. Opened without it —
under `http.server`, or on the published site — every save becomes a
correction bundle on the clipboard and the existing correction issue opens
with it, so the dashboard degrades to the pipeline everyone else uses.

*The attribution amendment.* The local server is the **one** path where
`authors` and `revised` are written without the Action, because the reviewer
is the maintainer at their own machine and the whole point is to replace the
draft marker with a person. Everything arriving through the correction-bundle
path keeps the Action's attribution, unchanged.

**What revision 12 changed, and why.** The last reserved kind was built, and
with it the first thing in the interface that is a *mode* rather than another
dimension of one view.

*Narratives are records.* `data/narratives/<id>.json`: `title`, `summary`,
`steps` — an ordered list of `{ ref, text }` where `ref` is an event id or an
edge id — and an optional `window` to open on. The envelope is an edge's,
**sources required**: a narrative rests on something beyond the records it
walks, and it is signed, because `CONTEXT.md` asks for competing accounts of
the same period, each attributed, with the reader comparing them rather than a
wiki resolving them. A narrative changes nothing it walks. It is prose beside
the graph, and the graph does not know it is being walked.

*And the way in is a page.* `narratives.html`, in the header beside the
bibliography, is a card per account — title, narrator, the years it is about,
how many steps, its own summary — **grouped by the centuries it crosses**,
which is the arrangement `CONTEXT.md` asks for and a flat list cannot give:
two accounts of the same years have to sit side by side to be read against
each other. An account across a boundary is listed under both centuries, with
its own full period on the card. The years are the years of the records the
steps arrive at and never the `window` beside them — the window is what the
atlas opens on, a choice about the picture — and a title opens the account at
its first step. It replaced the list M12 put in the panel behind the header's
narratives button, which was the same list without the arrangement and had no
other way in (deviation 182).

*Reading is a mode, and the URL says so.* `?narrative=<id>&step=<n>` is
authoritative; `selected`, `chain`, `from` and `to` are **derived** from the
step by `narrative.js` and deliberately not written to the address bar. A link
to a narrative is a link to a place in an argument, not a snapshot of somebody's
screen. `narrative-mode.js` is the one place the derivation is applied — it
wraps the store, so no view has to know that the state it reads was computed —
and it remembers, in memory, the state entering replaced, so leaving puts it
back. A step that names an edge selects that edge's `to`; the chain drawn is
the longest contiguous run of edges ending at the step, and a step that does
not join the one before it simply breaks the run, because a narrative may jump
and a jump is not a causal path.

*Rule 20 is what only the whole walk can say*: at least two steps, real prose
at every one and in the summary, no record twice running, and a window that
opens before it closes. Everything else is the rules the other kinds already
have — refs resolve (3), sources exist (6), an active narrative does not walk
a tombstone (11), the licence is CC BY-SA (12).

**What revision 11 changed, and why.** One new kind, and the first link in
this model that does not run between events.

*Relations are records.* `data/relations/<id>.json`: `from` and `to` are actor
ids, `type` is one of six closed values — `regime-of`, `succeeded`,
`member-of`, `part-of`, `led` (deprecated in M30a-2; see below),
`allied-with` — `when` is an interval and
`note` is an optional short line. The envelope is an edge's: **sources
required**, because a relation is an assertion about two actors and not a
fact about the world. It answers the question `STATUS.md` had carried open
since M5: `portugal` is a state actor the import created, the four regimes of
it were written by hand, and nothing linked them, because the honest link is
between actors and every link this model had ran between events.

*A relation is not an edge, and its id says so.* The id is derived,
`from--to--type`, which is an edge id's shape with a different vocabulary in
the third part. `RELATION_ID` therefore sits beside `EDGE_ID` and everything
that turns an id into a path or reads one out of a URL picks the pattern by
kind: the schema, `rules.js`, `bundle-to-files.mjs`, and `state.js`, where the
walked chain — a list of edge ids — refuses a relation id by name rather than
by falling through a loose pattern.

*Rule 19 is what only the pair can say.* Two different actors; the kinds each
type allows (a person is not a regime, a party is not a state, a succession
runs between two of a kind); and no cycle in `regime-of` or in `succeeded`,
**each on its own** — a line that closes on itself is a mistake, and mixing
the two types would forbid arrangements that are merely unusual. Everything
else is the rules the other kinds already have: references resolve (3),
sources exist (6), a tombstone is not referenced (11), the licence is CC BY-SA
(12), the years are years (15). A relation whose interval falls entirely
outside an actor's own is a **warning**, for the same reason an event outside
one is.

*The index carries relations whole, `note` included.* A relation has no
card of its own: it is read on the actor card at either end, grouped by type
and direction, so one record is "Regime of Portugal" on one card and a line
under "Regimes" on the other. Carrying the note is what keeps a card with
twenty relations at no further request — the same reasoning as a presence's
`capital`. **The graph view was left alone**: drawing actor relations as a
second layer over a graph whose x axis is the year would have put undated
nodes on a dated scale, and the card says it better.

**What revision 10 changed, and why.** No new kind and nothing new on a
record. One derived field in the index, one card, one page, and one more
question the graph can be asked.

*A source is read from both ends.* Every active record that cites it, as
`{ kind, id, locator, dissent }`, plus **`citationCount`**. It is the one
direction nothing could answer without reading every record in the atlas,
which is exactly what an index is for. `dissent` marks a citation made from
an edge's `dispute.sources`, so a book arguing against a link is never
listed as evidence for it. The rows were in the sources index until H3b and
cost the measured difference between 27 KB and 231 KB raw on every page
load; they are the **citer directory** now, one file per source, fetched
when a reader opens that source, and only `citationCount` stays in the
index. `?source=<id>` is a card like a place's, and `sources.html` is the
bibliography, generated at render from that index and never hand-written.
Sources join the search, by title and by creator.

*The graph answers "what did this lead to by year X?"* `graph.js` gains
`shortestPaths`, `pathTo` and `reachableBy`: breadth-first outward, the
answer cut at a year on `start.min ≤ horizon` — astronomical, the lenient
bound the arrow of time and the window already use. Ties at equal depth break
by the earlier predecessor, then by id, then by the edge's own order, so the
path a reader is handed is the same path twice running. `horizon.js` puts the
traversal and the year together, so the panel's list and the sets lit on the
map, the graph view and the timeline cannot disagree. Choosing an answer
walks the shortest path to it as the chain, which turns the answer back into
something convergence can be asked about.

*The horizon's default is never written to the URL.* `state.horizon` is null
until a reader sets a year, and null means the window's far end. Only a
chosen year lights the reachable set: lighting every event's whole downstream
by default would say something nobody asked, and would lengthen every link
that is shared.

*Card precedence is `selected` > `source` > `place` > `actor`.* Choosing a
source clears the event and the walked path and keeps the actor: "which of
this actor's events rest on this book" is a question worth being left in.

**What revision 9 changed, and why.** One new kind, and one field on events
replaced by a reference.

*Places are records.* `data/places/<id>.json`: names, a point, an optional lane
override, an optional summary. An event carries `place: "<place id>"` in place
of its own `where`, and takes its coordinates and its lane from it. Thirty-seven
of the sixty records in the test dataset carried Lisbon's coordinates typed
separately, which is thirty-seven chances for them to disagree and no way to say
anything about Lisbon itself. A place is a thing with a history: `?place=lisbon`
is a card like an actor's, listing what happened there and who turns up there.

*A place needs no source.* Rule 6 already exempted `source` and `region`
records, and a place joins them: where a town is is a geographic fact, not a
historiographical argument. Everything else about it is the usual envelope, and
**rule 18** is the little that is left — at least one name, no repeats — for the
same reason an actor's name list is a rule (deviation 22).

*The lane is derived where the coordinates are.* An event's `region` is its own
override first, then the place's — the place's own override, then the polygon
its point falls in, then the nearest lane within tolerance. The override on the
Azores now sits on the place, where the derivation happens, rather than on the
one event that happened there; an event's own override is still the last word,
for the case where an event belongs somewhere other than where it happened.

*The panel is one file per card.* `src/panel/{panel,event,place,actor,cluster}.js`:
the shell owns the container, the clicks and the load token, and hands the cards
everything they share. Card precedence is `selected` > `place` > `actor`, so
opening an event from a place's list does not throw the place away.

**What revision 8 changed, and why.** Nothing in the data model. A third view
of the same graph, and one more field in the state.

*The graph view.* `src/graph-view/` draws every event as a node and every edge
as a line, so the whole web is visible at once instead of one chain at a time.
It takes the map's slot behind a **Map | Graph** toggle and shares everything
else — panel, search, window, URL, selection, walked chain. **x is the year**,
on the same scale the timeline keeps for the whole extent of the data; there is
no force simulation, because physics would put 1910 beside 2011 and lie about
time. **y** is spent on one faint band per region and, inside a band, on a
barycentre pass over the events of each year. The five edge types are drawn
distinctly — pattern and weight, from tokens in `style.css`, keyed in
`about.html` — never by colour: the atlas has one accent and it belongs to the
path being walked. Convergence, which the panel can only list, is a picture
here: the branches that fed the selected event from off the walked path are
drawn filled in.

*The layout is pure and its arrangement is checked, not trusted.* `layout.js`
takes the events and edges and gives back coordinates, with no DOM and no
state. Its
barycentre sweeps are counted: every sweep's arrangement is scored by how many
edges cross, and the best wins — the plain order included, so the pass can
never leave the drawing more tangled than doing nothing would. Ties break by
id, then by weight, and every list that feeds a floating-point sum is sorted,
so the same records give the same picture whatever order they arrive in.

*Which node a click means is decided by distance*, not by which circle is on
top. Two adjacent years are about eight units apart at rest on this data, and
a mark or its stroke covering a neighbour's centre would have made that
neighbour unreachable until the reader zoomed.

*Level of detail for the graph view is built* ● (M25). The map's clustering
idea along the time axis: events of one band and a stretch of time drawn as
one node with a count, opened by a click, with the links between two such
nodes merged and counted too. `cluster.js` was already the one-dimensional
case of it and is now the shared one. The threshold is a screen constant, so
zooming in splits the stacks on their own, and what the reader is working
with is never inside one.

*The state carries `view`*, `map` or `graph`, in the URL as `?view=graph`. It
is state and not a preference: a link is meant to open on the picture the
person who sent it was looking at.

**What revision 7 changed, and why.** Nothing in the data model of the graph;
one new directory beside it, and a different shape for the state. Three
things:

*The mapping of an import is data.* `data/imports/<source>.json`, validated by
`schema/v1/import-map.json`, says which actor a source's entity becomes and
where one entity's code is more than one actor over its life. It is not a
record — no envelope, no kind, not in the index, never fetched by the
browser — and it exists so that correcting a territory is a pull request
against one file rather than a change to `tools/`. The first thing it decided
is the question revision 6 left open: a colony and the state that followed it
are **two actors**. CShapes code 750 is `british-india` until 1947-08-15 and
`republic-of-india` after it. A split date must be a boundary the source
itself draws, or the import refuses it — an outline was surveyed for one side
of a date and cannot be moved to the other.

*Time is a window, not a moment.* The state carries `{ from, to }` in place of
`year`, either end null for "as far as the data goes". The map draws the
events whose interval **overlaps** the window and the territories of its
**far end**, because an event is an interval and a border is a state of
affairs at a moment. The timeline draws the window as a band with a handle at
each end and keeps its lanes on the whole extent of the data: zooming the
lanes to the window would leave a handle no room to widen into.

*The map's clustering serves the timeline too*, so `map/cluster.js` becomes
`cluster.js` and a lane is the same problem in one dimension. `search.js`
and `search-box.js` are new and reserved-no-longer: the extension-points
table promised a generated `search-<hash>.json` and it turned out not to be
needed at this size — the index already carries every title and every
name, and scanning a few hundred of them is a keystroke.

**What revision 6 changed, and why.** The `presence` kind moved from ○ to ●,
and with it `data/presences/`, `data/geo/presences/`,
`src/map/layers/presences.js` and `tools/import/` — the last four reserved
names in the tree that had a use waiting for them. Territories were always
going to be an import rather than writing, and the first one, CShapes 2.0,
arrived under CC BY-NC-SA 4.0: a licence CC BY-SA cannot absorb in either
direction. That is the whole reason the architecture kept imported geometry
in its own directory from the start, and the isolation is now real rather
than planned — a licence enum with a fourth value, a per-directory rule, and
one named exception (`NC_ORIGINS`, keyed on `origin.tool`) for the actor
records an import has to create. Three things the data decided rather than this file: a presence
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
them no zoom could ever part; `weight` on every active event in the core says which
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
   file. For *structure* the site reads a generated graph index — the
   **core** — always
   whole, in one request; what a card, a label or a strip reads arrives behind
   it, a century a file, and nothing waits for it. For *text* it reads the
   record file directly —
   `data/events/<id>.json` is already a static asset and the id is the path.
   The site never scans directories.
2. **Two kinds of things: nodes and edges.** Node *kinds* grow over time —
   event, actor, presence and narrative now. Edge *types* do not. The five
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
├── sources.html                  ● the bibliography, generated at render from the sources index
├── narratives.html               ● every narrative as a card, grouped by the centuries it crosses; prerendered by the build, and drawn from the core and the shards its walks cross when the fixtures are asked for
├── entry.html                    ● one record's full entry; ?id=<id>, for an event, an actor or a place
├── review.html                   ● the review queue; a maintainer's page, unlinked, the only one that writes
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
│   ├── places/<id>.json          ● somewhere events happen; an event points at one
│   ├── relations/<id>.json       ● a dated, typed link between two actors; id from--to--type
│   ├── offices/<id>.json         ● a post an actor has, held one person after another; a title and a category
│   ├── tenures/<id>.json         ● one person's turn at one office; a free slug, because a person may hold one office three times
│   ├── narratives/<id>.json      ● a signed walk through records already here; ordered steps of { ref, text }
│   ├── presences/<id>.json       ● who held which ground, and when; CC BY-NC-SA when imported
│   ├── imports/<source>.json     ● import-map: which actor a source's entity becomes; not a record, tool-side only
│   ├── imports/wikidata-seeds.json  ● import-seeds: the items, queries and class table the Wikidata import is pointed at
│   ├── imports/wikidata-state.json  ● import-state: where a cut-off import stopped, one cursor per mode; WRITTEN by the tool
│   ├── regions.json              ● timeline lanes: id, label, order
│   ├── roles.json                ● the closed list of what an actor did in an event: id, label, description; adding one is an edit to this file
│   ├── categories.json           ● the closed list of what kind of thing an event was: id, label, description; the map draws a glyph per id
│   ├── geo/
│   │   ├── LICENSE               ● per-source: Natural Earth = public domain, CShapes = CC BY-NC-SA 4.0
│   │   ├── land-present.json     ● Natural Earth 110m coastlines
│   │   ├── regions.json          ● lane polygons, GENERATED from Natural Earth by tools/build-regions.mjs
│   │   ├── palette.json          ● actor id → which of the eight territory hues, GENERATED by tools/build-palette.mjs; carries the CShapes licence, being a colouring of its borders
│   │   └── presences/<from>-<to>.json  ● outlines, sharded by period, GENERATED by tools/import/
│   └── index/                    ● GENERATED by tools/build-index.mjs, committed on main by the deploy job
│       ├── manifest.json         ● the index's generation, counts, hashed file names, lanes and regionBoxes (one [minLon,minLat,maxLon,maxLat] per lane, since I1), roles in use, the two vocabularies (rolesAllowed, categoriesAllowed), officesByEvent and tenuresByOffice, land epochs, presence shards, explanation shards, the palette's file name; never cached
│       ├── presences-<hash>.json ● every presence {id,actor,dependencyOf,dependencyKind,when,geometry.key,capital,confidence,status} — half the whole-corpus projection on the real data, and nothing reads it until the territory layer draws, so it is fetched there and not at first paint (I1). Absent, with its manifest key, where a dataset has no presences
│       ├── core-<hash>.json      ● the graph and what a mark, a bar and a lane are drawn from: every record's id and status, an event's year bounds, place, lane, weight, subtreeWeight, parent and its actors' **ids**, an edge's [from,to,type,confidence,status], an actor's type and years, a place's point, the two ids a relation, an office and a tenure join and their years, and the merges list. Loaded whole by every page but sources.html since I4b, which is when the whole-corpus file stopped being written
│       ├── attributes-<key>-<hash>.json ● what a card, a label or a strip reads and the core drops: title, `when` verbatim, revised, citesCount, wikidata, wikipedia, scope, category, an actor line's role and note, names, a place's label and precision, a relation's and a tenure's note, an office's title, a narrative's summary, authors, window and step refs. One file per century plus `place` (a place has no year) and `null`, filed by attributePeriod() and fetched for the window
│       ├── search-<hash>.json    ● what the search box scans, folded at build time: per active record {id,kind,label,detail,terms,variants,weight,when,status} and, for an event, `lead` — the folded first sentence of its summary, matched below every name; fetched beside the core and never waited for
│       ├── explanations-<from>-<to>-<hash>.json  ● the links' arguments, a century a file, keyed by edge id: fetched in bulk by whatever reads a *path* and never to draw anything
│       ├── citers-<hash>/<source-id>.json  ● the records that cite that one source, with locator and dissent; one file, fetched when a reader opens the source
│       ├── sources-<hash>.json   ● every source record with its bibliographic fields and `citationCount`; the rows themselves are the citer directory
│       ├── review-<hash>.json    ● the queue's summary: how many records are reviewable, how many are still drafts, and one line per kind — its count and its shard
│       ├── review-<kind>-<hash>.json  ● one kind's drafts: a digest each {kind,id,status,authors,created,revised,review,origin,degree,and the field it is named by} and the validator's warnings about them; review.html fetches the kind it is showing
│       └── history/<id>.json    ● what changed at each version of one record and when each signature was added, out of the repository's own commits; unhashed, fetched when a record is opened, compared by name and not by bytes (H6b)
│
├── schema/
│   ├── v1/event.json  edge.json  source.json  actor.json  place.json  relation.json  office.json  tenure.json  narrative.json  presence.json  region.json  bundle.json  ●
│   ├── v1/import-map.json  import-seeds.json  import-state.json  ● the three shapes of data/imports/, dispatched on the file's `kind`; checked by tools/validate.mjs only
│   ├── v1/wikipedia-lead.json    ● the envelope of a cached article lead under tools/import/cache/; not data, checked anyway
│   └── common/interval.json  place.json  provenance.json  confidence.json  ●
│
├── src/
│   ├── main.js                   ● bootstrap only: load, wire views
│   ├── state.js                  ● { from, to, view, focus, group, lanes, selected, source, place, actor, office, chain, horizon, layers, narrative, step, bbox } ⇄ URL; data-free
│   ├── lanes.js                  ● pure: what the lanes are in each of the four groupings, which one an event is in, and the packing for `none`
│   ├── lens.js                   ● pure: the events a focus keeps; removed from every view, not dimmed
│   ├── grouping.js               ● the picker in the header, and the badge that says which lens is on
│   ├── narrative.js              ● pure: what a step is about, the chain at it, how far the window opens; narrative-mode.js applies it to the store
│   ├── data.js                   ● manifest → the core (whole) → the attribute shards behind it → record text on demand; lookup tables, adjacency of events by edge and of actors by relation, events by actor and by place, an event's point through its place
│   ├── graph.js                  ● consequences, ancestors, convergence, shortest paths outward and what an event led to by a year; pure functions over adjacency
│   ├── horizon.js                ● pure: the traversal and the horizon year put together; what the panel lists and the views light
│   ├── chain.js                  ● pure: the walked chain against the status of its steps; cut at the first that has been retracted, since the later ones were reached through it
│   ├── citation.js               ● pure: a source as a citation, its identifiers as links, a bibliography's order
│   ├── markdown.js               ● pure: the closed Markdown subset a `body` is written in; everything outside it comes out as text
│   ├── cluster.js                ● pure: which marks overlap at this zoom, which of them no zoom can part, which are held out of the grouping, and how the links between two groups merge; the timeline uses it in one dimension and the graph in two
│   ├── density.js                ● pure: everything past the margin as one path per row — two-pixel columns, as tall as the count they stand for
│   ├── emphasis.js               ● what the reader is working with, once: the eight sets the three views draw from, kept per state change
│   ├── search.js                 ● pure: titles and every one of an actor's names, folded and ranked
│   ├── search-box.js             ● the input, the list and the keys
│   ├── phone.js                  ● under 720px: what raises the panel's sheet, what a drag of its grip ends as; the layout itself is one media query
│   ├── map/
│   │   ├── projection.js         ● lon/lat → SVG and back; the only file a projection change touches
│   │   ├── map.js                ● SVG scaffold, pan/zoom, click into a cluster
│   │   └── layers/land.js  presences.js  events.js  regions.js   ●
│   ├── graph-view/
│   │   ├── layout.js             ● pure: events + edges + lanes → coordinates; x is the year, y is bands and a barycentre pass
│   │   ├── arrangement.js        ● pure: what is laid out — the band, the margin, what is held — and the key that says when again
│   │   ├── collapse.js           ● pure: an event's parts drawn inside it below a zoom; after the layout, before the stacking, so no node moves for it
│   │   ├── layout-message.js  layout-worker.js  layout-runner.js   ● what crosses to a thread, the thread, and when one is worth it
│   │   └── graph-view.js         ● the SVG: nodes, the five edge types, the window as a shade, pan/zoom, nearest-centre clicks
│   ├── timeline.js               ● the lanes lanes.js gives, or packed unlabelled rows; the window as a band with two handles; bars stack; one layer per kind of element, kept from render to render
│   ├── timeline-scale.js         ● linear now; the scale is injected
│   ├── panel/panel.js            ● the shell: the container, the clicks, the load token, what every card shares
│   ├── panel/event.js  source.js  place.js  actor.js  office.js  cluster.js   ● one card each
│   ├── large.js                  ● pure: which events are large, and which parents get a bracket rather than a band
│   ├── panel/horizon.js          ● the "what did this lead to by year X?" section of the event card
│   ├── sources/main.js  bibliography.js   ● the bibliography page: bootstrap, and the list as markup
│   ├── narratives/main.js  list.js   ● narratives.html: bootstrap, and the cards grouped by century as markup
│   ├── entry/
│   │   ├── entry.js              ● pure: the atlas + a fetched record → the full entry page, as markup
│   │   ├── preview.js            ● pure: the live preview under the textarea, drawn by the form and the dashboard alike
│   │   └── main.js               ● the page: resolve ?id=, fetch the record, assign
│   ├── contribute/
│   │   ├── form.js               ● inputs → bundle; searches titles and aliases before allowing a new event; actors chosen by name
│   │   ├── reorder.js            ● one row of an ordered list moved up or down, with Alt+↑/↓; the form and the review editor share it
│   │   ├── bundle.js             ● the field definitions, buildRecord and its inverse valuesFromRecord/applyValues, validateBundle
│   │   └── submit.js             ● bundle → clipboard + issue template; URL prefill only under ~6 KB
│   ├── review/
│   │   ├── queue.js              ● pure: what is unreviewed, the digest the index carries, the flags and the filters
│   │   ├── sign.js               ● pure: the signature, the retraction and what a retraction carries or is blocked by
│   │   ├── save.js               ● which of the two paths a save takes, discovered by trying the write endpoint
│   │   └── editor.js  main.js    ● one record in the form's own fields; the page around it
│   ├── validate/
│   │   ├── schema.js             ● JSON Schema subset, fails closed on unknown keywords
│   │   ├── rules.js              ● cross-record rules (arrow of time, DAG, references, consensus, dispute…); resolveId() is where a former id becomes the record it names
│   │   ├── migrate.js            ● the migration chain: ordered { version, name, up, down }, pure, no fs, applied on read and by the writer
│   │   └── core.js               ● validate(records, topology) — pure; runs in browser and Node
│   ├── util/esc.js  dates.js     ● escaping; toAstronomical(), interval formatting, BCE/CE
│   ├── util/window.js            ● pure: a null bound is the data's own; what overlaps the window; the margin the views draw beyond it; "map at Y"
│   ├── util/memo.js              ● pure: an answer kept per graph and per key, weak on the graph and bounded within it; the horizon and the convergence query share it
│   ├── render-key.js             ● pure: whether a view has to be drawn again — the whole state, plus what the view holds outside it
│   ├── fonts/                    ● EB Garamond and Public Sans, woff2, self-hosted; OFL beside them, README.md says which file came from where
│   └── style.css                 ● azulejo tokens, the eight territory hues, the type scale, the spacing scale
│
├── tools/
│   ├── validate.mjs              ● CLI over validate/core: reads data/, checks every invariant, exit code
│   ├── build-index.mjs           ● writes data/index/*; recursive key sort, code-unit comparator, content hash
│   ├── build-palette.mjs         ● the adjacency of the presence shards → data/geo/palette.json; greedy colouring in actor-id order, then settling
│   ├── build-regions.mjs         ● Natural Earth countries → lane polygons in data/geo/regions.json (run once, committed)
│   ├── screens.mjs               ● docs/screens/*.png through a headless browser's own command line; no Puppeteer, no npm
│   ├── lib/colour.mjs            ● tool-side only: sRGB ⇄ OKLab, perceptual distance, WCAG contrast; nothing in src/ computes a colour
│   ├── bundle-to-files.mjs       ● fenced JSON in an issue body → data/<kind>/<id>.json; slug-checked before any path
│   ├── new-record.mjs            ● scaffold a record locally, of any of the six written kinds; --new-place writes the event and its place at once
│   ├── migrate/apply.mjs         ● the chain of src/validate/migrate.js applied to the tree; idempotent, validated before writing, --to <version>
│   ├── migrate-places.mjs        ● one-time: every event's `where` → a place record it points at; kept as documentation
│   ├── seed-review-flags.mjs     ● one-time: STATUS.md's "Dates to verify" onto the records as review flags; kept as documentation
│   ├── serve.mjs                 ● local only, never deployed: the repository + PUT /__records/<kind>/<id> on 127.0.0.1
│   ├── import/topojson.mjs  cshapes.mjs               ● offline, zero-dependency import of borders over time
│   ├── import/simplify.mjs                            ● the name the import knows src/util/simplify.js by
│   ├── import/wikidata.mjs       ● identifiers and records from Wikidata; injectable fetch layer, three modes, additive
│   ├── import/identity.mjs       ● the additive rule itself, obeyed by both imports
│   └── import/cache/wikipedia/   ● GENERATED: article leads with their revision; never published, never data
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
    │   ├── deploy.yml            ● on push to main, one job: build-index → commit if changed → stage _site from the allowlist → upload → deploy
    │   └── import-wikidata.yml   ● on push to import/**: the only job with a network; mode from the branch name, commits to that branch and never to m0
    ├── CODEOWNERS                ● data/ and .github/ → owner
    └── PULL_REQUEST_TEMPLATE.md  ● the review checklist
```

Reserved, by this line only ○: `data/i18n/<lang>/` and
`data/geo/land-<epoch>.json`. Level of detail for the graph view was reserved
here and is built (M25).
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
  all other aliases. Everything resolves them, through one helper — `resolve()`
  in `src/data.js` for the site and `resolveId(id, universe)` in
  `src/validate/rules.js` for the validator, which answers the same question
  the same way: a reference, a narrative step and a `review.citations` key
  written against a record's former id all name the record that stands for it
  now. `aliases` holds former ids only; alternative names for search are a
  separate field, later.
- `status`: `active | merged | retracted`. A `merged` or `retracted` record
  must have no active edges and, if merged, a `supersededBy` that resolves.
  Nothing is ever deleted; a wrong record becomes a tombstone that still
  resolves old URLs.
- `authors`: set and appended by the Action from the issue opener; never
  free text from the form alone. `created` and `revised` are set by the
  Action or derived from git at index time. The one exception is signing a
  record in `review.html` through `tools/serve.mjs`, on the maintainer's own
  machine (revision 13).
- `origin`: optional, `{ "tool": "cshapes | wikidata | assistant | form",
  "run": "…" }`. **Which writer created this record**, written once by
  whatever created it and never by an enrichment pass that fills in a field on
  somebody else's record (rule 29; `CREATOR_ONLY` in
  `tools/import/identity.mjs`). Absent means a person wrote it by hand. It
  exists because whether a record is reviewed, who is legally its author for
  attribution, and which process wrote it are three facts, and all three used
  to be inferred from `authors[].name` matching one of three literal strings:
  a rename of any of them silently changed two of the three, and a person
  named exactly like an import could relicense an actor (health review A,
  findings 22 and 24; review B, 31). `src/origin.js` is the vocabulary and the
  predicates; `authors` is attribution and nothing else.
- `review`: optional, `{ "status": "draft", "signedBy": […], "flags": ["date"],
  "note": "…", "citations": {…} }`. How far this record has been read — its own
  standing, never a claim about the world. `status` is `draft` where nobody has
  read it and `reviewed` where somebody has, and `reviewed` requires `signedBy`
  (rule 28): **that, and not a name in `authors`, is what "unreviewed" means**,
  so a contribution or a later import that arrives unread is in the same queue
  (review A, finding 8). `flags` and `note` are the reviewer's to clear and
  signing clears them. `citations` is not: it maps a **cited source's id** to
  `{ "verified": { "by", "on" } }` — which of the works this record names a
  person has opened and checked against, a different act from signing and often
  a later one — and **Sign keeps it**, having deleted it a moment after the
  reviewer ticked it until H5b (review A, finding 7). Rule 3 checks the key is
  a source the record cites. It is a flag and not a gate — the validator counts
  what is unchecked, the queue and the dashboard show it, Sign warns and signs.
- `retraction`: `{ "on": "2026-09-04", "reason": "…" }`, present exactly on a
  retracted record (rule 27). Why it was withdrawn, written by a person like
  any other argument, and **nothing deletes it** — the reason lived in
  `review.note` until H5b, where signing a tombstone erased the only account in
  the data of its being one (review B, finding 16).
- `wikidata`, `wikipedia`, `sitelinks`: optional, on `event`, `actor`, `place`
  and `office` only, and described under Identity below.
- `license`: enum `CC-BY-SA-4.0 | CC-BY-NC-SA-4.0 | PD | CC0-1.0 | ODbL-1.0`,
  validated per directory. `data/events|edges|sources` → `CC-BY-SA-4.0` only.
  `data/presences/` may also be `CC-BY-NC-SA-4.0`, because a presence is
  usually derived from imported geometry whose licence `data/LICENSE` cannot
  absorb. `data/actors/` may be `CC-BY-NC-SA-4.0` **only** for the actor
  records an import creates: the exception is the list `NC_ORIGINS` in
  `src/origin.js`, one line per import allowed to create actors, and rule 12
  checks the record's `origin.tool` against it. Nothing else can quietly
  relicense an actor — a person named exactly like an import no longer can —
  and nothing NC ever enters an event, an edge or a source. Which licence
  covers which directory, and whom each asks to be named, is
  `src/licensing.js`, the `licenses` block of `data/index/manifest.json` and
  the table at the head of `data/LICENSE`; an NC-derived card and entry page
  carry the attribution line the licence asks for (review A, finding 24).
- `sources`: **every node and every edge cites at least one**; only `source`,
  `region` and `place` records are exempt, being facts rather than arguments.
- `schema`: which shape the record is written against. The validator accepts
  anything **up to** `SCHEMA_VERSION` and not only exactly it, because an
  older record is one the migration chain can read; a newer one is a record
  from a version of this atlas that does not exist here, and it is refused.

### Migrations — how a shape changes

`schema: 1` with nothing that could ever move it carries no information, and
the day it does move, every record in the repository is rewritten in one
commit and every fork's records are invalid the morning after (health review
A of 5 September, finding 25). The convention is therefore written now, while
there is little riding on it.

`src/validate/migrate.js` is the whole of it: an **ordered array of
`{ version, name, up(record), down(record) }`**, pure, with no `fs` anywhere
in it so that the browser loads the same file the tools do. A migration's
`version` is its place in that chain and **not** the record's `schema` —
records say which shape they are written against, migrations say how far the
tree has been brought, and most migrations, all three so far, are additive
within one schema. `SCHEMA_VERSION` moves only for a change that makes a
record genuinely unreadable by the validator before it.

Three rules hold it together:

- **Every `up` is idempotent.** Nothing on disk records how far a record has
  come — a chain marker would be a field the schema does not have and a byte
  in every file — so the chain is applied whole, every time.
- **It is applied on read *and* on disk.** `tools/lib/read.mjs` runs it on
  the way in, so the validator, the index builder, `serve.mjs` and the
  imports all see one shape; `tools/migrate/apply.mjs` rewrites the tree, in
  the same commit as any migration that changes bytes. A migration applied
  only on read wedges `validate --index`, the deploy and the import loop; one
  applied only on disk leaves every fork unreadable.
- **`down` is the inverse, or `null`.** The writer refuses to roll back past
  a step that has no `down` rather than writing a tree it cannot come back
  from.

`apply.mjs` writes nothing until every record has migrated *and* the whole
tree has validated: a migration is a change to every record at once, and
there is no reviewing that one file at a time afterwards. It never touches
`data/index/` — rebuilding the index there would hide the fact that records
had changed — so it prints `node tools/build-index.mjs` instead, and
`validate.yml` runs `validate --index` on any pull request that touches
`data/` to check that it was run.

The chain today is `1 envelope-defaults` (additive: the envelope keys a
fork's record may lack, a no-op on every record here), and the reversible
pair `2 review-citations-explicit` / `3 review-citations-implicit`, which
exists to prove `up`, `down` and the writer on a scratch copy of the fixtures
and leaves the tree byte for byte as it was.

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

### A point — `common/place.json`

```json
"where": { "lon": -5.319, "lat": 35.889, "precision": "city", "label": "Ceuta" }
```

WGS84 always; the projection lives in one file. `precision` is `point |
city | region`. It is the shape of a point wherever one appears — a place's
coordinates, an actor's seat, a presence's capital. Later an additive
`within: <presence-id>` may join it; the shape itself never changes.

### Place ● — somewhere events happen

```json
{
  "...envelope",
  "kind": "place",
  "names": ["Lisbon", "Lisboa"],
  "historicalNames": [
    { "name": "Lourenço Marques", "from": null, "to": 1976 },
    { "name": "Maputo", "from": 1976, "to": null }
  ],
  "where": { "lon": -9.14, "lat": 38.72, "precision": "city", "label": "Lisbon" },
  "region": null,
  "summary": null
}
```

An event points at one with `place` rather than repeating its coordinates,
so a town is written once however many events happen there, and can be read
as a thing with a history of its own (`?place=lisbon`). `names[0]` is the
display name and the rest are variants and other-language forms, which is
what search uses. **`historicalNames` is the dated sibling of that list** and
never a replacement for it (plan decision 6): `names` stays a list of strings
because search, rule 18, the topology and the translation overlay all depend
on that shape, and what a place was called when goes here, `to: null` meaning
still current. Nothing reads it yet — the base map's label layer will, so that
a city is labelled by the year on the slider. `region` is an override, as on an event, and this is where
it belongs when a whole place is outside every lane polygon — the Azores at
110m. **A place cites nothing**: where a town is is a geographic fact rather
than a historiographical argument, so rule 6 exempts it as it does `source`
and `region` records. Its `sources` may be empty all the same, for the place
whose location is itself argued over. A place is *not* a territory: what
ground an actor held is a presence, with an outline and dates.

### The full entry ● — `body`

```json
"body": "## The voyage\n\nThe fleet sailed in August[^russell-2000-henry p. 112], under\n[the king](actor:john-i-of-portugal).\n"
```

Optional, on `event`, `actor` and `place` — the three kinds that are about a
thing in the world, which is what somebody reads a page about. Written by a
person in the subset `src/markdown.js` renders and nothing else: no raw HTML,
no images, no scheme but `http(s)` and the four record kinds. `summary` stays
what the cards show; this is the long form, read at `entry.html?id=<id>`. A
record without one carries **no key**, not a null.

Citation marks are `[^source-id]` or `[^source-id locator]` and must name a
source in the record's own `sources[]` (rule 23); links by id must resolve to
a record of the kind they name (rule 23). The index does not carry `body` —
it carries the refs and not a word of the prose, as it never carried
`summary` — and `data/index/review-<hash>.json` carries only `entry: true`,
so the dashboard can say which records have one.

Since **H8** a record that carries one also gets a **static page**,
`entry/<id>.html`, written by `tools/build-index.mjs` from the same
`entryHtml()` the script runs and committed like `data/index/`. It exists
because a record's page is what a search engine indexes and what somebody
shares, and until H8 that page was an empty `<div>` until ~1.5 MB had
downloaded and parsed (health review A, finding 15). **`entry.html?id=` is
still the address** (health plan, decision 4): the static page is a second
rendering of the same record, carries `<link rel="canonical">` back to the
parameterised URL, sits under a `<base href="../">` so every relative link in
the template still resolves, and links to other records as
`entry.html?id=` like everything else. Its bootstrap sees the slot marked
prerendered and does nothing. `sources.html` and `narratives.html` are the
same idea in a page a person wrote: the list lives between two marks in the
file and the build replaces what is between them. `tools/lib/prerender.mjs`
is the pure half; `validate --index` compares all of it byte for byte, so a
generated page is stale under rule 16 exactly as the index is.

### Identity ● — where else the same thing is catalogued

```json
"wikidata": "Q186496",
"wikipedia": { "en": "Carnation Revolution", "pt": "Revolução dos Cravos" },
"sitelinks": { "count": 62, "on": "2026-09-04" }
```

Three optional fields on the four kinds that are about a thing in the world:
`event`, `actor`, `place` and `office` — a post that people hold one after
another is a thing Wikidata has an item for. An edge, a relation, a tenure
and a narrative are arguments *about* things and have no item. They are **identifiers and never evidence** — what
the atlas asserts is in the record, and this says only where to find the same
thing elsewhere — and they are **additive**: the import (`M16`) writes them
where they are absent and never over a value, the contribution form derives
`wikidata` from a pasted Wikidata URL and refuses to guess one from a
Wikipedia title, and the review dashboard shows all three read-only. A record
the import has not touched carries none of the keys.

`wikipedia` is allowed only beside `wikidata` and its keys are language codes
(rule 21), because the code becomes a hostname in the link the card offers.
`sitelinks` **feeds nothing** — not `prominence`, not `weight`, not the map,
not the search — and is stored because the editorial decision it is evidence
for has not been taken. An attribute shard carries `wikidata` (rule 21's
uniqueness has to hold against the whole atlas, which is why the two writer
pages hold **every** shard) and `wikipedia` (the card offers the link without a
fetch); `sitelinks` stays out of it.

### Event ●

```json
{
  "...envelope",
  "kind": "event",
  "title": "Conquest of Ceuta",
  "summary": "<written by a person>",
  "when": { "start": 1415, "end": 1415, "date": "1415-08-21", "calendar": "julian" },
  "place": "ceuta",
  "region": null,
  "parent": null,
  "scope": null,
  "category": "war",
  "actors": [ { "actor": "salazar", "role": "leader", "note": "led the expedition" } ]
}
```

`place` is the id of a place record and is where the coordinates live;
`place: null` is a long process with no honest point, which is timeline-only.
`region` is **derived** at index time by point-in-polygon of the place's point
against `data/geo/regions.json`; the field on the record is an optional
override for the honest cases (Tordesillas is about the Americas, signed in
Castile). An override on the place wins over the derivation, and the event's
own override wins over both. Lanes change by editing one polygon file, never
by touching records. Since M30a-3 `region` is optional **everywhere** (plan
decision 5): an event with neither a place nor a region is drawn in no lane,
and the validator says so with the warning `no-lane` rather than refusing the
record.

`actors` names the actors *of* the event — not everyone alive — each with the
role it played in it; every id must resolve to an active actor (rule 14). A
role comes from the closed list in **`data/roles.json`**, the owner's 31
(`docs/roles-mapping.md`); on an active event one outside it is rule 25, an
error, since M32b-1 re-filed the 163 phrases that were in use. `note` beside it is the
free text the role no longer carries — "president under whom it was held" —
and it is the one field inside a list the translation overlay addresses by
index. No `tags`: a junk drawer until there is a closed vocabulary with a
reason.

`category` is that closed vocabulary, and it lives in data as the lanes do:
**`data/categories.json`** holds `war`, `treaty`, `election`, `revolution`,
`law`, `founding`, `disaster`, `economy`, `culture`, `science`, `death` and
`other`, each with a label and a line saying what it covers, and adding one is
an edit to that file rather than a change to code (plan decision 13). One
outside the list is the warning `category-unknown`. The map draws a glyph per
category and the layer control toggles them (M30b); the Wikidata class table
carries a `category` column so an import writes one for the classes whose
mapping is not a judgement.

`parent` is the larger event this one is part of — a battle inside a war, a
decree inside a revolution. One parent, so the events form a forest, and
**rule 24** is what holds it together: it resolves to an event, an active
event's parent is active, and no chain of parents closes on itself; a child
dated outside its parent is a warning. It is a **display fact and never an
argument**: `parent` does not enter the adjacency, so consequences, ancestors,
convergence and the horizon stay edge-only and `?chain=` stays a list of edge
ids (owner, 5 September). The card says "Part of", a parent lists its parts,
the timeline draws a bracket and the graph collapses children into their
parent when zoomed out (M30b).

`scope` — `regional` or `worldwide`, and absent on an ordinary event — is for
the two cases a mark would lie about: a world war or a pandemic is drawn as a
band across the timeline and a wash over the map, so that it reads as the
ground the smaller events stand on. It is a closed vocabulary in **code**
(`EVENT_SCOPES` in `src/vocab.js`) and not in data, because it says how the
atlas draws an event rather than what the event was.

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
- **`container`, optional: the work this one is inside.**
  `{ "title": "Journal of Portuguese History", "kind": "journal",
  "volume": "12", "issue": "3", "pages": "45-67" }`, with `kind` one of
  `journal | edited-volume | series | website` and the last three optional.
  A closed list for the same reason the edge types are one: an article in a
  journal and a chapter in an edited volume are not cited alike, and "in
  something" would collapse them. The volume, the issue and the pages belong
  to the *containing* work, which is why they are inside it and not beside
  `publisher`. `containerText` in `src/citation.js` is the one place the
  form is decided — "Journal of Portuguese History, 12(3), 45-67." for a
  journal, "In The Cambridge History of Portugal, 45-67." for an edited
  volume — and every citation in the atlas goes through it. A work that
  stands alone carries no `container` key at all, which is what every source
  record written before M28 is.

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

### Relation ● — how two actors stand to each other

```json
{
  "...envelope",
  "id": "estado-novo--portugal--regime-of",
  "kind": "relation",
  "from": "estado-novo",
  "to": "portugal",
  "type": "regime-of",
  "when": { "start": 1933, "end": 1974 },
  "note": "From the constitution of 1933 to 25 April 1974."
}
```

- An edge runs between events. This is the other link, and the model had none:
  `portugal` is a state, the Estado Novo is a regime *of* it, and until this
  kind existed nothing could say so without faking it with an alias or a name.
- The id is derived, `from--to--type`, as an edge's is, so the same relation
  cannot be filed twice. `type` is the closed set of six: `regime-of`,
  `succeeded`, `member-of`, `part-of`, `led`, `allied-with`. **Do not add a
  generic type** — a missing one is reported in `STATUS.md`, which is what
  keeps the vocabulary meaning something.
- **`led` is deprecated and not removed** (M30a-2). Who led a body is an
  office somebody held: a relation's id is `from--to--type`, so this type
  could say that one person led one body once and no more. Its twelve records
  are retracted tombstones naming the tenure that replaced each, and the type
  stays in `RELATION_TYPES`, in the schema's `type` enum and `id` pattern, in
  the narrative step pattern and in `RELATION_GROUP_ORDER` so that they keep
  validating. Rule 19 refuses an *active* relation of it, and neither
  `new-record.mjs` nor the contribution form offers it:
  `WRITABLE_RELATION_TYPE_IDS` in `vocab.js` is the writable half, and
  `RELATION_TYPE_IDS` stays the whole list.
- Which kind of actor may stand at each end is fixed, and is rule 19:

  | type | from | to |
  |---|---|---|
  | regime-of | polity | polity |
  | succeeded | polity or institution | the same kind as `from` |
  | member-of | person, polity or institution | institution or polity |
  | part-of | institution | institution or polity |
  | led *(deprecated)* | person | institution or polity |
  | allied-with | polity or institution | polity or institution |

- `regime-of` and `succeeded` are **acyclic, each on its own**: both describe
  a line — a regime of a state, a state after a state — and a line that closes
  on itself is a mistake in the data.
- `when` is how long it held, `end: null` for one that still does; a
  succession is an instant, and its `date` is the day the source gives.
  Falling entirely outside either actor's own dates is a warning, not an
  error.
- **A relation cites at least one source**, like an edge: who belonged to what
  is argued from evidence, and a bare type between two ids would be an
  assertion with nothing behind it.
- `note` is optional, short, and written by a person. It is carried in the
  index with the relation, so an actor's card draws every relation it
  stands in without fetching a record each.
- A relation has **no card of its own**. It is read on the actor card at
  either end, grouped by type and by direction: "Regime of Portugal,
  1933–1974" on one, "Regimes: …" on the other.

### Office ● — a post held one person after another

```json
{
  "...envelope",
  "id": "prime-minister-of-portugal",
  "kind": "office",
  "of": "portugal",
  "title": "Prime Minister of Portugal",
  "category": "head-of-government",
  "when": null,
  "summary": null
}
```

- **Offices are records, not code** (plan decision 1). A sultanate, a doge, a
  party's general secretaryship or a chief is added by writing a file, and
  nothing about the interface has to know that Portugal happens to have had a
  crown and a presidency.
- `of` is the actor whose office it is. Which kind of actor may stand there is
  decided by the `category`, in a table beside the relation endpoints in
  `src/vocab.js`, and it is **rule 26**:

  | category | of |
  |---|---|
  | head-of-state | polity |
  | head-of-government | polity |
  | legislature | polity |
  | party-leadership | polity or institution |
  | military-command | polity or institution |
  | religious | polity or institution |
  | other | polity or institution |

- `category` is closed and small on purpose: it is what decides the table
  above, and what an Offices grouping and an office strip are drawn by. **Do
  not add a generic one** — a category nobody has decided about is reported in
  `STATUS.md`, as a missing relation type is.
- `when` is how long the post itself existed, and **may be null**: the three
  Portuguese offices assert that the post exists and what its tenures were,
  and nothing about when it began. Dating the crown against an actor record
  that starts in 1886 would be an invented claim, and rule 26's overlap check
  is skipped where an office has no interval.
- **An office cites nothing.** It joins `source`, `region` and `place` in rule
  6's exemption: that an actor has a head of government is a fact about how
  the actor is arranged, not an argument about the world. The tenures that say
  who held it each cite at least one source.
- An office has a card and a URL, `?office=<id>`, because a record nobody can
  reach is a record the atlas does not really have.

### Tenure ● — one person's turn at one office

```json
{
  "...envelope",
  "id": "soares-prime-minister-1976",
  "kind": "tenure",
  "person": "mario-soares",
  "office": "prime-minister-of-portugal",
  "when": { "start": 1976, "end": 1978 },
  "startedBy": "legislative-election-1976"
}
```

- A kind of its own and **not a relation**: a relation's id is
  `from--to--type`, so one person could hold one office exactly once, and
  Soares held three tenures (plan review, finding 1). The id is a free slug.
- **Rule 26**: `person` resolves to an actor of type `person`, `office`
  resolves to an office, and `when` overlaps the office's own interval where
  the office has one.
- **Two tenures of one office may overlap.** A regency is not a mistake and a
  year is the finest bound this model has, so nothing refuses it.
- `startedBy` is optional: the election, the coup or the succession that began
  the tenure. It resolves under rule 3 and may not name a tombstone (rule 11),
  and it is how a result that changed a government stays connected to the
  atlas without an invented edge (plan decision 3).
- **A tenure cites at least one source**, like an edge and a relation: that
  this person held this post in these years is argued from evidence.
- A tenure has **no card of its own**. It is read on the card of the office it
  is a turn at, as a relation is read on the cards of its two ends.

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

### Vocabularies in data ● — roles and categories

Two more lists of the same shape, and in data for the same reason: what an
actor did in an event and what kind of thing the event was are editorial
decisions, and a table somebody can argue with in a pull request is the only
honest place for them (plan decisions 7 and 13).

`data/roles.json` is `[{ "id": "signatory", "label": "Signatory",
"description": "Signed the agreement." }]`, the owner's 31 of
`docs/roles-mapping.md`. `data/categories.json` is the same shape and holds
the twelve categories an event may be. Both are read by
`tools/lib/read.mjs`, carried by `buildTopology` as `rolesAllowed` and
`categoriesAllowed`, and named in the manifest, so the browser's half of the
validator holds a record to them without fetching anything more. The roles are
enforced and the categories are not: M32b-1 applied the roles mapping and made
a role outside the list rule 25, while `category-unknown` stays a warning
because most of the corpus carries no category at all. Adding a role or a
category is an edit to one
file and never a change to code — unlike an event's `scope`, which is a closed
vocabulary in `src/vocab.js` because it says how the atlas *draws*.

An **absent** file means no check at all, never an empty closed set. That is
the difference between a dataset that has not decided on a vocabulary and one
whose every record is wrong, and it runs the whole way through: no file, no
key in the topology, no key in the manifest, no warning.

### Bundle ● — the unit of contribution

```json
{ "schema": 1, "records": [ { "...event" }, { "...edge" }, { "...source" } ] }
```

Validated as a unit: references may resolve inside the bundle or in the
graph index. Written to one branch, one PR. Warnings (not errors): an
event with degree zero; a source with no citers.

### Index and manifest ● — generated

The sources index carries every source record whole — it is small and it is
all citation — plus **`citationCount`**: how many active records cite it.
Which records those are is the **citer directory**, one file per source,
fetched when a reader opens that source; until H3b the rows were in this
index, and taking them out is where nearly all of this milestone's saving at
first paint comes from (328.8 KB → 29.4 KB measured). That direction is the
one nothing could answer without reading every record in the atlas, so the
bibliography on `sources.html` costs one fetch and a source's card one more.
`dissent` marks a citation made from an edge's `dispute.sources`. A tombstone
cites nothing: a merged or retracted record still resolves its own URL but is
not part of the graph, and counting it would make the bibliography disagree
with what the atlas draws.

**Two things must fetch before they can answer, and both do.** The source
card asks for its own citer file and says it is loading until it lands,
drawing the first 200 rows and offering the rest; a lens on a source
(`?focus=source:…`) is the same rows, fetched by `main.js` when the focus
asks for them, with the views forced to redraw when they arrive. And
`retractionPlan` on a source: its blockers *are* the records that cite it, so
`review.html` fetches that one file before it asks, and **refuses to retract
at all** if the fetch fails — an empty answer there would read as "nothing
cites this book" and let a reviewer break every record that rests on it.

`manifest.json` — never cached — lists the index's **generation**, counts
(events, edges, sources, actors, presences, regions), the hashed names of the
core, the attribute shards, the presence index, the search shard, the citer
directory and the review and sources indexes (all served `immutable`), the set
of `roles` in use, land files with their epochs, and the presence shards with
their year ranges. The generation is `manifest.schema` and it goes up by one in
every run that changes the index's shape — **5 since I4b**, which stopped
writing the whole-corpus file; 4 since I3, 3 since I2, 2 since I1 — and the
graph file carries the same number rather than one of its own, because two
numbers for one artifact is two things to forget to bump. `src/data.js`
**refuses a generation it does not know**, with the number it found and the
number it expected: a manifest from one generation beside a page from another
is a half-applied deploy, and reading it as though it were the shape the page
expects would be silent and wrong. The guard is `assertGeneration`, called by
`loadAtlas`, `loadCore`, `loadSources`, `loadNarratives` and `review.html` —
the places a file has just been fetched — and never by `createAtlas`, which is
handed pieces rather than files.

It also carries **`regionBoxes`**, one `[minLon, minLat, maxLon, maxLat]` per
lane, rounded to six decimals. A placeless event answers "am I in view" with
its region, and until I1 every page fetched the 221 KB of
`data/geo/regions.json` before it drew anything to reduce it to exactly these
four numbers per lane. The build has the polygons in hand for `deriveRegion`
and writes the boxes instead. The polygons themselves are still the only thing
that can draw a lane as a *shape*, which is what the wash over a `regional`
event is, so they stay reachable as `atlas.loadRegionPolygons()` — one
request, cached, a rejection dropped — asked for by that wash when a large
event is in the window and by nothing at first paint. Beside `regions` it carries the two closed vocabularies that live in
data — **`rolesAllowed`** and **`categoriesAllowed`**, the contents of
`data/roles.json` and `data/categories.json` — so that the contribution form
and the review dashboard run the same `checkRules` the CLI does without a
second fetch; a dataset with neither file carries neither key, which is what
says "no check". `roles` and `rolesAllowed` are not the same list and are not
meant to be: one is what people wrote, the other what the vocabulary allows.
And it carries the two joins the offices need (M30a-3): **`officesByEvent`**,
event id → the ids of the tenures whose holder the event names and which were
running when it began, and **`tenuresByOffice`**, office id → its tenures in
the order they were held. Both are derived from records the index already
carries whole; they are here so that `lanes.js` is a lookup in M33 rather than
a scan of every tenure per event. The presence index carries every presence **without its coordinates**, so
an actor's territory over time is a list the panel draws without fetching an
outline; the outlines are fetched one shard at a time, by year, and cached,
so scrubbing the slider inside a period costs nothing. The core is always loaded whole because
consequences, ancestors and convergence need the whole graph; loading a
window would make convergence return a subset and present it as complete —
exactly the determinism the query exists to prevent. What the core drops is
what a card, a label or a strip reads, and that arrives a century at a time
behind the picture. Record text
(`summary`, `explanation`, `dispute`) is fetched on demand from the record
file, **as `<id>.json?v=<revised>`** since H3b: an index file is named by a
hash and served `immutable`, but a record file is served under its own name
and has to be, because `entry.html?id=` is the address. The query string is
what tells a cache that a corrected record is a different file from the one
it kept; it is a hint to the cache and never part of the address, and a
record the index has no date for is asked for without one. `revised` is the
day the file was last written — the record's `revised`, or its `created`
where nobody has corrected it yet — and it is in the index for the five kinds
a card actually fetches: event, edge, actor, place, narrative. A presence and
a relation have no file anybody fetches and do not carry it.
`build-index.mjs` is deterministic: recursive key sort, code-unit
string comparison, trailing newline, tested for byte-identical output.

**The presences are not in the spine since I1.** They were 49.2 % of it on the
real data — 261 KB of metadata that no page reads until the territory layer
draws — so they are `presences-<hash>.json`, named in the manifest, fetched by
that layer where it already fetches a shard of outlines. The entries are the
entries the spine carried, field for field and in the same id order. Until it
lands the atlas answers emptily about territory: `presencesAt` gives `[]` and
the two indexes are empty, the way `loadedGeometry` gives null until an
outline lands, and the actor card draws its Territory section as the source
card draws its citers — a line, then the list, and no section at all for an
actor that held none. What is deliberately **not** behind that load is
`presenceCoverage` and `territoryYear`: they are read off `presenceShards` in
the manifest, so the far end of the window cannot move under the reader while
a file is in flight. A dataset with no presences writes **neither the file nor
the manifest key** — absent is what says there are none — while
`counts.presences` stays, because a count is not a file. The two pages that
run the browser's half of the validator need the list, because rule 17 and the
`actor-unused` warning read it: `review.html` draws its queue and rebuilds its
universe when the file lands, and `contribute.html`, which already waits for
the whole graph before it draws a field, waits for this beside it.

Every active event in the core also carries **`weight`**: the number of active edges
touching it, in and out, plus the number of actors it names. It is derived,
never written on a record, and it is **not an editorial judgement** — it is
how much of the graph the record already holds. The map uses it to pick
which event represents a cluster of overlapping marks and which clusters
earn a label at high zoom. An editorial override is reserved as
`prominence` in the extension-points table; until that exists, nobody can
make a mark bigger except by giving it more edges and more actors.

**`scope` is not that override.** It is a written field, decided by the owner
on 5 September (plan decision 4), and it says how wide an event's reach was —
a world war, a pandemic — rather than how much it matters. It buys no size:
a `regional` or `worldwide` event is drawn as a band under the timeline's
bars and a wash over the polygons of its lane, the ground the smaller events
stand on, and its mark stays the mark its `weight` earned. The form says as
much where it asks for it, and `prominence` stays reserved and unbuilt.

**`subtreeWeight`** is the same number for the whole of an event: its own
`weight` plus every descendant's through `parent`, transitively. It is what
the graph draws a collapsed parent at when the children are folded into it
(M30b), and it is derived in the same mechanical way. `weight` itself is
untouched — a reader zoomed in on a battle should see the battle's own size —
and the field is **omitted wherever it equals `weight`**, which is every leaf
and therefore nearly every event. A node inside a `parent` cycle keeps its own
weight and nothing more; such a cycle is rule 24's error and never reaches a
committed index.

#### The core, the attribute shards, the search shard and the citers

These files are the whole of the index a page reads. H3a-1 emitted the spine
beside the old `topology-<hash>.json`, which carried the same graph unpicked;
the pages moved onto the spine one at a time in H3b and **H3c stopped writing
the topology out**. I3 split the spine into a core and attribute shards beside
it and I4 moved the pages over, one per commit; **I4b stopped writing the spine
out**, which is the same sequence a second time.

Both are still built — the topology in memory by `buildTopology` on every index
run, the whole-corpus projection by `buildSpine` over it — because the core and
the shards are a projection of the first and a partition of the second, the
validator's rules are checked against the first, and the prerendered pages are
rendered out of the second so that their byte-identity is a check on the whole
of it. No file holds either.

| File | Read by | Carries |
|---|---|---|
| `core-<hash>.json` | every page but `sources.html`, whole | the graph and what a mark, a bar and a lane need: every record as a **positional row** over the file's own `ids` table, with the closed vocabularies as integers and the columns named in the file. `kind` is the list the row is in; `aliases` and `supersededBy` are the `merges` list |
| `attributes-<key>-<hash>.json` | the window, an open card's centuries, and the whole corpus on the two writer pages | what a card, a label or a strip reads — the titles, the names, the roles, the counts, the record's own numbering of a date — a century a file, and never waited for |
| `search-<hash>.json` | the search box, contribute, review | per active record: `id`, `kind`, `label`, `detail`, `terms` (folded), `variants`, `weight`, `when`, `status`; an event also carries `lead`, the folded first sentence of its summary |
| `explanations-<from>-<to>-<hash>.json` | whatever reads a path — the Why mode (M35), a narrative writer | `{ from, to, explanations: { <edge id>: text } }`, a century a file, filed by the year the link's **cause** begins in |
| `citers-<hash>/<source-id>.json` | the source card, a source lens, `retractionPlan` | the rows that cite that one source |
| `sources-<hash>.json` | `sources.html`, the source card | every bibliographic field and `citationCount`, and no citer rows |
| `presences-<hash>.json` | the territory layer, the actor card, the two writer pages | every presence without its coordinates, with an id table and a vocabulary of its own |

The slots each kind carries, which since I2 is one table — `SPINE_COLUMNS` in
`src/spine.js`, of which `CORE_COLUMNS` and `ATTRIBUTE_COLUMNS` are one
partition — read forwards by `buildSpine`, `buildCore` and
`buildAttributeShards` and backwards by one decoder. **A tenth kind is a row in
that table and nothing else**, which is what the third of the owner's
considerations asks for; until I2 it was nine hand-written object literals in
`validate/core.js` and a hand-written inverse in `data.js`, and a tenth kind
meant writing both again.

| Kind | And |
|---|---|
| event | `title`, `revised`, `when` (verbatim), `place`, `region`, `weight`, `actors` as `[{ actor, role, note? }]`, `citesCount`; and where the record has them, `parent`, `scope`, `category` and `subtreeWeight` |
| edge | `[from, to, type, confidence, status, revised]` — the tuple H3a wrote, still the first six slots and still in that order — and a seventh for an id that is not `from--to--type`, which is `null` on every edge there has ever been |
| actor | `name`, `names`, `revised`, `actorType`, `when`, `citesCount` |
| place | `name`, `names`, `revised`, `where`, `region`, `citesCount` |
| presence | `actor`, `when`, `geometry.key`, `dependencyOf`, `dependencyKind`, `capital`, `confidence` — in the presence index, with an id table and a vocabulary of its own, because it is fetched on its own |
| relation | `from`, `to`, `type`, `when`, `note` |
| office | `of`, `title`, `category`, `revised`, `when` |
| tenure | `person`, `office`, `when`, `startedBy` |
| narrative | `title`, `revised`, `summary`, `authors`, `window`, `steps` (refs only) |

**How a row is read.** An integer in an `id` slot is an index into `ids`; an
integer in a vocabulary slot is an index into the named list in `vocab` — the
statuses, the edge and relation types, the confidences, the actor types, the
scopes, the office categories and the dependency kinds from the code, the lanes,
the event categories and the roles from their own data files, and anything met
in a record and in neither list appended in first-seen order. Everything else is
the value verbatim. **A row stops where its values stop**: a slot that is not
there means "absent", and what absent *means* is the column's to say — `place`
is a key with no value, `parent` is no key at all (index2 review, finding 22).
That is what puts `parent`, `scope`, `category` and `subtreeWeight` back to
costing nothing on the events that carry none. The file names its own columns,
so a reader one generation behind refuses a column by name rather than reading
the slot in that position as something else.

**`aliases` and `supersededBy` are one `merges` list**, not two slots on every
row of nine kinds: they are the hop `resolve()` walks and are on every record
whatever its kind, and 1,703 of the 1,720 on the real data carry `[]` and
`null`. That list is also where an edge that carries either one goes; until I2
such an edge was written as a whole object beside the tuples, and the loader had
to take both shapes.

Four things the projection does **not** do. It never reduces `when` to a pair of
years: fourteen readers want the object, two of them validator rules that run
in the browser, and astronomical years are for arithmetic — `formatYear`
takes historians' years and would print 1 BCE as "0". It carries no
`regionMethod` and no `presenceType`, because nothing draws either. It holds
no prose, not even a first sentence: every card fetches the record for its
summary, and derived prose in the index is a leak. And **there are no period
shards**: measured on this dataset the whole shard payload was 288.6 KB,
less than one shard's own budget, while `eventsByActor`, an actor's capitals
and a selected event are all unwindowed — so the split cost four cards and
bought nothing. The mechanism is reserved here for a per-event field that is
genuinely large, against a measurement.

#### The core and the attribute shards

The whole-corpus projection is **split in two**: `core-<hash>.json`, which every
page loads whole, and `attributes-<key>-<hash>.json`, one per century, fetched
for the window and never waited for (`docs/index2-plan.md`, D4). I3 wrote them
beside the spine and printed the bytes; I4 moved the pages over, one per commit,
and I4b stopped writing the spine — which is H3a's own lesson applied twice,
where a split is measured before it is spent (D5).

The line is drawn once, as two column lists beside `SPINE_COLUMNS` in
`src/spine.js`, and `tests/spine.test.mjs` holds them to being one partition of
it: per kind, the core's columns and the shard's are the spine's between them,
with nothing invented and nothing dropped. Four columns are in **both**, because
they are split inside — the core takes a date's astronomical bounds, the point
of a place and which actor a line names; the shard takes the record's own
numbering (`when` verbatim, with its day, its calendar and its BCE years), the
label and the precision, and the role and the note.

| In the core | In the shard |
|---|---|
| every record's `id` and `status`, and the `merges` list | `revised`, `wikidata`, `wikipedia` |
| an event's year bounds, `place`, `region`, `weight`, `subtreeWeight`, `parent`, and its actors' **ids** | its `title`, `when` verbatim, `citesCount`, `scope`, `category`, and each actor line's `role` and `note` |
| an edge's `from`, `to`, `type`, `confidence`, `status` | its `revised` |
| an actor's type and years; a place's point and lane | their `name`, `names`, `citesCount`; a place's `label` and `precision` |
| the two ids a relation, an office and a tenure join, and their years | their `note`, `title`, `category`, `startedBy`, and `when` verbatim |
| — | a narrative's `summary`, `authors`, `window` and step refs |

**Why the joins are in the core and never in a shard.** `eventsByActor`,
`eventsByPlace`, the `actor:` and `place:` lenses and the actor card's list are
all **unwindowed**: an actor whose events span five centuries is asked about as
one list. A join that arrived by century would answer half the question and
look like a complete answer, which is the same mistake a windowed graph would
make of convergence. So an event's actors' ids, its place and its parent are
core whatever they cost; if a later feature needs an *attribute* unwindowed, it
either moves to the core with a measured cost or it fetches (index2-plan,
section 6 risk 4).

**The writer pages are whole-universe readers** and are the other side of that
rule: rule 21 reads `wikidata` off every row, `findSimilar` reads titles and
aliases, rules 17 and the referrer warnings read the presences, and every rule
comparing another record's interval reads `when` verbatim — none of which is in
the core. So `contribute.html` and `review.html` hold **every** attribute shard,
exempt from the cap, and say so while they are loading rather than reporting on
half a corpus (I4b; index2 review, finding 2).

**A record is filed by `attributePeriod(kind, record, events)`** in
`src/explanations.js`, beside `periodOfEdge`, which the explanation shards
already use: an event by the year it begins in, an edge by the year its *cause*
begins in, an actor, a relation, a tenure or an office by the year its interval
begins in, a narrative by its window. Two answers are not a century — a **place**
has no year and every event points at one, so the places are a single shard, and
a record whose key is null is in the `null` shard, which is fetched with the
first century. One table, used by these shards and by I5's histories, so two
sharding schemes cannot come to disagree.

**What a record reads as before its shard lands**: the core, plus a title that
is the id, `citesCount` 0, `names` empty, and a `when` built from the core's own
bounds. **The three views may draw that and a card may not** — a mark, a bar and
a node appear untitled for one frame at the whole extent, which is the
discipline the territories, the citers and the explanations already follow,
while a card, an entry page and a search row show the "loading" line the source
card shows for its citers. `atlas.attributesLoaded(id)` is what decides, and it
is `true` on every atlas built from the spine (index2 review, finding 21).

**The loader**: `loadCore()` caches the core under its hash and reads the
manifest `no-store` every time; `loadAttributes(shard)` holds one request in
flight and drops a rejection;
`attributesFor(year)` and `attributeShardsIn(window)` say which shards a picture
needs; and an LRU holds **four unpinned shards**, so a session that has scrubbed
across six centuries does not hold six centuries. A shard an open card, an entry
page or a lens needs is **pinned** and never evicted — those readers are
per-entity and not windowed (finding 9). When a shard lands or is dropped, the
joins over the records are built again in place: three of them are sorted or
keyed by something a shard carries. And `record()` waits for the record's own
shard before it fetches the file, because `revised` — what `?v=` is made of — is
in the shard, and a card that fetched without it could draw a stale copy for the
rest of the session (finding 3).

Two counts with two names, because they mean opposite things:
**`citesCount`**, on an active event, actor or place, is how many citations
that record *makes* — the number three cards print beside it. The browser
used to count it out of the citer rows the sources index carried; those rows
left that index in H3b, so it is written at build time instead and the card
reads it off the record. **`citationCount`**, on a source, is how many
records cite it. A tombstone
carries neither: `TOMBSTONE_KEYS` is a **slot mask** and is applied by the
encoder and the decoder alike, so a retired relation carries no `note` where an
active one carries `note: null` — a difference a per-slot rule alone could not
say. It keeps `title`, `when`, `place`, `region`, `wikidata`,
`status`, `supersededBy`, `aliases`, `revised` and its kind's own label, which
is what a retracted card's head and meta line are built from, plus what its
own file is asked for with — 175 retracted events reach a card — and nothing
else.

The citers are one hashed **directory**, not a hashed file each: `manifest.json`
is fetched `no-store` on every page load, and a line per source would be
200 KB of it at twenty thousand sources, while unhashed names would break the
`immutable` convention. The hash is over the concatenation of every citer
file's bytes in id order and the directory is named once, as `files.citers`.
A source nothing cites gets no file; its `citationCount` says so. `readIndex`
walks `data/index/` one level deep and `writeIndex` removes any file or
directory a fresh build does not name, so rule 16 covers the directory too.

`history/` is the one directory that is **not** hashed and the one thing rule
16 compares by name rather than by bytes (H6b). Not hashed, because the
dashboard fetches a history by the record's id and a hashed name would mean
reading the manifest for each one. Not compared by bytes, because a history
is derived from the repository's commits and not from `data/` alone, and the
two builds rule 16 puts side by side do not always have the same commits to
read: the deploy checks out one commit deep, and a build made before a change
is committed cannot see the commit about to carry it. What keeps the file
stable across that commit is that a version is identified by the record's own
content — its `revised` and the fields that changed — and never by the commit
that carried it. The names still have to match, so a record added or retired
without a rebuild is caught.

**The loader reads it.** `loadCore()` fetches the manifest `no-store` and the
core once — it is named by its own hash and served `immutable`, so a second call
costs a manifest and no more, and a rejection is dropped rather than kept as the
answer, exactly as `loadGeometry` does with a territory shard.
`createAtlasFromCore()` expands it into the atlas `createAtlas()` assembles: the
edge tuple becomes an object again with its id synthesised as `from--to--type`,
and `graph.js`, `horizon.js`, `lens.js` and the views cannot tell what it was
read out of. That is what made H3b and I4 switches rather than rewrites. What
the projection is measured against is `buildTopology`'s own output, built in
memory from the records (`tests/spine-loader.test.mjs`), and what the two halves
are measured against is the projection itself
(`tests/core-loader.test.mjs`): the core plus every shard has the same ids in
the same order and every record deep-equal, over both datasets.

`loadAtlas()` does the fetching — the manifest `no-store`, the core, the sources
index, the coastlines, the palette, the region boxes — and since I4b there is no
second graph file for it to be pointed at. `expandCore()` is the same thing for
a caller that wants the lists rather than an atlas: the dashboard and the
narratives page, where `atlas.relations` and `atlas.tenures` would be the
*active* ones and a reviewer's universe is not that.
`tests/spine-pages.test.mjs` asserts against a real browser's own record of its
requests how many times each page asks for the core: once for every page that
needs the graph, and **none** for `sources.html`, which would otherwise fetch a
graph to list books, nor for `narratives.html`, whose cards the build wrote into
the file.

One thing an atlas from the core cannot answer, because no graph file carries
it: which records cite a given source. `retractionPlan` takes them
pre-fetched instead — `citers`, the one citer file the dashboard already
holds for the source in hand — and reads `kind` and `id` off the rows and
nothing else.

#### The window is what the views draw — a change from revision 7

Revision 7 made time a window and said the map "draws the events whose
interval **overlaps** the window"; the timeline drew every event there was
and greyed what fell outside the band. Since **H3b** all three views draw
the window **plus one period at each end** — `MARGIN_YEARS` in
`util/window.js`, fifty years, which is what a period would have been over
the era this dataset occupies — and past that margin:

- the **timeline** draws a **stub**: a two-pixel faded tick on the floor of
  the event's lane, with no title, no focus and no click. The dataset
  visibly carries on past the band; it is simply not what the reader is
  looking at. Stubs are not packed, not stacked and not labelled, which is
  the whole of the saving. Since **H4c** they are also not one element
  each: a row's ticks are one `<path>` (`density.js`), and several events
  landing on one two-pixel column are drawn as one column, as tall as their
  number asks up to nine pixels — an absolute scale, so two rows of the
  strip can be read against each other. A single far event still draws the
  tick it drew before, to the pixel.
- the **map** and the **graph** draw **nothing**. A mark and a node are
  places to aim at, and there is no honest two-pixel version of either.

What the reader is holding is exempt at every distance, on all three, as it
already was of the window and of the map's box: the walked chain, the
selection, the open actor's events, an open narrative's whole walk and the
horizon's reachable set (`emphasis.js`). A step of a walk that had become a
tick would be a step the reader could not follow.

This is a visible change and it is deliberate (health review, finding 28):
rendering only the band was rejected, and a stub or a density strip was the
condition for windowing at all.

Since **H4b** the graph's **layout** is windowed too, against the
measurement H3b left it waiting for: laying out the whole corpus to draw a
decade of it cost 6.6 s at 5,000 edges and nearly seven minutes at 30,000.
The arrangement is now the band, the margin, and whatever the reader is
holding beyond it — the exemption above, which is why a walked chain that
runs off the end of the band still has coordinates. Moving the band
therefore moves the nodes, which is what H3b did not want; what pays for it
is that the arrangements are kept by their key, so widening the band and
narrowing it again gives the reader back the picture they had. Panning,
zooming, selecting and walking still move nothing.

#### Each view has a render key

Since H3b the map, the timeline and the graph each hold the key of what they
last drew and skip a render whose key is unchanged — the idea `panel.js` has
had since H1b, in `render-key.js` so that the three cannot disagree about
what a state change means. **The key is the whole state**, not the fields a
view is known to read, plus what the view holds outside the state: the map's
transform, spread and count of territory shards arrived; the timeline's
measured pane; the graph's transform and rectangle on screen. The asymmetry
is the reason — a key that misses an input leaves a stale picture on screen,
a key that includes a field the view ignores costs a redraw that changes
nothing. The store still notifies **synchronously** (health review,
finding 23): the key is what stops the redundant work, not a frame's delay.

The graph keeps its second, narrower key as well: `arrangementKey` says
whether the nodes have to be laid out again, this one whether the picture
has to be drawn.

### Narrative ●

`kind: narrative`. Title, summary, authors, own sources, and `steps`: an
ordered array of `{ ref, text }` where `ref` is an event id or an edge id and
`text` is the narrator's paragraph on why that step follows. An optional
`window` says which years to open on. The competing signed narratives from
`CONTEXT.md`: one person's account of records that are already here, changing
none of them, and where two disagree both stand.

The index carries the titles, the summary, the authors and the refs, and
none of the prose — the list of narratives is one fetch and a step's words come
with the record when that step is read. The other direction, which narratives
pass through a record, is built in `data.js`: an event is walked when a step
names it *and* when a step names an edge that touches it, so an event card says
what it is part of however the walk happens to reach it.

The order of the steps is the walk, so a step in the wrong place is a
different argument, and both places a narrative is edited — the contribution
form and the review dashboard — let a row move up and down: two controls on
the row, and Alt with an arrow from anywhere inside it, so a paragraph being
typed can be moved without leaving the field. `contribute/reorder.js` moves
the row itself rather than redrawing the list, and `moveItem` in
`contribute/bundle.js` is the arithmetic, pure. Citations and an event's
actors are sets rather than walks and have no such controls.

### Reserved ○

- **Translation** — `data/i18n/<lang>/<id>.json` overlays text fields only
  and carries `baseRevised`; the validator warns when it differs from the
  base record's `revised`; the panel falls back to English for stale fields.
- **Paleo-coastlines** — `data/geo/land-<epoch>.json`, listed in the
  manifest by year range; `layers/land.js` switches by year.
- **Deep-time scale** — `timeline-scale.js` swapped for a bucketed scale;
  the timeline itself unchanged.

## Site modules

Vanilla ES modules, no framework, no build. Each module has one job;
`main.js` only wires them. State is one object, `{ from, to, view, focus,
group, lanes, selected, source, place, actor, chain, horizon, layers, bbox }`,
mirrored to the URL so every
view is a shareable link. `bbox` is the part of the world the map is looking
at, and it is state because the timeline draws only what is inside it; null is
the world. `focus` is the lens and `group`/`lanes` are what
the lanes are: how the atlas is drawn rather than what is selected in it, and
in the link for the reason `view` is. `horizon` is the exception that proves the rule: it
is written only when a reader chose a year, because its default — the
window's far end — would lengthen every shared link and answer a question
nobody asked. `layers` is `land`, `territories`, `events`, and a category of
events as `events:<id>` beside them; a layer switched off costs no fetch.
`land` is the one that is no longer a switch: the coastlines are the ground
everything else is read against and are always drawn (plan decision 14), and
the name is kept in the list only so that a link somebody shared before the
checkbox went still parses into the same three. The token `events` means every
category, so turning one off writes one `events:<id>` per category still on,
and what the reader did is in the link either way. The state file
deliberately knows none of the categories: a token is checked for shape, and
which ids exist is `data/categories.json`'s business. `view` is `map` or `graph`: the two share the same slot in the
layout, and the graph view is built the first time it is asked for.

The state divides once more, for the browser's Back: a change of **what is
open** — `selected`, `source`, `place`, `actor`, `narrative`, `step` —
pushes a history entry, and a change of the **view** only replaces the one
there is. Two things are deliberately not state at all and live in
`localStorage` instead, per reader and per browser: the pane sizes, and which
section of a card is open. Neither says anything about what the atlas is
showing, and a link is what somebody is looking at rather than how they have
arranged their window.

**Under 720 pixels the atlas stacks and nothing about the link changes.** The
view takes the screen, the timeline is a fixed strip under it, and the panel
becomes a sheet over both: up when a record is opened, down to a grip when it
is in the way, dragged or tapped between the two. The search takes a line of
its own; the grouping picker and the layer switches fold behind one Options
button, without moving in the DOM. Whether the sheet is up, and whether the
options are unfolded, are not state either — a phone and a desktop opening the
same URL see the same records — and the pane sizes of M24 are ignored at this
width because the media query that arranges it never mentions them. The one
number is `PHONE_WIDTH` in `src/phone.js`, and the layout it switches on is
one media query in `src/style.css`. Controls a thumb has to land on are at
least 40 pixels; a link inside a sentence keeps the line it is set in.

| Module | Job | Must not know |
|---|---|---|
| `state.js` | Owns the state object; parses and writes the URL — pushing a history entry when *what is open* changed and replacing it when only the view moved; keeps the trail of those openings, because the browser will not say what Back returns to; notifies views. | Anything about SVG or data files, and what a record is called. |
| `lanes.js` | What a lane is, in all four groupings: which lanes the window offers, which six of them are drawn, which single lane each event belongs in and why, and — with no grouping — the packing of the bars into rows that do not overlap. Pure. | The DOM, the state, and which of the two pictures is asking. |
| `lens.js` | The set of events a focus keeps — an actor's, a place's, a source's — and what the header calls it. Pure. | The DOM, and that a narrative suspends it, which is one line of state it is given. |
| `grouping.js` | The picker beside Map \| Graph: the grouping as a select, the lanes as checkboxes with up/down and a filter box, keyboard first; and the badge that says which lens is on. Writes `group`, `lanes` and `focus` and nothing else. | What a lane is, and how anything is drawn. |
| `data.js` | Reads the manifest, loads the core whole through `loadAtlas` or `loadCore`, expands it into the atlas with `createAtlasFromCore` (or into the lists with `expandCore`), fills each attribute shard into the records in place as it lands and holds four unpinned ones, fetches record text on demand, resolves aliases and `supersededBy` for every kind, builds adjacency — of events through edges and of actors through relations, each relation listed from both ends — the events of each actor, and each actor's presences and dependencies; loads and caches one geometry shard per year. | How things are drawn. |
| `graph.js` | Consequences, ancestors, convergence, the tree of shortest paths outward and what an event led to by a year. Pure functions over adjacency; results ordered by type, then confidence, or by path length then year. | The DOM. |
| `horizon.js` | Puts the traversal and the horizon year together: the list the panel draws and the `Map<id, depth>` the map, the graph view and the timeline fade by. Empty unless a year was chosen. | The DOM, and which view is asking. |
| `citation.js` | One source → the citation as a line, its identifiers as link targets, the order a bibliography sorts in, the grouping of its citers. Escapes nothing: the caller does. | Where it will be drawn. |
| `wikipedia.js` | Which article a record's identity offers and the URL it becomes: the reader's language, then English, then the first there is, with the language checked before it becomes a hostname; and the titles as further search names. Pure, escapes nothing. | That the atlas has its own text, and where the link will be drawn. |
| `review/citations.js` | The per-citation verification flags: the rows the dashboard draws, what is still unchecked, the count across a dataset, and a tick set or taken back without mutating anything. Pure. | The DOM, and whether anybody is going to sign. |
| `map/projection.js` | lon/lat → SVG coordinates and back, and the pan/zoom transform ⇄ the box of world it shows. | Everything else. |
| `cluster.js` | Groups points that overlap at the current zoom, picks each group's representative by `weight`, says which groups no zoom could part and where a group comes apart, keeps the ids it is told to hold out (`alone`) in groups of one, and merges the links between two groups into one counted link (`mergeEdges`). Pure, and used in two dimensions by the map and the graph and in one by the timeline. | The DOM, the projection, what a point means, why an id is held out. |
| `util/window.js` | Resolves a null bound against the data's extent, says what overlaps the window, owns the margin the views draw beyond it, the "map at Y" rule and the wheel's narrowing of the band around a year. Pure. | The DOM, and which view is asking. |
| `render-key.js` | Whether a view has to be drawn again: the whole state flattened in a fixed order, plus whatever the view holds outside it. Pure — the three views compare it, `panel.js` keeps its own narrower one. | What a view draws, and why any field is in the state. |
| `util/viewport.js` | What "in view" means: whether an event's place is inside a box, and which events the lanes draw while the map holds one — plus what the reader is holding, which no box removes. Pure. | The DOM, the projection, and how the box was arrived at. |
| `share.js` | The two ways out of what is on screen: the correction issue about one record, and the view as a standalone SVG with the stylesheet and the computed tokens inlined. Pure but for one function that hands the browser a file. | What is on the card, and which view is asking beyond its name. |
| `phone.js` | The atlas under 720 pixels: what raises the sheet over the view, what a drag of its grip ends as, and the three classes that put the layout in the stylesheet's hands. Nothing it decides is state. | How anything is arranged — that is one media query — and what is on the card. |
| `panes.js` | How wide the panes are: what a size may be, the two custom properties that are the grid's whole side of it, and the drag, the arrow keys and the double-click that set them. Remembered in `localStorage`, never in the URL. | What is drawn in any pane. |
| `search.js` + `search-box.js` | Folds and ranks event titles and every one of an actor's names — prefix, then word start, then substring — and draws the result as a combobox. | Anything about the map or the timeline; choosing is a state change. |
| `map/layers/*` | One layer per thing drawn, in a fixed order: coastlines, then territories, then marks, so an event sits on top of the state it happened in. Renders only records in the visible window. A stack of marks is drawn as one, with a count, and opened by a click. | Each other. |
| `map/layers/presences.js` | The territories of the window's far end: a thin line for a state, a lighter one over a stronger wash for a dependency, dashed when disputed. Hover names it and its sovereign; click selects the actor. No colour per polity — two hundred of them share one palette. | Which shard the year is in, or how one is fetched. |
| `graph-view/layout.js` | Events, edges, the lanes and the data's extent → the coordinates of every node and every edge, plus the bands. x is the year on the whole extent; y is a barycentre pass inside the band of the lane, or over the whole field when there are no lanes. Deterministic — ties by id then weight, neighbour lists sorted — and self-checking: it counts crossings and keeps the best arrangement it saw, the plain order included. `stackLayout` is the second half: those coordinates and a zoom in, the marks and lines actually drawn out, merged within a band and never across one. | The DOM, the state, what is selected, what is in the window, why an id may not be stacked. |
| `graph-view/graph-view.js` | Draws what the layout gives it: the bands and the year axis once, then the marks, the five edge types by pattern and weight, the window as a shade, the walked chain in madder and the convergence branches filled in. Decides the one thing the layout cannot — which events the reader is working with, and so may never be stacked. Pan and zoom; a click is resolved to the nearest mark centre within reach; clicking a consequence of the open event walks the chain, clicking a stack opens it. | Where a node goes, what merges with what, and how the panel renders anything. |
| `timeline.js` + `timeline-scale.js` | Lanes from `lanes.js`, or its packed rows when there is no grouping; the scale is injected; the window drawn over them as a band with two handles, which is the atlas's only time control. Bars that would overlap stack, and only within the window, so narrowing the band splits them without moving the scale. | Which regions exist. |
| `graph-view/collapse.js` | The graph's second level of detail, and pure: below one zoom an event's parts are drawn inside it, the ends of their links moved onto the parent and a link between two parts dropped. It runs on the laid-out layout, after `layoutGraph` and before the geometric stacking, so a collapsed parent is drawn exactly where the parent already was and a wheel notch still lays nothing out again. Nothing the reader is holding is ever folded. | Where a node goes, and what the panel does with a click. |
| `panel/office.js` | The office card — the actor the post belongs to, its category, and every turn at it in start order, each row opening the person who held it — and the tenure strip the actor card draws from the same list: holders as bars over the actor's own years, merged where they would overlap, a bar opening the holder. An office cites nothing, and the card says why. | Who held what: it is given the tenures. |
| `panel/` | The shell plus one file per card. Every card is a head, a summary and collapsible sections with counts: consequences, causes, the other branches, the horizon inside the consequences, supporting and dissenting citations shown apart with their verification marks, confidence and status shown as such; an event's actors as chips in the head, the walked path as a breadcrumb above it, a source's card with everything that cites it, an actor's card with its relations grouped by type and direction and one tenure strip per office it owns, an office's card with every turn at it in order, a place's card, and the members of a cluster. | Traversal logic. |
| `panel/sections.js` | What a collapsible section is, for every card: the header with its count and its dispute mark, which one a card opens on given the arrival and the reader's remembered choice, and the toggle that closes the others. The choice is `localStorage`, never the URL. Pure but for the toggle. | What is inside a section, and which card is asking. |
| `sources/` | `sources.html`: the manifest and the sources index, and the bibliography as markup. Nothing else — the graph is far larger and lists no books. | The graph, the map, the panel. |
| `narratives/` | `narratives.html`: a card per account — title, narrator, the years it is about, how many steps, its own summary — grouped by the centuries it crosses, so two accounts of the same years sit side by side. A period is the years of the records walked and not the `window` beside them; a title opens the account at its first step. It needs the core, because those years live there, and the shards its walks cross, because the titles do. | The map, the panel, and how a narrative is read once it is opened. |
| `validate/core.js` | `validate(records, topology)`: schema subset + cross-record rules, pure. Needs the topology to check references, so the form loads it too. | `fs`. |
| `contribute/*` | Form → bundle → validation → clipboard + issue. | GitHub, beyond one URL in `submit.js`. |
| `contribute/reorder.js` | Moving one row of an ordered list, in the form and in the review editor alike: the two controls, Alt with an arrow from anywhere in the row, and the ends that have nowhere to go. Moves the row rather than redrawing the list, so nothing half typed is lost. | Which list it is, and what a step means. |

## Contribution pipeline

Strangers add nodes and edges without touching code, on a site with no
server. The repo is the queue, GitHub does the plumbing, a person judges.

1. **`contribute.html`** — the form searches existing titles and aliases
   before allowing a new event; builds a bundle; validates it in the browser
   against the loaded graph; shows errors inline. No sources, no submit
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
6. **`deploy.yml`**, one job on push to `main`: `build-index`, commit
   `data/index/`, the palette and the prerendered pages if they changed with
   the default token, stage the artifact, deploy.
   `concurrency: { group: deploy, cancel-in-progress: false }`. PRs never
   touch `data/index/`; freshness is asserted on `main`, not on PRs — two
   open PRs would otherwise conflict on the index every time. Branch
   protection lets the Actions bot push to `main`.

### The artifact ● — what is actually published

Since **H8** the artifact is a staged `_site` built from an **allowlist**,
not the checkout (health review A, finding 35; B, finding 29). What is in it,
and nothing else:

| In the artifact | Why |
| --- | --- |
| `*.html` at the root — `index`, `entry`, `sources`, `narratives`, `about`, `contribute`, `review` | the site's pages. `review.html` is one of them and carries a banner off localhost saying it cannot write, rather than being hidden |
| `entry/<id>.html` | the prerendered entries, when any record carries a `body` |
| `src/` | the modules and the stylesheet; there is no bundle to ship instead |
| `schema/` | the browser validates a contribution against them |
| `data/` **minus `data/imports/`** | the records, the geometry and `data/index/`. The import maps and the 200 KB of seeds are how the tools are pointed at a source, not something a reader loads |
| `tests/fixtures/data/` | `?fixtures=1` is a page of the site: the interface shown against a graph that asserts nothing historical (review of the health plan, finding 24) |
| `CONTRIBUTING.md` | an entry page for a record with no `body` links to it |

What is deliberately out: `tools/` — the maintainer's tools and, with them,
`tools/import/cache/`, which is somebody else's text and would be
republishing Wikipedia; `tests/` beyond the fixture data; `docs/`, including
this file and `STATUS.md`; `.github/`; the git history. **A list of what may
be published cannot be widened by adding a directory to the repository**, and
an exclusion list can; that is the whole reason it is written this way round.
`tests/workflows.test.mjs` holds the list to its shape.

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
   `dispute.sources[].source`, `supersededBy`, `region`, a narrative step's
   `ref`, and every key of `review.citations`, which names a source the record
   itself cites. **Through `aliases`**: a reference by a record's former id
   resolves to the record that stands for it now, so that renaming a record
   does not break every narrative that walks it and every citation check
   keyed by its old id.
4. Arrow of time on the lenient bound: `from.start.min ≤ to.start.max`
   (astronomical).
5. The edge graph is a DAG; same-year ties broken by `date` where present.
6. Every node and every edge has at least one source; `source`, `region`,
   `place` and `office` records are exempt — a bibliography entry, a lane, a
   geographic fact and the existence of a post are facts rather than
   arguments. A tenure is an argument and cites.
7. Every edge has a non-trivial `explanation`.
8. `disputed` ⇒ `dispute.text` and `dispute.sources` present and non-trivial.
9. `consensus` ⇒ at least two sources by different authors.
10. A point, wherever one appears, inside WGS84; `region` values exist in
    `regions.json`. An event has no point of its own: it names a place and the
    place holds it. A lane is **not** required on a placeless event since
    M30a-3: that is the warning `no-lane`.
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
16. On `main`, and on a pull request that changes anything under `data/`:
    `data/index/` is byte-identical to what `build-index.mjs` produces. Not
    on a pull request that changes no record, so that two of them can be open
    without conflicting on the index.
17. A presence holds together: a `dependencyOf` implies a `dependencyKind`
    (the reverse does not — see the Presence section); a presence is not a
    dependency of its own actor; `geometry.files` is non-empty; and one
    actor never holds the *same* outline over overlapping years. The half
    that needs the disk — every file named exists, holds the key, and the
    files between them cover every year the presence claims — is in
    `tools/validate.mjs` beside rule 16.
18. A place has at least one name, with no repeats. Its point is required by
    the schema and checked by rule 10; its lane is derived from that point, so
    it needs no `region` of its own.
19. A relation holds together: two different actors, of the kinds its type
    allows (the table in the Relation section), a succession between two
    actors of the same kind, and no cycle in `regime-of` or in `succeeded`,
    each type on its own.
20. A narrative is a walk: at least two steps, a non-trivial summary and
    non-trivial text at every step, no record named twice running, and a
    `window` whose years are years and which opens before it closes. Whether
    a `ref` resolves to an event or an edge is rule 3; whether an active
    narrative walks only active records is rule 11.
21. A record's identity holds together: `wikidata` is claimed by at most one
    record of a kind (two kinds may claim one item); `wikipedia` stands only
    beside a `wikidata`, and its keys are language codes; and only `event`,
    `actor`, `place` and `office` carry any of the three at all.
22. An edge is not `consensus` when **every** supporting citation is a
    Wikipedia record (`WIKIPEDIA_SOURCES` in `rules.js`). An encyclopedia
    reports the scholarship rather than being it. Separate from rule 9 on
    purpose: 9 asks whether two authors are independent, 22 asks what kind of
    thing was cited.
24. An event's `parent` resolves to an event, an active event's parent is
    active, and no chain of parents closes on itself. A child dated outside
    its parent is a warning and not an error, for the reason
    `actor-outside-when` is one. Rules 4 and 5 never see a parent: it is not
    part of the edge graph.
25. An **active** event's every `actors[].role` is an id of
    `data/roles.json`. One error a record and not one a line, naming the
    roles; the phrase the role used to be goes in the `note` beside it. Only
    active events: a tombstone is a record of what the atlas used to say, and
    refusing to validate one would mean editing history. A dataset with **no**
    `data/roles.json` is checked against nothing, which is the property this
    rule is likeliest to lose (M32b-1, from the warning `role-unknown`).

`data/imports/` is not records and has no rule number. `tools/validate.mjs`
picks the schema from the file's `kind` — `import-map`, `import-seeds` or
`import-state`, and a file that names none is a map — and then checks what a
shape cannot say. For a map: the keys are entity codes of the source, a
split's dates are real and strictly increasing, a split's actor is neither
the entry's own nor another split's, and a name is not listed twice. For a
seeds file: no item and no query name is listed twice, a class key is an
item of the source, an actor class says which `actorType` its items
become, and a class's `category` belongs to an event class and names a
category of `data/categories.json` — the keyword subset has no `uniqueItems`
and no conditional, so
these are the checks a shape cannot make rather than ones it declined to.
A seeds file with nothing in it warns and never fails: waiting for somebody
to decide what the atlas should draw from is its ordinary state. Whether a
code or an item exists in the source at all is checked when the import runs,
which is the only place that can know, and whether a split date is a
boundary the source draws is checked there too. The cached leads under
`tools/import/cache/wikipedia/` are checked the same way, against
`schema/v1/wikipedia-lead.json`, with the file name held to the item and
language inside it.

An office and a tenure are reached by rules 2, 3, 11, 12 and 15 as well, and
by 6 in opposite directions: an office is exempt and a tenure cites. Both
carry ordinary slug ids; an active tenure may name neither a retracted office
nor a retracted event in `startedBy`, and a retracted actor named by an
active office's `of` or an active tenure's `person` is reported from the
actor's end; both are CC BY-SA; and their intervals are years, except that an
office may carry none at all. Only rule 26 is theirs alone.

A relation is reached by rules 2, 3, 6, 11, 12 and 15 as well: its id is
derived from its fields like an edge's, both ends resolve to actor records, it
cites at least one source, an active one may not name a tombstone (nor a
tombstone be named by one), it is CC BY-SA, and its years are years.

Rules 3, 6, 10, 11 and 12 reach the newer kinds. An event's `place` resolves
to a place record, an active event may not stand at a merged or retracted
place, and a place is CC BY-SA like everything else a person writes. An actor and a presence
cite at least one source. An actor's `where` and a presence's `capital`, if
present, are within WGS84, and neither needs a `region`, having no lane. A
merged or retracted actor may not be referenced by an active event **or an
active presence**, and an active presence may not name one. A presence's
`actor` and `dependencyOf` resolve to actor records. And rule 12's licence
check is per directory with exactly one hole in it: `NC_ORIGINS`, which is
`origin.tool` and not a name in `authors`.

Warnings: arrow of time fails the strict bound (`from.start.max ≤
to.start.min`); an event with degree zero; a source with no citers; an actor
that no event references, **that stands in no relation** and that holds no
territory; a place no active event references; a relation dated entirely
outside either of its actors' dates; an event dated
entirely outside an actor's dates, and a presence likewise — warnings and
not errors, because posthumous events are real, institutions act through
their successors, and the dates of an actor and of an imported outline come
from two sources of which either may be the wrong one.

Warnings are **named and not numbered**: a rule number is a promise that a
record is wrong, and these say something weaker. Four of them are M30a's; the
fifth, `role-unknown`, became rule 25 in M32b-1.
`started-outside-when`: a tenure begun by an event that falls outside the
years it ran. `child-outside-parent`: an event not dated inside the event it
is part of. `category-unknown`: a category outside
`data/categories.json` — a warning and not an error because most of the corpus
carries no category at all and M32b-2 is the run that assigns them. Its pair
`role-unknown` was the fifth until M32b-1 applied the roles mapping and made
it rule 25. `no-lane`: an active event with neither a place nor a region,
drawn in no lane. Both vocabularies live in data, and an **absent** file means
no check at all rather than an empty closed set: a fork with no
`data/roles.json` is not a fork whose every record is refused.

## Extension points

| Later feature | What it touches | What is reserved now |
|---|---|---|
| Whole world | `regions.json`, one polygon per new lane, more records | `region` derived from geometry, never stored on records |
| Ancient / deep time | `timeline-scale.js`, `land-<epoch>` files, manifest | Interval with four bounds and `end: null`; single `toAstronomical()`; manifest lists land by epoch |
| Territories ● | built in M5: `data/presences/`, `data/geo/presences/`, `schema/v1/presence.json`, rule 17, the spine's `presences`, `layers/presences.js`, `tools/import/` | `presenceType` still has three unused values for diffuse eras; `within: <presence-id>` additive on `where` is untouched |
| Another geometry import | one file under `tools/import/`, one paragraph in `data/geo/LICENSE`, one row in `src/licensing.js`, one line in `ORIGIN_TOOLS` and one in `NC_ORIGINS` | the licence enum and the per-directory rule; shards named `<from>-<to>.json` and listed in the manifest |
| A window of time ● | built in M6: `{ from, to }` in `state.js`, `util/window.js`, the band in `timeline.js` | either bound may be null and the views resolve it, so a deeper scale changes `timeline-scale.js` and nothing else |
| Places ● | built in M9: `data/places/`, `schema/v1/place.json`, rule 18, the spine's `places`, `place` on an event, the card and `?place=` | a place has a `summary` nobody has to write and an `aliases` list, so a place that turns out to be two can be split without breaking a URL; `tools/migrate-places.mjs` is kept as the record of how the coordinates moved |
| Actors ● | built in M4: `data/actors/`, `schema/v1/actor.json`, rule 14, the spine's `actors`, the card and the highlight | roles still free text; the manifest's `roles` is the evidence for closing the vocabulary |
| Relations between actors ● | built in M11: `data/relations/`, `schema/v1/relation.json`, rule 19, the spine's `relations`, the actor card's groups, the form and the tools | the six types are closed and a missing one is reported rather than added; a relation has no card and no URL of its own, so giving it one later is a card file and a state field and nothing else |
| Narratives ● | built in M12: `data/narratives/`, `schema/v1/narrative.json`, rule 20, the spine's `narratives`, `narrative.js` and `narrative-mode.js`, the reading card, the form and the tools | steps reference ids that never change and tombstones keep old ids resolving; reading is a mode, so a second mode later is a wrapper beside this one rather than a fourth dimension of the state |
| Other languages | `data/i18n/`, `src/i18n/` | overlay design with `baseRevised` |
| Search ● | built in M6: `search.js`, `search-box.js`, a box in the header; the shard `search-<hash>.json` in H3a-1 | the shard was reserved through M6 on the grounds that the graph file already carried every title and a few hundred of them is a scan. It is emitted since H3a-1 — folded once at build time rather than on every page load — and fetched beside the core, never waited for |
| Another import's mapping | one file under `data/imports/`, validated by the same `v1/import-map.json` | keyed by the source's own entity code; splits by date; the schema is tool-side and the browser never fetches it |
| Contributors without GitHub | `submit.js` target only | bundle format is the wire format |
| Tens of thousands of records | render only the visible window; the core stays whole | hashed, immutable index files; manifest uncached |
| Source pages and the bibliography ● | built in M10: `citations` and `citationCount` in the sources index, `?source=`, `sources.html` | the citers are the index's, so a narrative kind joins the grouping by appearing in `CITER_ORDER` and nothing else changes |
| The horizon ● | built in M10: `shortestPaths`/`pathTo`/`reachableBy` in `graph.js`, `horizon.js`, `?horizon=` | the year is a bound on `start.min`, so a bucketed deep-time scale changes nothing here; the reachable set is a `Map<id, depth>` and a view that wants five bands instead of three changes one function |
| The lens and the grouping ● | built in M14: `src/lanes.js`, `src/lens.js`, `src/grouping.js`, `focus`/`group`/`lanes` in the state, the bands of `graph-view/layout.js` | a fifth grouping is one case in `lanesFor` and one option in the picker; the cap and the "Other" lane are one constant each; `region` returning as the default is one value in `defaultState()` |
| Identity and the link out ● | built in M15: `wikidata`/`wikipedia`/`sitelinks` on three kinds, rules 21 and 22, `src/wikipedia.js`, the link on three cards, the titles in the search, the three Wikimedia source records | the fields are additive and import-written, so a second catalogue is three more optional keys and one more `identityOf`; `sitelinks` is stored and read by nothing, waiting for the decision it is evidence for, and carries the day it was read so that the decision is taken against a dated number |
| Checking a citation ● | built in M15: `review.citations`, the dashboard's boxes, the queue's count, the validator's line | keyed by the source id rather than by position, so editing the citation list does not move anybody's ticks; a flag and not a gate, so making it one later is one line in Sign |
| Level of detail in the graph ● | built in M25: `alone` and `mergeEdges` in `src/cluster.js`, `stackLayout` in `src/graph-view/layout.js`, stacks and merged lines in `graph-view.js`, a `graph` case in `panel/cluster.js` | the threshold and the zoom limit are one constant each and live together, so a denser atlas is one number; the never-stacked set is one `Set` built in `render`, so a new thing the reader works with joins it in one line |
| Editorial emphasis on the map | a `prominence` field on the event record; `cluster.js` reads `prominence ?? weight` | ○ reserved by this line: derived `weight` in the index is the only measure now, and it is mechanical. `sitelinks` is **not** it: how many encyclopedias wrote about something is not this atlas's judgement of it |
| A ninth record kind ● | since H2: **add to the registry** (`src/kinds.js`), **add the schema file** (`schema/v1/<kind>.json` and its line in `validate/schemas.js`), **add the enum** (`kind` in `schema/common/provenance.json`), then one projection in `buildTopology` and one card module in `panel/` | the entry carries the directory, the schema file, the licences, identity and body, the citation, actor and step lists, the form fields' names, the URL parameter and the labels, and the lists the rest of the atlas used to keep are derived from it; `tests/registry.test.mjs` fails on a registry that has drifted from the schemas, which are the one copy that cannot be removed |
| A sixth edge type or a seventh relation type ● | since H2: **add to the registry** (`src/vocab.js`, with its label and — for a relation — both directions, its endpoints and whether it is acyclic), **add the enum** (`schema/v1/edge.json` or `relation.json`, the `type` enum *and* the `id` pattern, plus `narrative.json`'s step pattern for an edge type), one `.type-*` rule in `style.css`, one line in `about.html` | the two id patterns, the id `edgeId` synthesises for a spine tuple, the graph's key, `graph.js`'s ordering, the panel cards' labels and rule 19's endpoint table are all built from the list, so the type arrives with them; the consistency test compares the list against the schemas' enums and against the third part of each id pattern |
| A fifth grouping or a seventh lens kind ● | since H2: `GROUPS` or `FOCUS_KINDS` in `src/vocab.js`, one case in `lanesFor` or in `eventsOfFocus`, one label in `lensLabel` | both focus patterns are built from `FOCUS_KINDS` and `state.js` imports them, so the URL grammar follows the vocabulary rather than a second copy of it; the cards' controls take a kind and an id and need no case at all |
| A fourth view of the same state | one module, `VIEWS` in `src/vocab.js`, `main.js`'s switch, `index.html`, `style.css`, a `panel/cluster.js` case | since H2 it reads `workingSet(atlas, state)` from `src/emphasis.js` for what the reader is holding, rather than assembling that set a fourth time |

## Scale, for the record

Figures the reviewer supplied; the GitHub ones are recollection, unverified:
Pages site soft-capped at 1 GB, 100 GB/month bandwidth, 10 deploys/hour.
15,000 record files at 1–2 KB is ~25 MB. The graph index at 5,000 events
+ 15,000 edges is ~2.5 MB raw, ~400–600 KB gzipped, one request. A full-text
index at that size would be 5–15 MB, which is why text is not in the index.
SVG holds 5,000 marks comfortably; at 50,000 with pan/zoom it stutters, and
the fix is rendering only the visible window, not a map library.

Health review B measured the running site on synthetic datasets: at 20,000
events a page takes 33 MB of heap, 0.7 s per click and 2 s per wheel notch;
at 100,000 the validator takes half an hour. The graph queries themselves —
consequences, convergence, horizon — are fine at every size; the cost is in
loading and drawing.

**What `data/index/` holds after I4b**, measured on 8 September 2026 on this
dataset (2,044 records: 421 events of which 210 active, 219 edges, 488 actors,
26 places, 51 relations, 11 offices, 83 tenures, 1 narrative, 710 presences, 34
sources; 5 lanes), raw and gzipped as Pages serves it. The run-by-run account of how it
got here — I1's presences, I2's rows, I3's split, I4's switch — is in the four
blocks below; this is the position.

| File | Raw | Gzipped | Before it is drawn |
|---|---|---|---|
| `manifest.json` | 26,639 | | every page, `no-store` |
| `core-<hash>.json` | **63,223** | **17,824** | every page but `sources.html`, whole |
| `attributes-<key>-<hash>.json`, 5 files | 190,858 | 48,828 | **no** — the window's, a card's centuries, and every one of them on the two writer pages |
| — 1800–1899 · 1900–1999 · 2000–2099 | 29,673 · 121,551 · 32,510 | 7,259 · 30,456 · 8,371 | |
| — `null` · `place` | 2,442 · 4,682 | 882 · 1,636 | |
| `sources-<hash>.json` | 33,681 | | every page |
| `presences-<hash>.json` | 137,693 | | `contribute.html` only; the territory layer and the actor card fetch it behind the draw |
| `search-<hash>.json` | 223,317 | 44,593 | no — fetched beside, never waited for |
| `review-<hash>.json`, the summary | 1,061 | | `review.html` only |
| `citers-<hash>/` | | | no — one file, when a source is opened |
| `explanations-<from>-<to>-<hash>.json`, 3 files | | | no — in bulk, by whatever reads a path |
| `history/` | | | no — one file, when a record is opened |

**What each page fetches before it draws**, which is the promise
`tests/spine-pages.test.mjs` holds against a real browser's own record of its
requests. Index bytes only; the coastlines and the palette are counted
separately because the base map replaces them (M36–M38).

| | index bytes | and then |
|---|---|---|
| `index.html` | manifest + core + sources = **123,543** (+ land 125,938 and palette 4,071: **253,552** whole) | its window's shards, then the rest in year order, and the search shard |
| `entry.html` | + the record's own century = **153,216 to 245,094** | the centuries its own lists span, one shard each |
| `contribute.html` | + the presences = **261,236** | every shard, held, and the search shard |
| `review.html` | + the queue's summary = **124,604** | every shard, held, the search shard, and the queue's own digests a kind at a time |
| `sources.html` | the manifest and the sources index, **60,320** | nothing |
| `narratives.html` | **nothing at all** — the cards are in the file | the core and the shards its walks cross, and only for `?fixtures=1` |

At 10⁴ — the bench atlas of 20,000 events of which 8,000 tombstones, 39,996
edges, 500 actors, 1,750 places, 200 sources and no presences, built with
`node tools/build-index.mjs --data <dir>`:

| | raw | gzipped |
|---|---|---|
| `core-<hash>.json` | **2,016,667** | **336,979** |
| the eight attribute shards | 3,260,536 | 339,621 |
| — a century of them | ~501,700 each | ~51,700 each |
| — `place` | 191,195 | 23,496 |
| `search-<hash>.json` | 2,753,125 | 125,508 |
| `sources-<hash>.json` | 142,757 | |
| `manifest.json` | 6,105 | |
| the whole-corpus projection, unwritten | 3,821,229 | 434,746 |

| at 10⁴ | index bytes before it draws | the health review measured | |
|---|---|---|---|
| `index.html` | **2,165,529** | 16.9 MB | 7.8× |
| `entry.html` | **2,224,724 to 2,667,366** | 16.1 MB | 6.0–7.2× |
| `contribute.html` | **2,165,529** | 20.6 MB | 9.5× |
| `review.html` | **2,165,595** | 20.9 MB | 9.6× |

**The 2.0 MB line, honestly.** The brief asks that each of those four be under
2.0 MB of index before it draws. Three are **2,165,529 B** and the fourth is
between that and 2,667,366 B. Read as 1,048,576 bytes to the megabyte the three
miss by 3.3 %; read as 1,000,000 they miss by 8.3 %; `entry.html` misses by
between 6 % and 33 % depending on which century its record is in. The line is
missed, and the improvement it was asked to produce is 6× to 9.6×, from pages
that parsed 16.9 to 20.9 MB. The core alone is 2,016,667 B — **93 % of the
figure** — and the manifest and the sources index are the rest, so nothing but
a smaller core would close the gap. This is I3's own 2.9 % gzipped miss,
measured and reported then and arriving here where it was always going to
arrive; what changed in between is that the whole page and not the file alone
is now being held to a line.

**At 10⁵**, projected linearly from the measurement above on the same generator
(100,000 events at the same density, ~200,000 edges): the core is **~10.1 MB
raw and ~1.68 MB gzipped**, against the plan's ≤ 11 MB and ≤ 1.8 MB — met, and
met with less room than the plan expected. The attribute payload is ~16.3 MB
over seven century shards of ~2.3 MB each, one at a time and never waited for,
under an LRU of four; the search shard is ~13.8 MB and is the largest single
file in the artifact. The projection is a **floor**: real ids are longer than
the generator's, and the id table is 467,251 B of the core at 10⁴ and scales
with the ids and not with the graph. Past 10⁵ the lever is outside "plain JSON,
no build step" and is a new decision (index2-plan, A3).

**And what I1 did about the last of those**, measured on this dataset as it
stands after M32b (329 events of which 146 active, 161 edges, 445 actors, 81
tenures, 710 presences, 34 sources), raw:

| | before I1 | after I1 |
|---|---|---|
| `manifest.json` | 25,043 | 25,550 |
| the graph file | 581,688 | 314,567 |
| `presences-<hash>.json` | — | 267,134 |
| `sources-<hash>.json` | 33,678 | 33,678 |
| `data/geo/land-present.json` | 125,938 | 125,938 |
| `data/geo/palette.json` | 4,071 | 4,071 |
| `data/geo/regions.json` | 221,050 | — |
| **first paint** | **991,468 (968.2 KB)** | **503,804 (492.0 KB)** |

Half the first paint, and the two things that left are the two the health
review named: the presences, which nothing needs until the territory layer
draws, and the lane polygons, which were fetched to compute twenty numbers.
The graph file is 45.9 % smaller and is still loaded whole, because
convergence cannot be answered from a window; what is left in it is events
(131,224 B), actors (115,699), tenures (27,675), edges (17,068), relations
(11,526), places (7,763), offices (1,840) and one narrative (1,671), and
the runs that address *those* are I2, I3 and I4. The largest single item at
first paint is now the coastline file the base map replaces (M36–M38).

The brief's own thresholds — the graph file under 290 KB raw and the whole
first paint under 460 KB — were written on 6 September against a corpus whose
graph file was 542.9 KB. On that corpus this change lands at 269.4 KB and
455.6 KB and clears both. On the corpus as it stands the same change lands at
307.2 KB and 492.0 KB, because M30b, M31 and M32b added 38.8 KB of events,
actors and tenures to the file in between. Nothing in I1 can close that gap:
the excess is not presences.

**And what I2 did**, on the same corpus, by making every record a positional
row over one shared id table with the closed vocabularies as integers, and
dropping no field:

| | before I2 | after I2 | |
|---|---|---|---|
| the graph file, raw | 314,567 | 162,695 | 1.93× |
| the graph file, gzipped | 40,961 | 38,047 | 1.08× |
| `presences-<hash>.json`, raw | 267,134 | 137,693 | 1.94× |
| `presences-<hash>.json`, gzipped | 23,265 | 22,849 | 1.02× |
| **first paint**, raw | **503,804 (492.0 KB)** | **351,932 (343.7 KB)** | 1.43× |
| the same at 10⁴, raw | 9,702,450 | 3,821,229 | 2.54× |
| the same at 10⁴, gzipped | 462,537 | 439,444 | 1.05× |

which is what the plan said it would be and for the reason the plan gave: gzip
had already hidden most of this over the wire, and what the change buys is
`JSON.parse` and heap. The graph file is 158.9 KB and the whole first paint
343.7 KB; at 10⁴ the file every page loads whole is 3.65 MB raw and 429.1 KB
gzipped, against the brief's 4.3 MB and 460 KB, and both are met.

**On the real data the brief's 175 KB is not.** That number is the plan's two
measured re-encoding rows added together — the core at 50.0 KB and the
attributes at 116.2 KB (index2-plan §0) — and those two rows are not an
inventory of the whole file. Between them they name ids, merges, an event's
years, status, place, region, weight, actors, title, `when`, roles and notes,
identity, `citesCount`, `revised`, `parent`/`scope`/`category`/`subtreeWeight`,
names and `where`. They name **no presence field at all**, and the presences
were 267,108 B — 49.2 % — of the 530.2 KB spine the rows were measured against.
The same information as rows is 300,388 B here: 162,695 in the graph file and
137,693 in the presence index, and 94.3 KB of the second is a presence's
`capital` (49,517) and its `when` (44,827), neither of which is in either row.
Nor are `wikipedia`, the offices, the tenures or a relation's `note`. The
target could not have been met by any encoding that drops no field, which is
the brief's other rule; the run reports rather than trims. Reducing those bytes
means deciding which of them a first paint needs, and that decision is I3's —
the core and the attribute shards — which is where the plan puts it.

**And what I3 measured**, which is the number I4 was gated on. The split was
written beside the spine and read by nothing at the time, so this was what a
page *would* pay after I4; the block at the top of this section is what one
pays now. On the real corpus
(1,839 records; 329 events, 161 edges, 445 actors, 26 places, 43 relations, 9
offices, 81 tenures, 1 narrative, 710 presences, 34 sources):

| | raw | gzipped |
|---|---|---|
| `core-<hash>.json` | **53,387 (52.1 KB)** | **14,767 (14.4 KB)** |
| the five attribute shards | 160,672 | 40,269 |
| — 1800–1899 | 29,011 | 7,025 |
| — 1900–1999 | 98,174 | 24,250 |
| — 2000–2099 | 26,518 | 6,515 |
| — `null` | 2,287 | 843 |
| — `place` | 4,682 | 1,636 |
| the two together | 214,059 | 55,036 |
| the spine, which they are a split of | 162,695 | 37,944 |
| `search-<hash>.json`, beside them | 183,424 | 33,917 |
| **first paint reading the core** | **243,367 (237.7 KB)** | |
| first paint reading the spine | 352,675 (344.4 KB) | |

At 10⁴ — the bench atlas of 20,000 events of which 8,000 tombstones, 39,996
edges, 500 actors, 1,750 places, 200 sources and no presences:

| | raw | gzipped |
|---|---|---|
| `core-<hash>.json` | **2,016,667 (1.92 MB)** | **336,979 (329.1 KB)** |
| the eight attribute shards | 3,260,536 | 339,621 |
| the spine | 3,821,229 | 434,746 |
| `search-<hash>.json` | 2,753,125 | 125,508 |
| **first paint reading the core** | **2,165,575** | |
| first paint reading the spine | 3,970,137 | |

**The threshold is met on the real data and not at 10⁴.** Plan §3 asks for a
core of ≤ 60 KB raw on the real data — it is 52.1 — and of ≤ 2.0 MB raw and
≤ 320 KB gzipped at 10⁴, where it is 1.92 MB and **329.1 KB**. The gzipped
figure misses by 2.9 %, and the raw one clears 2.0 MB read as 1,048,576 bytes
and misses it by 0.8 % read as 1,000,000. Per record the core costs **21.0 B
per id** and **18.9 B per edge**, which are the plan's own measured figures to
the tenth, and **35.8 B per event** against the 31.6 the plan measured; the id
table is 467,251 B of it and, as §0 says, is the floor. What the split buys is
not in doubt — 1.45× off the real first paint and 1.83× at 10⁴, with the
titles, the roles and the notes arriving a century at a time — but the number
I4 was gated on is not met, and saying so is what this run is for.

**And what I4 spent it on.** The pages moved over one per commit — the atlas and
`entry.html` in I4a, the two writer pages and the narratives page in I4b — and
the whole-corpus file stopped being written. On the real corpus, as it stands
after the world merge (2,044 records against the 1,839 I3 measured):

| | before I4 | after I4 | |
|---|---|---|---|
| the graph file every page loads whole, raw | 194,796 | **63,223** | 3.08× |
| the same, gzipped | 46,977 | **17,824** | 2.64× |
| `index.html`'s whole first paint, raw | 385,171 | **253,552** | 1.52× |
| `entry.html` before it draws | 255,162 | **153,216–245,094** | 1.04–1.67× |
| `contribute.html` before it draws | 616,172 | **261,236** | 2.36× |
| `review.html` before it draws | 479,540 | **124,604** | 3.85× |
| `sources.html`, which never read the graph | 60,366 | **60,320** | — |

The two writer pages move the most because they were awaiting the search shard
as well — 223,317 B that nothing they draw needs. `entry.html` moves the least
and sometimes barely at all: it waits for the core *and* a century, and on this
corpus the 20th-century shard is 121,551 B, nearly twice the core.

At 10⁴ the four pages the health review measured at 16.9, 16.1, 20.6 and
20.9 MB fetch 2.17 MB, 2.22–2.67 MB, 2.17 MB and 2.17 MB. The whole-corpus file
is not in the artifact at all: `manifest.schema` is 5, `writeIndex` removes the
one an earlier build left, and `buildSpine` survives in `src/validate/core.js`
as the definition the two halves are asserted to add up to and as what the
prerendered pages are rendered from, which is why those pages came out
byte-identical through the whole cycle.

Two costs, stated rather than dressed up. **A bar, a mark and a node are drawn
before their title arrives** and are labelled when it does — one frame at the
whole extent, the discipline the territories, the citers and the explanations
already followed, and the owner's own answer to question 6. And **the two writer
pages fetch more than they used to**, not less: they hold the core *and* every
shard, 254,081 B against the 194,796 B of the file they replaced, because rule
21 and `findSimilar` read the whole atlas. What they no longer do is make the
contributor wait for it — the form is on the screen out of the core, and it
says it is still loading the corpus rather than passing judgement on half of it.

## Milestones

| Milestone | Delivers | Done when |
|---|---|---|
| M0 | The tree at the ● marks, no reserved folders; `schema/v1` and `schema/common`; schema subset + rules + validator CLI; tests; `validate.yml` and `deploy.yml`; both `LICENSE` files; `.gitattributes`, `.nvmrc`; `build-regions.mjs` and its output. | `node tools/validate.mjs` passes on an empty dataset; `build-index.mjs` is byte-deterministic under test; CI is green. |
| M1 | `src/`: map with own projection, timeline with lanes, panel, chain in URL, convergence. The owner writes the first events, edges and sources. | The atlas `CONTEXT.md` describes runs from `python3 -m http.server 8000`. |
| M2 | `contribute.html`, the two issue templates, `contribution.yml`, `bundle-to-files.mjs`, the PR template, the PAT. Tested by the owner end to end; templates not yet published. | One bundle submitted through the form arrives as a PR with green CI. |
| M3 | GitHub Pages, `CONTRIBUTING.md`, `about.html`. Site public. | A stranger can read it. |
| M4 | The `actor` kind end to end — schema, rules, index, panel card and highlight, form, tools, fixtures — and a denser 20th–21st century test dataset to exercise it. | An actor's card lists its events with roles; the dataset validates with no errors; the manifest reports the roles in use. |
| M5 | The `presence` kind end to end — schema, rule 17, index, the CShapes 2.0 import, the territories layer, the actor card's territory, the attribution. | The map scrubbed from 1886 to 2019 shows borders changing; Portugal's colonies leave as they became independent; hovering names them; clicking opens the actor; the layer switches off; every presence validates; the import is reproducible from the recorded sha256. |
| M6 | The import's actor mapping as data with splits by date; a window of time in place of a year, with the band on the timeline; stacking on the timeline; search by name. | The six `presence-outside-actor-when` warnings are gone; `data/imports/cshapes-actors.json` splits 750 and 850 and `docs/cshapes-entities.md` lists the rest; the band moves with pointer and keyboard and the URL follows; stacks split as the window narrows; `/`, "sal", Enter opens Salazar. |
| M7 | The graph view: `graph-view/layout.js` and `graph-view.js`, the Map \| Graph toggle, `view` in the state and the URL, the edge-type key in `about.html`. | `?view=graph` draws all sixty events left to right by year in five bands with all 73 edges, the types distinguishable and the disputed ones dashed; clicking a node selects it and the panel follows; walking a chain paints it madder in both views; a selected event shows its convergence branches; narrowing the window fades the rest; search works from the graph view. |
| M9 | The `place` kind end to end — schema, rule 18, the spine's `places`, the migration, the card, the search, the form and the tools — and `panel/` split into one file per card. | Every event references a place or is placeless; `data/places/` holds one record per distinct location; `?place=lisbon` lists the 37 events there; the map draws the same marks it drew before; the form can pick a place and add one. |
| M10 | Source pages and the bibliography — `citations` in the sources index, the source card, `sources.html`, sources in the search — and "what did this lead to by year X?": `shortestPaths`, `reachableBy`, the panel's horizon and the reachable set lit on all three views. | Clicking a citation opens the source card with every one of its citers; the bibliography lists every source with its count; `?selected=carnation-revolution-1974&horizon=2011` lists the 23 events downstream by then and choosing the constitution walks the three-step path to it. |
| M11 | Relations between actors — `schema/v1/relation.json`, rule 19, the spine's `relations`, the actor card in both directions, the form, `new-record.mjs relation`, and the relations the test dataset implies. | Relations validate; `?actor=portugal` lists its four regimes; `?actor=salazar` says what he led; tests green. |
| M13 | The review dashboard: `review.html`, `src/review/`, the `review` envelope block, the review index, `tools/serve.mjs` and its write endpoint. | The queue lists every assistant-drafted record; editing and saving rewrites the file and the index; signing removes it from the queue and puts the reviewer on the record; without the server the same action yields a correction bundle. |
| M14 | The lens and the grouping: `src/lens.js`, `src/lanes.js`, `src/grouping.js`, `focus`/`group`/`lanes` in the state and the URL, the packed rows on the timeline, the bands of the graph taken from the same lanes, the rule stated on the event card. | The default URL packs the timeline into rows with no overlapping bars and draws the graph without bands; `?group=actor` gives six lanes plus "Other" by count (twelve when M14 landed); `?group=actor&lanes=…` gives exactly those; `?focus=actor:salazar` draws only that actor's events in all three views; the picker round-trips through the URL. |
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
  under `data/actors/`, with `NC_ORIGINS` as the whole of the exception
  (`IMPORT_AUTHORS`, an author-name list, until H5b).
- **`dependencyKind` is a field of its own**, beside `dependencyOf`: how a
  territory was held is a different fact from by whom, and one can be known
  without the other.
- **Geometry is sharded by period, not by entity**, and a presence names
  every shard that carries it. The site loads one shard for the year on the
  slider.
- **No colour per polity.** The territories layer is cobalt on white like
  everything else; who was where is answered by hovering and by clicking,
  not by a legend of two hundred hues.

On 3 September 2026, by the owner, and built in M6:

- **A colony and the state that followed it are two actors.** The question
  revision 6 left open, answered: CShapes code 750 is `british-india` until
  1947-08-15 and `republic-of-india` after it, 850 is `dutch-east-indies`
  until 1945-08-17 and `indonesia` after it. Which of the other 89 codes in
  the same position are two things and which are one is a historical
  judgement, and `docs/cshapes-entities.md` is the list to work down.
- **The actor mapping of an import is data, not code.** `data/imports/`, so a
  contributor corrects a territory through the ordinary pull-request path and
  a maintainer re-runs the import. Presences are never edited by hand.
- **A date disagreement between an outline and a record is said in the
  record's summary**, not resolved by editing either. The outline is an
  import and stays as the source has it.
- **Time is a window, and the timeline's band is the only control that sets
  it.** The map's year slider is gone.

On 3 September 2026, in the building of M11:

- **The `relation` kind is real**, the fourth node kind, and the first link in
  this model that does not run between events. Six closed types; a missing one
  is reported in `STATUS.md` and never replaced by a generic one.
- **A relation cites its sources**, like an edge: it is an argument about two
  actors, not a fact about the world.
- **A relation has no card and no URL of its own.** It is read from the actor
  card at either end, and the graph view was left alone: relations are not
  drawn there, because that view's x axis is the year.
- **Rule 19's endpoint table is part of the model**, not a convention: what
  may stand at each end of each type is checked, so "a person is a regime of
  a state" cannot be filed.

On 3 September 2026, by the owner, and built in M14:

- **The timeline's lanes and the graph's bands are one thing**, a grouping of
  events, and it is a choice: `none`, `actor`, `place`, `region`. `regions.json`
  is read only in the `region` case; everything else asks `lanes.js`.
- **No grouping is the default.** The layout does the work — packed rows on
  the timeline, no bands in the graph — because it is the arrangement that
  claims least about the data. `region` may return as the default when the
  data is world-scale.
- **An event is drawn in exactly one lane**, by a rule the interface states on
  the event's card: the heaviest of its actors among the lanes shown. Never
  duplicated across lanes.
- **The lanes are the top six in the window, plus "Other"** (twelve until 5
  September 2026), unless the
  reader gives an explicit ordered list. The window decides which lanes exist,
  never which events are in them.
- **Filtering is separate from grouping and from selection.** A lens
  (`?focus=`) removes; a selection dims; a grouping arranges. Three things,
  three mechanisms, and no view where two of them look alike.

On 4 September 2026, by the owner, and built in M19:

- **Each territory has its own colour, and the colour means only "not the one
  beside it".** No legend by hue, ever: eight colours cannot name two hundred
  polities, and a legend would claim they can. Hovering and clicking are what
  answer "who was where", as they were before the colour arrived.
- **The hierarchy of emphasis is fixed**: territory hue under the selected
  actor's cobalt, and the walked chain's madder over both. Anything added to
  the map later fits under those two or replaces them by decision, not by
  accident.
- **The palette is generated and checked like the index.** A colour somebody
  typed onto a record would go stale the moment a border moved.
- **Type is self-hosted, two faces, OFL.** No CDN and no third party told
  which reader opened which page.
- **Contrast is a test, not an intention.** WCAG AA for text, 3:1 for lines
  and controls, and the table lives in `tests/contrast.test.mjs`.
- **Still no dark mode.**

On 5 September 2026, in the building of H5b (the health cycle's envelope):

- **`authors` is attribution and nothing else.** Whether a record has been
  read, which process wrote it, and whom the licence asks to be named are
  three facts and now three fields: `review.status` with `review.signedBy`,
  `origin.tool`, and the table in `src/licensing.js`. All three were read off
  one author name matched against a literal string, and a rename of any of
  them changed two of the three without a record moving.
- **`origin` is the creator's and nobody else's.** An enrichment pass fills in
  a gap on somebody else's record and comes away owning nothing
  (`CREATOR_ONLY` in `tools/import/identity.mjs`, rule 29).
- **An import never rewrites a record a person has signed.** A CShapes re-run
  rebuilds an actor from the dataset, so rewriting a signed one would erase
  the signature and the reviewer's corrections together. It reports and
  leaves the file alone; the run carries on.
- **A retraction is a field, not a note.** `retraction: { on, reason }`,
  present exactly on a tombstone, written by a person, deleted by nothing.
- **Sign keeps the citation checks.** `flags` and `note` are the reviewer's to
  clear; their audit trail is theirs to keep.
- **A count of somebody else's database carries the day it was read.**
  `sitelinks` is `{ count, on }`, and a lane a tool gave says so in
  `regionNote` — both for the same reason: a snapshot stored as a fact is a
  fact that quietly goes wrong.

Open: when contributions open to strangers; whether the role vocabulary
closes, and to what; which of the 89 remaining CShapes codes want splitting;
whether the licence enum shrinks to the three licences a directory accepts or
rule 12 grows to the five it declares.
