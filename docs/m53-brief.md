# Build brief — M53: the polities the events need

The owner selected **Brazil** on the running atlas and saw three events, none
of them the chain M50 had just written. The diagnosis, 17 September:

1. **Every M50 chain event carries `actors: []`.** No actor is named on any of
   them, so nothing can be found by selecting one.
2. **The territorial route is empty too.** `porto-seguro` (1500), `salvador`
   (1530), `vila-rica` (1695) and `bridgetown` (1640) resolve to **no actor**:
   no presence in the atlas covers those points at those dates.
3. **And the atlas's `brazil` begins in 1886**, a CShapes artefact, so it can
   never hold a 1500–1885 event whatever else is fixed.

**This was a hole in M50's brief, not in its run.** Its tests asked for
reachability *within* the chain, two edges, sources, cross-chain routing, a
place and a date — and never asked whether a chain event is reachable **from
an actor**, though M48 had just made the actor lens the main way to explore.

Read `docs/m50-brief.md` and its amendments, `docs/m51-overlaps.md` (the
method), `docs/m52-brief.md` **A1, the owner's contiguity rule**, `CLAUDE.md`,
`docs/run-protocol.md` with its amendments, `schema/v1/event.json` (the shape
of an `actors` entry and its roles), `schema/v1/actor.json`,
`tools/build-index.mjs` (the `grounds` pass), `src/validate/rules.js`.

## 1. The polities that are missing, on cited dates

Read from Wikidata on 17 September:

| | QID | inception P571 | dissolved P576 |
|---|---|---|---|
| **Empire of Brazil** | `Q217230` | **1822-09-07** | **1889-11-15** |
| **Russian SFSR** | `Q2184` | **1917-10-25** | **1991-12-25** |

**Create both**, each citing its QID and property.

**And the Empire settles Brazil's own start.** `brazil` currently begins 1886
— a file boundary, not a founding — while the Empire runs to **1889-11-15**.
The two cannot both be right. Take the Republic's start from the Empire's
cited dissolution, **move the 1886–1889 CShapes presences to the Empire**
(they are the Empire's ground, and a presence must belong to an actor alive in
its own period), and then **Empire → Republic is contiguous and a `succeeded`
relation is writable** under M52's A1. That relation is what M54 needs.

**`viceroyalty-of-brazil` ends 1877**, which is the same kind of artefact.
**Look up the colonial entity's own dissolution on Wikidata**; if it answers,
correct the span and write the succession if the dates meet. **If it will not
answer, leave the record alone, list it, and say what a person must decide** —
the gap is then honest, as the 1917 one is below.

## 2. The events that name nobody

**Give every M50 chain event its `actors` entries**, from Wikipedia under the
owner's decision of 16 September, with the role the schema provides. The actor
named must be **alive at the event's date** — so the early Brazilian events
name Portugal and the colonial entity, not the Republic.

**This is the test M50 lacked, and it goes in first:** every event in the two
chains is reachable from at least one actor, by an `actors` entry or by ground.
Also **measure and report the same figure over all active events**, because
the chain is unlikely to be the only region with the fault.

## 3. The events stranded in the 1917 gap

M52 split Russia honestly and left 1917–1922 empty. Three events fell into it
and name an actor not alive at their date: **`october-revolution`,
`russian-civil-war`, `treaty-of-brest-litovsk`**, all naming `soviet-union`,
which now begins 1922-12-30. **Move them to the Russian SFSR.**

**The gap narrows but does not close**: the Empire ends 1917-09-01 and the
SFSR begins 1917-10-25, so **no succession crosses it** — the Russian Republic
of those weeks is a further missing actor. Look it up; create it if Wikidata
answers, and if not, **say what is missing rather than closing it**.

Also: **`chinese-civil-war` (1946) names `taiwan` (1949–)**, which the same
rule forbids. Fix it or list it with the question.

## 4. What must stay true

- **No invented date.** Every date cites a QID and property, or is copied from
  a record that already carried it with its own source.
- **A succession only where the dates meet** (M52 A1), and the new validator
  rule enforces it — do not weaken the rule to fit a case.
- Rule 11: a record and everything naming it move in **one commit**.
- Presences **move**; geometry is never redrawn.
- `validate --index` clean and `build-index.mjs` committed at every commit
  touching `data/`; tests before the records they judge (711, 717).

## 5. What this run must not do

No new geometry. No display change — **M54 owns the lens**. No new record type,
confidence value, edge type, hex value, token or type size. No source for a
date beyond the QIDs it cites. Nothing merged into `main`; ignore `docs/drafts/`.

## 6. Done when

The Empire of Brazil and the Russian SFSR exist on cited dates; Brazil's start
is the Republic's and the 1886–1889 presences are the Empire's;
Empire → Republic is a succession; every chain event names at least one actor
alive at its date and the test asserts it; the three 1917 events name the
SFSR; what remains open is listed with its question; `validate --index` clean;
tests green; `M53 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
