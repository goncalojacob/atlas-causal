# Backlog

Features agreed as worth doing, not yet scheduled. Owner's list, kept by
the assistant. Scheduled work lives in `docs/*-brief.md`; the position in
`STATUS.md`.

## World scope

- Hand-drawn presences for what CShapes lacks: Cape Verde, São Tomé and
  Príncipe, Portuguese India (Goa, Daman, Diu). CC BY-SA, ours, from
  public-domain sources.
- Spheres of influence for 1415–1580, the period the project was conceived
  for: `presenceType` `sphere-of-influence` and `polity` exist and are
  unused. Historical work, not import work.
- Split the remaining mixed-status CShapes entities (colony → state) in
  batches by editing `data/imports/cshapes-actors.json`; the report is in
  `STATUS.md`.
- Deep-time timeline scale (bucketed or log) and paleo-coastlines
  (`data/geo/land-<epoch>.json`), both designed in `ARCHITECTURE.md`.
- International administrations as actors (League of Nations, United
  Nations) so Danzig and West New Guinea have a `dependencyOf`.
- Portuguese as an i18n overlay (`data/i18n/`), designed.

## Smaller

- "Discuss this record" link to a GitHub issue per record, prefilled.
- Export the current view (map, graph, timeline) as an image; it is SVG.
- A layout that works on a phone: panel and timeline assume a wide screen.
- Level of detail in the graph view past a few hundred events (the map's
  clustering idea along the time axis).
- Close the roles vocabulary (62 in use; the manifest lists them).
- A `container` field on sources (journal, edited volume).
- Narratives in the contribution form, if writing them as JSON proves too
  much for contributors.
- Presences' `capital` as a reference to a place record once places exist.
- Natural Earth's continent assignment (Russia → Europe, Turkey → Asia,
  Greenland → Americas): keep, or redraw the lane polygons.

## Publishing

- Public visibility and GitHub Pages (needs the repository public on the
  current plan).
- The `CONTRIBUTION_PAT` secret and an end-to-end test of the contribution
  pipeline.
- When contributions open to strangers; `CONTEXT.md` argues for after the
  1415–1580 slice exists.
