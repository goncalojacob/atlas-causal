// narratives.html: the period a narrative is about, the centuries it crosses,
// and the page that arranges them. Pure — the markup is a function of the
// records — so all of it is held here without a browser, as the bibliography
// is; tests/narratives-browser.test.mjs opens the page itself.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  periodOf, centuryOf, centuriesOf, centuryLabel, formatPeriod, groupByCentury, narrativesHtml,
} from '../src/narratives/list.js';
import { buildIndex } from '../tools/build-index.mjs';
import { expandSpine } from '../src/data.js';
import { FIXTURE_DATA, ROOT } from './helpers.mjs';

// `null` is the repository's own index, read as the page reads it: the spine
// expanded back into lists, which is what loadNarratives hands this module.
// Anything else is a data directory the index is built from.
async function topologyOf(dir) {
  if (dir === null) {
    const manifest = JSON.parse(await readFile(path.join(ROOT, 'data', 'index', 'manifest.json'), 'utf8'));
    return expandSpine(JSON.parse(await readFile(path.join(ROOT, 'data', manifest.files.spine), 'utf8')));
  }
  return (await buildIndex(dir)).topology;
}

function recordsOf(topology) {
  return {
    events: new Map(topology.events.map((e) => [e.id, e])),
    edges: new Map(topology.edges.map((e) => [e.id, e])),
  };
}

test('a century is counted the way years are, with no year 0 and no century 0', () => {
  assert.equal(centuryOf(1961), 20);
  assert.equal(centuryOf(1901), 20);
  assert.equal(centuryOf(1900), 19, '1900 is the last year of the 19th century');
  assert.equal(centuryOf(1415), 15);
  assert.equal(centuryOf(1), 1);
  assert.equal(centuryOf(-1), -1, '1 BCE is in the 1st century BCE');
  assert.equal(centuryOf(-100), -1);
  assert.equal(centuryOf(-101), -2);

  assert.equal(centuryLabel(20), 'The 20th century');
  assert.equal(centuryLabel(21), 'The 21st century');
  assert.equal(centuryLabel(22), 'The 22nd century');
  assert.equal(centuryLabel(23), 'The 23rd century');
  assert.equal(centuryLabel(11), 'The 11th century', 'eleven is not "eleventh-first"');
  assert.equal(centuryLabel(12), 'The 12th century');
  assert.equal(centuryLabel(13), 'The 13th century');
  assert.equal(centuryLabel(-1), 'The 1st century BCE');

  assert.deepEqual(centuriesOf({ from: 1961, to: 1975 }), [20]);
  assert.deepEqual(centuriesOf({ from: 1580, to: 1640 }), [16, 17], 'an account across a boundary is in both');
  assert.deepEqual(centuriesOf({ from: -50, to: 50 }), [-1, 1], 'and there is no century 0 to cross');
  assert.deepEqual(centuriesOf(null), []);
});

test('a period is the years of the records walked, and a step on a link is its far end', async () => {
  const topology = await topologyOf(FIXTURE_DATA);
  const records = recordsOf(topology);
  const narrative = topology.narratives.find((n) => n.id === 'fixture-narrative-one');

  // The walk is A, then three links; a link's step arrives at its `to`, so
  // the period runs from A's year to the last event arrived at.
  assert.deepEqual(periodOf(narrative, records), { from: 1200, to: 1280 });
  assert.equal(formatPeriod({ from: 1200, to: 1280 }), '1200–1280');
  assert.equal(formatPeriod({ from: 1200, to: 1200 }), '1200');
  assert.equal(formatPeriod({ from: -50, to: 50 }), '50 BCE–50');
  assert.equal(formatPeriod(null), 'no dated record');

  // A narrative whose refs resolve to nothing has no period, and is not a
  // crash: the page still lists it.
  assert.equal(periodOf({ steps: [{ ref: 'nothing-at-all' }] }, records), null);
  assert.equal(periodOf({ steps: [] }, records), null);
});

test('the fixture narrative crosses two centuries and is listed under both', async () => {
  const topology = await topologyOf(FIXTURE_DATA);
  const records = recordsOf(topology);
  const groups = groupByCentury(topology.narratives, records);

  assert.deepEqual(groups.map((g) => g.label), ['The 12th century', 'The 13th century']);
  for (const group of groups) {
    assert.deepEqual(group.cards.map((c) => c.narrative.id), ['fixture-narrative-one']);
  }

  const markup = narrativesHtml(topology.narratives, records);
  assert.match(markup, /The 12th century/);
  assert.match(markup, /The 13th century/);
  assert.match(markup, /1200–1280/);
  assert.match(markup, /4 steps/);
  assert.match(markup, /Fixture Author/);
  // The card opens the account at its first step, which is what the page is
  // for; step 0 is step one, as the URL has counted since M12.
  assert.match(markup, /index\.html\?narrative=fixture-narrative-one&amp;step=0/);
  assert.match(markup, /an account that crosses two listed under both/);
});

test('the one narrative in data/ is listed, with its narrator and its years', async () => {
  const topology = await topologyOf(null);
  const records = recordsOf(topology);
  assert.equal(topology.narratives.length, 1, 'the dataset has one narrative');

  const groups = groupByCentury(topology.narratives, records);
  assert.deepEqual(groups.map((g) => g.label), ['The 20th century']);
  const [card] = groups[0].cards;
  assert.equal(card.narrative.id, 'how-the-colonial-war-ended-the-regime');
  assert.deepEqual(card.period, { from: 1961, to: 1975 });
  assert.equal(card.narrative.steps.length, 12);

  const markup = narrativesHtml(topology.narratives, records);
  assert.match(markup, /1 narrative,\s+arranged by the centuries they cross\./);
  assert.match(markup, /How the colonial war ended the regime/);
  assert.match(markup, /1961–1975/);
  assert.match(markup, /12 steps/);
  assert.match(markup, /Claude \(assistant draft, unreviewed\)/, 'the narrator, unhidden');
});

test('order, escaping and the empty case', () => {
  const events = new Map([
    ['e1', { id: 'e1', when: { start: 1610, end: 1610 } }],
    ['e2', { id: 'e2', when: { start: 1650, end: 1650 } }],
    ['e3', { id: 'e3', when: { start: 1620, end: 1620 } }],
  ]);
  const records = { events, edges: new Map() };
  const one = { id: 'later', status: 'active', title: 'Later', summary: '', authors: [{ name: 'B' }], steps: [{ ref: 'e3' }, { ref: 'e2' }] };
  const two = { id: 'earlier', status: 'active', title: 'Earlier', summary: '', authors: [{ name: 'A' }], steps: [{ ref: 'e1' }, { ref: 'e2' }] };
  const gone = { id: 'gone', status: 'retracted', title: 'Retracted', summary: '', authors: [], steps: [{ ref: 'e1' }] };

  const groups = groupByCentury([one, two, gone], records);
  assert.equal(groups.length, 1, 'both are inside the 17th century');
  assert.deepEqual(groups[0].cards.map((c) => c.narrative.id), ['earlier', 'later'],
    'the earlier account first, so two accounts of the same years read in order');
  assert.equal(groups[0].cards.length, 2, 'a retracted narrative is not listed');

  // Record text is untrusted input wherever it is drawn (CLAUDE.md).
  const nasty = narrativesHtml([{ ...two, title: '<script>x</script>', summary: 'a & b' }], records);
  assert.equal(nasty.includes('<script>'), false);
  assert.match(nasty, /&lt;script&gt;/);
  assert.match(nasty, /a &amp; b/);

  assert.match(narrativesHtml([], records), /No narrative has been written yet/);
  assert.match(narrativesHtml([gone], records), /No narrative has been written yet/);
  // An unsigned account says so rather than showing an empty line.
  assert.match(narrativesHtml([{ ...two, authors: [] }], records), /unsigned/);
});
