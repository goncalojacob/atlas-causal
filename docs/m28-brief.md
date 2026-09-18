# Build brief — M28: four small things from the backlog

Written 4 September 2026, late evening. Runs after M27. Read: `CLAUDE.md`,
`STATUS.md`, `ARCHITECTURE.md`, `docs/run-protocol.md`, `docs/m2-brief.md`,
`docs/m9-brief.md`, `docs/m10-brief.md` (sources and citations),
`docs/m12-brief.md` (narratives), `docs/m24-brief.md` and `docs/m26-brief.md`
(what the panel and the layout look like by the time this runs), then this
file. Code only; no historical text. One commit per part, pushed at once.

## 1. A layout that works on a phone

Below a width you choose (around 720 px), the atlas stacks: the view on
top, the timeline under it at a fixed height, the panel as a sheet that
slides up from the bottom when something is selected and can be dragged
down to a handle; the search box full width; the layer toggles and the
grouping behind one "Options" button; the graph view pans by touch. Hit
targets at least 40 px. The resizable panes of M24 are ignored at this
width. Nothing in the URL changes. Check in headless Chromium at
390 × 844 that a mark can be tapped and the sheet appears.

## 2. `container` on sources

An optional `container` on the source schema: `{ title, kind }` with kind
`journal | edited-volume | series | website`, plus the optional `volume`,
`issue` and `pages` a citation needs. `src/citation.js` renders it in the
citation in the bibliography's existing style (article in journal, chapter
in edited volume); the contribution form and the review editor get the
fields; tests for the citation forms. No existing source record is edited.

## 3. Reordering the steps of a narrative in the form

The narrative's step rows in the contribution form and in the review
editor move up and down with buttons and with keyboard (Alt+Up/Down),
the bundle preview following; the pure step-list operations tested in
`src/contribute/bundle.js`.

## 4. A narrative's own page

`narratives.html`: every narrative as a card — title, narrator, period
covered, number of steps, first paragraph — grouped by the period they
cross, so two accounts of the same years sit side by side; each card
opens the narrative at step 1. Linked from the atlas's header next to
Sources and About, and from the narrative card in the panel. Generated
at render from the index, like `sources.html`.

## Docs and done when

`ARCHITECTURE.md` (the page, the field, the phone rule); `about.html`
where it lists the pages; `CLAUDE.md` layout. Done when: the headless
check at phone width passes; a fixture source with a container renders
the expected citation string (assert it); a fixture narrative's steps
reorder and the bundle reflects it; `narratives.html` lists the one
narrative in the dataset; validator and tests green; `STATUS.md` with the
literal line `M28 done`; an "M28" section on PR #1.
