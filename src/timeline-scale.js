// The timeline's horizontal scale, injected into timeline.js so deep time
// can swap in a bucketed scale later without touching the lanes. Works in
// astronomical years (see util/dates.js); callers convert at the edges.
//
// M43b: deep time arrived, and the swap is made here rather than by the
// caller. Two scales live in this file and `createTimelineScale` picks
// between them off the corpus itself:
//
//   - `createLinearScale`, unchanged, for a corpus inside two centuries —
//     which is `data/` today and what every picture under docs/screens/ was
//     taken of;
//   - `createCenturyScale` for one that is longer and lopsided, where the
//     width is shared out century by century instead of year by year.
//
// Why bucketed and not "linear inside the band, compressed outside", which
// the brief allows equally: a scale that follows the band is a scale that
// moves whenever the band does. The lanes are packed on the scale's own
// geometry (lanes.js), so every frame of a drag would repack the rows and
// the bars would slide under the cursor that is dragging them; and the wheel
// reads the year under the pointer through `invert` and then sets a window,
// which would change the scale that `invert` had just been read from — the
// pointer would no longer be over the year it zoomed on. The buckets are a
// fact about the data and stand still while the reader works, which is the
// same argument timeline.js makes for keeping the lanes on the whole extent.

import { fromAstronomical, formatYear } from './util/dates.js';
import { CENTURY, centuryOf, crowded } from './util/window.js';

const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];

// The narrowest two tick labels may be and still be two labels. Not a type
// size — the axis is set at the one size `.timeline .tick-label` gives it in
// style.css and this file adds none — but the room that size needs: a four-
// digit year at 11 px is about 24 px of ink, and a third of that again is the
// air that keeps two of them from reading as one number. It bounds the century
// boundaries only; the round years inside a bucket are spaced by the count the
// caller asks for, which is always wider.
const LABEL_GAP = 34;

export function createLinearScale({ domain, range }) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return {
    domain,
    range,
    x(year) {
      return r0 + (year - d0) * k;
    },
    invert(px) {
      return k === 0 ? d0 : d0 + (px - r0) / k;
    },
    // Round tick values inside the domain, about `count` of them. Year 0
    // does not exist in the data but is a fine tick position on an
    // astronomical axis; its label is "1 BCE".
    ticks(count = 8) {
      const span = Math.abs(d1 - d0);
      if (span === 0) return [{ value: d0, label: formatYear(fromAstronomical(Math.round(d0))) }];
      const rough = span / count;
      const step = STEPS.find((s) => s >= rough) ?? STEPS[STEPS.length - 1];
      const out = [];
      for (let v = Math.ceil(Math.min(d0, d1) / step) * step; v <= Math.max(d0, d1); v += step) {
        out.push({ value: v, label: formatYear(fromAstronomical(v)) });
      }
      return out;
    },
  };
}

// How much of the width a century is worth. Two terms, added rather than
// multiplied so that neither can take the other to nothing:
//
//   - its length, in centuries, which is 1 for every whole century and less
//     for the part-centuries the padded domain leaves at each end. This is the
//     floor: an empty century still has a width, so five centuries nobody
//     wrote about are five labelled columns and not one hairline.
//   - the base-two logarithm of how many events it holds. Logarithmic because
//     the corpus really is lopsided — a century with four thousand events
//     against one with forty — and a share proportional to the count would
//     give the sparse centuries the sliver the linear scale already gave them.
//     A doubling of the corpus in a century is worth one unit of width,
//     whether it is the first doubling or the eighth.
//
// So an empty century is worth 1, a century of forty about 6.4, and a century
// of four thousand about 13. The busiest century gets roughly twice the
// sparsest and not a hundred times it, which is what "compressed" means here.
function weigh(from, to, count) {
  return (to - from) / CENTURY + Math.log2(1 + count);
}

// The domain cut on the century boundaries inside it. The two end buckets are
// part-centuries, because the domain is the extent with a margin either side
// and does not land on a round year.
function bucketsOf(domain, counts) {
  const [d0, d1] = domain;
  const edges = [d0];
  for (let c = centuryOf(d0) + CENTURY; c < d1; c += CENTURY) edges.push(c);
  edges.push(d1);
  const buckets = [];
  for (let i = 0; i + 1 < edges.length; i += 1) {
    const from = edges[i];
    const to = edges[i + 1];
    // Every bucket lies inside one century by construction, so the count is
    // that century's own. A part-century at either end carries its whole
    // century's count and its own shorter length, which is the right way
    // round: what makes a column wide is what is in it.
    const count = counts?.get(centuryOf(from)) ?? 0;
    buckets.push({ from, to, count, weight: weigh(from, to, count) });
  }
  return buckets;
}

// Linear inside a century, and each century as wide as `weigh` says. Exactly
// invertible — `invert(x(y)) === y` to the float — because it is piecewise
// linear and strictly increasing, which is what `barBox`, the handles and the
// wheel all rest on.
export function createCenturyScale({ domain, range, counts = null }) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (!(d1 > d0)) return createLinearScale({ domain, range });
  const buckets = bucketsOf(domain, counts);
  const total = buckets.reduce((sum, b) => sum + b.weight, 0);
  let at = r0;
  for (const b of buckets) {
    b.x0 = at;
    at += total === 0 ? (r1 - r0) / buckets.length : ((r1 - r0) * b.weight) / total;
    b.x1 = at;
    b.k = (b.x1 - b.x0) / (b.to - b.from);
  }
  // The last edge is the range's, not the sum of a dozen divisions: a bar at
  // the far end of the data must land on the far end of the drawing.
  const last = buckets[buckets.length - 1];
  last.x1 = r1;
  last.k = (last.x1 - last.x0) / (last.to - last.from);

  // Which bucket a year, or a pixel, falls in. Binary search and not a scan:
  // `barBox` asks twice per event and a corpus of twenty thousand asks forty
  // thousand times per render. Outside the domain the nearest end bucket
  // answers, so a year past the margin extrapolates rather than throwing.
  const find = (value, edge) => {
    let lo = 0;
    let hi = buckets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (value >= buckets[mid][edge]) lo = mid;
      else hi = mid - 1;
    }
    return buckets[lo];
  };

  const xOf = (year) => {
    const b = find(year, 'from');
    return b.x0 + (year - b.from) * b.k;
  };

  return {
    domain,
    range,
    // Exposed for the tests and for anything that wants to say how the width
    // was shared out; nothing in the drawing reads it.
    buckets: buckets.map((b) => ({ from: b.from, to: b.to, count: b.count, x0: b.x0, x1: b.x1 })),
    x: xOf,
    invert(px) {
      const b = find(px, 'x0');
      return b.k === 0 ? b.from : b.from + (px - b.x0) / b.k;
    },
    // The century boundaries first — they are what the buckets are cut on and
    // what a reader reads a compressed stretch by — and then, inside a bucket
    // with the room for them, round years at the finest step whose spacing is
    // still wider than one label.
    //
    // **A century is labelled only where its label fits.** At 390 px the axis
    // is some 260 px and eight centuries would be eight labels twelve pixels
    // apart, which is not eight labels, it is a smudge. A label dropped is a
    // century the reader reads off its neighbours; two overprinted is a century
    // the reader cannot read at all. So the boundaries are thinned to
    // `LABEL_GAP` — the room a year needs, and not the spacing `count` asks
    // for, which would drop a century wherever its column is narrower than an
    // even share and is a rule about a linear axis rather than about this one.
    //
    // Where a boundary and a round year inside a bucket fall on the same few
    // pixels the boundary wins: it is the one the buckets are cut on. Where
    // two *boundaries* are that close the earlier one stands and the later is
    // dropped — a century may take a round year's place but never another
    // century's, or a run of narrow columns would hand the label along from
    // one to the next and leave only the last of them labelled.
    ticks(count = 8) {
      const minPx = Math.abs(r1 - r0) / Math.max(1, count);
      const wanted = new Map();
      for (const b of buckets) {
        if (b.from >= d0 && b.from <= d1 && b.from % CENTURY === 0) wanted.set(b.from, true);
      }
      for (const b of buckets) {
        const step = STEPS.find((s) => s < CENTURY && s * b.k >= minPx);
        if (step === undefined) continue;
        for (let v = Math.ceil(b.from / step) * step; v < b.to; v += step) {
          if (v >= d0 && v <= d1 && !wanted.has(v)) wanted.set(v, false);
        }
      }
      const out = [];
      const tick = (value) => ({ value, label: formatYear(fromAstronomical(value)) });
      let last = -Infinity;
      let lastIsCentury = false;
      for (const [value, isCentury] of [...wanted].sort((one, other) => one[0] - other[0])) {
        const x = xOf(value);
        if (x - last >= LABEL_GAP) {
          out.push(tick(value));
          last = x;
          lastIsCentury = isCentury;
          continue;
        }
        // Too close to what is already there. A century boundary takes the
        // place of the round year it is crowding — which is further left, so
        // whatever came before is further still and nothing else moves. It
        // never takes another century's place, and a dropped one leaves `last`
        // where it was, so the next century along is measured from the label
        // that is really there.
        if (!isCentury || lastIsCentury || out.length === 0) continue;
        out[out.length - 1] = tick(value);
        last = x;
        lastIsCentury = true;
      }
      return out;
    },
  };
}

// What timeline.js actually builds. `counts` and `extent` are the corpus's
// own (util/window.js); without them, or under the threshold, this is the
// linear scale it always was.
export function createTimelineScale({ domain, range, counts = null, extent = null }) {
  return crowded(counts, extent)
    ? createCenturyScale({ domain, range, counts })
    : createLinearScale({ domain, range });
}
