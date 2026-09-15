// The fixed grid the base map is cut on: 60° by 45°, six columns by four
// rows, twenty-four cells. Pure — it imports nothing, reads no disk and
// touches no DOM, because both halves read it: the import writes a file per
// cell (tools/import/grid.mjs re-exports this) and the map asks which cells
// the box on screen overlaps.
//
// **This is not a tile scheme.** There is one grid at one resolution, and
// which cell a reader fetches is decided by the box on screen and never by
// how far they have zoomed. A pyramid would be a tile scheme with a different
// name, and the no-tiles rule is the reason this project draws its own
// coastline at all (map block plan, §6; deviation 515).
//
// The origin is -180° in **data** longitudes, and deliberately not the seam
// (amendment A1 of the M36 review). The seam is a property of the picture:
// src/map/projection.js wraps longitudes around CENTRAL_MERIDIAN, and a grid
// keyed off it would move every cell — and rename every file under
// data/geo/base/ — the day the owner moves the centre. Cells are in the
// coordinates the files are written in; `cellsFor` is the one function that
// has to know a viewport box can wrap.
//
// Keys are `x0y0` … `x5y3`: no sign, so no file name begins with a hyphen and
// no cell key needs escaping in a URL.

export const GRID = Object.freeze({ lon: 60, lat: 45, columns: 6, rows: 4 });

// [west, south, east, north], the box the grid covers: the whole world.
export const WORLD = Object.freeze([-180, -90, 180, 90]);

const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);

export function cellKey(i, j) {
  return `x${i}y${j}`;
}

// A key back into its column and row, or null when it is not one of ours.
export function parseCellKey(key) {
  const m = /^x(\d+)y(\d+)$/.exec(String(key));
  if (!m) return null;
  const i = Number(m[1]);
  const j = Number(m[2]);
  return i < GRID.columns && j < GRID.rows ? { i, j } : null;
}

// Column and row from whatever a caller has in hand: `(i, j)`, a key, or the
// object `cellOf` returns. One normaliser, so `cellBounds(cellOf(p))` reads
// the way a reader expects it to and there is no second spelling of the grid.
function indexOf(cell, j) {
  if (typeof cell === 'number') return { i: cell, j };
  if (typeof cell === 'string') return parseCellKey(cell);
  if (cell && typeof cell === 'object' && typeof cell.i === 'number') return { i: cell.i, j: cell.j };
  return null;
}

// [west, south, east, north] of one cell, or null for a cell that is not on
// the grid. The east and north edges are the next cell's west and south: a
// point on a boundary belongs to exactly one cell, and `cellOf` below is what
// decides which.
export function cellBounds(cell, j) {
  const index = indexOf(cell, j);
  if (!index || !(index.i >= 0 && index.i < GRID.columns && index.j >= 0 && index.j < GRID.rows)) return null;
  const west = WORLD[0] + index.i * GRID.lon;
  const south = WORLD[1] + index.j * GRID.lat;
  return [west, south, west + GRID.lon, south + GRID.lat];
}

// Which cell a point is in, as a key. A point on an internal boundary goes to
// the cell east or north of it, and the two outer edges — 180°E and 90°N —
// are clamped back into the last cell, so every point on the globe is in one
// cell and no point is in two.
export function cellOf(lon, lat) {
  const i = clamp(Math.floor((lon - WORLD[0]) / GRID.lon), 0, GRID.columns - 1);
  const j = clamp(Math.floor((lat - WORLD[1]) / GRID.lat), 0, GRID.rows - 1);
  return cellKey(i, j);
}

// The columns a longitude span [west, east] overlaps. A box whose west is
// east of its east has been wrapped round the antimeridian by a reader
// panning past it (M39a's wrapping `?bbox=`), and is two spans, not one
// empty one.
function columnsFor(west, east) {
  if (west > east) return [...new Set([...columnsFor(west, WORLD[2]), ...columnsFor(WORLD[0], east)])].sort((a, b) => a - b);
  const first = clamp(Math.floor((west - WORLD[0]) / GRID.lon), 0, GRID.columns - 1);
  // `ceil - 1`, not `floor`: a box whose east edge lies exactly on a cell's
  // west edge overlaps that cell in nothing at all, and asking for the file
  // would be a request for a cell the reader cannot see.
  const last = clamp(Math.ceil((east - WORLD[0]) / GRID.lon) - 1, first, GRID.columns - 1);
  const out = [];
  for (let i = first; i <= last; i += 1) out.push(i);
  return out;
}

function rowsFor(south, north) {
  const first = clamp(Math.floor((south - WORLD[1]) / GRID.lat), 0, GRID.rows - 1);
  const last = clamp(Math.ceil((north - WORLD[1]) / GRID.lat) - 1, first, GRID.rows - 1);
  const out = [];
  for (let j = first; j <= last; j += 1) out.push(j);
  return out;
}

// The keys a viewport box [west, south, east, north] overlaps, sorted, so two
// callers asking the same question get the same list in the same order.
// Latitudes do not wrap; longitudes do, and a box whose west is east of its
// east is the wrapped one.
export function cellsFor(box) {
  const [west, south, east, north] = box;
  const keys = [];
  for (const i of columnsFor(west, east)) {
    for (const j of rowsFor(south, north)) keys.push(cellKey(i, j));
  }
  return keys.sort();
}

// Every cell of the grid, in key order: what `cellsFor(WORLD)` comes to, and
// what an import walks when it asks each cell what it holds.
export function allCells() {
  return cellsFor(WORLD);
}
