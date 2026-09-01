// Cross-record invariants 2–15 from ARCHITECTURE.md, plus the three
// warnings. Pure: takes the records under validation and a topology object
// (the same shape build-index.mjs emits), so the browser form can run it
// against the loaded index. Rule 1 (schema) lives in core.js; rule 16
// (index freshness) in tools/validate.mjs, because it needs the disk.
//
// Records under validation may override topology entries with the same id
// (a correction), so the "universe" is topology ∪ records with records
// winning. Errors are only reported on records under validation; topology
// entries were validated when they were merged.

import { isValidYear, astronomicalBounds, defaultCalendar } from '../util/dates.js';

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const EDGE_TYPES = Object.freeze(['caused', 'enabled', 'reacted-to', 'precondition-of', 'inspired']);
export const EDGE_ID = /^([a-z0-9]+(?:-[a-z0-9]+)*)--([a-z0-9]+(?:-[a-z0-9]+)*)--(caused|enabled|reacted-to|precondition-of|inspired)$/;
export const CONFIDENCE_ORDER = Object.freeze(['consensus', 'probable', 'disputed']);
export const ALLOWED_LICENSES = Object.freeze({
  event: ['CC-BY-SA-4.0'],
  edge: ['CC-BY-SA-4.0'],
  source: ['CC-BY-SA-4.0'],
});
// "Non-trivial" text for explanation and dispute: an argument, not a label.
export const MIN_TEXT_LENGTH = 40;
export const HTTP_URL = /^https?:\/\/\S+$/;

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function nonTrivial(text) {
  return typeof text === 'string' && text.trim().length >= MIN_TEXT_LENGTH;
}

// "Peter Russell", "RUSSELL, Peter" and "Peter  Russell" are one author.
function nameKey(name) {
  return String(name)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .sort()
    .join(' ');
}

function citations(record) {
  const list = [];
  for (const c of record.sources ?? []) list.push(c.source);
  if (isObject(record.dispute)) for (const c of record.dispute.sources ?? []) list.push(c.source);
  return list;
}

export function checkRules(records, topology = {}) {
  const errors = [];
  const warnings = [];
  const error = (rule, record, path, message) => {
    errors.push({ level: 'error', rule, id: record?.id ?? null, kind: record?.kind ?? null, path, message });
  };
  const warning = (code, record, message) => {
    warnings.push({ level: 'warning', rule: code, id: record?.id ?? null, kind: record?.kind ?? null, path: '', message });
  };

  // --- the universe -------------------------------------------------------
  const universe = new Map();
  const add = (kind, entry, own) => universe.set(entry.id, { kind, entry, own });
  for (const e of topology.events ?? []) add('event', e, false);
  for (const e of topology.edges ?? []) add('edge', e, false);
  for (const s of topology.sources ?? []) add('source', s, false);

  const ownIds = new Set();
  for (const r of records) {
    if (ownIds.has(r.id)) {
      error(2, r, '/id', `duplicate id "${r.id}" among the records under validation`);
      continue;
    }
    ownIds.add(r.id);
    add(r.kind, r, true);
  }
  const own = records.filter((r) => universe.get(r.id)?.entry === r);
  const regionIds = new Set((topology.regions ?? []).map((r) => r.id));

  const lookup = (id, kind) => {
    const u = universe.get(id);
    return u && u.kind === kind ? u.entry : null;
  };
  const activeEdges = [...universe.values()].filter((u) => u.kind === 'edge' && u.entry.status === 'active').map((u) => u.entry);

  // --- rule 2: ids and aliases --------------------------------------------
  const aliasOwners = new Map();
  for (const [id, u] of universe) {
    for (const alias of u.entry.aliases ?? []) {
      if (!aliasOwners.has(alias)) aliasOwners.set(alias, []);
      aliasOwners.get(alias).push(id);
    }
  }
  for (const r of own) {
    if (r.kind === 'edge') {
      const m = EDGE_ID.exec(r.id);
      if (!m) error(2, r, '/id', 'edge id must have the shape from--to--type');
      else if (m[1] !== r.from || m[2] !== r.to || m[3] !== r.type) {
        error(2, r, '/id', `edge id must be derived from its fields: expected "${r.from}--${r.to}--${r.type}"`);
      }
    } else if (!SLUG.test(r.id)) {
      error(2, r, '/id', 'id must be a slug: lowercase letters, digits and single hyphens');
    }
    const others = (aliasOwners.get(r.id) ?? []).filter((id) => id !== r.id);
    if (others.length) {
      error(2, r, '/id', `id "${r.id}" is already an alias of ${others.join(', ')}`);
    }
    (r.aliases ?? []).forEach((alias, i) => {
      if (alias === r.id) error(2, r, `/aliases/${i}`, 'an alias cannot equal the record\'s own id');
      if (universe.has(alias)) error(2, r, `/aliases/${i}`, `alias "${alias}" is the id of another record`);
      const owners = aliasOwners.get(alias).filter((id) => id !== r.id);
      if (owners.length) error(2, r, `/aliases/${i}`, `alias "${alias}" is also an alias of ${owners.join(', ')}`);
      if ((r.aliases ?? []).indexOf(alias) !== i) error(2, r, `/aliases/${i}`, `alias "${alias}" repeated`);
    });
  }

  // --- rule 3: references resolve -----------------------------------------
  for (const r of own) {
    if (r.kind === 'edge') {
      if (!lookup(r.from, 'event')) error(3, r, '/from', `"${r.from}" is not an event`);
      if (!lookup(r.to, 'event')) error(3, r, '/to', `"${r.to}" is not an event`);
    }
    (r.sources ?? []).forEach((c, i) => {
      if (!lookup(c.source, 'source')) error(3, r, `/sources/${i}/source`, `"${c.source}" is not a source record`);
    });
    if (isObject(r.dispute)) {
      (r.dispute.sources ?? []).forEach((c, i) => {
        if (!lookup(c.source, 'source')) error(3, r, `/dispute/sources/${i}/source`, `"${c.source}" is not a source record`);
      });
    }
    if (r.supersededBy !== null && r.supersededBy !== undefined) {
      if (r.supersededBy === r.id) error(3, r, '/supersededBy', 'a record cannot supersede itself');
      else if (!lookup(r.supersededBy, r.kind)) error(3, r, '/supersededBy', `"${r.supersededBy}" is not a ${r.kind}`);
    }
    if (r.kind === 'event' && typeof r.region === 'string' && !regionIds.has(r.region)) {
      error(3, r, '/region', `"${r.region}" is not in regions.json`);
    }
  }

  // --- rule 15: years (checked before 4 and 5, which assume sane bounds) --
  const saneWhen = new Set();
  const checkBound = (r, path, bound) => {
    const b = Number.isInteger(bound) ? { min: bound, max: bound } : bound;
    if (!isObject(b) || !isValidYear(b.min) || !isValidYear(b.max)) {
      error(15, r, path, 'years must be non-zero integers (no year 0)');
      return null;
    }
    const a = astronomicalBounds(b);
    if (a.min > a.max) {
      error(15, r, path, 'min must not be after max');
      return null;
    }
    return a;
  };
  for (const r of own) {
    if (r.kind === 'event' && isObject(r.when)) {
      const start = checkBound(r, '/when/start', r.when.start);
      const end = r.when.end === null ? null : checkBound(r, '/when/end', r.when.end);
      if (start && end && (end.min < start.min || end.max < start.max)) {
        error(15, r, '/when/end', 'end must not be before start');
      } else if (start && (end || r.when.end === null)) {
        saneWhen.add(r.id);
      }
    }
    if (r.kind === 'source' && r.year !== null && r.year !== undefined && !isValidYear(r.year)) {
      error(15, r, '/year', 'year must be a non-zero integer');
    }
  }
  const whenOf = (id) => {
    const e = lookup(id, 'event');
    if (!e || !isObject(e.when)) return null;
    const u = universe.get(id);
    if (u.own && !saneWhen.has(id)) return null;
    try {
      return {
        start: astronomicalBounds(e.when.start),
        end: e.when.end === null ? null : astronomicalBounds(e.when.end),
        date: typeof e.when.date === 'string' ? e.when.date : null,
        calendar: e.when.calendar ?? null,
      };
    } catch {
      return null;
    }
  };

  // --- rule 4: arrow of time ----------------------------------------------
  for (const r of own) {
    if (r.kind !== 'edge') continue;
    const from = whenOf(r.from);
    const to = whenOf(r.to);
    if (!from || !to) continue;
    if (from.start.min > to.start.max) {
      error(4, r, '', `arrow of time: "${r.from}" cannot start after "${r.to}"`);
      continue;
    }
    if (from.start.max > to.start.min) {
      warning('strict-arrow', r, `"${r.from}" may start after "${r.to}": the intervals overlap (lenient bound passes)`);
    }
    // Same exact year at both ends: the day decides, when both records give
    // one in the same calendar.
    const sameYear = from.start.min === from.start.max && to.start.min === to.start.max && from.start.min === to.start.min;
    if (sameYear && from.date && to.date) {
      const fromEvent = lookup(r.from, 'event');
      const toEvent = lookup(r.to, 'event');
      const calFrom = from.calendar ?? defaultCalendar(Number.isInteger(fromEvent.when.start) ? fromEvent.when.start : fromEvent.when.start.min);
      const calTo = to.calendar ?? defaultCalendar(Number.isInteger(toEvent.when.start) ? toEvent.when.start : toEvent.when.start.min);
      if (calFrom === calTo && from.date > to.date) {
        error(4, r, '', `arrow of time: "${r.from}" (${from.date}) is dated after "${r.to}" (${to.date}) in the same year`);
      }
    }
  }

  // --- rule 5: the active graph is a DAG ----------------------------------
  {
    const nodes = new Set();
    const out = new Map();
    const indegree = new Map();
    for (const e of activeEdges) {
      const a = lookup(e.from, 'event');
      const b = lookup(e.to, 'event');
      if (!a || !b) continue;
      nodes.add(e.from);
      nodes.add(e.to);
      if (!out.has(e.from)) out.set(e.from, []);
      out.get(e.from).push(e.to);
      indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1);
    }
    const queue = [...nodes].filter((n) => !indegree.get(n));
    const seen = new Set();
    while (queue.length) {
      const n = queue.pop();
      seen.add(n);
      for (const m of out.get(n) ?? []) {
        indegree.set(m, indegree.get(m) - 1);
        if (indegree.get(m) === 0) queue.push(m);
      }
    }
    const stuck = [...nodes].filter((n) => !seen.has(n)).sort();
    if (stuck.length) {
      const culprit = activeEdges.find((e) => universe.get(e.id)?.own && stuck.includes(e.from) && stuck.includes(e.to)) ?? null;
      error(5, culprit, '', `the edge graph has a cycle through: ${stuck.join(', ')}`);
    }
  }

  // --- rules 6, 7, 8, 9, 14: per-record content ---------------------------
  for (const r of own) {
    if (r.kind === 'event' || r.kind === 'edge') {
      if (!Array.isArray(r.sources) || r.sources.length === 0) {
        error(6, r, '/sources', `every ${r.kind} cites at least one source`);
      }
    }
    if (r.kind === 'edge') {
      if (!nonTrivial(r.explanation)) {
        error(7, r, '/explanation', `explanation must be a real argument (at least ${MIN_TEXT_LENGTH} characters)`);
      }
      const hasDispute = isObject(r.dispute);
      if (r.confidence === 'disputed') {
        if (!hasDispute) error(8, r, '/dispute', 'a disputed edge must carry dispute { text, sources }');
        else {
          if (!nonTrivial(r.dispute.text)) error(8, r, '/dispute/text', `dispute.text must say who disagrees and why (at least ${MIN_TEXT_LENGTH} characters)`);
          if (!Array.isArray(r.dispute.sources) || r.dispute.sources.length === 0) {
            error(8, r, '/dispute/sources', 'a dispute cites the dissenting sources');
          }
        }
      } else if (hasDispute) {
        error(8, r, '/dispute', `an edge with a dispute block must be marked disputed, not ${r.confidence}`);
      }
      if (r.confidence === 'consensus') {
        const cited = (r.sources ?? []).map((c) => lookup(c.source, 'source')).filter(Boolean);
        const keys = cited.map((s) => new Set((s.creators ?? []).map(nameKey).filter(Boolean)));
        let independent = false;
        for (let i = 0; i < keys.length && !independent; i += 1) {
          for (let j = i + 1; j < keys.length; j += 1) {
            if (keys[i].size && keys[j].size && [...keys[i]].every((k) => !keys[j].has(k))) {
              independent = true;
              break;
            }
          }
        }
        if (!independent) {
          error(9, r, '/sources', 'consensus requires at least two cited sources by different authors');
        }
      }
    }
    if (r.kind === 'event' && Array.isArray(r.actors) && r.actors.length > 0) {
      error(14, r, '/actors', 'actors must stay empty until data/actors/ exists');
    }
  }

  // --- rule 10: place and region ------------------------------------------
  for (const r of own) {
    if (r.kind !== 'event') continue;
    const where = isObject(r.where) ? r.where : null;
    if (where) {
      if (typeof where.lon !== 'number' || where.lon < -180 || where.lon > 180) error(10, r, '/where/lon', 'longitude must be within [-180, 180]');
      if (typeof where.lat !== 'number' || where.lat < -90 || where.lat > 90) error(10, r, '/where/lat', 'latitude must be within [-90, 90]');
    } else if (typeof r.region !== 'string') {
      error(10, r, '/region', 'region is required when where is absent');
    }
  }

  // --- rule 11: status ----------------------------------------------------
  for (const r of own) {
    if (r.status === 'merged' && (r.supersededBy === null || r.supersededBy === undefined)) {
      error(11, r, '/supersededBy', 'a merged record names the record that supersedes it');
    }
    if (r.status === 'active' && r.supersededBy !== null && r.supersededBy !== undefined) {
      error(11, r, '/supersededBy', 'an active record is not superseded');
    }
    if (r.kind === 'event' && r.status !== 'active') {
      for (const e of activeEdges) {
        if (e.from === r.id || e.to === r.id) {
          error(11, r, '', `${r.status} event still has an active edge: ${e.id}`);
        }
      }
    }
    if (r.kind === 'edge' && r.status === 'active') {
      for (const end of ['from', 'to']) {
        const ev = lookup(r[end], 'event');
        if (ev && ev.status !== 'active') error(11, r, `/${end}`, `an active edge cannot reference the ${ev.status} event "${ev.id}"`);
      }
    }
    if (r.status === 'active') {
      citations(r).forEach((id) => {
        const s = lookup(id, 'source');
        if (s && s.status !== 'active') error(11, r, '', `an active record cannot cite the ${s.status} source "${id}"`);
      });
    }
  }

  // --- rule 12: licence per directory, authors ----------------------------
  for (const r of own) {
    const allowed = ALLOWED_LICENSES[r.kind] ?? [];
    if (!allowed.includes(r.license)) {
      error(12, r, '/license', `records under data/${r.kind}s/ must be licensed ${allowed.join(' or ')}`);
    }
    if (!Array.isArray(r.authors) || r.authors.length === 0) {
      error(12, r, '/authors', 'authors must name at least one contributor');
    }
  }

  // --- rule 13: source identifiers ----------------------------------------
  for (const r of own) {
    if (r.kind !== 'source') continue;
    const has = (k) => typeof r[k] === 'string' && r[k].length > 0;
    if (!Array.isArray(r.creators) || r.creators.length === 0) {
      error(13, r, '/creators', 'a source names the authors of the work');
    }
    if (has('url') && !HTTP_URL.test(r.url)) error(13, r, '/url', 'url must be http(s)');
    switch (r.type) {
      case 'primary':
        if (!has('repository') || !has('reference')) {
          error(13, r, '', 'a primary source needs repository and reference');
        }
        break;
      case 'web':
        if (!has('url')) error(13, r, '/url', 'a web source needs a url, preferably an archive URL');
        if (!has('accessed')) error(13, r, '/accessed', 'a web source records the date it was accessed');
        break;
      default:
        if (!has('isbn') && !has('doi') && !has('url')) {
          error(13, r, '', `a ${r.type} needs at least one resolvable identifier: isbn, doi or url`);
        }
    }
  }

  // --- warnings: degree zero, no citers -----------------------------------
  const degree = new Map();
  for (const e of activeEdges) {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }
  const cited = new Set();
  for (const r of own) {
    if (r.status === 'active') citations(r).forEach((id) => cited.add(id));
  }
  for (const r of own) {
    if (r.kind === 'event' && r.status === 'active' && !degree.get(r.id)) {
      warning('degree-zero', r, 'event has no edges');
    }
    if (r.kind === 'source' && r.status === 'active' && !cited.has(r.id)) {
      warning('no-citers', r, 'source is cited by nothing under validation');
    }
  }

  return { errors, warnings };
}
