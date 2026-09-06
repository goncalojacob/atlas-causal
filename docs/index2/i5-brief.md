# Build brief — I5: the history index sharded

The fifth run of the second index cycle (`docs/index2-plan.md`, decision D8;
`docs/health-review-2026-09-06-result.md` §5.2.2). `data/index/history/` is
one file per record: **1,027 files and 4.1 MB** on the real data today, and
**62,446 files and 11.6 MB** at 10⁴, every one of them committed on `main`
and shipped in the artifact. It becomes one file per kind and century, named
in the manifest, keyed by record id inside.

**Read**: `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md`,
`docs/index2-plan.md` (D8, owner questions 2 and 5),
`docs/health/h6b-brief.md`, `docs/health-review-2026-09-06-result.md` §3 R1
and §5.2.2, then `tools/lib/history.mjs` (`recordHistories`, `HISTORY_DIR`,
`isShallow`), `src/review/history.js` (`versionsOf`, `versionsFromRevised`,
`diffAgainst`), `src/review/main.js` (where a history is fetched),
`tools/build-index.mjs` (`readIndex`, `writeIndex`, `compareIndex`,
`HASHED`, `HASHED_DIR`), `src/explanations.js` (the century boundaries),
`tests/history.test.mjs`, `tests/build-index.test.mjs`.

## The gate

Wait for the literal line `I4 done` on `origin/m0`. Then claim `I5`.

## What this run must not do

- No new dependency; no build step beyond the committed output of a Node
  script already in `tools/`.
- No historical claim; no record under `data/` touched except `data/index/`;
  no `reviewed` record touched; no migration consumed.
- **The invariant H9 restored stays restored.** `compareIndex` compares the
  histories byte for byte, `deploy.yml` checks out with `fetch-depth: 0`, and
  `recordHistories` refuses to answer `from: "git"` on a shallow clone. None
  of that is loosened to make the sharding easier; if a shard's bytes are not
  reproducible, the fix is the shard's shape, not an exemption.
- **A version is still identified by the record's own content**, never by the
  commit that carried it — no hash, no commit date. That is what makes a
  build before a commit agree with a build after it.
- The fixtures' index rebuilt with the repository's; `--index`
  byte-identical; `node --test` green with `CHROME` set.

## 1. The shape

`history-<kind>-<from>-<to>-<hash>.json`, one per kind and century that has
any record in it, carrying `{ schema, kind, from, to, records: { <id>:
{ from, versions } } }` — the same per-record object `history/<id>.json`
carries today, minus the `id` and `kind` it repeats. A record is filed by the
**century its own start year falls in**, on the same boundaries
`src/explanations.js` computes and I3's attribute shards use, so the three
sharding schemes are one rule; a record with no year goes in the `null`
shard. Ids are sorted inside the file, as everything else in the index is.

The manifest gains `historyShards: [{ kind, from, to, file }]`, in kind order
then year order, exactly the shape `explanationShards` and I3's
`attributeShards` have. `files.history` — the unhashed directory name — goes,
and with it the `HISTORY_DIR` special case in `readIndex`, `writeIndex` and
`compareIndex`: the shards are hashed files like every other index file, so
`HASHED` learns one more prefix and the two directory special cases in
`build-index.mjs` reduce to the citer directory alone.

Hashing them is **owner question 5**; the recommended answer is that they are
hashed and named in the manifest, because `immutable` should keep meaning
what it says and the dashboard already reads the manifest once.

## 2. What the dashboard does

`src/review/main.js` fetches a history for the record a reviewer just opened.
It now looks the record's shard up in the manifest — by kind and by the
record's year, which it has from the core — and fetches that. Same discipline
as everything else: one request in flight per shard, a rejection dropped
rather than kept, the shard cached. A reviewer working through one kind in
one century fetches one file for the whole session, which is the point.

`src/review/history.js` is pure and does not change: it is handed the same
per-record object it is handed today.

## 3. What it costs, and the number to beat

Today: 1,027 files, 4.1 MB. After: on the real data, one shard per kind and
century that has records — a handful of files. At 10⁴ the harness's dataset
is 62,446 records over six centuries and seven kinds, so a few dozen files
instead of 62,446, and a reviewer fetches one of them.

The build's own `git log` walk is unchanged and is not this run's problem;
what changes is the 62,446 files it writes, the 62,446 `writeFile` calls, and
the 62,446 entries `readIndex` and `compareIndex` walk on every
`validate --index`. Measure `node tools/build-index.mjs --data <the bench
dataset>` before and after and put the ratio in `STATUS.md` — the harness's
`build-index` case measured **13,420 ms and 62,657 files** on this machine
before the run.

## Files this run touches

`tools/lib/history.mjs` (the shard assembly; `HISTORY_DIR` goes) ·
`tools/build-index.mjs` (`HASHED`, `readIndex`, `writeIndex`,
`compareIndex`, `manifestValue`) · `src/review/main.js` ·
`ARCHITECTURE.md` (the `history/` paragraph in "Index and manifest") ·
`CLAUDE.md` (the `data/index/` lines) · `data/index/` and
`tests/fixtures/data/index/`, rebuilt.

**The hand tables**: `HASHED` and `HASHED_DIR` in `tools/build-index.mjs`;
the two directory branches in `readIndex` and `writeIndex`;
`manifestValue.files`; the manifest assertion in
`tests/build-index.test.mjs`; the deploy allowlist in
`.github/workflows/deploy.yml`, which names what is published and must still
name the histories under their new names.

## 4. The version

`manifest.schema` becomes **6**.

## Tests

- `tests/history.test.mjs`: a record's history read out of its shard equals
  the history the per-record file carried, for every record in the fixtures;
  a record is in exactly one shard, chosen by its start year; a record with
  no year is in the `null` shard; ids are sorted inside the file.
- `tests/build-index.test.mjs`: the manifest names `historyShards` and no
  longer names `files.history`; two builds byte-identical **including the
  histories** (the exemption is still gone); a stale shard is pruned; a
  shallow clone still produces `from: "revised"` and says so, and its shards
  still compare byte for byte against a second shallow build.
- `tests/review-browser.test.mjs`: opening a record shows its versions and
  the diff against the draft, as it does today; a second record of the same
  kind and century costs no second request.
- `tests/workflows.test.mjs`: the deploy allowlist covers the shards.
- `tests/prerender.test.mjs` and `--index`: the prerendered pages
  byte-identical.

## Done when

- `data/index/history/` is gone and the shards are in its place, hashed and
  named in the manifest.
- `data/index/` holds **under 100 files** on the real data, against the 1,054
  it held before, and the count is in `STATUS.md`; the count at 10⁴ is
  measured with the bench dataset and written down beside it.
- A reviewer opening two records of one kind and century makes one request.
- The byte comparison covers the histories and rule 16 means what it says.
- `manifest.schema` is 6.
- `node tools/validate.mjs --index` byte-identical, prerendered pages
  unchanged; `node --test` green with `CHROME` set.
- `STATUS.md` carries the literal line:

`I5 done`
