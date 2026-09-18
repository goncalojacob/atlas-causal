# Build brief — M21: summaries, actors and edges for the imported events, 1890–1974

Written 4 September 2026, evening. Runs after M20. Read, in this order:
`CLAUDE.md` (the dated exception — everything here is drafted under it and
marked), `STATUS.md`, `ARCHITECTURE.md`, `CONTEXT.md` (the five edge
types, confidence, disputes, convergence), `docs/run-protocol.md`,
`docs/m2-brief.md`, `docs/m4-brief.md` (how the first batch of records was
specified), `docs/m8-brief.md`, `docs/m15-brief.md` (the Wikipedia
consensus rule), `docs/review-2026-09-04-plan.md` (findings 13 and 17),
then this file. No network; the Wikipedia leads are cached under
`tools/import/cache/wikipedia/`.

## Scope

Every event imported by M20 whose start is **before 1975**, plus the
imported actors and places they involve. M22 takes 1975 onward. Work
period by period, oldest first, **one commit per decade**, pushed at
once, so a cut-off loses at most a decade.

## For each imported event

1. **Summary**: three to six sentences from the cached lead and the
   existing sources — what happened, when and where, who, why it is in
   the atlas — in the atlas's voice, never pasted; cite `wikipedia-en`
   and/or `wikipedia-pt` with title and revision id as locator, and any
   book in the bibliography that covers it.
2. **Actors with roles**: link the actors the event names to existing
   actor records (by `wikidata` first, then by name), create missing ones
   as drafted records under the exception, roles from the vocabulary in
   use (the manifest lists it).
3. **Edges — the two-edges rule.** Each event needs at least two argued
   edges, at least one outgoing, to events already in the atlas or to
   other imported events. Type from the five; confidence honest —
   **`consensus` only with two sources by different authors, never on
   Wikipedia alone** (the rule enforces it); `disputed` with a `dispute`
   block where accounts differ. Every drafted edge carries
   `review: { "flags": ["edge-drafted"] }`.
4. **Retraction is the honest outcome, not a failure.** An event you
   cannot wire with edges you can genuinely argue from the material is
   set `status: retracted` with a one-line reason in
   `docs/m21-retractions.md`. Expect a substantial share — elections
   every few years, minor treaties, disasters without consequence — to be
   retracted; a retraction rate under 20% is a signal that edges are being
   invented, and the brief treats it as a failure. Never write an edge to
   keep an event.
5. **Relations** between actors where the event makes one plain
   (`led`, `member-of`, `succeeded`) — sparingly, sourced.

## Done when

Every pre-1975 imported event is either wired (≥2 edges, one outgoing)
or retracted and listed; summaries and actors done; validator clean of
errors; tests green; `STATUS.md` with counts per decade (wired,
retracted, edges, actors created) and the literal line `M21 done`; an
"M21" section on PR #1.
