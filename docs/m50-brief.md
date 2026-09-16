# Build brief — M50: the worked chain

The owner, 16 September, having asked for a chain running from the discovery
of Brazil to its present politics:

> **"My objective is also to test the way we can connect european and american
> colonization and imperialism to understand current economical and political
> situations. Obviously an ignorant won't understand that straight away just
> from the events, but if everything is connected people can then easily write
> narratives"**

That sentence sets what this milestone builds and what it refuses to build.
**The atlas ships the substrate, not the story.** Events and edges are the
connective tissue; a narrative is a thin layer a person writes over them
afterwards. This run makes one region of the graph dense enough that a person
could write that layer without first having to do the research themselves.

Read `CLAUDE.md` (**the rule on AI-written historical claims — see §6, which
this milestone cannot start without**), `STATUS.md`, `docs/run-protocol.md`
**including its amendments**, `docs/m42-brief.md` (the volume this one is the
counterweight to), `docs/m40-brief.md` for the one-edge rule, then
`schema/v1/event.json`, `schema/v1/edge.json`, `schema/common/confidence.json`,
`src/validate/rules.js` (**rules 4, 9, 22 and 24 all bind here**),
`data/narratives/`, and this file including its "Amendments after review".

## 1. What is wrong, measured

Over the 250 active events as of 16 September:

| | |
|---|---|
| events with **one edge or none** | **103 (41%)** |
| events with **no edge at all** | **17** |
| events carrying **seven or more** | **8** |
| events with a **parent** | **10 of 513** |

So the atlas is a list with decorations on it, not a graph. Nobody can write a
narrative over that, because there is nothing to walk along. **Event count is
not the measure this milestone is judged on — edge quality is.**

## 2. Two chains, and why it must be two

**Brazil** is the template, because the owner named it and because it runs the
whole length: landfall, the destruction of the indigenous population, the
slave trade, extraction, independence, the American century, the present.

**A second chain must be built in the same run**, chosen for the actors it
shares with the first. **The Caribbean sugar-and-abolition chain** is the
recommendation: it shares Portugal's and Britain's trade, the same capital
markets, the same abolition politics and the same later pattern of American
intervention, so the two chains are forced to touch at several points.

**This is the point of doing two.** Two colonial chains do not connect because
both are colonial — that is a theme, not an edge. They connect because the
**same actors** and the **same institutional events** appear in both: a
treaty, a conference, a company, a war, a bank. An edge between the chains
must always be routed through such a shared record, never asserted as a
resemblance. **A thematic arrow between two chains is not an edge and this
milestone does not write one.**

## 3. The shape: parents with children

The Brazilian spine is roughly eight top-level events with something like
twenty-five children beneath them — landfall; the demographic collapse; the
sugar colony; the Atlantic trade; the gold cycle; independence and empire; the
long American century; the present republic.

**That list is a list of subjects to research, not a list of records to copy,
and it carries no dates on purpose.** Every date, every span and every parent
relation in the finished chain comes from a source, not from this brief and
not from the assistant's memory. Where the research says the spine is wrong —
that a subject is two events, or belongs under a different parent, or does not
belong at all — **the research wins and the brief is amended to say so.**

This shape also matters to M48: the top-level filter it built hides ten nodes
today because only ten events have a parent. A chain built this way is the
first real use of it.

## 4. The edge is the unit of explanation

The owner's "an ignorant won't understand that straight away" is the design
constraint, and the answer to it is already in the schema: **every edge
carries a type, a confidence and its sources**, so *why are these two
connected?* is one click deep and is answered by a citation rather than by the
atlas's say-so. The graph must never look as though it explains itself.

Therefore, for every edge this milestone writes:

- the **type** is chosen deliberately — `caused`, `enabled`, `constrained` and
  the rest are different claims and the weakest true one wins;
- **`consensus` requires two sources by different authors** (rule 9), and
  Wikipedia alone is not two — rule 22 will pass it, and rule 22 is wrong
  about this;
- **a contested link is written as `disputed`, not omitted and not softened.**
  The atlas today barely uses that value. A chain about whether extraction
  financed European industrial growth is exactly where it earns its place, and
  the first thing this milestone proves is whether the interface can show a
  disagreement instead of asserting a line.

## 5. Long-range edges: the thing to find out

Some of the most important links here span a century or more. Rule 4 already
refuses a cause that begins after its effect, and that is right. What nobody
has tested is whether the **graph and the timeline can draw a 150-year edge
legibly** — and the owner's whole objective depends on links of that length.

**Measure it and write down what happens; do not fix it here.** Screenshot the
worst case, record it in `STATUS.md`, and if the display cannot carry it, that
is a milestone of its own and this run says so rather than inventing one.

## 6. The decision this brief is waiting on, and it is the owner's

**This milestone is nothing but historical claims, and `CLAUDE.md` forbids the
assistant writing them.** That prohibition is not an obstacle to route around;
it is the reason the atlas is worth anything. So M50 cannot start until the
owner decides where the claims come from. The three routes, with what each
costs:

1. **Import only** — take what Wikidata and Wikipedia already hold, the way
   the existing pipeline does. Cheapest, runs unattended, and produces exactly
   the thin badly-sourced events that made rule 22 a problem. The causal edges,
   which are the entire point, mostly do not exist in those sources at all.
2. **The owner writes the claims**, the run builds the records around them.
   Slowest, and the only route with no authorship problem whatsoever.
3. **A dated, scoped exception** in the style `CLAUDE.md` already provides for:
   the run may write a claim **only** where it is taken from a named scholarly
   work with a page number, and **only** at `probable` or `disputed` unless two
   such works by different authors agree. The assistant still chooses which
   scholar to believe, and that choice is itself a historical judgment — which
   is why this needs the owner's signature and a date, not a shrug.

**Recommendation: route 3, narrowed** — the exception covers this milestone and
these two chains only, expires when they land, and every claim written under it
is listed in one file so it can be reviewed as a body rather than hunted for.
**Until that decision is recorded here as an amendment, this routine stops at
STEP 0 and says so.**

## 7. What this run must not do

- **No claim without a source**, and no source that is the assistant.
- **No thematic edge** between the chains (§2).
- No new record type, no new confidence value, no new edge type, no new hex
  value, no new token, no new type size.
- **No display change.** If §5 finds the graph cannot draw a long edge, that is
  reported, not fixed.
- No new runtime dependency, no build step, no map library, no tiles.
- Nothing merged into `main`; `docs/drafts/` ignored.

## 8. Tests

These are properties, not counts, and they are what "someone could write a
narrative over this" actually means:

1. **Every event in a chain is reachable from every other in four hops or
   fewer**, following active edges in either direction.
2. **No event in a chain has fewer than two active edges.**
3. **Every edge in a chain has a source**, and every edge marked `consensus`
   has two by different authors — the stricter rule 9 reading, not rule 22's.
4. **Every cross-chain edge passes through a record that both chains name**
   (an actor, or an event both chains already hold).
5. Every event in a chain has a place and a dated `when`.
6. **No test pins a count of events or edges.**

## 9. Done when

Both chains exist; tests 1–5 hold; the disputed links are present and marked
disputed; `docs/m50-claims.md` lists every claim written under the §6
exception with its source and page; the long-range-edge finding of §5 is in
`STATUS.md` with its screenshot; `validate --index` clean; `M50 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

## Amendments after review

**A1 — §6 is answered: the claims come from Wikipedia.** The owner, 16
September: **"The historical claims should come from wikipedia right now. If
necessary other sources can be looked into."** That is route 1 of §6, chosen
deliberately and with its limits known, and it lifts the STEP 0 stop: this
milestone may now run.

**A2 — and therefore almost nothing here is `consensus`.** Rule 9 reserves that
value for **two sources by different authors**. Wikipedia is one source however
many articles are read, so an edge resting on Wikipedia alone is **`probable`**,
never `consensus`. Rule 22 will not catch this — it tests only that a
`wikipedia-en` or `wikipedia-pt` locator exists — so the discipline lives in
this brief and in the milestone's own tests. **A run that marks a
Wikipedia-only edge `consensus` has failed, whatever the validator says.**

This is not a limitation to be apologised for. A chain whose causal links read
`probable` is telling the reader the truth about how well it is sourced, and
§4's whole argument is that the edge carries its own justification. When a
second author is found for a link, the edge is promoted and says why.

**A3 — "other sources if necessary" means named ones, not more Wikipedia.**
Where a link matters and Wikipedia will not carry it — the contested economic
claims of §4 especially — the run may reach for a work Wikipedia itself cites,
record it as its own source with page or chapter, and only then may the edge
reach `consensus`, and only if the two authors genuinely differ. **It may not
promote a claim by finding a second Wikipedia article that repeats it.**

**A4 — Wikipedia and Wikidata are reachable from the runs, confirmed.** The
owner changed the cloud environment's allowed domains on 16 September, and the
`merge-m49` run probed them as the first session provisioned since:
`www.wikidata.org`, `query.wikidata.org` and `en.wikipedia.org` all answered
**200**. So this milestone fetches directly and needs no GitHub-runner detour.
Deviation 731's refusal is history, not a constraint.
