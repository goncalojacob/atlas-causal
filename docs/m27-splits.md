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
this page is the account of them. 55 codes split, 7 not split, in 3 of the four batches.

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

## Europe

3 codes split.

| Code | Colonial actor | State actor | From |
|---|---|---|---|
| 338 | `malta-under-united-kingdom` | `malta` | 1964-09-21 |
| 352 | `cyprus-under-united-kingdom` | `cyprus` | 1960-08-16 |
| 395 | `iceland-under-denmark` | `iceland` | 1942-04-22 |

Not split:

- **260** `german-federal-republic` — the source holds it only as occupied, never as a colony, protectorate or mandate; an occupied state is the same actor.
- **265** `german-democratic-republic` — the source holds it only as occupied, never as a colony, protectorate or mandate; an occupied state is the same actor.
- **340** `serbia` — the source holds it only as occupied, never as a colony, protectorate or mandate; an occupied state is the same actor.
- **341** `montenegro` — the source holds it only as occupied, never as a colony, protectorate or mandate; an occupied state is the same actor.

## Africa

44 codes split.

| Code | Colonial actor | State actor | From |
|---|---|---|---|
| 402 | `cape-verde-under-portugal` | `cape-verde` | 1975-07-05 |
| 404 | `guinea-bissau-under-portugal` | `guinea-bissau` | 1974-09-10 |
| 411 | `equatorial-guinea-under-spain` | `equatorial-guinea` | 1968-10-12 |
| 420 | `gambia-under-united-kingdom` | `gambia` | 1965-02-18 |
| 432 | `mali-under-france` | `mali` | 1960-09-22 |
| 433 | `senegal-under-france` | `senegal` | 1959-04-04 |
| 434 | `benin-under-france` | `benin` | 1960-08-01 |
| 435 | `mauritania-under-france` | `mauritania` | 1960-11-28 |
| 436 | `niger-under-france` | `niger` | 1960-08-03 |
| 437 | `cote-d-ivoire-under-france` | `cote-d-ivoire` | 1960-08-07 |
| 438 | `guinea-under-france` | `guinea` | 1958-10-02 |
| 439 | `burkina-faso-upper-volta-under-france` | `burkina-faso-upper-volta` | 1960-08-05 |
| 451 | `sierra-leone-under-united-kingdom` | `sierra-leone` | 1961-04-27 |
| 452 | `ghana-under-united-kingdom` | `ghana` | 1957-03-06 |
| 461 | `togo-under-france` | `togo` | 1960-04-27 |
| 471 | `cameroon-under-france` | `cameroon` | 1960-01-01 |
| 475 | `nigeria-under-united-kingdom` | `nigeria` | 1960-10-01 |
| 481 | `gabon-under-france` | `gabon` | 1960-08-17 |
| 482 | `central-african-republic-under-france` | `central-african-republic` | 1960-08-13 |
| 483 | `chad-under-france` | `chad` | 1960-08-11 |
| 484 | `congo-under-france` | `congo` | 1960-08-15 |
| 490 | `congo-democratic-republic-of-zaire-under-belgium` | `congo-democratic-republic-of-zaire` | 1960-06-30 |
| 500 | `uganda-under-united-kingdom` | `uganda` | 1962-10-09 |
| 501 | `kenya-under-united-kingdom` | `kenya` | 1963-12-12 |
| 510 | `tanzania-tanganyika-under-united-kingdom` | `tanzania-tanganyika` | 1961-12-09 |
| 511 | `zanzibar-under-united-kingdom` | `zanzibar` | 1963-12-19 |
| 522 | `djibouti-under-france` | `djibouti` | 1977-06-27 |
| 531 | `eritrea-under-italy-sardinia` | `eritrea` | 1941-05-19 |
| 540 | `angola-under-portugal` | `angola` | 1975-11-11 |
| 541 | `mozambique-under-portugal` | `mozambique` | 1975-06-25 |
| 551 | `zambia-under-united-kingdom` | `zambia` | 1953-08-01 |
| 552 | `zimbabwe-rhodesia-under-united-kingdom` | `zimbabwe-rhodesia` | 1965-11-11 |
| 553 | `malawi-under-united-kingdom` | `malawi` | 1964-07-06 |
| 565 | `namibia-under-south-africa` | `namibia` | 1990-03-21 |
| 570 | `lesotho-under-united-kingdom` | `lesotho` | 1966-10-04 |
| 571 | `botswana-under-united-kingdom` | `botswana` | 1966-09-30 |
| 572 | `swaziland-eswatini-under-united-kingdom` | `swaziland-eswatini` | 1968-09-06 |
| 581 | `comoros-under-france` | `comoros` | 1975-07-06 |
| 590 | `mauritius-under-united-kingdom` | `mauritius` | 1968-03-12 |
| 615 | `algeria-under-france` | `algeria` | 1962-07-05 |
| 616 | `tunisia-under-france` | `tunisia` | 1956-01-01 |
| 620 | `libya-under-italy-sardinia` | `libya` | 1951-12-24 |
| 625 | `sudan-under-united-kingdom` | `sudan` | 1956-01-01 |
| 651 | `egypt-under-united-kingdom` | `egypt` | 1922-02-28 |

Not split:

- **580** `madagascar-malagasy` — the source gives it its own ground first (from 1886-01-01) and only later as colony; the boundary a split would use is not its first independent date.
- **600** `morocco` — the source gives it its own ground first (from 1886-01-01) and only later as protectorate; the boundary a split would use is not its first independent date.
