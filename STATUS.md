# Status

Where the project is right now. Read this first in any new session, after
`CLAUDE.md`. Update it whenever a decision is taken, a milestone moves, or a
session ends. `ARCHITECTURE.md` is the target; this file is the position.

## Last updated

2026-09-01, end of the planning session.

## Phase

**Planning, pre-M0.** `ARCHITECTURE.md` is at revision 3, incorporating the
adversarial review (`docs/review-2026-09-01.md`). No code exists. The repo
was moved this day from OneDrive to `~/atlas-causal`, `git init` done, **no
commits yet** — the owner decides when to commit. The earlier "repo" under
`/mnt/c/Users/gonca` is the owner's whole Windows home directory with a
`.gitignore` of `*` (an inert launcher for cloud sessions); it was never this
project's repository and was left untouched.

## Decided

See "Decisions taken" at the end of `ARCHITECTURE.md`. Everything in the
review was accepted except two items the owner chose to defer or drop:
contributions-open timing (deferred), `strength` on edges (left out).

## Next

1. Owner restarts Claude Code from `~/atlas-causal` so the session's working
   directory and memory follow the repo.
2. Optional: first commit (`docs: planning documents`).
3. Write M0 as a file-by-file plan; wait for the owner's approval.
4. Build M0: skeleton, schemas, validator (subset + rules), tests, CI,
   licences, `.gitattributes`, `.nvmrc`, `build-regions.mjs`.

## Open questions

- When contributions open to strangers. `CONTEXT.md` argues: after the
  1580–1640 chain coheres and a few hundred of the owner's own records exist.
  Owner: "we'll decide later."
- The scoped PAT for `contribution.yml` has to be created by the owner in
  GitHub settings at M2; its expiry goes in `CONTRIBUTING.md`.

## Where things live

- Repo: `~/atlas-causal` (this directory).
- Architecture page (artifact, now **behind** the repo file — revision 2;
  `ARCHITECTURE.md` is the source of truth):
  https://claude.ai/code/artifact/b3940d66-ad98-4de9-9bfd-aff8c77e6f36
- Assistant memory: `~/.claude/projects/-home-gjacob-atlas-causal/memory/`
  (and a copy under `-mnt-c-Users-gonca` pointing here).

## Uncommitted

Everything: `CLAUDE.md`, `CONTEXT.md`, `ARCHITECTURE.md`, `STATUS.md`,
`docs/review-2026-09-01.md`, `.gitattributes`.
