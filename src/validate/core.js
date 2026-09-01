// validate(records, topology, schemas) → { errors, warnings }. Pure: runs in
// Node (tools/validate.mjs) and in the browser (the contribution form,
// later). Rule 1 is here — every record against its kind's v1 schema —
// and rules 2–15 are in rules.js. Records that fail their schema are kept
// out of the rules pass: the rules assume the shapes the schema guarantees.

import { createValidator } from './schema.js';
import { checkRules } from './rules.js';

export const KINDS = Object.freeze(['event', 'edge', 'source']);
export const SCHEMA_VERSION = 1;

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function validate(records, topology, schemas) {
  const errors = [];
  const warnings = [];
  const validator = createValidator(schemas);
  if (validator.schemaErrors.length) {
    for (const e of validator.schemaErrors) {
      errors.push({ level: 'error', rule: 1, id: null, kind: 'schema', path: e.schema, message: e.message });
    }
    return { errors, warnings };
  }

  const push = (rule, id, kind, list) => {
    for (const e of list) {
      errors.push({ level: 'error', rule, id, kind, path: e.path, message: e.message, alternatives: e.alternatives });
    }
  };

  (topology?.regions ?? []).forEach((region, i) => {
    const id = isObject(region) && typeof region.id === 'string' ? region.id : `regions[${i}]`;
    push(1, id, 'region', validator.validate('v1/region.json', region));
  });
  const regionIds = (topology?.regions ?? []).map((r) => r?.id);
  regionIds.forEach((id, i) => {
    if (regionIds.indexOf(id) !== i) errors.push({ level: 'error', rule: 2, id, kind: 'region', path: '/id', message: `duplicate region id "${id}"` });
  });

  const passing = [];
  records.forEach((record, i) => {
    const label = isObject(record) && typeof record.id === 'string' ? record.id : `records[${i}]`;
    if (!isObject(record)) {
      errors.push({ level: 'error', rule: 1, id: label, kind: null, path: '', message: 'a record is a JSON object' });
      return;
    }
    if (record.schema !== SCHEMA_VERSION) {
      errors.push({ level: 'error', rule: 1, id: label, kind: record.kind ?? null, path: '/schema', message: `unsupported schema version ${JSON.stringify(record.schema)}; this validator knows ${SCHEMA_VERSION}` });
      return;
    }
    if (!KINDS.includes(record.kind)) {
      errors.push({ level: 'error', rule: 1, id: label, kind: record.kind ?? null, path: '/kind', message: `unknown kind ${JSON.stringify(record.kind)}` });
      return;
    }
    const schemaErrors = validator.validate(`v1/${record.kind}.json`, record);
    if (schemaErrors.length) {
      push(1, label, record.kind, schemaErrors);
      return;
    }
    passing.push(record);
  });

  const rules = checkRules(passing, topology ?? {});
  errors.push(...rules.errors);
  warnings.push(...rules.warnings);
  return { errors, warnings };
}

// Code-unit comparison, never localeCompare: the index must be byte-identical
// on every machine (docs/review-2026-09-01.md, finding 15).
export function byId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// The topology object: what build-index.mjs writes and what the rules read.
// Text fields stay out; the site fetches record files for them. `region` on
// an event is the record's override or, failing that, what deriveRegion
// says about its place.
export function buildTopology(records, regions, { deriveRegion } = {}) {
  const events = [];
  const edges = [];
  const sources = [];
  for (const r of records) {
    if (r.kind === 'event') {
      let region = typeof r.region === 'string' ? r.region : null;
      let regionMethod = region ? 'override' : null;
      if (!region && isObject(r.where) && deriveRegion) {
        const derived = deriveRegion(r.where);
        if (derived) {
          region = derived.region;
          regionMethod = derived.method;
        }
      }
      events.push({
        id: r.id,
        title: r.title,
        when: r.when,
        where: isObject(r.where) ? r.where : null,
        region,
        regionMethod,
        status: r.status,
        supersededBy: r.supersededBy ?? null,
        aliases: r.aliases ?? [],
      });
    } else if (r.kind === 'edge') {
      edges.push({
        id: r.id,
        from: r.from,
        to: r.to,
        type: r.type,
        confidence: r.confidence,
        status: r.status,
        supersededBy: r.supersededBy ?? null,
        aliases: r.aliases ?? [],
      });
    } else if (r.kind === 'source') {
      sources.push(r);
    }
  }
  events.sort(byId);
  edges.sort(byId);
  sources.sort(byId);
  return {
    events,
    edges,
    sources,
    regions: [...(regions ?? [])].sort((a, b) => a.order - b.order || byId(a, b)),
  };
}
