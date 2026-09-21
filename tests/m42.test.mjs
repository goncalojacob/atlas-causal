import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// M42's first act is to reinstate what M44b retracted under a rule this
// milestone retires, and the brief's test 1 is that the reinstatement is
// reversible and accounted: **every record whose `retraction` block was
// deleted appears under "Reinstated" in `docs/m44-retractions.md`**, with the
// reason it carried copied there verbatim, which is amendment A11's procedure.
//
// The property is asserted and not a list of ids. The fifty M44b withdrew are
// named in that same file, class by class, so the test reads them from the
// document rather than holding a second copy: a record that file says was
// retracted and `data/` says is active is a reinstatement, and it must be
// accounted for. Nothing here pins a count (brief, test 2) — a milestone that
// puts back one more is green, and one that puts back one silently is not.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RETRACTIONS = path.join(ROOT, 'docs', 'm44-retractions.md');

const doc = await readFile(RETRACTIONS, 'utf8');

// The ids the document names under "## The fifty retractions, by class",
// which is where M44b indexed what it withdrew.
function retractedByM44b(text) {
  const start = text.indexOf('## The fifty retractions, by class');
  assert.notEqual(start, -1, 'docs/m44-retractions.md no longer indexes the fifty');
  const rest = text.slice(start);
  const end = rest.indexOf('\n## ', 1);
  const body = end === -1 ? rest : rest.slice(0, end);
  return new Set([...body.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)*)`/g)].map((m) => m[1]));
}

// Everything the "## Reinstated" section mentions, whoever put it back.
function accounted(text) {
  const start = text.indexOf('## Reinstated');
  assert.notEqual(start, -1, 'docs/m44-retractions.md has no "Reinstated" section');
  const rest = text.slice(start);
  const end = rest.indexOf('\n## The fifty retractions');
  const body = end === -1 ? rest : rest.slice(0, end);
  return new Set([...body.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)*)`/g)].map((m) => m[1]));
}

const events = await (async () => {
  const dir = path.join(ROOT, 'data', 'events');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  const out = new Map();
  for (const f of files) out.set(f.slice(0, -5), JSON.parse(await readFile(path.join(dir, f), 'utf8')));
  return out;
})();

test('a record M44b retracted and the atlas now draws is accounted for under Reinstated', () => {
  const withdrawn = retractedByM44b(doc);
  const listed = accounted(doc);
  const unaccounted = [];
  for (const id of withdrawn) {
    const record = events.get(id);
    if (!record || record.status !== 'active') continue;
    if (!listed.has(id)) unaccounted.push(id);
  }
  assert.deepEqual(unaccounted, [], `active again and not under "Reinstated": ${unaccounted.join(', ')}`);
});

test('nothing under Reinstated still carries a retraction, so the undoing is complete', () => {
  const withdrawn = retractedByM44b(doc);
  const listed = accounted(doc);
  const wrong = [];
  for (const id of listed) {
    if (!withdrawn.has(id)) continue;
    const record = events.get(id);
    if (!record) continue;
    if (record.retraction || record.status !== 'active') wrong.push(`${id} is ${record.status}`);
  }
  assert.deepEqual(wrong, [], `listed as reinstated and not active without a retraction: ${wrong.join(', ')}`);
});

test('every event this milestone put back earns at least one active edge', async () => {
  const dir = path.join(ROOT, 'data', 'edges');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  const degree = new Map();
  for (const f of files) {
    const edge = JSON.parse(await readFile(path.join(dir, f), 'utf8'));
    if (edge.status !== 'active') continue;
    for (const end of [edge.from, edge.to]) degree.set(end, (degree.get(end) ?? 0) + 1);
  }
  const bare = [];
  for (const [id, record] of events) {
    if (record.status !== 'active') continue;
    if (!(record.review?.flags ?? []).includes('m42-reinstated')) continue;
    if (!degree.has(id)) bare.push(id);
  }
  // The new bar of `docs/m42-brief.md` §1: a record earns its place by
  // carrying at least one honest edge to anything already in the atlas. A
  // record put back without one would be exactly what M44b was right to
  // withdraw, under a different rule.
  assert.deepEqual(bare, [], `reinstated with no edge: ${bare.join(', ')}`);
});

test('every event this milestone put back is accounted for in writing', async () => {
  // The bar of §1 is not about M44b, and batch 1 reached tombstones M22 and
  // M40b left. Those are outside `docs/m44-retractions.md`'s own index, so
  // the accounting is asserted over **both** documents: whichever milestone
  // withdrew a record, the run that draws it again says so somewhere a reader
  // can find, and copies the reason it carried.
  const connections = path.join(ROOT, 'docs', 'm42-connections.md');
  const also = existsSync(connections) ? await readFile(connections, 'utf8') : '';
  const both = `${doc}\n${also}`;
  const unaccounted = [];
  for (const [id, record] of events) {
    if (record.status !== 'active') continue;
    if (!(record.review?.flags ?? []).includes('m42-reinstated')) continue;
    if (!both.includes(`\`${id}\``)) unaccounted.push(id);
  }
  assert.deepEqual(unaccounted, [], `put back and argued nowhere: ${unaccounted.join(', ')}`);
});

test('every edge this milestone wrote has both its ends argued in writing', async () => {
  // Amendment A5: volume must connect, not only file — and batch 3 is edges
  // alone, every end of every one of them a record the atlas already held.
  // That is a change of practice (deviation 979 wrote the first such edge and
  // said so), and the discipline that keeps it from becoming a licence to
  // wire the graph up for the pleasure of the number is this: **an edge
  // nobody argued in writing fails**. `docs/m42-connections.md` is where the
  // sentence that argues each one lives, and it names records rather than
  // edge ids, so the property is asserted over the two ends.
  //
  // The date is how the milestone's own edges are told from the corpus's:
  // M42 is a one-day run and its records carry `created: 2026-09-21`. A
  // batch that writes an edge and argues it nowhere is red; a batch that
  // writes none is green, which is what makes this a property and not a
  // count (brief, test 2).
  const connections = path.join(ROOT, 'docs', 'm42-connections.md');
  const argued = existsSync(connections) ? await readFile(connections, 'utf8') : '';
  const dir = path.join(ROOT, 'data', 'edges');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  const unargued = [];
  for (const f of files) {
    const edge = JSON.parse(await readFile(path.join(dir, f), 'utf8'));
    if (edge.status !== 'active' || edge.created !== '2026-09-21') continue;
    // Named, whether on its own or inside the `from --type--> to` span the
    // batches before this one write an edge as. The bound is what keeps
    // `gulf-war` from being read out of `iraq-war`.
    const named = (end) => new RegExp(`(^|[^a-z0-9-])${end}([^a-z0-9-]|$)`).test(argued);
    const missing = [edge.from, edge.to].filter((end) => !named(end));
    if (missing.length) unargued.push(`${edge.id} (${missing.join(', ')})`);
  }
  assert.deepEqual(unargued, [], `written and argued nowhere: ${unargued.join('; ')}`);
});
