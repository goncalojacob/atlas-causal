# Build brief — M42b: the Americas, and Europe before 1900

A second records lane beside M42, opened 22 September because the owner is
away for a week and *"the site must keep growing until I get back"* with
*"as many things in parallel as feasible."* **This is M42 with a partition,
not a new method**: read `docs/m42-brief.md` whole, its eleven amendments
last, and follow every one of them — Wikipedia and Wikidata, `probable`,
consensus only through a work Wikipedia cites (A2); file as you import
(A3); the standing exceptions (A4); edges to what exists with M72's sources
and the largest component reported (A5); period umbrellas and the main
count never rising (A6); intervals from the cited article (A7); every
umbrella that fits (A8); places from `P276`/`P131`/`P17` with `P625` (A9,
with `country` only once `M80 done` is on `origin/m0`).

## What is yours

- **The Americas, every century from 1492**: the `americas` lane, South and
  Central America before North America until they hold as many active
  events as North America.
- **Europe before 1900**: the 16th to 19th centuries hold one to eight main
  events each; fill them.
- **Nothing of Africa or Asia** (M42's), and nothing the other branch already
  holds: `git fetch origin m42` and read its `data/events/` and
  `docs/m42-pool.md` before every batch.

## Your files

Your own pool file, `docs/m42b-pool.md`, with the same sections M42's has:
the measurement first (per lane and per century), then a section per batch
with the main count, the per-lane and per-century counts, the largest
component before and after, and what was refused. Deviations numbered from
**1200** upward. `STATUS.md` claim and done lines say `M42b`.

## What this run must not do

No display change; no new record type, confidence value, hex value, token
or type size; `validate --index` clean; records first, rebuild, then commit
the index (798); tests before the records they judge (711, 717); no
AI-written historical claim outside the dated exception; no invented date;
never push to `m0`, `m42` or `main`.

## Done when

The owner writes a done condition. Until then every fire imports, connects,
files and places a batch and pushes it; the assistant lands snapshots daily.
