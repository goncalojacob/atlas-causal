// What a lane is. The timeline's lanes and the graph view's bands were two
// implementations of one idea — a row of events — and this is that idea, once,
// pure, so the two pictures cannot disagree about which lane an event belongs
// in.
//
// **One arrangement since M77, where there were four.** A reader could ask for
// one lane per actor, per place or per region, and reorder the list; the owner,
// 21 September: *"Right now the grouping function is useless, let's simplify
// the platform and remove it."* What is left is what `none` always was and
// what the atlas always opened on — the bars packed into as many rows as it
// takes for none of them to overlap at this width, and no named lane at all.
// The picker, the `group` and `lanes` state, `lanesFor`, `availableLanes` and
// `laneExplain` went with it, and the graph has no bands any more because
// nothing builds it one.
//
// An event is drawn in **exactly one** row, never duplicated across them. An
// event with four actors is one event, and drawing it four times would turn a
// count of events into a count of participations without saying so.

import { extent } from './util/dates.js';

const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// One lane. `members` is a Set of event ids rather than the records: the
// views hold the records already, and a Set is what "is this event in this
// lane" wants to be.
// A lane is an id and its members, and nothing else since M83 (B11). It carried
// a `label` and an `other` flag until then, from the grouping M77 removed: every
// lane `rowLanes` makes is an unlabelled row, so the two fields were written
// empty and read by a branch in `timeline.js` that could never be taken.
function lane(id) {
  return { id, members: new Set(), count: 0 };
}

// Which lane an event is drawn in. Membership is the Set, so this is a scan
// and never a second copy of the packing's rule.
export function laneOf(event, lanes) {
  const id = typeof event === 'string' ? event : event.id;
  for (const l of lanes) if (l.members.has(id)) return l;
  return null;
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
//                **Nothing passes a cap since M77** — the timeline takes as
//                many rows as the titles need and the pane scrolls — and the
//                branch is kept because a caller that has a ceiling is a
//                caller this function should still answer, and because it is
//                the one place the heap's own top is read.
//
// The walk was O(rows) per bar. This is O(log rows), and measurably so past
// about thirty rows; at the timeline's cap of twenty the two cost the same,
// which is the point — nothing is paid for the guarantee.
// `extra` is how much room a bar needs *beyond its own width* — since M77 the
// timeline writes every bar's title beside it, and two bars that do not
// overlap whose titles do are two titles nobody can read. It is a function of
// the event because the room a title needs is the length of the title.
//
// `before` is the same question on the other side (M86 §4). A bar so near the
// right edge that its title would run off the pane is written to the *left* of
// it instead, and ground reserved on the wrong side is ground two titles are
// packed into. The sweep stays monotone because the items are sorted by where
// each one *starts* — its bar's x less whatever it reserves before it — and
// released against the same number.
export function packRows(events, scale, width, {
  gap = 4, minBar = 6, openEnd = null, affinity = null, maxRows = Infinity, extra = null, before = null,
} = {}) {
  const items = events
    .map((event) => ({
      id: event.id,
      event,
      ...barBox(event, scale, { width, openEnd, minBar }),
      room: extra ? extra(event) : 0,
      room0: before ? before(event) : 0,
    }))
    .map((item) => ({ ...item, from: item.x - item.room0 }))
    .sort((a, b) => a.from - b.from || byId(a.id, b.id));
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
    // Everything the sweep has passed is free from here on: `item.from` only
    // grows, so this is a release and never a re-test. Each row is released
    // at most once per bar it took, so the whole of this loop over the whole
    // pack is one pop per bar.
    while (pending.size && ends[pending.peek()] + gap <= item.from) setFree(pending.pop());

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
    const end = item.x + item.width + item.room;
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

// The packing as lanes, so the timeline draws one grouping and not two: a row
// is a lane, and since M77 there is no other kind.
export function rowLanes(events, scale, width, options = {}) {
  const { rows, count } = packRows(events, scale, width, options);
  const lanes = Array.from({ length: count }, (_, i) => lane(`row-${i}`));
  for (const [id, index] of rows) lanes[index].members.add(id);
  return lanes;
}
