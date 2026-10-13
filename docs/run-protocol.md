# Run protocol: how the scheduled runs share the branches

Every scheduled run and the shepherd follow this protocol. It exists for
three reasons. Usage limits cut runs off without warning. Nobody watches
overnight. Two agents that edit `m0` at once destroy each other's work.

## 1. The gate (scheduled runs only)

Wait for the done line of the milestone before yours. Poll from a shell loop
inside single Bash calls of up to ten minutes each (Bash `timeout` 600000).
Waiting then costs one model turn per ten minutes instead of one per poll:

```
for i in $(seq 1 2); do git fetch -q origin && git show origin/m0:STATUS.md | grep -qxF 'M6 done' && echo READY && break; sleep 295; done
```

Repeat that call until it prints `READY` or the deadline passes. The deadline
is 12 hours after the run started. If it passes, stop and say so in one line.
**Never work on another branch.**

## 2. The claim

After the gate, run `git checkout -B m0 origin/m0`. Look under
`## Milestones landed` in `STATUS.md` for a line `M<n> started <ISO
instant> by <scheduled|shepherd>` for your milestone. Someone else holds the
milestone when all three of these are true:

- the line exists,
- it is younger than five hours,
- `origin/m0` was pushed less than 90 minutes ago, or the claim is less than
  60 minutes old.

In that case **stop** and say "M<n> already claimed". Otherwise append your
own `M<n> started <ISO instant> by <you>` line there. If the section is
absent, create it at the end of `STATUS.md`. Commit the line alone and push.
**If the remote rejects that push, stop.** Do not pull and do not rebase.
Another run claimed the milestone first.

## 3. While working

Run `git push origin m0` straight after every commit. A rejected push at any
point means another agent is writing to `m0`. Stop, do not rebase, and say
so. The validator and the tests pass at every commit. Read the milestone's
brief *including its "Amendments after review" section, which overrides the
body where they differ.*

## 4. Done

The milestone is finished when the brief's "Done when" holds. Then write
`M<n> done` in `STATUS.md` under `## Milestones landed`, **as its own line
with nothing else on it** (the gate checks with `grep -qxF`). Commit, push,
and add or complete the milestone's section on pull request #1. Then stop.
Do not start the next milestone.

## 5. The shepherd (hourly)

The shepherd's first tool call is one script that prints a single verdict.
The prompt tells the shepherd to exit on anything but `CONTINUE`. The
verdicts:

- `COMPLETE` if `M13 done` is on `origin/m0`.
- `NOT_YET` if the current instant is before 2026-09-03T17:00:00Z. This is
  an absolute instant and does not repeat each day.
- Otherwise the script takes the first n in the order 6, 7, 9, 8, 10, 11,
  12, 13 without `M<n> done`. It prints `ACTIVE` if a `M<n> started` claim
  younger than five hours exists and either `origin/m0` was pushed < 90 min
  ago or the claim is < 60 min old. Else it prints `CONTINUE <n>`.

On `CONTINUE <n>`, read the brief's "Done when" first. If it already holds
(a run finished and forgot the line), write `M<n> done`, push and stop.
Otherwise claim the milestone (section 2, `by shepherd`) and continue it from
whatever the last run pushed. Stop when done. Never start the next
milestone.

## Order tonight

M6, M7, M9, M8, M10, M11, M12, M13. M9 (places) runs before M8 (more events)
so that no run writes an event with coordinates and then migrates it hours
later.

## Amendments, 4 September 2026

- **An import branch that the run itself pushed is not another agent.** A run
  may push a branch `import/<name>` from `m0`, wait for the Action to commit
  to that branch, and then `git merge --ff-only` it into `m0`. That merge is
  the run's own commit. The Action never pushes to `m0`.
- **The shepherd's order today** is 14, 15, 16, 17, 18, complete at
  `M18 done`. Its gate instant is 2026-09-04T09:00:00Z. The routine is what
  runs, and this file records what it does.
- **`grep` can print nothing in the sandbox** where it should match. Use
  `awk` or `sed -n` for the checks a brief relies on.
- **Runs in the daytime today** replace "builds after 18:00" in `STATUS.md`,
  at the owner's request of 4 September.

## Amendments, 8 September 2026

- **A milestone branch `m44`, cut from `m0`, is the third import round's own
  branch. It is not another agent at work on `m0`.** Section 1's "never work
  on another branch" is about two runs that write to `m0` at once. M44
  writes its records, its documents and its counts to `m44`. A separate merge
  run merges them into `m0`, the way `merge-world` landed `world`. Runs on
  `m0` continue meanwhile and must not wait for it. In that round the import
  branches of the 4 September amendment are cut from `m44` and
  fast-forward-merged back into it.
- **The claim line and the done lines of M44 stay on `m0`**
  (`docs/m44-brief.md`, amendment A10). The gate of section 1 reads
  `origin/m0:STATUS.md` with `grep -qxF`, so no waiting run can see
  `M44a done` written on `m44`. Each line is a single-file commit to `m0`
  that touches nothing else. At the merge, the branch's own `STATUS.md`
  joins them: its paragraphs, its counts and its deviations, renumbered by
  deviation 461's rule.

## Amendments, 5 September 2026

- **`grep` prints nothing on a file that carries a control byte**, because it
  reads the file as binary. That is what the amendment of 4 September was
  seeing. `src/validate/rules.js`, `src/contribute/bundle.js` and
  `tools/migrate-places.mjs` each held a literal NUL as a separator. H1a
  replaced all three with U+001F, the unit separator, written as the escape
  `\u001f`. `site.test.mjs` now fails on any control byte under `src/`,
  `tools/` or `tests/`. For a file outside those trees, `awk` and `sed -n`
  remain the fallback, and `grep -a` reads it anyway.

## Amendment, 15 September 2026: the validator reads the index

**A run that writes anything under `data/` validates with
`node tools/validate.mjs --index`.** The bare `node tools/validate.mjs` is
not enough. Without the flag the validator reads `data/` directly and passes
whatever state `data/index/` is in. With the flag it reads the repository the
way the site and nine of the tests do. From today, wherever a run wrote a
record, sections 3 and 4 above and every brief's "Done when" that names the
validator mean the validator with `--index`.

**A run that writes under `data/` also runs `node tools/build-index.mjs` and
commits the result.** The build generates the index from the records, so
the index goes stale on the commit that writes a record. `--index` catches
the run that forgot.

This rule has a cost behind it. `m44` carried a stale index from M44a to
M44c. `--index` reported **108 errors** on that branch's head, and **nine
tests failed the whole time without anyone seeing**: `build-index`,
`prerender`, five in `spine-loader` and `validate-cli`. The protocol named
the validator without the flag, and two milestones read their own passing
result and believed it (deviation 684 on `m44`, deviation 696 in
`STATUS.md`). That cost two milestones a false pass. It must not cost a
third.

A run that writes no record is unchanged. The bare validator is enough for
it, and `--index` gives the same bytes.

## Amendment, 16 September 2026: the branch `m49`

**M49 works on a branch `m49`, cut from `m0`, exactly as `m44` did**, and for
the same reason. The assistant wrote M48 and M49 the same afternoon, and the
owner asked for both as quickly as possible, so they run at once. M48 owns
`m0`. It changes `src/lens.js`, `tools/build-index.mjs` and what the reader
sees. M49 changes records: `data/actors/`, `data/relations/`,
`data/presences/` and the `actors` entries of events. Both regenerate
`data/index/`, so they cannot share a branch.

As with `m44`, **the `M49 started` claim line and the `M49 done` line go on
`m0`**. Each is a single-file commit that touches nothing else, because
section 1's gate reads `origin/m0:STATUS.md` with `grep -qxF`. Everything else
M49 writes stays on `m49` until a separate merge run lands it. That run
carries the branch's own `STATUS.md` paragraphs, counts and deviations
across, renumbered by deviation 461's rule. A run on `m0` must not wait for
`m49`. M49 pushes nothing to `m0` but those two lines.

## Amendment, 18 September 2026: unshallow before the first validate

**The sandbox clones shallow, and until it unshallows, `validate --index`
reports errors that do not exist.** Every one of them is a history shard.
`tools/lib/history.mjs` builds the shards out of the commits that touched
each record's file. It refuses a shallow clone outright instead of reading
what the clone holds, and so it names different files from the committed
ones. This confused M65's reading of a clean tree (deviation 887), and M64's
on a run that had touched no record at all (deviation 897).

So **`git fetch --unshallow origin` goes beside the claim of section 2**,
before the run's first `validate`. Do not wait until 69 errors have been
read as real. It is one command, and it is safe to repeat: a repository that
is already whole answers at once. The amendment of 15 September makes
`--index` the validator every run uses, so every run needs it.

## Amendment, 21 September 2026: two lanes

The owner: *"try to get as many things done in parallel as possible."* One
branch can carry one run at a time. So from M68 on, the queue is **two
lanes** that run at once:

- **Lane A, display**: M68, then M70, M71, M73 and M45b. It touches `src/`,
  `tests/` and the screenshots.
- **Lane B, records**: M69, then M72 and M42. It touches `data/`, the index
  and the validator's counts.

**Each milestone works on its own branch `mNN`. The run creates the branch
from `origin/m0` when it claims, and never rebases it onto `m0`.** The run
writes the claim line and the done line in `STATUS.md` **on that branch**. A
run never pushes to `m0`. **The owner's assistant merges `mNN` into `m0`**
when `MNN done` is on the branch, in the order the branches arrive. It
resolves `STATUS.md` and `docs/history/pr-sections.md` by keeping both sides
(the sections are separate appends). It rebuilds the index if `data/`
changed, runs `validate --index` and pushes `m0`. It merges `main` from `m0`
as before.

**A lane's next milestone waits until the done line of the milestone before
it is on `origin/m0`.** The line must be merged there, and written on the
branch is not enough. So every new branch starts from an `m0` that also
carries the other lane's landed work.

**Deviation numbers cannot collide across lanes.** Lane A numbers on from
the last in `STATUS.md` as always. **Lane B numbers from 950 upward**, in a
block of its own. When the lanes rejoin, numbering continues from the larger.

The claim rule, the gate that is safe to repeat, and everything else in this
protocol apply on the branch exactly as they did on `m0`.

## Amendment, 22 September 2026: the landing routine, and a third lane

The owner is away for a week, and the site must keep growing whatever its
size. The owner asked for two changes ("no need to wait for me, we are not
looking for accuracy but instead to have a demo" and "you should have a
process that will later resume work in case credits end"):

1. **A landing routine may push to `m0` and publish to `main`.** The rule
   that a run never pushes to `m0` is for lane runs. One routine, named
   "landing", does what the assistant does at the end of a lane milestone
   and nothing else. It brings into `m0` a branch whose done line is on it,
   or a daily snapshot of `m42` and `m42b`, exactly as `land.sh` does:
   - keep both sides of `STATUS.md` and `pr-sections.md`,
   - drop and rebuild `data/index/`,
   - keep `m0`'s side of any test file,
   - validate `--index`,
   - push `m0`.

   It then opens the pull request to `main` and completes it once its check
   passes. It acts only when `origin/m0` has not moved for six hours while a
   landing is due, so it and the assistant never race. The assistant
   disables it when back at the keyboard.
2. **Lane B is two lanes.** M42 (Africa and Asia) and M42b (the Americas and
   Europe before 1900) run on `m42` and `m42b` under the same brief and
   amendments. A11 splits the work between them. Records branches land in
   the order they arrive, as lane A's do.

The standing orders the assistant works under for the week are in
`docs/assistant-standing-orders.md`.

## Amendment, 12 October 2026: the planner, the writers, and the `plan` branch

The owner paused the records routines on 2 October and resumed them on
12 October with a new plan: *"could we have opus deciding which
events to add and how to connect them, and sonnet to write the events?"*
M90 (`docs/m90-brief.md`) builds what that needs. Three changes:

1. **A fourth branch, `plan`.** One routine, the **planner** (Opus, once a
   day), reads `docs/m90-rules.md` and the output of `tools/queue/state.mjs`.
   It chooses the day's events and their parents and edges. Each edge
   carries the article's sentence verbatim at a named revision. The planner
   pushes a queue (`data/imports/queue.json`) and a short note
   (`docs/plans/<date>.md`) to `plan` and nowhere else. It writes no record.
2. **Writers write the lane branches `m42` and `m42b`.** Two routines on
   Sonnet fire hourly. Each takes the queue items for its lanes (writer A takes `africa`,
   `asia` and `europe` on `m42`, and writer B takes `americas` on `m42b`)
   and applies them with
   `tools/queue/apply.mjs`. The tool checks every quote against the revision
   and refuses what it cannot find. A writer decides nothing and writes no
   prose note and no deviation. Its results are `data/imports/queue-log.json`
   on its branch and one line in `STATUS.md` per fire. The routines of M42
   and M42b stay disabled. Their briefs stand behind the rules card.
3. **Landing.** The assistant lands `m42`, `m42b` and `plan` into `m0` and
   publishes daily, as before. The landing fallback routine stays disabled.
   The claim rule applies to the writers (`Writer A started`, `Writer B
   started`) and to the planner (`Planner started` in the day's note).

Deviations: the planner numbers from 1600. M90 continues lane A's numbers.
