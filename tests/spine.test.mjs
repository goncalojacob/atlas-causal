// The spine: the projection of the in-memory topology that every page reads
// whole, and since H3c the only graph file the index writes.
//
// Since I2 it is nine lists of **positional rows** over one shared table of
// ids, with the closed vocabularies as integers. What a record *is* is
// `projectV1` below — the nine object literals `buildSpine` used to be, moved
// here whole in the commit before the encoding changed — and the claim of the
// run is one assertion: what comes back out of the index is what those
// literals wrote, per kind, over both datasets. The rest of this file is about
// the encoding itself: the id table's order, the vocabularies' provenance, the
// trailing trim, and the file naming its own columns.
//
// Both datasets are run because they disagree about which shapes exist: only
// the fixtures hold a retracted edge, only the repository holds a merged event
// and a retired relation.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  buildAttributeShards, buildCore, buildPresenceIndex, buildSpine, buildTopology, edgeId,
} from '../src/validate/core.js';
import { expandSpine, presencesFromIndex } from '../src/data.js';
import {
  ATTRIBUTE_COLUMNS, CORE_COLUMNS, SPINE_COLUMNS, SPINE_KINDS, SPLIT_COLUMNS,
  applyAttributes, boundsOf, decodeSpineFile, fillFallbacks,
} from '../src/spine.js';
import { attributePeriod, attributeShardKey, periodOf } from '../src/explanations.js';
import { extent as intervalExtent } from '../src/util/dates.js';
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


// Both files, decoded, as one set of lists to hold against the oracle.
function decodedOf(topology) {
  return { ...expandSpine(buildSpine(topology)), presences: presencesFromIndex(buildPresenceIndex(topology)) };
}

// The astronomical year a record's interval begins in — what the shards are
// filed by, computed here rather than imported so that a wrong table cannot
// agree with itself.
const intervalStart = (record) => intervalExtent(record.when).min;

// I3's two files put back together: the core decoded, then every shard's rows
// applied to it, which is what a page will hold once every century has landed.
function mergedFromCore(topology) {
  const core = decodeSpineFile(buildCore(topology), SPINE_KINDS, CORE_COLUMNS);
  const byKey = new Map();
  for (const kind of SPINE_KINDS) {
    for (const record of core[`${kind}s`]) {
      byKey.set(`${kind}:${record.id}`, record);
      fillFallbacks(record, boundsOf(record));
    }
  }
  for (const shard of buildAttributeShards(topology)) {
    const rows = decodeSpineFile(shard.file, SPINE_KINDS, ATTRIBUTE_COLUMNS);
    for (const kind of SPINE_KINDS) {
      for (const partial of rows[`${kind}s`]) applyAttributes(byKey.get(`${kind}:${partial.id}`), partial);
    }
  }
  return core;
}

// Against the registry, not against a list written twice: a tenth kind is one
// entry in src/kinds.js and one row in SPINE_COLUMNS, and it must not be able
// to arrive with nowhere in the index to go. `source` is the one kind that is
// not a row: it is the sources index, which carries every bibliographic field
// a spine row would only repeat (h3a-brief, A3).
test('every kind the registry knows is a row in the column table, or is the one that is not', () => {
  assert.deepEqual([...KINDS].sort(), [...Object.keys(SPINE_COLUMNS), 'source'].sort());
});

for (const [label, dir] of [['the fixtures', FIXTURE_DATA], ['the repository', DATA]]) {
  // The claim the encoding is held to, and the only assertion that could catch
  // a dropped field: what the loader gives back is what the nine literals
  // wrote. True of the projection this oracle was copied from, and it has to
  // stay true of whatever writes the file after it.
  test(`what comes back out of the index is what the nine literals wrote, over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const oracle = projectV1(topology);
    const decoded = decodedOf(topology);
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

  // The two fields nothing draws: dropped from the projection, kept in the
  // topology (h3a-brief, A3). Said on the decoded side as well, because the
  // oracle would carry them if the encoder ever started to.
  test(`the fields nothing draws stay out over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const decoded = decodedOf(topology);
    assert.ok(decoded.events.every((e) => !Object.hasOwn(e, 'regionMethod')));
    assert.ok(decoded.places.every((p) => !Object.hasOwn(p, 'regionMethod')));
    assert.ok(decoded.presences.every((p) => !Object.hasOwn(p, 'presenceType')));
    assert.ok(decoded.presences.every((p) => Object.keys(p.geometry).length === 1));
    assert.ok(topology.presences.every((p) => Object.hasOwn(p, 'presenceType')), 'the topology is unchanged');
    // And no presences in the spine at all, which is I1: half that file on the
    // real data.
    assert.ok(!Object.hasOwn(buildSpine(topology), 'presences'), 'the spine still carries the presences');
  });

  // A1: an event that runs from a date to no end at all, and one whose
  // calendar is not the reader's, are both drawn from the object. `when` is a
  // slot and is carried verbatim into it, never reduced to a pair of years.
  test(`an interval is carried verbatim over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const decoded = decodedOf(topology);
    for (const kind of ['event', 'actor', 'relation']) {
      const inTopology = new Map(topology[`${kind}s`].map((r) => [r.id, r]));
      for (const entry of decoded[`${kind}s`]) {
        assert.deepEqual(entry.when, inTopology.get(entry.id).when, entry.id);
      }
    }
    assert.ok(decoded.events.some((e) => Object.hasOwn(e.when ?? {}, 'date')), 'a day, not only a year');
  });

  // A2: the id is synthesised on load, so it had better be synthesisable — and
  // the first six slots of the row are still the tuple H3a wrote, in order.
  test(`every edge id is from--to--type over ${label}`, async () => {
    const topology = await topologyOf(dir);
    for (const edge of topology.edges) assert.equal(edge.id, edgeId(edge), edge.id);
    const spine = buildSpine(topology);
    assert.equal(spine.edges.length, topology.edges.length);
    assert.deepEqual(spine.columns.edge.slice(0, 6), ['from', 'to', 'type', 'confidence', 'status', 'revised']);
    for (const [i, row] of spine.edges.entries()) {
      const edge = topology.edges[i];
      assert.ok(Array.isArray(row), `${edge.id} is not a row`);
      // The seventh slot is the explicit id, and it is not there on an edge
      // whose id is derived — which is every edge in both datasets.
      assert.ok(row.length <= 6, `${edge.id} carries an explicit id`);
      assert.equal(spine.ids[row[0]], edge.from);
      assert.equal(spine.ids[row[1]], edge.to);
      assert.equal(spine.vocab.edgeType[row[2]], edge.type);
    }
  });

  // A8: `citesCount` is the number three cards print beside a record, and the
  // atlas built from the topology is what prints it today.
  test(`citesCount equals what the card counts over ${label}`, async () => {
    const decoded = decodedOf(await topologyOf(dir));
    const atlas = await atlasOf(dir);
    let counted = 0;
    for (const kind of ['event', 'actor', 'place']) {
      for (const entry of decoded[`${kind}s`]) {
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

  // ─── The encoding itself ─────────────────────────────────────────────────

  // The id table is the whole of the file's determinism (i2-brief, section 1):
  // record ids in registry order and in id order within a kind, then anything
  // else in the order it is met. Two builds therefore agree on every integer.
  test(`the id table is in the defined order and a second build agrees, over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const spine = buildSpine(topology);
    const front = ['event', 'actor', 'place', 'relation', 'office', 'tenure', 'narrative']
      .flatMap((kind) => topology[`${kind}s`].map((r) => r.id));
    assert.deepEqual(spine.ids.slice(0, front.length), front, 'the records first, in registry order');
    assert.equal(new Set(spine.ids).size, spine.ids.length, 'each id once');
    // No edge id: they are `from--to--type` and the loader makes them, which is
    // what keeps 39,996 of them out of the table at 10^4.
    for (const edge of topology.edges) assert.ok(!spine.ids.includes(edge.id), edge.id);
    assert.deepEqual(buildSpine(topology).ids, spine.ids);
    assert.deepEqual(buildSpine(topology).vocab, spine.vocab);
  });

  // A4: the closed lists come from the code and the data-defined ones from
  // their own file, and neither from what the records happen to hold.
  test(`the vocabularies are the lists and not the corpus, over ${label}`, async () => {
    const spine = buildSpine(await topologyOf(dir));
    assert.deepEqual(spine.vocab.status, ['active', 'merged', 'retracted']);
    assert.deepEqual(spine.vocab.edgeType, ['caused', 'enabled', 'reacted-to', 'precondition-of', 'inspired']);
    assert.deepEqual(spine.vocab.scope, ['regional', 'worldwide']);
    assert.deepEqual(spine.vocab.confidence, ['consensus', 'probable', 'disputed']);
    // Every column that is a vocabulary names a list the file carries, so a
    // reader never has to guess which list an integer is against.
    for (const [kind, spec] of Object.entries(SPINE_COLUMNS)) {
      if (!spine.columns[kind]) continue;
      for (const c of spec.columns) {
        if (c.type === 'vocab') assert.ok(Array.isArray(spine.vocab[c.vocab]), `${kind}.${c.name}: ${c.vocab}`);
      }
    }
  });

  // What the trim is for: `parent`, `scope` and `subtreeWeight` are the last
  // slots of an event and cost nothing on an event that carries none.
  test(`a row stops where its values stop, over ${label}`, async () => {
    const spine = buildSpine(await topologyOf(dir));
    const columns = spine.columns.event;
    assert.deepEqual(columns.slice(-3), ['parent', 'scope', 'subtreeWeight']);
    assert.ok(spine.events.some((row) => row.length < columns.length), 'no row was trimmed at all');
    for (const row of spine.events) {
      assert.ok(row.length <= columns.length, 'a row longer than its columns');
      assert.notEqual(row[row.length - 1], null, 'a trailing null survived the trim');
    }
  });

  // And the other half of the run: nine kinds through one table, and the file
  // saying what it is rather than leaving a reader to assume.
  test(`the file names its own columns, over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const spine = buildSpine(topology);
    const presences = buildPresenceIndex(topology);
    assert.deepEqual(Object.keys(spine.columns).sort(), ['actor', 'edge', 'event', 'narrative', 'office', 'place', 'relation', 'tenure']);
    assert.deepEqual(Object.keys(presences.columns), ['presence']);
    for (const [kind, names] of Object.entries(spine.columns)) {
      assert.deepEqual(names, SPINE_COLUMNS[kind].columns.map((c) => c.name), kind);
    }
    assert.equal(spine.schema, presences.schema, 'one generation, not two');
  });
}

// Finding 22 and amendment A5: a trimmed slot and a `null` one are the same
// thing in the file, and what they decode to is the column table's to say —
// `place: null` is a key with no value, `parent` is no key at all.
test('a trimmed row decodes to the same record as a full one', async () => {
  const topology = await topologyOf(FIXTURE_DATA);
  const spine = buildSpine(topology);
  const columns = spine.columns.event;
  const padded = {
    ...spine,
    events: spine.events.map((row) => [...row, ...Array(columns.length - row.length).fill(null)]),
  };
  assert.ok(padded.events.every((row) => row.length === columns.length));
  assert.deepEqual(expandSpine(padded).events, expandSpine(spine).events);
});

// The decoder reads the file's own column names, so a file from a shape this
// build does not know is refused by the name it could not read — not read as
// though the slot in that position were something else.
test('a column this build does not know is refused, by name', async () => {
  const spine = buildSpine(await topologyOf(FIXTURE_DATA));
  const strange = { ...spine, columns: { ...spine.columns, event: [...spine.columns.event, 'weightiness'] } };
  assert.throws(() => expandSpine(strange), /weightiness/);
});

// A4 again: a category the data file does not list still round-trips, because
// a value met and in no list is appended to the file's own vocabulary.
test('a record carrying a category no file lists still round-trips', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions, { categories: [{ id: 'war' }] });
  const [first] = topology.events;
  const invented = { ...topology, events: [{ ...first, category: 'not-in-categories-json' }, ...topology.events.slice(1)] };
  const spine = buildSpine(invented);
  assert.ok(spine.vocab.category.includes('not-in-categories-json'), 'appended in first-seen order');
  assert.equal(spine.vocab.category[0], 'war', 'and after the ones the data file names');
  assert.equal(expandSpine(spine).events[0].category, 'not-in-categories-json');
});

// A2 again: the two shapes the six-slot tuple could not say, which is why an
// edge that carried either used to be written as a whole object. Neither
// exists in either dataset — no edge has ever been renamed or merged — and
// both are what keeps an old ?chain= URL opening, so they are made here.
test('an edge with an alias or a merge hop is a row like any other', async () => {
  const fx = await fixtures();
  const topology = buildTopology(fx.records, fx.regions);
  const edge = topology.edges[0];

  const aliased = buildSpine({ ...topology, edges: [{ ...edge, aliases: ['fixture-old-edge-id'] }] });
  assert.ok(Array.isArray(aliased.edges[0]), 'still a row');
  assert.deepEqual(expandSpine(aliased).edges[0].aliases, ['fixture-old-edge-id']);

  const merged = buildSpine({ ...topology, edges: [{ ...edge, status: 'merged', supersededBy: 'a--b--caused' }] });
  assert.equal(expandSpine(merged).edges[0].supersededBy, 'a--b--caused');

  // And an id that is not from--to--type keeps itself in the row's last slot,
  // rather than being silently renamed by the loader that synthesises one.
  const odd = buildSpine({ ...topology, edges: [{ ...edge, id: 'hand-written-edge-id' }] });
  assert.equal(odd.edges[0].length, 7, 'the explicit id is the seventh slot');
  assert.equal(expandSpine(odd).edges[0].id, 'hand-written-edge-id');
});

test('a retracted edge keeps its status, which is what keeps it out of the graph', async () => {
  const decoded = expandSpine(buildSpine(await topologyOf(FIXTURE_DATA)));
  const retracted = decoded.edges.filter((e) => e.status !== 'active');
  assert.equal(retracted.length, 1, 'the fixtures hold one retracted edge');
  // And its ends and its type, which the tombstone mask would have taken away
  // and the id is made of. The edge is the one kind the mask does not touch.
  assert.equal(retracted[0].id, edgeId(retracted[0]));
});

// A10: 175 retracted events reach a card, and the card's head and meta line
// are built from the region, the start year and the place. The tombstone list
// is a slot mask now, and it is applied in both directions.
test('a tombstone keeps its head and meta line and drops the rest', async () => {
  const decoded = expandSpine(buildSpine(await topologyOf(DATA)));
  const tombstones = decoded.events.filter((e) => e.status !== 'active');
  assert.ok(tombstones.length > 100, `${tombstones.length} tombstones`);
  for (const entry of tombstones) {
    assert.ok(Object.hasOwn(entry, 'title') && Object.hasOwn(entry, 'when'));
    assert.ok(Object.hasOwn(entry, 'place') && Object.hasOwn(entry, 'region'));
    assert.ok(!Object.hasOwn(entry, 'weight') && !Object.hasOwn(entry, 'actors'));
    assert.ok(!Object.hasOwn(entry, 'wikipedia'));
  }
  assert.ok(decoded.events.some((e) => e.status === 'merged' && e.supersededBy), 'the merge hop survives');
  // The twelve relations M30a-2 left behind: a tombstone relation carries no
  // `note`, where an active one carries `note: null`. That is the difference a
  // per-slot rule alone could not say (index2 review, finding 22), and it is
  // why the mask is read by the decoder and not only by the encoder.
  const retired = decoded.relations.filter((r) => r.status !== 'active');
  assert.ok(retired.length > 0, 'the repository holds a retired relation');
  for (const relation of retired) {
    assert.ok(!Object.hasOwn(relation, 'note'), relation.id);
    assert.ok(!Object.hasOwn(relation, 'type'), relation.id);
  }
  assert.ok(decoded.relations.some((r) => r.status === 'active' && Object.hasOwn(r, 'note')));
});

// The whole-corpus projection this file is about is built and not written since
// I4b: the core and the attribute shards are what the index carries, and this
// is the definition they add up to. It is still stable between builds — the
// prerendered pages are rendered out of it, and their byte-identity is a check
// on it (i4-brief, A5).
test('the whole-corpus projection is built, stable, and no longer a file', async () => {
  const first = await buildIndex(FIXTURE_DATA);
  const second = await buildIndex(FIXTURE_DATA);
  const manifest = JSON.parse(first.files['manifest.json']);
  assert.equal(typeof first.spineText, 'string');
  assert.equal(first.spineText, second.spineText);
  assert.equal(Object.hasOwn(manifest.files, 'spine'), false);
  assert.deepEqual(Object.keys(first.files).filter((f) => f.startsWith('spine')), []);
  // The graph file the index does write, and the only one: since H3c the index
  // writes the projection and not the thing projected.
  assert.match(manifest.files.core, /^index\/core-[0-9a-f]{12}\.json$/);
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

// ─── The core and the attribute shards (I3) ────────────────────────────────
//
// The claim of the split, in the one place it can be made cheaply: the two
// tables are one partition of the spine's. Nothing invented, nothing dropped —
// the atlas-level proof is `tests/core-loader.test.mjs`, and this is what says
// which column went where before a single record is read.

test('the core and the attribute shards are the spine between them, per kind', () => {
  // Every kind the graph file carries, and only those: the presences are their
  // own file since I1 and are not split — nothing reads them until the
  // territory layer draws, which is a window of its own (index2-plan, D1).
  assert.deepEqual(Object.keys(CORE_COLUMNS).sort(), [...SPINE_KINDS].sort());
  assert.deepEqual(Object.keys(ATTRIBUTE_COLUMNS).sort(), [...SPINE_KINDS].sort());
  assert.deepEqual(Object.keys(SPINE_COLUMNS).sort(), [...SPINE_KINDS, 'presence'].sort());
  for (const kind of SPINE_KINDS) {
    // A key names the record the row is about — `id` and `status`, or an
    // edge's three ends — and is not one of the shard's values: the core is
    // what carries them.
    const core = CORE_COLUMNS[kind].columns.map((c) => c.name);
    const values = ATTRIBUTE_COLUMNS[kind].columns.filter((c) => !c.key).map((c) => c.name);
    const wanted = SPINE_COLUMNS[kind].columns.map((c) => c.name);
    assert.deepEqual([...new Set([...core, ...values])].sort(), [...wanted].sort(), kind);
    for (const name of core.filter((n) => values.includes(n))) {
      assert.ok(SPLIT_COLUMNS.has(name), `${kind}.${name} is in both tables and is not split inside`);
    }
    // And every key of a shard's row is something the core carries, or the
    // shard could name a record the core does not have.
    for (const name of ATTRIBUTE_COLUMNS[kind].keys) assert.ok(core.includes(name), `${kind}.${name}`);
  }
});

// A4: the two vocabularies a card reads — an actor line's role and an event's
// category — are in the shards, and the ones a lane and a mark read are in the
// core. Said on the tables rather than on the files, because it is the tables
// that decide.
test('the core carries no prose vocabulary and the shards no lane', () => {
  const of = (table, kind) => table[kind].columns.filter((c) => c.type === 'vocab').map((c) => c.vocab);
  assert.deepEqual(of(CORE_COLUMNS, 'event'), ['status', 'region']);
  assert.deepEqual(of(ATTRIBUTE_COLUMNS, 'event'), ['status', 'category', 'scope']);
  assert.deepEqual(of(CORE_COLUMNS, 'edge'), ['edgeType', 'confidence', 'status']);
});

for (const [label, dir] of [['the fixtures', FIXTURE_DATA], ['the repository', DATA]]) {
  // A1 and plan A8: one filing key for every kind, so that a record is in one
  // shard and the loader and the build agree which.
  test(`every record is in exactly one shard, chosen by its own key, over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const shards = buildAttributeShards(topology);
    const events = new Map(topology.events.map((e) => [e.id, e]));
    const seen = new Map();
    let filed = 0;
    for (const shard of shards) {
      const rows = decodeSpineFile(shard.file, SPINE_KINDS, ATTRIBUTE_COLUMNS);
      for (const kind of SPINE_KINDS) {
        for (const row of rows[`${kind}s`] ?? []) {
          const key = `${kind}:${row.id}`;
          assert.ok(!seen.has(key), `${key} is in two shards: ${seen.get(key)} and ${shard.key}`);
          seen.set(key, shard.key);
          filed += 1;
        }
      }
    }
    assert.ok(filed > 0);
    for (const kind of SPINE_KINDS) {
      for (const record of topology[`${kind}s`]) {
        const key = `${kind}:${record.id}`;
        assert.ok(seen.has(key), `${key} is in no shard at all`);
        assert.equal(seen.get(key), attributeShardKey(attributePeriod(kind, record, events)), key);
      }
    }
    assert.equal(seen.size, filed);

    // An event is in the century it begins in, a place is in the one shard of
    // places, and a record with no year at all is in the `null` shard — which
    // is fetched with the first century whatever the window is.
    for (const event of topology.events) {
      const period = periodOf(intervalStart(event));
      assert.equal(seen.get(`event:${event.id}`), `${period.from}-${period.to}`, event.id);
    }
    for (const place of topology.places) assert.equal(seen.get(`place:${place.id}`), 'place', place.id);
    for (const office of topology.offices.filter((o) => o.when === null)) {
      assert.equal(seen.get(`office:${office.id}`), 'null', office.id);
    }
    // The keys the manifest will name, in the order the build writes them: the
    // centuries in year order, then the two that answer no year.
    const years = shards.filter((s) => s.from !== null).map((s) => s.from);
    assert.deepEqual(years, [...years].sort((a, b) => a - b));
    assert.deepEqual(shards.slice(years.length).map((s) => s.key), ['null', 'place']);
  });

  // The other half of "nothing dropped": the two files together decode to the
  // same lists the spine does, over real records and not only over the tables.
  test(`the core and every shard decode to what the spine says, over ${label}`, async () => {
    const topology = await topologyOf(dir);
    const spine = expandSpine(buildSpine(topology));
    const core = buildCore(topology);
    assert.equal(core.schema, buildSpine(topology).schema, 'one generation, not two');
    // Two builds of one dataset write one file, ids, vocabularies and all.
    assert.deepEqual(buildCore(topology).ids, core.ids);
    assert.deepEqual(buildAttributeShards(topology).map((s) => s.key), buildAttributeShards(topology).map((s) => s.key));
    const merged = mergedFromCore(topology);
    for (const kind of SPINE_KINDS) {
      const list = `${kind}s`;
      assert.equal(merged[list].length, spine[list].length, list);
      for (const [i, want] of spine[list].entries()) {
        assert.deepEqual(merged[list][i], want, `${list}[${i}]: ${want.id}`);
      }
    }
  });
}

// The size assertion the brief asks for, and not a time assertion (R3, the
// picker test's lesson): the same information as rows is smaller than the same
// information as objects, and the number is printed rather than gated on.
test('the rows are smaller than the objects they replace, and the number is said', async () => {
  const topology = await topologyOf(FIXTURE_DATA);
  const rows = JSON.stringify(buildSpine(topology)).length + JSON.stringify(buildPresenceIndex(topology)).length;
  const objects = JSON.stringify(projectV1(topology)).length;
  assert.ok(rows < objects, `${rows} is not smaller than ${objects}`);
  console.log(`    the fixtures as rows: ${rows} B against ${objects} B as objects (${(objects / rows).toFixed(2)}x)`);
});
