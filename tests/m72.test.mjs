import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { WIKIPEDIA_SOURCES } from '../src/validate/rules.js';

// M72 is about what a reader can do with a link's citations: whether there is
// more than one of them, whether they are by more than one author, and whether
// any of them says *where* in the work the claim is.
//
// Written with the records it judges (deviations 711 and 717), in the idiom
// `tests/m67.test.mjs` settled on and `tests/m69.test.mjs` kept: **nothing here
// pins a count, and no test names an edge.** What this run touched is found by
// the flags it wrote — `m72-second-source` on an edge given an independent
// second work, `m72-locator` on one whose citations were given a locator — and
// everything else is asserted of whatever carries them. A suite listing the
// ids would go on passing the day the eighty-second edge is sourced badly.
//
// The corpus is the fixture here, deliberately: these are properties of the
// atlas as published, and a synthetic graph cannot say whether the real one
// holds them.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const readDir = async (kind) => {
  const dir = path.join(ROOT, 'data', kind);
  const out = [];
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.json')) continue;
    out.push(JSON.parse(await readFile(path.join(dir, file), 'utf8')));
  }
  return out;
};

const edges = await readDir('edges');
const sources = await readDir('sources');

const SECOND_SOURCE_FLAG = 'm72-second-source';
const LOCATOR_FLAG = 'm72-locator';

const active = edges.filter((e) => e.status === 'active');
const byId = new Map(sources.map((s) => [s.id, s]));
const flagged = (record, flag) => (record.review?.flags ?? []).includes(flag);

// The same fold rule 9 uses, so the assertions below and the validator are
// asking one question rather than two that happen to agree today.
const nameKey = (n) => String(n).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const creatorsOf = (id) => new Set((byId.get(id)?.creators ?? []).map(nameKey).filter(Boolean));

// Two citations are independent when neither's authors appear among the
// other's — which is what rule 9 means by "different authors", and is why an
// edition pair of one encyclopedia does not satisfy it.
const independent = (citations) => {
  const sets = citations.map((c) => creatorsOf(c.source));
  for (let i = 0; i < sets.length; i += 1) {
    for (let j = i + 1; j < sets.length; j += 1) {
      if (sets[i].size && sets[j].size && [...sets[i]].every((k) => !sets[j].has(k))) return true;
    }
  }
  return false;
};

// ─── 1. the property that already held, and must still ─────────────────────

test('every active edge names at least one source', () => {
  assert.ok(active.length > 0, 'there are active edges to judge');
  for (const e of active) {
    assert.ok(Array.isArray(e.sources) && e.sources.length > 0, `${e.id} cites nothing`);
  }
});

test('every citation on an active edge points at a source record that exists', () => {
  for (const e of active) {
    for (const c of e.sources) {
      assert.ok(byId.has(c.source), `${e.id} cites "${c.source}", which is not a source record`);
    }
    for (const c of e.dispute?.sources ?? []) {
      assert.ok(byId.has(c.source), `${e.id} disputes with "${c.source}", which is not a source record`);
    }
  }
});

// ─── 2. what this run added carries a locator ──────────────────────────────

test('every citation this run wrote carries a locator', () => {
  for (const e of active.filter((x) => flagged(x, SECOND_SOURCE_FLAG) || flagged(x, LOCATOR_FLAG))) {
    const written = e.sources.filter((c) => c.locator != null);
    assert.ok(written.length > 0, `${e.id} is flagged as sourced by this run and has no locator anywhere`);
    for (const c of written) {
      assert.equal(typeof c.locator, 'string');
      assert.ok(c.locator.trim().length > 0, `${e.id} cites ${c.source} with an empty locator`);
    }
  }
});

test('an edge given a second source has one by an author its first citation does not share', () => {
  for (const e of active.filter((x) => flagged(x, SECOND_SOURCE_FLAG))) {
    assert.ok(e.sources.length >= 2, `${e.id} is flagged as given a second source and names ${e.sources.length}`);
    assert.ok(independent(e.sources), `${e.id} is flagged as given a second source and still has one author`);
  }
});

// ─── 3. consensus, asserted from the records ───────────────────────────────

test('every consensus edge has two sources by different authors', () => {
  for (const e of active.filter((x) => x.confidence === 'consensus')) {
    assert.ok(e.sources.length >= 2, `${e.id} is consensus on ${e.sources.length} source(s)`);
    assert.ok(independent(e.sources), `${e.id} is consensus and its sources share an author`);
  }
});

test('no consensus edge rests on Wikipedia alone', () => {
  for (const e of active.filter((x) => x.confidence === 'consensus')) {
    const cited = e.sources.map((c) => c.source);
    assert.ok(
      !cited.every((id) => WIKIPEDIA_SOURCES.includes(id)),
      `${e.id} is consensus on the encyclopedia alone`,
    );
  }
});

test('every edge this run promoted is among the consensus edges rule 9 allows', () => {
  const promoted = active.filter((x) => flagged(x, SECOND_SOURCE_FLAG) && x.confidence === 'consensus');
  for (const e of promoted) {
    assert.ok(independent(e.sources), `${e.id} was promoted without a second author`);
  }
});

// ─── 4. nothing was promoted on one author ─────────────────────────────────

test('no edge this run touched is consensus without a second author', () => {
  const touched = active.filter((x) => flagged(x, SECOND_SOURCE_FLAG) || flagged(x, LOCATOR_FLAG));
  for (const e of touched) {
    if (e.confidence !== 'consensus') continue;
    assert.ok(independent(e.sources), `${e.id} is consensus and its citations share an author`);
  }
});

// A claim whose second source contradicts the first is `disputed` and says so
// (rule 8 asks for the block; this asks that the run did not leave the
// contradiction in the explanation and the confidence at `probable`).
test('an edge this run marked disputed carries the dissent it found', () => {
  for (const e of active.filter((x) => flagged(x, SECOND_SOURCE_FLAG) && x.confidence === 'disputed')) {
    assert.ok(e.dispute, `${e.id} is disputed with no dispute block`);
    assert.ok(e.dispute.text.trim().length > 0, `${e.id} disputes nothing in particular`);
    assert.ok(e.dispute.sources.length > 0, `${e.id} names no dissenting source`);
  }
});

// ─── 5. the source records this run wrote ──────────────────────────────────
//
// A source record is a bibliographic fact and carries no locator of its own —
// the locator is on the citation, because one book supports one edge at page
// 40 and another at page 300. What is asserted here is that a work this run
// added is a work somebody can find: rule 13's identifier, and a citation
// somewhere that names where in it to look.

test('every source cited by an edge this run touched is resolvable', () => {
  const touched = active.filter((x) => flagged(x, SECOND_SOURCE_FLAG) || flagged(x, LOCATOR_FLAG));
  const seen = new Set();
  for (const e of touched) for (const c of e.sources) seen.add(c.source);
  for (const id of seen) {
    const s = byId.get(id);
    assert.ok(s, `${id} is cited and is not a record`);
    assert.ok(Array.isArray(s.creators) && s.creators.length > 0, `${id} names no author`);
    const resolvable = ['isbn', 'doi', 'url'].some((k) => typeof s[k] === 'string' && s[k].length > 0)
      || (s.type === 'primary' && typeof s.reference === 'string' && s.reference.length > 0);
    assert.ok(resolvable, `${id} carries no identifier a reader could follow`);
  }
});
