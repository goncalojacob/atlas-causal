# Build brief — M63: the check tells the truth again

The branch's check has been red since 17 September. **Nothing is wrong with the
atlas.** That is exactly the problem: a head that is always red cannot report a
head that is actually broken, and every run since M58 has had to be told in its
own prompt to ignore the check — which is a standing instruction to not look at
the one thing that would catch a regression.

## 1. What is already measured, so that no one measures it again

Deviation **844**, and **826** before it:

- The head fails on **a different test each run**. Four full local runs on an
  unchanged head dropped the explanation test twice, `zoomed to Portugal,
  Lisbon is named once` once, and **one run was clean at 1,666 of 1,666**.
- Run **843** was M59's own claim commit `e1d7b0be` — **one appended line in
  `STATUS.md` and no code at all** — and it failed with the same message.
  Runs 841, 842, 844, 848 and 864 are red across M58's and M59's commits too.
- Every failure is a **`waitFor` timeout and never a wrong value**.
- **The obvious patch was tried and is wrong.** With that one wait raised to
  `{ tries: 400 }` the explanation test passed and the failure **moved** to
  another test, so it was reverted.

**So it is the browser suite under load, not a regression and not one test.**
Do not re-derive this. Start from it.

## 2. What this milestone is not allowed to be

**A green check bought by not running the tests is worse than a red one.**
Specifically forbidden: `continue-on-error`, a blanket retry of the suite or of
failed tests, raising every timeout, deleting a test, or marking one `skip`.
**The suite is at 1,684 tests and 0 skipped and the skipped count must still be
0 at the end.** If this run cannot make the check green honestly, it says so and
leaves it red.

## 3. What to build

**Find the contention and remove it.** The measurement comes first, in
`docs/m63-load.md` and its own commit:

- How many browser suites run at once, what `--test-concurrency` resolves to on
  the runner, and **how many browsers are open simultaneously** at the peak.
- What the runner actually has — cores and memory — against what a full run
  uses at its peak.
- **A full run at concurrency 1 against a full run at the default**: whether it
  is green, and what it costs in wall-clock. That single number decides most of
  this milestone.

**Then fix the cause the measurement names.** Serialising the browser suites,
or giving each its own browser rather than sharing one, or capping concurrency
for the browser tests alone while the pure tests stay parallel — whichever the
numbers point at. **A slower check that is honest is an acceptable trade and a
faster one that lies is not.**

**Only if the cause cannot be removed**, quarantine explicitly: a named list in
one file, a check that is green **and prints what is quarantined**, and a line
in `STATUS.md` saying what is no longer being watched. **An unnamed quarantine
is the red head again with better manners.**

## 4. What this run must not do

No new record and no historical claim. No change to what any test asserts —
**this milestone changes how the tests are run, not what they check.** No new
runtime dependency in the atlas itself. Nothing merged into `main`; ignore
`docs/drafts/`.

## 5. Done when

**Ten consecutive full runs on an unchanged head, all green**, and the ten
reported with their wall-clock times. Anything less than ten is reported as what
it is. `docs/m63-load.md` carries the load measurement; `STATUS.md` says what
the check costs now against what it cost before, and **whether the standing
instruction to ignore the check can be dropped from future briefs** — which is
the real deliverable. `validate --index` clean; 0 skipped; `M63 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
