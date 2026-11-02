// M104 — tools/links/parents.mjs, which offers parents to events that have none.
//
// No network: the fetcher is a stub that answers off a table, and the corpus is
// a handful of records written here. What is tested is the choice of pairs and
// the order of the filters; the rules themselves (the span, the loop, the
// parent being an active event) belong to the writer and are tested with it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  candidateChildren, firstIds, offeredPairs, filterPairs, nearestOnly, laneFits, insideBothEnds,
  topParents, buildItems, fetchEntities, createWikidataFetcher, compactEntities, entitiesUrl, USER_AGENT,
} from '../tools/links/parents.mjs';
import { checkQueue } from '../tools/queue/queue.mjs';

const ev = (id, q, start, end, over = {}) => ({
  kind: 'event', status: 'active', id, title: id.toUpperCase(), wikidata: q,
  when: { start, end }, place: null, actors: [], ...over,
});

const war = ev('war', 'Q1', 1914, 1918);
const front = ev('front', 'Q2', 1914, 1917, { parent: 'war' });
const battle = ev('battle', 'Q3', 1916, 1916);
const raid = ev('raid', 'Q4', 1915, 1915);
const late = ev('late', 'Q5', 1916, 1920);
const rival = ev('rival', 'Q6', 1916, 1916);
const world = ev('world', 'Q7', 1900, 1950, { review: { flags: ['m42-umbrella'] } });
const all = [war, front, battle, raid, late, rival, world];
const byId = new Map(all.map((r) => [r.id, r]));
const laneOf = new Map(all.map((r) => [r.id, 'europe']));

const claims = (p361 = [], p527 = []) => ({ p361, p527 });

test('children are the active events with no parent, a wikidata id, and no measured-umbrella flag', () => {
  const ids = candidateChildren(all).map((r) => r.id);
  assert.deepEqual(ids, ['war', 'battle', 'raid', 'late', 'rival']);
  assert.ok(!firstIds(all).includes('Q7'), 'an umbrella is neither child nor parent');
});

test('P361 gives a pair, a chain finds the nearest held whole, P527 gives the other direction', async () => {
  const known = new Map([
    ['Q3', claims(['Q2'])], // battle -> front, held
    ['Q4', claims(['Q99'])], // raid -> Q99 (not held) -> Q1 (war)
    ['Q5', claims(['Q7'])], // late -> world, a measured umbrella
    ['Q1', claims([], ['Q6'])], // war has part rival
    ['Q2', claims()],
  ]);
  const asked = [];
  const pairs = await offeredPairs(all, known, async (ids) => {
    asked.push(ids);
    return new Map(ids.map((q) => [q, q === 'Q99' ? claims(['Q1']) : claims()]));
  });
  const flat = pairs.map((p) => `${p.child}>${p.parent}:${p.sources}`);
  assert.deepEqual(flat, ['battle>front:P361', 'raid>war:P361-chain', 'rival>war:P527']);
  assert.deepEqual(asked, [['Q99']]);
});

test('a chain stops at the first held whole', async () => {
  const known = new Map([['Q3', claims(['Q2'])], ['Q2', claims(['Q1'])]]);
  const pairs = await offeredPairs(all, known, async () => new Map());
  assert.deepEqual(pairs.map((p) => `${p.child}>${p.parent}`), ['battle>front']);
});

test('the span test needs both ends, and the lane test takes a shared actor or place', () => {
  assert.ok(insideBothEnds(battle, war));
  assert.ok(!insideBothEnds(late, war), 'it ends in 1920 and the war in 1918');
  const asia = new Map([['battle', 'asia'], ['war', 'europe']]);
  assert.equal(laneFits(battle, war, asia).ok, false);
  const withActor = { ...battle, actors: [{ actor: 'france' }] };
  assert.equal(laneFits(withActor, { ...war, actors: [{ actor: 'france' }] }, asia).by, 'actor');
  assert.equal(laneFits({ ...battle, place: 'verdun' }, { ...war, place: 'verdun' }, asia).by, 'place');
  const none = new Map();
  assert.equal(laneFits(battle, war, none).ok, false, 'two events with no lane share none');
});

test('nearest parent only: the wider of two parents goes, through the records and through the batch', () => {
  // front is inside war already, by the record.
  const kept = nearestOnly(new Map([['battle', ['war', 'front']]]), (id) => (id === 'front' ? ['war'] : []));
  assert.deepEqual(kept.get('battle'), ['front']);
  // raid will be filed under war in this batch, and battle under raid and war.
  const batch = nearestOnly(new Map([['battle', ['raid', 'war']], ['raid', ['war']]]), () => []);
  assert.deepEqual(batch.get('battle'), ['raid']);
  assert.deepEqual(batch.get('raid'), ['war']);
  // two parents that do not contain each other both stay.
  assert.deepEqual(nearestOnly(new Map([['battle', ['raid', 'rival']]]), () => []).get('battle').sort(), ['raid', 'rival']);
});

test('filterPairs counts after each filter and refuses a loop closed inside the batch', () => {
  const pairs = [
    { child: 'battle', parent: 'war', sources: ['P361'] },
    { child: 'battle', parent: 'front', sources: ['P361'] },
    { child: 'late', parent: 'war', sources: ['P361'] },
    { child: 'raid', parent: 'rival', sources: ['P527'] }, // 1915 outside 1916
    { child: 'rival', parent: 'war', sources: ['P527'] },
    { child: 'war', parent: 'rival', sources: ['P361'] }, // war is not inside rival
  ];
  const { counts, accepted } = filterPairs(pairs, { byId, laneOf });
  assert.equal(counts.offered, 6);
  assert.equal(counts.insideBothEnds, 3);
  assert.equal(counts.laneRule, 3);
  assert.equal(counts.nearestOnly, 2);
  assert.equal(counts.writerVerdict, 2);
  assert.deepEqual(accepted.get('battle'), ['front']);
  assert.deepEqual(accepted.get('rival'), ['war']);
  assert.ok(!accepted.has('late'));
});

test('a pair that would close a loop is refused by the writer verdict', () => {
  const a = ev('a', 'Q11', 1900, 1910);
  const b = ev('b', 'Q12', 1900, 1910);
  const map = new Map([['a', a], ['b', b]]);
  const lanes = new Map([['a', 'europe'], ['b', 'europe']]);
  const { accepted, refused } = filterPairs([
    { child: 'a', parent: 'b', sources: ['P361'] },
    { child: 'b', parent: 'a', sources: ['P527'] },
  ], { byId: map, laneOf: lanes });
  assert.equal(accepted.size, 1);
  assert.equal(refused[0].reason, 'parent-cycle');
});

test('the pilot takes the parents with the most children and all of their children', () => {
  const kids = (ids) => new Map(ids.map(([c, p]) => [c, [p]]));
  const accepted = kids([['battle', 'war'], ['raid', 'war'], ['rival', 'front'], ['late', 'rival']]);
  const top = topParents(accepted, 1);
  assert.deepEqual(top, [{ parent: 'war', children: ['battle', 'raid'] }]);
  const { items, skipped } = buildItems(top, { byId, laneOf, date: '2026-11-02', planned: '2026-11-02T10:00Z' });
  assert.deepEqual(skipped, []);
  assert.deepEqual(items.map((i) => [i.id, i.writer, i.existing, i.parents, i.edges, i.rank, i.lane]), [
    ['2026-11-02-europe-001', 'A', 'battle', ['war'], [], 'child-of:war', 'europe'],
    ['2026-11-02-europe-002', 'B', 'raid', ['war'], [], 'child-of:war', 'europe'],
  ]);
  assert.match(items[0].why, /Wikidata \(P361, part of\)/);
  const problems = checkQueue('q.json', { items }, { regions: [{ id: 'europe' }] });
  assert.deepEqual(problems, []);
});

test('an item whose lane the queue does not write falls back to the parent lane, or is skipped', () => {
  const lanes = new Map([['battle', 'oceania'], ['war', 'asia'], ['raid', 'oceania']]);
  const { items, skipped } = buildItems([{ parent: 'war', children: ['battle'] }, { parent: 'front', children: ['raid'] }],
    { byId, laneOf: lanes, date: '2026-11-02', planned: '2026-11-02T10:00Z' });
  assert.equal(items[0].lane, 'asia');
  assert.deepEqual(skipped, ['raid']);
});

test('fetching: fifty ids a call, the right request, the cache answers the second time', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'oc-m104-test-'));
  try {
    const urls = [];
    const headers = [];
    const ids = Array.from({ length: 120 }, (_, i) => `Q${i + 1}`);
    const fetchJson = async (url, options) => {
      urls.push(url);
      headers.push(options.headers['user-agent']);
      const wanted = new URL(url).searchParams.get('ids').split('|');
      return { entities: Object.fromEntries(wanted.map((q) => [q, q === 'Q2'
        ? { claims: { P361: [{ mainsnak: { snaktype: 'value', datavalue: { value: { id: 'Q1' } } } }] } }
        : { missing: '' }])) };
    };
    const delays = [];
    const fetcher = createWikidataFetcher({ fetchJson, delay: async (ms) => { delays.push(ms); } });
    const got = await fetchEntities(ids, { fetcher, cacheDir: dir });
    assert.equal(urls.length, 3);
    assert.deepEqual(urls.map((u) => new URL(u).searchParams.get('ids').split('|').length), [50, 50, 20]);
    assert.ok(urls.every((u) => new URL(u).searchParams.get('maxlag') === '5'));
    assert.deepEqual(delays, [1000, 1000]);
    assert.deepEqual(got.get('Q2'), { p361: ['Q1'], p527: [] });
    assert.deepEqual(got.get('Q3'), { p361: [], p527: [] });
    assert.equal((await readdir(dir)).length, 3);
    const again = await fetchEntities(ids, { fetcher, cacheDir: dir });
    assert.equal(urls.length, 3, 'the cache answered');
    assert.deepEqual(again.get('Q2'), got.get('Q2'));
    assert.equal(entitiesUrl(['Q1', 'Q2']).includes('ids=Q1|Q2'), true);
    assert.ok(headers.every((h) => h === USER_AGENT));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a maxlag answer is retried with a backoff, and the budget is a limit', async () => {
  let n = 0;
  const waits = [];
  const fetcher = createWikidataFetcher({
    budget: 3,
    fetchJson: async () => {
      n += 1;
      return n === 1 ? { error: { code: 'maxlag', info: 'lagged' } } : { entities: {} };
    },
    delay: async (ms) => { waits.push(ms); },
  });
  await fetcher.get('u1');
  assert.equal(n, 2);
  assert.ok(waits.includes(2000), 'a backoff longer than the usual second');
  await fetcher.get('u2');
  await assert.rejects(() => fetcher.get('u3'), { name: 'BudgetError' });
  assert.deepEqual(compactEntities({ entities: { Q1: { missing: '' } } }), { Q1: { p361: [], p527: [] } });
});
