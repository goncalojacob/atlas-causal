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

## armed-forces-movement

`actor` · searched for **Armed Forces Movement**

nothing on Wikidata is called "Armed Forces Movement".

## azores-agreement-1943

`event` · searched for **Anglo-Portuguese agreement on Azores bases**

nothing on Wikidata is called "Anglo-Portuguese agreement on Azores bases".

## banco-de-portugal

`actor` · 1846– · searched for **Banco de Portugal**

3 item(s) were read and each failed a test.

- [`Q378372`](https://www.wikidata.org/wiki/Q378372) **Banco de Portugal** — central bank — 1846– — Q66344
  - none of its classes (Q66344) is in data/imports/wikidata-seeds.json → classes
- [`Q54470465`](https://www.wikidata.org/wiki/Q54470465) **Edifício do Banco de Portugal no Porto** — bank in Porto — no date — Q18761864, Q210272
  - none of its classes (Q18761864, Q210272) is in data/imports/wikidata-seeds.json → classes
- [`Q76947343`](https://www.wikidata.org/wiki/Q76947343) **Edifício do Banco de Portugal em Braga** — building in Portugal — no date — Q41176, Q210272
  - none of its classes (Q41176, Q210272) is in data/imports/wikidata-seeds.json → classes

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

## council-of-the-revolution

`actor` · searched for **Council of the Revolution**

nothing on Wikidata is called "Council of the Revolution".

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

## eanes-elected-1976

`event` · searched for **Ramalho Eanes elected president**

nothing on Wikidata is called "Ramalho Eanes elected president".

## east-timor-independence-2002

`event` · searched for **Independence of East Timor**

nothing on Wikidata is called "Independence of East Timor".

## east-timor-invasion-1975

`event` · searched for **Indonesia invades East Timor**

nothing on Wikidata is called "Indonesia invades East Timor".

## eec-accession-1986

`event` · searched for **Portugal joins the EEC**

nothing on Wikidata is called "Portugal joins the EEC".

## eec-application-1977

`event` · searched for **Portugal applies to join the EEC**

nothing on Wikidata is called "Portugal applies to join the EEC".

## euro-2016-final

`event` · searched for **Portugal wins the European Championship**

nothing on Wikidata is called "Portugal wins the European Championship".

## euro-adoption-1999

`event` · searched for **Portugal adopts the euro**

nothing on Wikidata is called "Portugal adopts the euro".

## european-central-bank

`actor` · 1998– · searched for **European Central Bank**

7 item(s) were read and each failed a test.

- [`Q8901`](https://www.wikidata.org/wiki/Q8901) **European Central Bank** — central bank of the European Union and the eurozone — 1998– — Q66344, Q748720
  - none of its classes (Q66344, Q748720) is in data/imports/wikidata-seeds.json → classes
- [`Q76161279`](https://www.wikidata.org/wiki/Q76161279) **European Central Bank 2014 data breach** — no date — Q1172486
  - none of its classes (Q1172486) is in data/imports/wikidata-seeds.json → classes
- [`Q57916434`](https://www.wikidata.org/wiki/Q57916434) **European Central Bank** — no date — Q13442814
  - none of its classes (Q13442814) is in data/imports/wikidata-seeds.json → classes

## european-commission

`actor` · 1958– · searched for **European Commission**

10 item(s) were read and each failed a test.

- [`Q8880`](https://www.wikidata.org/wiki/Q8880) **European Commission** — executive branch of the European Union — 1958– — Q748720, Q35798
  - none of its classes (Q748720, Q35798) is in data/imports/wikidata-seeds.json → classes
- [`Q2661677`](https://www.wikidata.org/wiki/Q2661677) **European Commissioner** — member of the European Commission; like a government minister — no date — Q294414
  - none of its classes (Q294414) is in data/imports/wikidata-seeds.json → classes
- [`Q1780211`](https://www.wikidata.org/wiki/Q1780211) **European Commissioner for Trade** — Member of the EU Commission — 1958– — Q4164871
  - none of its classes (Q4164871) is in data/imports/wikidata-seeds.json → classes

## european-economic-community

`actor` · 1957–1993 · searched for **European Economic Community**

10 item(s) were read and each failed a test.

- [`Q52847`](https://www.wikidata.org/wiki/Q52847) **European Economic Community** — 1958–2009 organisation for economic integration, under the EU from 1993 — 1958–2009 — Q43229
  - its classes make it a institution, not a polity
- [`Q140127115`](https://www.wikidata.org/wiki/Q140127115) **EUROPEAN ECONOMIC COMMUNITY** — book chapter in Regional Cooperation, Organizations and Problems (1983) — no date — Q1980247
  - none of its classes (Q1980247) is in data/imports/wikidata-seeds.json → classes
- [`Q16024983`](https://www.wikidata.org/wiki/Q16024983) **European Economic Community–German Democratic Republic border** — no date — Q133346
  - none of its classes (Q133346) is in data/imports/wikidata-seeds.json → classes

## expo-98

`event` · 1998 · searched for **Expo 98**

2 item(s) were read and each failed a test.

- [`Q1139414`](https://www.wikidata.org/wiki/Q1139414) **Expo '98** — 1998 World's Fair in Lisbon, Portugal — 1998 — Q172754
  - none of its classes (Q172754) is in data/imports/wikidata-seeds.json → classes
- [`Q55351315`](https://www.wikidata.org/wiki/Q55351315) **(no label)** — exhibition — 1998 — Q29023906
  - none of its classes (Q29023906) is in data/imports/wikidata-seeds.json → classes

## exposicao-mundo-portugues-1940

`event` · searched for **Exhibition of the Portuguese World**

nothing on Wikidata is called "Exhibition of the Portuguese World".

## fiftieth-anniversary-25-april-2024

`event` · searched for **Fifty years of 25 April**

nothing on Wikidata is called "Fifty years of 25 April".

## fnla

`actor` · 1962– · searched for **FNLA**

9 item(s) were read and each failed a test.

- [`Q907051`](https://www.wikidata.org/wiki/Q907051) **National Liberation Front of Angola** — political party — 1954– — Q7278
  - its dates are more than 1 year from the record's
- [`Q23405928`](https://www.wikidata.org/wiki/Q23405928) **FnlA protein involved in UDP-L-FucpNAc biosynthesis (a nucleotide sugar precursor for antigen-O biosynthesis) FP1288** — microbial gene found in Flavobacterium psychrophilum JIP02/86 — no date — Q7187
  - none of its classes (Q7187) is in data/imports/wikidata-seeds.json → classes
- [`Q23437879`](https://www.wikidata.org/wiki/Q23437879) **UDP-N-acetylglucosamine 4,6-dehydratase VF_0191** — microbial protein found in Aliivibrio fischeri ES114 — no date — Q8054
  - none of its classes (Q8054) is in data/imports/wikidata-seeds.json → classes

## geringonca-2015

`event` · searched for **The PS minority government of 2015**

nothing on Wikidata is called "The PS minority government of 2015".

## germany-declares-war-1916

`event` · searched for **Germany declares war on Portugal**

nothing on Wikidata is called "Germany declares war on Portugal".

## goa-annexed-1961

`event` · searched for **India annexes Goa, Daman and Diu**

nothing on Wikidata is called "India annexes Goa, Daman and Diu".

## government-falls-2025

`event` · searched for **The government loses a confidence vote**

nothing on Wikidata is called "The government loses a confidence vote".

## guinea-bissau-declares-independence-1973

`event` · searched for **PAIGC declares the independence of Guinea-Bissau**

nothing on Wikidata is called "PAIGC declares the independence of Guinea-Bissau".

## guinea-war-begins-1963

`event` · searched for **Beginning of the war in Guinea**

nothing on Wikidata is called "Beginning of the war in Guinea".

## iberian-blackout-2025

`event` · searched for **The Iberian blackout**

nothing on Wikidata is called "The Iberian blackout".

## imf

`actor` · 1945– · searched for **International Monetary Fund**

10 item(s) were read and each failed a test.

- [`Q7804`](https://www.wikidata.org/wiki/Q7804) **International Monetary Fund** — international financial institution — 1944– — Q1345691, Q15925165
  - none of its classes (Q1345691, Q15925165) is in data/imports/wikidata-seeds.json → classes
- [`Q129162560`](https://www.wikidata.org/wiki/Q129162560) **International Monetary Fund** — no date — Q43109
  - none of its classes (Q43109) is in data/imports/wikidata-seeds.json → classes
- [`Q20054152`](https://www.wikidata.org/wiki/Q20054152) **Managing Director of the International Monetary Fund** — Chief Executive of the IMF — 1946– — Q4164871
  - none of its classes (Q4164871) is in data/imports/wikidata-seeds.json → classes

## imf-agreement-1978

`event` · searched for **First stabilisation agreement with the IMF**

nothing on Wikidata is called "First stabilisation agreement with the IMF".

## imf-agreement-1983

`event` · searched for **Second stabilisation agreement with the IMF**

nothing on Wikidata is called "Second stabilisation agreement with the IMF".

## law-of-separation-1911

`event` · 1911 · searched for **Law of Separation of Church and State**

1 item(s) were read and each failed a test.

- [`Q10316960`](https://www.wikidata.org/wiki/Q10316960) **Law of Separation of Church and State** — Portuguese anticlerical law passed in 20 April 1911 — no date — Q820655
  - none of its classes (Q820655) is in data/imports/wikidata-seeds.json → classes

## legiao-portuguesa

`actor` · 1936–1974 · searched for **Portuguese Legion**

3 item(s) were read and each failed a test.

- [`Q2405862`](https://www.wikidata.org/wiki/Q2405862) **Portuguese Legion** — Portuguese paramilitary organization under the Second Portuguese Republic — 1936–1974 — Q153936
  - none of its classes (Q153936) is in data/imports/wikidata-seeds.json → classes
- [`Q3270228`](https://www.wikidata.org/wiki/Q3270228) **Portuguese Legion** — military unit — 1807– — Q176799, Q93479232
  - none of its classes (Q176799, Q93479232) is in data/imports/wikidata-seeds.json → classes
- [`Q7232656`](https://www.wikidata.org/wiki/Q7232656) **Portuguese Legion** — Wikimedia disambiguation page — no date — Q4167410
  - none of its classes (Q4167410) is in data/imports/wikidata-seeds.json → classes

## legiao-portuguesa-founded-1936

`event` · searched for **Foundation of the Portuguese Legion**

nothing on Wikidata is called "Foundation of the Portuguese Legion".

## legislative-election-1976

`event` · searched for **First legislative election under the constitution**

nothing on Wikidata is called "First legislative election under the constitution".

## legislative-election-2015

`event` · searched for **Legislative election of 2015**

nothing on Wikidata is called "Legislative election of 2015".

## legislative-election-2019

`event` · searched for **Legislative election of 2019**

nothing on Wikidata is called "Legislative election of 2019".

## legislative-election-2022

`event` · searched for **Legislative election of 2022**

nothing on Wikidata is called "Legislative election of 2022".

## legislative-election-2024

`event` · searched for **Legislative election of 2024**

nothing on Wikidata is called "Legislative election of 2024".

## legislative-election-2025

`event` · searched for **Legislative election of 2025**

nothing on Wikidata is called "Legislative election of 2025".

## macau-handover-1999

`event` · 1999 · searched for **Handover of Macau**

1 item(s) were read and each failed a test.

- [`Q847839`](https://www.wikidata.org/wiki/Q847839) **transfer of sovereignty over Macau** — transfer of sovereignty over Macau from Portugal to China — 1999 — Q25929224
  - none of its classes (Q25929224) is in data/imports/wikidata-seeds.json → classes

## marcelo-elected-president-2016

`event` · searched for **Marcelo Rebelo de Sousa elected president**

nothing on Wikidata is called "Marcelo Rebelo de Sousa elected president".

## marcelo-reelected-2021

`event` · searched for **Marcelo Rebelo de Sousa re-elected**

nothing on Wikidata is called "Marcelo Rebelo de Sousa re-elected".

## military-dictatorship

`actor` · 1926–1933 · searched for **Military Dictatorship**

10 item(s) were read and each failed a test.

- [`Q49896`](https://www.wikidata.org/wiki/Q49896) **military dictatorship** — form of dictatorial military rule — no date — Q1307214
  - none of its classes (Q1307214) is in data/imports/wikidata-seeds.json → classes
- [`Q1370527`](https://www.wikidata.org/wiki/Q1370527) **Brazilian military government (1964–1985)** — 1964-1985 military regime in Brazil — 1964–1985 — Q7188, Q1197588, Q317, Q11514315
  - none of its classes (Q7188, Q1197588, Q317, Q11514315) is in data/imports/wikidata-seeds.json → classes
- [`Q2886342`](https://www.wikidata.org/wiki/Q2886342) **Military Junta of Chile** — Military dictatorship of Chile (1973–90) — 1973–1990 — Q25424534, Q17633149
  - none of its classes (Q25424534, Q17633149) is in data/imports/wikidata-seeds.json → classes

## monarchy-of-the-north-1919

`event` · searched for **The Monarchy of the North**

nothing on Wikidata is called "The Monarchy of the North".

## montenegro-government-2024

`event` · searched for **The Montenegro government takes office**

nothing on Wikidata is called "The Montenegro government takes office".

## mozambique-war-begins-1964

`event` · searched for **Beginning of the war in Mozambique**

nothing on Wikidata is called "Beginning of the war in Mozambique".

## nationalisations-1975

`event` · searched for **Nationalisation of banks and insurance**

nothing on Wikidata is called "Nationalisation of banks and insurance".

## nato-founding-1949

`event` · searched for **Portugal signs the North Atlantic Treaty**

nothing on Wikidata is called "Portugal signs the North Atlantic Treaty".

## noite-sangrenta-1921

`event` · 1921 · searched for **Noite Sangrenta**

2 item(s) were read and each failed a test.

- [`Q10337226`](https://www.wikidata.org/wiki/Q10337226) **Noite Sangrenta** — TV show aired since 2010 — 2010– — Q1259759
  - none of its classes (Q1259759) is in data/imports/wikidata-seeds.json → classes
- [`Q641898`](https://www.wikidata.org/wiki/Q641898) **Bloody Night** — name by which the radical revolt that took place in Lisbon — 1921 — Q124734, Q9026907
  - none of its classes (Q124734, Q9026907) is in data/imports/wikidata-seeds.json → classes

## october-fires-2017

`event` · searched for **The fires of October 2017**

nothing on Wikidata is called "The fires of October 2017".

## partido-democratico

`actor` · 1912–1926 · searched for **Democratic Party**

10 item(s) were read and each failed a test.

- [`Q29552`](https://www.wikidata.org/wiki/Q29552) **Democratic Party** — American political party — 1828– — Q7278
  - its dates are more than 1 year from the record's
- [`Q4157645`](https://www.wikidata.org/wiki/Q4157645) **Democratic Party** — political party in Uganda — 1954– — Q7278
  - its dates are more than 1 year from the record's
- [`Q47729`](https://www.wikidata.org/wiki/Q47729) **Democratic Party** — Italian social-democratic political party — 2007– — Q7278
  - its dates are more than 1 year from the record's

## pcp

`actor` · 1921– · searched for **Partido Comunista Português**

2 item(s) were read and each failed a test.

- [`Q769829`](https://www.wikidata.org/wiki/Q769829) **Portuguese Communist Party** — political party in Portugal — 1921– — Q233591
  - none of its classes (Q233591) is in data/imports/wikidata-seeds.json → classes
- [`Q3295407`](https://www.wikidata.org/wiki/Q3295407) **Communist Party (Reconstructed)** — defunct Portuguese political party — 1981– — Q7278
  - its dates are more than 1 year from the record's

## pedrogao-grande-fires-2017

`event` · searched for **The Pedrógão Grande fires**

nothing on Wikidata is called "The Pedrógão Grande fires".

## pimenta-de-castro-government-1915

`event` · searched for **Pimenta de Castro's authoritarian government**

nothing on Wikidata is called "Pimenta de Castro's authoritarian government".

## portugal-backs-franco-1936

`event` · searched for **Portugal supports the Nationalists in the Spanish Civil War**

nothing on Wikidata is called "Portugal supports the Nationalists in the Spanish Civil War".

## portugal-e-o-futuro-1974

`event` · searched for **Publication of Portugal e o Futuro**

nothing on Wikidata is called "Publication of Portugal e o Futuro".

## republic-proclaimed-1910

`event` · 1910 · searched for **Proclamation of the Republic**

8 item(s) were read and each failed a test.

- [`Q35784675`](https://www.wikidata.org/wiki/Q35784675) **Proclamation of the Republic** — painting by Benedito Calixto — 1893– — Q3305213
  - none of its classes (Q3305213) is in data/imports/wikidata-seeds.json → classes
- [`Q2294549`](https://www.wikidata.org/wiki/Q2294549) **Proclamation of the Republic** — November 1889 historical event in Brazil — 1889 — Q3449092, Q7995869
  - none of its classes (Q3449092, Q7995869) is in data/imports/wikidata-seeds.json → classes
- [`Q779851`](https://www.wikidata.org/wiki/Q779851) **Proclamation of the republic in Germany** — proclamation — 1918 — Q1572600
  - none of its classes (Q1572600) is in data/imports/wikidata-seeds.json → classes

## revolt-14-may-1915

`event` · searched for **The revolt of 14 May restores the Democrats**

nothing on Wikidata is called "The revolt of 14 May restores the Democrats".

## salazar-finance-minister-1928

`event` · searched for **Salazar becomes Minister of Finance**

nothing on Wikidata is called "Salazar becomes Minister of Finance".

## salazar-president-of-council-1932

`event` · searched for **Salazar becomes President of the Council**

nothing on Wikidata is called "Salazar becomes President of the Council".

## santa-maria-hijacking-1961

`event` · searched for **The seizure of the liner Santa Maria**

nothing on Wikidata is called "The seizure of the liner Santa Maria".

## sidonio-pais-assassinated-1918

`event` · 1918 · searched for **Assassination of Sidónio Pais**

1 item(s) were read and each failed a test.

- [`Q23020255`](https://www.wikidata.org/wiki/Q23020255) **assassination of Sidónio Pais** — 1918 murder in Lisbon, Portugal — 1918 — Q3882219
  - none of its classes (Q3882219) is in data/imports/wikidata-seeds.json → classes

## sidonio-pais-coup-1917

`event` · searched for **Sidónio Pais's coup**

nothing on Wikidata is called "Sidónio Pais's coup".

## soares-elected-president-1986

`event` · searched for **Mário Soares elected president**

nothing on Wikidata is called "Mário Soares elected president".

## spinola-resigns-1974

`event` · searched for **Spínola resigns the presidency**

nothing on Wikidata is called "Spínola resigns the presidency".

## troika-bailout-2011

`event` · searched for **Request for financial assistance**

nothing on Wikidata is called "Request for financial assistance".

## troika-programme-ends-2014

`event` · searched for **Exit from the adjustment programme**

nothing on Wikidata is called "Exit from the adjustment programme".

## un-admission-1955

`event` · searched for **Portugal admitted to the United Nations**

nothing on Wikidata is called "Portugal admitted to the United Nations".

## wiriyamu-massacre-1972

`event` · searched for **The Wiriyamu massacre**

nothing on Wikidata is called "The Wiriyamu massacre".

## world-youth-day-2023

`event` · searched for **World Youth Day in Lisbon**

nothing on Wikidata is called "World Youth Day in Lisbon".
