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
import { isDraft, originTool } from '../origin.js';
import { claimOf } from './claim.js';

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
// `created`, `revised` and `degree` are the three the sort keys read: how
// long a record has been waiting, and how much of the atlas hangs on it. The
// first two are copied off the record; `degree` is not on any record and is
// counted by the build (degreesOf, below).
// `of`, `category`, `person` and `office` are the two new kinds' own ends,
// which the list reads for the same reason it reads an edge's `from` and
// `to`: a row that said only "tenure soares-prime-minister-1976" would send
// the reviewer to the record files to find out whose turn it was. `parent` is
// here for the event field M30a-3 adds, so the digest does not have to be
// changed again in the run that writes it (amendment A18).
export const DIGEST_KEYS = Object.freeze(['kind', 'id', 'status', 'authors', 'created', 'revised', 'review', 'origin', 'retraction', 'title', 'names', 'from', 'to', 'type', 'of', 'category', 'person', 'office', 'parent', 'isbn', 'doi', 'cites', 'entry', 'degree']);

// True of a record whose full entry has been written, and of the digest that
// stands for one: on a record it is the prose itself, on a digest the `entry`
// flag, because a digest carries no prose. The same question, either way.
export function hasBody(record) {
  if (record?.entry === true) return true;
  return typeof record?.body === 'string' && record.body.trim() !== '';
}

export function digestOf(record, { degree = 0 } = {}) {
  const digest = {};
  for (const key of DIGEST_KEYS) if (Object.hasOwn(record ?? {}, key)) digest[key] = record[key];
  const cites = citedSources(record);
  if (cites.length) digest.cites = cites;
  // Whether the full entry has been written, never the entry itself.
  if (hasBody(record)) digest.entry = true;
  // Counted against the whole atlas by whoever builds the digest, because a
  // record cannot see how much hangs on it. Zero is left out: it is the
  // common case and the absent key reads the same.
  if (degree) digest.degree = degree;
  return digest;
}

// How much of the atlas already hangs on each record: the edges that touch an
// event, the events that name an actor or happen at a place, the narratives
// that walk a link, the records that cite a source. `Map<"kind:id", n>`, one
// pass over the topology.
//
// It is the reference picker's own measure (src/contribute/picker.js), asked
// here of every draft rather than of the eight rows of a typeahead, and it is
// the queue's most useful order: an event forty edges hang on is a worse
// place for an unread claim to sit than one that nothing points at.
export function degreesOf(topology = {}) {
  const degrees = new Map();
  const bump = (kind, id, by = 1) => {
    if (typeof id !== 'string' || id === '' || !by) return;
    degrees.set(`${kind}:${id}`, (degrees.get(`${kind}:${id}`) ?? 0) + by);
  };
  const live = (r) => !r?.status || r.status === 'active';
  for (const edge of topology.edges ?? []) {
    if (!live(edge)) continue;
    bump('event', edge.from);
    bump('event', edge.to);
  }
  for (const event of topology.events ?? []) {
    if (!live(event)) continue;
    bump('place', event.place);
    for (const a of event.actors ?? []) bump('actor', a?.actor);
  }
  for (const relation of topology.relations ?? []) {
    if (!live(relation)) continue;
    bump('actor', relation.from);
    bump('actor', relation.to);
  }
  for (const presence of topology.presences ?? []) {
    if (!live(presence)) continue;
    bump('actor', presence.actor);
  }
  // A step points at an event or at the link between two, and the step says
  // which only by which list the id is in; either way the narrative is one
  // more thing that would have to be rewritten.
  const edgeIds = new Set((topology.edges ?? []).map((e) => e?.id));
  for (const narrative of topology.narratives ?? []) {
    if (!live(narrative)) continue;
    for (const step of narrative.steps ?? []) bump(edgeIds.has(step?.ref) ? 'edge' : 'event', step?.ref);
  }
  for (const source of topology.sources ?? []) {
    bump('source', source.id, source.citationCount ?? (source.citations ?? []).length);
  }
  // A narrative's own degree is what it walks: nothing points at a narrative,
  // and a walk of forty steps is a bigger thing to read than one of three.
  for (const narrative of topology.narratives ?? []) {
    if (live(narrative)) bump('narrative', narrative.id, (narrative.steps ?? []).length);
  }
  return degrees;
}

// Nobody is waiting on a tombstone. `isDraft` answers "has a person read
// this", which is a different question from "is this in the corpus at all",
// and the queue asks both: a record that has been withdrawn or merged away
// has nothing left for a reviewer to sign, and signing one would put their
// name on a claim the atlas no longer makes. It is the same line the `unread`
// warning draws for the same reason (H9, item 12).
//
// It became visible when M30a-2 re-filed the twelve `led` relations: a
// tombstone keeps the draft marker in `authors` and Retract takes
// `review.status` off, so migration 004 puts `draft` back on read and twelve
// withdrawn records walked into the queue behind their own replacements. That
// was already true of anything a reviewer retracted from the dashboard; there
// were simply none of those yet.
export const inQueue = (record) => isDraft(record) && (!record?.status || record.status === 'active');

export function countDrafts(records) {
  return (records ?? []).filter(inQueue).length;
}

// What the record is called in a list: the display name of the thing, not
// its id, except where the id is the only honest name for it.
export function labelOf(record) {
  if (!record) return '';
  if (record.kind === 'edge' || record.kind === 'relation') return `${record.from} — ${record.type} → ${record.to}`;
  // A tenure has no name of its own: it is one person at one office, and
  // those two ids are the only honest label for it.
  if (record.kind === 'tenure') return `${record.person} — ${record.office}`;
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
    .filter(inQueue)
    .map((record) => ({
      kind: record.kind,
      id: record.id,
      label: labelOf(record),
      status: record.status,
      flags: flagsOf(record, byId),
      note: record.review?.note ?? null,
      // The three the sort keys read. `tool` is null where a person wrote the
      // record, which is a filter of its own and not a missing value.
      degree: Number(record.degree ?? 0),
      revised: record.revised ?? record.created ?? null,
      tool: originTool(record),
      claim: claimOf(record),
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

// `tool` is `origin.tool` — which writer made the record — and the string
// `'hand'` for the records no writer made. It is the other half of the queue
// being defined by `review.status`: once every unread record is in the list,
// whoever wrote it, "the import's rows" and "what people sent in" are two
// piles a reviewer wants to work through separately (health review A,
// finding 8).
export const BY_HAND = 'hand';

export function filterQueue(queue, { kind = null, flag = null, tool = null, text = '' } = {}) {
  const needle = String(text ?? '').trim().toLowerCase();
  return (queue ?? []).filter((item) => {
    if (kind && item.kind !== kind) return false;
    if (flag && !item.flags.includes(flag)) return false;
    if (tool && (item.tool ?? BY_HAND) !== tool) return false;
    if (needle && !`${item.id} ${item.label}`.toLowerCase().includes(needle)) return false;
    return true;
  });
}

// Which writer wrote how much of the queue: the filter list, built from what
// is there rather than from ORIGIN_TOOLS, so a writer with nothing waiting
// has no chip.
export function toolCounts(queue) {
  const counts = new Map();
  for (const item of queue ?? []) {
    const tool = item.tool ?? BY_HAND;
    counts.set(tool, (counts.get(tool) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([tool, count]) => ({ tool, count }));
}

// The four orders the list can be read in, and what each is for.
//
//   flags   what the validator and the drafter asked to have looked at,
//           most first: the queue's own definition of "worst".
//   degree  how much of the atlas hangs on the record, most first: an
//           unread claim under forty edges is worse than one under none.
//   age     longest unread first, by `revised`: what the queue has been
//           carrying since before anybody was counting.
//   kind    the registry's order, then id — what the queue always was, and
//           the order a reviewer working through one kind wants.
export const SORT_KEYS = Object.freeze(['flags', 'degree', 'age', 'kind']);
export const SORT_LABELS = Object.freeze({
  flags: 'flags', degree: 'degree', age: 'oldest', kind: 'kind',
});

const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// Never in place: the list is held once and read in four orders, and sorting
// the held one would reorder what another view is drawing from.
export function sortQueue(queue, key = 'kind') {
  const rows = [...(queue ?? [])];
  if (key === 'flags') {
    return rows.sort((a, b) => b.flags.length - a.flags.length || b.degree - a.degree || byId(a, b));
  }
  if (key === 'degree') {
    return rows.sort((a, b) => b.degree - a.degree || b.flags.length - a.flags.length || byId(a, b));
  }
  if (key === 'age') {
    // A record with no date sorts oldest: it has been waiting since before
    // the field existed, which is exactly as long as it looks.
    const on = (item) => item.revised ?? '';
    return rows.sort((a, b) => (on(a) < on(b) ? -1 : on(a) > on(b) ? 1 : 0) || byId(a, b));
  }
  return rows.sort((a, b) => kindRank(a.kind) - kindRank(b.kind) || byId(a, b));
}

// How much is left, by kind and in total. `reviewed` counts what a person
// has already signed, so the page can say what the work has moved. `total`
// is given when the caller holds only the drafts — the dashboard reads the
// digests, not the whole of data/ — and is the number of reviewable records
// there are, presences excluded.
export function progressOf(records, { total = null } = {}) {
  const all = (records ?? []).filter((r) => r?.kind !== 'presence');
  const remaining = all.filter(inQueue);
  const byKind = groupByKind(buildQueue(remaining)).map((g) => ({ kind: g.kind, count: g.count }));
  const size = total ?? all.length;
  return { total: size, remaining: remaining.length, reviewed: size - remaining.length, byKind };
}
