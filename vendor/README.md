# Vendored sources

Inputs to the geometry imports, never served and never in the deploy allowlist. Each file is stored gzipped; the tools read it through `node:zlib` and check the sha256 of the **decompressed** bytes against `SHA256SUMS`. Downloaded by the owner's assistant on 8 September 2026.

- Natural Earth v5.1.2 GeoJSON, public domain: `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/<file>`. Natural Earth is "free of any licence restrictions in any way" and asks to be named nowhere; what was derived from these files, and exactly what each import changed, is in **`data/geo/LICENSE`**.

**Which file feeds which layer.** `110m/` is `tools/build-regions.mjs` → `data/geo/regions.json`, and was `land-present.json` until M36a. `10m/` is `tools/import/naturalearth.mjs` → the base map: `ne_10m_land` and `ne_10m_minor_islands` → `land-present.json` and `data/geo/base/coast/` (M36a); `ne_10m_rivers_lake_centerlines`, `ne_10m_lakes`, `ne_10m_geography_regions_polys` and `ne_10m_geography_regions_elevation_points` → rivers, lakes, physical regions and mountains (M36b); `ne_10m_populated_places` → cities (M36c). A file with no layer yet is committed anyway, because the download happens once and a base map nobody can regenerate is a base map nobody can correct.

**`--check` reads the sha256 below and nothing else.** The tools hash the file *decompressed*, so these are the hashes of the files as they were downloaded and gzipping them changed nothing a reader can verify. `tools/import/naturalearth.mjs` carries the seven 10 m hashes as module constants, taken from this table; if one ever differs, the run stops and says which file — it does not substitute, does not download, and does not drop to a lower resolution.
- CShapes 2.0 (`cshapes_2_gw.topojson`, from `https://raw.githubusercontent.com/cran/cshapes/master/inst/extdata/cshapes_2_gw.topojson.xz`, decompressed and re-gzipped), CC BY-NC-SA 4.0 — the licence `data/geo/LICENSE` records for the presences; nothing from it is copied into a CC BY-SA record.

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
