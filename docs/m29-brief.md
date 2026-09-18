# Build brief — M29: international administrations as actors

Written 4 September 2026, late evening, from the owner's request. Runs
after M28. Read: `CLAUDE.md` (the dated exception — this run drafts
records under it, every one marked `Claude (assistant draft, unreviewed)`),
`STATUS.md`, `ARCHITECTURE.md`, `CONTEXT.md`, `docs/run-protocol.md`,
`docs/m2-brief.md`, `docs/m8-brief.md` (actors), `docs/m11-brief.md`
(relations and rule 19), `docs/m15-brief.md` (citation flags), then this
file. The Wikipedia leads cached under `tools/import/cache/wikipedia/` are
the reachable sources; the bibliography's existing records too.

## What exists

`united-nations`, `nato`, `european-economic-community`,
`european-commission`, `european-central-bank` are already actors, and
`un-admission-1955`, `nato-founding-1949`, `eec-application-1977`,
`eec-accession-1986` are events. Build on them; never duplicate.

## What to add

Actors of kind `institution` for the bodies Portugal belonged to or was
shaped by in the period, each with `when`, `names`, a summary that says
what the body is and what it did to or for Portugal, sources, and the
identity fields only where a cached lead gives them: the League of
Nations; the European Free Trade Association; the Council of Europe; the
OECD (and the OEEC before it, as one actor with names over time or two
with `succeeded` — decide, and say why in the summary); the European
Union as the successor of the EEC (relation `succeeded`, dated to the
Maastricht Treaty); the Eurozone or the Economic and Monetary Union;
the Community of Portuguese Language Countries; the Schengen Area;
the International Monetary Fund, for 1977–78, 1983 and 2011; the
World Trade Organization only if an event needs it.

For each: **`member-of` relations from `portugal`** (and from the regime
polities only where the regime and not the state is the member — argue
it), dated with the accession, citing a source; `part-of` or `succeeded`
between the bodies where true. Where rule 19 refuses a pairing (which
kinds may stand at each end of `member-of`), do not bend the kind: list
the case in `STATUS.md` → Open questions and leave the relation out.

Events, only where the dataset lacks one and a body's action on Portugal
is an event with consequences: the 1977–78 and 1983 IMF programmes, the
2011 bailout if absent, EFTA accession 1960, the euro's adoption 1999 and
the notes 2002, Schengen 1995, CPLP founding 1996. Each with at least one
honest edge under the owner's one-edge rule (4 September 2026): an edge
must still be argued from the sources with honest confidence, `consensus`
never on Wikipedia alone, every drafted edge flagged `edge-drafted`, and
an event with no honest edge is not written at all. Relations sparingly.

## Docs and done when

`STATUS.md` counts (actors, relations, events, edges added; open
questions from rule 19); the review queue picks all of it up by the
draft marker. Done when: `?actor=portugal` lists the memberships in
order on the actor card; every new record validates; validator and tests
green; the literal line `M29 done`; an "M29" section on PR #1.
