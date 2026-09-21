// Large events: the ones that are the ground the smaller events stand on.
//
// A world war is not a dot in the ocean and a pandemic is not a bar between
// two other bars. An event is **large** when it says so — `scope: regional`
// or `scope: worldwide`, a field a person writes — or when the events inside
// it fall in more than one lane, which the records say without anybody
// claiming anything (plan decision 4, m30b-brief A8).
//
// The lanes that decide it are the **region** lanes, always, and never the
// reader's current grouping: `group` is `none` by default and has no lanes at
// all, and an event that became large because somebody grouped the timeline by
// actor would be a fact about the interface rather than about the past.
//
// What each view does with it is the view's own business — a band across the
// timeline, a wash over the map, a line in the corner — but *which* events
// they are is decided here and only here, so the two pictures cannot come to
// disagree.
//
// Pure: the atlas and an event in, an answer out. Nothing here knows the DOM.

const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// The distinct region lanes the parts of an event fall in. A part with no
// region is drawn in no lane (M30a, A15) and is therefore in none of them: it
// cannot make its parent span two.
function lanesOfParts(atlas, event) {
  const regions = new Set();
  for (const id of atlas.childrenOf?.get(event.id) ?? []) {
    const region = atlas.events?.get(id)?.region ?? null;
    if (typeof region === 'string') regions.add(region);
  }
  return regions;
}

// null when the event is ordinary. Otherwise:
//
//   scope   'regional' or 'worldwide' — what the views draw it as
//   reason  'scope' when a person wrote it, 'parts' when the parts say it
//   region  the lane its wash covers, or null when it has none
//
// A `worldwide` event has no wash: a tint over the whole viewport would put a
// film over every coastline, territory and mark, and several would stack. The
// map says so in a line instead (A8).
export function largeEvent(atlas, event) {
  if (!event || event.status !== 'active') return null;
  const region = typeof event.region === 'string' ? event.region : null;
  if (event.scope === 'worldwide') return { scope: 'worldwide', reason: 'scope', region };
  if (event.scope === 'regional') return { scope: 'regional', reason: 'scope', region };
  if (lanesOfParts(atlas, event).size > 1) return { scope: 'regional', reason: 'parts', region };
  return null;
}

// The large ones among the events a view is about to draw, each with its
// answer, in the order they were given. A view that has already filtered by
// the lens and by its own viewport passes what it is drawing, so a large
// event the lens removed is not a band over a picture it is not in.
export function largeEventsIn(events, atlas) {
  const out = [];
  for (const event of events) {
    const large = largeEvent(atlas, event);
    if (large) out.push({ event, ...large });
  }
  return out;
}

// `bracketsIn` stood here until M77: a parent and its parts in one named lane,
// drawn as a thin rule over them. Named lanes went with the grouping and the
// bracket had nowhere left to be drawn — the rows are packed, and what says an
// event has parts is the ring around its bar (parts.js).
