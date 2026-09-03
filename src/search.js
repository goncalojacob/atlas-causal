// Finding a record by name. Pure and free of the DOM — entries in, ranked
// results out — so node --test can hold it to its promises; search-box.js is
// the input, the list and the keys.
//
// It searches what the topology already carries: every active event's title,
// every active actor's names — the imported polities included, so "Angola"
// finds the colony's record and the events it appears in at once — and every
// place's names, so "Lisboa" finds Lisbon and everything that happened there
// without knowing a single title. Nothing is
// fetched and nothing is precomputed at index time: a few hundred titles is a
// scan, and a search index in data/index/ would be five megabytes of the one
// thing the atlas deliberately keeps out of it (ARCHITECTURE.md, "Scale").

import { extent } from './util/dates.js';

// Diacritic-insensitive and case-insensitive: "Amilcar" finds "Amílcar", and
// a reader who cannot type ç is not locked out of their own history.
export function fold(text) {
  return String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

// 0 — the name starts with what was typed; 1 — a word inside it does;
// 2 — it is in there somewhere. Anything else is not a match. Prefixes come
// first because that is what a reader typing three letters means.
export function rank(term, query) {
  const at = term.indexOf(query);
  if (at < 0) return null;
  if (at === 0) return 0;
  return /[\s(«"'\-–—/]/.test(term[at - 1]) ? 1 : 2;
}

// One entry per record: everything it can be found by, folded once.
export function buildSearchIndex({ events = [], actors = [], places = [] } = {}) {
  const entries = [];
  for (const event of events) {
    if (event.status && event.status !== 'active') continue;
    entries.push({
      kind: 'event',
      id: event.id,
      label: event.title,
      detail: null,
      when: event.when,
      weight: event.weight ?? 0,
      terms: [fold(event.title)],
    });
  }
  for (const actor of actors) {
    if (actor.status && actor.status !== 'active') continue;
    const names = actor.names?.length ? actor.names : [actor.name];
    entries.push({
      kind: 'actor',
      id: actor.id,
      label: names[0],
      detail: actor.actorType ?? null,
      when: actor.when,
      // The variants are what makes "PIDE" and "DGS" one record.
      variants: names.slice(1),
      weight: 0,
      terms: names.map(fold),
    });
  }
  for (const place of places) {
    if (place.status && place.status !== 'active') continue;
    const names = place.names?.length ? place.names : [place.name];
    entries.push({
      kind: 'place',
      id: place.id,
      label: names[0],
      detail: null,
      when: null,
      variants: names.slice(1),
      weight: 0,
      terms: names.map(fold),
    });
  }
  return entries;
}

const startOf = (when) => {
  try {
    return extent(when).min;
  } catch {
    return 0;
  }
};

// query in, groups out. Groups are ordered by their own best match, not by a
// fixed kind order: typing "sal" means Salazar the person, whose name begins
// that way, before the events that merely mention him.
export function search(entries, query, { limit = 8 } = {}) {
  const folded = fold(query);
  if (folded.length === 0) return { groups: [], total: 0, query: '' };
  const hits = [];
  for (const entry of entries) {
    let best = null;
    for (const term of entry.terms) {
      const r = rank(term, folded);
      if (r !== null && (best === null || r < best.rank || (r === best.rank && term.length < best.length))) {
        best = { rank: r, length: term.length };
      }
    }
    if (best) hits.push({ ...entry, rank: best.rank, matched: best.length });
  }
  hits.sort((a, b) => a.rank - b.rank
    || a.matched - b.matched
    || b.weight - a.weight
    || startOf(a.when) - startOf(b.when)
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const byKind = new Map();
  for (const hit of hits) {
    if (!byKind.has(hit.kind)) byKind.set(hit.kind, []);
    byKind.get(hit.kind).push(hit);
  }
  const groups = [...byKind.entries()]
    .map(([kind, items]) => ({ kind, items }))
    .sort((a, b) => a.items[0].rank - b.items[0].rank
      || a.items[0].matched - b.items[0].matched
      || (a.kind < b.kind ? -1 : 1));

  // The limit is over the whole result, taken group by group in that order,
  // so a reader always sees the best match first however the groups fall.
  const out = [];
  let left = limit;
  for (const group of groups) {
    if (left <= 0) break;
    const items = group.items.slice(0, left);
    left -= items.length;
    out.push({ kind: group.kind, items });
  }
  return { groups: out, total: hits.length, query: folded };
}

// The flat order the arrow keys walk, which is the order the groups are
// drawn in.
export function flatten(result) {
  return result.groups.flatMap((g) => g.items);
}
