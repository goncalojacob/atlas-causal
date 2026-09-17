# M55 — Germany, by the pattern Russia proved

The owner, 17 September, looking at the actor chips on **World War II**:

> **"You corrected Russia, but for example here you have the same issue with
> Germany"**

The chip read **"Germany (Prussia)"**. Behind it, `germany-prussia` spanned
**1886–1945** — the German Empire, the Weimar Republic and the Nazi state under
one record — while `prussia` sat beside it as **1530–1877** and `germany` as
**1878–1885**. Three fragments, and 1877, 1878, 1885 and 1886 are all places
where one import stops and another starts. It is the fault M52 fixed for
`gwcode 365`, and it is fixed the same way: the polities are written on the
dates a source gives, the territory moves without being redrawn, and what no
source will answer is left open and written down.

---

## 1. What Wikidata says, by QID and property

Read on 17 September, and re-read by this run before a record was written.
**No date below was authored here**, and no date is written in this milestone
that is not in this table or already in a record with its own source.

| | QID | inception P571 | dissolved P576 |
|---|---|---|---|
| **Brandenburg-Prussia** | `Q157367` | 1618 *(year)* | 1701 *(year)* |
| **Kingdom of Prussia** | `Q27306` | 1701-01-18 | 1918-11-09 |
| **German Empire** | `Q43287` | 1871-01-01 | 1918-11-09 |
| **Weimar Republic** | `Q41304` | 1918-11-09 | 1933 *(year)* |
| **Nazi Germany** | `Q7318` | 1933-03-15 | 1945-05-23 |
| **West Germany** | `Q713750` | 1949-05-23 | 1990-10-03 |
| **Germany** | `Q183` | 1949-05-23 *(preferred)*, 1867-07-01, 1871-01-01, 1918, 1933, 641 | — |

Two of these are **given to the year and not to the day** on Wikidata itself —
`Q157367`'s two values and `Q41304`'s dissolution — and the records that carry
them say so rather than inventing a day. `Q157367` also carries **P1366**,
*replaced by*, pointing at `Q27306`; that is where the first succession below
comes from.

---

## 2. The records

| record | name | when | where the dates come from |
|---|---|---|---|
| `brandenburg-prussia` | Brandenburg-Prussia | 1618 – 1701 | `Q157367` P571 1618, P576 1701 |
| `prussia` | Kingdom of Prussia | 1701 – 1918 | `Q27306` P571 1701-01-18, P576 1918-11-09 |

`prussia` keeps its id and its display name changes, exactly as
`turkey-ottoman-empire` and `russia-soviet-union` did before it: an id is
immutable once written and the name is what the reader sees. "Prussia" stays
on the record as a second name, because that is what Historical Basemaps calls
it and what a reader will search for.

---

## 3. The territory

**No outline was redrawn.** A period that begins under one record and runs past
its end stays with the record that began it, which is the method M51 used on
entity 640 and M52 on entity 365. A period with a cited boundary *inside* it is
cut at that boundary, the way M51 cut entity 630's — the two halves keep one
outline between them and neither is drawn again.

| presence | actor | from | to |
|---|---|---|---|
| `prussia-1530` | `brandenburg-prussia` | 1530 | 1599 |
| `prussia-1600` | `brandenburg-prussia` | 1600 | 1649 |
| `prussia-1650` | `brandenburg-prussia` | 1650 | 1699 |
| `prussia-1700` | `brandenburg-prussia` | 1700 | 1701 |
| `prussia-1701` | `prussia` | 1701 | 1714 |

The snapshot Historical Basemaps draws from 1700 to 1714 is the one the
Kingdom's cited inception falls inside, so it is cut at 1701-01-18:
`prussia-1700` is Brandenburg-Prussia's half and `prussia-1701` is the
Kingdom's. The four snapshots from 1715 on were already inside the Kingdom's
new interval and did not move.

---

## 4. The successions

A gap no longer forbids a succession — the owner relaxed that rule on
17 September and M53 made it the warning `succession-gap` — but a succession
whose cited dates do not meet **says so in its own note**, and names what stood
in the interval without inventing an actor for it.

| relation | gap in years | dates meet | what the note names |
|---|---|---|---|
| `brandenburg-prussia--prussia--succeeded` | none | yes | — |

---

## 6. What is left open

### 6.1 The presences that begin before their actor does

CShapes and Historical Basemaps draw ground continuously across dates at which
Wikidata says a polity began. Where that happens the period is carried by the
nearest record and **flagged `m55-gap`** on its own face, rather than given to a
record invented for it — which is what M52 did with the nine periods of the
Russian gap, and for the same reason.

| presence | begins | its actor begins | what held it |
|---|---|---|---|
| `prussia-1530` | 1530 | 1618 | the Duchy of Prussia, or the Margraviate of Brandenburg, or both; the atlas has no dated record for either |
| `prussia-1600` | 1600 | 1618 | the same question; this period runs past 1618 and into Brandenburg-Prussia's own life |

*The question:* **whose ground does Historical Basemaps draw as "Prussia"
before 1618?** Answering it means writing the Duchy of Prussia or the
Margraviate of Brandenburg with their own cited dates, and moving two `actor`
fields. The atlas already holds a `brandenburg`, but it is a different thing:
Historical Basemaps draws it in the snapshot for 1715, after Brandenburg-Prussia
has ended, and that record's span is that snapshot's.

### 6.2 The Kingdom of Prussia and the German Empire

**No succession is written between them, and this is a finding rather than an
omission.** On the dates this milestone cites they are contemporaries: the
Kingdom runs 1701-01-18 to 1918-11-09 on `Q27306` and the Empire 1871-01-01 to
1918-11-09 on `Q43287`, so for forty-seven years both stand, and they end on
the same day. `succeeded` would say the Empire took the Kingdom's place while
the Kingdom was still there, and the atlas's own test — a successor may not
begin before its predecessor ends, which M53's relaxation deliberately left
standing — refuses it.

*The question:* **what relation is it?** The Kingdom was a member state of the
Empire it led, which is neither `succeeded` nor, in this atlas's vocabulary,
`part-of`: rule 19 lets only an institution stand at the `from` end of that
one. Writing it means either a `member-of` used for a federation's constituent
state, which nothing in the corpus does yet, or a type the atlas does not have.
Neither is a date question, which is why no date could close it.
