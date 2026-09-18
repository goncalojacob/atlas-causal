#!/usr/bin/env node
// Correcting an id: the record is renamed, its former id keeps resolving, and
// every reference to it is rewritten.
//
//   node tools/migrate/ids.mjs <kind>/<old-id> <new-id> [--data <dir>]
//                              [--today YYYY-MM-DD] [--dry-run]
//
// Plan decision 3 chose derived ids *and* a rename tool; H5a shipped the
// safety net — every reference resolves through `aliases` — and the tool was
// never written, so until now a misspelt slug could only be corrected by hand
// across every record that names it (index2-plan, D11).
//
// It is a tool a person runs and **not** a step of the migration chain
// (i7-brief §"What this run must not do", the same argument M30a amendment A1
// makes of the `led` re-filing): a chain step is one record in, one record
// out, re-applied on every read for ever, and a rename is a change of file
// name — of the *set* of files — which no such step can be.
//
// **A rename changes what a record is filed under and nothing about what it
// says.** Not a word of `title`, `summary`, `explanation`, `note` or `label`
// is touched, no `review` block is cleared, no signature and no citation
// audit trail is lost. What changes is `id`, `aliases`, the references other
// records make, and `revised` on every file that was rewritten — because the
// file changed and `?v=<revised>` is what tells a cache so.
//
// The shell below is thin: `renamePlan` works the whole thing out in memory
// and is what the tests hold, the way `planTenures` is in `led-to-tenures.mjs`
// and `topojson.mjs` is under `tools/import/`.

import { readFile, writeFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { KIND_DIRS, readRecords, readImportMaps, paletteFile } from '../lib/read.mjs';
import { KINDS } from '../../src/kinds.js';
import { rewriteReferences, rewriteImportMap } from '../../src/references.js';
import { SLUG, EDGE_ID, RELATION_ID } from '../../src/validate/rules.js';
import { importWritten, originTool } from '../../src/origin.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_DATA = path.join(ROOT, 'data');

// The two kinds whose id is not a name somebody chose but three fields joined:
// `from--to--type`. Rule 2 checks the id against the fields, so renaming one
// is renaming its ends — which is what the cascade below does — and never an
// edit of the id alone.
export const DERIVED_ID_KINDS = Object.freeze(['edge', 'relation']);

const patternFor = (kind) => (kind === 'edge' ? EDGE_ID : kind === 'relation' ? RELATION_ID : SLUG);
const shapeOf = (kind) => (DERIVED_ID_KINDS.includes(kind) ? `from--to--type ${kind} id` : 'slug');
// Four of the ten kinds begin with a vowel, and a refusal is a sentence a
// person reads.
const a = (word) => `${/^[aeiou]/.test(word) ? 'an' : 'a'} ${word}`;

// The three parts of a derived id, or null. The patterns are `vocab.js`'s and
// carry the vocabularies with them, so an edge type can never stand in a
// relation's id.
export function partsOf(kind, id) {
  const m = patternFor(kind).exec(String(id ?? ''));
  return m ? { from: m[1], to: m[2], type: m[3] } : null;
}

const fileOf = (kind, id) => `${KIND_DIRS[kind]}/${id}.json`;

// ─── The plan ───────────────────────────────────────────────────────────────
//
// `records` is every record of the dataset, each carrying its own `kind`;
// `maps` is `readImportMaps`'s answer. → `{ error }` where the rename is
// refused, or the whole of what to do:
//
//   renames  [{ kind, from, to }], the record asked for first and then the
//            derived ids the cascade carried, in id order
//   writes   [{ kind, from, to, file, was, record }] — every file whose bytes
//            change, `was` being the path to remove where it was renamed
//   maps     [{ file, name, kind, map, count }] under data/imports/
//   counts   references rewritten, by the kind of the record that made them
export function renamePlan(records, kind, oldId, newId, { today = null, maps = [] } = {}) {
  const refuse = (error) => ({ error });
  if (!KINDS.includes(kind)) return refuse(`unknown kind "${kind}"; expected ${KINDS.join(', ')}`);
  if (!patternFor(kind).test(String(newId ?? ''))) {
    return refuse(`"${newId}" is not a ${shapeOf(kind)}`);
  }

  const byId = new Map(records.map((r) => [r.id, r]));
  const target = byId.get(oldId);
  if (!target) return refuse(`no record has the id "${oldId}"`);
  if (target.kind !== kind) return refuse(`"${oldId}" is ${a(target.kind)}, not ${a(kind)}`);
  if (oldId === newId) return refuse(`"${oldId}" already has that id`);

  // Rule 2 keeps ids and aliases unique across the whole atlas, so both are
  // asked here: a new id that is somebody's former id would resolve to two
  // records at once and the validator would refuse the result.
  if (byId.has(newId)) return refuse(`"${newId}" is already the id of ${a(byId.get(newId).kind)}`);
  const claimant = records.find((r) => (r.aliases ?? []).includes(newId));
  if (claimant) return refuse(`"${newId}" is already an alias of "${claimant.id}"`);

  // A record that was withdrawn *and replaced* is not renamed: the rename
  // would move the address an old link was written against and would say
  // nothing about the record that stands in its place, so the answer is to
  // rename that one. M44c narrowed this to what that sentence argues. A
  // retracted record with `supersededBy: null` has nothing standing in its
  // place to rename instead, its former id keeps resolving through `aliases`
  // like anybody's, and it is still a record of this atlas — CLAUDE.md's
  // "everything is in English" does not stop at a tombstone, and a withdrawn
  // record whoever un-retracts it will find misfiled is the Croatian war's
  // dates again in another form.
  if (target.supersededBy !== null && target.supersededBy !== undefined) {
    return refuse(`"${oldId}" is ${target.status} — rename "${target.supersededBy}", which superseded it`);
  }
  if (target.status === 'merged') {
    return refuse(`"${oldId}" is merged, not an active record`);
  }

  // Amendment A2 / plan review finding 14. A CShapes actor's id is a value in
  // `data/imports/cshapes-actors.json` and its presences are `<actor>-<year>`,
  // both re-derived from the map on the next `--import`: renaming the record
  // here would leave the import writing the new id beside the stale one it
  // still owns.
  //
  // That argument is about an id an import **re-derives**, and M44c found it
  // being applied to every imported record. The Wikidata import does not
  // re-derive: `itemIndex` in tools/import/wikidata.mjs keys the records it
  // has by `kind:Qnnn` and the run enriches the record that claims the item,
  // deriving an id from a label only for an item no record claims. So a
  // Wikidata record that keeps its `wikidata` across a rename is re-found
  // under its new id and is never written twice, and the refusal asks for
  // that identifier rather than for the origin alone.
  // M56 narrowed this a second time, and by the same argument M44c used. The
  // refusal is about an id the import **re-derives**, and what makes it
  // re-derivable is that the id is a *value* in the mapping file: the territory
  // imports read `data/imports/<source>-actors.json`, take the id it gives for
  // a name or a gwcode, and write the record under it. A plan that rewrites
  // that entry has already answered the objection — the next import finds the
  // new id where it looked for the old one, and writes nothing beside it. So
  // the question is not who created the record but **whether this rename moves
  // the mapping too**, which is what `carriedByMap` asks.
  //
  // It is not the whole answer for those two imports, because their presence
  // ids are `<actor>-<year>`, derived from the actor id in that same file. The
  // cascade below carries them, and without it this narrowing would be false:
  // the import would write `x-1650` beside the stale `y-1650` even with the
  // map corrected. The two changes are one change.
  //
  // M56 needed it because five actors carried a handle that had stopped being
  // true — `belize-before-1886` running to 1981 — and the only route the tool
  // left was re-running the import, which was measured on 17 September and
  // **reverts M51's joins**: it rewrote nineteen merged records back into the
  // pairs they were joined from. A rename must not have to undo a milestone.
  const carriedByMap = maps.some((entry) => rewriteImportMap(entry.map, entry.kind, (id) => (id === oldId ? newId : id)).count > 0);
  if (importWritten(target) && !(originTool(target) === 'wikidata' && typeof target.wikidata === 'string') && !carriedByMap) {
    return refuse(`"${oldId}" was created by the ${originTool(target)} import and is corrected in data/imports/, not here: `
      + 'edit the mapping file and re-run the import (CLAUDE.md, "Correcting a territory")');
  }

  // Renaming a derived-id record is re-typing it — M31's ten `allied-with`
  // corrections — and nothing else. Its ends are renamed by renaming the
  // records at them, which is what the cascade below is for; moving an end
  // here would change which two things the record is about, and that is a
  // different claim rather than a correction of a name.
  if (DERIVED_ID_KINDS.includes(kind)) {
    const was = partsOf(kind, oldId);
    const now = partsOf(kind, newId);
    if (was.from !== now.from || was.to !== now.to) {
      return refuse(`a ${kind}'s id is derived from its ends and its type: "${newId}" moves an end. `
        + 'Rename the records at the ends instead; only the type may be corrected here');
    }
  }

  // The cascade. An edge's id and a relation's are `from--to--type`, so
  // renaming an event renames every edge that touches it and renaming an
  // actor renames every relation at either end. It repeats until nothing
  // changes, which terminates because an id is only ever rewritten once and
  // nothing derives an id from a derived one.
  const renames = new Map([[oldId, newId]]);

  // The presence cascade, and only where the mapping carries the actor. A
  // presence id is a slug like any other and nothing derives it in general —
  // a person may call one whatever they like — but the two territory imports
  // write `<actor>-<year>`, and for those the id *is* derived. Renaming the
  // actor without them would leave the next import writing a second set
  // beside the first, which is exactly what the refusal above guards against.
  //
  // A presence whose id does not begin with the actor's is left alone: it was
  // named by hand, and renaming it would be the tool choosing a name.
  if (kind === 'actor' && carriedByMap) {
    for (const record of records) {
      if (record.kind !== 'presence' || record.actor !== oldId) continue;
      if (!record.id.startsWith(`${oldId}-`)) continue;
      const derived = `${newId}${record.id.slice(oldId.length)}`;
      if (byId.has(derived)) return refuse(`renaming "${oldId}" would give "${record.id}" the id "${derived}", which is already taken`);
      const held = records.find((r) => (r.aliases ?? []).includes(derived));
      if (held) return refuse(`renaming "${oldId}" would give "${record.id}" the id "${derived}", which is already an alias of "${held.id}"`);
      renames.set(record.id, derived);
    }
  }

  for (let pass = 0; pass < KINDS.length; pass += 1) {
    let added = false;
    for (const record of records) {
      if (!DERIVED_ID_KINDS.includes(record.kind) || renames.has(record.id)) continue;
      const from = renames.get(record.from) ?? record.from;
      const to = renames.get(record.to) ?? record.to;
      if (from === record.from && to === record.to) continue;
      const derived = `${from}--${to}--${record.type}`;
      const taken = byId.get(derived);
      if (taken && !renames.has(derived)) {
        return refuse(`renaming "${oldId}" would give "${record.id}" the id "${derived}", which is already taken`);
      }
      renames.set(record.id, derived);
      added = true;
    }
    if (!added) break;
  }

  const rename = (id) => renames.get(id) ?? id;
  const counts = {};
  const writes = [];
  // `geometry.key` on a presence is not a reference to a record — it is the
  // name of a feature in a shard under `data/geo/`, which `references.js`
  // deliberately does not know about. For the territory imports that name is
  // the actor's id, so renaming the actor moves it, and the shard has to move
  // with it or rule 17 finds a presence naming a feature that is not there.
  const geoKeys = new Map();
  const geoFiles = new Set();
  for (const record of records) {
    if (record.kind !== 'presence' || record.geometry?.key !== oldId) continue;
    geoKeys.set(oldId, newId);
    for (const file of record.geometry?.files ?? []) geoFiles.add(file);
  }
  for (const record of records) {
    const { record: rewritten, count } = rewriteReferences(record, rename);
    const to = renames.get(record.id);
    const movesKey = record.kind === 'presence' && geoKeys.has(record.geometry?.key);
    if (!to && count === 0 && !movesKey) continue;
    if (count) counts[record.kind] = (counts[record.kind] ?? 0) + count;
    let out = movesKey
      ? { ...rewritten, geometry: { ...rewritten.geometry, key: geoKeys.get(rewritten.geometry.key) } }
      : rewritten;
    if (to) {
      // The former id goes in `aliases`, which is the whole of "a former id
      // keeps resolving": `resolveId` in the validator and `resolve()` in the
      // browser already walk it. A record that once held the *new* id gives
      // it up, because rule 2 refuses an alias equal to the record's own id.
      const aliases = [...(record.aliases ?? []).filter((a) => a !== to && a !== record.id), record.id];
      out = { ...out, id: to, aliases };
      // For a derived id the fields are the id: `from` and `to` were rewritten
      // above with every other reference, and the type is what a re-typing
      // changes.
      if (DERIVED_ID_KINDS.includes(record.kind)) out.type = partsOf(record.kind, to).type;
    }
    if (today !== null) out = { ...out, revised: today };
    writes.push({
      kind: record.kind,
      from: record.id,
      to: to ?? record.id,
      file: fileOf(record.kind, to ?? record.id),
      was: to ? fileOf(record.kind, record.id) : null,
      record: out,
    });
  }

  const mapWrites = [];
  for (const entry of maps) {
    const { map, count } = rewriteImportMap(entry.map, entry.kind, rename);
    if (count) mapWrites.push({ ...entry, map, count });
  }

  return {
    renames: [...renames.entries()]
      .map(([from, to]) => ({ kind: byId.get(from).kind, from, to }))
      // The record asked for first, then the cascade in id order: that is the
      // order the report reads in and the order the files are written in.
      .sort((a, b) => (a.from === oldId ? -1 : b.from === oldId ? 1 : a.from < b.from ? -1 : 1)),
    writes,
    maps: mapWrites,
    // What the shell has to do under `data/geo/`: in each of these shards,
    // a feature whose `id` is a key in `keys` takes the new one, and a
    // `properties.presence` naming a renamed presence follows it. Returned
    // rather than done here so that `renamePlan` stays a pure function of the
    // records it was handed, which is what the tests hold it as.
    geo: geoKeys.size ? { files: [...geoFiles].sort(), keys: Object.fromEntries(geoKeys), presences: Object.fromEntries([...renames].filter(([from]) => byId.get(from)?.kind === 'presence')) } : null,
    counts,
  };
}

// The shard rewrite, kept beside the plan so it is testable without a disk.
// A shard is TopoJSON: `features[].id` is the geometry key and
// `features[].properties.presence` the presence that claims it.
export function rewriteShard(shard, { keys = {}, presences = {} } = {}) {
  let count = 0;
  const features = (shard.features ?? []).map((f) => {
    const id = Object.hasOwn(keys, f.id) ? keys[f.id] : f.id;
    const was = f.properties?.presence;
    const presence = Object.hasOwn(presences, was) ? presences[was] : was;
    if (id === f.id && presence === was) return f;
    count += 1;
    return { ...f, id, properties: { ...f.properties, presence } };
  });
  return { shard: count ? { ...shard, features } : shard, count };
}

// ─── The shell ──────────────────────────────────────────────────────────────

const write = (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

function run(args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (c) => { out += c; });
    child.stderr.on('data', (c) => { out += c; });
    child.on('error', () => resolve({ code: 1, out }));
    child.on('close', (code) => resolve({ code, out }));
  });
}

// The last line of the validator's own report, which is the verdict: "N
// records, N regions: N error(s), N warning(s)". Printing the whole of it
// under a rename would bury the plan in a thousand warnings the rename did
// not cause.
function verdictOf(out) {
  const lines = out.split('\n').filter((l) => /error\(s\), \d+ warning\(s\)/.test(l));
  return lines.length ? lines[lines.length - 1] : out.trim().split('\n').slice(-1)[0];
}

function usage() {
  console.error('usage: node tools/migrate/ids.mjs <kind>/<old-id> <new-id> [--data <dir>] [--today YYYY-MM-DD] [--dry-run]');
  return 2;
}

async function main(argv) {
  let dataDir = DEFAULT_DATA;
  let today = new Date().toISOString().slice(0, 10);
  let dryRun = false;
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--data') dataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--today') today = argv[++i];
    else if (argv[i] === '--dry-run') dryRun = true;
    else if (argv[i].startsWith('--')) {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    } else positional.push(argv[i]);
  }
  if (positional.length !== 2) return usage();
  const at = positional[0].indexOf('/');
  if (at < 1) return usage();
  const kind = positional[0].slice(0, at);
  const oldId = positional[0].slice(at + 1);
  const newId = positional[1];

  // The bytes as they are on disk, not as the migration chain would have
  // them: a rename rewrites what it renames and nothing else, and bringing a
  // record forward a schema version is `tools/migrate/apply.mjs`'s job.
  const { entries, problems } = await readRecords(dataDir, { migrate: false });
  for (const p of problems) console.error(`error: ${p.file}: ${p.message}`);
  if (problems.length) return 1;
  const { maps, problems: mapProblems } = await readImportMaps(dataDir);
  for (const p of mapProblems) console.error(`error: ${p.file}: ${p.message}`);
  if (mapProblems.length) return 1;

  const plan = renamePlan(entries.map((e) => e.record), kind, oldId, newId, { today, maps });
  if (plan.error) {
    console.error(`error: ${plan.error}`);
    return 1;
  }

  for (const r of plan.renames) console.log(`rename  ${r.kind.padEnd(9)} ${r.from}  →  ${r.to}`);
  for (const [k, n] of Object.entries(plan.counts).sort()) console.log(`rewrite ${k.padEnd(9)} ${n} reference(s)`);
  for (const m of plan.maps) console.log(`rewrite ${m.file} ${m.count} reference(s)`);
  for (const file of plan.geo?.files ?? []) console.log(`rewrite ${file}`);

  if (!dryRun) {
    const at = (file) => path.join(dataDir, ...file.split('/'));
    // Every new file first and the old ones after, because one record's new
    // path can be another's old one — a cascade that swaps two derived ids
    // would otherwise delete a file it had just written.
    for (const w of plan.writes) await write(at(w.file), w.record);
    const written = new Set(plan.writes.map((w) => w.file));
    for (const w of plan.writes) if (w.was && !written.has(w.was)) await rm(at(w.was));
    for (const m of plan.maps) await write(at(m.file), m.map);
    // The shards last, and written the way the import writes them: one line,
    // no indentation. A shard is fetched by the browser a cell at a time and
    // `data/geo/` sits under a byte ceiling, so pretty-printing one here would
    // put kilobytes back that M36 spent three sub-runs taking out.
    for (const file of plan.geo?.files ?? []) {
      const shard = JSON.parse(await readFile(at(file), 'utf8'));
      const { shard: out, count } = rewriteShard(shard, plan.geo);
      if (count) await writeFile(at(file), `${JSON.stringify(out)}\n`, 'utf8');
    }
  }

  const renamed = plan.renames.length;
  const rewritten = plan.writes.length - renamed;
  console.log(`${renamed} record(s) renamed, ${rewritten} record(s) rewritten, ${plan.maps.length} import file(s)${dryRun ? ' (dry run: nothing written)' : ''}`);
  if (dryRun) return 0;

  // The two derived files that are keyed by a record id and are not the
  // index: `data/geo/palette.json` says which of the eight hues each actor is
  // drawn in, and rule 16 refuses one that is not what `build-palette.mjs`
  // produces. Renaming an actor moves a key of it, so it is rebuilt here
  // rather than left for the person to discover from a failing validator.
  if (paletteFile(dataDir)) {
    const palette = await run([path.join(ROOT, 'tools', 'build-palette.mjs'), '--data', dataDir], ROOT);
    if (palette.code !== 0) {
      console.error(palette.out);
      return 1;
    }
  }
  const build = await run([path.join(ROOT, 'tools', 'build-index.mjs'), '--data', dataDir], ROOT);
  if (build.code !== 0) {
    console.error(build.out);
    return 1;
  }
  const check = await run([path.join(ROOT, 'tools', 'validate.mjs'), '--data', dataDir, '--index', '--quiet'], ROOT);
  console.log(`index rebuilt; validator: ${verdictOf(check.out)}`);
  return check.code === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
