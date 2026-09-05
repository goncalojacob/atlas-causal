import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  consequences, antecedents, ancestors, descendants, convergence,
  compareEdges, shortestPaths, pathTo, reachableBy,
} from '../src/graph.js';
import { atlasOf, FIXTURE_DATA, ROOT } from './helpers.mjs';

const ids = (list) => list.map((x) => x.event.id);

// The graph is the one thing the whole project is for, and its answers come
// out of the spine's five-slot edge tuple like any other: the fifth slot is
// `status`, which is what keeps a retracted argument out of them (A2).
const adjacencyIn = async (dataDir) => (await atlasOf(dataDir)).adjacency;

test('adjacency ignores retracted edges and keeps tombstones without edges', async () => {
  const adj = await adjacencyIn(FIXTURE_DATA);
  assert.equal(adj.edges.has('fixture-event-e--fixture-event-t--inspired'), true, 'retracted edge still resolves');
  assert.equal(adj.out.get('fixture-event-e').some((e) => e.to === 'fixture-event-t'), false, 'but is not walkable');
  assert.deepEqual(adj.out.get('fixture-event-m'), []);
  assert.equal(adj.events.get('fixture-event-m').status, 'merged');
});

test('consequences and antecedents are direct and ordered by type, then confidence', async () => {
  const adj = await adjacencyIn(FIXTURE_DATA);
  assert.deepEqual(ids(consequences(adj, 'fixture-event-a')), ['fixture-event-b', 'fixture-event-a2']);
  const into = antecedents(adj, 'fixture-event-t');
  assert.deepEqual(into.map((x) => `${x.edge.type}/${x.edge.confidence}:${x.event.id}`), [
    'caused/probable:fixture-event-d',
    'caused/disputed:fixture-event-g',
    'reacted-to/probable:fixture-event-f',
    'precondition-of/consensus:fixture-event-c',
  ]);
  assert.deepEqual(consequences(adj, 'fixture-event-h'), []);
});

test('ancestors and descendants are transitive and exclude the start', async () => {
  const adj = await adjacencyIn(FIXTURE_DATA);
  assert.deepEqual([...ancestors(adj, 'fixture-event-t')].sort(), [
    'fixture-event-a', 'fixture-event-b', 'fixture-event-c', 'fixture-event-d',
    'fixture-event-e', 'fixture-event-f', 'fixture-event-g', 'fixture-event-o',
  ]);
  assert.deepEqual([...descendants(adj, 'fixture-event-a')].sort(), [
    'fixture-event-a2', 'fixture-event-b', 'fixture-event-d', 'fixture-event-t',
  ]);
});

test('convergence excludes only the walked path and reaches through it', async () => {
  const adj = await adjacencyIn(FIXTURE_DATA);
  const path1 = ['fixture-event-a', 'fixture-event-b', 'fixture-event-d', 'fixture-event-t'];
  const r1 = convergence(adj, 'fixture-event-t', path1);
  assert.deepEqual(ids(r1).sort(), ['fixture-event-c', 'fixture-event-e', 'fixture-event-f', 'fixture-event-g', 'fixture-event-o']);
  for (const id of path1) assert.equal(ids(r1).includes(id), false);
  const byId = Object.fromEntries(r1.map((x) => [x.event.id, x]));
  assert.equal(byId['fixture-event-c'].to.id, 'fixture-event-t');
  assert.equal(byId['fixture-event-c'].depth, 1);
  assert.equal(byId['fixture-event-e'].to.id, 'fixture-event-c');
  assert.equal(byId['fixture-event-e'].depth, 2);
  assert.equal(byId['fixture-event-o'].depth, 3);

  // Starting the walk at B: A is not on the path, feeds B (which is), and
  // so is reported — the walked path is excluded, not the start's ancestry.
  const r2 = convergence(adj, 'fixture-event-t', ['fixture-event-b', 'fixture-event-d', 'fixture-event-t']);
  const a = r2.find((x) => x.event.id === 'fixture-event-a');
  assert.ok(a);
  assert.equal(a.to.id, 'fixture-event-b');
  assert.equal(ids(r2).includes('fixture-event-a2'), false, 'not an ancestor');

  // No path: every ancestor.
  assert.equal(convergence(adj, 'fixture-event-t').length, 8);
  assert.deepEqual(convergence(adj, 'fixture-event-a'), []);
});

test('convergence results are ordered by type, confidence, then depth', async () => {
  const adj = await adjacencyIn(FIXTURE_DATA);
  const r = convergence(adj, 'fixture-event-t', ['fixture-event-a', 'fixture-event-b', 'fixture-event-d', 'fixture-event-t']);
  const order = r.map((x) => `${x.edge.type}/${x.edge.confidence}`);
  assert.deepEqual(order, [
    'caused/disputed', // g → t
    'enabled/probable', // o → e (depth 3)
    'reacted-to/probable', // f → t
    'precondition-of/consensus', // c → t
    'inspired/probable', // e → c
  ]);
  const sorted = [...r].sort((x, y) => compareEdges(x.edge, y.edge) || x.depth - y.depth);
  assert.deepEqual(sorted, r);
});

// --- "what did this lead to by year X?" -----------------------------------

test('the shortest path outward is by hops, and it is the same path twice', async () => {
  const adj = await adjacencyIn(FIXTURE_DATA);
  const best = shortestPaths(adj, 'fixture-event-a');
  assert.deepEqual([...best.keys()].sort(), ['fixture-event-a2', 'fixture-event-b', 'fixture-event-d', 'fixture-event-t']);
  assert.equal(best.get('fixture-event-b').depth, 1);
  assert.equal(best.get('fixture-event-d').depth, 2);
  assert.equal(best.get('fixture-event-t').depth, 3);
  assert.deepEqual(pathTo(best, 'fixture-event-t').map((e) => e.id), [
    'fixture-event-a--fixture-event-b--caused',
    'fixture-event-b--fixture-event-d--enabled',
    'fixture-event-d--fixture-event-t--caused',
  ]);
  assert.deepEqual(pathTo(best, 'fixture-event-a'), [], 'the start is not reachable from itself');
  assert.deepEqual(pathTo(best, 'fixture-event-h'), [], 'nor is what it does not reach');
  // Deterministic: the tree does not depend on the order the walk met things.
  const again = shortestPaths(adj, 'fixture-event-a');
  assert.deepEqual([...again].map(([id, s]) => [id, s.depth, s.edge.id]), [...best].map(([id, s]) => [id, s.depth, s.edge.id]));
  // A retracted edge is not a step: e reaches t only through c.
  assert.equal(shortestPaths(adj, 'fixture-event-e').get('fixture-event-t').depth, 2);
});

test('the horizon cuts what is reported, ordered by path length then year', async () => {
  const adj = await adjacencyIn(FIXTURE_DATA);
  const all = reachableBy(adj, 'fixture-event-a', 9999);
  assert.deepEqual(all.map((r) => `${r.depth}:${r.event.id}`), [
    '1:fixture-event-a2', '1:fixture-event-b', '2:fixture-event-d', '3:fixture-event-t',
  ]);
  assert.deepEqual(reachableBy(adj, 'fixture-event-a', 1240).map((r) => r.event.id), [
    'fixture-event-a2', 'fixture-event-b', 'fixture-event-d',
  ]);
  assert.deepEqual(reachableBy(adj, 'fixture-event-a', 1219).map((r) => r.event.id), ['fixture-event-a2']);
  assert.deepEqual(reachableBy(adj, 'fixture-event-a', 1199), []);
  // Everything reachable is reported at a horizon past the data, and nothing
  // else: the same set descendants() gives.
  assert.deepEqual(new Set(all.map((r) => r.event.id)), descendants(adj, 'fixture-event-a'));
  assert.deepEqual(reachableBy(adj, 'fixture-event-h', 9999), [], 'an event with no consequences leads nowhere');
});

test('each result carries the first step of its path and whether any step is disputed', async () => {
  const adj = await adjacencyIn(FIXTURE_DATA);
  const byId = Object.fromEntries(reachableBy(adj, 'fixture-event-a', 9999).map((r) => [r.event.id, r]));
  assert.equal(byId['fixture-event-t'].first.id, 'fixture-event-a--fixture-event-b--caused');
  assert.equal(byId['fixture-event-t'].last.id, 'fixture-event-d--fixture-event-t--caused');
  assert.equal(byId['fixture-event-t'].first.type, 'caused');
  assert.equal(byId['fixture-event-t'].first.confidence, 'consensus');
  assert.equal(byId['fixture-event-t'].disputed, false);
  assert.equal(byId['fixture-event-t'].edges.length, 3);
  // g → t is the only disputed edge, and g leads nowhere else.
  const fromG = reachableBy(adj, 'fixture-event-g', 9999);
  assert.deepEqual(fromG.map((r) => [r.event.id, r.disputed]), [['fixture-event-t', true]]);
});

// The brief's own example, on the records in the repository rather than on
// fixtures: what 25 April had led to by 2011, and the path to the
// constitution that the panel hands the reader as a chain.
test('25 April, horizon 2011, on the repository dataset', async () => {
  const adj = await adjacencyIn(path.join(ROOT, 'data'));
  const list = reachableBy(adj, 'carnation-revolution-1974', 2011);
  // 30 until M29 added Schengen 1995 and the CPLP 1996, both downstream of
  // the revolution and both before the horizon.
  assert.equal(list.length, 32);
  assert.equal(list.filter((r) => r.depth === 1).length, 8);
  // Every one of them has begun by the horizon, and none of them is the
  // event itself.
  for (const r of list) {
    assert.ok(r.edges.length === r.depth && r.edges[0] === r.first);
    assert.notEqual(r.event.id, 'carnation-revolution-1974');
  }
  assert.ok(reachableBy(adj, 'carnation-revolution-1974', 2025).length > list.length, 'a later horizon reaches further');
  const constitution = list.find((r) => r.event.id === 'constitution-1976');
  assert.ok(constitution, 'the constitution is downstream of the revolution');
  assert.deepEqual(constitution.edges.map((e) => e.id), [
    'carnation-revolution-1974--constituent-assembly-election-1975--caused',
    'constituent-assembly-election-1975--25-november-1975--enabled',
    '25-november-1975--constitution-1976--enabled',
  ]);
  // The chain the panel sets is a walkable path: each step starts where the
  // one before it ended.
  let at = 'carnation-revolution-1974';
  for (const edge of constitution.edges) {
    assert.equal(edge.from, at);
    at = edge.to;
  }
  assert.equal(at, 'constitution-1976');
});

test('the convergence query is answered once for the same target and walk', async () => {
  const adj = await adjacencyIn(FIXTURE_DATA);
  const first = convergence(adj, 'fixture-event-t', ['fixture-event-d']);
  assert.equal(convergence(adj, 'fixture-event-t', ['fixture-event-d']), first, 'one answer, shared');
  // A different walk excludes different branches and is a different question.
  const other = convergence(adj, 'fixture-event-t', []);
  assert.notEqual(other, first);
  assert.ok(other.length >= first.length, 'excluding less reports at least as much');
  // Nothing that reads the shared list may write to it, so it is the same
  // list in the same order every time it is handed out.
  assert.deepEqual(convergence(adj, 'fixture-event-t', []).map((b) => b.edge.id), other.map((b) => b.edge.id));
});
