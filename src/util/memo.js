// Answers kept, so that four callers asking the same question of the same
// graph pay for it once.
//
// Three places wanted the same shape and none of them wanted a cache of its
// own (health review A, finding 12; B, finding 22): the horizon, the
// convergence query and what the reader is working with are each computed
// by every view on every state change, and each is a pure function of an
// adjacency and a couple of strings. So the cache is keyed the way the
// question is asked — by the *owner* the answer belongs to, weakly, and then
// by a string within it.
//
// **Weak on the owner**, so an atlas that goes out of scope takes its answers
// with it: a page that loads a second atlas, and a test file that builds
// twenty, must not accumulate the first one's graph for ever. **Bounded
// within it**, because the string side is not bounded by anything the reader
// cannot type: dragging the horizon year across a century would otherwise
// hold a hundred reachable sets alive. Least recently used goes first, which
// for this is exactly right — a reader moves the year and comes back to it.
//
// Pure and free of the DOM. Nothing here decides *what* is cached; that is
// the caller's, and the caller is the one place that knows what its key has
// to carry to be a key at all.

// The separator between the parts of a key. U+001F, the unit separator, as
// everywhere else in this project since H1a — never a NUL, which makes grep
// read the file as binary (docs/run-protocol.md, the amendment of 5
// September).
export const SEP = '\u001f';

export function keyedCache(limit = 4) {
  const byOwner = new WeakMap();
  return (owner, key, compute) => {
    let held = byOwner.get(owner);
    if (!held) {
      held = new Map();
      byOwner.set(owner, held);
    }
    const found = held.get(key);
    // Wrapped, so that an answer that is itself `undefined` is still an
    // answer and is not computed again on every ask.
    if (found !== undefined) {
      // Read is use: a Map keeps its insertion order, so deleting and
      // setting again moves this key to the young end of it.
      held.delete(key);
      held.set(key, found);
      return found.value;
    }
    const value = compute();
    held.set(key, { value });
    if (held.size > limit) held.delete(held.keys().next().value);
    return value;
  };
}
