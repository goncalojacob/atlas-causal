// M87 — what breaks at 3,000 events, without a browser. The sections of
// docs/m87-brief.md whose subject is a pure answer: the lens's cache, the
// validator's reading of a cached lead, and the import tool's place reuse.
//
// Nothing here pins a count: what is asserted is that a second question costs
// nothing the first did not, which is a fact about the code and not about the
// size of the corpus that day.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { lensView, activeFoci } from '../src/lens.js';
import {
  firstSentence, yearsInLead, spanOutsideLead, leadSpanWarnings,
} from '../src/validate/rules.js';
import { reusablePlace } from '../tools/import/places.mjs';
import { rememberRefusals } from '../tools/import/wikidata.mjs';
import { readSchemaFiles } from '../tools/lib/read.mjs';
import { createValidator } from '../src/validate/schema.js';
import { ROOT } from './helpers.mjs';

// An atlas the size of a test, with one thing added: `activeEvents` counts how
// many times it was read. `eventsOfFocus` walks that list — and builds a Set of
// every id from it — for an actor, a place, a region, a source and a narrative
// alike, so a count of these reads is a count of the scans (review B10).
//
// `attributeShardsArrived` is what says the atlas can tell when it has changed,
// and therefore what the memo is allowed to key on; the two `…Loaded` answers
// are the other half of that stamp.
function countingAtlas({ arrived = 1, grounds = true } = {}) {
  const events = [
    { id: 'a', status: 'active', when: { start: 1970, end: 1970 }, place: 'lisbon', region: 'europe', actors: [{ actor: 'salazar', role: 'leader' }] },
    { id: 'b', status: 'active', when: { start: 1971, end: 1971 }, place: 'lisbon', region: 'europe', actors: [] },
    { id: 'c', status: 'active', when: { start: 1972, end: 1972 }, place: 'porto', region: 'europe', actors: [{ actor: 'salazar', role: 'leader' }] },
  ];
  const state = { scans: 0 };
  return {
    state,
    atlas: {
      get activeEvents() { state.scans += 1; return events; },
      events: new Map(events.map((e) => [e.id, e])),
      edges: new Map(),
      sources: new Map(),
      narratives: new Map(),
      relations: new Map(),
      actors: new Map([['salazar', { id: 'salazar', name: 'Salazar' }]]),
      places: new Map([['lisbon', { id: 'lisbon', name: 'Lisbon' }], ['porto', { id: 'porto', name: 'Porto' }]]),
      regions: [{ id: 'europe', label: 'Europe' }],
      childrenOf: new Map(),
      resolve: (id) => {
        if (id === 'salazar') return { id, kind: 'actor', record: { id, name: 'Salazar' } };
        if (id === 'lisbon' || id === 'porto') return { id, kind: 'place', record: { id } };
        const found = events.find((e) => e.id === id);
        return found ? { id, kind: 'event', record: found } : null;
      },
      attributeShardsArrived: () => arrived,
      groundsLoaded: () => grounds,
      territoriesLoaded: () => grounds,
    },
  };
}

// §7 (B10). `lensView` built the stamp its own cache is keyed on out of
// `activeFoci`, which for an actor or a place walks every active event before
// the cache is ever asked — about ten times per state change, and on every move
// of a band drag. The answer is looked up first now.
test('§7: the second lensView for the same state does not scan the corpus again', () => {
  const { atlas, state: counted } = countingAtlas();
  const state = { focus: null, actor: 'salazar', selected: null };

  const first = lensView(atlas, state);
  assert.ok(first, 'an actor with events is a lens');
  const afterFirst = counted.scans;
  assert.ok(afterFirst > 0, 'the first answer cost a scan');

  const second = lensView(atlas, state);
  assert.equal(second, first, 'and it is the same answer');
  assert.equal(counted.scans, afterFirst, 'the second cost none');

  // And the callers that ask `activeFoci` directly — main.js, the chips, the
  // masthead's count — are answered out of the same cache.
  activeFoci(atlas, state);
  activeFoci(atlas, state);
  assert.equal(counted.scans, afterFirst, 'nor do the other callers of activeFoci');
});

// The cache may never be the reason an answer goes stale: an actor's lens is
// the `actors` list alone until the grounds file lands, and a narrative's walk
// is empty until its century does. Both are outside the state, so both are in
// the stamp.
test('§7: a file landing is a new answer, and a different state is its own', () => {
  const early = countingAtlas({ arrived: 1, grounds: false });
  const state = { focus: null, actor: 'salazar', selected: null };
  lensView(early.atlas, state);
  const afterFirst = early.state.scans;
  lensView(early.atlas, state);
  assert.equal(early.state.scans, afterFirst, 'the same atlas and the same state: one answer');

  // The same state object, an atlas that has changed under it.
  let arrived = 1;
  const moving = countingAtlas();
  moving.atlas.attributeShardsArrived = () => arrived;
  lensView(moving.atlas, state);
  const before = moving.state.scans;
  arrived = 2;
  lensView(moving.atlas, state);
  assert.ok(moving.state.scans > before, 'a shard landing is asked again');

  // A different state is a different question, whatever the atlas has.
  const other = { focus: null, actor: null, place: 'lisbon', selected: null };
  const was = moving.state.scans;
  lensView(moving.atlas, other);
  assert.ok(moving.state.scans > was, 'and a state nobody has asked about is worked out');
});

// §10 (review part C, finding 2). `span-vs-article-title` reads titles, and most
// articles do not put their years in their title: fifteen records contradict the
// year range in the first sentence of the very lead their own summary quotes.
// The new warning reads that sentence. A warning and never a change to a record.
test('§10: a year range in the lead\'s first sentence, and only where it is one', () => {
  // The three shapes, and nothing else. A fourth would be a guess.
  assert.deepEqual(yearsInLead('The Rif War (1921–1926) was fought in Morocco.'), { start: 1921, end: 1926 });
  assert.deepEqual(yearsInLead('It lasted from 1978 to 1989.'), { start: 1978, end: 1989 });
  assert.deepEqual(yearsInLead('It ran from January 1809 until December 1826.'), { start: 1809, end: 1826 });
  assert.deepEqual(yearsInLead('Fought between 1809 and 1826 in the Andes.'), { start: 1809, end: 1826 });

  // Two years that are not an interval state no span.
  assert.equal(yearsInLead('The 1914 and 1918 treaties differed.'), null);
  assert.equal(yearsInLead('It began in 1995.'), null, 'one year is not a range');
  assert.equal(yearsInLead('Nothing here.'), null);
  assert.equal(yearsInLead(null), null);
  // And a pair the wrong way round is somebody counting backwards, not a span.
  assert.equal(yearsInLead('between 1926 and 1921'), null);

  // The first sentence is where it is read, so a range further down the lead is
  // not the article's own statement of its subject's span.
  assert.equal(firstSentence('The coup happened. It was preceded by 1959–1961 unrest.'), 'The coup happened.');
  assert.equal(yearsInLead(firstSentence('The coup happened. It was preceded by 1959–1961 unrest.')), null);
  assert.equal(firstSentence('One sentence with no stop'), 'One sentence with no stop');
  assert.equal(firstSentence('  Spaced   out.  And more. '), 'Spaced out.');
});

test('§10: the record is outside the lead only where it claims a year the lead does not', () => {
  const range = { start: 1978, end: 1989 };
  // Either bound past either end.
  assert.equal(spanOutsideLead(range, { start: 1989, end: 1991 }), true, 'an end past the lead\'s');
  assert.equal(spanOutsideLead(range, { start: 1977, end: 1989 }), true, 'a start before it');
  // Containment, and not equality: a record narrower than its article's range is
  // inside it. Widening one is A7's pass and a person's judgement.
  assert.equal(spanOutsideLead(range, { start: 1980, end: 1985 }), false, 'a narrower record is inside');
  assert.equal(spanOutsideLead(range, { start: 1978, end: 1989 }), false, 'and an equal one');
  // `end: null` is "as far as the data goes", compared on the start alone,
  // exactly as `disagreesWithSpan` treats it.
  assert.equal(spanOutsideLead(range, { start: 1980, end: null }), false);
  assert.equal(spanOutsideLead(range, { start: 1970, end: null }), true);
  assert.equal(spanOutsideLead(range, { start: null }), false, 'a record with no start says nothing');
  assert.equal(spanOutsideLead(null, { start: 1970 }), false, 'nor does a lead with no range');
});

test('§10: the warning names both spans, and is raised only about an active event with a lead', () => {
  const leads = new Map([
    ['Q1', { qid: 'Q1', lang: 'en', text: 'The war lasted from 1978 to 1989. It ended.' }],
    ['Q2', { qid: 'Q2', lang: 'pt', text: 'A guerra durou de 1978 a 1989.' }],
  ]);
  const records = [
    { kind: 'event', status: 'active', id: 'war', wikidata: 'Q1', when: { start: 1989, end: 1991 } },
    { kind: 'event', status: 'active', id: 'inside', wikidata: 'Q1', when: { start: 1980, end: 1985 } },
    { kind: 'event', status: 'retracted', id: 'gone', wikidata: 'Q1', when: { start: 1500, end: 1501 } },
    { kind: 'event', status: 'active', id: 'no-item', when: { start: 1500, end: 1501 } },
    { kind: 'event', status: 'active', id: 'no-lead', wikidata: 'Q9', when: { start: 1500, end: 1501 } },
    { kind: 'actor', status: 'active', id: 'somebody', wikidata: 'Q1', when: { start: 1500, end: 1501 } },
  ];
  const found = leadSpanWarnings(records, leads);
  assert.deepEqual(found.map((w) => w.id), ['war'], 'one record, and it is the one that claims more');
  assert.equal(found[0].rule, 'span-vs-lead-sentence');
  assert.match(found[0].message, /states 1978–1989/, 'the lead\'s span');
  assert.match(found[0].message, /dated 1989–1991/, 'and the record\'s');
  assert.match(found[0].message, /cached en lead/, 'and which lead it read');

  // A record with no lead in hand is not a record this can say anything about.
  assert.deepEqual(leadSpanWarnings(records, new Map()), []);
  assert.deepEqual(leadSpanWarnings([], leads), []);
});

// §11 (review part C, finding 9). The Wikidata import reused a place by item
// alone, and thirty-eight of the atlas's places carry no item — a place written
// by a person never will until somebody adds one — so `london-q84` was written
// beside the hand-written `london` at the same point and the events of one town
// went to two marks. Folded name and distance now, the same two signals the
// Natural Earth matcher uses, and exactly one record has to survive both.
const place = (id, names, lon, lat, extra = {}) => ({
  kind: 'place', status: 'active', id, names, where: { lon, lat, precision: 'city', label: names[0] }, ...extra,
});

test('§11: a place the atlas already holds is reused, by its name and where it is', () => {
  const held = [
    place('london', ['London'], -0.1276, 51.5072),
    place('lisbon', ['Lisboa', 'Lisbon'], -9.1393, 38.7223),
    place('belem-lisbon', ['Belém, Lisbon', 'Belém'], -9.2058, 38.6959),
  ];

  // The hand-written record, found by an item that has no record of its own.
  assert.equal(reusablePlace({ names: ['London', 'Londres'], point: { lon: -0.1, lat: 51.5 } }, held), 'london');
  // Folded: the same name written with different diacritics is the same name.
  assert.equal(reusablePlace({ names: ['Lisboa'], point: { lon: -9.14, lat: 38.72 } }, held), 'lisbon');
  assert.equal(reusablePlace({ names: ['LISBON'], point: { lon: -9.14, lat: 38.72 } }, held), 'lisbon');

  // And the distance only ever refuses: nothing is reused for being near, and
  // a name that matches four thousand kilometres away is another place.
  assert.equal(reusablePlace({ names: ['Belém'], point: { lon: -48.5, lat: -1.45 } }, held), null,
    'Belém in Pará is not Belém in Lisbon');
  assert.equal(reusablePlace({ names: ['Porto'], point: { lon: -8.61, lat: 41.15 } }, held), null,
    'a name the atlas does not hold is a place it does not have');

  // Two records of one name near one point is a question for a person.
  const twice = [...held, place('london-again', ['London'], -0.13, 51.51)];
  assert.equal(reusablePlace({ names: ['London'], point: { lon: -0.1, lat: 51.5 } }, twice), null);

  // Nothing to go on is no match: a place with no point, a candidate with no
  // name, a record that is not a place, a record that is not active.
  assert.equal(reusablePlace({ names: ['London'], point: null }, held), null);
  assert.equal(reusablePlace({ names: [], point: { lon: -0.1, lat: 51.5 } }, held), null);
  assert.equal(reusablePlace({ names: ['London'], point: { lon: -0.1, lat: 51.5 } }, []), null);
  assert.equal(reusablePlace(
    { names: ['London'], point: { lon: -0.1, lat: 51.5 } },
    [{ ...place('london', ['London'], -0.1276, 51.5072), status: 'retracted' }],
  ), null, 'a tombstone is out of the corpus');
  assert.equal(reusablePlace(
    { names: ['London'], point: { lon: -0.1, lat: 51.5 } },
    [{ ...place('london', ['London'], -0.1276, 51.5072), kind: 'actor' }],
  ), null, 'and an actor of the same name is not a place');

  // The label a place carries for the map counts as one of its names, because
  // a record written before `names` was required may have it and nothing else.
  assert.equal(reusablePlace(
    { names: ['Porto'], point: { lon: -8.61, lat: 41.15 } },
    [{ kind: 'place', status: 'active', id: 'porto', names: [], where: { lon: -8.6291, lat: 41.1579, label: 'Porto' } }],
  ), 'porto');
});

// §12 (review part C, finding 15). The state file kept no account of what the
// import has never been able to use, and the report was truncated on every run —
// eighteen lines today for an import that has been going a fortnight. The log is
// in the state file now, appended and never overwritten.
test('§12: what the import refused is kept, and a second refusal is not news', () => {
  const empty = { schema: 1, kind: 'import-state', source: 'wikidata', runs: {} };

  const first = rememberRefusals(empty, [
    { qid: 'Q1', why: 'none of its classes is in the table' },
    { qid: 'Q2', why: 'no date the atlas can use' },
  ], '2026-09-24');
  assert.deepEqual(Object.keys(first.refused).sort(), ['Q1', 'Q2']);
  assert.deepEqual(first.refused.Q1, { on: '2026-09-24', why: 'none of its classes is in the table' });
  assert.deepEqual(first.runs, empty.runs, 'the cursors are not touched');

  // Appended: a run that refuses Q1 again for another reason keeps the first
  // refusal and the day it happened. A log that rewrote itself every run would
  // be a log of the last run.
  const later = rememberRefusals(first, [
    { qid: 'Q1', why: 'something else entirely' },
    { qid: 'Q3', why: 'no such item' },
  ], '2026-09-30');
  assert.deepEqual(later.refused.Q1, { on: '2026-09-24', why: 'none of its classes is in the table' });
  assert.deepEqual(later.refused.Q3, { on: '2026-09-30', why: 'no such item' });
  assert.deepEqual(Object.keys(later.refused).sort(), ['Q1', 'Q2', 'Q3']);

  // A run that refused nothing writes nothing, and a state that has no map yet
  // and nothing to put in one is handed back unchanged.
  assert.equal(rememberRefusals(empty, [], '2026-09-30'), empty);
  assert.deepEqual(rememberRefusals(first, [], '2026-09-30').refused, first.refused);
  // A refusal with no item is not an entry, and a very long reason is cut
  // rather than written whole into a file somebody has to read.
  assert.deepEqual(rememberRefusals(empty, [{ why: 'nobody' }], '2026-09-30'), empty);
  const long = rememberRefusals(empty, [{ qid: 'Q4', why: 'x'.repeat(600) }], '2026-09-30');
  assert.equal(long.refused.Q4.why.length, 400);
});

test('§12: the state file the tool writes is what the schema allows', async () => {
  const schemas = await readSchemaFiles(path.join(ROOT, 'schema'));
  const validator = createValidator(schemas);
  assert.deepEqual(validator.schemaErrors, [], 'the schema set itself is sound');
  const state = rememberRefusals(
    { schema: 1, kind: 'import-state', source: 'wikidata', runs: { import: { updated: '2026-09-24', pending: [], done: ['Q7'] } } },
    [{ qid: 'Q1', why: 'none of its classes is in the table' }],
    '2026-09-24',
  );
  assert.deepEqual(validator.validate('v1/import-state.json', state), []);
  // And the file on disk, which has no `refused` yet and reads as empty: a file
  // written before this existed is not a file that stopped validating.
  const onDisk = JSON.parse(await readFile(path.join(ROOT, 'data/imports/wikidata-state.json'), 'utf8'));
  assert.deepEqual(validator.validate('v1/import-state.json', onDisk), []);
});

test('§12: the Action accumulates its report instead of truncating it', async () => {
  const text = await readFile(path.join(ROOT, '.github/workflows/import-wikidata.yml'), 'utf8');
  assert.doesNotMatch(text, /:\s*>\s*docs\/import-report\.md/, 'the report is not emptied on every run');
  // A dated heading per run, appended, and the batches under it.
  assert.match(text, />> docs\/import-report\.md/, 'the heading is appended');
  assert.match(text, /--report docs\/import-report\.md/, 'and the batches write into the same file');
});
