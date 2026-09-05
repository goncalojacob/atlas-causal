// "What did this lead to by year X?" — the state, the set the views light,
// and the panel's list. The traversal itself is graph.test.mjs; this is what
// sits between it and the four things that draw it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { defaultState } from '../src/state.js';
import { horizonSet, horizonResults, horizonYear, horizonBand } from '../src/horizon.js';
import { resolveHorizon, horizonIsOpen } from '../src/util/window.js';
import { shortestPaths, pathTo } from '../src/graph.js';
import { horizonHtml } from '../src/panel/horizon.js';
import { esc } from '../src/util/esc.js';
import { bounds } from '../src/util/dates.js';
import { atlasOf, ROOT } from './helpers.mjs';

const dataDir = path.join(ROOT, 'data');

const context = (atlas) => ({
  atlas,
  startYear: (event) => bounds(event.when.start).min,
  eventLink: (event) => esc(event.title),
});

const REVOLUTION = 'carnation-revolution-1974';

test('distance becomes three bands, not twenty steps of opacity', () => {
  assert.equal(horizonBand(1), 'near');
  assert.equal(horizonBand(2), 'mid');
  assert.equal(horizonBand(3), 'mid');
  assert.equal(horizonBand(4), 'far');
  assert.equal(horizonBand(11), 'far');
});

// The horizon is a graph query and a panel over it, and neither knows what
// the atlas was read out of. That it did not know was the whole of what H3b
// relied on, and it was asserted by running this suite twice (A12); the
// second build went with the topology file in H3c.
const atlas = await atlasOf(dataDir);
const ctx = context(atlas);

test("the horizon year is the reader's own, or the window's far end", async () => {
  assert.equal(horizonYear(atlas, defaultState()), atlas.extent.max);
  assert.equal(horizonYear(atlas, { ...defaultState(), to: 1980 }), 1980);
  assert.equal(horizonYear(atlas, { ...defaultState(), to: 1980, horizon: 2011 }), 2011, 'the chosen year wins');
  // Astronomical, like everything years are compared in: -44 is -43.
  assert.equal(resolveHorizon({ horizon: -44 }, null), -43);
  assert.equal(resolveHorizon({ horizon: null }, null), null);
});

test('the reachable set is lit only when a year and an event were chosen', async () => {
  assert.equal(horizonIsOpen(defaultState()), false);
  assert.equal(horizonIsOpen({ ...defaultState(), horizon: 2011 }), false, 'a year with nothing selected asks nothing');
  assert.equal(horizonIsOpen({ ...defaultState(), selected: REVOLUTION }), false, 'the default year is not a choice');
  assert.equal(horizonIsOpen({ ...defaultState(), selected: REVOLUTION, horizon: 2011 }), true);
  assert.equal(horizonSet(atlas, { ...defaultState(), selected: REVOLUTION }).size, 0);
  const open = horizonSet(atlas, { ...defaultState(), selected: REVOLUTION, horizon: 2011 });
  // 30 until M29 added Schengen 1995 and the CPLP 1996 downstream of the revolution.
  assert.equal(open.size, 32);
  assert.equal(open.get('constitution-1976'), 3);
  assert.equal(open.has(REVOLUTION), false, 'an event does not lead to itself');
  // An id that is not an event lights nothing rather than throwing.
  assert.equal(horizonSet(atlas, { ...defaultState(), selected: 'no-such-event', horizon: 2011 }).size, 0);
});

test('the panel lists what graph.js found, and each line walks to it', async () => {
  const state = { ...defaultState(), selected: REVOLUTION, horizon: 2011 };
  const event = atlas.events.get(REVOLUTION);
  const html = horizonHtml(ctx, { event, state });
  const results = horizonResults(atlas, state);
  assert.equal(results.length, 32);
  assert.equal((html.match(/data-action="horizon-walk"/g) ?? []).length, results.length);
  assert.match(html, /<summary>What did this lead to by <strong>2011<\/strong>\?\s*<span class="count">32<\/span>/);
  assert.match(html, /<details open>/, 'a chosen year opens the section');
  assert.match(html, /data-action="clear-horizon"/);
  // The brief's own example: choosing the constitution walks the shortest
  // path to it, which is the chain the panel sets.
  assert.match(html, /data-action="horizon-walk" data-id="constitution-1976"/);
  const edges = pathTo(shortestPaths(atlas.adjacency, REVOLUTION), 'constitution-1976');
  assert.deepEqual(edges.map((e) => e.id), results.find((r) => r.event.id === 'constitution-1976').edges.map((e) => e.id));
  assert.equal(edges.length, 3);
});

test('the default horizon is drawn closed and offers no way back', async () => {
  const state = { ...defaultState(), selected: REVOLUTION };
  const html = horizonHtml(ctx, { event: atlas.events.get(REVOLUTION), state });
  assert.match(html, /<details>/, 'the default year does not open the section');
  assert.doesNotMatch(html, /data-action="clear-horizon"/, 'there is nothing to clear');
  assert.match(html, new RegExp(`value="${atlas.extent.max}"`), 'the field starts at the window\'s far end');
});

test('an event that led to nothing by the year says so', async () => {
  const event = atlas.events.get(REVOLUTION);
  const html = horizonHtml(ctx, { event, state: { ...defaultState(), selected: REVOLUTION, horizon: 1900 } });
  assert.match(html, /Nothing this event leads to had begun by 1900/);
  assert.doesNotMatch(html, /horizon-walk/);
});
