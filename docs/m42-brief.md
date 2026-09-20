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
