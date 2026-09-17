# Build brief — M56: a long event's actors, and the small debts

Two things, both small, both owed.

## 1. The overlap rule, which is a bug in a test and not in four records

Measured 17 September, after M53 wrote the chain's `actors` entries: **four
active events name an actor not alive at their date**, and three of them are
M53's own work:

| event | span | actor | actor's span |
|---|---|---|---|
| `the-atlantic-slave-trade-to-brazil` | 1540– | `empire-of-brazil` | 1822–1889 |
| `the-atlantic-slave-trade-to-the-caribbean` | 1640– | `united-kingdom-before-1886` | |
| `royal-african-company` | 1660 | `united-kingdom-before-1886` | |
| `chinese-civil-war` | 1946 | `taiwan` | 1949– |

**The Empire of Brazil genuinely was an actor in the Atlantic trade.** The
trade begins in 1540 and the Empire in 1822, so the entry is right and the
test is wrong: it asks whether the actor was alive at the event's **start**,
which is correct for a battle and nonsense for a three-century process.

**The rule becomes overlap.** An `actors` entry is sound when the actor's span
**overlaps** the event's span. Fix the check wherever it lives — the validator,
the tests M53 added, and any tool that repeats it — and say in `STATUS.md` how
many of the four survive the corrected rule. **`chinese-civil-war` → `taiwan`
will not**: 1946 is outside 1949–, no overlap, and it is a real error that
predates all of this. Fix it if the records settle who held Taiwan in 1946, or
list it with the question.

## 2. The ids that no longer describe what they hold

Four active actors carry an id that contradicts their own span:

- `belize-before-1886` — runs to **1981**
- `bhutan-before-1886` — runs to 1948
- `philippines-before-1886` — begins 1492
- `russia-soviet-union` — now means only the Russian Federation, 1991–

These are handles, not claims, so the data is not wrong — but they appear in
URLs and in the review dashboard, and `-before-1886` is exactly the import
artefact M51 existed to erase. **Rename each to an id that describes what the
record now holds**, keeping the old id in `aliases` so nothing that points at
it breaks, and moving every reference in one commit (rule 11). Where the
obvious name is taken — `belize` is the modern state — **say what you chose and
why** rather than inventing a suffix.

## 3. The two Wikidata ids that point at the wrong thing

`braga` carries **Q3344946** where the city is **Q83247**, and `washington`
carries **Q1018557** where the place meant is **Q61**. Both were found in
September and neither has been fixed. **Check each against Wikidata before
changing it** — the atlas can reach Wikidata now — and correct or list.

The **13 unresolved places** are in the same family: work them if the records
or Wikidata settle them, and leave the rest listed.

## 4. What must stay true

No invented date; no new record type, hex value, token or type size; no
display change. `validate --index` clean and `build-index.mjs` committed at
every commit touching `data/` — **records first, rebuild, then the index**
(deviation 798). Tests before the behaviour they judge (711, 717). Nothing
merged into `main`.

## 5. Done when

The overlap rule is the rule and its tests say so; the four ids describe what
they hold and their aliases keep old links alive; the two Wikidata ids are
checked; what remains open is listed with its question; `validate --index`
clean; tests green; `M56 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
