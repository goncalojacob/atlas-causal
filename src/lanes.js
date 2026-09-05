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
export function lanesFor(group, topology, window = null, lens = null, chosen = null) {
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
    : available.slice(0, LANE_CAP).map((a) => a.id);

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

// Events into as many rows as it takes for no two bars to overlap at this
// width. First fit, left to right, with one preference: a row that already
// holds something of the same affinity — the walked chain, or the same place
// — is taken over an earlier empty one, so a reader following a path finds
// its steps near each other instead of scattered down the rows.
//
// Deterministic: the input is sorted by x then by id, so two runs given the
// same events in a different order pack them identically.
export function packRows(events, scale, width, {
  gap = 4, minBar = 6, openEnd = null, affinity = null, maxRows = Infinity,
} = {}) {
  const items = events
    .map((event) => ({ id: event.id, event, ...barBox(event, scale, { width, openEnd, minBar }) }))
    .sort((a, b) => a.x - b.x || byId(a.id, b.id));
  const rows = [];
  const assigned = new Map();
  for (const item of items) {
    const key = affinity ? affinity(item.event) : null;
    let first = -1;
    let preferred = -1;
    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i].end + gap > item.x) continue;
      if (first < 0) first = i;
      if (key !== null && preferred < 0 && rows[i].keys.has(key)) preferred = i;
    }
    let index = preferred >= 0 ? preferred : first;
    if (index < 0) {
      if (rows.length < maxRows) {
        rows.push({ end: -Infinity, keys: new Set() });
        index = rows.length - 1;
      } else {
        // Past the cap the bars share a row and stacking draws them as one
        // with a count, which is what the timeline did before packing
        // existed. The emptiest row, so the overlap is as small as it can be.
        index = rows.reduce((best, row, i) => (row.end < rows[best].end ? i : best), 0);
      }
    }
    rows[index].end = Math.max(rows[index].end, item.x + item.width);
    if (key !== null) rows[index].keys.add(key);
    assigned.set(item.id, index);
  }
  return { rows: assigned, count: Math.max(rows.length, 1) };
}

// The packing as lanes, so the timeline draws one grouping and not two: an
// unlabelled row is a lane with no name.
export function rowLanes(events, scale, width, options = {}) {
  const { rows, count } = packRows(events, scale, width, options);
  const lanes = Array.from({ length: count }, (_, i) => lane(`row-${i}`, ''));
  for (const [id, index] of rows) lanes[index].members.add(id);
  return lanes;
}
