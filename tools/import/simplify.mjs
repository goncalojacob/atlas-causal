// The import's simplification is the site's simplification: since H4a the map
// simplifies the territory outlines again in the browser, by zoom, and one
// Douglas–Peucker is all this repository is going to have. The code moved to
// `src/util/simplify.js` — where a module the pages load may live and a module
// under tools/ may not — and this file is the name the import knows it by.

export {
  segmentDistance, douglasPeucker, round, quantize, MIN_DETAIL, arcExtent,
  simplifyArc, ringArea, keepRing, pruneGeometry, simplifyGeometry, countPoints,
} from '../../src/util/simplify.js';
