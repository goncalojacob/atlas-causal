#!/usr/bin/env node
// Parents for the events that have none. Part 1 of the links plan, M104.
//
//   node tools/links/parents.mjs [--data data] [--cache /tmp/oc-m104-cache]
//                                [--out <queue.json>] [--top 50] [--budget 2000] [--maxlag 5]
//                                [--date 2026-11-02] [--json]
//
// The atlas holds about 3,100 active events that are part of nothing. Wikidata
// often knows better: P361 ("part of") on the event, or P527 ("has part") on a
// bigger one, names a whole that this atlas may hold too. This tool reads
// those statements, keeps the pairs the writer would accept, says how many fell
// at each step, and writes what is left as `existing` queue items with parents
// and no edges. It never touches a record: the writer (tools/queue/apply.mjs)
// is the only thing that does, and it checks every parent again.
//
// **Nothing here re-implements a rule.** The span test is the writer's
// `spanOf` and `parentVerdict` (which also refuses a parent that is not an
// active event and a parent that would close a loop of part-of). The loop test
// is `ancestorsOf` of tools/queue/queue.mjs. The lane of an event is the
// topology's, read the way tools/queue/state.mjs reads it. What is written
// down here is only the choice of which pairs to ask those functions about,
// and the one rule that is in no code: rules card 12's lane test.
//
// **The filters, in order.**
//   1. Both ends are active events, neither flagged `m42-umbrella`,
//      `m62-umbrella` or `m67-umbrella`. Those umbrellas are measured ones
//      with a written case for each child (docs/m62, docs/m67) and this tool
//      does not add to them.
//   2. Both ends have a span that can be read.
//   3. The child lies inside the parent at both ends. The writer checks the
//      start alone; the validator warns (`child-outside-parent`) about the end
//      as well, and tests/m42-filing.test.mjs asserts both.
//   4. Rules card 12's lane test: the child is in the parent's lane, or it
//      names an actor or a place that the parent names.
//   5. The nearest parent only. A parent is dropped when another parent of the
//      same child lies inside it already, read through the records' own
//      parents and through the pairs that survive. tests/m42-filing.test.mjs
//      ("no parent of an event is reachable through another of its parents")
//      is the test that goes red otherwise.
//   6. The writer's own `parentVerdict`, run pair by pair with the pairs
//      already accepted counted as parents, so that a loop closed inside this
//      batch is refused too.
//
// **Where the pairs come from.** P361 of each child. If the whole it names is
// not held, the chain of P361 is followed upward to the nearest whole that is
// (not past it, and not through a record that is an umbrella of the measured
// kind). P527 of every held event, where a part is a child. Wikidata is asked
// with wbgetentities, fifty items a call, one call a second, with maxlag=5 and
// the import's own backoff. Each answer is kept under the cache directory so a
// second run asks nothing.

import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildTopology } from '../../src/validate/core.js';
import { createRegionDeriver } from '../../src/util/geo.js';
import { parentsOf } from '../../src/parts.js';
import { HttpError, createFetcher, claimIds, DELAY_MS } from '../import/wikidata.mjs';
import {
  readRecords, readRegions, readRegionPolygons, readRoles, readCategories,
} from '../lib/read.mjs';
import { ancestorsOf, LANES } from '../queue/queue.mjs';
import { spanOf, parentVerdict } from '../queue/apply.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_CACHE = '/tmp/oc-m104-cache';
export const DEFAULT_TOP = 50;
export const DEFAULT_BUDGET = 2000;
export const USER_AGENT = 'atlas-causal (goncalo.jacob@tecnico.ulisboa.pt)';
export const API = 'https://www.wikidata.org/w/api.php';
export const BATCH = 50;
export const MAXLAG = 5;
// A maxlag refusal can last minutes when the replicas are behind, and the
// backoff doubles from two seconds, so the tool waits through up to eight.
export const RETRIES = 8;
// How far up a chain of P361 to look for a whole the atlas holds.
export const MAX_HOPS = 6;
export const UMBRELLA_FLAGS = Object.freeze(['m42-umbrella', 'm62-umbrella', 'm67-umbrella']);

const flagsOf = (r) => r?.review?.flags ?? [];
export const isUmbrella = (r) => flagsOf(r).some((f) => UMBRELLA_FLAGS.includes(f));

// --- asking Wikidata --------------------------------------------------------

// `maxlag` is five seconds unless the caller says otherwise. The API counts
// the lag of the SPARQL query service too, which a read of entities does not
// touch, and that service can lag for hours; `--maxlag` lets a run go on then.
export const entitiesUrl = (ids, maxlag = MAXLAG) => `${API}?action=wbgetentities&ids=${ids.join('|')}`
  + `&props=claims&format=json&maxlag=${maxlag}`;

// The import's fetcher, with this tool's name on the request. The fetcher owns
// the delay, the retry on maxlag, 429 and 503, and the budget.
export function createWikidataFetcher({ budget = DEFAULT_BUDGET, delayMs = DELAY_MS, retries = RETRIES, fetchJson, delay } = {}) {
  const real = async (url, options) => {
    const response = await fetch(url, options);
    if (!response.ok) throw new HttpError(response.status, url);
    return response.json();
  };
  const send = fetchJson ?? real;
  return createFetcher({
    budget,
    delayMs,
    retries,
    fetchJson: (url, options) => send(url, { ...options, headers: { ...options.headers, 'user-agent': USER_AGENT } }),
    ...(delay ? { delay } : {}),
  });
}

// What this tool keeps of an entity: the wholes it is part of and the parts it
// has, as ids. A missing entity keeps nothing.
export function compactEntities(body) {
  const out = {};
  for (const [id, entity] of Object.entries(body?.entities ?? {})) {
    if (entity?.missing !== undefined) { out[id] = { p361: [], p527: [] }; continue; }
    out[id] = { p361: claimIds(entity, 'P361'), p527: claimIds(entity, 'P527') };
  }
  return out;
}

// Up to fifty ids a call, each call answered from the cache where it can be.
// The cache key is the call's own URL, so a changed batch is a new call.
export async function fetchEntities(ids, { fetcher, cacheDir = DEFAULT_CACHE, maxlag = MAXLAG } = {}) {
  const out = new Map();
  const unique = [...new Set(ids)];
  await mkdir(cacheDir, { recursive: true });
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const url = entitiesUrl(batch, maxlag);
    const file = path.join(cacheDir, `${createHash('sha1').update(url).digest('hex')}.json`);
    let compact;
    if (existsSync(file)) compact = JSON.parse(await readFile(file, 'utf8'));
    else {
      compact = compactEntities(await fetcher.get(url));
      await writeFile(file, JSON.stringify(compact), 'utf8');
    }
    for (const id of batch) out.set(id, compact[id] ?? { p361: [], p527: [] });
  }
  return out;
}

// --- the corpus -------------------------------------------------------------

// The active events with the lane the topology gives each, the way
// tools/queue/state.mjs reads it: an event's own region, or the one its place
// derives.
export async function loadCorpus(dataDir) {
  const [{ entries }, regions, polygons, roles, categories] = await Promise.all([
    readRecords(dataDir), readRegions(dataDir), readRegionPolygons(dataDir),
    readRoles(dataDir), readCategories(dataDir),
  ]);
  const records = entries.map((e) => e.record);
  const deriveRegion = polygons ? createRegionDeriver(polygons) : undefined;
  const topology = buildTopology(records, regions, { deriveRegion, roles, categories });
  const laneOf = new Map(topology.events.map((e) => [e.id, e.region ?? null]));
  const events = records.filter((r) => r.kind === 'event' && r.status === 'active');
  return { events, byId: new Map(records.filter((r) => r.kind === 'event').map((r) => [r.id, r])), laneOf };
}

// --- the pairs Wikidata offers ---------------------------------------------

const eligible = (r) => r?.kind === 'event' && r.status === 'active' && !isUmbrella(r);

export const qidOf = (r) => (typeof r?.wikidata === 'string' && /^Q[1-9][0-9]*$/.test(r.wikidata) ? r.wikidata : null);

// The events that have no parent and may be given one.
export function candidateChildren(events) {
  return events.filter((r) => eligible(r) && parentsOf(r).length === 0 && qidOf(r));
}

// Every id that must be asked about in the first call: the children (for P361)
// and every event that could be a parent (for P527).
export function firstIds(events) {
  return events.filter((r) => eligible(r) && qidOf(r)).map(qidOf);
}

// The pairs, from a function `entityOf(qid)` that answers `{p361, p527}` or
// null. Pure. `fetchMore(qids)` is asked, level by level, for the entities the
// chains need that are not known yet; it returns a map to add to `known`.
//
// A pair is `{ child, parent, source }` where source is `P361`, `P361-chain`
// (the whole the item names is not held, a whole above it is) or `P527`.
export async function offeredPairs(events, known, fetchMore) {
  const heldBy = new Map(events.filter((r) => qidOf(r)).map((r) => [qidOf(r), r]));
  const children = candidateChildren(events);
  const childOf = new Set(children.map((r) => r.id));
  const pairs = new Map();
  const add = (child, parent, source) => {
    if (!child || !parent || child.id === parent.id) return;
    if (!eligible(child) || !eligible(parent)) return;
    const key = `${child.id}\u0000${parent.id}`;
    if (!pairs.has(key)) pairs.set(key, { child: child.id, parent: parent.id, sources: [source] });
    else if (!pairs.get(key).sources.includes(source)) pairs.get(key).sources.push(source);
  };

  // P527: a held event lists its parts; a part that is a child is a pair.
  for (const parent of events) {
    if (!eligible(parent) || !qidOf(parent)) continue;
    for (const part of known.get(qidOf(parent))?.p527 ?? []) {
      const child = heldBy.get(part);
      if (child && childOf.has(child.id)) add(child, parent, 'P527');
    }
  }

  // P361: each child's own statements, then the chain above any whole that is
  // not held. A walk is a list of ids at one level; it stops at the first held
  // whole on each path.
  let walks = children.map((c) => ({ child: c, at: known.get(qidOf(c))?.p361 ?? [], hops: 0, seen: new Set([qidOf(c)]) }));
  for (let hops = 0; walks.length && hops < MAX_HOPS; hops += 1) {
    const next = [];
    for (const walk of walks) {
      for (const q of walk.at) {
        if (walk.seen.has(q)) continue;
        const held = heldBy.get(q);
        // A held whole ends the path, even one `add` turns away because it is
        // an umbrella of the measured kind: nothing above it is this child's.
        if (held) { add(walk.child, held, hops === 0 ? 'P361' : 'P361-chain'); continue; }
        next.push({ ...walk, q });
      }
    }
    const need = [...new Set(next.map((w) => w.q))].filter((q) => !known.has(q));
    if (need.length) for (const [q, v] of await fetchMore(need)) known.set(q, v);
    walks = next.map((w) => ({
      child: w.child,
      at: known.get(w.q)?.p361 ?? [],
      hops: w.hops + 1,
      seen: new Set([...w.seen, w.q]),
    }));
  }
  return [...pairs.values()].sort((a, b) => a.child.localeCompare(b.child) || a.parent.localeCompare(b.parent));
}

// --- the filters ------------------------------------------------------------

const spanLength = (r) => {
  const s = spanOf(r.when);
  return s ? s.to - s.from : Infinity;
};

// Both ends: the child starts no earlier and ends no later than the parent.
export const insideBothEnds = (child, parent) => {
  const c = spanOf(child.when);
  const p = spanOf(parent.when);
  return Boolean(c && p && c.from >= p.from && c.to <= p.to);
};

// Rules card 12: the same lane, or an actor or a place the parent names too.
// A lane is the topology's, and an event with none has no lane in common with
// anything.
export function laneFits(child, parent, laneOf) {
  const a = laneOf.get(child.id) ?? null;
  const b = laneOf.get(parent.id) ?? null;
  if (a !== null && a === b) return { ok: true, by: 'lane' };
  const actors = new Set((parent.actors ?? []).map((x) => x.actor));
  if ((child.actors ?? []).some((x) => actors.has(x.actor))) return { ok: true, by: 'actor' };
  if (typeof child.place === 'string' && child.place === parent.place) return { ok: true, by: 'place' };
  return { ok: false, by: null };
}

// Drops, for each child, any parent that lies inside another of its parents.
// The graph is the records' own parents plus every filing this batch offers,
// and the test is run on that whole graph until nothing changes, so a filing
// the batch makes for the parent counts too: if the batch files B under A, a
// child offered both A and B keeps B alone (M106; the filing of
// battle-of-maymyo went red because the batch's own filings were not read).
// The parents a child already has stand beside the offered ones. They cannot
// be dropped, since the writer keeps them, so an offered parent that is
// inside one of them, or that holds one of them, goes instead.
export function nearestOnly(byChild, corpusParents) {
  const current = new Map([...byChild].map(([c, ps]) => [c, new Set(ps)]));
  const parentsFor = (id) => [...new Set([...(corpusParents(id) ?? []), ...(current.get(id) ?? [])])];
  for (let changed = true; changed;) {
    changed = false;
    for (const [child, set] of current) {
      const held = corpusParents(child) ?? [];
      for (const p of [...set]) {
        const all = [...new Set([...set, ...held])];
        const through = all.find((q) => q !== p && ancestorsOf(q, parentsFor).has(p));
        const holds = held.find((q) => q !== p && ancestorsOf(p, parentsFor).has(q));
        if (through || holds) { set.delete(p); changed = true; }
      }
      if (set.size === 0) current.delete(child);
    }
  }
  return new Map([...current].map(([c, s]) => [c, [...s]]));
}

// All the filters, with the count after each. Returns `{ counts, accepted }`,
// where accepted maps a child to its parents, nearest first.
export function filterPairs(pairs, { byId, laneOf }) {
  const counts = { offered: pairs.length };
  const get = (id) => byId.get(id);
  const parentsFromCorpus = (id) => parentsOf(byId.get(id) ?? {});

  const dated = pairs.filter((p) => spanOf(get(p.child)?.when) && spanOf(get(p.parent)?.when));
  counts.dated = dated.length;
  const inside = dated.filter((p) => insideBothEnds(get(p.child), get(p.parent)));
  counts.insideBothEnds = inside.length;
  const lane = inside.filter((p) => laneFits(get(p.child), get(p.parent), laneOf).ok);
  counts.laneRule = lane.length;

  const grouped = new Map();
  for (const p of lane) grouped.set(p.child, [...(grouped.get(p.child) ?? []), p.parent]);
  const nearest = nearestOnly(grouped, parentsFromCorpus);
  counts.nearestOnly = [...nearest.values()].reduce((n, ps) => n + ps.length, 0);

  // The writer's own verdict, pair by pair, nearest parent first, counting the
  // parents already accepted in this batch.
  const accepted = new Map();
  const refused = [];
  const parentsFor = (id) => [...parentsFromCorpus(id), ...(accepted.get(id) ?? [])];
  const order = [...nearest].sort(([a], [b]) => a.localeCompare(b));
  for (const [child, parents] of order) {
    const nearestFirst = [...parents].sort((a, b) => spanLength(get(a)) - spanLength(get(b)) || a.localeCompare(b));
    for (const parent of nearestFirst) {
      const verdict = parentVerdict(parent, get(child), byId, { parentsFor });
      if (verdict.ok) accepted.set(child, [...(accepted.get(child) ?? []), parent]);
      else refused.push({ child, parent, reason: verdict.reason, detail: verdict.detail });
    }
  }
  // The writer's verdict can refuse a filing the test above counted on, so the
  // nesting is read once more over what stands.
  const standing = nearestOnly(accepted, parentsFromCorpus);
  accepted.clear();
  for (const [c, ps] of standing) accepted.set(c, ps);
  counts.writerVerdict = [...accepted.values()].reduce((n, ps) => n + ps.length, 0);
  return { counts, accepted, refused };
}

// --- the report -------------------------------------------------------------

export function topParents(accepted, n = DEFAULT_TOP) {
  const kids = new Map();
  for (const [child, parents] of accepted) for (const p of parents) kids.set(p, [...(kids.get(p) ?? []), child]);
  return [...kids].map(([parent, children]) => ({ parent, children: children.sort() }))
    .sort((a, b) => b.children.length - a.children.length || a.parent.localeCompare(b.parent))
    .slice(0, n);
}

// --- the queue items --------------------------------------------------------

const rankFor = (parent) => `child-of:${parent}`.slice(0, 40);

// One `existing` item for each child that has a parent among the chosen ones.
// The lane is the child's, or the parent's where the child's is not one the
// atlas writes to (the queue admits only those). A child with neither is
// skipped and counted. Ids run from 001 in each lane; writers take turns.
export function buildItems(chosen, { byId, laneOf, sourcesOf = () => ['P361, part of'], date, planned }) {
  const picked = new Set(chosen.map((c) => c.parent));
  const order = new Map(chosen.map((c, i) => [c.parent, i]));
  const children = new Map();
  for (const { parent, children: kids } of chosen) {
    for (const child of kids) children.set(child, [...(children.get(child) ?? []), parent]);
  }
  const rows = [...children].map(([child, parents]) => ({
    child,
    parents: parents.filter((p) => picked.has(p))
      .sort((a, b) => spanLength(byId.get(a)) - spanLength(byId.get(b)) || a.localeCompare(b)),
  })).sort((a, b) => order.get(a.parents[0]) - order.get(b.parents[0]) || a.child.localeCompare(b.child));

  const serial = new Map();
  const items = [];
  const skipped = [];
  rows.forEach(({ child, parents }) => {
    const lane = [laneOf.get(child), laneOf.get(parents[0])].find((l) => LANES.includes(l));
    if (!lane) { skipped.push(child); return; }
    const n = (serial.get(lane) ?? 0) + 1;
    serial.set(lane, n);
    const record = byId.get(child);
    const names = parents.map((p) => `"${byId.get(p).title}"`).join(' and ');
    const sources = [...new Set(parents.flatMap((p) => sourcesOf(child, p)))].join(' and ');
    items.push({
      id: `${date}-${lane}-${String(n).padStart(3, '0')}`,
      planned,
      lane,
      writer: items.length % 2 === 0 ? 'A' : 'B',
      existing: child,
      title: record.title,
      parents,
      edges: [],
      rank: rankFor(parents[0]),
      why: `Wikidata (${sources}) puts this event inside ${names}. Its dates lie inside theirs at both ends, `
        + 'and it shares a lane, an actor or a place with them. It has no parent now.',
    });
  });
  return { items, skipped };
}

// --- the command line -------------------------------------------------------

export const USAGE = 'usage: node tools/links/parents.mjs [--data <dir>] [--cache <dir>] [--out <file>]'
  + ' [--top 50] [--budget 2000] [--maxlag 5] [--date YYYY-MM-DD] [--json]';

export async function run({
  dataDir = path.join(ROOT, 'data'), cacheDir = DEFAULT_CACHE, top = DEFAULT_TOP, budget = DEFAULT_BUDGET,
  date = new Date().toISOString().slice(0, 10), maxlag = MAXLAG, fetcher = createWikidataFetcher({ budget }),
} = {}) {
  const corpus = await loadCorpus(dataDir);
  const { events, byId, laneOf } = corpus;
  const children = candidateChildren(events);
  const known = await fetchEntities(firstIds(events), { fetcher, cacheDir, maxlag });
  const pairs = await offeredPairs(events, known, (ids) => fetchEntities(ids, { fetcher, cacheDir, maxlag }));
  const { counts, accepted, refused } = filterPairs(pairs, { byId, laneOf });
  const sourceOf = new Map(pairs.map((p) => [`${p.child}\u0000${p.parent}`, p.sources]));
  const chosen = topParents(accepted, top);
  const planned = `${new Date().toISOString().slice(0, 16)}Z`;
  const built = buildItems(chosen, {
    byId, laneOf, date, planned,
    sourcesOf: (c, p) => (sourceOf.get(`${c}\u0000${p}`) ?? ['P361']).map((s) => (s === 'P527' ? 'P527, has part' : 'P361, part of')),
  });
  const bySource = {};
  for (const p of pairs) for (const s of p.sources) bySource[s] = (bySource[s] ?? 0) + 1;
  return {
    considered: children.length,
    askedWikidata: fetcher.calls,
    bySource,
    counts,
    refused,
    ranking: topParents(accepted, 20),
    allParents: new Set([...accepted.values()].flat()).size,
    queue: { schema: 1, kind: 'import-queue', generated: date, items: built.items },
    skipped: built.skipped,
  };
}

export function report(result) {
  const c = result.counts;
  const lines = [
    `Events with no parent that may be given one: ${result.considered}`,
    `Wikidata calls made (cached ones not counted): ${result.askedWikidata}`,
    `Pairs offered: ${c.offered} (${Object.entries(result.bySource).map(([k, v]) => `${k} ${v}`).join(', ')}; a pair can come from two)`,
    `  both ends dated: ${c.dated}`,
    `  child inside parent at both ends: ${c.insideBothEnds}`,
    `  lane rule (same lane, or a shared actor or place): ${c.laneRule}`,
    `  nearest parent only: ${c.nearestOnly}`,
    `  writer's own verdict (parentVerdict, loops): ${c.writerVerdict}`,
    `Children with a parent left: ${new Set(result.queue.items.map((i) => i.existing)).size} in the pilot; ${result.allParents} distinct parents overall`,
    'Parents with the most children:',
    ...result.ranking.map((r) => `  ${String(r.children.length).padStart(4)}  ${r.parent}`),
  ];
  if (result.skipped.length) lines.push(`Skipped for want of a lane the queue admits: ${result.skipped.length}`);
  return lines.join('\n');
}

export async function main(argv) {
  const opts = {};
  let out = null;
  let asJson = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--data') opts.dataDir = path.resolve(argv[++i]);
    else if (arg === '--cache') opts.cacheDir = path.resolve(argv[++i]);
    else if (arg === '--out') out = path.resolve(argv[++i]);
    else if (arg === '--top') opts.top = Number(argv[++i]);
    else if (arg === '--budget') opts.budget = Number(argv[++i]);
    else if (arg === '--date') opts.date = argv[++i];
    else if (arg === '--maxlag') opts.maxlag = Number(argv[++i]);
    else if (arg === '--json') asJson = true;
    else { console.error(`unknown argument ${arg}\n${USAGE}`); return 2; }
  }
  const result = await run(opts);
  if (out) {
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, `${JSON.stringify(result.queue, null, 2)}\n`, 'utf8');
  }
  console.log(asJson ? JSON.stringify({ ...result, queue: undefined, items: result.queue.items.length }, null, 1) : report(result));
  if (out) console.log(`${result.queue.items.length} items written to ${out}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
