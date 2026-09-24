# Build brief — M42: the world at scale

The owner's request of 5 September 2026 was *"do not use synthetic events, go
on Wikipedia and complete with real events all over the world"*, and it was
deferred until everything else was built. Everything else is built. On
16 September the owner also settled the question the whole milestone turns on:

> **"World atlas, we started with Portugal just as a starting point."**

and gave the reason this milestone is now the priority rather than the last
item:

> **"The goal right now is to have a more complete dataset so that it's easier
> to analyze it and understand what improvements need to be made."**

So M42 is not polish and it is not the finishing touch. It is the run that
gives the atlas enough of a corpus to be judged. **Volume first; the
improvements come from looking at what the volume shows.**

Read `CLAUDE.md` (the hard constraints; the dated exception for AI-drafted
world context; that the atlas is in English), `STATUS.md` (the top, and M44a's,
M44b's, M44c's, M46's and M47's accounts), `docs/run-protocol.md` **including
its amendments**, `docs/m44-brief.md` **whole, with its Amendments after
review**, `docs/m44-connections.md`, `docs/m44-retractions.md`,
`docs/m47-parents.md`, then `tools/import/wikidata.mjs`,
`data/imports/wikidata-seeds.json`, `data/imports/wikidata-state.json`,
`docs/wikidata-candidates.md`, `.github/workflows/import-wikidata.yml`,
`src/validate/rules.js`, `data/regions.json` — and this file including its
"Amendments after review" if one is present, which override the body where
they differ (run protocol §3).

## 0. What is here now, and what "complete" would mean

**513 event records and only 250 of them active.** 263 are tombstones, 50 of
them retracted by M44b for failing a rule this brief retires. Of the 250
active, **249 are `review.status: draft`** — which is the atlas's normal state
and, by the owner's decision of 16 September, **no bar to being drawn**:

> **"They can stay unreviewed for now and can be shown on the Atlas, the
> important thing is to have lots of events on the map."**

Nothing in this milestone gates display on review, and nothing needs to: the
map already draws drafts, every record says it is one, and `about.html`
explains what that means. **Keep it that way.** The honesty of this atlas rests
on the marking, not on withholding.

## 1. The bar, and why M44b's is retired

M44b's rule was that a record must reach a **Portuguese** event within two
hops, and it retracted 50 of 82 imports for failing it. **That rule dies with
the Portuguese scope.** A world atlas cannot ask every event to reach Lisbon.

**The new bar: a record earns its place by carrying at least one honest edge to
anything already in the atlas.** That is M40b's rule, and it is the right one
for a world corpus. The second half stands exactly as it has stood since M40b
and must not be softened: **nothing is written in order to keep a record.** A
`precondition-of` from every twentieth-century war to the Cold War would clear
any queue and say nothing true. A record that cannot earn an edge is retracted
with its reason.

**Portuguese reach becomes a measurement, not a gate.** Keep reporting it —
`docs/m44-connections.md`'s script still runs — because it is the clearest
single number for how connected the corpus is, and a world atlas that happens
to have a dense Portuguese core is worth knowing about. But it decides nothing.

## 2. Before importing anything: the fifty come back

**M42a's first act is to reinstate the 50 events M44b retracted**, because they
were retracted under a rule that no longer exists. They are in the repository
now, with their full text, their sources and their reasons; bringing them back
is nearly free and it is the cheapest 50 events this milestone will ever get.

Each is found by its `retraction.reason` naming M44b. For each: **re-read it
against the new bar.** If it carries an honest edge to anything here, or can
take one, it comes back — `status: active`, the `retraction` block deleted
(rule 27), and **its reason copied verbatim into `docs/m44-retractions.md`
under "Reinstated"**, which is the procedure M44's amendment A11 established
and M44b already followed for eleven actors. If it still cannot earn an edge
under the *new* bar, it stays retracted and the reason is rewritten to say so,
because a tombstone citing a retired rule is a lie about why the record is not
here.

Report how many of the 50 came back. **This is the milestone's first and most
efficient win and it happens before a single new record is fetched.**

## 3. The import

Wikidata by class and period, sitelinks as the rank, exactly the machinery
M44a used and M46 extended. **Batches the Action can finish** — M44a's ran in
minutes and M46's in two batches; an import that needs six hours of runner time
is the thing deviation 442 says stopped this repository for a day, and it is
not to be repeated. Each batch merged with an index rebuild, `--index` clean.

**Periods.** 1890–2025 first, because the interface is proven there and the
existing corpus is there to connect to. **Then earlier**, as far as M43a's
territories reach — the timeline can hold five centuries since M43b and the map
can draw borders back to 1415 once M43a lands, so pre-1890 events now have
somewhere to sit. Do not import a period whose ground the map cannot draw.

**Coverage is the point.** Every region, not every region that touches Europe.
`data/regions.json` has five lanes and M46 found nine candidates that are *a
subject rather than a place* — that limit is known and is not this run's to
fix; refuse and list, as M46 did.

**Every record is `origin: wikidata`, `review.flags: ["imported-facts"]`,
`review.status: draft`, and carries what the import found and nothing you
added.** The summaries come from the import. **You write no historical claim**
— not a date, not a name, not a sentence about what happened. Where the import
gives nothing usable, the record is refused, not furnished.

## 4. The connection pass

M44b's lesson, measured: it wrote about forty edges by rule and moved the
stranded count by 2; M44c wrote **two** edges chosen by reading and moved it by
2 more, because they attached to the old corpus rather than to the new records.
**Edges chosen by reading are worth many times edges written by rule.**

So the connection pass is not "one edge per new record". It is: read what
arrived, find the joins that matter, and write those. Every edge carries the
sentence that argues it, in `docs/m42-connections.md`, one row each.
**`consensus` requires two sources by different authors (rule 9) and rule 22
only tests the two Wikipedia sources** — so an edge resting on Wikipedia alone
is `probable`, and you may not invent a bibliography to promote it. The counts
that go in `STATUS.md`: records kept, records retracted by reason, events with
no edge at all (it was 92 before M44b and 10 after; say what it is now).

## 5. The Holocaust, divided

`the-holocaust` is dated 1933–1945 and therefore cannot be an effect of a war
that begins in 1939 — rule 4 refuses the edge, and the record has no incoming
edge at all because of it. The owner's decision of 16 September:

> **"Why don't you divide it in two?"**

**Two records**, because they are two things: the persecution that begins with
the regime, and the extermination that begins during the war. Each takes its
own dates from its sources, each supersedes nothing (the existing record is
superseded by the pair, `supersededBy` pointing at the one that inherits its
edges), and `world-war-ii --enabled--> <the second>` becomes both datable and
true. **Take the dates from the import or from a source you can open; do not
supply them from memory.** If the sources will not give a defensible boundary,
say so and leave the record whole — the owner's instruction is to divide it,
not to invent a date on which to divide it.

## What this run must not do

- **No historical claim written by the assistant.** The dated exception in
  `CLAUDE.md` covers drafted *context* for imported records; it does not cover
  inventing an event, a date, a name or a boundary.
- **Nothing written in order to keep a record.**
- **No display change.** M42 is data. The interface is M43b's and M37's.
- **No new runtime dependency, no build step, no map library, no tiles.**
- **Nothing merged into `main`.** `docs/drafts/` is ignored.

## Tests

1. The reinstatement is reversible and accounted: a test that every record
   whose `retraction` block was deleted appears under "Reinstated" in
   `docs/m44-retractions.md`.
2. No test pins a count of records, events or edges. Four runs this week met
   such a test and each rewrote it to assert the rule (`ffd737c`, `522e79e`,
   `00009dce`, and eight at once in M43b). **This milestone multiplies the
   corpus; a test that memorises it will break.**
3. The import's refusals are classed and counted, as M44a's were.
4. `tests/spine-pages.test.mjs` still shows first paint unchanged: a corpus ten
   times the size must not cost the reader a byte before the first picture.
   **This is the assertion most likely to fail and the most important one.**

## The sub-runs

- **M42a — the fifty, and the first period.** Reinstate what M44b retracted
  under the retired rule; then import 1890–2025 by class, in batches, with the
  connection pass for what arrives. Done line `M42a done`.
- **M42b — earlier periods.** Gated on `M43a done`, because a period whose
  borders the map cannot draw is not imported. Done lines `M42b done`, then
  `M42 done`.

Each sub-run is a separate routine and each may take several fires; the import
Action is long and a fire that finds it running waits rather than starting a
second.

## Done when

The atlas holds an order of magnitude more active events than the 250 it holds
today; every one of them is `draft`, `imported-facts`, and carries an honest
edge or a reason it does not; `docs/m42-connections.md` argues every edge;
first paint is unchanged; `node tools/validate.mjs --index` reports zero
errors; the counts are in `STATUS.md`; `M42 done`.

## Deviations this brief takes, numbered on from 717

The last deviation on `m0` is 717. M42a numbers from 718.

## Amendments after review

**A1 (20 September). The numbers in §0 are stale and the run must re-measure
them before anything else.** §0 says 250 active events; there are **309**, and
M62 and M67 have given many of them parents. The first commit of the run is the
measurement, in `docs/m42-pool.md`.

**A2 (20 September). The seed pool is exhausted.** `data/imports/wikidata-seeds.json`
holds eight seeds and every one has been walked. The next batch comes from the
sweep the tool already has — `node tools/import/wikidata.mjs --candidates`,
writing `docs/wikidata-candidates.md` — and **the run ticks candidates from that
sweep, not from seeds**. A candidate is imported under the owner's decision of
16 September: Wikipedia and Wikidata, `probable`, `consensus` only through a
work Wikipedia itself cites.

**A3 (20 September). Volume without parents undoes M65.** Since M65 the resting
picture is the main events only, and every event imported without a parent
lands on it. **A batch that adds two hundred main events makes the map a wall
again.** So the run files what it imports as it imports it, under M62's rule —
inside the span *and* inside the subject — and reports in `STATUS.md` how many
of the new events are main against how many have a parent. **An import that
leaves the main count higher than it found it has to say why.**

**A4 (20 September). The owner has authorised the whole backlog**, so the
brief's own "wait for the owner" clauses no longer bind — with the standing
exceptions: no AI-written historical claim outside the dated exception, no
invented date, and nothing merged into `main`.

**A5 (21 September). Volume must connect, not only file.** The owner: *"the
goal is to have chains throughout the globe and time."* M44 imported 82
events and left 45 of the world's events stranded because it wrote edges
only among its own new records. **Every batch this run imports writes its
edges to what already exists as well as to itself**, each from the source
that supports it, under the confidence rules; and `docs/m42-pool.md` reports
**the largest connected component of the causal graph before and after each
batch**, because that is the number "chains throughout the globe and time"
actually is. A batch that grows the corpus and not the component has to say
why.

**A6 (21 September). The resting timeline must be readable, and that is a
records question before it is a display one.** The owner, with a screenshot
of the timeline at 435 active events: *"the timeline has too many events. As
it is right now it is useless. For it to be useful it should only show parent
and main events and the title for the events. For example, sometimes
historians call interwar period for the years between WW1 and WW2, you could
only show that for Europe (there are other important events for other parts
of the world of course) and then when you click on it it can show you
everything that happened during that time."* After batch 14 the corpus is 435
active and **335 main** — the imports arrive as main events and stay main, so
the resting picture is nearly the whole corpus and A3 has not held in
practice.

**Two things change from the next fire.**

First, **a period is an umbrella when historians name it as one.** M67
refused the Soviet period because being a party to a thing is not being part
of a period; the owner has now asked for exactly the period umbrella, scoped
to a region: *the interwar period, Europe, 1918–1939*. So: **a period that
Wikipedia has an article for, with a span and a region or polity, is a
legitimate umbrella**, sourced as any record is (Wikipedia and Wikidata,
`probable`), and a main event whose place or actors are in that region and
whose dates are inside the span is filed under it — M62's span-and-subject
property, with the region as the subject. M67's rule 1 stands (a period
named for a form of government does not contain the act that created or
destroyed it), and a war is still its own umbrella by its fighting. Where a
period would nest inside another period (the interwar period inside the
twentieth century), choose the one historians use and do not nest periods
more than one deep. Other parts of the world get their own periods — the
owner said so — chosen the same way, from what Wikipedia names for that
region and time; the run does not invent a period that has no article.

Second, **the next fire is a filing pass before it is an import.** Before
importing anything more, create the period umbrellas the existing 335 main
events call for, file under them, rebuild, push; `docs/m42-pool.md` reports
the main count before and after, by region. **From then on every batch
reports the main count and it must not rise**: an import that leaves the
main count higher than it found it has to say why (A3, now with teeth). The
target is a resting timeline a reader can take in — main events in the low
tens per century, not the hundreds — and the run says each fire how far it
is from that.

The display half — every bar titled, an umbrella opening on click, grouping
removed — is lane A's M77 and is not this run's.

**A7 (22 September). A run may widen an imported interval from the record's
own cited article.** The owner, asked in one sentence — *may a run widen an
imported interval from the record's own cited article?* — answered: *"I
agree."* So the three intervals earlier fires assigned to a person
(`chinese-civil-war`, `turkish-war-of-independence`, `the-troubles`) and any
like them are the run's to correct: **read the span from the Wikipedia
article the record already cites**, at a named revision, write it with the
locator, keep the `date` flag's note saying what was changed from what and
why, and clear the flag. Reading a cited source is not inventing a date; the
standing exception is untouched. An interval the cited article does not
state stays as it is and stays flagged.

**A8 (22 September). An event may be part of several umbrellas — once `M79
done` is on `origin/m0`.** The owner: *"Can't we have many umbrellas for the
same event? For example, the angola independence is both under the
Portuguese third republic and african decolonization."* M79 (lane A) makes
`parent` a list. **From the first fire after `M79 done` is on `origin/m0`**:
a filing writes every umbrella whose span and subject fit, not the first;
the existing filed events are re-read once for a second parent they were
denied (the pass says how many gained one); and **the decolonisation of
Africa is an umbrella**, with the span its Wikipedia article states and the
revision cited — the owner asked for it by name. Until `M79 done` is on
`origin/m0`, a record still has one parent and this amendment waits.

**A9 (22 September). An imported event gets the place its item names.** The
owner, focused on the Russo-Ukrainian war and looking at an empty map: *"it
should show children events on the map in case they have a place."* 435 of
the 444 placeless active events are the import's, and they are placeless by
the import's own rule — *"an event whose location is not already a place of
this atlas is placeless and takes a lane instead"* — written when creating a
place record was creating a record nobody asked for. **The owner has now
asked for it.** From the next fire, a **place pass** and then the rule for
every batch after it: for each active event with no `place` and a Wikidata
item, read `P276` (location), then `P131` (administrative territory), then
`P17` (country), in that order, and **the first item that carries `P625`
becomes the event's place**: an existing place record with that item is
reused; otherwise the import writes one, with the point, the label, and
`precision` `city` for a settlement or `region` for anything larger that is
not a state. **Until `M80 done` is on `origin/m0`, an event whose only
located thing is its country stays placeless** — M80 adds the `country`
precision and the mark that draws it; from then on the country's point is a
place too, at that precision. The pass reports how many events gained a
place at each precision and how many are still placeless and why, in
`docs/m42-pool.md` under `## Places (A9)`. Nothing invented: a point comes
from `P625` or the event stays placeless.

**A10 (22 September). The world, not Europe.** The owner: *"the platform has
mostly events related to Europe. We want the whole world, Africa, Asia,
South America."* The filing pass measured it: before A6, main events by lane
were **Europe 190, Asia 73, Africa 44, the Americas 63**, and the active
corpus leans the same way. From the next fire **every batch is taken from
the lanes that trail**, in this order of need — Africa, South America (the
`americas` lane south of the Rio Grande, said as such in the batch note),
Asia — until each of the three holds at least as many active events as
Europe held on 22 September (whatever `docs/m42-pool.md` measures Europe at
that morning). Europe takes a batch only when it is the lane a chain
crosses into. The candidates sweep (A2) is re-ranked by lane before by
sitelinks; the seeds file gains the regional periods A6 asks for where a
lane has none (Latin America's, Asia's), each from its Wikipedia article.
**Every batch note reports the active and main count per lane**, and
`docs/m42-pool.md` keeps a running table. Umbrellas (A6), places (A9) and
second parents (A8) apply to each batch as before.

**A11 (22 September). The curation fire, and the partition with M42b.** The
owner, leaving for a week: *"The curation should be, every now and then,
fired to analyze all events globally"*; *"the site must keep growing until I
get back, no matter how many events it has already"*; *"run as many things
in parallel as feasible"*; *"we are not looking for accuracy but instead to
have a demo"* — so what a run can settle from a cited source, it settles,
and nothing waits for a person. Three things.

*The curation fire.* **The first fire after 02:00Z each day is a curation
fire and imports nothing.** It reads every active event and fixes, from the
record's own cited sources or its Wikidata item, what is missing or wrong:
a summary absent or shorter than two sentences (from the Wikipedia lead at
a named revision); a place Wikidata knows (A9's rule); an actor named as a
participant (`P710`) that the atlas holds; a parent whose span and subject
fit (A6, A8); an edge the article's lead states in so many words, with its
locator (A5, M72); an interval the article widens (A7). It reports the
counts of each kind fixed and left, under `## Curation <date>` in
`docs/m42-pool.md`, and it must leave the main count no higher. **The first
curation fire also writes every polity's description**: for each actor that
is a state or a polity, a summary with the approximate area (`P2046`) and
population (`P1082`, the latest year) from Wikidata, and two or three
sentences of geopolitical context from its Wikipedia lead, each cited at a
revision — the owner: *"each country should have a short description
mentioning approximate area, population and a bit of context on its
geopolitical situation."*

*The partition.* A second records lane, **M42b on the branch `m42b`**, runs
beside this one so the world grows twice as fast. **M42 takes Africa and
Asia**, every century; **M42b takes the Americas, every century, and Europe
before 1900**. Neither imports an item the other's lane owns; a chain that
crosses lanes is followed by whichever run found it, and the other run
reads `origin/m42b` (or `origin/m42`) before a batch to skip what is
already there. The curation fire belongs to M42 alone and covers every
event, whichever lane wrote it.

*No ceiling.* The owner: *"no ceiling."* This milestone has no done
condition until the owner writes one; the assistant lands a snapshot of
`m42` and `m42b` into `m0` every day.

**A12 (22 September). What the review measured, settled from the sources
already on disk.** `docs/review-2026-09-22.md`, part C, over 582 active
events. In this order, each as its own pass with its section in the pool
file and its counts before and after, **before any further import**:

1. *C1 — summaries.* 316 active events show the import's placeholder as
   their summary and 313 of them have the English Wikipedia lead cached at
   a named revision under `tools/import/cache/wikipedia/`. Write the cached
   lead as the summary with a `wikipedia-en` citation at that revision and
   the `summary-drafted` flag, the shape 126 records already have. Add the
   validator warning `summary-imported` for any placeholder left. No
   network needed.
2. *C2 and A9 — places.* 221 placeless events carry "derived from its own
   point": the item had `P625` and the import used it for the lane and
   wrote no place. **A9's pass reads the item's own `P625` first**, then
   `P276`, `P131`, `P17`; `placeRecord()` writes `precision` from the item's
   class (`city` for a settlement, `region` for anything larger that is not
   a state, `point` for a battlefield or site, `country` once `M80 done` is
   on `origin/m0` — it is), never a hard-coded `point`.
3. *C3, C4, A7 — intervals.* `intervalFor()` prefers `P580` (start time)
   over `P585` (point in time) for `from`, and a missing `P582` becomes the
   flag `end-unstated`, never `end: null` asserted as ongoing. Then the A7
   pass driven by the reviewer's comparison: every record whose span
   disagrees with the year range in its cached lead's title or first
   sentence (29 found, 17 real: `cambodian-vietnamese-war`, `rif-war`,
   `wadai-war`, `german-revolution-of-1918-1919`, `insurgency-in-kosovo`,
   `great-depression`, `indochina-wars`, `la-violencia`,
   `south-sudanese-civil-war`, `tambov-rebellion`, `2011-bahraini-uprising`
   and the rest the measurement lists) is widened from the article at its
   revision, with the note. Keep a `span-vs-article-title` warning.
4. *C5 — actors.* The import reads `P710` (participant) and drops it: one
   rule maps a participant that the atlas holds as an actor to the event's
   `actors` with the role the vocabulary has for it; the pass applies it to
   the 274 active events naming no actor.
5. *C7 — titles.* `titleFor()` keeps the article's disambiguator; the three
   "Afghan Civil War" and two "Treaty of London" are retitled from their
   articles.
6. *C6 and A11 — the polities' descriptions.* Only 6 of 2,519 polities carry
   a Wikidata item, so A11's description pass cannot run as written. **The
   first curation fire reconciles the polities that active events name**
   (81) to their Wikidata items through the import's own identity tools,
   then writes their descriptions (area `P2046`, population `P1082`, the
   lead's context, each cited); the other polities wait until an event
   names them.

What needs a person stays listed (C6's page-less book citations, C8–C13).
The measurement scripts the reviewer left are under the assistant's
scratchpad and are quoted in part C; reproduce the numbers before and after
each pass with your own.

**A13 (22 September). The curation fire re-examines the relations, not
only the records.** The owner: *"Why don't I see on the backlog any
recurrent review of all current events and the relationships between
them?"* A11(a) had the curation fire add an edge only where an article's
lead states one in so many words. From the next curation fire, **every
curation fire also runs a relations pass over every active event**: for
each event, its cited article (lead and body, at the cached or a named
revision) is read for any other event the atlas holds — by title, by
Wikidata item, by the import's identity tools — and where the article
states that one caused, enabled, preceded or reacted to the other, the edge
is written with M72's sources and locator under A5's standard; where an
edge already exists and the article contradicts its type or direction, the
edge gets the `disputed` confidence and a note, never a silent change. The
pass reports edges added by type, edges disputed, and the largest connected
component before and after, under the day's `## Curation <date>` section.
This is the standing review of the graph the owner asked for; the daily
snapshot publishes it.

**A14 (24 September). The second review's data passes, in force for both
lanes before any further import.** `docs/review-2026-09-24.md`, part C,
measured the corpus after two curation fires; these are the passes a run can
make under the amendments already in force, each its own section and counts
in the pool file, each skipped if its section exists, in this order. (1) The
fifteen intervals part C names whose cached lead states a wider or different
span in its first sentence are widened under A7, at the cached revision, with
the `date` note; where an existing edge would then fail rule 4, the edge is
disputed with a note or dropped, never the date kept wrong. (2) The lane guard
of the 24 September fire is run over every event carrying `a9-place`, and a
place whose lane disagrees with the event's is cleared, the `region` kept;
the Great Depression stands in no single country. (3) Every `wikipedia-en`
citation on an active record is cached at the revision it cites, through the
action API the fires already use, so the cache's `revid` matches the
citation. (4) The three A13 edges part C names are corrected —
`great-depression--siamese-revolution-of-1932` retyped `precondition-of`,
`six-day-war--bangladesh-liberation-war` re-pointed at
`india-pakistan-war-of-1971`, the locator label on
`february-revolution--russian-civil-war` corrected — and the eleven whose
quote opens with "Following", "After" or "In the aftermath" are read again
under the fire's own refusal class (chronology with no claim in it) and
dropped where they make none. (5) The 34 polities that active events name
and no description reaches (`third-portuguese-republic`, `estado-novo`,
`ottoman-empire`, `soviet-union`, `nazi-germany`, `russian-empire`,
`austria-hungary` and the rest part C lists) are reconciled under A12(6)'s
two signals plus the inverse gate — the item's dissolution year must match
the record's end — and described from the lead; population for an ended
polity is P1082's latest year or omitted. (6) The 21 titles that drop their
article's disambiguator are retitled under A12(5); `london-q84` is merged
into `london` and `wikidata: Q84` written on it; the 94 place placeholders
become `summary: null`; the 16 open-ended imports without the flag get
`end-unstated` and `2011-bahraini-uprising` is closed from its lead under
A7; the 15 tombstones citing M44b are re-read under §2 and their reason
rewritten; the Holocaust is divided under §5 from the article at a revision,
or a line says the sources give no defensible boundary. **And until the owner
decides the 22 September C8, a batch writes no edge from a parent to its own
child**, which is the rule the curation fire already applies; the 91 that
exist stay as they are. What waits for the owner is listed in the review's
fix plan and in the standing orders' §6.
