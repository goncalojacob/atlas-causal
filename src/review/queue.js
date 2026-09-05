// The pure half of the review dashboard: which records are waiting for a
// person, what is wrong with each, and how the queue narrows. No DOM, no
// fetch — editor.js and main.js are the other halves.
//
// The exception in CLAUDE.md is the reason this file exists. The 20th- and
// 21st-century records under data/ were drafted by the assistant; every one
// of them is unreviewed until a person reads it, edits what is wrong and
// signs it. The queue is that list, and the project is done with the
// exception when the queue is empty.
//
// What puts a record in the list is `review.status: draft` and nothing else.
// It was an author's name matched against a literal string until H5b, which
// meant that every record a contribution or a later import created was
// invisible to this page from the day it merged, and that renaming the
// assistant would have emptied the queue without a record being read (health
// review A, finding 8). Anything that says it has not been read is in the
// list, whoever wrote it.

import { citedSources } from '../validate/rules.js';
import { citationsOf, unverified } from './citations.js';
import { CONTRIBUTED_KINDS } from '../kinds.js';
import { isDraft } from '../origin.js';

// What the assistant's drafts were signed with before `review.status`
// existed. Sign still takes it off `authors` — the marker is attribution and
// an unreviewed draft that a person has corrected is that person's record —
// but nothing decides *whether* a record is unreviewed by reading it any
// more: `review.status` does (health review A, finding 8).
export const DRAFT_AUTHOR = 'Claude (assistant draft, unreviewed)';

// Re-exported because the queue is where the rest of the project asks the
// question, and the answer now lives in the leaf module beside the writer
// vocabulary.
export { isDraft };

// The order the queue is grouped in: the things an argument rests on first,
// then the arguments, then the walks through them. It is the registry's list
// of the kinds a person writes, which is the same order the contribution
// form offers them in (kinds.js).
export const KIND_ORDER = CONTRIBUTED_KINDS;

// A source with neither an ISBN nor a DOI cannot be looked up mechanically,
// which is exactly what a reviewer wants to know before reading it.
export const NO_IDENTIFIER = 'no-identifier';

// The queue is built in the browser, which has the index and not the record
// files: `data/index/review-<hash>.json` carries one of these per draft.
// Exactly the fields the list and its filters read — everything else waits
// until a record is opened, and is then fetched whole.
// `cites` and `entry` are the two keys here that are not copied off the
// record: the first is the ids of the sources the record rests on, written
// out because a digest carries no prose and so has no dispute block to read
// them out of, and the second says whether the full entry has been written,
// for the same reason — the entry is the longest prose there is.
// `origin` and `retraction` ride here beside `review`: the first is what the
// queue and the dashboard filter on once "unreviewed" stops being a name in
// `authors`, and the second is why a tombstone in the list is one — a digest
// that carried neither would send the dashboard back to the record files for
// the two questions it asks most.
export const DIGEST_KEYS = Object.freeze(['kind', 'id', 'status', 'authors', 'review', 'origin', 'retraction', 'title', 'names', 'from', 'to', 'type', 'isbn', 'doi', 'cites', 'entry']);

// True of a record whose full entry has been written, and of the digest that
// stands for one: on a record it is the prose itself, on a digest the `entry`
// flag, because a digest carries no prose. The same question, either way.
export function hasBody(record) {
  if (record?.entry === true) return true;
  return typeof record?.body === 'string' && record.body.trim() !== '';
}

export function digestOf(record) {
  const digest = {};
  for (const key of DIGEST_KEYS) if (Object.hasOwn(record ?? {}, key)) digest[key] = record[key];
  const cites = citedSources(record);
  if (cites.length) digest.cites = cites;
  // Whether the full entry has been written, never the entry itself.
  if (hasBody(record)) digest.entry = true;
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
      // Not a flag: a flag is a thing to look at, and this is a count of
      // what is left to do on a record already open.
      unverified: unverified(record).length,
      citations: citationsOf(record).length,
      // Not a flag either: whether the long form exists is a fact about how
      // much of the record has been written, not a thing to go and check.
      body: hasBody(record),
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
