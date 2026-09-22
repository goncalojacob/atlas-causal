// How much wider than the arrangement time is drawn, and how much wider it may
// ever be. Pure: a number in, a number out, no DOM and no state.
//
// The owner, 22 September, with World War II open on the graph — twenty-seven
// children in one vertical column, labels three deep on either side:
// *"On the graph it should expand more horizontally when I zoom in, otherwise
// it looks weird and hard to see."*
//
// The camera zoomed uniformly, so a column zoomed in was a bigger column. The
// crowding in this picture is almost never vertical — the barycentre spreads a
// column over the whole field already — it is horizontal, because x is the year
// and a handful of years is a sliver of any axis. So the reader's wheel is
// spent on the axis the crowding is on: `k` is still the zoom every mark and
// every label divides its size by, and `s` is how much further apart in time
// two nodes are drawn than the arrangement laid them. What the reader sees
// magnified horizontally is `k * s` and vertically `k`.
//
// **The stretch is not a claim about time.** It multiplies every x by one
// number, so the order is the order, the scale is the same scale, and two
// events a year apart are still half as far apart as two events two years
// apart. What it changes is how much of the picture's width one year is worth,
// which is the same thing zooming already changes and is nobody's argument.
//
// It lives here rather than in graph-view.js because the law and its cap are
// one question — as the merging rule and the zoom limit are one question in
// layout.js — and because a rule this short should be testable without a
// browser.

// Time is never drawn *narrower* than the arrangement laid it out: at the world
// view the picture is the arrangement and nothing has been spent.
export const MIN_STRETCH = 1;

// And never more than four times wider. The run was asked to say what cap is
// honest, and this is the argument for four.
//
// What the stretch buys is room between two nodes that time itself separates,
// and it buys nearly all of it in the first two doublings: the twenty-seven
// children of a six-year war need one, a dozen events inside one decade need
// two. A third doubling buys almost nothing, because what is still merged at
// four times is what falls in the same year — and no stretch whatever parts two
// nodes at one x.
//
// The cost, meanwhile, is real and grows with every doubling. At four times,
// crossing the drawing takes four screens sideways for every one down, so a
// reader comparing two events pans instead of looking; and an edge's slope,
// which is read as how far apart in time its two ends are, is flattened by the
// same factor. Four is where the two curves cross.
export const STRETCH_CAP = 4;

// How much of a wheel notch goes into the stretch. One: a notch that multiplies
// the zoom by f multiplies the horizontal magnification by f² and the vertical
// by f, so zooming into 1943 shows 1943 wide rather than 1943 large — which is
// the sentence this milestone is answering. Larger than one would take the cap
// in a single notch and make the wheel feel like two gestures.
export const STRETCH_EXPONENT = 1;

// Inside the limits, and never NaN: a factor computed from a wheel delta the
// browser reported as something strange must not leave the picture with no
// width at all.
export function clampStretch(stretch, cap = STRETCH_CAP) {
  if (!Number.isFinite(stretch)) return MIN_STRETCH;
  return Math.min(cap, Math.max(MIN_STRETCH, stretch));
}

// One gesture: the stretch the picture had, and the factor the zoom was
// multiplied by. Both ends of the range clamp, so a reader who zooms all the
// way in and all the way out again is back at the arrangement.
export function stretchStep(stretch, factor, { cap = STRETCH_CAP, exponent = STRETCH_EXPONENT } = {}) {
  if (!(factor > 0) || !Number.isFinite(factor)) return clampStretch(stretch, cap);
  return clampStretch(stretch * factor ** exponent, cap);
}

// What one screen's worth of magnification is, in each direction. The whole of
// what the rest of the view needs to know about the pair, and the number a test
// asks "did the picture widen more than it grew?" of.
export function magnification({ k = 1, s = MIN_STRETCH } = {}) {
  return { x: k * clampStretch(s), y: k };
}
