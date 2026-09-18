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
| `germany-prussia` | German Empire | 1871 – 1918 | `Q43287` P571 1871-01-01, P576 1918-11-09 |
| `weimar-republic` | Weimar Republic | 1918 – 1933 | `Q41304` P571 1918-11-09, P576 1933 |
| `nazi-germany` | Nazi Germany | 1933 – 1945 | `Q7318` P571 1933-03-15, P576 1945-05-23 |
| `german-federal-republic` | German Federal Republic | 1949 – open | `Q713750` P571 1949-05-23 |

`prussia` and `germany-prussia` keep their ids and their display names change,
exactly as `turkey-ottoman-empire` and `russia-soviet-union` did before them:
an id is immutable once written and the name is what the reader sees.
**No record is named "Germany (Prussia)" any more**, and the old label is not
kept as a variant either, because it names three polities and search would
offer it as though it were one. "Prussia" does stay on its record as a second
name: it is what Historical Basemaps calls it and what a reader will search
for, and it names one polity.

**`germany-prussia` is the Empire and not the Nazi state**, which is the one
choice in this milestone that M52's pattern does not settle by itself — there
the CShapes record kept the *last* of the polities it had conflated. Two things
decide it here. The eighteen colonial presences that name `germany-prussia` as
their sovereign — Togoland, Kamerun, German New Guinea, the Solomon Islands,
South West Africa, Tanganyika — all run between 1886 and 1916, so they are the
Empire's ground and stay right where they are; had the id gone to the Nazi
state, every one of them would have had to move. And an id reading
`germany-prussia` against a chip reading "Nazi Germany" would put the
Prussia-to-Nazism thesis in the atlas's own URLs, which is a historical claim
and not a file name. Against the Empire the same id is what the dataset's own
label meant: Prussia-led Germany.

**`germany` (1878–1885) is joined into it**, and that answers a question M51
left open. The two outlines either side of the 1885/1886 seam share **0.9824**
of the smaller — re-measured from `data/` by this run, not copied — the name is
the same word, and both Historical Basemaps snapshots, 1878 and 1880, fall
inside `Q43287`'s two dates. M51 could not join them because no item it found
dated either side, and that was the whole of its objection; `Q43287` is the
date. `germany` is `merged`, `supersededBy` points at the survivor, its two
presences moved, and `docs/m51-overlaps.md` carries the verdict where the other
nineteen joins are. The alternative was to leave a third German fragment
standing over eight years that the Empire's own cited interval already covers,
which is the split difference the brief forbids.

**`german-federal-republic` moves off a file boundary too.** It began in 1945,
where CShapes starts drawing entity 260 — the surrender, not a founding. It now
begins **1949-05-23**, which is `Q713750`'s P571 and also the **preferred**
P571 on `Q183`. The citation on the record is to `Q713750`, because that item
is about exactly the state entity 260's early periods draw, while `Q183` carries
six inceptions and choosing among them is the judgement M52 refused to make for
Russia. The two agree on the day, which is why this is a lookup and not a
choice.

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
| `germany-1878` | `germany-prussia` | 1878 | 1879 |
| `germany-1880` | `germany-prussia` | 1880 | 1885 |
| `germany-prussia-1886` | `germany-prussia` | 1886 | 1918 |
| `germany-prussia-1918` | `weimar-republic` | 1918 | 1919 |
| `germany-prussia-1919` | `weimar-republic` | 1919 | 1920 |
| `germany-prussia-1920` | `weimar-republic` | 1920 | 1933 |
| `germany-prussia-1933` | `nazi-germany` | 1933 | 1938 |
| `germany-prussia-1938` | `nazi-germany` | 1938 | 1945 |

The snapshot Historical Basemaps draws from 1700 to 1714 is the one the
Kingdom's cited inception falls inside, so it is cut at 1701-01-18:
`prussia-1700` is Brandenburg-Prussia's half and `prussia-1701` is the
Kingdom's. The four snapshots from 1715 on were already inside the Kingdom's
new interval and did not move.

**Entity 255 has four periods and two of them span a boundary.** The first,
1886-01-01 to 1919-06-27, spans the day `Q43287` and `Q41304` both give —
1918-11-09, one polity's dissolution and the next one's inception — so it is
cut there: `germany-prussia-1886` is the Empire's and `germany-prussia-1918`
the Republic's. The third, 1920-02-10 to 1938-09-29, spans both of the dates
the change to the Nazi state is given by — `Q41304`'s dissolution of 1933, to
the year, and `Q7318`'s inception of 1933-03-15, to the day. **It is cut at the
later one**, so that no period begins before the actor holding it does; the
cost is that the Weimar Republic's half runs about ten weeks past the year its
own item ends in, which is the `russian-empire` case of M52 §2.5 and the
`turkey-ottoman-empire-1920` case of M51 exactly: CShapes draws no boundary
where Wikidata puts one, and cutting at a day the dataset does not have would
be this atlas inventing a border. The other two periods begin and end inside
one polity and moved whole.

**Seven presences moved without being cut** — `prussia-1530`, `prussia-1600`,
`prussia-1650`, the two Basemaps snapshots of the join, `germany-prussia-1919`
and `germany-prussia-1938` — and **three periods were cut into six halves**,
two of those three changing hands as well. **Nine `actor` fields changed and
three presences were written**, so twelve records carry a placement this
milestone decided. **No outline in `data/geo/` is anything but what it was,
byte for byte**: a cut narrows a half's `geometry.files` to the period files
its own span touches and leaves the key alone, so the two halves of a cut
period carry one outline between them.

---

## 4. The successions

A gap no longer forbids a succession — the owner relaxed that rule on
17 September and M53 made it the warning `succession-gap` — but a succession
whose cited dates do not meet **says so in its own note**, and names what stood
in the interval without inventing an actor for it.

| relation | gap in years | dates meet | what the note names |
|---|---|---|---|
| `brandenburg-prussia--prussia--succeeded` | none | yes | — |
| `germany-prussia--weimar-republic--succeeded` | none | yes | — |
| `weimar-republic--nazi-germany--succeeded` | none | no | 1933-03-15 |
| `nazi-germany--german-federal-republic--succeeded` | 4 years | no | 1949-05-23 |

Two of the four meet exactly: Brandenburg-Prussia's dissolution and the
Kingdom's inception, and the Empire's dissolution and the Republic's, which
`Q43287` and `Q41304` both put on 1918-11-09. Two do not, and each says in its
own note what stood in the interval:

- **Weimar → the Nazi state.** `Q41304` dates the Republic's dissolution to
  **1933** and no further — the value carries year precision on Wikidata — and
  `Q7318` dates the Nazi state's inception to **1933-03-15**. The interval is
  inside one year, so the validator's `succession-gap` does not fire on it; the
  note carries it anyway, because a reader comparing the two records would
  otherwise find ten weeks unaccounted for. **What occupied them was the same
  German state**, under the government that took office that winter: neither
  item names a third polity for those weeks and none is invented here.
- **The Nazi state → the Federal Republic.** `Q7318` ends on **1945-05-23** and
  `Q713750` begins on **1949-05-23**, four years later, and `succession-gap`
  reports it. **What occupied those four years was the Allied occupation of
  Germany.** The atlas holds no record for it — not the occupation, not the
  Control Council, not the zones — and M55 writes none: that needs sources and
  is its own work, exactly as M52 said of the Russian gap. The CShapes period
  those years are drawn in is kept, on the Federal Republic's record and
  flagged, rather than left with no actor at all.

**Nothing is written between the Kingdom of Prussia and the German Empire**,
and §6.2 is why.

---

## 5. The events

Thirteen active events named `germany-prussia`. **An event's `actors` entry
names the actor that held the role then**, so they were moved by their own
dates: three stay with the Empire, three go to the Weimar Republic and seven to
the Nazi state.

| event | begins | names |
|---|---|---|
| `boxer-rebellion` | 1899 | `germany-prussia` |
| `world-war-i` | 1914 | `germany-prussia` |
| `treaty-of-brest-litovsk` | 1918 | `germany-prussia` |
| `treaty-of-versailles` | 1919 | `weimar-republic` |
| `beer-hall-putsch` | 1923 | `weimar-republic` |
| `great-depression` | 1929 | `weimar-republic` |
| `the-holocaust` | 1933 | `nazi-germany` |
| `spanish-civil-war` | 1936 | `nazi-germany` |
| `munich-agreement` | 1938 | `nazi-germany` |
| `molotov-ribbentrop-pact` | 1939 | `nazi-germany` |
| `world-war-ii` | 1939 | `nazi-germany` |
| `eastern-front` | 1941 | `nazi-germany` |
| `warsaw-uprising` | 1944 | `nazi-germany` |

**World War II now reads "Nazi Germany"**, which is the chip the owner was
looking at when they asked for this, and the Holocaust reads it too — as the
perpetrator, under an actor whose own record says what it is.

**Three entries name a polity the role outlives**, and they are listed rather
than grown, which is what M52 did with `world-war-i` on the Russian side:

- **`world-war-i`**, 1914-07-28 to 1918-11-11, role `belligerent`. The German
  Empire is what held that role when the war began, and that is the rule; its
  cited dissolution is 1918-11-09, **two days before the event's own end
  date**, so the last two days of the war belong to the Weimar Republic. The
  dates are not wrong and the `actors` list is what would have to grow.
- **`great-depression`**, 1929-10-29 to 1941, role `government`. The Weimar
  Republic is the government of the day when it begins; the event runs past
  1933 and the Nazi state is not named on it.
- **`world-war-ii`**, 1939-09-01 to 1945-09-02, role `belligerent`. `Q7318`
  ends the Nazi state on 1945-05-23, three months before the event's own end
  date, which is the war in the Pacific.

Nothing else in the corpus named any of these records: `germany` was named by
no event at all, and `german-federal-republic`'s two — the Treaty of Rome in
1957 and Schengen in 1985 — are both inside its new interval.

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
| `german-federal-republic-1945` | 1945 | 1949 | the Allied occupation of Germany; the atlas has no record for it, and this milestone writes none |

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

### 6.3 The occupation, 1945 to 1949

The four years between `Q7318`'s dissolution and `Q713750`'s inception are the
only interval in this milestone that a `succession-gap` warning fires on, and
the succession's own note names what held them. **No actor is written for it.**

*The question:* **is the Allied occupation one record or several**, and what
are its cited dates? CShapes draws the western zones as entity 260 from
1945-05-08 and the eastern as entity 265 from the same day, which is a dataset
boundary and not a founding on either side. A person who writes the missing
record moves one `actor` field — `german-federal-republic-1945` — and nothing
else.

### 6.4 The German Democratic Republic still begins at a file boundary

`german-democratic-republic` runs **1945 to 1990**, and its 1945 is the same
CShapes boundary the Federal Republic's was until this milestone. **M55 does
not touch it**: the brief is about the records `germany-prussia` conflated and
about the succession into the Federal Republic, and re-dating the GDR needs its
own lookup and its own succession. It is named here so that the atlas does not
quietly hold one corrected German record beside an uncorrected one without
saying so.

*The question:* **when does the GDR begin, by which item and property**, and is
the Nazi state succeeded by both German states or by neither?

### 6.5 What this milestone did not do

- **It invented no actor** — not for the ground before 1618, not for the ten
  weeks of 1933, not for the occupation. That needs sources and is its own work.
- **It wrote no date that is not cited** to a QID and a property in §1, or
  already carried by a record with its own source.
- **It drew no geometry and redrew no outline.** Every file in `data/geo/` is
  byte for byte what it was; three periods were cut and each cut's two halves
  share one key.
- **It changed nothing the reader sees** beyond the names on the records and
  the actors the events name — which is the whole point of the milestone.
