// M87 — what breaks at 3,000 events, without a browser. The sections of
// docs/m87-brief.md whose subject is a pure answer: the lens's cache, the
// validator's reading of a cached lead, and the import tool's place reuse.
//
// Nothing here pins a count: what is asserted is that a second question costs
// nothing the first did not, which is a fact about the code and not about the
// size of the corpus that day.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lensView, activeFoci } from '../src/lens.js';
import {
  firstSentence, yearsInLead, spanOutsideLead, leadSpanWarnings,
} from '../src/validate/rules.js';

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
