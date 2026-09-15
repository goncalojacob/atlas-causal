# M44b — the proof that it connected

M44a imported 82 records. This file is the account of what each of them was
wired to, what it was retracted for, and what the wiring did to the part of the
atlas that was already here. The two numbers section 4b of `docs/m44-brief.md`
asks for are at the bottom, and they are recomputed from `data/` by the script
printed with them — never asserted from memory.

## 1. The rule, frozen before a hop was counted

Amendment A15 asks for this to be written out before the first hop is counted,
so that anybody can recompute every number below from `data/` and this page
alone. It was written into this file in the run's first commit, before any edge
was written.

**A Portuguese event** is an active event that satisfies at least one of:

- **(a)** its `place` is one of the seventeen Portuguese and
  Portuguese-administered places, listed in full below;
- **(b)** its `actors` name at least one of the Portuguese actors listed in
  full below;
- **(c)** its `title` matches `/\bPortugal|\bPortuguese/i`.

### (a) The seventeen places

`alvor`, `belem`, `boe`, `braga`, `central-portugal`, `chai`, `dili`, `lajes`,
`lisbon`, `luanda`, `macau`, `panaji`, `parque-das-nacoes`, `pedrogao-grande`,
`porto`, `tete-district`, `tite`.

The nine of `data/places/` that are **not** in the list, and why: `berlin`,
`flanders`, `near-villanueva-del-fresno`, `new-york`, `saint-denis`,
`stockholm`, `washington` are not Portuguese ground on any reading; `conakry`
is the Republic of Guinea, where the atlas places the assassination of Amílcar
Cabral, and was never Portuguese; `recife` is Brazil, where the atlas places
the Santa Maria in 1961, and was not Portuguese in 1961.

### (b) The Portuguese actors

Fifty-seven ids, being every actor named by an active event that is a
Portuguese state, a Portuguese public figure, or a Portuguese party, bank or
body:

**Polities** — `portugal`, `first-portuguese-republic`, `military-dictatorship`,
`estado-novo`, `third-portuguese-republic`.

**People** — `carlos-i`, `luis-filipe`, `manuel-ii`, `joao-franco`,
`manuel-de-arriaga`, `afonso-costa`, `pimenta-de-castro`, `sidonio-pais`,
`paiva-couceiro`, `gomes-da-costa`, `oscar-carmona`, `salazar`,
`humberto-delgado`, `norton-de-matos`, `henrique-galvao`, `marcelo-caetano`,
`americo-tomas`, `antonio-de-spinola`, `otelo-saraiva-de-carvalho`,
`vasco-goncalves`, `ramalho-eanes`, `mario-soares`, `alvaro-cunhal`,
`cavaco-silva`, `pedro-passos-coelho`, `antonio-costa`,
`marcelo-rebelo-de-sousa`, `luis-montenegro`, `andre-ventura`,
`ricardo-salgado`.

**Institutions** — `regenerator-party`, `partido-republicano-portugues`,
`carbonaria`, `partido-democratico`, `republican-liberal-party`,
`democratic-leftwing-republican-party`, `portuguese-expeditionary-corps`,
`uniao-nacional`, `legiao-portuguesa`, `pvde-pide-dgs`, `mud`,
`people-s-monarchist-party`, `pcp`, `armed-forces-movement`,
`council-of-the-revolution`, `partido-socialista`, `psd`, `cds-pp`,
`bloco-de-esquerda`, `ecologist-party-the-greens`, `chega`,
`liberal-initiative`, `people-animals-nature`, `portuguese-democratic-movement`,
`banco-de-portugal`, `banco-espirito-santo`, `novo-banco`,
`redes-energeticas-nacionais`.

**Deliberately excluded, and the exclusion is the conservative choice.** The
liberation movements of the Portuguese colonies and their leaders — `paigc`,
`frelimo`, `mpla`, `fnla`, `unita`, `fretilin`, `mlstp`, `amilcar-cabral`,
`eduardo-mondlane` — are **not** on the list. They were not Portuguese, and
counting them would have enlarged the Portuguese set and made this round's bar
easier to clear rather than harder. No event loses its Portuguese standing by
the exclusion: every colonial-war record the atlas holds carries either a
Portuguese place (`tite`, `chai`, `boe`, `luanda`, `dili`, `tete-district`) or
a Portuguese actor of its own.

### The reach bar

A record M44b keeps is **(P) Portuguese-reaching**: it carries at least one
honest edge, and a path of **active edges of length at most two**, in either
direction, joins it to a Portuguese event. Per amendment A12, **(B) is not a
second criterion**: a bridge is already (P), and what (B) names is the target —
a previously stranded world event that acquires Portuguese reach because of an
edge written here. That count is reported below and is what the round is for.

Hops are computed over **active events and active edges only**, undirected,
breadth-first from the record to the nearest Portuguese event.

### The rule the round wrote edges under

**Every edge written in M44b has at least one M44 record as an endpoint.**
This is the run's own discipline and not the brief's. It keeps the unstranding
number honest: a world event that stops being stranded here stops because a
record M44a imported was wired next to it, not because the run went round the
old corpus filling in edges that would have raised the number without importing
anything. Gaps in the old corpus that M44b could see but did not touch are
named in section 5, for the owner.

## 2. The check the measurement reproduces

Run against `data/` before a single edge of this round was written, the rule
above returns **145 Portuguese events and 65 world events** in the 210 active
records that predate M44a, and **45 of the 65 touch no Portuguese event at
all**. Those are exactly the numbers section 1 of `docs/m44-brief.md` measured
by hand on `2246f23`. The rule as written here is therefore the brief's rule,
and every number below is comparable with the brief's.

