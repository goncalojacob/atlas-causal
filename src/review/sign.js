// Signing, retracting and the bundle a review becomes when there is no
// server to write it. Pure: main.js decides when, this decides what.
//
// Signing is the only thing in the project that writes `authors` outside the
// Action. That is deliberate and narrow: the reviewer is the maintainer at
// their own machine, and the whole point of the dashboard is to replace the
// draft marker with a person. Everything that arrives through the
// correction-bundle path keeps the Action's attribution instead.

import { DRAFT_AUTHOR } from './queue.js';
import { REVIEW_STATUS } from '../origin.js';

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function normalizeReviewer({ name, github } = {}) {
  const handle = String(github ?? '').trim().replace(/^@/, '');
  return {
    name: String(name ?? '').trim(),
    github: /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/.test(handle) ? handle : null,
  };
}

// Takes what was typed, not what normalizeReviewer made of it: a handle that
// was dropped because it is not a login has to be told apart from one that
// was never given.
export function reviewerProblems({ name, github } = {}) {
  const problems = [];
  const who = normalizeReviewer({ name, github });
  if (!who.name) problems.push('a reviewer signs with a name');
  if (String(github ?? '').trim() && who.github === null) problems.push('that is not a GitHub login');
  return problems;
}

// What survives a review, and what it clears. `flags` and `note` are the
// reviewer's to clear: they are the list of things somebody was asked to look
// at, and looking at them is what signing means. `citations` is not — it is
// the reviewer's own audit trail, made one book at a time and often on
// another day, and Sign used to delete it a moment after they ticked it
// (health review A, finding 7). It is carried through both acts below, and
// through nothing else in the block.
function reviewAfter(record, next) {
  const citations = record?.review?.citations;
  const kept = isObject(citations) && Object.keys(citations).length ? { citations } : {};
  const review = { ...next, ...kept };
  return Object.keys(review).length ? review : undefined;
}

// Where a key belongs in the envelope, so that a field written here lands
// where the schemas declare it rather than at the end of the file. The same
// order `src/validate/migrate.js` inserts by, and the same reason: a diff
// should be the field and not a reshuffle.
const ENVELOPE_ORDER = Object.freeze([
  'schema', 'id', 'kind', 'status', 'supersededBy', 'aliases', 'authors',
  'license', 'created', 'revised', 'origin', 'retraction', 'review',
]);

function inEnvelopeOrder(record) {
  const rank = (key) => {
    const at = ENVELOPE_ORDER.indexOf(key);
    return at < 0 ? Infinity : at;
  };
  return Object.fromEntries(Object.entries(record)
    .filter(([, value]) => value !== undefined)
    .sort((a, b) => rank(a[0]) - rank(b[0])));
}

// The draft marker is replaced, not appended to: an unreviewed draft that a
// person has read and corrected is that person's record. If the reviewer is
// already an author the list is left alone.
//
// `review.status` becomes `reviewed` and the signature goes in `signedBy`
// (rule 28). The two are not the same act as attribution: `authors` says who
// wrote the record and is what the licence asks for, `signedBy` says who read
// it and on what day, and a record can be read by more than one person.
export function signRecord(record, reviewer, { today } = {}) {
  const who = normalizeReviewer(reviewer);
  const authors = (record.authors ?? []).filter((a) => a?.name !== DRAFT_AUTHOR);
  const already = authors.some((a) => (who.github && a?.github === who.github) || a?.name === who.name);
  const on = today ?? record.revised;
  const before = Array.isArray(record.review?.signedBy) ? record.review.signedBy : [];
  const signedBy = before.some((s) => (who.github && s?.github === who.github) || s?.name === who.name)
    ? before
    : [...before, { ...who, on }];
  return inEnvelopeOrder({
    ...record,
    authors: already ? authors : [...authors, who],
    revised: on,
    review: reviewAfter(record, { status: REVIEW_STATUS.reviewed, signedBy }),
  });
}

// A retraction is an argument — the case for withdrawing a record — so it is
// written by a person like any other, and it goes in a field of its own that
// nothing deletes. `review.note` could not promise that: signing a tombstone
// took the only reason in the data for its being one (health review B,
// finding 16), and rule 27 now holds the two together.
export function retractRecord(record, { today, reason } = {}) {
  const text = String(reason ?? '').trim();
  if (!text) throw new Error('a retraction says why: nothing was written');
  const on = today ?? record.revised;
  return inEnvelopeOrder({
    ...record,
    status: 'retracted',
    revised: on,
    retraction: record.retraction ?? { on, reason: text },
    review: reviewAfter(record, {}),
  });
}

// What the cascade says on the records a retraction carries with it. They are
// not withdrawn on their own merits — an active edge to a retracted event is
// rule 11 and an active narrative walking one is the same — so the reason is
// that fact and not a second argument somebody did not make.
export function carriedReason(id) {
  return `Retracted with ${id}: an active record cannot stand on a retracted one (rule 11), so this one follows it.`;
}

// Everything that would become invalid if this record were retracted, split
// into what a retraction can carry with it and what it cannot.
//
// An event's edges and a narrative's steps follow mechanically: an active
// edge to a retracted event is rule 11, and so is an active narrative walking
// one. An actor, a place or a source is different — the records that point at
// it would have to be rewritten, not retracted — so those come back as
// blockers and the dashboard says so instead of cascading.
//
// `topology.citers` is the one thing this reads that the spine does not
// carry: a source's citer rows, pre-fetched. A dashboard that has already
// fetched `citers-<hash>/<id>.json` for the source in hand passes it here as
// `{ <source id>: rows }` or a Map, and the plan answers off that file alone
// — it reads `kind` and `id` and nothing else, which is what lets the rows
// leave the sources index every page loads whole (h3a-brief, A7). Without it
// the rows come from `topology.sources`, as they do today.
export function retractionPlan(record, topology = {}) {
  const retract = [];
  const blockers = [];
  const seen = new Set([record.id]);
  const add = (kind, id) => {
    if (seen.has(id)) return;
    seen.add(id);
    retract.push({ kind, id });
  };

  const active = (list) => (list ?? []).filter((r) => r.status === 'active');
  const walkers = (id) => active(topology.narratives).filter((n) => (n.steps ?? []).some((s) => s?.ref === id));
  // The one citer file, if a caller has it; otherwise the whole index.
  const citerRows = (id, { citers, sources }) => {
    if (citers) return (citers instanceof Map ? citers.get(id) : citers[id]) ?? [];
    return active(sources).find((s) => s.id === id)?.citations ?? [];
  };

  if (record.kind === 'event') {
    for (const edge of active(topology.edges)) {
      if (edge.from === record.id || edge.to === record.id) {
        add('edge', edge.id);
        for (const n of walkers(edge.id)) add('narrative', n.id);
      }
    }
    for (const n of walkers(record.id)) add('narrative', n.id);
  } else if (record.kind === 'edge') {
    for (const n of walkers(record.id)) add('narrative', n.id);
  } else if (record.kind === 'actor') {
    for (const e of active(topology.events)) {
      if ((e.actors ?? []).some((a) => a?.actor === record.id)) blockers.push({ kind: 'event', id: e.id, why: 'names this actor' });
    }
    for (const r of active(topology.relations)) {
      if (r.from === record.id || r.to === record.id) blockers.push({ kind: 'relation', id: r.id, why: 'stands on this actor' });
    }
    for (const p of active(topology.presences)) {
      if (p.actor === record.id || p.dependencyOf === record.id) blockers.push({ kind: 'presence', id: p.id, why: 'is this actor\'s territory' });
    }
  } else if (record.kind === 'place') {
    for (const e of active(topology.events)) {
      if (e.place === record.id) blockers.push({ kind: 'event', id: e.id, why: 'happens here' });
    }
  } else if (record.kind === 'source') {
    for (const c of citerRows(record.id, topology)) blockers.push({ kind: c.kind, id: c.id, why: 'cites this source' });
  }

  retract.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  blockers.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { retract, blockers };
}

export function bundleOf(records) {
  return { schema: 1, records: records.filter(isObject) };
}
