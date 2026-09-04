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
- Reordering the steps of a narrative in the contribution form: the rows are
  added in the order of the walk and can be removed, but a step written in the
  wrong place has to be removed and added again. (The form itself was built in
  M12; this is the one thing it does not do.)
- A narrative's own page in the list, so several accounts of the same period
  can be read side by side rather than one at a time.
- **One renderer for the contribution form and the review editor.** They
  share the field definitions and not the code that draws them (deviation 82
  in `STATUS.md`). Extracting `form.js`'s entry renderer is the right shape;
  do it with a DOM test under the form first, because nothing in the test
  suite would catch a regression there today.
- A record's history on the review dashboard: what a signature changed, read
  from git, so a reviewer can see what the draft said before they fixed it.
- Presences' `capital` as a reference to a place record once places exist.
- Natural Earth's continent assignment (Russia → Europe, Turkey → Asia,
  Greenland → Americas): keep, or redraw the lane polygons.

## Reading

- **A full page per record.** The map and the timeline show a summary; a
  reader should be able to open a full entry — an extensive, structured
  text on the event, actor or place, with sections and citations, written
  by contributors from any sources, not a redirect to Wikipedia. This is
  where information that lives in several sources gets written down at
  length. Needs a long-text field on the record (a safe subset of Markdown,
  escaped like everything else), a route or page per record, "Read the
  full entry" from every card, the field in the form and the dashboard,
  and the same citation-verification treatment as the summary. Owner's
  request, 4 September 2026.

## Publishing

- Public visibility and GitHub Pages (needs the repository public on the
  current plan).
- The `CONTRIBUTION_PAT` secret and an end-to-end test of the contribution
  pipeline.
- When contributions open to strangers; `CONTEXT.md` argues for after the
  1415–1580 slice exists.

## Research

- **A small language model that writes narratives on demand from the
  atlas's own records, and nothing else** — no paid API, no dependence on a
  vendor. Owner's idea, 3 September 2026. Constraints it must satisfy
  before it can be more than an experiment, from `CONTEXT.md` and
  `CLAUDE.md`: the model may only *explain and connect records that
  exist* (events, edges with their explanations and sources, actors,
  relations), never invent a link or a fact; every generated narrative is
  marked as generated, keeps the subgraph it was built from (the record
  ids), and can be checked claim by claim against those records; a
  generated narrative never enters `data/narratives/` unless a person
  reviews and signs it. Open questions: whether "on demand" means in the
  browser (a quantised small model over WebGPU/WASM is a large optional
  asset, not a runtime dependency in the sense of the rule, but it has to
  be decided) or on the maintainer's machine in batch, as `CONTEXT.md`
  already sketches; how to constrain generation to the retrieved records
  (retrieval over the graph plus a verifier that rejects sentences that
  cite nothing); and how the interface labels a generated walk so it is
  never mistaken for a signed one. Start with the batch form and a
  verifier; the browser form only if the batch form proves honest.

