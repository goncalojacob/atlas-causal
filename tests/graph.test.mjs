import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildAdjacency, consequences, antecedents, ancestors, descendants, convergence, compareEdges } from '../src/graph.js';
import { FIXTURE_DATA } from './helpers.mjs';

async function fixtureAdjacency() {
  const manifest = JSON.parse(await readFile(path.join(FIXTURE_DATA, 'index', 'manifest.json'), 'utf8'));
  const topology = JSON.parse(await readFile(path.join(FIXTURE_DATA, manifest.files.topology), 'utf8'));
  return buildAdjacency(topology.events, topology.edges);
}

const ids = (list) => list.map((x) => x.event.id);

test('adjacency ignores retracted edges and keeps tombstones without edges', async () => {
  const adj = await fixtureAdjacency();
  assert.equal(adj.edges.has('fixture-event-e--fixture-event-t--inspired'), true, 'retracted edge still resolves');
  assert.equal(adj.out.get('fixture-event-e').some((e) => e.to === 'fixture-event-t'), false, 'but is not walkable');
  assert.deepEqual(adj.out.get('fixture-event-m'), []);
  assert.equal(adj.events.get('fixture-event-m').status, 'merged');
});

test('consequences and antecedents are direct and ordered by type, then confidence', async () => {
  const adj = await fixtureAdjacency();
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
  const adj = await fixtureAdjacency();
  assert.deepEqual([...ancestors(adj, 'fixture-event-t')].sort(), [
    'fixture-event-a', 'fixture-event-b', 'fixture-event-c', 'fixture-event-d',
    'fixture-event-e', 'fixture-event-f', 'fixture-event-g', 'fixture-event-o',
  ]);
  assert.deepEqual([...descendants(adj, 'fixture-event-a')].sort(), [
    'fixture-event-a2', 'fixture-event-b', 'fixture-event-d', 'fixture-event-t',
  ]);
});

test('convergence excludes only the walked path and reaches through it', async () => {
  const adj = await fixtureAdjacency();
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
  const adj = await fixtureAdjacency();
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
