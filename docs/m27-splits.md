# M27 — the CShapes colony/state splits

Which of the 89 codes in [`cshapes-entities.md`](cshapes-entities.md) became two
actors, and which stayed one. The decision is the rule in
[`m27-brief.md`](m27-brief.md) and nothing else, applied to the source's own
`owner`, `status`, `country_name` and dates:

- a code the source holds under another power as a **colony, protectorate or
  mandate** before it has ground of its own is two actors: the held period and
  the state that follows it;
- **occupation is not a dependency** here. An occupied state is the same actor,
  so a code the source only ever holds as `occupied` is not split, and where a
  code shows both, the cut goes on the boundary of the held period, not of the
  occupation. Cuba's cut is 1898-12-10 and not 1902-05-20 for that reason, and
  Iceland's is 1942-04-22 and not 1944-06-17;
- a code the source gives its own ground **first** and holds under another power
  only afterwards is not split: the boundary a cut would use is not its first
  independent date;
- every cut falls on a boundary CShapes itself draws — the day after some
  feature's end — or the import refuses it.

The colonial actor's id and name are composed from the source's own fields:
the code's slug, `under`, and the actor the source's `owner` code is on that
day. Where the source gives the held period under more than one power, the
record is named for the one that held it longest, and the entry's `note` says
so. The state keeps the actor id it already had, so nothing that points at it
has to move.

The splits themselves are [`data/imports/cshapes-actors.json`](../data/imports/cshapes-actors.json);
this page is the account of them. 8 codes split, 1 not split, in 1 of the four batches.

## The Caribbean and the Americas

8 codes split.

| Code | Colonial actor | State actor | From |
|---|---|---|---|
| 31 | `bahamas-under-united-kingdom` | `bahamas` | 1973-07-10 |
| 40 | `cuba-under-spain` | `cuba` | 1898-12-10 |
| 51 | `jamaica-under-united-kingdom` | `jamaica` | 1962-08-06 |
| 52 | `trinidad-and-tobago-under-united-kingdom` | `trinidad-and-tobago` | 1962-08-31 |
| 53 | `barbados-under-united-kingdom` | `barbados` | 1966-11-30 |
| 80 | `belize-under-united-kingdom` | `belize` | 1981-09-21 |
| 110 | `guyana-under-united-kingdom` | `guyana` | 1966-05-26 |
| 115 | `surinam-under-netherlands` | `surinam` | 1975-11-25 |

Not split:

- **41** `haiti` — the source holds it only as occupied, never as a colony, protectorate or mandate; an occupied state is the same actor.
