// Whether the evidence a record cites is on disk at the revision it cites.
//
// A `wikipedia-en` citation names an article and a revision id, and the lead
// that revision said is cached under `tools/import/cache/wikipedia/<qid>.en.json`.
// A14(3) put the cache and the citations back in step once; A15(2) makes that
// the last step of every batch in both lanes, so the question needs asking by
// something other than a person remembering to ask it.
//
// Pure: it is handed the records and a map of what the cache holds, and it
// decides nothing about fetching. The three answers it separates are three
// different facts about a record, and only one of them is a defect:
//
//   `stale`      the cache has that item's lead at another revision. The
//                citation and the evidence disagree, which is the thing
//                A15(2) exists to stop. A batch that leaves one of these
//                has not finished.
//   `uncached`   the record names an item and the cache has no lead for it.
//                Older than A14(3) and not something a batch can always fix
//                (an article may have gone), so it is counted, not asserted.
//   `unkeyed`    the record cites an article and carries no `wikidata`, so
//                the cache — which is keyed by item — cannot be asked at all.
//
// Nothing here is a historical claim; it compares two numbers.

const REVISION = /revision (\d+)/;

// Every place an id-bearing citation may sit on a record: `sources`, and the
// per-field lists of `review.citations`, which is a reviewer's audit trail and
// cites the same way.
export function citationsOf(record) {
  const out = [...(record?.sources ?? [])];
  const checked = record?.review?.citations;
  if (checked && typeof checked === 'object') {
    for (const list of Object.values(checked)) {
      if (Array.isArray(list)) out.push(...list);
    }
  }
  return out.filter((c) => c && typeof c === 'object');
}

// The revisions of the English Wikipedia a record cites, as numbers. A
// citation with no revision in its locator cites the article and not a
// version of it, and is not this check's business.
export function citedRevisions(record, source = 'wikipedia-en') {
  const found = [];
  for (const c of citationsOf(record)) {
    if (c.source !== source) continue;
    const m = REVISION.exec(String(c.locator ?? ''));
    if (m) found.push(Number(m[1]));
  }
  return found;
}

// `cached` maps a Wikidata item to the revision its cached lead is of.
export function cacheGaps(records, cached) {
  const at = cached instanceof Map ? cached : new Map(Object.entries(cached ?? {}));
  const stale = [];
  const uncached = [];
  const unkeyed = [];
  let checked = 0;
  for (const record of records ?? []) {
    if ((record?.status ?? 'active') !== 'active') continue;
    const revisions = citedRevisions(record);
    if (!revisions.length) continue;
    const qid = record.wikidata ?? null;
    if (!qid) {
      unkeyed.push({ id: record.id, kind: record.kind, revisions });
      continue;
    }
    if (!at.has(qid)) {
      uncached.push({ id: record.id, kind: record.kind, wikidata: qid, revisions });
      continue;
    }
    const held = Number(at.get(qid));
    for (const revision of revisions) {
      checked += 1;
      if (held !== revision) stale.push({ id: record.id, kind: record.kind, wikidata: qid, cited: revision, cached: held });
    }
  }
  return { stale, uncached, unkeyed, checked };
}

// What `readCachedLeads` gives, as the map `cacheGaps` wants, for one language.
export function revisionsByItem(leads, lang = 'en') {
  const at = new Map();
  for (const { file, lead } of leads ?? []) {
    if (!file.endsWith(`.${lang}.json`)) continue;
    const qid = lead?.qid ?? file.slice(0, -`.${lang}.json`.length);
    if (typeof lead?.revid === 'number') at.set(qid, lead.revid);
  }
  return at;
}
