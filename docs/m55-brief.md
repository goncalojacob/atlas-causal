# Build brief — M55: Germany, by the pattern Russia proved

The owner, 17 September, looking at the actor chips on **World War II**:

> **"You corrected Russia, but for example here you have the same issue with
> Germany"**

The chip reads **"Germany (Prussia)"**. Behind it, `germany-prussia` spans
**1886–1945** — the German Empire, the Weimar Republic and the Nazi state
under one record — while `prussia` sits beside it as 1530–1877, orphaned at a
file boundary. It is exactly the fault M52 fixed for `gwcode 365`, and it is
fixed the same way.

Read `docs/m52-brief.md` **whole, including its amendments — it is the method
this follows**, `docs/m53-brief.md` A1 (the relaxed rule), `CLAUDE.md`,
`docs/run-protocol.md` with its amendments, `schema/v1/actor.json`,
`schema/v1/relation.json`, `src/validate/rules.js`.

## 1. The dates, read from Wikidata on 17 September

| | QID | inception P571 | dissolved P576 |
|---|---|---|---|
| **Kingdom of Prussia** | `Q27306` | 1701-01-18 | 1918-11-09 |
| **German Empire** | `Q43287` | 1871-01-01 | 1918-11-09 |
| **Weimar Republic** | `Q41304` | 1918-11-09 | 1933-01-01 |
| **Nazi Germany** | `Q7318` | 1933-03-15 | 1945-05-23 |
| **West Germany** | `Q713750` | 1949-05-23 | 1990-10-03 |
| **Germany** | `Q183` | **preferred 1949-05-23**, and 1867, 1871, 1918, 1933 | — |

**Write no date that is not in this table or already in a record**, and where a
record's own span is kept, say which source it came from.

## 2. What to build

**`germany-prussia` becomes the polities it conflates**: the German Empire,
the Weimar Republic and the Nazi state, each on its cited dates. Its
presences go to whoever held that ground when each period began, by M52's
method — a period spanning a boundary is cut, outline unchanged, byte for
byte. **An event's `actors` entry names the actor that held the role then**, so
**World War II names Nazi Germany**, not "Germany (Prussia)".

**`prussia` is wrong at both ends**: the atlas says 1530–1877, Wikidata's
Kingdom of Prussia is 1701–1918. **Correct it to the cited span.** What the
atlas holds for 1530–1701 is Brandenburg-Prussia, a different polity: if
Wikidata names and dates it, create it; **if not, leave those presences where
they are, list the question, and do not guess.**

**The successions**, now that a gap no longer forbids one (M53 A1): Kingdom of
Prussia → German Empire → Weimar → Nazi Germany → the Federal Republic, each
with cited dates, **each carrying a note where its dates do not meet** — and
two of them do not: Weimar ends 1933-01-01 against 1933-03-15, and the Nazi
state ends 1945-05-23 against 1949-05-23, which is the occupation. **Name what
occupied each gap in the note; do not invent an actor for it.**

**`Q183`'s preferred inception is 1949-05-23**, so the modern German record
begins there and not at a file boundary. If the atlas has no post-1945 German
actor, the Federal Republic is the one to create, cited to `Q713750` or `Q183`
and saying which.

## 3. What must stay true

- **No invented date**; every one cites a QID and property or an existing
  record's own source.
- Rule 11: a record and everything naming it move in **one commit**.
- Presences **move**; geometry is never redrawn.
- **No display change.**
- `validate --index` clean and `build-index.mjs` committed at every commit
  touching `data/`; tests before the records they judge (711, 717).

## 4. Tests

1. No active actor is named "Germany (Prussia)", and none spans both 1918 and
   1933.
2. Every succession written here cites its dates, and each whose dates do not
   meet carries a note saying what the gap is.
3. **World War II's `actors` entry resolves to an actor alive in 1939–1945.**
4. Every presence belongs to an actor alive in its own period.
5. No test pins a count of actors.

## 5. Done when

`germany-prussia` is gone as a single record; the Empire, Weimar and the Nazi
state exist on cited dates with their successions; `prussia` carries the cited
Kingdom span; World War II names the right actor; what is left open is listed
with its question; `validate --index` clean; tests green; `M55 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
