import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M50 builds two worked chains — Brazil and the Caribbean — dense enough that
// somebody could write a narrative over them. The measured fault it answers is
// in `docs/m50-brief.md` §1: 41% of the active events carry one edge or none,
// so the atlas is a list with decorations rather than a graph.
//
// Every test here is a *correspondence* between `docs/m50-chains.md` and the
// records, written the way `tests/m51.test.mjs` and `tests/m52.test.mjs` were
// and for the same reason: the commit that teaches the tests goes before the
// commit that changes what they see (deviations 711 and 717), so nothing below
// pins a count of events or edges (brief §8.6). A run that lists an event in a
// chain and does not wire it fails, and so does one that wires it and does not
// list it.
//
// The two properties that are this milestone's whole argument:
//
//   - a chain is *walkable* — four hops between any two of its events, and no
//     event in it hanging off a single edge (§8.1, §8.2);
//   - the chains touch only where they *share a record* (§2). A thematic arrow
//     between two colonial chains is not an edge, and the test for that is
//     stated negatively below: no active edge may join a Brazil-only event
//     directly to a Caribbean-only one.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'docs/m50-chains.md';
const CLAIMS = 'docs/m50-claims.md';
const doc = await readFile(path.join(ROOT, DOC), 'utf8');
const claims = await readFile(path.join(ROOT, CLAIMS), 'utf8');

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
const edges = await readDir('edges');
const sources = await readDir('sources');

const eventById = new Map(events.map((e) => [e.id, e]));
const sourceById = new Map(sources.map((s) => [s.id, s]));
const activeEdges = edges.filter((e) => e.status === 'active');

// --- reading the chains out of the document ------------------------------
//
// The document is the milestone's statement of what it built; the records are
// what it built. Neither is allowed to drift from the other, which is why the
// membership lists are parsed rather than repeated here.

// The rows of one `## ` section, as `[ids in that row]` per table row. A row
// is a table line whose first cell holds a backticked id.
const rowsUnder = (heading) => {
  const from = doc.indexOf(`\n## ${heading}\n`);
  assert.notEqual(from, -1, `${DOC} has no section "## ${heading}"`);
  const rest = doc.slice(from + 1);
  const next = rest.indexOf('\n## ');
  const body = next < 0 ? rest : rest.slice(0, next);
  return body
    .split('\n')
    .filter((line) => /^\|\s*`/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
};

const idIn = (cell) => {
  const m = /^`([a-z0-9-]+)`/.exec(cell ?? '');
  return m ? m[1] : null;
};

const chainRows = (heading) => rowsUnder(heading).map((cells) => ({
  id: idIn(cells[0]),
  shared: /shared/i.test(cells[1] ?? ''),
}));

const BRAZIL = 'The Brazil chain';
const CARIBBEAN = 'The Caribbean chain';
const CROSS = 'The cross-links';

const brazil = chainRows(BRAZIL);
const caribbean = chainRows(CARIBBEAN);
const chains = new Map([[BRAZIL, brazil], [CARIBBEAN, caribbean]]);

const idsOf = (rows) => new Set(rows.map((r) => r.id));
const brazilIds = idsOf(brazil);
const caribbeanIds = idsOf(caribbean);
const chainIds = new Set([...brazilIds, ...caribbeanIds]);
// A shared record is one both chains name: it is what a cross-link routes
// through, and the only place the two chains are allowed to touch.
const sharedIds = new Set([...brazilIds].filter((id) => caribbeanIds.has(id)));

const crossLinks = rowsUnder(CROSS).map((cells) => ({
  from: idIn(cells[0]),
  to: idIn(cells[1]),
  through: idIn(cells[2]),
}));

// --- the lists are lists of records --------------------------------------

test(`every id ${DOC} puts in a chain is an active event`, () => {
  const wrong = [];
  for (const [name, rows] of chains) {
    for (const row of rows) {
      if (row.id === null) { wrong.push(`${name}: a row names no id`); continue; }
      const event = eventById.get(row.id);
      if (!event) wrong.push(`${name}: "${row.id}" is not an event record`);
      else if (event.status !== 'active') wrong.push(`${name}: "${row.id}" is ${event.status}`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test(`a row marked shared in ${DOC} is named by both chains, and no other row is`, () => {
  const wrong = [];
  for (const [name, rows] of chains) {
    for (const row of rows) {
      if (row.shared && !sharedIds.has(row.id)) {
        wrong.push(`${name}: "${row.id}" is marked shared but the other chain does not name it`);
      }
      if (!row.shared && sharedIds.has(row.id)) {
        wrong.push(`${name}: "${row.id}" is named by both chains but not marked shared`);
      }
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
  assert.ok(sharedIds.size > 0, 'the two chains share no record at all; §2 says they must touch through one');
});

test('neither chain is empty and neither is the whole of the other', () => {
  assert.ok(brazilIds.size > sharedIds.size, 'the Brazil chain is nothing but shared records');
  assert.ok(caribbeanIds.size > sharedIds.size, 'the Caribbean chain is nothing but shared records');
});

// --- §8.1: a chain is walkable -------------------------------------------

// Adjacency over the *whole* active graph and not just the chain's own edges:
// "reachable following active edges either way" is a fact about the atlas the
// reader walks, and a path that leaves the chain and comes back is still a
// path they can take.
const neighbours = new Map();
const link = (a, b) => {
  if (!neighbours.has(a)) neighbours.set(a, new Set());
  neighbours.get(a).add(b);
};
for (const e of activeEdges) {
  if (!eventById.has(e.from) || !eventById.has(e.to)) continue;
  link(e.from, e.to);
  link(e.to, e.from);
}

const MAX_HOPS = 4;

const hopsFrom = (start) => {
  const seen = new Map([[start, 0]]);
  let frontier = [start];
  for (let depth = 1; depth <= MAX_HOPS && frontier.length; depth += 1) {
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

for (const [name, rows] of chains) {
  test(`${name}: every event is ${MAX_HOPS} hops or fewer from every other`, () => {
    const ids = [...idsOf(rows)];
    const wrong = [];
    for (const from of ids) {
      const reach = hopsFrom(from);
      for (const to of ids) {
        if (from === to) continue;
        if (!reach.has(to)) wrong.push(`${from} → ${to}: not reachable in ${MAX_HOPS} hops`);
      }
    }
    assert.deepEqual(wrong, [], `${wrong.length} pair(s) too far apart:\n${wrong.slice(0, 20).join('\n')}`);
  });

  test(`${name}: no event hangs off fewer than two active edges`, () => {
    const wrong = [];
    for (const id of idsOf(rows)) {
      const degree = (neighbours.get(id) ?? new Set()).size;
      if (degree < 2) wrong.push(`${id}: ${degree} active edge(s)`);
    }
    assert.deepEqual(wrong, [], wrong.join('\n'));
  });
}

// --- §8.5: every chain event is placed and dated -------------------------

// "A dated `when`" read as: the interval is in time rather than vague — both
// bounds are years, a `{min,max}` range being a year the source itself does
// not pin — and where the record does give a day, that day falls inside the
// interval it belongs to. The first draft of this test asked every one-year
// event for its day as well, and a source that says only "in 1763" is what
// showed that to be a demand on the sources rather than on the run. See
// docs/m50-chains.md, "the reading of the brief's tests".
const bounds = (v) => (Number.isInteger(v) ? { min: v, max: v } : (v && Number.isInteger(v.min) && Number.isInteger(v.max) ? v : null));

test('every chain event has a place and a dated when', () => {
  const wrong = [];
  for (const id of chainIds) {
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

// A1 chose Wikipedia, so a reviewer must be able to open the exact text this
// run read. Every chain event carries a citation naming the article and the
// revision id it was read at — which is stricter than rule 6, and is the check
// that makes the ledger in docs/m50-claims.md worth anything.
test('every chain event cites a Wikipedia article at a revision', () => {
  const wrong = [];
  for (const id of chainIds) {
    const e = eventById.get(id);
    if (!e) continue;
    const dated = (e.sources ?? []).some((c) => c.source === 'wikipedia-en' && /revision \d+/.test(c.locator ?? ''));
    if (!dated) wrong.push(`${id}: no wikipedia-en citation naming a revision`);
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// --- §8.3: every chain edge carries its justification --------------------

// The edges this milestone is judged on: both ends inside the two chains.
const chainEdges = activeEdges.filter((e) => chainIds.has(e.from) && chainIds.has(e.to));

// Rule 9 compares creators across the cited sources. The same comparison is
// made here rather than left to the validator, because §8.3 is a statement
// about these chains and not about whatever happened to be under validation.
const creatorKeys = (id) => new Set(
  (sourceById.get(id)?.creators ?? [])
    .map((n) => n.toLowerCase().replace(/[^a-z]+/g, ' ').trim())
    .filter(Boolean),
);

test('every chain edge cites a source', () => {
  const wrong = chainEdges
    .filter((e) => !Array.isArray(e.sources) || e.sources.length === 0)
    .map((e) => `${e.id}: no source`);
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('every chain edge cites sources that exist', () => {
  const wrong = [];
  for (const e of chainEdges) {
    for (const c of e.sources ?? []) {
      if (!sourceById.has(c.source)) wrong.push(`${e.id}: "${c.source}" is not a source record`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// Amendment A2, which the validator will not catch: rule 22 tests only that a
// Wikipedia locator exists. Wikipedia is one source however many articles are
// read, so a chain edge resting on it alone is `probable`. This is the test
// that fails the run the brief says has failed whatever the validator says.
test('no chain edge reaches consensus on fewer than two authors, and none on Wikipedia alone', () => {
  const WIKIPEDIA = new Set(['wikipedia-en', 'wikipedia-pt', 'wikidata']);
  const wrong = [];
  for (const e of chainEdges) {
    if (e.confidence !== 'consensus') continue;
    const cited = (e.sources ?? []).map((c) => c.source);
    if (cited.every((id) => WIKIPEDIA.has(id))) {
      wrong.push(`${e.id}: consensus on encyclopedias alone (A2)`);
      continue;
    }
    const keys = cited.map(creatorKeys);
    let independent = false;
    for (let i = 0; i < keys.length && !independent; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        if (keys[i].size && keys[j].size && [...keys[i]].every((k) => !keys[j].has(k))) { independent = true; break; }
      }
    }
    if (!independent) wrong.push(`${e.id}: consensus without two cited authors who differ (rule 9)`);
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('every disputed chain edge says who disagrees and cites them', () => {
  const wrong = [];
  for (const e of chainEdges) {
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

// --- §2 and §8.4: the chains touch only through a shared record ----------

test('no active edge joins a Brazil-only event straight to a Caribbean-only one', () => {
  const only = (id) => {
    if (sharedIds.has(id)) return null;
    if (brazilIds.has(id)) return BRAZIL;
    if (caribbeanIds.has(id)) return CARIBBEAN;
    return null;
  };
  const wrong = [];
  for (const e of activeEdges) {
    const a = only(e.from);
    const b = only(e.to);
    if (a && b && a !== b) wrong.push(`${e.id}: ${a} → ${b} with no record both chains name`);
  }
  assert.deepEqual(wrong, [], `a thematic arrow is not an edge (§2):\n${wrong.join('\n')}`);
});

test(`every cross-link in ${DOC} is an active edge through a record both chains name`, () => {
  const byEnds = new Map(activeEdges.map((e) => [`${e.from}${e.to}`, e]));
  const wrong = [];
  assert.ok(crossLinks.length > 0, `${DOC} declares no cross-link`);
  for (const link of crossLinks) {
    const edge = byEnds.get(`${link.from}${link.to}`);
    if (!edge) { wrong.push(`${link.from} → ${link.to}: no active edge`); continue; }
    if (!sharedIds.has(link.through)) {
      wrong.push(`${edge.id}: "${link.through}" is not named by both chains`);
      continue;
    }
    if (link.from !== link.through && link.to !== link.through) {
      wrong.push(`${edge.id}: does not touch "${link.through}"`);
    }
    // The other end is in a chain, and it is not the shared record's own.
    const other = link.from === link.through ? link.to : link.from;
    if (!chainIds.has(other)) wrong.push(`${edge.id}: "${other}" is in neither chain`);
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('each shared record carries an edge into each chain', () => {
  const wrong = [];
  for (const id of sharedIds) {
    const touches = neighbours.get(id) ?? new Set();
    const intoBrazil = [...touches].some((n) => brazilIds.has(n) && !sharedIds.has(n));
    const intoCaribbean = [...touches].some((n) => caribbeanIds.has(n) && !sharedIds.has(n));
    if (!intoBrazil) wrong.push(`${id}: shared, but no edge reaches the Brazil chain`);
    if (!intoCaribbean) wrong.push(`${id}: shared, but no edge reaches the Caribbean chain`);
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// --- amendment A1: the ledger of claims ----------------------------------

// Every claim written under A1 is listed in one file so it can be reviewed as
// a body rather than hunted for (§6's narrowing, kept after A1 chose route 1).
test(`${CLAIMS} lists every chain edge`, () => {
  const missing = chainEdges.map((e) => e.id).filter((id) => !claims.includes(id));
  assert.deepEqual(missing, [], `not in ${CLAIMS}:\n${missing.join('\n')}`);
});

test(`${CLAIMS} names a source for every edge it lists`, () => {
  const wrong = [];
  for (const line of claims.split('\n')) {
    if (!/^\|\s*`/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    const id = idIn(cells[0]);
    if (id === null) continue;
    const cited = [...(cells.slice(1).join(' ').matchAll(/`([a-z0-9-]+)`/g))].map((m) => m[1]);
    if (cited.length === 0) wrong.push(`${id}: no source named`);
    for (const s of cited) {
      if (!sourceById.has(s)) wrong.push(`${id}: "${s}" is not a source record`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});
