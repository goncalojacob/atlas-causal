// What a lane is. The timeline's lanes and the graph view's bands were two
// implementations of one idea — a grouping of events — and this is that idea,
// once, pure, so the two pictures cannot disagree about which lane an event
// belongs in.
//
// Four groupings. `none` is the default and has no named lanes at all: the
// timeline packs the bars into as many unlabelled rows as it needs and the
// graph drops its bands, which is the arrangement that says least about the
// data and is therefore the right first thing to show. `actor`, `place` and
// `region` name their lanes.
//
// An event is drawn in **exactly one** lane, never duplicated across them. An
// event with four actors is one event, and drawing it four times would turn
// a count of events into a count of participations without saying so. The
// rule that picks the lane is mechanical — the heaviest of its actors among
// the lanes on screen — and the event card states it, because a rule the
// reader cannot see is a rule they cannot check.
//
// `regions.json` is read here and only in the `region` case: lanes stopped
// being regions in M14, and everything else in the atlas asks this file.

import { extent } from './util/dates.js';
import { overlaps } from './util/window.js';
// The four groupings are `vocab.js`'s: this file decides what a lane *is*,
// and `state.js` decides what the URL may ask for, and the two used to
// declare the list separately (health review B, finding 19).
import { GROUPS } from './vocab.js';

export { GROUPS };
// Six lanes is about what a reader holds in their head at once, and about
// what fits under the map while a lane still has a height worth drawing a
// bar in. It was twelve until M24, and twelve was a list with gaps: the
// seventh lane down was never looked at, and everything under it was noise
// with a name. An explicit `lanes` list is still unlimited — a reader who
// names ten actors has said they want ten.
export const LANE_CAP = 6;
export const OTHER_ID = 'other';

const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// One lane. `members` is a Set of event ids rather than the records: the
// views hold the records already, and a Set is what "is this event in this
// lane" wants to be.
function lane(id, label, { other = false } = {}) {
  return { id, label, other, members: new Set(), count: 0 };
}

// The keys one event can be filed under, in the grouping asked for. An actor
// named twice in an event under two roles is one key: this counts events,
// not participations.
function keysOf(group, event, topology) {
  if (group === 'actor') {
    const seen = [];
    for (const { actor } of event.actors ?? []) {
      if (topology.actors?.has(actor) && !seen.includes(actor)) seen.push(actor);
    }
    return seen;
  }
  if (group === 'place') {
    return typeof event.place === 'string' && topology.places?.has(event.place) ? [event.place] : [];
  }
  return [];
}

function labelOf(group, id, topology) {
  if (group === 'actor') return topology.actors?.get(id)?.name ?? id;
  if (group === 'place') return topology.places?.get(id)?.name ?? id;
  return id;
}

// Every lane the current window offers, with how many of the shown events
// fall in it, heaviest first. This is the list the picker draws and the list
// the automatic six are taken from — one function, so what the picker
// offers and what the atlas draws are the same order.
export function availableLanes(group, topology, window = null, lens = null) {
  if (group !== 'actor' && group !== 'place') return [];
  const counts = new Map();
  for (const event of topology.activeEvents ?? []) {
    if (lens && !lens.has(event.id)) continue;
    if (!overlaps(event.when, window)) continue;
    for (const key of keysOf(group, event, topology)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, label: labelOf(group, id, topology), count }))
    .sort((a, b) => b.count - a.count || byId(a.label, b.label) || byId(a.id, b.id));
}

// The lanes of a grouping, in order, with their members.
//
// `window` decides which lanes there are — the six with the most events
// inside the band — and never which events are in them: a bar outside the
// window is drawn faded, and a lane it was counted out of would leave it
// nowhere to be drawn. `chosen`, when given, is the reader's own ordered
// list and replaces the automatic six; "Other" joins it only if something
// falls outside.
export function lanesFor(group, topology, window = null, lens = null, chosen = null, { cap = LANE_CAP } = {}) {
  const all = topology.activeEvents ?? [];
  const shown = lens ? all.filter((e) => lens.has(e.id)) : all;
  if (group === 'region') {
    const lanes = (topology.regions ?? []).map((r) => lane(r.id, r.label));
    const byRegion = new Map(lanes.map((l) => [l.id, l]));
    for (const event of shown) {
      const found = byRegion.get(event.region);
      // An event whose region is not a lane is not drawn, as it was not
      // before M14: the validator derives a lane for every event, so this is
      // a guard and not a case.
      if (!found) continue;
      found.members.add(event.id);
      if (overlaps(event.when, window)) found.count += 1;
    }
    return lanes;
  }
  if (group !== 'actor' && group !== 'place') return [];

  const available = availableLanes(group, topology, window, lens);
  const weight = new Map(available.map((a) => [a.id, a.count]));
  const wanted = chosen && chosen.length
    // The reader's list, in the reader's order. An id that names no record
    // is dropped rather than drawn as an empty lane with a slug for a name.
    ? chosen.filter((id, i) => chosen.indexOf(id) === i
      && (group === 'actor' ? topology.actors?.has(id) : topology.places?.has(id)))
    // `cap` is how many the caller has room for, never more than the six this
    // file thinks a picture can carry: the timeline works it out from the
    // height of its pane, and a caller that says nothing gets the six (I6).
    // The reader's own list above is not capped at all — naming fifteen
    // actors is asking for fifteen lanes.
    : available.slice(0, Math.max(1, Math.min(LANE_CAP, cap))).map((a) => a.id);

  const lanes = wanted.map((id) => lane(id, labelOf(group, id, topology)));
  const position = new Map(lanes.map((l, i) => [l.id, i]));
  const other = lane(OTHER_ID, 'Other', { other: true });

  for (const event of shown) {
    const candidates = keysOf(group, event, topology).filter((id) => position.has(id));
    let best = null;
    for (const id of candidates) {
      if (best === null) { best = id; continue; }
      // The heaviest of its actors among the lanes shown; ties by the order
      // the lanes are in, then by id, so the picture is the same twice
      // running whatever order the records arrived in.
      const d = (weight.get(id) ?? 0) - (weight.get(best) ?? 0)
        || position.get(best) - position.get(id)
        || byId(best, id);
      if (d > 0) best = id;
    }
    const target = best === null ? other : lanes[position.get(best)];
    target.members.add(event.id);
    if (overlaps(event.when, window)) target.count += 1;
  }
  return other.members.size ? [...lanes, other] : lanes;
}

// Which lane an event is drawn in. Membership is the Set, so this is a scan
// of at most thirteen lanes and never a second copy of the rule above.
export function laneOf(event, lanes) {
  const id = typeof event === 'string' ? event : event.id;
  for (const l of lanes) if (l.members.has(id)) return l;
  return null;
}

// What the event card says: the lane, why that one, and what else the event
// involves that did not win it. The reason is the rule in words — a reader
// who cannot see the rule cannot check that the picture obeys it.
export function laneExplain(event, lanes, group, topology = {}) {
  const found = laneOf(event, lanes);
  if (group === 'none' || lanes.length === 0) return { lane: null, reason: null, others: [] };
  if (group === 'region') {
    return { lane: found, reason: found ? 'its region' : 'no lane for its region', others: [] };
  }
  const keys = keysOf(group, event, topology);
  const others = keys
    .filter((id) => id !== found?.id)
    .map((id) => ({ id, label: labelOf(group, id, topology) }));
  if (!found) return { lane: null, reason: null, others };
  if (found.other) {
    const reason = group === 'actor'
      ? (keys.length ? 'none of its actors has a lane' : 'it names no actor')
      : (keys.length ? 'its place has no lane' : 'it has no place');
    return { lane: found, reason, others };
  }
  return {
    lane: found,
    reason: group === 'actor'
      ? (keys.length > 1 ? 'heaviest of its actors' : 'its only actor')
      : 'its place',
    others,
  };
}

// --- the packing, for `none` ---------------------------------------------

// One bar's geometry on the timeline's scale. Here rather than in
// timeline.js because the packing has to agree with the drawing to the
// pixel: a row packed on one geometry and drawn on another would overlap
// exactly where it promised not to.
export function barBox(event, scale, { width = null, openEnd = null, minBar = 6 } = {}) {
  const x = extent(event.when);
  const x0 = scale.x(x.min);
  const x1 = x.max === null
    ? (openEnd === null ? (width ?? x0) : scale.x(openEnd))
    : scale.x(x.max);
  const span = x1 - x0;
  // `instant` is a fact about the drawing and not about the record: an event
  // whose interval is narrower than the smallest bar the timeline can draw
  // has been widened to be visible at all, and it is drawn as a mark rather
  // than as a bar so that a six-pixel rounded rectangle does not read as a
  // little empty ring.
  return {
    x: x0 - (span < minBar ? minBar / 2 : 0),
    width: Math.max(span, minBar),
    ongoing: x.max === null,
    instant: span < minBar,
  };
}

// A binary heap of row indices, ordered by the x each row ends at and then
// by the index itself — the order the packing's own tie-break asks for. It is
// written out rather than taken from a generic heap with a comparator
// argument: a large pack makes some hundreds of thousands of comparisons,
// and a comparator passed in as an argument is a call at each of them, which
// was the difference between this being slower than the walk it replaced and
// being level with it at twenty rows.
//
// `ends` is the array the caller keeps the rows' ends in, so the heap holds
// integers and never objects.
function makeHeap(ends) {
  const items = [];
  // Smaller end first; the earlier row where two end together, which is what
  // the first fit this replaced chose with a strict `<`.
  const before = (a, b) => (ends[a] < ends[b] || (ends[a] === ends[b] && a < b));
  return {
    get size() { return items.length; },
    peek: () => items[0],
    push(value) {
      let i = items.length;
      items.push(value);
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (!before(items[i], items[parent])) break;
        const t = items[i]; items[i] = items[parent]; items[parent] = t;
        i = parent;
      }
    },
    // The top after its own end has been moved. Half the work of popping it
    // and pushing it back, and it is the common case in a saturated pack:
    // every bar past the cap goes to the emptiest row, which is this one.
    sink() {
      const n = items.length;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        if (left >= n) break;
        const right = left + 1;
        let small = before(items[left], items[i]) ? left : i;
        if (right < n && before(items[right], items[small])) small = right;
        if (small === i) break;
        const t = items[i]; items[i] = items[small]; items[small] = t;
        i = small;
      }
    },
    pop() {
      const top = items[0];
      const last = items.pop();
      if (items.length) {
        items[0] = last;
        this.sink();
      }
      return top;
    },
  };
}

// Events into as many rows as it takes for no two bars to overlap at this
// width. First fit, left to right, with one preference: a row that already
// holds something of the same affinity — the walked chain, or the same place
// — is taken over an earlier empty one, so a reader following a path finds
// its steps near each other instead of scattered down the rows.
//
// Deterministic: the input is sorted by x then by id, so two runs given the
// same events in a different order pack them identically.
//
// **A sweep, not a scan** (health review B, finding 23). The rule is the one
// above and the answer is the same bar for bar — `tests/lanes.test.mjs`
// keeps the walk this replaced and holds the two to the same row for every
// bar, at three caps, with and without the affinity. What changed in H4c is
// only what is *looked at* to find the row.
//
// The items are walked left to right, so the x a row has to clear only ever
// grows, and a row with room at one item still has room at the next. Every
// row is therefore in exactly one of two places: *pending*, in a heap
// ordered by the x it ends at, or *free*, as a bit in a bitset. Each item
// first moves whatever the sweep has passed from the one to the other, and
// then:
//
//   first fit    the lowest set bit of the bitset — one word per
//                thirty-two rows, rather than a walk of every row;
//   affinity     the earliest free row among those that carry the key, from
//                a short list per key, and never consulted when nothing is
//                free, since a preference can only pick a free row;
//   past the cap the emptiest row, which is the pending heap's own top —
//                ties to the earliest row, as the walk's strict `<` gave.
//
// The walk was O(rows) per bar. This is O(log rows), and measurably so past
// about thirty rows; at the timeline's cap of twenty the two cost the same,
// which is the point — nothing is paid for the guarantee.
export function packRows(events, scale, width, {
  gap = 4, minBar = 6, openEnd = null, affinity = null, maxRows = Infinity,
} = {}) {
  const items = events
    .map((event) => ({ id: event.id, event, ...barBox(event, scale, { width, openEnd, minBar }) }))
    .sort((a, b) => a.x - b.x || byId(a.id, b.id));
  const assigned = new Map();
  // A row is the x it ends at and nothing else, so the rows are one array of
  // numbers: what is in a row is `assigned`, and which keys it carries is
  // `carrying` the other way round.
  const ends = [];
  // Which rows are free, as a bitset: one bit per row, thirty-two rows to a
  // word. It answers the three questions the packing asks — is this row free,
  // take it, which is the lowest free one — in a few integer operations, and
  // "the lowest" reads one word per thirty-two rows rather than walking them.
  const words = [];
  const isFree = (i) => (words[i >>> 5] & (1 << (i & 31))) !== 0;
  const setFree = (i) => { words[i >>> 5] |= 1 << (i & 31); };
  const takeFree = (i) => { words[i >>> 5] &= ~(1 << (i & 31)); };
  const lowestFree = () => {
    for (let w = 0; w < words.length; w += 1) {
      if (words[w] === 0) continue;
      // The lowest set bit isolated, then which bit it is.
      return w * 32 + (31 - Math.clz32(words[w] & -words[w]));
    }
    return -1;
  };
  // The rows the sweep has not passed yet, by the x they end at. Every row is
  // either free or in here, never both and never neither.
  const pending = makeHeap(ends);
  // Which rows ever carried a key, in index order. A place, or the walked
  // chain, lands in a handful of rows and not in all of them, which is why
  // this is a short list per key and not a structure per row.
  const carrying = new Map();

  for (const item of items) {
    // Everything the sweep has passed is free from here on: `item.x` only
    // grows, so this is a release and never a re-test. Each row is released
    // at most once per bar it took, so the whole of this loop over the whole
    // pack is one pop per bar.
    while (pending.size && ends[pending.peek()] + gap <= item.x) setFree(pending.pop());

    // The lowest free row is what first fit means, and it is also what says
    // whether the affinity has anything to choose among: a preference only
    // ever picks a *free* row, so with none free there is nothing to look up
    // and the key's own list is not even read. That matters — past the cap
    // nothing is free for most of a dense pack, and a hash lookup per bar
    // there would cost more than the walk this replaced.
    const first = lowestFree();
    const key = affinity ? affinity(item.event) : null;
    let list = key === null ? undefined : carrying.get(key);
    let index = -1;
    if (first >= 0 && list) {
      // In index order, so the first free one is the earliest row carrying
      // the key — which is the row the walk's `preferred` found.
      for (let i = 0; i < list.length; i += 1) {
        if (isFree(list[i])) { index = list[i]; break; }
      }
    }
    if (index < 0) index = first;
    const end = item.x + item.width;
    if (index < 0 && ends.length >= maxRows) {
      // Past the cap the bars share a row and stacking draws them as one
      // with a count, which is what the timeline did before packing existed.
      // The emptiest row, so the overlap is as small as it can be — and with
      // nothing free every row is pending, so the heap's top is exactly the
      // row the walk's `reduce` would have found. It stays at the top's own
      // place and sinks from there rather than leaving and coming back.
      index = pending.peek();
      if (end > ends[index]) ends[index] = end;
      pending.sink();
    } else {
      if (index < 0) {
        if (ends.length % 32 === 0) words.push(0);
        ends.push(-Infinity);
        index = ends.length - 1;
      } else {
        takeFree(index);
      }
      if (end > ends[index]) ends[index] = end;
      pending.push(index);
    }
    if (key !== null) {
      if (!list) {
        list = [index];
        carrying.set(key, list);
      } else {
        let at = list.length;
        while (at > 0 && list[at - 1] > index) at -= 1;
        if (list[at] !== index) list.splice(at, 0, index);
      }
    }
    assigned.set(item.id, index);
  }
  return { rows: assigned, count: Math.max(ends.length, 1) };
}

// The packing as lanes, so the timeline draws one grouping and not two: an
// unlabelled row is a lane with no name.
export function rowLanes(events, scale, width, options = {}) {
  const { rows, count } = packRows(events, scale, width, options);
  const lanes = Array.from({ length: count }, (_, i) => lane(`row-${i}`, ''));
  for (const [id, index] of rows) lanes[index].members.add(id);
  return lanes;
}
