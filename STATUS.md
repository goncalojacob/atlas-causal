# Status

The position, what waits on the owner, what is undecided, this run's
deviations, and the milestone lines. Read this first in any new session,
after `CLAUDE.md`. `ARCHITECTURE.md` is the target; this file is the
position. Everything behind it — the run-by-run account from M0 to H7, the
phase, the decisions taken, the full "Next" and "Open questions" lists,
deviations 1 to 297, the dates to verify, and where things live — is in
`docs/history/status-2026-09-05.md`, verbatim (health review B, finding 35).
Deviations are numbered on from there. Update this whenever a decision is
taken, a milestone moves, or a session ends; when it grows past about a
hundred lines again, cut it the same way.

## Last updated

2026-09-06, after H8 (`docs/health/h8-brief.md`), the health cycle's last run
before the review of the result, on `m0`: **generated pages and the
artifact.** Code only; nothing under `data/` changed and `data/index/` rebuilt
byte-identical, because the prerendered pages are the site's own files and not
index files. 921 tests.

**The pages are written by the build, from the functions the pages run.**
`build-index.mjs` writes `sources.html`'s bibliography and `narratives.html`'s
cards into those files, between marks they carry, and `entry/<id>.html` for
every event, actor or place with a `body`; `tools/lib/prerender.mjs` is the
pure half and calls `bibliographyHtml`, `narrativesHtml` and `entryHtml`
themselves, so a prerendered page cannot say what the script would not have.
The build prints the count and the bytes — 27,801 today, 24.0 KB of it the
bibliography — and `validate --index` compares them byte for byte under rule
16. **No record carries a `body` yet, so `entry/` is empty**; the fixture
record that has one is what the tests build against, and a `curl` of it over
`python3 -m http.server` returns the whole entry with no script involved.
`entry.html?id=` is still the address; a prerendered page is a second, static
rendering, canonical to it. The bootstraps leave a prerendered slot alone, so
**narratives.html asks for the spine zero times** where it asked once.

**The artifact is an allowlist.** `deploy.yml` staged the whole checkout —
`docs/`, `tools/`, `tests/`, every `*.test.mjs`, `.github/`, the import seeds
— and now stages `_site` from a named list: the html files,
`CONTRIBUTING.md`, `src/`, `schema/`, `data/` minus `imports/`, and
`tests/fixtures/data/` so `?fixtures=1` still works. 27 MB of checkout, 20 MB
of site. `review.html` is published with the rest and now says so off
localhost: a banner that nothing here can write and that a save becomes a
correction bundle. **And this file**, 5,345 lines and the first thing every
session had to read, is the position now.

## Next

The owner's list in full is in the history file. Still waiting:

1. The `CONTRIBUTION_PAT` secret, without which `contribution.yml` stops at
   its first step; then one bundle end to end.
2. Two settings the agent cannot make: `delete_branch_on_merge`, and
   Pages → Source: **GitHub Actions**, before the first merge to `main`.
3. Review and merge PR #1; then the test dataset — `node tools/serve.mjs` →
   `review.html`, 485 records unread, the twelve `disputed` edges first.
4. Write the first records of the 1415→ period (`tools/new-record.mjs`).
5. Judge by eye what the agent would not: the map's merge distance and
   labels, the graph's `STACK_DISTANCE`, the territories' four numbers, the
   phone sheet, "unchecked" on every citation, the narratives' century
   bucket, whether a card section opens on its own, the map's failure note.

## Open questions

In full in the history file. The ones that decide something:

- **The seventh relation type.** Rule 19 refuses `portugal member-of
  european-union`, so ten memberships are `allied-with` with a note. That is
  a substitution, reported and never adopted: widen `member-of` or add
  `member-state-of`. Until then Portugal's card says the wrong word.
- **Does the role vocabulary close, and to what?** Free text, 163 strings in
  use; some are hedges that belong in a summary.
- **89 more CShapes codes** are one id for a dependency and the state after
  it; which are two things is a judgement, not an import.
- **When contributions open to strangers**; whether four container kinds are
  the right four.

## Deviations

1 to 297 are in `docs/history/status-2026-09-05.md`. From H8:

298. **`entry/` is empty**: no record under `data/` carries a `body`, so the
     build writes two files today. "A prerendered entry renders without
     JavaScript" is met against the fixture record, served and fetched with
     `curl`, through the same code path.
299. **`CONTRIBUTING.md` is in the artifact** though the brief's list does not
     name it: an entry page for a record with no `body` links to it.
300. **The pages are the site's files, not index files**, so `--index`
     compares two things and `--site <dir>` says where the second is. A build
     of another dataset writes no pages unless asked, so a fixture build
     cannot overwrite the real bibliography.
301. **A prerendered slot is skipped, not re-rendered** — "only enhancing"
     taken literally, so the page costs no request. `?fixtures=1` still
     renders at load, because nothing prerenders it.
302. **`rm -rf tools/import/cache` is gone from `deploy.yml`**: the allowlist
     never copies `tools/`, and the test that guarded the removal now asserts
     that instead, which is the stronger claim.
303. **The blank lines between the milestone blocks are gone.** Every
     milestone line is kept, and the gate reads them with `grep -qxF`.
304. **This file is 196 lines and not a hundred**: 86 of them are the
     milestone lines the run protocol requires be kept in full and 31 are
     this block. The four parts the brief names come to 76.
305. **One browser test's readiness signal changed.** A prerendered page has
     its cards on screen before any script runs, so "wait for a card" said
     `narratives.html?fixtures=1` was ready while it was still showing the
     real records; the fixtures badge is the signal now. The page also
     clears the prerendered list before drawing the synthetic one, so the
     two datasets are never briefly shown one after the other.

## Milestones landed
M6 started 2026-09-03T17:06:55Z by scheduled
M6 done
M7 started 2026-09-03T18:20:47Z by shepherd
M7 done
M9 started 2026-09-03T19:20:45Z by shepherd
M9 done
M8 started 2026-09-03T20:22:00Z by shepherd
M8 done
M10 started 2026-09-03T21:21:00Z by shepherd
M10 done
M11 started 2026-09-03T22:21:09Z by shepherd
M11 done
M12 started 2026-09-03T23:21:25Z by shepherd
M12 done
M13 started 2026-09-04T00:21:17Z by shepherd
M13 started 2026-09-04T02:21:01Z by shepherd
M13 done
M14 started 2026-09-04T09:00:57Z by scheduled
M14 done
M15 started 2026-09-04T09:30:40Z by scheduled
M15 done
M16 started 2026-09-04T10:20:57Z by shepherd
M16 done
M17 started 2026-09-04T11:23:24Z by shepherd
M17 done
M18 started 2026-09-04T12:23:01Z by shepherd
M18 done
M19 started 2026-09-04T15:25:36Z by scheduled
M19 done
M20 started 2026-09-04T19:45:49Z by scheduled
M20 done
M21 started 2026-09-04T21:01:06Z by scheduled
M21 done
M22 started 2026-09-04T22:23:00Z by shepherd
M22 done
M23 started 2026-09-04T23:21:03Z by shepherd
M23 done
M24 started 2026-09-05T00:20:55Z by shepherd
M24 done
M25 started 2026-09-05T01:06:07Z by scheduled
M25 done
M27 started 2026-09-05T01:06:43Z by scheduled (branch m27)
M27 done
M26 started 2026-09-05T01:28:21Z by scheduled
M26 done
M29 started 2026-09-05T01:29:00Z by scheduled (branch m29)
M29 done
M28 started 2026-09-05T01:58:23Z by scheduled
M28 done
H1a started 2026-09-05T11:21:38Z by scheduled
H1a done
H1b started 2026-09-05T11:42:53Z by scheduled
H1b done
H5a started 2026-09-05T11:21:37Z by scheduled (branch h5)
H5a done
H1c started 2026-09-05T12:07:08Z by scheduled
H1c done
H2 started 2026-09-05T12:51:00Z by scheduled
H2 started 2026-09-05T16:02:53Z by scheduled
H2 done
H3a-1 started 2026-09-05T16:27:14Z by scheduled
H3a-1 done
H3a-2 started 2026-09-05T16:51:20Z by scheduled
H3a-2 done
H3b started 2026-09-05T17:07:31Z by scheduled
H3b done
H3c started 2026-09-05T17:51:38Z by scheduled
H3c done
H4a started 2026-09-05T18:11:57Z by scheduled
H4a done
H4b started 2026-09-05T18:11:54Z by scheduled (branch h4b)
H4b done
H4c started 2026-09-05T18:57:52Z by scheduled
H4c done
H4d started 2026-09-05T18:57:51Z by scheduled (branch h4d)
H4d done
H5b started 2026-09-05T19:47:31Z by scheduled
H5b started 2026-09-05T21:37:00Z by scheduled
H5b done
H6a started 2026-09-05T22:30:04Z by scheduled
H6a done
H6b started 2026-09-05T23:14:21Z by scheduled
H6b done
H7 started 2026-09-05T23:50:28Z by scheduled
H7 done
H8 started 2026-09-06T00:46:50Z by scheduled
H8 done
H9 started 2026-09-06T11:01:12Z by scheduled
