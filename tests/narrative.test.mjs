// Reading a narrative: the pure half (which record a step is about, the chain
// at a step, how the window slides) and the mode that puts it into the state
// (entering remembers, stepping derives, leaving restores, and the URL carries
// the narrative and the step and nothing else).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAtlas } from '../src/data.js';
import { createState, parseState, formatState } from '../src/state.js';
import { createReadingMode, openingState } from '../src/narrative-mode.js';
import {
  chainAt, clampStep, narrativeEventIds, narrativeSet, readingNarrative, resolveRef, stepState,
} from '../src/narrative.js';
import { FIXTURE_DATA } from './helpers.mjs';

async function fetchJson(url) {
  return JSON.parse(await readFile(path.join(FIXTURE_DATA, '..', '..', '..', url.split('?')[0]), 'utf8'));
}

const atlasPromise = loadAtlas({ dataRoot: 'tests/fixtures/data/', fetchJson });
const NARRATIVE = 'fixture-narrative-one';

async function walk() {
  const atlas = await atlasPromise;
  return { atlas, narrative: atlas.narratives.get(NARRATIVE) };
}

test('a step resolves to the record it is about', async () => {
  const { atlas } = await walk();
  const event = resolveRef(atlas, 'fixture-event-a');
  assert.equal(event.kind, 'event');
  assert.equal(event.event.id, 'fixture-event-a');
  // An edge selects its own far end: that is where the reader has arrived.
  const edge = resolveRef(atlas, 'fixture-event-a--fixture-event-b--caused');
  assert.equal(edge.kind, 'edge');
  assert.equal(edge.event.id, 'fixture-event-b');
  assert.equal(resolveRef(atlas, 'nothing-here').kind, null);
});

// Since H7 a step may name an actor, a relation or a presence, so that a walk
// can say "and this is the body that did it" without inventing an event for it
// (health review B, finding 18). None of the three carries an event, so the
// views draw nothing new and the chain breaks there — which is what a step
// that is not a link already did.
test('a step may name an actor, a relation or a presence, and none of them is an event', async () => {
  const { atlas, narrative } = await walk();
  const actor = resolveRef(atlas, 'fixture-actor-one');
  assert.equal(actor.kind, 'actor');
  assert.equal(actor.record.id, 'fixture-actor-one');
  assert.equal(actor.event, null);

  const relation = resolveRef(atlas, 'fixture-actor-one--fixture-actor-two--led');
  assert.equal(relation.kind, 'relation');
  assert.equal(relation.record.type, 'led');
  assert.equal(relation.event, null);

  const presence = resolveRef(atlas, 'fixture-polity-four-1120');
  assert.equal(presence.kind, 'presence');
  assert.equal(presence.record.actor, 'fixture-polity-four');
  assert.equal(presence.event, null);

  // And none of them puts an event into the walked set or into the chain.
  const withActor = { ...narrative, steps: [{ ref: 'fixture-event-a' }, { ref: 'fixture-actor-one' }] };
  assert.deepEqual([...narrativeEventIds(atlas, withActor)], ['fixture-event-a']);
  assert.deepEqual(chainAt(atlas, withActor, 1), []);
});

test('the chain is the longest contiguous run of edges ending at the step', async () => {
  const { atlas, narrative } = await walk();
  // Step 0 is an event: a selection with nothing walked to reach it.
  assert.deepEqual(chainAt(atlas, narrative, 0), []);
  assert.deepEqual(chainAt(atlas, narrative, 1), ['fixture-event-a--fixture-event-b--caused']);
  assert.deepEqual(chainAt(atlas, narrative, 2), [
    'fixture-event-a--fixture-event-b--caused',
    'fixture-event-b--fixture-event-d--enabled',
  ]);
  // Step 3 does not start where step 2 ended, so the run breaks and begins
  // again at a single link.
  assert.deepEqual(chainAt(atlas, narrative, 3), ['fixture-event-c--fixture-event-t--precondition-of']);
});

test('a step out of range opens at the nearest end of the walk', async () => {
  const { narrative } = await walk();
  assert.equal(clampStep(narrative, -3), 0);
  assert.equal(clampStep(narrative, 99), 3);
  assert.equal(clampStep(narrative, 1.5), 0);
  assert.equal(clampStep(null, 2), 0);
});

test('the state at a step selects the record and slides the window to hold it', async () => {
  const { atlas, narrative } = await walk();
  const first = stepState(atlas, narrative, 0, { from: 1240, to: 1250 });
  assert.equal(first.selected, 'fixture-event-a');
  // fixture-event-a is earlier than the window's near end, so the near end
  // comes back to it and the far end is left alone.
  assert.ok(first.from < 1240);
  assert.equal(first.to, 1250);
  // A null bound is the data's own and already holds everything.
  const open = stepState(atlas, narrative, 0, { from: null, to: null });
  assert.deepEqual([open.from, open.to], [null, null]);
});

test('the whole walk is what the views emphasise, not only the step reached', async () => {
  const { atlas, narrative } = await walk();
  const ids = narrativeEventIds(atlas, narrative);
  assert.ok(ids.has('fixture-event-a'));
  assert.ok(ids.has('fixture-event-d'), 'the far end of an edge step is walked');
  assert.ok(ids.has('fixture-event-c'), 'and so is its near end');
  assert.equal(narrativeSet(atlas, { narrative: null }), null);
  assert.equal(narrativeSet(atlas, { narrative: NARRATIVE }).size, ids.size);
  assert.equal(readingNarrative(atlas, { narrative: 'no-such-narrative' }), null);
});

test('an event knows the narratives that pass through it, by step and through its links', async () => {
  const atlas = await atlasPromise;
  assert.deepEqual((atlas.narrativesByRef.get('fixture-event-a') ?? []).map((n) => n.id), [NARRATIVE]);
  // Named by no step of its own, reached through the edge of step 2.
  assert.deepEqual((atlas.narrativesByRef.get('fixture-event-d') ?? []).map((n) => n.id), [NARRATIVE]);
  assert.deepEqual((atlas.narrativesByRef.get('fixture-event-a--fixture-event-b--caused') ?? []).map((n) => n.id), [NARRATIVE]);
  assert.equal(atlas.narrativesByRef.has('fixture-event-h'), false);
});

test('the URL of a narrative is the narrative and the step, and nothing else', async () => {
  const state = { ...parseState(''), from: 1200, to: 1300, selected: 'fixture-event-a', narrative: NARRATIVE, step: 2 };
  assert.equal(formatState(state), `?narrative=${NARRATIVE}&step=2`);
  const parsed = parseState(`?narrative=${NARRATIVE}&step=2`);
  assert.equal(parsed.narrative, NARRATIVE);
  assert.equal(parsed.step, 2);
  assert.equal(parseState('?narrative=../secret&step=1').narrative, null);
  assert.equal(parseState(`?narrative=${NARRATIVE}&step=-4`).step, 0);
  assert.equal(parseState(`?narrative=${NARRATIVE}&step=two`).step, 0);
});

test('a shared link opens on the step it names, with the walk already derived', async () => {
  const atlas = await atlasPromise;
  const opened = openingState(atlas, parseState(`?narrative=${NARRATIVE}&step=2`));
  assert.equal(opened.selected, 'fixture-event-d');
  assert.equal(opened.chain.length, 2);
  // The narrative's own window, widened by the step it opens on.
  assert.equal(opened.from, 1200);
  assert.equal(opened.to, 1260);
});

test('entering remembers the ordinary state, stepping derives, leaving puts it back', async () => {
  const atlas = await atlasPromise;
  const store = createState({ selected: 'fixture-event-t', chain: ['fixture-event-d--fixture-event-t--caused'], from: 1290, to: 1300 });
  const state = createReadingMode(store, atlas);

  state.set({ narrative: NARRATIVE, step: 0 });
  assert.equal(store.get().selected, 'fixture-event-a');
  assert.deepEqual(store.get().chain, []);
  assert.deepEqual([store.get().from, store.get().to], [1200, 1260], 'the narrative opens on its own window');

  state.set({ step: 2 });
  assert.equal(store.get().selected, 'fixture-event-d');
  assert.equal(store.get().chain.length, 2);

  state.set({ narrative: null });
  assert.equal(store.get().narrative, null);
  assert.equal(store.get().step, 0);
  assert.equal(store.get().selected, 'fixture-event-t');
  assert.deepEqual(store.get().chain, ['fixture-event-d--fixture-event-t--caused']);
  assert.deepEqual([store.get().from, store.get().to], [1290, 1300]);
});

test('choosing something else leaves the narrative and keeps what was chosen', async () => {
  const atlas = await atlasPromise;
  const store = createState({ selected: 'fixture-event-t' });
  const state = createReadingMode(store, atlas);
  state.set({ narrative: NARRATIVE, step: 1 });
  assert.equal(store.get().selected, 'fixture-event-b');
  // A click on the map, not a press of "next".
  state.set({ selected: 'fixture-event-g', chain: [] });
  assert.equal(store.get().narrative, null);
  assert.equal(store.get().selected, 'fixture-event-g');
  // And leaving again does not drag the reader back to where they started.
  state.set({ narrative: NARRATIVE, step: 0 });
  state.set({ narrative: null });
  assert.equal(store.get().selected, 'fixture-event-g');
});

test('a narrative that does not resolve is not a mode to be in', async () => {
  const atlas = await atlasPromise;
  const store = createState({ selected: 'fixture-event-t' });
  const state = createReadingMode(store, atlas);
  state.set({ narrative: 'no-such-narrative' });
  assert.equal(store.get().narrative, 'no-such-narrative');
  assert.equal(store.get().selected, 'fixture-event-t', 'nothing derived from nothing');
});
