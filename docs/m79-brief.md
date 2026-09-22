# Build brief — M79: an event may be part of several

The owner, 22 September, shown the list of umbrellas: **"Can't we have many
umbrellas for the same event? For example, the angola independence is both
under the Portuguese third republic and african decolonization."**

## 1. What changes in the record

`parent` (schema/v1/event.json) admits **a list of ids** as well as one id
or null. One parent is a list of one; every record in `data/` today is valid
as it stands and **none is rewritten by this milestone** — churn on eight
hundred files says nothing. New filings write a list when there is more than
one. A helper, one place, answers `parentsOf(event)` as an array for any of
the three shapes, and everything below reads through it.

Rule 24 applies **per parent**: each resolves to an active event; the graph
of `part of` has no cycle through any path; a child dated outside any one of
its parents is the same warning, naming which. A record that lists the same
parent twice, or lists itself, is an error.

## 2. What changes in the display

- **The resting picture is unchanged in meaning**: a main event is one with
  no parent at all (`restingSet`).
- **Opening an umbrella** shows every event that has it *among* its parents
  (`childrenOf` in `data.js` is built from every parent, not the first), on
  the map, the graph and the timeline. Angola 1975 is inside the Third
  Republic and inside the decolonisation of Africa, and each opens on it.
- **`parentsOf` in `lens.js`** keeps *all* of a lens's parents in the
  picture, dimmed, as it keeps one today.
- **The ring** (`parts.js`) reads any parent. **The card** (`panel/event.js`)
  says "part of" each parent, in order. `attributes.js`, `arrangement.js`,
  the contribution bundle and `tools/m42-pool.mjs` read through the helper.
- The window band's profile, the categories and the lens are unchanged.

## 3. What this run must not do

No new record, no historical claim, no filing — lane B files (amendment A8 of
M42, which waits on this milestone's done line). No new hex value, token or
type size. `validate --index` clean; tests before behaviour (711, 717); no
test pins a count or a pixel. Nothing merged into `main`; ignore
`docs/drafts/`. Lane A numbers deviations on from where M78 stopped.

## 4. Tests

1. A record with `parent: ["a", "b"]` validates; with `["a", "a"]` or
   `["self"]` it does not; a child dated outside one of two parents warns
   and names which.
2. `childrenOf` lists the child under both parents; `restingSet` excludes
   it; opening either parent (the lens) includes it, on all three views.
3. A record with a string `parent` behaves exactly as before, and the
   fixture set carries one of each shape.
4. The card lists both parents; the ring is drawn for a parent whose only
   child names it second.

## 5. Done when

The fixture atlas has one event with two parents and every view opens it
from either; the validator judges the three shapes; screenshots
`docs/screens/m79-*.png`; `STATUS.md` says what was decided about rewriting
existing records and why; `M79 done`.

## Amendments after review

**A1 (22 September). The merged tree fails one timeline test, and it is
yours before `M79 done`.** `m0` at `874c6395` carries M42's snapshot (581
active events) under M77's titled rows for the first time, and
`tests/timeline-browser.test.mjs` 217 — *a state change updates the bars in
place and does not rebuild them* — fails **deterministically**, twice with
the same numbers: `and it is the same drawing (969 to 957)`. The churn
assertions pass (fewer than 5 % of elements added or removed); what fails is
the last one, a **fixed** `Math.abs(after - before) < 10` beside bounds the
test itself turned into a share of the drawing because "raising it by one
per milestone is a bound that means nothing". Do this on the real page at
`?selected=carnation-revolution-1974&focus=none` with the merged data:
**name the twelve elements** the click removes net. If they are the opened
bar's own ring, glyph, title and label moving between the packed rows and
the held layer — the test's "handful" — then the last bound becomes the same
share as the others, with this reason in the commit. If they are anything a
reader would miss — twelve labels gone from neighbouring rows, a ring
dropped — that is a display defect of M77 under volume and is fixed here,
with the test unchanged. Say which in `STATUS.md`. Your own check on `m79`
will show the same red until this is done, and the snapshot pull request the
owner is waiting for is held on it.
