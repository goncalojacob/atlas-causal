import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseState, formatState, defaultState, createState } from '../src/state.js';

test('parse and format round trip', () => {
  const state = {
    year: 1250,
    selected: 'fixture-event-t',
    chain: ['fixture-event-a--fixture-event-b--caused', 'fixture-event-b--fixture-event-d--enabled'],
    layers: ['events'],
  };
  const search = formatState(state);
  assert.equal(search, '?year=1250&selected=fixture-event-t&chain=fixture-event-a--fixture-event-b--caused,fixture-event-b--fixture-event-d--enabled&layers=events');
  assert.deepEqual(parseState(search), state);
});

test('defaults produce an empty query and BCE years survive', () => {
  assert.equal(formatState(defaultState()), '');
  assert.equal(parseState('?year=-44').year, -44);
  assert.equal(formatState({ ...defaultState(), year: -44 }), '?year=-44');
});

test('garbage falls back field by field; a bad chain step cuts the chain there', () => {
  const s = parseState('?year=soon&selected=<script>&chain=fixture-event-a--fixture-event-b--caused,nope,fixture-event-b--fixture-event-d--enabled&layers=events,lasers');
  assert.equal(s.year, null);
  assert.equal(s.selected, null);
  assert.deepEqual(s.chain, ['fixture-event-a--fixture-event-b--caused']);
  assert.deepEqual(s.layers, ['events']);
  assert.equal(parseState('?year=0').year, null);
});

test('fixtures=1 passes through a state write', () => {
  const out = formatState({ ...defaultState(), year: 1300 }, '?fixtures=1&year=9');
  assert.equal(out, '?fixtures=1&year=1300');
});

test('the store merges patches and notifies', () => {
  const store = createState({ year: 1200 });
  const seen = [];
  const off = store.subscribe((s) => seen.push(s.year));
  store.set({ year: 1210 });
  store.set({ selected: 'fixture-event-a' });
  off();
  store.set({ year: 1220 });
  assert.deepEqual(seen, [1210, 1210]);
  assert.deepEqual(store.get(), { year: 1220, selected: 'fixture-event-a', chain: [], layers: ['land', 'events'] });
});
