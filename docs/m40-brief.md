# Build brief — M40: the world Portugal answered to, 1890–2025

Owner's request, 5 September 2026 ("adding some world events to see how
everything connects"), under the exception extended the same day in
`CLAUDE.md`. Two runs, both on branch `world`, in parallel with the
health cycle on `m0`; the assistant merges `world` into `m0` with one
index-rebuild commit. Never commit `data/index/` on `world`.

## M40a — the candidates and the import (network through the Action)

Read `CLAUDE.md`, `STATUS.md`, `docs/run-protocol.md` (the import
amendments), `docs/m16-brief.md`, `docs/m18-brief.md`, `docs/m20-brief.md`,
`data/imports/wikidata-seeds.json`, `tools/import/wikidata.mjs`,
`.github/workflows/import-wikidata.yml`.

1. Add to `data/imports/wikidata-seeds.json` **world queries** for
   1890–2025 with no geographic restriction: classes war, treaty,
   revolution, economic crisis, pandemic, international conference,
   independence declaration, coup d'état, genocide, financial crisis,
   assassination of a head of state or government; one query per class
   and per period as the Portuguese ones are; ordered by sitelinks;
   capped at 40 rows per query.
2. Push an `import/world-2026-09-05` branch; the Action runs
   `--candidates`; wait for it as M20 did; the candidates land in
   `docs/m40-candidates.md`.
3. **Tick by rule, not by hand** (the owner delegated): keep the 120
   candidates with the most sitelinks that are not already records here
   (aliases and `wikidata` checked), at least six per decade; tick them;
   push; the Action runs `--import` and caches the leads; merge the
   import branch into `world` fast-forward as the protocol says.

Done when: `docs/m40-candidates.md` with the rule stated at its top; the
imported events on `world` with `imported-facts`; the leads cached;
validator (without `--index`) clean; the literal line `M40a done`.

## M40b — the drafting

Read what M21/M22 read (`docs/m21-brief.md`, `docs/m22-brief.md` and its
amendment) and `docs/m21-retractions.md` for the method; the one-edge
rule; the cached leads.

For every imported world event: a summary of several sentences that says
what it was and what it meant, actors with roles (the roles from
`docs/roles-mapping.md`'s list, since M32b will close the list), and **at
least one honest edge to or from a record already in the atlas**,
Portuguese where the sources support it (the Depression to the Estado
Novo's finances; the oil shock to 1974–75; the Berlin Wall to the end of
the Cold War's pressure on Africa; Versailles to the Republic's
Africa policy…), otherwise to another world event so the world hangs
together; `consensus` never on Wikipedia alone; `edge-drafted` on every
edge; a world event with no honest edge is retracted with its reason in
`docs/m40-retractions.md`. New actors (states, alliances, institutions,
persons) only where an edge needs one, drafted under the exception.
Relations sparingly. One commit per decade, pushed at once.

Done when: every imported world event wired or retracted; counts per
decade in `STATUS.md`; validator clean; `node --test` green; the
literal line `M40b done`.
