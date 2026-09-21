# Run protocol — how the overnight runs coordinate

Every scheduled run and the shepherd follow this. It exists because runs
are cut off by usage limits without warning, nobody watches overnight, and
two agents editing `m0` at once destroy each other's work.

## 1. The gate (scheduled runs only)

Wait for the previous milestone's done line. Poll from a shell loop inside
single Bash calls of up to ten minutes each (Bash `timeout` 600000), so
that waiting costs one model turn per ten minutes, not one per poll:

```
for i in $(seq 1 2); do git fetch -q origin && git show origin/m0:STATUS.md | grep -qxF 'M6 done' && echo READY && break; sleep 295; done
```

Repeat that call until it prints `READY` or the deadline passes (12 hours
after the run started). If the deadline passes: stop, say so in one line.
**Never work on another branch.**

## 2. The claim

After the gate: `git checkout -B m0 origin/m0`. Look under
`## Milestones landed` in `STATUS.md` for a line `M<n> started <ISO
instant> by <scheduled|shepherd>` for your milestone. If one exists, is
younger than five hours, and either `origin/m0` was pushed less than 90
minutes ago or the claim is less than 60 minutes old: **someone else is on
it — stop**, say "M<n> already claimed". Otherwise append your own
`M<n> started <ISO instant> by <you>` line there (create the section at the
end of `STATUS.md` if absent), commit it alone, push. **If that push is
rejected, stop** — do not pull, do not rebase; another run claimed it
first.

## 3. While working

`git push origin m0` immediately after every commit. A rejected push at any
point means another agent is writing to `m0`: stop, do not rebase, say
so. Validator and tests green at every commit. Read the milestone's brief
*including its "Amendments after review" section, which overrides the
body where they differ.*

## 4. Done

Finished means the brief's "Done when" holds. Then, in `STATUS.md` under
`## Milestones landed`, write `M<n> done` **as its own line with nothing
else on it** (the gate checks `grep -qxF`), commit, push, and add or
complete the milestone's section on pull request #1. Then stop; do not
start the next milestone.

## 5. The shepherd (hourly)

Its first tool call is one script that prints a single verdict, and the
prompt says to exit on anything but `CONTINUE`:

- `COMPLETE` if `M13 done` is on `origin/m0`;
- `NOT_YET` if the current instant is before 2026-09-03T17:00:00Z (an
  absolute instant, not a time of day);
- for the first n in the order 6, 7, 9, 8, 10, 11, 12, 13 without
  `M<n> done`: `ACTIVE` if a `M<n> started` claim younger than five hours
  exists and (`origin/m0` was pushed < 90 min ago or the claim is < 60 min
  old); else `CONTINUE <n>`.

On `CONTINUE <n>`: read the brief's "Done when" first; if it already holds
(a run finished and forgot the line), write `M<n> done`, push, stop. Else
claim (section 2, `by shepherd`) and continue the milestone from whatever
was pushed. Stop when done; never start the next milestone.

## Order tonight

M6 → M7 → M9 → M8 → M10 → M11 → M12 → M13. M9 (places) runs before M8
(more events) so that no event is ever written with coordinates and then
migrated hours later.

## Amendments, 4 September 2026

- **An import branch this run itself pushed is not another agent.** A run
  may push a branch `import/<name>` from `m0`, wait for the Action to
  commit to that branch, and then `git merge --ff-only` it into `m0`; that
  merge is the run's own commit. The Action never pushes to `m0`.
- **The shepherd's order today** is 14, 15, 16, 17, 18, complete at
  `M18 done`; its gate instant is 2026-09-04T09:00:00Z. The routine, not
  this file, is what runs; this file records what it does.
- **`grep` can print nothing in the sandbox** where it should match; use
  `awk` or `sed -n` for checks a brief relies on.
- **Daytime runs today** supersede "builds after 18:00" in `STATUS.md`,
  at the owner's request of 4 September.

## Amendments, 8 September 2026

- **A milestone branch `m44`, cut from `m0`, is the third import round's own
  branch and is not another agent at work on `m0`.** Section 1's "never work
  on another branch" is about two runs writing to `m0` at once; M44 writes its
  records, its documents and its counts to `m44` and merges them into `m0`
  only in a separate merge run, the way `merge-world` landed `world`. Runs on
  `m0` continue meanwhile and must not wait for it. The import branches of the
  4 September amendment are cut from `m44` in that round, not from `m0`, and
  are fast-forward-merged back into it.
- **The claim line and the done lines of M44 stay on `m0`** (`docs/m44-brief.md`,
  amendment A10). The gate of section 1 reads `origin/m0:STATUS.md` with
  `grep -qxF`, so `M44a done` written on `m44` is invisible to every run
  waiting on it. Each is a single-file commit to `m0` that touches nothing
  else, and at the merge the branch's own `STATUS.md` — its paragraphs, its
  counts and its deviations, renumbered by deviation 461's rule — is carried
  over to join them.

## Amendments, 5 September 2026

- **`grep` prints nothing on a file that carries a control byte**, because it
  reads the file as binary. That is what the amendment of 4 September was
  seeing: `src/validate/rules.js`, `src/contribute/bundle.js` and
  `tools/migrate-places.mjs` each held a literal NUL as a separator. H1a
  replaced all three with U+001F, the unit separator, written as the escape
  `\u001f`, and `site.test.mjs` now fails on any control byte under `src/`,
  `tools/` or `tests/`. `awk` and `sed -n` remain the fallback for a file
  outside those trees; `grep -a` reads one anyway.

## Amendment, 15 September 2026 — the validator and the index

**A run that writes anything under `data/` validates with
`node tools/validate.mjs --index`, not `node tools/validate.mjs`.** Without the
flag the validator reads `data/` directly and is content whatever state
`data/index/` is in; with it, it reads the repository the way the site and nine
of the tests do. Sections 3 and 4 above, and every brief's "Done when" that
names the validator, are read with `--index` from today wherever the run wrote
a record.

**A run that writes under `data/` also runs `node tools/build-index.mjs` and
commits the result**, because the index is generated from the records and goes
stale on the commit that writes one. `--index` is what catches the run that
forgot.

This is not a preference. `m44` carried a stale index from M44a to M44c:
`--index` reported **108 errors** on that branch's head and **nine tests were
failing the whole time, unseen** — `build-index`, `prerender`, five in
`spine-loader` and `validate-cli` — because the protocol named the validator
without the flag and two milestones read their own green and believed it
(deviation 684 on `m44`, deviation 696 in `STATUS.md`). It cost two milestones
of false green. It must not cost a third.

A run that writes no record is unchanged: the bare validator is what it needs,
and `--index` is byte-identical for it.

## Amendment, 16 September 2026 — the branch `m49`

**M49 works on a branch `m49`, cut from `m0`, exactly as `m44` did**, and for
the same reason: M48 and M49 were written the same afternoon and the owner
asked for both as quickly as possible, so they run at once. M48 owns `m0` —
it changes `src/lens.js`, `tools/build-index.mjs` and what the reader sees.
M49 changes records: `data/actors/`, `data/relations/`, `data/presences/`
and the `actors` entries of events. Both regenerate `data/index/`, which is
why they cannot share a branch.

As with `m44`: **the `M49 started` claim line and the `M49 done` line go on
`m0`**, each a single-file commit touching nothing else, because section 1's
gate reads `origin/m0:STATUS.md` with `grep -qxF`. Everything else M49 writes
stays on `m49` until a separate merge run lands it, carrying that branch's
own `STATUS.md` paragraphs, counts and deviations across with deviation 461's
renumbering. A run on `m0` must not wait for `m49`, and M49 must not push to
`m0` anything but those two lines.

## Amendment, 18 September 2026 — unshallow before the first validate

**The sandbox clones shallow, and `validate --index` reports errors that are
not there until it does not.** Every one of them is a history shard:
`tools/lib/history.mjs` builds them out of the commits that touched each
record's file, refuses a shallow clone outright rather than reading it for what
it holds, and so names different files from the committed ones. It cost M65 a
confused reading of a clean tree (deviation 887) and M64 the same one on a run
that had touched no record at all (deviation 897).

So: **`git fetch --unshallow origin` belongs beside the claim of section 2**,
before the run's first `validate`, and not after 69 errors have been read as
real. It is one command, it is idempotent — a repository that is already whole
answers at once — and since the amendment of 15 September makes `--index` the
validator every run reaches for, every run needs it.

## Amendment, 21 September 2026 — two lanes

The owner: *"try to get as many things done in parallel as possible."* One
branch can carry one run at a time, so from M68 on the queue is **two lanes**
that run at once:

- **Lane A, display**: M68 → M70 → M71 → M73 → M45b. Touches `src/`, `tests/`,
  screenshots.
- **Lane B, records**: M69 → M72 → M42. Touches `data/`, the index, the
  validator's counts.

**Each milestone works on its own branch `mNN`, created from `origin/m0` at
claim time and never rebased onto `m0` by the run.** The claim line and the
done line are written in `STATUS.md` **on that branch**. A run never pushes to
`m0`. **The owner's assistant merges `mNN` into `m0`** when `MNN done` is on
the branch, in arrival order, resolving `STATUS.md` and
`docs/history/pr-sections.md` by keeping both sides (the sections are
independent appends), rebuilding the index if `data/` changed, running
`validate --index`, and pushing `m0`; `main` is merged from `m0` as before.

**A lane's next milestone gates on its predecessor's done line being on
`origin/m0`** — merged, not merely written — so every new branch starts from
a `m0` that carries the other lane's landed work too.

**Deviation numbers cannot collide across lanes**: lane A numbers on from the
last in `STATUS.md` as always; **lane B numbers from 950 upward**, its own
block. When the lanes rejoin, numbering continues from the larger.

The claim rule, the idempotent gate, and everything else in this protocol
apply on the branch exactly as they did on `m0`.
