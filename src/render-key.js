// When a view has to be drawn again, and when the render can be skipped.
//
// Each of the three views used to redraw on every notification, so the box
// the map publishes 180 ms after a zoom rebuilt the lanes, the graph and the
// marks even though not one of them was drawing anything different. The
// panel already had a key of its own (panel.js); this is the same idea for
// the pictures, and it is here rather than in each of them so that the three
// cannot come to disagree about what a state change means.
//
// **The key is the whole state, not the fields a view is known to read.** A
// key that misses an input leaves a stale picture on screen, which is the
// one failure mode nobody notices until it is a bug report; a key that
// includes a field the view ignores costs a redraw that changes nothing.
// The two are not symmetrical, so everything goes in and each view adds what
// it holds outside the state — its transform, its measured box, the shard
// that has just arrived.
//
// Pure and free of the DOM, so `node --test` can hold it to that promise.

// A value flattened to a string, for a state that is two dozen scalars and
// three short arrays. Deep enough for what `state.js` carries and nothing
// more: `bbox` is four numbers, `chain` a list of ids, `lanes` a list of ids.
function flat(value) {
  if (Array.isArray(value)) return value.map(flat).join(',');
  if (value === null || value === undefined) return '';
  return String(value);
}

// The state, in a fixed order whatever order the keys were written in, so
// that two states that say the same thing key the same.
export function stateKey(state) {
  return Object.keys(state).sort()
    .map((name) => `${name}=${flat(state[name])}`)
    .join('|');
}

// The key a view compares: the state, then whatever the view itself holds.
// `parts` are the view's own — numbers and strings, in a fixed order.
export function renderKey(state, ...parts) {
  return [stateKey(state), ...parts.map(flat)].join('|');
}

// The attribute shards, as one integer (I4a). Since I4 the three views and the
// panel draw out of an atlas built from the core, where a title, a role and a
// name arrive after the picture does; a shard landing changes what is drawn and
// nothing in the state says so, exactly as a territory shard landing does for
// the map. So every key carries this, and it is read here rather than in each
// view so that the four cannot come to disagree about what a shard means.
//
// Zero for an atlas built from the spine, which has every attribute in hand
// from the moment it exists and never changes underneath a view.
export function shardsArrived(atlas) {
  return atlas?.attributeShardsArrived?.() ?? 0;
}
