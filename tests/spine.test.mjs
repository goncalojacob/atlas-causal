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
import { buildPresenceIndex, buildSpine, buildTopology, edgeId } from '../src/validate/core.js';
import { expandSpine } from '../src/data.js';
import { KINDS } from '../src/kinds.js';
import { buildIndex } from '../tools/build-index.mjs';
import { atlasFromTopology, FIXTURE_DATA, ROOT, fixtures, topologyOf } from './helpers.mjs';

const DATA = path.join(ROOT, 'data');

// The atlas over the in-memory build the spine is projected from — the
// reference every count in the spine is checked against (helpers.mjs).
const atlasOf = (dataDir) => atlasFromTopology(dataDir);


// ─── The oracle ────────────────────────────────────────────────────────────
//
// The nine object literals of `buildSpine` and `buildPresenceIndex`, copied
// here whole before I2 turns them into rows over an id table: `spineEntry` for
// the tombstones, `envelopeOf` for what every record carries whatever its kind,
// and `edgeInSpine` for the one kind that was already a row.
//
// They are installed *before* the change, against the projection they are a
// copy of, so that the oracle is proved right about the code it was taken from
// rather than written to fit the code that replaces it (index2 review,
// finding 7). Not a line of it may import the encoder's own tables: a test that
// shared them could not tell a wrong table from a wrong file.
//
// It does not move again. When a later run drops a field on purpose, the field
// comes out of here in the same commit and the diff says which.

const ORACLE_TOMBSTONE_KEYS = new Set(['id', 'kind', 'status', 'supersededBy', 'aliases', 'wikidata', 'title', 'name', 'names', 'when', 'place', 'region', 'revised']);
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function oracleEntry(entry) {
  if (entry.status === 'active') return entry;
  return Object.fromEntries(Object.entries(entry).filter(([key]) => ORACLE_TOMBSTONE_KEYS.has(key)));
}

function oracleEnvelope(record, kind) {
  const out = { id: record.id, kind, status: record.status, supersededBy: record.supersededBy ?? null, aliases: record.aliases ?? [] };
  if (typeof record.wikidata === 'string') out.wikidata = record.wikidata;
  if (isObject(record.wikipedia)) out.wikipedia = record.wikipedia;
  return out;
}

function oracleEdge(edge) {
  const named = edge.id === edgeId(edge);
  if (named && !edge.supersededBy && (edge.aliases ?? []).length === 0) {
    return [edge.from, edge.to, edge.type, edge.confidence, edge.status, edge.revised ?? null];
  }
  const out = {
    from: edge.from, to: edge.to, type: edge.type, confidence: edge.confidence,
    status: edge.status, revised: edge.revised ?? null,
    supersededBy: edge.supersededBy ?? null, aliases: edge.aliases ?? [],
  };
  if (!named) out.id = edge.id;
  return out;
}

// What an edge row decodes to, so that the oracle's edges can be held against
// the loader's records: the id the loader synthesises, and the two fields every
// other kind carries in its envelope.
function oracleEdgeDecoded(entry) {
  if (!Array.isArray(entry)) return { ...entry, id: entry.id ?? edgeId(entry) };
  const [from, to, type, confidence, status, revised = null] = entry;
  return {
    id: edgeId({ from, to, type }), from, to, type, confidence, status, revised,
    supersededBy: null, aliases: [],
  };
}

// The number the projection asks the sources index for. Counted here rather
// than imported, for the same reason the literals are copied.
function oracleCites(topology) {
  const counts = new Map();
  for (const source of topology.sources ?? []) {
    for (const citation of source.citations ?? []) {
      const key = `${citation.kind}:${citation.id}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return (kind, id) => counts.get(`${kind}:${id}`) ?? 0;
}

export function projectV1(topology) {
  const citesCount = oracleCites(topology);
  return {
    events: (topology.events ?? []).map((e) => oracleEntry({
      ...oracleEnvelope(e, 'event'),
      title: e.title,
      revised: e.revised ?? null,
      when: e.when,
      place: e.place,
      region: e.region,
      // `parent`, `scope` and `category` where the record has them, and
      // `subtreeWeight` where it differs from `weight` — all four absent
      // otherwise, which is what keeps them off the thousand events that carry
      // none. A tombstone keeps none of them (M30a-3, amendment A11).
      ...(e.parent === undefined ? {} : { parent: e.parent }),
      ...(e.scope === undefined ? {} : { scope: e.scope }),
      ...(e.category === undefined ? {} : { category: e.category }),
      weight: e.weight,
      ...(e.subtreeWeight === undefined ? {} : { subtreeWeight: e.subtreeWeight }),
      actors: e.actors ?? [],
      citesCount: citesCount('event', e.id),
    })),
    edges: (topology.edges ?? []).map(oracleEdge).map(oracleEdgeDecoded),
    actors: (topology.actors ?? []).map((a) => oracleEntry({
      ...oracleEnvelope(a, 'actor'),
      name: a.name,
      revised: a.revised ?? null,
      names: a.names ?? [],
      actorType: a.actorType,
      when: a.when,
      citesCount: citesCount('actor', a.id),
    })),
    places: (topology.places ?? []).map((p) => oracleEntry({
      ...oracleEnvelope(p, 'place'),
      name: p.name,
      revised: p.revised ?? null,
      names: p.names ?? [],
      where: p.where,
      region: p.region,
      citesCount: citesCount('place', p.id),
    })),
    relations: (topology.relations ?? []).map((r) => oracleEntry({
      ...oracleEnvelope(r, 'relation'),
      from: r.from,
      to: r.to,
      type: r.type,
      when: r.when,
      note: r.note ?? null,
    })),
    offices: (topology.offices ?? []).map((o) => oracleEntry({
      ...oracleEnvelope(o, 'office'),
      of: o.of,
      title: o.title,
      category: o.category,
      revised: o.revised ?? null,
      when: o.when ?? null,
    })),
    tenures: (topology.tenures ?? []).map((t) => oracleEntry({
      ...oracleEnvelope(t, 'tenure'),
      person: t.person,
      office: t.office,
      when: t.when,
      startedBy: t.startedBy ?? null,
      note: t.note ?? null,
    })),
    narratives: (topology.narratives ?? []).map((n) => oracleEntry({
      ...oracleEnvelope(n, 'narrative'),
      title: n.title,
      revised: n.revised ?? null,
      summary: n.summary,
      authors: n.authors ?? [],
      window: n.window ?? null,
      steps: n.steps ?? [],
    })),
    // Its own file since I1; the same row of the same table (index2-plan, D1).
    presences: (topology.presences ?? []).map((p) => oracleEntry({
      ...oracleEnvelope(p, 'presence'),
      actor: p.actor,
      when: p.when,
      geometry: { key: p.geometry?.key ?? null },
      dependencyOf: p.dependencyOf ?? null,
      dependencyKind: p.dependencyKind ?? null,
      capital: p.capital ?? null,
      confidence: p.confidence,
    })),
  };
}

const ENVELOPE = ['id', 'kind', 'status', 'supersededBy', 'aliases'];
// `revised` is on the five kinds a card fetches the record file of — the
// four here plus the edge tuple's sixth slot — because that is what the file
// is asked for with (`?v=`, H3b). A presence and a relation have no file
// anybody fetches, so they do not carry it.
const FIELDS = {
  // `parent`, `scope` and `category` are on an event that carries them and on
  // no other; `subtreeWeight` is on a parent whose parts add to more than its
  // own weight, and on no leaf (M30a-3, amendment A11).
  event: [...ENVELOPE, 'wikidata', 'wikipedia', 'title', 'revised', 'when', 'place', 'region', 'parent', 'scope', 'category', 'weight', 'subtreeWeight', 'actors', 'citesCount'],
  actor: [...ENVELOPE, 'wikidata', 'wikipedia', 'name', 'names', 'revised', 'actorType', 'when', 'citesCount'],
  place: [...ENVELOPE, 'wikidata', 'wikipedia', 'name', 'names', 'revised', 'where', 'region', 'citesCount'],
  relation: [...ENVELOPE, 'wikidata', 'wikipedia', 'from', 'to', 'type', 'when', 'note'],
  // An office carries `revised` because `?office=` is an address and the
  // card may fetch the record; a tenure has no address of its own and does
  // not, the way a relation does not.
  office: [...ENVELOPE, 'wikidata', 'wikipedia', 'of', 'title', 'category', 'revised', 'when'],
  tenure: [...ENVELOPE, 'wikidata', 'wikipedia', 'person', 'office', 'when', 'startedBy', 'note'],
  narrative: [...ENVELOPE, 'wikidata', 'wikipedia', 'title', 'revised', 'summary', 'authors', 'window', 'steps'],
};
// The presences are not in the spine since I1 — they are half of it on the
// real data and nothing draws them until the territory layer does — so their
// row of the same table belongs to their own file (index2-plan, D1).
const PRESENCE_FIELDS = [...ENVELOPE, 'wikidata', 'wikipedia', 'actor', 'when', 'geometry', 'dependencyOf', 'dependencyKind', 'capital', 'confidence'];
// A tombstone is fetched like any other record — 175 retracted events reach
// a card with their own fields — so it keeps `revised` too.
const TOMBSTONE = ['id', 'kind', 'status', 'supersededBy', 'aliases', 'wikidata', 'title', 'name', 'names', 'when', 'place', 'region', 'revised'];

// Against the registry, not against a list written twice: a ninth kind is
// one entry in src/kinds.js, and it must not be able to arrive with nowhere
// in the index to go. Three of them are not object entries in the spine:
// `edge` is a tuple, `source` is the sources index — which carries every
// bibliographic field the spine would only repeat (A3) — and `presence` is
// its own file since I1 (index2-plan, D1).
test('every kind the registry knows is in the spine, or is the one that is not', () => {
  assert.deepEqual([...KINDS].sort(), [...Object.keys(FIELDS), 'edge', 'presence', 'source'].sort());
});

for (const [label, dir] of [['the fixtures', FIXTURE_DATA], ['the repository', DATA]]) {
  // The claim the encoding is held to, and the only assertion that could catch
  // a dropped field: what the loader gives back is what the nine literals
  // wrote. True of the projection this oracle was copied from, and it has to
  // stay true of whatever writes the file after it.
  test(`what comes back out of the index is what the nine literals wrote, over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const oracle = projectV1(topology);
    const decoded = {
      ...expandSpine(buildSpine(topology)),
      presences: buildPresenceIndex(topology).presences,
    };
    let seen = 0;
    for (const [list, want] of Object.entries(oracle)) {
      assert.equal((decoded[list] ?? []).length, want.length, list);
      for (const [i, entry] of want.entries()) {
        assert.deepEqual(decoded[list][i], entry, `${list}[${i}]: ${entry.id}`);
        seen += 1;
      }
    }
    assert.ok(seen > 0);
  });

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
    // The field nothing draws: dropped from the spine, kept in the topology
    // (A3).
    assert.ok(spine.events.every((e) => !Object.hasOwn(e, 'regionMethod')));
    assert.ok(spine.places.every((p) => !Object.hasOwn(p, 'regionMethod')));
    // And no presences at all, which is I1: half this file on the real data.
    assert.ok(!Object.hasOwn(spine, 'presences'), 'the spine still carries the presences');
  });

  // The same table, the same tombstone rule and the same two dropped fields,
  // over the file the presences moved to (I1). Every presence the topology
  // has is in it, in id order, with the fields it had in the spine.
  test(`the presence index carries every presence over ${label}, and the same fields`, async () => {
    const topology = await topologyOf(dir);
    const index = buildPresenceIndex(topology);
    assert.ok(topology.presences.length > 0, `${label} has presences`);
    assert.deepEqual(index.presences.map((p) => p.id), topology.presences.map((p) => p.id), 'every one, in id order');
    const inTopology = new Map(topology.presences.map((p) => [p.id, p]));
    for (const entry of index.presences) {
      assert.equal(entry.kind, 'presence', entry.id);
      const keys = entry.status === 'active' ? PRESENCE_FIELDS : TOMBSTONE;
      for (const key of Object.keys(entry)) {
        assert.ok(keys.includes(key), `${entry.id} (${entry.status}) carries ${key}`);
      }
      for (const [key, value] of Object.entries(entry)) {
        if (key === 'kind' || key === 'geometry') continue;
        assert.deepEqual(value, inTopology.get(entry.id)[key], `${entry.id}: ${key}`);
      }
      assert.deepEqual(entry.when, inTopology.get(entry.id).when, `${entry.id}: the interval verbatim`);
    }
    // The two the projection drops: `presenceType`, which nothing draws, and
    // every key of `geometry` but the one the shard is looked up by.
    assert.ok(index.presences.every((p) => !Object.hasOwn(p, 'presenceType')));
    assert.ok(index.presences.every((p) => Object.keys(p.geometry).length === 1));
    assert.ok(topology.presences.every((p) => Object.hasOwn(p, 'presenceType')), 'the topology is unchanged');
  });

  test(`every field the spine keeps is the record's own over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const spine = buildSpine(topology);
    for (const kind of ['event', 'actor', 'place', 'relation', 'narrative']) {
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
    for (const kind of ['event', 'actor', 'relation']) {
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

test('the presence index is in the built index, named in the manifest, and stable', async () => {
  const first = await buildIndex(FIXTURE_DATA);
  const second = await buildIndex(FIXTURE_DATA);
  const manifest = JSON.parse(first.files['manifest.json']);
  assert.match(manifest.files.presences, /^index\/presences-[0-9a-f]{12}\.json$/);
  const name = path.basename(manifest.files.presences);
  assert.ok(Object.hasOwn(first.files, name));
  assert.equal(first.files[name], second.files[name]);
  const file = JSON.parse(first.files[name]);
  assert.equal(file.schema, manifest.schema, 'one generation, not two');
  assert.equal(file.presences.length, manifest.counts.presences);
});
