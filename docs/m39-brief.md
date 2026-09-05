# Build brief — M39: a Pacific-centred projection

Owner's request, 5 September 2026: the world map centred on Asia. Runs
after H4a (the map's hot paths), on `m0`. Read `CLAUDE.md` (no map
library; `src/map/projection.js` is the only file a projection change
touches — this brief widens that to the build tools that cut geometry),
`STATUS.md`, `ARCHITECTURE.md`, `docs/run-protocol.md`, `docs/map-brief.md`,
`docs/m5-brief.md`, `docs/m24-brief.md` (`?bbox=`), `src/map/projection.js`,
`src/util/viewport.js`, `tools/build-regions.mjs`, `tools/import/cshapes.mjs`
and `simplify.mjs`, then this file.

## The change

1. **The central meridian is a parameter** of `src/map/projection.js`
   (`CENTRAL_MERIDIAN`), longitudes shifted and wrapped into
   [−180, 180) around it before projection and unshifted on the way back;
   the default is the meridian chosen in step 2; every projection test
   is parameterised over 0 and the new default.
2. **Choose the seam by measurement.** A pure `splitAtMeridian(geojson,
   lon)` in `tools/import/geometry.mjs` (or beside `simplify.mjs`) cuts
   polygons and lines at a meridian with correct winding and no gaps;
   `tools/build-regions.mjs --seam-report` prints, for central meridians
   from 140°E to 170°E in 5° steps, the land area and the number of
   polygons the seam cuts (Greenland, Iceland, the Atlantic islands,
   Antarctica excluded). Pick the one that cuts least, record the table
   and the choice in `STATUS.md` and `ARCHITECTURE.md`.
3. **Geometry regenerated once** at that seam: `data/geo/land-present.json`
   (`build-regions.mjs`), the presence shards (`cshapes.mjs` re-run from
   the recorded source), `data/geo/regions.json` (the lane polygons; lane
   derivation is in lon/lat and must give the same region for every
   event — assert it), the palette rebuilt, the index rebuilt.
4. **The state and the views.** `?bbox=west,south,east,north` stays in
   real longitudes and may cross the seam (west > east means it wraps);
   `inView` and the map's `viewBbox` handle a wrapping box; pan limits
   and the initial view show the whole world with Asia in the middle;
   labels, clusters, chain lines and the export follow the projection
   through the one function; `?bbox=-10,36,-6,43` still fits Portugal.
5. Docs: `ARCHITECTURE.md` (the projection's parameters and the seam),
   `about.html` (why the map is centred where it is), `CLAUDE.md`'s line
   on `projection.js`.

Done when: the seam table is in `STATUS.md`; the map opens on the world
with Asia centred and no visible tear at the seam at every zoom (a
screenshot under `docs/screens/m39-*.png` through `tools/screens.mjs`);
`?bbox=-10,36,-6,43` fits Portugal and a box crossing the seam fits the
Pacific (browser tests); every event's derived region unchanged (test);
`node tools/validate.mjs --index` byte-identical after the rebuild;
`node --test` green; the literal line `M39 done`.
