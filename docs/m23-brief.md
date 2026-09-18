# Build brief — M23: the full entry page

Written 4 September 2026, evening, from the owner's request: the map and
timeline show a summary; a reader should be able to open a full entry — an
extensive, structured text on the event, actor or place written by
contributors from any sources, not a redirect to Wikipedia. Runs after
M22. Read, in this order: `CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md`,
`CONTEXT.md`, `docs/run-protocol.md` with its amendments, `docs/m2-brief.md`,
`docs/m9-brief.md` (the panel split), `docs/m13-brief.md` (the dashboard
and its editor), `docs/m15-brief.md` (citation flags), then this file.
Rules of engagement as always; no historical text — every `body` ships
empty.

## The field

On `event`, `actor` and `place` records, an optional **`body`**: a string
in a **safe Markdown subset** — paragraphs, `##`/`###` headings, emphasis,
lists, block quotes, links to records by id (`[text](event:25-april-1974)`,
`actor:`, `place:`, `source:`) and to `http(s)` URLs, and citation marks
`[^source-id]` / `[^source-id p. 12]` that must resolve to the record's
own `sources[]` (rule; a body citation to an uncited source is an error).
No raw HTML, no images for now. A pure `src/markdown.js` renders it to
DOM through the escaping helpers — never `innerHTML` of unescaped text —
with tests for every construct and for the things it must refuse. The
record's `summary` stays what the cards show; `body` is the long form.

## The page

`entry.html?id=<record id>` (one page, any of the three kinds): title,
dates, place or seat, actors as chips, the summary, the rendered body
with a table of contents from its headings, the citations resolved and
listed, "Part of" narratives, relations, the Wikipedia link, and a way
back to the atlas with the record selected. Same tokens and typefaces as
the rest; readable line length. Every card gets **"Read the full entry"**
(shown even when `body` is empty, leading to a page that says the entry
has not been written and invites a contribution). Search results link to
it too.

## Form and dashboard

`body` as a textarea with a live preview in the contribution form (event,
actor, place) and in the dashboard's editor, using the same renderer; the
citation marks validated live against the record's sources. The
dashboard's queue shows which records have a body.

## Docs and done when

`ARCHITECTURE.md` next revision (the field, the renderer, the page);
`CONTRIBUTING.md` (how to write an entry, the subset, the citation
marks); `about.html`. Done when: the renderer's tests cover the subset
and the refusals; `entry.html?id=carnation-revolution-1974` renders with
an empty-body notice and its metadata; a fixture record with a body
renders headings, lists, record links and citation marks in headless
Chromium; the form previews; validator and tests green; `STATUS.md` with
the literal line `M23 done`; an "M23" section on PR #1.
