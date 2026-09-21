# Build brief — M69: four things the backlog has carried for weeks

None of these is a feature. Each is a line in `STATUS.md`'s "Next" or "Open
questions" that has waited for the owner's word, and on 20 September the owner
gave it: *"you can do everything that is left including what was in the
backlog."* **Measure each before touching it, and put the numbers in
`STATUS.md`.**

## 1. The import records with no standing

Records the CShapes import wrote carry `"review": null` — neither a
`review.status` nor a signature (health review H9, item 7). The validator
counts them at the end of every run. **Give them the standing that is true**:
nobody has read them, so `draft`, with a flag that says which import wrote them
and that the status was backfilled. Read the validator's rule and H9's section
first, and **do not change what the record claims** — this is standing, not
content. Say how many there were and how many are left.

## 2. The two `allied-with` relations that mean `member-of`

M31-1 re-typed ten memberships and left two, named in its paragraph in
`STATUS.md`. Read that paragraph, find the two, and re-type them **only if the
source on the record supports `member-of`**; otherwise leave them and say why.

## 3. The sixteen records the category pass declined

The category pass read only titles an import copied, and declined sixteen
hand-written ones; `STATUS.md` names them with what the table would have said.
**Apply the table's answer where the record's own body confirms it**, and list
the rest. `constitutional-revision-1959` is a `law` and not an `election`; that
is the shape of mistake to refuse.

## 4. The deploy, now that there is somewhere to deploy to

A Pages site was created on 20 September (`build_type: workflow`), which
`deploy.yml` never had before. **Read the latest deploy run on `main`.** If it
is green, say so and what it published. If it is red, fix the workflow — not
the atlas — and say what was wrong.

## 5. What this run must not do

No historical claim. No new record type, confidence value, hex value, token or
type size. No display change. `validate --index` clean; records first,
rebuild, then the index (798). Tests before the records they judge (711, 717).
Nothing merged into `main`; ignore `docs/drafts/`.

## 6. Done when

Each of the four has its numbers in `STATUS.md` — before and after — and what
was refused; `validate --index` clean and the standing count at the end of it
smaller than it was; tests green; `M69 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
