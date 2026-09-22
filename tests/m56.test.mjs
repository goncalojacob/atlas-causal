import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M56 corrects a rule that four milestones wrote four times and got wrong the
// same way: **an `actors` entry is sound when the actor's life overlaps the
// event's span**, not when the actor was alive on the day the event began.
//
// The start-only reading is right for a battle and nonsense for a process.
// `the-atlantic-slave-trade-to-brazil` runs from 1540 and names the Empire of
// Brazil, 1822–1889; the Empire genuinely was an actor in that trade, so the
// entry is right and the check was wrong. The **validator has had the overlap
// rule all along** — `actor-outside-when` fires only where the event falls
// *entirely* outside the actor's dates — so what M56 corrects is the four
// copies in the milestone suites, which is where the false positives were.
//
// The rule is held once here, over the whole corpus, so that a milestone
// tempted to write a fifth copy has one to point at instead.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
const byId = new Map(actors.map((a) => [a.id, a]));

// A bound is an integer or a `{min, max}` range; an absent end means still
// standing, which reaches forward without limit.
const earliest = (bound) => (Number.isInteger(bound) ? bound : bound?.min);
const latest = (bound) => (Number.isInteger(bound) ? bound : bound?.max);
const from = (when) => earliest(when?.start) ?? -Infinity;
const to = (when) => (when?.end === null || when?.end === undefined ? Infinity : latest(when.end) ?? Infinity);

// **The rule.** Two intervals overlap unless one ends before the other begins.
export const overlaps = (a, b) => !(to(a) < from(b) || from(a) > to(b));

// --- the four the brief measured ----------------------------------------

// Asserted by hand, and by name, so that a later run which re-dates any of the
// eight intervals involved fails here rather than somewhere general.
const MEASURED = [
  ['the-atlantic-slave-trade-to-brazil', 'empire-of-brazil'],
  ['the-atlantic-slave-trade-to-the-caribbean', 'united-kingdom-before-1886'],
  ['royal-african-company', 'united-kingdom-before-1886'],
  ['chinese-civil-war', 'taiwan'],
];

// Entries later milestones added that the two rules also disagree about. They
// are listed apart from the four so that "the brief measured" keeps meaning
// what it meant, and listed at all because the test below is the one that
// stops the difference between the rules going quiet: a corpus growing past
// this file is expected, a corpus growing past it *silently* is not.
//
// Both of M57's are the same shape as the brief's first, and the shape is the
// whole argument of this milestone: **a long export cycle that begins under
// one polity and goes on under the next**. The coffee cycle runs 1830–1930 and
// the rubber boom 1879–1912; `brazil` begins in 1889, so the start-only rule
// says neither may name the republic, while the café com leite politics, the
// valorisation schemes from 1906 and the Acre question are all the republic's.
// The records name it, and they are right to (docs/m57-claims.md).
//
// M62's four are the same argument again, and this time about a period rather
// than a trade. An umbrella event is a stretch of years, so **its actors are
// the actors of the stretch and not of its first day**: the First Republic
// runs 1910–1926 and the Partido Democrático was founded in 1912, the
// Republican Liberal Party in 1919 and the Democratic Left in 1920 — three
// parties of that republic, none of them alive on the day it was proclaimed.
// The Colonial War runs from February 1961 and FRELIMO was founded in 1962,
// which does not stop it being one of the three movements the war was fought
// against. The records name them, and they are right to
// (docs/m62-umbrellas.md).
const LATER = [
  ['the-brazilian-coffee-cycle', 'brazil'],
  ['the-amazon-rubber-boom', 'brazil'],
  ['first-portuguese-republic-1910-1926', 'partido-democratico'],
  ['first-portuguese-republic-1910-1926', 'republican-liberal-party'],
  ['first-portuguese-republic-1910-1926', 'democratic-leftwing-republican-party'],
  ['portuguese-colonial-war-1961-1974', 'frelimo'],
  // M42's curation fire of 22 September, filling actorless events from their
  // item's P710. The war runs 1991 to 1995 and the CShapes record `croatia`
  // begins in 1992 — a recognition date, not the year a state began fighting
  // for itself — so the two overlap without the polity being alive at the
  // start. docs/m53-polities.md §4.1 says the same thing where it counts.
  ['croatian-war-of-independence', 'croatia'],
];

test('all four entries the brief measured survive the overlap rule', () => {
  const byEvent = new Map(events.map((e) => [e.id, e]));
  const wrong = [];
  for (const [id, actorId] of MEASURED) {
    const e = byEvent.get(id);
    const a = byId.get(actorId);
    if (!e) { wrong.push(`${id}: no such event`); continue; }
    if (!a) { wrong.push(`${actorId}: no such actor`); continue; }
    if (!(e.actors ?? []).some((x) => x.actor === actorId)) { wrong.push(`${id} no longer names ${actorId}`); continue; }
    if (!overlaps(a.when, e.when)) {
      wrong.push(`${id} (${from(e.when)}–${e.when?.end ?? 'open'}) and ${actorId} (${from(a.when)}–${a.when?.end ?? 'open'}) do not meet`);
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// **`chinese-civil-war` is the brief's own exception, and it survives too.**
// The brief expected it not to, reading the event as the point 1946; the
// record runs **1946 to 1950** and `taiwan` begins in 1949, so the two meet by
// a year. Deviation 795 reached the same conclusion from the other side when
// M53 annotated the entry rather than removing it. What is still open is not
// the arithmetic but the identity — whether the CShapes record `taiwan` is the
// polity that fought from 1946 — and that is a person's question, listed.
test('chinese-civil-war and taiwan meet, and the year they meet in is 1949', () => {
  const e = events.find((x) => x.id === 'chinese-civil-war');
  const a = byId.get('taiwan');
  assert.ok(e && a);
  assert.equal(from(e.when), 1946);
  assert.equal(to(e.when), 1950);
  assert.equal(from(a.when), 1949);
  assert.ok(overlaps(a.when, e.when));
});

test('the start-only rule is the wrong rule, and these are the entries that prove it', () => {
  // The two rules disagree on exactly the entries named above — the brief's
  // four, and the ones later milestones added. If a later run re-dates one of
  // the records so that they agree again, or writes a new entry of this shape
  // without saying so, this fails — deliberately: the difference between the
  // rules is what the milestone was about and should not go quiet unnoticed.
  const differ = [];
  for (const e of events) {
    if (e.kind !== 'event' || e.status !== 'active') continue;
    for (const x of e.actors ?? []) {
      const a = byId.get(x.actor);
      if (!a) continue;
      const startAlive = from(e.when) >= from(a.when) && from(e.when) <= to(a.when);
      if (!startAlive && overlaps(a.when, e.when)) differ.push(`${e.id}--${x.actor}`);
    }
  }
  const expected = [...MEASURED, ...LATER].map(([e, a]) => `${e}--${a}`);
  assert.deepEqual(differ.sort(), expected.sort(), differ.join('; '));
});

test('no active event names an actor whose whole life falls outside it', () => {
  const wrong = [];
  for (const e of events) {
    if (e.kind !== 'event' || e.status !== 'active') continue;
    for (const x of e.actors ?? []) {
      const a = byId.get(x.actor);
      if (!a) { wrong.push(`${e.id} names ${x.actor}, which is not a record`); continue; }
      if (!overlaps(a.when, e.when)) {
        wrong.push(`${e.id} (${from(e.when)}–${e.when?.end ?? 'open'}) names ${a.id} (${from(a.when)}–${a.when?.end ?? 'open'})`);
      }
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// The validator is where the rule was already right, and it stays the
// authority: `actor-outside-when` is a **warning**, because the two intervals
// come from two records and neither is wrong on its own. This asserts that it
// says nothing about the four — which is the same claim as the tests above,
// made by the code the site and the dashboard actually run.
test('the validator reports none of the four, because its rule was overlap all along', async () => {
  const { checkRules } = await import('../src/validate/rules.js');
  const { buildTopology } = await import('../src/validate/core.js');
  const named = new Set(MEASURED.map(([id]) => id));
  const kinds = ['events', 'actors', 'presences', 'places', 'relations', 'edges', 'sources', 'offices', 'tenures', 'narratives'];
  const records = (await Promise.all(kinds.map(readDir))).flat();
  const entries = records.map((record) => ({ record, file: `${record.kind}s/${record.id}.json` }));
  const { warnings } = checkRules(records, buildTopology(entries));
  const complained = warnings
    .filter((w) => w.rule === 'actor-outside-when' && named.has(w.id))
    .map((w) => `${w.id}: ${w.message}`);
  assert.deepEqual(complained.sort(), [], complained.join('; '));
});
