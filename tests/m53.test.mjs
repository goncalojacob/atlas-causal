import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkRules } from '../src/validate/rules.js';

// M53 relaxes the contiguity rule the owner imposed on M52 and then withdrew,
// creates the polities the Brazilian and Russian chains need, and gives every
// chain event an actor that was alive when it happened.
//
// Written the way `tests/m51.test.mjs` and `tests/m52.test.mjs` were: every
// test is a *correspondence* between `docs/m53-polities.md` and the records,
// so the document cannot claim something the data did not do, or stay silent
// about something it did. Nothing here pins a count of actors.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'docs/m53-polities.md';
const doc = await readFile(path.join(ROOT, DOC), 'utf8');

const readDir = async (kind) => {
  const dir = path.join(ROOT, 'data', kind);
  const out = [];
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.json')) continue;
    out.push(JSON.parse(await readFile(path.join(dir, file), 'utf8')));
  }
  return out;
};

const actors = await readDir('actors');
const relations = await readDir('relations');
const byId = new Map(actors.map((a) => [a.id, a]));

const latest = (bound) => (Number.isInteger(bound) ? bound : bound?.max);
const earliest = (bound) => (Number.isInteger(bound) ? bound : bound?.min);

// --- §1: the rule relaxed, and the four restored ------------------------

const RESTORED_ROW = /^\| `([a-z0-9-]+--[a-z0-9-]+--succeeded)` \| (\d+) \| (\d{3,4}) \| (\d{3,4}) \|/;
const restored = doc.split('\n').map((line) => RESTORED_ROW.exec(line)).filter(Boolean)
  .map(([, id, gap, ends, starts]) => ({ id, gap: Number(gap), ends: Number(ends), starts: Number(starts) }));

test(`${DOC} §1.2 lists the successions M53 restored, and each one is active`, () => {
  assert.equal(restored.length, 4, `${DOC} §1.2 should carry one row per restored succession`);
  const byRelation = new Map(relations.map((r) => [r.id, r]));
  const wrong = [];
  for (const row of restored) {
    const r = byRelation.get(row.id);
    if (!r) { wrong.push(`${row.id}: no such relation`); continue; }
    if (r.status !== 'active') wrong.push(`${row.id}: ${r.status}, not active`);
    if (r.type !== 'succeeded') wrong.push(`${row.id}: type ${r.type}`);
    // Rule 27 permits a retraction block only on a retracted record, so a
    // restoration that forgot to drop it would be an error in the validator;
    // this says the same thing where the restoration is described.
    if (r.retraction !== undefined) wrong.push(`${row.id}: still carries a retraction block`);
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

test('no succession anywhere is still retracted for the reason M52 gave', () => {
  const stuck = relations
    .filter((r) => r.status === 'retracted' && /amendment A1|dates.*meet/i.test(r.retraction?.reason ?? ''))
    .map((r) => r.id);
  assert.deepEqual(stuck.sort(), [], `${stuck.join(', ')}: amendment A1 of M53 withdrew that reason`);
});

// The gap each row claims is the gap the two records still show, and the
// relation's own note carries it. A restored relation that says nothing about
// what stood between is the thing A1 asked for and did not get.
test('every restored succession carries its own gap in its own note', () => {
  const byRelation = new Map(relations.map((r) => [r.id, r]));
  const thin = [];
  for (const row of restored) {
    const r = byRelation.get(row.id);
    if (!r) continue;
    const from = byId.get(r.from);
    const to = byId.get(r.to);
    if (!from || !to) { thin.push(`${row.id}: an end does not resolve to an actor`); continue; }
    if (latest(from.when?.end) !== row.ends) thin.push(`${r.from} ends ${latest(from.when?.end)}, not ${row.ends}`);
    if (earliest(to.when?.start) !== row.starts) thin.push(`${r.to} begins ${earliest(to.when?.start)}, not ${row.starts}`);
    if (earliest(to.when?.start) - latest(from.when?.end) !== row.gap) thin.push(`${row.id}: the gap is not ${row.gap} years`);
    const note = r.note ?? '';
    if (!/M53/.test(note)) thin.push(`${row.id}: the note does not say it was restored`);
    if (!note.includes(String(row.starts))) thin.push(`${row.id}: the note does not say the successor begins ${row.starts}`);
  }
  assert.deepEqual(thin.sort(), [], thin.join('; '));
});

// The point of A1, stated over `data/` rather than over a fixture: a gap is
// reported and not refused. The validator is run for real here, because the
// claim is about what the validator does and not about what the records hold.
test('a succession written across a gap is a warning and not an error', async () => {
  assert.ok(restored.length > 0, `${DOC} lists no restored succession to check`);
  // The four relations and the six actors they name are all `succession-gap`
  // reads, so the check runs over those and not over the whole corpus.
  const byRelation = new Map(relations.map((r) => [r.id, r]));
  const records = [];
  for (const row of restored) {
    const r = byRelation.get(row.id);
    if (!r) continue;
    records.push(r, byId.get(r.from), byId.get(r.to));
  }
  const result = checkRules(records.filter(Boolean), {});
  const named = result.warnings.filter((w) => w.rule === 'succession-gap').map((w) => w.id).sort();
  assert.deepEqual(named, restored.map((row) => row.id).sort(),
    'the four restored successions are exactly the ones `succession-gap` names');
  assert.deepEqual(result.errors.filter((e) => e.rule === 30), [],
    'rule 30 is gone and nothing reports under its number');
});

// --- §2 and §3: the polities written, and their dates -------------------

// §2.2's table against the records, the way `tests/m52.test.mjs` reads M52's.
// Every QID and property a row names has to be cited on the record itself, so
// the document cannot claim a provenance the record does not carry.
const POLITY_ROW = /^\| `([a-z0-9-]+)` \| ([^|]+?) \| (-?\d{3,4}) – (-?\d{3,4}|open) \| ([^|]+?) \|/;
const written = doc.split('\n').map((line) => POLITY_ROW.exec(line)).filter(Boolean)
  .map(([, id, name, start, end, provenance]) => ({ id, name, start: Number(start), end: end === 'open' ? null : Number(end), provenance }));

test(`${DOC} §2.2 names the records M53 wrote, their dates and where each date came from`, () => {
  assert.ok(written.length > 0, `${DOC} §2.2 carries no table`);
  const wrong = [];
  for (const row of written) {
    const a = byId.get(row.id);
    if (!a) { wrong.push(`${row.id}: no such record`); continue; }
    if (a.status !== 'active') wrong.push(`${row.id}: ${a.status}, not active`);
    if (a.names?.[0] !== row.name) wrong.push(`${row.id}: named "${a.names?.[0]}", not "${row.name}"`);
    if (earliest(a.when?.start) !== row.start) wrong.push(`${row.id}: begins ${earliest(a.when?.start)}, not ${row.start}`);
    const end = a.when?.end === null || a.when?.end === undefined ? null : latest(a.when.end);
    if (end !== row.end) wrong.push(`${row.id}: ends ${end}, not ${row.end}`);
    const cited = JSON.stringify(a.sources ?? []);
    for (const token of row.provenance.match(/Q[1-9][0-9]*|P5(?:71|76)/g) ?? []) {
      if (!cited.includes(token)) wrong.push(`${row.id}: ${DOC} says ${token} and the record cites no such thing`);
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// §2.1's lookup table is the only place a date in this milestone may come
// from, so every year any record M53 touched now carries has to appear there
// or in a source the record already had. This is the "no invented date" rule
// as an assertion rather than as a promise.
const LOOKUP_ROW = /^\| [^|]+ \| `(Q[1-9][0-9]*)` \| ([^|]+?) \| ([^|]+?) \|$/;
const looked = doc.split('\n').map((line) => LOOKUP_ROW.exec(line)).filter(Boolean)
  .map(([, qid, inception, dissolved]) => ({ qid, inception: inception.trim(), dissolved: dissolved.trim() }));

test(`${DOC} §2.1 cites a QID and a property for every date M53's own records give`, () => {
  assert.ok(looked.length > 0, `${DOC} §2.1 carries no lookup table`);
  const years = new Set();
  for (const row of looked) {
    for (const value of [row.inception, row.dissolved]) {
      const year = /^(-?\d{3,4})/.exec(value);
      if (year) years.add(Number(year[1]));
    }
  }
  const wrong = [];
  for (const row of written) {
    if (!years.has(row.start)) wrong.push(`${row.id}: begins ${row.start} and no row of §2.1 gives that year`);
    if (row.end !== null && !years.has(row.end)) wrong.push(`${row.id}: ends ${row.end} and no row of §2.1 gives that year`);
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// §2.3: Brazil's start is the Empire's cited dissolution, and the CShapes
// period that spanned it was cut rather than moved whole. The two halves have
// to carry the same outline, because "presences move, geometry is never
// redrawn" is the rule the cut had to satisfy.
const presences = await readDir('presences');
const PRESENCE_ROW = /^\| `([a-z0-9-]+-\d{4})` \| `([a-z0-9-]+)` \| (\d{4})-\d{2}-\d{2} \| (\d{4})-\d{2}-\d{2} \|/;
const moved = doc.split('\n').map((line) => PRESENCE_ROW.exec(line)).filter(Boolean)
  .map(([, id, actor, from, to]) => ({ id, actor, from: Number(from), to: Number(to) }));

test(`${DOC} §2.3's periods are where it says, on one outline and not two`, () => {
  assert.equal(moved.length, 2, `${DOC} §2.3 should carry the two halves of the cut period`);
  const byPresence = new Map(presences.map((p) => [p.id, p]));
  const wrong = [];
  const keys = new Set();
  for (const row of moved) {
    const p = byPresence.get(row.id);
    if (!p) { wrong.push(`${row.id}: no such presence`); continue; }
    if (p.status !== 'active') wrong.push(`${row.id}: ${p.status}, not active`);
    if (p.actor !== row.actor) wrong.push(`${row.id}: belongs to ${p.actor}, not ${row.actor}`);
    if (earliest(p.when?.start) !== row.from) wrong.push(`${row.id}: begins ${earliest(p.when?.start)}, not ${row.from}`);
    if (latest(p.when?.end) !== row.to) wrong.push(`${row.id}: ends ${latest(p.when?.end)}, not ${row.to}`);
    if (!byId.get(p.actor)) wrong.push(`${row.id}: ${p.actor} is not an actor`);
    keys.add(`${(p.geometry?.files ?? []).join(',')}#${p.geometry?.key}`);
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
  assert.equal(keys.size, 1, `the two halves of a cut period carry one outline between them, not ${keys.size}`);
});

// The point of §2.3, stated over the records rather than over the document: no
// active presence of a record M53 touched sits outside its actor's own
// interval. This is the fault the milestone exists to fix — the Empire holding
// ground fourteen years after it ended, the Republic holding none until 1903.
const TOUCHED = ['empire-of-brazil', 'brazil', 'russian-sfsr', 'russian-republic'];

test('every presence of a record M53 wrote or re-dated is inside that actor\'s interval', () => {
  const touched = new Set(TOUCHED);
  const outside = [];
  for (const p of presences) {
    if (p.status !== 'active' || !touched.has(p.actor)) continue;
    const a = byId.get(p.actor);
    const start = earliest(a.when?.start);
    const end = a.when?.end === null || a.when?.end === undefined ? Infinity : latest(a.when.end);
    const from = earliest(p.when?.start);
    const to = p.when?.end === null || p.when?.end === undefined ? Infinity : latest(p.when.end);
    if (from < start || to > end) outside.push(`${p.id} (${from}–${p.when?.end ?? 'open'}) is outside ${a.id} (${start}–${a.when?.end ?? 'open'})`);
  }
  assert.deepEqual(outside.sort(), [], outside.join('; '));
});

// §2.5's table against the relations: every succession M53 wrote is there, its
// gap is what the row claims, and a row saying "none" is a pair whose dates
// meet. A milestone that writes a succession and does not list it fails here,
// and so does one that lists a gap the records do not show.
const SUCCESSION_ROW = /^\| `([a-z0-9-]+--[a-z0-9-]+--succeeded)` \| (none|\d+ years?) \|/;
const written53 = doc.split('\n').map((line) => SUCCESSION_ROW.exec(line)).filter(Boolean)
  .map(([, id, gap]) => ({ id, gap: gap === 'none' ? 0 : Number(/\d+/.exec(gap)[0]) }));

test(`${DOC} §2.5 lists every succession M53 wrote, with the gap the records show`, () => {
  const mine = relations
    .filter((r) => r.type === 'succeeded' && r.status === 'active' && r.origin?.run === 'm53')
    .map((r) => r.id).sort();
  assert.deepEqual(written53.map((row) => row.id).sort(), mine,
    `${DOC} §2.5 and the successions M53 wrote are not the same set`);
  const byRelation = new Map(relations.map((r) => [r.id, r]));
  const wrong = [];
  for (const row of written53) {
    const r = byRelation.get(row.id);
    const from = byId.get(r.from);
    const to = byId.get(r.to);
    if (!from || !to) { wrong.push(`${row.id}: an end does not resolve to an actor`); continue; }
    const gap = Math.max(0, earliest(to.when?.start) - latest(from.when?.end));
    if (gap !== row.gap) wrong.push(`${row.id}: the gap is ${gap} years and ${DOC} says ${row.gap}`);
    // Amendment A2: a succession's dates are cited. That test stays.
    if (!Array.isArray(r.sources) || r.sources.length === 0) wrong.push(`${row.id}: cites no source`);
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// §3: the 1917 line composes, and nothing was written between the SFSR and the
// Soviet Union in either direction — they overlap by design.
test('the Russian line from the Empire to 1991 is continuous and cited', () => {
  const chain = ['russian-empire', 'russian-republic', 'russian-sfsr'];
  const byRelation = new Map(relations.map((r) => [r.id, r]));
  for (let i = 0; i + 1 < chain.length; i += 1) {
    const id = `${chain[i]}--${chain[i + 1]}--succeeded`;
    const r = byRelation.get(id);
    assert.ok(r && r.status === 'active', `${id} is not an active succession`);
    const from = byId.get(chain[i]);
    const to = byId.get(chain[i + 1]);
    assert.ok(earliest(to.when?.start) - latest(from.when?.end) <= 1,
      `${id}: ${chain[i]} ends ${latest(from.when?.end)} and ${chain[i + 1]} begins ${earliest(to.when?.start)}`);
    assert.ok((r.sources ?? []).some((s) => /Q\d+, P57[16]/.test(s.locator ?? '')),
      `${id} does not cite a QID and a property for the date it gives`);
  }
  const between = relations.filter((r) => r.status === 'active')
    .filter((r) => (r.from === 'russian-sfsr' && r.to === 'soviet-union') || (r.from === 'soviet-union' && r.to === 'russian-sfsr'))
    .map((r) => r.id);
  assert.deepEqual(between, [], `${between.join(', ')}: the SFSR was a republic inside the union, not its predecessor or its successor`);
});

// --- §4: the events that named nobody -----------------------------------

const events = await readDir('events');
const chainDoc = await readFile(path.join(ROOT, 'docs/m50-chains.md'), 'utf8');
const chain = new Set([...chainDoc.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((m) => m[1]));
const roles = new Set(JSON.parse(await readFile(path.join(ROOT, 'data/roles.json'), 'utf8')).map((r) => r.id));

const from = (when) => earliest(when?.start);
const to = (when) => (when?.end === null || when?.end === undefined ? Infinity : latest(when.end));
// M56: the rule is **overlap**, not life at the event's start. Written here
// as `meets` and held once in `tests/m56.test.mjs`; `alive` survives below for
// the one thing that is a count and not a soundness check.
const meets = (id, when) => {
  const a = byId.get(id);
  if (!a || a.status !== 'active') return false;
  return !(to(a.when) < from(when) || from(a.when) > to(when));
};
const alive = (id, year) => {
  const a = byId.get(id);
  if (!a || a.status !== 'active') return false;
  return year >= from(a.when) && year <= to(a.when);
};

// **The test M50 lacked.** Its own tests asked for reachability within the
// chain, two edges, sources, cross-chain routing, a place and a date, and
// never asked whether a chain event is reachable from an actor — which is how
// M48 and M54 made the atlas explorable. Thirty-five of thirty-six carried
// `actors: []` until this milestone.
test('every event of the two M50 chains names an actor whose life meets it', () => {
  assert.ok(chain.size >= 30, `docs/m50-chains.md lists ${chain.size} events`);
  const byEvent = new Map(events.map((e) => [e.id, e]));
  const silent = [];
  for (const id of chain) {
    const e = byEvent.get(id);
    if (!e) { silent.push(`${id}: no such event`); continue; }
    if (e.status !== 'active') continue;
    const year = from(e.when);
    const entries = e.actors ?? [];
    if (entries.length === 0) { silent.push(`${id} (${year}) carries actors: []`); continue; }
    if (!entries.some((x) => meets(x.actor, e.when))) {
      silent.push(`${id} (${year}) names ${entries.map((x) => x.actor).join(', ')} and none of them meets it`);
    }
  }
  assert.deepEqual(silent.sort(), [], silent.join('; '));
});

// The other half of the same demand, and the stricter one for a long event: an
// entry may name an actor that enters part-way through — the Empire of Brazil
// in a slave trade that began in 1540 — but never one whose whole life falls
// outside the event. This is the fault the brief found in `chinese-civil-war`.
test('every actors entry M53 wrote names an actor whose life overlaps the event', () => {
  const byEvent = new Map(events.map((e) => [e.id, e]));
  const wrong = [];
  for (const id of chain) {
    const e = byEvent.get(id);
    if (!e || e.status !== 'active') continue;
    for (const x of e.actors ?? []) {
      const a = byId.get(x.actor);
      if (!a) { wrong.push(`${id} names ${x.actor}, which is not a record`); continue; }
      if (!roles.has(x.role)) wrong.push(`${id}/${x.actor}: "${x.role}" is not a role in data/roles.json`);
      if (to(a.when) < from(e.when) || from(a.when) > to(e.when)) {
        wrong.push(`${id} (${from(e.when)}–${e.when?.end ?? 'open'}) names ${a.id} (${from(a.when)}–${a.when?.end ?? 'open'})`);
      }
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// §4.1's table against the corpus. The "after" column is a live count and the
// "before" column is history; what this holds is that the document cannot
// report a figure the records do not show.
//
// It reads the **last** "after" row rather than M53's own, because the corpus
// goes on growing: M57 wrote nineteen events, every one of them naming an
// actor, and the M53 row went stale the moment they landed. Taking the last
// row means a milestone that writes events has to re-take the count and put a
// row under the old one, which is the correspondence this file exists for;
// pinning M53's row would have meant either a permanently red test or a
// document quietly rewritten to say something it never measured.
const COUNT_ROW = /^\| \*\*after M\d+\*\* \| (\d+) of (\d+) \| (\d+) of (\d+) \|/;
const countRows = doc.split('\n').map((line) => COUNT_ROW.exec(line)).filter(Boolean);
const counted = countRows[countRows.length - 1];

// M56 left the rule here alone, and this is why. §4.1 is a **coverage**
// figure, not a soundness check, and the document states the rule it counted
// by in its own words — "an event names at least one actor that is alive in
// the year the event starts". Rewriting the predicate under a sentence that
// says otherwise would make the correspondence this file exists for a lie.
// Measured on 17 September, the two rules give the **same four numbers**: no
// event owes its place in the count to an actor that merely overlaps it. If
// that ever stops being true this test fails, and the answer then is to say so
// in the document rather than to change the reading underneath it.
test(`${DOC} §4.1 reports the figure the corpus actually shows`, () => {
  assert.ok(counted, `${DOC} §4.1 carries no "after M<n>" row`);
  const [, chainNamed, chainTotal, allNamed, allTotal] = counted.map(Number);
  const active = events.filter((e) => e.status === 'active');
  const names = (e) => (e.actors ?? []).some((x) => alive(x.actor, from(e.when)));
  const meeting = (e) => (e.actors ?? []).some((x) => meets(x.actor, e.when));
  assert.equal(active.filter(names).length, active.filter(meeting).length,
    'the two rules no longer give the same figure: §4.1 says which one it counted by');
  const chainActive = active.filter((e) => chain.has(e.id));
  assert.equal(chainActive.length, chainTotal, `${DOC} says ${chainTotal} active chain events`);
  assert.equal(chainActive.filter(names).length, chainNamed, `${DOC} says ${chainNamed} chain events name an actor alive at their start`);
  assert.equal(active.length, allTotal, `${DOC} says ${allTotal} active events`);
  assert.equal(active.filter(names).length, allNamed, `${DOC} says ${allNamed} active events name an actor alive at their start`);
});

// §4.3's table against the records, in both directions: the three events named
// `soviet-union` before it existed and now name the SFSR, and nothing else
// moved off `soviet-union` that the table does not list.
const MOVED_ROW = /^\| `([a-z0-9-]+)` \d{4} \| `([a-z0-9-]+)` \| `([a-z0-9-]+)` \|/;
const movedOff = doc.split('\n').map((line) => MOVED_ROW.exec(line)).filter(Boolean)
  .map(([, id, was, is]) => ({ id, was, is }));

test(`${DOC} §4.3 says where the three stranded events went, and that is where they went`, () => {
  assert.equal(movedOff.length, 3, `${DOC} §4.3 should carry one row per stranded event`);
  const byEvent = new Map(events.map((e) => [e.id, e]));
  const wrong = [];
  for (const row of movedOff) {
    const e = byEvent.get(row.id);
    if (!e) { wrong.push(`${row.id}: no such event`); continue; }
    const named = (e.actors ?? []).map((x) => x.actor);
    if (!named.includes(row.is)) wrong.push(`${row.id}: ${DOC} puts it on ${row.is}, it names ${named.join(', ')}`);
    if (named.includes(row.was)) wrong.push(`${row.id}: still names ${row.was}`);
    if (!meets(row.is, e.when)) wrong.push(`${row.id}: ${row.is} does not meet ${from(e.when)}–${e.when?.end ?? 'open'}`);
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});
