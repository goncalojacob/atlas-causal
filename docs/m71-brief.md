# Build brief — M71: a reader writes a narrative in the atlas

The owner, on the suggestion that readers should be able to write narratives
inside the atlas and submit them: **"Yes that is a feature I want."** And the
thesis behind the whole project, 18 September: *"if everything is connected
people can then easily write narratives."*

## 1. What exists, and the one thing that does not

A narrative is a record — `data/narratives/*.json` with `title`, `summary`,
`window`, `sources` and `steps` of `{ ref, text }` — and the atlas already
walks one (M48: the narrative as a lens; `narratives.html` prerendered). The
contribution pipeline exists: an issue carrying a record and labelled
`accepted` makes `contribution.yml` open a pull request, once the
`CONTRIBUTION_PAT` secret is set. The review dashboard exists.

**What does not exist is the front end.** A reader who has just walked from
the Angolan war to the present has no way to say so except by writing JSON
by hand.

## 2. What to build

**A composer, in the atlas, that writes a narrative record.**

- The reader **picks events by clicking them** — the same click M65 made a
  filter — and they become the steps, in the order picked; steps can be
  reordered and removed. **A step must be an event the atlas has**; the
  composer offers nothing it cannot cite.
- Each step takes **the reader's text**; the record's `summary`, `title` and
  `window` are asked for once. **The window is computed from the steps** and
  shown, not typed.
- **The composer writes the record the validator will accept** — `schema`,
  `kind: narrative`, `status: active`, `review.status: draft`, the reader as
  author — and checks it in the browser with the same rules the validator
  runs, so a submission never fails on shape. **The rules are imported, not
  copied.**
- **Submitting opens a prefilled GitHub issue** — the record as the body, the
  title as the title — in the reader's own browser, under their own account.
  **No token, no secret and no API call lives in the page.** The maintainer
  labels the issue `accepted`; the pipeline does the rest. Say on the page
  what happens next and that a GitHub account is needed.
- **The draft is kept in the browser** between visits (`panes.js`'s pattern)
  so a narrative half-written is not lost; it is never sent anywhere until the
  reader submits.

## 3. What this run must not do

**No narrative is written by this run.** The composer is the feature; a
narrative that exists to test it is a fixture under `tests/`, never under
`data/`. No new record type, confidence value, hex value, token or type size.
**First paint must not get slower** — the composer is loaded when opened. No
new runtime dependency. `validate --index` clean; tests before the behaviour
they judge (711, 717). Nothing merged into `main`; ignore `docs/drafts/`.

## 4. Tests

1. A composed record **passes the validator's own rules**, asserted by running
   them, not by comparing to a golden file.
2. The steps are the events picked, in order; a step cannot name an event the
   atlas lacks.
3. The window is the span of the steps.
4. The submit link is a GitHub new-issue URL carrying the record; **the page
   makes no network request on submit**.
5. A draft survives a reload and does not survive being submitted.
6. No test pins a count.

## 5. What the owner must do, and the run must not

**Set the `CONTRIBUTION_PAT` secret**: a fine-grained personal access token
with *Contents: read and write* and *Pull requests: read and write* on this
repository, stored as the repository secret `CONTRIBUTION_PAT`, its expiry
noted in `CONTRIBUTING.md`. The run cannot create it and must not try. The
composer works without it; only the last step of the pipeline waits on it.

## 6. Done when

A reader can pick events, write the text, and open an issue carrying a valid
narrative record; a draft persists; screenshots under `docs/screens/m71-*.png`
of the composer with three steps; `STATUS.md` says what first paint costs and
what the composer costs when opened; tests green; `M71 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
