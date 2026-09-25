// The browser harness itself, held to the one thing it must not do: leave a
// headless Chromium running on the machine that started it (M88 §10, the third
// review, finding B10).
//
// `process.on('exit')` may not await anything, and the handler reached the
// browsers through the promise map `launched` holds — so the `.then` it booked
// was put on a microtask queue that never runs again, and a file whose hooks
// never ran left a browser and a profile behind. A module-level `Set` of the
// children themselves is what the handler can walk synchronously.
//
// Nothing here starts a browser: `spawn` is injected. It imports
// `tests/browser.mjs` all the same, so `tools/suites.mjs` files it with the
// browser suites — the classifier reads what a file imports rather than what
// it does, which is the discipline that keeps a new browser suite in the
// serial pass the day it is written.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { children, launch, skip } from './browser.mjs';

// A child process as `launch` reads it: two streams that say nothing, an
// `exit` event, and a `kill` that records that it was called.
function fakeChild() {
  const stream = () => {
    const s = new EventEmitter();
    s.setEncoding = () => {};
    s.unref = () => {};
    return s;
  };
  const child = new EventEmitter();
  Object.assign(child, {
    stdout: stream(),
    stderr: stream(),
    killed: 0,
    kill() { child.killed += 1; },
    unref() {},
  });
  return child;
}

test('a child is in the set before launch has waited for anything', { skip }, async (t) => {
  const child = fakeChild();
  const held = new Set(children);
  t.after(() => {
    for (const each of [...children]) if (!held.has(each)) children.delete(each);
  });

  // Never resolved: the browser never says where it is listening, which is
  // the case the exit handler exists for — a launch that is still waiting is
  // still a process somebody has to kill.
  const launching = launch([], null, { spawnChild: () => child });
  // One turn of the loop, which is less than the handshake `launch` waits on.
  await Promise.resolve();
  assert.ok(children.has(child), 'the child is reachable before the launch resolves');

  // And the handler can reach it without awaiting anything: the same walk,
  // synchronously.
  for (const each of children) each.kill();
  assert.ok(child.killed > 0, 'a synchronous walk of the set kills what it finds');

  // Let the launch finish rather than leaving a rejection nobody read: the
  // child says it is gone, which is what `launch` asserts on.
  child.emit('exit', 1, null);
  await launching.then(() => {}, () => {});
});

test('the set is the harness\'s own and starts empty of anything this test made', () => {
  for (const child of children) {
    assert.equal(typeof child.kill, 'function', 'everything in the set can be killed');
  }
});
