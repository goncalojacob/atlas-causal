// The rules that only presences fire: rule 17 in full, and the reach of
// rules 3, 6, 10, 11 and 12 into the new kind. The fixture dataset carries
// three synthetic presences and two geometry shards; each test here breaks
// exactly one thing about them.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, buildTopology } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { fixtures, schemas, clone } from './helpers.mjs';

async function run(mutate = () => {}) {
  const fx = await fixtures();
  mutate(fx);
  const topology = buildTopology(fx.records, fx.regions, { deriveRegion: createRegionDeriver(fx.polygons) });
  return validate(fx.records, topology, await schemas());
}

const hit = (result, rule) => result.errors.filter((e) => e.rule === rule);
const messages = (result) => result.errors.map((e) => `${e.rule} ${e.id}${e.path}: ${e.message}`).join('\n');
const P3 = 'fixture-polity-three-1100';
const P4 = 'fixture-polity-four-1120';

test('the fixture presences pass, and hold no unused actors', async () => {
  const r = await run();
  assert.equal(r.errors.length, 0, messages(r));
  // The two imported-style polities are named by no event at all; they are
  // used because they hold territory, and that is the point of the change.
  assert.equal(r.warnings.filter((w) => w.rule === 'actor-unused').length, 0);
});

test('the topology carries presences without their coordinates', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const p = topology.presences.find((x) => x.id === P4);
  assert.equal(topology.presences.length, 3);
  assert.equal(p.actor, 'fixture-polity-four');
  assert.equal(p.dependencyOf, 'fixture-polity-three');
  assert.equal(p.dependencyKind, 'colony');
  assert.equal(p.capital.label, 'Fixture seat D');
  assert.deepEqual(p.geometry, { files: ['geo/presences/1100-1199.json'], key: 'f2' });
  assert.deepEqual(topology.presences.map((x) => x.id), [...topology.presences.map((x) => x.id)].sort());
});

test('rule 3: a presence\'s actor and sovereign resolve', async () => {
  let r = await run((fx) => { fx.byId[P3].actor = 'nobody-at-all'; });
  assert.match(hit(r, 3)[0].message, /is not an actor record/);
  r = await run((fx) => { fx.byId[P4].dependencyOf = 'nobody-at-all'; });
  assert.equal(hit(r, 3)[0].path, '/dependencyOf');
  // An event id is not an actor id, however well it resolves to something.
  r = await run((fx) => { fx.byId[P3].actor = 'fixture-event-a'; });
  assert.equal(hit(r, 3).length, 1);
});

test('rule 6: a presence cites the source its outline came from', async () => {
  const r = await run((fx) => { fx.byId[P3].sources = []; });
  assert.match(hit(r, 6)[0].message, /every presence cites/);
});

test('rule 10: a capital is a point on Earth', async () => {
  let r = await run((fx) => { fx.byId[P3].capital.lon = 200; });
  assert.equal(hit(r, 10)[0].path, '/capital/lon');
  r = await run((fx) => { fx.byId[P3].capital.lat = -91; });
  assert.equal(hit(r, 10)[0].path, '/capital/lat');
  // A presence needs no region: it is never on the timeline.
  r = await run((fx) => { fx.byId[P3].capital = null; });
  assert.equal(hit(r, 10).length, 0, messages(r));
});

test('rule 11: a presence keeps a retired actor alive, and cannot use one', async () => {
  const r = await run((fx) => {
    fx.byId['fixture-polity-four'].status = 'retracted';
  });
  const messagesFor = hit(r, 11).map((e) => e.message).join('\n');
  assert.match(messagesFor, /still referenced by the active presence/);
  assert.match(messagesFor, /cannot reference the retracted actor/);
});

test('rule 12: only an import may put the NC-SA licence on an actor', async () => {
  let r = await run((fx) => { fx.byId['fixture-polity-three'].license = 'CC-BY-NC-SA-4.0'; });
  assert.match(hit(r, 12)[0].message, /only when an import wrote it/);
  // What opens the hole is `origin`, not a name in `authors`: a person named
  // exactly like the import can no longer relicense an actor, and a rename of
  // the import's own string no longer closes the hole under it (health review
  // A, findings 22 and 24).
  r = await run((fx) => {
    fx.byId['fixture-polity-three'].license = 'CC-BY-NC-SA-4.0';
    fx.byId['fixture-polity-three'].authors = [{ name: 'CShapes 2.0 import (tools/import/cshapes.mjs)', github: null }];
  });
  assert.equal(hit(r, 12).length, 1, 'an author name is not provenance');
  r = await run((fx) => {
    fx.byId['fixture-polity-three'].license = 'CC-BY-NC-SA-4.0';
    fx.byId['fixture-polity-three'].origin = { tool: 'cshapes' };
  });
  assert.equal(hit(r, 12).length, 0, messages(r));
  // The other import writes CC BY-SA records; its origin does not open it.
  r = await run((fx) => {
    fx.byId['fixture-polity-three'].license = 'CC-BY-NC-SA-4.0';
    fx.byId['fixture-polity-three'].origin = { tool: 'wikidata' };
  });
  assert.equal(hit(r, 12).length, 1);
  // A presence may carry it with no ceremony: that is what the directory is.
  r = await run((fx) => { fx.byId[P3].license = 'CC-BY-NC-SA-4.0'; });
  assert.equal(hit(r, 12).length, 0, messages(r));
  // An event may not, whoever wrote it.
  r = await run((fx) => { fx.byId['fixture-event-a'].license = 'CC-BY-NC-SA-4.0'; });
  assert.equal(hit(r, 12).length, 1);
});

test('rule 17: dependencyOf and dependencyKind stand or fall together', async () => {
  // A kind without a sovereign is allowed and means what it says: Danzig
  // was a mandate held by the League of Nations, which is not a state here.
  let r = await run((fx) => { fx.byId[P3].dependencyKind = 'mandate'; });
  assert.equal(hit(r, 17).length, 0, messages(r));
  r = await run((fx) => { fx.byId[P4].dependencyKind = null; });
  assert.match(hit(r, 17)[0].message, /how it was held/);
  r = await run((fx) => { fx.byId[P4].dependencyOf = 'fixture-polity-four'; });
  assert.match(hit(r, 17)[0].message, /dependency of its own actor/);
});

test('rule 17: a presence names at least one file for its outline', async () => {
  const r = await run((fx) => { fx.byId[P3].geometry = { files: [], key: 'f1' }; });
  assert.equal(hit(r, 17)[0].path, '/geometry/files');
});

test('rule 17: one actor cannot hold the same outline twice at once', async () => {
  // Same key, overlapping years: the same territory recorded twice.
  let r = await run((fx) => {
    const copy = clone(fx.byId[P4]);
    copy.id = 'fixture-polity-four-1150';
    copy.when = { start: 1150, end: 1198 };
    fx.records.push(copy);
  });
  assert.match(hit(r, 17)[0].message, /the same outline/);
  // Different key over the same years is allowed: a year is the finest
  // bound the model has, so a border that moved mid-year leaves two.
  r = await run((fx) => {
    const copy = clone(fx.byId[P4]);
    copy.id = 'fixture-polity-four-1150';
    copy.when = { start: 1150, end: 1198 };
    copy.geometry = { files: ['geo/presences/1100-1199.json'], key: 'f3' };
    fx.records.push(copy);
  });
  assert.equal(hit(r, 17).length, 0, messages(r));
  // Same key, disjoint years is allowed too: a territory lost and regained.
  r = await run((fx) => {
    const copy = clone(fx.byId[P4]);
    copy.id = 'fixture-polity-four-1250';
    copy.when = { start: 1250, end: 1260 };
    fx.records.push(copy);
  });
  assert.equal(hit(r, 17).length, 0, messages(r));
});

test('a presence outside its actor\'s dates is a warning, not an error', async () => {
  const r = await run((fx) => { fx.byId[P4].when = { start: 1300, end: 1320 }; });
  assert.equal(hit(r, 17).length, 0);
  assert.ok(r.warnings.some((w) => w.rule === 'presence-outside-actor-when' && w.id === P4));
});
