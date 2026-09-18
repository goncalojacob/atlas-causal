# Draft — Portugal since the end of the monarchy (1910→)

**Status: assistant-drafted skeleton, not reviewed, not data.** Nothing here
is in `data/`. This is a worked example of what a slice looks like before
a person turns it into records: candidate events with dates and places,
candidate edges with a proposed type and confidence, and the works where
each argument is made. The `explanation` and `dispute` texts — the actual
historiographical arguments — are deliberately not drafted; `CLAUDE.md`
says a person writes them. Every date below was written from memory; the
ones marked **verify** are the ones I am least sure of, but check all of
them against the sources before creating a record.

Prepared 1 September 2026 at the owner's request. To turn a row into a
record: `node tools/new-record.mjs event <id> --title … --start … --lon …
--lat … --label …`, then fill in `summary`, `sources`, and `region` where
the derived lane would be wrong.

## Candidate events

Region is the lane the coordinates should derive; set it explicitly where
marked. Precision is `city` unless noted.

| id | title | date | place (lon, lat) | region | notes |
|---|---|---|---|---|---|
| `republic-proclaimed-1910` | Proclamation of the Republic | 1910-10-05 | Lisbon (−9.14, 38.72) | europe | End of the monarchy; Manuel II into exile. |
| `law-of-separation-1911` | Law of Separation of Church and State | 1911-04-20 | Lisbon | europe | Afonso Costa's decree. |
| `constitution-1911` | Constitution of 1911 | 1911-08-21 **verify** | Lisbon | europe | Parliamentary regime. |
| `germany-declares-war-1916` | Germany declares war on Portugal | 1916-03-09 | Berlin (13.40, 52.52) | europe | After Portugal seized German ships in Lisbon, 23 Feb 1916. |
| `sidonio-pais-coup-1917` | Sidónio Pais's coup | 1917-12-05 → 1917-12-08 | Lisbon | europe | "República Nova". |
| `battle-of-the-lys-1918` | Battle of the Lys | 1918-04-09 | Flanders, near Laventie (2.78, 50.62) | europe | Portuguese Expeditionary Corps broken. Precision `region`. |
| `sidonio-pais-assassinated-1918` | Assassination of Sidónio Pais | 1918-12-14 | Lisbon | europe | Rossio station. |
| `noite-sangrenta-1921` | Noite Sangrenta | 1921-10-19 | Lisbon | europe | Murder of António Granjo, Machado Santos and others. |
| `coup-28-may-1926` | Coup of 28 May | 1926-05-28 | Braga (−8.42, 41.55) | europe | Gomes da Costa; end of the First Republic. |
| `salazar-finance-minister-1928` | Salazar becomes Minister of Finance | 1928-04-27 | Lisbon | europe | With full control over spending. |
| `salazar-president-of-council-1932` | Salazar becomes President of the Council | 1932-07-05 | Lisbon | europe | |
| `constitution-1933` | Constitution of 1933 | 1933-03-19 | Lisbon | europe | Plebiscite; founding of the Estado Novo. |
| `azores-agreement-1943` | Anglo-Portuguese agreement on Azores bases | 1943-08-17 **verify** | Lajes, Terceira (−27.09, 38.76) | europe (set explicitly; 110 m map lacks the islands) | Invoking the old alliance. |
| `nato-founding-1949` | Portugal signs the North Atlantic Treaty | 1949-04-04 | Washington (−77.04, 38.90) | americas | Founding member. |
| `un-admission-1955` | Portugal admitted to the United Nations | 1955-12-14 | New York (−73.97, 40.75) | americas | Part of the 1955 package deal. |
| `delgado-candidacy-1958` | Humberto Delgado's presidential candidacy | 1958-06-08 | Lisbon | europe | Date is the election; campaign from May. |
| `angola-war-begins-1961` | Beginning of the war in Angola | 1961-02-04 → 1961-03-15 | Luanda (13.23, −8.84) | africa | 4 Feb Luanda; 15 March uprisings in the north. |
| `goa-annexed-1961` | India annexes Goa, Daman and Diu | 1961-12-18 → 1961-12-19 | Panaji (73.83, 15.49) | asia | |
| `guinea-war-begins-1963` | Beginning of the war in Guinea | 1963-01-23 **verify** | Tite, Guinea-Bissau (−15.35, 11.42) | africa | PAIGC attack on the Tite barracks. |
| `mozambique-war-begins-1964` | Beginning of the war in Mozambique | 1964-09-25 | Chai, Cabo Delgado (39.7, −12.6) **verify coords** | africa | FRELIMO's first attack. Precision `region`. |
| `caetano-succeeds-salazar-1968` | Marcelo Caetano succeeds Salazar | 1968-09-27 | Lisbon | europe | After Salazar's incapacitation in August. |
| `guinea-bissau-declares-independence-1973` | PAIGC declares the independence of Guinea-Bissau | 1973-09-24 | Boé (−14.2, 11.8) **verify coords** | africa | Unilateral; recognised by Portugal 10 Sept 1974. |
| `portugal-e-o-futuro-1974` | Publication of *Portugal e o Futuro* | 1974-02-22 **verify** | Lisbon | europe | Spínola's book. |
| `carnation-revolution-1974` | 25 April | 1974-04-25 | Lisbon | europe | |
| `nationalisations-1975` | Nationalisation of banks and insurance | 1975-03-14 → 1975-03-15 | Lisbon | europe | After the failed 11 March coup. |
| `constituent-assembly-election-1975` | Constituent Assembly election | 1975-04-25 | Lisbon | europe | First free election with universal suffrage. |
| `angola-independence-1975` | Independence of Angola | 1975-11-11 | Luanda | africa | Portugal withdraws without transferring power to one movement. |
| `25-november-1975` | 25 November | 1975-11-25 | Lisbon | europe | End of the PREC. |
| `east-timor-invasion-1975` | Indonesia invades East Timor | 1975-12-07 | Dili (125.57, −8.56) | asia | Nine days after FRETILIN's declaration of independence. |
| `constitution-1976` | Constitution of 1976 | 1976-04-02 | Lisbon | europe | |
| `eec-application-1977` | Portugal applies to join the EEC | 1977-03-28 | Lisbon | europe | |
| `eec-accession-1986` | Portugal joins the EEC | 1986-01-01 | Lisbon | europe | Treaty signed at the Jerónimos, 12 June 1985. |
| `macau-handover-1999` | Handover of Macau | 1999-12-20 | Macau (113.54, 22.20) | asia | |
| `east-timor-independence-2002` | Independence of East Timor | 2002-05-20 | Dili | asia | |
| `troika-bailout-2011` | Request for financial assistance | 2011-04-06 → 2011-05-17 | Lisbon | europe | Request 6 April; memorandum 17 May. |

## Candidate edges

Type and confidence are proposals to be confirmed or overturned by the
person writing the explanation. "Argued in" points at where the case is
made, not at a verdict. Ids follow `from--to--type`.

| from | to | type | proposed confidence | the argument to be written, and where it is argued |
|---|---|---|---|---|
| `republic-proclaimed-1910` | `law-of-separation-1911` | caused | consensus | Anticlericalism was central to the republican programme. Wheeler 1978; Ramos 2009. |
| `republic-proclaimed-1910` | `constitution-1911` | caused | consensus | Wheeler 1978. |
| `law-of-separation-1911` | `coup-28-may-1926` | precondition-of | probable | The religious question as a lasting source of conservative and rural opposition to the Republic. Wheeler 1978; Ramos 2009. |
| `constitution-1911` | `sidonio-pais-coup-1917` | reacted-to | probable | Sidónio's presidentialism as a reaction against the 1911 parliamentary settlement. Meneses 2004. |
| `germany-declares-war-1916` | `sidonio-pais-coup-1917` | caused | probable | The war's unpopularity and the Democrats' "war party" as the coup's context. Meneses 2004. |
| `germany-declares-war-1916` | `battle-of-the-lys-1918` | caused | consensus | Belligerency put the CEP in Flanders. Meneses 2004. |
| `battle-of-the-lys-1918` | `coup-28-may-1926` | precondition-of | probable | The war's effect on the army's politicisation and on the Republic's legitimacy. Meneses 2004; Wheeler 1978. **Candidate for `disputed`** — how much the war explains 1926 is debated. |
| `sidonio-pais-assassinated-1918` | `noite-sangrenta-1921` | precondition-of | probable | The cycle of political violence after 1918. Wheeler 1978. |
| `noite-sangrenta-1921` | `coup-28-may-1926` | precondition-of | probable | The Republic's association with violence in conservative and military opinion. Wheeler 1978; Ramos 2009. |
| `coup-28-may-1926` | `salazar-finance-minister-1928` | enabled | consensus | The military dictatorship's financial failure led it to call Salazar on his own terms. Meneses 2009; Rosas 2012. |
| `salazar-finance-minister-1928` | `salazar-president-of-council-1932` | caused | consensus | Budgetary success as the basis of political ascendancy. Meneses 2009. |
| `salazar-president-of-council-1932` | `constitution-1933` | caused | consensus | Rosas 1994; Meneses 2009. |
| `coup-28-may-1926` | `constitution-1933` | precondition-of | consensus | Rosas 1994. |
| `azores-agreement-1943` | `nato-founding-1949` | enabled | probable | Wartime cooperation and the Azores' strategic value as the reason an authoritarian regime was invited. Telo 2007. |
| `nato-founding-1949` | `un-admission-1955` | enabled | probable | **Candidate for `disputed`** — UN admission came in a 1955 package deal; how much NATO membership mattered is arguable. Costa Pinto 2003. |
| `un-admission-1955` | `angola-war-begins-1961` | precondition-of | probable | UN membership exposed Portugal to Chapter XI pressure on its "overseas provinces". MacQueen 1997. |
| `angola-war-begins-1961` | `goa-annexed-1961` | enabled | disputed | Whether Portugal's isolation after Angola weighed in Nehru's decision; his motives are contested. MacQueen 1997; Costa Pinto 2003. |
| `angola-war-begins-1961` | `guinea-war-begins-1963` | inspired | probable | PAIGC had its own preparation; the Angolan precedent shaped timing and expectations. MacQueen 1997. |
| `angola-war-begins-1961` | `mozambique-war-begins-1964` | inspired | probable | As above, for FRELIMO. MacQueen 1997. |
| `guinea-war-begins-1963` | `guinea-bissau-declares-independence-1973` | caused | consensus | MacQueen 1997. |
| `guinea-bissau-declares-independence-1973` | `portugal-e-o-futuro-1974` | caused | probable | Spínola's Guinea command and the war's unwinnability as the book's origin. Maxwell 1995. |
| `portugal-e-o-futuro-1974` | `carnation-revolution-1974` | enabled | consensus | The book gave the captains' movement a political horizon and a general. Maxwell 1995. |
| `angola-war-begins-1961` | `carnation-revolution-1974` | caused | consensus | The colonial wars as the root cause of 25 April. Maxwell 1995; Rosas 1994. |
| `guinea-war-begins-1963` | `carnation-revolution-1974` | caused | consensus | Guinea specifically: the MFA's origin among its officers. Maxwell 1995. |
| `caetano-succeeds-salazar-1968` | `carnation-revolution-1974` | precondition-of | probable | The failed liberalisation ("Primavera Marcelista") and the disillusion it left. Rosas 1994; Costa Pinto 2003. |
| `carnation-revolution-1974` | `nationalisations-1975` | enabled | consensus | Maxwell 1995. |
| `carnation-revolution-1974` | `constituent-assembly-election-1975` | caused | consensus | The MFA programme's promise. Maxwell 1995. |
| `carnation-revolution-1974` | `angola-independence-1975` | caused | consensus | MacQueen 1997. |
| `carnation-revolution-1974` | `east-timor-invasion-1975` | enabled | consensus | Portuguese withdrawal left the vacuum Indonesia filled. MacQueen 1997. |
| `nationalisations-1975` | `25-november-1975` | reacted-to | probable | The moderates' counter-move as a reaction to radicalisation. Maxwell 1995. |
| `constituent-assembly-election-1975` | `25-november-1975` | enabled | probable | The election's moderate majority as legitimacy for 25 November. Maxwell 1995. |
| `25-november-1975` | `constitution-1976` | enabled | consensus | The civil-military compromise (Council of the Revolution) it made possible. Maxwell 1995. |
| `constitution-1976` | `eec-application-1977` | enabled | consensus | A democratic constitution as the precondition of the application. Costa Pinto 2003. |
| `eec-application-1977` | `eec-accession-1986` | caused | consensus | Costa Pinto 2003; Telo 2007. |
| `carnation-revolution-1974` | `macau-handover-1999` | precondition-of | probable | Post-1974 decolonisation policy and the 1987 Joint Declaration. Costa Pinto 2003. |
| `east-timor-invasion-1975` | `east-timor-independence-2002` | precondition-of | consensus | MacQueen 1997 for the origins; later works for 1999–2002. |
| `eec-accession-1986` | `troika-bailout-2011` | precondition-of | disputed | Whether integration and the euro explain the 2011 crisis, or domestic choices do. Debated in both directions; the `dispute` field is where this edge earns its place. |

## Sources to create

Real works; ISBNs and DOIs are left for the person creating the source
records — the validator requires at least one identifier per source.

| id | citation |
|---|---|
| `wheeler-1978-republican-portugal` | Douglas L. Wheeler, *Republican Portugal: A Political History, 1910–1926*, University of Wisconsin Press, 1978. |
| `meneses-2004-portugal-1914-1926` | Filipe Ribeiro de Meneses, *Portugal 1914–1926: From the First World War to Military Dictatorship*, Bristol, 2004. |
| `meneses-2009-salazar` | Filipe Ribeiro de Meneses, *Salazar: A Political Biography*, Enigma Books, 2009. |
| `rosas-1994-estado-novo` | Fernando Rosas, *O Estado Novo (1926–1974)*, vol. 7 of José Mattoso (dir.), *História de Portugal*, Círculo de Leitores, 1994. |
| `rosas-2012-salazar-e-o-poder` | Fernando Rosas, *Salazar e o Poder: A Arte de Saber Durar*, Tinta-da-China, 2012. |
| `ramos-2009-historia-de-portugal` | Rui Ramos (coord.), Bernardo Vasconcelos e Sousa, Nuno Gonçalo Monteiro, *História de Portugal*, A Esfera dos Livros, 2009. |
| `maxwell-1995-making-of-portuguese-democracy` | Kenneth Maxwell, *The Making of Portuguese Democracy*, Cambridge University Press, 1995. |
| `macqueen-1997-decolonization` | Norrie MacQueen, *The Decolonization of Portuguese Africa: Metropolitan Revolution and the Dissolution of Empire*, Longman, 1997. |
| `costa-pinto-2003-contemporary-portugal` | António Costa Pinto (ed.), *Contemporary Portugal: Politics, Society and Culture*, Social Science Monographs / Columbia University Press, 2003. |
| `telo-2007-historia-contemporanea` | António José Telo, *História Contemporânea de Portugal: do 25 de Abril à Actualidade*, Presença, 2007–2008 (2 vols). |

## What this example exercises in the model

- An event with a **multi-day interval** (Sidónio's coup, Angola 1961, the
  bailout) and one with **`precision: region`** (the Lys, Chai).
- Events whose derived lane would be wrong or impossible: the **Azores**
  (absent at 110 m), **Lajes**, and strait-adjacent places — `region` set
  by hand.
- Two edges proposed as **`disputed`** and three flagged as candidates, so
  the `dispute` field and the dashed rendering get real use.
- **Convergence** at `carnation-revolution-1974`: arriving via Guinea shows
  Angola, Mozambique, Caetano and Spínola's book as the other branches.
- **`consensus` requiring two independent authors** — most consensus rows
  above cite two works; the ones citing one need a second before they
  validate.
- Cross-continent effects, which is what the format is for: Lisbon → Luanda
  → Panaji → Dili → New York.
