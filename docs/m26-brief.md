# Build brief — M26: the event card, reorganised

Written 4 September 2026, evening, from the owner's remark that an event
card shows too much at once — summary, who is in it, consequences,
convergence, citations, narratives, horizon — and reads badly. Runs after
M25. Read: `CLAUDE.md`, `STATUS.md`, `ARCHITECTURE.md`, `CONTEXT.md` (what
the panel exists to show: consequences and the other branches),
`docs/run-protocol.md`, `docs/m2-brief.md`, `docs/m9-brief.md` (the panel's
split into cards), `docs/m19-brief.md`, `docs/m23-brief.md`, then this
file. No historical text.

## The design

Progressive disclosure, one card per record, same for actors and places
where the sections apply:

1. **Head**: title; one line of metadata (date · place · lane); the
   actors as **chips** inline, role on hover and in the title attribute;
   "Read the full entry" and "Read more on Wikipedia" as quiet links.
2. **Summary**: the paragraph, nothing else.
3. **Sections as collapsible headers with counts**, one open at a time,
   the choice remembered in `localStorage`: **Consequences (n)** — the
   outgoing edges with type and confidence, and the horizon control
   inside it; **Causes (n)** — the incoming edges; **Other branches (n)**
   — the convergence result, shown only when a chain has been walked;
   **Sources (n)** — citations, supporting and dissenting apart, with the
   verified marks; **Part of (n)** — narratives; **Relations (n)** on
   actor cards; **Territory** on actor cards. Which section opens by
   default follows the action: arriving by walking a chain opens
   Consequences; arriving from a source card opens Sources; otherwise
   Consequences.
4. **The chain as a breadcrumb** at the top of the panel while walking:
   the events walked so far, each a link, the current one last.
5. Disputes stay impossible to miss: a disputed edge shows its mark in
   the collapsed header's count ("Consequences (3, 1 disputed)") and in
   the row.

Keyboard: sections toggle with Enter/Space; the breadcrumb is a list of
links. Nothing is removed from the card — everything is still there, one
click away, and the counts say what is there before opening.

## Docs and done when

`ARCHITECTURE.md` (the card structure); `about.html` ("how to read a
card"). Done when: an event card renders head, summary and the collapsed
sections with correct counts (assert against the topology for
`carnation-revolution-1974`: consequences, causes, sources); walking a
chain opens Consequences and shows the breadcrumb; the choice persists
across a reload; the existing panel tests and headless checks pass with
the new structure (update selectors where the brief changes them, and say
which); validator and tests green; `STATUS.md` with the literal line
`M26 done`; an "M26" section on PR #1.
