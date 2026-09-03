// The CShapes import, against a synthetic topology small enough to reason
// about by hand: two entities, one of them a dependency of the other for
// part of its life, over a shard boundary. Nothing here touches the real
// 7.6 MB file — that one is checked by its sha256 when the tool runs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { decodeCollection, ringFrom, arcIndex, decodeArcs } from '../tools/import/topojson.mjs';
import { douglasPeucker, quantize, simplifyArc, pruneGeometry, ringArea, keepRing, round } from '../tools/import/simplify.mjs';
import { planImport, slug, yearOf, shardsTouched, shardFile, dayAfter, runImport, reportMarkdown, IMPORT_AUTHOR, SHARDS, DATA_END, MAP_FILE } from '../tools/import/cshapes.mjs';

const SHARD_CUT = [{ from: 1886, to: 1913 }, { from: 1914, to: 1945 }, { from: 1946, to: 2019 }];

// Two squares sharing their whole eastern/western edge, so the shared border
// is one arc and simplification cannot pull them apart.
//   arc 0: the shared edge, north to south
//   arc 1: the western loop back
//   arc 2: the eastern loop back
function syntheticTopology() {
  return {
    type: 'Topology',
    arcs: [
      [[0, 10], [0, 5.02], [0, 5], [0, 0]],
      [[0, 0], [-10, 0], [-10, 4.99], [-10, 10], [0, 10]],
      [[0, 10], [10, 10], [10, 5.01], [10, 0], [0, 0]],
    ],
    objects: {
      cshapes_2_gw: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Polygon',
            arcs: [[0, 1]],
            properties: {
              gwcode: 1, country_name: 'Westland', start: '1886-01-01', end: '1913-06-30',
              status: 'independent', owner: '1', capname: 'West City', caplong: -5, caplat: 5, b_def: 1, fid: 11,
            },
          },
          {
            type: 'Polygon',
            arcs: [[0, 1]],
            properties: {
              gwcode: 1, country_name: 'Westland Republic', start: '1913-07-01', end: DATA_END,
              status: 'independent', owner: '1', capname: 'West City', caplong: -5, caplat: 5, b_def: 1, fid: 12,
            },
          },
          {
            type: 'Polygon',
            arcs: [[2, -1]],
            properties: {
              gwcode: 2, country_name: 'Eastland', start: '1886-01-01', end: '1960-12-31',
              status: 'colony', owner: '1', capname: 'East City', caplong: 5, caplat: 5, b_def: 1, fid: 21,
            },
          },
        ],
      },
    },
  };
}

const plan = (over = (t) => t, options = {}) => {
  const topology = over(syntheticTopology());
  const simplified = { ...topology, arcs: topology.arcs.map((a) => simplifyArc(a, { tolerance: 0.1, decimals: 3 })) };
  const features = decodeCollection(simplified, 'cshapes_2_gw')
    .map((f) => ({ properties: f.properties, geometry: pruneGeometry(f.geometry, { minArea: 0.005 }) }));
  return planImport(features, { created: '2026-09-02', shards: SHARD_CUT, map: {}, ...options });
};

// --- topojson -------------------------------------------------------------

test('arc indices, reversal and shared endpoints', () => {
  assert.deepEqual(arcIndex(3), { index: 3, reversed: false });
  assert.deepEqual(arcIndex(-1), { index: 0, reversed: true });
  assert.deepEqual(arcIndex(-4), { index: 3, reversed: true });
  const arcs = [[[0, 0], [1, 1]], [[1, 1], [2, 2]]];
  // The second arc contributes all but its first point: the join is not doubled.
  assert.deepEqual(ringFrom(arcs, [0, 1]), [[0, 0], [1, 1], [2, 2]]);
  assert.deepEqual(ringFrom(arcs, [-1]), [[1, 1], [0, 0]]);
});

test('a transform decodes delta-encoded arcs', () => {
  const decoded = decodeArcs({
    transform: { scale: [0.5, 0.5], translate: [10, 20] },
    arcs: [[[0, 0], [2, 4], [2, 0]]],
  });
  assert.deepEqual(decoded[0], [[10, 20], [11, 22], [12, 22]]);
});

test('a geometry that is not a polygon is refused rather than half-decoded', () => {
  const topology = syntheticTopology();
  topology.objects.cshapes_2_gw.geometries.push({ type: 'Point', coordinates: [0, 0], properties: {} });
  assert.equal(decodeCollection(topology, 'cshapes_2_gw').at(-1).geometry, null);
  assert.throws(() => decodeCollection({ objects: { x: { type: 'Polygon' } }, arcs: [] }, 'x'), /GeometryCollection/);
});

// --- simplification -------------------------------------------------------

test('Douglas-Peucker keeps the endpoints and drops what is inside the band', () => {
  const line = [[0, 0], [1, 0.01], [2, -0.01], [3, 0]];
  assert.deepEqual(douglasPeucker(line, 0.1), [[0, 0], [3, 0]]);
  assert.equal(douglasPeucker(line, 0.001).length, 4);
  // A real corner survives whatever the tolerance.
  assert.deepEqual(douglasPeucker([[0, 0], [1, 5], [2, 0]], 0.1), [[0, 0], [1, 5], [2, 0]]);
  // Long enough that a recursive implementation would have gone over.
  const long = Array.from({ length: 200000 }, (_, i) => [i / 1000, Math.sin(i / 100)]);
  assert.ok(douglasPeucker(long, 0.5).length < long.length);
});

test('quantization rounds, drops the duplicates it makes, and keeps two ends', () => {
  assert.deepEqual(quantize([[1.23456, 2.34567], [1.23461, 2.34571], [9, 9]], 3), [[1.235, 2.346], [9, 9]]);
  // Everything collapsed onto one point still returns a segment.
  assert.equal(quantize([[1.0001, 2.0001], [1.0002, 2.0002]], 3).length, 2);
  assert.equal(quantize([[1, 2]], 3).length, 1);
  assert.equal(Object.is(round(-0.0001, 3), 0), true, 'a rounded -0 is written as 0');
});

test('a ring that simplification flattened is dropped, not drawn', () => {
  assert.equal(keepRing([[0, 0], [1, 0], [0, 0]], 0.005), null, 'three points is not a ring');
  assert.equal(keepRing([[0, 0], [1, 0], [2, 0], [0, 0]], 0.005), null, 'a ring with no area is a line');
  const square = keepRing([[0, 0], [1, 0], [1, 1], [0, 1]], 0.005);
  assert.deepEqual(square.at(-1), [0, 0], 'an open ring is closed');
  assert.equal(Math.abs(ringArea(square)), 1);
});

test('pruning drops a polygon whose outer ring went, and its holes with it', () => {
  const hole = [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], [[1, 1], [1.001, 1], [1.001, 1.001], [1, 1.001], [1, 1]]];
  const kept = pruneGeometry({ type: 'Polygon', coordinates: hole }, { minArea: 0.005 });
  assert.equal(kept.coordinates.length, 1, 'the sliver hole is gone, the country is not');
  const multi = { type: 'MultiPolygon', coordinates: [hole, [[[0, 0], [1, 0], [2, 0], [0, 0]]]] };
  assert.equal(pruneGeometry(multi, { minArea: 0.005 }).type, 'Polygon', 'one polygon left is a Polygon');
  assert.equal(pruneGeometry({ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [0, 0]]] }, { minArea: 0.005 }), null);
  assert.equal(pruneGeometry(null), null);
});

test('simplifying the arcs keeps a shared border shared', () => {
  const topology = syntheticTopology();
  const simplified = { ...topology, arcs: topology.arcs.map((a) => simplifyArc(a, { tolerance: 0.1, decimals: 3 })) };
  const [west, , east] = decodeCollection(simplified, 'cshapes_2_gw').map((f) => f.geometry.coordinates[0]);
  // The middle points of the shared edge were within the tolerance and are
  // gone from both — the border is still one line, drawn once.
  const shared = (ring) => [...new Set(ring.filter(([x]) => x === 0).map(([, y]) => y))].sort((a, b) => a - b);
  assert.deepEqual(shared(west), [0, 10]);
  assert.deepEqual(shared(east), shared(west), 'the intermediate points went from both sides at once');
});

// --- the plan -------------------------------------------------------------

test('slugs, years and the shards an interval touches', () => {
  assert.equal(slug('Côte d\'Ivoire'), 'cote-d-ivoire');
  assert.equal(slug('Congo, Democratic Republic of'), 'congo-democratic-republic-of');
  assert.equal(yearOf('1886-01-01'), 1886);
  assert.deepEqual(shardsTouched(1886, 1913, SHARD_CUT).map(shardFile), ['geo/presences/1886-1913.json']);
  assert.equal(shardsTouched(1912, 1950, SHARD_CUT).length, 3);
  // An open end runs to the last shard, because that is where the data stops.
  assert.equal(shardsTouched(1913, null, SHARD_CUT).length, 3);
  assert.equal(shardsTouched(1886, 2019, SHARDS).length, SHARDS.length);
});

test('one actor per entity, named over time, open when the data does not end it', () => {
  const { actors, problems } = plan();
  assert.deepEqual(problems, []);
  assert.deepEqual(actors.map((a) => a.id), ['westland-republic', 'eastland']);
  const west = actors[0];
  assert.deepEqual(west.names, ['Westland', 'Westland Republic'], 'both names it had, oldest first');
  assert.deepEqual(west.when, { start: 1886, end: null }, 'it reaches 2019, so it is left open');
  assert.equal(west.actorType, 'polity');
  assert.equal(west.license, 'CC-BY-NC-SA-4.0');
  assert.deepEqual(west.authors, [IMPORT_AUTHOR]);
  assert.deepEqual(west.where, { lon: -5, lat: 5, precision: 'city', label: 'West City' });
  assert.deepEqual(west.sources, [{ source: 'cshapes-2-0', locator: 'gwcode 1' }]);
  assert.match(west.summary, /2 periods of territorial validity/);
  assert.deepEqual(actors[1].when, { start: 1886, end: 1960 }, 'it does end, so it is closed');
});

test('an actor the atlas already has is reused, not duplicated', () => {
  const options = { map: { 1: { actor: 'republic-of-westland' } }, existingActors: new Set(['republic-of-westland']) };
  const { actors, presences } = plan((t) => t, options);
  assert.deepEqual(actors.map((a) => a.id), ['eastland'], 'no second record for the mapped entity');
  assert.deepEqual(presences.filter((p) => p.actor === 'republic-of-westland').map((p) => p.id),
    ['republic-of-westland-1886', 'republic-of-westland-1913']);
  assert.equal(presences.find((p) => p.id === 'eastland-1886').dependencyOf, 'republic-of-westland');
});

test('an actor the mapping file names but nobody has written yet is created', () => {
  const { actors } = plan((t) => t, { map: { 1: { actor: 'republic-of-westland', names: ['The Republic of Westland'] } } });
  const made = actors.find((a) => a.id === 'republic-of-westland');
  assert.ok(made, 'the import writes the record the file asks for');
  assert.deepEqual(made.names, ['The Republic of Westland'], "the file's names beat the source's");
  assert.deepEqual(made.authors, [IMPORT_AUTHOR]);
});

test('a slug two entities both want is a mapping decision, and says so', () => {
  const { problems } = plan((t) => {
    t.objects.cshapes_2_gw.geometries[2].properties.country_name = 'Westland Republic';
    return t;
  });
  assert.match(problems.join('\n'), new RegExp(`two CShapes segments want the actor id "westland-republic".*${MAP_FILE}`, 's'));
});

// --- splitting one code into two actors -----------------------------------

test('a split cuts a code by date into two actors, with two actor records', () => {
  const map = { 1: { actor: 'old-westland', names: ['Old Westland'], splits: [{ from: '1913-07-01', actor: 'new-westland' }] } };
  const { actors, presences, problems } = plan((t) => t, { map });
  assert.deepEqual(problems, []);
  assert.deepEqual(actors.map((a) => a.id), ['old-westland', 'new-westland', 'eastland']);
  assert.deepEqual(actors[0].when, { start: 1886, end: 1913 }, 'the first segment closes where the cut is');
  assert.deepEqual(actors[1].when, { start: 1913, end: null });
  assert.match(actors[1].summary, /this record holds the periods from 1913-07-01/);
  assert.deepEqual(presences.map((p) => p.id), ['old-westland-1886', 'new-westland-1913', 'eastland-1886']);
  assert.equal(presences[0].actor, 'old-westland');
  assert.equal(presences[1].actor, 'new-westland');
});

test('a sovereign is named as the actor it was on the day the ground was held', () => {
  const map = { 1: { actor: 'old-westland', splits: [{ from: '1913-07-01', actor: 'new-westland' }] } };
  // Eastland is a colony from 1886, so its sovereign is the code's first
  // segment and not the one the code ends as.
  const { presences } = plan((t) => t, { map });
  assert.equal(presences.find((p) => p.id === 'eastland-1886').dependencyOf, 'old-westland');
});

test('a split date the source does not draw is refused, with the boundaries named', () => {
  const map = { 1: { actor: 'old-westland', splits: [{ from: '1920-01-01', actor: 'new-westland' }] } };
  const { problems } = plan((t) => t, { map });
  assert.equal(problems.length, 2, 'the bad date, and the empty first segment it leaves');
  assert.match(problems[0], /entity 1: 1920-01-01 is not a boundary CShapes draws for it; the boundaries are 1913-07-01/);
  assert.equal(dayAfter('1913-06-30'), '1913-07-01');
  assert.equal(dayAfter('1899-12-31'), '1900-01-01', 'a year boundary');
  assert.equal(dayAfter('1904-02-28'), '1904-02-29', 'a leap day');
});

// --- the report -----------------------------------------------------------

test('the report lists codes that are both held and independent and are not cut', () => {
  // Eastland is a colony until 1960 and its own state after it, under one code.
  const { report } = plan((t) => {
    t.objects.cshapes_2_gw.geometries.push({
      type: 'Polygon',
      arcs: [[2, -1]],
      properties: {
        gwcode: 2, country_name: 'Eastland', start: '1961-01-01', end: DATA_END,
        status: 'independent', owner: '2', capname: 'East City', caplong: 5, caplat: 5, b_def: 1, fid: 22,
      },
    });
    return t;
  });
  assert.equal(report.length, 1);
  assert.deepEqual(report[0], {
    code: 2, actor: 'eastland', name: 'Eastland', periods: 2, dependent: 1, independent: 1,
    firstIndependent: '1961-01-01', lastDependent: '1960-12-31', status: ['colony'],
  });
  assert.match(reportMarkdown(report, { generated: '2026-09-03' }), /\| 2 \| `eastland` \| Eastland \| 2 \| 1 \(colony\) \| 1961-01-01 \| 1960-12-31 \|/);
  assert.match(reportMarkdown(report, { generated: '2026-09-03' }), /Generated by/);
});

test('a code the mapping file already cuts is not in the report', () => {
  const withSplit = (map) => plan((t) => {
    t.objects.cshapes_2_gw.geometries.push({
      type: 'Polygon',
      arcs: [[2, -1]],
      properties: {
        gwcode: 2, country_name: 'Eastland', start: '1961-01-01', end: DATA_END,
        status: 'independent', owner: '2', capname: 'East City', caplong: 5, caplat: 5, b_def: 1, fid: 22,
      },
    });
    return t;
  }, { map });
  assert.equal(withSplit({}).report.length, 1);
  assert.deepEqual(withSplit({ 2: { actor: 'east-colony', splits: [{ from: '1961-01-01', actor: 'eastland' }] } }).report, []);
});

test('one presence per feature: id, dates, sovereign, capital and shards', () => {
  const { presences } = plan();
  assert.deepEqual(presences.map((p) => p.id), ['westland-republic-1886', 'westland-republic-1913', 'eastland-1886']);

  const first = presences[0];
  assert.deepEqual(first.when, { start: 1886, end: 1913, date: '1886-01-01', endDate: '1913-06-30' });
  assert.equal(first.dependencyOf, null);
  assert.equal(first.dependencyKind, null);
  assert.equal(first.presenceType, 'state');
  assert.equal(first.confidence, 'consensus');
  assert.deepEqual(first.geometry, { files: ['geo/presences/1886-1913.json'], key: '11' });

  const open = presences[1];
  assert.deepEqual(open.when, { start: 1913, end: null, date: '1913-07-01' }, 'no endDate on an open interval');
  assert.equal(open.geometry.files.length, 3, 'an open presence is in every shard from its start');

  const colony = presences[2];
  assert.equal(colony.actor, 'eastland');
  assert.equal(colony.dependencyOf, 'westland-republic');
  assert.equal(colony.dependencyKind, 'colony');
  assert.deepEqual(colony.capital, { lon: 5, lat: 5, precision: 'city', label: 'East City' });
  assert.deepEqual(colony.geometry.files, ['geo/presences/1886-1913.json', 'geo/presences/1914-1945.json', 'geo/presences/1946-2019.json']);
});

test('two features of one entity starting the same year get distinct ids', () => {
  const { presences } = plan((t) => {
    t.objects.cshapes_2_gw.geometries[1].properties.start = '1886-07-01';
    t.objects.cshapes_2_gw.geometries[0].properties.end = '1886-06-30';
    return t;
  });
  assert.deepEqual(presences.slice(0, 2).map((p) => p.id), ['westland-republic-1886', 'westland-republic-1886-b']);
});

test('an overlap of more than the year a border moved in is refused', () => {
  // The two Westland features already share 1913, which is legal: the model
  // has no bound finer than a year. A whole year of overlap is not.
  assert.deepEqual(plan().problems, []);
  const { problems } = plan((t) => {
    t.objects.cshapes_2_gw.geometries[0].properties.end = '1915-06-30';
    return t;
  });
  assert.match(problems.join('\n'), /overlap by more than the year a border moved in/);
});

test('a status the import does not know, and an owner that is nobody, are refused', () => {
  let { problems } = plan((t) => {
    t.objects.cshapes_2_gw.geometries[2].properties.status = 'condominium';
    return t;
  });
  assert.match(problems.join('\n'), /unknown status "condominium"/);
  ({ problems } = plan((t) => {
    t.objects.cshapes_2_gw.geometries[2].properties.owner = '999';
    return t;
  }));
  assert.match(problems.join('\n'), /owned by 999, which is in no CShapes entity/);
  // A dependency whose status says independent is a contradiction in the data.
  ({ problems } = plan((t) => {
    t.objects.cshapes_2_gw.geometries[2].properties.status = 'independent';
    return t;
  }));
  assert.match(problems.join('\n'), /owned by 1 but its status is "independent"/);
});

test('shards hold every feature whose interval touches them, keyed by fid', () => {
  const { shardFiles } = plan();
  assert.deepEqual([...shardFiles.keys()], SHARD_CUT.map(shardFile));
  const first = shardFiles.get('geo/presences/1886-1913.json');
  assert.deepEqual(first.features.map((f) => f.id), ['11', '12', '21'], 'sorted by key, so the file is stable');
  assert.deepEqual(first.features[0].properties, { presence: 'westland-republic-1886' });
  assert.equal(first.features[0].geometry.type, 'Polygon');
  // The feature that ended in 1913 is in the first shard and nowhere else.
  assert.deepEqual(shardFiles.get('geo/presences/1914-1945.json').features.map((f) => f.id), ['12', '21']);
  assert.deepEqual(shardFiles.get('geo/presences/1946-2019.json').features.map((f) => f.id), ['12', '21']);
});

test('the plan is deterministic: the same file twice is the same bytes', () => {
  assert.equal(JSON.stringify([...plan().shardFiles]), JSON.stringify([...plan().shardFiles]));
  assert.equal(JSON.stringify(plan().presences), JSON.stringify(plan().presences));
});

// --- the tool on disk -----------------------------------------------------

async function scratch() {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-cshapes-'));
  for (const sub of ['actors', 'presences', 'sources', path.join('geo', 'presences')]) {
    await mkdir(path.join(dir, sub), { recursive: true });
  }
  const file = path.join(dir, 'topology.json');
  await writeFile(file, JSON.stringify(syntheticTopology()), 'utf8');
  return { dir, file };
}

test('the tool refuses a file that is not the one it was written against', async () => {
  const { dir, file } = await scratch();
  const result = await runImport(file, dir, { check: true, today: '2026-09-02' });
  assert.match(result.failed[0], /not the 9f73468bb56aae6a6b22bb5e56bf5f3e013b9ee17c641aba37db97bcb5c1c3bc/);
  assert.deepEqual(result.written, []);
});

test('the tool is idempotent and never touches a record it does not own', async () => {
  const { dir, file } = await scratch();
  const first = await runImport(file, dir, { today: '2026-09-02' });
  assert.deepEqual(first.failed, []);
  assert.ok(first.notes[0].startsWith('warning:'), 'it says the file is not the expected one and carries on');
  assert.ok(first.written.length > 0);
  assert.deepEqual(first.removed, []);

  const before = await readdir(path.join(dir, 'presences'));
  const second = await runImport(file, dir, { today: '2030-01-01' });
  assert.deepEqual(second.failed, []);
  assert.deepEqual(second.removed, []);
  assert.deepEqual(await readdir(path.join(dir, 'presences')), before);
  const record = JSON.parse(await readFile(path.join(dir, 'presences', before[0]), 'utf8'));
  assert.equal(record.created, '2026-09-02', 'a record it already owns keeps the date it was first written');

  // Somebody else's record with a name the import wants: it stops.
  await writeFile(path.join(dir, 'actors', 'eastland.json'),
    JSON.stringify({ id: 'eastland', authors: [{ name: 'A Person', github: null }] }), 'utf8');
  const third = await runImport(file, dir, { today: '2026-09-02' });
  assert.match(third.failed.join('\n'), /was not written by the import/);
  assert.deepEqual(third.written, [], 'and writes nothing at all rather than half the import');
});

test('a file the import owns but no longer produces is removed', async () => {
  const { dir, file } = await scratch();
  await runImport(file, dir, { today: '2026-09-02' });
  await writeFile(path.join(dir, 'presences', 'gone-1900.json'),
    JSON.stringify({ id: 'gone-1900', authors: [IMPORT_AUTHOR], created: '2026-09-02' }), 'utf8');
  await writeFile(path.join(dir, 'geo', 'presences', '1700-1800.json'), '{}', 'utf8');
  const again = await runImport(file, dir, { today: '2026-09-02' });
  assert.deepEqual(again.removed.map((f) => f.split(path.sep).join('/')).sort(),
    ['geo/presences/1700-1800.json', 'presences/gone-1900.json']);
});
