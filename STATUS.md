# Status

Where the project is right now. Read this first in any new session, after
`CLAUDE.md`. Update it whenever a decision is taken, a milestone moves, or a
session ends. `ARCHITECTURE.md` is the target; this file is the position.

## Last updated

2026-09-05, after M26 (`docs/m26-brief.md`): **a card is a head, a summary
and collapsible sections with counts, and the browser's Back comes back.**

The owner's complaint was that a card showed everything at once — summary,
who is in it, consequences, convergence, citations, narratives, horizon — and
read badly. It is now progressive disclosure. The **head** is the title, one
line of when and where and which lane, an event's actors as **chips** with
the role on hover and in the `title`, and the quiet links out. Then the
**summary** alone. Then one **collapsible section per question**, each header
carrying its count: Consequences (with the horizon inside it), Causes, Other
branches, Sources, Part of, and on an actor Relations and Territory. Nothing
was removed — the counts say what is behind a header before it is opened.

**The count is where a dispute is announced**: "Consequences (3, 1
disputed)", so that a closed section never presents a disagreement as
settled. **One section is open at a time** — the panel is a narrow column,
and two open sections put the second a screenful below the first — and which
one is a preference rather than state: `localStorage`, per reader, as the
pane sizes are, never the URL. Which opens by itself follows the arrival:
walking a chain opens Consequences, arriving from a source's card opens
Sources, otherwise the reader's remembered choice. The header is a native
`<button>`, which is where Enter and Space come from; `src/panel/sections.js`
is the one module that decides all of it, for every card.

**Convergence split in two.** *Causes* is the direct incoming links and is
always there; *Other branches* is the convergence query and is drawn only
while a path is being walked, because without one there is nothing to be
other than. The query itself is untouched. **The walked path became a
breadcrumb** above the card, each earlier step a link that returns to it and
drops what came after.

**Opening a record now pushes a history entry.** `state.js` wrote every
change with `replaceState`, so the browser's Back left the atlas; the owner's
case was clicking an actor from an event and wanting the event back without
searching. A change of *what is open* — `selected`, `source`, `place`,
`actor`, `narrative`, `step` — pushes; a change of the view only still
replaces, or dragging the time band would fill Back with a hundred frames of
one picture. The decision is a pure function on the patch. The browser will
not say what Back returns to, so the store keeps its own trail of the
openings it pushed and `popstate` walks it; the panel's head names the link
("← 25 April") with a Forward twin, and both are `history.back()`/`forward()`,
so they and the browser's own chrome do the same thing.

Two things worth recording about how it is built. The **Sources count comes
from the sources index** and not from the record being fetched (`data.js`
gained `citationsOf`), so the header says how many before the text arrives —
and a citation now carries its verification mark, saying "unchecked" where
nobody has opened the source, which all 1,874 of them are. And the four
done-whens that need a *driven* browser — a click, Enter and Space, the
choice surviving a reload, Back after opening an actor — are tested by
driving headless Chromium over its **DevTools protocol on Node 22's own
`WebSocket`**: no Puppeteer, no Playwright, no npm, which is the repository's
rule. `tests/panel-browser.test.mjs`.

**No historical text was written and nothing under `data/` changed**: 1,685
records, 0 errors, 3 warnings, as M25 left them. **559 tests**, ten of them
in a real browser (four dumped, six driven). `ARCHITECTURE.md` is at revision
21; deviations 177–180.

**M29 (branch `m29`, `docs/m29-brief.md`): the international administrations
are actors.** Nine of them — the League of Nations, the OEEC and the OECD,
the Council of Europe, EFTA, the European Union, the Schengen Area, the CPLP
and the eurozone — plus 15 relations (10 memberships from `portugal`, oldest
first, and 5 between the bodies), 3 events the dataset lacked (EFTA 1960,
Schengen 1995, the CPLP 1996), 3 edges and 1 place. Everything carries the
draft marker and goes to `review.html`. **One thing needs the owner:** the
memberships are recorded as `allied-with`, not `member-of`, because rule 19
puts a *person* at the `from` end of `member-of` and a state therefore cannot
be a member of anything. See the open question below and deviation 181.

Before that, 2026-09-05, after M25 (`docs/m25-brief.md`): **the graph view
has a level of detail: what is too close together to tell apart is one mark
with a count.**

Nodes of one band closer together than thirteen units at rest are drawn as
one mark with a `+n` badge, and the links between two such marks are one
line, heavier for how many it carries, in the commonest of their types and
dashed as disputed if **any single one** of them is. Zooming in splits the
stacks — the threshold is `D / k`, a screen constant, so they come apart on
their own — and clicking one puts its members in the panel and goes to the
zoom where it comes apart. Merging is **within a band and never across one**,
because a lane is a claim about where a group of events belongs.

The picture is two pure functions now, not one. `layoutGraph` places every
event once and knows nothing of the zoom; `stackLayout` reads those
coordinates and says what is drawn at a given `k`. That split is why a stack
can open without the picture moving under the reader: **zooming changes which
marks are drawn, never where a mark is.** `src/cluster.js` stays the one
module that decides what merges, for all three pictures, and gained the two
things the graph needed — `alone`, the set of ids that must keep a mark of
their own, which every view used to hand-roll, and `mergeEdges`.

What the reader is working with is never inside a stack: the open event, the
walked chain, the consequences and the converging branches drawn at it, the
lens's events, the horizon's reachable set, a narrative's steps, and the
events of an open actor.

**No historical text was written and nothing under `data/` changed**: 1,608
records, 0 errors, 3 warnings, as M23 left it. 528 tests, four of them
driving headless Chromium over `tools/serve.mjs`. `ARCHITECTURE.md` is at
revision 20 and its reserved line on level of detail is built; deviations
174–175 — the never-stacked set is wider than the brief's five, and "far
fewer nodes than events" is not yet true of this atlas at 134 active events,
for a reason the numbers below make plain.

**The numbers, at the default zoom (k = 1) on the 134 active events.** With
no grouping, which is what the atlas opens on: **113 marks**, 17 of them
stacks, 21 events folded in, and 142 lines of 158. Grouped into the five
regions, which is the arrangement that crowds a band: **83 marks**, 33 of
them stacks, 51 events folded in, and 116 lines. The badges add back up to
134 in both. At `k = 8`, the deepest zoom the view allows, every event has
its own mark again. The reduction is real but modest, and honestly so: the
brief was written for "three hundred nodes and five hundred edges", and 134
events over 126 years is about one a year — not yet a hairball. The
threshold was set by the same reasoning the map sets its own (a little under
the distance at which two hit targets overlap) rather than tuned upward to
earn an adjective; on a synthetic 300-event, 300-link picture at the density
the feature exists for, the same rule draws **143 marks of 300** and 210
lines, and the test asserts it there as well as here.

Before that, 2026-09-05, after M24 (`docs/m24-brief.md`): **the timeline
follows the map, and six interface fixes the owner asked for.**

Pan or zoom the map and the lanes hold only the events placed on screen, with
a line above them saying how many of how many are in view and a **show the
world** that stops the filtering without moving the map. The visible area is
`?bbox=west,south,east,north` in the URL, rounded to two decimals, so a view
of one coast opens on that coast; `src/util/viewport.js` answers "is this
event in this box" and `map/projection.js` owns both conversions between the
pan/zoom transform and the box. The open event and the walked chain are never
taken away by it. The graph has no viewport of its own, is not narrowed, and
says so.

The six fixes: the layer switches are hidden in the graph view; the wheel over
the timeline narrows the window around the year under the cursor and its empty
ground slides it, with the band now taking the arrow keys its handles took;
the automatic lanes are **six plus Other**, not twelve; a click that hits no
mark, cluster, bar, stack, territory or handle clears the selection and the
chain, on both pictures, and a drag never does; every card offers **Discuss
this record** (a correction issue carrying the address the reader was looking
at) and the map and the graph offer **Export this view** (the drawing as a
standalone SVG with the stylesheet and the computed tokens inlined); and the
edges between the map, the timeline and the panel can be dragged, remembered
per reader in `localStorage` and never in the URL, with a double-click or Home
restoring the default and the phone layout ignoring both.

**No historical text was written and nothing under `data/` changed**: 1,608
records, 0 errors, 3 warnings, as M23 left it. 510 tests. `ARCHITECTURE.md` is
at revision 19; deviations 170–173 — the timeline's old click-to-set-the-year
is retired, the lens keeps removing under a box rather than being exempt from
it, there is no pinch on touch, and the pin does not move the map.

Before that, 2026-09-04, after M23 (`docs/m23-brief.md`): **a record can now
have a full entry, and there is a page to read it on.**

An optional `body` on `event`, `actor` and `place`, written in a closed
Markdown subset that `src/markdown.js` renders — paragraphs, `##`/`###`
headings, emphasis, lists, block quotes, links to records by id and to
`http(s)` URLs, and citation marks `[^source-id p. 12]` that must name a work
the record already cites. Everything outside the subset comes out as the
characters somebody typed: **no raw HTML, no images, no other scheme**, and
no permissive mode, because everything under `data/` is untrusted input.
`entry.html?id=<id>` is one page for all three kinds — dates, place or seat,
actors, relations, the summary, the rendered entry with a table of contents,
the citations resolved and numbered, the narratives that walk it, and the way
back to the atlas — and a record with no entry gets a page that says so and
invites one. Every card and every search result offers **"Read the full
entry"**. Rule 23 checks the marks and the links; the contribution form and
the dashboard's editor draw the same preview from the same renderer.

**No historical text was written.** Every `body` under `data/` is empty and
the data is byte-for-byte what M22 left: 1,608 records, 0 errors, 3 warnings.
The one entry that exists is synthetic, in `tests/fixtures/`, and exercises
every construct of the subset and every refusal. 485 tests, two of them
driving headless Chromium over `tools/serve.mjs`. `ARCHITECTURE.md` is at
revision 18; deviations 165–169.

Before that, 2026-09-04, after M22 (`docs/m22-brief.md`): **the imported
events from 1975 on have been read one at a time, most of them are gone, and
seven of M21's retractions are back.**

M22 ran under a **rule change the owner made on 4 September at 21:30Z**, which
overrides both its brief and M21's: *one honest edge, in either direction, is
enough to keep an event; only an event with no honest edge at all is
retracted; and no edge is ever written in order to keep an event.* The bar is
therefore the second clause, not a count.

Of the **170 imported events starting in 1975 or later**, 35 are wired, 122
are retracted and 13 are merged into records the atlas already held — a
**retraction rate of 72%**. As in M21 the rate is high for a reason visible in
the data: **102 of the 170 are ballots**, most of them repetitions of an
institution the atlas already wires at its foundation, and a further 21 are
actions of the armed far left that have nothing here to attach to. Every
retraction carries its reason on the record in `review.note` as well as in
`docs/m22-retractions.md`.

Per decade — wired, retracted, merged, edges written, actors created:

| decade | wired | retracted | merged | edges | actors |
|--------|-------|-----------|--------|-------|--------|
| 1970s  | 9     | 14        | 3      | 9     | 2      |
| 1980s  | 6     | 26        | 2      | 7     | 0      |
| 1990s  | 5     | 17        | 0      | 4     | 0      |
| 2000s  | 5     | 21        | 0      | 5     | 0      |
| 2010s  | 4     | 24        | 4      | 5     | 0      |
| 2020s  | 6     | 20        | 4      | 6     | 0      |
| **all**| **35**| **122**   | **13** | **36**| **2**  |

Plus the **reinstatement pass**: seven of M21's fifty-nine retractions came
back with the single edge M21's own note said each had — Batepá, Mueda, the
Treaty of Windsor of 1899, the elections of 1921, 1925 and 1972, and the
Conakry territorial election of 1957 — for **7 more edges**. Fifty-two of
M21's retractions stand.

The **43 edges** M22 wrote are **35 `probable` and 8 `consensus`**, and again
no `disputed`, for M21's reason: no link was found that qualified historians
disagree about, and where a *fact* is disputed — the tolls at Batepá and
Mueda — the record says so instead. All five types are used: 17 `enabled`,
11 `caused`, 11 `precondition-of`, 3 `reacted-to`, 1 `inspired`.

**What was wired** is four chains and some singles. The institutions the
constitution of 1976 created — the two regional assemblies, local government —
each wired to it at their foundation. The parliamentary chain of the 1980s:
the Democratic Alliance takes the constitution back from the military in 1982,
cannot take the presidency, breaks; the Bloco Central signs with the Fund and
with the Communities; the minority of 1985 becomes the majority of 1987. The
best of the four, the 2000s: a local election brings down a government in
December 2001, the early election of 2002 follows, Barroso leaves for
Brussels, the president dismisses his successor, the majority of 2005 holds
the abortion referendum it promised, and 2007 answers 1998 the other way. And
the road to November 2015: the defeat of June 2011 forces a Socialist
leadership ballot, the leader it produces is the incumbent the open primary of
2014 unseats, and the leader that primary produces reads October 2015 as a
majority.

**Four findings**, at length in `docs/m22-retractions.md`:

1. **An institution is wired at its foundation, not at every exercise of it.**
   Fifty-five of the 122 retractions are repetitions — local, regional and
   European ballots after the first two of each, and fifteen of those are
   single-municipality ballots the import brought beside the national election
   of the same day. The alternative was one
   argument ("the constitution of 1976 created elected local government")
   filed twelve times, which is what the brief forbids. The test is not
   whether a ballot repeats but whether anything follows from it, and where
   something does the record stays: the local election of 2001, and the three
   Madeiran elections of 2023, 2024 and 2025.
2. **Lisbon as a venue is not a causal fact.** Eight records are treaties,
   Union acts or alliance operations whose only Portuguese content is where
   they were signed or who sent a contingent — the START I protocol, the
   Lisbon recognition convention, the Treaty of Lisbon itself, the telecoms
   package, the ESM treaty, the Union-wide European elections of 1999 and
   2024, and the Afghanistan training mission. The record the atlas is missing is the
   Portuguese presidency of 2007, not the treaty.
3. **The armed far left is a hole in the atlas, not a set of unimportant
   events.** Twenty-one records — bank robberies and killings by the PRP-BR, the
   Brigadas Revolucionárias and the FP-25 between 1975 and 1984 — are
   retracted for one reason: the atlas holds none of the organisations, none
   of the trials, and no event for the turn to armed action after 25 November
   1975. Write those three and most of the twenty become evidence.
4. **Disasters without a recorded response are the largest honest loss.**
   Fifteen — the Azorean earthquakes of 1980 and 1998 and the Cape São
   Vicente one of 2009, the Chiado fire, the Almograve spill, the fire
   seasons of 2016 and 2024, Monchique, the remains of Hurricane Leslie, the
   quarry collapse at Borba, the Legionella outbreak of 2014, Xylella, the
   Madeira fires of 2024, the European drought of 2022 and the Lisbon floods
   of December 2022. The atlas holds the fires of
   2017 and wires them to the reform they produced; for none of these does it
   hold a response, an inquiry or a rule.

**Three corrections to imported data**, each flagged on the record: the
abortion referendum of 1998 was dated 8 June by the import and both cached
leads say 28 June; the killing at the Sacavém pottery works was imported as
2022 and the item's own description says 6 December 1982, which moves it into
the armed far left of the 1980s; and the Social Democrat leadership ballot of
27 November 2021 was filed under a 2022 id and title, so the title, the date
and the summary now say 2021 and the record carries an `id-mismatch` flag
against an id that cannot be changed.

Before that, 2026-09-04, after M21 (`docs/m21-brief.md`): **the imported events before
1975 have been read one at a time, and most of them are gone.**

Of the **76 imported events starting before 1975**, 13 are wired, 59 are
retracted and 4 are merged into records the atlas already held — a
**retraction rate of 83%**, against the 20% the brief names as the floor
below which edges are being invented. That is high, and it is high for a
reason that is visible in the data rather than in the judgement: **49 of the
76 are elections.** Most are either *rotativismo* ballots the crown arranged
between two parties or single-list ballots the Estado Novo held against
nobody, and an election that changed nothing is the first case the brief
names. Every retraction carries its reason on the record in `review.note` as
well as in `docs/m21-retractions.md`, so the review dashboard shows it
without the file.

Per decade — wired, retracted, merged, edges written, actors created:

| decade | wired | retracted | merged | edges | actors |
|--------|-------|-----------|--------|-------|--------|
| 1890s  | 0     | 7         | 0      | 0     | 0      |
| 1900s  | 2     | 6         | 0      | 3     | 5      |
| 1910s  | 3     | 8         | 0      | 6     | 2      |
| 1920s  | 1     | 7         | 0      | 2     | 1      |
| 1930s  | 1     | 3         | 1      | 2     | 0      |
| 1940s  | 2     | 4         | 0      | 3     | 3      |
| 1950s  | 1     | 7         | 1      | 2     | 1      |
| 1960s  | 2     | 9         | 1      | 4     | 1      |
| 1970s  | 1     | 8         | 1      | 2     | 0      |
| **all**| **13**| **59**    | **4**  | **24**| **13** |

The 24 edges are **17 `probable` and 7 `consensus`**, and no `disputed`: the
run found no link where qualified historians disagree about the link itself,
which is what that value is for, and marking something disputed to look
careful would be the same fault as marking something consensus to look
certain. All five edge types are used — 8 `caused`, 7 `precondition-of`, 6
`enabled`, 2 `inspired`, 1 `reacted-to`. Every one carries
`review.flags: ["edge-drafted"]`; the 13 new actors carry `actor-drafted`
and the 13 rewritten summaries `summary-drafted`, which is how the counts in
this table were computed rather than remembered.

**What was wired** is one continuous argument, which is the point: the
regicide of 1908 and the election it forced; the Constituent Assembly of
1911, the constitution, the presidency, and the use Arriaga made of it in
1915; the Democratic majority that took the country into the war; Carmona's
election of 1928, which was the missing link between the coup of 1926 and
Salazar's arrival at the finance ministry a month later; the Iberian Pact;
the opposition's electoral road of 1945 and 1949, both of which now run into
`delgado-candidacy-1958` — a record that had three edges out of it and none
in, so the atlas could say what Delgado's campaign caused but not where it
came from; the presidency made safe in 1965; the last opening in 1969 and
the last election in 1973.

**Three findings the run did not go looking for**, all in
`docs/m21-retractions.md` at length:

1. **The atlas's African spine begins with the three wars.** Batepá (1953)
   and Mueda (1960) are both major events, both have exactly one arguable
   edge, and both were retracted for it, because the atlas holds no São
   Toméan record before 1975 and no Mozambican one before 1964. A handful of
   pre-war African records would reverse several of these retractions. This
   is the clearest gap in the dataset.
2. **Six retracted records are not Portuguese at all.** The import's class
   queries caught *French* Guinea — Conakry, not Bissau — six times. Only the
   constitutional referendum of September 1958 was kept, and only because
   independent Conakry became the PAIGC's base, its arms route and the place
   Cabral was killed.
3. **Three records cannot be identified**: `q11077889`, `q2115000` and
   `q1454657` have no label, no description and no lead in either language.
   One of them points hard at a real event, 28 May 1922 at Macau, and was
   still retracted rather than guessed at.

Four disagreements between the two Wikipedias were found and **recorded
rather than resolved**: the 1919 presidential election's date (6 December in
English, 6 August in Portuguese), the 1957 legislative election's (3 versus
4 November), and the 1969 earthquake's magnitude (7.8 versus 8).

Before that, 2026-09-04, after M20 (`docs/m20-brief.md`): **the ambiguous
matches are decided and the ticked candidates are in.** Three things
happened.

**The 113 records the reconcile pass would not match are resolved**, by
judgment, on the owner's instruction of 4 September — *"solve the ambiguous
issues yourself, for now this is a demo, I'll review later."* 23 of them now
carry a `wikidata` id chosen from the candidates the pass printed; 9 had
candidates and none of them was the record; 81 had no candidate to judge,
because the search was given a title the atlas composed ("Beginning of the war
in Angola") rather than a label any item carries. Every match carries
`review.flags: ["wikidata-assigned-by-assistant"]`, which is how `review.html`
finds them, and every decision has a line of reasoning in
`docs/m20-ambiguous-resolved.md`. **No id was written that the pass did not
print** — the Carnation Revolution's item certainly exists and its record is
still empty, because filling it in from memory is the one thing this project
does not do. The import then fetched titles for all 23 and **every one came
back the intended subject**, which is the only independent check there was.

**All 250 candidate rows are ticked**, over the M18 brief's cap of about 120,
at the owner's instruction — *"go for all the M18 candidates"* — knowingly,
for the demo. **246 events were created** and 3 refused. The atlas holds
**326 events** where it held 80.

**The import needed three runs, and the second one was the interesting one.**
The first created 17 events out of 249: Wikidata types these items with narrow
classes — "Portuguese legislative election", "bank robbery", "earthquake" —
and the seeds file's class table named the wide ones. The table's own rule is
that an unnamed class is refused and listed, never guessed at, so the fix was
to name them; but the list is printed to an Action log, which the run that
pushed the branch cannot read. So `--report <file>` now appends what a run did
to a file the Action commits, run `b` walked the 232 refusals and wrote down
the 59 classes, and run `c` created the records. **No edges were written**:
that is M21 and M22, and until then the 246 new events are `degree-zero`
warnings — 247 of them, counting the one that was already there.

Before that, 2026-09-04, after M19 (`docs/m19-brief.md`): **the atlas has a
look.** Two things changed and they are not the same thing.

**Colour on the map.** A territory is no longer a cobalt wash like every other
territory: there are **eight muted hues**, tokens in `src/style.css` like every
colour here, with a lighter tint of each for dependencies. Which actor gets
which is **generated, not authored**: `tools/build-palette.mjs` rasterises the
boundaries of every presence shard onto a quarter-degree grid, works out who
touches whom in each period — weighted by how much border they share — and
colours that graph so that **no two neighbours are ever alike**, writing
`data/geo/palette.json`, one small integer per actor. `validate.mjs --index`
checks it for freshness exactly as it checks the index, and the manifest names
it so the site fetches it with the topology. The hue belongs to the **actor**,
so a territory keeps its colour as the years pass, and a **dependency is drawn
in its owner's tint**, which is what makes Portugal, Angola-before-1975 and Goa
one family and Belgian Congo another. On this dataset — 189 hue-holding actors,
656 adjacencies, a maximum degree of 86 — the colouring comes out with **no
conflicts at all** and 15 to 26 actors per hue. The hues sit **under** the
hierarchy of emphasis, which is now a decision in `ARCHITECTURE.md` rather than
a habit: the selected actor is cobalt over every hue (and drawn last), the
walked chain is madder over that.

**A styled interface.** Two self-hosted typefaces under the OFL —
**EB Garamond** for what the atlas says, a revival of a roman cut in the 1540s,
inside the period this project exists to describe, and **Public Sans** for what
the interface says — in `src/fonts/` with their licences and a README saying
which file came from which commit of which repository. No CDN: 528 KB of woff2
served from here, against the 4.4 MB of outlines the map already loads. With
them a **type scale** in rem (the root font size is no longer a fixed 14px, so
a reader who has set their browser to 20px gets a bigger atlas), a spacing
scale, tabular figures on everything compared down a column, and one focus
ring. The **masthead** has three zones — who this is, what you are looking
through, where else you can go — and carries the one azulejo touch in the
interface: a tile band of diamonds along its lower edge, drawn as an SVG mask
so the shape is SVG, the colour is a token, and all five pages share one copy.
The **panel** is a stack of cards made of space and rules rather than boxes,
with a dispute marked twice so a list of consequences shows its disagreements
without being read, citations set as footnotes, and the actor card's relations
and territory as two-column tables. The **timeline** draws an event of one day
as a filled mark rather than a six-pixel empty ring, quietens the stack counts
under the marks they annotate, and gives the band's three labels a line each.
The **graph** carries a key to the five line patterns, drawn with the same CSS
rules as the lines so the two cannot drift apart.

**Contrast is a test now**, not an intention: `tests/contrast.test.mjs` holds
every pair of ink and ground against WCAG AA, every line against 3:1, and the
cobalt of a mark against each of the eight washes it can be drawn over. Two
tokens moved to pass it — `--ink-soft` was 4.33:1 on the ground a search result
is highlighted with, and `--cobalt-soft` was 2.93:1 on paper while drawing the
graph's edges. No dark mode.

**Screenshots**, taken by `tools/screens.mjs` — which drives a headless browser
through its own command line and serves the repository from `tools/serve.mjs`,
because Puppeteer is an npm package and this repository does not have those:

- `docs/screens/m19-map-1911.png` — the colonial world in eight hues, no two
  neighbours alike.
- `docs/screens/m19-map-1975.png` — the same actors keeping their hues after
  independence.
- `docs/screens/m19-map-angola.png` — Angola selected, filled cobalt over its
  hue, with its territory table on the card.
- `docs/screens/m19-event-card.png` — the panel: title, prose, consequences.
- `docs/screens/m19-graph.png` — the graph and the key to the five patterns.
- `docs/screens/m19-about.png` — a reading page on the same tokens.

Before that, 2026-09-04, after M18 (`docs/m18-brief.md`): there is a **list for the owner
to tick**. `data/imports/wikidata-seeds.json` now carries **126 queries**, one
per type per decade — elections, coups and uprisings, treaties, referendums,
massacres, legislation, independences, disasters, battles and wars, over the
fourteen decades from 1890 to 2025 — each restricted by country, location or
participant to Portugal and, up to the independences, the territories it
administered, with Macau to 1999. The Action ran them on
`import/candidates-2026-09-04c` and the result is **`docs/m18-candidates.md`:
250 candidates over 14 periods**, a table per type per period with a box to
tick, both labels, the date, the class, the sitelink count and whether a
record here already carries that item. Nothing under `data/` was written.
**Thirty of the 126 queries were refused** by the query service for taking
more than its sixty seconds — every `coups-and-uprisings`, every
`legislation`, most `battles-and-wars`, five `independences` — and they are
named on the page, so a period whose interesting half is missing says so
rather than reading as though Wikidata had nothing. Each period also carries
a hand-written note on what its queries could not see. Four runs were needed
to get there: the first returned 1163 candidates of which 866 were one
municipality's share of a national election, the second and the fourth were
worse than the third, and the third is the one on disk. **The owner ticks
about 120 rows; M19 imports what is ticked.**

Before that, 2026-09-04, after M17 (`docs/m17-brief.md`): the import has now **been run**,
and the summaries are no longer one line each. The reconcile pass went out on
the branch `import/reconcile-2026-09-04` and matched the atlas's hand-written
records against Wikidata: **51 of 164 records matched with certainty** — 44 of
the 59 hand-written actors, 6 of the 25 places, 1 of the 80 events — and each
match got `wikidata`, `wikipedia` and `sitelinks` written and nothing else.
The 250 CShapes polities were **not** matched, by decision 23 of the review.
The other **113 records are in `docs/m17-ambiguous.md`**, one section each,
with the top three candidates, their labels, dates and classes, and the reason
each was thrown out; that is the expected shape of the result, because
"certain" here means an exact diacritic-insensitive name match *and* a class
consistent with the kind *and* dates within a year *and* exactly one candidate
left. Events match worst: their titles are things like "25 April" and "The
Alvor Agreement", which no search resolves. 99 Wikipedia leads were cached
under `tools/import/cache/wikipedia/`. The first run of the Action failed on
its own output — it indexed *after* it tested, and the suite checks the index
against the tree — which is fixed in the workflow and in the workflow test.
Then, under the dated exception in `CLAUDE.md`, **71 summaries were rewritten**
to three to six sentences: what happened, when and where, who was in it, and
what it is doing in the atlas, hedged where the accounts differ. Skipped, as
the brief requires: every record carrying a `review` block, everything not
carrying the assistant-draft marker, and the two events whose summaries carry
the owner's decision of 3 September. Every replaced text is kept, before and
after, in **`docs/m17-summaries.md`**.

Before that, 2026-09-04, after M16 (`docs/m16-brief.md`): the atlas has a **Wikidata
import**, written and tested but **not run** — this sandbox has no network and
the first real execution is the Action. `tools/import/wikidata.mjs`, zero
dependencies, three modes: `--reconcile` matches records already here against
items, `--import` creates records for the items a file names, `--candidates`
writes a list of proposals and touches nothing under `data/`. Its fetch layer
is injected, so `node --test` runs it against recorded-shape fixtures under
`tests/fixtures/wikidata/`; the real one names itself in a User-Agent, goes
one request at a time with `maxlag`, backs off on 429 and 503, and stops at a
**call budget** rather than hammering somebody else's servers. On a record
that already exists the import is **additive per field**: `wikidata`,
`wikipedia` and `sitelinks` where they are absent, never a change, never a
touch on `summary`/`title`/`when`/`place`/`actors`/`sources`, and **no
`authors` entry** for enriching — the rule is `tools/import/identity.mjs` and
`cshapes.mjs` obeys it too, so an identifier added between two runs survives
the next. It **never writes an edge**. Which Wikidata class becomes which kind
of record is **data, not code**: `data/imports/wikidata-seeds.json` →
`classes`, and an item of a class nobody has decided about is refused and
listed. A cut-off run resumes from `data/imports/wikidata-state.json`, one
cursor per mode, batches of 25.
`.github/workflows/import-wikidata.yml` triggers on a push to `import/**` (a
dispatch would resolve on `main`, which has no workflows), takes its mode from
the branch name through `env`, validates and tests and indexes before every
commit, restores `data/` on failure, and commits to that branch and **never to
`m0`**. Wikipedia leads are cached under `tools/import/cache/wikipedia/` with
their revision and a link to the history that credits the authors — outside
`data/`, schema-checked all the same, and removed by `deploy.yml` before the
site is uploaded.

Before that, 2026-09-04, after M15 (`docs/m15-brief.md`): a record can now say **where else
the same thing is catalogued**, and a reviewer can say **which of its sources
they have actually opened**. Three optional fields — `wikidata`, `wikipedia`
(language → article title), `sitelinks` — on `event`, `actor` and `place`,
additive and written by the import that M16 builds; the contribution form
derives only the item id, from a pasted Wikidata URL, and the review dashboard
shows all three read-only. They are **identifiers and never evidence**: the
card offers "Read more on Wikipedia" in the reader's language as a way *out*
of the atlas, the titles join the search as further names, and **`sitelinks`
feeds nothing** — not the map, not `weight`, not `prominence`. Rule 21 keeps
one item to one record of a kind; **rule 22** refuses `consensus` to an edge
whose every supporting citation is a Wikipedia record. `review.citations`
records who checked a citation against the source and when: the dashboard
lists every source the open record rests on with a box each, the queue counts
what is unchecked, the validator prints **1411 of 1411** still unchecked, and
**Sign warns and signs anyway**. Three source records — `wikidata`,
`wikipedia-en`, `wikipedia-pt`, the last two with identical `creators` — exist
for the import to cite.

Before that, 2026-09-04, after M14 (`docs/m14-brief.md`): two ideas the interface had been
confusing with others were separated and given a file each. **A lane is a
grouping** — `none`, `actor`, `place`, `region` — and `src/lanes.js` is the
one file that decides what a lane is, read by the timeline and by the graph
layout alike. The **default is no grouping**: the timeline packs the 80
events into 10 unlabelled rows with nothing overlapping, and the graph drops
its bands. An event is drawn in **exactly one** lane, by the heaviest of its
actors among the lanes shown, and the event card states the rule. **A lens**
(`?focus=actor:salazar`) removes everything else from all three views, where
a selection dims; it is offered on the actor, place and source cards, said in
the header, and does not narrow the search — what falls outside is listed and
marked. The picker beside Map | Graph is a select, a filter box and a list of
lanes with checkboxes and up/down, keyboard first.

Before that, 2026-09-04, after M13 (`docs/m13-brief.md`): the test dataset can now be
read. **`review.html`** lists every record still carrying the assistant-draft
marker — 314 of them, the number the validator prints — lets a person edit it
in the contribution form's own fields, and **signs** it: the draft marker is
replaced by the reviewer, `revised` is set, and the record leaves the queue.
Saving needs a writer, so `tools/serve.mjs` serves the repository and adds one
write endpoint on `127.0.0.1`; opened without it the same action becomes a
correction bundle for the issue path, and the public site gains no backend.
`STATUS.md`'s "Dates to verify" is now also data: 95 records carry a
`review: { flags, note }` block saying what has not been checked.

## Phase

**M27 is built on its own branch `m27`, off `m0`**, and is the CShapes
colony/state splits worked down: `data/imports/cshapes-actors.json` now cuts
**79** of the source's 252 codes, 77 of them added here, so that a colony and
the state that followed it are two actors. **77 colonial actor records
created**, 77 state records left with the ids every event, relation and
presence already points at, and **200 of the 710 presences re-derived** onto
the new actors. `docs/cshapes-entities.md` is down from 89 codes to **12** —
seven the source only ever holds as occupied, five it gives their own ground
first — and `docs/m27-splits.md` accounts for all 89. Nothing was written by
hand into a presence, an outline or an imported actor: only the mapping file
changed and the import was re-run.

**M0 to M23 built, plus the map usability work, on branch `m0`, pull
request #1 open against `main`.** M13 was the last milestone in the original
run protocol's order; M14 ran after it from `docs/m14-brief.md` on the
`brief-m14` side branch, and M15 from `docs/m15-brief.md`, which arrived on
`brief-m15` together with `docs/review-2026-09-04-plan.md`, the amended
`docs/run-protocol.md` and the briefs for **M16, M17 and M18**. M16 is built:
the import tool and its Action exist and are tested. M17 ran it for the first
time, on the branch `import/reconcile-2026-09-04`, and fast-forward-merged the
Action's commits back into `m0`; the reconcile cursor in
`data/imports/wikidata-state.json` has walked every hand-written record, so a
second reconcile pass would do nothing until the cursor is cleared or new
records are written. **M18** wrote the 126 queries into the seeds
file, ran them on `import/candidates-2026-09-04c` and merged the result:
`docs/m18-candidates.md`, 250 candidates for the owner to tick. **M20 ticked
all 250**, on the owner's instruction, and imported them over three branches —
`import/run-2026-09-04`, `…-04b` and `…-04c` — so the import cursor has now
walked all 323 items the seeds file names and a fourth run would do nothing
until it is rewound. M19 turned out to be something else entirely: `docs/m19-brief.md`, which
arrived on the branch `brief-m19`, is **the look**, and it is built. M8 changed no structure
and wrote no revision, as its brief allows.
`ARCHITECTURE.md` **revision 17** is the specification; its opening note says what changed and why (revision 4
added the `actor` kind; revision 5 added `cluster.js`, `weight` in the
index and `prominence` as a reserved override; revision 6 added the
`presence` kind, the CC BY-NC-SA licence and its one exception, and moved
the last four reserved names in the tree into use; revision 7 made an
import's actor mapping data, turned the year into a window, and moved
`map/cluster.js` to `cluster.js` because the timeline stacks with it too;
revision 8 added the graph view, the `view` state and a reserved line for
level of detail along the time axis; revision 9 made places records, took
`where` off events, added rule 18 and split the panel into one file per
card; revision 10 put each source's citers in the sources index, added the
source card, the bibliography page and the horizon, and put `source` and
`horizon` in the state; revision 11 added the `relation` kind, rule 19 and
the relations on the actor card; revision 12 added the `narrative` kind, rule
20, and reading as a mode — `narrative` and `step` in the state, with the
selection, the chain and the window derived from them; revision 16 added the Wikidata
import, its Action, the two further shapes under `data/imports/` and the
lead cache that is deliberately not data; revision 13 added the
`review` block to the envelope, the review index, `review.html`, and the two
amendments the dashboard needed — the local write server that is never
deployed, and the one path where `authors` is written without the Action;
revision 14 made a lane a grouping with four values and no grouping as the
default, added `lanes.js`, `lens.js` and `grouping.js`, and put `focus`,
`group` and `lanes` in the state; revision 15 added the three identity
fields, rules 21 and 22, the per-citation verification flags, `wikipedia.js`
and `review/citations.js`; revision 17 added the territory palette and its
tool, the two self-hosted typefaces as assets, and the hierarchy of emphasis
as a decision).
The M5 brief asks for revision 5; the map work had already taken that
number.

`data/` holds a **test dataset, 20th–21st century Portugal** — **80
events, 91 edges, 59 actors, 28 relations, 1 narrative, 25 places, 30 sources**, 1910 → 2025 — drafted by the
assistant on 2026-09-02 and 2026-09-03 at the owner's request as an exception to the
"written by a person" rule (recorded in `CLAUDE.md`). Every record says so
in `authors`. It validates with **0 errors and 2 warnings**, both of them
`degree-zero` and both deliberate (see M8 below), the index is
built, and the atlas renders it at `http://localhost:8000/` without
`?fixtures=1`. Twelve edges are `disputed` with dissenting citations; two
lanes derive by `nearest` (Goa, Macau — both correct); one **place** uses a
`region` override (the Azores, absent from the 110m coastline) and four
events keep the override they were written with (the Azores, Recife, the
Spanish border, Lisbon for the Spanish war), three of which now agree with
what their place derives and could be dropped. Every page still serves from `python3 -m http.server 8000`.

**Nothing in it has been read by a person.** See item 4 under Next, and
"Dates to verify" below.

`data/` also holds **710 presences and 252 imported polity actors**,
1886–2019, from **CShapes 2.0** — an import, not writing, under
**CC BY-NC-SA 4.0**, which `data/LICENSE` does not cover. See "The CShapes
import" below. Which actor each of them belongs to is
`data/imports/cshapes-actors.json`, a validated data file rather than a
table in the tool.

What exists and passes (`node tools/validate.mjs --index`: **0 errors, 2
warnings**, both `degree-zero` and both intended; `node --test`: 331 tests):

- **M0.** Licences (`LICENSE` MIT, `data/LICENSE` CC BY-SA 4.0,
  `data/geo/LICENSE` Natural Earth); `.nvmrc` = 22; `schema/common/` and
  `schema/v1/`; `src/validate/{schema,rules,core}.js`;
  `src/util/{dates,geo}.js`; `tools/{validate,build-index,build-regions,
  new-record}.mjs` and `tools/lib/read.mjs`; `data/geo/land-present.json`
  and `data/geo/regions.json` from Natural Earth v5.1.2; `data/index/` for
  the empty dataset; `tests/fixtures/data/` (twelve events, ten edges, four
  sources, three square lanes) with its own index; `validate.yml`,
  `deploy.yml`, `CODEOWNERS`, PR template.
- **M1.** `index.html`, `src/style.css` (azulejo tokens), `src/main.js`,
  `state.js`, `data.js`, `graph.js`, `map/projection.js` (equirectangular),
  `map/map.js`, `map/layers/{land,events}.js`, `timeline.js`,
  `timeline-scale.js`, `panel.js`, `util/{esc,dom}.js`. State
  `{ year, selected, actor, chain, layers }` in the query string (`actor`
  arrived in M4; `year` became the window `{ from, to }` in M6). Disputed
  edges dashed on the map and marked in the panel.
- **M2.** `contribute.html` and `src/contribute/{bundle,form,submit,main}.js`:
  the form builds a bundle, runs the same `validate()` the CLI runs against
  the loaded topology, shows each error next to the input that caused it, and
  keeps the submit control disabled until the bundle validates, every event
  and edge cites a source, and any near-match to an existing title has been
  acknowledged. `submit.js` copies the bundle and opens the issue template,
  prefilled only while the encoded body is under 6 KB.
  `.github/ISSUE_TEMPLATE/{contribution,correction,config}.yml`;
  `tools/bundle-to-files.mjs` with the hostile-input tests;
  `.github/workflows/contribution.yml` gated on the `accepted` label;
  `tools/lookup-sources.mjs` for the DOI/ISBN reading aid.
- **M3.** `about.html` (linked from the atlas header), `CONTRIBUTING.md`,
  `README.md`; `deploy.yml` re-checked against the current tree.
- **M4.** The **`actor` kind**, end to end. `schema/v1/actor.json`
  (`actorType`, `names`, `summary`, `when`, optional `where`, the usual
  envelope); an event's `actors` is now `[{ actor, role }]`; rule 14
  rewritten and rules 6, 10, 11 and 15 extended to actors, with two new
  warnings (`actor-unused`, `actor-outside-when`); the topology carries
  `actors` and the manifest counts them and lists the `roles` in use;
  `data.js` resolves actor ids and builds `eventsByActor`; `panel.js` shows
  an event's actors and an actor's card; the map and the timeline give an
  actor's events a cobalt emphasis, distinct from the madder path;
  `?actor=<id>` in the URL; the form has an actor record type and an
  actor-and-role row on events; `new-record.mjs actor …`; two synthetic
  actors in `tests/fixtures/`. `ARCHITECTURE.md` revision 4, and
  `CLAUDE.md`, `CONTRIBUTING.md`, `README.md` updated.
- **Map usability** (`docs/map-brief.md`). `weight` on every topology
  event, derived at index time: active edges in and out plus the actors
  named — mechanical, not editorial, with `prominence` reserved as the
  override. `src/map/cluster.js` (`src/cluster.js` since M6), pure and
  tested: which marks overlap at
  the current zoom, which of them no zoom the map allows could ever part,
  where a cluster comes apart. `layers/events.js` renders clusters — one
  mark for the heaviest member, a `+n` badge for what is under it, an
  invisible larger hit circle behind every mark, and a label on the
  heaviest clusters on screen past `k = 4`; the selected event, the walked
  path, the endpoints of a drawn edge and the events of the selected actor
  are never put in a cluster. Clicking a cluster zooming can separate goes
  to the zoom where everything separable has separated; clicking a
  coincident one spreads its members on rings with a leg each. Either
  click lists the members in the panel, chronologically, which is the
  keyboard path in. **Two bugs fixed**: the drag guard never fired
  (`pointerup` cleared `drag` before the click arrived), and — worse —
  `setPointerCapture` on `pointerdown` retargeted every click to the SVG
  root, so **no mark on the map had ever been clickable**.

- **M5.** The **`presence` kind**, end to end. `schema/v1/presence.json`
  (`actor`, `presenceType`, `dependencyOf`, `dependencyKind`, `when`,
  `geometry {files, key}`, `capital`, `confidence`, the usual envelope);
  `CC-BY-NC-SA-4.0` in the licence enum and `endDate` on
  `common/interval.json`; **rule 17** and the reach of rules 3, 6, 10, 11
  and 12 into the new kind, with `IMPORT_AUTHORS` as the whole of the
  licence exception; two new warnings (`presence-outside-actor-when`, and
  `actor-unused` now counts territory); the topology carries presences
  without their coordinates and the manifest lists the shards;
  `tools/validate.mjs` checks the geometry files on disk.
  **`tools/import/`**: `topojson.mjs`, `simplify.mjs`, `cshapes.mjs` —
  offline, zero dependencies, idempotent, sha256-checked.
  **The site**: `src/map/layers/presences.js` under the events and over the
  land; `data.js` loads one geometry shard per year and caches it; the
  actor card lists an actor's territory over time and everything it held;
  `territories` in the layer state and in the header, default on.
  `about.html`, `README.md`, `CONTRIBUTING.md` and `data/geo/LICENSE` carry
  the attribution and the licence warning. Fixtures gain two synthetic
  polities, three presences and two geometry shards.

- **M6.** **The import's actor mapping as data.**
  `data/imports/cshapes-actors.json`, validated against a new
  `schema/v1/import-map.json` that the browser never fetches
  (`TOOL_SIDE` in `src/validate/schemas.js`); `readImportMaps()` in
  `tools/lib/read.mjs` and `checkImportMap()` in `tools/validate.mjs`;
  `tools/import/cshapes.mjs` reads it, cuts a code's features into segments
  by date, refuses a split date that is not a boundary CShapes itself draws
  and names the ones it has, and gained `--report`, which writes
  `docs/cshapes-entities.md`. **The six warnings are gone**: 750 is
  `british-india` to 1947-08-15 and `republic-of-india` after it, 850 is
  `dutch-east-indies` to 1945-08-17 and `indonesia` after it, all by
  re-running the import. `CONTRIBUTING.md` gains "Correcting a territory".
  **The two date disagreements** are said in the summaries of
  `east-timor-invasion-1975` and `guinea-bissau-declares-independence-1973`;
  no outline and no date was touched.
  **A window of time**: `{ from, to }` replaces `year` in `state.js`, either
  end null for the data's own bound, resolved by the views in a new pure
  `src/util/window.js`; `?from&to` in the URL and a legacy `?year=X`
  rewritten once at load. The map draws the events whose interval overlaps
  the window and the territories of its far end, clamped to the last year the
  outlines cover; the chain, the selected event and the selected actor's
  events are drawn outside the window too, faded. The map's year slider is
  gone. **The band**: the window drawn over the timeline's lanes with a
  handle at each end, dragging, sliding, arrow keys, a double-click that
  snaps to a decade, and a marker saying which year's borders the map has.
  **Stacking**: `map/cluster.js` becomes `src/cluster.js` and the timeline
  uses it in one dimension; only the events in the window stack together, so
  narrowing the band splits them. **Search**: `src/search.js` (pure, ranked,
  diacritic-insensitive, over titles and every one of an actor's names) and
  `src/search-box.js` (`/` to focus, arrows, Enter, Escape, combobox and
  listbox roles, a live count).
- **M7.** **The graph view.** `src/graph-view/layout.js` — pure: the topology,
  the lane list and the data's extent in, the coordinates of every node and
  every edge out. x is the year on the whole extent, the same scale the
  timeline keeps; y is one band per region and, inside a band, a layered
  barycentre pass over the events of each year, forwards then backwards.
  Every sweep's arrangement is scored by how many edges cross and the best
  wins, the plain id order included, so the pass can never leave the drawing
  more tangled than doing nothing would; ties break by id then weight and
  every list feeding a floating-point sum is sorted, so the picture does not
  depend on the order the records arrive in. `tests/graph-layout.test.mjs`
  asserts all of that, on a hand-built sample and on the whole atlas.
  `src/graph-view/graph-view.js` draws it: the bands and the year axis once;
  the five edge types by dash pattern and weight from tokens in `style.css`,
  each with its own arrowhead, disputed dashed over its type; the window as a
  shade with everything outside it faded, never hidden; the walked chain in
  madder, an actor's events in cobalt, and the convergence branches — the
  same list the panel shows — filled in, which is the one thing this view can
  say that the other two cannot. Pan, zoom, double-click to reset; labels for
  the heaviest nodes zoomed out and for every node on screen at zoom 2 and
  over. `view` joins the state and the URL (`?view=graph`, default `map`);
  the **Map | Graph** toggle in the header swaps the two in the same slot and
  the layer switches, which belong to the map, go with it. `about.html` gains
  a section on reading the graph and a key to the five line patterns, drawn
  with the same CSS rules as the graph itself so the two cannot drift apart.

- **M9.** **Places as records.** `schema/v1/place.json` — the envelope, a
  name list, a point and an optional lane override, with `sources` allowed to
  be empty because a place is a geographic fact rather than an argument (rule
  6's exemption, beside `source` and `region`). An event carries
  `place: "<id>"` and **no coordinates of its own**: the lane is derived from
  the place's point, the place's own override wins over the derivation and the
  event's override wins over both. **Rule 18** is what is left to check on a
  place — at least one name, no repeats — and rules 3, 10, 11 and 12 reach
  into it; a place no active event names is the warning `place-unused`.
  `tools/migrate-places.mjs`, kept in the repository and idempotent, grouped
  the sixty events by their exact coordinates and label into **22 places**
  (37 of them Lisbon) and rewrote every event; it was run over
  `tests/fixtures/data/` too, giving 11 synthetic places. **Two lanes were set
  by hand**, and both are the argument for the change: the Azores
  (`places/lajes`) and the synthetic `fixture-place-o` are outside every lane
  polygon, so the override that used to sit on one event now sits on the place
  where the derivation happens. `panel.js` became
  `src/panel/{panel,event,place,actor,cluster}.js` — a shell that owns the
  container, the clicks and the load token, and one file per card — before the
  place card was added to it. The card is `?place=lisbon`: names, the point and
  its precision, the lane, everything that happened there in order with the
  window applied and the rest faded, and the actors who turn up there most.
  Card precedence is `selected` > `place` > `actor`. Places join the search
  (`search.js`, `search-box.js`), the map and the cluster heading name them,
  the form has a place record type and picks one on an event, and
  `new-record.mjs` gained `place` and `--new-place`, the one command that
  writes two files. **Two older bugs fixed in passing**: the topology handed to
  the contribution form never carried the atlas's `actors` (empty actor row
  since M4, and an event naming an existing actor failed rule 14 in the
  browser), and `schema/v1/bundle.json`'s `oneOf` never listed `actor.json`.

- **M8.** **The test dataset carried to 2025.** Twenty events from the exit
  from the adjustment programme (17 May 2014) to the legislative election of
  18 May 2025, eighteen edges, seventeen actors — six persons and eleven
  institutions: the parties, the two banks, the central bank, the ECB and the
  Commission — three places (Saint-Denis, Pedrógão Grande and a point standing
  for the central-Portugal fire belt) and nineteen sources. Every event points
  at a place and carries no coordinates of its own; every lane derived from
  the point, so **not one `region` override was needed**. Two of the new edges
  are `disputed` with dissenting citations: what produced the recovery of
  2015–2019 (the IMF's evaluation against the political-science accounts), and
  how the result of 2024 should be read (a verdict on November 2023, or the
  end of a cycle). **Nothing was verified against a source**: the run cannot
  reach the web, so there are no `web` records and no `accessed` dates, the
  seventeen official documents are `primary` with a repository and a described
  document rather than a shelfmark, and **every date of the batch is under
  "Dates to verify"**. Two events are left with **no edges at all** — the
  European Championship final and the Iberian blackout — and are the dataset's
  two `degree-zero` warnings; see deviation 60. Part 5 of the brief needed no
  code: M6's clamp is right, and `?to=2025` was verified to draw the 2019
  outlines under the marker "borders as of 2019, the latest the source
  covers".

- **M11.** **Relations between actors.** `schema/v1/relation.json` — the
  envelope with **sources required as for an edge**, `from` and `to` (actor
  ids), a `type` from a closed six, `when`, and an optional short `note`. The
  id is derived, `from--to--type`, which is an edge id's shape with another
  vocabulary in the third part, so **`RELATION_ID` sits beside `EDGE_ID`** and
  the schema, `rules.js`, `bundle-to-files.mjs` and `state.js` each pick the
  pattern by kind — in `state.js` the walked chain now refuses a relation id
  by name, and its edge pattern names the five types instead of matching any
  hyphenated word. **Rule 19** is what only the pair can say: two different
  actors, the actor types each relation type allows (the table in the brief's
  amendment, and now in `ARCHITECTURE.md`), a succession between two of a
  kind, and no cycle in `regime-of` or in `succeeded`, **each on its own**.
  Rules 2, 3, 6, 11, 12 and 15 reach the kind, an actor standing in a relation
  is no longer `actor-unused`, and a relation dated entirely outside either
  actor's own dates is the new warning `relation-outside-actor-when` (the
  dataset raises none). The topology carries relations whole, the `note`
  included, and `data.js` builds adjacency by actor with each relation listed
  from **both ends**. The **actor card** groups them by type and direction:
  Portugal's card says "Regimes" and lists four, the Estado Novo's says
  "Regime of Portugal, 1933–1974" and then what belonged to it, who led it and
  who it was allied with; `allied-with` is symmetric and is the one type whose
  two directions are one group. A relation citing a source is a citer on that
  source's card, drawn as its two actors with the type between them. The form
  has a relation record type, `new-record.mjs relation <from> <to> <type>`
  scaffolds one, and the fixtures gained three synthetic relations.
  **The dataset gained 28 relations**: the four regimes of `portugal`, the two
  successions the import map splits, three bodies inside a regime, twelve
  people and what they led, five party memberships and two alliances the
  events already describe. **Nothing was verified against a source**; see
  "Dates to verify".

- **M12.** **Narratives, and reading as a mode.** `schema/v1/narrative.json` —
  the envelope with **sources required as for an edge**, a `title`, a
  `summary`, `steps` (an ordered array of `{ ref, text }` where a ref is an
  event id or an edge id) and an optional `window` to open on. **Rule 20** is
  what only the whole walk can say: at least two steps, non-trivial prose in
  the summary and at every step, no record named twice running, and a window
  that opens before it closes. Rules 3, 6, 11 and 12 reach the kind — an
  active narrative cannot walk a tombstone — and `refKind()` is what tells the
  two ref shapes apart, refusing a relation id by name as `state.js` does.
  The topology carries the titles, the summary, the authors and the refs and
  **none of the prose**: the list of narratives is one fetch and a step's
  words come with the record when that step is read.
  **Reading is a mode, and it is the first one.** `?narrative=<id>&step=<n>`
  is authoritative and is the whole of the URL; `selected`, `chain`, `from`
  and `to` are derived from the step by `src/narrative.js` and never written
  (deviation 76). `src/narrative-mode.js` wraps the store and is the only
  place that derivation happens, so no view knows the state it reads was
  computed: the map, the graph view and the timeline follow the walk as they
  follow anything else. The chain drawn is **the longest contiguous run of
  edges ending at the step** — a step that jumps simply breaks the run — and
  the whole walk is ringed in dashed cobalt (deviation 79) so the reader sees
  where it is going. Entering remembers what it replaced, in memory; leaving
  puts it back; clicking a mark instead of pressing "next" leaves the
  narrative and keeps what was clicked.
  The panel has the list (**narratives** in the header) and the reading card:
  the narrator's words, the record they are about drawn as the panel draws
  that kind elsewhere, previous/next, the arrow keys and Escape, and the walk
  itself with the current step marked. The event card and a link's argument
  say what they are **part of** (deviation 78), and a narrative citing a
  source is a citer on that source's card. The form has a narrative record
  type with repeatable step rows (deviation 81), `new-record.mjs narrative
  <id> --step …` scaffolds one, and the fixtures gained a synthetic narrative
  whose four steps include a deliberate break in the chain.
  **The dataset gained one narrative**, twelve steps, *How the colonial war
  ended the regime* — assistant-drafted under the same exception as the rest
  and unread by a person. It is an argument, not a record of facts, and the
  right answer to it is a second narrative rather than a correction.

- **M13.** **The review dashboard, and the exception it exists to retire.**
  `review.html` — a maintainer's page, unlinked from the atlas — lists every
  record whose `authors` carries the draft marker, grouped by kind, with the
  **validator's own warnings** as filters rather than a second implementation
  of the rules, a search, and how many of the 567 reviewable records are
  still unread. Opening one shows every field the contribution form has for
  that kind: `FIELDS`, `CITATION_LISTS`, `ACTOR_LISTS` and `STEP_LISTS` are
  **imported from `src/contribute/bundle.js`**, so a field added for
  contributors appears here without being added twice, and the record is
  validated against the topology on every keystroke by the same
  `validateBundle()` the form runs (deviation 82 on why the renderer is not
  shared too). **Sign** replaces the draft marker with the reviewer, sets
  `revised` and clears the review block; **Retract** sets `status:
  retracted` and carries with it the edges and narratives that cannot outlive
  the record, refusing instead of cascading where the records that point at
  it would have to be rewritten (an actor, a place, a source). `j`/`k` walk
  the queue, `ctrl`+`s` saves, `ctrl`+`enter` signs.
  **The envelope gained `review: { flags, note }`**, optional on every kind:
  what still wants checking on this record, and never a claim about the
  world. `tools/seed-review-flags.mjs` put `STATUS.md`'s "Dates to verify"
  onto **95 records** once — `date`, `figures`, `claim`, `place` — from a
  hand-written table the test checks against `data/` (deviation 84).
  **The index gained a third hashed file**, `review-<hash>.json`: a digest of
  each draft, the number of reviewable records, and the validator's warnings.
  A browser cannot read 1,278 record files and the topology drops `authors`,
  so without it the dashboard would be blind or would reimplement the rules
  (deviation 83).
  **`tools/serve.mjs`** is the writer, and the whole of the amendment to "no
  backend": Node only, zero dependencies, `127.0.0.1` only, no CORS headers
  and no `OPTIONS`, a `Host` that must be this machine, any foreign `Origin`
  refused, `application/json` required, and the kind and id judged against
  `KIND_DIRS` and the kind's pattern **before a path is built**. A save is a
  bundle validated as a unit against what is on disk; nothing is written
  unless it passes, and `data/index/` is rebuilt after. It is never deployed.
  Without it — under `python3 -m http.server`, or on the published site —
  every save becomes a correction bundle on the clipboard, shown on the page
  as well, and opens the correction issue.
  `valuesFromRecord()` and `applyValues()` in `bundle.js` are the form's
  inverse: the test asserts they compose to the identity **byte for byte on
  every record in `data/`**, so a review that changed one summary cannot
  rewrite half the file. Making that hold turned up two fields the form never
  had — an event's `endDate` and a relation's exact date (deviation 85).

### The CShapes import

Source: **CShapes 2.0** (Schvitz, Girardin, Rüegger, Weidmann, Cederman &
Gleditsch, *Mapping the International System, 1886-2019*, Journal of
Conflict Resolution 66(1), 2022, doi:10.1177/00220027211013563), licence
**CC BY-NC-SA 4.0**.

The ETH site (`https://icr.ethz.ch`) is **not reachable from the build
environment** — the session proxy answers 403 — and neither are the CRAN
mirrors. The same file ships in the CRAN package, whose GitHub mirror the
git proxy does serve:

```bash
git clone --depth 1 https://github.com/cran/cshapes
xz -dc cshapes/inst/extdata/cshapes_2_gw.topojson.xz > cshapes_2_gw.topojson
node tools/import/cshapes.mjs --source cshapes_2_gw.topojson
```

The decompressed file is 7.6 MB, sha256
`9f73468bb56aae6a6b22bb5e56bf5f3e013b9ee17c641aba37db97bcb5c1c3bc`, which
the tool verifies before it writes anything (`--check` refuses instead of
warning). It is **TopoJSON**, not GeoJSON: one object `cshapes_2_gw`, a
GeometryCollection of 710 geometries over 6,329 shared arcs, no
`transform`. All of that is recorded in `data/geo/LICENSE`.

What came out:

| | |
|---|---|
| entities | 254 actor records over 252 codes (2 codes are split in two; `republic-of-india` and `indonesia` are reused, not rewritten) |
| presences | 710, one per feature |
| geometry shards | 5 — 1886–1913, 1914–1932, 1933–1945, 1946–1974, 1975–2019 |
| geometry on disk | 4.5 MB total; largest shard 1.11 MB (1914–1932); the world of one year about 700 KB |
| presence records | 636 KB across 710 files |
| imported actor records | 303 KB across 250 files |
| `status` values found | `independent` 365, `colony` 219, `protectorate` 62, `occupied` 39, `mandate` 23, `N/A` 2 |
| validator | 0 errors, 0 warnings (the six were the colony/successor question, answered in M6) |
| could still be split | 89 codes, listed in `docs/cshapes-entities.md` |

Simplification is Douglas–Peucker at 0.1°, or a sixth of an arc's own
extent when that is less, then quantization to three decimals. It runs on
the topology's **arcs**, before any polygon is decoded, so a border two
countries share stays one line and they still meet along it.

### Portugal's territories, checked by hand against the events

The layer agrees with the dataset in two places and disagrees in two, and
three Portuguese territories are simply not in CShapes at all. **Nothing
was edited on either side**; this is the list the brief asks for.

Agreement:

- **Angola.** CShapes ends the colony 1975-11-10; `angola-independence-1975`
  is dated 1975-11-11. The colony's last day and the state's first.
- **East Timor's independence.** CShapes starts East Timor again
  2002-05-20; `east-timor-independence-2002` is 2002-05-20. Exact.

Disagreement. **Resolved in M6 the way the owner chose**: one sentence in
each event's summary saying what the outline shows and why the dates differ.
Neither outline was touched, and neither date was changed.

- **East Timor, 1975–1976.** CShapes keeps East Timor a Portuguese colony
  until **1976-07-16**, and gives it to Indonesia from 1976-07-17 — the
  date of formal Indonesian annexation. The dataset's
  `east-timor-invasion-1975` is **1975-12-07**, the invasion. So the map
  draws East Timor as Portuguese for seven months after the event that
  says it was invaded. Both dates are defensible and they answer different
  questions (who administered it, who held it); the record and the outline
  should probably say which.
- **Guinea-Bissau, 1973–1974.** CShapes ends the colony **1974-09-09**,
  which is the eve of Portuguese recognition. The dataset's
  `guinea-bissau-declares-independence-1973` is **1973-09-24**, the
  unilateral declaration. Almost a year apart, and the choice between them
  is exactly the kind of thing this project is supposed to show rather
  than flatten.

Absent from CShapes entirely, so the layer draws nothing for them:

- **Portuguese India (Goa, Damão, Diu).** No entity. `goa-annexed-1961`
  (1961-12-18) therefore has no territory that changes hands, and India's
  outline does not change in 1961 either.
- **Macau.** No entity. `macau-handover-1999` (1999-12-20) has no
  territory.
- **São Tomé and Príncipe.** No entity, and no event in the dataset
  either.

Not in the dataset as events, but on the map: **Cape Verde** independent
1975-07-05 and **Mozambique** 1975-06-25.

Verified in headless Chromium against the real dataset: `?year=1911`
draws 149 outlines with the colonial world visible and dependencies
distinguishable from independent states; `?year=1950` draws 172;
`?year=1960&actor=portugal` fills Portugal and its five remaining colonies
and the card lists all eleven it ever held; `?year=1990&actor=portugal`
fills only Portugal; `?layers=land,events` draws none and fetches no
shard; `?fixtures=1` draws the two synthetic ones. No console errors on
any page.

Verified in headless Chromium, against `?fixtures=1`: the atlas renders
(marks, lanes, bars, panel); the form derives an id from a title, lists the
bundle's own sources alongside the atlas's, blocks on a near-match until it
is acknowledged, fires the arrow of time and the consensus rule in the
browser, shows the dispute fields only for a disputed edge, and produces the
bundle JSON; the actor entry renders its fields and the event's actor row
lists the actors of the atlas and of the bundle by name.

Verified in headless Chromium against the **real** dataset, for the map
work, driving a real pointer through the DevTools protocol so the guards
are exercised rather than bypassed: at `k = 1` the map draws 13 marks, and
the Lisbon mark carries `+42` (43 events under it); one click zooms to
`k = 2.74` and the mark becomes the 39 records that really share the
point; a second click spreads those 39, each with its own mark, title and
leg; clicking a spread member selects it and the URL carries it
(`?year=2011&selected=sidonio-pais-coup-1917`); a drag that ends on a mark
leaves the URL empty and the panel on the intro, while a clean click on
the same mark opens it; zooming out of Lisbon separates Alvor, Porto,
Braga and the point on the Spanish border (13 marks become 19) and labels
appear; an event selected from the timeline is drawn as its own mark and
not swallowed by the stack; the panel's list of a stack is 43 focusable
buttons; `?fixtures=1`, `about.html` and `contribute.html` still render
with a clean console.

Verified in headless Chromium against the **real** dataset: the card for a
person (`?actor=salazar` — 14 events) and for an institution
(`?actor=pvde-pide-dgs` — 2 events, with the hedged roles), and an event
view with an actor selected (`?selected=carnation-revolution-1974&actor=salazar`):
six actors listed on the event, the notice, and 14 marks emphasised on the
map.

Verified in headless Chromium for **M6**, against the real dataset and
`?fixtures=1`, driving a real pointer and real keys through the DevTools
protocol — sixteen assertions, all passing:

- `?from=1960&to=1975` draws 8 marks (3 of them clusters) for the 21 events
  whose interval overlaps that window, and **not one mark from outside it**.
- `?from=1960&to=1975&actor=salazar` draws 20 marks of which 11 carry
  `faded`, and the set that carries it is **exactly** the set outside the
  window — checked mark by mark against the topology, not counted by eye.
- The band: dragging the near handle 60 px gives `?from=1954&to=1975`,
  dragging the far one gives `?from=1954&to=1970`, and an arrow key on the
  focused handle moves it one year. The URL follows each.
- `?year=1975` becomes `?to=1975` in the address bar at load.
- At full width the Europe lane's heaviest stack carries `+7`, and clicking
  it lists **8** buttons in the panel. The stacks go 12 → 4 → 1 as the window
  narrows to 1960–1980 and then 1974–1975.
- `/`, "sal", Enter yields `?actor=salazar` and opens his card.
- `?from=1910&to=1911` says "borders as of 1911" and draws 149 outlines; the
  clamp past the last shard is unreachable with this dataset (its events stop
  in 2011, inside CShapes's 1886–2019), so it was checked against the
  fixtures, whose outlines stop in 1299: `?fixtures=1&from=1300&to=1400` says
  "borders as of 1299, the latest the source covers", and
  `?fixtures=1&from=1000&to=1050` says there are none before 1100 and draws
  none.
- `about.html`, `contribute.html` and `?fixtures=1` still render, and there
  is no console error on any page (the only 404 is `/favicon.ico`, which
  nothing asks for).

## Decided

See "Decisions taken" at the end of `ARCHITECTURE.md`. Everything in the
review was accepted except two items the owner chose to defer or drop:
contributions-open timing (deferred), `strength` on edges (left out).

Taken by the building agents, all reversible, all listed under Deviations.

## Decided on 2026-09-03 (owner) — all four built in M6

- **Split colony and successor state.** `british-india` and
  `dutch-east-indies` become their own actors; the pre-independence
  presences move to them; `republic-of-india` and `indonesia` keep only
  what follows independence. The same treatment for any other CShapes
  entity whose status changes under one code.
- **The actor mapping of the import becomes data, not code**, so a
  contributor can correct a territory's actor by editing one JSON file
  through the ordinary contribution path, without touching `tools/`.
- **The two date disagreements are resolved by one sentence in each
  event's summary** (`east-timor-invasion-1975`,
  `guinea-bissau-declares-independence-1973`), saying what the outline
  shows and why the dates differ. The imported outlines stay as the source
  has them.
- **Builds run in the cloud only, after 18:00 Europe/Lisbon.**

The first three are built (see M6 above). The fourth is a working
arrangement, not a thing to build: `docs/run-protocol.md` is how the
overnight runs and the hourly shepherd keep off each other's toes on `m0`.

## Next

1. **Owner: create the PAT.** `contribution.yml` needs the repository secret
   `CONTRIBUTION_PAT`: a fine-grained personal access token on this
   repository with *Contents: read and write* and *Pull requests: read and
   write*. Without it the workflow stops at its first step with a message
   saying exactly that. Write its expiry date into `CONTRIBUTING.md`, where
   there is a line waiting for it. (A PAT and not `GITHUB_TOKEN` because a
   pull request opened with `GITHUB_TOKEN` starts no workflows, so the
   contribution PR would arrive with no CI: review finding 2.)
2. **Owner: two repository settings the agent could not set** — the session
   proxy refuses repository-settings writes and the Pages API path (403 from
   the proxy, not a permissions error). Both are one command each with your
   own `gh`:
   - `gh api -X PATCH repos/goncalojacob/atlas-causal -f delete_branch_on_merge=true`
   - **Pages**: Settings → Pages → Source: **GitHub Actions**. Must be done
     before the first merge to `main`, or `deploy.yml` fails at
     `configure-pages`. The repository is private and Pages on a private
     repository needs a paid plan, so this may have to wait until it is
     public — the agent did not change visibility.
   If branch protection is on, let `github-actions[bot]` push to `main`: the
   deploy job commits the regenerated index.
3. **Owner: review and merge PR #1**
   (https://github.com/goncalojacob/atlas-causal/pull/1).
4. **Owner: review the test dataset before anything is public.** This is now
   a page rather than a chore with no shape: `node tools/serve.mjs`, then
   `http://localhost:8000/review.html`, which lists the 314 records still
   carrying the draft marker, opens each in the form's own fields and signs
   it with your name. `node tools/validate.mjs` prints how many are left, and
   the queue is empty when the exception in `CLAUDE.md` is retired. Every
   date, coordinate, name, role, explanation and confidence was written by
   the assistant from memory. "Dates to verify" below lists what is least
   certain, and **every date of the 2014–2025 batch is in it**. The two
   book and article records carry a WorldCat search URL as their
   identifier, not an ISBN; the seventeen `primary` records name a
   repository and a class of document rather than a shelfmark, because the
   run could not open a page to get one; and every citation has
   `locator: null` —
   replace with ISBNs and page or chapter references, or retract the
   record. The assistant's `authors` entry stays until a person has
   reviewed the record and signs it. Read in this order: the
   twelve `disputed` edges (a wrong dispute is the worst failure this project
   can have), then the roles where responsibility is contested — Wiriyamu,
   the 1961 Luanda attacks, Cabral's killing — then the **relations of M11**,
   whose leadership dates are all from memory and whose five `member-of`
   intervals are not membership dates at all (deviation 73) — then the dates.
5. **Owner: write the first records** of the 1415→ period.
   `node tools/new-record.mjs event <id> --title … --start … --place <place id>`
   — or `--new-place <id> --label … --lon … --lat …`, which writes the place
   and the event together — and `edge`, `source`, `actor`, `place`,
   `relation`. Fill in
   the text, then `node tools/validate.mjs` and `node tools/build-index.mjs`;
   open `http://localhost:8000/`. Set `region` **on the place** when the
   derived lane is wrong for everywhere that happens there (strait cities,
   islands absent at 110m), and on the event only when that event belongs to
   another lane than the one it happened in.
6. **Owner: test one bundle end to end** once the PAT exists — open
   `contribute.html`, build a bundle, file the issue, apply `accepted`, and
   check that the pull request arrives with green CI. That is the M2
   acceptance criterion and the one thing the agent cannot do for you.
7. **Owner: look at the map and say whether the numbers are right.** Open
   `http://localhost:8000/`, click the mark on Lisbon twice — the first
   click zooms it down to the records that share the point, the second
   spreads them in rings — and say whether the merge distance, the ring
   and the labels are where you want them (see the fourth open question,
   and deviations 29–33 for why each is what it is).
8. **Owner: look at the territories layer and say whether it reads.** Open
   `http://localhost:8000/?year=1911`, then drag the slider to 1975 and
   watch Africa. Then `?actor=portugal`. The four numbers that decide how
   it looks are at the top of `tools/import/` — `TOLERANCE` (0.1) and
   `MIN_AREA` in `cshapes.mjs`, `MIN_DETAIL` (6) in `simplify.mjs`, and the
   five period cuts in `SHARDS`. Changing any of them means re-running the
   import, which is one command and reproducible.
9. **Owner: rename the three places whose ids came out mechanical** —
   `near-villanueva-del-fresno`, `tete-district` and `recife` — if you want
   them shorter, and add the variant names you know (`lisbon` has only
   "Lisbon"; "Lisboa" would make the search find it either way). Renaming is
   the file, its `id`, and the `place` on the events that point at it. See
   deviation 58.
10. **Owner: the `?year=1911` in item 8 is now `?from=1886&to=1911`.** The
   slider went in M6 and the timeline's band replaced it; a legacy `?year=X`
   link still opens, read as the window's far end. Item 8 reads the same
   either way.
11. **Not yet: publishing the templates.** `contribute.html` is deliberately
   not linked from the atlas or from `about.html`; both pages say
   contributions are not open. Opening them is the owner's call (see the
   first open question).
12. **Owner: say whether the graph should merge harder.** Open
   `http://localhost:8000/?view=graph` and then `&group=region`. At rest the
   first draws 113 marks for 134 events and the second 83; `STACK_DISTANCE`
   in `src/graph-view/layout.js` is the one number that decides it, at 13
   units, chosen so that two marks a reader can plainly aim at separately
   are never drawn as one (deviation 175). Raising it folds more of the
   picture and hides more behind a badge. It is a taste question and the
   agent did not answer it; the same question about the map's own 16 is item
   7.
13. **Owner: say whether "unchecked" on every citation is right.** Every
   citation on a card now carries its verification mark, and since none of
   the 1,874 has been checked, every one of them reads "unchecked" in small
   grey type. That is honest and it is also everywhere. The alternatives are
   to show the mark only once a citation has been verified — invisible until
   the review queue is worked through — or to move the count into the
   Sources header the way disputes are counted ("Sources (2, 2 unchecked)").
   The agent chose the loud, honest one and did not decide it for you; it is
   two lines in `citationsHtml` in `src/panel/panel.js`.
14. **Owner: look at a card and say whether a section should open on its
   own at all.** `node tools/serve.mjs`, then
   `http://localhost:8000/?selected=carnation-revolution-1974`. Today
   Consequences opens by itself on a fresh reader, on the argument that
   consequences are what this atlas is for. The other reading is that a card
   should open entirely closed — head, summary, and six counted headers —
   which is the shortest card and the strongest claim that the summary is
   what to read first. `openSection` in `src/panel/sections.js` is the one
   function that decides it.

## Open questions

- **Answered in M6: a colony and the state that followed it are two
  actors.** The owner decided it on 3 September and M6 built it. Entity 750
  is `british-india` until 1947-08-15 and `republic-of-india` after it, 850
  is `dutch-east-indies` until 1945-08-17 and `indonesia` after it, and the
  six warnings are gone. What is still open is the *rest* of them: 89 more
  CShapes codes are given both as somebody's dependency and as their own
  state under one id, listed in `docs/cshapes-entities.md`. Splitting one is
  an entry in `data/imports/cshapes-actors.json` and a re-run of the import;
  which of them are two things and which are one is a historical judgement
  and the agent does not make it.
- **Answered in M11: "regime of state" is a relation, and the project has
  one now.** `data/relations/`, `schema/v1/relation.json` and rule 19: a
  dated, typed link between two actors, with six closed types and its own id
  pattern. `estado-novo--portugal--regime-of` is a record, and Portugal's card
  lists its four regimes. What is still open is the **vocabulary**: six types
  covered everything the test dataset implied, and the next period will say
  whether it needs a seventh. A missing type is to be reported here, never
  replaced by a generic one.
- **Two CShapes features carry `status: "N/A"`** — Morocco, 1904-01-02 to
  1904-10-02 and 1904-10-03 to 1912-11-26, both with `owner` equal to their
  own code. The import reads them as independent, which is what `owner`
  says; the dataset's documentation does not explain the value. Worth a
  look if Morocco ever matters to a record here.
- **Danzig and West New Guinea have a `dependencyKind` and no
  `dependencyOf`.** Their CShapes `owner` codes (0 and 1) name no entity in
  the file: the League of Nations and the United Nations. The map draws
  them as dependencies and the hover says "mandate of an administration
  that is not a state on this map". If international administrations should
  be actors, that is a decision, not an import.
- **The territories layer covers 1886–2019 and nothing else**, so the
  atlas's own period — 1415 to 1580 — has no territories at all. That is
  the honest state of it: there is no equivalent dataset for the fifteenth
  century, and `presenceType` keeps `polity`, `sphere-of-influence` and
  `archaeological-culture` unused for when diffuse zones are drawn by hand.
- **Does the role vocabulary close, and to what?** Roles on
  `actors[].role` are free text for now; the manifest lists the 62 in use
  across the test dataset, which is what a decision should be made from.
  Some are plainly general (`leader`, `target`, `signatory`,
  `belligerent`, `deposed`); some are one-offs written to hedge
  (`claimed responsibility`, `alleged accomplice`). A closed enum would
  make the panel groupable and search possible; it would also force the
  hedges out of the role and into the summary, which may be the right
  place for them. The agent did not decide this.
- When contributions open to strangers. `CONTEXT.md` argues: after the
  1580–1640 chain coheres and a few hundred of the owner's own records exist.
  Owner: "we'll decide later."
- Source records have no field for the container of a chapter or article
  (journal, edited volume). `locator` and the DOI cover locating it; the
  owner decides whether a `container` field is wanted before records exist.
- The Natural Earth `CONTINENT` attribute puts all of Russia in `europe`,
  Turkey and the Caucasus in `asia`, Greenland in `americas`. Overridable
  per record with `region`; acceptable for v1?
- Map semantics: the map shows events whose start is at or before the
  slider year; the timeline always shows everything. Is that the intended
  reading of "look at a map at a given moment"?
- **The map's four numbers are tuned to this dataset and are the owner's
  to judge by eye**, all at the top of their file: `MERGE_DISTANCE` (16)
  and `SPREAD_RADIUS`/`SPREAD_GAP` (46/24) in `src/map/cluster.js`,
  `LABEL_ZOOM` (4) and `LABEL_LIMIT` (12) in `layers/events.js`. Lowering
  the merge distance makes the badges smaller and the map busier; raising
  it makes one click cover more ground. Nothing else depends on them.
  See deviation 29 for why 16.
- Nearest-lane tolerance is 3° (`NEAREST_TOLERANCE` in `src/util/geo.js`).
  A point in the Strait of Gibraltar (Ceuta) derives by nearest and may land
  on `europe`; Azores and Madeira are absent from 110m Natural Earth. Such
  events need `region` set by hand; the validator says so when nothing is in
  reach, but not when the nearest guess is merely wrong — the owner should
  glance at `regionMethod: "nearest"` entries in the topology index.
- **M29 found the seventh type M11 said to watch for: a state in a body.**
  Rule 19 gives `member-of` a **person** at its `from` end, so
  `portugal member-of european-union` is refused — and with it every one of
  the ten memberships M29 was written to record. No kind was bent to get past
  that, as the brief required. What M29 did instead was use `allied-with`,
  which is what the dataset already does for the same fact
  (`estado-novo--nato--allied-with`,
  `third-portuguese-republic--european-economic-community--allied-with`), with
  a `note` on every row saying on the card that it records a membership and
  why the type is not the obvious one. **That is still a substitution, and the
  rule above is that a missing type is reported and never replaced**, so it is
  reported here. The honest fix is one of two: widen `member-of` to take a
  `polity` at `from`, or add a seventh type — `member-state-of` — for a state
  in a body, which is a different relation from a person joining a party and
  should read differently on the card. Either is a line in
  `RELATION_ENDPOINTS` or `RELATION_TYPES` in `src/validate/rules.js`, a label
  in `src/panel/actor.js`, and a rename of the fifteen relation files. **Until
  the owner decides, Portugal's card says "Allied with" over ten memberships,
  which is the wrong word and the reason this is written down.**

## Deviations

Where `ARCHITECTURE.md` or a brief could not be built as written, the
closest thing that keeps the invariants was built. Each is one edit to
reverse. 1–12 are from M0/M1, 13–21 from M2/M3.

1. **Bibliographic authors of a source are `creators`.** The envelope's
   `authors[{name, github}]` is the record's contributors on every kind
   (principle 4, invariant 12, and the Action sets it from the issue
   opener), so the Source example's `"authors": ["Peter Russell"]` had no
   room. `creators: [string]` holds the authors of the work; rule 9
   compares those.
2. **Edge ids do not match the slug regex.** `from--to--type` contains
   `--`, which `^[a-z0-9]+(-[a-z0-9]+)*$` forbids. `schema/v1/edge.json`
   has its own pattern: three slugs joined by `--`, the third one of the
   five types. Still path-safe; rule 2 also checks the id equals
   `${from}--${to}--${type}`.
3. **`node --test tests/` is `node --test`.** Node 22 takes glob patterns,
   not a directory, and errors on `tests/`. The default patterns find
   `tests/*.test.mjs`. CI and `CLAUDE.md` use the bare form.
4. **Region derivation has a nearest-lane fallback.** Point-in-polygon
   first; if the point is in no polygon but within 3° of one, the nearest
   lane, recorded as `regionMethod: "nearest"` in the topology; beyond
   that, `validate.mjs` errors and `build-index.mjs` refuses to write until
   the record sets `region`. Without this, most port cities fail at 110m.
5. **Modules not in the tree:** `src/util/geo.js` (geometry, pure),
   `src/util/dom.js` (SVG/HTML element helpers shared by the views),
   `tools/lib/read.mjs` (every filesystem access of the tools, so
   `src/validate` stays free of `fs`).
6. **Schema files may carry `$schema`, `$id`, `title`, `description`.**
   Annotations without validation semantics, listed in `schema.js`.
   Everything else outside the fourteen keywords fails closed, tested.
7. **The topology index carries a little more than listed.** Events and
   edges also have `aliases` and `supersededBy` (the index is what resolves
   them) and events have `regionMethod`; the manifest also embeds
   `regions` and the `land` list. Text fields stay out.
8. **Rules slightly stricter than the list, in the list's spirit:** a
   `dispute` block on a non-disputed edge is an error (rule 8); an active
   record cannot cite a merged or retracted source (rule 11); `creators`
   must be non-empty (rule 13); "non-trivial" text is at least 40
   characters (`MIN_TEXT_LENGTH`).
9. **`data/geo/*.json` are compact JSON**, keys sorted, no indentation;
   the index files are indented. Pretty-printed coordinates tripled the
   size for no reader.
10. **`build-regions.mjs` downloads GeoJSON, not shapefiles.** The upstream
    repository publishes GeoJSON at the pinned tag v5.1.2, so no converter
    was needed. `--source <dir>` reads local copies when offline.
11. **Fixture mode borrows the real coastlines.** `tests/fixtures/data/`
    has square lane polygons but no land file; `main.js` passes
    `data/geo/land-present.json` as the land layer in `?fixtures=1` so the
    synthetic marks sit on a recognisable map. Everything else in fixture
    mode is synthetic and the header says so.
12. **`chain` in the URL is a list of edge ids**, not event ids: two events
    can be joined by up to five parallel edges of different types, and the
    panel must know which one was walked to show its confidence and
    dispute.
13. **`src/contribute/` has four files, not two.** `bundle.js` holds the
    pure half — the field list, bundle assembly, the duplicate search,
    `validateBundle` — so it is testable under `node --test`, as the brief
    asks; `main.js` is the page's bootstrap, because `tests/site.test.mjs`
    requires every module under `src/` except a `main.js` to import without
    a DOM. `form.js` and `submit.js` are as specified.
14. **`src/validate/schemas.js` lists the schema files.** The site never
    scans directories and has no build step, so the browser cannot discover
    `schema/` the way `tools/lib/read.mjs` does. `tests/schemas.test.mjs`
    asserts the list is exactly what is on disk, so a schema file added
    without touching the list fails CI rather than the form.
15. **The catalogue check is `tools/lookup-sources.mjs`, not inline YAML.**
    The brief puts the DOI/ISBN lookup in `contribution.yml`; as a tool it
    has tests for what it looks up and how it reports, and the workflow step
    stays two lines with `continue-on-error: true`.
16. **Near-matches must be acknowledged, not merely shown.** "Before
    allowing a new event it searches existing titles and aliases" is
    implemented as a blocking checkbox next to the near-matches, not as a
    refusal: a genuine near-match is sometimes a different event, and only
    the contributor can say. The submit control stays disabled until it is
    ticked.
17. **The bundle textarea is not `render:`-ed** in the issue templates.
    A rendered textarea is the one field URL prefill cannot be relied on
    for, and prefill is what makes the form-to-issue hop work.
    `bundle-to-files.mjs` accepts the JSON fenced, unfenced, or embedded in
    an issue-form body, with a brace-balanced scan that respects strings.
18. **An edge's `type` and `confidence` start unselected.** Defaulting
    `confidence` to the first value would make every edge start as
    `consensus`; an unselected required field says "required" instead.
    Review finding 13 is about exactly this drift.
19. **`loadAtlas({ landFile: false })`** loads no coastlines: the form needs
    the topology and nothing that is only drawn. One line in `data.js`.
20. **`contribution.yml` also runs `node --test`** before it pushes a
    branch. Not in the brief's step list; it is seconds, and it means a
    contribution PR is never opened from a tree whose tests fail.
21. **`delete_branch_on_merge` and Pages could not be set.** Both calls come
    back 403 from the session's API proxy — "Repository settings writes are
    not permitted through this proxy" and "Access to this GitHub API path is
    not permitted through this proxy" — which is the environment, not the
    token's permissions. Left for the owner, with the commands, under Next.

22–28 are from M4.

22. **An actor's `names` being non-empty is a rule, not a schema
    keyword.** The subset validator implements fourteen keywords and
    `minItems` is not one of them (adding it would widen the subset for
    one field). Rule 14 checks it instead, and `schema/v1/actor.json` says
    so in its description.
23. **Rule 14 is stricter than the brief in two places, in its spirit.**
    The same actor may appear twice in one event only under *different*
    roles — "deposed" and "signatory" are two facts, "leader" twice is a
    mistake — and an actor's `names` may not repeat a name. Both would
    otherwise pass silently and produce a duplicated line in the panel.
24. **`?actor=` is a second dimension, not an alternative to
    `?selected=`.** The brief says the URL carries the selected actor "the
    same way it carries a selected event"; carrying it *instead* would
    mean the highlight died the moment you opened one of the actor's
    events, which is the opposite of what the highlight is for. So both
    can be set: choosing an actor clears the selected event and the chain
    (as choosing an event already cleared the chain), choosing an event
    keeps the actor, and the panel shows the event when there is one and
    the card otherwise.
25. **The actor card lives in `panel.js`, not its own module.** It shares
    the citation rendering, the event links, the lane labels and the
    load-token discipline with the event view; splitting it would have
    meant threading five closures across a module boundary. `panel.js` is
    now ~390 lines and still has one job. The ~300-line rule in
    `CLAUDE.md` names `main.js` only, but this is the file to watch next.
26. **The form's actor search is a `<select>` of names, not a search
    box.** "Searches the loaded topology's actors (and the bundle's) by
    name" is implemented the way the form already picks events and
    sources: one control listing every active actor, and every actor in
    the bundle being written, by display name and type. A separate
    free-text search would be a second idiom in the same form.
27. **The topology's actor entries carry no `where`.** The brief lists the
    fields — `{ id, actorType, name, names, when, status, aliases,
    supersededBy }` — and `where` is not among them, so the panel fetches
    the record for the seat, as it already does for the summary and the
    sources. Actors are not drawn on the map, so nothing needs it before
    the card opens.
28. **Roles are stored as written and normalised only for comparison.**
    The brief says the validator "lowercases and trims"; doing that to the
    stored value would edit a contributor's record. Instead the
    normalisation (trim, lowercase, collapse inner spaces) is what rule 14
    compares duplicates on and what `build-index.mjs` collects for the
    manifest's `roles`, while the record keeps the text as filed.

29–34 are from the map usability work (`docs/map-brief.md`).

29. **The badge counts what is under the mark, not what shares its
    coordinates.** The brief expects "at k = 1 Lisbon shows one badge with
    37". It shows **+42** — 43 events — because at k = 1 the merge
    threshold also catches Belém and Parque das Nações (0.23 and 0.26 SVG
    units away), Alvor (6.1), the point on the Spanish border (7.3), Porto
    (9.1) and Braga (10.6). Making the badge say 37 would mean a merge
    distance under 0.23, which would leave every one of those drawn on top
    of the Lisbon stack with nothing to say so — the bug the brief exists
    to fix. So the badge answers "how many events are under this mark",
    which is the question the reader is asking, and the panel lists all 43
    on the first click. Reverse by lowering `MERGE_DISTANCE` in
    `cluster.js`.
30. **A click on the Lisbon mark at k = 1 zooms; the spread is the second
    click.** Follows from 29 and from the brief's own rule 4: that cluster
    *can* be split, so it is zoomed, and rule 4 says a splittable cluster
    zooms. One click takes it from 43 to the 39 that share the point, the
    second spreads those. Every one of the 43 is already reachable from
    the panel on the first click.
31. **`COINCIDENT_EPSILON` is derived, `MERGE_DISTANCE / DEEPEST_ZOOM`,
    and `MAX_ZOOM` now comes from `cluster.js`.** The brief says
    coincident means "within an epsilon that no zoom can separate", and
    that is only definable against the deepest zoom the map allows. A
    fixed small epsilon was tried first and was wrong on the real data:
    Belém and Parque das Nações are a fraction of a unit from the Lisbon
    stack, so they merged with it at every zoom while counting as
    separable, and the cluster could therefore never be spread — 39
    records permanently unreachable. `map.js` takes its `MAX_ZOOM` from
    `cluster.js` so the two cannot drift.
32. **A splittable cluster zooms to `coreZoom`, not by a fixed factor.**
    The brief says "multiply `k`". Multiplying peels off one neighbour per
    click — five clicks from the Lisbon blob to the stack. `coreZoom` is
    the zoom at which every member that *can* leave has left, so one click
    does it. The fixed multiplier survives as the fallback for a cluster
    that has nothing separable to shed.
33. **The cluster's mark sits on its representative's point, not on its
    centre.** The cluster reports `centre` (the mean of its members) and
    that is what the zoom aims at, but the mark is drawn on a real event's
    coordinates, so a cluster of two coastal cities is not a dot in the
    sea. Marks also went from `r = 4` to `r = 5`; the hit target is 10, as
    the brief asks.
34. **The brief's item 6 was two bugs, not one.** The `moved` flag dying
    before the click was real and is fixed as described. Underneath it,
    `setPointerCapture` on `pointerdown` retargeted `pointerup` — and with
    it the `click` — to the SVG root, so a click on a mark arrived with
    the mark nowhere in its event path and **nothing on the map had ever
    been selectable by clicking**. The capture is now taken on the first
    `pointermove` past the drag threshold: a click never captures, a pan
    still does.

35–45 are from M5 (`docs/m5-brief.md`).

35. **`common/interval.json` gains an optional `endDate`.** The brief says
    a presence's `when` carries "the exact dates the source gives"; the
    interval had one `date` field and CShapes dates both ends of every
    feature. `endDate` is additive, optional, in the same shape and
    calendar, and no existing record has one.
36. **`geometry` is `{ files, key }`, not one path.** The brief says "path
    under `data/geo/presences/` of the file that holds the outline, plus
    the feature key". It also says a feature is "duplicated into every
    shard its interval touches", and one path cannot name several files.
    So `files` is the list, sorted, and rule 17 checks every one of them
    exists, holds the key, and that between them they cover every year the
    presence claims — a stricter check than one path would have allowed.
37. **Five period shards, not the brief's four.** 1914–1945 in one piece
    came to 1.4 MB, and the interwar years hold the most entities. The cut
    is 1886–1913, 1914–1932, 1933–1945, 1946–1974, 1975–2019; the largest
    shard is now 1.11 MB. Cutting further does not help: 1914–1922 alone is
    still 1.0 MB, because the entities in it are large and span the window.
38. **Imported actors live in `data/actors/`, flat, not
    `data/actors/cshapes/`.** The brief offers the sub-directory as the
    cleaner option. It is not, here: the site derives a record's path from
    its id (`data/actors/<id>.json` in `data.js`), so a sub-directory would
    have meant a second path rule in `data.js` and `panel.js` and a record
    whose id no longer tells you where it is. The isolation the
    sub-directory was for is done instead by `IMPORT_AUTHORS` in rule 12: a
    CC-BY-NC-SA actor must name an import in its `authors`, and the list is
    one line per import. Tested both ways round.
39. **A `dependencyKind` may stand without a `dependencyOf`.** The rule was
    written as a pairing in both directions and the data broke it: Danzig's
    `owner` is 0 and West New Guinea's is 1, neither of which is an entity
    in the file, because both were international administrations. Dropping
    the kind would have lost a fact the source states; inventing an actor
    for the League of Nations would have invented a state. The other
    direction still holds — a dependency always says how it was held.
40. **Simplification is per-arc adaptive, not one tolerance.** A flat 0.1°
    band deleted **Malta, Bahrain and the Maldives** outright — countries
    smaller than the tolerance flatten into a line. Each arc is now
    simplified at 0.1° or a sixth of its own extent, whichever is less
    (`MIN_DETAIL` in `simplify.mjs`). It costs about a third more bytes
    across the world. The tool errors rather than writing a feature that
    lost every polygon, which is how the three were caught.
41. **Simplification runs on the topology's arcs, before decoding.** The
    brief expects GeoJSON ("GeoJSON parsing is JSON") and the file is
    TopoJSON, which stores every border once and every polygon as indices
    into it. Simplifying the arcs makes two countries' shared border one
    line that is simplified once; decoding first and simplifying the rings
    would have torn every shared border apart. `tools/import/topojson.mjs`
    is the fifty lines that needed, and it is tested.
42. **Dependencies are drawn with a tint, not a hatch.** The brief allows
    either. A hatch is an SVG `<pattern>`, and a pattern inside the map's
    zoomed viewport scales with the zoom, so the hatch would open up as the
    reader zooms in. The tint is the same token at a different opacity, and
    a `disputed` presence is **dashed**, which is already what a disputed
    edge looks like on this map — one idiom rather than two.
43. **The topology's presence entries carry a little more than the brief
    lists.** It names `{ id, actor, dependencyOf, when, presenceType,
    confidence, geometry }`; the entries also have `dependencyKind`,
    `capital`, `status`, `supersededBy` and `aliases`. Without `capital`
    the actor card would fetch twenty-four presence records to show
    twenty-four capitals; without `dependencyKind` the hover could not say
    "colony of". Same reasoning as deviation 7.
44. **One presence per actor is drawn in a year.** A border that moved in
    August leaves two presences of one actor sharing that year, because a
    year is the finest bound the model has (Angola has four such
    boundaries). Drawing both would put two nearly identical outlines on
    top of each other with an ambiguous hover, so `presencesAt()` draws the
    one that started later — the later state of affairs. Rule 17 allows the
    overlap; it only forbids the *same* outline twice.
45. **The import writes nothing at all rather than most of itself.** When
    any record it wants belongs to somebody else — a CShapes slug that
    collides with a hand-written actor — it reports and exits without
    touching the working tree, so a half-import never has to be unpicked.
    The fix for a collision is a line in `ACTOR_MAP`, never an overwrite.

`panel.js` was the file to watch (deviation 25) and M9 split it:
`src/panel/{panel,event,place,actor,cluster}.js`, a shell of about 200 lines
and one file per card, with everything shared — citations, the link to an
event, the lane's name, the load token — handed to the cards in one `ctx`
object. Every later card gets a file.

46– are from M6 (`docs/m6-brief.md`).

46. **Indonesia's split is 1945-08-17, not the brief's 1949-12-27.** The
    brief said to check CShapes's own date and use that if it differs. It
    differs: CShapes turns code 850 from `colony` to `independent` on
    1945-08-17, the proclamation, and 1949-12-27 is not a boundary the
    dataset draws at all — the two nearest are 1945-08-17 and 1949-12-29,
    the transfer of sovereignty being 1949-12-28/29 in the file. The
    amendment's rule (a split date must be the day after some feature's
    end) is enforced by the import, which names the boundaries it does
    have when it refuses one. Code 750 is 1947-08-15 as the brief said.
47. **An actor is reused only when the mapping file names it.** The brief
    says an entry's actor is "created by the import if it does not exist,
    reused if it does". Applied to every id the import derives from a
    country's name, that would silently attach imported territory to
    somebody's hand-written record the moment a slug happened to collide —
    which is the thing deviation 45 exists to stop. So the reuse is limited
    to ids the file names; a collision with an id nobody mapped still stops
    the whole import and asks for a decision.
48. **The report is 89 entities, not the brief's "99 or so".** Counted, not
    estimated: codes the file does not cut whose features are partly held by
    another entity and partly not. It is `docs/cshapes-entities.md`, per the
    amendment, with a pointer from here rather than the table itself.
49. **A renamed segment's summary quotes the source separately.** When the
    mapping file gives an actor its names, the import's summary says "the
    source calls it X; the names on this record are the ones the mapping
    file gives it" instead of the usual "it is called X, then Y over that
    time". The old sentence would have put the file's names in the
    dataset's mouth: CShapes calls entity 750 "India" throughout, colony and
    republic alike.
50. **Search's "widen to include" can narrow the window to one year.** The
    amendment defines it as the same action as "map at Y" — `to = Y;
    from = min(from, Y)` — and that is what was built. The consequence is
    worth seeing before it surprises anyone: choosing an event *earlier* than
    the window's near end moves both ends onto its year, so the window
    collapses to that one year rather than stretching back to reach it.
    Selecting the 1974 revolution from `?from=1990&to=2000` gives
    `?from=1974&to=1974`. Reversing it is one line in `windowAt`
    (`src/util/window.js`) and would change every "map at Y" with it, which
    is presumably why the amendment tied them together.
51. **The band does not zoom the lanes, so a stack splits by losing
    members.** Straight from the amendment ("the timeline does not zoom"):
    the scale stays on the whole extent, only the events inside the window
    stack with each other, and narrowing the band therefore takes members out
    of a stack rather than pulling the bars apart. It is why the counts go
    12 → 4 → 1 above. The events outside the band stack among themselves and
    are drawn faded, so a narrow window does not leave fifty overlapping
    grey bars in one lane.

52. **Ten disputed edges, not the brief's eight.** The amendment's numbers to
    assert say "73 `.edge` elements, 8 of them with a `disputed` class". The
    dataset has **ten** edges at `confidence: disputed`, counted from
    `data/index/`, and the graph draws ten dashed lines. The verification
    asserts ten; nothing was changed to make eight true.
53. **The map's transform handling was not factored into `src/viewport.js`.**
    The brief offers it as an option ("if you factor…"). The map's pan and
    zoom are entangled with cluster spreading and the animated zoom into a
    cluster, and pulling them out would have been a refactor of the map in a
    milestone about the graph. The graph view has its own forty lines of the
    same idiom, with the same pointer-capture and drag-guard comments
    pointing at deviation 34. Sharing them is still worth doing, and is one
    obvious cleanup for whoever next touches either file.
54. **The initial fit to the window is capped, and skipped for a wide one.**
    The amendment says the initial view fits the window. Filling the width
    with a two-year window would mean a zoom of ten, and since the zoom is
    uniform that would push the outer bands off the screen — and the bands
    are the frame the picture is read against. So the first drawing zooms to
    the window up to **2**, and not at all when the window is more than 60%
    of the data, where the right first view of the whole graph is the whole
    graph. `?from=1972&to=1976&view=graph` opens at 2; a plain `?view=graph`
    opens at 1.
55. **A click is resolved to the nearest node, not to the circle on top.**
    Two adjacent years are about eight units apart on this dataset, so a
    hit target of the map's size — or even a mark's own stroke — covered the
    neighbouring node's centre and made it unclickable at rest: the first
    attempt could select 25 November and then could not select the
    constitution eight units to its right. The graph view therefore has no
    hit circles at all. It reads the click into graph coordinates through the
    SVG's own matrix and picks the nearest node centre within reach, which is
    both simpler and exact. Marks were also brought down a little
    (heaviest 6.5, selected 7.5) so that nothing a node draws reaches its
    neighbour.
56. **In the graph view, clicking a consequence of the open event walks the
    chain.** On the map a click always selects afresh and clears the path.
    The brief's numbers to assert require "the walked chain after clicking
    two connected nodes", which cannot happen under the map's rule, and in a
    picture of the whole web following an arrow with the eye and clicking its
    head is the obvious gesture. So: if the clicked node is a direct
    consequence of the one already open, the step is appended to the chain —
    exactly what the panel's follow button does; otherwise the click selects
    and clears, as on the map. Said in `about.html`.

57–59 are from M9 (`docs/m9-brief.md`).

57. **A place's `sources` is a required key that may be empty.** The brief
    says "sources optional". Every record in this project carries the same
    envelope keys, and making one kind's optional would mean two shapes for
    the same envelope; so the key is required, the value may be `[]`, and it
    is rule 6 that exempts the kind — beside `source` and `region`, which is
    where the brief puts it. Reversing it is removing one name from a
    `required` list.
58. **The migration's ids are mechanical, and three of them want a person.**
    The amendment's rule — the slug of the label's first comma-separated
    segment — gives `near-villanueva-del-fresno`, `tete-district` and
    `recife` (from "Recife, at the end of the voyage"). All three are
    accurate and none is what a person would have typed. The tool prints the
    whole mapping for exactly this, and renaming a place is a file rename, an
    `id` and the `place` on the events that point at it.
59. **`new-record.mjs` can write two files.** `--new-place <id>` scaffolds the
    place and the event that happens at it in one command, because the
    alternative is asking for coordinates on an event that no longer has any.
    Nothing else in the tool writes more than one record, and `scaffold()` is
    still one record in, one out; `scaffoldAll()` is the pair.

60– are from M8 (`docs/m8-brief.md`).

60. **Two events are wired to nothing, against the brief's "at least one
    edge".** `euro-2016-final` and `iberian-blackout-2025` have no edge in
    either direction, and the validator says so twice under `degree-zero`.
    Neither could be given one without inventing the claim: no source in this
    bibliography argues a consequence for the final of a football match, and
    what caused the blackout was still being examined when the record was
    written. A `disputed` edge would not have helped — it asserts that a link
    exists and is argued about, which is a stronger claim than the evidence
    carries. Both summaries say plainly that the event stands alone and why.
    The brief's "Done when" asks for 0 errors and does not mention warnings,
    so the dataset still passes; reversing this is one edge each, the day
    somebody can cite one.
61. **No `web` sources, and seventeen `primary` records that name a class of
    document rather than a shelfmark.** Straight from the amendment: the run
    cannot open a page, so an `accessed` date would be a false statement in
    the one field that exists to say the page was seen. Rule 13 requires a
    `primary` record to carry both `repository` and `reference`, so the
    `reference` says what the document is and when it was issued — "official
    results, legislative election of 2025-05-18", "deliberation of the Board
    of Directors of 3 August 2014" — which is true and findable, rather than a
    number the run would have had to guess. The review's first job on these is
    to replace each with the real citation.
62. **One source record covers two government appointments.**
    `dre-government-appointments-2015-2024` stands behind both `geringonca-2015`
    and `montenegro-government-2024`, because the two decrees are the same kind
    of document in the same series and the run knows neither number. Splitting
    it in two is one file each once the numbers are known.
63. **`banco-de-portugal` is an actor and `banco-de-portugal-2014-bes-resolution`
    a source.** Ids are unique per record, not per prefix, and nothing in the
    tree derives one from the other; noted only because the pair reads like a
    collision and is not.
64. **The events of 2024 and 2025 are written short.** The brief asks for less
    text and more hedging on the recent end, and that is what is there: the
    summaries state what happened and stop, and the readings that would need a
    source — what the 2024 result meant, whether the blackout touched the
    campaign — are either in a `disputed` edge or left out.

65. **The bibliography is `sources.html`, not a section of `about.html`.**
    The brief allows either and says which decides it: thirty entries with
    their citation counts would swamp the prose on `about`, and the list only
    grows. `about.html` links to it, and the header of the atlas does too.
66. **The horizon is "open" when a year was chosen, not when the section
    is.** The brief's body lights the reachable set "while the horizon is
    open"; its amendment says the default year is never written to the URL.
    Both hold only if *open* means `horizon !== null` — a `<details>` element
    the reader unfolded is DOM state the map and the timeline cannot see, and
    writing the default year to make it visible is exactly what the amendment
    forbids. So the section is always on the event card, drawn folded with
    the window's far end filled in and its list inside; unfolding it costs
    nothing and lights nothing; typing a year lights the set on all three
    views. One edit to reverse: the `chosen` flag in `panel/horizon.js`.
67. **The sources index grew from 27 KB to 231 KB.** Carrying every citer of
    every source is what makes a source card and a bibliography cost no
    further request, and it is 3.5 KB → 17 KB gzipped against the topology's
    43 KB. It is dominated by the 710 presences citing one dataset record; if
    it ever matters, the fix is to summarise a kind that cites in bulk rather
    than to drop the field.
68. **A citer that is a tombstone is not counted.** `citationsBySource`
    skips records whose `status` is not `active`, so a retracted event's
    citation does not appear on the source card or in the bibliography's
    count. It matches the validator's own `no-citers` warning; the cost is
    that a source cited only by tombstones reads as cited by nothing, which
    is what the atlas draws.
69. **An edge citer opens as a walked step, not as a card.** An edge has no
    card of its own anywhere in the atlas, so a citation made by one is drawn
    as `from — type → to` and clicking it selects the far end with that edge
    as a one-step chain: the panel then names both ends and loads the
    argument, which is everything an edge card would have shown.
70. **A stack takes the horizon's band from its nearest member.** Forty
    events share a point in Lisbon; pulling every reachable one out of its
    cluster to light it would have put forty circles on one point. The stack
    is lit instead, at the band of the closest event under it, and a
    reachable event outside the window is drawn (rather than hidden by the
    band) but still allowed to join a stack.

71–75 are from M11 (`docs/m11-brief.md`); 76– from M12
(`docs/m12-brief.md`).

71. **The graph view does not draw relations.** The brief allows the second
    layer "only if it stays readable — otherwise the card is enough. Record
    the choice." It is not drawn, and the reason is the view's own rule: x is
    the year. A relation has an interval, but the actors at its ends are not
    nodes there and putting them in would mean deciding where an actor sits
    on a scale of events. The card says it better, in both directions, with
    the dates and the note. Reversing this is a layer in `graph-view.js` and
    nothing in the data.
72. **The topology carries a relation's `note`.** Text stays out of the index
    everywhere else — an event's summary, an actor's summary — and this is the
    exception, for the same reason a presence carries its `capital`
    (deviation 43): a relation has no card of its own, so an actor's card
    would otherwise fetch one record per relation to show a line of text. The
    schema caps the note at 200 characters, and the card escapes it like
    everything else from `data/`.
73. **A `member-of` interval is the span the atlas's own records show, not a
    membership record.** Nobody in this run could find out when António Costa
    joined the Socialist Party. Rather than invent a year or leave the type
    unused, the five `member-of` relations start at the first year the atlas
    shows the person acting for the party and say so in the `note`; the end is
    open because nothing here says they left. Replacing them with real dates
    is one edit each.
74. **The two successions cite the CShapes dataset record.** The dates are the
    boundaries the import map draws inside codes 750 and 850, which is where
    they were decided in M6, and the only honest source for them is the
    dataset that draws them. A *citation* of `cshapes-2-0` is not a copy out
    of an NC record: nothing from a presence, an imported actor or an outline
    was carried into these CC BY-SA records, and rule 12 still holds on all
    of them.
75. **No relation was written for a type the dataset could not support.** All
    six types are used, but only where an event record or an actor record
    already said the thing: `led` where the dataset gives the role,
    `allied-with` only for the two alliances events describe (NATO in 1949,
    the EEC in 1986). Nothing was written for the MFA's leadership or for
    the Junta, where responsibility is exactly what historians argue about.

76. **While a narrative is open the URL carries `narrative` and `step` and
    nothing else** — not only the derived selection, chain and window, which
    the m12 amendment requires, but also `view` and `layers`, which are not
    derived. The amendment's own acceptance test says the URL carries the two
    parameters only, and splitting the difference would mean explaining why
    some non-derived state survives a mode and some does not. The cost is
    real and small: a link copied while reading in the graph view opens on the
    map. Undoing it is one branch in `formatState`.
77. **Leaving a narrative that was opened from a link restores nothing**,
    because there was nothing to restore: the reader is left in the years the
    walk ended in rather than thrown back to the whole span. Only a narrative
    entered from inside the atlas remembers what it replaced, and that memory
    is in `narrative-mode.js` and never in the URL.
78. **A record is "part of" a narrative when a step names it *or* when a step
    names an edge that touches it.** Without the second half the card for
    `carnation-revolution-1974` would list nothing, because the walk reaches it
    through the link from Spínola's book rather than by naming it: a narrative
    that crosses an event through its links is passing through the event.
79. **The walk's emphasis is a dashed ring, and every event on it keeps its own
    mark.** The actor's emphasis is a cobalt fill and the path's is madder;
    a third fill would be unreadable, and a walk swallowed by the stack of
    thirty-seven marks in Lisbon is a walk the reader cannot see ahead of. So
    the narrative's events are drawn alone, as the actor's and the path's are.
80. **A step whose ref does not resolve is drawn as a gap**, not as an error
    that stops the walk. Rule 3 refuses such a record, so this can only happen
    to a hand-edited file; the reader still gets the prose and is told which id
    is missing.
81. **The contribution form was built rather than deferred**, which the brief
    left open. The repeatable row it needed already existed for the actors of
    an event — a reference and a bit of text — so a narrative's steps are the
    same shape with a textarea and a list of events *and* links. The one thing
    it does not do is reorder rows; that is in `docs/BACKLOG.md`.

82. **The dashboard renders the form's fields with its own renderer.** The
    brief says not to fork the field *definitions*, and they are imported —
    `FIELDS`, `CITATION_LISTS`, `ACTOR_LISTS`, `STEP_LISTS`, so a field cannot
    exist in one place and not the other. The rendering code is a second,
    smaller implementation: extracting `form.js`'s would have been the better
    shape, and there is no DOM test in this project that would have caught a
    regression in the contribution form overnight. `src/review/editor.js` is
    about 250 lines and does four things fewer than the form's — no id
    derivation, no duplicate search, no add/remove of records, no submit.
    Sharing the renderer is in `docs/BACKLOG.md`, to be done with a DOM test
    under it.
83. **The queue comes from the index, not from `data/`.** A third hashed file,
    `review-<hash>.json`, carries a digest of each draft (the twelve fields the
    list reads), the number of reviewable records and the validator's
    warnings. The alternative was 1,278 fetches from the browser, or
    reimplementing the rules there; the topology cannot serve because it drops
    `authors`. `build-index.mjs` therefore runs `checkRules()`, which it did
    not before.
84. **The seeding covers what `STATUS.md` names by id, and no more.** The
    "three new places whose coordinates are approximate" are named only as a
    count, so only `central-portugal`, which the same paragraph names, carries
    a `place` flag; the other two are not identifiable from the text and were
    left alone rather than guessed at. Every relation is flagged, because the
    same paragraph says every date of them wants checking.
85. **Two fields the contribution form never had**, found by making the
    round-trip byte-identical: an event's `when.endDate` and a relation's
    `when.date`, both in the interval schema and both in use in `data/`. They
    are now in `FIELDS`, which means contributors get them too.
86. **This run did not claim M13 before working on it.** The protocol's step 2
    says to append `M13 started … by shepherd`, commit it alone and push
    before continuing; this run went straight to the work and wrote the claim
    line with this section. Nothing collided — the stale claim from the run
    that was cut off, plus a push inside the last ninety minutes, is what the
    hourly check reads as `ACTIVE` — but the window between the first commit
    and the claim was unprotected.
87. **Reading a narrative suspends the lens.** The brief does not say what a
    lens should do while a narrative is open, and the two answers are not
    equal: a walk whose steps had been removed by a filter left on from
    earlier would be the atlas hiding the thing it was asked to show. So
    `lensSet()` returns null while `state.narrative` is set. `group` and
    `lanes` are *not* suspended — the lanes only arrange what is drawn — but
    neither is written to the URL in reading mode, which was already true of
    everything except the narrative and the step.
88. **The packing has a cap of twenty rows**, past which rows are shared and
    the existing stacking draws the overlap as one bar with a count. The
    brief says "as many rows as needed"; on this dataset ten are needed at
    960px and thirteen at 700px, so the cap is never reached. It exists
    because "as many as needed" is unbounded in principle and a timeline
    forty rows tall would be a page, not a picture.
89. **A packed row is shorter than a named lane** — 22px against 34px —
    because it carries no label, and `.timeline-area` gained
    `max-height: 45vh` and a vertical scrollbar. Ten rows at a lane's height
    would have pushed the map off the screen. The `ResizeObserver` now
    ignores anything but a change of width, since the drawing's own height
    feeds back into the container's.
90. **The graph's bands give up height past five lanes**, down to a floor of
    54px, rather than drawing a picture thirteen bands tall. The brief is
    silent on it; five regions were the only case before M14 and twelve
    actor lanes at a region's height would be four screens.
91. **A source's lens includes its dissenting citations.** M10 keeps
    `dissent` apart so a book arguing against a link is never listed as
    evidence for it; the lens is not a list of evidence but the question
    "what does this source touch", and an edge that cites a book to
    disagree with it is still an edge that rests on the book. The source
    card's separation is untouched.
92. **The picker and the lens badge are one module**, `grouping.js`. The
    brief asks for a picker; the badge is the header's account of the lens,
    it is four lines, and it belongs beside the control that is its
    neighbour on screen. The "show only these" control reaches the cards
    through `ctx.lensControl(kind, id)` rather than by changing three card
    signatures the tests already call.
93. **`layoutGraph` returns `lane` where it returned `region`.** The bands
    are lanes now and the field said something that was no longer true.
    Nothing outside the layout and its test read it.
94. **`lanes.js` exports more than the three functions the brief names.**
    `availableLanes` is what the picker draws and what the automatic twelve
    are taken from — one list, so the picker cannot offer an order the atlas
    does not use; `laneExplain` is the rule in words for the event card;
    `barBox` is the bar geometry, exported so the packing and the drawing
    cannot disagree by a pixel; `rowLanes` is the packing as lanes, so the
    timeline draws one kind of thing and not two.
95. **"Reject a `wikipedia` without `wikidata`" is a rule, not a schema
    keyword.** The brief's "Done when" asks the schemas to reject it. The
    validator's keyword subset has no `dependentRequired` and fails closed on
    anything outside it (deviation 4's reasoning), so the check is rule 21,
    with the failing fixture the brief asks for. Everything else about the
    three fields is in the schemas.
96. **The citation flags are keyed by the cited source's id**, which the
    brief offers as the alternative to the citation's index. An index moves
    the moment somebody adds or removes a citation, and every tick under it
    would then be about a different book without anything having been said.
    An id does not move, and rule 3 checks that the key names a source the
    record actually cites — a flag orphaned by an edit is an error rather
    than a verification nobody made. A source cited twice in one record is
    one book to go and read, so it is one row.
97. **`wikidata` is a field of the contribution form; `wikipedia` and
    `sitelinks` are preserved keys.** The brief allows either. The item id is
    the one of the three a person may write — the form derives it from a
    pasted URL — so it lives in `FIELDS`, marked `identity` so the review
    dashboard renders it read-only; the two the import alone writes cross a
    save through `IDENTITY_KEYS` beside `ENVELOPE_KEYS` and are shown, also
    read-only, in a small block of their own.
98. **The review index's digest gained a derived key, `cites`.** The queue
    says how many citations a record still has unchecked, and the browser
    builds the queue from digests. A digest carries no prose and therefore no
    `dispute` block to read the dissenting citations out of, so the ids are
    written out at build time instead of the prose being carried in.
99. **The three Wikimedia source records carry the assistant-draft marker**,
    so the review queue is **317** rather than 314. They were written by the
    assistant, and the marker means exactly that; attributing them to the
    owner would be false. They are bibliographic records and not historical
    claims, so signing them is a minute's work rather than a reading.
100. **Sign's warning is a line beside the button, not a dialog.** The brief
    says it warns and does not block. A confirm dialog that is always
    dismissed teaches people to dismiss it; the count is on the queue row,
    on the open record and in the validator's output, which is three places
    it cannot be missed and none where it stops anybody.
101. **The seeds file ships empty.** `data/imports/wikidata-seeds.json` has
    no items, no queries and an empty class table. The brief's example names
    an item id; writing that or any other into the repository would be
    asserting what a `Q…` number is, and this sandbox cannot check. What the
    atlas should draw from is the owner's decision and M18 is where it is
    proposed. The tool says so and does nothing when the file is empty.
102. **Which Wikidata class means what is a table in the seeds file, not a
    map in the code.** The brief says actors get `actorType` from `P31`
    (human → person, country → polity, organisation → institution). Doing
    that in code means writing class item ids into `tools/`, which is both a
    factual claim nobody reviews and exactly the thing revision 7 moved out
    of code for CShapes. The table is `classes` in the seeds file, an item of
    an absent class is refused and listed with its labels, and the empty
    table refuses everything — which is the honest state until somebody
    fills it in.
103. **Two schemas the brief did not name.**
    `schema/v1/import-state.json` for the cursor, because the cursor lives
    under `data/imports/` and everything there is validated, and
    `schema/v1/wikipedia-lead.json` for the cache envelope, which the brief
    asks `validate.mjs` to check but does not give a file. Both are tool-side.
104. **A batch is walked places, then actors, then events.** The brief does
    not say. An event whose location item is in the same batch would
    otherwise be refused for a place record that was about to exist one
    iteration later.
105. **An event's location does not become a place record.** The import
    points an event at a place the atlas already has, and where there is
    none the event is **placeless with a lane** rather than the occasion for
    a place nobody asked for. The lane comes from the event's own point, then
    from the point of what it says it happened at or in, then from its
    country; where none of those reaches a lane the event is refused. This is
    what "nothing may leave `build-index.mjs` unable to run" comes to in
    practice.
106. **The fixtures have the shape of recorded responses and none of their
    content.** The brief says recorded; there is no network here to record
    from. Every item in `tests/fixtures/wikidata/` is a `Q9…` id Wikidata
    does not use, with an invented label, and the README in that directory
    says so and says what it costs: the fixtures cannot catch a wrong belief
    about what the live service returns. The Action is where that is found
    out, on a branch, with `data/` restored on failure.
107. **A place derived from its own point is written with `region: null`.**
    The brief says the import sets `region` from `P17` where no lane derives.
    Where one *does* derive, writing it would be pinning a derived value into
    a record — the override exists for the case the derivation cannot answer,
    and only that case gets it.
108. **An empty seeds file is a warning, not an error.** A file waiting for
    somebody to decide what to fetch is its ordinary state before M18, and
    failing the validator on it would fail every commit until then.
109. **The Action's loop is capped at 40 batches and runs the tests inside
    it.** The brief says commit per batch, validating and testing first. 40
    batches of 25 is 1000 items, past which the job would hit its 90 minutes
    anyway; the cap makes the stop deliberate rather than a timeout, and the
    cursor means the next push continues.
110. **The candidate list defaults to `docs/wikidata-candidates.md`.** M18
    names its own file with `--to`; the tool needed a default that does not
    pretend to belong to a milestone that has not run.
111. **The class table was filled in, which the brief did not ask for.** M17
    step 1 says to write the seeds file with `reconcile: true` and no items,
    and says nothing about `classes`. But `classify()` knows only what that
    table says: with it empty every candidate is rejected as unclassified,
    no match can ever be certain, and the pass would have produced a list of
    164 ambiguities and nothing else. The table added is deliberately short —
    26 classes I am confident of, an `event`/`actor`/`place` each with its
    label — so that an item of any other class is still refused and listed
    for the owner rather than guessed at. Extending it is an edit to
    `data/imports/wikidata-seeds.json` and another pass; the reasons in
    `docs/m17-ambiguous.md` name the classes that were missing.
112. **The reconcile pass skips every automated author, not only its own.**
    It filtered on the Wikidata import's author entry, which would have
    matched all 252 CShapes polities by name against a search nobody had
    read — the bulk guess decision 23 of the review rules out. The filter is
    now `handWritten()` over `IMPORT_AUTHORS` plus the import's own name, so
    "a record somebody wrote" has one answer in this repository.
113. **The ambiguous list is written by the tool, not by hand.** The brief
    says everything else "goes to `docs/m17-ambiguous.md`", and the tool had
    only a printed report that scrolls past in a runner's log. It now writes
    the page itself, keyed by record id and merged with what is already
    there, because the Action runs the tool once per batch of 25 and a page
    that replaced itself would have kept the last batch alone.
114. **The Action indexes before it checks, not after.** The M16 brief's
    order — tool, validate, tests, index, commit — fails on its own output:
    the suite runs `validate.mjs --index` against the repository, so a batch
    that had written a record left a stale `data/index/` and rule 16 failed.
    The first real run died there. The loop now runs the tool, rebuilds the
    index, validates with `--index`, then tests, which is what the commit
    would actually contain.
115. **No summary cites a Wikipedia lead.** The brief allows the cached lead
    as a source where one was fetched. The 71 rewritten summaries were
    written from the sources each record already cites; the leads were read
    as a check on dates and names and not drafted from, so no record gained
    a citation and nothing here rests on Wikipedia. The leads are on disk if
    a later pass wants them.
116. **`revised` is left alone on a rewritten record.** `revised` is what
    signing a record in `review.html` sets, and a rewritten draft has not
    been reviewed by anybody: setting it would have moved 71 records towards
    looking checked when what changed is that the draft got longer.
117. **59 hand-written actors, not "about 61".** The brief's estimate; the
    count on disk is 59, against 80 events and 25 places.
118. **The candidate list is a table, not a list of bullets.** The M16 tool
    wrote one bullet per item with its label and description. The M18 brief
    asks for the item, both labels, the date, the type, the sitelink count
    and whether a record exists, grouped by period — which is a table with a
    column to fill, so `candidatesMarkdown` writes one, and a query says
    which period it belongs to through a new optional `period` in
    `schema/v1/import-seeds.json`.
119. **The file is a copy under the brief's name, not the tool's output
    path.** Deviation 110 said M18 would name its own file with `--to`, but
    the Action takes its arguments from the branch name and has nowhere to
    pass one. `--candidates` still writes `docs/wikidata-candidates.md`; the
    run's output was renamed to `docs/m18-candidates.md` on `m0`. That is
    better than the plan: the owner's ticks live in a file no later run
    writes to.
120. **The queries were run four times, and the third is the one kept.** The
    first flooded the list with per-district election items — 866 of 1163
    rows — the second and fourth were refused by the query service more
    often than the third. `data/imports/wikidata-seeds.json` and
    `docs/m18-candidates.md` were both put back to the third run's state, so
    the file and its output are one thing and its product. The two rejected
    shapes are in the history with their reasons.
121. **Thirty queries have no answer, and the page says so.** The query
    service allows sixty seconds and refused 30 of the 126 — the four types
    whose class sets are broad. `--candidates` printed nothing about a
    refusal, so a period could read as empty when it was unasked; it now
    lists them on the page and in the log. Extending the list means making
    those four cheaper, or asking for one class at a time.
122. **The elections queries ask for two language editions.** Wikidata has an
    item per district and per municipality for recent legislative elections
    and no property separates them from the national vote. The line is
    crude, it drops a real election nobody wrote about twice, and it is what
    makes the list tickable; each query's note says so.
123. **The per-period notes are written by hand into a generated file.** The
    brief's step 3 asks for them and no generator can write them. They sit
    under each period's heading, and the top of the page says which part of
    it is hand-written.
124. **The list says 0 records already exist, which is true and misleading.**
    "In the atlas" reads item identifiers, and 79 of the 80 events here
    carry none — M17 could not match them. The top of the page says to check
    a familiar title before ticking it.
125. **The greedy colouring breaks ties by the least-used hue, and a settling
    pass follows it.** The brief asks for "a greedy graph colouring with a
    stable order (actor id)", and that is what runs; what the brief does not
    say is which free hue to take when several are free. Plain first-fit put
    **72 of 189 actors in the first hue and 3 in the last** — a map that looks
    like it has three colours — so the tie-break is the hue used least so far,
    then the lowest index. Greedy alone then left the **United Kingdom sharing
    with ten neighbours at once**, because by the time the ids reach it every
    hue is spoken for; a settling pass asks every actor again, in id order,
    whether some hue shares less border than the one it has, and moves it when
    the answer is yes, for at most eight rounds and only on strict
    improvement. With both, the atlas's own borders come out with **no
    conflicts and 15 to 26 actors per hue**.
126. **Adjacency carries a weight — how much border two territories share —
    and the colouring minimises shared border rather than counting
    neighbours.** The brief says to spill "to the closest available hue" when
    eight is not enough. Eight cannot always be enough here: an empire is
    drawn in one hue wherever it reaches, so the United Kingdom of 1911 is a
    neighbour of a quarter of the world and no eighth of a palette is free of
    it. Something has to share, and the honest choice is the shortest border
    rather than the fewest neighbours — sharing with Lesotho is a better
    picture than sharing with Portugal in Africa.
127. **The palette is `dependencyOf ?? actor`, so an actor that is only ever
    somebody's dependency has no entry in the file.** It never needs one: it
    is drawn in its owner's tint, and the renderer looks the hue up by the
    same rule the tool coloured by. The file therefore names 189 actors, not
    the 252 that hold territory.
128. **The eight hues alternate in lightness (0.825 and 0.745), not only in
    hue angle.** The brief asks for "eight muted hues … low saturation,
    mid-light", which is what the first attempt was: one lightness, eight
    angles, the two closest washes 0.036 apart in OKLab. That is over the
    threshold for a large flat field and under it for a country — Portugal
    and Spain share the longest border on this map and read as one colour at
    the size Portugal is drawn. Alternating the lightness doubles the smallest
    separation to 0.060 without leaving the family. The tokens are also listed
    in the order whose smallest step from one to the next is largest, because
    the colouring hands out the least-used hue and so works through them
    roughly in order.
129. **The manifest names the palette file, and the palette must be built
    before the index.** The alternative was a fetch that 404s on a dataset
    with no palette. `deploy.yml` runs the two tools in that order and commits
    both; `validate.mjs --index` reports the palette first, so an unbuilt
    palette does not read as a stale index and send somebody to the wrong
    tool.
130. **Two colour tokens moved.** `--ink-soft` from `#5c6577` to `#535b6b` and
    `--cobalt-soft` from `#7f97c9` to `#798fbf`, both to clear WCAG AA where
    they are actually drawn. The brief asks for the contrast to be checked and
    documented; it did not anticipate that the existing palette would fail.
131. **The root font size is no longer fixed at 14px.** A type scale in rem
    over a `font-size: 14px` root is a scale that ignores the reader's own
    setting. `html` is `100%` now and the interface is `0.9375rem`, so
    everything is a little larger than it was and grows with the browser's
    own font size.
132. **The serif ships in two files, not three: no bold Garamond.** Nothing in
    the design sets a serif in bold — headings are large and normal-weight,
    which is what the azulejo direction wants — and a weight nothing uses
    would be 240 KB nobody downloads.
133. **Three files outside `style.css` changed for the look.**
    `lanes.js` now says whether a bar was widened to the minimum, so the
    timeline can draw an instant as a mark rather than as an empty ring;
    `timeline.js` gives the band's three labels a line each and draws one year
    label when the window is one year wide; `panel/actor.js` wraps a row's
    trailing metadata so that relations and territory can be tables. The brief
    allows "small markup where needed" and these are that.
134. **Two tools nobody asked for.** `tools/lib/colour.mjs` (sRGB ⇄ OKLab,
    perceptual distance, WCAG contrast — tool- and test-side only, because
    nothing in the browser computes a colour) and `tools/screens.mjs`, which
    takes the brief's screenshots by driving a headless browser through its
    own command line. Both exist so that the two claims this milestone makes —
    "no two of these are confusable" and "this is what it looks like" — are
    reproducible rather than asserted.

135. **The 81 records with no candidate were left unmatched, not searched
    for again.** The brief says to decide "which candidate is the record's
    item, or none"; for these the pass printed none, because it searched the
    title the atlas wrote rather than a label. Deciding them needs another
    reconcile pass on Portuguese labels and aliases, not a judgment call, and
    writing an id from memory is the failure mode the whole design is built
    against. They are listed in `docs/m20-ambiguous-resolved.md` with what
    was searched for.
136. **`central-portugal` was left unmatched although a candidate fitted.**
    Q27569, the Centro NUTS II region, is a real administrative area; that
    record is a point somebody invented to stand for the belt of the Centre
    *and* the North that burned in 2017, and its own `place` flag says so.
    Matching it would assert a boundary the record refuses.
137. **`pvde-pide-dgs` carries Q958917, the PIDE item, for an actor that is
    three institutions here.** The record deliberately holds PVDE, PIDE and
    DGS as one actor under three successive names, and Wikidata's item is the
    middle name's, dated 1945–1969. It is the closest true thing; the
    decisions file says so, and the owner may want it split or left empty.
138. **One test was relaxed.** `tests/seed-review-flags.test.mjs` asserted
    that a seeded record's flags are *exactly* what the table put there. A
    record may pick up a flag from somewhere else — this milestone added
    `wikidata-assigned-by-assistant` to seven records that already carried a
    seeded one — so it now asserts that the table's flags are still present.
139. **`--import` no longer classifies an item a record already carries.**
    The mode looked the item up in the class table before looking for a
    record holding it, so an identifier written by hand could never be
    enriched: the reason a record was not matched mechanically is usually
    that its class is in nobody's table. 17 of the 23 ids decided here were
    in exactly that position. Classification types a record that does not
    exist yet; where one exists it has already said what kind of thing it is.
140. **The import took three Action runs, not one.** The first
    (`import/run-2026-09-04`) created 17 events of 249 and enriched the 23,
    refusing 232 for unnamed classes. The second (`…-04b`) created nothing:
    it existed to write the refusals down. The third (`…-04c`) created the
    remaining 229. The brief allows one resume on a `b` branch after a
    failure; nothing failed, and this is a third run beyond what it
    anticipated.
141. **`--report <file>` and one line of the Action.** A run in the sandbox
    cannot read an Action's log — the log download host is refused by the
    session proxy — so what an import refused was unreadable from here. The
    tool now appends its report to a file and the workflow passes
    `docs/import-report.md`, truncated at the start of each job and committed
    with each batch. It is a file nobody asked for, and without it the 232
    refusals could not even have been *named* in this document.
142. **A batch with no items appends nothing to the report.** Found the hard
    way: the Action stops its loop when a batch changes no file, and a report
    that grew on every empty pass kept run `b` walking to the end of its
    `seq 1 40`. Fixed before run `c`.
143. **The import cursor was rewound twice, by hand.** `advance()` marks a
    refused item done, so re-reading the 232 meant editing
    `data/imports/wikidata-state.json` to drop from `done` every item that
    produced no record — the 91 that did were left alone so no call was spent
    on them twice.
144. **59 classes were added to the seeds table, all mapped to `event`.**
    Their labels are what the candidate list called the items refused under
    each, **not the class's own label**, which no run has read: the report
    gives an id and a count, not a name. Every entry carries a `note` saying
    so. The kinds are not in doubt — legislative elections, presidential
    elections, earthquakes, massacres, murders, bank robberies, referendums,
    treaties — but the labels are inferred and the owner should read them.
145. **Three candidates were refused for want of a lane**, not a class:
    Q2659185, Q3586973 and Q545449 name a location with no coordinate the
    index can reach and no place record here, and a placeless event must
    carry a region. They are the whole of the gap between 249 ticked and 246
    created.
146. **230 of the 246 new events are placeless**, carrying a region and no
    `place`; the other 16 point at a place record this atlas already had. The
    import creates no place for an event, by M16's design — a place record
    nobody asked for is a record nobody wrote.
147. **Two imported events are named after their item** — `q1454657` and
    `q2115000` — because those items carry no label in English or Portuguese.
    Their summaries say so. They are records waiting for a title, not
    records with a wrong one.
148. **A retracted event keeps the import's summary; it does not get a
    drafted one.** The M21 brief lists "summaries and actors done" alongside
    "wired or retracted", and the reading taken here is that a summary is for
    a record that stays. Writing three to six sentences of drafted history
    onto 59 tombstones would add exactly the kind of unreviewed claim
    `CLAUDE.md`'s exception is meant to keep scarce, and the import summary
    already says, correctly, that nothing in the record is this atlas's
    account of anything. The reason it was retracted goes in `review.note`
    instead.
149. **Four duplicates were `merged`, not `retracted`.** The brief knows two
    outcomes; rule 11 knows three, and for a record the atlas already holds
    under another id `merged` with `supersededBy` is the true one — it names
    the survivor instead of leaving a tombstone that points nowhere. The four
    are `portuguese-constitutional-referendum-1933` →`constitution-1933`,
    `1958-portuguese-presidential-election` → `delgado-candidacy-1958`,
    `assault-on-the-santa-maria-steamship` → `santa-maria-hijacking-1961`,
    and `wiriyamu-massacre` → `wiriyamu-massacre-1972`. They are listed in
    `docs/m21-retractions.md` with the retractions, and counted apart.
150. **Each merged record keeps the Wikidata id and Wikipedia links the
    import brought, and none of them was copied onto the survivor.**
    `constitution-1933` still carries no identity of its own. Whether an item
    about the *referendum* of 19 March 1933 is the right identity for a
    record about the *constitution* is a judgement, and M20's rule — no id
    written that the pass did not print — is about not making that kind of
    judgement quietly. It is a question for `review.html`.
151. **Wired events were given an exact `date` where the leads gave one.**
    The import only ever had the year, and three of the M21 edges run between
    two events inside a single year (the regicide and the election of April
    1908; the constitution and the presidential election of August 1911),
    which rule 4 can only order if both ends carry a date. No date was added
    that a cached lead did not state.
152. **New actors carry `where: null` explicitly.** Not a judgement about
    geography — `tests/bundle.test.mjs` requires every record to be byte
    identical to its own round-trip through the contribution form, and the
    form writes the key. Found by the test, which is what it is for.
153. **No M21 record references the CC BY-NC-SA actors the CShapes import
    created.** `spain`, `guinea` and the rest exist and would have been the
    natural counterparties for the Iberian Pact and the Guinean referendum,
    but no hand-written event has ever referenced one, and starting that
    practice touches the licence boundary `CLAUDE.md` draws hardest. So the
    Iberian Pact names Salazar and the Estado Novo and puts Spain in prose,
    and the Guinean referendum names Sékou Touré alone. **This is a question
    for the owner**: referencing an id copies no NC-SA text, and if it is
    allowed, several M21 events would be better for it.
154. **`partido-democratico` was kept off the 1908 election and a separate
    `partido-republicano-portugues` created.** The validator caught the
    anachronism — the atlas dates the Democratic Party from the split of
    1912 — and rather than widen that record's dates backwards, M21 wrote the
    party that actually won 229 of 234 seats in 1911 and dissolved into three
    in 1912. Both records name "Partido Republicano Português", because the
    Democrats kept the legal name; the summaries say why there are two.
155. **`treaty-of-windsor` was retracted and
    `guinean-constitutional-referendum-1958` kept, on a distinction worth
    stating.** Both had one fact behind two possible edges. Windsor's two
    would both have asserted that the Anglo-Portuguese alliance was live,
    against two different targets, with no book in the bibliography written
    about the alliance. The referendum's two assert different mechanisms — a
    rear base that lets a war be launched, an exile that leaves a leadership
    open to being killed — and MacQueen 1997 is about precisely that
    question. A reviewer who thinks the line was drawn in the wrong place has
    the reasoning in `docs/m21-retractions.md` to argue with.
156. **No edge was marked `disputed`.** The value is for a link qualified
    historians disagree about, and the run found none it could name a
    disagreement over without inventing the disagreement. Where sources
    conflict about a *fact* rather than a link — three dates and one
    magnitude — the conflict is recorded on the record and the record is
    retracted or annotated, not marked disputed. Disputes about death tolls
    (Batepá: about 1,032 São Toméan sources, about 200 Portuguese) are in the
    prose for the same reason.

157. **M22 works under a rule the owner set after M21 shipped.** On
    4 September 2026 the two-edge rule of the M21 and M22 briefs was replaced:
    one honest edge, in either direction, is enough to keep an event; only an
    event with no honest edge at all is retracted; and no edge is ever written
    in order to keep an event. M22 applies it to 1975 and after, and
    reinstates the M21 retractions that had one honest edge. Both briefs still
    say "two"; this line is what overrides them.
158. **Two dataset-dependent test counts moved, and nothing was relaxed.**
    `tests/graph.test.mjs` and `tests/horizon.test.mjs` assert what 25 April
    had led to by 2011 against the repository's own records, not a fixture:
    23 became 29 and the direct consequences 7 became 8, because the 1970s
    commit wired six events into that cone. The assertions are as strict as
    they were; the dataset under them grew. Any run that wires an event
    descending from 25 April before 2011 will move them again.
159. **M22 keeps deviation 153's practice: no record references a
    CC BY-NC-SA actor.** The natural counterparties for four of the 1970s
    events were `portugal`, `spain`, `mozambique` and `east-timor`, all
    created by the CShapes import under the non-commercial licence. Rather
    than start a practice the owner has not ruled on, the São Tomé election
    and the 1977 treaty name `third-portuguese-republic`, the Mozambican
    election names FRELIMO alone and the Timor massacres name Indonesia, whose
    actor record was written by hand. The states left out are in the prose.
    **Still a question for the owner**, and it costs more with every run.

160. **M22 corrected three values the import had written**, which no run had
    done before. `tools/import/identity.mjs` forbids the *import* from
    changing a value; it says nothing about a person or a run correcting one
    afterwards, and leaving a wrong date on a record because a tool wrote it
    would be the wrong reading of that rule. The three are the abortion
    referendum of 1998 (8 June → 28 June, against both cached leads), the
    killing at the Sacavém pottery works (2022 → 1982, against the Wikidata
    item's own description) and the title of the Social Democrat leadership
    ballot of 27 November 2021 (filed as 2022). Each carries a flag — `date`,
    `date`, `id-mismatch` — and the reason in `review.note`. The two Wikidata
    items are worth correcting upstream.
161. **The repetition principle, and what it is not.** M22 wires an
    institution at its foundation and at the ballot where it became a cycle,
    and retracts the routine repetitions after them, rather than attaching one
    argument — "the constitution of 1976 created elected local government" —
    to twelve ballots. The principle is stated at length in
    `docs/m22-retractions.md`. It is **not** a rule that repetitions are
    unimportant: the test is whether anything in the atlas follows, and where
    something does the record stays. Two cases prove it — the local election
    of December 2001, which brought down a government, and the three Madeiran
    regional elections of 2023, 2024 and 2025, which caused each other.
162. **The venue rule.** A treaty signed in Lisbon belongs to the history of
    what it settles. Eight records were retracted under it, the Treaty of
    Lisbon included, and that one will be argued with: it carries the city's
    name and was signed during a Portuguese presidency. The answer is that the
    missing record is the presidency of 2007, not the treaty — **a question
    for the owner** if the line is drawn in the wrong place.
163. **The reinstatement pass covered only what M21 itself named.** M22 read
    the fifty-nine M21 retractions and reinstated the seven whose own
    `review.note` identified a single argued edge, using that edge. It did not
    re-argue the other fifty-two from scratch. Batepá is the one that came
    back for a different reason — M21 retracted it for want of any São Toméan
    record, and M22's own 1970s commit created one — which means **M21's first
    finding is half-resolved**: Batepá and Mueda are wired, and the rest of the
    pre-war African gap is exactly where it was.
164. **Two new review flags.** `facts-thin` marks a record wired on less
    material than the atlas would like — the Timorese massacres of January
    1976, the two pandemic records — and says in its note what a reviewer must
    establish before signing. `id-mismatch` marks a record whose immutable id
    disagrees with its own content. Neither is in a closed vocabulary because
    there is not one; `build-index.mjs` reports the set in use.

165. **Rule 23 also checks the links, not only the citation marks.** The brief
    names the marks as the rule ("a body citation to an uncited source is an
    error") and says nothing about what happens when a `[text](event:some-id)`
    goes nowhere. It is checked and reported the same way: a link that goes
    nowhere is worse than no link, because it looks like a way through, and
    rule 3 already exists for exactly this. Both are reported at `/body`,
    because a body is prose and has no finer path than itself.

166. **The review digest's flag is `entry`, not `body`.** `DIGEST_KEYS` is the
    list of keys copied straight off the record, and a key named `body` would
    have copied the longest prose in the atlas into the index. `entry: true`
    is a name no record has, so the copy loop cannot pick it up, and
    `hasBody()` answers the same question of a record and of the digest that
    stands for it.

167. **Record links are text in the two previews, not links.** The preview
    sits inside a form with unsaved work in it, and a link that navigated away
    would cost the contributor the draft. What they need to know is whether
    the id resolves, and the notes under the preview say so in words —
    against the topology *and* the records in the same bundle, since a
    contribution may link to an event it is adding in the same breath.

168. **`findChrome` now looks in a versioned browser cache.** The candidate
    list held `/opt/pw-browsers/chromium/chrome-linux/chrome`, and a browser
    cache keeps one directory per build (`chromium-1194`), so the headless
    check the brief asks for would have skipped on the machine that has a
    browser installed. `tools/screens.mjs` scans
    `$PLAYWRIGHT_BROWSERS_PATH` for the versioned directories, newest first.
    Nothing about the site changed; this is a tool finding what is there.

169. **One fixture event gained a body; nothing under `data/` did.** The brief
    says every `body` ships empty, and every record under `data/` does.
    `tests/fixtures/data/events/fixture-event-a.json` carries a synthetic
    entry that exercises every construct of the subset and every refusal, so
    the page and the browser check have something real to render. It is
    fixture text and describes nothing that happened, like the rest of that
    directory.

170. **The timeline's click-to-set-the-year is gone.** The brief asks for two
    things that meet on the same pixel: a click on the empty ground of the
    lanes now clears the selection and the walked chain (fix 4), and that
    ground is a drag surface for the band (fix 2). A click that both moved
    time and dropped what the reader was holding would be two answers to one
    gesture, so the older of the two — "a click in the lanes means map at that
    year" — was retired. The year is still one double-click away (it snaps to
    the decade, as before) and "Map at 1911" is still on the event card.

171. **Only the selection and the walked chain are exempt from the box.** The
    brief says "the walked chain, the selected event and the lens always
    kept", which can be read as "the lens's events are never filtered by the
    box" — and under that reading the box would do nothing at all whenever a
    lens was on. It is read here as the lens *keeps removing*: the lens says
    which events exist, the box says which of them are on screen, and they
    compose. What no box removes is the open event and the steps of the chain,
    which is the part that would otherwise take a picture away from the reader
    mid-walk.

172. **No pinch on touch.** The brief asks for it "if it is cheap", and it is
    not: a second pointer means tracking two, and the wheel, the drag and the
    keyboard already reach every part of the band. A finger still scrolls the
    timeline (`touch-action: pan-y`) and drags the band sideways.

173. **The pin stops the filtering and does not move the map.** "Returns the
    timeline to the world" is a statement about the lanes, so `show the world`
    clears `bbox` and leaves the map where the reader put it; moving the map
    again narrows the lanes again. Flying the map back to where it started
    would have been a second, louder action nobody asked for, and the map's
    own double-click already does it.

174. **The never-stacked set is eight things, not the brief's five.** M25's
    brief names the selected event, the walked chain, the lens's events, the
    horizon's reachable set and a narrative's steps. Three more were added,
    for the reason the map has drawn them alone since M7: the far ends of the
    consequence links drawn at the open event, the **converging branches**,
    and the events of an open actor. The convergence query is the thing this
    project is for, and an answer hidden inside a mark that does not say it is
    an answer would be the atlas failing at it; the actor's events are
    emphasised in cobalt on all three pictures and a stack cannot carry that
    emphasis. Each is one line of the set built in `render`.

175. **"Far fewer nodes than events" does not hold yet, and the constant was
    not raised to make it.** The brief's done-when asks the default zoom to
    draw far fewer nodes than events. On this atlas it draws 113 of 134 with
    no grouping and 83 of 134 in region bands — fewer, not far fewer, because
    134 events over 126 years is roughly one a year and the picture is not
    dense enough to fold. `STACK_DISTANCE` is 13, derived as the map derives
    its own 16 (a little under 2 × the hit radius, which here is 8), and
    raising it to 20 or 30 would have bought the adjective by drawing as one
    mark two events a reader can plainly aim at separately. The count is
    asserted against the layout's output as the brief asks, both on the real
    atlas and on a 300-event picture at the density the feature was written
    for, where it draws 143 marks of 300. Nothing else in the done-when is
    affected: the stacks split on one wheel step, the badges sum to the total,
    merged lines carry their count and keep a dispute, a selection is never
    stacked, and the layout test asserts determinism with stacks.

Two notes that are not deviations. **No stack in the current data is
coincident**: two nodes at the very same point would need the same year, the
same band and the column resolver not to have spread them, which it always
does, so every stack the atlas draws can be pulled apart by zooming and the
panel-only path for one that cannot is a guard rather than a case. And the
graph still does **not** clear the selection on a click on empty ground — M24
gave that to the map and the timeline, and M25 did not widen it.

176. **M27 read "dependency" as colony, protectorate or mandate, and cut at
    the end of the held period rather than at the first independent date.**
    The brief's rule bolds *as a dependency* and names only **occupied** as
    the condition that does not split, so a protectorate and a mandate split
    like a colony; had it meant the literal status `colony` alone, twenty
    codes — Tunisia, Uganda, Qatar, Togo, the four mandates of the Levant and
    the rest — would have been covered by no bullet of the rule at all. Four
    consequences, all of them reversible by editing the mapping file and
    running the import again:

    - The cut is `dayAfter` the **last** held period that is not an
      occupation, not the *First independent* date the report prints. They are
      the same date for 69 of the 77; where they differ it is because the
      source draws no boundary at independence (Senegal 1959-04-04, Zambia
      1953-08-01, Taiwan 1945-08-15, Singapore 1963-01-01, East Timor
      1976-07-17) or because an occupation sits between the two, and an
      occupied state is the same actor, so that occupation belongs to the
      state's record: Cuba 1898-12-10 (not 1902-05-20), Iceland 1942-04-22
      (not 1944-06-17), Eritrea 1941-05-19 (not 1993-05-24).
    - An occupation *inside* the held period stays with the colonial actor —
      Libya 1943–1949, Tanganyika 1916–1922, Namibia 1915–1920, Cameroon
      1919–1922, Chad 1900–1920, the 1920 occupations of Iraq, Syria, Lebanon
      and Jordan. Cutting there too would give the state actor a life in two
      pieces, which the import's segments cannot hold.
    - **The mapping schema was not extended.** The brief offers a `title` on a
      split entry "if the tool cannot name a split actor from the source's own
      fields"; `names` already carries exactly that, is documented for exactly
      that in CONTRIBUTING, and is what entries 750 and 850 use, so a second
      field for one job would have been the deviation. The id and the name are
      composed mechanically — the code's slug, `under`, and the actor the
      source's own `owner` code is on that day — because CShapes never gives a
      held period a name of its own: it calls 452 "Ghana" in 1886 and in 2019
      alike, and there is no Gold Coast in the file to take a name from.
    - Where the source gives the held period under more than one power, the
      record is named for the one that held it **longest**: Libya under
      Italy/Sardinia, Bhutan under United Kingdom, the Philippines under the
      United States, Tanganyika and Swaziland under the United Kingdom,
      Namibia under South Africa. Naming them for the last holder would have
      made Bhutan a dependency of India and Libya of Britain, which the
      source's own dates contradict.


177. **"The link you followed" is a sixth section, first in the order.** The
    brief lists five and says nothing about what becomes of the last step's
    argument — its explanation, its supporting sources and its dispute —
    which the card carried as a block above the path. Dropping it would have
    contradicted the brief's own "nothing is removed from the card", so it
    became a collapsible section like the rest, with the disputed notice above
    it turned into a button that opens it. The section's header says
    "1 disputed" while closed, so a dispute is announced whether or not the
    reader presses that button. The default-open rule is otherwise followed
    literally: arriving through a disputed link still opens Consequences,
    because that is what the brief says arriving by walking a chain does.

178. **The breadcrumb marks only disputed steps.** The chain section it
    replaces put a confidence badge on every step, and that is right in a
    list; in a breadcrumb it is a row of badges nobody reads, which would
    make the one that matters harder to see rather than easier. Each crumb
    still carries its edge type in words, and a disputed step carries the
    badge.

179. **On a `popstate` what is *open* is taken from the URL rather than
    inherited, and a `restore` hook re-derives a narrative's step.** Not in
    the brief, and Back does not work without it: `popstate` called
    `parseState(search, state)`, so a field the URL does not name kept its
    current value, and going back from an actor's card to the event's left
    the actor open — Back could only ever add. The six opening fields and the
    chain now come from the URL alone; the window, the lanes and the layers
    still fall back to what stands, because a URL that does not name them is
    not asking for them to change. `restore` is `main.js` handing the store
    `openingState`, the same derivation the load path already used, so that a
    popstate onto a narrative's URL gets its selection and window back.

180. **A card with no consequences opens on its own history, and Territory is
    one section with two lists.** The brief's "otherwise Consequences" has no
    meaning on an actor's or a place's card, which have none: they open on
    "Where it appears" and "What happened here". And the actor card's
    territory was two card-level headings — the ground it held itself, and the
    ground it held through somebody else — where the brief names one section
    ("Territory"); the two became sub-headings inside it, counted together.

181. **M29's memberships are `allied-with`, and four other calls it had to
     make.** All five are the brief meeting a rule or a record that was
     already there.
     - **`member-of` could not carry a state in a body.** The brief asks for
       "`member-of` relations from `portugal`" and rule 19 refuses every one
       of them: its `from` end is a person. The brief's own instruction for a
       rule 19 refusal is to bend no kind, list the case, and leave the
       relation out — but the refusal here is total, not a matter of one
       awkward pairing, and leaving them out would have emptied the milestone
       and left the Union unrecorded beside an EEC membership that *is*
       recorded. So the memberships are `allied-with`, as the two that
       predate M29 already are, each with a note that says what it really is.
       The type question is an open question above, where the owner can
       settle it; nothing was restated as a different kind of actor.
     - **The European Union is a `polity`, not the `institution` the brief
       asks for.** `succeeded` requires both ends to be the same kind, and
       the Community it succeeds was already a `polity`. Making the Union an
       institution would have meant dropping the succession the brief
       explicitly wants. The record argues the substantive case too — a
       territory, an external border, a citizenship — rather than resting on
       the rule.
     - **The OEEC and the OECD are two actors joined by `succeeded`**, which
       the brief left to this run to decide. Membership and purpose both
       changed in 1961, and the atlas already closes the EEC at Maastricht
       instead of renaming it. The reason is in the OECD's summary, as asked.
     - **Four of the brief's eight candidate events already existed** —
       `imf-agreement-1978`, `imf-agreement-1983`, `troika-bailout-2011` and
       `euro-adoption-1999` — so only three were written. The **2002 cash
       changeover was deliberately not written**: `euro-adoption-1999`
       already states it, no work in the bibliography argues a consequence of
       it for Portugal, and the only available edge would have been "1999
       caused 2002", which asserts nothing. Under the one-edge rule an event
       with no honest edge is not written at all. The WTO was not added
       either: no event needed it, which is the condition the brief set.
     - **Four test assertions were updated, and no `src/` file was touched.**
       They pin counts of the live dataset that this milestone is meant to
       change: Portugal's card headings and relation count in
       `tests/actor-card.test.mjs`, and the 30-now-32 events reachable from
       25 April by 2011 in `tests/graph.test.mjs` and
       `tests/horizon.test.mjs` (Schengen 1995 and the CPLP 1996 are both
       downstream of the revolution and before the horizon). The card test
       gained an assertion rather than only losing one: the memberships must
       appear in date order, which is the brief's "done when".

## Dates to verify

Everything below was written from memory and is where the owner's review
should look first. The record's own summary says so in the worst cases.

**This list is now also data.** `tools/seed-review-flags.mjs` put it onto 95
records as `review: { flags, note }` — 93 `date`, 4 `figures`, 4 `claim`, 3
`place` — so `review.html` can filter by it. The prose below stays: it is
where a reviewer reads *why*, and it is what the table in that tool was
written from. The two do not update each other, so a correction here that
changes what wants checking has to be made on the record as well.

**Events, dates the assistant is least sure of:**

- `pimenta-de-castro-government-1915` — the appointment is given as
  January 1915; the day is not recorded.
- `monarchy-of-the-north-1919` — proclaimed 19 January, and given here as
  collapsing on 13 February. Both ends want checking, and so does whether
  the parallel Lisbon rising belongs in the same record.
- `legiao-portuguesa-founded-1936` — 30 September 1936, from the founding
  decree; check the Diário do Governo.
- `exposicao-mundo-portugues-1940` — 23 June to 2 December 1940.
- `constitutional-revision-1959` — August 1959; the month is a guess and
  the number of the law is not recorded here at all.
- `santa-maria-hijacking-1961` — 22 January to 2 February 1961.
- `botelho-moniz-coup-attempt-1961` — 13 April 1961.
- `delgado-assassinated-1965` — 13 February 1965 is the killing; the
  bodies were found in April. Check which date the sources use.
- `wiriyamu-massacre-1972` — 16 December 1972.
- `imf-agreement-1978` — May 1978.
- `imf-agreement-1983` — September 1983.
- `constitutional-revision-1982` — 30 September 1982.
- `soares-elected-president-1986` — 16 February 1986 (second round).
- `cavaco-absolute-majority-1987` — 19 July 1987.
- `expo-98` — 22 May to 30 September 1998.
- `bpn-nationalisation-2008` — 2 November 2008.

**The whole 2014–2025 batch, every date of it.** Nothing in M8 was checked
against a source: the run could not reach one. The dates as filed are:

- `troika-programme-ends-2014` 2014-05-17 · `bes-resolution-2014` 2014-08-03 ·
  `legislative-election-2015` 2015-10-04 · `geringonca-2015` 2015-11-26 ·
  `marcelo-elected-president-2016` 2016-01-24 · `euro-2016-final` 2016-07-10.
- `pedrogao-grande-fires-2017` 2017-06-17 to 2017-06-24 (the end date is the
  least certain of the two, and so is the figure of 66 dead) ·
  `october-fires-2017` 2017-10-15 to 2017-10-16 ("about forty-five" dead is a
  memory, not a count).
- `legislative-election-2019` 2019-10-06 · `covid-state-of-emergency-2020`
  2020-03-18 to 2020-05-02 (both ends, and the claim that it was the first
  under the 1976 constitution) · `marcelo-reelected-2021` 2021-01-24 (and
  "turnout below forty per cent") · `legislative-election-2022` 2022-01-30.
- `world-youth-day-2023` 2023-08-01 to 2023-08-06 (and the 2019 designation
  date in the source record) · `costa-resigns-2023` 2023-11-07 (and what the
  communiqué actually said, which the summary hedges) ·
  `legislative-election-2024` 2024-03-10 (and "about two seats", and Chega's
  twelve to fifty) · `montenegro-government-2024` 2024-04-02 ·
  `fiftieth-anniversary-25-april-2024` 2024-04-25.
- `government-falls-2025` 2025-03-11 · `iberian-blackout-2025` 2025-04-28 (and
  "around midday") · `legislative-election-2025` 2025-05-18 (and that the
  emigrant circles settled second place).

**The 2014–2025 actors**, founding and birth years all from memory:
`antonio-costa` 1961, `pedro-passos-coelho` 1964, `marcelo-rebelo-de-sousa`
1948, `luis-montenegro` 1973, `andre-ventura` 1983, `ricardo-salgado` 1944;
`partido-socialista` 1973, `psd` 1974, `cds-pp` 1974, `pcp` 1921,
`bloco-de-esquerda` 1999, `chega` 2019, `banco-espirito-santo` 1869–2014,
`novo-banco` 2014, `banco-de-portugal` 1846, `european-central-bank` 1998,
`european-commission` 1958. Only two carry a birthplace (Lisbon, for Costa and
for Rebelo de Sousa); the other four persons have `where: null` rather than a
guess. The three new places' coordinates are approximate, and
`central-portugal` is a point invented to stand for a burned belt that no town
names.

**The sources of the batch.** Two are works — the IMF's ex post evaluation of
the 2011 programme (2016) and Costa Pinto and Pequito Teixeira's *Political
Institutions and Democracy in Portugal* (2019); the exact titles, subtitles and
years want checking, and neither has an ISBN or a DOI in the record. The other
seventeen are official documents cited by repository and description, with no
number: see deviation 61.

**The relations of M11, every date of them.** The four `regime-of` intervals
and the three `part-of` ones follow the actor records they join, so they are
only as good as those. The rest were written from memory and are listed here
in full: `salazar` led the Estado Novo **1932–1968**; `marcelo-caetano`
**1968–1974**; `amilcar-cabral` led the PAIGC **1956–1973**;
`eduardo-mondlane` FRELIMO **1962–1969**; `mario-soares` the PS **1973–1986**;
`alvaro-cunhal` the PCP **1961–1992**; `cavaco-silva` the PSD **1985–1995**;
`marcelo-rebelo-de-sousa` **1996–1999**; `pedro-passos-coelho`
**2010–2018**; `antonio-costa` the PS **2014–2024**; `luis-montenegro` the PSD
**2022–**; `andre-ventura` Chega **2019–**. The five `member-of` intervals are
not membership dates at all (deviation 73). The two alliances are
`estado-novo`–NATO **1949–1974** and `third-portuguese-republic`–EEC
**1986–1993**, the second ending where the EEC actor record does.

**Actors, dates and places:**

- Birth and death years for `gomes-da-costa` (1863–1929),
  `paiva-couceiro` (1861–1944) and `pimenta-de-castro` (1846–1918) are the
  least certain of the twenty persons. Their `where` is deliberately
  `null`: the assistant would have been guessing.
- Founding years of the movements: `paigc` 1956 (founded under another
  name and renamed — check which year the record should carry), `mpla`
  1956, `fnla` 1962, `unita` 1966, `fretilin` 1974 (formed as ASDT and
  renamed the same year), `frelimo` 1962.
- `armed-forces-movement` is given 1973–1975 and
  `council-of-the-revolution` 1975–1982; both are conventions rather than
  dates in a document.
- `frelimo`'s seat is given as Maputo, though it was founded in Dar es
  Salaam; `eduardo-mondlane`'s birthplace is a point in Gaza province at
  `region` precision, not a village.
- `european-economic-community` is closed at 1993 (Maastricht). Whether
  the record should instead be open and renamed is an editorial choice.

Verified in headless Chromium for **M15**, driving the pages over the
DevTools protocol, with no console error on any page:

- Against `?fixtures=1`, where one event, one actor and one place were given
  a synthetic identity: **all three cards** show "Read more on Wikipedia" —
  `.../wiki/Fixture_article_A`, `.../wiki/Fixture_Actor_One` and, for the
  place, `https://pt.wikipedia.org/wiki/Lugar_de_fixture_A`, which is the
  fallback working, since that record has no English title. Typing
  `Lugar de fixture` into the search box finds the place, listed under its
  own name and not the article's.
- Against the **real** dataset, `review.html`: a queue row reads
  **"2 citations unverified"**; opening `afonso-costa` lists its two sources
  with their identifiers as links and the note "2 of 2 not opened yet. Sign
  warns about them; it does not stop you."; the boxes are **disabled until a
  reviewer's name is typed**, since a tick has to say who ticked it; ticking
  one stamps **"A Reviewer, 2026-09-04"** on the row, leaves the warning
  naming the one that is left, and **Save stays enabled** throughout. A
  `source` record opens with no verification list at all, having nothing to
  check.
- `about.html` renders with the new section in place and five licence
  bullets.

Verified in headless Chromium for **M14**, against the real dataset — thirty
assertions, every one passing, and no console error on any page:

- **The default**: the timeline draws all **80** events as **10** unlabelled
  packed rows at 1280px, with **0** overlapping bars; the graph draws **80**
  nodes and **no** bands.
- `?group=actor`: **13** lanes, the twelfth followed by **Other**, counts
  21, 16, 14, 11, 9, 8, 8, 7, 7, 6, 6, 6 — ordered, and every one of the 80
  events still drawn once.
- `?group=actor&lanes=salazar,paigc`: exactly **3** lanes, in the order
  given, Other last. `?group=place`: **13**. `?group=region`: the same
  **5** — Europe, Africa, Asia, Americas, Oceania — as before M14.
- `?focus=actor:salazar` draws **14** events on the timeline, **14** on the
  map and **14** in the graph, and the graph's node ids are exactly
  `eventsByActor.get('salazar')`. `?focus=place:lisbon` draws **54**, which
  is `eventsByPlace.get('lisbon')`.
- **The picker round-trips**: choosing a grouping writes `?group=actor`;
  unticking a lane writes the eleven that are left as `lanes=…`; ArrowUp on
  a row moves that lane in the list and in the drawing; the resulting URL
  opened cold gives the same lanes in the same order; "back to the automatic
  twelve" returns to `?group=actor` and thirteen lanes.
- **The event card states its lane**: "Drawn in the Estado Novo lane
  (heaviest of its actors). Also involves Armed Forces Movement, Otelo
  Saraiva de Carvalho, Marcelo Caetano, António de Spínola, Third Portuguese
  Republic." — and says it is in a packed row when there is no grouping.
- **The lens from the card**: "show only these" on Salazar's card writes
  `?focus=actor:salazar`, the header badge names him, the timeline follows.
  Searching "estado" inside that lens still lists PIDE and marks it
  **outside the lens**.
- `?fixtures=1`, the narrative at step 3, `about.html`, `sources.html`,
  `contribute.html` and `review.html` all load clean; a narrative opened
  with a lens on draws all 80 events, because reading suspends the lens
  (deviation 87).

Verified in headless Chromium for **M12**, against the real dataset, the
fixtures and the form — every assertion passing:

- **narratives** in the header lists the one narrative with its author line,
  its step count and its summary; clicking the title opens
  `?narrative=how-the-colonial-war-ended-the-regime&step=0`.
- Stepping through all twelve changes `selected` at **every** step, in order
  from `angola-war-begins-1961` to `25-november-1975`, and the URL stays
  `?narrative=…&step=<n>` and nothing else throughout.
- The chain grows 0, 1, 1, 2, 1, 2, 3, 4, 5, 6, 1, 2 — the two deliberate
  jumps in the walk are the two places it falls back to one.
- Twelve marks on the map and twelve bars on the timeline carry
  `of-narrative` at every step; in the graph view, twelve nodes and four chain
  edges at step 8.
- The arrow keys step forward and back, Escape leaves; `?step=99` opens at
  "step 12 of 12"; `?narrative=no-such-walk` says Not found.
- Clicking a mark while reading leaves the narrative and keeps what was
  clicked: `?from=1960&to=1976&selected=wiriyamu-massacre-1972`.
- The card for `carnation-revolution-1974` lists the narrative under **Part
  of**, though no step names that event — the walk reaches it through the link
  from Spínola's book.
- `contribute.html?fixtures=1` → **Add narrative** builds a two-step walk with
  one source and reports "The bundle validates against the records already in
  the atlas", with the submit control enabled.
- No console error on the atlas, `?fixtures=1`, `about.html`,
  `contribute.html` or `sources.html`.

Verified in headless Chromium for **M11**, against the real dataset, the
fixtures and the form — every assertion passing:

- `?actor=portugal` opens the card with **Relations 4**, one group headed
  **Regimes**, and the four regimes in order with their dates and notes:
  First Republic 1910–1926, Military Dictatorship 1926–1933, Estado Novo
  1933–1974, Third Republic 1974–ongoing. Each is a link.
- `?actor=salazar` shows **Led — Estado Novo, 1932–1968**, with the note that
  says why it starts a year before the regime does.
- Clicking the Estado Novo from Portugal's card gives `?actor=estado-novo`,
  whose relations read **Regime of · Parts of it · Led by · Allied with** —
  the same records, from the other end.
- `?actor=british-india` says **Succeeded by** and `?actor=indonesia`
  **Successor of**, which is the same pair of records read both ways.
- `contribute.html?fixtures=1` → **Add relation** gives the six fields (From,
  To, Type, Start year, End year, Note), the type list is exactly the closed
  six, and filling it in produces
  `fixture-actor-one--fixture-actor-two--member-of` in the bundle preview with
  no error on the entry.
- No console error on the atlas, `?fixtures=1`, `about.html`,
  `contribute.html` or `sources.html`.

Verified in headless Chromium for **M7**, against the real dataset and
`?fixtures=1`, driving real pointer, wheel and drag events through the
DevTools protocol — twenty-five assertions, all passing:

- `?view=graph` draws **60** `.node` and **73** `.edge` elements, each edge
  with its own arrowhead, **10** of them dashed as disputed, in **five**
  bands, with the map hidden and the Graph button pressed.
- The five types come out with five distinct line signatures (dash pattern
  and weight), read off `getComputedStyle`, not off the source.
- Sorting the nodes by their x sorts them by year, and every node sits in the
  band of its region — checked node by node against the topology.
- `?from=1960&to=1975&view=graph` fades **39** of the 60, and the set that
  carries `faded` is **exactly** the set outside the window; the window band
  is drawn.
- Clicking 25 November selects it and the panel opens it; clicking the
  constitution, which it leads to, appends the step —
  `?view=graph&selected=constitution-1976&chain=25-november-1975--constitution-1976--enabled`
  — and the chain is madder in the graph; switching to the map with the
  toggle shows the same chain madder there, and the URL drops `view=`.
- `?view=graph&selected=25-november-1975` highlights **16** converging nodes
  and 16 converging edges, the same 16 the panel's convergence section counts;
  25 April (`carnation-revolution-1974`) highlights **11**, likewise matching
  the panel.
- `/`-less search from the graph view: "sal" and Enter gives
  `?view=graph&actor=salazar` and emphasises his **14** events.
- A plain `?view=graph` opens unzoomed; `?from=1972&to=1976&view=graph` opens
  at zoom 2. Zoomed out, 14 labels; wheeled to 2.1, all **12** nodes on
  screen are named. A drag pans and does not select the node it ends on.
- `?fixtures=1&view=graph` draws the synthetic graph's 11 active events and 9
  active edges (one event is a tombstone and one edge retracted).
- No console error on the atlas, `about.html`, `contribute.html` or the
  fixture graph (the only 404 is `/favicon.ico`, which nothing asks for).

Verified in headless Chromium for **M10**, against the real dataset and
`?fixtures=1`, driving real clicks and typing through the DevTools protocol —
thirty assertions, all passing:

- Clicking the title in a citation on 25 April opens
  `?source=maxwell-1995-making-of-portuguese-democracy`, whose card lists
  **37 citers** — 12 events, 17 links, 8 actors — which is exactly the
  `citationCount` the sources index carries for it. Every one of the
  thirty-one sources was checked the same way in `node --test`.
- A dissenting citation is marked as one: `cne-legislative-2024` draws its
  7 citers with one **dissenting** badge, the citation an edge made from its
  `dispute.sources`.
- The precedence holds: `?source=…&actor=salazar` shows the source and keeps
  the actor in the URL; `?selected=…&source=…` shows the event and keeps the
  source; an unknown source says "Not found".
- `sources.html` lists **31 entries**, "31 sources, 31 of them cited, carrying
  1366 citations between them", and a title opens that source in the atlas.
  `sources.html?fixtures=1` lists the fixtures' 4.
- `?selected=carnation-revolution-1974&horizon=2011` opens the horizon folded
  out, lists **23** events, and lights **9 marks** on the map and **11 bars**
  on the timeline (the rest are inside stacks, lit at their nearest member's
  band: 5 near, 3 mid, 3 far) and **23 nodes** in the graph view.
- Choosing the constitution walks the three-step path to it — the URL carries
  the chain, the panel draws 4 steps and then **14** other branches into that
  endpoint, which is convergence asked from the other direction.
- The default horizon is folded, filled in with **2025**, and lights nothing.
  Typing 1976 writes `?horizon=1976` and narrows the list to 11; "back to the
  window's end" removes the parameter again.
- Searching "telo" offers a **Sources** group above an **Actors** one and
  opens `?source=telo-2007-historia-contemporanea`.
- `?fixtures=1`, `about.html` and `contribute.html` still render, and there is
  no console error on any page (the only 404 is `/favicon.ico`, which nothing
  asks for).

Verified in headless Chromium for **M9**, against the real dataset and
`?fixtures=1`, driving real clicks and keys through the DevTools protocol —
twenty-five assertions, all passing:

- The map is unchanged to the eye: **13 marks** at `k = 1` and the Lisbon mark
  still carries **+42**, exactly as before the migration.
- `?place=lisbon` opens the card and lists **37 events**, with the actors who
  turn up there most. `?place=lisbon&from=1960&to=1975` keeps all 37 in the
  list and fades the ones outside the window rather than hiding them.
- The place is reached three ways: the place name on an open event
  (`?selected=carnation-revolution-1974` → "Lisbon" → `?place=lisbon`), the
  heading of a stack of marks on the map, and the search ("lisbo" offers a
  **Places** group; Enter opens the card).
- The precedence holds: `?place=lisbon&actor=salazar` shows the place,
  `?place=lisbon&selected=…` shows the event and keeps `place=` in the URL, and
  an unknown place says "Not found".
- The graph view still draws its 60 nodes; `?fixtures=1` still draws; the form
  offers every place in the atlas on an event and can add a new one.
- No console error on any page (the only 404 is `/favicon.ico`, which nothing
  asks for).

Verified in headless Chromium for **M8**, against the real dataset, the
fixtures and the three static pages — sixteen assertions, all passing:

- `?to=2025` draws **181 outlines** and says "borders as of 2019, the latest
  the source covers"; `?to=2019` draws the same 181. The clamp M6 built is
  right, and this is the first time the dataset could reach past the last
  shard to prove it. Part 5 of the brief needed no code.
- The timeline reaches 2025: the window handle's `aria-valuemax` is 2025.
- `?from=2014&to=2025` draws **two marks**, one of them a Lisbon cluster
  carrying `+18`, and nothing else — exactly the twenty new events, nineteen
  of them within merge distance of Lisbon and the twentieth at Saint-Denis.
- The graph view draws **80 nodes and 91 edges**, **12** of them dashed as
  disputed.
- `?selected=government-falls-2025` opens the confidence vote in the panel,
  `?place=saint-denis` opens the new place (48.94, 2.36, city, Europe), and
  `?actor=chega` opens a party added in this batch.
- `about.html`, `contribute.html` and `?fixtures=1` still render, and there is
  no console error on any page (the only 404 is `/favicon.ico`, which nothing
  asks for).

## Where things live

- Repo: `~/atlas-causal`, branch `m0`.
- Pull request #1: https://github.com/goncalojacob/atlas-causal/pull/1 — its
  body is **61,190 of GitHub's 65,536 bytes** after M24. Each milestone
  that adds a section pays for it by cutting an older one to a summary that
  points here: M8 cut M5's, M11 cut M7's, M12 cut M9's, M13 cut M10's, M14
  cut M11's, M15 cut M12's, M16 cut M13's, M17 cut M14's, M23 cut M20's and
  M8's, and **M24 cut M21's** (5.0 KB down to 1.2 KB) to pay for its own
  2.9 KB. That leaves **4.3 KB of headroom**. M22's section is 18.8 KB, far
  the largest and the obvious next cut; M4's, M6's and Map usability's are the
  longest left written out.
  A `#### Checks for Mn` heading contains the string `## Checks`, so an
  insertion anchored on the top-level section has to search for
  `\n## Checks\n` and assert it found exactly one. Editing the body from a
  run means sending the whole 60 KB back, which is more text than a session
  can retype faithfully: read it to a file with `curl` and `$GITHUB_TOKEN`,
  edit it with a script that asserts the result is under 64 KB and still
  carries its new and its old headings, and PATCH it as
  `--data-binary @patch.json`. Never hold the body in a shell argument.
- Architecture page (artifact, now **behind** the repo file — revision 2;
  `ARCHITECTURE.md` is the source of truth):
  https://claude.ai/code/artifact/b3940d66-ad98-4de9-9bfd-aff8c77e6f36
- Assistant memory: `~/.claude/projects/-home-gjacob-atlas-causal/memory/`
  (and a copy under `-mnt-c-Users-gonca` pointing here).
- Build briefs: `docs/m0-brief.md`, `docs/m2-brief.md`, `docs/m4-brief.md`,
  `docs/map-brief.md`, `docs/m5-brief.md`, `docs/m6-brief.md` and the M7–M13
  briefs beside them — `docs/m14-brief.md` arrived on the `brief-m14` side
  branch, so that writing it did not disturb the running chain, and was
  copied onto `m0` by the run that built it; `docs/m15-brief.md` and the
  briefs for M16, M17 and M18 arrived the same way on `brief-m15`, with
  `docs/review-2026-09-04-plan.md` and the amended run protocol;
  `docs/m19-brief.md` arrived on `brief-m19` and was copied onto `m0` by the
  run that built it; the adversarial review is `docs/review-2026-09-01.md`
  and the plan review `docs/review-2026-09-03-plan.md`. The run protocol the
  overnight runs follow is `docs/run-protocol.md`.
- **Which CShapes entities could be split into a colony and a successor
  state**: `docs/cshapes-entities.md`, 89 of them, generated by
  `node tools/import/cshapes.mjs --source <file> --report`. Splitting one is
  an entry in `data/imports/cshapes-actors.json` and a re-run of the import;
  never a hand-edited presence.
- **What the Wikidata import is pointed at**:
  `data/imports/wikidata-seeds.json` — items, queries and the table saying
  which Wikidata class becomes which kind of record. After M20 it names 323
  items (the 74 records already carrying an id, then the 249 ticked
  candidates the atlas did not hold) and 84 classes, 59 of them added from
  the import's own report. `data/imports/wikidata-state.json` is the cursor
  a cut-off run leaves behind, one entry per mode, written by the tool —
  M20 rewound it by hand twice, to re-read what a run had refused.
- **What the last import run did**: `docs/import-report.md`, written by
  `--report` and committed by the Action batch by batch. It describes that
  run only — the job truncates it at the start — and it exists because the
  cloud run that pushes an `import/` branch cannot read the job's log.
- **The Wikidata import runs only on a runner.** There is no network in the
  sandbox the milestones are built in. It runs in
  `.github/workflows/import-wikidata.yml`, triggered by pushing a branch
  called `import/reconcile-<date>`, `import/candidates-<date>` or
  `import/run-<date>` from `m0`; the job commits to that branch, and a run
  fast-forward-merges it back. Nothing it writes reaches `m0` any other way.
- The CShapes source file is **not in the repository** (7.6 MB, and not
  ours to redistribute). `data/geo/LICENSE` and the header of
  `tools/import/cshapes.mjs` say exactly where it came from and what its
  sha256 is; the tool refuses a file that is not that one.

## Uncommitted

Nothing.

## Milestones landed

M6 started 2026-09-03T17:06:55Z by scheduled
M6 done

M7 started 2026-09-03T18:20:47Z by shepherd
M7 done

M9 started 2026-09-03T19:20:45Z by shepherd
M9 done

M8 started 2026-09-03T20:22:00Z by shepherd
M8 done

M10 started 2026-09-03T21:21:00Z by shepherd
M10 done

M11 started 2026-09-03T22:21:09Z by shepherd
M11 done

M12 started 2026-09-03T23:21:25Z by shepherd
M12 done

M13 started 2026-09-04T00:21:17Z by shepherd

M13 started 2026-09-04T02:21:01Z by shepherd
M13 done

M14 started 2026-09-04T09:00:57Z by scheduled

M14 done

M15 started 2026-09-04T09:30:40Z by scheduled

M15 done

M16 started 2026-09-04T10:20:57Z by shepherd
M16 done

M17 started 2026-09-04T11:23:24Z by shepherd
M17 done

M18 started 2026-09-04T12:23:01Z by shepherd
M18 done

M19 started 2026-09-04T15:25:36Z by scheduled
M19 done

M20 started 2026-09-04T19:45:49Z by scheduled
M20 done

M21 started 2026-09-04T21:01:06Z by scheduled

M21 done

M22 started 2026-09-04T22:23:00Z by shepherd

M22 done

M23 started 2026-09-04T23:21:03Z by shepherd
M23 done

M24 started 2026-09-05T00:20:55Z by shepherd
M24 done

M25 started 2026-09-05T01:06:07Z by scheduled
M25 done

M27 started 2026-09-05T01:06:43Z by scheduled (branch m27)
M27 done

M26 started 2026-09-05T01:28:21Z by scheduled
M26 done
M29 started 2026-09-05T01:29:00Z by scheduled (branch m29)
M29 done
