import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { astronomicalBounds } from '../src/util/dates.js';

// M67 is the second half of M62. M65 put the resting picture at the main
// events — those that are part of no other — and said plainly that the cut
// "will not feel like much until far more of the 242 have somewhere to hang".
// Forty-eight of those 242 named no actor and no place at all, so no rule
// that reads a record could file them anywhere. This milestone writes the
// line each one was missing, from the source the record already cites, and
// then measures the umbrellas again with those lines in place.
//
// This file is written before the records it judges (deviations 711 and 717),
// so on the commit that introduces it every test below fails.
//
// **Nothing here names a record and nothing pins a count.** The two things
// this run writes are found by the flags they carry — `m67-lined` for an
// event that got an actor or a place line, `m67-umbrella` for a period
// created to hold others — the milestone-flag idiom `m50-chain`, `m59-joined`
// and `m62-umbrella` already use, and everything else is asserted of whatever
// carries them. A suite that listed the ids would go on passing the day a
// forty-ninth record is lined badly.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'docs/m67-umbrellas.md';
const LINED_FLAG = 'm67-lined';
const UMBRELLA_FLAG = 'm67-umbrella';

// The measurement is a later commit than this file, and a missing document is
// a failing assertion rather than a suite that cannot be loaded.
// Read with the later measurements beside it, for the reason `tests/m62.test.mjs`
// gives at the same place: the arguments for a filing and for a main event
// left bare are written by whichever milestone made them, and asserting that
// one file holds all of them would stop any later run adding a record at all.
// The property is unchanged — **a filing or a bare main event nobody argued in
// writing fails.**
const ARGUED_IN = [DOC, 'docs/m42-connections.md'];
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
const actors = await readDir('actors');
const places = await readDir('places');
const sources = await readDir('sources');

const byId = new Map(events.map((e) => [e.id, e]));
const actorById = new Map(actors.map((a) => [a.id, a]));
const placeById = new Map(places.map((p) => [p.id, p]));
const sourceById = new Map(sources.map((s) => [s.id, s]));

const active = events.filter((e) => e.status === 'active');
const flagsOf = (r) => r.review?.flags ?? [];
const lined = active.filter((e) => flagsOf(e).includes(LINED_FLAG));
const umbrellas = active.filter((e) => flagsOf(e).includes(UMBRELLA_FLAG));
const childrenOf = (id) => active.filter((e) => e.parent === id);
const actorsOf = (e) => new Set((e.actors ?? []).map((a) => a.actor));
// The rule's own reading of an interval, imported rather than re-derived, so
// that this suite cannot disagree with the warning it is guarding.
const span = (when) => ({
  from: astronomicalBounds(when.start).min,
  to: when.end === null || when.end === undefined ? Infinity : astronomicalBounds(when.end).max,
});
const overlaps = (a, b) => a.from <= b.to && b.from <= a.to;

// ─── 1. the line, and what stands behind it ────────────────────────────────
//
// The brief's first test. An actor line and a place line are claims about who
// did a thing and where it happened, and this milestone wrote forty-odd of
// them out of the Wikidata item each record already cited. So every record it
// touched still cites something, everything it cites is a source this atlas
// holds, and the line is not left pointing at nothing.

test('the milestone lined at least one event', () => {
  assert.ok(lined.length > 0, `no event carries the "${LINED_FLAG}" flag`);
});

test('every event lined here now names an actor or a place', () => {
  for (const e of lined) {
    const named = (e.actors ?? []).length > 0 || typeof e.place === 'string';
    assert.ok(named, `${e.id} is flagged "${LINED_FLAG}" and still names neither an actor nor a place`);
  }
});

test('every line written here cites a source', () => {
  for (const e of lined) {
    const cited = (e.sources ?? []).map((c) => c?.source).filter((id) => typeof id === 'string');
    assert.ok(cited.length > 0, `${e.id} carries a line written here and cites nothing for it`);
    for (const id of cited) {
      const source = sourceById.get(id);
      assert.ok(source, `${e.id} cites "${id}", which is not a source record`);
      assert.equal(source.status, 'active', `${e.id} cites the ${source.status} source "${id}"`);
    }
  }
});

// No actor was invented to make a line possible — that is M42's job and the
// brief says so twice. What this asserts is the shape of that promise: every
// actor a line names is a record this atlas already holds, still active, and
// alive when the event happened. The last clause is the floor under the
// `actor-outside-when` warning, which the run must not produce.

test('every actor a line names is an active record of this atlas', () => {
  for (const e of lined) {
    for (const line of e.actors ?? []) {
      const actor = actorById.get(line.actor);
      assert.ok(actor, `${e.id} names the actor "${line.actor}", which is not an actor record`);
      assert.equal(actor.kind, 'actor', `${e.id} names "${line.actor}", which is a ${actor.kind}`);
      assert.equal(actor.status, 'active', `${e.id} names the ${actor.status} actor "${line.actor}"`);
    }
  }
});

test('no line puts an event outside the actor it names', () => {
  for (const e of lined) {
    for (const line of e.actors ?? []) {
      const actor = actorById.get(line.actor);
      if (!actor?.when) continue;
      assert.ok(
        overlaps(span(e.when), span(actor.when)),
        `${e.id} falls entirely outside "${line.actor}"'s dates`,
      );
    }
  }
});

test('every place a line names is an active record of this atlas', () => {
  for (const e of lined) {
    if (typeof e.place !== 'string') continue;
    const place = placeById.get(e.place);
    assert.ok(place, `${e.id} names the place "${e.place}", which is not a place record`);
    assert.equal(place.status, 'active', `${e.id} names the ${place.status} place "${e.place}"`);
  }
});

// A role outside `data/roles.json` is rule 25, an error, and the validator
// below would catch it. This says the same thing where the failure names the
// line rather than the file, because a role is the other half of what a line
// asserts.

test('every role a line takes is one of the vocabulary\'s', async () => {
  const roles = new Set(JSON.parse(await readFile(path.join(ROOT, 'data', 'roles.json'), 'utf8')).map((r) => r.id));
  for (const e of lined) {
    for (const line of e.actors ?? []) {
      assert.ok(roles.has(line.role), `${e.id} gives "${line.actor}" the role "${line.role}", which data/roles.json does not hold`);
    }
  }
});

// ─── 2. the umbrellas, under M62's unchanged rule ──────────────────────────
//
// Inside the umbrella's span *and* inside its subject. The span is not this
// atlas's to assert, so both ends are dated and something outside this
// repository is cited for them; the subject is what the child's own `actors`
// or place says. Necessary and not sufficient, exactly as in M62: the
// document is where the judgement lives and this is the floor it may not go
// under.

test('every umbrella created here carries a closed, cited span', () => {
  for (const u of umbrellas) {
    const { from, to } = span(u.when);
    assert.ok(Number.isFinite(from), `${u.id} must have a start`);
    assert.notEqual(to, Infinity, `${u.id} is an umbrella and must have an end`);
    assert.ok(from <= to, `${u.id}'s span must not run backwards`);
    const cited = (u.sources ?? []).map((c) => c?.source).filter((id) => typeof id === 'string');
    assert.ok(cited.length > 0, `${u.id} states a span and cites nothing for it`);
    for (const id of cited) {
      const source = sourceById.get(id);
      assert.ok(source, `${u.id} cites "${id}", which is not a source record`);
      assert.equal(source.status, 'active', `${u.id} cites the ${source.status} source "${id}"`);
    }
  }
});

test('no umbrella created here is an umbrella over nothing', () => {
  for (const u of umbrellas) {
    assert.ok(childrenOf(u.id).length > 0, `${u.id} is an umbrella over nothing`);
  }
});

// Amendment A1 of the brief, the owner on 21 September: *"It's fine to have no
// actor or place, you have to read the context. Consider covid pandemic for
// example."* A pandemic, a crash, a treaty system has no single actor and no
// one place, and a line written to give it one would be a claim the record
// does not support — so bareness is not a defect and not a bar to being filed.
// What stands in for the property there is **the filing note**: where a record
// names neither, the measurement has to say what context placed it, and the
// document naming it is what this can check. It is the weaker test on purpose
// and only where the stronger one cannot be asked.
const inSubject = (child, mine, umbrella) => {
  if ([...actorsOf(child)].some((a) => mine.has(a))) return true;
  if (typeof child.place === 'string') return child.place === umbrella.place;
  return (child.actors ?? []).length === 0;
};

test("every child's actors or place put it inside its umbrella", () => {
  for (const u of umbrellas) {
    const mine = actorsOf(u);
    for (const child of childrenOf(u.id)) {
      assert.ok(
        inSubject(child, mine, u),
        `${child.id} is filed inside "${u.id}" and neither its actors nor its place say it belongs there`,
      );
    }
  }
});

test('a child that names neither is one the measurement argues for', () => {
  assert.ok(doc.length > 0, `${DOC} is missing`);
  for (const child of active) {
    if (typeof child.parent !== 'string') continue;
    if ((child.actors ?? []).length > 0 || typeof child.place === 'string') continue;
    assert.ok(
      doc.includes(`\`${child.id}\``),
      `${child.id} names neither an actor nor a place and is filed inside "${child.parent}" with nothing said about why`,
    );
  }
});

// ─── 3. rule 24, over the whole atlas and not only over this run ───────────

test('the events form a forest: one parent, active, no cycle', () => {
  for (const e of active) {
    if (typeof e.parent !== 'string') continue;
    const parent = byId.get(e.parent);
    assert.ok(parent, `${e.id}'s parent "${e.parent}" is not an event record`);
    assert.equal(parent.kind, 'event', `${e.id}'s parent is a ${parent.kind}`);
    assert.equal(parent.status, 'active', `${e.id} is active and its parent "${parent.id}" is not`);
    const walked = [e.id];
    const seen = new Set(walked);
    for (let at = parent; at; at = typeof at.parent === 'string' ? byId.get(at.parent) : null) {
      assert.ok(!seen.has(at.id), `an event cannot be part of itself: ${[...walked, at.id].join(' → ')}`);
      seen.add(at.id);
      walked.push(at.id);
    }
  }
});

test('no child is dated outside its parent', () => {
  for (const e of active) {
    if (typeof e.parent !== 'string') continue;
    const parent = byId.get(e.parent);
    const child = span(e.when);
    const whole = span(parent.when);
    assert.ok(
      child.from >= whole.from && child.to <= whole.to,
      `${e.id} is part of "${parent.id}" and is not dated inside it`,
    );
  }
});

// And the same things said by the validator itself, which is what a reviewer
// reads. Rule 24 and rule 25 are errors and fail the run; `child-outside-parent`
// and `actor-outside-when` are warnings, so they pass silently unless somebody
// looks — this is the looking, and both stood at zero on the head this
// milestone started from.
test('the validator reports no rule 24 or 25 error and no dating warning', () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'validate.mjs'), '--index'], { encoding: 'utf8', cwd: ROOT });
  assert.equal(r.status, 0, r.stderr);
  const printed = `${r.stdout}\n${r.stderr}`;
  assert.doesNotMatch(printed, /\[rule 24\]/, 'rule 24 holds over the repository data');
  assert.doesNotMatch(printed, /\[rule 25\]/, 'every role is one of the vocabulary\'s');
  assert.doesNotMatch(printed, /child-outside-parent/, 'no child is dated outside its parent');
  assert.doesNotMatch(printed, /actor-outside-when/, 'no event falls outside an actor it names');
});

// ─── 4. the two counts the brief asks to fall ──────────────────────────────
//
// Neither is pinned. The events that name nothing fall by exactly the events
// lined here, which test 1 above already holds to naming something; what is
// left to say is that the main count falls too, and an umbrella is a main
// event itself, so it only falls when the events filed outnumber the
// umbrellas written to hold them. Filing under an umbrella that already
// existed costs nothing and is pure gain, which is why the comparison is made
// against this run's own umbrellas alone.

test('the events filed under this run\'s umbrellas outnumber those umbrellas', () => {
  if (umbrellas.length === 0) return;
  const filed = active.filter((e) => typeof e.parent === 'string' && umbrellas.some((u) => u.id === e.parent));
  assert.ok(
    filed.length > umbrellas.length,
    `${filed.length} events under ${umbrellas.length} umbrellas does not lower the main count`,
  );
});

test('every event lined here is one the main count can now file', () => {
  // The point of the first job: a record that names nothing cannot be filed
  // by any rule that reads a record. Each of these now carries something a
  // rule can read, whether or not this run was the one to file it.
  for (const e of lined) {
    const readable = (e.actors ?? []).length > 0 || typeof e.place === 'string';
    assert.ok(readable, `${e.id} was lined and still says nothing a rule can read`);
  }
});

// ─── 5. the document and the records say the same thing ────────────────────
//
// M51's correspondence and M62's, for the same reason: a run that writes a
// line and does not say where it came from fails, and so does one that says
// so and does not do it. The document is where the judgement lives, and a
// line it does not account for is a line nobody argued for.

test('the measurement names every event it lined', () => {
  assert.ok(doc.length > 0, `${DOC} is missing`);
  for (const e of lined) {
    assert.ok(doc.includes(`\`${e.id}\``), `${DOC} does not say where the lines on "${e.id}" came from`);
  }
});

test('the measurement names every umbrella it wrote and every event under one', () => {
  assert.ok(doc.length > 0, `${DOC} is missing`);
  for (const u of umbrellas) {
    assert.ok(doc.includes(`\`${u.id}\``), `${DOC} does not name the umbrella "${u.id}"`);
    for (const child of childrenOf(u.id)) {
      assert.ok(doc.includes(`\`${child.id}\``), `${DOC} does not say why "${child.id}" is part of "${u.id}"`);
    }
  }
});

// The events this run could not line are the other half of the measurement,
// and the brief asks for them by name: "where even that gives no actor the
// atlas has a record for, leave it and list it". So a main event that still
// names nothing is either one the document accounts for, or a hole.

test('every main event that still names nothing is listed in the measurement', () => {
  assert.ok(doc.length > 0, `${DOC} is missing`);
  const bare = active.filter((e) => (
    typeof e.parent !== 'string'
    && (e.actors ?? []).length === 0
    && typeof e.place !== 'string'
  ));
  for (const e of bare) {
    assert.ok(doc.includes(`\`${e.id}\``), `${DOC} does not say why "${e.id}" was left bare`);
  }
});
