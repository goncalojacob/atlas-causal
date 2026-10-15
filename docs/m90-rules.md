# The records rules for the planner and the writers

The assistant wrote this card on 12 October 2026 for M90, the milestone that
split the records work between a planner and two writers. The card holds every
records rule a routine needs while it writes. It comes from amendments A1 to
A15 of the M42 brief (`docs/m42-brief.md`, the world-at-scale import). Where
this card says nothing, the brief decides. Nothing here loosens the brief. A
routine reads this card and the output of `node tools/queue/state.mjs`. It
does not read the pool files.

## What a record is

1. **Real events only.** An event is a Wikidata item with an English Wikipedia
   article, and `tools/import/wikidata.mjs` imports it. A record carries no
   AI-written historical claim and no invented date, and nobody drafts one
   from memory. The dated exception in `CLAUDE.md` covers the descriptions of
   the polities and nothing else.
2. **Summary.** The summary quotes the cached English lead at a named
   revision and carries the `summary-from-lead` flag. It is never the
   import's placeholder. When the article redirects to another article, the
   record gets the `article-is-redirect` flag and no quote.
3. **Interval.** The interval comes from the item (`P580`/`P582` over
   `P585`). The writer widens it only from the record's own cited article at a
   named revision (A7). The writer compares the day and month of the first
   sentence as well as the year (A15(4)).
4. **Place.** The place comes from the item's own `P625` first, then `P276`,
   `P131`, `P17`, and the item's class sets `precision` (A9, A12). The writer
   refuses a `P17` country in three cases (A15(6)):
   - The country's inception is after the event's end, or its dissolution is
     before the event's start.
   - The item names more than one country.
   - The country's point is more than 1,000 km from every located point on
     the event's chain.

   The writer does not write a place whose lane differs from the event's lane
   (the lane guard). Places carry `summary: null`.
5. **Lane.** The lane comes from the item's own point or from its first
   located `P276`/`P131` (A15(7)). A seeded lane applies only where the item
   has no point.
6. **Actors.** The import writes no actors. The writer adds a `P710`
   participant only where the atlas holds every participant the item names.
   It gives the actor a role from `data/roles.json` and a note that quotes the
   item (A11(a)). An event with no actor is not a defect (M67 A1).

## What an edge is

7. **An event does not need an edge (since 13 October 2026).** The owner:
   *"the priority is to add most events of historical significance since
   around 1500, even if for now there is no parent or child for it. Just add
   all events that are relevant and connect them when you can."* The writer
   adds an event of significance whether or not it can write an edge for it
   today. It writes an edge only where it has verified the article's sentence
   (cards 9 and 10). A record with no edge is not a defect. The planner
   connects it when it can. The writer never writes anything only to keep a
   record, and never invents an edge to connect one. A17 withdrew the rule of
   M42 §1 that a record earns its place by an edge, and A15(1)'s reading of
   that rule.
8. **Five types:** `caused`, `enabled`, `reacted-to`, `precondition-of`,
   `inspired`. There is no sixth. `confidence` is `probable`. It is
   `consensus` only where the article ties that same sentence to a work of
   scholarship it cites (`docs/m72-sources.md`). A `disputed` edge carries a
   `dispute`, so the change to `disputed` is never silent.
9. **The quote.** Every edge carries the article's own sentence, verbatim, at
   a named revision. The sentence is the edge's locator and part of its
   explanation. The writer checks the quote against that revision by code
   and writes no edge whose quote it cannot find.
10. **Sentences that only give the order of events (A15(5)).** A sentence
    that opens with "After", "Following", "In the aftermath" or "Shortly
    after", or that states only that one thing came before another, states
    no cause. It earns no edge. When a sentence names as the cause a third
    event that the atlas holds, the edge goes to that event or to nobody.
11. **A parent may carry an edge to its own child, and a child to its
    parent,** where the article states it. The owner removed A14's
    parent-to-child rule on 13 October 2026 (*"Ok let's remove the parent
    to child rule for now"*). An edge that runs backwards in time is a
    validator error, and the writer does not judge it.
12. **Umbrellas (A6, A8).** An umbrella is a period that historians name.
    `parent` is a list, and a filing writes every umbrella that fits, the
    nearest first. Since 13 October the count of main events may rise with
    the main events the owner asked for first (A17). A main event is one a
    reader should meet when nothing is selected. The planner's note says which
    events it made main and why. The writer counts the edges that cross an
    umbrella beside the size of the largest component (A15(11)).
    A filing never lists an umbrella together with an umbrella that
    contains it. The Battle of Stalingrad goes under the Eastern Front
    alone, since the Eastern Front is inside World War II already. Two
    tests refuse the longer list (14 October 2026).
    A child's dates must lie inside its parent's. The Guatemalan Civil War
    (1965 to 1996) cannot go under the Cold War, which ends in 1991. Check
    both spans before you queue a parent (14 October 2026).
    A child must also be the umbrella's own: in the umbrella's lane, or
    naming an actor or a place the umbrella names. The 1890 British
    Ultimatum (lane europe) cannot go under the Scramble for Africa (lane
    africa) though Wikidata's `P361` says so (15 October 2026).

## Where the work goes

13. **The order of work (A17, then A10).** Importance comes first. The owner
    asked for *"the main and most important historical events"* first,
    *"then progress to adding events that are not as important or that are
    children of the main events"*. The planner takes its ranking from
    Wikipedia's own editors and does not rank by its own judgement. It works
    in this order:
    1. The vital-article lists, level 3, then 4, then 5 (History and the
       events they name).
    2. The lists of wars, revolutions, treaties and disasters.
    3. The `P361` children of main events the atlas holds.

    Within a rank, the lanes with the fewest records come first: Africa and
    Asia, then the Americas, then Europe. The earliest year is about 1500.
    **Since 15 October 2026 the window is 1415 to 1900.** The owner: *"Foca-te
    em adicionar vários eventos grandes de 1415 a 1900"* (focus on adding
    several big events from 1415 to 1900). An event that starts before 1415
    or after 1900 waits. Within the window, big events come first: the
    vital-article lists, then the lists of wars for 1500 to 1799 and 1800 to
    1899, the revolutions and the treaties of those centuries. Events from
    1415 to 1499 are welcome now, Ceuta and the Portuguese voyages among them.
    Writer A takes `africa`, `asia` and `europe` on branch `m42`. Writer B
    takes `americas` on branch `m42b`. A writer never imports what the other
    branch holds.
14. **The recache (A15(2)).** The last step of every writer fire is
    `node tools/cache-evidence.mjs --fill` over the fire's own citations.
15. **Records first, then the rebuild, then the index commit** (798).
    `validate --index` is clean at every push. Tests come before behaviour
    (711, 717). A records routine never changes the display.
16. **No lane merges anything into `main`.** The planner pushes only to
    `plan`. The writers push only to their own branch. The assistant lands.
