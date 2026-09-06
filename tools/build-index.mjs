#!/usr/bin/env node
// Writes data/index/: manifest.json (never cached) plus spine-, search-,
// sources- and review-<hash>.json and the citers-<hash>/ directory
// (immutable, named by content). Deterministic by construction —
// recursive key sort, code-unit comparison, two-space indent, trailing
// newline — so the deploy job can assert that main's committed index is
// byte-identical to a fresh build.
//
//   node tools/build-index.mjs [--data <dir>]

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rmdir, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildSpine, buildTopology, byId, citerFiles, rolesInUse } from '../src/validate/core.js';
import { checkRules } from '../src/validate/rules.js';
import { createRegionDeriver } from '../src/util/geo.js';
import { degreesOf, digestOf, inQueue, KIND_ORDER } from '../src/review/queue.js';
import { searchIndexFor } from '../src/search.js';
import { explanationShards, shardName } from '../src/explanations.js';
import { licensingTable } from '../src/licensing.js';
import { createAtlasFromSpine, expandSpine } from '../src/data.js';
import { readRecords, readRegions, readRegionPolygons, readLandFiles, readPresenceShards, paletteFile } from './lib/read.mjs';
import { recordHistories, HISTORY_DIR } from './lib/history.mjs';
import { sitePages, ENTRY_DIR } from './lib/prerender.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_DATA = path.join(ROOT, 'data');
// The three hand-written pages the build writes into or from. They are the
// site's own files and live at the site root, never under data/: one of them
// is the template every entry page is cut from, and the other two carry a
// generated region inside a page a person wrote.
export const TEMPLATES = ['entry.html', 'sources.html', 'narratives.html'];
// The immutable files, named by content, and the one immutable *directory*:
// the citers are a file per source, so a hash each would put a line per
// source in a manifest that is fetched no-store on every page load, and
// unhashed names would break the `immutable` convention the whole index is
// served under (h3a-brief, A7). One hash over the directory buys both.
// `review-<kind>-<hash>.json` is the queue's per-kind shard; the plain
// `review-<hash>.json` beside it is the summary that names them (H6b).
// `explanations-<from>-<to>-<hash>.json` is the period shard of H7, whose
// middle part is two years and may carry a minus sign.
const HASHED = /^(?:(?:spine|search|sources|review)-(?:[a-z]+-)?|explanations--?\d+--?\d+-)[0-9a-f]{12}\.json$/;
const HASHED_DIR = /^citers-[0-9a-f]{12}$/;

// Deep copy with keys sorted by UTF-16 code unit (Array.prototype.sort's
// default), never by locale.
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonical(value[key]);
    return out;
  }
  return value;
}

export function serialize(value) {
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
}

// The same bytes with the indentation left out, for the two files nobody
// reads with their eyes and every device parses whole on every page: the
// spine and the search shard. At 20 000 records the spine is 15.3 MB on disk
// of which about 5.6 MB is spaces — gzip hides that over the wire and
// `JSON.parse` does not (health review of 6 September, R5). Canonical all the
// same: the key order is what makes the hash a function of the content, and
// two builds of one dataset have to produce one file name.
//
// Everything else stays indented. A record file, the manifest, a review shard
// and a history are read by people, in a diff and in a terminal, and the few
// kilobytes they cost are the cost of being readable.
export function compact(value) {
  return `${JSON.stringify(canonical(value))}\n`;
}

export function hashOf(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12);
}

// Builds the index in memory. Returns the file map, the topology it was
// built from — which is no longer written anywhere — and the active events
// whose region could not be derived (a build with those is not written: the
// timeline would have nowhere to put them).
export async function buildIndex(dataDir = DEFAULT_DATA, prepared = {}) {
  let records = prepared.records ?? null;
  if (!records) {
    const { entries, problems } = await readRecords(dataDir);
    if (problems.length) {
      throw new Error(problems.map((p) => `${p.file}: ${p.message}`).join('\n'));
    }
    records = entries.map((e) => e.record);
  }
  const regions = prepared.regions ?? await readRegions(dataDir);
  const land = await readLandFiles(dataDir);
  // Only the three fields the manifest names: a shard list read with its
  // feature keys (which is how tools/validate.mjs reads it) carries a Set
  // that would land in the file as an empty object.
  const presenceShards = (prepared.presenceShards ?? await readPresenceShards(dataDir))
    .map(({ file, from, to }) => ({ file, from, to }));
  // The validator has already read all of this and built the topology from
  // it; doing it again was the whole of the doubling `validate --index`
  // measured (health review B, finding 5).
  let topology = prepared.topology ?? null;
  if (!topology) {
    const polygons = prepared.polygons ?? await readRegionPolygons(dataDir);
    topology = buildTopology(records, regions, { deriveRegion: polygons ? createRegionDeriver(polygons) : undefined });
  }

  // The graph every page loads whole, and the only file that carries it.
  // `topology` above stays in memory: it is what this projection is taken
  // from and what the rules below are checked against, and the whole of it
  // was written out beside the spine only while the pages moved over (H3b).
  const spineText = compact(buildSpine(topology));
  // The sources index without its citer rows, since H3b: every bibliographic
  // field and `citationCount`, and the rows themselves in the citer directory
  // below, fetched for one source at a time. This is the whole of the saving
  // at first paint — 328.8 KB to 29.4 KB measured on this dataset — and it
  // could only happen once the source card and `retractionPlan` knew how to
  // fetch a citer file (h3a-brief, A3 and A7; STATUS.md, deviation 216).
  const sourcesText = serialize({
    schema: 1,
    sources: topology.sources.map(({ citations, ...source }) => source),
  });

  // One hash over the whole directory rather than one per file: manifest.json
  // is fetched no-store on every page load, and a line per source would be
  // 200 KB of it at twenty thousand sources. The bytes are concatenated in id
  // order, which is the order citerFiles returns them in (A7).
  const citers = citerFiles(topology.sources).map((entry) => [`${entry.id}.json`, serialize({ schema: 1, ...entry })]);
  const citersDir = `citers-${hashOf(citers.map(([, text]) => text).join(''))}`;
  const citerEntries = citers.map(([name, text]) => [`${citersDir}/${name}`, text]);

  // What the search box scans, folded once here rather than on every page
  // load. It is the search module's own index, frozen: buildSearchIndex is
  // what the box builds from the topology today, so the shard cannot fall
  // out of step with what the box expects to be handed (A9). The terms are
  // the only precomputed thing in the index; the prose stays out (Scale).
  //
  // `searchIndexFor` and not `buildSearchIndex`: the shard carries the two
  // fields the topology deliberately drops — an event's `names` and the first
  // sentence of its `summary` — read straight off the records (search.js; plan
  // decision 5). Neither is in the spine and neither should be, because
  // nothing draws them and the spine is loaded whole by every page.
  const searchText = compact({
    schema: 1,
    entries: searchIndexFor(topology, records).map((entry) => ({ ...entry, status: 'active' })),
  });

  // The links' arguments, sharded by period (src/explanations.js). Read off
  // the records rather than off the topology, which drops `explanation`
  // because nothing that draws a line needs it — and that is the point: this
  // is for whatever reads a *path* and would otherwise fetch one file per
  // step (health review B, finding 18).
  const eventsById = new Map(topology.events.map((e) => [e.id, e]));
  const explanations = explanationShards(records.filter((r) => r.kind === 'edge'), eventsById)
    .map((shard) => {
      const text = serialize({ schema: 1, ...shard });
      return { from: shard.from, to: shard.to, name: shardName(shard, hashOf(text)), text };
    });

  // What review.html needs and the spine does not carry: which records
  // still have nobody's name on them, and what the rules say about each. The
  // browser cannot read data/ record by record — 1200 files — and the
  // spine drops `authors`, so the digests are written here, where every
  // record is already in hand. Warnings come from the same checkRules() the
  // CLI runs, so the dashboard shows the validator's opinion rather than a
  // second implementation of it.
  //
  // One shard per kind since H6b, and a summary that names them. The single
  // file carried a digest of every draft — 265 KB today, 11.6 MB at twenty
  // thousand — and the dashboard had to have all of it before it could draw
  // fifteen rows (health review B, finding 7). A reviewer works through one
  // kind at a time and the queue was always grouped that way, so that is
  // where the file divides.
  const drafts = records.filter(inQueue);
  const degrees = degreesOf(topology);
  const warnings = (prepared.warnings ?? checkRules(records, topology).warnings)
    .map((w) => ({ id: w.id, kind: w.kind, rule: w.rule, message: w.message }))
    .sort((a, b) => byId(a, b) || (a.rule < b.rule ? -1 : a.rule > b.rule ? 1 : 0));
  // A kind's shard carries the warnings about its own drafts and no others:
  // the dashboard reads them to put flags on rows, and a warning about a
  // record nobody is waiting on is weight with no reader.
  const draftIds = new Set(drafts.map((r) => `${r.kind}:${r.id}`));
  const shardKinds = [...new Set(drafts.map((r) => r.kind))]
    .sort((a, b) => KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b) || (a < b ? -1 : 1));
  const shards = shardKinds.map((kind) => {
    const text = serialize({
      schema: 1,
      kind,
      records: drafts.filter((r) => r.kind === kind)
        .map((r) => digestOf(r, { degree: degrees.get(`${r.kind}:${r.id}`) ?? 0 }))
        .sort(byId),
      warnings: warnings.filter((w) => draftIds.has(`${w.kind}:${w.id}`) && w.kind === kind),
    });
    const name = `review-${kind}-${hashOf(text)}.json`;
    return { kind, name, text, count: drafts.filter((r) => r.kind === kind).length };
  });
  const reviewText = serialize({
    schema: 1,
    total: records.filter((r) => r.kind !== 'presence').length,
    drafts: drafts.length,
    kinds: shards.map(({ kind, count, name }) => ({ kind, count, file: `index/${name}` })),
  });

  // One file per record, under an unhashed directory: the dashboard fetches
  // the history of the record a reviewer just opened, by its id, and a hashed
  // name would mean reading the manifest for every one of them.
  const { histories } = await recordHistories(
    records.filter((r) => r.kind !== 'presence'),
    { dataDir, git: prepared.git ?? true },
  );
  const historyEntries = histories.map((h) => [`${HISTORY_DIR}/${h.id}.json`, serialize(h)]);

  const spineName = `spine-${hashOf(spineText)}.json`;
  const searchName = `search-${hashOf(searchText)}.json`;
  const sourcesName = `sources-${hashOf(sourcesText)}.json`;
  const reviewName = `review-${hashOf(reviewText)}.json`;
  const manifestValue = {
    schema: 1,
    counts: {
      events: topology.events.length,
      edges: topology.edges.length,
      sources: topology.sources.length,
      actors: topology.actors.length,
      presences: topology.presences.length,
      places: topology.places.length,
      relations: topology.relations.length,
      offices: topology.offices.length,
      tenures: topology.tenures.length,
      narratives: topology.narratives.length,
      regions: topology.regions.length,
    },
    files: {
      citers: `index/${citersDir}`,
      history: `index/${HISTORY_DIR}`,
      search: `index/${searchName}`,
      spine: `index/${spineName}`,
      sources: `index/${sourcesName}`,
      review: `index/${reviewName}`,
    },
    regions: topology.regions,
    // What people actually wrote in `role`, normalised. The vocabulary is
    // open on purpose; this is the evidence for closing it later.
    roles: rolesInUse(topology.events),
    // Paleo-coastlines will list a year range here; the present covers all.
    land: land.map((l) => ({ file: l.file, epoch: l.epoch, from: null, to: null })),
    // The territory shards, in year order. The site loads the one that
    // covers the year on the slider and nothing else.
    presenceShards,
    // The links' arguments, in year order. Fetched in bulk by whatever reads
    // a path — never at load, and never to draw anything.
    explanationShards: explanations.map(({ from, to, name }) => ({ file: `index/${name}`, from, to })),
    // The hue each actor's territory is drawn in, when there is a palette to
    // draw from: written by tools/build-palette.mjs, not by this tool, and
    // named here so the site fetches it in one request with the rest.
    palette: paletteFile(dataDir),
    // Which licence covers which directory, and whom each one asks to be
    // named. `data/LICENSE` says all of it in prose; a reuser of these files
    // could not read it out of them (health review A, finding 24), and the
    // index itself carried no licence at all while projecting NC actors and
    // presences into the same files as CC BY-SA records.
    licenses: licensingTable(),
  };
  const manifest = serialize(manifestValue);

  // The pages the build writes beside the index (H8). Built from the same
  // atlas the browser assembles — the spine, the sources index and the citer
  // rows this build has just produced, through `createAtlasFromSpine` — so
  // that a prerendered page cannot be a rendering of anything but what the
  // index says. Nothing is written here: `sitePages` is pure and `writeSite`
  // below is what touches disk, the way `writeIndex` is for the index.
  const atlas = createAtlasFromSpine({
    manifest: canonical(manifestValue),
    spine: JSON.parse(spineText),
    sources: JSON.parse(sourcesText).sources,
    citers: new Map(citers.map(([name, text]) => [name.replace(/\.json$/, ''), JSON.parse(text).citations ?? []])),
    fetchJson: () => Promise.reject(new Error('the build has every record in hand and fetches nothing')),
  });
  const expanded = expandSpine(JSON.parse(spineText));
  const pages = sitePages({
    atlas,
    records,
    narratives: expanded.narratives,
    events: new Map(expanded.events.map((e) => [e.id, e])),
    edges: new Map(expanded.edges.map((e) => [e.id, e])),
    templates: prepared.templates ?? await readTemplates(),
  });

  const unresolved = topology.events.filter((e) => e.status === 'active' && e.place && !e.region);
  return {
    pages,
    files: {
      'manifest.json': manifest,
      [searchName]: searchText,
      [spineName]: spineText,
      [sourcesName]: sourcesText,
      [reviewName]: reviewText,
      ...Object.fromEntries(shards.map(({ name, text }) => [name, text])),
      ...Object.fromEntries(explanations.map(({ name, text }) => [name, text])),
      ...Object.fromEntries(citerEntries),
      ...Object.fromEntries(historyEntries),
    },
    topology,
    unresolved,
  };
}

// One level deep, keyed by the path relative to data/index/, so that a citer
// file is compared like any other: rule 16 is what stops a stale index
// reaching the deploy, and a directory it could not see would be a hole in it.
export async function readIndex(dataDir = DEFAULT_DATA) {
  const dir = path.join(dataDir, 'index');
  const files = {};
  if (!existsSync(dir)) return files;
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    if (entry.isDirectory()) {
      if (!HASHED_DIR.test(entry.name) && entry.name !== HISTORY_DIR) continue;
      for (const name of (await readdir(path.join(dir, entry.name))).sort()) {
        files[`${entry.name}/${name}`] = await readFile(path.join(dir, entry.name, name), 'utf8');
      }
    } else if (entry.name === 'manifest.json' || HASHED.test(entry.name)) {
      files[entry.name] = await readFile(path.join(dir, entry.name), 'utf8');
    }
  }
  return files;
}

// Differences between what is on disk and a fresh build: [] when fresh.
//
// Every file is compared byte for byte, the histories included. They were
// exempt until 6 September, "because the deploy checks out one commit deep" —
// which made rule 16 false by construction for 1 006 of the 1 054 index
// files, and let the deploy commit a one-version history for every record
// over the full ones (health review of 6 September, R1). The deploy checks
// out the whole history now, and a build that cannot see one falls back to
// `revised` and says so in the file (tools/lib/history.mjs), so the two sides
// of rule 16 agree again and the exemption has nothing left to excuse.
export function compareIndex(existing, built) {
  const problems = [];
  for (const name of Object.keys(built.files)) {
    if (!Object.hasOwn(existing, name)) problems.push(`missing ${name}`);
    else if (existing[name] !== built.files[name]) problems.push(`differs ${name}`);
  }
  for (const name of Object.keys(existing)) {
    if (!Object.hasOwn(built.files, name)) problems.push(`stale ${name}`);
  }
  return problems;
}

// Everything the fresh build does not name goes, directories included: a
// citer file for a source that has since lost its last citation would
// otherwise sit there for ever, served `immutable` under a hash that no
// longer describes it.
export async function writeIndex(dataDir, built) {
  const dir = path.join(dataDir, 'index');
  await mkdir(dir, { recursive: true });
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!HASHED_DIR.test(entry.name) && entry.name !== HISTORY_DIR) continue;
      for (const name of await readdir(full)) {
        if (!Object.hasOwn(built.files, `${entry.name}/${name}`)) await unlink(path.join(full, name));
      }
      if ((await readdir(full)).length === 0) await rmdir(full);
    } else if (HASHED.test(entry.name) && !Object.hasOwn(built.files, entry.name)) {
      await unlink(full);
    }
  }
  for (const [name, text] of Object.entries(built.files)) {
    const file = path.join(dir, ...name.split('/'));
    if (name.includes('/')) await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, text, 'utf8');
  }
}

// ─── The pages ─────────────────────────────────────────────────────────────
//
// Same three verbs as the index above, and for the same reason: a generated
// file that nobody compares goes stale the first time a record changes, and
// a stale page is worse than no page because it looks authoritative.

export async function readTemplates(siteDir = ROOT) {
  const out = {};
  for (const name of TEMPLATES) out[name] = await readFile(path.join(siteDir, name), 'utf8');
  return out;
}

// What is on disk of the pages the build owns: the two pages with a generated
// region — read whole, because the region's markers are inside them — and
// every entry page under entry/.
export async function readSite(siteDir = ROOT) {
  const files = {};
  for (const name of ['sources.html', 'narratives.html']) {
    files[name] = await readFile(path.join(siteDir, name), 'utf8');
  }
  const dir = path.join(siteDir, ENTRY_DIR);
  if (existsSync(dir)) {
    for (const name of (await readdir(dir)).sort()) {
      if (name.endsWith('.html')) files[`${ENTRY_DIR}/${name}`] = await readFile(path.join(dir, name), 'utf8');
    }
  }
  return files;
}

export function compareSite(existing, pages) {
  const problems = [];
  for (const name of Object.keys(pages)) {
    if (!Object.hasOwn(existing, name)) problems.push(`missing ${name}`);
    else if (existing[name] !== pages[name]) problems.push(`differs ${name}`);
  }
  for (const name of Object.keys(existing)) {
    if (!Object.hasOwn(pages, name)) problems.push(`stale ${name}`);
  }
  return problems;
}

// An entry page the build no longer names is a page for a record that has
// lost its `body` or gone altogether, and it would otherwise stay on the site
// for ever under a URL the atlas no longer links to.
export async function writeSite(siteDir, pages) {
  const dir = path.join(siteDir, ENTRY_DIR);
  if (existsSync(dir)) {
    for (const name of await readdir(dir)) {
      if (name.endsWith('.html') && !Object.hasOwn(pages, `${ENTRY_DIR}/${name}`)) await unlink(path.join(dir, name));
    }
    if ((await readdir(dir)).length === 0) await rmdir(dir);
  }
  for (const [name, text] of Object.entries(pages)) {
    const file = path.join(siteDir, ...name.split('/'));
    if (name.includes('/')) await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, text, 'utf8');
  }
}

// What the build prints about the pages: the count and the bytes, which is
// the number the owner asked to see (health plan, decision 4). Entries are
// counted apart from the two lists because they are the part that grows with
// the dataset.
export function pageReport(pages) {
  const rows = Object.entries(pages).map(([name, text]) => ({ name, bytes: Buffer.byteLength(text, 'utf8') }));
  const entries = rows.filter((r) => r.name.startsWith(`${ENTRY_DIR}/`));
  return {
    rows,
    files: rows.length,
    bytes: rows.reduce((n, r) => n + r.bytes, 0),
    entries: entries.length,
    entryBytes: entries.reduce((n, r) => n + r.bytes, 0),
  };
}

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let siteDir;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--site') siteDir = path.resolve(argv[++i]);
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  // The pages are the repository's own site, so they are written only when
  // the build is of the repository's own data. A build of the fixtures — or
  // of any other dataset — computes them all the same, and says where to put
  // them with --site; what it must never do is quietly overwrite the real
  // sources.html with a list of three invented books.
  if (siteDir === undefined) siteDir = dataDir === DEFAULT_DATA ? ROOT : null;
  const built = await buildIndex(dataDir);
  if (built.unresolved.length) {
    for (const e of built.unresolved) {
      console.error(`error: ${e.id}: region could not be derived from its place; set region on the place or on the event`);
    }
    return 1;
  }
  await writeIndex(dataDir, built);
  const c = built.topology;
  console.log(`index written to ${path.relative(process.cwd(), path.join(dataDir, 'index')) || '.'}: ${c.events.length} events, ${c.edges.length} edges, ${c.actors.length} actors, ${c.relations.length} relations, ${c.offices.length} offices, ${c.tenures.length} tenures, ${c.narratives.length} narratives, ${c.places.length} places, ${c.presences.length} presences, ${c.sources.length} sources`);
  if (siteDir) {
    await writeSite(siteDir, built.pages);
    const report = pageReport(built.pages);
    console.log(`pages written to ${path.relative(process.cwd(), siteDir) || '.'}: ${report.files} files, ${report.bytes.toLocaleString('en-US')} bytes`);
    for (const row of report.rows.slice(0, 2)) {
      console.log(`  ${row.name.padEnd(24)} ${String(row.bytes.toLocaleString('en-US')).padStart(9)} bytes`);
    }
    console.log(`  ${`${ENTRY_DIR}/*.html`.padEnd(24)} ${String(report.entryBytes.toLocaleString('en-US')).padStart(9)} bytes  (${report.entries} record${report.entries === 1 ? '' : 's'} with a full entry)`);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
