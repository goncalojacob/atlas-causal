import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M57 is the narrative the owner asked for on 17 September: **Brazil has been
// organised around exporting commodities since 1500, and the identity of the
// buyer kept changing — Portugal, then Britain, then the United States, now
// China. Each change was political.** `docs/m57-brief.md` is the instruction
// and `docs/m57-claims.md` is the account.
//
// The atlas already held the first two movements as far as 1930 and the coup
// of 1964. What this milestone adds is what lies between sugar and steel —
// coffee and rubber — the hinge of 1941, and everything after it down to 2023.
//
// This file is written before the records it judges (deviations 711 and 717),
// so on the commit that introduces it every test below fails. Nothing here
// pins a count (brief §6.6): the membership lists are *names*, which is what
// a later run that removes an event should have to argue with, and every
// other property is measured.
//
// **Two readings this suite takes, both argued in `docs/m57-claims.md`:**
//
//   - **"four hops or fewer" is measured per movement**, the way
//     `tests/m50.test.mjs` measured it per chain, and over the *whole* active
//     graph rather than the movement's own edges. Four movements spanning
//     1500 to 2023 have no honest centre that every event of all four is two
//     hops from; forcing one would mean inventing edges, which §5 forbids
//     before it asks for anything else. The global figure is measured below
//     and written down rather than asserted.
//   - **the actor-overlap rule is M56's and is held corpus-wide** by
//     `tests/m56.test.mjs` — "no active event names an actor whose whole life
//     falls outside it" — over every active event, these included. Copying it
//     here is the fifth copy that milestone exists to prevent, so what this
//     suite adds is the half M56 cannot state: that every event here *names*
//     an actor at all.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLAIMS = 'docs/m57-claims.md';
const RUN = 'm57';

const readDir = async (kind) => {
  const dir = path.join(ROOT, 'data', kind);
  const out = [];
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.json')) continue;
    out.push(JSON.parse(await readFile(path.join(dir, file), 'utf8')));
  }
  return out;
};

const readIfPresent = async (file) => {
  try {
    return await readFile(path.join(ROOT, file), 'utf8');
  } catch {
    return null;
  }
};

const events = await readDir('events');
const edges = await readDir('edges');
const sources = await readDir('sources');
const narratives = await readDir('narratives');
const claims = await readIfPresent(CLAIMS);

const sourceById = new Map(sources.map((s) => [s.id, s]));
const activeEdges = edges.filter((e) => e.status === 'active');

// M56's renaming round is why this resolves through `aliases`: an id that a
// later milestone renames must still be findable by the name this file knows.
const eventById = new Map();
for (const e of events) {
  eventById.set(e.id, e);
  for (const alias of e.aliases ?? []) if (!eventById.has(alias)) eventById.set(alias, e);
}
const resolve = (id) => eventById.get(id)?.id ?? id;

// --- the four movements --------------------------------------------------
//
// The thesis is the buyer, so the movements are the buyers. Movement I —
// Portugal, 1494 to 1822 — is already in the atlas in full and this milestone
// adds nothing to it; the narrative walks it out of records M50 wrote. The
// three below are the ones with new events in them.

const MOVEMENTS = new Map([
  ['II — Britain buys', [
    'the-brazilian-coffee-cycle',
    'the-amazon-rubber-boom',
    'the-end-of-the-amazon-rubber-monopoly',
  ]],
  ['III — the United States buys', [
    'companhia-siderurgica-nacional-1941',
    'us-air-bases-in-the-brazilian-northeast-1942',
    'the-rubber-battle-1942',
    'petrobras-1953',
    'profit-remittance-law-1962',
    'the-base-reforms-rally-1964',
    'operation-brother-sam-1964',
    'the-brazilian-miracle-1968-1973',
    'the-brazilian-debt-crisis-1982',
    '1985-brazilian-presidential-election',
  ]],
  ['IV — China buys', [
    'the-1988-brazilian-constitution',
    'the-commodity-boom-and-the-chinese-buyer',
    'operation-car-wash-2014',
    'the-impeachment-of-dilma-rousseff-2016',
    'the-2018-brazilian-general-election',
    'lula-returns-to-the-presidency-2023',
  ]],
]);

const MILESTONE_EVENTS = [...MOVEMENTS.values()].flat();

// The one edge this milestone is judged on before anything else it did. It is
// the claim the confidence vocabulary was built for: whether the United States
// backed the coup because of what Brazil produced, or out of Cold War
// anticommunism with economics secondary, is contested by serious historians
// and the atlas says so rather than picking a side.
const MOTIVE_EDGE = 'profit-remittance-law-1962--operation-brother-sam-1964--caused';
const NARRATIVE = 'who-was-buying';

// --- the events exist ----------------------------------------------------

test('every event this milestone names is an active event record', () => {
  const wrong = [];
  for (const [movement, ids] of MOVEMENTS) {
    for (const id of ids) {
      const event = eventById.get(id);
      if (!event) wrong.push(`${movement}: "${id}" is not an event record`);
      else if (event.status !== 'active') wrong.push(`${movement}: "${id}" is ${event.status}`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('no event is named by two movements', () => {
  const seen = new Map();
  const wrong = [];
  for (const [movement, ids] of MOVEMENTS) {
    for (const id of ids) {
      if (seen.has(id)) wrong.push(`"${id}" is in both ${seen.get(id)} and ${movement}`);
      else seen.set(id, movement);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// --- the graph these events make ------------------------------------------

// Adjacency over the whole active graph, either way along an edge: a reader
// who leaves this milestone's records and comes back has still walked a path
// the atlas drew, and half of what holds these movements together is the
// records M50 wrote.
const neighbours = new Map();
const link = (a, b) => {
  if (!neighbours.has(a)) neighbours.set(a, new Set());
  neighbours.get(a).add(b);
};
for (const e of activeEdges) {
  const from = resolve(e.from);
  const to = resolve(e.to);
  if (!eventById.has(from) || !eventById.has(to)) continue;
  link(from, to);
  link(to, from);
}

const MAX_HOPS = 4;

const distancesFrom = (start, limit = Infinity) => {
  const seen = new Map([[start, 0]]);
  let frontier = [start];
  for (let depth = 1; depth <= limit && frontier.length; depth += 1) {
    const next = [];
    for (const node of frontier) {
      for (const to of neighbours.get(node) ?? []) {
        if (seen.has(to)) continue;
        seen.set(to, depth);
        next.push(to);
      }
    }
    frontier = next;
  }
  return seen;
};

for (const [movement, ids] of MOVEMENTS) {
  test(`${movement}: every event is ${MAX_HOPS} hops or fewer from every other`, () => {
    const wrong = [];
    for (const from of ids) {
      const reach = distancesFrom(resolve(from), MAX_HOPS);
      for (const to of ids) {
        if (from === to) continue;
        if (!reach.has(resolve(to))) wrong.push(`${from} → ${to}: further than ${MAX_HOPS} hops`);
      }
    }
    assert.deepEqual(wrong, [], `${wrong.length} pair(s) too far apart:\n${wrong.join('\n')}`);
  });
}

test('no event this milestone writes hangs off fewer than two active edges', () => {
  const wrong = [];
  for (const id of MILESTONE_EVENTS) {
    const degree = (neighbours.get(resolve(id)) ?? new Set()).size;
    if (degree < 2) wrong.push(`${id}: ${degree} active edge(s)`);
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// The milestone's events are one graph and not three: whatever the hop count
// between two of them, there is a path. This is the property the per-movement
// reading above gives up, stated at the strength it can honestly be stated.
test('every event this milestone writes reaches every other by some path', () => {
  const reach = distancesFrom(resolve(MILESTONE_EVENTS[0]));
  const unreachable = MILESTONE_EVENTS.filter((id) => !reach.has(resolve(id)));
  assert.deepEqual(unreachable, [], `not connected to ${MILESTONE_EVENTS[0]}:\n${unreachable.join('\n')}`);
});

// --- what an event of this milestone carries ------------------------------

const bounds = (v) => (Number.isInteger(v) ? { min: v, max: v } : (v && Number.isInteger(v.min) && Number.isInteger(v.max) ? v : null));

test('every event this milestone writes has a place and a dated when', () => {
  const wrong = [];
  for (const id of MILESTONE_EVENTS) {
    const e = eventById.get(id);
    if (!e) continue;
    if (typeof e.place !== 'string') wrong.push(`${id}: no place`);
    const start = bounds(e.when?.start);
    if (!start) { wrong.push(`${id}: when.start is not a year`); continue; }
    if (e.when.end === undefined) { wrong.push(`${id}: when has no end`); continue; }
    const end = e.when.end === null ? null : bounds(e.when.end);
    if (e.when.end !== null && !end) { wrong.push(`${id}: when.end is neither a year nor null`); continue; }
    if (end && end.max < start.min) wrong.push(`${id}: ends before it starts`);
    const yearOf = (d) => Number.parseInt(String(d).replace(/^(-?)(\d+)-.*$/, '$1$2'), 10);
    if (typeof e.when.date === 'string') {
      const y = yearOf(e.when.date);
      if (y < start.min || y > start.max) wrong.push(`${id}: when.date is ${y}, outside when.start`);
    }
    if (typeof e.when.endDate === 'string' && end) {
      const y = yearOf(e.when.endDate);
      if (y < end.min || y > end.max) wrong.push(`${id}: when.endDate is ${y}, outside when.end`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// Brief §6.5, in the half M56 leaves open. That the named actor's span meets
// the event's is `tests/m56.test.mjs`, over every active event in the corpus;
// an event that names nobody passes that check by having nothing to check, so
// it is caught here instead.
test('every event this milestone writes names at least one actor', () => {
  const wrong = [];
  for (const id of MILESTONE_EVENTS) {
    const e = eventById.get(id);
    if (!e) continue;
    if (!Array.isArray(e.actors) || e.actors.length === 0) wrong.push(`${id}: names no actor`);
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// A1 of M50 chose Wikipedia and the owner's decision of 16 September kept it,
// so a reviewer must be able to open the exact text this run read.
test('every event this milestone writes cites a Wikipedia article at a revision', () => {
  const wrong = [];
  for (const id of MILESTONE_EVENTS) {
    const e = eventById.get(id);
    if (!e) continue;
    const dated = (e.sources ?? []).some((c) => /^wikipedia-/.test(c.source ?? '') && /revision \d+/.test(c.locator ?? ''));
    if (!dated) wrong.push(`${id}: no Wikipedia citation naming a revision`);
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// --- the edges this milestone writes --------------------------------------

// Identified by the run that wrote them rather than by their ends, because
// half of them reach out of this milestone's events into M50's.
const milestoneEdges = activeEdges.filter((e) => e.origin?.run === RUN);
const named = new Set(MILESTONE_EVENTS);

test('this milestone writes edges at all, and each one touches an event it names', () => {
  assert.ok(milestoneEdges.length > 0, `no active edge carries origin.run "${RUN}"`);
  const stray = milestoneEdges
    .filter((e) => !named.has(resolve(e.from)) && !named.has(resolve(e.to)))
    .map((e) => `${e.id}: neither end is an event this milestone names`);
  assert.deepEqual(stray, [], stray.join('\n'));
});

test('every edge this milestone writes cites sources that exist', () => {
  const wrong = [];
  for (const e of milestoneEdges) {
    if (!Array.isArray(e.sources) || e.sources.length === 0) { wrong.push(`${e.id}: no source`); continue; }
    for (const c of e.sources) {
      if (!sourceById.has(c.source)) wrong.push(`${e.id}: "${c.source}" is not a source record`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// Amendment A2, which rule 22 will not catch: Wikipedia is one source however
// many of its articles are read, so an edge resting on it alone is `probable`
// however settled the history is. Promotion means a work Wikipedia itself
// cites, with a page — never a second Wikipedia article repeating the first.
test('no edge this milestone writes claims consensus on encyclopedias alone', () => {
  const ENCYCLOPEDIA = new Set(['wikipedia-en', 'wikipedia-pt', 'wikidata']);
  const wrong = [];
  for (const e of milestoneEdges) {
    if (e.confidence !== 'consensus') continue;
    const cited = (e.sources ?? []).map((c) => c.source);
    if (cited.every((id) => ENCYCLOPEDIA.has(id))) wrong.push(`${e.id}: consensus on encyclopedias alone (A2)`);
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('every disputed edge this milestone writes says who disagrees and cites them', () => {
  const wrong = [];
  for (const e of milestoneEdges) {
    if (e.confidence !== 'disputed') continue;
    if (!e.dispute || typeof e.dispute.text !== 'string' || e.dispute.text.trim().length < 40) {
      wrong.push(`${e.id}: a disputed edge must say what is disputed`);
    }
    if (!Array.isArray(e.dispute?.sources) || e.dispute.sources.length === 0) {
      wrong.push(`${e.id}: a disputed edge cites the dissenting sources`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// --- brief §3: the link that must be disputed ------------------------------
//
// "A run that quietly writes it as `caused` has failed this milestone,
// whatever else it did." The type *is* `caused`; what may not be quiet is the
// confidence. These four assertions are the whole of that instruction.

test(`${MOTIVE_EDGE} is an active edge`, () => {
  const edge = edges.find((e) => e.id === MOTIVE_EDGE);
  assert.ok(edge, `the 1964 motive edge "${MOTIVE_EDGE}" is not a record`);
  assert.equal(edge.status, 'active');
});

test('the 1964 motive edge is disputed', () => {
  const edge = edges.find((e) => e.id === MOTIVE_EDGE);
  assert.ok(edge, `the 1964 motive edge "${MOTIVE_EDGE}" is not a record`);
  assert.equal(edge.confidence, 'disputed', 'brief §3: this is the claim the confidence vocabulary was built for');
});

test('the 1964 motive edge carries two sources, one for each reading', () => {
  const edge = edges.find((e) => e.id === MOTIVE_EDGE);
  assert.ok(edge, `the 1964 motive edge "${MOTIVE_EDGE}" is not a record`);
  const citation = (c) => `${c.source}${c.locator ?? ''}`;
  const forIt = (edge.sources ?? []).map(citation);
  const against = (edge.dispute?.sources ?? []).map(citation);
  assert.ok(forIt.length > 0, 'the edge cites nothing for the reading it states');
  assert.ok(against.length > 0, 'the dispute cites nothing for the reading it answers');
  const shared = forIt.filter((c) => against.includes(c));
  assert.deepEqual(shared, [], `both readings rest on the same citation: ${shared.join(', ')}`);
});

test('the 1964 motive edge names both readings in words', () => {
  const edge = edges.find((e) => e.id === MOTIVE_EDGE);
  assert.ok(edge, `the 1964 motive edge "${MOTIVE_EDGE}" is not a record`);
  // The economic reading is what the edge asserts; the dispute is the one the
  // brief names against it, and it has to be recognisable as that one rather
  // than as a general hedge.
  assert.match(edge.explanation ?? '', /remittance|profit/i);
  assert.match(edge.dispute?.text ?? '', /anti-?communis/i);
});

// --- brief §4: the narrative -----------------------------------------------

const narrative = narratives.find((n) => n.id === NARRATIVE);

test(`the narrative "${NARRATIVE}" is an active record with a walk`, () => {
  assert.ok(narrative, `no narrative record "${NARRATIVE}"`);
  assert.equal(narrative.status, 'active');
  assert.ok(Array.isArray(narrative.steps) && narrative.steps.length > 0, 'the narrative walks nothing');
});

test('every step of the walk names a record that is active', () => {
  assert.ok(narrative, `no narrative record "${NARRATIVE}"`);
  const activeEdgeIds = new Set(activeEdges.map((e) => e.id));
  const wrong = [];
  for (const step of narrative.steps ?? []) {
    const ref = step.ref ?? '';
    const asEvent = eventById.get(ref);
    if (asEvent) {
      if (asEvent.status !== 'active') wrong.push(`${ref}: the event is ${asEvent.status}`);
      continue;
    }
    if (!activeEdgeIds.has(ref)) wrong.push(`${ref}: neither an active event nor an active edge`);
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('the walk passes through the disputed link', () => {
  assert.ok(narrative, `no narrative record "${NARRATIVE}"`);
  const refs = (narrative.steps ?? []).map((s) => s.ref);
  assert.ok(
    refs.includes(MOTIVE_EDGE),
    'brief §4: the reader has to meet the banner in the middle of the argument, not as a curiosity',
  );
});

test('the walk reaches every movement', () => {
  assert.ok(narrative, `no narrative record "${NARRATIVE}"`);
  const refs = (narrative.steps ?? []).map((s) => s.ref ?? '');
  // A step names an event, or an edge whose id begins `from--to--type`; either
  // way the events it stands on are the ids inside it.
  const touched = new Set();
  for (const ref of refs) {
    for (const part of ref.split('--')) touched.add(resolve(part));
  }
  const missing = [];
  for (const [movement, ids] of MOVEMENTS) {
    if (!ids.some((id) => touched.has(resolve(id)))) missing.push(movement);
  }
  assert.deepEqual(missing, [], `the walk never reaches:\n${missing.join('\n')}`);
});

// --- the ledger of claims --------------------------------------------------

test(`${CLAIMS} exists`, () => {
  assert.ok(claims !== null, `${CLAIMS} is the milestone's ledger and it is not written`);
});

test(`${CLAIMS} lists every event and every edge this milestone writes`, () => {
  assert.ok(claims !== null, `${CLAIMS} is not written`);
  const missing = [
    ...MILESTONE_EVENTS.filter((id) => !claims.includes(id)),
    ...milestoneEdges.map((e) => e.id).filter((id) => !claims.includes(id)),
  ];
  assert.deepEqual(missing, [], `not in ${CLAIMS}:\n${missing.join('\n')}`);
});

test(`${CLAIMS} names a source record for every row it lists`, () => {
  assert.ok(claims !== null, `${CLAIMS} is not written`);
  const wrong = [];
  for (const line of claims.split('\n')) {
    if (!/^\|\s*`/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    const id = /^`([a-z0-9-]+)`/.exec(cells[0] ?? '')?.[1];
    if (!id) continue;
    const cited = [...cells.slice(1).join(' ').matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
    const known = cited.filter((s) => sourceById.has(s));
    if (known.length === 0) wrong.push(`${id}: no source record named`);
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});
