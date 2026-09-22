import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { astronomicalBounds } from '../src/util/dates.js';
import { parentsOf } from '../src/parts.js';

// M62 writes the umbrella events the atlas never had: the Estado Novo, the
// First Republic, the Ditadura Nacional, the Colonial War and the Brazilian
// dictatorship, so that the 292 top-level events stop being peers of one
// another. `docs/m62-umbrellas.md` is the measurement that chose them.
//
// This file is written before the records it judges (deviations 711 and 717),
// so on the commit that introduces it every test below fails.
//
// **Nothing here names a record and nothing pins a count.** An umbrella is
// found by the flag it carries, `m62-umbrella` — the milestone-flag idiom
// `m50-chain`, `m51-joined` and `m59-joined` already use — and everything
// else is asserted of whatever carries it. A suite that listed the five ids
// would go on passing the day a sixth umbrella is written badly.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'docs/m62-umbrellas.md';
const UMBRELLA_FLAG = 'm62-umbrella';

// The filing arguments are not all in one file, and they never could be: M62
// wrote the umbrellas, M67 the lines, M42 files what it imports as it imports
// it, and each argues its own filings where it argues everything else. What
// the correspondence below asserts is that **a filing nobody argued in writing
// fails** — not that one document holds every argument, which would make the
// measurement a ratchet no later milestone could add a child through.
const ARGUED_IN = [DOC, 'docs/m67-umbrellas.md', 'docs/m42-connections.md'];
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
const sources = await readDir('sources');
const byId = new Map(events.map((e) => [e.id, e]));
const sourceById = new Map(sources.map((s) => [s.id, s]));

const active = events.filter((e) => e.status === 'active');
const umbrellas = active.filter((e) => (e.review?.flags ?? []).includes(UMBRELLA_FLAG));
// Through `parentsOf` since M79 made `parent` a list: an event may be part of
// several umbrellas, and comparing the field to an id stops seeing every child
// filed as a list — which does not fail, it passes by finding nothing.
const childrenOf = (id) => active.filter((e) => parentsOf(e).includes(id));
const actorsOf = (e) => new Set((e.actors ?? []).map((a) => a.actor));
// The rule's own reading of an interval, imported rather than re-derived, so
// that this suite cannot disagree with the warning it is guarding.
const span = (when) => ({
  from: astronomicalBounds(when.start).min,
  to: when.end === null || when.end === undefined ? Infinity : astronomicalBounds(when.end).max,
});

// ─── 1. an umbrella is a period with a span somebody else dated ────────────
//
// The brief's first condition, and the one that separates an umbrella from a
// bucket invented for tidiness: the dates are not this atlas's to assert. So
// both ends are dated, and at least one work outside this repository is cited
// for them.

test('every umbrella carries a closed span', () => {
  assert.ok(umbrellas.length > 0, 'the milestone wrote at least one umbrella');
  for (const u of umbrellas) {
    const { from, to } = span(u.when);
    assert.notEqual(to, Infinity, `${u.id} is an umbrella and must have an end`);
    assert.ok(Number.isFinite(from), `${u.id} must have a start`);
    assert.ok(from <= to, `${u.id}'s span must not run backwards`);
  }
});

test('every umbrella cites a source for that span', () => {
  for (const u of umbrellas) {
    const cited = (u.sources ?? []).map((c) => c?.source).filter((id) => typeof id === 'string');
    assert.ok(cited.length > 0, `${u.id} states a span and cites nothing for it`);
    for (const id of cited) {
      const source = sourceById.get(id);
      assert.ok(source, `${u.id} cites "${id}", which is not a source record`);
      assert.equal(source.status, 'active', `${u.id} cites the ${source.status} source "${id}"`);
    }
  }
});

// ─── 2. a child is inside its umbrella's subject ───────────────────────────
//
// The rule a date alone cannot settle. Ninety parentless events start between
// 1926 and 1974 and the window holds the Wall Street Crash, the Great
// Depression, the Holocaust and Vargas's Brazil; filing those under Portuguese
// politics would be worse than leaving them flat. So the child must also be
// the umbrella's own, and what says so on the record is its `actors` or its
// place.
//
// Necessary, not sufficient: `docs/m62-umbrellas.md` names the five events
// this property admits into the Second World War that do not belong there.
// The judgement is in the document; this is the floor it may not go under.

// One clause was added in M67, under amendment A1 of its brief — the owner on
// 21 September: *"It's fine to have no actor or place, you have to read the
// context. Consider covid pandemic for example."* A record that names neither
// is not a defective record, and the property above cannot be asked of it at
// all: there is nothing on it to intersect with. Where that is the case the
// **filing note** stands in, and `the measurement names every event filed
// under one`, below, is what holds it — the document has to say what context
// placed the event, or the filing fails there instead. Nothing else moved:
// a child that does name an actor or a place is held to exactly what M62
// wrote.
test("every child's actors or place put it inside its umbrella", () => {
  for (const u of umbrellas) {
    const mine = actorsOf(u);
    for (const child of childrenOf(u.id)) {
      const shared = [...actorsOf(child)].filter((a) => mine.has(a));
      const samePlace = typeof child.place === 'string' && child.place === u.place;
      const namesNeither = (child.actors ?? []).length === 0 && typeof child.place !== 'string';
      assert.ok(
        shared.length > 0 || samePlace || namesNeither,
        `${child.id} is filed inside "${u.id}" and neither its actors nor its place say it belongs there`,
      );
    }
  }
});

// ─── 3. rule 24, and the warning this milestone must not produce ───────────

test('an umbrella holds a forest: one parent, active, no cycle', () => {
  for (const e of active) {
    for (const id of parentsOf(e)) {
      const parent = byId.get(id);
      assert.ok(parent, `${e.id}'s parent "${id}" is not an event record`);
      assert.equal(parent.kind, 'event', `${e.id}'s parent is a ${parent.kind}`);
      assert.equal(parent.status, 'active', `${e.id} is active and its parent "${parent.id}" is not`);
      // Every path up, not one: with a list of parents the walk is a search,
      // and a cycle through the second parent is a cycle just the same.
      const walk = (at, trail) => {
        assert.ok(!trail.includes(at), `an event cannot be part of itself: ${[...trail, at].join(' → ')}`);
        for (const up of parentsOf(byId.get(at) ?? {})) walk(up, [...trail, at]);
      };
      walk(parent.id, [e.id]);
    }
  }
});

test('no child is dated outside its parent', () => {
  for (const e of active) {
    for (const id of parentsOf(e)) {
      const parent = byId.get(id);
      const child = span(e.when);
      const whole = span(parent.when);
      assert.ok(
        child.from >= whole.from && child.to <= whole.to,
        `${e.id} is part of "${parent.id}" and is not dated inside it`,
      );
    }
  }
});

// And the same thing said by the validator itself, which is what a reviewer
// will read. A rule 24 error fails the run; `child-outside-parent` is a
// warning, so it passes silently unless somebody looks — this is the looking.
test('the validator reports no rule 24 error and no child outside its parent', () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'validate.mjs'), '--index'], { encoding: 'utf8', cwd: ROOT });
  assert.equal(r.status, 0, r.stderr);
  const printed = `${r.stdout}\n${r.stderr}`;
  assert.doesNotMatch(printed, /\[rule 24\]/, 'rule 24 holds over the repository data');
  assert.doesNotMatch(printed, /child-outside-parent/, 'no child is dated outside its parent');
});

// ─── 4. the top-level count falls ──────────────────────────────────────────
//
// An umbrella is a node too, so writing one costs a top-level event before it
// saves any. The count falls exactly when the events filed outnumber the
// umbrellas that hold them — asserted that way rather than as a number,
// because the number is `STATUS.md`'s to say and moves with the next record.

test('no umbrella is empty', () => {
  for (const u of umbrellas) {
    assert.ok(childrenOf(u.id).length > 0, `${u.id} is an umbrella over nothing`);
  }
});

test('the events filed outnumber the umbrellas holding them', () => {
  const filed = active.filter((e) => parentsOf(e).some((id) => umbrellas.some((u) => u.id === id)));
  assert.ok(
    filed.length > umbrellas.length,
    `${filed.length} events under ${umbrellas.length} umbrellas does not lower the top-level count`,
  );
});

// ─── 5. the document and the records say the same thing ────────────────────
//
// M51's correspondence, for the same reason: a run that files an event and
// does not say so in the measurement fails, and so does one that says so and
// does not do it. The document is where the judgement lives, and a filing it
// does not account for is a filing nobody argued for.

test('the measurement names every umbrella it wrote', () => {
  for (const u of umbrellas) {
    assert.ok(doc.includes(`\`${u.id}\``), `${DOC} does not name the umbrella "${u.id}"`);
  }
});

test('the measurement names every event filed under one', () => {
  for (const u of umbrellas) {
    for (const child of childrenOf(u.id)) {
      assert.ok(doc.includes(`\`${child.id}\``), `${DOC} does not say why "${child.id}" is part of "${u.id}"`);
    }
  }
});
