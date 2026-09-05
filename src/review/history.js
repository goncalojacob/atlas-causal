// What changed between two versions of a record, and what a record's history
// says. The pure half: no git, no filesystem, no DOM.
//
// Both ends read it. `tools/lib/history.mjs` builds the per-record history
// file out of the states git held, and the review dashboard reads that file
// beside a second use of the same arithmetic — the diff between the draft as
// it was fetched and what is in the editor's inputs, which is what Sign shows
// before it writes (health review B, finding 7; A, finding 31).

// `revised` is the version's own date and `schema` is the migration chain's,
// so neither is news about what a person changed.
const NOT_A_CHANGE = new Set(['revised', 'schema']);

// Structural equality without serialising: the histories compare a few
// thousand field values against their predecessors, and JSON.stringify of
// each is the whole cost when the answer is almost always "the same".
function same(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((value, i) => same(value, b[i]));
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => Object.hasOwn(b, key) && same(a[key], b[key]));
}

// Which top-level fields differ, in the order the schemas declare them —
// which is the order they are written in the file, so a reviewer reading the
// list is reading it down the record.
export function changedFields(before, after) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  return keys
    .filter((key) => !NOT_A_CHANGE.has(key) && !same(before?.[key], after?.[key]))
    .sort();
}

function signatures(record) {
  const signed = record?.review?.signedBy;
  return Array.isArray(signed) ? signed.filter((s) => s && typeof s === 'object') : [];
}

// The signatures this version added: a signature is an act with a date on it,
// and the history is where a reviewer sees that somebody else has already
// read the record.
function newSignatures(before, after) {
  const had = new Set(signatures(before).map((s) => `${s.name}\u001f${s.github ?? ''}\u001f${s.on}`));
  return signatures(after)
    .filter((s) => !had.has(`${s.name}\u001f${s.github ?? ''}\u001f${s.on}`))
    .map((s) => ({ name: s.name, github: s.github ?? null, on: s.on }));
}

function dateOf(record) {
  return record?.revised ?? record?.created ?? null;
}

// One record's versions, oldest first, out of the states git held plus the
// state on disk. Consecutive states that changed no field are one version:
// a commit that only reformatted, or that moved the record between
// directories, is not something a reviewer needs told about.
export function versionsOf(states, current) {
  const chain = [...states];
  const last = chain[chain.length - 1];
  // The working tree, when it is not what the last commit holds. After that
  // commit lands this branch is not taken and the version it produced is the
  // same one, which is what keeps a build before a commit and a build after
  // it byte-identical.
  if (!last || !same(last, current)) chain.push(current);

  const versions = [];
  let previous = null;
  for (const state of chain) {
    if (previous === null) {
      versions.push({ on: state.created ?? dateOf(state), first: true });
      previous = state;
      continue;
    }
    const fields = changedFields(previous, state);
    const signed = newSignatures(previous, state);
    if (fields.length === 0 && signed.length === 0) continue;
    versions.push({ on: dateOf(state), fields, ...(signed.length ? { signedBy: signed } : {}) });
    previous = state;
  }
  return versions;
}

// What a record says about itself when git cannot be asked: written on one
// day, last revised on another, and no account of what changed between them.
export function versionsFromRevised(record) {
  const created = record?.created ?? null;
  const revised = record?.revised ?? null;
  const versions = [{ on: created ?? revised, first: true }];
  if (revised && revised !== created) versions.push({ on: revised, fields: [] });
  return versions;
}

// The diff Sign shows: what this reviewer has changed about the record they
// are about to put their name on. One row per field, with the value on each
// side rendered as the short text a list can hold — the point is which
// fields moved, not a full account of a body of prose.
export function diffAgainst(before, after) {
  return changedFields(before, after).map((field) => ({
    field,
    before: shortly(before?.[field]),
    after: shortly(after?.[field]),
  }));
}

// A value as one line. Prose is cut at a length a row can show; a list says
// how many it has and what is in it; an object is its keys, because the
// fields inside an envelope block are what a reviewer recognises it by.
export function shortly(value, { most = 120 } = {}) {
  if (value === undefined) return '—';
  if (value === null) return 'null';
  if (typeof value === 'string') return value.length > most ? `${value.slice(0, most)}…` : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `${value.length} × [${value.map((v) => shortly(v, { most: 24 })).join(', ')}]`.slice(0, most + 8);
  return `{ ${Object.keys(value).join(', ')} }`;
}

// Every version of a record carries the fields it changed; this is the whole
// history read as one question — has anybody signed this, and when.
export function signaturesIn(history) {
  return (history?.versions ?? []).flatMap((v) => (v.signedBy ?? []).map((s) => ({ ...s, at: v.on })));
}
