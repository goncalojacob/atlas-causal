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
  stripHeadings, fold, tidy, capitalsOf, opensWithChronology, statesACause,
  isChronologyOnly, usableName, mentions, namesHeldEvents, verdictFor,
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

test('a capital a record carries is a capital the prose must keep (deviation 1464)', () => {
  // The two false matches batch 65 caught by eye. Both sentences use a record's
  // words as ordinary prose, in lower case, and mean nothing by them.
  assert.equal(mentions('the European powers became increasingly aware of the troubles in Sudan', 'The Troubles'), false);
  assert.equal(mentions('imposing a reign of terror over the regions of Sudan', 'Reign of Terror'), false);
  // The same names written as names are still found, and a leading article is
  // not one of the capitals asked for: prose writes "the Troubles".
  assert.equal(mentions('the Troubles in Northern Ireland ended in 1998', 'The Troubles'), true);
  assert.equal(mentions('The Troubles ended in 1998', 'The Troubles'), true);
  assert.equal(mentions('the Reign of Terror ended with Thermidor', 'Reign of Terror'), true);
  // One capital is enough, because an article writes "the treaty of Lausanne"
  // for the Treaty of Lausanne — which is the assertion above this one.
  assert.deepEqual(capitalsOf('Treaty of Lausanne'), ['Treaty', 'Lausanne']);
  assert.deepEqual(capitalsOf('The Troubles'), ['Troubles']);
  assert.deepEqual(capitalsOf('soviet-afghan war'), []);
  // A name with no capital of its own is matched as it always was.
  assert.equal(mentions('the Soviet-Afghan War ended in 1989', 'soviet-afghan war'), true);
  // tidy() is fold() without the lowering, so the matcher can ask what the text
  // capitalised; everything else it does is the same.
  assert.equal(tidy('  the Soviet\u2013Afghan   War  '), 'the Soviet-Afghan War');
  assert.equal(fold('  the Soviet\u2013Afghan   War  '), 'the soviet-afghan war');
  // The capital has to be inside the occurrence that matched, not loose in the
  // paragraph: a sentence about Terror elsewhere does not name the record here.
  assert.equal(mentions('a reign of terror; the Terror came later', 'Reign of Terror'), false);
});

test('a name joined to the word before it by a hyphen is another name (deviation 1467)', () => {
  // The 1983 Beirut barracks bombings article says the attacks answered
  // "America's support for Iraq in the Iran-Iraq War". `iraq-war` is the atlas's
  // 2003 war, and it was matching there: a hyphen is not a letter, so the word
  // boundary of deviation 1458 let the name start in the middle of a compound.
  assert.equal(mentions("America's support for Iraq in the Iran-Iraq War", 'Iraq War'), false);
  assert.equal(mentions('the Anglo-Zulu War of 1879', 'Zulu War'), false);
  // The compound itself is still its own name, and the name written on its own
  // is still found: the rule is about where a match may begin and nothing else.
  assert.equal(mentions('in the Iran-Iraq War', 'Iran-Iraq War'), true);
  assert.equal(mentions('the Iraq War began in 2003', 'Iraq War'), true);
  assert.equal(mentions('the war in Iraq - Iraq War, as it is called', 'Iraq War'), true);
  // A dash that is punctuation rather than a join is not one: it is the letter
  // before the hyphen that makes the compound, and there is none here.
  assert.equal(mentions('the cause -Iraq War- was argued over', 'Iraq War'), true);
  // Deviation 1458's own assertions are the trailing half of the same question
  // and they are unchanged.
  assert.equal(mentions('the Soviet-Afghan War ended in 1989', 'soviet-afghan war'), true);
  assert.equal(mentions('the origins of World War II are disputed', 'World War I'), false);
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
