import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRules } from '../src/validate/rules.js';
import { validate, buildTopology } from '../src/validate/core.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { fixtures, schemas, clone } from './helpers.mjs';

// Runs the full validator over the fixture dataset after `mutate` has
// changed it, and returns the errors and warnings. The fixture set is the
// passing case for every rule; each test below makes one failing case.
async function run(mutate = () => {}) {
  const fx = await fixtures();
  mutate(fx);
  const topology = buildTopology(fx.records, fx.regions, { deriveRegion: createRegionDeriver(fx.polygons) });
  return validate(fx.records, topology, await schemas());
}

const rulesHit = (result, rule) => result.errors.filter((e) => e.rule === rule);
const messages = (result) => result.errors.map((e) => `${e.rule} ${e.id}${e.path}: ${e.message}`).join('\n');

test('the fixture dataset passes with exactly the two intended warnings', async () => {
  const r = await run();
  assert.equal(r.errors.length, 0, messages(r));
  assert.deepEqual(
    r.warnings.map((w) => `${w.rule}:${w.id}`).sort(),
    // fixture-place-m is where the tombstoned event happened: no active event
    // stands there any more, and that is exactly what place-unused says.
    ['degree-zero:fixture-event-h', 'no-citers:fixture-source-4', 'place-unused:fixture-place-m'],
  );
});

test('rule 1: schema version and shape', async () => {
  let r = await run((fx) => { fx.byId['fixture-event-a'].schema = 2; });
  assert.equal(rulesHit(r, 1).length, 1);
  r = await run((fx) => { fx.byId['fixture-event-a'].tags = ['x']; });
  assert.equal(rulesHit(r, 1)[0].path, '/tags');
  r = await run((fx) => { fx.regions[0].order = 0; });
  assert.equal(rulesHit(r, 1)[0].kind, 'region');
});

test('rule 2: ids, derived edge ids, aliases', async () => {
  let r = await run((fx) => { fx.byId['fixture-event-a'].id = 'Fixture-Event-A'; });
  assert.ok(r.errors.length > 0);
  r = await run((fx) => { fx.byId['fixture-event-a--fixture-event-b--caused'].type = 'enabled'; });
  assert.match(rulesHit(r, 2)[0].message, /derived/);
  r = await run((fx) => { fx.byId['fixture-event-c'].aliases = ['fixture-event-b-old']; });
  assert.match(rulesHit(r, 2)[0].message, /also an alias/);
  r = await run((fx) => { fx.byId['fixture-event-c'].aliases = ['fixture-event-d']; });
  assert.match(rulesHit(r, 2)[0].message, /id of another record/);
  r = await run((fx) => { fx.byId['fixture-event-c'].aliases = ['fixture-event-c']; });
  assert.match(rulesHit(r, 2)[0].message, /own id/);
  r = await run((fx) => { fx.records.push(clone(fx.byId['fixture-event-c'])); });
  assert.match(rulesHit(r, 2)[0].message, /duplicate id/);
  // A new record whose id is somebody's former id.
  const direct = checkRules(
    [{ ...clone((await fixtures()).byId['fixture-event-c']), id: 'fixture-event-b-old' }],
    { events: [{ id: 'fixture-event-b', aliases: ['fixture-event-b-old'], status: 'active', when: { start: 1, end: 1 } }], regions: [] },
  );
  assert.match(direct.errors.find((e) => e.rule === 2).message, /already an alias/);
});

test('rule 3: every reference resolves', async () => {
  let r = await run((fx) => { fx.byId['fixture-event-a--fixture-event-b--caused'].from = 'fixture-event-zz'; });
  assert.ok(rulesHit(r, 3).some((e) => e.path === '/from'));
  r = await run((fx) => { fx.byId['fixture-event-a'].sources[0].source = 'fixture-source-99'; });
  assert.equal(rulesHit(r, 3)[0].path, '/sources/0/source');
  r = await run((fx) => { fx.byId['fixture-event-g--fixture-event-t--caused'].dispute.sources[0].source = 'fixture-event-a'; });
  assert.equal(rulesHit(r, 3)[0].path, '/dispute/sources/0/source');
  r = await run((fx) => { fx.byId['fixture-event-m'].supersededBy = 'fixture-source-1'; });
  assert.equal(rulesHit(r, 3)[0].path, '/supersededBy');
  r = await run((fx) => { fx.byId['fixture-event-f'].region = 'fixture-lane-9'; });
  assert.equal(rulesHit(r, 3)[0].path, '/region');
});

test('rule 4: arrow of time, lenient error, strict warning, date tie-break', async () => {
  let r = await run((fx) => { fx.byId['fixture-event-b'].when = { start: 1500, end: 1500 }; });
  assert.ok(rulesHit(r, 4).some((e) => e.id === 'fixture-event-b--fixture-event-d--enabled'));
  // Overlapping fuzzy intervals: lenient passes, strict warns.
  r = await run((fx) => {
    fx.byId['fixture-event-a'].when = { start: { min: 1190, max: 1230 }, end: null };
  });
  assert.equal(rulesHit(r, 4).length, 0, messages(r));
  assert.ok(r.warnings.some((w) => w.rule === 'strict-arrow' && w.id === 'fixture-event-a--fixture-event-b--caused'));
  // Same year, dates reversed.
  r = await run((fx) => { fx.byId['fixture-event-a2'].when.date = '1200-01-01'; });
  assert.match(rulesHit(r, 4)[0].message, /dated after/);
  // Same year, different calendars: no comparison, no error.
  r = await run((fx) => {
    fx.byId['fixture-event-a2'].when.date = '1200-01-01';
    fx.byId['fixture-event-a2'].when.calendar = 'gregorian';
  });
  assert.equal(rulesHit(r, 4).length, 0);
});

test('rule 5: the active edge graph is a DAG', async () => {
  const cycle = (fx) => {
    const back = clone(fx.byId['fixture-event-a--fixture-event-b--caused']);
    back.id = 'fixture-event-t--fixture-event-a--enabled';
    back.from = 'fixture-event-t';
    back.to = 'fixture-event-a';
    back.type = 'enabled';
    back.confidence = 'probable';
    back.sources = [{ source: 'fixture-source-1', locator: null }];
    // Give every event the same year so the arrow of time is silent and the
    // cycle is the only complaint.
    for (const rec of fx.records) if (rec.kind === 'event') rec.when = { start: 1200, end: 1200 };
    fx.records.push(back);
  };
  const r = await run(cycle);
  assert.equal(rulesHit(r, 5).length, 1, messages(r));
  assert.match(rulesHit(r, 5)[0].message, /cycle/);
  // A retracted edge does not close a cycle.
  const r2 = await run((fx) => {
    cycle(fx);
    fx.records[fx.records.length - 1].status = 'retracted';
  });
  assert.equal(rulesHit(r2, 5).length, 0, messages(r2));
});

test('rule 6: every node and edge cites a source', async () => {
  let r = await run((fx) => { fx.byId['fixture-event-a'].sources = []; });
  assert.equal(rulesHit(r, 6)[0].id, 'fixture-event-a');
  r = await run((fx) => { fx.byId['fixture-event-b--fixture-event-d--enabled'].sources = []; });
  assert.equal(rulesHit(r, 6)[0].id, 'fixture-event-b--fixture-event-d--enabled');
});

test('rule 7: explanation is non-trivial', async () => {
  const r = await run((fx) => { fx.byId['fixture-event-b--fixture-event-d--enabled'].explanation = 'Because.'; });
  assert.equal(rulesHit(r, 7).length, 1);
});

test('rule 8: disputed needs a dispute with text and sources, and only disputed has one', async () => {
  let r = await run((fx) => { fx.byId['fixture-event-g--fixture-event-t--caused'].dispute = null; });
  assert.equal(rulesHit(r, 8).length, 1);
  r = await run((fx) => { fx.byId['fixture-event-g--fixture-event-t--caused'].dispute.text = 'No.'; });
  assert.equal(rulesHit(r, 8)[0].path, '/dispute/text');
  r = await run((fx) => { fx.byId['fixture-event-g--fixture-event-t--caused'].dispute.sources = []; });
  assert.equal(rulesHit(r, 8)[0].path, '/dispute/sources');
  r = await run((fx) => { fx.byId['fixture-event-g--fixture-event-t--caused'].confidence = 'probable'; });
  assert.match(rulesHit(r, 8)[0].message, /must be marked disputed/);
});

test('rule 9: consensus needs two sources by different authors', async () => {
  let r = await run((fx) => { fx.byId['fixture-event-a--fixture-event-b--caused'].sources.pop(); });
  assert.equal(rulesHit(r, 9).length, 1);
  r = await run((fx) => { fx.byId['fixture-source-2'].creators = ['Fixture Author One']; });
  assert.equal(rulesHit(r, 9).length, 2, messages(r));
  // Spelling variants of one name are one author.
  r = await run((fx) => { fx.byId['fixture-source-2'].creators = ['ONE, Fixture Áuthor']; });
  assert.equal(rulesHit(r, 9).length, 2, messages(r));
  // A third source by a genuinely different author restores consensus.
  r = await run((fx) => {
    fx.byId['fixture-source-2'].creators = ['Fixture Author One'];
    fx.byId['fixture-event-a--fixture-event-b--caused'].sources.push({ source: 'fixture-source-3', locator: null });
    fx.byId['fixture-event-c--fixture-event-t--precondition-of'].sources.push({ source: 'fixture-source-3', locator: null });
  });
  assert.equal(rulesHit(r, 9).length, 0, messages(r));
});

test('rule 10: WGS84 bounds, region required without a place', async () => {
  // The coordinates live on the place now, so that is where the bounds are
  // checked; tests/place-rules.test.mjs has the rest of the kind.
  let r = await run((fx) => { fx.byId['fixture-place-a'].where.lon = 181; });
  assert.equal(rulesHit(r, 10)[0].path, '/where/lon');
  r = await run((fx) => { fx.byId['fixture-place-a'].where.lat = -91; });
  assert.equal(rulesHit(r, 10)[0].path, '/where/lat');
  r = await run((fx) => { fx.byId['fixture-actor-one'].where.lon = 181; });
  assert.equal(rulesHit(r, 10)[0].path, '/where/lon');
  r = await run((fx) => { fx.byId['fixture-event-f'].region = null; });
  assert.equal(rulesHit(r, 10)[0].path, '/region');
});

test('rule 11: status rules', async () => {
  let r = await run((fx) => { fx.byId['fixture-event-m'].supersededBy = null; });
  assert.equal(rulesHit(r, 11)[0].path, '/supersededBy');
  r = await run((fx) => { fx.byId['fixture-event-a'].supersededBy = 'fixture-event-b'; });
  assert.match(rulesHit(r, 11)[0].message, /active record is not superseded/);
  r = await run((fx) => { fx.byId['fixture-event-d'].status = 'retracted'; });
  assert.ok(rulesHit(r, 11).some((e) => e.id === 'fixture-event-d' && /active edge/.test(e.message)));
  assert.ok(rulesHit(r, 11).some((e) => e.id === 'fixture-event-b--fixture-event-d--enabled'));
  r = await run((fx) => { fx.byId['fixture-source-2'].status = 'retracted'; });
  assert.ok(rulesHit(r, 11).some((e) => /cite the retracted source/.test(e.message)));
});

test('rule 12: licence per directory, authors non-empty', async () => {
  let r = await run((fx) => { fx.byId['fixture-event-a'].license = 'PD'; });
  assert.equal(rulesHit(r, 12)[0].path, '/license');
  r = await run((fx) => { fx.byId['fixture-source-1'].authors = []; });
  assert.equal(rulesHit(r, 12)[0].path, '/authors');
});

test('rule 13: source identifiers per type', async () => {
  let r = await run((fx) => { fx.byId['fixture-source-1'].isbn = null; });
  assert.match(rulesHit(r, 13)[0].message, /isbn, doi or url/);
  r = await run((fx) => { fx.byId['fixture-source-3'].url = 'javascript:alert(1)'; });
  assert.equal(rulesHit(r, 13)[0].path, '/url');
  r = await run((fx) => { fx.byId['fixture-source-3'].accessed = null; });
  assert.equal(rulesHit(r, 13)[0].path, '/accessed');
  r = await run((fx) => { fx.byId['fixture-source-4'].reference = null; });
  assert.match(rulesHit(r, 13)[0].message, /repository and reference/);
  r = await run((fx) => { fx.byId['fixture-source-1'].creators = []; });
  assert.equal(rulesHit(r, 13)[0].path, '/creators');
});

test('rule 14: an event\'s actors resolve, with a role each', async () => {
  // The fixture set is the passing case: three events carry actors.
  let r = await run();
  assert.equal(rulesHit(r, 14).length, 0, messages(r));

  r = await run((fx) => { fx.byId['fixture-event-a'].actors = [{ actor: 'nobody-at-all', role: 'leader' }]; });
  assert.equal(rulesHit(r, 14)[0].path, '/actors/0/actor');
  // A source is not an actor, however well the id resolves.
  r = await run((fx) => { fx.byId['fixture-event-a'].actors = [{ actor: 'fixture-source-1', role: 'leader' }]; });
  assert.equal(rulesHit(r, 14)[0].path, '/actors/0/actor');
  r = await run((fx) => { fx.byId['fixture-event-a'].actors[0].role = '   '; });
  assert.equal(rulesHit(r, 14)[0].path, '/actors/0/role');
  // Two roles for one actor in one event are two facts; the same role twice
  // is a duplicate, whatever the casing.
  r = await run((fx) => {
    fx.byId['fixture-event-a'].actors.push({ actor: 'fixture-actor-one', role: 'target' });
  });
  assert.equal(rulesHit(r, 14).length, 0, messages(r));
  r = await run((fx) => {
    fx.byId['fixture-event-a'].actors.push({ actor: 'fixture-actor-one', role: 'Leader' });
  });
  assert.equal(rulesHit(r, 14)[0].path, '/actors/1');
});

test('rule 14: an actor has at least one name, none repeated', async () => {
  let r = await run((fx) => { fx.byId['fixture-actor-one'].names = []; });
  assert.equal(rulesHit(r, 14)[0].path, '/names');
  r = await run((fx) => { fx.byId['fixture-actor-one'].names = ['  ']; });
  assert.equal(rulesHit(r, 14)[0].path, '/names');
  r = await run((fx) => { fx.byId['fixture-actor-one'].names = ['One', 'One']; });
  assert.equal(rulesHit(r, 14)[0].path, '/names/1');
});

test('rules 6, 10, 15 reach actors too', async () => {
  let r = await run((fx) => { fx.byId['fixture-actor-two'].sources = []; });
  assert.equal(rulesHit(r, 6)[0].path, '/sources');
  // An actor needs no lane: it is reached through its events, never put on
  // the timeline alone.
  r = await run((fx) => { fx.byId['fixture-actor-one'].where = null; });
  assert.equal(r.errors.length, 0, messages(r));
  r = await run((fx) => { fx.byId['fixture-actor-one'].where.lat = 91; });
  assert.equal(rulesHit(r, 10)[0].path, '/where/lat');
  r = await run((fx) => { fx.byId['fixture-actor-one'].when = { start: 0, end: 1240 }; });
  assert.equal(rulesHit(r, 15)[0].path, '/when/start');
  r = await run((fx) => { fx.byId['fixture-actor-one'].when = { start: 1240, end: 1180 }; });
  assert.equal(rulesHit(r, 15)[0].path, '/when/end');
});

test('rule 11: a retired actor cannot be referenced by an active event', async () => {
  let r = await run((fx) => {
    fx.byId['fixture-actor-one'].status = 'retracted';
  });
  const hits = rulesHit(r, 11);
  assert.ok(hits.some((e) => e.id === 'fixture-actor-one'), messages(r));
  assert.ok(hits.some((e) => e.id === 'fixture-event-a' && e.path === '/actors/0/actor'), messages(r));
  // A relation is a reference like any other: an active one naming a retired
  // actor is the same error from both ends.
  assert.ok(hits.some((e) => e.id === 'fixture-actor-one--fixture-actor-two--led' && e.path === '/from'), messages(r));
  // Retired and unreferenced is fine — by no event and by no relation.
  r = await run((fx) => {
    fx.byId['fixture-actor-one'].status = 'retracted';
    fx.records = fx.records.filter((rec) => rec.kind !== 'relation' || (rec.from !== 'fixture-actor-one' && rec.to !== 'fixture-actor-one'));
    for (const rec of fx.records) {
      if (rec.kind === 'event') rec.actors = (rec.actors ?? []).filter((a) => a.actor !== 'fixture-actor-one');
    }
  });
  assert.equal(rulesHit(r, 11).length, 0, messages(r));
});

test('warnings: an unused actor, and an event outside an actor\'s dates', async () => {
  // Unused means named by no event and standing in no relation: an actor
  // reachable from another actor's card is used.
  let r = await run((fx) => {
    fx.records = fx.records.filter((rec) => rec.kind !== 'relation' || rec.to !== 'fixture-actor-two');
    for (const rec of fx.records) {
      if (rec.kind === 'event') rec.actors = (rec.actors ?? []).filter((a) => a.actor !== 'fixture-actor-two');
    }
  });
  assert.ok(r.warnings.some((w) => w.rule === 'actor-unused' && w.id === 'fixture-actor-two'));
  // Posthumous events are real, so this is a warning and not an error.
  r = await run((fx) => { fx.byId['fixture-event-t'].actors.push({ actor: 'fixture-actor-one', role: 'invoked' }); });
  assert.equal(r.errors.length, 0, messages(r));
  assert.ok(r.warnings.some((w) => w.rule === 'actor-outside-when' && w.id === 'fixture-event-t'));
  // An ongoing actor is never outside anything later than its start.
  assert.equal(r.warnings.filter((w) => w.rule === 'actor-outside-when').length, 1);
});

test('rule 15: no year 0, ordered bounds, end after start', async () => {
  let r = await run((fx) => { fx.byId['fixture-event-a'].when = { start: 0, end: 0 }; });
  assert.equal(rulesHit(r, 15)[0].path, '/when/start');
  r = await run((fx) => { fx.byId['fixture-event-a'].when = { start: { min: 1210, max: 1200 }, end: null }; });
  assert.match(rulesHit(r, 15)[0].message, /min must not be after max/);
  r = await run((fx) => { fx.byId['fixture-event-f'].when = { start: 1260, end: 1250 }; });
  assert.equal(rulesHit(r, 15)[0].path, '/when/end');
  r = await run((fx) => { fx.byId['fixture-source-1'].year = 0; });
  assert.equal(rulesHit(r, 15)[0].path, '/year');
  // BCE ordering goes through toAstronomical: -1 → 1 is one year, fine.
  r = await run((fx) => {
    for (const rec of fx.records) if (rec.kind === 'event') rec.when = { start: -1, end: 1 };
  });
  assert.equal(rulesHit(r, 15).length, 0, messages(r));
});

test('a bundle validates against a topology it is not part of', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const newEvent = clone(fx.byId['fixture-event-h']);
  newEvent.id = 'fixture-event-new';
  newEvent.title = 'Fixture event NEW';
  const newEdge = clone(fx.byId['fixture-event-b--fixture-event-d--enabled']);
  newEdge.id = 'fixture-event-t--fixture-event-new--caused';
  newEdge.from = 'fixture-event-t';
  newEdge.to = 'fixture-event-new';
  newEdge.type = 'caused';
  const r = validate([newEvent, newEdge], topology, await schemas());
  assert.equal(r.errors.length, 0, messages(r));
  assert.deepEqual(r.warnings, []);
  // Referencing something in neither the bundle nor the topology fails.
  newEdge.from = 'fixture-event-ghost';
  newEdge.id = 'fixture-event-ghost--fixture-event-new--caused';
  const bad = validate([newEvent, newEdge], topology, await schemas());
  assert.ok(bad.errors.some((e) => e.rule === 3 && e.path === '/from'));
});

test('an invalid schema set refuses to validate anything (rule 1 of the schema itself)', async () => {
  const files = await schemas();
  files['v1/event.json'].properties.title.format = 'x';
  const r = validate([], {}, files);
  assert.equal(r.errors.length, 1);
  assert.equal(r.errors[0].kind, 'schema');
});
