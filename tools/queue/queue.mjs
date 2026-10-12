// The queue, the log, and every rule about them that is not a shape.
//
// M90: the judgement moved to a planner that writes a queue once a day, and
// the writing became a writer that applies it. A writer on a smaller model is
// safe only if it has nothing to decide, so every rule that can be code is
// code — and this is where the ones that are not a JSON Schema keyword live:
// which writer takes which lane, that an item earns its place by its own edge,
// that a queue id is unique, which refusal a candidate edge earns. Pure: no
// filesystem, no network, no clock. `tools/queue/apply.mjs` applies it,
// `tools/queue/state.mjs` counts it and `tools/validate.mjs` checks the two
// files on disk through `checkQueue` and `checkQueueLog`.

import { tidy, verdictFor } from '../import/chronology.mjs';
import { astronomicalBounds } from '../../src/util/dates.js';
import { parentsOf } from '../../src/parts.js';

export const QUEUE_KIND = 'import-queue';
export const LOG_KIND = 'import-queue-log';
export const QUEUE_SCHEMA = 'import/queue.json';
export const LOG_SCHEMA = 'import/queue-log.json';

// A10, A11(b): the partition, written down once. Writer A takes the three
// lanes that trail or are paused behind them, writer B takes the Americas, and
// a writer never imports what the other branch holds. A lane nobody has been
// given is not a lane a queue may name: it would be queued for a writer that
// does not fire.
export const WRITERS = Object.freeze(['A', 'B']);
export const WRITER_LANES = Object.freeze({
  A: Object.freeze(['africa', 'asia', 'europe']),
  B: Object.freeze(['americas']),
});

export function writerFor(lane) {
  for (const writer of WRITERS) if (WRITER_LANES[writer].includes(lane)) return writer;
  return null;
}

export const ITEM_ID = /^([0-9]{4}-[0-9]{2}-[0-9]{2})-([a-z0-9]+(?:-[a-z0-9]+)*)-([0-9]{3})$/;
export const RECORD_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const QID = /^Q[1-9][0-9]*$/;

export const EDGE_TYPES = Object.freeze(['caused', 'enabled', 'reacted-to', 'precondition-of', 'inspired']);
export const STATUSES = Object.freeze(['written', 'partial', 'refused', 'skipped']);

// The closed list of refusals, which is the whole of what a writer may say
// about an item it would not write. Five are the brief's own. The other four
// are rules that are already code elsewhere in this repository, and a writer
// that wrote the record anyway would hand the fire a hard stop from
// `validate --index` and a person to read it — which is strictly worse than a
// line in the log for the planner:
//
//   `confidence`    rules 9 and 22: a `consensus` edge on Wikipedia alone
//   `parent`        rule 24 and A6's span: an umbrella that will not hold
//   `arrow-of-time` rule 4: a cause that starts after its effect
//   `already-held`  rule 2, and CLAUDE.md's "an import never rewrites a
//                   record whose review.status is reviewed": the edge is here
//
// Rule 5's cycle is **not** here and is left to the validator: a new record's
// one new edge cannot close a loop, and an item that changes a record cannot
// close one without the planner having asked for it in as many words.
export const REFUSALS = Object.freeze([
  'quote-not-found', 'chronology', 'parent-to-child', 'type', 'endpoint-missing',
  'confidence', 'parent', 'arrow-of-time', 'already-held',
]);

// Wikipedia is not scholarship (rule 22). The list is rules.js's own, repeated
// here rather than imported, because rules.js is the browser's module and this
// is a tool; `tests/m90-queue.test.mjs` holds the two together.
export const WIKIPEDIA_SOURCES = Object.freeze(['wikipedia-en', 'wikipedia-pt']);

export const WIKIPEDIA_SOURCE = 'wikipedia-en';

// --- what an item is -------------------------------------------------------

// The id a queue item names: its own qid where it imports one, its own record
// where it changes one. An edge end that is this string is the item itself.
export const subjectOf = (item) => item?.qid ?? item?.existing ?? null;

export const isImport = (item) => typeof item?.qid === 'string';

// The locator every edge this tool writes carries, in M72's form: the article
// and the revision, and nothing else. The sentence is in the explanation,
// where a reader meets it.
export const locatorFor = ({ article, revision }) => `"${article}", revision ${revision}`;

// --- the quote -------------------------------------------------------------

// Both sides of the comparison through the same fold. `tidy()` of
// tools/import/chronology.mjs already cuts an extract's `=== headings ===`,
// normalises to NFC, folds the six dashes onto the hyphen and the curly quotes
// onto the straight ones, and collapses every run of whitespace — which is
// every difference between a sentence read in a browser and the same sentence
// in the API's plain text, except one: a soft hyphen is invisible on the page
// and a character in the text, so it goes before the fold rather than through
// it. The case is kept: a quote is verbatim or it is not.
export function normaliseQuote(text) {
  return tidy(String(text ?? '').replace(/­/g, ''));
}

export function quoteFound(quote, text) {
  const wanted = normaliseQuote(quote);
  if (wanted === '') return false;
  return normaliseQuote(text).includes(wanted);
}

// --- the parent rule -------------------------------------------------------

// A14, rules card 11: no edge from a record to one of its own umbrellas, in
// either direction, until the owner decides C8. Read through the whole chain
// of `part of` and not only the one hop: a battle inside a campaign inside a
// war is inside the war, and an edge from the war to the battle is the same
// objection one level further down.
//
// `parentsFor` is a function from a record id to the ids it is part of, which
// lets the item's own parents — the ones the queue is about to write, which
// are on no record yet — stand beside the corpus's.
export function ancestorsOf(id, parentsFor, limit = 64) {
  const seen = new Set();
  const stack = [...(parentsFor(id) ?? [])];
  while (stack.length && seen.size < limit) {
    const next = stack.pop();
    if (typeof next !== 'string' || seen.has(next)) continue;
    seen.add(next);
    stack.push(...(parentsFor(next) ?? []));
  }
  return seen;
}

export function parentToChild(from, to, parentsFor) {
  if (from === to) return true;
  return ancestorsOf(from, parentsFor).has(to) || ancestorsOf(to, parentsFor).has(from);
}

// --- a candidate edge ------------------------------------------------------

// The verdict on one queued edge, given what the atlas holds and the text of
// the revision it names. Everything that needs no request is asked first, so a
// fire does not spend a fetch on an edge it could never write — the type, the
// two ends, and the confidence the citations can carry. Then the quote, which
// is the one question only the revision can answer, and then A15(5) and A14
// over the sentence the revision gave back.
//
// `text` is null where the fetch has not happened yet, which is how a caller
// asks only the questions that cost nothing.
//
// A15(5) is asked through `verdictFor` of tools/import/chronology.mjs, which
// is both halves of rules card 10 and not only the opener: the refusal class,
// and the sentence that states a cause and names a **third** event the atlas
// holds as it, which belongs to that event or to nobody. `candidates` is the
// active events with their names and spans; with none handed in, only the
// first half is asked.
export function verdictForEdge(edge, {
  subject = null,
  activeEvents = new Set(),
  parentsFor = () => [],
  sourceIds = new Set(),
  candidates = [],
  when = null,
  text = null,
} = {}) {
  const refuse = (reason, detail) => ({ ok: false, reason, detail });
  if (!EDGE_TYPES.includes(edge?.type)) {
    return refuse('type', `"${edge?.type}" is not one of the five edge types`);
  }
  const ends = [edge.from, edge.to];
  if (!ends.includes(subject)) {
    return refuse('endpoint-missing', `neither end is the item itself (${subject}): an item earns its place by its own edge`);
  }
  for (const end of ends) {
    if (end === subject) continue;
    if (!activeEvents.has(end)) {
      return refuse('endpoint-missing', `"${end}" is not an active event of this atlas`);
    }
  }
  if (edge.confidence === 'consensus') {
    const cited = [WIKIPEDIA_SOURCE, ...(edge.sources ?? []).map((s) => s?.source)].filter(Boolean);
    const distinct = [...new Set(cited)];
    const scholarly = distinct.filter((id) => !WIKIPEDIA_SOURCES.includes(id));
    if (scholarly.length === 0) {
      return refuse('confidence', 'consensus cannot rest on Wikipedia alone (rule 22): name the scholarship the article cites, or queue the edge probable');
    }
    if (distinct.length < 2) {
      return refuse('confidence', 'consensus needs at least two cited sources by different authors (rule 9)');
    }
    const unknown = scholarly.filter((id) => !sourceIds.has(id));
    if (unknown.length) {
      return refuse('confidence', `"${unknown[0]}" is not a source record this atlas holds`);
    }
  }
  if (text === null) return { ok: true, reason: null, detail: null };
  if (!quoteFound(edge.quote, text)) {
    return refuse('quote-not-found', `the quote is not in revision ${edge.revision} of "${edge.article}"`);
  }
  const said = verdictFor(edge.quote, { from: edge.from, to: edge.to, candidates });
  if (!said.write) {
    const named = said.reattribute.map((r) => r.id).join(', ');
    return refuse('chronology', named ? `${said.why}: ${named}` : `${said.why} (A15(5))`);
  }
  if (parentToChild(edge.from, edge.to, parentsFor)) {
    return refuse('parent-to-child', `"${edge.from}" and "${edge.to}" are an umbrella and something inside it (A14)`);
  }
  return { ok: true, reason: null, detail: null };
}

// The two questions that can only be asked once the record exists, because
// both need its id and its dates: is this edge already here, and does it run
// forwards. `whenOf` is a function from a record id to its `when`, and `ids`
// is every record id the atlas holds.
//
// The arrow is rule 4's own comparison, in its coarse half — a `from` whose
// earliest start is after the `to`'s latest is the error rule 4 raises — plus
// the day where both ends give one in the same single year. Rule 4's calendar
// clause is not repeated: without it this is the stricter of the two, and
// being stricter here refuses an edge and never writes a wrong one.
export function writeVerdictFor(edge, { from, to, whenOf = () => null, ids = new Set() } = {}) {
  const refuse = (reason, detail) => ({ ok: false, reason, detail });
  const id = `${from}--${to}--${edge.type}`;
  if (ids.has(id)) {
    return refuse('already-held', `"${id}" is already a record: a writer never rewrites one`);
  }
  const start = (when) => {
    if (!when || typeof when !== 'object') return null;
    try {
      return astronomicalBounds(when.start);
    } catch {
      return null;
    }
  };
  const a = whenOf(from);
  const b = whenOf(to);
  const one = start(a);
  const two = start(b);
  if (one && two) {
    if (one.min > two.max) {
      return refuse('arrow-of-time', `"${from}" cannot start after "${to}" (rule 4)`);
    }
    const sameYear = one.min === one.max && two.min === two.max && one.min === two.min;
    if (sameYear && a.date && b.date && a.date > b.date) {
      return refuse('arrow-of-time', `"${from}" (${a.date}) is dated after "${to}" (${b.date}) in the same year (rule 4)`);
    }
  }
  return { ok: true, reason: null, detail: null };
}

// --- which items a writer takes --------------------------------------------

// The ids and qids a log holds, which is what says an item is done however it
// finished. Several logs, because the planner and each writer read both
// branches'.
export function appliedIds(logs = []) {
  const ids = new Set();
  for (const log of logs) {
    for (const entry of log?.entries ?? []) if (typeof entry?.id === 'string') ids.add(entry.id);
  }
  return ids;
}

// What this fire takes: its own writer's items, in the queue's own order,
// skipping what a log has already answered and what the other branch holds.
// `held` is the list the routine extracts from the other branch before the run
// — record ids and Wikidata item ids in one flat list, because the two cannot
// be confused with each other.
export function itemsFor(queue, writer, { logs = [], held = [], max = Infinity } = {}) {
  const done = appliedIds(logs);
  const theirs = new Set(held);
  const out = [];
  for (const item of queue?.items ?? []) {
    if (out.length >= max) break;
    if (item?.writer !== writer) continue;
    if (done.has(item.id)) continue;
    const subject = subjectOf(item);
    if (subject && theirs.has(subject)) continue;
    out.push(item);
  }
  return out;
}

// --- the checks a shape cannot make ---------------------------------------

// `regions` is data/regions.json, or null where the dataset has none, in which
// case a lane is not checked against anything — the same silence the rest of
// the validator keeps about a vocabulary that is not there.
export function checkQueue(file, queue, { regions = null } = {}) {
  const problems = [];
  const say = (path, message) => problems.push({ path, message, file });
  const lanes = regions === null ? null : new Set(regions.map((r) => r?.id).filter(Boolean));
  const seen = new Set();
  (queue?.items ?? []).forEach((item, i) => {
    const at = `/items/${i}`;
    if (seen.has(item?.id)) say(`${at}/id`, `"${item.id}" is the id of another item in this queue`);
    seen.add(item?.id);
    const named = ITEM_ID.exec(String(item?.id ?? ''));
    if (named && named[2] !== item?.lane) {
      say(`${at}/id`, `"${item.id}" names the lane "${named[2]}" and the item is for "${item.lane}"`);
    }
    if (lanes && typeof item?.lane === 'string' && !lanes.has(item.lane)) {
      say(`${at}/lane`, `"${item.lane}" is not a lane in data/regions.json`);
    }
    // The partition is not a preference: an item queued for the writer that
    // does not take its lane is an item nothing will ever apply.
    const expected = typeof item?.lane === 'string' ? writerFor(item.lane) : null;
    if (expected === null && typeof item?.lane === 'string' && lanes?.has(item.lane)) {
      say(`${at}/lane`, `no writer takes the lane "${item.lane}" (A10: A takes ${WRITER_LANES.A.join(', ')}, B takes ${WRITER_LANES.B.join(', ')})`);
    } else if (expected !== null && item?.writer !== expected) {
      say(`${at}/writer`, `the lane "${item.lane}" is writer ${expected}'s, not ${item?.writer}'s`);
    }
    const subject = subjectOf(item);
    const both = typeof item?.qid === 'string' && typeof item?.existing === 'string';
    if (both) say(at, 'an item imports an item or changes a record, never both: drop one of qid and existing');
    else if (subject === null) say(at, 'an item names neither a qid to import nor an existing record to change');
    const edges = Array.isArray(item?.edges) ? item.edges : [];
    // Rules card 7, enforced at the queue. An `existing` item has its place
    // already, so a parent on its own is work a writer may do.
    if (edges.length === 0 && isImport(item)) {
      say(`${at}/edges`, 'an item with no edge does not earn its place (rules card 7)');
    }
    if (edges.length === 0 && !isImport(item) && (item?.parents ?? []).length === 0) {
      say(`${at}/edges`, 'an item that neither files a parent nor writes an edge asks for nothing');
    }
    edges.forEach((edge, j) => {
      const here = `${at}/edges/${j}`;
      if (subject !== null && edge?.from !== subject && edge?.to !== subject) {
        say(here, `neither end is the item's own ${isImport(item) ? 'qid' : 'record'} "${subject}"`);
      }
      if (edge?.from === edge?.to) say(`${here}/to`, 'an edge from a record to itself is not an argument');
      // The quote has to be in the explanation: the explanation is what a card
      // shows and a reader who cannot see the sentence cannot weigh the edge
      // (rules card 9). Compared through the same fold the writer verifies by.
      if (typeof edge?.quote === 'string' && typeof edge?.explanation === 'string'
        && !normaliseQuote(edge.explanation).includes(normaliseQuote(edge.quote))) {
        say(`${here}/explanation`, 'the explanation does not carry the quote (rules card 9)');
      }
    });
    const parents = new Set();
    (item?.parents ?? []).forEach((parent, j) => {
      if (parents.has(parent)) say(`${at}/parents/${j}`, `"${parent}" is listed twice`);
      parents.add(parent);
      if (parent === item?.existing) say(`${at}/parents/${j}`, 'a record cannot be part of itself');
    });
  });
  return problems;
}

export function checkQueueLog(file, log) {
  const problems = [];
  const say = (path, message) => problems.push({ path, message, file });
  const seen = new Map();
  (log?.entries ?? []).forEach((entry, i) => {
    const at = `/entries/${i}`;
    if (seen.has(entry?.id)) say(`${at}/id`, `"${entry.id}" was already answered at /entries/${seen.get(entry.id)}`);
    seen.set(entry?.id, i);
    const written = entry?.written ?? {};
    const edges = Array.isArray(written.edges) ? written.edges : [];
    const refusals = Array.isArray(entry?.refusals) ? entry.refusals : [];
    // The four statuses are not labels: each says exactly what reached disk,
    // and a log that disagrees with itself is a log the planner cannot read.
    if (entry?.status === 'written') {
      if (refusals.length) say(`${at}/status`, 'an entry with a refusal is partial or refused, never written');
      if (!written.event && !edges.length) say(`${at}/written`, 'nothing was written, so the status is not written');
    }
    if (entry?.status === 'partial') {
      if (!refusals.length) say(`${at}/status`, 'partial says some of it was refused, and nothing here was');
      if (!written.event && !edges.length) say(`${at}/written`, 'partial says some of it was written, and nothing here was');
    }
    if (entry?.status === 'refused' || entry?.status === 'skipped') {
      if (written.event) say(`${at}/written/event`, `a ${entry.status} item writes no event`);
      if (edges.length) say(`${at}/written/edges`, `a ${entry.status} item writes no edge`);
      if (written.place) say(`${at}/written/place`, `a ${entry.status} item writes no place`);
    }
    // A refusal says why, one way or the other: a code against each edge it
    // would not write, or — where the item never reached its edges, because
    // the import itself wrote nothing — the note.
    if (entry?.status === 'refused' && !refusals.length && !entry?.note) {
      say(`${at}/refusals`, 'a refused item says why: a refusal against an edge, or a note');
    }
  });
  return problems;
}

// --- what a log says, counted ---------------------------------------------

// The queue's state as the planner reads it: how many items are waiting per
// writer, what the logs answered, and the refusal codes' counts. Derived from
// the two files and nothing else, so `state.mjs` prints it and the tests ask
// the same question of a fixture.
export function queueState(queue, logs = []) {
  const done = appliedIds(logs);
  const queued = { A: 0, B: 0 };
  for (const item of queue?.items ?? []) {
    if (done.has(item?.id)) continue;
    if (item?.writer === 'A' || item?.writer === 'B') queued[item.writer] += 1;
  }
  const byWriter = { A: {}, B: {} };
  const refusals = {};
  for (const writer of WRITERS) for (const status of STATUSES) byWriter[writer][status] = 0;
  for (const log of logs) {
    for (const entry of log?.entries ?? []) {
      if (!WRITERS.includes(entry?.writer) || !STATUSES.includes(entry?.status)) continue;
      byWriter[entry.writer][entry.status] += 1;
      for (const refusal of entry.refusals ?? []) {
        if (!REFUSALS.includes(refusal?.reason)) continue;
        refusals[refusal.reason] = (refusals[refusal.reason] ?? 0) + 1;
      }
    }
  }
  return { queued, byWriter, refusals, applied: done.size };
}

// --- the parents of a record, for the rules above --------------------------

// `parentsOf` of src/parts.js is the one place `parent`'s three shapes are
// read, and the one place anything here reads them: a lookup over the records
// a tool has in hand, with the item's own queued parents standing beside them.
// The two are a union and not a choice, because A14 is asked of both — of the
// umbrellas the queue is about to write, which are on no record yet, and of
// the ones an existing record already carries.
export function parentsReader(byId, { subject = null, parents = [] } = {}) {
  return (id) => {
    const record = byId.get(id);
    const own = record ? parentsOf(record) : [];
    if (subject === null || id !== subject) return own;
    return [...new Set([...own, ...parents])];
  };
}

export function emptyQueue() {
  return { schema: 1, kind: QUEUE_KIND, items: [] };
}

export function emptyLog() {
  return { schema: 1, kind: LOG_KIND, entries: [] };
}
