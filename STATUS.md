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

2026-09-06, after **M30a-1** (`docs/m30a-brief.md`, amendment A19: M30a runs
as three, and this is the first), on `m0`: **the two new record kinds,
`office` and `tenure`, end to end.** The registry, two schema files, every
frozen list, rules 6, 15 and 26, `?office=` with a placeholder card, three
office records for Portugal, the fixtures' one office and three tenures, and
both indexes. Nothing about `led` (M30a-2) and nothing about events
(M30a-3). 966 tests.

**A kind is nine files and thirteen tables, not thirty places.** What
`src/kinds.js` and `src/vocab.js` promised after H2 held: the two entries in
the registry, the two schemas, the `kind` enum, and then only the tables no
registry can derive — `collectRows` and `indexEntries` in the validator, the
topology and the spine, `data.js`'s kind list, the search shard, the picker,
the bundle's descriptors and both directions of its record/values pair, the
two hand-built topology objects, `DIGEST_KEYS`, the scaffold, `data/LICENSE`
and the contribution branch's directory list. Every one of those is named in
amendments A6 and A7, and every one of them was needed.

**Rule 26 in four checks, not three.** A5's three are the tenure's: the
person is a person, the office is an office, and the years overlap the
office's own where it has any. The fourth is the office's: which kind of
actor may stand at its `of` is decided by its category, in a table beside
`RELATION_ENDPOINTS` in `vocab.js`, and a table nothing read would not be a
rule.

**An office asserts that a post exists and nothing else.** The three
Portuguese records carry `when: null`, no sources and `review.status: draft`.
Dating the crown against an actor record that starts in 1886 would be an
invented claim (A13), and rule 26's overlap check is skipped where an office
has no interval. Who held them is M31's.

**Three of them were the atlas not working.** The graph's pan-and-zoom
`transform` was declared below the first `arrange()`, so opening the graph
from a narrative step or from any shared `?from=&to=&view=graph` link threw
before it could be drawn — every graph test passed because the default window
is too wide to reach the assignment. An open actor or place with no `?focus=`
was a lens on itself, and 350 of the 412 actors are polities imported with
their borders and no event, so the search's commonest answer opened a blank
map and a blank timeline; an actor with no events is not a lens now, the card
says why, and the lens nobody asked for never removes the selection, the
walked chain or the selected event's consequences. And the three tools that
create records — `new-record.mjs` and both imports — wrote no `review.status`,
so nothing they made was ever in the review queue: they write `draft`, and the
validator warns about the 1,040 records already there with neither a status
nor a signature.

**The deploy was committing degraded histories.** `build-index` derives a
record's versions from `git log`; `deploy.yml` checked out one commit deep, so
all 1,006 histories collapsed to one version each, said `from: "git"` about
it, and were written over the full ones on every run — and `compareIndex`
exempted `history/` from rule 16 for exactly that reason, which made the rule
false by construction for 1,006 of the 1,054 index files. `fetch-depth: 0`;
`recordHistories` refuses a shallow clone and falls back to `revised` in the
file; the exemption is gone.

**A contribution's pull request carries the records and nothing else.**
`contribution.yml` built the index and validated it in its own checkout, then
committed `data/` alone, so every bundle that touched a source failed the
gate on the base branch's `sources.html`; and the hashed index it did commit
would have conflicted with the next deploy. It commits the seven record
directories, `validate.yml` asks for `--index` only where a pull request
touched `data/index/`, and `deploy.yml`'s header says so.

**And the spine lost its indentation.** 837,425 bytes → **539,033**, the
search shard 252,053 → **169,652**; gzip already hid most of it (67.5 → 60.3
KB and 34.6 → 32.3 KB) and `JSON.parse`, which every page runs on every
device, never did. `CLAUDE.md`'s layout tree, a cycle behind at 28 unnamed
modules, names every module under `src/` and `tools/`, and a test holds the
two together.

## Next

The owner's list in full is in the history file. Still waiting:

1. The `CONTRIBUTION_PAT` secret, without which `contribution.yml` stops at
   its first step; then one bundle end to end — which H9's item 5 changed the
   shape of, and nothing has run since.
2. Two settings the agent cannot make: `delete_branch_on_merge`, and
   Pages → Source: **GitHub Actions**, before the first merge to `main`.
3. Review and merge PR #1; then the test dataset — `node tools/serve.mjs` →
   `review.html`, 485 records unread, the twelve `disputed` edges first.
4. Write the first records of the 1415→ period (`tools/new-record.mjs`).
5. Judge by eye what the agent would not: the map's merge distance and
   labels, the graph's `STACK_DISTANCE`, the territories' four numbers, the
   phone sheet, "unchecked" on every citation, the narratives' century
   bucket, whether a card section opens on its own, the map's failure note.
6. **Overrule H9's two decisions if they are wrong.** The assistant took them
   on the review's owner questions: an actor or place with no events is not a
   lens (R8), and a contribution's pull request carries neither the index nor
   the pages (R2/R12). Both are one commit to undo.
7. **The 1,040 records with no standing.** The validator now warns about
   every active record carrying neither `review.status` nor a signature —
   the actors and presences the CShapes import wrote before it said `draft`.
   Backfilling them is a data change, so H9 did not make it; until somebody
   does, `node tools/validate.mjs` ends with a line counting them.

## Open questions

In full in the history file. The ones that decide something:

- **The seventh relation type.** Rule 19 refuses `portugal member-of
  european-union`, so ten memberships are `allied-with` with a note. That is
  a substitution, reported and never adopted: widen `member-of` or add
  `member-state-of`. Until then Portugal's card says the wrong word.
- **Does the role vocabulary close, and to what?** **Answered, 5 September:
  the owner approved `docs/roles-mapping.md`** — the list of 31 — and M30a-1
  records the approval here (amendment A16). So the vocabulary closes to those
  31: M30a-3 writes `data/roles.json` and the `role-unknown` warning, and M32b
  applies the mapping to the 163 strings in use and turns the warning into an
  error. What is still open is only what the mapping does with the hedges that
  belong in a summary rather than in a role.
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

### H9, the corrective run

306. **The `unread` warning fires on 1,040 records, and the printer caps a
     rule at twenty lines.** The brief asked for a warning on a record with
     neither `review.status` nor a signature; every actor and presence the
     CShapes import wrote before item 3 is one. Printing 1,040 lines would
     have made `node tools/validate.mjs` — the command `CLAUDE.md` tells every
     session to run — unreadable, so `warningLines` prints the first twenty of
     a rule and then says how many more there are. The warnings themselves are
     all still in the returned list, which is what the review index and the
     tests read, and the totals line is unchanged.
307. **The fixture records were left without a `review` block**, though the
     brief allowed item 3 to write to them. Giving all 48 a `draft` status was
     tried and reverted: migration 004 reconstructs `draft` from an author
     named by the draft marker, so a hand-written draft cannot survive
     `down` then `up`, and `tests/migrate.test.mjs`'s round trip — the safety
     net under every migration — broke on the fixtures rather than on
     anything H9 wrote. The corpus is one nobody has read, which is what the
     new warning says about it; `rules.test.mjs` and `validate-cli.test.mjs`
     count the warnings and were updated to say so.
308. **`clearVerified` no longer drops the review block when a status is left
     in it.** Not in the brief, and the same failure as R10: unticking the
     last checked citation on a draft took `review` away whole, and with it
     the record's place in the queue.
309. **`new-record.mjs` writes no `origin`.** The brief asks for it "where the
     creator is a tool"; a scaffold is run by a person, and stamping `origin`
     from the tool that laid out the envelope would say the tool wrote the
     record. Both imports already wrote theirs.
310. **`contribution.yml` names the seven record directories** rather than
     `git add data`. Nothing on that branch builds the index any more, so
     `data` would have been the same thing today — and would silently start
     carrying the index again the day something did.
311. **The bench's `rules` case does not ask for `--dataset`.** It builds its
     records in memory and writes nothing; only `build-index` and `validate`
     need a corpus on disk.
312. **The `layout` case reproduces H4b's crossing counts, not its
     milliseconds.** The atlas row is exact (130 of 201); the synthetic rows
     rebuild the graph deviation 240 describes — two centuries, two edges an
     event, forward and within 250 events, which `syntheticEdges` gained a
     `reach` option for — and land within a tenth of H4b's counts at both
     sizes. The times are this machine's: 0.46 s and 3.9 s where H4b measured
     0.65 s and 4.5 s.
313. **The Claim browser test answers the save inside the page.** An earlier
     run of it went through `tools/serve.mjs`, which really does write the
     record and rebuild the index — a claim by "Ana Reviewer" landed in
     `data/sources/ar-2024-fiftieth-anniversary.json` and was reverted. What
     is being tested is which name the button reads, so the PUT is caught in
     the page and goes no further.
314. **R20's acknowledgement is asked of a correction too.** The form is not
     told whether it was opened from `?edit=`, and being asked once to confirm
     that a replacement is meant is the right question for a correction as
     well; the wording says "I mean to replace X" rather than "this is a
     different place".
315. **Two tests were restaged rather than weakened**, both by a fix in this
     run: the lens browser test clicked "Focus only on this" on a card that
     R9's fix now redraws (so it opens the page again to find the control),
     and `bundle.test.mjs`'s "a record is never its own duplicate" is the
     assertion R20 reverses. Nothing else in the suite was edited to pass.
316. **Item 1 hoisted `applyTransform` with `transform`.** The brief names the
     `let`; the arrow function beside it is in the same dead zone and
     `fitToWindow` calls it, so hoisting one without the other would have
     moved the error rather than removed it.
317. **The H5b sentence is annotated, not rewritten.** `docs/history/` is kept
     verbatim, so the clause claiming an imported record reaches the queue —
     R18's third — carries a bracketed note saying it was untrue when written
     and what made it true.
318. **Only the spine and the search shard are compact.** R5 also names the
     explanation shards; the brief's item 11 names two files, and those two
     are the ones every page parses whole.
319. **The fixture histories needed no regeneration** (item 4). They already
     matched a full-clone build, so removing the `history/` exemption from
     rule 16 found nothing stale in either tree.
320. **`data/index/` moved for item 11 only**: the spine, the search shard and
     the manifest line naming them. Every other index file, the histories
     included, came back byte-identical.

### M30a-1, the two kinds

321. **`startedBy` is checked by rules 3 and 11, which A19 does not list.**
     M30a-1's list is "rules 6/15/26"; the brief's §1 says in so many words
     that `startedBy` "resolves under rule 3, may not name a non-active event
     (rule 11)". A field the validator ignores is worse than a field that does
     not exist, so both checks are here. The third thing §1 asks for — a
     warning when the event lies outside the tenure's `when` — is not: it is a
     named warning, and A9 gives this run none.
322. **Rule 26 has a fourth check**, the office's. A5's three are the
     tenure's; the category→actor-type table A5 introduces would otherwise be
     a table nothing reads. It is in rule 26 because rule 26 is the office and
     tenure rule.
323. **Rule 11 also refuses an active tenure at a retracted office.** Not
     named anywhere, and the same hole rule 11 exists to close everywhere
     else. There is no referrer index from an office to its tenures — an
     office is reached through them and through nothing else — so the
     tombstone is caught from the tenure's end.
324. **`tenure` has no `note`.** A4 gives it one and A19 gives A4 to M30a-2,
     so the field arrives with the tool that carries the twelve `led` notes
     across, not before it.
325. **`data/tenures/` is committed with a `.gitkeep`.** The registry test
     asks that every kind's directory exist under `data/`, git does not track
     an empty one, and this run writes no tenure — M31's is the run that does.
     `readRecords` reads only `*.json`, so the file is invisible to everything
     but git. `data/offices/` has one too, and three records beside it.
326. **The panel's `actor` case clears `office`.** Not in the brief. An office
     outranks an actor in the precedence, so the actor button on A14's
     placeholder card left the reader looking at the card they clicked out of.
     An actor is a highlight the atlas keeps; an office is a card, and asking
     for the actor is asking to leave it.
327. **The office card is its own readiness signal in the browser test.**
     `open()` in `tests/browser.mjs` waits for a `.card-section`, and a
     three-line placeholder has none, so the test passes its own expression.
328. **A record's history cannot be right in the commit that adds the
     record.** `recordHistories` reads `git log`, so the fixtures' four
     histories and the three offices' were written `from: "revised"` and
     regenerated in the commit after. Two commits per set of new records, and
     rule 16 is momentarily false on the first of the two — which is a
     property of deriving the histories from git and not of this run.
329. **Ten assertions moved with the corpus, and none was weakened.** Six are
     A18's own category — `manifest.counts` twice in
     `tests/build-index.test.mjs` (the fixtures and the empty dataset), the
     fixture manifest's counts, the validator CLI's warning total, its
     `unread` cap line and its build-summary line. Three are exhaustive lists
     that grow by construction: the state's field table in
     `render-key.test.mjs`, two whole-state comparisons in `state.test.mjs`,
     and the spine's allowed-key table in `spine.test.mjs`. One test was
     *extended*: "retired and unreferenced" in `rules.test.mjs` now has a
     third kind of reference to drop, a tenure's `person`. And
     `workflows.test.mjs` reads the contribution branch's directory list off
     the registry instead of writing out seven names, which is a stronger
     claim than the one it made.
330. **ARCHITECTURE.md is updated here and not left to M30a-3.** The brief's
     §4 gives it to M30a and A19 assigns it to no one of the three. Three of
     its sentences became false the moment the registry gained a kind that may
     claim a Wikidata item and a kind that cites nothing, so they are
     corrected rather than added to.
331. **The commit that carries rule 26 does not name it in its subject.** It
     landed with the registry, because a kind and the rule that holds it
     together are one change; the message says rules 6 and 15 only. Already
     pushed, and history on `m0` is not rewritten.

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
H9 done
M30a-1 started 2026-09-06T12:19:24Z by scheduled
M30a-1 done
