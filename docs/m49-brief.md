# Build brief — M49: an actor is one thing or two

The owner, 16 September, on seeing a chip reading **"Russia (Soviet Union)"**:

> **"they should be taken as different actors because effectively Soviet Union
> stopped being Soviet Union and went to being Russia"**

That is the decision this milestone carries out. It is not a naming fix. It is
about whether the actors in this atlas are real things, because an atlas whose
subject is causation over time cannot follow anything across time if the actor
list is wrong about when things began and ended.

Read `CLAUDE.md` (**the rule on AI-written historical claims — it governs every
date in this milestone**), `STATUS.md`, `docs/run-protocol.md` **including its
amendments**, `docs/m5-brief.md`, `docs/m43-brief.md`, then
`tools/import/cshapes.mjs`, `tools/import/basemaps.mjs`,
`tools/import/identity.mjs`, `data/imports/cshapes-actors.json`,
`data/imports/basemaps-actors.json`, `data/relations/` (128 records — the
`succeeded` shape already in use), `schema/v1/relation.json`,
`schema/v1/actor.json`, `schema/v1/presence.json`, `src/validate/rules.js` —
and this file including its "Amendments after review" if one is present.

## 1. What is wrong, measured

Two imports meet at 1885/1886 and neither knows the other exists.

| from `basemaps` | | from `cshapes` | |
|---|---|---|---|
| `russian-empire` | 1783–**1885** | `russia-soviet-union` | **1886**– |
| `ottoman-empire` | 1400–**1885** | `turkey-ottoman-empire` | **1886**– |
| `prussia` | 1530–**1877** | `germany-prussia` | **1886**–1945 |

**123 actors end in exactly 1885 and 128 begin in exactly 1886.** At least
**39** are the same polity on both sides — the United Kingdom, the United
States, the Netherlands, Sweden, Madagascar, Bosnia, Sierra Leone. So the atlas
currently asserts that Sweden ceased to exist in 1885 and a different Sweden
appeared in 1886. **Not one of those boundaries is a historical fact**; they
are where one dataset stops and the other starts.

And CShapes conflates in the other direction: one entity, `gwcode 365`, carries
the Russian Empire, the Soviet Union and the Russian Federation under the
single label the owner saw.

## 2. The one question, and it is factual

For every actor at the seam: **did the polity end, or did the dataset end?**

- **The dataset ended** → the two records are one actor. Join them: one record
  spanning both periods, the other merged into it with `supersededBy`, every
  presence and every reference moved, the id that survives being the one more
  records already point at. **No succession relation** — nothing succeeded
  anything.
- **The polity ended** → split properly, as the owner asked. Actors with their
  **true** dates, a `succeeded` relation between them in `data/relations/` —
  the shape `brunei-under-united-kingdom--brunei--succeeded.json` already uses —
  and each presence assigned to whoever held that ground in that period.

**You may not answer that question from memory.** Inception and dissolution
dates are historical claims and `CLAUDE.md` forbids the assistant writing them.
Take them from **Wikidata**, which the importer already reads and where states
carry inception and dissolved dates, and cite what you took. **Where Wikidata
will not answer, leave the pair alone, list it, and say what a person must
decide.** A seam left honest is better than a seam closed by guesswork.

## 3. The order of work, which matters

1. **The survey first, in its own commit**, before a single record changes:
   every actor at the seam, both ids, both spans, what Wikidata says, and the
   verdict — joined, split, or left for a person. `docs/m49-actors.md`. If the
   run is killed, the next inherits the findings rather than redoing them.
2. **The joins**, which are the larger number and the simpler change.
3. **The splits**, each in its own commit: the new actors, their successions,
   the presences reassigned, the events' `actors` entries moved to whichever
   actor held that role at that date.
4. **Russia by name**, because it is the owner's example and the one they will
   look at: Empire, Soviet Union, Federation, with two successions and the
   territory divided between them.

## 4. What must stay true

- **Rule 11**: a retracted actor referenced by an active event is a hard error,
  so a record and everything naming it move in **one commit**.
- **An event's `actors` entry names the actor that held the role then.** An
  event in 1960 naming the Soviet Union must not end up naming the Russian
  Federation because the id survived.
- **`data/relations/` is where succession lives**, not a field on the actor.
  128 records already do this; add to them, invent nothing.
- The presence records carry the territory. Splitting an actor **moves**
  presences; it does not duplicate them and it does not redraw geometry.
- **`validate --index` clean at every commit** (the protocol's amendment of
  15 September), and the commit that teaches the tests goes **before** the
  commit that changes what they see (deviations 711 and 717).

## What this run must not do

- **No invented date, ever** — the whole milestone turns on this.
- No new geometry, no new import, no new source beyond Wikidata for dates.
- No display change: M48 owns what the reader sees.
- Nothing merged into `main`; `docs/drafts/` ignored.

## Tests

1. No active actor both ends in 1885 and has a same-named actor beginning 1886
   — or, where one remains, it is listed in `docs/m49-actors.md` as left for a
   person, and the test asserts that correspondence rather than a count.
2. A succession relation's two actors do not overlap in time, and the
   successor begins no earlier than the predecessor ends.
3. An event's `actors` entry resolves to an actor alive at the event's date.
   **Expect this to fail on records the atlas already holds**; report how many
   and fix what this milestone touches, listing the rest.
4. Every presence belongs to an actor alive in the presence's own period.
5. No test pins a count of actors.

## Done when

`docs/m49-actors.md` accounts for all 123 and 128; the joins are joined; the
splits are split with their successions; Russia is three actors and two
successions; every date is cited to Wikidata or the pair is listed as a
person's decision; `validate --index` clean; tests green; `M49 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`

## Amendments after review

**A1 — M49 runs on the branch `m49`, at the same time as M48, not after it.**
The owner asked on 16 September for both as fast as possible. M48 owns `m0`;
this milestone owns `m49`, cut from `m0`, under the protocol's amendment of
16 September. The `M49 started` claim and the `M49 done` line are single-file
commits to `m0`; every record, document and count stays on `m49` for the merge
run. **Do not rebase `m49` onto `m0` while M48 is working, and do not merge
`m0` into it** — the merge run does that once, deliberately.

**A2 — the survey is the milestone's real product.** If a rate limit ends this
run with only `docs/m49-actors.md` written, the run succeeded: the next fire
inherits 251 answered questions instead of asking them again. Write each
verdict into the file *as you reach it*, commit in batches, push. Never hold
findings in the session.

**A3 — Wikidata is reachable from the cloud sandbox** through the same path
`tools/import/` already uses; `tools/import/identity.mjs` shows the request
shape. Every date written in this milestone carries the QID and the property
(P571 inception, P576 dissolved) it came from, in `docs/m49-actors.md` and in
the record's `sources`. A pair Wikidata will not answer is listed, not guessed.
