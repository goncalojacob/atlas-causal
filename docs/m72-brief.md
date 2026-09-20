# Build brief — M72: every link carries the sources a reader can check

The owner, 21 September: *"First I think each link should have sources
associated with it, then I think the confidence visibility thing makes
sense."* This is the first half. M73 is the second and waits on it.

## 1. Measured, 21 September

**362 active edges, and every one already names a source** — 81 name one,
264 name two, 17 name three. So the owner's request is not "sources where
there are none"; it is **sources a reader can actually check, and enough of
them to mean something**. Two things are thin:

- **81 edges rest on a single source**, and among the 264 with two, many pair
  the English and Portuguese Wikipedia articles — which the confidence rule
  (rule 9) rightly counts as **one author**, which is why the corpus stands at
  **61 `consensus`, 282 `probable`, 19 `disputed`**.
- **Locators are mostly `null`.** A source without a page, section or
  timestamp is a title on a shelf, not a citation. *"Maxwell 1995"* does not
  let anyone check that the 25th of April led to the decolonisation talks;
  *"Maxwell 1995, pp. 112–118"* does.

## 2. What to build

**Measure first**, in `docs/m72-sources.md`, its own commit: for every active
edge, how many sources, how many distinct authors, whether each has a
locator. Then, edge by edge, starting with the 81 and the two-editions pairs:

1. **A second, independent source where one exists** — found the way the
   owner's decision of 16 September allows: a work Wikipedia itself cites for
   the claim. Written as a source record if the atlas lacks it, with the
   citation on the edge.
2. **A locator on every source the run touches**, and on every existing
   source where the cited article makes the locator findable (a section
   heading is a locator; a page number is a better one).
3. **Promotion to `consensus` only where rule 9 is now satisfied** — two
   sources, two authors — and **never by this run's own judgement of the
   claim**. A claim whose second source contradicts the first becomes
   `disputed`, with the contradiction noted, not quietly left `probable`.

**Where no second source can be found, the edge stays as it is and is
listed.** Thin is honest; padded is not.

## 3. What this run must not do

**No new edge, no removed edge, no changed direction or type.** No invented
source, page or date. No AI-written historical claim: what goes on an edge is
what a cited work says. No new record type, confidence value, hex value,
token or type size; no display change. `validate --index` clean; records
first, rebuild, then the index (798). Tests before the records they judge
(711, 717). Nothing merged into `main`; ignore `docs/drafts/`.

## 4. Tests

1. Every active edge names at least one source — the property, which holds
   today and must still hold.
2. Every source this run added carries a locator.
3. Every `consensus` edge has two sources by different authors, asserted from
   the records — and every edge this run promoted is one of them.
4. No `probable` edge was promoted without a second author.
5. No test pins a count.

## 5. Done when

`docs/m72-sources.md` carries the measurement and, at its end, the same table
after; `STATUS.md` says how many edges rest on one source now against 81, how
many sources carry a locator now against before, and the confidence counts now
against 61 / 282 / 19; the unpromotable edges are listed; `validate --index`
clean; tests green; `M72 done`.

## Deviations this brief takes: lane B, numbered from 950 upward
