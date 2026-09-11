// "What did this lead to by year X?" — the state, the set the views light,
// and the panel's list. The traversal itself is graph.test.mjs; this is what
// sits between it and the four things that draw it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { defaultState } from '../src/state.js';
import {
  horizonSet, horizonResults, horizonYear, horizonBand, rankByCost, RANKED,
} from '../src/horizon.js';
import { resolveHorizon, horizonIsOpen } from '../src/util/window.js';
import {
  shortestPaths, pathTo, stepCost, pathCost, convergence, convergenceByDepth, reachableBy,
} from '../src/graph.js';
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
  // 30 until M29 added Schengen 1995 and the CPLP 1996 downstream of the
  // revolution; 32 until the merge of `world` brought M41b's `crisis-portugal`,
  // which is the only thing that reaches the two elections of 2011.
  assert.equal(open.size, 35);
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
  assert.equal(results.length, 35);
  assert.equal((html.match(/data-action="horizon-walk"/g) ?? []).length, results.length);
  assert.match(html, /<summary>What did this lead to by <strong>2011<\/strong>\?\s*<span class="count">35<\/span>/);
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

// --- what H4c changed: one walk per state change, and a path only when read

test('the same question is answered once, and the answer is the same list', async () => {
  const state = { ...defaultState(), selected: REVOLUTION, horizon: 2011 };
  // A second state that says the same thing: the key is the event and the
  // year, not the object the caller happens to be holding.
  const again = { ...defaultState(), selected: REVOLUTION, horizon: 2011 };
  const first = horizonResults(atlas, state);
  assert.equal(horizonResults(atlas, again), first, 'the four askers share one list');
  // And a different year is a different question, answered on its own.
  const later = horizonResults(atlas, { ...state, horizon: 2025 });
  assert.notEqual(later, first);
  assert.ok(later.length > first.length);
  // The memo is per graph. A second atlas built from the same records is a
  // different adjacency and gets its own answer, with the same content.
  const other = await atlasOf(dataDir);
  const elsewhere = horizonResults(other, state);
  assert.notEqual(elsewhere, first);
  assert.deepEqual(elsewhere.map((r) => r.event.id), first.map((r) => r.event.id));
});

test('the path of a row is built when it is read and not before', async () => {
  const state = { ...defaultState(), selected: REVOLUTION, horizon: 2025 };
  const results = horizonResults(atlas, state);
  const best = shortestPaths(atlas.adjacency, REVOLUTION);
  for (const found of results) {
    // Every one of the four derived fields is the walk up the tree, however
    // many times it is asked for.
    const edges = pathTo(best, found.event.id);
    assert.deepEqual(found.edges.map((e) => e.id), edges.map((e) => e.id));
    assert.equal(found.edges, found.edges, 'built once and kept');
    assert.equal(found.first, edges[0] ?? null);
    assert.equal(found.last, edges[edges.length - 1] ?? null);
    assert.equal(found.disputed, edges.some((e) => e.confidence === 'disputed'));
    assert.equal(found.edges.length, found.depth, 'the path is as long as the depth');
  }
});

// --- what H7 changed: ranking as an ordering, never as a different walk ----

test('a step costs its confidence first and its type second', () => {
  const step = (type, confidence) => stepCost({ type, confidence });
  // Confidence dominates by construction: every disputed step is dearer than
  // every probable one, whatever the two types are.
  assert.ok(step('inspired', 'consensus') < step('caused', 'probable'));
  assert.ok(step('inspired', 'probable') < step('caused', 'disputed'));
  // And within one confidence the declared order of the types breaks it.
  assert.ok(step('caused', 'consensus') < step('enabled', 'consensus'));
  assert.ok(step('enabled', 'consensus') < step('inspired', 'consensus'));
  assert.equal(step('caused', 'consensus'), 0);
  // The review's own case: a consensus `caused` path beats a disputed
  // `inspired` one of the same length.
  const good = pathCost([{ type: 'caused', confidence: 'consensus' }, { type: 'caused', confidence: 'consensus' }]);
  const bad = pathCost([{ type: 'inspired', confidence: 'disputed' }, { type: 'inspired', confidence: 'disputed' }]);
  assert.ok(good < bad);
  // A type or a confidence this file has never heard of is not free.
  assert.ok(stepCost({ type: 'invented', confidence: 'certain' }) > step('inspired', 'probable'));
});

test('the horizon list is ordered by what the path cost, and the chain is not', async () => {
  const state = { ...defaultState(), selected: REVOLUTION, horizon: 2011 };
  const results = horizonResults(atlas, state);
  // Ordered by cost, and never decreasing down the list.
  const costs = results.map((r) => pathCost(r.edges));
  for (let i = 1; i < Math.min(costs.length, RANKED); i += 1) {
    assert.ok(costs[i - 1] <= costs[i], `row ${i} costs no less than the one above it`);
  }
  // It is the *same answer*, re-ordered: the same events, no more and no fewer.
  const raw = reachableBy(atlas.adjacency, REVOLUTION, 2011);
  assert.deepEqual(results.map((r) => r.event.id).sort(), raw.map((r) => r.event.id).sort());
  // And the chain each row hands the reader is untouched: `shortestPaths` is
  // by hops and stays by hops (plan decision 6, review finding 21).
  const best = shortestPaths(atlas.adjacency, REVOLUTION);
  for (const row of results) {
    assert.deepEqual(row.edges.map((e) => e.id), pathTo(best, row.event.id).map((e) => e.id));
  }
});

test('ranking re-orders the head of the answer and leaves the tail as it found it', () => {
  const row = (id, edges) => ({ event: { id }, depth: edges.length, edges });
  const cheap = [{ type: 'caused', confidence: 'consensus' }];
  const dear = [{ type: 'inspired', confidence: 'disputed' }];
  const list = [row('a', dear), row('b', cheap), row('c', dear), row('d', cheap)];
  assert.deepEqual(rankByCost(list).map((r) => r.event.id), ['b', 'd', 'a', 'c']);
  // Equal cost keeps the order the answer was found in.
  assert.deepEqual(rankByCost([row('x', cheap), row('y', cheap)]).map((r) => r.event.id), ['x', 'y']);
  // Past the window nothing is re-ordered, and nothing is lost either.
  const ranked = rankByCost(list, { window: 2 });
  assert.deepEqual(ranked.map((r) => r.event.id), ['b', 'a', 'c', 'd']);
  assert.equal(rankByCost([]).length, 0);
});

test('convergence in tiers is the same branches, grouped by how far up', async () => {
  const walked = ['carnation-revolution-1974', 'constituent-assembly-election-1975'];
  const rows = convergence(atlas.adjacency, 'constituent-assembly-election-1975', walked);
  const tiers = convergenceByDepth(rows);
  assert.ok(tiers.length >= 1);
  assert.deepEqual(tiers.map((t) => t.depth), [...tiers.map((t) => t.depth)].sort((a, b) => a - b));
  assert.equal(tiers.reduce((n, t) => n + t.count, 0), rows.length, 'every branch is in exactly one tier');
  assert.deepEqual(
    tiers.flatMap((t) => t.rows).map((r) => r.event.id).sort(),
    rows.map((r) => r.event.id).sort(),
  );
  for (const tier of tiers) {
    assert.equal(tier.rows.length, tier.count);
    for (const r of tier.rows) assert.equal(r.depth, tier.depth);
    const costs = tier.rows.map((r) => stepCost(r.edge));
    for (let i = 1; i < costs.length; i += 1) assert.ok(costs[i - 1] <= costs[i]);
  }
  assert.deepEqual(convergenceByDepth([]), []);
});

// R18: the hint said the list was ordered best-supported first, of the whole
// list. `rankByCost` re-orders the first RANKED rows and leaves the rest in
// the order they were found — which is the right trade (ranking a row costs
// the walk that reconstructs its path) and was not what the card said.
test('the hint says how much of the list is ranked, and only claims that much', async () => {
  const state = { ...defaultState(), selected: REVOLUTION, horizon: 2011 };
  const short = horizonHtml(ctx, { event: atlas.events.get(REVOLUTION), state });
  assert.ok(horizonResults(atlas, state).length < RANKED, 'the atlas answers in fewer rows than the window');
  assert.match(short, /Ordered\s+best-supported first/);
  assert.doesNotMatch(short, /the first \d+ are ordered/i, 'with nothing unranked, nothing is said about it');

  // Nothing in the atlas is longer than the window today, so what the longer
  // sentence would say is asserted on the template itself rather than on a
  // synthetic answer the card would have to be lied to about.
  const source = await readFile(path.join(ROOT, 'src', 'panel', 'horizon.js'), 'utf8');
  assert.match(source, /The first \$\{RANKED\} are ordered/, 'the card names the number when there is a rest');
  assert.match(source, /the rest in the order they were found/);
});
