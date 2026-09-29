// What a `wikipedia-en` citation names, and whether the cache holds it.
//
// A citation's locator is prose — `"Title", revision 1376343040` and then,
// often, the sentence the argument rests on. The article and the revision are
// the two things a machine needs out of it: the article, because
// `tools/import/cache/wikipedia/` is filed by article title; the revision,
// because a citation that names one is a promise that *that* text is what was
// read, and a reviewer offline can only keep the promise if the text is on
// disk (A14(3), the 24 September review's finding 5).
//
// A15(2) makes that check the last step of every batch and asks for a test
// that fails when a citation's revision is not on disk. Both read this file,
// which is pure: the records and the cached leads are handed in.
//
// The cache holds **one lead per item per language**, so an article two
// records cite at two revisions can only be on disk at one of them. Which one
// is not a guess: A14(3)'s second sweep fixed it as the revision the most
// citations name, ties to the later, because that is the fewest citations left
// pointing at text the cache does not hold. `bestRevision` is that rule and
// `cacheGaps` reports the rest as `unholdable` rather than as a fault.

// A locator is prose, and three shapes of it matter. It may name **two**
// articles, separated by `; ` — `"Battle of Corunna", revision 1370437705,
// § Prelude; "Battle of Vimeiro", revision 1370437710` — so the clauses are
// split before anything else. Within a clause the title is greedy up to the
// last `", revision `, because an article may carry quotation marks in its own
// name: `"False positives" scandal` is one this corpus cites, and a non-greedy
// title loses its first one.
export const LOCATOR = /^"(.*)",\s*revision\s+(\d+)\b/;

// What splits two articles in one locator. A clause after the first that does
// not parse is not a second article — it is the rest of a quoted sentence —
// and is put back onto the clause before it rather than reported as a fault.
const CLAUSES = /;\s+(?:and\s+)?(?=")/;

export const WIKIPEDIA_EN = 'wikipedia-en';

export function parseLocator(locator) {
  const found = LOCATOR.exec(String(locator ?? '').trim());
  if (!found) return null;
  const title = found[1].trim();
  if (!title) return null;
  return { title, revid: Number(found[2]) };
}

// Every article a locator names, in the order it names them. Empty when the
// locator names none, which is what makes it malformed.
export function parseLocators(locator) {
  const whole = String(locator ?? '').trim();
  const out = [];
  for (const clause of whole.split(CLAUSES)) {
    const one = parseLocator(clause);
    if (one) out.push(one);
  }
  return out;
}

// The revision the cache should hold for an article: the most cited, ties to
// the later. `counts` is a Map of revision to how many citations name it.
export function bestRevision(counts) {
  let best = null;
  for (const [revid, cites] of counts ?? []) {
    if (best === null || cites > best.cites || (cites === best.cites && revid > best.revid)) {
      best = { revid, cites };
    }
  }
  return best === null ? null : best.revid;
}

// Every `wikipedia-en` citation on an active record, by article and revision.
// `malformed` is a locator this cannot read, which is a fault in the record.
export function citedArticles(records) {
  const byTitle = new Map();
  const malformed = [];
  for (const record of records ?? []) {
    if ((record?.status ?? 'active') !== 'active') continue;
    for (const citation of record.sources ?? []) {
      if (citation?.source !== WIKIPEDIA_EN) continue;
      const parsed = parseLocators(citation.locator);
      if (parsed.length === 0) {
        malformed.push({ id: record.id ?? null, kind: record.kind ?? null, locator: citation.locator ?? null });
        continue;
      }
      for (const one of parsed) {
        if (!byTitle.has(one.title)) byTitle.set(one.title, new Map());
        const counts = byTitle.get(one.title);
        counts.set(one.revid, (counts.get(one.revid) ?? 0) + 1);
      }
    }
  }
  return { byTitle, malformed };
}

// The revisions the cache holds, and the revisions it holds per article title.
// `leads` is the list `readCachedLeads` returns, or anything with the same
// `qid`, `lang`, `title` and `revid` fields; only English leads are read,
// because only `wikipedia-en` citations are checked.
export function cachedRevisions(leads) {
  const revisions = new Set();
  const byTitle = new Map();
  for (const entry of leads ?? []) {
    const lead = entry?.lead ?? entry;
    if (!lead || lead.lang !== 'en') continue;
    const revid = Number(lead.revid);
    if (!Number.isInteger(revid)) continue;
    revisions.add(revid);
    const title = String(lead.title ?? '').replace(/_/g, ' ');
    if (!byTitle.has(title)) byTitle.set(title, new Set());
    byTitle.get(title).add(revid);
  }
  return { revisions, byTitle };
}

// One article may be cited under two titles, because Wikipedia renames
// articles: `Battle of Khe Sanh` became `Siege of Khe Sanh` between two fires,
// and the cache — filed by Wikidata item — holds one entry for both. So the
// group a revision competes in is the **item**, never the title string.
// `titles` is the table `tools/import/cache/titles.json` carries: the cited
// title as written, resolved through the action API to its item, its canonical
// title and whether it is a redirect. A title the table does not name is its
// own group, which is what a corpus with no table falls back to.
export function groupsByItem(cited, titles = {}) {
  const groups = new Map();
  for (const [title, counts] of cited) {
    const row = titles?.[title] ?? null;
    const key = row?.qid ?? `title:${title}`;
    if (!groups.has(key)) groups.set(key, { key, qid: row?.qid ?? null, titles: [], counts: new Map() });
    const group = groups.get(key);
    group.titles.push(title);
    for (const [revid, n] of counts) group.counts.set(revid, (group.counts.get(revid) ?? 0) + n);
  }
  return groups;
}

// What A15(2) asks. `missing` is a citation whose revision is not on disk and
// whose article this cache could hold — the fault the pass closes. `unholdable`
// is one the cache's one-entry-per-item shape cannot hold beside the best, and
// is reported and not counted against the pass.
export function cacheGaps(records, leads, { titles = {} } = {}) {
  const { byTitle: cited, malformed } = citedArticles(records);
  const { revisions, byTitle: held } = cachedRevisions(leads);
  const missing = [];
  const unholdable = [];
  let references = 0;
  let onDisk = 0;
  for (const group of groupsByItem(cited, titles).values()) {
    const best = bestRevision(group.counts);
    const onDiskHere = [...new Set(group.titles.flatMap((t) => [...(held.get(t) ?? [])]))];
    for (const [revid, cites] of group.counts) {
      references += cites;
      if (revisions.has(revid)) { onDisk += cites; continue; }
      const where = { title: group.titles[0], titles: group.titles, qid: group.qid, revid, cites };
      if (revid === best) missing.push({ ...where, held: onDiskHere });
      else unholdable.push({ ...where, best });
    }
  }
  missing.sort((a, b) => b.cites - a.cites || a.title.localeCompare(b.title));
  unholdable.sort((a, b) => b.cites - a.cites || a.title.localeCompare(b.title));
  return { references, onDisk, malformed, missing, unholdable };
}
