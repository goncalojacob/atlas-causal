// The committed elevation grid → the five bands, as rings. Pure: it is given
// the decompressed bytes and gives back a FeatureCollection, and it opens no
// file and no socket. `naturalearth.mjs` reads the file through
// `tools/import/source.mjs`, as it reads Natural Earth, and hands the bytes
// here.
//
// **Why bands and not a hillshade** (M45b, §2). A band has an edge, and an
// edge is what a border can be seen to sit on: the owner's argument for relief
// is that a frontier following a ridge is a decision about the world and a
// line on an empty page is not. Shading gives an impression and no edge, and
// it would be a raster, which this repository does not have and will not get.
//
// **The grid.** `vendor/elevation/etopo5-10min.i2`: ETOPO5 averaged 2 × 2 to
// 10 arc-minutes, 2160 columns × 1080 rows of int16 little-endian metres, no
// header. Row 0 is at 90° N and rows run south; column 0 is at 0° E and
// columns run east through 360°. `vendor/README.md` has the derivation, the
// sha256 of the decompressed bytes and the ground it was checked against.
//
// **Which point a value is at** is the one thing the file does not say in so
// many words, and it is a half cell — 1/24°, about 4.6 km — either way. It is
// read here as **node registration**: the value at (row, column) is the
// elevation at latitude 90 − row/6 and longitude column/6. That is not a
// guess: `vendor/README.md` records the ground the grid was checked against
// before it was committed, and this reading reproduces four of those spot
// checks exactly — the Everest region 5,276 m, the Tibetan plateau 5,143 m,
// the Andes at 16° S 2,362 m, the Mariana Trench at 11° N 142° E −6,792 m and
// the mid-Pacific at 0°, 180° −5,228 m. The half-cell-offset reading gives
// 5,982 m for the first of those and is therefore not the one the numbers in
// that file were taken with.

// The five bands, and they are frozen (§2.2): 0–200 m, 200–500, 500–1000,
// 1000–2000, above 2000. **Below sea level is not a band** — the Dead Sea and
// the Qattara depression are `physical` features and M45a draws them as
// hollows — so the lowest edge is 0 and nothing under it is drawn at all.
//
// The edges were fixed before any tint was chosen, so that nobody tunes the
// bands to make a picture. A test asserts these five off the manifest and
// fails if anyone moves one without moving the test.
export const BAND_EDGES = Object.freeze([0, 200, 500, 1000, 2000]);

// The band a height falls in, or −1 for anything below the lowest edge. Only
// ever used to describe the bands in prose and in a test; the rings themselves
// are built from the edges directly.
export function bandOf(metres) {
  if (!Number.isFinite(metres) || metres < BAND_EDGES[0]) return -1;
  let band = 0;
  for (let i = 1; i < BAND_EDGES.length; i += 1) if (metres >= BAND_EDGES[i]) band = i;
  return band;
}

// The shape of the committed file, named rather than counted in three places.
export const GRID = Object.freeze({
  columns: 2160,
  rows: 1080,
  // Degrees per cell: 10 arc-minutes.
  step: 1 / 6,
});

export const GRID_BYTES = GRID.columns * GRID.rows * 2;

// Below every edge and below the deepest ocean there is (−11,034 m), so a
// padding cell is never inside a band. Int16's floor, which the source cannot
// itself contain.
const OUTSIDE = -32768;

// The bytes as a field this module can ask questions of, with the padding the
// contouring needs around it. **Every ring closes inside the padded field**,
// which is what makes a contour a ring rather than an open line somebody has
// to walk a boundary to close.
//
// The padding is four things:
//
//   - a column at longitude exactly −180 and another at exactly +180, which
//     are the same meridian and carry the same values (the source's column
//     1080). Without them a band would stop a sixth of a degree short of the
//     antimeridian on each side and the map — whose seam is 30° W, so the
//     antimeridian is in the middle of the picture — would show a hairline
//     gap through the Bering Strait;
//   - a row at latitude −90 carrying the southernmost row's values, because
//     the grid's last row is at 89.833° S and Antarctica does not stop there;
//   - a ring of `OUTSIDE` around all of it, so that no contour ever reaches
//     the edge of the field.
//
// → { width, height, at(row, column), lon(column), lat(row) }
export function readGrid(bytes) {
  if (bytes.length !== GRID_BYTES) {
    throw new Error(`the elevation grid is ${bytes.length} bytes, not the ${GRID_BYTES} of ${GRID.columns} × ${GRID.rows} int16`);
  }
  // Copied rather than viewed: a Buffer out of `gunzipSync` can start at an
  // odd byte offset in its pool, and an Int16Array cannot.
  const source = new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + GRID_BYTES));
  // One extra column at each end for the padding, two more for the two copies
  // of the antimeridian; one extra row at each end, one more for the pole.
  const width = GRID.columns + 3;
  const height = GRID.rows + 3;
  const field = new Int16Array(width * height).fill(OUTSIDE);
  // Column i of the field is at longitude −180 + (i − 1)/6, which puts the
  // real data at i = 1 … 2160 and the second copy of the antimeridian at
  // i = 2161. The source's column 0 is at 0° E, so the column at −180 is its
  // column 1080 and the frame is the source rotated half a world.
  const half = GRID.columns / 2;
  for (let r = 0; r < GRID.rows; r += 1) {
    const row = (r + 1) * width;
    for (let i = 0; i < GRID.columns; i += 1) {
      field[row + 1 + i] = source[r * GRID.columns + ((half + i) % GRID.columns)];
    }
    // +180 is −180 is the source's column 1080.
    field[row + 1 + GRID.columns] = source[r * GRID.columns + half];
  }
  // And the pole row, which is the last row of data carried down to −90.
  const last = GRID.rows * width;
  const pole = (GRID.rows + 1) * width;
  for (let i = 0; i <= GRID.columns; i += 1) field[pole + 1 + i] = field[last + 1 + i];
  return {
    width,
    height,
    field,
    at: (r, c) => field[r * width + c],
    lon: (c) => -180 + (c - 1) / 6,
    lat: (r) => 90 - (r - 1) / 6,
  };
}

// --- marching squares ------------------------------------------------------
//
// One pass per edge, over every square of the padded field, with a corner
// counted **inside** when its height is at or above the edge. The sixteen
// cases are the classic ones and they are written out below rather than
// packed into a lookup table, because the direction of each segment matters
// here: every segment is emitted with the inside on its left, so that the
// segments of one contour chain end to start and a ring falls out of the walk
// with no winding pass afterwards.
//
// The crossing on an edge of a square is linearly interpolated between its two
// corners, which is what keeps a 10-arc-minute shore from being a staircase,
// and it is computed from the same two corners by both of the squares that
// share that edge — so the two agree exactly, to the bit, and a ring closes.
//
// A crossing is named by the edge it is on rather than by its coordinates:
// `h` for the horizontal edge between (r, c) and (r, c + 1), `v` for the
// vertical one between (r, c) and (r + 1, c). Two floats compared for
// equality would be the same identity said less exactly.

const TOP = 0;
const RIGHT = 1;
const BOTTOM = 2;
const LEFT = 3;

// [from, to] per case, two pairs for the two saddles. The bits are
// top-left 8, top-right 4, bottom-right 2, bottom-left 1.
const CASES = Object.freeze([
  [], // 0: nothing inside
  [[BOTTOM, LEFT]], // 1: bottom-left
  [[RIGHT, BOTTOM]], // 2: bottom-right
  [[RIGHT, LEFT]], // 3: the bottom half
  [[TOP, RIGHT]], // 4: top-right
  [[TOP, RIGHT], [BOTTOM, LEFT]], // 5: the saddle, kept apart
  [[TOP, BOTTOM]], // 6: the right half
  [[TOP, LEFT]], // 7: everything but the top-left
  [[LEFT, TOP]], // 8: top-left
  [[BOTTOM, TOP]], // 9: the left half
  [[LEFT, TOP], [RIGHT, BOTTOM]], // 10: the other saddle, kept apart
  [[RIGHT, TOP]], // 11: everything but the top-right
  [[LEFT, RIGHT]], // 12: the top half
  [[BOTTOM, RIGHT]], // 13: everything but the bottom-right
  [[LEFT, BOTTOM]], // 14: everything but the bottom-left
  [], // 15: all of it inside
]);

// Every closed ring of `height >= edge`, in the grid's own degrees. Rings come
// back in the order their first square was met, which is row by row and then
// column by column, so two runs over the same grid give the same list in the
// same order — which is what makes the import idempotent.
export function contour(grid, edge) {
  const { width, height, field } = grid;
  // Where each crossing is, and which crossing follows which. A crossing lies
  // on exactly two squares, and is the start of the chain in one and its end
  // in the other, so `next` is a function and the walk never has to choose.
  const points = new Map();
  const next = new Map();
  const lonOf = (c) => -180 + (c - 1) / 6;
  const latOf = (r) => 90 - (r - 1) / 6;
  // The key of a crossing, and its coordinates, computed from the two corners
  // it lies between.
  const horizontal = (r, c, a, b) => {
    const key = r * width + c;
    if (!points.has(key)) {
      const t = (edge - a) / (b - a);
      points.set(key, [lonOf(c) + t / 6, latOf(r)]);
    }
    return key;
  };
  const vertical = (r, c, a, b) => {
    const key = width * height + r * width + c;
    if (!points.has(key)) {
      const t = (edge - a) / (b - a);
      points.set(key, [lonOf(c), latOf(r) - t / 6]);
    }
    return key;
  };

  for (let r = 0; r + 1 < height; r += 1) {
    const row = r * width;
    const below = (r + 1) * width;
    for (let c = 0; c + 1 < width; c += 1) {
      const tl = field[row + c];
      const tr = field[row + c + 1];
      const br = field[below + c + 1];
      const bl = field[below + c];
      const code = (tl >= edge ? 8 : 0) | (tr >= edge ? 4 : 0) | (br >= edge ? 2 : 0) | (bl >= edge ? 1 : 0);
      const segments = CASES[code];
      if (segments.length === 0) continue;
      // The four crossings this square can have, made only where used.
      const edgeKey = (side) => {
        switch (side) {
          case TOP: return horizontal(r, c, tl, tr);
          case RIGHT: return vertical(r, c + 1, tr, br);
          case BOTTOM: return horizontal(r + 1, c, bl, br);
          default: return vertical(r, c, tl, bl);
        }
      };
      for (const [from, to] of segments) next.set(edgeKey(from), edgeKey(to));
    }
  }

  const rings = [];
  const walked = new Set();
  for (const start of next.keys()) {
    if (walked.has(start)) continue;
    const ring = [];
    let key = start;
    // A chain that leaves the map it came from is impossible — the field is
    // padded on every side — so the walk always comes back to where it began.
    while (!walked.has(key)) {
      walked.add(key);
      ring.push(points.get(key));
      key = next.get(key);
      if (key === undefined) break;
    }
    if (ring.length < 3) continue;
    ring.push([ring[0][0], ring[0][1]]);
    rings.push(ring);
  }
  return rings;
}

// --- the bands as features -------------------------------------------------

// The rings of every edge, once. Band k is drawn from two of them — its own
// edge and the next one up — so contouring per band would walk the grid nine
// times instead of five and give the two bands that share an edge two
// different copies of it.
export function contours(grid, edges = BAND_EDGES) {
  return edges.map((edge) => contour(grid, edge));
}

// One band as a geometry: the rings of its own edge, plus the rings of the
// edge above it, each as a polygon of its own.
//
// **Even-odd is what makes it a band.** The ground above the next edge is
// inside both sets of rings, so a renderer counting crossings leaves it
// unfilled — which is a hole, and a band with a hole in it is exactly the
// ground between two heights. The map already draws every base-map polygon
// with `fill-rule: evenodd` (src/map/layers/base.js), for the island inside a
// lake, and nothing had to be added for this. The alternative — nesting the
// rings so that each is an outer ring with its own holes — needs a
// point-in-polygon pass over half a million points to work out which ring is
// inside which, and it would say the same thing.
//
// The highest band has no edge above it and is the rings of 2000 m alone.
export function bandGeometry(rings, above) {
  const polygons = [...rings, ...(above ?? [])].map((ring) => [ring]);
  if (polygons.length === 0) return null;
  return polygons.length === 1
    ? { type: 'Polygon', coordinates: polygons[0] }
    : { type: 'MultiPolygon', coordinates: polygons };
}

// The whole layer as the collection the import reads it from: one feature per
// band, lowest first, each carrying the band's index and the two heights it
// is between. The properties are the import's own — this file is the only
// source that is not a Natural Earth download, and there is nothing to survey
// — but they go through `features.mjs`'s table like every other layer's, so
// there is one path from a source to a cell and not two.
//
// `min_zoom` is 0 on all five: relief is ground and is drawn at every zoom the
// map has, the way the coastline is.
export function reliefCollection(grid, { edges = BAND_EDGES } = {}) {
  const sets = contours(grid, edges);
  const features = [];
  for (let band = 0; band < edges.length; band += 1) {
    const geometry = bandGeometry(sets[band], sets[band + 1] ?? null);
    if (!geometry) continue;
    features.push({
      type: 'Feature',
      properties: {
        band,
        min_zoom: 0,
        from: edges[band],
        to: band + 1 < edges.length ? edges[band + 1] : null,
      },
      geometry,
    });
  }
  return { type: 'FeatureCollection', features };
}
