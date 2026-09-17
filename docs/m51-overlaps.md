# M51 — the 26 overlaps at the 1885/1886 seam, and the cut

M49 asked Wikidata *when did this polity begin or end* and was told nothing
usable. This milestone asks a different question — **are these two records the
same polity** — and the ground answers it. What follows is the measurement,
the distribution, the cut chosen from it, and the verdict on all 26.

Regenerate the numbers with `node tools/m51-overlaps.mjs`; `tests/m51.test.mjs`
asserts that every ratio in the table below is the one the tool measures, so
this file cannot drift from the data.

## 1. What is measured, and what it is not

For each pair: the **last presence before the seam** on the 1885 side against
the **first presence after it** on the 1886 side, intersection over the area of
the **smaller**, so a colony that grew is not punished for growing.

`tools/overlap.mjs` sweeps by lines of latitude. On each line the crossings of
every ring give longitude intervals by parity; the interval length is weighted
by cos(lat), because a degree of longitude shrinks with latitude. No
projection, no library — the same arithmetic `src/map.js` would do, one line at
a time. The unit is equator-equivalent square degrees and it cancels in the
ratio.

Resolution is taken from the *smaller* of the two outlines, so an island does
not fall between lines. Every ratio below was recomputed at eight times the
resolution and **none moved by more than 0.0001**, so no verdict here rests on
how finely the sweep was cut.

**This measures territory, not time.** It says nothing about when anything
began or ended, and no date in this file was authored here.

## 2. The distribution

26 pairs, sorted by overlap.

| overlap | 1885 side | 1886 side | last before | first after | smaller side |
|---|---|---|---|---|---|
| 0.0000 | `harer-egypt` | `egypt-under-united-kingdom` | `harer-egypt-1880` | `egypt-under-united-kingdom-1886` | before |
| 0.0687 | `congo-before-1886` | `congo-under-france` | `congo-before-1886-1880` | `congo-under-france-1886` | before |
| 0.7956 | `senegal-fr` | `senegal-under-france` | `senegal-fr-1880` | `senegal-under-france-1886` | before |
| 0.8615 | `malta-before-1886` | `malta-under-united-kingdom` | `malta-before-1886-1880` | `malta-under-united-kingdom-1886` | after |
| 0.8700 | `egypt-before-1886` | `egypt-under-united-kingdom` | `egypt-before-1886-1880` | `egypt-under-united-kingdom-1886` | after |
| 0.8789 | `philippines-before-1886` | `philippines-under-united-states-of-america` | `philippines-before-1886-1880` | `philippines-under-united-states-of-america-1886` | before |
| 0.8979 | `ottoman-empire` | `turkey-ottoman-empire` | `ottoman-empire-1880` | `turkey-ottoman-empire-1886` | after |
| 0.9077 | `victoria-uk` | `victoria` | `victoria-uk-1880` | `victoria-1886` | before |
| 0.9158 | `iceland-before-1886` | `iceland-under-denmark` | `iceland-before-1886-1880` | `iceland-under-denmark-1886` | after |
| 0.9204 | `fiji-before-1886` | `fiji-under-united-kingdom` | `fiji-before-1886-1880` | `fiji-under-united-kingdom-1886` | after |
| 0.9386 | `bhutan-before-1886` | `bhutan-under-united-kingdom` | `bhutan-before-1886-1880` | `bhutan-under-united-kingdom-1886` | before |
| 0.9431 | `annam` | `vietnam-annam-cochin-china-tonkin` | `annam-1880` | `vietnam-annam-cochin-china-tonkin-1886` | before |
| 0.9463 | `belize-before-1886` | `belize-under-united-kingdom` | `belize-before-1886-1880` | `belize-under-united-kingdom-1886` | after |
| 0.9471 | `south-australia-uk` | `south-australia` | `south-australia-uk-1880` | `south-australia-1886` | before |
| 0.9514 | `mozambique-before-1886` | `mozambique-under-portugal` | `mozambique-before-1886-1880` | `mozambique-under-portugal-1886` | before |
| 0.9578 | `italy` | `italy-sardinia` | `italy-1880` | `italy-sardinia-1886` | after |
| 0.9806 | `new-south-wales-uk` | `new-south-wales` | `new-south-wales-uk-1880` | `new-south-wales-1886` | after |
| 0.9824 | `germany` | `germany-prussia` | `germany-1880` | `germany-prussia-1886` | before |
| 0.9831 | `persia` | `iran-persia` | `persia-1880` | `iran-persia-1886` | after |
| 0.9849 | `western-australia-uk` | `western-australia` | `western-australia-uk-1880` | `western-australia-1886` | before |
| 0.9882 | `madagascar` | `madagascar-malagasy` | `madagascar-1880` | `madagascar-malagasy-1886` | before |
| 0.9908 | `gabon-before-1886` | `gabon-under-france` | `gabon-before-1886-1880` | `gabon-under-france-1886` | before |
| 0.9914 | `algeria-fr` | `algeria-under-france` | `algeria-fr-1880` | `algeria-under-france-1886` | before |
| 0.9944 | `angola-portugal` | `angola-under-portugal` | `angola-portugal-1880` | `angola-under-portugal-1886` | before |
| 0.9956 | `sierra-leone-before-1886` | `sierra-leone-under-united-kingdom` | `sierra-leone-before-1886-1880` | `sierra-leone-under-united-kingdom-1886` | before |
| 0.9958 | `queensland-uk` | `queensland` | `queensland-uk-1880` | `queensland-1886` | before |

As a histogram, in tenths:

```
0.0–0.1  ##                                      2
0.1–0.2                                          0
0.2–0.3                                          0
0.3–0.4                                          0
0.4–0.5                                          0
0.5–0.6                                          0
0.6–0.7                                          0
0.7–0.8  #                                       1
0.8–0.9  ####                                    4
0.9–1.0  ###################                    19
```

## 3. The cut, chosen from the numbers and not from a case

The distribution is not a gradient with a debatable knee. It is **two
observations below 0.07 and twenty-four at or above 0.7956**, with nothing at
all in between.

- The empty band runs from **0.0687 to 0.7956** and is **0.727 wide**.
- The largest gap anywhere inside the upper cluster is **0.066**
  (`senegal-fr` 0.7956 → `malta-before-1886` 0.8615).
- The empty band is therefore **eleven times** the widest gap the data shows
  anywhere else.

**The cut is 0.50**, the middle of that band.

Nothing is within sight of it. The nearest observation on either side is 0.3
away — more than four times the widest within-cluster gap — so a band of
±0.25 around the cut, ten times wider than any gap inside the data, still
contains **nothing**. No pair here is decided by where in the empty band the
line was drawn: moving the cut anywhere from 0.10 to 0.79 changes not one
verdict. That is the whole reason this number is allowed to be a constant at
all, and it is the opposite of what `NEAR_ZOOM` did — there a constant was
fitted to one example, and `NEAR_SPAN` had to undo it.

**Below the cut → not a pair.** Two pairs: leave both records alone.
**Above the cut → the same ground.** Twenty-four pairs, and for those the
second question is the name.

## 4. Above the cut, the name decides between join and succession

High overlap says *the same ground*. It does not say *the same polity*: a
successor state stands on its predecessor's ground, which is what succession
means. So for the twenty-four above the cut the second test is the one the
brief sets — **do the two names reduce to the same stem?**

Reducing a stem means removing what the two imports added and nothing else:
`-before-1886` (Historical Basemaps' seam marker), `-under-<sovereign>` and
`-fr`/`-uk` (the dependency the record already states in its own fields), and
a parenthetical that is a demonym or a former name of the same thing.

It does **not** mean removing a second polity's name. `turkey-ottoman-empire`
is "Turkey (Ottoman Empire)", and Turkey and the Ottoman Empire are two
polities, not one under two labels. Where that is so, the pair is a
**succession, and a succession needs a real date** — so it is written only
where the lookup already found one, and stays **open** where it did not.
A pair does not become a join because joining was easier.

## 5. The verdict on all 26

**Joined — 19, and a twentieth in M55.** Same ground, and the stem reduces:

| pair | overlap | stem |
|---|---|---|
| `algeria-fr` / `algeria-under-france` | 0.9914 | `algeria` |
| `angola-portugal` / `angola-under-portugal` | 0.9944 | `angola` |
| `belize-before-1886` / `belize-under-united-kingdom` | 0.9463 | `belize` |
| `bhutan-before-1886` / `bhutan-under-united-kingdom` | 0.9386 | `bhutan` |
| `egypt-before-1886` / `egypt-under-united-kingdom` | 0.8700 | `egypt` |
| `fiji-before-1886` / `fiji-under-united-kingdom` | 0.9204 | `fiji` |
| `gabon-before-1886` / `gabon-under-france` | 0.9908 | `gabon` |
| `iceland-before-1886` / `iceland-under-denmark` | 0.9158 | `iceland` |
| `madagascar` / `madagascar-malagasy` | 0.9882 | `madagascar` |
| `malta-before-1886` / `malta-under-united-kingdom` | 0.8615 | `malta` |
| `mozambique-before-1886` / `mozambique-under-portugal` | 0.9514 | `mozambique` |
| `new-south-wales-uk` / `new-south-wales` | 0.9806 | `new-south-wales` |
| `philippines-before-1886` / `philippines-under-united-states-of-america` | 0.8789 | `philippines` |
| `queensland-uk` / `queensland` | 0.9958 | `queensland` |
| `senegal-fr` / `senegal-under-france` | 0.7956 | `senegal` |
| `sierra-leone-before-1886` / `sierra-leone-under-united-kingdom` | 0.9956 | `sierra-leone` |
| `south-australia-uk` / `south-australia` | 0.9471 | `south-australia` |
| `victoria-uk` / `victoria` | 0.9077 | `victoria` |
| `western-australia-uk` / `western-australia` | 0.9849 | `western-australia` |

The twentieth, added by M55 on 17 September: `germany` / `germany-prussia`,
0.9824, the pair left open below. It is joined into `germany-prussia`, which
is now the German Empire. What M51 lacked was a date, and `Q43287` — P571
1871-01-01, P576 1918-11-09 — is it: both Historical Basemaps snapshots on the
1885 side fall inside those two days, so the two records are one polity under
two file names rather than two polities either side of a seam. The span rule
of the paragraph below does not hold for this one, and deliberately: the
survivor's interval is Wikidata's and not the two files' boundaries, and its
1886-side end of 1945 is gone because the Weimar Republic and the Nazi state
were split out of it in the same milestone. See `docs/m55-germany.md`.

"Madagascar (Malagasy)" is the demonym, not a second polity. `-under-<x>` is
the dependency the record already carries in `dependencyOf` and
`dependencyKind` on its presences; it is a way of holding ground, not another
polity's name — which is exactly why `belize-before-1886` /
`belize-under-united-kingdom` is the brief's own example of a join.

Each join spans the 1885-side record's **own** start to the 1886-side record's
**own** end. Both numbers were already in the atlas and both already carry
their source. Nothing is authored. The merged record's `review.note` records
the overlap the identity rested on, and `sources` carries both datasets.

**Split, with a sourced date — 2.** Same ground, but the name is two polities,
and for exactly these the green lookup found a date:

| pair | overlap | sourced date |
|---|---|---|
| `ottoman-empire` / `turkey-ottoman-empire` | 0.8979 | `Q12560` **P576 1922-11-17** |
| `persia` / `iran-persia` | 0.9831 | `Q63158027` **P571 1789, P576 1925** |

**Left open — 2, and a third answered since.** Same ground, the name is not
one stem, and no date exists to split on. Each asks a question a person must
answer:

- **The German pair, 0.9824.** "Germany (Prussia)". Prussia and the German
  Empire are two polities, so this was the shape of a succession — but
  Wikidata could not say which: the 1885-side record came down to `Q183` with
  **seven** P571 values, and the 1886-side one survived `Q183`, `Q38872` and
  `Q27306` without choosing. *The question was:* is the 1886 record Prussia
  continuing, or the German Empire? **M55 answered it on 17 September**: the
  German Empire, on `Q43287` — P571 1871-01-01, P576 1918-11-09 — and the pair
  is joined, which is why it is listed with the joins above and not here any
  more. `docs/m55-germany.md` is the milestone, and the 1886 record no longer
  runs to 1945: the Weimar Republic and the Nazi state were split out of it.
- **`italy` / `italy-sardinia`, 0.9578.** "Italy/Sardinia". The label names two
  polities with a slash and the lookup found nothing at all for it — no
  Wikidata item matches the string "Italy/Sardinia" — while `italy` survived
  four items without coming down to one. *The question:* which of the two the
  1886 record is, and if it is a succession, on what sourced date.
- **`annam` / `vietnam-annam-cochin-china-tonkin`, 0.9431.** The stems do not
  reduce to each other in either direction: the 1886 record names three
  territories and the 1885 record names one of them. High overlap here says
  Annam's ground is inside the wider record, which is containment, not
  identity. *The question:* whether the 1885 side should be joined into the
  wider record, or kept as one of its parts — and if joined, what becomes of
  the other two territories the name lists, which have no 1885-side record
  here at all.

**Not a pair — 2.** Below the cut; both records left exactly as they are:

- **`harer-egypt` / `egypt-under-united-kingdom`, 0.0000.** The outlines do not
  touch. Confirmed independently of `docs/m49-actors.md` §2, which named this
  as the matcher's false pair on the token "Egypt" alone. The ground agrees.
- **`congo-before-1886` / `congo-under-france`, 0.0687.** Two different
  territories that share a name. 0.0687 is not a seam; it is a border.

19 + 2 + 3 + 2 = 26.

## 6. Russia, which is the owner's own example, and stays open

`russian-empire` (1783–1885, Historical Basemaps) and `russia-soviet-union`
(1886–open, CShapes `gwcode 365`) are not one of the 26 — the names do not
reduce to one stem — but they are the same seam, and "Russia (Soviet Union)"
on a chip is what started all of this.

**The ground was measured, and it says what it says for the others.** The last
outline before the seam against the first after it: **0.9766**, far above the
cut. So the 1885/1886 boundary between these two records is the same artefact
as everywhere else, and what is uncertain is not *whether* the ground is
continuous but *where inside it the three polities divide*.

**The split still cannot be written, and the reason is not the one the brief
expected.** The brief asks for the lookup to be run again under the three
names themselves — "Russian Empire", "Soviet Union", "Russian Federation" —
on the grounds that M49 had only asked under the dataset's label. It had not:
`docs/m49-subjects.txt` already asks `russia-soviet-union` three ways, and
`russian-empire` as its own record. What came back is in `docs/m49-dates.md`:

- **Russian Empire** — `Q34266`, P571 1721-10-22, **P576 1917-09-01**.
- **Soviet Union** — `Q15180`, P571 1922-12-30 *and* 1923-07-06, **P576
  1991-12-26**.
- **Russian Federation** — never asked, and cannot be.

The third is not a question the runner refused; it is a question
`tools/import/wikidata.mjs` will not carry to the network at all.
`probeFor` accepts only a name the record already holds or a part of one, and
`russia-soviet-union` holds exactly `"Russia (Soviet Union)"`, from which
`derivableNames` takes `Russia` and `Soviet Union`. Asked for "Russian
Federation" it answers, before any fetch:

> `"Russian Federation" is not a name` `russia-soviet-union` `carries, nor a
> part of one`

That guard is right and is not worked around here. To ask the question, a
person first writes "Russian Federation" onto the record's `names` — and
writing that name onto `gwcode 365` **is** the judgement that the record
covers the Federation, which is the very thing being asked. A run on the
runner would have reproduced `docs/m49-dates.md` and this refusal, so none was
spent on it.

**What a person has to supply**, unchanged from `docs/m49-actors.md` §7 and
now with the ground behind it:

1. **The Federation's item.** Narrowed to "Russia" the lookup survived `Q159`
   and `Q34266` and would not choose, which is correct — "Russia" names both
   the Federation and the Empire. One QID, written onto the record as a name
   or as `wikidata`, and the lookup can do the rest.
2. **Which of `Q15180`'s two inceptions**, 1922-12-30 (the treaty) or
   1923-07-06 (the constitution).
3. **What holds the ground from 1917-09-01 to 1922-12-30.** `Q34266` ends
   there and `Q15180` begins here; five years stand between them. A succession
   written across that gap would be a claim about who held Russia in 1919, and
   this milestone does not make it. Either a fourth record covers it or a
   person decides the relation spans it.

Once those three are answered the presences follow mechanically: `gwcode 365`
carries 24 periods of territorial validity, they are on disk, and dividing
them by date needs no source at all.

Until then `russia-soviet-union` stays one record, ending nowhere, and
`russian-empire` still ends in 1885. **Leaving the seam visible is the point.**
The chip the owner objected to is still wrong, and it is wrong in a way that
says so, which is better than a chip that is wrong quietly.

## 7. What the joins do not settle

Two things are inside the joined records and are **not** this milestone's to
decide. They are written here so they are not lost:

- **The five Australian colonies** (`new-south-wales`, `queensland`,
  `south-australia`, `victoria`, `western-australia`) are joined because the
  two records are plainly one thing. `docs/m49-actors.md` §4a kind C asks a
  different question about them — whether a subnational colony is an actor in
  this atlas's sense at all, given that nothing the Wikidata search returned is
  typed as a polity by `data/imports/wikidata-seeds.json` → `classes`. That is
  an editorial decision about the class table, it is unchanged by joining, and
  it is still open.
- **A joined record's span is two imports' coverage laid end to end**, not a
  claim about when the polity began or ended. The Historical Basemaps import
  says so on every record it wrote. `germany-prussia` running to 1945 and
  `italy-sardinia` running to the present were already that way before this
  milestone and are not made truer by a join.
