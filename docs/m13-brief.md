# Build brief — M13: the review dashboard

Written 3 September 2026. Runs after M12. Read, in this order: `CLAUDE.md`
(the test-dataset exception is what this dashboard exists to retire),
`STATUS.md`, `ARCHITECTURE.md` (current revision; you write the next),
`CONTEXT.md`, `docs/m2-brief.md` (the contribution and correction
pipeline), `docs/m6-brief.md`, `docs/m9-brief.md`, `docs/m11-brief.md`,
`docs/m12-brief.md`, then this file. Rules of engagement as in every brief
since `docs/m4-brief.md`; no historical text at all.

## What it is

Every record the assistant drafted is unreviewed until a person signs it.
The dashboard is where that happens: a page that lists what needs review
and lets the reviewer **edit text, sources and relations in place**, save,
and sign.

## The constraint, and how it is met

The public site has no backend and must keep none. In-place saving is
therefore provided by **a local development server** — `tools/serve.mjs`,
Node only, zero dependencies — that serves the repository like
`python3 -m http.server` and additionally accepts writes on
`localhost` only: `PUT /__records/<kind>/<id>` with a full record,
validated with `src/validate/core.js` against the current topology before
anything touches disk, written with the same formatting the tools use,
followed by a rebuild of `data/index/`. It refuses any non-loopback
address and any path outside `data/<kind>/`. This is a tool for the
owner's machine, an amendment to record in `ARCHITECTURE.md`; the public
site never has it. When the dashboard is opened without the write
endpoint, every save becomes a **correction bundle** it copies to the
clipboard for the existing correction-issue path, so a contributor with a
static copy can still review.

## The page — `review.html`, unlinked from the atlas

- **Queue**: every record whose `authors` contains the assistant-draft
  marker, grouped by kind, with counts; filters for validator warnings
  (degree-zero, unused actors, presence outside actor dates), sources
  without an ISBN or DOI, and — if `STATUS.md`'s "Dates to verify" can be
  turned into data — a `review.flags` field the drafts carry (add it to
  the envelope as optional: `review: { "flags": ["date"], "note": "…" }`;
  the migration can seed it from the STATUS list where the mapping is
  unambiguous, otherwise leave it empty and say so).
- **Editor**: opening a record shows every field as the contribution
  form does (reuse `src/contribute/bundle.js` field definitions — do not
  fork them): text fields as textareas, sources as add/remove rows with
  locator, actors with roles, place, edges' from/to/type/confidence and
  dispute, relations, narrative steps. Live validation against the
  topology exactly as the form does; the save control disabled until
  valid.
- **Sign**: a "Reviewed by" box (name and GitHub handle, remembered in
  localStorage) and a **Sign** action that replaces the assistant-draft
  `authors` entry with the reviewer, sets `revised`, clears `review`
  flags, saves. **Retract** sets `status: retracted`. Both go through the
  same validated save.
- **Progress**: how many records remain, by kind; the page is done when
  the queue is empty.
- Keyboard: next/previous in the queue, save, sign.
- Everything through `esc()`; the dashboard renders the same untrusted
  data as the atlas.

`tools/serve.mjs` gets tests (loopback only, path checks, validation
before write, index rebuild), the dashboard's pure parts get tests, and
`CLAUDE.md`'s Commands gain `node tools/serve.mjs` with one line saying
what it adds over `http.server`.

## Done when

`node tools/serve.mjs` then `http://localhost:8000/review.html` lists
every assistant-drafted record; editing a summary and saving rewrites the
file and the index; signing one removes it from the queue and the record
carries the reviewer; without the server the same action yields a
correction bundle; tests green; the next `ARCHITECTURE.md` revision;
`STATUS.md` with the literal line `M13 done`; an "M13" section on PR #1.

## Amendments after review (3 September, afternoon) — these override the body

- **Protocol.** Gate on `M12 done`; follow `docs/run-protocol.md`; `M13
  done` as its own line.
- **`tools/serve.mjs` hardening, all required and tested**: listen on
  `127.0.0.1` only (never `0.0.0.0`); reject any request whose `Host` is
  not `localhost:<port>` or `127.0.0.1:<port>`, and any whose `Origin`
  header, if present, differs from that; **no CORS headers and no
  `OPTIONS` handling** (a page in another tab must not be able to write);
  require `Content-Type: application/json`; `kind` must be a key of
  `KIND_DIRS` and `id` must pass the kind's id pattern **before any path
  is built**, exactly as `bundle-to-files.mjs` does; write only
  `data/<dir>/<id>.json`.
- **Editing without wiping the envelope.** Add `valuesFromRecord(kind,
  record)` to `src/contribute/bundle.js` beside `buildRecord`, tested as a
  round-trip on every record in `data/`; a save is the original record
  with the edited fields replaced — `created`, `aliases`, `supersededBy`,
  `authors` untouched except by Sign.
- **Saves are bundles.** The write endpoint accepts a bundle of records
  validated as a unit (one record is a bundle of one), so Retract on an
  event with active edges can retract the edges in the same save, and the
  dashboard says which records a retraction will touch before it does.
- **Attribution amendment**, to record in `ARCHITECTURE.md`: the local
  server is the one path where `authors` and `revised` are written without
  the Action, because the reviewer is the maintainer at their own machine;
  the correction-bundle path keeps the Action's attribution.
- **If M12 deferred the narrative form**, add `FIELDS.narrative` to
  `bundle.js`, not to the dashboard.
- **Done when — numbers**: the queue lists every record whose `authors`
  contains the draft marker (assert the count against the validator's);
  a save round-trips a record unchanged when nothing was edited (byte
  identical); a request with a foreign `Origin` or a non-loopback `Host`
  is refused with 403 in a test.
