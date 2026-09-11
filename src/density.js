// The rest of the dataset, as one shape.
//
// A view draws the window and one period either side of it (util/window.js);
// past that the timeline still says the data carries on, because a lane that
// simply stopped at the edge of the margin would be a lie about the corpus.
// Until H4c it said so with one two-pixel tick per event — at twenty
// thousand events, sixteen thousand `<rect>`s that nobody can click, hover or
// tell apart, rebuilt on every move of the band (health review B, finding 23;
// review of the health plan, finding 28, which asked for exactly this).
//
// So the ticks become one `<path>` per row: the same two pixels wide, on the
// same floor, but with the events that fall on one column drawn as one column
// and its height saying how many. A single far event still draws the tick it
// drew before, to the pixel — the strip is what many of them look like, not a
// different thing.
//
// Pure: numbers in, a path string out. Nothing here knows the DOM, which is
// what lets `node --test` hold it to its two promises — that the columns are
// where the events are, and that the height is a function of the count and
// not of the row it happens to be in.

// How tall a column is, in pixels: the tick's own height for one event, and
// no more than `max` however many there are. Logarithmic and **absolute**,
// so that two rows of the strip can be compared with each other: a scale
// relative to each row's own busiest column would draw one far event and a
// thousand of them the same way. Sixty-four is where it saturates, which on
// this dataset is a decade of one lane at its thickest.
const SATURATES_AT = 64;

export function columnHeight(count, { min = 3, max = 9 } = {}) {
  if (count <= 1) return min;
  const of = Math.min(1, Math.log2(count) / Math.log2(SATURATES_AT));
  return min + Math.round((max - min) * of);
}

// The strip for one row. `xs` are the left edges of the bars that would have
// been drawn, `floor` is the y the ticks sit on, and `unit` is how wide a
// column is — the tick's own width, so that a lone event is unchanged.
//
// Returns '' when there is nothing beyond the margin, so the caller can leave
// the row's path out of the drawing altogether rather than append an empty
// one.
export function densityPath(xs, { floor, unit = 2, min = 3, max = 9 } = {}) {
  if (xs.length === 0) return '';
  const columns = new Map();
  for (const x of xs) {
    // Snapped to the column grid rather than rounded to the pixel: two events
    // a pixel apart are one column, which is the whole point.
    const at = Math.floor(x / unit) * unit;
    columns.set(at, (columns.get(at) ?? 0) + 1);
  }
  // In order, so the same events give the same string and a diff of two
  // renders is empty when nothing moved.
  const at = [...columns.keys()].sort((a, b) => a - b);
  let d = '';
  for (const x of at) {
    const height = columnHeight(columns.get(x), { min, max });
    d += `M${x} ${floor - height}h${unit}v${height}h${-unit}Z`;
  }
  return d;
}
