#!/usr/bin/env node
// Writes data/geo/palette.json: which of the eight territory hues each actor
// is drawn in. Offline, deterministic, zero dependencies, like every other
// tool here.
//
//   node tools/build-palette.mjs [--data <dir>] [--check]
//
// Why a tool and not a colour on the record. A hue is not a fact about a
// polity, it is a fact about the map: it exists so that two territories
// touching each other can be told apart, and what touches what changes every
// time the outlines do. Written on the records it would be an editorial
// field nobody could argue with; computed here it is a consequence of the
// geometry, rebuilt when the geometry moves, and the same on every machine.
//
// The hue belongs to the ACTOR and not to the presence, so a territory keeps
// its colour as the years pass: Angola is the same hue in 1975 and in 2019,
// and Portugal is the same hue in 1886 and in 1974. A dependency is drawn in
// the LIGHTER TINT OF ITS OWNER, so the adjacency is built over whoever the
// hue is taken from — `dependencyOf` when there is one, the actor itself
// otherwise. That is what makes Portugal, Angola-before-1975 and Goa read as
// one family on the map and Belgian Congo read as another.
//
// Adjacency is "shares a border segment, or comes within a small distance".
// It is not computed exactly: the outlines are simplified, so two sides of
// one border no longer share vertices, and exact touching would find almost
// nothing. Boundaries are rasterised onto a grid of GRID degrees instead and
// two territories are neighbours when their boundaries land in the same cell
// or in cells that touch — roughly a quarter to three quarters of a degree,
// which is also the distance at which two washes read as adjacent on a world
// map. Only presences whose intervals overlap are paired: Austria-Hungary and
// the Austria that followed it occupy the same ground in the same shard and
// were never neighbours.

import { writeFile } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extent as intervalExtent } from '../src/util/dates.js';
import { serialize } from './build-index.mjs';
import { readRecords, readPresenceShards, readPresenceGeometry, PALETTE_FILE } from './lib/read.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_DATA = path.join(ROOT, 'data');
export { PALETTE_FILE };

// How many hues there are. Eight is what style.css defines (--terr-1 … -8);
// the two files agree by this number and the test that reads both.
export const HUES = 8;
// Degrees per cell, and the step at which a segment is sampled along its
// length. The step is half the cell so no cell a segment crosses is skipped.
export const GRID = 0.25;
export const STEP = GRID / 2;

const cellKey = (x, y) => `${x},${y}`;

// Every grid cell a geometry's boundary passes through. Rings are walked as
// segments rather than as points because a simplified outline can put five
// degrees between two vertices, and a border that skips a cell is a border
// whose neighbour is not found.
export function boundaryCells(geometry, cells = new Set()) {
  const rings = geometry?.type === 'Polygon' ? geometry.coordinates
    : geometry?.type === 'MultiPolygon' ? geometry.coordinates.flat()
      : [];
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i += 1) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[(i + 1) % ring.length];
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / STEP));
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps;
        cells.add(cellKey(Math.floor((x0 + (x1 - x0) * t) / GRID), Math.floor((y0 + (y1 - y0) * t) / GRID)));
      }
    }
  }
  return cells;
}

// Whose hue a presence is drawn in: its owner's when it is somebody's, its
// own otherwise. A dependency of an administration that is not an actor on
// this map (dependencyOf null, dependencyKind set) keeps its own.
export const hueActorOf = (presence) => presence.dependencyOf ?? presence.actor;

function overlaps(a, b) {
  const x = intervalExtent(a.when);
  const y = intervalExtent(b.when);
  return x.min <= (y.max ?? Infinity) && y.min <= (x.max ?? Infinity);
}

// The adjacency of hue-actors, over every shard. A Map from actor id to a
// Map of neighbour id → how many grid cells the two boundaries share, which
// stands for how long the border between them is. Every actor that holds a
// hue is a key, even the ones with no neighbours at all — an island still
// needs a colour.
//
// The weight is there because eight hues cannot always win. An empire is
// drawn in one hue wherever it reaches, so the United Kingdom in 1911 is a
// neighbour of a quarter of the world and no eighth of the palette is free
// of it. Something has to share, and a long border shared with Portugal in
// Africa is a worse picture than a short one shared with Lesotho, so the
// colouring minimises shared border rather than counting neighbours.
export function buildAdjacency(presences, shardGeometry) {
  const neighbours = new Map();
  const note = (a, b, weight = 0) => {
    if (!neighbours.has(a)) neighbours.set(a, new Map());
    if (a === b) return;
    neighbours.get(a).set(b, (neighbours.get(a).get(b) ?? 0) + weight);
  };
  for (const presence of presences) note(hueActorOf(presence), hueActorOf(presence));

  for (const [file, geometries] of shardGeometry) {
    const here = presences.filter((p) => (p.geometry?.files ?? []).includes(file) && geometries.has(p.geometry.key));
    const cellsOf = here.map((p) => boundaryCells(geometries.get(p.geometry.key)));
    const index = new Map();
    cellsOf.forEach((cells, i) => {
      for (const cell of cells) {
        if (!index.has(cell)) index.set(cell, []);
        index.get(cell).push(i);
      }
    });
    cellsOf.forEach((cells, i) => {
      // The weight counts cells of i's boundary that lie against j, not pairs
      // of cells: a cell touching four of j's cells is one cell of border.
      for (const cell of cells) {
        const [cx, cy] = cell.split(',').map(Number);
        const near = new Set();
        for (let dx = -1; dx <= 1; dx += 1) {
          for (let dy = -1; dy <= 1; dy += 1) {
            for (const j of index.get(cellKey(cx + dx, cy + dy)) ?? []) near.add(j);
          }
        }
        for (const j of near) {
          if (j === i) continue;
          const a = hueActorOf(here[i]);
          const b = hueActorOf(here[j]);
          if (a === b || !overlaps(here[i], here[j])) continue;
          note(a, b, 1);
          note(b, a, 1);
        }
      }
    });
  }
  return new Map([...neighbours].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, weights]) => [id, new Map([...weights].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))]));
}

// Greedy colouring in actor-id order. The order is the ids and not the
// degrees, so adding one presence cannot repaint the world: a stable picture
// is worth more here than the last two conflicts a cleverer order would save.
// Among the hues no neighbour has taken, the one used least so far wins,
// ties by index. Plain first-fit is also a correct colouring and it puts
// seventy territories in the first hue and three in the last, which is a map
// that looks like it has three colours; the count is what spreads the eight
// over the world. When no hue is free the actor spills onto the closest to
// free — the least shared border, then the least-used hue, then the lowest
// index. Settling below then gives everyone a second chance, and whatever
// conflict survives both is written into the file's `spilled` rather than
// left for the reader to notice.
export function colour(neighbours, hues = HUES) {
  const assigned = new Map();
  const used = new Array(hues).fill(0);
  for (const id of [...neighbours.keys()].sort()) {
    const shared = new Array(hues).fill(0);
    for (const [other, weight] of neighbours.get(id)) {
      if (assigned.has(other)) shared[assigned.get(other)] += weight;
    }
    let best = null;
    for (let hue = 0; hue < hues; hue += 1) {
      if (best === null || shared[hue] < shared[best.hue]
        || (shared[hue] === shared[best.hue] && used[hue] < used[best.hue])) best = { hue };
    }
    assigned.set(id, best.hue);
    used[best.hue] += 1;
  }
  settle(neighbours, assigned, hues);
  return { assigned, spilled: conflictsOf(neighbours, assigned) };
}

// Who each actor still shares a hue with when the colouring is over: the map
// cannot separate those two, and the file says so rather than pretending the
// colouring came out clean.
export function conflictsOf(neighbours, assigned) {
  const out = {};
  for (const [id, weights] of neighbours) {
    const same = [...weights.keys()].filter((other) => assigned.get(other) === assigned.get(id)).sort();
    if (same.length) out[id] = same;
  }
  return out;
}

// Settling. The greedy pass alone leaves an empire fighting with everybody:
// the United Kingdom of 1911 is a neighbour of a quarter of the world, so by
// the time the ids reach it every hue is spoken for and it shares with ten
// countries at once. Almost all of those ten have a free hue of their own,
// though, and moving one of them away costs nothing and removes the conflict
// from both sides — so after the first pass every actor is asked again, in id
// order, whether some hue shares less border than the one it has, and moves
// when the answer is yes. Rounds until nothing moves, at most ROUNDS of them.
// Strict improvement only, so it cannot oscillate, and id order throughout,
// so it cannot depend on anything but the data.
export const ROUNDS = 8;

function settle(neighbours, assigned, hues) {
  const ids = [...neighbours.keys()].sort();
  const sharedBy = (id) => {
    const shared = new Array(hues).fill(0);
    for (const [other, weight] of neighbours.get(id)) shared[assigned.get(other)] += weight;
    return shared;
  };
  for (let round = 0; round < ROUNDS; round += 1) {
    let moved = 0;
    const used = new Array(hues).fill(0);
    for (const id of ids) used[assigned.get(id)] += 1;
    for (const id of ids) {
      const shared = sharedBy(id);
      const here = assigned.get(id);
      if (shared[here] === 0) continue;
      let best = here;
      for (let hue = 0; hue < hues; hue += 1) {
        if (shared[hue] < shared[best] || (shared[hue] === shared[best] && used[hue] < used[best])) best = hue;
      }
      if (best === here) continue;
      used[here] -= 1;
      used[best] += 1;
      assigned.set(id, best);
      moved += 1;
    }
    if (!moved) break;
  }
}

// What the palette is a function of, and nothing else: the active presences
// that hold ground, and the bytes of the shards their outlines are in. The
// grid and the number of hues go in too, so changing either invalidates the
// memo below rather than quietly reusing a file built to other rules.
export function paletteInputHash(presences, read) {
  const digest = createHash('sha256');
  digest.update(`${HUES} ${GRID}\n`);
  for (const p of [...presences].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    digest.update(JSON.stringify([p.id, p.actor, p.dependencyOf ?? null, p.when, p.geometry?.key ?? null, p.geometry?.files ?? []]));
    digest.update('\n');
  }
  for (const file of [...read.keys()].sort()) digest.update(`${file} ${read.get(file).hash}\n`);
  return digest.digest('hex');
}

// The last palette this process built and the inputs it was built from.
// Rasterising every border onto the grid is the whole cost of this tool —
// 1.3 s of the 2.1 s `validate --index` spends on the real dataset — and it
// is spent again on every save the local server answers, where the
// territories have not moved since the last one (health review B, finding 5).
const memo = { hash: null, text: null };

// The file's text, or null when there are no presences to colour at all.
// `prepared` is what a caller has already read: the records, the shard list
// and the shards themselves, none of which this tool needs to read twice.
export async function buildPalette(dataDir = DEFAULT_DATA, prepared = {}) {
  let records = prepared.records ?? null;
  if (!records) {
    const { entries, problems } = await readRecords(dataDir);
    if (problems.length) throw new Error(problems.map((p) => `${p.file}: ${p.message}`).join('\n'));
    records = entries.map((e) => e.record);
  }
  const presences = records.filter((r) => r?.kind === 'presence' && r.status === 'active');
  if (!presences.length) return null;
  const shards = prepared.shards ?? await readPresenceShards(dataDir);
  const read = prepared.geometry ?? await readPresenceGeometry(dataDir, shards);
  const hash = paletteInputHash(presences, read);
  if (memo.hash === hash) return memo.text;
  const geometry = new Map([...read].map(([file, one]) => [file, one.geometry]));
  const neighbours = buildAdjacency(presences, geometry);
  const { assigned, spilled } = colour(neighbours);
  const text = serialize({
    schema: 1,
    hues: HUES,
    grid: GRID,
    actors: Object.fromEntries([...assigned].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
    spilled,
  });
  memo.hash = hash;
  memo.text = text;
  return text;
}

// What the freshness check needs: the text on disk, or null when absent.
export async function readPalette(dataDir = DEFAULT_DATA) {
  const file = path.join(dataDir, ...PALETTE_FILE.split('/'));
  if (!existsSync(file)) return null;
  return readFile(file, 'utf8');
}

// [] when data/geo/palette.json is what this tool produces.
export function comparePalette(existing, built) {
  if (built === null) return existing === null ? [] : [`stale ${PALETTE_FILE}`];
  if (existing === null) return [`missing ${PALETTE_FILE}`];
  return existing === built ? [] : [`differs ${PALETTE_FILE}`];
}

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let check = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--check') check = true;
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  const built = await buildPalette(dataDir);
  if (built === null) {
    console.log('no presences: nothing to colour');
    return 0;
  }
  const problems = comparePalette(await readPalette(dataDir), built);
  if (check) {
    for (const p of problems) console.error(`error: data/${PALETTE_FILE} is not what build-palette.mjs produces (${p})`);
    return problems.length ? 1 : 0;
  }
  await writeFile(path.join(dataDir, ...PALETTE_FILE.split('/')), built, 'utf8');
  const palette = JSON.parse(built);
  const count = Object.keys(palette.actors).length;
  console.log(`${PALETTE_FILE} written: ${count} actor(s) over ${HUES} hues, ${Object.keys(palette.spilled).length} sharing with a neighbour`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
