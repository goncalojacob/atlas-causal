#!/usr/bin/env node
// The writer's tool. M90 §2.
//
//   node tools/queue/apply.mjs --queue <file> --writer A|B [--max 5] [--data data]
//                              [--log data/imports/queue-log.json] [--held <file>]
//                              [--fetcher stub:<dir>] [--json]
//   node tools/queue/apply.mjs --check <file>
//
// The planner decides and this applies. A writer on a smaller model is safe
// only if it has nothing to decide, so everything a rule can say is said here
// and not in a prompt: the quote is checked against the revision it names, the
// chronology refusal of A15(5) is applied to the sentence, and the five types
// are the five types. Since 13 October 2026 (M91) an item is imported whether
// or not an edge stands — the owner withdrew rules card 7's bar: "Just add all
// events that are relevant and connect them when you can" — so an item whose
// every edge is refused, or that queued none, is written as the event alone,
// filed under its surviving parents, with its refusals logged. Edges are still
// written only where the sentence is verified. What is left over for a person
// is in `data/imports/queue-log.json`, by code.
//
// **Which way the import is called.** `runImportMode` walks the cursor of
// `data/imports/wikidata-state.json` — `nextBatch` takes `runs.import.pending`
// where there is one and the seeds' own list minus `done` where there is not —
// so the way to import exactly one item is to put that one item in `pending`
// and ask for a batch of one. That is what this does, item by item: the qid is
// appended to the seeds file if it is not there, the cursor is set to `[qid]`,
// and `runImportMode(dataDir, { batchSize: 1 })` is called. Spawning
// `--import --batch 1` would have to set the same cursor and would import
// through a second process with a second budget; calling it here keeps one
// fetcher, one budget and one count of requests for the whole fire.
//
// **Nothing is committed.** The tool writes records, the index and the log;
// the commits are the routine's step, so that a run that goes wrong leaves a
// working tree somebody can read rather than a history somebody has to undo.

import path from 'node:path';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createValidator } from '../../src/validate/schema.js';
import { DRAFT_AUTHOR } from '../../src/review/queue.js';
import { REVIEW_STATUS } from '../../src/origin.js';
import { astronomicalBounds } from '../../src/util/dates.js';
import { parentsOf } from '../../src/parts.js';
import { inSchemaOrder } from '../lib/order.mjs';
import { readSchemaFiles, readRecords, readRegions, readRegionPolygons } from '../lib/read.mjs';
import { createRegionDeriver } from '../../src/util/geo.js';
import {
  HttpError, createFetcher, wikipediaApi, readSeeds, readState, writeState,
  runImportMode, emptyState, entitiesUrl, articleTitles, SEEDS_FILE, STATE_FILE, LEAD_CACHE,
} from '../import/wikidata.mjs';
import {
  QUEUE_SCHEMA, LOG_SCHEMA, WRITERS, QUEUE_KIND, LOG_KIND,
  emptyLog, ancestorsOf, itemsFor, locatorFor, subjectOf, isImport, verdictForEdge, writeVerdictFor,
  parentsReader, checkQueue, checkQueueLog, WIKIPEDIA_SOURCE,
} from './queue.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_DATA = path.join(ROOT, 'data');
export const DEFAULT_LOG = path.join('imports', 'queue-log.json');
export const DEFAULT_MAX = 5;

// The run name every record of this milestone's writers carries, so the
// records one writer wrote can be found again without reading a git log.
export const RUN = (writer) => `m90-writer-${writer}`;
export const EDGE_FLAGS = Object.freeze(['edge-drafted', 'queued']);

// Four exits and the routine knows all four. `network` is the one it is told
// to stop quietly on: no request left the sandbox, so there is nothing to
// report but the fact.
export const EXIT = Object.freeze({ ok: 0, hardStop: 1, usage: 2, network: 3 });
export const NETWORK_REFUSED = 'network-refused';

// The sentinel a stub directory carries to answer every request the way a
// sandbox with no network answers it. A fixture and not a flag: the test that
// asserts the tool writes nothing when the network is refused should exercise
// the same path a real refusal takes, and a flag would be a second path.
export const REFUSE_FILE = 'refuse-network';

export class NetworkRefused extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'NetworkRefused';
  }
}

// The revision named is not there: the API answered, and the answer is that it
// has no such revision. This and nothing else becomes `quote-not-found`.
export class MissingRevision extends Error {
  constructor(message) {
    super(message);
    this.name = 'MissingRevision';
  }
}

// The MediaWiki API's own words for "no such revision", answered with HTTP 200
// and an error in the body; `createFetcher` carries the code as `apiCode`.
export const MISSING_REVISION_CODES = Object.freeze(['nosuchrevid', 'badrevids']);

// Review of 12 October, finding 1. Only two answers mean the revision is not
// there: a 404 from the revision fetch, and the API's `nosuchrevid` or
// `badrevids`. Everything else is not an answer about the revision at all. Node's
// `fetch` rejects a request that never left with `TypeError: fetch failed`,
// whose `code` is undefined (the code, where there is one, is on `cause`), so a
// list of connection codes read off the error itself never matched, and a
// sandbox with no egress turned every edge into `quote-not-found` and exited 0
// with a log to commit. An error carrying a `cause` is a failure underneath,
// never the answer.
export function isMissingRevision(error) {
  if (error?.name === 'MissingRevision') return true;
  if (error?.cause !== undefined) return false;
  if (error instanceof HttpError) return error.status === 404;
  if (error instanceof TypeError || error?.name === 'BudgetError') return false;
  return MISSING_REVISION_CODES.includes(error?.apiCode);
}

// What the tool stops on rather than refuses an item for: a failure that is
// not an answer — a refusal of its own, a spent budget, any HTTP status but the
// missing revision's (403, a 429 after the retries, a 5xx), a `fetch failed`, or
// anything with a `cause`. A plain TypeError from a bug in this file is a stack
// trace and not a network refusal, which is why the revision fetch below wraps
// whatever it gets in a `NetworkRefused` rather than relying on this list.
export function isNetworkRefusal(error) {
  if (isMissingRevision(error)) return false;
  if (error?.name === 'NetworkRefused' || error?.name === 'BudgetError') return true;
  if (error instanceof HttpError) return true;
  if (error?.cause !== undefined) return true;
  if (error instanceof TypeError && /fetch failed/i.test(error.message)) return true;
  return ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH',
    'ENETUNREACH', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET',
  ].includes(error?.code);
}

// --- the revision's own text -----------------------------------------------

// The action API, the revision by `oldid`, the rendered text of the whole
// article. `prop=extracts` would be shorter and answers for the page and not
// for the revision, which is the one thing that matters here: a citation names
// a revision because that text is what was read.
export function parseUrl(revision, { lang = 'en' } = {}) {
  return `${wikipediaApi(lang)}?${new URLSearchParams({
    action: 'parse',
    format: 'json',
    formatversion: '2',
    prop: 'text',
    oldid: String(revision),
    disablelimitreport: '1',
    disableeditsection: '1',
    disabletoc: '1',
  })}`;
}

// Everything between the tags, with the parts of the page that are not the
// article's prose taken out first. The reference markers go above all: an
// article writes *"the campaign,[2] which"*, and a quote read in a browser has
// no `[2]` in it — a verbatim check against text that kept them would refuse
// every sentence with a citation in the middle of it.
const ENTITIES = Object.freeze({
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–',
  mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  hellip: '…', shy: '­',
});

export function plainText(html) {
  return String(html ?? '')
    // The reference markers, by their own class and in either order of
    // attributes, before the general drop below.
    .replace(/<sup\b[^>]*class="[^"]*\breference\b[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<(script|style|table)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<span\b[^>]*class="[^"]*\bmw-editsection\b[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
    // A block that ends is a line that ends: two sentences either side of a
    // paragraph break must not run into one word.
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name.toLowerCase()] ?? whole);
}

export async function articleText(fetcher, revision) {
  const body = await fetcher.get(parseUrl(revision));
  const parsed = body?.parse ?? {};
  const html = typeof parsed.text === 'string' ? parsed.text : parsed.text?.['*'];
  if (typeof html !== 'string' || html === '') {
    throw new MissingRevision(`no text for revision ${revision}`);
  }
  const got = Number(parsed.revid);
  if (Number.isInteger(got) && got !== revision) {
    throw new MissingRevision(`the API answered revision ${got} for oldid ${revision}`);
  }
  return plainText(html);
}

// --- the stub --------------------------------------------------------------

// `--fetcher stub:<dir>`: the same surface as `createFetcher`, answered off
// disk. `<dir>/<revision>.txt` is the article at that revision — plain text or
// the HTML the API would have answered, since `plainText` of text with no tags
// in it is itself — `<dir>/<qid>.json` is the item, and `<dir>/summary/<Article
// title>.json` is the lead the import caches. Nothing here reaches the network,
// so the tests run the tool end to end; `<dir>/refuse-network` makes every
// request answer the way a sandbox with no network answers it.
export function stubFetcher(dir) {
  let calls = 0;
  const read = async (file) => JSON.parse(await readFile(file, 'utf8'));
  return {
    get calls() { return calls; },
    get budget() { return Infinity; },
    get spent() { return false; },
    async get(url) {
      if (existsSync(path.join(dir, REFUSE_FILE))) {
        throw new NetworkRefused(`no request leaves this sandbox (${REFUSE_FILE} in ${path.basename(dir)})`);
      }
      calls += 1;
      const params = new URL(url).searchParams;
      if (params.get('action') === 'parse') {
        const revid = Number(params.get('oldid'));
        const file = path.join(dir, `${revid}.txt`);
        if (!existsSync(file)) throw new HttpError(404, url);
        return { parse: { revid, text: await readFile(file, 'utf8') } };
      }
      if (url.includes('wbgetentities')) {
        const ids = (params.get('ids') ?? '').split('|').filter(Boolean);
        const entities = {};
        for (const id of ids) {
          const file = path.join(dir, `${id}.json`);
          entities[id] = existsSync(file) ? await read(file) : { id, missing: '' };
        }
        return { entities };
      }
      if (url.includes('/api/rest_v1/page/summary/')) {
        const asked = decodeURIComponent(url.split('/summary/')[1] ?? '').replaceAll('_', ' ');
        const file = path.join(dir, 'summary', `${asked.split('/')[0]}.json`);
        if (!existsSync(file)) return {};
        return read(file);
      }
      throw new HttpError(404, url);
    },
  };
}

// --- the records this tool writes -----------------------------------------

// The envelope of
// data/edges/voyages-of-christopher-columbus--spanish-colonization-of-the-americas--enabled.json,
// which is the shape the curation fires wrote: the assistant's draft line, the
// tool and the run it came from, `edge-drafted` so the review queue knows what
// it is looking at, and `queued` so a reviewer can tell an edge a planner
// decided from one a fire read out by hand. `dispute` is null and stays null:
// a queue may not carry `disputed` at all (§3).
export function edgeRecord(edge, { from, to, writer, created }) {
  return inSchemaOrder({
    schema: 1,
    id: `${from}--${to}--${edge.type}`,
    kind: 'edge',
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: [{ name: DRAFT_AUTHOR, github: null }],
    license: 'CC-BY-SA-4.0',
    created,
    revised: null,
    review: { status: REVIEW_STATUS.draft, flags: [...EDGE_FLAGS] },
    origin: { tool: 'assistant', run: RUN(writer) },
    sources: [
      { source: WIKIPEDIA_SOURCE, locator: locatorFor(edge) },
      ...(edge.sources ?? []).map((s) => ({ source: s.source, locator: s.locator ?? null })),
    ],
    from,
    to,
    type: edge.type,
    confidence: edge.confidence,
    explanation: edge.explanation,
    dispute: null,
  }, 'edge');
}

// The same arithmetic rule 24's warning uses, and `importSpan`'s in the
// Wikidata import: a bound in historians' numbering turned into the pair of
// astronomical years it covers, with an open end reaching forward for ever.
export function spanOf(when) {
  if (!when || typeof when !== 'object') return null;
  try {
    const start = astronomicalBounds(when.start);
    return {
      from: start.min,
      to: when.end === null || when.end === undefined ? Infinity : astronomicalBounds(when.end).max,
    };
  } catch {
    return null;
  }
}

// Rule 24's checks plus the span the brief asks for: the parent is an active
// event of this atlas, and its span contains the child's start. A parent that
// fails is dropped and said so; the event stands, because a filing is a
// display fact and never the thing a record earns its place by.
//
// And the loop (review of 12 October, finding 7): a parent that is already
// inside the record — the record is among the parent's own umbrellas, read up
// the whole chain — would close a cycle of part-of, which rule 24 refuses. Only
// an `existing` item can meet it, since a new record is inside nothing, but the
// question costs nothing to ask of both. `parentsFor` reads a record's
// parents; by default the records in `byId`.
export function parentVerdict(id, child, byId, { parentsFor = (x) => parentsOf(byId.get(x) ?? {}) } = {}) {
  const refuse = (reason, detail) => ({ ok: false, reason, detail });
  const parent = byId.get(id);
  if (!parent || parent.kind !== 'event') return refuse('parent', `"${id}" is not an event record`);
  if (parent.status !== 'active') return refuse('parent', `"${id}" is a ${parent.status} event: an active event cannot be part of one (rule 24)`);
  if (child?.id && (id === child.id || ancestorsOf(id, parentsFor).has(child.id))) {
    return refuse('parent-cycle', `"${id}" is already part of "${child.id}": filing one under the other closes a loop of part-of (rule 24)`);
  }
  const whole = spanOf(parent.when);
  const part = spanOf(child.when);
  if (!whole || !part) return refuse('parent', `"${id}" or the event itself is not dated`);
  if (part.from < whole.from || part.from > whole.to) {
    return refuse('parent', `"${id}" does not contain the event's start`);
  }
  return { ok: true, reason: null, detail: null };
}

// --- the duplicate by title ------------------------------------------------

// M91 change 3. The skip by `wikidata` id cannot see an active event that
// carries none — 132 of them on 13 October 2026, records written by hand or
// before the import kept the id — so an item is also a duplicate of an active
// event whose `title`, or whose `wikipedia.en`, is the item's English article
// title, compared without case. A map from the folded title to the record.
export const foldTitle = (title) => (typeof title === 'string' ? title.trim().replace(/_/g, ' ').toLowerCase() : '');

export function titleIndex(records) {
  const byTitle = new Map();
  for (const r of records) {
    if (r?.kind !== 'event' || r.status !== 'active') continue;
    for (const title of [r.title, r.wikipedia?.en]) {
      const key = foldTitle(title);
      if (key !== '' && !byTitle.has(key)) byTitle.set(key, r.id);
    }
  }
  return byTitle;
}

// The item's English article title, read off the item as the import will read
// it (its `enwiki` sitelink), or null where it has none. One request, before
// anything is written; a failure is the fire's and never this item's.
export async function englishTitle(fetcher, qid) {
  let body;
  try {
    body = await fetcher.get(entitiesUrl([qid]));
  } catch (e) {
    if (e?.name === 'NetworkRefused') throw e;
    throw new NetworkRefused(`the item ${qid} could not be fetched: ${e?.message ?? e}`, { cause: e });
  }
  return articleTitles(body?.entities?.[qid] ?? null).en ?? null;
}

// --- the fire --------------------------------------------------------------

// What the routine is told on the network exit, and why it is not "nothing was
// written": by the time an import step refuses, this fire may have written
// earlier items, and this item's seeds and cursor.
export const NETWORK_DISCARD = 'the working tree may hold this fire\'s earlier items and import-state changes; commit nothing, discard it';

// The seeds file and the import cursor, kept as text (or as absent) before an
// item touches them, so the network exit can put them back exactly.
function importFilesKeeper(dataDir) {
  const files = [SEEDS_FILE, STATE_FILE].map((f) => path.join(dataDir, ...f.split('/')));
  let saved = null;
  return {
    async save() {
      saved = [];
      for (const file of files) saved.push([file, existsSync(file) ? await readFile(file, 'utf8') : null]);
    },
    forget() { saved = null; },
    async restore() {
      if (!saved) return;
      for (const [file, text] of saved) {
        if (text === null) await rm(file, { force: true });
        else await writeFile(file, text, 'utf8');
      }
      saved = null;
    },
  };
}

const asText = (value) => `${JSON.stringify(value, null, 2)}\n`;

async function readJson(file, fallback = null) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(await readFile(file, 'utf8'));
}

function run(command, args, cwd = ROOT) {
  return new Promise((resolve) => {
    execFile(command, args, { cwd, maxBuffer: 1 << 28 }, (error, stdout, stderr) => {
      resolve({ code: error ? (error.code ?? 1) : 0, stdout, stderr });
    });
  });
}

// One item, in the brief's own order, stopping at the first step that fails.
// Returns the log entry and what it wrote.
async function applyItem(item, {
  dataDir, cacheDir, fetcher, writer, today, fired, held, corpus, deriveRegion, importFiles,
}) {
  const refusals = [];
  const written = { event: null, edges: [], place: null };
  const entry = (status, note = null) => ({
    id: item.id, writer, fired, status, written, refusals, ...(note ? { note } : {}),
  });
  const subject = subjectOf(item);
  // What an imported item wrote, taken back off disk: the event and the place
  // the import created for it. Used where the lead could not be read and the
  // record would carry the import's placeholder (`summary-missing`).
  let record = null;
  const takeBack = async () => {
    await rm(path.join(dataDir, 'events', `${record.id}.json`), { force: true });
    if (written.place) await rm(path.join(dataDir, 'places', `${written.place}.json`), { force: true });
    corpus.byId.delete(record.id);
    corpus.records = corpus.records.filter((r) => r.id !== record.id && r.id !== written.place);
    written.event = null;
    written.place = null;
  };

  // 1. Already here, on this branch or the other. Said as a skip rather than
  //    dropped before the run, so the planner learns it and stops re-queueing.
  const byItem = new Map(corpus.records
    .filter((r) => r.kind === 'event' && typeof r.wikidata === 'string')
    .map((r) => [r.wikidata, r.id]));
  if (isImport(item)) {
    const mine = byItem.get(item.qid);
    if (mine) return entry('skipped', `${item.qid} is already the event "${mine}"`);
    // The same event under no id (M91 change 3), by its article's title.
    const title = await englishTitle(fetcher, item.qid);
    const same = title === null ? null : titleIndex(corpus.records).get(foldTitle(title));
    if (same) return entry('skipped', `${item.qid}'s article "${title}" is already the title of the active event "${same}", which carries no wikidata id of its own`);
    if (held.has(item.qid)) return entry('skipped', `${item.qid} is held by the other branch`);
  } else if (held.has(item.existing)) {
    return entry('skipped', `"${item.existing}" is held by the other branch`);
  } else if (!corpus.byId.has(item.existing)) {
    return entry('skipped', `"${item.existing}" is not a record this branch holds`);
  }

  // 2. Every edge verified before anything is imported. The questions that
  //    cost no request are asked first, so a fire does not spend a fetch on an
  //    edge it could not write whatever the revision said.
  const active = corpus.records.filter((r) => r.kind === 'event' && r.status === 'active');
  const activeEvents = new Set(active.map((r) => r.id));
  const sourceIds = new Set(corpus.records.filter((r) => r.kind === 'source').map((r) => r.id));
  const parentsFor = parentsReader(corpus.byId, { subject, parents: item.parents ?? [] });
  // A15(5)'s second half asks which events the atlas holds a sentence names,
  // so it needs every active event's names and span — the title, whatever else
  // it is called, and `when` to tell two homonyms apart (deviation 1480).
  const candidates = active.map((r) => ({
    id: r.id,
    names: [r.title, ...(r.names ?? [])].filter((n) => typeof n === 'string' && n !== ''),
    when: r.when ?? null,
  }));

  const texts = new Map();
  const standing = [];
  for (const [i, edge] of (item.edges ?? []).entries()) {
    const first = verdictForEdge(edge, { subject, activeEvents, parentsFor, sourceIds, candidates, text: null });
    if (!first.ok) {
      refusals.push({ edge: i, reason: first.reason, detail: first.detail });
      continue;
    }
    if (!texts.has(edge.revision)) {
      try {
        texts.set(edge.revision, await articleText(fetcher, edge.revision));
      } catch (e) {
        // Only the answer "no such revision" is this item's problem. Anything
        // else — a TypeError, any other status, a spent budget, an error with
        // a cause — is the fire's, and stops it with nothing logged.
        if (!isMissingRevision(e)) {
          if (e?.name === 'NetworkRefused') throw e;
          throw new NetworkRefused(`revision ${edge.revision} of "${edge.article}" could not be fetched: ${e?.message ?? e}`, { cause: e });
        }
        texts.set(edge.revision, null);
      }
    }
    const text = texts.get(edge.revision);
    if (text === null) {
      refusals.push({ edge: i, reason: 'quote-not-found', detail: `revision ${edge.revision} of "${edge.article}" could not be read` });
      continue;
    }
    const verdict = verdictForEdge(edge, { subject, activeEvents, parentsFor, sourceIds, candidates, text });
    if (!verdict.ok) {
      refusals.push({ edge: i, reason: verdict.reason, detail: verdict.detail });
      continue;
    }
    standing.push({ index: i, edge });
  }
  // No edge, no record, until 13 October 2026: the owner withdrew the bar
  // (M91), so an import item goes on to the import whatever survived above.
  // An item that changes a record already here and has neither a parent to
  // file nor an edge left to write has nothing left to do.
  if (!isImport(item) && standing.length === 0 && (item.parents ?? []).length === 0) {
    return entry('refused', 'the item neither files a parent nor writes an edge');
  }

  // 3. Import the item, one item and one batch. An `existing` item imports
  //    nothing: the record is already here and the writer may not touch its
  //    summary, its dates or its place.
  record = isImport(item) ? null : corpus.byId.get(item.existing);
  if (isImport(item)) {
    const seedsFile = path.join(dataDir, SEEDS_FILE);
    // The two import files as they were before this item, so a network exit
    // inside the import can put them back (review of 12 October, finding 3).
    await importFiles.save();
    const seeds = await readSeeds(dataDir);
    if (!seeds) throw new Error(`no ${SEEDS_FILE} under ${dataDir}: there is nothing to import with`);
    if (!(seeds.items ?? []).includes(item.qid)) {
      await writeFile(seedsFile, asText({ ...seeds, items: [...(seeds.items ?? []), item.qid] }), 'utf8');
    }
    const state = (await readState(dataDir)) ?? emptyState();
    const before = state.runs?.import ?? { updated: null, pending: [], done: [] };
    await writeState(dataDir, {
      ...state,
      runs: { ...state.runs, import: { ...before, pending: [item.qid], done: (before.done ?? []).filter((q) => q !== item.qid) } },
    });
    const { report, failed } = await runImportMode(dataDir, {
      fetcher, today, batchSize: 1, cacheDir, deriveRegion,
    });
    if (failed.length) throw new Error(`the import refused to run: ${failed.join('; ')}`);
    const made = report.created.find((c) => c.qid === item.qid && c.kind === 'event');
    if (!made) {
      const why = report.refused.find((r) => r.qid === item.qid)?.why ?? 'the import wrote no event for it';
      return entry('refused', `${item.qid}: ${why}`);
    }
    written.event = made.id;
    const place = report.created.find((c) => c.kind === 'place');
    if (place) written.place = place.id;
    record = await readJson(path.join(dataDir, 'events', `${made.id}.json`));
    corpus.byId.set(record.id, record);
    corpus.records.push(record);
    // Review of 12 October, finding 2. `runImportMode` swallows a lead it could
    // not fetch and writes the placeholder summary, which rules card 2 says a
    // record never carries. A redirect is the one record with no quote on
    // purpose; anything else with `summary: false` is taken back off disk.
    const redirected = (report.redirected ?? []).some((r) => r.qid === item.qid);
    if (made.summary === false && !redirected) {
      await takeBack();
      refusals.push({ edge: null, reason: 'summary-missing', detail: `the lead of ${item.qid} could not be read, so the record would carry the import's placeholder summary` });
      return entry('refused', `${item.qid}: no lead, so the import wrote its placeholder summary; the record and its place are off disk again`);
    }
  } else {
    written.event = record.id;
  }

  // 4. File it. The queue's list, nearest first, each parent checked; one that
  //    fails is dropped with a refusal and the rest stand. Where the queue
  //    names parents and none survives, the import's own filing is left as it
  //    is rather than taken away — a filing the queue could not improve on is
  //    still a filing.
  //    An `existing` record's own umbrellas are **kept** and the queue's are
  //    added to them: the planner's Sunday pass is for a record that came out
  //    with none, and a writer that decides nothing is not the thing to take
  //    a filing away.
  const wanted = item.parents ?? [];
  if (wanted.length) {
    const held = isImport(item) ? [] : parentsOf(record);
    const kept = [...held];
    for (const id of wanted) {
      if (kept.includes(id)) continue;
      const verdict = parentVerdict(id, record, corpus.byId);
      if (verdict.ok) kept.push(id);
      else refusals.push({ edge: null, reason: verdict.reason, detail: verdict.detail });
    }
    if (kept.length && JSON.stringify(parentsOf(record)) !== JSON.stringify(kept)) {
      record = inSchemaOrder({ ...record, parent: kept.length === 1 ? kept[0] : kept }, 'event');
      await writeFile(path.join(dataDir, 'events', `${record.id}.json`), asText(record), 'utf8');
      corpus.byId.set(record.id, record);
    }
  }

  // 5. The surviving edges, with the qid replaced by the record the import
  //    wrote. The id is derived, from--to--type (rule 2). Two questions can
  //    only be asked here, because both need the record's own id and dates:
  //    whether the edge is already held, and whether it runs forwards.
  const ids = new Set(corpus.byId.keys());
  const whenOf = (id) => corpus.byId.get(id)?.when ?? null;
  // The pairs active edges already join, so the reverse of one is refused as a
  // loop of two (review of 12 October, finding 7). Longer loops stay the
  // validator's (rule 5).
  const joined = new Set(corpus.records
    .filter((r) => r.kind === 'edge' && r.status === 'active')
    .map((r) => `${r.from}\u0000${r.to}`));
  const reverse = (from, to) => joined.has(`${to}\u0000${from}`);
  await mkdir(path.join(dataDir, 'edges'), { recursive: true });
  for (const { index, edge } of standing) {
    const from = edge.from === subject ? record.id : edge.from;
    const to = edge.to === subject ? record.id : edge.to;
    const verdict = writeVerdictFor(edge, { from, to, whenOf, ids, reverse });
    if (!verdict.ok) {
      refusals.push({ edge: index, reason: verdict.reason, detail: verdict.detail });
      continue;
    }
    const built = edgeRecord(edge, { from, to, writer, created: today });
    await writeFile(path.join(dataDir, 'edges', `${built.id}.json`), asText(built), 'utf8');
    written.edges.push(built.id);
    ids.add(built.id);
    corpus.byId.set(built.id, built);
    corpus.records.push(built);
  }
  // An item whose every edge fell, here or before the import, keeps its
  // record since M91: `written`, with no edge and its refusals listed.
  // `partial` keeps its meaning — the event and some of its edges.
  return entry(refusals.length && written.edges.length ? 'partial' : 'written');
}

// The record ids a fire's citations are on: the event and the edges each entry
// wrote. What `cache-evidence.mjs --only` is handed at the end of the fire.
export function fireCitations(entries) {
  const ids = new Set();
  for (const entry of entries ?? []) {
    if (entry?.written?.event) ids.add(entry.written.event);
    for (const id of entry?.written?.edges ?? []) ids.add(id);
  }
  return [...ids];
}

// The whole fire. Returns what it did and what it would have the process exit
// with; it writes records, the log and the index, and commits nothing.
export async function applyQueue({
  dataDir = DEFAULT_DATA,
  queueFile,
  logFile = null,
  writer,
  max = DEFAULT_MAX,
  heldFile = null,
  fetcher = null,
  today = new Date().toISOString().slice(0, 10),
  fired = `${new Date().toISOString().slice(0, 16)}Z`,
  cacheDir = path.join(ROOT, LEAD_CACHE),
  offline = false,
  finish = true,
} = {}) {
  const log = logFile ?? path.join(dataDir, DEFAULT_LOG);
  const queue = await readJson(queueFile);
  if (queue === null) return { exit: EXIT.usage, problems: [`no queue at ${queueFile}`], entries: [] };
  const logged = (await readJson(log)) ?? emptyLog();
  const listed = heldFile && existsSync(heldFile)
    ? (await readFile(heldFile, 'utf8')).split('\n').map((l) => l.trim()).filter(Boolean)
    : [];

  const { entries: read, problems } = await readRecords(dataDir);
  if (problems.length) {
    return { exit: EXIT.hardStop, problems: problems.map((p) => `${p.file}: ${p.message}`), entries: [] };
  }
  const records = read.map((e) => ({ ...e.record }));
  const corpus = { records, byId: new Map(records.map((r) => [r.id, r])) };
  // M91 change 6. The routine's `--held` list is every event id and qid on the
  // other branch, and a record that came from m0 is on both: writer A's fire
  // of 12 October, 23:20Z, logged three `existing` items "held by the other
  // branch" for that reason. Held means held there **and not here** — the
  // other lane's unlanded records. An `existing` record present here is this
  // writer's to edit, and an import already here is a duplicate (step 1), not
  // something the other branch holds.
  const here = new Set(records.filter((r) => r.kind === 'event')
    .flatMap((r) => [r.id, ...(typeof r.wikidata === 'string' ? [r.wikidata] : [])]));
  const held = new Set(listed.filter((id) => !here.has(id)));
  // Review of 12 October, finding 5. `--max` counts the items this fire can
  // write. An item the other branch holds is taken too, in the queue's order,
  // so it is logged `skipped` and the planner stops re-queueing it — but it
  // takes no slot, or five held items at the head of the queue would make a
  // fire that writes nothing.
  const writable = new Set(itemsFor(queue, writer, { logs: [logged], held: [...held], max }));
  const items = itemsFor(queue, writer, { logs: [logged] })
    .filter((item) => writable.has(item) || held.has(subjectOf(item)));
  if (items.length === 0) return { exit: EXIT.ok, problems: [], entries: [], empty: true };

  const polygons = await readRegionPolygons(dataDir);
  const deriveRegion = polygons ? createRegionDeriver(polygons) : null;

  const entries = [];
  const importFiles = importFilesKeeper(dataDir);
  for (const item of items) {
    let entry;
    try {
      entry = await applyItem(item, {
        dataDir, cacheDir, fetcher, writer, today, fired, held, corpus, deriveRegion, importFiles,
      });
    } catch (e) {
      if (isNetworkRefusal(e)) {
        // Not "nothing reached disk". The quotes are verified before the
        // import, but the earlier items of this fire are on disk, and a refusal
        // inside the import comes after the seeds and the cursor were written
        // for this one — and possibly after a record or a lead. The two import
        // files are put back as they were before this item; everything else is
        // for the routine to throw away, which is what the message tells it.
        await importFiles.restore();
        return {
          exit: EXIT.network,
          problems: [`${NETWORK_REFUSED}: ${NETWORK_DISCARD} (${e.message})`],
          entries,
        };
      }
      throw e;
    }
    importFiles.forget();
    entries.push(entry);
    await mkdir(path.dirname(log), { recursive: true });
    await writeFile(log, asText({ ...logged, entries: [...(logged.entries ?? []), ...entries] }), 'utf8');
  }

  if (!finish) return { exit: EXIT.ok, problems: [], entries };

  // 6. The index, then the validator, then the recache (rules card 14, 15).
  //    An error from the validator is a hard stop: the records are on disk for
  //    somebody to read and nothing is committed.
  const built = await run(process.execPath, [path.join(ROOT, 'tools', 'build-index.mjs'), '--data', dataDir]);
  if (built.code !== 0) {
    return { exit: EXIT.hardStop, problems: [`build-index: ${built.stderr.trim() || built.stdout.trim()}`], entries };
  }
  const checked = await run(process.execPath, [path.join(ROOT, 'tools', 'validate.mjs'), '--data', dataDir, '--index']);
  if (checked.code !== 0) {
    return { exit: EXIT.hardStop, problems: [`validate --index: ${checked.stdout.trim()}\n${checked.stderr.trim()}`], entries };
  }
  // A15(2), the last step of every batch, over this fire's own citations
  // (review of 12 October, finding 4): `--only` names the events and edges the
  // fire wrote. Filling needs the network, so a fire run against a stub asks
  // the scoped report and does not pretend to have filled anything.
  const ids = fireCitations(entries);
  if (ids.length === 0) {
    return { exit: EXIT.ok, problems: [], entries, recache: 'skipped: this fire wrote no record, so it cites nothing' };
  }
  const scratch = await mkdtemp(path.join(tmpdir(), 'atlas-recache-'));
  const onlyFile = path.join(scratch, 'only.json');
  await writeFile(onlyFile, asText(ids), 'utf8');
  const recache = await run(process.execPath, [
    path.join(ROOT, 'tools', 'cache-evidence.mjs'), ...(offline ? [] : ['--fill']),
    '--only', onlyFile, '--data', dataDir, '--cache', cacheDir,
  ]);
  await rm(scratch, { recursive: true, force: true });
  return { exit: EXIT.ok, problems: [], entries, recache: recache.stdout.trim() };
}

// --- --check ---------------------------------------------------------------

// What the planner runs before it pushes: the file against its schema and
// against the rules a schema cannot make. It reads data/regions.json for the
// lane vocabulary and nothing else of the corpus.
export async function checkFile(file, { dataDir = DEFAULT_DATA, schemaDir = path.join(ROOT, 'schema') } = {}) {
  const value = await readJson(file);
  if (value === null) return [`no file at ${file}`];
  const kind = value?.kind;
  if (kind !== QUEUE_KIND && kind !== LOG_KIND) {
    return [`${file}: "${kind}" is neither ${QUEUE_KIND} nor ${LOG_KIND}`];
  }
  const validator = createValidator(await readSchemaFiles(schemaDir));
  const schema = kind === QUEUE_KIND ? QUEUE_SCHEMA : LOG_SCHEMA;
  const regions = existsSync(dataDir) ? await readRegions(dataDir) : null;
  const errors = validator.validate(schema, value).map((e) => `${file}${e.path}: ${e.message}`);
  const checks = kind === QUEUE_KIND
    ? checkQueue(file, value, { regions: regions?.length ? regions : null })
    : checkQueueLog(file, value);
  return [...errors, ...checks.map((p) => `${file}${p.path}: ${p.message}`)];
}

// --- the command line ------------------------------------------------------

export const USAGE = 'usage: node tools/queue/apply.mjs --queue <file> --writer A|B'
  + ' [--max 5] [--data <dir>] [--log <file>] [--held <file>] [--fetcher stub:<dir>] [--cache <dir>] [--json]\n'
  + '       node tools/queue/apply.mjs --check <file> [--data <dir>]';

export async function main(argv) {
  let queueFile = null;
  let checkTarget = null;
  let writer = null;
  let dataDir = DEFAULT_DATA;
  let logFile = null;
  let heldFile = null;
  let fetcherArg = null;
  let cacheDir = null;
  let max = DEFAULT_MAX;
  let asJson = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--queue') queueFile = path.resolve(argv[++i]);
    else if (arg === '--check') checkTarget = path.resolve(argv[++i]);
    else if (arg === '--writer') writer = argv[++i];
    else if (arg === '--data') dataDir = path.resolve(argv[++i]);
    else if (arg === '--log') logFile = path.resolve(argv[++i]);
    else if (arg === '--held') heldFile = path.resolve(argv[++i]);
    else if (arg === '--fetcher') fetcherArg = argv[++i];
    else if (arg === '--cache') cacheDir = path.resolve(argv[++i]);
    else if (arg === '--max') max = Number(argv[++i]);
    else if (arg === '--json') asJson = true;
    else {
      console.error(`unknown argument ${arg}\n${USAGE}`);
      return EXIT.usage;
    }
  }
  if (checkTarget) {
    const problems = await checkFile(checkTarget, { dataDir });
    for (const problem of problems) console.error(problem);
    if (!problems.length) console.log(`${path.relative(ROOT, checkTarget)}: ok`);
    return problems.length ? EXIT.hardStop : EXIT.ok;
  }
  if (!queueFile || !WRITERS.includes(writer)) {
    console.error(USAGE);
    return EXIT.usage;
  }
  if (!Number.isInteger(max) || max < 1) {
    console.error('--max takes a positive integer');
    return EXIT.usage;
  }
  let fetcher = null;
  if (fetcherArg) {
    if (!fetcherArg.startsWith('stub:')) {
      console.error(`--fetcher takes stub:<dir> and nothing else, not ${JSON.stringify(fetcherArg)}`);
      return EXIT.usage;
    }
    fetcher = stubFetcher(path.resolve(fetcherArg.slice('stub:'.length)));
  }

  let result;
  try {
    result = await applyQueue({
      dataDir, queueFile, logFile, writer, max, heldFile,
      // A stub answers off disk, so this fire has no network of its own and
      // the recache is not pretended to have run.
      fetcher: fetcher ?? createFetcher(),
      offline: Boolean(fetcher),
      ...(cacheDir ? { cacheDir } : {}),
    });
  } catch (e) {
    // A stack trace is not a refusal: the routine is told to stop and say so
    // with the trace rather than write anything.
    console.error(`error: ${e.stack ?? e.message}`);
    return EXIT.hardStop;
  }
  if (asJson) {
    console.log(JSON.stringify(result, null, 1));
  } else {
    if (result.empty) console.log('queue empty: no item for this writer that a log has not answered');
    for (const entry of result.entries) {
      console.log(`${entry.id} ${entry.status}`
        + `${entry.written.event ? ` event ${entry.written.event}` : ''}`
        + `${entry.written.edges.length ? ` edges ${entry.written.edges.join(', ')}` : ''}`);
      for (const r of entry.refusals) console.log(`  ! ${r.reason}${r.edge === null ? '' : ` (edge ${r.edge})`}: ${r.detail}`);
    }
    if (result.recache) console.log(`recache: ${result.recache.split('\n')[0]}`);
    for (const problem of result.problems) console.error(problem);
  }
  return result.exit;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
