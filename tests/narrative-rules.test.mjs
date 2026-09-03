// The narrative kind: what the topology carries, rule 20 — two steps, real
// prose, refs that do not repeat, a window that is a window — and the reach of
// rules 3, 6, 11 and 12 into it. Every case builds its own synthetic narrative
// over the fixture graph, so the one the fixtures carry is never the thing
// under test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, buildTopology } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { refKind, MIN_NARRATIVE_STEPS } from '../src/validate/rules.js';
import { fixtures, schemas } from './helpers.mjs';

const TEXT = 'A step of a synthetic narrative, long enough to be an argument rather than a label.';

function narrative(overrides = {}) {
  return {
    schema: 1,
    id: 'fixture-narrative-two',
    kind: 'narrative',
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: [{ name: 'Fixture Author', github: 'fixture-author' }],
    license: 'CC-BY-SA-4.0',
    created: '2026-01-01',
    revised: null,
    sources: [{ source: 'fixture-source-1', locator: null }],
    title: 'A second synthetic walk',
    summary: 'What this narrative claims, in enough words to count as a claim and not a caption.',
    steps: [
      { ref: 'fixture-event-a', text: TEXT },
      { ref: 'fixture-event-a--fixture-event-b--caused', text: TEXT },
    ],
    ...overrides,
  };
}

async function run(overrides = {}) {
  const fx = await fixtures();
  fx.records.push(narrative(overrides));
  const topology = buildTopology(fx.records, fx.regions, { deriveRegion: createRegionDeriver(fx.polygons) });
  return validate(fx.records, topology, await schemas());
}

const rulesHit = (result, rule) => result.errors.filter((e) => e.rule === rule);
const messages = (result) => result.errors.map((e) => `${e.rule} ${e.id}${e.path}: ${e.message}`).join('\n');

test('a narrative over the fixture graph validates', async () => {
  const result = await run();
  assert.deepEqual(result.errors, [], messages(result));
});

test('refKind tells the two shapes apart and refuses everything else', () => {
  assert.equal(refKind('fixture-event-a'), 'event');
  assert.equal(refKind('a--b--caused'), 'edge');
  // A relation is between actors: it is not a step of a walk through events.
  assert.equal(refKind('estado-novo--portugal--regime-of'), null);
  assert.equal(refKind('../../etc/passwd'), null);
  assert.equal(refKind(''), null);
  assert.equal(refKind(null), null);
});

test('the topology carries the walk without a word of its prose', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const entry = topology.narratives.find((n) => n.id === 'fixture-narrative-one');
  assert.ok(entry, 'the fixture narrative reaches the topology');
  assert.equal(entry.title, 'A synthetic walk from A to T');
  assert.equal(entry.authors[0].name, 'Fixture Author');
  assert.deepEqual(entry.window, { from: 1200, to: 1260 });
  assert.equal(entry.steps.length, 4);
  // The refs are there — the map and the graph follow them — and the text of
  // a step is fetched with the record when that step is read.
  assert.deepEqual(Object.keys(entry.steps[0]), ['ref']);
  assert.equal(entry.steps[0].ref, 'fixture-event-a');
});

test('rule 20: a walk has at least two steps', async () => {
  const result = await run({ steps: [{ ref: 'fixture-event-a', text: TEXT }] });
  const hit = rulesHit(result, 20);
  assert.equal(hit.length, 1, messages(result));
  assert.match(hit[0].message, new RegExp(`at least ${MIN_NARRATIVE_STEPS}`));
});

test('rule 20: a step without a real argument is refused, and so is a thin summary', async () => {
  const short = await run({ steps: [{ ref: 'fixture-event-a', text: 'too short' }, { ref: 'fixture-event-b', text: TEXT }] });
  assert.deepEqual(rulesHit(short, 20).map((e) => e.path), ['/steps/0/text']);
  const thin = await run({ summary: 'a caption' });
  assert.deepEqual(rulesHit(thin, 20).map((e) => e.path), ['/summary']);
});

test('rule 20: the same record twice running is a step that does not step', async () => {
  const result = await run({
    steps: [
      { ref: 'fixture-event-a', text: TEXT },
      { ref: 'fixture-event-a', text: TEXT },
    ],
  });
  assert.deepEqual(rulesHit(result, 20).map((e) => e.path), ['/steps/1/ref']);
});

test('rule 20: a window that opens after it closes', async () => {
  const result = await run({ window: { from: 1300, to: 1200 } });
  assert.deepEqual(rulesHit(result, 20).map((e) => e.path), ['/window']);
});

test('rule 3: every ref resolves to an event or an edge', async () => {
  const result = await run({
    steps: [
      { ref: 'fixture-source-1', text: TEXT },
      { ref: 'fixture-event-a--fixture-event-z--caused', text: TEXT },
    ],
  });
  assert.deepEqual(rulesHit(result, 3).map((e) => e.path), ['/steps/0/ref', '/steps/1/ref']);
});

test('rule 11: an active narrative cannot walk a retracted record', async () => {
  const result = await run({
    steps: [
      { ref: 'fixture-event-a', text: TEXT },
      { ref: 'fixture-event-e--fixture-event-t--inspired', text: TEXT },
    ],
  });
  const hit = rulesHit(result, 11);
  assert.equal(hit.length, 1, messages(result));
  assert.match(hit[0].message, /retracted edge/);
});

test('rules 6 and 12: a narrative is cited and signed like everything else', async () => {
  const bare = await run({ sources: [] });
  assert.deepEqual(rulesHit(bare, 6).map((e) => e.path), ['/sources']);
  const unsigned = await run({ authors: [] });
  assert.deepEqual(rulesHit(unsigned, 12).map((e) => e.path), ['/authors']);
  const licensed = await run({ license: 'CC-BY-NC-SA-4.0' });
  assert.deepEqual(rulesHit(licensed, 12).map((e) => e.path), ['/license']);
});
