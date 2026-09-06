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

2026-09-06, after **M30a-3** (`docs/m30a-brief.md`, amendment A19: the last of
M30a's three runs), on `m0`: **an event can be part of another event, can say
what kind of thing it was, and its roles are a vocabulary.** `parent` with
rule 24, `scope`, `category`, a `note` beside a role, `region` optional
everywhere, `historicalNames` on places, and the two closed lists in data.
Nothing is drawn — M30b draws — and no record under `data/` changed but the
Wikidata class table. **M30a is done.** 995 tests.

**Two vocabularies moved out of code and into data.** `data/roles.json` holds
the 31 roles the owner approved on 5 September and `data/categories.json` the
twelve categories of plan decision 13, each with a label and a line saying
what it covers. Both are read by `tools/lib/read.mjs`, carried by
`buildTopology` and named in the manifest, so the contribution form and the
review dashboard run the same rules the CLI does. **114 of the 137 active
events warn `role-unknown` today** — 142 distinct strings against a
vocabulary of 31 — and none warns `category-unknown`, because no record
carries a category yet. Both are warnings until M32b applies the mappings.

**An absent list means no check, never an empty closed set.** A dataset with
no `data/roles.json` is not a dataset whose every record is wrong: no file, no
key in the topology, no key in the manifest, no warning. The fixtures have
neither file, which is what makes them the test of it.

**`parent` is a display fact and the rules say so.** Rule 24 asks the three
things the shape cannot: the parent is an event, an active event's parent is
active, and no chain of parents closes on itself. A child dated outside its
parent is the warning `child-outside-parent`, as `actor-outside-when` is a
warning, because the two intervals come from two records. Rules 4 and 5 never
see it, `?chain=` is untouched, and the graph, the horizon and the convergence
query are exactly what they were.

**`region` stopped being required and started being reported.** An event with
neither a place nor a region was refused by rule 10; it is drawn in no lane
and warns `no-lane` now. Nothing in `data/` is in that state — every placeless
event carries a lane — so this is a door opened rather than a wall knocked
down.

**The index derives two more things.** `subtreeWeight` is an event's weight
plus every descendant's through `parent`, for the collapsed node M30b draws;
it is omitted wherever it equals `weight`, which is every leaf. And the
manifest carries `officesByEvent` and `tenuresByOffice`, so that M33's lanes
are a lookup rather than a scan of every tenure per event.

The two runs before it, kept because M30a is one milestone:

**Nothing historical was added, and that was the whole job.** (M30a-2.) Every field of
a tenure is the relation's own: the person is `from`, the years, the sources,
the note, the whole `review` block and `origin` are carried across unchanged,
`created` is the day the claim was written and `revised` the day it was
re-filed. The twelve `date` flags are in the review queue on the tenures now,
which is what A4 asked. The two judgements the tool makes are the brief's —
leading the regime polity is a turn at `prime-minister-of-portugal`, and a
party's post is called what the relations' own notes call it — and both are
tables at the top of the file.

**Six offices, twelve tenures, twelve tombstones.** `leadership-of-chega`,
`-frelimo`, `-paigc`, `-partido-socialista`, `-pcp` and `-psd`, each `of` its
party with `when: null` and no sources, as A13 has the Portuguese three. Ten
party leaderships and the Estado Novo's two: Salazar and Caetano are turns at
the head of government of Portugal, not of the regime of the moment. Each old
relation is a retracted record naming the tenure that replaced it, so an old
link still resolves and says why it went.

**`led` is deprecated and not removed.** It is still in `RELATION_TYPES`, in
the schema's enum and id pattern, in the narrative step pattern and in
`RELATION_GROUP_ORDER` — all four name it, and thirteen tombstones have to
keep validating. Rule 19 refuses an *active* relation of a retired type, and
`WRITABLE_RELATION_TYPE_IDS` is what the scaffold and the form offer.

**The re-filing cost the atlas a section, on purpose.** Salazar's card has no
relations at all now and the Estado Novo's has lost "Led by": the claims are
records nothing draws until M30b's office strip. `about.html` says that
rather than promising a section that is not there.

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

### M31-1, on the branch `m31`: the heads of state, and the ten memberships

**Two of the three Portuguese offices have holders now.** Twenty-four
tenures: three at `monarch-of-portugal` — `luis-i-monarch-1861`,
`carlos-i-monarch-1889`, `manuel-ii-monarch-1908` — and twenty-one at
`president-of-portugal`, one record per continuous spell from the
provisional government of October 1910 to the second term that ended in
March 2026. Ten person actors were written for them: `luis-i`,
`teofilo-braga`, `bernardino-machado`, `canto-e-castro`,
`antonio-jose-de-almeida`, `teixeira-gomes`, `mendes-cabecadas`,
`craveiro-lopes`, `costa-gomes` and `jorge-sampaio`. No id needed amendment
A9's `-b` suffix: the three spells that begin in 1926 are three different
people, and so are the two that begin in 1915.

**Every date in it was written from memory and none has been read.** Every
tenure and every new actor carries `origin: { "tool": "assistant" }`,
`review.status: "draft"`, the `date` flag and a note saying in plain words
that the interval came from the assistant's memory and that the books cited
are where a reviewer should check it rather than works this run read. No
tenure carries a `date` or an `endDate`: an ISO date is a claim to have read
one. **74 citations were written and not one of them has been checked
against its source; the whole corpus stands at 2,002 of 2,002 unchecked**,
which is what `node tools/validate.mjs` prints on its last line.

**Nine retracted presidential elections came back, and exactly the nine a
tenure names.** `may-1915-…` (for `teofilo-braga-president-1915`),
`august-1915-…` (`bernardino-machado-president-1915`), `1918-…`
(`canto-e-castro-president-1918`), `1919-…`
(`antonio-jose-de-almeida-president-1919`), `1923-…`
(`teixeira-gomes-president-1923`), `1925-…`
(`bernardino-machado-president-1925`), `1951-…`
(`craveiro-lopes-president-1951`), `1996-…` (`jorge-sampaio-president-1996`)
and `2006-…` (`cavaco-silva-president-2006`), each
`<year>-portuguese-presidential-election`. A re-election inside a continuous
spell began no tenure and stays retracted: 1935, 1942, 1991, 2001 and 2011
have not moved. Reinstating one changed five things and nothing else — the
status, the deleted retraction, the dropped `m21-retracted`/`m22-retracted`
flag, `review.status: "draft"` and `revised` — so those records are still
the thin imported ones they were, and completing them from memory is the
invented claim this milestone exists to avoid. The `degree-zero` count did
not move: an event that began a tenure is connected, which is the whole of
plan decision 3.

**The ten memberships say `member-of`.** Each is renamed
`portugal--<body>--member-of`, carries its old `allied-with` id in `aliases`
so every link still resolves, keeps `created`, `when`, `sources`, `review`
and `origin`, and has lost the sentence saying the type was a substitution.
Portugal's card now has "Member of" and no "Allied with" section at all —
the ten were the whole of it. **Left for the owner, untouched:**
`estado-novo--nato--allied-with`, because NATO is an alliance as well as a
membership and which the atlas means is an editorial decision; and
`third-portuguese-republic--european-economic-community--allied-with`,
because it is written from the regime and not the state, and re-typing it
would silently answer a second question about which actor joins a community.

**Holders the run did not write, and why** (§2 rule 3 — a strip with a hole
the status file names is a correct atlas):

- **The President of the Republic since March 2026.** Marcelo Rebelo de
  Sousa's second term ended then and the constitution bars a third. The
  atlas holds no event later than 2025, so there is nothing to name in
  `startedBy`, and this run cannot say who won the election of January 2026.
  No tenure is written and none is open: no head of state is recorded as
  still in post.
- **The interim headship of state between April and July 1951**, between
  Óscar Carmona's death in post and Craveiro Lopes's inauguration. Whether an
  interim exercise of the office by the head of government is a tenure this
  atlas records is a question about the model rather than about a date, and
  it is the owner's.

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

- **The seventh relation type. Answered, and half done.** Rule 19 refused
  `portugal member-of european-union`, so ten memberships were written as
  `allied-with` with a note — a substitution, reported and never adopted. The
  owner chose widening over a new type (plan decision 12) and **M30a-2 widened
  it**: a polity or an institution may be `member-of` an institution now.
  **M31-1 re-typed the ten** on the branch `m31`, so Portugal's card says the
  word the claim always meant. What is left is the owner's: the two
  `allied-with` records M31-1 did not touch, named in its paragraph above.
- **Does the role vocabulary close, and to what? Answered and half done.**
  The owner approved `docs/roles-mapping.md` — the list of 31 — on 5
  September, and **M30a-3 wrote `data/roles.json` and the `role-unknown`
  warning**: 114 of the 137 active events warn today. What is left is the data
  — **M32b applies the mapping** to the 142 strings still in use, fills the
  notes and turns the warning into an error. What is still open is only what
  the mapping does with the hedges that belong in a summary rather than in a
  role; the `note` beside the role is where they go.
- **Seventeen Wikidata classes have no category** (amendment A17). Fifty of
  the sixty-seven event classes in `data/imports/wikidata-seeds.json` are
  filled — the wars, the treaties, the elections, the coup, the disasters and
  the killings. These are the ones whose mapping is a judgement rather than a
  synonym, and the import writes no category for them: **the three
  referendums** (Q43109, Q2515494, Q126723767 — a vote, but not an election of
  anybody); **the violent crimes** (Q53706, Q806824, Q2334719, Q5711091
  robbery, Q365680 assault, Q891854 bomb attack, Q2223653 terrorist attack,
  Q3199915 massacre, Q81672 attempted murder — `death` fits a killing and not
  an attempt or a theft); **the four empty classes** (Q1190554 occurrence,
  Q1656682 event, Q13418847 historical event, Q3454916 untyped), which say
  nothing about what a thing was; and **Q102100590, a NATO operation**, which
  may be a war or may not.
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

### M30a-2, `led`

332. **The tombstones walked back into the review queue, and the queue asks a
     second question now.** Migration 4 reconstructs `review.status: draft`
     from the draft marker in `authors`, and Retract takes the status off, so
     the twelve withdrawn relations came back as drafts standing behind the
     twelve tenures that replaced them. `inQueue` in `queue.js` is `isDraft`
     *and* still in the corpus — the line H9's `unread` warning already draws,
     for the same reason: nobody is waiting on a tombstone and signing one
     would put a reviewer's name on a claim the atlas no longer makes.
     `countDrafts`, `buildQueue`, `progressOf`, the review index and the
     dashboard's shards read it. It was already true of anything a reviewer
     retracted from the dashboard; there was simply one such record and it is
     `euro-2016-final`, which leaves the queue here. 493 drafts, not 494.
333. **A tombstone's reason opens with the sentence migration 4 can read back
     out of a note.** `down` throws on a retraction it could not put back
     (`RETRACTION_TEXT`), and the up/down round trip is the one safety net
     under every migration, so the reason is "Retracted in M30a-2 and re-filed
     as the tenure …" and not "Re-filed as …".
334. **`tools/migrate/apply.mjs` was run over the tree after the tool.** The
     tool leaves a tombstone with no `review` block, which is exactly what
     Retract produces; migration 4 then writes `review.status: draft` on read,
     and the form's byte-identity test says a record on disk must be what a
     save of it writes. The twelve carry the status in the file.
335. **An office inherits the standing of the records it was read off and
     invents none.** The six are drafts because the twelve were; the fixture
     one has no `review` block because the fixture relation has none — a
     hand-written `draft` cannot survive `down` then `up` on a corpus whose
     authors are not the draft marker, which is deviation 307's reason for the
     fixtures having no standing at all.
336. **`seed-review-flags.mjs` names the *active* relations and the tenures.**
     Its table is the dated claims between actors, and twelve of those changed
     kind; a tombstone claims nothing anybody is waiting to check.
337. **The fixture `led` relation was re-filed by the same tool.** A2 asks
     that it keep validating and rule 19 refuses an active `led`, so the
     synthetic corpus is in the shape the real one is: a second office, a
     fourth tenure, a second tombstone. Its own test builds a scratch copy in
     the state the fixtures were in *before* the run, because the tool has
     nothing left to do to them now.
338. **`member-of` widened at the `from` end only.** Plan decision 12 asks
     that a polity or an institution may be `member-of` an institution; the
     `to` end already allowed both, and narrowing it would have made a shape
     that is already in the atlas invalid for nothing.
339. **The `startedBy` warning is `started-outside-when`, and its cases are
     synthetic.** A9 names warnings rather than numbering them. The fixture
     corpus is not grown a third time in one run for a case that `run(mutate)`
     states more precisely — which is how every other rule 26 case in
     `office-rules.test.mjs` is written.
340. **CONTRIBUTING.md's office and tenure section is here.** The brief's §4
     gives it to M30a and A19 to none of the three runs; a contributor reading
     the file was being told to write a `led` relation, which rule 19 now
     refuses.
341. **The gate was one background poll, not a chain of ten-minute calls.**
     Run protocol §1's loop, its `grep -qxF` and its twelve-hour deadline
     exactly, run as a watcher that wakes the run when the line lands instead
     of costing a model turn every ten minutes.

### M30a-3, the event's fields

342. **The fixtures carry neither `roles.json` nor `categories.json`, on
     purpose.** A8 asks for a test that an absent list means no check at all,
     and the honest test of that is a whole corpus without one rather than a
     topology built to lack it. So the fixture event's `category` is
     unchecked, and every case that wants a vocabulary hands the repository's
     own to `buildTopology` — which is how every rule 26 case is written.
343. **The five new fields are carried across a save, not drawn.** M30b owns
     the form and the review editor for them, but the round-trip byte-identity
     test means a save must not *delete* a field the editor cannot see. So
     `parent`, `scope`, `category` and a place's `historicalNames` are a
     `KEPT_KEYS` table beside `IDENTITY_KEYS` in `bundle.js`, and a role's
     `note` travels in the actor row's value object with no input drawn for
     it. The day M30b adds the inputs, each key moves into that kind's
     `fields`.
344. **The fixtures' parent is an event that was already there.**
     `fixture-event-f` (1260–1300) with `fixture-event-h` and
     `fixture-event-t` inside it, rather than three new records: adding events
     would have moved every count the suite asserts, for a shape three
     existing records already had.
345. **A fixture place carries `historicalNames` though the brief's fixture
     list does not name it.** A kept key with no record carrying it is a key
     nothing tests, and deviation 343 is exactly the kind of plumbing that
     fails silently.
346. **`role-unknown` is one warning a record, naming the roles.** One a line
     would be two thousand lines of the same sentence over this dataset, and
     a reviewer opens the record once. `category-unknown` is one a record
     because an event has one category.
347. **Rule 24 asks whether the parent is active as well.** The brief gives
     the rule "resolves to an active event", and M30a-2 split the same
     question about a tenure's `startedBy` between rules 3 and 11. Here all
     three checks are rule 24's: the cycle walk has to resolve the chain
     anyway, and a rule that reads a reference twice is a rule that can
     disagree with itself.
348. **`officesByEvent` maps an event to *tenure* ids.** §3 of the brief says
     "the office ids whose tenures hold a person the event names"; A10, which
     overrides it, defines the values as tenure ids — which is the more useful
     of the two, since the office is one lookup away and the tenure is what
     the strip draws.
349. **The manifest carries the vocabularies whole**, `{ id, label,
     description }` each, and not just the ids: M30b's legend and the form's
     select need the label, and a second fetch for twelve short lines would be
     a request to save nothing.
350. **`checkImportSeeds` takes a third argument.** A17's check is against
     `data/categories.json`, which the function had no way to see; it is
     passed in, and absent means unchecked, exactly as it does for the two
     warnings.
351. **The H9 account left `STATUS.md`'s "Last updated".** Three milestones
     have landed since; the file is the position and not the history, its own
     header says to cut it when it grows, and H9's account is in
     `docs/health/h9-brief.md`, in the review it answers and in the git log.
     M30a-1's and M30a-2's paragraphs are kept.

### M31-1, the heads of state

352. **The numbering restarts at 352 on two branches at once.** M30b-1 is
     running on `m0` while this runs on `m31`, and both number on from 351,
     which is what `STATUS.md` said when each of them started. Renumbering
     here would mean guessing what the other run wrote; the collision is one
     the merge resolves, and this is the note that says so.
353. **Luís I is a holder the brief's survey missed.** §4 lists `carlos-i` and
     `manuel-ii` as the monarchs of the window, and Luís I reigned until 1889
     — the first three years of it. §4 says a holder the survey missed is
     still a holder, so the spell is written, whole (§1: one record per
     continuous spell), from 1861, and `luis-i` is a new actor.
354. **Nobody is written as still in post**, against §2 rule 5's expectation
     of two. Marcelo Rebelo de Sousa's second term ended in March 2026 and the
     run cannot name who won the election of January 2026, which the atlas
     does not hold. His tenure ends in 2026 and the holder since is named
     above instead. `end: null` appears on no tenure this run wrote.
355. **Amendment A4's heading list is wrong and the test asserts the true
     one.** A4 gives `['Regimes', 'Member of', 'Allied with']`; Portugal has
     no `allied-with` relation left, because the ten were the whole of that
     section — the two records that remain stand at `estado-novo` and at
     `third-portuguese-republic`. `tests/actor-card.test.mjs` asserts
     `['Regimes', 'Member of']`, and its count at the next line did not move.
356. **Three tests moved with the data and not one.** A4 names
     `actor-card.test.mjs` and A5 gives `office-card.test.mjs` to M31-2.
     `tenure-strip.test.mjs` and `panel-browser.test.mjs` each asserted in so
     many words that two of Portugal's three posts had no holder recorded,
     which is exactly what this run changes; and `seed-review-flags.test.mjs`
     asked every active tenure for the sentence the one-time seeding wrote,
     which a tenure written after the seeding says in its own words instead
     (A7 requires it to). Nothing was weakened: the seeding's own sentence is
     still asserted on every active relation, and a tenure is asked for the
     `date` flag and a note of its own.
357. **The strip test stopped asserting its bars as a list.** With
     twenty-six turns at three posts the strip clusters, and which bars
     survive that is the strip's business rather than this run's: the test
     asks that every bar is a turn at one of the three posts and that the two
     prime ministers are among them, and it clicks Salazar's bar by name
     rather than whichever one is drawn first.
358. **Luís I's bar is drawn nowhere.** The strip is held to what the corpus
     holds — 1899 to 2025 — and the reign ends in 1889. The record is right
     and the window is M33's; an office strip that began at the earliest
     tenure rather than at the corpus would be a change to the drawing, which
     §7 forbids this run.
359. **`data/index/` is not committed on this branch**, by the run's own
     instruction, and A11 is suspended with it: the assistant rebuilds the
     index once after `m31` is merged into `m0`. The index was rebuilt locally
     to run the tests at every commit and reverted before each of them, so
     `node tools/validate.mjs --index` is stale on `m31` and is expected to
     be. `node tools/validate.mjs` reports zero errors at every commit and
     `node --test` is green with `CHROME` set: 1,022 tests, none skipped.
360. **The ten re-types were not kept as a one-off tool.** M30a-2 kept
     `tools/migrate/led-to-tenures.mjs` because it made thirty records out of
     twelve; this is ten renames whose diff is the whole account of them, and
     a script that can only be run once and fails afterwards is not
     documentation this repository needs a second copy of.
361. **Teófilo Braga's first spell is a turn at `president-of-portugal`
     though the post was called president of the provisional government**, and
     so are the three of 1926, when the office and the headship of the
     government were held together. The alternative was a fourth office
     record, which §7 forbids. The distinction is in each tenure's `note`.
362. **Américo Tomás's tenure is begun by `delgado-candidacy-1958`.** The
     imported record of the 1958 election is `merged` into that event, and
     rule 11 refuses a `startedBy` that names anything but an active record.
     The event is this atlas's account of that election, so it is the one
     named; nothing was reinstated for it.

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
M30a-2 started 2026-09-06T13:11:20Z by scheduled
M30a-2 done
M30a-3 started 2026-09-06T13:54:28Z by scheduled
M30a-3 done
M30a done
M30b-1 started 2026-09-06T14:31:33Z by scheduled
M31-1 started 2026-09-06T15:09:18Z by scheduled (branch m31)
M31-1 started 2026-09-06T17:01:56Z by scheduled (branch m31)
M31-1 done
M31-2 started 2026-09-06T17:24:43Z by scheduled (branch m31)
