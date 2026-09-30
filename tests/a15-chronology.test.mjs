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
  undisambiguated, yearsApart,
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

// --- deviation 1481: the disambiguator the prose never writes ---------------

test("a record's own title may carry a disambiguator no article uses", () => {
  assert.equal(undisambiguated('Operation Badr (1973)'), 'Operation Badr');
  assert.equal(undisambiguated('Afghan Civil War (1992–1996)'), 'Afghan Civil War');
  assert.equal(undisambiguated('Arusha Accords (Rwanda)'), 'Arusha Accords');
  // Only trailing, and only where a usable name is left behind.
  assert.equal(undisambiguated('Battle of Belmont'), null);
  assert.equal(undisambiguated('(1899)'), null);
  assert.equal(undisambiguated('Action of 9 February 1799 (South Africa)'), 'Action of 9 February 1799');
  assert.equal(undisambiguated(null), null);
  // A bracket in the middle is not a disambiguator.
  assert.equal(undisambiguated('Operation (Badr) 1973'), null);
});

test('the bare name is what an article writes, so it is what is looked for', () => {
  const badr = [{ id: 'operation-badr-1973', names: ['Operation Badr (1973)'] }];
  const text = 'On October 6, 1973, Egypt launched Operation Badr, which started the Yom Kippur War.';
  // Before 1481 this found nothing at all, and 159 of 1,333 active events were
  // in the same position.
  assert.deepEqual(namesHeldEvents(text, badr).map((n) => n.id), ['operation-badr-1973']);
  // The record's own name is what is reported, not the bare form: a note quoting
  // this says which record it means.
  assert.equal(namesHeldEvents(text, badr)[0].name, 'Operation Badr (1973)');
  // And a full name still matches as a full name.
  assert.deepEqual(
    namesHeldEvents('the Afghan Civil War (1992–1996) began that spring',
      [{ id: 'a', names: ['Afghan Civil War (1992–1996)'] }]).map((n) => n.id),
    ['a'],
  );
});

// --- deviation 1480: two homonyms and the years that tell them apart --------

test('how far apart two spans are, and zero for spans that touch', () => {
  assert.equal(yearsApart({ start: 1631, end: 1631 }, { start: 1642, end: 1642 }), 11);
  assert.equal(yearsApart({ start: 1642, end: 1642 }, { start: 1631, end: 1631 }), 11);
  // Overlapping, containing and abutting spans are all nearness zero.
  assert.equal(yearsApart({ start: 1914, end: 1918 }, { start: 1917, end: 1917 }), 0);
  assert.equal(yearsApart({ start: 1939, end: 1945 }, { start: 1939, end: 1945 }), 0);
  // An open end is read as the start, and a span with no start says nothing.
  assert.equal(yearsApart({ start: 1973, end: null }, { start: 1973, end: null }), 0);
  assert.equal(yearsApart(null, { start: 1900, end: 1900 }), null);
  assert.equal(yearsApart({ start: null }, { start: 1900 }), null);
});

test('the same bare name naming two held events keeps the one the years fit', () => {
  // The strip of 1481 makes these two homonyms, which is exactly what 1480
  // warned about: the atlas holds both Breitenfelds.
  const both = [
    { id: 'battle-of-breitenfeld-1631', names: ['Battle of Breitenfeld (1631)'], when: { start: 1631, end: 1631 } },
    { id: 'battle-of-breitenfeld-1642', names: ['Battle of Breitenfeld (1642)'], when: { start: 1642, end: 1642 } },
  ];
  const text = 'the army withdrew towards the field of the Battle of Breitenfeld';
  // With no span to read, both are reported: the guard never guesses.
  assert.equal(namesHeldEvents(text, both).length, 2);
  // An article about 1642 means the 1642 one.
  assert.deepEqual(namesHeldEvents(text, both, { when: { start: 1642, end: 1642 } }).map((n) => n.id),
    ['battle-of-breitenfeld-1642']);
  assert.deepEqual(namesHeldEvents(text, both, { when: { start: 1631, end: 1632 } }).map((n) => n.id),
    ['battle-of-breitenfeld-1631']);

  // And the guard is narrow on purpose. A candidate nothing else answers to is
  // never dropped for its date, because an article about 1642 may name an event
  // of 1631 and that edge is what this atlas is for.
  const one = [{ id: 'thirty-years-war', names: ['Thirty Years War'], when: { start: 1618, end: 1648 } }];
  assert.deepEqual(
    namesHeldEvents('a consequence of the Thirty Years War', one, { when: { start: 1789, end: 1799 } })
      .map((n) => n.id),
    ['thirty-years-war'],
  );
  // Two homonyms where one carries no span at all: nothing is thrown away.
  const partial = [
    { id: 'a', names: ['Siege of Brieg (1741)'], when: { start: 1741, end: 1741 } },
    { id: 'b', names: ['Siege of Brieg (1642)'], when: null },
  ];
  assert.equal(namesHeldEvents('the Siege of Brieg', partial, { when: { start: 1642, end: 1642 } }).length, 2);
});
