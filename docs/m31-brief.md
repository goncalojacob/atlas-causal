# Build brief — M31: the tenures, the elections and the ten memberships

Written 6 September 2026 from `docs/plan-2026-09-05.md` (decisions 2, 3 and
12) and `docs/review-2026-09-05-plan.md` (findings 1, 2, 15, 18, 19). M30a
built the shape and M30b drew it; this is the run that fills it with content.
Every monarch, president and prime minister of Portugal between 1886 — where
the `portugal` actor record begins — and today becomes a `tenure` at one of
the three offices M30a-1 wrote, with the person, the years and at least one
source; the elections that began a tenure and were retracted in M21 or M22
come back through `startedBy` (plan decision 3); and the ten memberships that
M29 had to write as `allied-with`, because rule 19 then put a person at the
`from` end of `member-of`, are re-typed now that M30a-2 has widened it. It is
**data only**: no module under `src/` is edited, no edge is written, and
everything it writes is drafted by the assistant under the dated exception in
`CLAUDE.md` — `origin: { "tool": "assistant" }`, `review.status: "draft"`,
queued for `review.html` and reviewed or rewritten by a person before the
site is public. The run follows `docs/run-protocol.md` in full: the gate, the
claim, a push after every commit, validator and tests green at every commit.

## 0. The gate and the reading

The gate line is the literal **`M30b done`** on `origin/m0` (run protocol §1;
§8 below gates the second and third runs on the line before them). Read, in
this order: `CLAUDE.md` — the dated exception and its terms are the licence
under which this whole milestone is written — `STATUS.md`, `docs/run-protocol.md`,
`docs/plan-2026-09-05.md` (decisions 2, 3 and 12), `docs/review-2026-09-05-plan.md`,
`docs/m30a-brief.md` **including its "Amendments after review" A0–A19, which
override its body and are what M30a actually delivered**, `docs/m30b-brief.md`
including its amendments, and then this file.

Then the code and data this run writes against, and no more of the tree than
that: `schema/v1/tenure.json` and `schema/v1/office.json` (every field, and
the reasons in the descriptions), `schema/v1/actor.json`, `schema/common/interval.json`
(a bound may be a `{min,max}` range and an interval may carry `date`/`endDate`
— §2 turns on this), `data/offices/` (nine records: the three Portuguese and
M30a-2's six party leaderships), `data/tenures/` (twelve records, the shape to
copy), `src/validate/rules.js` rules 19, 26 and 27 and the warnings
`started-outside-when` and `degree-zero`, `tools/new-record.mjs` (the `actor`,
`office` and `tenure` scaffolds and what its envelope does *not* write),
`tools/migrate/led-to-tenures.mjs` (how a one-off data run is written and
kept), `docs/m21-retractions.md` and `docs/m22-retractions.md` (the audit
trail this run partially reverses), and `data/sources/` (§3).

Before writing anything, run `node tools/validate.mjs` and `node --test` and
record the numbers: this run changes several of them and must be able to say
by how much.

## 1. What a tenure of this milestone is

One record per **continuous spell** in one office. A person who held an office
three times has three tenures (that is why finding 1 made `tenure` a kind and
not a relation); a person re-elected or reappointed without leaving has one.
That is the rule, and §5 depends on it.

- **Id**: `<person id>-<office>-<start year>`, the convention M30a-2 already
  set — `salazar-prime-minister-1932`, `marcelo-caetano-prime-minister-1968`.
  So `<person>-monarch-<year>`, `<person>-president-<year>`,
  `<person>-prime-minister-<year>`. A free slug, checked against `SLUG`.
- **`person`**: an active actor of `actorType: "person"` (rule 26).
- **`office`**: `monarch-of-portugal`, `president-of-portugal` or
  `prime-minister-of-portugal`. All three carry `when: null` (M30a A13), so
  rule 26's overlap check is skipped and no tenure can fail it.
- **`when`**: §2.
- **`startedBy`**: the id of the election, coup or succession that began the
  tenure, where the atlas holds it as an **active** event — rule 11 refuses a
  tombstone, which is why §5 exists. `null` otherwise, and `null` is the
  honest answer far more often than not: an event in the atlas that merely
  preceded a tenure is not what began it.
- **`sources`**: at least one (rule 6). §3.
- **`note`**: optional, at most 200 characters, and the place for the one
  thing the office, the person and two dates cannot say — that a spell ended
  because the holder died in post, that a government was provisional, that
  the end year is when they left on being elected to something else. It is
  **not** a place for a paragraph of history and not a place for a hedge that
  belongs in `review.note`.
- **Envelope**: `authors: [{ "name": "Claude (assistant draft, unreviewed)",
  "github": null }]`, `origin: { "tool": "assistant" }`, `license:
  "CC-BY-SA-4.0"`, `created` the day of the run, `revised: null`.
  `tools/new-record.mjs` writes `review: { "status": "draft" }` but **writes
  no `origin`** (deviation 309): the run adds it. Copy the shape of
  `data/tenures/salazar-prime-minister-1932.json` field for field.

## 2. The dates, which are the whole risk of this run

`CLAUDE.md`: *a wrong date that looks confident is worse than a gap.* This
run is being asked to write a hundred-odd intervals from a model's memory of
Portuguese political history, and memory is exactly the thing that produces
confident wrong dates. The rules are therefore hard ones and the validator
cannot check any of them:

1. **`when.start` and `when.end` are years, never invented days.** Do **not**
   write `when.date` or `when.endDate` unless the exact date is read in a
   source this repository holds. An ISO date is a claim to have read one.
2. **Where the year itself is uncertain, write the bound as a range**:
   `"start": { "min": 1919, "max": 1920 }`. The schema allows it on both
   bounds, `span()` and every rule handle it, and it is the model's one
   honest way of saying "one of these two". A range is always better than a
   guess and always better than silence.
3. **Where even a range would be a guess, write no tenure at all.** List the
   holder and the office in `STATUS.md` under the milestone's paragraph, by
   name, so the gap is visible. An office strip with a hole in it that the
   status file names is a correct atlas; an office strip with no hole and a
   wrong bar in it is not.
4. **Every tenure written in this milestone carries
   `review.flags: ["date"]`** and a `review.note` saying in plain words that
   the interval was written from the assistant's memory and has not been read
   in a source — the sentence M30a-2 put on the twelve is the model. The flag
   is what puts it in front of a reviewer; the note is what tells them what to
   check. A tenure whose dates *were* read in a source cited on it says so
   instead, and drops the flag.
5. **`end: null` means still in post**, and is written only for the two
   people who are.
6. A tenure's `when` is not checked against the person's own `when` by any
   rule. Check it by eye anyway: a tenure that starts before its holder was
   born is the kind of error this run is most likely to make.

## 3. Sources

`data/sources/` already holds the bibliography for this whole period, and the
run cites from it before writing anything new. The books that reach it:
`ramos-2009-historia-de-portugal` (the general history, and the only one that
covers 1886 to the present), `wheeler-1978-republican-portugal` (1910–1926),
`meneses-2004-portugal-1914-1926`, `rosas-1994-estado-novo` (1926–1974),
`meneses-2009-salazar` and `rosas-2012-salazar-e-o-poder`,
`maxwell-1995-making-of-portuguese-democracy` (1974–), `telo-2007-historia-contemporanea`
(1974 to the present), `costa-pinto-2003-contemporary-portugal`,
`costa-pinto-teixeira-2019-political-institutions`. `locator: null` unless
the run can name a page it has actually seen.

- A new `source` record is written **only** where nothing above plausibly
  covers the claim, and then with **no invented ISBN, DOI, URL or page
  number**: `tools/new-record.mjs source` leaves every identifier `null` and
  they stay `null`. `tools/lookup-sources.mjs` needs a network and has none
  here.
- **Do not cite `wikipedia-en`, `wikipedia-pt` or `wikidata`** on a tenure
  this run writes. Those source records are cited with a locator naming a
  revision or an item, and this run cannot read one; citing them without a
  locator would claim a reading that did not happen.
- The run must end by **saying which citations it has not checked against the
  source** — which, for everything it writes, is all of them. The validator
  prints the count; the run repeats it in `STATUS.md` in words.

## 4. New person actors

Only where a holder has no record. Thirty-four `person` actors exist today
and these are the ones that already hold, or plainly held, one of the three
offices — the survey the run starts from and verifies rather than trusts:

- **Monarch**: `carlos-i`, `manuel-ii`.
- **President**: `manuel-de-arriaga`, `sidonio-pais`, `gomes-da-costa`,
  `oscar-carmona`, `americo-tomas`, `antonio-de-spinola`, `ramalho-eanes`,
  `mario-soares`, `cavaco-silva`, `marcelo-rebelo-de-sousa`.
- **Prime minister / President of the Council**: `joao-franco`,
  `afonso-costa`, `pimenta-de-castro`, `sidonio-pais`, `gomes-da-costa`,
  `oscar-carmona`, `salazar`, `marcelo-caetano`, `vasco-goncalves`,
  `mario-soares`, `cavaco-silva`, `pedro-passos-coelho`, `antonio-costa`,
  `luis-montenegro`.

Twenty-one distinct people of the thirty-four, and `salazar` and
`marcelo-caetano` already have their prime-ministerial tenures from M30a-2 —
**do not write a second**. The other thirteen person actors in the corpus
(`alvaro-cunhal`, `amilcar-cabral`, `andre-ventura`, `eduardo-mondlane`,
`henrique-galvao`, `humberto-delgado`, `jawaharlal-nehru`, `luis-filipe`,
`norton-de-matos`, `otelo-saraiva-de-carvalho`, `paiva-couceiro`,
`ricardo-salgado`, `sekou-toure`) held none of the three and are not touched.
The survey above is where the run *starts*: each of the twenty-one is checked
against the record before a tenure is written for it, and a holder the survey
missed is still a holder. Every other holder needs a new actor:

- `tools/new-record.mjs actor <id> --type person --names "…" --start <birth>
  [--end <death>|--end null]`, then the run adds `origin` and the draft note.
- `id`: the common short name, unaccented, as `oscar-carmona` and
  `pedro-passos-coelho` are. `names`: display name first, then the full form.
- `summary` is **required and non-empty** by the schema, and is the expensive
  field. Under the exception it says what the offices this atlas records say —
  who they were, what they held, when — and **nothing the record's own sources
  cannot carry**. No anecdote, no assessment, no cause of death unless it is
  the reason a tenure ended and is cited.
- `when` follows §2: a birth or death year the run is unsure of is a
  `{min,max}` range, and the actor carries the `date` flag too.
- **Omit `where`** unless the birthplace is certain; a point is a claim.
- `sources`: at least one (rule 6), from §3.
- Do **not** write `wikidata`, `wikipedia` or `sitelinks` by hand. They are
  the import's to fill and `tools/import/identity.mjs` is the rule; a hand-
  written identifier is a guess at somebody else's database.

A new actor that no event names would warn `actor-unused` — except that
M30a-1's `indexEntries` pushes a tenure's `person` into the actor referrers
(amendment A7, item 2), so a person who only holds an office is legitimately
in the atlas and silent. Confirm that on the first new actor rather than
assuming it.

## 5. The elections reinstated

Plan decision 3 and finding 15. Rule 11 forbids an active tenure from naming
a retracted event in `startedBy`, so an election that began a tenure has to
come back before, or in the same commit as, the tenure that names it. The
test is narrow and mechanical:

> An election is reinstated **exactly when a tenure this milestone writes
> names it in `startedBy`**. Nothing else is.

An election that changed nobody stays retracted; a re-election inside a
continuous spell begins no new tenure (§1) and so stays retracted; an election
elsewhere in the world stays retracted. The run does not reinstate an event
because a government happened to follow it — in Portugal a legislative
election does not appoint a prime minister, and treating one as if it did
would be an invented claim about how the office is filled.

Reinstating is not a status flip (finding 15). On the record:

- `status: "retracted"` → `"active"`;
- **delete `retraction`** entirely — rule 27 refuses a retraction on anything
  but a retracted record, and refuses a retracted record without one;
- in `review`, drop the `m21-retracted` / `m22-retracted` flag, keep
  `imported-facts` where it is there, and **add `review.status: "draft"`** —
  the retracted records carry no status, so without this the reinstated event
  comes back warning `unread` and standing in no queue;
- re-check every reference: `place`, `region`, and every `actor` in `actors`
  must resolve to an **active** record (rules 3 and 11). Several of these
  events carry `actors: []`, which is legal.
- Leave `docs/m21-retractions.md` and `docs/m22-retractions.md` **unedited**:
  they are the audit trail of a decision that was taken, and this run appends
  its reversal to `STATUS.md` instead, naming each reinstated id and the
  tenure that asked for it.

The `degree-zero` warning already counts an event named by an active tenure's
`startedBy` as connected (M30a-2), so a reinstated election with no edges is
silent, which is the whole mechanism decision 3 asked for. Where an active
election already exists — and there are sixty-two active events matching an
election, coup, resignation or succession today, from `1908-portuguese-legislative-election`
to `legislative-election-2025` — the tenure names it and nothing is
reinstated.

## 6. The ten memberships

Plan decision 12. M30a-2 widened rule 19 so that a polity or an institution
may be `member-of` an institution. Twelve `allied-with` relations exist; ten
of them carry, word for word, the note *"Membership, not an alliance: rule 19
reserves member-of for persons"*, and those ten are the ones this run
re-types. Checked one by one against the file, they are:

`portugal--council-of-europe--allied-with`, `portugal--cplp--allied-with`,
`portugal--efta--allied-with`, `portugal--european-union--allied-with`,
`portugal--eurozone--allied-with`, `portugal--imf--allied-with`,
`portugal--league-of-nations--allied-with`, `portugal--oecd--allied-with`,
`portugal--oeec--allied-with`, `portugal--schengen-area--allied-with`.

A relation's id is `from--to--type`, so re-typing is a **rename**: write
`<from>--<to>--member-of` with `type: "member-of"`, delete the old file, and
**put the old id in the new record's `aliases`** so every existing link
resolves through `resolveId`. The substitution sentence comes out of `note`;
what is left of the note — "Founding member at Lisbon in July 1996", "left on
entering the European Communities in 1986" — stays, because it is a claim
somebody wrote. `when`, `sources`, `review` and `origin` are carried across
unchanged and `revised` becomes the day of the run. Check the endpoints
against `RELATION_ENDPOINTS` before writing: `portugal` is a `polity` and each
body must be an `institution`, or rule 19 refuses it and the record is not
one of the ten after all.

The other two `allied-with` records are **not** re-typed by this run and are
listed in `STATUS.md` for the owner instead: `estado-novo--nato--allied-with`
(NATO is an alliance and a membership, and which the atlas means is an
editorial decision) and `third-portuguese-republic--european-economic-community--allied-with`
(a membership, but written from the regime and not the state, and re-typing it
would silently answer a second question about which actor joins a community).
Say so in one line each; do not decide.

## 7. What this run must not do

- **No edge.** Not one, in either direction, for any reason. `startedBy` is
  the whole of decision 3 precisely so that a tenure never needs an edge, and
  an edge written to connect a reinstated election would be the invented edge
  M21 and M22 retracted the event to avoid.
- **No record whose `review.status` is `reviewed` is touched**, and no record
  signed by a person is edited, re-typed or reinstated. Check before writing.
- **No summary, note or `review.note` states anything beyond the tenure's
  office, its holder and its dates.** A tenure is not a biography and not an
  argument; the argument is an edge and this run writes none.
- **No office record is written or edited.** The three exist, they carry
  `when: null` on purpose (M30a A13), and dating them against an actor record
  that begins in 1886 is the invented claim that amendment refused. A fourth
  Portuguese office — a legislature, a regional presidency, a ministry — is
  outside this milestone.
- **No module under `src/` and no schema is edited.** If the run believes a
  rule or a schema is wrong, it stops and says so in `STATUS.md`; it does not
  widen a rule to admit a record it wants to write.
- **No `wikidata`, `wikipedia` or `sitelinks` written by hand** (§4).
- **No `data/roles.json` role, no `category`, no `parent`, no `scope`** — M32b
  and its neighbours own those, and an event this run reinstates keeps
  whatever it had.
- **No new place record** unless a reinstated event names one that does not
  exist, which would be a bug in M21 rather than a gap.

## 8. The three runs, gated

The whole of §1–§7 is more than one session. It runs as three, each gated on
the previous done line, the way M30a's amendment A19 splits M30a:

- **M31-1 — the heads of state, and the ten memberships.** Gate: `M30b done`.
  Every tenure at `monarch-of-portugal` and `president-of-portugal` from 1886
  to today, with the person actors they need; the retracted presidential
  elections that any of those tenures names in `startedBy`, reinstated by §5;
  §6 in full. The memberships are here because they are the one part of this
  milestone that needs no date written from memory, so a run cut off early
  still lands something whole. Done line **`M31-1 done`**.
- **M31-2 — the heads of government, 1926 to today.** Gate: `M31-1 done`.
  Every tenure at `prime-minister-of-portugal` from the coup of 28 May 1926
  onward — the Ditadura Nacional's presidents of the Ministry, the two Estado
  Novo tenures that **already exist and are not rewritten**, the provisional
  governments of 1974–76, and the constitutional governments since — with the
  person actors they need and any election reinstated under §5. Done line
  **`M31-2 done`**.
- **M31-3 — the heads of government, 1886 to 1926.** Gate: `M31-2 done`. The
  presidents of the Council of the constitutional monarchy and of the First
  Republic. This is the longest list and the least certain, and §2 rule 3
  matters more here than anywhere: the First Republic put more than forty
  ministries in office in sixteen years, and a run that cannot date one from
  better than a hazy memory **writes nothing for it and names it in
  `STATUS.md`**. Completeness here is the owner's call, not the run's (open
  question, §10). Done lines **`M31-3 done`** and then, on its own line,
  **`M31 done`**.

Each of the three ends with §9 green and the index rebuilt and byte-identical.
If a run reaches the end of its session with part of its list unwritten, it
commits what is whole, writes what is missing into `STATUS.md`, and does
**not** write its done line; the next run of that number continues from there.

## 9. Tests, the index, and the two-commit rule for histories

No new test module is required — this run writes records, not code — but
these are the ones that pin what it touches, and they run green at every
commit:

- `tests/office-rules.test.mjs` — rule 26's four checks, rules 3 and 11 on
  `startedBy`, the `started-outside-when` warning, and "an event that began a
  tenure is not degree zero". Every tenure this run writes is a case of all of
  them.
- `tests/rules.test.mjs` and `tests/relation-rules.test.mjs` — rule 19's
  endpoints (§6) and rule 27's retraction/status pair (§5).
- `tests/build-index.test.mjs` — the review index: `summary.drafts` equals the
  records `inQueue`, each kind's shard holds its own drafts, and each shard's
  warnings are the validator's own. Every record this run writes is a draft,
  so the draft count moves by exactly the number written; it is **493 today**.
  The exact `manifest.counts` assertions in that file are on the *fixtures*
  and must not move — if one does, the run has written into
  `tests/fixtures/data/` by mistake.
- `tests/event-fields.test.mjs` — `officesByEvent` and `tenuresByOffice` in
  the manifest, which this run fills for the first time with real data, and
  which M33's lanes read.
- `tests/search-shard.test.mjs`, `tests/actor-card.test.mjs`,
  `tests/citers.test.mjs`, `tests/spine.test.mjs`, `tests/prerender.test.mjs`
  and `tests/spine-pages.test.mjs` — new actors join the search shard and the
  spine, tenures join a source's citers, and `sources.html` is rebuilt because
  a citation count changed.
- `tests/aliases.test.mjs` — §6's renames resolve through the old ids.
- `tests/validate-cli.test.mjs` — its assertions are on the fixture corpus and
  must not move.

Then: `node tools/build-index.mjs`, `node tools/validate.mjs` with zero
errors, and `node tools/validate.mjs --index` byte-identical at the end of
each of the three runs. `node --test` green with `CHROME` set, and the number
of skipped tests reported.

**A record's history cannot be right in the commit that adds it** (deviation
328): `tools/lib/history.mjs` reads `git log`, so new records are written in
one commit and `data/index/` is regenerated in the next. Every one of the
three runs is therefore at least two commits, and rule 16 is momentarily false
on the first of the two. That is a property of deriving histories from git,
not of this run, and it does not need re-deriving each time.

## 10. `STATUS.md`, the deviations, and what to leave to the owner

Each run updates `STATUS.md`: its own paragraph under "Last updated" saying
what it wrote and what it left out, its claim and done lines under
"Milestones landed", and its deviations. **Deviations are numbered on from
the last one in `STATUS.md` when the run starts** — 351 at the time this
brief was written, and M30b's three runs will have added to it, so read the
file rather than trusting this number.

Named in `STATUS.md` and decided by nobody in these runs:

1. Every holder for whom no tenure was written, with the office and the
   reason (§2 rule 3).
2. Every citation written and not checked against the source, as a count and
   a sentence (§3).
3. The two `allied-with` relations of §6 that were left alone, and why.
4. Whether the First Republic's ministries all belong in the atlas at the
   granularity of one tenure each (§8, M31-3).
5. The reinstated elections, by id, each with the tenure that asked for it.

**Done when:** every tenure the three runs wrote is at one of the three
Portuguese offices, carries a person, a year interval, at least one source
from `data/sources/` and, where a date came from memory, `review.flags:
["date"]` and a note saying so; no tenure duplicates `salazar-prime-minister-1932`
or `marcelo-caetano-prime-minister-1968`; every new person actor is a draft
with a summary, at least one source and no hand-written identifier; every
retracted election a tenure names is active with its `retraction` deleted and
`review.status: "draft"`, and no other election has moved; the ten `allied-with`
memberships of §6 are `member-of` records carrying their old ids in `aliases`,
and the other two are named in `STATUS.md` untouched; no edge, no office, no
schema and no module under `src/` was written or edited; `node tools/validate.mjs`
reports zero errors; `node tools/validate.mjs --index` is byte-identical;
`node --test` is green with `CHROME` set; and `STATUS.md` carries the literal
lines `M31-1 done`, `M31-2 done`, `M31-3 done` and then, on a line with
nothing else on it, **`M31 done`**.
