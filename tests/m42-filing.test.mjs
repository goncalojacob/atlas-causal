import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { astronomicalBounds } from '../src/util/dates.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { parentsOf } from '../src/parts.js';

// M42's filing pass, which amendment A6 made the run's first job: the owner,
// 21 September, looking at a timeline of 474 events of which 370 were main —
// "As it is right now it is useless. For it to be useful it should only show
// parent and main events." A6's answer is a records question and not a
// display one: **a period historians name, with an article, a span and a
// region, is a legitimate umbrella**, and a main event inside the span and
// inside the region is filed under it.
//
// This file is written before the records it judges (deviations 711 and 717).
//
// **Nothing here names a record and nothing pins a count**, which is the
// brief's own test 2 and the idiom `m62-umbrella` and `m67-umbrella` already
// use: the umbrellas this pass creates are found by the `m42-umbrella` flag
// they carry, and everything else is asserted of whatever carries it. A suite
// that listed the ids would go on passing the day a period is written with no
// span behind it.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UMBRELLA_FLAG = 'm42-umbrella';

// Where a filing is argued. Read with the other measurements beside it, for
// the reason tests/m67.test.mjs gives at the same place: the argument for a
// filing is written by whichever run made it, and asking one file to hold all
// of them would stop a later run filing anything at all.
const ARGUED_IN = ['docs/m42-pool.md', 'docs/m42-connections.md', 'docs/m67-umbrellas.md'];
const doc = (await Promise.all(ARGUED_IN.map(async (f) => {
  const at = path.join(ROOT, f);
  return existsSync(at) ? readFile(at, 'utf8') : '';
}))).join('\n');

const readDir = async (kind) => {
  const dir = path.join(ROOT, 'data', kind);
  const out = [];
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.json')) continue;
    out.push(JSON.parse(await readFile(path.join(dir, file), 'utf8')));
  }
  return out;
};

const events = await readDir('events');
const places = await readDir('places');
const sources = await readDir('sources');

const placeById = new Map(places.map((p) => [p.id, p]));
const sourceById = new Map(sources.map((s) => [s.id, s]));

const active = events.filter((e) => e.status === 'active');
const flagsOf = (r) => r.review?.flags ?? [];
const umbrellas = active.filter((e) => flagsOf(e).includes(UMBRELLA_FLAG));
// Through `parentsOf` since A8 and M79, never off `e.parent`: an event may be
// part of several umbrellas — the owner, 22 September, *"the angola
// independence is both under the Portuguese third republic and african
// decolonization"* — and a suite that compared the field to an id would stop
// seeing every child filed as a list and pass by seeing nothing.
const childrenOf = (id) => active.filter((e) => parentsOf(e).includes(id));

// The lane an event is drawn in, worked out the way the index works it out:
// the event's own override, else the lane its place overrides to, else the
// polygon its place's point falls nearest. A test that read `region` alone
// would call an event with a place and no override laneless and refuse a
// filing the atlas draws in the right row.
const polygons = JSON.parse(await readFile(path.join(ROOT, 'data', 'geo', 'regions.json'), 'utf8'));
const deriveRegion = createRegionDeriver(polygons);
const laneOf = (event) => {
  if (typeof event.region === 'string') return event.region;
  const place = placeById.get(event.place);
  if (!place) return null;
  if (typeof place.region === 'string') return place.region;
  return deriveRegion(place.where ?? place.point ?? place)?.region ?? null;
};

// The rule's own reading of an interval, imported rather than re-derived, so
// that this suite cannot disagree with the warning it is guarding.
const span = (when) => ({
  from: astronomicalBounds(when.start).min,
  to: when.end === null || when.end === undefined ? Infinity : astronomicalBounds(when.end).max,
});

// ─── 1. the umbrella, and what stands behind its span ──────────────────────
//
// A6: "a period that Wikipedia has an article for, with a span and a region
// or polity, is a legitimate umbrella, sourced as any record is". M62's own
// test 1 said the same of its umbrellas and it is the clause that keeps a
// period from being a bucket invented for tidiness: the span is somebody
// else's and the record says whose.

test('the filing pass created at least one umbrella', () => {
  assert.ok(umbrellas.length > 0, `no event carries the "${UMBRELLA_FLAG}" flag`);
});

test('every umbrella this pass created has a span and cites it', () => {
  for (const u of umbrellas) {
    // Readable rather than a plain number: a bound may be `{ min, max }`, and
    // a period whose article dates its start as "the mid-1950s" has nowhere
    // else honest to put that. What the clause is for is that the umbrella has
    // a span at all and says whose it is.
    assert.doesNotThrow(() => span(u.when), `${u.id} is an umbrella with no readable span`);
    const cited = (u.sources ?? []).map((c) => c?.source).filter((id) => typeof id === 'string');
    assert.ok(cited.length > 0, `${u.id} is an umbrella and cites nothing for its span`);
    for (const id of cited) {
      const source = sourceById.get(id);
      assert.ok(source, `${u.id} cites "${id}", which is not a source record`);
      assert.equal(source.status, 'active', `${u.id} cites the ${source.status} source "${id}"`);
    }
  }
});

test('every umbrella this pass created carries a region, since a period has no point', () => {
  for (const u of umbrellas) {
    assert.equal(typeof u.region, 'string', `${u.id} is an umbrella with no lane, so the timeline has nowhere to draw it`);
  }
});

test('an umbrella is not a claim: this pass wrote no edge on to one', async () => {
  const edges = await readDir('edges');
  const ids = new Set(umbrellas.map((u) => u.id));
  for (const edge of edges) {
    if (edge.status !== 'active') continue;
    for (const end of [edge.from, edge.to]) {
      assert.ok(!ids.has(end), `edge "${edge.id}" runs to the umbrella "${end}", which is a display fact and not an argument`);
    }
  }
});

// ─── 2. the child, which a date alone cannot settle ────────────────────────
//
// M62's rule, which A6 restates with the region as the subject: **inside the
// umbrella's span and inside its subject**. The span half is what the
// `child-outside-parent` warning tests and this asserts it as a property; the
// subject half is the lane, which is what A6 gives the filing rule.

test('every event filed under one of these umbrellas is dated inside it', () => {
  for (const u of umbrellas) {
    const whole = span(u.when);
    for (const child of childrenOf(u.id)) {
      const inside = span(child.when);
      assert.ok(inside.from >= whole.from && inside.to <= whole.to,
        `${child.id} is part of "${u.id}" and is not dated inside it`);
    }
  }
});

// The subject half, which A8 had to widen. M62's rule was always *"its
// `actors` **or** its place put it inside the regime, the war, the revolution
// that the umbrella names"*, and A6 restated it as "a region **or polity**";
// the lane-only reading held while every umbrella of this pass was a period
// named for a region and every child of a polity umbrella happened to sit in
// the polity's own lane. The owner's example breaks exactly that coincidence:
// Angola's independence is part of the Portuguese Third Republic and is drawn
// in the Africa lane, because it is where the thing happened and not where the
// polity is. So an event is the umbrella's own when its lane is the
// umbrella's, **or** when it names an actor the umbrella itself names — which
// is the polity the umbrella is about, since a period names no actor at all.
//
// This is still a property and not a list: what makes an umbrella a polity
// umbrella is that its own record carries actors, and nothing here knows which
// umbrella that is.
const actorsOf = (event) => new Set((event.actors ?? []).map((a) => a?.actor).filter((id) => typeof id === 'string'));

test("every event filed under one of these umbrellas is the umbrella's own", () => {
  for (const u of umbrellas) {
    const subject = actorsOf(u);
    for (const child of childrenOf(u.id)) {
      const lane = laneOf(child);
      if (lane === u.region) continue;
      const shared = [...actorsOf(child)].filter((id) => subject.has(id));
      assert.ok(shared.length > 0,
        `${child.id} is part of "${u.id}" and is neither in its lane (${u.region}, against ${lane}) nor names anything "${u.id}" names`);
    }
  }
});

// A period inside a period inside a period is the tidying A6 refuses: "do not
// nest periods more than one deep". The umbrellas this pass writes are the
// ones it can see, so what it can assert is that none of them is filed under
// another of them.

test('no umbrella this pass created is filed under another of them', () => {
  const ids = new Set(umbrellas.map((u) => u.id));
  for (const u of umbrellas) {
    for (const parent of parentsOf(u)) {
      assert.ok(!ids.has(parent),
        `${u.id} is a period filed inside the period "${parent}", which nests periods two deep`);
    }
  }
});

// ─── 2b. several umbrellas for one event (A8) ──────────────────────────────
//
// The owner, 22 September: *"Can't we have many umbrellas for the same event?
// For example, the angola independence is both under the Portuguese third
// republic and african decolonization."* M79 made `parent` a list and A8 makes
// the filing write every umbrella that fits rather than the first. Two
// properties keep that from becoming a pile.
//
// **The same parent twice says nothing** — rule 24 calls it an error and this
// says why it would be one here.
//
// **A parent that is already an ancestor through another parent says nothing
// either**: if the Portuguese Colonial War is part of the decolonisation of
// Africa, then a massacre inside that war is inside the decolonisation
// already, and writing the continent on to the massacre as well only widens
// the record without telling a reader anything the tree did not. A second
// parent earns its place by being somewhere the first does not reach.

test('no event names the same parent twice', () => {
  for (const event of active) {
    const parents = parentsOf(event);
    assert.equal(new Set(parents).size, parents.length, `${event.id} names one of its parents twice`);
  }
});

test('no parent of an event is reachable through another of its parents', () => {
  const byId = new Map(active.map((e) => [e.id, e]));
  const ancestors = (id, seen = new Set()) => {
    for (const parent of parentsOf(byId.get(id) ?? {})) {
      if (seen.has(parent)) continue;
      seen.add(parent);
      ancestors(parent, seen);
    }
    return seen;
  };
  for (const event of active) {
    const parents = parentsOf(event);
    if (parents.length < 2) continue;
    for (const parent of parents) {
      const through = parents.filter((other) => other !== parent && ancestors(other).has(parent));
      assert.equal(through.length, 0,
        `${event.id} is part of "${parent}" and is inside it already through "${through[0]}"`);
    }
  }
});

// ─── 3. what a filing owes the reader ──────────────────────────────────────
//
// The same clause m62 and m67 carry: a filing nobody argued in writing fails.
// The umbrella and every event under it are named where the pass is written
// up, so that a record filed badly is a paragraph somebody can argue with and
// not a line nobody can find.

test('every umbrella and every event under one is named where the pass is argued', () => {
  assert.ok(doc.length > 0, `none of ${ARGUED_IN.join(', ')} is present`);
  for (const u of umbrellas) {
    assert.ok(doc.includes(`\`${u.id}\``), `no measurement names the umbrella "${u.id}"`);
    for (const child of childrenOf(u.id)) {
      assert.ok(doc.includes(`\`${child.id}\``), `no measurement says why "${child.id}" is part of "${u.id}"`);
    }
  }
});
