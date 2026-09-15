// The import's grid is the map's grid: one implementation, because two would
// drift and the second would be the one nobody tested. The code lives in
// `src/map/grid.js` — where a module the pages load may live and a module
// under tools/ may not — and this file is the name the import knows it by,
// exactly as `simplify.mjs` beside it is the name it knows the simplifier by.

export {
  GRID, WORLD, cellKey, parseCellKey, cellBounds, cellOf, cellsFor, allCells,
} from '../../src/map/grid.js';
