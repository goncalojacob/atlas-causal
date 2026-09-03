#!/usr/bin/env node
// Scaffolds one record file with the envelope filled in. The text fields
// are left for a person: this tool never writes a summary, an explanation
// or a dispute. It refuses to overwrite.
//
//   node tools/new-record.mjs event <id> --title "…" --start 1415 [--end 1415]
//        [--place lisbon | --new-place ceuta --label "Ceuta" --lon -5.319 --lat 35.889]
//        [--region europe]
//   node tools/new-record.mjs place <id> --names "Lisbon; Lisboa" --lon -9.14 --lat 38.72
//        [--precision city] [--region europe]
//   node tools/new-record.mjs edge <from> <to> <type> [--confidence probable] [--source <id>]
//   node tools/new-record.mjs actor <id> --type person --names "Salazar; António de Oliveira Salazar"
//        --start 1889 [--end 1970 | --end null] [--lon -8.1 --lat 40.5 --label "Santa Comba Dão"]
//   node tools/new-record.mjs source <id> --type book --title "…" --creators "A; B"
//        [--year 2000 --publisher "…" --isbn … --doi … --url … --accessed YYYY-MM-DD
//         --repository "…" --reference "…"]
//   common: --author "Name" --github handle --source <source-id> (repeatable) --data <dir>

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ACTOR_TYPES, EDGE_TYPES, SLUG } from '../src/validate/rules.js';
import { KIND_DIRS } from './lib/read.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_DATA = path.join(ROOT, 'data');

function parse(argv) {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const value = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      if (key === 'source') (options.source ??= []).push(value);
      else options[key] = value;
    } else positional.push(a);
  }
  return { positional, options };
}

function gitConfig(key) {
  try {
    return execFileSync('git', ['config', '--get', key], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch {
    return null;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function int(value, name) {
  if (value === undefined || value === true) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n)) throw new Error(`--${name} must be an integer year`);
  return n;
}

function num(value, name) {
  if (value === undefined || value === true) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`--${name} must be a number`);
  return n;
}

export function scaffold(kind, positional, options) {
  const name = options.author ?? gitConfig('user.name') ?? 'TODO';
  const github = options.github ?? gitConfig('github.user') ?? null;
  const sources = (options.source ?? []).map((source) => ({ source, locator: null }));
  const envelope = (id) => ({
    schema: 1,
    id,
    kind,
    status: 'active',
    supersededBy: null,
    aliases: [],
    authors: [{ name, github }],
    license: 'CC-BY-SA-4.0',
    created: today(),
    revised: null,
  });

  if (kind === 'event') {
    const [id] = positional;
    if (!id || !SLUG.test(id)) throw new Error('event needs a slug id');
    const start = int(options.start, 'start');
    if (start === undefined) throw new Error('event needs --start <year>');
    const end = options.end === 'null' ? null : (int(options.end, 'end') ?? start);
    const place = typeof options.place === 'string' ? options.place
      : typeof options['new-place'] === 'string' ? options['new-place']
        : null;
    if (place !== null && !SLUG.test(place)) throw new Error('--place and --new-place take a slug place id');
    return {
      ...envelope(id),
      sources,
      title: options.title ?? '',
      summary: '',
      when: { start, end },
      place,
      region: options.region ?? null,
      actors: [],
    };
  }

  if (kind === 'place') {
    const [id] = positional;
    if (!id || !SLUG.test(id)) throw new Error('place needs a slug id');
    const lon = num(options.lon, 'lon');
    const lat = num(options.lat, 'lat');
    if (lon === undefined || lat === undefined) throw new Error('place needs --lon and --lat');
    const names = typeof options.names === 'string'
      ? options.names.split(';').map((s) => s.trim()).filter(Boolean)
      : typeof options.label === 'string' ? [options.label] : [];
    return {
      ...envelope(id),
      // A place is a geographic fact and cites nothing (rule 6); --source is
      // accepted anyway, for the place whose location is itself argued over.
      sources,
      names,
      where: { lon, lat, precision: options.precision ?? 'city', label: names[0] ?? '' },
      region: options.region ?? null,
      summary: null,
    };
  }

  if (kind === 'edge') {
    const [from, to, type] = positional;
    if (!from || !to || !type) throw new Error('edge needs <from> <to> <type>');
    if (!EDGE_TYPES.includes(type)) throw new Error(`type must be one of ${EDGE_TYPES.join(', ')}`);
    const confidence = options.confidence ?? 'probable';
    return {
      ...envelope(`${from}--${to}--${type}`),
      sources,
      from,
      to,
      type,
      confidence,
      explanation: '',
      dispute: confidence === 'disputed' ? { text: '', sources: [] } : null,
    };
  }

  if (kind === 'actor') {
    const [id] = positional;
    if (!id || !SLUG.test(id)) throw new Error('actor needs a slug id');
    const actorType = options.type ?? 'person';
    if (!ACTOR_TYPES.includes(actorType)) throw new Error(`--type must be one of ${ACTOR_TYPES.join(', ')}`);
    const start = int(options.start, 'start');
    if (start === undefined) throw new Error('actor needs --start <year>');
    // `--end null` is an actor that has not ended: a living person, a state
    // that still exists.
    const end = options.end === 'null' ? null : (int(options.end, 'end') ?? start);
    const lon = num(options.lon, 'lon');
    const lat = num(options.lat, 'lat');
    return {
      ...envelope(id),
      sources,
      actorType,
      names: typeof options.names === 'string' ? options.names.split(';').map((s) => s.trim()).filter(Boolean) : [],
      summary: '',
      when: { start, end },
      where: lon !== undefined && lat !== undefined
        ? { lon, lat, precision: options.precision ?? 'city', label: options.label ?? '' }
        : null,
    };
  }

  if (kind === 'source') {
    const [id] = positional;
    if (!id || !SLUG.test(id)) throw new Error('source needs a slug id');
    const str = (key) => (typeof options[key] === 'string' ? options[key] : null);
    return {
      ...envelope(id),
      type: options.type ?? 'book',
      creators: typeof options.creators === 'string' ? options.creators.split(';').map((s) => s.trim()).filter(Boolean) : [],
      title: options.title ?? '',
      year: int(options.year, 'year') ?? null,
      publisher: str('publisher'),
      isbn: str('isbn'),
      doi: str('doi'),
      url: str('url'),
      accessed: str('accessed'),
      repository: str('repository'),
      reference: str('reference'),
    };
  }

  throw new Error(`kind must be event, edge, source, actor or place, not "${kind}"`);
}

// One command may write two files: an event and the place it happens at, when
// that place does not exist yet. Nothing else scaffolds more than itself.
export function scaffoldAll(kind, positional, options) {
  const records = [scaffold(kind, positional, options)];
  if (kind === 'event' && typeof options['new-place'] === 'string') {
    records.unshift(scaffold('place', [options['new-place']], options));
  }
  return records;
}

async function main(argv) {
  const { positional, options } = parse(argv);
  const [kind, ...rest] = positional;
  let records;
  try {
    records = scaffoldAll(kind, rest, options);
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  const dataDir = options.data ? path.resolve(options.data) : DEFAULT_DATA;
  const planned = records.map((record) => {
    const dir = path.join(dataDir, KIND_DIRS[record.kind]);
    return { record, dir, file: path.join(dir, `${path.basename(record.id)}.json`) };
  });
  for (const item of planned) {
    if (existsSync(item.file)) {
      console.error(`refusing to overwrite ${item.file}`);
      return 1;
    }
  }
  for (const item of planned) {
    await mkdir(item.dir, { recursive: true });
    await writeFile(item.file, `${JSON.stringify(item.record, null, 2)}\n`, 'utf8');
    console.log(path.relative(process.cwd(), item.file));
  }
  console.log('now write the text, then run node tools/validate.mjs');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
