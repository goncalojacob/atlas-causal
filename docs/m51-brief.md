# Build brief — M51: close the seam on territory, not on dates

The owner, 16 September, on being told the seam had been surveyed and handed
back for a person to work: **"Just fix the seam thing"**.

M49 asked Wikidata and was told nothing usable: it models modern states, so
`angola-under-portugal` resolves to Angola-born-1975 and every one of the 26
pairs came back "for a person". **That was the right refusal to the question
M49 asked. This milestone asks a different question, and the atlas can answer
it from what it already holds.**

Read `docs/m49-actors.md` (the survey — **the 26 pairs and what the lookup
saw**), `docs/m49-dates.md` (the green lookup's output), `CLAUDE.md` (the rule
on AI-written historical claims — **it is not relaxed here and this milestone
does not need it relaxed**), `STATUS.md`, `docs/run-protocol.md` including its
amendments, `schema/v1/actor.json`, `schema/v1/presence.json`,
`schema/v1/relation.json`, `src/validate/rules.js` (rules 4, 11, 24),
`tools/build-index.mjs` (**M48's `grounds` work is the pattern for reading
geometry**), and this file including any "Amendments after review".

## 1. Why this can be done without inventing a date

Two facts are already established and neither is a historical claim:

- **The 1885/1886 boundary is an artefact.** 123 records end in exactly 1885,
  all from Historical Basemaps; 128 begin in exactly 1886, all from CShapes.
  That is where one file stops and the other starts. It is arithmetic about
  two imports, not a fact about the world.
- **The atlas holds the territory of both sides.** Every one of the pairs
  carries presence polygons on each side of the seam — checked, 16 September:
  `belize-before-1886` 5 and `belize-under-united-kingdom` 2, `madagascar` 12
  and `madagascar-malagasy` 5, `ottoman-empire` 13 and
  `turkey-ottoman-empire` 9.

So the question this milestone asks is **not** "when did this polity begin or
end" — which needs a source the atlas does not have — but **"are these two
records the same polity"**, which the ground answers. **Containment and
overlap are geometry: measuring that two polygons cover the same land is
reading two records, not deciding between them.** That is the same principle
M48 established for actor grounds, applied to identity.

**And the merged record invents no date.** Its span runs from the 1885-side
record's own start to the 1886-side record's own end. Both numbers already
exist in the atlas, each already carries its source, and neither is authored
here. What the join asserts is identity, and identity is evidenced.

## 2. The rule, and the one place it must not overreach

For each of the 26 pairs, measure the overlap of the last presence before the
seam against the first presence after it — intersection over the area of the
smaller, so a colony that grew is not punished for growing.

1. **High overlap, and the names reduce to the same stem** (`belize-before-1886`
   / `belize-under-united-kingdom`, `madagascar` / `madagascar-malagasy`) →
   **join**. One record spanning both periods, the other merged into it with
   `supersededBy`, every presence and every reference moved in **one commit**
   (rule 11), the surviving id being the one more records already point at.
   **No succession relation** — nothing succeeded anything.
2. **High overlap, but the name is genuinely a different polity**
   (`ottoman-empire` / `turkey-ottoman-empire`, `persia` / `iran-persia`) →
   **this is a succession and it needs a real date**, which for exactly these
   two the green lookup already found: Ottoman Empire `Q12560` **P576
   1922-11-17**; Qajar Iran `Q63158027` **P571 1789, P576 1925**. Split at the
   sourced date, cite the QID and the property, write the `succeeded` relation.
   **Where no such date exists, the pair stays open** — it does not become a
   join because joining was easier.
3. **Low overlap** → not a pair at all. Leave both records alone and say so;
   `harer-egypt` / `egypt-under-united-kingdom` is already known to be this.

**Do not pick the threshold from one case.** Compute all 26 overlaps first,
write the distribution into `docs/m51-overlaps.md`, and choose the cut from
where the numbers actually separate — then put **everything within sight of
the cut to a person**, not to whichever side is closer. Fitting a constant to
one example is the mistake `NEAR_ZOOM` made and `NEAR_SPAN` had to undo.

## 3. Russia, which is the owner's own example

`gwcode 365` carries the Russian Empire, the Soviet Union and the Russian
Federation under one label, which is what put "Russia (Soviet Union)" on a
chip. M49 could not split it because it asked Wikidata under the **dataset's**
label. **Ask again under the three names themselves** — "Russian Empire",
"Soviet Union", "Russian Federation" — through the same `--dates` mode on the
same GitHub runner, where these are three distinct, well-described items.
If the runner returns sourced inception and dissolution dates for the three,
split `russia-soviet-union` into three actors with two `succeeded` relations
and divide the presences by date. **If it does not, leave Russia open and say
exactly what is missing** — the owner would rather see the seam than a guess.

## 4. What must stay true

- **No invented date, ever.** Every date written here is copied from a record
  that already held it, or cited to a QID and a property. This milestone needs
  no exception to `CLAUDE.md` and must not take one.
- **A join is an identity claim and must show its evidence**: the merged record
  records the overlap it rested on and both source datasets in `sources`.
- Rule 11: a record and everything naming it move in **one commit**.
- An event's `actors` entry names the actor that held the role **then**.
- Presences **move**; they are not duplicated and geometry is never redrawn.
- `node tools/validate.mjs --index` clean and `node tools/build-index.mjs`
  committed at every commit touching `data/` (amendment of 15 September).
- The commit that teaches the tests goes **before** the one that changes what
  they see (deviations 711 and 717).

## 5. What this run must not do

No new geometry, no new import of records, no new source for a date beyond the
QIDs the lookup returns. **No display change** — M48 owns what the reader
sees. No new record type, hex value, token or type size. Nothing merged into
`main`; `docs/drafts/` ignored.

## 6. Tests

1. **No active actor ends in exactly 1885 while a same-stem actor begins in
   exactly 1886** — or, where one remains, it is listed in `docs/m51-overlaps.md`
   with its verdict, and the test asserts that correspondence rather than a count.
2. A succession's two actors do not overlap in time, and the successor begins
   no earlier than the predecessor ends.
3. Every succession's dates cite a QID and a property.
4. Every presence belongs to an actor alive in the presence's own period.
5. Every event's `actors` entry resolves to an actor alive at the event's date
   — **`chinese-civil-war` (1946) naming `taiwan` (1949–open) is known and
   predates this milestone**; fix it if this run touches those records, list it
   if not.
6. No test pins a count of actors.

## 7. Done when

Every one of the 26 is joined, split with a sourced date, or listed with the
question a person must answer and why the ground could not settle it; Russia is
three actors and two successions, or open with its reason written out;
`docs/m51-overlaps.md` carries all 26 overlaps and the chosen cut;
`validate --index` clean; tests green; `M51 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
