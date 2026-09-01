import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, safeUrl } from '../src/util/esc.js';

test('esc neutralises markup and quotes', () => {
  assert.equal(esc('<b onclick="x">Tom & Jerry\'s</b>'), '&lt;b onclick=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/b&gt;');
  assert.equal(esc(null), '');
  assert.equal(esc(42), '42');
});

test('safeUrl accepts http(s) only', () => {
  assert.equal(safeUrl('https://example.invalid/x'), 'https://example.invalid/x');
  assert.equal(safeUrl('HTTP://example.invalid'), 'HTTP://example.invalid');
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(safeUrl('data:text/html,hi'), null);
  assert.equal(safeUrl('https://example.invalid/with space'), null);
  assert.equal(safeUrl(null), null);
});
