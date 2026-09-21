# Vendored sources

Inputs to the geometry imports, never served and never in the deploy allowlist. Each file is stored gzipped; the tools read it through `node:zlib` and check the sha256 of the **decompressed** bytes against `SHA256SUMS`. Downloaded by the owner's assistant on 8 September 2026.

- Natural Earth v5.1.2 GeoJSON, public domain: `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/<file>`. Natural Earth is "free of any licence restrictions in any way" and asks to be named nowhere; what was derived from these files, and exactly what each import changed, is in **`data/geo/LICENSE`**.

**Which file feeds which layer.** `110m/` is `tools/build-regions.mjs` → `data/geo/regions.json`, and was `land-present.json` until M36a. `10m/` is `tools/import/naturalearth.mjs` → the base map: `ne_10m_land` and `ne_10m_minor_islands` → `land-present.json` and `data/geo/base/coast/` (M36a); `ne_10m_rivers_lake_centerlines`, `ne_10m_lakes`, `ne_10m_geography_regions_polys` and `ne_10m_geography_regions_elevation_points` → rivers, lakes, physical regions and mountains (M36b); `ne_10m_populated_places` → cities (M36c). A file with no layer yet is committed anyway, because the download happens once and a base map nobody can regenerate is a base map nobody can correct.

**`--check` reads the sha256 below and nothing else.** The tools hash the file *decompressed*, so these are the hashes of the files as they were downloaded and gzipping them changed nothing a reader can verify. `tools/import/naturalearth.mjs` carries the seven 10 m hashes as module constants, taken from this table; if one ever differs, the run stops and says which file — it does not substitute, does not download, and does not drop to a lower resolution.
- CShapes 2.0 (`cshapes_2_gw.topojson`, from `https://raw.githubusercontent.com/cran/cshapes/master/inst/extdata/cshapes_2_gw.topojson.xz`, decompressed and re-gzipped), CC BY-NC-SA 4.0 — the licence `data/geo/LICENSE` records for the presences; nothing from it is copied into a CC BY-SA record.

- Historical Basemaps (`aourednik/historical-basemaps` at commit `da7a4b73`, from `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/<file>`, re-gzipped), **GPL-3.0** — the repository's single `LICENSE` is the stock GPLv3 and covers `geojson/` with everything else. Thirteen of its fifty-four world snapshots, the ones from 1400 on; the ten from 1900 on are not here because CShapes covers 1886 onward and wins there. `data/geo/LICENSE` records what was derived and under what; STATUS.md → `M43a` records why a GPL source was taken at all and exactly which files it binds. Downloaded by the owner's assistant on 16 September 2026.

- **ETOPO5, downsampled** (`elevation/etopo5-10min.i2`), from NOAA NCEI at `https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO5/TOPO/ETOPO5/ETOPO5.DOS` — a work of the United States Government, **public domain**. The download is the 5-arc-minute grid (4320 × 2160 int16 little-endian, 18,662,400 bytes, sha256 of the raw file `bcb4ed5585e07ffe4244b19cb0d645c0ceb10877a22a71b21370efa19e6cb792`), which gzips to 11.35 MB and is over the 8 MB the M45 brief allows a vendored grid; what is committed is that grid **averaged 2 × 2 to 10 arc-minutes**, each cell the mean of its four source cells rounded to the nearest metre (Python `round`, ties to even), so a coastline is not decided by whichever of four samples happened to be kept. **Layout**: 2160 columns × 1080 rows of int16 little-endian metres, **row 0 at 90° N and rows running south, column 0 at 0° E and columns running east through 360°**, one cell = 10 arc-minutes, no header. Checked against known ground before committing: Lisbon 6 m, the Everest region 5,276 m, the Tibetan plateau 5,143 m, the Andes at 16° S 2,362 m, the Mariana Trench −6,792 m, the mid-Pacific −5,228 m. Downloaded and derived by the owner's assistant on 20 September 2026 for M45b.

| file | raw bytes | gzipped bytes | sha256 (raw) |
|---|---|---|---|
| `natural-earth/110m/ne_110m_admin_0_countries.geojson` | 838,726 | 209,562 | `6866c877d39cba9c…` |
| `natural-earth/110m/ne_110m_land.geojson` | 138,160 | 51,290 | `9e0729ee253ca7d7…` |
| `natural-earth/10m/ne_10m_geography_regions_elevation_points.geojson` | 862,686 | 184,231 | `f98a16867867146e…` |
| `natural-earth/10m/ne_10m_geography_regions_polys.geojson` | 5,583,870 | 2,021,554 | `b7b26e50ea917d36…` |
| `natural-earth/10m/ne_10m_lakes.geojson` | 5,043,554 | 1,565,182 | `2d036f53dedec578…` |
| `natural-earth/10m/ne_10m_land.geojson` | 10,157,965 | 3,569,342 | `1ac90796408bc6ad…` |
| `natural-earth/10m/ne_10m_minor_islands.geojson` | 1,320,514 | 304,082 | `8c933ca7a4760256…` |
| `natural-earth/10m/ne_10m_populated_places.geojson` | 19,359,003 | 2,743,137 | `9b8e3de09048ef00…` |
| `natural-earth/10m/ne_10m_rivers_lake_centerlines.geojson` | 7,307,743 | 2,271,717 | `bb854a900ecbd3b4…` |
| `cshapes/cshapes_2_gw.topojson` | 7,621,704 | 2,842,159 | `9f73468bb56aae6a…` |
| `historical-basemaps/world_1400.geojson` | 1,053,803 | 409,956 | `c6b0efcb42d9520a…` |
| `historical-basemaps/world_1492.geojson` | 3,468,360 | 1,255,957 | `b0e6b0f299fc7b19…` |
| `historical-basemaps/world_1500.geojson` | 1,170,331 | 448,749 | `d01ffc9b80629787…` |
| `historical-basemaps/world_1530.geojson` | 1,401,257 | 511,018 | `984005809f085285…` |
| `historical-basemaps/world_1600.geojson` | 1,680,222 | 602,354 | `7285c07eeedfda90…` |
| `historical-basemaps/world_1650.geojson` | 1,650,748 | 600,274 | `e691a3b5bab4ca7a…` |
| `historical-basemaps/world_1700.geojson` | 1,625,990 | 594,042 | `eb73d6b00e98205f…` |
| `historical-basemaps/world_1715.geojson` | 1,695,707 | 617,026 | `fdf5097dd21c30c9…` |
| `historical-basemaps/world_1783.geojson` | 1,668,045 | 612,211 | `7cfa92418a8628df…` |
| `historical-basemaps/world_1800.geojson` | 1,638,994 | 606,158 | `51fcb6b1f1c36195…` |
| `historical-basemaps/world_1815.geojson` | 2,413,409 | 865,299 | `fb654f734583f550…` |
| `historical-basemaps/world_1878.geojson` | 1,713,853 | 534,972 | `e792520cd24cfb77…` |
| `historical-basemaps/world_1880.geojson` | 1,302,639 | 507,561 | `4751e30d881d60d3…` |
| `elevation/etopo5-10min.i2` | 4,665,600 | 3,302,132 | `a05c9065457588a2…` |
