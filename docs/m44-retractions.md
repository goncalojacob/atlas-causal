# M44b — what was withdrawn, and what was put back

M44a imported 82 records. M44b kept 30, merged 2 into records the atlas already
held, and retracted 50. Every reason is in the record's own `retraction` block,
which is where it belongs and where nothing deletes it; this file is the index,
with the classes and the counts, and it also carries the reasons of the records
this round **un-retracted**, which the records themselves no longer hold.

A retraction here is a success of the milestone and not a failure of it.
Nothing was written in order to keep a record.

## Reinstated

Amendment A11: reinstating a record deletes its `retraction` block, because
rule 27 makes a retraction on a non-retracted record an error. The reason is
copied here verbatim, in the same commit, so that the account of the withdrawal
survives the undoing of it.

### `university-of-porto`

Reinstated by `universities-of-lisbon-and-porto-1911`, which names it in
`actors` with the role `institution`. Its M41b retraction read, verbatim:

> Retracted in M41b: the university founded on 22 March 1911, the second
> largest in the country. The Republic created the universities of Lisbon and
> Porto by decree in its first year, and that is a real consequence of the
> records this atlas already holds — the proclamation of October 1910, the
> constitution and the law of separation of 1911. But the atlas has no record
> of the decree, and an actor cannot be joined to an event nobody has written.

The atlas now has the record of the decree.

### `national-syndicalists`

Reinstated by `national-syndicalists-banned-1934`, which names it in `actors`
with the role `target`. Its M41b retraction read, verbatim:

> Retracted in M41b: the National Syndicalist Movement, founded in February
> 1932 by Francisco Rolão Preto, the nearest thing to a fascist movement
> Portugal produced and suppressed by the Estado Novo in 1934. The atlas holds
> the regime it was absorbed and banned by, and holds nothing about the
> suppression itself: not the ban, not the exile of Rolão Preto, not the revolt
> of 1935, and no record of the man. It would need one of those, and it is the
> retraction here most worth undoing.

The atlas now has the first of the three. The exile of Rolão Preto, the revolt
of 1935 and a record of the man are still missing, and M41b was right that this
was the retraction most worth undoing.

### `energias-de-portugal`

Reinstated by `edp-created-1976`, which names it in `actors` with the role
`institution`. Its M41b retraction read, verbatim:

> Retracted in M41b: EDP, the electricity utility founded in 1976 out of the
> merger of fourteen nationalised companies. The link to the atlas is real and
> it has no record to hang on: the nationalisations this atlas holds are those
> of March 1975, a year earlier, and EDP was not an actor in them but a body
> made afterwards out of what they took. It would need an event for the
> creation of EDP in 1976, or for the nationalisation of electricity that
> followed the banks over that summer.

The atlas now has the first of the two. The nationalisation of electricity
itself is still missing, and it is the better record of the pair.

### The eight that stay retracted

Amendment A5 names eleven retracted actors. Three are above. The other eight
stay retracted, and the reason is the same for all of them and is the one §4c
of the brief set as its hard constraint: **a record is written only if a source
already in `data/sources/` carries it.** In each of these cases the event that
would name the actor is a law, a merger or a sale whose date and instrument
this run could not point at in any of the thirty-four sources this atlas holds,
and a record of "the banking law of the mid-1980s" that cannot say which law it
is would be a gap dressed as a record. They are listed with the work each one
needs in §5 of `docs/m44-connections.md`.

`banco-comercial-portugues`, `portuguese-investment-bank`, `altice-portugal`,
`nos`, `brisa-auto-estradas-de-portugal`, `semapa`, `altri`,
`the-navigator-company`.
