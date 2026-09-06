// Finding a record by name: the pure half. The box itself (keys, ARIA, the
// list) needs a DOM and is exercised in the browser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fold, rank, buildSearchIndex, search, flatten, firstSentence, LEAD_RANK, LEAD_CHARS,
} from '../src/search.js';
import { extent } from '../src/util/dates.js';

const EVENTS = [
  { id: 'salazar-falls-1968', title: 'Marcelo Caetano succeeds Salazar', when: { start: 1968, end: 1968 }, weight: 4, status: 'active' },
  { id: 'carnation-revolution-1974', title: '25 April', when: { start: 1974, end: 1974 }, weight: 9, status: 'active' },
  { id: 'angola-independence-1975', title: 'Independence of Angola', when: { start: 1975, end: 1975 }, weight: 3, status: 'active' },
  { id: 'cabral-1973', title: 'Assassination of Amílcar Cabral', when: { start: 1973, end: 1973 }, weight: 2, status: 'active' },
  { id: 'retracted-one', title: 'Salazar and the tides', when: { start: 1930, end: 1930 }, weight: 0, status: 'retracted' },
];
const ACTORS = [
  { id: 'salazar', name: 'António de Oliveira Salazar', names: ['António de Oliveira Salazar', 'Salazar'], actorType: 'person', when: { start: 1889, end: 1970 }, status: 'active' },
  { id: 'angola', name: 'Angola', names: ['Angola'], actorType: 'polity', when: { start: 1886, end: null }, status: 'active' },
  { id: 'pvde-pide-dgs', name: 'PIDE', names: ['PIDE', 'Polícia Internacional e de Defesa do Estado', 'DGS'], actorType: 'institution', when: { start: 1945, end: 1974 }, status: 'active' },
  { id: 'gone', name: 'Gone', names: ['Gone'], actorType: 'polity', when: { start: 1900, end: 1901 }, status: 'merged' },
];
const PLACES = [
  { id: 'lisbon', name: 'Lisbon', names: ['Lisbon', 'Lisboa'], where: { lon: -9.14, lat: 38.72, precision: 'city', label: 'Lisbon' }, status: 'active' },
  { id: 'luanda', name: 'Luanda', names: ['Luanda'], where: { lon: 13.23, lat: -8.84, precision: 'city', label: 'Luanda' }, status: 'active' },
  { id: 'nowhere', name: 'Nowhere', names: ['Nowhere'], where: { lon: 0, lat: 0, precision: 'city', label: 'Nowhere' }, status: 'retracted' },
];
const SOURCES = [
  { id: 'maxwell-1995', title: 'The Making of Portuguese Democracy', creators: ['Kenneth Maxwell'], year: 1995, type: 'book', status: 'active' },
  { id: 'telo-2007', title: 'História Contemporânea de Portugal', creators: ['António José Telo'], year: 2007, type: 'book', status: 'active' },
  { id: 'withdrawn', title: 'Salazar, a Life', creators: ['Nobody'], year: 1800, type: 'book', status: 'retracted' },
];
const index = buildSearchIndex({ events: EVENTS, actors: ACTORS, places: PLACES, sources: SOURCES });

test('folding drops case and diacritics', () => {
  assert.equal(fold('Amílcar Cabral'), 'amilcar cabral');
  assert.equal(fold('  PIDE '), 'pide');
  assert.equal(fold('Polícia Internacional'), 'policia internacional');
});

test('a prefix beats a word start beats a substring', () => {
  assert.equal(rank('salazar', 'sal'), 0);
  assert.equal(rank('marcelo caetano succeeds salazar', 'sal'), 1);
  assert.equal(rank('salazar', 'ala'), 2, 'inside a word is still a match, just a worse one');
  assert.equal(rank('angola', 'zz'), null);
  assert.equal(rank('india (british)', 'brit'), 1, 'a bracket opens a word');
});

test('the index holds active records only, with their variants', () => {
  assert.equal(index.filter((e) => e.kind === 'event').length, 4, 'the retracted event is not searchable');
  assert.equal(index.filter((e) => e.kind === 'actor').length, 3, 'nor the merged actor');
  const pide = index.find((e) => e.id === 'pvde-pide-dgs');
  assert.deepEqual(pide.terms, ['pide', 'policia internacional e de defesa do estado', 'dgs']);
  assert.equal(pide.label, 'PIDE');
});

test('a place is found by any of its names, and only while it is active', () => {
  assert.equal(index.filter((e) => e.kind === 'place').length, 2, 'the retracted place is not searchable');
  const hits = flatten(search(index, 'lisboa'));
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, 'place');
  assert.equal(hits[0].id, 'lisbon');
  assert.equal(hits[0].label, 'Lisbon', 'the display name, whichever variant matched');
  // A place has no dates, and sorting must not fall over on that.
  assert.equal(hits[0].when, null);
  assert.equal(flatten(search(index, 'luand'))[0].id, 'luanda');
});

test('a source is found by its title or by whoever wrote it', () => {
  assert.equal(index.filter((e) => e.kind === 'source').length, 2, 'the retracted source is not searchable');
  const byTitle = flatten(search(index, 'making of portuguese'));
  assert.equal(byTitle[0].kind, 'source');
  assert.equal(byTitle[0].id, 'maxwell-1995');
  assert.equal(byTitle[0].detail, 'Kenneth Maxwell, 1995');
  const byAuthor = flatten(search(index, 'maxwell'));
  assert.equal(byAuthor[0].id, 'maxwell-1995');
  // Diacritics are optional here too: nobody types the â of Contemporânea.
  assert.equal(flatten(search(index, 'historia contemporanea'))[0].id, 'telo-2007');
});

test('"sal" puts Salazar the actor first, above the events that mention him', () => {
  const result = search(index, 'sal');
  const first = flatten(result)[0];
  assert.equal(first.kind, 'actor');
  assert.equal(first.id, 'salazar');
  assert.equal(result.groups[0].kind, 'actor', 'the group with the best match comes first');
  assert.equal(result.groups[1].kind, 'event');
  assert.deepEqual(result.groups[1].items.map((i) => i.id), ['salazar-falls-1968']);
});

test('a name and its events come back together', () => {
  const result = search(index, 'angola');
  assert.deepEqual(flatten(result).map((i) => `${i.kind}:${i.id}`), ['actor:angola', 'event:angola-independence-1975']);
  assert.equal(result.total, 2);
});

test('an acronym and a full name find the same record', () => {
  assert.equal(flatten(search(index, 'dgs'))[0].id, 'pvde-pide-dgs');
  assert.equal(flatten(search(index, 'policia'))[0].id, 'pvde-pide-dgs');
  assert.equal(flatten(search(index, 'Polícia'))[0].id, 'pvde-pide-dgs');
});

test('diacritics are optional in either direction', () => {
  assert.equal(flatten(search(index, 'amilcar'))[0].id, 'cabral-1973');
  assert.equal(flatten(search(index, 'Amílcar'))[0].id, 'cabral-1973');
});

test('an empty query returns nothing, and the limit is over the whole result', () => {
  assert.deepEqual(search(index, '   '), { groups: [], total: 0, query: '' });
  const many = search(index, 'a', { limit: 3 });
  assert.equal(flatten(many).length, 3);
  assert.ok(many.total > 3, 'the count is of everything, not of what is shown');
});

test('the order is stable: rank, then the shorter name, then weight, then id', () => {
  const twice = [search(index, 'a'), search(index, 'a')];
  assert.deepEqual(flatten(twice[0]).map((i) => i.id), flatten(twice[1]).map((i) => i.id));
});

// --- the top of the list, against sorting the whole of it ------------------

// The scan as it was before H4c: every match copied into an object, the lot
// sorted, then the first eight taken. Kept here so the answer the box gives
// can be held to it — the change was meant to be a change in what is looked
// at and never in what is found.
function sortEverything(entries, query, { limit = 8 } = {}) {
  const folded = fold(query);
  if (folded.length === 0) return { groups: [], total: 0, query: '' };
  const startOf = (when) => {
    try {
      return extent(when).min;
    } catch {
      return 0;
    }
  };
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

// Mulberry32, as the bench harness uses: the same corpus on every machine.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('holding the best eight finds exactly what sorting all of them found', () => {
  const words = ['angola', 'goa', 'lisboa', 'salazar', 'ceuta', 'diu', 'macau', 'brasil'];
  for (const seed of [1415, 1498, 1580]) {
    const random = seeded(seed);
    const events = [];
    const actors = [];
    const places = [];
    for (let i = 0; i < 1200; i += 1) {
      const word = words[Math.floor(random() * words.length)];
      const other = words[Math.floor(random() * words.length)];
      const year = 1400 + Math.floor(random() * 500);
      // Weights and years repeat on purpose: the order is only a total order
      // because it falls through to the id, and this is where that matters.
      events.push({
        id: `e${String(i).padStart(4, '0')}`,
        title: `${word} and ${other}`,
        status: 'active',
        when: { start: year, end: year },
        weight: Math.floor(random() * 3),
      });
      if (i % 5 === 0) {
        actors.push({ id: `a${i}`, name: `${other} ${word}`, names: [`${other} ${word}`, word], status: 'active' });
        places.push({ id: `p${i}`, name: `${word}`, names: [`${word}`], status: 'active' });
      }
    }
    const entries = buildSearchIndex({ events, actors, places });
    for (const query of ['a', 'go', 'ang', 'lisboa', 'salazar', 'zzz', 'a and', 'ceuta and diu']) {
      const fast = search(entries, query);
      const slow = sortEverything(entries, query);
      const where = `seed ${seed}, "${query}"`;
      assert.equal(fast.total, slow.total, `${where}: the same number of matches`);
      assert.deepEqual(
        fast.groups.map((g) => [g.kind, g.items.map((i) => i.id)]),
        slow.groups.map((g) => [g.kind, g.items.map((i) => i.id)]),
        `${where}: the same rows, in the same groups, in the same order`,
      );
      assert.deepEqual(flatten(fast).map((i) => [i.id, i.rank, i.matched, i.label]),
        flatten(slow).map((i) => [i.id, i.rank, i.matched, i.label]),
        `${where}: and each row carries what it carried`);
    }
    // A limit larger than the default is answered the same way.
    assert.deepEqual(
      flatten(search(entries, 'a', { limit: 25 })).map((i) => i.id),
      flatten(sortEverything(entries, 'a', { limit: 25 })).map((i) => i.id),
    );
  }
});

// ─── what H7 added: an event's other names, and its opening sentence ───────
//
// The atlas's most famous event is filed under "25 April" and nobody outside
// Portugal calls it that (health review B, finding 17). `names` is what a
// record says it is also called; the summary's first sentence is a last
// resort, ranked below every name so that a record *called* a thing always
// comes before a record that merely mentions it.

const NAMED = [
  {
    id: 'carnation-revolution-1974',
    title: '25 April',
    names: ['Carnation Revolution', 'Revolução dos Cravos'],
    summary: 'Units led by the Armed Forces Movement left barracks in the early hours and held Lisbon by the morning, two years before the constitution. The carnations put into gun barrels gave the day its name.',
    when: { start: 1974, end: 1974 },
    weight: 9,
    status: 'active',
  },
  {
    id: 'constitution-1976',
    title: 'The 1976 constitution',
    summary: 'The Constituent Assembly approved a text committing the state to a transition to socialism.',
    when: { start: 1976, end: 1976 },
    weight: 4,
    status: 'active',
  },
];
const named = buildSearchIndex({ events: NAMED });
const found = (query) => flatten(search(named, query, { limit: 8 })).map((i) => i.id);

test('the first sentence of a summary is folded, capped, and nothing beyond it', () => {
  assert.equal(firstSentence('One. Two. Three.'), 'One.');
  assert.equal(firstSentence('No full stop at all'), 'No full stop at all');
  assert.equal(firstSentence('  Leading space. And more.'), 'Leading space.');
  assert.equal(firstSentence('An abbreviation of 3.5 metres. Then more.'), 'An abbreviation of 3.5 metres.');
  assert.equal(firstSentence(''), '');
  assert.equal(firstSentence(null), '');
  assert.equal(firstSentence(`${'a'.repeat(400)}. and more`).length, LEAD_CHARS);
  // Only the first sentence is in the entry, so the second one's words are
  // not searchable — which is the trade plan decision 5 took.
  const entry = named.find((e) => e.id === 'carnation-revolution-1974');
  assert.match(entry.lead, /^units led by the armed forces movement/);
  assert.equal(entry.lead.includes('carnation'), false, 'the word is in the second sentence');
});

test('an event is found by any of its names, which are shown beside the title', () => {
  assert.deepEqual(found('carnation revolution'), ['carnation-revolution-1974']);
  assert.deepEqual(found('cravos'), ['carnation-revolution-1974'], 'diacritics stay optional');
  assert.deepEqual(found('25 april'), ['carnation-revolution-1974'], 'and the title still finds it');
  const entry = named.find((e) => e.id === 'carnation-revolution-1974');
  assert.deepEqual(entry.variants, ['Carnation Revolution', 'Revolução dos Cravos']);
  // An event with no other names carries no key at all, as its record does.
  assert.equal('variants' in named.find((e) => e.id === 'constitution-1976'), false);
});

test('the summary answers when nothing is called that, and always ranks below a name', () => {
  // Nothing is *called* "barracks"; one summary opens with the word.
  assert.deepEqual(found('barracks'), ['carnation-revolution-1974']);
  assert.deepEqual(found('constituent assembly'), ['constitution-1976']);
  // Nothing in the second sentence is searchable.
  assert.deepEqual(found('gun barrels'), []);

  // A name beats a mention. "Constitution" is in one record's title and in
  // the other's first sentence: the title comes first, whatever the weights.
  const both = search(named, 'constitu', { limit: 8 });
  assert.deepEqual(flatten(both).map((i) => i.id), ['constitution-1976', 'carnation-revolution-1974']);
  const [first, second] = flatten(both);
  assert.ok(first.rank < LEAD_RANK, 'a title match');
  assert.ok(second.rank >= LEAD_RANK, 'and a summary match, below it');
});

// The two "Angola"s the M27 splits created are told apart by their years, and
// the box has drawn them since the entry carried a `when` (health review B,
// finding 28). Held here so that nothing quietly stops carrying it.
test('an actor entry carries the years the box puts beside it', () => {
  const salazar = index.find((e) => e.kind === 'actor' && e.id === 'salazar');
  assert.deepEqual(salazar.when, { start: 1889, end: 1970 });
  const angola = index.find((e) => e.kind === 'actor' && e.id === 'angola');
  assert.deepEqual(angola.when, { start: 1886, end: null }, 'an open end is still an end to draw');
  for (const entry of index.filter((e) => e.kind === 'actor')) {
    assert.ok(entry.when && Number.isInteger(extent(entry.when).min), entry.id);
  }
});
