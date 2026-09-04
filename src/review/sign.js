// Signing, retracting and the bundle a review becomes when there is no
// server to write it. Pure: main.js decides when, this decides what.
//
// Signing is the only thing in the project that writes `authors` outside the
// Action. That is deliberate and narrow: the reviewer is the maintainer at
// their own machine, and the whole point of the dashboard is to replace the
// draft marker with a person. Everything that arrives through the
// correction-bundle path keeps the Action's attribution instead.

import { DRAFT_AUTHOR } from './queue.js';

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

// The draft marker is replaced, not appended to: an unreviewed draft that a
// person has read and corrected is that person's record. If the reviewer is
// already an author the list is left alone.
export function signRecord(record, reviewer, { today } = {}) {
  const who = normalizeReviewer(reviewer);
  const authors = (record.authors ?? []).filter((a) => a?.name !== DRAFT_AUTHOR);
  const already = authors.some((a) => (who.github && a?.github === who.github) || a?.name === who.name);
  const signed = {
    ...record,
    authors: already ? authors : [...authors, who],
    revised: today ?? record.revised,
  };
  // Whatever the draft asked to have looked at has now been looked at.
  delete signed.review;
  return signed;
}

export function retractRecord(record, { today } = {}) {
  const out = { ...record, status: 'retracted', revised: today ?? record.revised };
  delete out.review;
  return out;
}

// Everything that would become invalid if this record were retracted, split
// into what a retraction can carry with it and what it cannot.
//
// An event's edges and a narrative's steps follow mechanically: an active
// edge to a retracted event is rule 11, and so is an active narrative walking
// one. An actor, a place or a source is different — the records that point at
// it would have to be rewritten, not retracted — so those come back as
// blockers and the dashboard says so instead of cascading.
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
    for (const s of active(topology.sources)) {
      if (s.id !== record.id) continue;
      for (const c of s.citations ?? []) blockers.push({ kind: c.kind, id: c.id, why: 'cites this source' });
    }
  }

  retract.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  blockers.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { retract, blockers };
}

export function bundleOf(records) {
  return { schema: 1, records: records.filter(isObject) };
}
