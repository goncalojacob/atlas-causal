// M90 §6 — the chronology refusal against the sentences the fires actually
// read.
//
// A15(5) made the refusal code rather than a fire's judgement, and
// `tests/a15-chronology.test.mjs` holds the rule against sentences written to
// state it. This is the other half of the same question, and the one M90 needs
// before a writer on a smaller model is let near the corpus: **the sentences
// the curation fires met.** Twenty of them, taken out of
// `docs/m42-pool.md` and `docs/m42b-pool.md` — ten the fires refused as
// chronology with no claim in it, ten they accepted and wrote an edge from —
// with the pool section each came from named beside it.
//
// If `isChronologyOnly` ever disagrees with one of these, a writer would
// either write an edge off a sentence three fires refused by eye or refuse one
// the atlas already rests on. Both are regressions this file is here to catch.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isChronologyOnly, opensWithChronology, statesACause,
  CHRONOLOGY_OPENERS, CAUSAL_MARKERS,
} from '../tools/import/chronology.mjs';
import { normaliseQuote } from '../tools/queue/queue.mjs';

// Ten the fires refused: a chronological opener and no cause anywhere in the
// sentence. Every one of them says *when* something happened.
export const REFUSED = Object.freeze([
  // m42, the Libyan vein: the battle's own article placing the advance.
  'After the battle the town was firmly in loyalist hands and government troops advanced further east taking the towns of Brega and Ajdabiya and reaching Benghazi',
  // m42, the Lebanese Civil War batch — A15(5) refused this one at the point
  // of writing, which is the case the rule exists for.
  'After the Lebanese Front militias took control of the Karantina district, the Tel al-Zaatar refugee camp was besieged for five months, ending in the Tel al-Zaatar massacre.',
  // m42b, the Italian Wars.
  "After the French defeats at Novara (6 June) and Guinegatte (16 August), Louis XII anticipated a counter-attack by the Imperial armies on France's own soil.",
  // m42, the Thirty Years' War.
  'After the Swedish defeat at Nördlingen in 1634, many protestant princes lost faith in their alliance with Sweden and reconciled with the emperor.',
  // m42, the War of the Austrian Succession.
  'After the decisive defeat in the Battle of Pfaffenhofen on 15 April, Maximilian Joseph chose for peace.',
  // m42, the Portuguese wars in Angola.
  'After the siege, the Ngola warriors sought to make peace',
  // m42b, Saint-Domingue.
  'Following an attempted push back to Port-de-Paix, British General John Whitelocke decides to attack the Fortress of Acul',
  // m42, the Sudanese vein.
  'Following the rebel retreat, momentum of the rebels slowed down',
  // m42b, the American Revolutionary War in the Gulf.
  'Following these successes, he began planning operations against Mobile and Pensacola',
  // m42b, King Philip's War.
  'In the aftermath of the Siege of Brookfield the New England Confederation raised several companies of English militia',
]);

// Ten they accepted and wrote an edge from. Two of them are the pair A15(5)
// names — a chronological opener that **does** state a cause — and they are
// here on purpose: the opener alone must never be the refusal.
export const ACCEPTED = Object.freeze([
  // The Arab Spring's own lead.
  'It began in Tunisia in response to the death of Mohamed Bouazizi by self-immolation.',
  // The Wuchang Uprising's.
  'Some historians believe that the uprising was a direct cause of the Wuchang Uprising, which eventually led to the 1911 Revolution and the founding of the Republic of China.',
  // The closure of the Suez Canal.
  'The closure of the Suez Canal from November 1956 to April 1957 was caused by the Second Arab–Israeli war, also known as the Suez Crisis, in 1956.',
  // The Rhodesian Bush War's.
  'as a result of Rhodesian aid and support for RENAMO, the Rhodesian Bush War also helped influence the outbreak of the Mozambican Civil War',
  // The Indo-Pakistani war of 1971.
  'The Indo-Pakistani conflict was sparked by the Bangladesh Liberation War, which was a result of the violation of the rights of East Pakistan by the Pakistan Army.',
  // The Russo-Japanese War's.
  'The loss of the war in 1905 led to major political unrest in Imperial Russia',
  // The First Libyan Civil War's.
  'As the Arab Spring caused revolutions in Tunisia and Egypt, which both border Libya, Gaddafi was reportedly still in full control',
  // The Ituri conflict's.
  'was largely set off by the Second Congo War, which had led to increased ethnic consciousness, a large supply of small arms, and the formation of various armed groups',
  // The Battle of Shanghai's lead, which deviation 1471 is about.
  'These conflicts finally escalated in July 1937, when the Marco Polo Bridge Incident triggered a full-scale war between the two countries.',
  // A15(5)'s first name: a `Following` that states a cause in as many words.
  'Following the dissolution of the Soviet Union in December 1991, all support to the Democratic Republic was stopped, leading to the toppling of the government by the mujahideen in 1992 and the start of a second Afghan Civil War (1992–1996).',
  // And its second: an `In the aftermath` that states one.
  'In the aftermath of World War I, Greece fought against Turkish nationalists led by Mustafa Kemal, a war that eventually resulted in a massive population exchange between the two countries under the Treaty of Lausanne.',
]);

test('the ten sentences the fires refused as chronology are refused by the rule', () => {
  for (const quote of REFUSED) {
    assert.equal(isChronologyOnly(quote), true, `should be refused: ${quote.slice(0, 70)}…`);
    // And for the right reason, both halves: the opener is there and no cause
    // is. A sentence refused for the wrong half would pass this file and fail
    // the next one that reads it.
    assert.equal(opensWithChronology(quote), true, quote.slice(0, 50));
    assert.equal(statesACause(quote), false, quote.slice(0, 50));
  }
  assert.ok(REFUSED.length >= 10);
});

test('the sentences the fires accepted and wrote an edge from are not refused', () => {
  for (const quote of ACCEPTED) {
    assert.equal(isChronologyOnly(quote), false, `should be kept: ${quote.slice(0, 70)}…`);
    assert.equal(statesACause(quote), true, quote.slice(0, 50));
  }
  assert.ok(ACCEPTED.length >= 10);
  // Two of them open on chronology and are kept anyway, which is the whole of
  // A15(5)'s second sentence: the opener is not the refusal, the absence of a
  // cause is.
  const openers = ACCEPTED.filter((q) => opensWithChronology(q));
  assert.equal(openers.length, 2, 'the two A15(5) names');
  for (const quote of openers) assert.equal(isChronologyOnly(quote), false);
});

test('the refusal survives the writer\'s own fold, which is what it is asked through', () => {
  // The writer verifies the quote against a revision's plain text and then
  // asks A15(5) of the quote it was given, so the two have to agree about the
  // same sentence written either way: curly quotes, an en dash, a soft hyphen
  // and a line break are not the difference between a cause and an order.
  const bent = (quote) => quote
    .replace(/'/g, '’')
    .replace(/ - /g, ' — ')
    .replace(/^(\w{4})/, '$1­')
    .replace(/, /, ',\n  ');
  for (const quote of REFUSED) {
    assert.equal(isChronologyOnly(normaliseQuote(bent(quote))), true, quote.slice(0, 50));
  }
  for (const quote of ACCEPTED) {
    assert.equal(isChronologyOnly(normaliseQuote(bent(quote))), false, quote.slice(0, 50));
  }
  // **Through the fold and not around it.** `tidy()` of chronology.mjs folds
  // the dashes, the quotes and the whitespace but not the soft hyphen, which
  // is a character in the text and nothing on the page — so a sentence that
  // carries one inside its own opener is not seen as opening on chronology at
  // all. That is why `verdictForEdge` asks A15(5) of the normalised quote and
  // never of the characters typed, and this is the assertion that says so.
  assert.equal(isChronologyOnly('Af\u00adter the siege, the warriors sought peace and the roads were repaired.'), false);
  assert.equal(isChronologyOnly(normaliseQuote('Af\u00adter the siege, the warriors sought peace and the roads were repaired.')), true);
});

test('the class is the four openers and the markers those fires accepted, and nothing a run may widen', () => {
  // A class a fire can widen is a class nobody can count (A15(5)). The four
  // are asserted here because the writer's refusal count is read against
  // them, batch after batch: a fifth opener added quietly would move every
  // number in the log without anybody deciding to.
  assert.deepEqual([...CHRONOLOGY_OPENERS], ['after', 'following', 'in the aftermath', 'shortly after']);
  assert.equal(CAUSAL_MARKERS.length, 30);
  for (const marker of CAUSAL_MARKERS) assert.equal(marker, marker.toLowerCase());
  // Deviation 1470, written down and not fixed: a marker an adverb has split
  // is not seen. It is here as a test of what is true, not of what is wanted,
  // so the day somebody widens the class on purpose this line is what they
  // have to change.
  assert.equal(statesACause('Following the incident, it led directly to the collapse'), false);
  assert.equal(statesACause('Following the incident, it led to the collapse'), true);
});
