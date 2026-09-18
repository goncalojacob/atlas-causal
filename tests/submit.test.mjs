import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REPOSITORY, MAX_PREFILL, bundleText, defaultTitle, issueUrl, copyText, submitBundle,
} from '../src/contribute/submit.js';

const bundle = {
  schema: 1,
  records: [
    { schema: 1, id: 'fixture-event-new', kind: 'event', title: 'Fixture event new' },
    { schema: 1, id: 'fixture-source-new', kind: 'source', title: 'A synthetic book' },
  ],
};

test('the issue URL carries the template and the bundle while it fits', () => {
  const target = issueUrl(bundle);
  assert.ok(target.url.startsWith(`${REPOSITORY}/issues/new?`));
  const params = new URL(target.url).searchParams;
  assert.equal(params.get('template'), 'contribution.yml');
  assert.equal(params.get('title'), 'Contribution: Fixture event new (+1)');
  assert.equal(params.get('bundle'), bundleText(bundle));
  assert.equal(target.prefilled, true);
  assert.ok(target.bytes > 0);
});

test('above the cap the template opens empty, never truncated', () => {
  const big = { schema: 1, records: [{ ...bundle.records[0], summary: 'x'.repeat(MAX_PREFILL) }] };
  const target = issueUrl(big);
  assert.equal(target.prefilled, false);
  assert.ok(target.bytes > MAX_PREFILL);
  assert.equal(new URL(target.url).searchParams.get('bundle'), null);
  assert.ok(target.url.length < 200);

  // The boundary is the encoded body, not the raw text: accents are three
  // bytes each once encoded.
  const justUnder = issueUrl(bundle, { maxPrefill: new URLSearchParams({ bundle: bundleText(bundle) }).toString().length - 'bundle='.length });
  assert.equal(justUnder.prefilled, true);
  assert.equal(issueUrl(bundle, { maxPrefill: 10 }).prefilled, false);
});

test('a correction opens the other template', () => {
  const params = new URL(issueUrl(bundle, { template: 'correction.yml' }).url).searchParams;
  assert.equal(params.get('template'), 'correction.yml');
});

test('defaultTitle names the first event, or the first record', () => {
  assert.equal(defaultTitle({ records: [bundle.records[1]] }), 'Contribution: A synthetic book');
  assert.equal(defaultTitle({ records: [] }), 'Contribution');
  assert.equal(defaultTitle(null), 'Contribution');
});

test('copyText prefers the clipboard and falls back to a textarea', async () => {
  const written = [];
  assert.equal(await copyText('x', { navigator: { clipboard: { writeText: async (t) => written.push(t) } } }), true);
  assert.deepEqual(written, ['x']);

  const appended = [];
  const fakeDocument = {
    body: { appendChild: (el) => appended.push(el) },
    execCommand: () => true,
    createElement: () => ({ style: {}, setAttribute() {}, select() {}, remove() {} }),
  };
  assert.equal(await copyText('x', { navigator: {}, document: fakeDocument }), true);
  assert.equal(appended.length, 1);

  const refusing = { clipboard: { writeText: async () => { throw new Error('denied'); } } };
  assert.equal(await copyText('x', { navigator: refusing, document: fakeDocument }), true);
  assert.equal(await copyText('x', { navigator: {}, document: { ...fakeDocument, execCommand: () => false } }), false);
  assert.equal(await copyText('x', { navigator: {}, document: {} }), false);
});

test('submitBundle copies the bundle and opens the issue', async () => {
  const opened = [];
  const written = [];
  const result = await submitBundle(bundle, {
    open: (url) => opened.push(url),
    navigator: { clipboard: { writeText: async (t) => written.push(t) } },
  });
  assert.equal(result.copied, true);
  assert.deepEqual(written, [bundleText(bundle)]);
  assert.deepEqual(opened, [result.url]);
  assert.equal(new URL(result.url).searchParams.get('bundle'), result.text);
});
