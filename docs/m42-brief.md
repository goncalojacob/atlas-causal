# Build brief for M42: the world at scale

On 5 September 2026 the owner asked: *"do not use synthetic events, go
on Wikipedia and complete with real events all over the world"*. The
assistant deferred the request until everything else was built. Everything
else is now built. On 16 September the owner also settled the question the
whole milestone turns on:

> **"World atlas, we started with Portugal just as a starting point."**

The owner also gave the reason this milestone now comes first:

> **"The goal right now is to have a more complete dataset so that it's easier
> to analyze it and understand what improvements need to be made."**

So M42 comes before any polish. It is the run that gives the atlas enough
events to be judged. **Volume comes first. The improvements come from what
the volume shows.**

Read these first: `CLAUDE.md` (the hard constraints, the dated exception for
world context the assistant drafted, and the rule that the atlas is in
English), `STATUS.md` (the top, and the accounts of M44a, M44b, M44c, M46 and
M47), `docs/run-protocol.md` **with its amendments**, `docs/m44-brief.md`
**whole, with its Amendments after review**, `docs/m44-connections.md`,
`docs/m44-retractions.md`, `docs/m47-parents.md`, then
`tools/import/wikidata.mjs`, `data/imports/wikidata-seeds.json`,
`data/imports/wikidata-state.json`, `docs/wikidata-candidates.md`,
`.github/workflows/import-wikidata.yml`, `src/validate/rules.js` and
`data/regions.json`. Then read this file with its "Amendments after review"
if it has them. Where the amendments differ from the body, the amendments
win (run protocol §3).

## 0. What the atlas holds now, and what "complete" would mean

**513 event records, and only 250 of them active.** 263 are tombstones. M44b
retracted 50 of those for failing a rule this brief retires. Of the 250
active records, **249 are `review.status: draft`**. Draft is the atlas's
normal state. By the owner's decision of 16 September, **a draft may still be
drawn**:

> **"They can stay unreviewed for now and can be shown on the Atlas, the
> important thing is to have lots of events on the map."**

Nothing in this milestone makes display wait for review, and nothing needs
to. The map already draws drafts, every record says it is one, and
`about.html` explains what that means. **Keep it that way.** The atlas stays
honest by marking its drafts, and it hides none of them.

## 1. The rule that an event needs an edge, and why M44b's rule is retired

M44b required a record to reach a **Portuguese** event within two hops, and
it retracted 50 of 82 imports that failed. **That rule ends with the
Portuguese scope.** A world atlas cannot ask every event to reach Lisbon.

**The new rule: a record earns its place by carrying at least one honest edge
to any record already in the atlas.** This is M40b's rule, and it fits a
world corpus. Its second half has stood since M40b and stays exactly as it
is: **a run writes nothing in order to keep a record.** A `precondition-of`
edge from every twentieth-century war to the Cold War would clear any queue
and say nothing true. A run retracts a record that cannot earn an edge, and
states the reason.

**Portuguese reach is now a measurement only.** Keep reporting it with the
script in `docs/m44-connections.md`. It is the clearest single number for how
connected the corpus is, and it is worth knowing that a world atlas has a
dense Portuguese core. It decides nothing.

## 2. Before any import: the fifty retracted events come back

**M42a first reinstates the 50 events M44b retracted**, because M44b
retracted them under a rule that no longer exists. They are still in the
repository with their full text, their sources and their reasons. Bringing
them back costs almost nothing, and they are the cheapest 50 events this
milestone will get.

Find each by its `retraction.reason` naming M44b. **Read each again against
the new rule.** If it carries an honest edge to a record here, or can take
one, it comes back: set `status: active`, delete the `retraction` block
(rule 27), and **copy its reason verbatim into `docs/m44-retractions.md`
under "Reinstated"**. M44's amendment A11 set this procedure, and M44b
already followed it for eleven actors. If the record still cannot earn an
edge under the *new* rule, it stays retracted and the run rewrites the
reason to say so. A tombstone that cites a retired rule lies about why the
record is gone.

Report how many of the 50 came back. **This is the milestone's first and
cheapest gain, and it comes before the run fetches a single new record.**

## 3. The import

Import from Wikidata by class and period, with sitelinks as the rank. This is
the machinery M44a used and M46 extended. **Make batches the Action can
finish.** M44a's batches ran in minutes, and M46 took two batches. An import
that needs six hours of runner time stopped this repository for a day
(deviation 442), and no run repeats it. Merge each batch with an index
rebuild, with `--index` clean.

**Periods.** Import 1890–2025 first, because the interface works there and
the existing corpus is there to connect to. **Then go earlier**, as far as
M43a's territories reach. Since M43b the timeline can hold five centuries,
and once M43a lands the map can draw borders back to 1415, so events before
1890 now have somewhere to sit. Do not import a period whose ground the map
cannot draw.

**The aim is coverage of every region, including those that touch no part of
Europe.** `data/regions.json` has five lanes, and M46 found nine candidates
that are *a subject rather than a place*. That limit is known and this run
does not fix it. Refuse those candidates and list them, as M46 did.

**Every record is `origin: wikidata`, `review.flags: ["imported-facts"]` and
`review.status: draft`, and carries what the import found and nothing you
added.** The summaries come from the import. **You write no historical
claim**: no date, no name, no sentence about what happened. Where the import
gives nothing usable, refuse the record and add nothing to it.

## 4. The connection pass

M44b's lesson, measured: M44b wrote about forty edges by rule and cut the
stranded count by 2. M44c wrote **two** edges chosen by reading and cut it by
2 more, because those two attached to the old corpus and M44b's attached to
the new records. **An edge chosen by reading is worth many edges written by
rule.**

So the connection pass does more than write one edge per new record. It reads
what arrived, finds the joins that matter, and writes those. Each edge has
one row in `docs/m42-connections.md` with the sentence that argues it.
**`consensus` requires two sources by different authors (rule 9), and rule 22
tests only the two Wikipedia sources.** So an edge that rests on Wikipedia
alone is `probable`, and you may not invent a bibliography to promote it. The
counts for `STATUS.md` are the records kept, the records retracted by reason,
and the events with no edge at all (92 before M44b and 10 after it, and say what
the count is now).

## 5. The Holocaust divided in two

`the-holocaust` is dated 1933–1945, so it cannot be an effect of a war that
begins in 1939. Rule 4 refuses that edge, and so the record has no incoming
edge at all. The owner's decision of 16 September:

> **"Why don't you divide it in two?"**

**Make two records, because there are two things**: the persecution that
begins with the regime, and the extermination that begins during the war.
Each takes its own dates from its sources. Neither of the two supersedes
anything. The pair supersedes the existing record, and its `supersededBy`
points at the one that inherits its edges. An `enabled` edge from
`world-war-ii` to the second record then has a date and is true. **Take the
dates from the import or from a source you can open. Do not supply them from
memory.** If the sources give no defensible boundary, say so and leave the
record whole. The owner asked you to divide the record. The owner did not
ask you to invent a date to divide it on.

## What this run must not do

- **The assistant writes no historical claim.** The dated exception in
  `CLAUDE.md` covers drafted *context* for imported records. It does not
  cover inventing an event, a date, a name or a boundary.
- **The run writes nothing in order to keep a record.**
- **No display change.** M42 is data. The interface belongs to M43b and M37.
- **No new runtime dependency, no build step, no map library, no tiles.**
- **The run merges nothing into `main`.** Git ignores `docs/drafts/`.

## Tests

1. The reinstatement can be reversed and is accounted for: a test checks that
   every record whose `retraction` block was deleted appears under
   "Reinstated" in `docs/m44-retractions.md`.
2. No test pins a count of records, events or edges. Four runs this week met
   such a test, and each rewrote it to assert the rule (`ffd737c`, `522e79e`,
   `00009dce`, and eight at once in M43b). **This milestone multiplies the
   corpus, and a test that memorises the corpus will break.**
3. The run classes and counts the import's refusals, as M44a did.
4. `tests/spine-pages.test.mjs` still shows first paint unchanged. A corpus
   ten times the size must not cost the reader a byte before the first
   picture. **This assertion is the one most likely to fail, and the most
   important.**

## The sub-runs

- **M42a: the fifty, and the first period.** Reinstate what M44b retracted
  under the retired rule. Then import 1890–2025 by class, in batches, with the
  connection pass for what arrives. Done line `M42a done`.
- **M42b: earlier periods.** It waits for `M43a done`, because the run
  imports no period whose borders the map cannot draw. Done lines
  `M42b done`, then `M42 done`.

Each sub-run is its own routine and may take several fires. The import Action
runs long. A fire that finds it running waits and does not start a second.

## Done when

The atlas holds an order of magnitude more active events than the 250 it
holds today. Every one of them is `draft` and `imported-facts`, and carries
an honest edge or a reason it has none. `docs/m42-connections.md` argues
every edge. First paint is unchanged. `node tools/validate.mjs --index`
reports zero errors. The counts are in `STATUS.md`. Then write `M42 done`.

## Deviation numbers, which continue from 717

The last deviation on `m0` is 717. M42a numbers its deviations from 718.

## Amendments after review

**A1 (20 September). The numbers in §0 are out of date, and the run measures
them again before anything else.** §0 says 250 active events. There are
**309**, and M62 and M67 have given many of them parents. The run's first
commit is the measurement, in `docs/m42-pool.md`.

**A2 (20 September). The seed pool is used up.**
`data/imports/wikidata-seeds.json` holds eight seeds, and the import has
walked every one. The next batch comes from the tool's own sweep,
`node tools/import/wikidata.mjs --candidates`, which writes
`docs/wikidata-candidates.md`. **The run ticks candidates from that sweep and
no longer from seeds.** The run imports a candidate under the owner's
decision of 16 September: Wikipedia and Wikidata, `probable`, and
`consensus` only through a work Wikipedia itself cites.

**A3 (20 September). Volume without parents undoes M65.** Since M65 the
resting picture shows only the main events, and every event imported without
a parent lands on it. **A batch that adds two hundred main events covers the
map again.** So the run files each event as it imports it, under M62's rule
(inside the span *and* inside the subject). It reports in `STATUS.md` how
many of the new events are main and how many have a parent. **An import that
leaves the main count higher than it found it must say why.**

**A4 (20 September). The owner has authorised the whole backlog**, so the
brief's own "wait for the owner" clauses no longer bind. The standing
exceptions remain: no AI-written historical claim outside the dated
exception, no invented date, and nothing merged into `main`.

**A5 (21 September). Volume must connect as well as file.** The owner: *"the
goal is to have chains throughout the globe and time."* M44 imported 82
events and left 45 of the world's events stranded, because it wrote edges
only among its own new records. **Every batch writes edges to what already
exists as well as among its own records**, each from the source that
supports it, under the confidence rules. `docs/m42-pool.md` reports **the
largest connected component of the causal graph before and after each
batch**, because that number is what "chains throughout the globe and time"
means. A batch that grows the corpus and leaves the component the same size
must say why.

**A6 (21 September). The resting timeline must be readable, and that is a
question about the records before it is one about the display.** The owner,
with a screenshot of the timeline at 435 active events: *"the timeline has
too many events. As it is right now it is useless. For it to be useful it
should only show parent and main events and the title for the events. For
example, sometimes historians call interwar period for the years between WW1
and WW2, you could only show that for Europe (there are other important
events for other parts of the world of course) and then when you click on it
it can show you everything that happened during that time."* After batch 14
the corpus is 435 active and **335 main**. The imports arrive as main events
and stay main, so the resting picture is nearly the whole corpus. A3 has not
held in practice.

**Two things change from the next fire.**

First, **a period is an umbrella when historians name it as one.** M67
refused the Soviet period, because being a party to a thing differs from
being part of a period. The owner has now asked for exactly this kind of
period umbrella, scoped to a region: *the interwar period, Europe,
1918–1939*. So **a period with a Wikipedia article, a span and a region or
polity is a legitimate umbrella**, sourced as any record is (Wikipedia and
Wikidata, `probable`). The run files under it each main event whose place or
actors are in that region and whose dates fall inside the span. This is
M62's span-and-subject property, with the region as the subject. M67's rule 1
stands: a period named for a form of government does not contain the act
that created or destroyed it. A war is still its own umbrella, by its
fighting. Where one period would nest inside another (the interwar period
inside the twentieth century), choose the one historians use, and nest
periods no more than one deep. The owner said other parts of the world get
their own periods. The run chooses them the same way, from what Wikipedia
names for that region and time, and invents no period that has no article.

Second, **the next fire files before it imports.** Before it imports anything
more, it creates the period umbrellas the existing 335 main events call for,
files the events under them, rebuilds and pushes. `docs/m42-pool.md` reports
the main count by region before and after. **From then on every batch
reports the main count, and the count must not rise.** An import that leaves
the main count higher than it found it must say why (A3, now enforced). The
target is a resting timeline a reader can take in, with main events in the
low tens per century. Each fire says how far it is from that target.

The display half (every bar titled, an umbrella opening on click, grouping
removed) is M77 in lane A, outside this run.

**A7 (22 September). A run may widen an imported interval from the record's
own cited article.** The assistant asked the owner in one sentence, *may a
run widen an imported interval from the record's own cited article?*, and
the owner answered: *"I agree."* So the run corrects the three intervals
earlier fires assigned to a person (`chinese-civil-war`,
`turkish-war-of-independence`, `the-troubles`) and any like them. **It reads
the span from the Wikipedia article the record already cites**, at a named
revision. It writes the span with the locator, keeps a note on the `date`
flag saying what changed from what and why, and clears the flag. Reading a
date from a cited source does not count as inventing one, and the standing
exception still holds. An interval the cited article does not state stays as
it is, and stays flagged.

**A8 (22 September). An event may sit under several umbrellas once `M79
done` is on `origin/m0`.** The owner: *"Can't we have many umbrellas for the
same event? For example, the angola independence is both under the
Portuguese third republic and african decolonization."* M79 (lane A) makes
`parent` a list. **From the first fire after `M79 done` is on `origin/m0`**,
a filing writes every umbrella whose span and subject fit, where it used to
write only the first. The run reads the filed events once more for a second
parent they were denied, and says how many gained one. **The decolonisation
of Africa is an umbrella**, with the span its Wikipedia article states and
the revision cited. The owner asked for it by name. Until `M79 done` is on
`origin/m0`, a record keeps one parent and this amendment waits.

**A9 (22 September). An imported event gets the place its item names.** The
owner, looking at the Russo-Ukrainian war and an empty map: *"it should show
children events on the map in case they have a place."* 435 of the 444
active events with no place are the import's. The import left them without a
place by its own rule, *"an event whose location is not already a place of
this atlas is placeless and takes a lane instead"*. That rule dates from when
a new place record was a record nobody had asked for. **The owner has now
asked for it.** From the next fire there is a **place pass**, and the same
rule applies to every batch after it. For each active event with no `place`
and a Wikidata item, read `P276` (location), then `P131` (administrative
territory), then `P17` (country), in that order. **The first item that
carries `P625` becomes the event's place.** If a place record with that item
exists, reuse it. Otherwise the import writes one, with the point, the label,
and `precision` `city` for a settlement or `region` for anything larger that
is not a state. **Until `M80 done` is on `origin/m0`, an event whose only
located item is its country stays without a place.** M80 adds the `country`
precision and the mark that draws it. From then on the country's point is
also a place, at that precision. The pass reports in `docs/m42-pool.md`
under `## Places (A9)` how many events gained a place at each precision, and
how many still have none and why. The run invents nothing: a point comes from
`P625`, or the event stays without a place.

**A10 (22 September). The whole world.** The owner: *"the platform has
mostly events related to Europe. We want the whole world, Africa, Asia,
South America."* The filing pass measured it. Before A6, main events by lane
were **Europe 190, Asia 73, Africa 44, the Americas 63**, and the active
corpus leaned the same way. From the next fire **every batch comes from the
lanes that trail**, in this order of need: Africa, then South America (the
`americas` lane south of the Rio Grande, named as such in the batch note),
then Asia. This order holds until each of the three has at least as many
active events as Europe had on 22 September, by the count in
`docs/m42-pool.md` that morning. Europe takes a batch only when a chain
crosses into it. The run ranks the candidates sweep (A2) by lane first and by
sitelinks second. Where a lane has no regional period (Latin America, Asia),
the seeds file gains the periods A6 asks for, each from its Wikipedia
article. **Every batch note reports the active and main count per lane**,
and `docs/m42-pool.md` keeps a running table. Umbrellas (A6), places (A9) and
second parents (A8) apply to each batch as before.

**A11 (22 September). The curation fire, and the split with M42b.** The
owner, leaving for a week, said four things: *"The curation should be, every
now and then, fired to analyze all events globally"*, *"the site must keep
growing until I get back, no matter how many events it has already"*, *"run
as many things in parallel as feasible"* and *"we are not looking for
accuracy but instead to have a demo"*. So the run settles whatever it can
settle from a cited source, and nothing waits for a person. Three things
follow.

*The curation fire.* **The first fire after 02:00Z each day is a curation
fire and imports nothing.** It reads every active event and fixes what is
missing or wrong, from the record's own cited sources or its Wikidata item:

- a summary that is missing or shorter than two sentences (from the Wikipedia
  lead at a named revision)
- a place Wikidata knows (A9's rule)
- a participant (`P710`) that the atlas holds as an actor
- a parent whose span and subject fit (A6, A8)
- an edge the article's lead states in so many words, with its locator (A5,
  M72)
- an interval the article widens (A7).

It reports the counts of each kind fixed and left, under `## Curation <date>`
in `docs/m42-pool.md`, and it must leave the main count no higher. **The
first curation fire also writes every polity's description.** For each actor
that is a state or a polity, it writes a summary with the approximate area
(`P2046`) and population (`P1082`, the latest year) from Wikidata, and two or
three sentences of geopolitical context from its Wikipedia lead, each cited
at a revision. The owner: *"each country should have a short description
mentioning approximate area, population and a bit of context on its
geopolitical situation."*

*The partition.* A second records lane, **M42b on the branch `m42b`**, runs
beside this one so the world grows twice as fast. **M42 takes Africa and
Asia**, every century. **M42b takes the Americas, every century, and Europe
before 1900**. Neither lane imports an item the other lane owns. Whichever
run finds a chain that crosses lanes follows it. Before each batch, each run
reads the other's branch (`origin/m42b` or `origin/m42`) and skips what is
already there. The curation fire belongs to M42 alone and covers every
event, whichever lane wrote it.

*No ceiling.* The owner: *"no ceiling."* This milestone has no done condition
until the owner writes one. The assistant lands a snapshot of `m42` and
`m42b` into `m0` every day.

**A12 (22 September). What the review measured, settled from the sources
already on disk.** `docs/review-2026-09-22.md`, part C, measured 582 active
events. **Before any further import**, the run makes these passes in this
order, each with its own section in the pool file and its counts before and
after:

1. *C1: summaries.* 316 active events show the import's placeholder as their
   summary, and 313 of them have the English Wikipedia lead cached at a named
   revision under `tools/import/cache/wikipedia/`. Write the cached lead as
   the summary, with a `wikipedia-en` citation at that revision and the
   `summary-drafted` flag. 126 records already have this shape. Add the
   validator warning `summary-imported` for any placeholder left. This pass
   needs no network.
2. *C2 and A9: places.* 221 events with no place carry "derived from its own
   point": the item had `P625`, and the import used it for the lane and wrote
   no place. **A9's pass reads the item's own `P625` first**, then `P276`,
   `P131`, `P17`. `placeRecord()` writes `precision` from the item's class:
   `city` for a settlement, `region` for anything larger that is not a state,
   `point` for a battlefield or site, and `country` once `M80 done` is on
   `origin/m0` (it is). It never hard-codes `point`.
3. *C3, C4 and A7: intervals.* `intervalFor()` prefers `P580` (start time)
   over `P585` (point in time) for `from`. A missing `P582` becomes the flag
   `end-unstated`. It never becomes an `end: null` that claims the event is
   ongoing. Then the A7 pass follows the reviewer's comparison. The run widens
   from the article at its revision, with the note, every record whose span
   disagrees with the year range in its cached lead's title or first
   sentence. The reviewer found 29 such records and 17 were real:
   `cambodian-vietnamese-war`, `rif-war`, `wadai-war`,
   `german-revolution-of-1918-1919`, `insurgency-in-kosovo`,
   `great-depression`, `indochina-wars`, `la-violencia`,
   `south-sudanese-civil-war`, `tambov-rebellion`, `2011-bahraini-uprising`
   and the rest the measurement lists. Keep a `span-vs-article-title`
   warning.
4. *C5: actors.* The import reads `P710` (participant) and drops it. One rule
   puts a participant that the atlas holds as an actor into the event's
   `actors`, with the role the vocabulary has for it. The pass applies the
   rule to the 274 active events that name no actor.
5. *C7: titles.* `titleFor()` keeps the article's disambiguator. The run
   retitles the three "Afghan Civil War" and two "Treaty of London" records
   from their articles.
6. *C6 and A11: the polities' descriptions.* Only 6 of 2,519 polities carry a
   Wikidata item, so A11's description pass cannot run as written. **The
   first curation fire matches the 81 polities that active events name** to
   their Wikidata items through the import's own identity tools. It then
   writes their descriptions (area `P2046`, population `P1082`, the lead's
   context, each cited). The other polities wait until an event names them.

The list keeps what needs a person (C6's book citations with no page, C8–C13).
The reviewer left measurement scripts in the assistant's scratchpad, and part
C quotes them. Reproduce the numbers before and after each pass with your own
scripts.

**A13 (22 September). The curation fire checks the relations as well as the
records.** The owner: *"Why don't I see on the backlog any recurrent review
of all current events and the relationships between them?"* A11(a) had the
curation fire add an edge only where an article's lead states one in so many
words. From the next curation fire, **every curation fire also runs a
relations pass over every active event**. For each event, the fire reads its
cited article (lead and body, at the cached or a named revision) for any
other event the atlas holds. It finds them by title, by Wikidata item, or by
the import's identity tools. Where the article states that one event caused,
enabled, preceded or reacted to the other, the fire writes the edge with
M72's sources and locator under A5's standard. Where an edge exists and the
article contradicts its type or direction, the fire gives the edge the
`disputed` confidence and a note, and never changes it silently. The pass
reports the edges added by type, the edges disputed, and the largest
connected component before and after, under the day's `## Curation <date>`
section. This is the standing review of the graph the owner asked for, and
the daily snapshot publishes it.

**A14 (24 September). The second review's data passes, in force for both
lanes before any further import.** `docs/review-2026-09-24.md`, part C,
measured the corpus after two curation fires. The passes below are the ones
a run can make under the amendments already in force. Each has its own
section and counts in the pool file. A run skips a pass whose section
exists, and makes the passes in this order.

1. Part C names fifteen intervals whose cached lead states a wider or
   different span in its first sentence. The run widens them under A7, at the
   cached revision, with the `date` note. Where an existing edge would then
   fail rule 4, the run disputes the edge with a note or drops it. It never
   keeps the date wrong.
2. The run applies the lane guard of the 24 September fire to every event
   carrying `a9-place`. Where a place's lane disagrees with the event's, the
   run clears the place and keeps the `region`. The Great Depression stands
   in no single country.
3. The run caches every `wikipedia-en` citation on an active record at the
   revision it cites, through the action API the fires already use, so the
   cache's `revid` matches the citation.
4. The run corrects the three A13 edges part C names. It retypes
   `great-depression--siamese-revolution-of-1932` as `precondition-of`. It
   points `six-day-war--bangladesh-liberation-war` at
   `india-pakistan-war-of-1971` instead. It corrects the locator label on
   `february-revolution--russian-civil-war`. It reads again the eleven edges
   whose quote opens with "Following", "After" or "In the aftermath", under
   the fire's own refusal class (chronology with no claim in it), and drops
   those that make no claim.
5. Active events name 34 polities that no description reaches
   (`third-portuguese-republic`, `estado-novo`, `ottoman-empire`,
   `soviet-union`, `nazi-germany`, `russian-empire`, `austria-hungary` and the
   rest part C lists). The run matches them to their items under A12(6)'s two
   signals plus the inverse gate: the item's dissolution year must match the
   record's end. It describes them from the lead. For a polity that has
   ended, population is P1082's latest year, or the run leaves it out.
6. The run retitles the 21 titles that drop their article's disambiguator,
   under A12(5). It merges `london-q84` into `london` and writes
   `wikidata: Q84` on it. It turns the 94 place placeholders into
   `summary: null`. It gives `end-unstated` to the 16 open-ended imports
   without the flag, and closes `2011-bahraini-uprising` from its lead under
   A7. It reads the 15 tombstones citing M44b again under §2 and rewrites
   their reason. It divides the Holocaust under §5 from the article at a
   revision, or writes a line saying the sources give no defensible boundary.

**Until the owner decides the 22 September C8, a batch writes no edge from a
parent to its own child.** The curation fire already applies this rule. The
91 such edges that exist stay as they are. The review's fix plan and the
standing orders' §6 list what waits for the owner.

**A15 (25 September). The third review's data passes, in force for both
lanes before any further import.** `docs/review-2026-09-26.md`, part C,
measured the corpus at 1,257 active events after four curation fires. The
passes below are the ones a run can make under the amendments already in
force. Each has its own section and counts in the pool file. A run skips a
pass whose section exists, and makes the passes in this order.

1. **The balance between lanes.** M42b's "Europe before 1900" clause is
   paused until Africa and Asia each hold A10's 303 active events. Until
   then, M42b's second half covers the empty centuries of the trailing lanes:
   the Americas' 16th to 18th centuries as before, and Africa and Asia before
   1800, which hold nothing and one event. M42b reads these from Wikidata
   under M42's own rules for those lanes, and checks M42's `data/events/` ids
   before every batch, as it already does. A batch that walks a held
   umbrella's `P361` children imports only the children it can connect to
   existing records with an edge under A5. Its note counts the candidates it
   left.
2. **The cache is kept.** A14(3)'s pass becomes the last step of every batch
   in both lanes, over the batch's own citations, so every `wikipedia-en`
   citation on an active record is on disk at the revision it cites. Before
   the pass runs, the run writes a pure test under `tests/` that fails when a
   citation is missing from the cache (711).
3. **Places carry no summary.** `placeRecord()` writes `summary: null`. The
   run nulls the 158 place records that carry the import's placeholder.
4. **Days and months.** A7's comparison reads day and month as well as year,
   from the cached first sentence and from the article title. A record that
   `P585` dates to a single day, whose article states a range, takes the
   range with the `date` note (`first-shaba-war`, `battle-of-tsushima`,
   `battle-of-port-arthur`, `dos-de-mayo-uprising`,
   `palace-of-justice-siege`, `flight-to-varennes`, `battle-of-buceo`,
   `battle-of-humenne`, `beer-hall-putsch`,
   `execution-of-the-romanov-family`, `warsaw-uprising`,
   `slovak-national-uprising`, `arab-revolt`, `1979-herat-uprising`, and
   `siege-of-fuenterrabia-1523-1524` from its own title). The import tool runs
   the `span-vs-article-title` comparison at import time and writes the
   title's span.
5. **Chronology states no cause, and the writer checks this when it writes
   the edge.** Both lanes' batches apply the fire's refusal class (a quote
   that opens "After", "Following", "In the aftermath", "Shortly after" and
   states no cause) when they write the edge. The batch note counts what it
   refused. Where the quoted sentence names a third event the atlas holds as
   the cause, the edge comes from that event or the run writes none. The run
   points `soviet-afghan-war--afghan-civil-war-q1980081--precondition-of` at
   `dissolution-of-the-soviet-union` or drops it. It reads
   `world-war-i--treaty-of-lausanne` again against
   `turkish-war-of-independence`.
6. **A country is a place only while it existed.** Under A9, the run refuses a
   `P17` country as an event's place in four cases: the item's inception
   (`P571`) is after the event's end, its dissolution (`P576`) is before the
   event's start, the item names more than one country, or the country's
   point is more than 1,000 km from every `P625`/`P276` point on the event's
   own chain of parents and children. The run applies this rule again to the
   23 events before 1800 that sit on a modern state's point and to the 46
   events placed on a country that name their country nowhere. It keeps
   `region` and logs each refusal with its reason.
7. **The lane from the point.** Where an event's own item, or its first
   located `P276`/`P131`, carries a point, the run derives the lane from that
   point and corrects an import-written `region` that disagrees. This places
   `ilinden-preobrazhenie-uprising` and the other five `a14-lane-guard`
   records. `execution-of-the-romanov-family` waits on deviation 1423.
8. **Redirects.** Where an item's English sitelink leads to an article whose
   folded title matches none of the item's names, the record takes the flag
   `article-is-redirect` and quotes no summary from that article. The run
   reads the span from the section that names the item, at a revision, or
   retracts the record under §1 with the reason. `eritrean-civil-wars` comes
   first, then `action-at-tamanana-9-september-1645`, `atlantic-revolutions`,
   `battle-of-musa-dagh`, `milk-bar-cafe-bombing` and
   `united-states-military-campaign-against-cartels`.
9. **Doubles and paraphrases.** The run merges `rio-de-janeiro-q8678` into
   `rio-de-janeiro` and writes `wikidata: Q8678` on it, as it did for London.
   Three summaries cite a revision and paraphrase it (`battle-of-kapyong`,
   `battle-of-the-imjin-river`, `the-persecution-of-the-jews-1933-1941`). The
   run quotes them again from their leads at the cited revision.
10. **Three polities.** The dissolution-year gate refused
    `european-economic-community`, `inca-empire` and `dutch-republic`,
    because each record's own `when.end` is the import's placeholder and
    makes no claim. The run reads their end from the item under A7's logic
    and describes them under A14(5).
11. **The measurement that matters.** Every batch note and every curation
    section in both pool files reports, beside the largest component, how
    many of the edges written cross an umbrella (their two endpoints have no
    parent in common). That number is what "chains throughout the globe and
    time" means. It was zero for every batch the review read.
12. **Categories.** The run categorises the 151 main events with no category
    first, then the rest, from the item's own `instance of` (`P31`) through
    the closed list in `data/categories.json`. The import tool already reads
    new records this way. An item whose class maps to nothing stays without a
    category, and the run counts it.
13. **The Portugal paragraph.** The summaries of `world-war-ii`,
    `world-war-i`, `korean-war`, `great-depression`,
    `charter-of-the-united-nations` and `cold-war` are the quoted lead plus a
    paragraph the importer wrote about Portugal. The run cuts that paragraph
    to its first sentence and leaves the quoted lead as it is.

The review's fix plan and the standing orders' §6 list what waits for the
owner.

**A16 (13 October). The parent-to-child rule removed.** The owner read the
planner's first day (*the clearest sentences it found were refused for being
parent to child*) and said: *"Ok let's remove the parent to child rule for
now."* This withdraws A14's standing rule that a batch writes no edge from a
parent to its own child. Where an article states it, a war may carry an edge
to its own engagement and an engagement to its war, in either direction. The
filing (`parent`) and every other refusal class stay as they are.
`tools/queue/queue.mjs` no longer asks `parentToChild` of a queued edge, and
`docs/m90-rules.md` card 11 says the same.

**A17 (13 October). Importance first, and the rule that an event needs an
edge withdrawn.** The owner: *"Right now the priority is to add most events
of historical significance since around 1500, even if for now there is no
parent or child for it. Just add all events that are relevant and connect
them when you can. Start by adding the main and most important historical
events and then progress to adding events that are not as important or that
are children of the main events."* Three things follow.

1. This withdraws §1's rule that a record earns its place by an edge, and
   A15(1)'s reading of it. A run imports an event of significance whether or
   not it can write an edge today. It still writes an edge only where it has
   verified the article's sentence (A5's standard, A15(5)).
2. The order of work is importance. The planner reads it off Wikipedia's own
   vital-article levels and lists, and a model does not judge it. A10's lane
   balance breaks ties, and about 1500 is the floor.
3. A6's clause that the main count must not rise gives way to the main events
   the owner asked for first. The planner names in its note which records it
   made main.

M91 is the tooling: a queue item may carry no edge, the writer imports it
regardless, and the duplicate check reads titles as well as ids.

Also under A17: an umbrella may receive an edge where an article states the link, written by the writer's tool from a verified sentence and flagged `queued`. The M42 filing pass's own test keeps its rule for every other edge.
