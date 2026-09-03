# Build brief — M12: narratives, and one example

Written 3 September 2026. Runs after M11. Read, in this order: `CLAUDE.md`
(including the test-dataset exception), `CONTEXT.md` (narratives "signed
by author, not wiki-edited; several competing narratives over the same
period, each attributed, and the reader compares"), `STATUS.md`,
`ARCHITECTURE.md` (current revision; you write the next), `docs/m2-brief.md`,
`docs/m6-brief.md`, `docs/m7-brief.md`, `docs/m10-brief.md`, then this
file. Rules of engagement as in every brief since `docs/m4-brief.md`.

## The `narrative` kind

`schema/v1/narrative.json`: the envelope (sources required — a narrative
cites what it rests on, beyond the records it walks), `title`, `summary`,
`steps`: an ordered array of `{ "ref": "<event or edge id>", "text": "…" }`
with at least two steps, each text non-trivial; optional `window`
(`{from, to}`) to open with. Rules: every ref resolves to an active event
or edge; texts non-trivial; a narrative is signed — `authors` non-empty,
as every record. A narrative never changes a record it walks; it is prose
beside the graph.

## The reader

- **An entry point**: "Narratives" in the header opens a list in the
  panel — title, authors, summary, number of steps — `?narrative=<id>`.
- **Reading mode**: the panel shows the current step's text with the
  record it refers to beneath it (the event's summary, or the edge's
  argument, as the panel already renders them), previous/next controls
  and arrow keys, `?narrative=<id>&step=<n>`. As the reader advances, the
  map, graph and timeline **follow**: the referenced event is selected,
  the window slides to include it, the steps walked so far accumulate as
  the chain in madder where they are connected by edges, and the whole
  narrative's events are emphasised so the reader sees where the walk is
  going. Leaving reading mode restores the ordinary state.
- The event and edge cards list the narratives that pass through them
  ("Part of: …"), so narratives are discoverable from the graph.
- Contribution form: `narrative` as a record type with repeatable steps
  choosing a record by name; if this grows past reason, ship the kind and
  the reader and put the form part in `docs/BACKLOG.md`, saying so.

## The example — under the test-dataset exception

Write **one narrative**, assistant-drafted and marked as every draft
record is: *How the colonial war ended the regime* — from
`angola-war-begins-1961` through Guinea, the PAIGC declaration,
Spínola's book, to `carnation-revolution-1974`, then to the
decolonisation events and `25-november-1975`, about ten steps, each text
two to four sentences that say why this step follows and what the
sources argue, hedged where accounts differ, citing the source records
the dataset already has. The owner and later the community will write
the real ones; this one exists to show the shape.

## Done when

`?narrative=<id>` reads through the example with the views following;
the event cards show "Part of"; the validator is clean; tests cover the
rules and the step navigation logic; the next `ARCHITECTURE.md` revision
(narrative moves from ○ to ●); `STATUS.md` with the literal line
`M12 done`; an "M12" section on PR #1.
