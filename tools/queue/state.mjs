#!/usr/bin/env node
// What a planner needs to read before it decides, and nothing it does not.
// M90 §4.
//
//   node tools/queue/state.mjs [--data data] [--queue <file>] [--logs <file>...]
//                              [--plans docs/plans] [--json]
//
// This is the pool files' successor. Every M42 fire read a brief of 5,700
// words, a review of 13,000 and a pool file of 25,000 lines; what it needed out
// of all that was a table of counts, a lane that trails, and a list of
// umbrellas with too few children. So the counts are measured here — by
// `measure()` of tools/m42-pool.mjs, which is the same arithmetic the pool
// files carried, and by the validator itself for the errors and warnings — and
// the output is under eighty lines by rule.
//
// Nothing here writes anything. `--json` is the same answer as an object, for
// a script.
//
// "Active events with no place" (`noPlace`) counts the active events whose
// `place` is not a string — no place record named at all. It is **not** the
// pool files' "no place with a point" row, which also counted a place named
// whose record has no point; the two are different numbers and a planner
// comparing this with a pool file should not expect them to agree.

import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validate, buildTopology } from '../../src/validate/core.js';
import { createRegionDeriver } from '../../src/util/geo.js';
import { centuryOf } from '../../src/util/window.js';
import { astronomicalBounds } from '../../src/util/dates.js';
import { parentsOf } from '../../src/parts.js';
import {
  readSchemaFiles, readRecords, readRegions, readRegionPolygons, readRoles, readCategories,
} from '../lib/read.mjs';
import { measure } from '../m42-pool.mjs';
import { emptyLog, emptyQueue, queueState, itemsFor, WRITERS, STATUSES, REFUSALS } from './queue.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_DATA = path.join(ROOT, 'data');
export const DEFAULT_PLANS = path.join('docs', 'plans');
export const DEFAULT_QUEUE = path.join('imports', 'queue.json');

// A6: an umbrella with fewer than three children is an umbrella the atlas has
// barely filled, and those are where the next children go. The threshold is a
// constant here rather than a number in a sentence, so the planner's prompt and
// this tool cannot drift apart.
export const THIN = 3;

// --- the derivations ------------------------------------------------------

// Which lane and which century each active event is in, counted twice: over
// all of them and over the main ones. The lane is the topology's — an event's
// own `region`, or the one its place derives — so this is the same lane the
// timeline draws it in and not a second reading of the same records.
export function laneTable(events) {
  const lanes = new Map();
  const add = (lane, century, main) => {
    if (!lanes.has(lane)) lanes.set(lane, { lane, active: 0, main: 0, centuries: new Map() });
    const row = lanes.get(lane);
    row.active += 1;
    if (main) row.main += 1;
    if (century !== null) {
      if (!row.centuries.has(century)) row.centuries.set(century, { active: 0, main: 0 });
      const cell = row.centuries.get(century);
      cell.active += 1;
      if (main) cell.main += 1;
    }
  };
  for (const event of events) add(event.lane ?? 'none', event.century, event.main);
  return [...lanes.values()]
    .map((row) => ({
      ...row,
      centuries: [...row.centuries.entries()].sort((a, b) => a[0] - b[0])
        .map(([century, cell]) => ({ century, ...cell })),
    }))
    .sort((a, b) => b.active - a.active || a.lane.localeCompare(b.lane));
}

// The umbrellas this atlas holds and how many active children each has, those
// with fewer than `THIN` first. An umbrella is an active event something
// active is part of: `parentsOf` is the one place `parent`'s three shapes are
// read, here as everywhere.
export function thinUmbrellas(records, { limit = THIN } = {}) {
  const active = records.filter((r) => r.kind === 'event' && r.status === 'active');
  const byId = new Map(active.map((r) => [r.id, r]));
  const children = new Map();
  for (const event of active) {
    for (const id of new Set(parentsOf(event))) {
      if (!byId.has(id)) continue;
      children.set(id, (children.get(id) ?? 0) + 1);
    }
  }
  return [...children.entries()]
    .filter(([, n]) => n < limit)
    .map(([id, n]) => ({ id, children: n, title: byId.get(id)?.title ?? id }))
    .sort((a, b) => a.children - b.children || a.id.localeCompare(b.id));
}

// The `## Disputed` sections of the day's notes (§3): the planner reads an
// article that contradicts an edge, writes the edge id, the quote and the
// revision there, and pushes only `plan` — the assistant applies the mark on
// `m0`. A dispute is **open** until the edge it names says `disputed`, which
// is a question the corpus answers and not one anybody has to remember.
export const EDGE_ID = /\b[a-z0-9]+(?:-[a-z0-9]+)*--[a-z0-9]+(?:-[a-z0-9]+)*--(?:caused|enabled|reacted-to|precondition-of|inspired)\b/g;

export function disputesIn(text) {
  const out = [];
  const lines = String(text ?? '').split('\n');
  let inside = false;
  for (const line of lines) {
    if (/^##\s/.test(line)) {
      inside = /^##\s+Disputed\s*$/i.test(line);
      continue;
    }
    if (!inside) continue;
    for (const id of line.match(EDGE_ID) ?? []) if (!out.includes(id)) out.push(id);
  }
  return out;
}

export function headingsIn(text) {
  return String(text ?? '').split('\n').filter((l) => /^##\s/.test(l)).map((l) => l.replace(/^##\s+/, '').trim());
}

// The last three notes, newest first. They are named for the day, so the file
// names sort into the order they were written in.
export async function readPlans(dir, { last = 3 } = {}) {
  if (!existsSync(dir)) return [];
  const names = (await readdir(dir)).filter((n) => n.endsWith('.md')).sort().reverse().slice(0, last);
  const out = [];
  for (const name of names) {
    const text = await readFile(path.join(dir, name), 'utf8');
    out.push({ file: name, headings: headingsIn(text), disputed: disputesIn(text) });
  }
  return out;
}

// --- the whole answer ------------------------------------------------------

export async function state({
  dataDir = DEFAULT_DATA,
  queueFile = null,
  logFiles = [],
  plansDir = path.join(ROOT, DEFAULT_PLANS),
} = {}) {
  const readJson = async (file, fallback) => (existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : fallback);
  const [{ entries }, regions, polygons, roles, categories, schemas] = await Promise.all([
    readRecords(dataDir), readRegions(dataDir), readRegionPolygons(dataDir),
    readRoles(dataDir), readCategories(dataDir), readSchemaFiles(path.join(ROOT, 'schema')),
  ]);
  const records = entries.map((e) => e.record);
  const deriveRegion = polygons ? createRegionDeriver(polygons) : undefined;
  const topology = buildTopology(records, regions, { deriveRegion, roles, categories });
  const verdict = validate(records, topology, schemas);

  const events = records.filter((r) => r.kind === 'event');
  const edges = records.filter((r) => r.kind === 'edge');
  const counts = measure(events, edges);

  const byId = new Map(events.map((e) => [e.id, e]));
  const activeIds = new Set(events.filter((e) => e.status === 'active').map((e) => e.id));
  const laneOf = new Map(topology.events.map((e) => [e.id, e.region ?? null]));
  const rows = events.filter((e) => e.status === 'active').map((e) => {
    let century = null;
    try {
      century = centuryOf(astronomicalBounds(e.when.start).min);
    } catch { century = null; }
    return {
      id: e.id,
      lane: laneOf.get(e.id) ?? null,
      century,
      main: !parentsOf(e).some((id) => activeIds.has(id) && byId.get(id)?.status === 'active'),
    };
  });

  const queue = queueFile ? await readJson(queueFile, emptyQueue()) : emptyQueue();
  const logs = [];
  for (const file of logFiles) logs.push(await readJson(file, emptyLog()));
  const plans = await readPlans(plansDir);
  const open = [];
  for (const plan of plans) {
    for (const id of plan.disputed) {
      if (open.some((d) => d.edge === id)) continue;
      const record = records.find((r) => r.kind === 'edge' && r.id === id);
      if (!record) open.push({ edge: id, note: plan.file, why: 'no edge of that id' });
      else if (record.confidence !== 'disputed') open.push({ edge: id, note: plan.file, why: `still ${record.confidence}` });
    }
  }

  return {
    corpus: {
      active: counts.active,
      main: counts.main,
      filed: counts.filed,
      activeEdges: counts.activeEdges,
      linksBetweenActive: counts.linksBetweenActive,
      components: counts.components,
      largestComponent: counts.largestComponent,
      noEdge: counts.noEdge,
      crossingAnUmbrella: counts.crossingAnUmbrella,
      insideOneUmbrella: counts.insideOneUmbrella,
      // A `place` that is not a string, and not "no place with a point".
      noPlace: events.filter((e) => e.status === 'active' && typeof e.place !== 'string').length,
      errors: verdict.errors.length,
      warnings: verdict.warnings.length,
    },
    lanes: laneTable(rows),
    queue: queueState(queue, logs),
    waiting: Object.fromEntries(WRITERS.map((w) => [w, itemsFor(queue, w, { logs }).length])),
    thin: thinUmbrellas(records),
    plans: plans.map((p) => ({ file: p.file, headings: p.headings })),
    disputes: open,
  };
}

// --- the print -------------------------------------------------------------

const pad = (text, width) => String(text).padEnd(width);

export function lines(out) {
  const c = out.corpus;
  const rows = [
    `active ${c.active} — main ${c.main}, filed ${c.filed}; active edges ${c.activeEdges}, between two active ${c.linksBetweenActive}`,
    `components ${c.components}, largest ${c.largestComponent}; active events with no edge ${c.noEdge}; active events whose place is not a string ${c.noPlace}`,
    `edges crossing an umbrella ${c.crossingAnUmbrella}, inside one ${c.insideOneUmbrella}`,
    `validator: ${c.errors} error(s), ${c.warnings} warning(s)`,
    '',
    'per lane (A10): active / main, then by century',
  ];
  for (const lane of out.lanes) {
    rows.push(`  ${pad(lane.lane, 10)} ${lane.active} / ${lane.main}`);
    if (lane.centuries.length) {
      rows.push(`    ${lane.centuries.map((cell) => `${cell.century}s ${cell.active}/${cell.main}`).join('  ')}`);
    }
  }
  rows.push('');
  rows.push(`queue: ${WRITERS.map((w) => `${w} ${out.waiting[w]} waiting`).join(', ')}`);
  for (const writer of WRITERS) {
    rows.push(`  ${writer}: ${STATUSES.map((s) => `${s} ${out.queue.byWriter[writer][s]}`).join(', ')}`);
  }
  const refused = REFUSALS.filter((code) => out.queue.refusals[code]);
  rows.push(refused.length
    ? `  refusals: ${refused.map((code) => `${code} ${out.queue.refusals[code]}`).join(', ')}`
    : '  refusals: none');
  rows.push('');
  rows.push(`umbrellas with fewer than ${THIN} children: ${out.thin.length}`);
  for (const one of out.thin.slice(0, 20)) rows.push(`  ${one.children}  ${one.id}`);
  if (out.thin.length > 20) rows.push(`  and ${out.thin.length - 20} more`);
  rows.push('');
  rows.push(out.plans.length ? 'the last plan notes:' : 'no plan notes yet');
  for (const plan of out.plans) rows.push(`  ${plan.file}: ${plan.headings.join(' | ') || 'no headings'}`);
  rows.push(`disputes still open: ${out.disputes.length}`);
  for (const one of out.disputes.slice(0, 10)) rows.push(`  ${one.edge} (${one.note}): ${one.why}`);
  return rows;
}

// Eighty lines by rule (§4): the lane and umbrella lists are what can grow, so
// they are the ones trimmed, and the trim says how much it took away.
export const MAX_LINES = 80;

export function trimmed(rows, max = MAX_LINES) {
  if (rows.length <= max) return rows;
  return [...rows.slice(0, max - 1), `… ${rows.length - max + 1} line(s) not shown; --json for all of it`];
}

export async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let queueFile = null;
  let plansDir = path.join(ROOT, DEFAULT_PLANS);
  const logFiles = [];
  let asJson = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--data') dataDir = path.resolve(argv[++i]);
    else if (arg === '--queue') queueFile = path.resolve(argv[++i]);
    else if (arg === '--plans') plansDir = path.resolve(argv[++i]);
    else if (arg === '--json') asJson = true;
    else if (arg === '--logs') {
      // Every path until the next flag, so one `--logs` takes both branches'.
      while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) logFiles.push(path.resolve(argv[++i]));
    } else {
      console.error(`unknown argument ${arg}\nusage: node tools/queue/state.mjs [--data <dir>] [--queue <file>] [--logs <file>...] [--plans <dir>] [--json]`);
      return 2;
    }
  }
  if (queueFile === null) {
    const beside = path.join(dataDir, DEFAULT_QUEUE);
    if (existsSync(beside)) queueFile = beside;
  }
  const out = await state({ dataDir, queueFile, logFiles, plansDir });
  if (asJson) console.log(JSON.stringify(out, null, 1));
  else for (const line of trimmed(lines(out))) console.log(line);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
