# Build brief — M52: Russia, split on what is cited and open where it is not

The owner's first complaint about this atlas was a chip reading
**"Russia (Soviet Union)"**, and their instruction on 16 September, after
seeing what Wikidata actually holds, was: **"Let's go with that solution for
now"** — meaning the solution set out in §2 below.

M51 closed the 1885/1886 seam but left this one open, and was right to: the
ground says 0.9766, so the two seam records are the same territory, but the
dates behind the three-way split do not compose into a clean chain. This
milestone writes the part that is cited and leaves visible the part that is
not.

Read `docs/m51-brief.md` and `docs/m51-overlaps.md` (the method this follows),
`docs/m49-actors.md`, `CLAUDE.md` (**the rule on AI-written historical claims,
not relaxed here**), `docs/run-protocol.md` including its amendments,
`schema/v1/actor.json`, `schema/v1/presence.json`, `schema/v1/relation.json`,
`src/validate/rules.js` (rules 4, 11), `tools/import/wikidata.mjs`, and this
file including any "Amendments after review".

## 1. What is wrong

CShapes' entity **gwcode 365** carries the Russian Empire, the Soviet Union
and the post-Soviet Russian state under a single actor, `russia-soviet-union`,
labelled "Russia (Soviet Union)". One record, three polities. An atlas about
causation cannot follow anything through that.

## 2. What is written, and what is not

Read from Wikidata on 16 September, by QID and property:

| | inception P571 | dissolved P576 |
|---|---|---|
| **Russian Empire** `Q34266` | 1721-10-22 | **1917-09-01** |
| **Soviet Union** `Q15180` | **1922-12-30** | 1991-12-26 |
| **Russia** `Q159` | 1991-12-25, and 880, 1125, **1263 (preferred)** | — |

**Write two actors, both on cited dates**: the Russian Empire, 1721-10-22 to
1917-09-01; the Soviet Union, 1922-12-30 to 1991-12-26. Cite the QID and the
property on each. `Q15180` also carries a **deprecated** P571 of 1923-07-06 —
take the normal-rank 1922-12-30 and say in the record why.

**Write no succession relation between them.** The Empire ends in 1917 and the
Soviet Union begins in 1922: Wikidata asserts nothing holding that ground in
between, and the gap is real history — a republic, a civil war — not a missing
date. A `succeeded` relation across it would assert what no source here says.
**The gap is the finding, not a defect to be smoothed.**

**The post-1991 period stays open.** `Q159` carries four inceptions and its
**preferred** value is 1263, not 1991; choosing 1991-12-25 over it is a
judgement, not a lookup. Worse, 1991-12-25 falls one day *before* the Soviet
Union's dissolution on 1991-12-26, which M51's own test forbids in a
succession. So this milestone does not date the post-Soviet state.

## 3. The problem that must be solved anyway

Ending the Soviet Union in 1991 leaves every presence and every event after
that date without an actor alive to hold it, which is a hard error. So a third
record must carry the post-1991 period — but **its span begins where CShapes'
own first post-Soviet period begins**, copied from the record already in the
atlas, exactly as M51's joins copied their endpoints. That is not a claim about
when a state was founded; it is the dataset's own boundary, and it is cited to
the dataset.

Say in that record, and in `docs/m52-russia.md`, that **its inception is an
open question**, with the four `Q159` values and the one-day overlap written
out, so a person can settle it later.

## 4. What must stay true

- **No invented date.** Every date is cited to a QID and property, or copied
  from a record that already carried it, with its own source.
- **No succession relation without a date that supports it** — none across
  1917–1922, and none into the post-1991 record unless the dates permit it.
- **The chip must stop lying.** No record ends up named "Russia (Soviet
  Union)"; each carries the name of the polity it is.
- Rule 11: a record and everything naming it move in **one commit**.
- An event's `actors` entry names the actor that held the role **then** — and
  where *which* polity acted is a historical question rather than a date one,
  leave it and list it, as M51 did with the 1922 war and the 1923 treaty.
- Presences **move**; geometry is never redrawn. A period spanning a boundary
  is cut the way M51 cut entity 630's, outline unchanged.
- `node tools/validate.mjs --index` clean and `node tools/build-index.mjs`
  committed at every commit touching `data/`; tests before the records they
  judge (deviations 711, 717).

## 5. What this run must not do

No new geometry, no new import of records, no source for a date beyond the
QIDs above. **No display change.** No new record type, hex value, token or
type size. Nothing merged into `main`; `docs/drafts/` ignored.

## 6. Tests

1. No active actor is named "Russia (Soviet Union)", and none spans both 1917
   and 1922.
2. Every succession's dates are cited, and its successor begins no earlier
   than its predecessor ends.
3. There is **no** succession relation between the Empire and the Soviet Union.
4. Every presence belongs to an actor alive in the presence's own period.
5. Every event's `actors` entry resolves to an actor alive at the event's date,
   or is listed in `docs/m52-russia.md` as a historical question.
6. No test pins a count of actors.

## 7. Done when

`russia-soviet-union` is gone as a single record; the Empire and the Soviet
Union exist on cited dates with no relation between them; the post-1991 period
is carried and its inception documented as open; `docs/m52-russia.md` states
what a person must decide; `validate --index` clean; tests green; `M52 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
