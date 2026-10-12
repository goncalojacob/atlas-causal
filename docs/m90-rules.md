# The rules card — what a planner and a writer must know

Written 12 October 2026 for M90. This card is the whole of the records rules
a routine needs at the point of writing. It is distilled from the M42 brief's
amendments A1 to A15 (`docs/m42-brief.md`), which remain the authority where
this card is silent; nothing here loosens them. A routine reads this card and
`node tools/queue/state.mjs`, not the pool files.

## What a record is

1. **Real events only.** An event is a Wikidata item with an English Wikipedia
   article, imported by `tools/import/wikidata.mjs`. No AI-written historical
   claim, no invented date, no record drafted from memory. The dated exception
   (`CLAUDE.md`) covers the polities' descriptions and nothing else.
2. **Summary.** The cached English lead at a named revision, quoted, with the
   `summary-from-lead` flag. Never the import's placeholder. An article that
   redirects elsewhere gets the `article-is-redirect` flag and no quote.
3. **Interval.** From the item (`P580`/`P582` over `P585`); widened only from
   the record's own cited article at a named revision (A7), and the first
   sentence's day and month are compared, not only the year (A15(4)).
4. **Place.** The item's own `P625` first, then `P276`, `P131`, `P17`, with
   `precision` from the item's class (A9, A12). A `P17` country is refused
   where its inception is after the event's end or its dissolution before the
   event's start, where the item names more than one country, or where the
   country's point is over 1,000 km from every located point on the event's
   chain (A15(6)). A place whose lane disagrees with the event's is not
   written (the lane guard). Places carry `summary: null`.
5. **Lane.** Derived from the item's own point or its first located
   `P276`/`P131` (A15(7)); a seeded lane only where no point exists.
6. **Actors.** The import writes none. A `P710` participant is written only
   where the atlas holds every participant the item names, with a role from
   `data/roles.json` and a note quoting the item (A11(a), M67 A1: an event
   with no actor is not a defect).

## What an edge is

7. **The bar.** A record earns its place by one honest edge to something the
   atlas holds (M42 §1). Nothing is written in order to keep a record. A
   record that cannot earn an edge is retracted with its reason, or not
   imported at all: a batch that walks a held umbrella's `P361` children
   imports only the children it can connect (A15(1)).
8. **Five types,** `caused`, `enabled`, `reacted-to`, `precondition-of`,
   `inspired`; no sixth. `confidence` is `probable`; `consensus` only where
   the article hangs the very sentence on a work of scholarship it cites
   (`docs/m72-sources.md`); `disputed` carries a `dispute` and is never a
   silent change.
9. **The quote.** Every edge carries the article's own sentence, verbatim, at
   a named revision, as its locator and in its explanation. The writer checks
   the quote against that revision mechanically and writes no edge whose
   quote it cannot find.
10. **The chronology refusal (A15(5)).** A sentence that opens with "After",
    "Following", "In the aftermath", "Shortly after", or that states only that
    one thing came before another, states no cause and earns no edge. A
    sentence that names a third event the atlas holds as the cause gives the
    edge to that event or to nobody.
11. **No edge from a parent to its own child** until the owner decides C8
    (A14). The arrow of time is a validator error, not a judgement.
12. **Umbrellas (A6, A8).** A period historians name is an umbrella; the main
    count must not rise from what a fire finds it at; `parent` is a list and a
    filing writes every umbrella that fits, the nearest first. Edges that cross
    an umbrella are counted beside the largest component (A15(11)).

## Where the work goes

13. **The partition (A10, A11(b), A15(1)).** Lanes that trail come first:
    Africa and Asia before the Americas before Europe; Europe before 1900 is
    paused until Africa and Asia each hold 303 active events. Writer A takes
    `africa`, `asia` and `europe` on branch `m42`; writer B takes `americas`
    on branch `m42b`. A writer never imports what the other branch holds.
14. **The recache (A15(2)).** The last step of every writer fire is
    `node tools/cache-evidence.mjs --fill` over the fire's own citations.
15. **Records first, rebuild, then commit the index** (798). `validate
    --index` clean at every push. Tests before behaviour (711, 717). No
    display change from a records routine, ever.
16. **Nothing is merged into `main` by a lane.** The planner pushes only to
    `plan`; the writers only to their own branch; the assistant lands.
