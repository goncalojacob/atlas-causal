# Build brief for M42b: the Americas, and Europe before 1900

M42b is a second records lane beside M42 (the world-at-scale import). The
assistant opened it on 22 September because the owner is away for a week and
*"the site must keep growing until I get back"* with *"as many things in
parallel as feasible."* **M42b uses M42's method on its own share of the
world.** Read `docs/m42-brief.md` whole, with its eleven amendments last, and
follow every one of them:

- Wikipedia and Wikidata, `probable`, and consensus only through a work that
  Wikipedia cites (A2).
- File each event under its umbrellas as you import it (A3).
- The standing exceptions (A4).
- Edges only to records that exist, with M72's sources, and a report of the
  largest component (A5).
- Period umbrellas, and the count of main events never rising (A6).
- Intervals from the cited article (A7).
- Every umbrella that fits (A8).
- Places from `P276`/`P131`/`P17` with `P625` (A9). Use `country` only once
  `M80 done` is on `origin/m0`.

## What is yours

- **The Americas, every century from 1492.** This is the `americas` lane.
  South and Central America come before North America until they hold as
  many active events as North America.
- **Europe before 1900, paused by A15 (25 September)** until Africa and Asia
  each hold A10's 303 active events. In its place, take **Africa and Asia
  before 1800**. Africa holds nothing before 1800, and Asia holds one event.
  Read them from Wikidata under M42's rules for those lanes. Check the ids in
  `origin/m42`'s `data/events/` before every batch, as you already do. A
  batch that walks the `P361` children of an umbrella the atlas holds imports
  only the children it can connect to records that exist (A5, A15(1)). Its
  note counts the children it left.
- **Nothing of Africa or Asia** (M42's lanes), and nothing the other branch
  already holds. Run
  `git fetch origin m42` and read its `data/events/` and `docs/m42-pool.md`
  before every batch.

## Your files

Your own pool file is `docs/m42b-pool.md`, with the same sections as M42's.
The measurement comes first, per lane and per century. Then each batch gets a
section with the count of main events, the counts per lane and per century,
the largest component before and after, and what the batch refused. Number
deviations from **1200** upward. The claim and done lines in `STATUS.md` say
`M42b`.

## What this run must not do

- No display change.
- No new record type, confidence value, hex value, token or type size.
- `validate --index` is clean.
- Records first, then the rebuild, then the index commit (798).
- Tests before the records they judge (711, 717).
- No AI-written historical claim outside the dated exception, and no
  invented date.
- Never push to `m0`, `m42` or `main`.

## Done when

The owner writes a done condition. Until then every fire imports, connects,
files and places a batch and pushes it. The assistant lands snapshots daily.
