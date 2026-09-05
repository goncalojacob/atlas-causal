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

## Amendments, 5 September 2026

- **`grep` prints nothing on a file that carries a control byte**, because it
  reads the file as binary. That is what the amendment of 4 September was
  seeing: `src/validate/rules.js`, `src/contribute/bundle.js` and
  `tools/migrate-places.mjs` each held a literal NUL as a separator. H1a
  replaced all three with U+001F, the unit separator, written as the escape
  `\u001f`, and `site.test.mjs` now fails on any control byte under `src/`,
  `tools/` or `tests/`. `awk` and `sed -n` remain the fallback for a file
  outside those trees; `grep -a` reads one anyway.
