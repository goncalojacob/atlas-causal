// A15(5) — chronology is not a claim, and the cause a sentence names may be a
// third event.
//
// Three curation fires refused the *"Following the war, X happened"* class by
// eye. A15(5) makes it a rule applied when the edge is written, and adds the
// harder half: a quote that **does** state a cause may name a cause that is
// neither end of the edge, and then the edge is written from that event or not
// at all.
//
// The name matching here is deviations 1458, 1459 and 1460 fixed in one place,
// because the next curation fire's relations pass reads the same articles.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  stripHeadings, fold, opensWithChronology, statesACause, isChronologyOnly,
  usableName, mentions, namesHeldEvents, verdictFor,
} from '../tools/import/chronology.mjs';

test('a sentence that opens on the order of events and states no cause is refused', () => {
  assert.equal(isChronologyOnly('After the war, the country held its first election.'), true);
  assert.equal(isChronologyOnly('Following the treaty, the border was surveyed.'), true);
  assert.equal(isChronologyOnly('In the aftermath, the city was rebuilt.'), true);
  assert.equal(isChronologyOnly('Shortly after, the garrison withdrew.'), true);
  // The same opener with a cause stated is an argument and is kept.
  assert.equal(isChronologyOnly('After the war, food ran short, which caused the riots.'), false);
  assert.equal(isChronologyOnly('Following the dissolution of the Soviet Union in December 1991, all support was stopped, leading to the toppling of the government.'), false);
  // A sentence that never opens on chronology is not this class at all, cause
  // or no cause.
  assert.equal(isChronologyOnly('The treaty settled the border.'), false);
  assert.equal(opensWithChronology('The war followed the treaty.'), false);
});

test('the opener has to be the opening', () => {
  // "afterwards" is not "after ", and a clause in the middle is not an opener.
  assert.equal(opensWithChronology('Afterwards the garrison withdrew.'), false);
  assert.equal(opensWithChronology('The garrison withdrew after the siege.'), false);
  assert.equal(statesACause('the revolt was a response to the tax'), false);
  assert.equal(statesACause('the revolt was in response to the tax'), true);
});

test('a name that is only a date is not a name (deviation 1459)', () => {
  assert.equal(usableName('25 April'), false);
  assert.equal(usableName('April 1974'), false);
  assert.equal(usableName('1974'), false);
  assert.equal(usableName('Carnation Revolution'), true);
  assert.equal(usableName('13 Vendémiaire'), true);
});

test('a name is matched on word boundaries (deviation 1458)', () => {
  assert.equal(mentions('the origins of World War II are disputed', 'World War I'), false);
  assert.equal(mentions('the origins of World War I are disputed', 'World War I'), true);
  // The fold takes dashes, quotes and case out of the question.
  assert.equal(mentions('the Soviet–Afghan War ended in 1989', 'soviet-afghan war'), true);
  assert.equal(mentions('the treaty of Lausanne', 'Treaty of Lausanne'), true);
  // A name inside a longer word is not a mention.
  assert.equal(mentions('the Anschlusszeit', 'Anschluss'), false);
});

test('a heading is not a sentence (deviation 1460)', () => {
  const extract = 'The war began in 1914.\n=== World War I ===\nThe section that follows is about something else.';
  assert.equal(fold(stripHeadings(extract)).includes('world war i ==='), false);
  // The heading's words are gone, so a matcher does not find the name in them.
  assert.equal(mentions(extract, 'World War I'), false);
});

test('the third event a quote names is what the edge must be written from', () => {
  const candidates = [
    { id: 'dissolution-of-the-soviet-union', names: ['dissolution of the Soviet Union'] },
    { id: 'turkish-war-of-independence', names: ['Turkish War of Independence'] },
  ];
  const quote = 'Following the dissolution of the Soviet Union in December 1991, all support to the '
    + 'Democratic Republic was stopped, leading to the toppling of the government by the mujahideen in 1992.';
  const verdict = verdictFor(quote, { from: 'soviet-afghan-war', to: 'afghan-civil-war-q1980081', candidates });
  assert.equal(verdict.write, false);
  assert.equal(verdict.why, 'the quote names a third event the atlas holds as the cause');
  assert.deepEqual(verdict.reattribute.map((r) => r.id), ['dissolution-of-the-soviet-union']);

  // An endpoint of the edge is not a third event.
  const own = verdictFor('The dissolution of the Soviet Union caused the collapse.', {
    from: 'dissolution-of-the-soviet-union', to: 'afghan-civil-war-q1980081', candidates,
  });
  assert.equal(own.write, true);

  // The chronology class is decided before anything is looked for.
  const refused = verdictFor('After the dissolution of the Soviet Union, the republics held elections.', {
    from: 'a', to: 'b', candidates,
  });
  assert.equal(refused.why, 'chronology with no cause stated');
  assert.deepEqual(refused.reattribute, []);
});
