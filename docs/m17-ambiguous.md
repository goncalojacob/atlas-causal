# Wikidata reconcile — what the import would not decide

Written by `node tools/import/wikidata.mjs --reconcile`, last on 2026-09-04,
one section per hand-written record the pass could not match **with
certainty**: an exact diacritic-insensitive name match, a class consistent
with the record's kind, dates within a year, and exactly one candidate left.
Most records are here and that is the design — a mechanical match is the only
kind an import is allowed to make, and everything else is somebody's judgement.

Nothing here has been written onto any record. Two things can be done with a
section: match it by hand (put the item id in the record's `wikidata`, and a
later pass fills the rest in), or, where the reason given is a class nobody
has decided about, add that class to `data/imports/wikidata-seeds.json` → `classes` and run
the pass again. The list is regenerated per batch and keyed by record id, so
an id appears once however many times the tool has run.

## 25-november-1975

`event` · 1975 · searched for **25 November**

10 item(s) were read and each failed a test.

- [`Q3020`](https://www.wikidata.org/wiki/Q3020) **November 25** — day of the year — no date — Q14795564
  - none of its classes (Q14795564) is in data/imports/wikidata-seeds.json → classes
- [`Q7064757`](https://www.wikidata.org/wiki/Q7064757) **November 25** — day in the Eastern Orthodox liturgical calendar — no date — Q47164206, Q14795564
  - none of its classes (Q47164206, Q14795564) is in data/imports/wikidata-seeds.json → classes
- [`Q57350843`](https://www.wikidata.org/wiki/Q57350843) **November 25, 2019** — date — 2019 — Q47150325, Q3020, Q51203179, Q51156592
  - none of its classes (Q47150325, Q3020, Q51203179, Q51156592) is in data/imports/wikidata-seeds.json → classes

## alvor-agreement-1975

`event` · searched for **The Alvor Agreement**

nothing on Wikidata is called "The Alvor Agreement".

## angola-independence-1975

`event` · searched for **Independence of Angola**

nothing on Wikidata is called "Independence of Angola".

## angola-war-begins-1961

`event` · searched for **Beginning of the war in Angola**

nothing on Wikidata is called "Beginning of the war in Angola".

## azores-agreement-1943

`event` · searched for **Anglo-Portuguese agreement on Azores bases**

nothing on Wikidata is called "Anglo-Portuguese agreement on Azores bases".

## bes-resolution-2014

`event` · searched for **Resolution of Banco Espírito Santo**

nothing on Wikidata is called "Resolution of Banco Espírito Santo".

## botelho-moniz-coup-attempt-1961

`event` · searched for **Botelho Moniz's failed move against Salazar**

nothing on Wikidata is called "Botelho Moniz's failed move against Salazar".

## bpn-nationalisation-2008

`event` · searched for **Nationalisation of the Banco Português de Negócios**

nothing on Wikidata is called "Nationalisation of the Banco Português de Negócios".

## cabral-assassinated-1973

`event` · searched for **Assassination of Amílcar Cabral**

nothing on Wikidata is called "Assassination of Amílcar Cabral".

## caetano-succeeds-salazar-1968

`event` · searched for **Marcelo Caetano succeeds Salazar**

nothing on Wikidata is called "Marcelo Caetano succeeds Salazar".

## carnation-revolution-1974

`event` · 1974 · searched for **25 April**

10 item(s) were read and each failed a test.

- [`Q2531`](https://www.wikidata.org/wiki/Q2531) **April 25** — day of the year — no date — Q14795564
  - none of its classes (Q14795564) is in data/imports/wikidata-seeds.json → classes
- [`Q4781973`](https://www.wikidata.org/wiki/Q4781973) **April 25** — day in the Eastern Orthodox liturgical calendar — no date — Q47164206, Q14795564
  - none of its classes (Q47164206, Q14795564) is in data/imports/wikidata-seeds.json → classes
- [`Q17923562`](https://www.wikidata.org/wiki/Q17923562) **April 25, 2014** — Friday in April 2014 — 2014 — Q2531, Q47150325
  - none of its classes (Q2531, Q47150325) is in data/imports/wikidata-seeds.json → classes

## cavaco-absolute-majority-1987

`event` · searched for **Cavaco Silva's absolute majority**

nothing on Wikidata is called "Cavaco Silva's absolute majority".

## constituent-assembly-election-1975

`event` · searched for **Constituent Assembly election**

nothing on Wikidata is called "Constituent Assembly election".

## constitution-1911

`event` · 1911 · searched for **Constitution of 1911**

1 item(s) were read and each failed a test.

- [`Q16769722`](https://www.wikidata.org/wiki/Q16769722) **Constitution of 1911** — Wikimedia disambiguation page — no date — Q4167410
  - none of its classes (Q4167410) is in data/imports/wikidata-seeds.json → classes

## constitution-1933

`event` · searched for **Constitution of 1933**

nothing on Wikidata is called "Constitution of 1933".

## constitution-1976

`event` · searched for **Constitution of 1976**

nothing on Wikidata is called "Constitution of 1976".

## constitutional-revision-1959

`event` · searched for **The revision that ends direct presidential elections**

nothing on Wikidata is called "The revision that ends direct presidential elections".

## constitutional-revision-1982

`event` · searched for **The revision that abolishes the Council of the Revolution**

nothing on Wikidata is called "The revision that abolishes the Council of the Revolution".

## costa-resigns-2023

`event` · searched for **António Costa resigns**

nothing on Wikidata is called "António Costa resigns".

## coup-28-may-1926

`event` · searched for **Coup of 28 May**

nothing on Wikidata is called "Coup of 28 May".

## coup-attempt-11-march-1975

`event` · searched for **The failed coup of 11 March**

nothing on Wikidata is called "The failed coup of 11 March".

## covid-state-of-emergency-2020

`event` · searched for **First state of emergency of the pandemic**

nothing on Wikidata is called "First state of emergency of the pandemic".

## delgado-assassinated-1965

`event` · searched for **Humberto Delgado murdered by the PIDE**

nothing on Wikidata is called "Humberto Delgado murdered by the PIDE".

## delgado-candidacy-1958

`event` · searched for **Humberto Delgado's presidential candidacy**

nothing on Wikidata is called "Humberto Delgado's presidential candidacy".
