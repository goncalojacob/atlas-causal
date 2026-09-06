// The spine: the projection of the in-memory topology that every page reads
// whole, and since H3c the only graph file the index writes. Held here to
// the field table in docs/health/h3a-brief.md (A3), to `when` carried
// verbatim (A1), to the edge tuple (A2) and to the tombstone list (A10) —
// over the fixtures and over the repository's own data, because the two
// disagree about which shapes exist: only the fixtures hold a retracted
// edge, only the repository holds a merged event.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { buildSpine, buildTopology, edgeId } from '../src/validate/core.js';
import { KINDS } from '../src/kinds.js';
import { buildIndex } from '../tools/build-index.mjs';
import { atlasFromTopology, FIXTURE_DATA, ROOT, fixtures, topologyOf } from './helpers.mjs';

const DATA = path.join(ROOT, 'data');

// The atlas over the in-memory build the spine is projected from — the
// reference every count in the spine is checked against (helpers.mjs).
const atlasOf = (dataDir) => atlasFromTopology(dataDir);

const ENVELOPE = ['id', 'kind', 'status', 'supersededBy', 'aliases'];
// `revised` is on the five kinds a card fetches the record file of — the
// four here plus the edge tuple's sixth slot — because that is what the file
// is asked for with (`?v=`, H3b). A presence and a relation have no file
// anybody fetches, so they do not carry it.
const FIELDS = {
  event: [...ENVELOPE, 'wikidata', 'wikipedia', 'title', 'revised', 'when', 'place', 'region', 'weight', 'actors', 'citesCount'],
  actor: [...ENVELOPE, 'wikidata', 'wikipedia', 'name', 'names', 'revised', 'actorType', 'when', 'citesCount'],
  place: [...ENVELOPE, 'wikidata', 'wikipedia', 'name', 'names', 'revised', 'where', 'region', 'citesCount'],
  presence: [...ENVELOPE, 'wikidata', 'wikipedia', 'actor', 'when', 'geometry', 'dependencyOf', 'dependencyKind', 'capital', 'confidence'],
  relation: [...ENVELOPE, 'wikidata', 'wikipedia', 'from', 'to', 'type', 'when', 'note'],
  // An office carries `revised` because `?office=` is an address and the
  // card may fetch the record; a tenure has no address of its own and does
  // not, the way a relation does not.
  office: [...ENVELOPE, 'wikidata', 'wikipedia', 'of', 'title', 'category', 'revised', 'when'],
  tenure: [...ENVELOPE, 'wikidata', 'wikipedia', 'person', 'office', 'when', 'startedBy', 'note'],
  narrative: [...ENVELOPE, 'wikidata', 'wikipedia', 'title', 'revised', 'summary', 'authors', 'window', 'steps'],
};
// A tombstone is fetched like any other record — 175 retracted events reach
// a card with their own fields — so it keeps `revised` too.
const TOMBSTONE = ['id', 'kind', 'status', 'supersededBy', 'aliases', 'wikidata', 'title', 'name', 'names', 'when', 'place', 'region', 'revised'];

// Against the registry, not against a list written twice: a ninth kind is
// one entry in src/kinds.js, and it must not be able to arrive with nowhere
// in the spine to go. `edge` is here as a tuple and `source` is deliberately
// out — the sources index carries every bibliographic field and the spine
// would only repeat it (A3).
test('every kind the registry knows is in the spine, or is the one that is not', () => {
  assert.deepEqual([...KINDS].sort(), [...Object.keys(FIELDS), 'edge', 'source'].sort());
});

for (const [label, dir] of [['the fixtures', FIXTURE_DATA], ['the repository', DATA]]) {
  test(`the spine carries the field table over ${label}, and nothing else`, async () => {
    const topology = await topologyOf(dir);
    const spine = buildSpine(topology);
    let seen = 0;
    for (const [kind, allowed] of Object.entries(FIELDS)) {
      for (const entry of spine[`${kind}s`]) {
        seen += 1;
        assert.equal(entry.kind, kind, entry.id);
        const keys = entry.status === 'active' ? allowed : TOMBSTONE;
        for (const key of Object.keys(entry)) {
          assert.ok(keys.includes(key), `${entry.id} (${entry.status}) carries ${key}`);
        }
      }
    }
    assert.ok(seen > 0);
    // The two fields nothing draws, and the shard list the year already
    // answers: dropped from the spine, kept in the topology (A3).
    assert.ok(spine.events.every((e) => !Object.hasOwn(e, 'regionMethod')));
    assert.ok(spine.places.every((p) => !Object.hasOwn(p, 'regionMethod')));
    assert.ok(spine.presences.every((p) => !Object.hasOwn(p, 'presenceType')));
    assert.ok(spine.presences.every((p) => Object.keys(p.geometry).length === 1));
    assert.ok(topology.presences.every((p) => Object.hasOwn(p, 'presenceType')), 'the topology is unchanged');
  });

  test(`every field the spine keeps is the record's own over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const spine = buildSpine(topology);
    for (const kind of ['event', 'actor', 'place', 'presence', 'relation', 'narrative']) {
      const inTopology = new Map(topology[`${kind}s`].map((r) => [r.id, r]));
      for (const entry of spine[`${kind}s`]) {
        const source = inTopology.get(entry.id);
        assert.ok(source, `${entry.id} is in the spine and not in the topology`);
        for (const [key, value] of Object.entries(entry)) {
          if (key === 'kind' || key === 'citesCount' || key === 'geometry') continue;
          assert.deepEqual(value, source[key], `${entry.id}: ${key}`);
        }
      }
      assert.equal(spine[`${kind}s`].length, topology[`${kind}s`].length);
    }
  });

  // A1: an event that runs from a date to no end at all, and one whose
  // calendar is not the reader's, are both drawn from the object.
  test(`an interval is carried verbatim over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const spine = buildSpine(topology);
    for (const kind of ['event', 'actor', 'presence', 'relation']) {
      const inTopology = new Map(topology[`${kind}s`].map((r) => [r.id, r]));
      for (const entry of spine[`${kind}s`]) {
        assert.deepEqual(entry.when, inTopology.get(entry.id).when, entry.id);
      }
    }
    assert.ok(spine.events.some((e) => Object.hasOwn(e.when ?? {}, 'date')), 'a day, not only a year');
  });

  // A2: the id is synthesised on load, so it had better be synthesisable.
  test(`every edge id is from--to--type over ${label}`, async () => {
    const topology = await topologyOf(dir);
    for (const edge of topology.edges) assert.equal(edge.id, edgeId(edge), edge.id);
    const spine = buildSpine(topology);
    assert.equal(spine.edges.length, topology.edges.length);
    for (const [i, tuple] of spine.edges.entries()) {
      const edge = topology.edges[i];
      assert.ok(Array.isArray(tuple), `${edge.id} is not a tuple`);
      assert.deepEqual(tuple, [edge.from, edge.to, edge.type, edge.confidence, edge.status, edge.revised ?? null]);
      assert.equal(edgeId({ from: tuple[0], to: tuple[1], type: tuple[2] }), edge.id);
    }
  });

  // A8: `citesCount` is the number three cards print beside a record, and
  // the atlas built from the topology is what prints it today.
  test(`citesCount equals what the card counts over ${label}`, async () => {
    const spine = buildSpine(await topologyOf(dir));
    const atlas = await atlasOf(dir);
    let counted = 0;
    for (const kind of ['event', 'actor', 'place']) {
      for (const entry of spine[`${kind}s`]) {
        if (entry.status !== 'active') {
          assert.ok(!Object.hasOwn(entry, 'citesCount'), `${entry.id}: a tombstone cites nothing`);
          continue;
        }
        assert.equal(entry.citesCount, atlas.citationCount(kind, entry.id), entry.id);
        counted += entry.citesCount;
      }
    }
    assert.ok(counted > 0, 'nothing cites anything');
  });
}

// A2 again: the two shapes that cannot be said in six slots. Neither exists
// in either dataset today — no edge has ever been renamed or merged — and
// both are what keeps an old ?chain= URL opening, so they are made here.
test('an edge with an alias or a merge hop is written whole', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const edge = topology.edges[0];
  const aliased = buildSpine({ ...topology, edges: [{ ...edge, aliases: ['fixture-old-edge-id'] }] });
  assert.deepEqual(aliased.edges[0], {
    from: edge.from, to: edge.to, type: edge.type, confidence: edge.confidence,
    status: edge.status, revised: edge.revised ?? null, supersededBy: null, aliases: ['fixture-old-edge-id'],
  });
  const merged = buildSpine({ ...topology, edges: [{ ...edge, status: 'merged', supersededBy: 'a--b--caused' }] });
  assert.equal(merged.edges[0].supersededBy, 'a--b--caused');
  // And an id that is not from--to--type keeps itself, rather than being
  // silently renamed by the loader that synthesises one.
  const odd = buildSpine({ ...topology, edges: [{ ...edge, id: 'hand-written-edge-id' }] });
  assert.equal(odd.edges[0].id, 'hand-written-edge-id');
});

test('a retracted edge keeps its status, which is what keeps it out of the graph', async () => {
  const spine = buildSpine(await topologyOf(FIXTURE_DATA));
  const retracted = spine.edges.filter((e) => (Array.isArray(e) ? e[4] : e.status) !== 'active');
  assert.equal(retracted.length, 1, 'the fixtures hold one retracted edge');
});

// A10: 175 retracted events reach a card, and the card's head and meta line
// are built from the region, the start year and the place.
test('a tombstone keeps its head and meta line and drops the rest', async () => {
  const spine = buildSpine(await topologyOf(DATA));
  const tombstones = spine.events.filter((e) => e.status !== 'active');
  assert.ok(tombstones.length > 100, `${tombstones.length} tombstones`);
  for (const entry of tombstones) {
    assert.ok(Object.hasOwn(entry, 'title') && Object.hasOwn(entry, 'when'));
    assert.ok(Object.hasOwn(entry, 'place') && Object.hasOwn(entry, 'region'));
    assert.ok(!Object.hasOwn(entry, 'weight') && !Object.hasOwn(entry, 'actors'));
    assert.ok(!Object.hasOwn(entry, 'wikipedia'));
  }
  assert.ok(spine.events.some((e) => e.status === 'merged' && e.supersededBy), 'the merge hop survives');
});

test('the spine is in the built index, named in the manifest, and stable', async () => {
  const first = await buildIndex(FIXTURE_DATA);
  const second = await buildIndex(FIXTURE_DATA);
  const manifest = JSON.parse(first.files['manifest.json']);
  assert.match(manifest.files.spine, /^index\/spine-[0-9a-f]{12}\.json$/);
  const name = path.basename(manifest.files.spine);
  assert.ok(Object.hasOwn(first.files, name));
  assert.equal(first.files[name], second.files[name]);
  // And it is the only graph file: since H3c the index writes the projection
  // and not the thing projected.
  assert.deepEqual(
    Object.keys(first.files).filter((f) => f.startsWith('topology')),
    [],
    'the index still writes a topology file',
  );
});
