// An event may be part of several umbrellas (M79).
//
// The owner, 22 September, shown the list of umbrellas: *"Can't we have many
// umbrellas for the same event? For example, the angola independence is both
// under the Portuguese third republic and african decolonization."*
//
// So `parent` admits three shapes — absent or null, one id, a list of ids —
// and the whole of this suite is about them being **one answer and not three**.
// `parentsOf()` in `src/parts.js` is that answer; every case below either asks
// it directly or asks something that must have come through it.
//
// Nothing here pins a count. The corpus moves every week and an assertion
// about 242 would be an assertion about the day it was written.
//
// Every record here is synthetic. Nothing under tests/ is a historical claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parentsOf } from '../src/parts.js';
import { validate, buildTopology, buildSpine } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { fixtures, schemas } from './helpers.mjs';
import { expandSpine } from '../src/data.js';

async function run(mutate = () => {}) {
  const fx = await fixtures();
  mutate(fx);
  const topology = buildTopology(fx.records, fx.regions, {
    deriveRegion: createRegionDeriver(fx.polygons),
  });
  return validate(fx.records, topology, await schemas());
}

const messages = (result) => result.errors.map((e) => `${e.rule} ${e.id}${e.path}: ${e.message}`).join('\n');
const errorsOf = (result, rule) => result.errors.filter((e) => e.rule === rule);
const warningsOf = (result, code) => result.warnings.filter((w) => w.rule === code);
const event = (fx, id) => fx.records.find((r) => r.kind === 'event' && r.id === id);

// ─── 1. the helper reads all three shapes ──────────────────────────────────

test('the three shapes of `parent`, through the one helper', () => {
  assert.deepEqual(parentsOf({ id: 'x' }), [], 'no key at all is no parent');
  assert.deepEqual(parentsOf({ id: 'x', parent: null }), [], 'null is no parent');
  assert.deepEqual(parentsOf({ id: 'x', parent: 'war' }), ['war'], 'one id is a list of one');
  assert.deepEqual(parentsOf({ id: 'x', parent: ['war', 'decolonisation'] }), ['war', 'decolonisation']);
  assert.deepEqual(parentsOf({ id: 'x', parent: [] }), [], 'an empty list is no parent');
});

test('the helper keeps the writer\'s order and never deduplicates', () => {
  // Order, because the card says "part of" each parent in it. Duplicates,
  // because listing one parent twice is rule 24's error and a helper that
  // silently folded them would take the rule's evidence away.
  assert.deepEqual(parentsOf({ parent: ['b', 'a'] }), ['b', 'a']);
  assert.deepEqual(parentsOf({ parent: ['a', 'a'] }), ['a', 'a']);
});

test('the helper is safe on what arrives from outside', () => {
  // `data/` is untrusted input (CLAUDE.md). A number in the list is not an id
  // and is dropped; the schema is what reports it.
  assert.deepEqual(parentsOf(null), []);
  assert.deepEqual(parentsOf(undefined), []);
  assert.deepEqual(parentsOf({ parent: 7 }), []);
  assert.deepEqual(parentsOf({ parent: ['a', 7, null, 'b'] }), ['a', 'b']);
});

// ─── 2. the validator judges each shape ────────────────────────────────────

test('a list of two parents validates', async () => {
  const r = await run((fx) => {
    event(fx, 'fixture-event-h').parent = ['fixture-event-f', 'fixture-event-t'];
  });
  assert.equal(errorsOf(r, 24).length, 0, messages(r));
});

test('a list of one parent is exactly one parent', async () => {
  const one = await run((fx) => { event(fx, 'fixture-event-h').parent = ['fixture-event-f']; });
  assert.equal(errorsOf(one, 24).length, 0, messages(one));
  // And the shape a bad id is reported in does not depend on the spelling.
  const bad = await run((fx) => { event(fx, 'fixture-event-h').parent = ['fixture-event-nowhere']; });
  assert.equal(errorsOf(bad, 24).length, 1, messages(bad));
});

test('the same parent listed twice is rule 24', async () => {
  const r = await run((fx) => {
    event(fx, 'fixture-event-h').parent = ['fixture-event-f', 'fixture-event-f'];
  });
  const errors = errorsOf(r, 24);
  assert.equal(errors.length, 1, messages(r));
  assert.match(errors[0].message, /fixture-event-f/);
  assert.match(errors[0].message, /twice|more than once/);
});

test('an event that lists itself among its parents is rule 24', async () => {
  const r = await run((fx) => {
    event(fx, 'fixture-event-h').parent = ['fixture-event-f', 'fixture-event-h'];
  });
  assert.ok(errorsOf(r, 24).length >= 1, messages(r));
  assert.match(errorsOf(r, 24).map((e) => e.message).join('\n'), /itself/);
});

test('a cycle through the second parent is refused as the first one is', async () => {
  const r = await run((fx) => {
    // f is part of h, and h is part of f by its *second* parent: a walk that
    // followed only the first would never meet it.
    event(fx, 'fixture-event-f').parent = 'fixture-event-h';
    event(fx, 'fixture-event-h').parent = ['fixture-event-t', 'fixture-event-f'];
    event(fx, 'fixture-event-t').parent = null;
  });
  assert.ok(errorsOf(r, 24).length >= 1, 'a cycle through any path of part-of is an error');
  assert.match(errorsOf(r, 24).map((e) => e.message).join('\n'), /itself/);
});

test('a parent that is not an active event is rule 24 whichever slot it is in', async () => {
  const r = await run((fx) => {
    // `fixture-event-m` is merged; `fixture-actor-one` is not an event at all.
    event(fx, 'fixture-event-h').parent = ['fixture-event-f', 'fixture-event-m', 'fixture-actor-one'];
  });
  const errors = errorsOf(r, 24);
  assert.equal(errors.length, 2, messages(r));
  const text = errors.map((e) => e.message).join('\n');
  assert.match(text, /fixture-event-m/);
  assert.match(text, /fixture-actor-one/);
});

test('a child dated outside one of two parents warns, and the warning names which', async () => {
  const r = await run((fx) => {
    // `h` is 1290. `f` runs 1260–1300 and holds it; `o` is 1215 and does not.
    event(fx, 'fixture-event-h').parent = ['fixture-event-f', 'fixture-event-o'];
  });
  const outside = warningsOf(r, 'child-outside-parent');
  assert.equal(outside.length, 1, JSON.stringify(outside));
  assert.match(outside[0].message, /fixture-event-o/);
  assert.doesNotMatch(outside[0].message, /fixture-event-f/, 'the parent that holds it is not named');
});

test('a child outside both parents is two warnings, one per parent', async () => {
  const r = await run((fx) => {
    // 1290, filed inside 1215 and 1200: outside both, and each says so.
    event(fx, 'fixture-event-h').parent = ['fixture-event-o', 'fixture-event-a'];
  });
  const outside = warningsOf(r, 'child-outside-parent');
  assert.equal(outside.length, 2, JSON.stringify(outside));
  assert.deepEqual(
    outside.map((w) => /"([^"]+)"/.exec(w.message)?.[1]).sort(),
    ['fixture-event-a', 'fixture-event-o'],
  );
});

// ─── 3. a string parent behaves exactly as before ──────────────────────────

test('a string parent and a list of one are judged identically', async () => {
  const asString = await run((fx) => { event(fx, 'fixture-event-h').parent = 'fixture-event-o'; });
  const asList = await run((fx) => { event(fx, 'fixture-event-h').parent = ['fixture-event-o']; });
  const shape = (r) => ({
    errors: errorsOf(r, 24).map((e) => e.message),
    warnings: warningsOf(r, 'child-outside-parent').map((w) => w.message),
  });
  assert.deepEqual(shape(asString), shape(asList));
});

// ─── 4. the index carries the shape the record spelled ─────────────────────

test('the spine round-trips a string parent and a list of parents alike', async () => {
  const fx = await fixtures();
  event(fx, 'fixture-event-h').parent = ['fixture-event-f', 'fixture-event-t'];
  const topology = buildTopology(fx.records, fx.regions, {
    deriveRegion: createRegionDeriver(fx.polygons),
  });
  const spine = buildSpine(topology);
  const back = expandSpine(spine);
  const listed = back.events.find((e) => e.id === 'fixture-event-h');
  const single = back.events.find((e) => e.id === 'fixture-event-t');
  assert.deepEqual(listed.parent, ['fixture-event-f', 'fixture-event-t']);
  assert.equal(single.parent, 'fixture-event-f', 'one parent is still written as one id');
  // And both read the same way, which is the only thing anything downstream
  // is allowed to care about.
  assert.deepEqual(parentsOf(listed), ['fixture-event-f', 'fixture-event-t']);
  assert.deepEqual(parentsOf(single), ['fixture-event-f']);
});
