# Build brief — M2 and M3

Written 1 September 2026 for the agent continuing the build after M0 and
M1. Read, in this order and completely, before creating any file:
`CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md`, `CONTEXT.md`,
`docs/review-2026-09-01.md`, `docs/m0-brief.md` (for the rules the previous
agent worked under and the deviations it recorded in `STATUS.md`).
`ARCHITECTURE.md` revision 3 is the specification; this brief orders the
work and sets the rules of engagement.

## Rules of engagement

- Work on branch **`m0`** — it already carries M0 and M1 and has pull
  request #1 open against `main`. Small commits, one logical change each,
  messages in English, ending with the Co-Authored-By line the harness
  gives you. When done, retitle PR #1 to "v1: skeleton, validator, site,
  contribution pipeline" and rewrite its body as a summary of everything on
  the branch, with the owner's remaining actions at the end.
- Never write a record into `data/events/`, `data/edges/` or
  `data/sources/`. **No AI-generated historical claims, ever.** Fixtures
  live in `tests/fixtures/` and stay unmistakably synthetic.
- No runtime dependencies, no build step for the site, no map library, no
  CDN. `python3 -m http.server 8000` from the repo root must serve every
  page.
- `node tools/validate.mjs` and `node --test` must pass at every commit.
  Where the spec is unbuildable as written, do the closest thing that keeps
  its invariants and add the deviation to `STATUS.md` → Deviations, with
  the reason. Never reinterpret silently.
- Three questions in `STATUS.md` → Open questions are the owner's to
  answer (the `container` field on sources, Natural Earth's continent
  assignment, map semantics). Do not decide them. Build around them.
- Before you stop — finished or blocked — update `STATUS.md` (phase, next,
  open questions, deviations) and push it. That file is the handoff.

## M2 — the contribution pipeline

Everything in `ARCHITECTURE.md` → "Contribution pipeline", steps 1–4 and
6, built so that the only thing missing at the end is the token the owner
creates.

1. **`src/contribute/form.js`** — a form for one bundle: any number of
   events, edges and sources. Before allowing a new event it searches
   existing titles and aliases in the loaded topology (and the bundle
   itself) and shows near-matches. Builds the bundle object; runs
   `validate/core.js` against the topology so references, arrow of time,
   consensus and dispute rules all fire in the browser; shows errors inline
   next to the field; **the submit control is disabled until the bundle
   validates and every node and edge has at least one source.** Supports
   `?fixtures=1` like the atlas so it can be tested without records.
   Keep the pure parts (bundle assembly, duplicate search) in functions
   testable under `node --test`.
2. **`src/contribute/submit.js`** — copies the bundle JSON to the clipboard
   and opens the `contribution` issue template. Prefill the `bundle` field
   through the URL only when the encoded body is under 6 KB; above that,
   open the template empty and tell the contributor to paste. The GitHub
   repository URL is one constant at the top of the file.
3. **`contribute.html`** — same tokens as `index.html`; says plainly that
   contributions are reviewed by a person, that sources are mandatory, what
   the three confidence levels mean, and that the licence is CC BY-SA 4.0.
   Do not add it to the atlas navigation yet — the owner decides when
   contributions open; it stays reachable by URL.
4. **Issue templates** in `.github/ISSUE_TEMPLATE/`: `contribution.yml`
   (one required textarea `bundle`, one required checkbox affirming the CC
   BY-SA 4.0 grant and that the text is the contributor's own; label
   `contribution` auto-applied), `correction.yml` (same shape; a full
   replacement record with an existing id), and `config.yml` disabling
   blank issues.
5. **`tools/bundle-to-files.mjs`** — reads the issue body from an
   environment variable, extracts the fenced JSON (or the raw textarea
   content), validates the bundle shape, checks **every id against the slug
   regex (edge pattern for edges) before building any path**, writes only
   `data/<kind>/<basename>.json` for kinds in `event | edge | source`,
   sets `authors[].github` from the issue opener and `created` from the
   current date, refuses to overwrite an existing file unless invoked in
   correction mode, and prints what it wrote. Tests must include path
   traversal ids, unknown kinds, and an existing-file collision.
6. **`.github/workflows/contribution.yml`** — trigger: `issues` with
   `types: [labeled]`, guarded so it runs only when the label is
   `accepted` (which only a maintainer can apply). Steps: check out
   `main`; fail immediately with a clear message if the secret
   `CONTRIBUTION_PAT` is absent; pass the issue body and opener via `env`
   (never `${{ }}` inside `run:`); run `bundle-to-files.mjs`; run
   `tools/validate.mjs`; create branch `contribution/<issue-number>`;
   commit with the contributor as author; push and open a PR against
   `main` using the PAT (`gh` with `GH_TOKEN`), linking the issue; comment
   on the issue with the PR link, or with the validation errors on
   failure. Best-effort, non-failing extra step: for each new source with
   a DOI or ISBN, look it up (Crossref / Open Library) and comment the
   title found beside the one submitted.
7. Enable **delete branch on merge** on the repository if you have the
   permission (`gh api -X PATCH repos/goncalojacob/atlas-causal -f
   delete_branch_on_merge=true`); if not, note it for the owner.
8. **Owner-only, leave for them, say so in `STATUS.md`:** creating the
   fine-grained PAT (contents + pull-requests on this repo) as repository
   secret `CONTRIBUTION_PAT`, and testing one bundle end to end.

## M3 — public-facing pages and deployment

1. **`about.html`** — what the atlas is (from `CONTEXT.md`, in your own
   words, no historical claims); how to read the three confidence levels
   and a disputed edge; the licences (MIT for code, CC BY-SA 4.0 for the
   data, Natural Earth public domain with attribution) and why relicensing
   is impossible once strangers have contributed; that contributions are
   not yet open, and how they will work when they are. Linked from the
   atlas header. Same tokens.
2. **`CONTRIBUTING.md`** — for people reading the repository: the form →
   issue → review flow, the review checklist from `ARCHITECTURE.md`, the
   record format with one synthetic example, a line "Contributions are
   not yet open", and a placeholder line for the PAT expiry date.
3. **Deployment.** `deploy.yml` exists; verify it against the current tree
   (index rebuild, commit, upload, deploy in one job, concurrency group).
   Try to enable Pages with the workflow source through the API
   (`gh api -X POST repos/goncalojacob/atlas-causal/pages -f
   build_type=workflow`). Whatever the outcome, record it in `STATUS.md`;
   the repository is private and GitHub Pages on a private repository
   requires a paid plan, so it may have to wait until the owner makes the
   repository public. Do not change repository visibility.
4. **`README.md`** — short: what it is, how to run it locally, where the
   documents are, the licences. Do not restate `ARCHITECTURE.md`.

M2 and M3 are done when: every page serves from `python3 -m http.server
8000`; the contribution form validates a fixture bundle in the browser
and produces the JSON; `bundle-to-files.mjs` is tested including the
hostile cases; `contribution.yml` is in place and fails clearly without
the secret; `about.html`, `CONTRIBUTING.md` and `README.md` exist; PR #1
is retitled with a full summary; `STATUS.md` says exactly what the owner
does next.
