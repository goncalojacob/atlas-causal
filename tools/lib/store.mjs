// The local server's copy of the atlas, and the queue that writes to it.
//
// Every Save used to re-read data/ record by record, rebuild the topology,
// validate, write the files, rebuild the whole index and only then answer —
// four seconds today and about a minute at twenty thousand records, with the
// reviewer's tab held open for all of it. Worse, nothing serialised the
// saves: two of them interleaved their writeIndex and the loser's files were
// deleted by the winner's clean-up (health review B, finding 32).
//
// So: the records and the topology live here between saves; a save takes its
// turn in a queue, one at a time; the answer goes back as soon as the record
// files are on disk; and data/index/ is rebuilt afterwards, in the
// background, with `/__status` saying so while it runs.
//
// It is not, however, the only writer: `git checkout`, a hand edit,
// `new-record.mjs` or `migrate/apply.mjs` all change `data/` while the server
// is running, and a save validated against the copy in memory would then have
// been judged against records that no longer exist — and the background
// rebuild would write an index built from memory over the newer files
// (health review of 6 September, R13). `reload()` existed and nothing reached
// it. So every save begins by asking the disk whether it still looks the way
// it did: one `stat` per record file, about 20 ms on this dataset against the
// 1.6 s a full re-read costs, and a re-read only when the answer is no.

import path from 'node:path';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { buildTopology, validate } from '../../src/validate/core.js';
import { buildUniverse } from '../../src/validate/rules.js';
import { createValidator } from '../../src/validate/schema.js';
import { createRegionDeriver } from '../../src/util/geo.js';
import { buildIndex, writeIndex } from '../build-index.mjs';
import { readRecords, readRegions, readRegionPolygons, readSchemaFiles, KIND_DIRS } from './read.mjs';

// How long a burst of saves is allowed to coalesce into one index build. A
// reviewer signing a run of records fires them a second or two apart, and
// rebuilding between two of them is work nobody waits for.
export const REBUILD_DELAY = 250;

// What `data/`'s record files look like right now: every file's name, size
// and modification time, in one string. Not a hash of the contents — that is
// the re-read this exists to avoid — and not the newest mtime alone, which
// misses a file deleted or one restored to an older copy by `git checkout`.
// `regions.json` is in it too: it is read at load like the records are.
export async function stampOf(dataDir) {
  const parts = [];
  for (const dir of [...new Set(Object.values(KIND_DIRS))].sort()) {
    let names;
    try {
      names = (await readdir(path.join(dataDir, dir))).filter((n) => n.endsWith('.json')).sort();
    } catch {
      continue;
    }
    for (const name of names) {
      const info = await stat(path.join(dataDir, dir, name));
      parts.push(`${dir}/${name}:${info.size}:${info.mtimeMs}`);
    }
  }
  try {
    const info = await stat(path.join(dataDir, 'regions.json'));
    parts.push(`regions.json:${info.size}:${info.mtimeMs}`);
  } catch { /* a dataset with no regions file is the validator's business */ }
  return parts.join('\u001f');
}

export class StoreError extends Error {
  constructor(status, message, detail = null) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export function createStore({ dataDir, schemaDir }) {
  let atlas = null;
  let loading = null;
  // The queue: every save is chained onto the last, so two that arrive
  // together are applied in the order they arrived and never at once.
  let queue = Promise.resolve();
  let waiting = 0;
  let rebuilding = null;
  let againAfter = false;
  let timer = null;
  const index = { state: 'unknown', since: null, message: null, files: null };

  async function read() {
    const { entries, problems } = await readRecords(dataDir);
    if (problems.length) {
      throw new StoreError(500, `data/ has files that are not valid JSON: ${problems.map((p) => p.file).join(', ')}`);
    }
    const regions = await readRegions(dataDir);
    const polygons = await readRegionPolygons(dataDir);
    const schemas = await readSchemaFiles(schemaDir);
    const records = new Map(entries.map((e) => [e.record.id, e.record]));
    const next = {
      records,
      regions,
      deriveRegion: polygons ? createRegionDeriver(polygons) : undefined,
      schemas,
      validator: createValidator(schemas),
      loadedAt: new Date().toISOString(),
      topology: null,
      universe: null,
      // What the disk looked like when these records were read. Taken after
      // the read, so a change made while it ran is seen as a change.
      stamp: await stampOf(dataDir),
    };
    retopologise(next);
    return next;
  }

  // The topology from the records in memory, and the universe the rules read
  // it through. Both are rebuilt whole rather than patched entry by entry:
  // an event's weight is a count over the edges and a source's citation
  // count is a count over everything, so a patch that got either wrong would
  // validate the next save against an atlas that does not exist. Rebuilding
  // is linear in the records and the saving is not doing it from disk.
  function retopologise(state) {
    state.topology = buildTopology([...state.records.values()], state.regions, { deriveRegion: state.deriveRegion });
    state.universe = buildUniverse(state.topology);
  }

  async function loaded() {
    if (atlas) return atlas;
    if (!loading) {
      loading = read().then((next) => {
        atlas = next;
        loading = null;
        return next;
      }, (error) => {
        loading = null;
        throw error;
      });
    }
    return loading;
  }

  // --- the index, rebuilt behind the answer --------------------------------

  async function rebuildNow() {
    const state = await loaded();
    // A snapshot: a save that lands while this runs must not change what is
    // being written out from under it.
    const records = [...state.records.values()];
    const { topology } = state;
    const built = await buildIndex(dataDir, { records, regions: state.regions, topology });
    if (built.unresolved.length) {
      throw new Error(`no timeline lane for ${built.unresolved.map((e) => e.id).join(', ')}`);
    }
    await writeIndex(dataDir, built);
    return Object.keys(built.files).sort();
  }

  function startRebuild() {
    if (rebuilding) {
      againAfter = true;
      return rebuilding;
    }
    index.state = 'rebuilding';
    index.since = new Date().toISOString();
    index.message = null;
    rebuilding = rebuildNow().then((files) => {
      index.state = 'fresh';
      index.since = new Date().toISOString();
      index.files = files;
    }, (error) => {
      index.state = 'failed';
      index.since = new Date().toISOString();
      index.message = `${error.name}: ${error.message}`;
    }).then(() => {
      rebuilding = null;
      if (againAfter) {
        againAfter = false;
        startRebuild();
      }
    });
    return rebuilding;
  }

  // Debounced, so a run of saves a second apart is one build. The state goes
  // to "rebuilding" the moment a save lands, not when the timer fires: the
  // index is out of date from the write, and that is what the dashboard has
  // to be told.
  function scheduleRebuild(delay) {
    index.state = 'rebuilding';
    index.since = new Date().toISOString();
    if (timer) clearTimeout(timer);
    if (delay <= 0) {
      timer = null;
      return startRebuild();
    }
    timer = setTimeout(() => {
      timer = null;
      startRebuild();
    }, delay);
    // Not the build itself: a timer that keeps the process alive would make
    // a one-shot caller hang on a rebuild it has not asked to wait for.
    timer.unref?.();
    return null;
  }

  // --- one save ------------------------------------------------------------

  async function applySave(checked, bundle, target) {
    let state = await loaded();
    // Somebody else wrote to `data/` since this copy was read, so the copy is
    // not the atlas any more: re-read before judging anything against it. In
    // the queue, so the save that follows this one sees what this one wrote
    // and not the disk twice.
    if (await stampOf(dataDir) !== state.stamp) {
      atlas = await read();
      state = atlas;
    }
    if (target && !checked.some((c) => c.record.kind === target.kind && c.id === target.id)) {
      throw new StoreError(400, `the bundle contains no ${target.kind} "${target.id}": the URL names the record being saved`);
    }
    // The rules are checked against the atlas in memory: a record under
    // validation shadows its own entry in the topology, so an edit is judged
    // as the atlas would be after it. The universe is the one built when the
    // topology was, which is why it is rebuilt with it below.
    const { errors, warnings } = validate(bundle.records, state.topology, state.schemas, {
      universe: state.universe,
      validator: state.validator,
    });
    if (errors.length) throw new StoreError(422, `${errors.length} problem(s): nothing was written`, { errors, warnings });

    // An event whose lane cannot be derived would leave the timeline with
    // nowhere to put it, and build-index refuses to write an index with one.
    // Better to refuse the save than to leave the file saved and the index
    // stale — so this is asked before anything is written.
    const merged = new Map(state.records);
    for (const r of bundle.records) merged.set(r.id, r);
    const next = buildTopology([...merged.values()], state.regions, { deriveRegion: state.deriveRegion });
    const unresolved = next.events.filter((e) => e.status === 'active' && e.place && !e.region);
    if (unresolved.length) {
      throw new StoreError(422, `no timeline lane for ${unresolved.map((e) => e.id).join(', ')}: set the lane on the place or on the event`, { errors: [], warnings });
    }

    const written = [];
    for (const { record, dir, id } of checked) {
      const directory = path.join(dataDir, dir);
      const file = path.join(directory, `${path.basename(id)}.json`);
      // checkBundle already proved the id is a bare name; this is the
      // assertion that says so out loud, next to the only line that writes.
      if (path.dirname(path.resolve(file)) !== path.resolve(directory)) {
        throw new StoreError(400, `${id} would be written outside data/${dir}/`);
      }
      await mkdir(directory, { recursive: true });
      await writeFile(file, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
      written.push({ path: `data/${dir}/${id}.json`, kind: record.kind, id });
    }

    // Only now, and synchronously with respect to the queue: the next save
    // in it validates against an atlas that already has this one in it.
    state.records = merged;
    state.topology = next;
    state.universe = buildUniverse(next);
    // The files this save wrote are the store's own and must not read as
    // somebody else's edit on the next one.
    state.stamp = await stampOf(dataDir);
    return { written, warnings };
  }

  return {
    dataDir,
    load: loaded,
    async reload() {
      atlas = await read();
      return atlas;
    },
    // Every save goes through here, and the chain is what makes them one at
    // a time. A save that throws does not break the chain for the next.
    save(checked, bundle, { target = null, rebuild = REBUILD_DELAY } = {}) {
      waiting += 1;
      const mine = queue.then(() => applySave(checked, bundle, target));
      queue = mine.then(() => {}, () => {});
      return mine.then((answer) => {
        waiting -= 1;
        scheduleRebuild(rebuild);
        return answer;
      }, (error) => {
        waiting -= 1;
        throw error;
      });
    },
    // Whether `data/` has changed under the store since it was read. What
    // the next save asks before it validates anything, and what a test asks
    // to prove that it does.
    async stale() {
      if (!atlas) return false;
      return (await stampOf(dataDir)) !== atlas.stamp;
    },
    status() {
      return {
        ok: true,
        loadedAt: atlas?.loadedAt ?? null,
        records: atlas ? atlas.records.size : null,
        saves: { pending: waiting },
        index: { state: index.state, since: index.since, message: index.message },
      };
    },
    // What a caller that wants the index on disk before it returns waits on:
    // the queue, then the pending build, and the build a build asked for.
    async settled() {
      await queue;
      if (timer) {
        clearTimeout(timer);
        timer = null;
        startRebuild();
      }
      while (rebuilding) await rebuilding;
      if (index.state === 'failed') throw new StoreError(500, `the index could not be rebuilt: ${index.message}`);
      return index.files;
    },
  };
}
