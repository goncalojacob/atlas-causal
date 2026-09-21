// M71, without a DOM: the draft a reader builds, the record it becomes, the
// verdict the validator's own rules give it, and the link that carries it.
//
// Written before the composer it judges (deviations 711 and 717). Every
// record here is synthetic and the narrative composed in these tests exists
// only in memory: **no narrative is written to `data/` by this milestone**,
// which is the brief's own constraint and the reason the walk below is built
// out of `tests/fixtures/data/`.
//
// No test here pins a count.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyDraft, pickStep, removeStep, moveStep, setStepText,
  windowOf, atlasReader, topologyFor, composeRecord, checkRecord, bundleOf,
  submitUrl, recordText,
  STORAGE_KEY, readDraft, writeDraft, clearDraft,
} from '../src/compose/narrative.js';
import { validate } from '../src/validate/core.js';
import { REPOSITORY } from '../src/contribute/submit.js';
import { isDraft } from '../src/origin.js';
import { atlasOf, schemas, FIXTURE_DATA } from './helpers.mjs';

const TODAY = '2026-09-21';

// Prose long enough to be a real argument: rule 20 asks for a summary and a
// step text that say something, and a test that wrote "x" would be testing
// the rule rather than the composer.
const SUMMARY = 'A synthetic walk assembled by the composer in a test. It claims nothing about the world: '
  + 'the three records it steps through are fixtures, and it exists to prove that what the composer builds '
  + 'is what the validator accepts.';
const STEP_TEXT = (n) => `Step ${n} of a synthetic walk. It says why the step follows in enough words `
  + 'for rule 20 to count it as an argument rather than a label, and nothing it says is history.';

const A = 'fixture-event-a';
const B = 'fixture-event-b';
const T = 'fixture-event-t';

async function ready() {
  const atlas = await atlasOf(FIXTURE_DATA);
  return { atlas, reader: atlasReader(atlas), topology: topologyFor(atlas), schemas: await schemas() };
}

// A reader who has picked three events, written a paragraph on each, named
// the walk and cited the one book it rests on.
function walked(reader, refs = [A, B, T]) {
  let draft = { ...emptyDraft(), title: 'A synthetic walk', author: 'A Reader', summary: SUMMARY };
  draft = { ...draft, citations: [{ source: 'fixture-source-1', locator: '' }] };
  refs.forEach((ref) => { draft = pickStep(draft, ref, reader); });
  draft.steps.forEach((_, i) => { draft = setStepText(draft, i, STEP_TEXT(i + 1)); });
  return draft;
}

// ─── 1. the record the validator accepts ───────────────────────────────────

test('a composed record passes the validator’s own rules, run', async () => {
  const { reader, topology, schemas: compiled } = await ready();
  const record = composeRecord(walked(reader), { years: reader.years, today: TODAY });

  // Not a comparison against a golden file: the rules themselves, over the
  // same topology the page holds, the way `node tools/validate.mjs` runs them.
  const { errors } = validate([record], topology, compiled);
  assert.deepEqual(errors, [], 'the composed narrative has no errors');

  // And the same answer through the composer's own door, which is what the
  // page shows the reader.
  const verdict = checkRecord(record, topology, compiled);
  assert.deepEqual(verdict.errors, []);
  assert.equal(verdict.ok, true);
});

test('the record carries the envelope the pipeline expects and says honestly that nobody has read it', async () => {
  const { reader } = await ready();
  const record = composeRecord(walked(reader), { years: reader.years, today: TODAY });
  assert.equal(record.schema, 1);
  assert.equal(record.kind, 'narrative');
  assert.equal(record.status, 'active');
  assert.equal(record.license, 'CC-BY-SA-4.0');
  assert.equal(record.created, TODAY);
  assert.deepEqual(record.authors, [{ name: 'A Reader', github: null }]);
  assert.equal(isDraft(record), true, 'review.status is draft: no person has read it');
  assert.equal(record.id, 'a-synthetic-walk', 'the id is the title slugged');
});

test('a walk the validator refuses is refused in the browser for the reason the CLI would give', async () => {
  const { reader, topology, schemas: compiled } = await ready();
  // One step is not a walk (rule 20), and a narrative with no citation is not
  // an argument (rule 6).
  const thin = { ...walked(reader, [A]), citations: [] };
  const verdict = checkRecord(composeRecord(thin, { years: reader.years, today: TODAY }), topology, compiled);
  assert.equal(verdict.ok, false);
  assert.ok(verdict.errors.some((e) => e.rule === 20), 'rule 20 on the walk');
  assert.ok(verdict.errors.some((e) => e.rule === 6), 'rule 6 on the sources');
});

// ─── 2. the steps are the events picked, in order ──────────────────────────

test('the steps are the events picked, in the order picked', async () => {
  const { reader } = await ready();
  let draft = emptyDraft();
  for (const ref of [T, A, B]) draft = pickStep(draft, ref, reader);
  assert.deepEqual(draft.steps.map((s) => s.ref), [T, A, B]);
});

test('a step cannot name an event the atlas lacks', async () => {
  const { reader } = await ready();
  const before = emptyDraft();
  const after = pickStep(before, 'no-such-event', reader);
  assert.equal(after, before, 'the draft is untouched, and nothing was offered to be picked');

  // Nor anything that is not an event: a place and an actor are records the
  // atlas has, and neither is a step of a walk the composer builds.
  assert.deepEqual(pickStep(before, 'fixture-place-a', reader).steps, []);
  assert.deepEqual(pickStep(before, 'fixture-actor-one', reader).steps, []);
});

test('the same event twice running is one step, and the same event later is two', async () => {
  const { reader } = await ready();
  let draft = pickStep(pickStep(emptyDraft(), A, reader), A, reader);
  assert.deepEqual(draft.steps.map((s) => s.ref), [A], 'rule 20 refuses a step that does not step');
  draft = pickStep(pickStep(draft, B, reader), A, reader);
  assert.deepEqual(draft.steps.map((s) => s.ref), [A, B, A], 'a walk may come back to where it started');
});

test('a picked step can be moved and removed', async () => {
  const { reader } = await ready();
  let draft = walked(reader);
  const order = draft.steps.map((s) => s.ref);
  draft = moveStep(draft, 0, 1);
  assert.deepEqual(draft.steps.map((s) => s.ref), [order[1], order[0], order[2]]);
  assert.equal(draft.steps[1].text, STEP_TEXT(1), 'the text travels with its step');
  const shorter = removeStep(draft, 1);
  assert.deepEqual(shorter.steps.map((s) => s.ref), [order[1], order[2]]);
  assert.equal(moveStep(shorter, 0, -1), shorter, 'the first step does not move up');
});

// ─── 3. the window is the span of the steps ────────────────────────────────

test('the window is the span of the steps, and is not typed', async () => {
  const { atlas, reader } = await ready();
  const draft = walked(reader);
  const span = windowOf(draft, reader.years);
  const years = draft.steps.map((s) => atlas.resolve(s.ref).record.when.start);
  assert.equal(span.from, Math.min(...years));
  assert.equal(span.to, Math.max(...years));

  const record = composeRecord(draft, { years: reader.years, today: TODAY });
  assert.deepEqual(record.window, span, 'and it is what the record carries');
});

test('the window follows the steps, and is absent while there are none', async () => {
  const { reader } = await ready();
  assert.equal(windowOf(emptyDraft(), reader.years), null);
  const one = pickStep(emptyDraft(), A, reader);
  const two = pickStep(one, T, reader);
  assert.ok(windowOf(two, reader.years).to > windowOf(one, reader.years).to, 'a later step widens it');
  assert.equal(windowOf(removeStep(two, 1), reader.years).to, windowOf(one, reader.years).to, 'and removing it narrows it again');

  // A record with no steps carries no window rather than a window of nothing.
  assert.equal('window' in composeRecord(emptyDraft(), { years: reader.years }), false);
});

// ─── 4. the link, and what the page does not send ──────────────────────────

test('the submit link is a GitHub new-issue URL carrying the record', async () => {
  const { reader } = await ready();
  const record = composeRecord(walked(reader), { years: reader.years, today: TODAY });
  const target = submitUrl(record);

  assert.ok(target.url.startsWith(`${REPOSITORY}/issues/new?`), 'a new-issue URL on this repository');
  const query = new URL(target.url).searchParams;
  assert.equal(query.get('template'), 'contribution.yml');
  assert.equal(query.get('title'), `Contribution: ${record.title}`, 'the title as the title');
  assert.deepEqual(JSON.parse(query.get('bundle')), bundleOf(record), 'the record as the body');
  assert.equal(target.prefilled, true);

  // No token and no secret: the whole of the credential story is that the
  // reader is signed in to GitHub in their own browser.
  assert.equal(/token|secret|api\.github|authorization/i.test(target.url), false);
});

test('a walk too long to prefill is carried on the clipboard instead of being truncated', async () => {
  const { reader } = await ready();
  const record = composeRecord(walked(reader), { years: reader.years, today: TODAY });
  const target = submitUrl(record, { maxPrefill: 10 });
  assert.equal(target.prefilled, false);
  assert.equal(new URL(target.url).searchParams.has('bundle'), false, 'nothing is half-sent');
  assert.ok(recordText(record).includes(record.steps[0].text), 'and the whole record is what the reader copies');
});

test('building the link asks nothing of the network', async () => {
  const { reader } = await ready();
  const record = composeRecord(walked(reader), { years: reader.years, today: TODAY });
  const calls = [];
  const saved = { fetch: globalThis.fetch, xhr: globalThis.XMLHttpRequest };
  globalThis.fetch = (...args) => { calls.push(['fetch', args]); throw new Error('the composer must not fetch'); };
  globalThis.XMLHttpRequest = function Refused() { calls.push(['xhr']); throw new Error('the composer must not fetch'); };
  try {
    submitUrl(record);
    recordText(record);
  } finally {
    globalThis.fetch = saved.fetch;
    globalThis.XMLHttpRequest = saved.xhr;
  }
  assert.deepEqual(calls, [], 'submitting is a link and a clipboard, never a request');
});

// ─── 5. the draft between visits ───────────────────────────────────────────

function fakeStorage() {
  const map = new Map();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

test('a draft survives being put away and read back, and does not survive being submitted', async () => {
  const { reader } = await ready();
  const storage = fakeStorage();
  assert.equal(readDraft(storage), null, 'nothing is stored before anything is written');

  const draft = walked(reader);
  writeDraft(storage, draft);
  assert.equal(storage.map.has(STORAGE_KEY), true);
  const back = readDraft(storage);
  assert.deepEqual(back.steps, draft.steps, 'the walk comes back');
  assert.equal(back.title, draft.title);
  assert.equal(back.summary, draft.summary);
  assert.deepEqual(back.citations, draft.citations);

  clearDraft(storage);
  assert.equal(readDraft(storage), null, 'submitting ends the draft');
});

test('storage that refuses, or holds something another version wrote, does not stop the composer', () => {
  const broken = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
    removeItem() { throw new Error('denied'); },
  };
  assert.equal(readDraft(broken), null);
  assert.equal(writeDraft(broken, emptyDraft()), false, 'a browser with storage off still composes; it just forgets');
  assert.equal(clearDraft(broken), false);

  const odd = fakeStorage();
  odd.setItem(STORAGE_KEY, '["not a draft"]');
  assert.equal(readDraft(odd), null);
  odd.setItem(STORAGE_KEY, '{"steps":[{"ref":"x"},{"text":"no ref"}],"title":7}');
  assert.deepEqual(readDraft(odd), { title: '7', summary: '', author: '', citations: [], steps: [{ ref: 'x', text: '' }] });
});

test('the draft is plain data: what is stored has no atlas in it', async () => {
  const { reader } = await ready();
  const storage = fakeStorage();
  writeDraft(storage, walked(reader));
  const stored = JSON.parse(storage.map.get(STORAGE_KEY));
  assert.deepEqual(Object.keys(stored).sort(), ['author', 'citations', 'steps', 'summary', 'title']);
  for (const step of stored.steps) assert.deepEqual(Object.keys(step).sort(), ['ref', 'text']);
});
