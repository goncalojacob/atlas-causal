import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M52 splits `russia-soviet-union` into the polities it was carrying, and
// turns the owner's rule about successions — the dates have to meet — into
// rule 30. Every test here is a *correspondence* between `docs/m52-russia.md`
// and the records, written the way `tests/m51.test.mjs` was and for the same
// reason: the commit that teaches the tests goes with or before the commit
// that changes what they see (deviations 711 and 717), so nothing below pins
// a state that only one commit has.
//
// A run that retracts a succession and does not list it fails, and so does
// one that lists it and does not retract it.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'docs/m52-russia.md';
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

// A bound is a year or { min, max }; the latest a record may have ended and
// the earliest it may have begun are what rule 30 compares, so an uncertain
// date is read by the side that favours the record.
const latest = (bound) => (Number.isInteger(bound) ? bound : bound?.max);
const earliest = (bound) => (Number.isInteger(bound) ? bound : bound?.min);

// --- the rule (amendments A1 and A3), as M53 left it ---------------------

// M52's first test asserted over `data/` that no active succession is written
// across a gap. **It is deleted, by M53's amendment A2**, and deliberately not
// replaced by a weaker version of itself: the owner, 17 September — *"Forget
// the continuity rule, you can write a succession even if there is no dates
// continuity"* — and A2 says in as many words that **no test may require
// contiguity**. What took its place is `tests/m53.test.mjs`, which asserts the
// warning `succession-gap` fires on exactly the successions that carry a gap,
// and `tests/relation-rules.test.mjs`, which asserts the same over the
// fixtures and that rule 30 reports nothing at all. Everything below this line
// is what M52 wrote that A2 leaves standing.

// The other direction, which the check deliberately leaves alone because an
// overlap explains no ground away. It is still not something the corpus
// should acquire quietly, so it is asserted here over `data/` (the brief's
// test 2).
test('no active succession has its successor beginning before its predecessor ends', () => {
  const wrong = [];
  for (const r of relations) {
    if (r.type !== 'succeeded' || r.status !== 'active') continue;
    const from = byId.get(r.from);
    const to = byId.get(r.to);
    if (!from || !to || from.when?.end === null || from.when?.end === undefined) continue;
    if (earliest(to.when?.start) < latest(from.when.end)) {
      wrong.push(`${r.id}: "${to.id}" begins ${earliest(to.when?.start)} and "${from.id}" ends ${latest(from.when.end)}`);
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// A succession states a date, and a date in this atlas is somebody else's
// claim or a dataset's boundary — never a year that sounded right.
test('every active succession cites a source for the date it gives', () => {
  const bare = relations
    .filter((r) => r.type === 'succeeded' && r.status === 'active')
    .filter((r) => !Array.isArray(r.sources) || r.sources.length === 0)
    .map((r) => r.id);
  assert.deepEqual(bare.sort(), [], bare.join('; '));
});

// --- the four (amendment A2) --------------------------------------------

// The audit table of §1.2 against the records. Read out of the prose so the
// file cannot claim a retraction the data did not make, or stay silent about
// one it did.
const GAP_ROW = /^\| \+\d+ y \| `([a-z0-9-]+)` \| (\d{3,4}) \| `([a-z0-9-]+)` \| (\d{3,4}) \|/;
const listed = doc.split('\n').map((line) => GAP_ROW.exec(line)).filter(Boolean)
  .map(([, from, ends, to, starts]) => ({ id: `${from}--${to}--succeeded`, from, to, ends: Number(ends), starts: Number(starts) }));

// M53's amendment A1 put all four back, so what this asserts is no longer
// "they are retracted" but "they are the four, and M53 restored every one of
// them". The audit is still the audit; only the verdict on it moved.
test(`${DOC} lists the four M52 retracted, and M53 restored every one`, () => {
  assert.ok(listed.length > 0, `${DOC} carries no audit table`);
  const byRelation = new Map(relations.map((r) => [r.id, r]));
  const wrong = [];
  for (const row of listed) {
    const r = byRelation.get(row.id);
    if (!r) { wrong.push(`${row.id}: no such relation`); continue; }
    if (r.status !== 'active') wrong.push(`${row.id}: ${r.status}, and M53 restored it`);
    if (r.retraction !== undefined) wrong.push(`${row.id}: still carries M52's retraction block`);
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
  // And nothing else was left behind retracted under M52's reason.
  const stillRetracted = relations
    .filter((r) => r.type === 'succeeded' && r.status === 'retracted')
    .filter((r) => /M52/.test(r.retraction?.reason ?? ''))
    .map((r) => r.id).sort();
  assert.deepEqual(stillRetracted, [], `${stillRetracted.join(', ')}: M53 A1 withdrew that reason`);
});

test(`every gap ${DOC} lists is the gap those two records still show`, () => {
  const drifted = [];
  for (const row of listed) {
    const from = byId.get(row.from);
    const to = byId.get(row.to);
    if (!from || !to) { drifted.push(`${row.id}: a record is missing`); continue; }
    if (latest(from.when?.end) !== row.ends) drifted.push(`${row.from} ends ${latest(from.when?.end)}, not ${row.ends}`);
    if (earliest(to.when?.start) !== row.starts) drifted.push(`${row.to} begins ${earliest(to.when?.start)}, not ${row.starts}`);
    // Retracting the relation is the whole of what was done: both records
    // stand, and so does their territory.
    if (from.status !== 'active' || to.status !== 'active') drifted.push(`${row.id}: a record was not left standing`);
  }
  assert.deepEqual(drifted.sort(), [], drifted.join('; '));
});

// M52 asked that its retraction reasons be the argument and not a label: both
// dates, and the rule they break. The retractions are gone, and the demand
// survives them in the shape M53 left — the restored relation's own `note`
// carries the two dates, because that is where a reader now meets the gap.
// The assertion itself lives in `tests/m53.test.mjs`, over the same four; what
// is asserted here is that this file's table is still the one it reads.
test(`${DOC}'s four and the four M53 restored are the same set`, () => {
  const doc53 = readFileSync(path.join(ROOT, 'docs/m53-polities.md'), 'utf8');
  const there = [...doc53.matchAll(/^\| `([a-z0-9-]+--[a-z0-9-]+--succeeded)` \| \d+ \|/gm)].map((m) => m[1]).sort();
  assert.deepEqual(there, listed.map((row) => row.id).sort(),
    'docs/m53-polities.md §1.2 and this file\'s audit table are not the same four');
});

// --- Russia (the brief's §2 and §3) --------------------------------------

const events = await readDir('events');
const presences = await readDir('presences');

// The chip the owner objected to. Not a count of actors and not a list of
// ids: the two things that were wrong with `russia-soviet-union` were that it
// was called two polities at once and that it stood through both of the dates
// Wikidata gives for the end of one and the start of the other.
test('no active actor is called "Russia (Soviet Union)", and none stands through both 1917 and 1922', () => {
  const named = actors.filter((a) => a.status === 'active')
    .filter((a) => (a.names ?? []).some((n) => /\(Soviet Union\)/.test(n)))
    .map((a) => a.id);
  assert.deepEqual(named, [], `${named.join(', ')} still carries the label that started this milestone`);
  // The straddle is asked of the records CShapes' entity 365 produced, which
  // is where the conflation was. It is not asked of every record whose name
  // says Russia or Soviet, because M53 wrote one that genuinely stands through
  // both dates on its own cited ones: the Russian SFSR, 1917-10-25 to
  // 1991-12-25 on Q2184, a republic inside the union rather than a label over
  // three polities. Forbidding that would be forbidding the history.
  const fromEntity365 = (a) => (a.sources ?? []).some((s) => s.source === 'cshapes-2-0' && /gwcode 365/.test(s.locator ?? ''));
  const straddling = actors.filter((a) => a.status === 'active')
    .filter((a) => fromEntity365(a))
    .filter((a) => {
      const start = earliest(a.when?.start);
      const end = a.when?.end === null || a.when?.end === undefined ? Infinity : latest(a.when.end);
      return start <= 1917 && end >= 1922;
    })
    .map((a) => `${a.id} (${earliest(a.when?.start)}–${a.when?.end ?? 'open'})`);
  assert.deepEqual(straddling, [], `${straddling.join(', ')} stands through both 1917 and 1922, which is the record M52 was written to split`);
});

// Amendment A1 applied to the split itself: the Empire ends 1917 and the
// Soviet Union begins 1922, so there is nothing to write between them. This
// is also the general guard — any succession touching the three records would
// have to pass rule 30 first, and this says the milestone wrote none at all.
test('no relation joins the three records M52 split apart', () => {
  const three = new Set(['russian-empire', 'soviet-union', 'russia-soviet-union']);
  const between = relations
    .filter((r) => r.status === 'active' && three.has(r.from) && three.has(r.to))
    .map((r) => r.id);
  assert.deepEqual(between, [], between.length
    ? `${between.join(', ')}: five years stand between the Empire's end and the Soviet Union's start, and the post-1991 record's inception is open`
    : undefined);
});

// §2.2's table against the three records. Reads the prose so the file cannot
// say one thing while the records say another, in either direction.
const SPLIT_ROW = /^\| `([a-z0-9-]+)` \| ([^|]+?) \| (\d{3,4}) – (\d{3,4}|open) \| ([^|]+?) \|/;
const split = doc.split('\n').map((line) => SPLIT_ROW.exec(line)).filter(Boolean)
  .map(([, id, name, start, end, provenance]) => ({ id, name, start: Number(start), end: end === 'open' ? null : Number(end), provenance }));

test(`${DOC} §2.2 names the three records, their dates and where each date came from`, () => {
  assert.equal(split.length, 3, `${DOC} §2.2 should carry one row per record`);
  const wrong = [];
  for (const row of split) {
    const a = byId.get(row.id);
    if (!a) { wrong.push(`${row.id}: no such record`); continue; }
    if (a.status !== 'active') wrong.push(`${row.id}: ${a.status}, not active`);
    if (a.names?.[0] !== row.name) wrong.push(`${row.id}: named "${a.names?.[0]}", not "${row.name}"`);
    if (earliest(a.when?.start) !== row.start) wrong.push(`${row.id}: begins ${earliest(a.when?.start)}, not ${row.start}`);
    const end = a.when?.end === null || a.when?.end === undefined ? null : latest(a.when.end);
    if (end !== row.end) wrong.push(`${row.id}: ends ${end}, not ${row.end}`);
    // Every QID and property the row claims is cited on the record itself.
    const cited = JSON.stringify(a.sources ?? []);
    for (const token of row.provenance.match(/Q[1-9][0-9]*|P5(?:71|76)/g) ?? []) {
      if (!cited.includes(token)) wrong.push(`${row.id}: ${DOC} says ${token} and the record cites no such thing`);
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// The brief's fourth test, with the exception the milestone is honest about.
// CShapes draws entity 365 continuously across 1917–1922 and no polity here
// is dated for it, so nine periods sit before their actor's cited inception.
// They are flagged on their own records and listed in §2.5, and this holds
// the two lists to each other rather than waving the warning through.
const GAP_ROW_PRESENCE = /^\| `(russia-soviet-union-[a-z0-9-]+)` \| \d{4}-\d{2}-\d{2} \| /;
const gapListed = doc.split('\n').map((line) => GAP_ROW_PRESENCE.exec(line)).filter(Boolean).map(([, id]) => id);
const touched = new Set(actors.filter((a) => (a.review?.flags ?? []).some((f) => f === 'm52-russia' || f === 'm52-open')).map((a) => a.id));

test(`the presences ${DOC} lists as the 1917–1922 gap are exactly the ones flagged m52-gap`, () => {
  const flagged = presences.filter((p) => (p.review?.flags ?? []).includes('m52-gap')).map((p) => p.id).sort();
  assert.ok(gapListed.length > 0, `${DOC} §2.5 lists no gap period`);
  assert.deepEqual(flagged, [...gapListed].sort(), `${DOC} §2.5 and the records flagged m52-gap are not the same set`);
});

test('a presence of a record M52 touched is inside that actor\'s interval, unless the gap list names it', () => {
  const allowed = new Set(gapListed);
  const outside = [];
  for (const p of presences) {
    if (p.status !== 'active' || !touched.has(p.actor) || allowed.has(p.id)) continue;
    const a = byId.get(p.actor);
    const start = earliest(a.when?.start);
    const end = a.when?.end === null || a.when?.end === undefined ? Infinity : latest(a.when.end);
    const from = earliest(p.when?.start);
    const to = p.when?.end === null || p.when?.end === undefined ? Infinity : latest(p.when.end);
    if (to < start || from > end) outside.push(`${p.id} (${from}–${p.when?.end ?? 'open'}) is outside ${a.id} (${start}–${a.when?.end ?? 'open'})`);
  }
  assert.deepEqual(outside.sort(), [], outside.join('; '));
});

// The brief's fifth test, under M56's corrected rule: an entry is sound when
// the actor's life **overlaps** the event's span, not when the actor was alive
// in the year the event began. The scope is M51's — the records this milestone
// moved — and the document escape below is kept for an entry the rule refuses
// and a person has already argued for.
test('an event naming a record M52 touched names one whose life meets it, or is listed in the document', () => {
  const wrong = [];
  for (const event of events) {
    if (event.status !== 'active') continue;
    const from = earliest(event.when?.start);
    if (typeof from !== 'number') continue;
    const to = event.when?.end === null || event.when?.end === undefined ? Infinity : latest(event.when.end);
    for (const entry of event.actors ?? []) {
      if (!touched.has(entry.actor)) continue;
      const a = byId.get(entry.actor);
      if (!a) { wrong.push(`${event.id} names ${entry.actor}, which is not there`); continue; }
      const start = earliest(a.when?.start);
      const end = a.when?.end === null || a.when?.end === undefined ? Infinity : latest(a.when.end);
      if (!(end < from || start > to)) continue;
      // Listed means named in the document beside the question it raises,
      // not merely mentioned once in a table of what moved where.
      if (new RegExp(`\`${event.id}\`\\*{0,2}, `).test(doc)) continue;
      wrong.push(`${event.id} (${from}–${event.when?.end ?? 'open'}) names ${a.id} (${start}–${a.when?.end ?? 'open'}) and ${DOC} does not say why`);
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});

// §2.6's table against the events. Three columns, one per record, so a run
// that moves an event and does not say so fails, and so does the reverse.
test(`${DOC} §2.6 says where each event's entry went, and that is where it went`, () => {
  const from = doc.indexOf('### 2.6');
  const section = doc.slice(from, doc.indexOf('\n---', from));
  const columns = section.split('\n')
    .filter((line) => line.startsWith('|') && line.endsWith('|') && /`[a-z0-9-]+` [0-9]{4}/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => /`([a-z0-9-]+)` [0-9]{4}/.exec(cell)?.[1] ?? null));
  assert.ok(columns.length >= 10, `${DOC} §2.6 carries no event table (${columns.length} row(s))`);
  const expected = new Map();
  const where = ['russian-empire', 'soviet-union', 'russia-soviet-union'];
  for (const row of columns) {
    assert.equal(row.length, 3, `${DOC} §2.6's table is three columns wide`);
    row.forEach((id, i) => { if (id) expected.set(id, where[i]); });
  }
  assert.equal(expected.size, 20, `${DOC} §2.6 should account for every entry that named the old record`);
  // M53 moved three of these on again, and says so in its own §4.3: the
  // October Revolution, the Civil War and Brest-Litovsk sat on `soviet-union`
  // before its cited inception of 1922-12-30 and now name `russian-sfsr`. The
  // substitution is read out of that file rather than written here, so a run
  // that moves an entry and does not say so still fails, in whichever file it
  // was supposed to say it.
  const doc53 = readFileSync(path.join(ROOT, 'docs/m53-polities.md'), 'utf8');
  for (const [, id, was, is] of doc53.matchAll(/^\| `([a-z0-9-]+)` \d{4} \| `([a-z0-9-]+)` \| `([a-z0-9-]+)` \|/gm)) {
    if (expected.get(id) === was) expected.set(id, is);
  }
  const byEvent = new Map(events.map((e) => [e.id, e]));
  const wrong = [];
  for (const [id, actor] of expected) {
    const e = byEvent.get(id);
    if (!e) { wrong.push(`${id}: no such event`); continue; }
    if (!(e.actors ?? []).some((a) => a.actor === actor)) {
      wrong.push(`${id}: ${DOC} puts it on ${actor}, the record names ${(e.actors ?? []).map((a) => a.actor).join(', ')}`);
    }
  }
  // And nothing still names the old record that the table does not account
  // for: the three lists together are every entry that was there.
  for (const e of events) {
    if (e.status !== 'active') continue;
    for (const a of e.actors ?? []) {
      if (a.actor === 'russia-soviet-union' && expected.get(e.id) !== 'russia-soviet-union') {
        wrong.push(`${e.id} still names russia-soviet-union and ${DOC} §2.6 does not list it there`);
      }
    }
  }
  assert.deepEqual(wrong.sort(), [], wrong.join('; '));
});
