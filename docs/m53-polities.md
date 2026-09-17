# M53 — the polities the events need, and the rule that stopped forbidding

`docs/m53-brief.md` is the instruction; this is the account. `tests/m53.test.mjs`
reads this file, so nothing below is prose that once was true: a row in a table
here is a claim about `data/`, and the suite fails if the records stopped
agreeing with it.

The owner selected **Brazil** on the running atlas and saw three events where
four centuries belonged. M54 has since made the lens territorial, so the chain
is *findable*; this milestone fixes the records underneath it — the polities
that ought to exist, and the events that name nobody.

---

## 1. The contiguity rule, relaxed (amendment A1)

The owner, 17 September: *"Forget the continuity rule, you can write a
succession even if there is no dates continuity."*

M52 had taken the opposite instruction from the same person the day before,
made it **rule 30**, a hard validator error, and **retracted four successions**
to satisfy it. Both sentences are in the record and the second one wins; what
this milestone had to decide is what happens to the check itself.

### 1.1 The check is kept and demoted

It is **not deleted**. A gap between a predecessor's end and a successor's
start is still years in which something else held that ground, and that is
worth saying. What changed is **who decides**: saying it is the validator's
job, forbidding it is not.

So rule 30 became the warning **`succession-gap`**, in `src/validate/rules.js`,
over every active `succeeded` relation, documented in `ARCHITECTURE.md` where
rule 30 was. It stopped being numbered because in this validator **a rule is an
error**; a check that only reports belongs with the warnings, beside
`relation-outside-actor-when`, which looks at the same pair for another reason.

What it now warns about, unchanged from the arithmetic rule 30 used:

- the successor begins **more than one year** after the predecessor ends —
  meeting is the same year or the year boundary between them, a year being the
  finest bound this model has;
- or the predecessor **has not ended at all** and is nonetheless succeeded.

What it still does not report is the other direction. A successor that begins
before its predecessor ends leaves no ground unexplained.

**No test requires contiguity any more** (amendment A2). M52's `data/`-wide
assertion in `tests/m52.test.mjs` is deleted rather than weakened, and the test
that a succession's dates are **cited** stays exactly as it was. What replaced
the deleted one is the correspondence in §1.3 below and the fixture cases in
`tests/relation-rules.test.mjs`, which assert both halves of the change: no
error, and the warning exactly where the rule used to bite.

### 1.2 The four M52 withdrew are back

Restored from their own retracted records — same ids, same dates, same sources,
same two actors, `retraction` removed because rule 27 permits one only on a
retracted record. **Each carries its gap in its own `note`**, which is the shape
the relaxed check asks for: write the relation, and say what stood between.

| restored | gap | predecessor ends | successor begins |
|---|---|---|---|
| `east-timor-under-portugal--east-timor--succeeded` | 26 | 1976 | 2002 |
| `zambia-under-united-kingdom--zambia--succeeded` | 11 | 1953 | 1964 |
| `taiwan-under-japan--taiwan--succeeded` | 4 | 1945 | 1949 |
| `singapore-under-united-kingdom--singapore--succeeded` | 3 | 1962 | 1965 |

`docs/m52-russia.md` §1.2 carries the same four as the audit that found them,
and §1.1 there now points here. Neither file was rewritten to pretend the first
decision was never taken.

### 1.3 What the notes do not say, and why

Each note says how many years the gap is and that **the atlas names nobody for
it**. It does not name Indonesia, the Federation of Rhodesia and Nyasaland, the
Republic of China or Malaysia, though a historian would name each at once.
`CLAUDE.md` forbids this assistant writing a historical claim, and naming the
occupant of a gap is one. M52 was right about that and only wrong about the
remedy: the claim needs a source and a record of its own, and until it has one
the honest form is the gap stated and the occupant left open.

**Those four questions are still open**, in exactly the words
`docs/m52-russia.md` §1.3 put them. What changed is that the atlas no longer
withholds the succession while they wait.
