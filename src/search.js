// Finding a record by name. Pure and free of the DOM — entries in, ranked
// results out — so node --test can hold it to its promises; search-box.js is
// the input, the list and the keys.
//
// It searches what the topology already carries: every active event's title,
// every active actor's names — the imported polities included, so "Angola"
// finds the colony's record and the events it appears in at once — every
// place's names, so "Lisboa" finds Lisbon and everything that happened there
// without knowing a single title, and every source's title and creators, so
// a reader who knows the book can find what rests on it. Nothing is
// fetched and nothing is precomputed at index time: a few hundred titles is a
// scan, and a search index in data/index/ would be five megabytes of the one
// thing the atlas deliberately keeps out of it (ARCHITECTURE.md, "Scale").

import { extent } from './util/dates.js';
import { articleTitles } from './wikipedia.js';

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

// One entry per record: everything it can be found by, folded once. A record
// the import has given Wikipedia titles is findable by them too — somebody
// who knows a thing by the name the encyclopedia gives it should not be told
// there is nothing by that name — and the label stays the atlas's own.
export function buildSearchIndex({ events = [], actors = [], places = [], sources = [] } = {}) {
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
      terms: [fold(event.title), ...articleTitles(event).map(fold)],
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
      terms: [...names, ...articleTitles(actor)].map(fold),
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
      terms: [...names, ...articleTitles(place)].map(fold),
    });
  }
  for (const source of sources) {
    if (source.status && source.status !== 'active') continue;
    const creators = source.creators ?? [];
    entries.push({
      kind: 'source',
      id: source.id,
      label: source.title,
      detail: creators.length ? `${creators.join(', ')}${source.year ? `, ${source.year}` : ''}` : source.type ?? null,
      when: null,
      // A source is as findable by whoever wrote it as by its title: nobody
      // remembers the subtitle of a book they remember the author of.
      terms: [fold(source.title), ...creators.map(fold)],
      weight: 0,
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
//
// **The best `limit` of each kind are held as the scan goes; the whole match
// is never sorted.** One letter typed into a corpus of twenty thousand
// matches nearly every entry, and this used to copy each match into a new
// object, sort the lot, and parse both intervals at every comparison — to
// show eight rows, a third of a second per keystroke on the thread that draws
// (health review A, finding 19). The limit is spent group by group and no
// group can ever give more than `limit` rows, so `limit` per kind is
// everything the answer can use, and `tests/search.test.mjs` keeps the
// sort-everything scan and holds the two to the same rows in the same order.
//
// `total` is still every match, because the count under the box is what says
// how much the reader has not been shown.

// Whether a candidate stands ahead of a hit already held, under the order
// above. Over primitives rather than over two objects, because the candidate
// is not an object yet: nearly every entry is a candidate and almost none is
// kept, and the point of the change is not to allocate for the ones that are
// not. `start` is only read once the first three have tied, so a candidate
// that loses on rank never has its interval parsed.
function ahead(rank_, matched, weight, start, id, other) {
  if (rank_ !== other.rank) return rank_ < other.rank;
  if (matched !== other.matched) return matched < other.matched;
  if (weight !== other.weight) return weight > other.weight;
  if (start !== other.start) return start < other.start;
  return id < other.id;
}

// Whether the first three parts of the order already decide it, so that the
// year can be left unparsed.
function decided(rank_, matched, weight, other) {
  return rank_ !== other.rank || matched !== other.matched || weight !== other.weight;
}

export function search(entries, query, { limit = 8 } = {}) {
  const folded = fold(query);
  if (folded.length === 0) return { groups: [], total: 0, query: '' };
  const byKind = new Map();
  let total = 0;
  for (const entry of entries) {
    let best = null;
    let length = 0;
    for (const term of entry.terms) {
      const r = rank(term, folded);
      if (r !== null && (best === null || r < best || (r === best && term.length < length))) {
        best = r;
        length = term.length;
      }
    }
    if (best === null) continue;
    total += 1;
    let list = byKind.get(entry.kind);
    if (!list) {
      list = [];
      byKind.set(entry.kind, list);
    }
    const weight = entry.weight ?? 0;
    // Parsed only when it is needed: `null` until then, and a year of -1 is
    // a year like any other.
    let start = null;
    if (list.length >= limit) {
      // Against the worst one held, before anything is allocated.
      const worst = list[list.length - 1];
      if (decided(best, length, weight, worst)) {
        if (!ahead(best, length, weight, 0, entry.id, worst)) continue;
      } else {
        start = startOf(entry.when);
        if (!ahead(best, length, weight, start, entry.id, worst)) continue;
      }
    }
    if (start === null) start = startOf(entry.when);
    const hit = { entry, id: entry.id, rank: best, matched: length, weight, start };
    let at = list.length;
    while (at > 0 && ahead(best, length, weight, start, entry.id, list[at - 1])) at -= 1;
    list.splice(at, 0, hit);
    if (list.length > limit) list.pop();
  }
  const groups = [...byKind.entries()]
    .map(([kind, items]) => ({ kind, items }))
    .sort((a, b) => a.items[0].rank - b.items[0].rank
      || a.items[0].matched - b.items[0].matched
      || (a.kind < b.kind ? -1 : 1));

  // The limit is over the whole result, taken group by group in that order,
  // so a reader always sees the best match first however the groups fall.
  // What comes back is the entry with its rank on it, as it always was; the
  // copy happens here, where there are eight of them and not twenty thousand.
  const out = [];
  let left = limit;
  for (const group of groups) {
    if (left <= 0) break;
    const items = group.items.slice(0, left)
      .map((hit) => ({ ...hit.entry, rank: hit.rank, matched: hit.matched }));
    left -= items.length;
    out.push({ kind: group.kind, items });
  }
  return { groups: out, total, query: folded };
}

// The flat order the arrow keys walk, which is the order the groups are
// drawn in.
export function flatten(result) {
  return result.groups.flatMap((g) => g.items);
}
