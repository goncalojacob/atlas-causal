// A15(4) — the day and the month, in A7's comparison and at import time.
//
// `yearsInLead` reads years, and a record dated to one day beside a sentence
// saying *"fought on 27–28 May 1905"* contradicts its own article without
// either of them naming a different year. This is the arithmetic of reading
// that sentence, and of `span-vs-article-title` applied when the record is
// written rather than reported afterwards.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  datesInLead, datesOutsideLead, narrowerThanLead, firstSentence,
} from '../src/validate/rules.js';
import { spanFromTitle, TITLE_SPAN_FLAG } from '../tools/import/wikidata.mjs';

test('the three shapes a lead states a day range in', () => {
  // `27–28 May 1905`, days before the month.
  assert.deepEqual(datesInLead('fought on 27–28 May 1905 in the Tsushima Strait.'),
    { start: '1905-05-27', end: '1905-05-28', clause: '27–28 May 1905' });
  // `November 6–7, 1985`, the month first.
  assert.deepEqual(datesInLead('carried out in Bogotá, Colombia, on November 6–7, 1985, in which').start, '1985-11-06');
  // `from 8 March to 26 May 1977`, the only one that crosses a month.
  assert.deepEqual(datesInLead('lasting from 8 March to 26 May 1977.'),
    { start: '1977-03-08', end: '1977-05-26', clause: 'from 8 March to 26 May 1977' });
  // A year on each side of the range, both written out.
  assert.deepEqual(datesInLead('ran from 1 August 1944 to 2 October 1944 in Warsaw.'),
    { start: '1944-08-01', end: '1944-10-02', clause: 'from 1 August 1944 to 2 October 1944' });
});

test('one day is read as one day, and a sentence with no day as none', () => {
  assert.deepEqual(datesInLead('took place on 2 May 1808.'), { start: '1808-05-02', end: '1808-05-02', clause: 'on 2 May 1808' });
  assert.deepEqual(datesInLead('began on November 6, 1985, in Bogotá.').start, '1985-11-06');
  assert.equal(datesInLead('was a major World War II operation by the Polish underground resistance.'), null);
  assert.equal(datesInLead('across several days in March 1979.'), null);
  // A day that cannot exist is not a date.
  assert.equal(datesInLead('on 47 May 1808.'), null);
  // A range written backwards states nothing.
  assert.equal(datesInLead('on 28–27 May 1905.'), null);
});

test('a record inside the range its article states does not disagree with it', () => {
  const stated = { start: '1905-05-27', end: '1905-05-28' };
  assert.equal(datesOutsideLead(stated, { date: '1905-05-27', endDate: '1905-05-28' }), false);
  assert.equal(datesOutsideLead(stated, { date: '1905-05-28' }), false);
  assert.equal(datesOutsideLead(stated, { date: '1905-05-26' }), true);
  assert.equal(datesOutsideLead(stated, { date: '1905-05-27', endDate: '1905-06-01' }), true);
  // A `date` that is a month claims the month and is compared on it.
  assert.equal(datesOutsideLead(stated, { date: '1905-05' }), false);
  assert.equal(datesOutsideLead(stated, { date: '1905-06' }), true);
  // No `date` at all states no day.
  assert.equal(datesOutsideLead(stated, { start: 1905, end: 1905 }), false);
});

test('a sentence naming one day says nothing about a record that spans several', () => {
  // The 1982 Lebanon War "began on 6 June 1982" and ran to 1985; the French
  // Revolution's lead names 9 November 1799, which is its *end*. A lead naming
  // one day inside a longer record is naming one of its bounds and cannot say
  // which, so it is compared only against a record that also claims one day.
  const stated = { start: '1982-06-06', end: '1982-06-06' };
  assert.equal(datesOutsideLead(stated, { date: '1982-06-06', endDate: '1985-05-17' }), false);
  assert.equal(datesOutsideLead(stated, { date: '1982-06-07', endDate: '1985-05-17' }), false);
  // One day against one day is compared, and that is where it has teeth.
  assert.equal(datesOutsideLead(stated, { date: '1982-06-07' }), true);
  assert.equal(datesOutsideLead(stated, { date: '1982-06-06', endDate: '1982-06-06' }), false);
});

test('a record dated to one day where the article states a range is a gap', () => {
  const range = { start: '1905-05-27', end: '1905-05-28' };
  assert.equal(narrowerThanLead(range, { date: '1905-05-28', endDate: '1905-05-28' }), true);
  assert.equal(narrowerThanLead(range, { date: '1905-05-27', endDate: '1905-05-28' }), false);
  // One day stated against one day held is no gap.
  assert.equal(narrowerThanLead({ start: '1808-05-02', end: '1808-05-02' }, { date: '1808-05-02' }), false);
});

test('the title span is taken at import time, and a day outside it goes with it', () => {
  // The record the pass was written for: the item dates the siege from the
  // year the town was taken, the title names the siege's own years.
  assert.deepEqual(
    spanFromTitle({ start: 1521, end: 1524, date: '1521-10', endDate: '1524-04-29' }, 'Siege of Fuenterrabía (1523–1524)'),
    { when: { start: 1523, end: 1524, endDate: '1524-04-29' }, from: { start: 1523, end: 1524 } },
  );
  // A title stating nothing about its span changes nothing, and neither does
  // one that agrees.
  const agreeing = { start: 1995, end: 1998 };
  assert.deepEqual(spanFromTitle(agreeing, 'Insurgency in Kosovo (1995–1998)'), { when: agreeing, from: null });
  assert.deepEqual(spanFromTitle(agreeing, 'Battle of Tsushima'), { when: agreeing, from: null });
  // A title naming one year says nothing about an open end.
  assert.deepEqual(spanFromTitle({ start: 2011, end: null }, 'Syrian civil war (2011)').from, null);
  assert.equal(TITLE_SPAN_FLAG, 'span-from-title');
});

test('the fifteenth record is the one the first sentence cannot settle', () => {
  // Four of A15(4)'s fifteen have a first sentence that states no date at all,
  // so the pass refuses them rather than dating them from anywhere else.
  const warsaw = firstSentence('The Warsaw Uprising, sometimes referred to as the August Uprising, or the Battle of Warsaw, was a major World War II operation by the Polish underground resistance to liberate Warsaw from German occupation. The uprising began on 1 August 1944.');
  assert.equal(datesInLead(warsaw), null);
});

// Deviation 1528. Two of A15(4)'s three shapes have a US-order mirror —
// `27–28 May 1905` and `November 6–7, 1985` — and the third, the only one that
// crosses a month, has none. So `on October 1, 1814, to October 2, 1814` fell
// through to `ONE_DAY_US`, which matched its opening clause and read a two-day
// battle as one day: `battle-of-rancagua` was reported as contradicting a lead
// that in fact states the range the record was missing. This is not a fourth
// guess but the mirror the other two already have.
test('a range written month-first across two months is read as a range', () => {
  // The sentence the deviation was found on, verbatim from the cached lead.
  assert.deepEqual(datesInLead('The Battle of Rancagua, also known in Chile as the Disaster of Rancagua, occurred on October 1, 1814, to October 2, 1814, when the Spanish Army'),
    { start: '1814-10-01', end: '1814-10-02', clause: 'on October 1, 1814, to October 2, 1814' });
  // `from` reads the same way, with the year stated once or twice.
  assert.deepEqual(datesInLead('fought from August 31 to September 19, 1950.'),
    { start: '1950-08-31', end: '1950-09-19', clause: 'from August 31 to September 19, 1950' });
  assert.deepEqual(datesInLead('ran from December 31, 1950, to January 7, 1951.'),
    { start: '1950-12-31', end: '1951-01-07', clause: 'from December 31, 1950, to January 7, 1951' });
  // And the record it was found on is a gap and not a contradiction, which is
  // the whole of what the misreading got wrong.
  const stated = datesInLead('occurred on October 1, 1814, to October 2, 1814, when');
  assert.equal(datesOutsideLead(stated, { date: '1814-10-02' }), false);
  assert.equal(narrowerThanLead(stated, { date: '1814-10-02' }), true);
  // A range written backwards states no range. It falls back to the single day
  // its opening clause names, which is what `ONE_DAY_US` read there before this
  // shape existed: the mirror adds a reading and takes none away.
  assert.deepEqual(datesInLead('on October 2, 1814, to October 1, 1814.'),
    { start: '1814-10-02', end: '1814-10-02', clause: 'on October 2, 1814' });
});
