// The pure half of the review dashboard: which records are waiting for a
// person, what is wrong with each, and how the queue narrows. No DOM, no
// fetch — editor.js and main.js are the other halves.
//
// The exception in CLAUDE.md is the reason this file exists. The 20th- and
// 21st-century records under data/ were drafted by the assistant and carry a
// marker saying so; every one of them is unreviewed until a person reads it,
// edits what is wrong and signs it. The queue is that list, and the project
// is done with the exception when the queue is empty.

export const DRAFT_AUTHOR = 'Claude (assistant draft, unreviewed)';

// The order the queue is grouped in: the things an argument rests on first,
// then the arguments, then the walks through them.
export const KIND_ORDER = Object.freeze(['source', 'place', 'actor', 'event', 'edge', 'relation', 'narrative']);

// A source with neither an ISBN nor a DOI cannot be looked up mechanically,
// which is exactly what a reviewer wants to know before reading it.
export const NO_IDENTIFIER = 'no-identifier';

export function isDraft(record) {
  return (record?.authors ?? []).some((a) => a?.name === DRAFT_AUTHOR);
}

// The queue is built in the browser, which has the index and not the record
// files: `data/index/review-<hash>.json` carries one of these per draft.
// Exactly the fields the list and its filters read — everything else waits
// until a record is opened, and is then fetched whole.
export const DIGEST_KEYS = Object.freeze(['kind', 'id', 'status', 'authors', 'review', 'title', 'names', 'from', 'to', 'type', 'isbn', 'doi']);

export function digestOf(record) {
  const digest = {};
  for (const key of DIGEST_KEYS) if (Object.hasOwn(record ?? {}, key)) digest[key] = record[key];
  return digest;
}

export function countDrafts(records) {
  return (records ?? []).filter(isDraft).length;
}

// What the record is called in a list: the display name of the thing, not
// its id, except where the id is the only honest name for it.
export function labelOf(record) {
  if (!record) return '';
  if (record.kind === 'edge' || record.kind === 'relation') return `${record.from} — ${record.type} → ${record.to}`;
  if (record.kind === 'actor' || record.kind === 'place') return (record.names ?? [])[0] ?? record.id;
  return record.title ?? record.id;
}

// Map<id, [code]> out of the validator's own warnings, so the dashboard
// never reimplements a rule: whatever `node tools/validate.mjs` says about a
// record is what the queue shows against it.
export function warningsById(warnings) {
  const out = new Map();
  for (const w of warnings ?? []) {
    if (!w?.id) continue;
    if (!out.has(w.id)) out.set(w.id, []);
    if (!out.get(w.id).includes(w.rule)) out.get(w.id).push(w.rule);
  }
  return out;
}

// Everything a reviewer would filter on, in one list per record: the
// validator's warnings, the missing-identifier check the validator has no
// opinion about, and whatever the record itself asks to have looked at.
export function flagsOf(record, byId = new Map()) {
  const flags = [...(byId.get(record?.id) ?? [])];
  if (record?.kind === 'source' && !record.isbn && !record.doi) flags.push(NO_IDENTIFIER);
  for (const flag of record?.review?.flags ?? []) if (!flags.includes(flag)) flags.push(flag);
  return flags.sort();
}

function kindRank(kind) {
  const at = KIND_ORDER.indexOf(kind);
  return at < 0 ? KIND_ORDER.length : at;
}

// records: the full record files, drafts and all. Returns the queue only —
// a record a person has already signed is not in it.
export function buildQueue(records, { warnings = [] } = {}) {
  const byId = warningsById(warnings);
  return (records ?? [])
    .filter(isDraft)
    .map((record) => ({
      kind: record.kind,
      id: record.id,
      label: labelOf(record),
      status: record.status,
      flags: flagsOf(record, byId),
      note: record.review?.note ?? null,
    }))
    .sort((a, b) => kindRank(a.kind) - kindRank(b.kind) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function groupByKind(queue) {
  const groups = new Map();
  for (const item of queue ?? []) {
    if (!groups.has(item.kind)) groups.set(item.kind, []);
    groups.get(item.kind).push(item);
  }
  return [...groups]
    .sort((a, b) => kindRank(a[0]) - kindRank(b[0]))
    .map(([kind, items]) => ({ kind, count: items.length, items }));
}

// Every flag in use, with how many records carry it: the filter list, built
// from what is actually there rather than from a vocabulary written down.
export function flagCounts(queue) {
  const counts = new Map();
  for (const item of queue ?? []) for (const flag of item.flags) counts.set(flag, (counts.get(flag) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([flag, count]) => ({ flag, count }));
}

export function filterQueue(queue, { kind = null, flag = null, text = '' } = {}) {
  const needle = String(text ?? '').trim().toLowerCase();
  return (queue ?? []).filter((item) => {
    if (kind && item.kind !== kind) return false;
    if (flag && !item.flags.includes(flag)) return false;
    if (needle && !`${item.id} ${item.label}`.toLowerCase().includes(needle)) return false;
    return true;
  });
}

// How much is left, by kind and in total. `reviewed` counts what a person
// has already signed, so the page can say what the work has moved. `total`
// is given when the caller holds only the drafts — the dashboard reads the
// digests, not the whole of data/ — and is the number of reviewable records
// there are, presences excluded.
export function progressOf(records, { total = null } = {}) {
  const all = (records ?? []).filter((r) => r?.kind !== 'presence');
  const remaining = all.filter(isDraft);
  const byKind = groupByKind(buildQueue(remaining)).map((g) => ({ kind: g.kind, count: g.count }));
  const size = total ?? all.length;
  return { total: size, remaining: remaining.length, reviewed: size - remaining.length, byKind };
}
