// The cache three files share: weak on the thing an answer belongs to,
// bounded within it, and least recently used first out. It is small enough
// to read and load-bearing enough that a change to it would be felt in the
// horizon, the convergence query and every view at once.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyedCache, SEP } from '../src/util/memo.js';

test('the same owner and key are answered once', () => {
  const cache = keyedCache();
  const owner = {};
  let asked = 0;
  const ask = () => cache(owner, 'a', () => { asked += 1; return { n: asked }; });
  assert.deepEqual(ask(), { n: 1 });
  assert.deepEqual(ask(), { n: 1 });
  assert.equal(asked, 1, 'asked once');
  // The same object back, not a copy of it: the callers share one answer and
  // none of them may write to it.
  assert.equal(ask(), ask());
});

test('a different owner or a different key is a different question', () => {
  const cache = keyedCache();
  const one = {};
  const two = {};
  assert.equal(cache(one, 'k', () => 1), 1);
  assert.equal(cache(two, 'k', () => 2), 2, 'another owner, another answer');
  assert.equal(cache(one, 'k', () => 99), 1, 'and the first one still stands');
  assert.equal(cache(one, 'j', () => 3), 3);
});

test('an answer of undefined is still an answer', () => {
  const cache = keyedCache();
  const owner = {};
  let asked = 0;
  const ask = () => cache(owner, 'a', () => { asked += 1; return undefined; });
  ask();
  ask();
  assert.equal(asked, 1);
});

test('the least recently used goes first, and reading counts as use', () => {
  const cache = keyedCache(2);
  const owner = {};
  const asked = [];
  const ask = (key) => cache(owner, key, () => { asked.push(key); return key; });
  ask('a');
  ask('b');
  // Reading `a` again moves it to the young end, so `b` is the old one.
  ask('a');
  ask('c');
  assert.deepEqual(asked, ['a', 'b', 'c']);
  ask('a');
  assert.deepEqual(asked, ['a', 'b', 'c'], 'a is still held');
  ask('b');
  assert.deepEqual(asked, ['a', 'b', 'c', 'b'], 'b was dropped and is asked again');
});

test('the separator is the unit separator and not a NUL', () => {
  assert.equal(SEP, '\u001f');
  assert.notEqual(SEP, '\u0000');
});
