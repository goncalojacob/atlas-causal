# The P361 children of every held Africa and Asia umbrella

Measured on 2026-10-01 by the M42 import fire that claimed at 16:07Z, and
written down **in full so that no later fire has to fetch it again** — the same
service deviation 1515's table of 53 does for the `done`-cursor vein.

## What this is, and what it is not

A10 sends every batch to the lanes that trail. A6 forbids a filing that raises
the main count, so an import needs a **held umbrella to be part of**. Those two
together say what a candidate looks like before any article is read: *an item
whose `P361` is the Wikidata item of an event this atlas already holds, in the
`africa` or `asia` lane.*

That question had never been asked of the corpus as a whole. It was asked here,
of **every main active event in those two lanes that carries an item** — 88 of
them — through one `P361` query per 40 umbrellas at the Wikidata query service,
and then one `wbgetentities` pass over every child:

| | |
| --- | --- |
| main active events with an item, `africa` + `asia` | **88** |
| distinct `P361` children of those 88 on Wikidata | **1,798** |
| of those, not held here under any id | **1,640** |
| **of those, class in `wikidata-seeds.json` → `classes` as an event, a `P580`/`P582`/`P585`, and an `enwiki` article** | **1,008** |

**1,008 is a supply figure and nothing more.** Every row below has cleared the
class gate, the date gate, the article gate and A6's filing gate. None of them
has cleared **the edge** (A5, A15(1)), and none has cleared the **span gate** —
a child dated outside its umbrella's own years is A6's open question, which is
the owner's and not a fire's, and the two largest rows of the earlier vein
(`Q476855` the Mau Mau rebellion, `Q31944` the Mahdist War) are refused on
exactly that. The fire that measured this screened **rows 1 to 170** against both and wrote
**two** records: row 32, `Q140025`, as batch 82, and row 122, `Q2177009`, as
batch 83. **About one import per 85 rows read** is the rate to budget for, and
`docs/m42-pool.md` carries the reading of every refusal under *Deviation 1522*,
*Batch 82* and *Batch 83*. **A later fire starts at row 171.**

So this is a list to work, not a list to import. The rate to budget for is the
one the 1 October stands already name: the edge kills most of them.

## How to re-take it

One SPARQL query per 40 umbrellas — `SELECT ?p ?x WHERE { VALUES ?p { wd:… }
?x wdt:P361 ?p }` — then `wbgetentities` in chunks of 25 for `P31`, the three
date properties and `sitelinks`. Both endpoints want the import's own
User-Agent and a backoff; deviation 1502's reading still holds.

## The 1,008, highest sitelink count first

Format: item, sitelinks, Wikidata's label, the English article, and the held
umbrella its `P361` names with that umbrella's lane.

| item | links | label | article | under |
| --- | --- | --- | --- | --- |
| `Q151622` | 88 | Israeli–Palestinian conflict | Israeli–Palestinian conflict | arab-israeli-conflict(asia) |
| `Q46333` | 65 | Long March | Long March | chinese-civil-war(asia) |
| `Q122976243` | 59 | October 7 attacks | October 7 attacks | gaza-war(asia) |
| `Q87138` | 55 | Greco-Turkish War | Greco-Turkish War (1919–1922) | turkish-war-of-independence(asia) |
| `Q125464497` | 50 | April 2024 Iranian strikes on Israel | April 2024 Iranian strikes on Israel | gaza-war(asia) |
| `Q856650` | 45 | Iraqi invasion of Kuwait | Iraqi invasion of Kuwait | gulf-war(asia) |
| `Q135005864` | 45 | 2025 United States strikes on Iranian nuclear sites | 2025 United States strikes on Iranian nuclear sites | twelve-day-war(asia) |
| `Q138414208` | 42 | 2026 Afghanistan–Pakistan War | 2026 Afghanistan–Pakistan war | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q476855` | 41 | Mau Mau rebellion | Mau Mau rebellion | decolonisation-of-africa(africa) |
| `Q31944` | 41 | Mahdist War | Mahdist War | scramble-for-africa(africa) |
| `Q725043` | 39 | Operation Opera | Operation Opera | arab-israeli-conflict(asia) |
| `Q1073476` | 38 | Northern Expedition | Northern Expedition | chinese-civil-war(asia) |
| `Q128172378` | 38 | assassination of Ismail Haniyeh | Assassination of Ismail Haniyeh | gaza-war(asia) |
| `Q957586` | 38 | Turkish–Armenian War | Turkish invasion of Armenia | turkish-war-of-independence(asia) |
| `Q1551794` | 37 | Japanese invasion of Manchuria | Japanese invasion of Manchuria | second-sino-japanese-war(asia) |
| `Q23638613` | 36 | 2016 Lahore suicide bombing | 2016 Lahore suicide bombing | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q697579` | 35 | Battle of Lake Khasan | Battle of Lake Khasan | soviet-japanese-border-conflicts(asia) |
| `Q696448` | 33 | Operation Ichi-Go | Operation Ichi-Go | second-sino-japanese-war(asia) |
| `Q334720` | 33 | Abu Ghraib torture and prisoner abuse | Abu Ghraib torture and prisoner abuse | iraq-war(asia) |
| `Q137703947` | 32 | 2026 Iran massacres | 2025–2026 Iran massacres | 2025-2026-iranian-protests(asia) |
| `Q476634` | 31 | Nanchang Uprising | Nanchang Uprising | chinese-civil-war(asia) |
| `Q116485898` | 31 | 2023 Peshawar mosque bombing | 2023 Peshawar mosque bombing | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q105367670` | 31 | 2021–present Myanmar protests | Myanmar protests (2021–present) | myanmar-civil-war(asia) |
| `Q86521237` | 30 | COVID-19 pandemic in Asia | COVID-19 pandemic in Asia | covid-19-pandemic(asia) |
| `Q86694873` | 30 | COVID-19 pandemic in Africa | COVID-19 pandemic in Africa | covid-19-pandemic(asia) |
| `Q574543` | 29 | Operation Orchard | Operation Outside the Box | arab-israeli-conflict(asia) |
| `Q123109101` | 29 | al-Ahli Arab Hospital explosion | Al-Ahli Arab Hospital explosion | gaza-war(asia) |
| `Q124477340` | 29 | killing of Hind Rajab | Killing of Hind Rajab | gaza-war(asia) |
| `Q3241199` | 28 | Israeli–Lebanese conflict | Israeli–Lebanese conflict | arab-israeli-conflict(asia) |
| `Q244941` | 28 | Xi'an Incident | Xi'an Incident | chinese-civil-war(asia) |
| `Q130374882` | 27 | 2024 Hezbollah headquarters strike | 2024 Hezbollah headquarters strike | gaza-war(asia) |
| `Q140025` | 27 | Japanese invasion of French Indochina | Japanese invasion of French Indochina | second-sino-japanese-war(asia) |
| `Q749970` | 27 | insurgency in Jammu and Kashmir | Insurgency in Jammu and Kashmir | kashmir-conflict(asia) |
| `Q61896704` | 27 | 2019 India–Pakistan border skirmishes | 2019 India–Pakistan border skirmishes | kashmir-conflict(asia) |
| `Q2000527` | 26 | Siachen conflict | Siachen conflict | kashmir-conflict(asia) |
| `Q2421268` | 25 | First Taiwan Strait Crisis | First Taiwan Strait Crisis | chinese-civil-war(asia) |
| `Q136190686` | 25 | Israeli attack on Doha | Israeli attack on Doha | gaza-war(asia) |
| `Q709333` | 25 | Battle of Changsha | Battle of Changsha (1939) | second-sino-japanese-war(asia) |
| `Q1330136` | 25 | Second Battle of Fallujah | Second Battle of Fallujah | iraq-war(asia) |
| `Q1537159` | 25 | First Battle of Fallujah | First Battle of Fallujah | iraq-war(asia) |
| `Q45156` | 24 | Operation Wooden Leg | Operation Wooden Leg | arab-israeli-conflict(asia) |
| `Q705373` | 24 | Third Taiwan Strait Crisis | Third Taiwan Strait Crisis | chinese-civil-war(asia) |
| `Q2583734` | 24 | Indonesian invasion of East Timor | Indonesian invasion of East Timor | decolonisation-of-asia(asia) |
| `Q123170` | 24 | Cinema Rex fire | Cinema Rex fire | iranian-revolution(asia) |
| `Q1813378` | 23 | Battle of Tskhinvali | Battle of Tskhinvali | russo-georgian-war(asia) |
| `Q1450532` | 23 | Franco-Turkish War | Franco-Turkish War | turkish-war-of-independence(asia) |
| `Q555833` | 22 | 2011–2012 Jordanian protests | 2011–2012 Jordanian protests | arab-spring(africa) |
| `Q2165215` | 22 | Iraqi insurgency | Iraqi insurgency (2011–2013) | arab-spring(africa) |
| `Q385180` | 22 | Battle of the Yalu River | Battle of the Yalu River (1894) | first-sino-japanese-war(asia) |
| `Q709261` | 22 | Hundred Regiments Offensive | Hundred Regiments Offensive | second-sino-japanese-war(asia) |
| `Q26236680` | 22 | August 2016 Quetta attacks | August 2016 Quetta attacks | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q1191151` | 21 | Tiananmen incident | 1976 Tiananmen incident | cultural-revolution(asia) |
| `Q715791` | 21 | Battle of Pyongyang | Battle of Pyongyang (1894) | first-sino-japanese-war(asia) |
| `Q992318` | 21 | Autumn Harvest Uprising | Autumn Harvest Uprising | chinese-civil-war(asia) |
| `Q86694210` | 21 | COVID-19 pandemic in Oceania | COVID-19 pandemic in Oceania | covid-19-pandemic(asia) |
| `Q123036458` | 21 | Israeli invasion of the Gaza Strip | Israeli invasion of the Gaza Strip | gaza-war(asia) |
| `Q133309815` | 21 | Operation Might and Sword | March 2025 Israeli attacks on the Gaza Strip | gaza-war(asia) |
| `Q626796` | 21 | Battle of Taierzhuang | Battle of Taierzhuang | second-sino-japanese-war(asia) |
| `Q718770` | 20 | Battle of Khafji | Battle of Khafji | gulf-war(asia) |
| `Q152060` | 20 | Cabinda Conflict | Cabinda War | angolan-civil-war(africa) |
| `Q122982851` | 20 | Israeli blockade of the Gaza Strip (2023–present) | Israeli blockade of the Gaza Strip (2023–present) | gaza-war(asia) |
| `Q1899132` | 20 | Black Friday | Black Friday (1978) | iranian-revolution(asia) |
| `Q709429` | 20 | Battle of Beiping–Tianjin | Battle of Beiping–Tianjin | second-sino-japanese-war(asia) |
| `Q1759660` | 20 | Battle of Changsha | Battle of Changsha (1941) | second-sino-japanese-war(asia) |
| `Q1804983` | 20 | Battle of Baghdad | Battle of Baghdad (2003) | iraq-war(asia) |
| `Q3780506` | 20 | Operation Red Dawn | Capture of Saddam Hussein | iraq-war(asia) |
| `Q1538940` | 19 | Lillehammer affair | Lillehammer affair | arab-israeli-conflict(asia) |
| `Q14746872` | 19 | Syrian revolution | Syrian revolution | arab-spring(africa) |
| `Q89453779` | 19 | 2020 COVID-19 pandemic in Antarctica | COVID-19 pandemic in Antarctica | covid-19-pandemic(asia) |
| `Q2026308` | 19 | Operation Praying Mantis | Operation Praying Mantis | iran-iraq-war(asia) |
| `Q114868905` | 19 | 2022 Shah Cheragh attack | 2022 Shah Cheragh attack | mahsa-amini-protests(asia) |
| `Q79546163` | 18 | Red August | Red August | cultural-revolution(asia) |
| `Q3720660` | 18 | 2012–2013 Egyptian protests | 2012–2013 Egyptian protests | arab-spring(africa) |
| `Q123034716` | 18 | Gaza war protests | Gaza war protests | gaza-war(asia) |
| `Q712505` | 18 | Battle of Changde | Battle of Changde | second-sino-japanese-war(asia) |
| `Q1241158` | 17 | Operation Rainbow | 2004 Israeli operation in Rafah | arab-israeli-conflict(asia) |
| `Q940675` | 17 | 2011 Omani protests | 2011 Omani protests | arab-spring(africa) |
| `Q122972407` | 17 | Battle of Sderot | Battle of Sderot | gaza-war(asia) |
| `Q124695144` | 17 | Flour Massacre | Flour Massacre | gaza-war(asia) |
| `Q709303` | 17 | Battle of Changsha | Battle of Changsha (1941–1942) | second-sino-japanese-war(asia) |
| `Q716144` | 17 | Sook Ching | Sook Ching | second-sino-japanese-war(asia) |
| `Q385820` | 17 | French conquest of Tunisia | French conquest of Tunisia | scramble-for-africa(africa) |
| `Q370143` | 17 | 2003 Baghdad DHL attempted shootdown incident | 2003 Baghdad DHL attempted shootdown incident | iraq-war(asia) |
| `Q2985554` | 16 | Operation Searchlight | Operation Searchlight | bangladesh-liberation-war(asia) |
| `Q65070966` | 16 | Islamic State–Taliban conflict | Islamic State–Taliban conflict | afghan-conflict(asia) |
| `Q122971969` | 16 | Battle of Re'im | Battle of Re'im | gaza-war(asia) |
| `Q126416493` | 16 | Operation Arnon | Nuseirat rescue and massacre | gaza-war(asia) |
| `Q127638355` | 16 | July 2024 Houthi–Israel attacks | July 2024 Houthi–Israel attacks | gaza-war(asia) |
| `Q815104` | 16 | Siege of Abadan | Siege of Abadan | iran-iraq-war(asia) |
| `Q2344156` | 16 | Battle of the Kodori Valley | Battle of the Kodori Valley | russo-georgian-war(asia) |
| `Q796498` | 16 | Third Indochina War | Third Indochina War | indochina-wars(asia) |
| `Q3365438` | 16 | War in southern Vietnam | War in southern Vietnam (1945–1946) | indochina-wars(asia) |
| `Q947960` | 15 | 2011–2012 Iranian protests | 2011–2012 Iranian protests | arab-spring(africa) |
| `Q1149627` | 15 | 2011 Djiboutian protests | 2011 Djiboutian protests | arab-spring(africa) |
| `Q701890` | 15 | Battle of Pungdo | Battle of Pungdo | first-sino-japanese-war(asia) |
| `Q1208996` | 15 | Battle of Lushunkou | Battle of Lüshunkou | first-sino-japanese-war(asia) |
| `Q919834` | 15 | Operation Ramadan | Operation Ramadan | iran-iraq-war(asia) |
| `Q1132313` | 15 | Battle of Khorramshahr | Battle of Khorramshahr (1980) | iran-iraq-war(asia) |
| `Q1687078` | 15 | Operation Earnest Will | Operation Earnest Will | iran-iraq-war(asia) |
| `Q709521` | 15 | Battle of Taiyuan | Battle of Taiyuan | second-sino-japanese-war(asia) |
| `Q778699` | 15 | Siege of Baler | Siege of Baler | philippine-revolution(asia) |
| `Q1018682` | 15 | Nisour Square massacre | Nisour Square massacre | iraq-war(asia) |
| `Q13053166` | 15 | Red Army invasion of Armenia | Soviet invasion of Armenia | turkish-war-of-independence(asia) |
| `Q705072` | 14 | Battle of Seonghwan | Battle of Seonghwan | first-sino-japanese-war(asia) |
| `Q1185335` | 14 | Battle of Weihaiwei | Battle of Weihaiwei | first-sino-japanese-war(asia) |
| `Q113435201` | 14 | 2022 Chinese military exercises around Taiwan | 2022 Chinese military exercises around Taiwan | chinese-civil-war(asia) |
| `Q122983274` | 14 | Jabalia refugee camp airstrikes | Attacks on Jabalia refugee camp (2023–present) | gaza-war(asia) |
| `Q123014721` | 14 | Battle of Zikim | Zikim attack | gaza-war(asia) |
| `Q123059058` | 14 | Nahal Oz attack | Nahal Oz attack | gaza-war(asia) |
| `Q131842850` | 14 | Iron Wall Operation | Iron Wall (Israeli military operation) | gaza-war(asia) |
| `Q814223` | 14 | Liberation of Khorramshahr | Battle of Khorramshahr (1982) | iran-iraq-war(asia) |
| `Q1765847` | 14 | Attack on H3 | H-3 airstrike | iran-iraq-war(asia) |
| `Q6414580` | 14 | Tankers War | Tanker war | iran-iraq-war(asia) |
| `Q19996727` | 14 | Siege of Basra | Siege of Basra | iran-iraq-war(asia) |
| `Q705165` | 14 | Bombing of Chongqing | Bombing of Chongqing | second-sino-japanese-war(asia) |
| `Q709385` | 14 | Battle of Nanchang | Battle of Nanchang | second-sino-japanese-war(asia) |
| `Q709396` | 14 | Battle of Pingxingguan | Battle of Pingxingguan | second-sino-japanese-war(asia) |
| `Q716629` | 14 | Changjiao massacre | Changjiao massacre | second-sino-japanese-war(asia) |
| `Q2889462` | 14 | Battle of Najaf | Battle of Najaf (2004) | iraq-war(asia) |
| `Q2303566` | 13 | Operation Days of Penitence | 2004 Israeli operation in the northern Gaza Strip | arab-israeli-conflict(asia) |
| `Q136001786` | 13 | August 2025 Israeli attack on Sanaa | August 2025 Israeli attack on Sanaa | arab-israeli-conflict(asia) |
| `Q2177009` | 13 | Russian invasion of Manchuria | Russian invasion of Manchuria | boxer-rebellion(asia) |
| `Q1208970` | 13 | Battle of Yingkou | Battle of Yingkou | first-sino-japanese-war(asia) |
| `Q1209808` | 13 | Battle of Jiuliancheng | Battle of Jiuliancheng | first-sino-japanese-war(asia) |
| `Q909396` | 13 | New Fourth Army incident | New Fourth Army Incident | chinese-civil-war(asia) |
| `Q127946456` | 13 | Majdal Shams attack | Majdal Shams attack | gaza-war(asia) |
| `Q133287207` | 13 | March–April 2025 United States attacks in Yemen | March–May 2025 United States attacks in Yemen | gaza-war(asia) |
| `Q83002` | 13 | First Battle of al-Faw | First Battle of al-Faw | iran-iraq-war(asia) |
| `Q1570898` | 13 | Battle of Dezful | Operation Nasr | iran-iraq-war(asia) |
| `Q3267629` | 13 | Operation Badr | Operation Badr (1985) | iran-iraq-war(asia) |
| `Q3267722` | 13 | Operation Undeniable Victory | Operation Fath ol-Mobin | iran-iraq-war(asia) |
| `Q700499` | 13 | Zhejiang-Jiangxi Campaign | Zhejiang-Jiangxi campaign | second-sino-japanese-war(asia) |
| `Q717505` | 13 | Battle of Xinkou | Battle of Xinkou | second-sino-japanese-war(asia) |
| `Q722051` | 13 | Anglo-Ashanti wars | Anglo-Ashanti wars | scramble-for-africa(africa) |
| `Q2888122` | 13 | Battle of Basra | Battle of Basra (2008) | iraq-war(asia) |
| `Q123291016` | 13 | Operation 1027 | Operation 1027 | myanmar-civil-war(asia) |
| `Q2895966` | 12 | El Al Flight 253 attack | El Al Flight 253 | arab-israeli-conflict(asia) |
| `Q56650604` | 12 | Syria missile strikes | Syria missile strikes (September 2018) | arab-israeli-conflict(asia) |
| `Q138772633` | 12 | Iran–Israel conflict | Iran–Israel conflict | arab-israeli-conflict(asia) |
| `Q1402530` | 12 | Battle of 73 Easting | Battle of 73 Easting | gulf-war(asia) |
| `Q2071090` | 12 | Amiriyah shelter bombing | Amiriyah shelter bombing | gulf-war(asia) |
| `Q4087313` | 12 | Battle of Peking | Battle of Peking (1900) | boxer-rebellion(asia) |
| `Q4337436` | 12 | Siege of the International Legations | Siege of the International Legations | boxer-rebellion(asia) |
| `Q2583202` | 12 | Pescadores Campaign | Pescadores campaign (1895) | first-sino-japanese-war(asia) |
| `Q699096` | 12 | Battle of Guningtou | Battle of Guningtou | chinese-civil-war(asia) |
| `Q1038900` | 12 | Guangzhou Uprising | Guangzhou Uprising | chinese-civil-war(asia) |
| `Q3180637` | 12 | Battle of Qala-i-Jangi | Battle of Qala-i-Jangi | afghan-conflict(asia) |
| `Q123138276` | 12 | Church of Saint Porphyrius airstrike | Church of Saint Porphyrius airstrike | gaza-war(asia) |
| `Q125273168` | 12 | World Central Kitchen drone strikes | World Central Kitchen aid convoy attack | gaza-war(asia) |
| `Q126140767` | 12 | Tel al-Sultan camp airstrike | Tel al-Sultan attack | gaza-war(asia) |
| `Q191577` | 12 | Operation Morvarid | Operation Morvarid | iran-iraq-war(asia) |
| `Q697247` | 12 | Battle of West Hunan | Battle of West Hunan | second-sino-japanese-war(asia) |
| `Q705319` | 12 | 1939–1940 Winter Offensive | 1939–1940 Winter Offensive | second-sino-japanese-war(asia) |
| `Q709704` | 12 | Battle of South Guangxi | Battle of South Guangxi | second-sino-japanese-war(asia) |
| `Q709830` | 12 | Battle of Shanggao | Battle of Shanggao | second-sino-japanese-war(asia) |
| `Q717521` | 12 | Battle of West Hubei | Battle of West Hubei | second-sino-japanese-war(asia) |
| `Q814242` | 12 | Pacification of Manchukuo | Counterinsurgency in Manchuria | second-sino-japanese-war(asia) |
| `Q2621757` | 12 | Lal Masjid Siege | Siege of Lal Masjid | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q141501925` | 12 | 2026 Kohat attack | 2026 Kohat attack | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q1402902` | 12 | Dervish War | Dervish War | scramble-for-africa(africa) |
| `Q6067801` | 12 | Anbar campaign (2003–2011) | Anbar campaign (2003–2011) | iraq-war(asia) |
| `Q198658` | 12 | Chanak crisis | Chanak crisis | turkish-war-of-independence(asia) |
| `Q28980421` | 11 | Israeli annexation of East Jerusalem | Israeli annexation of East Jerusalem | arab-israeli-conflict(asia) |
| `Q3636553` | 11 | Battle of Norfolk | Battle of Norfolk | gulf-war(asia) |
| `Q122998566` | 11 | Al-Shati refugee camp airstrike | Al-Shati refugee camp airstrikes | gaza-war(asia) |
| `Q371476` | 11 | Operation Scorch Sword | Operation Scorch Sword | iran-iraq-war(asia) |
| `Q1149113` | 11 | Operation Kaman 99 | Operation Kaman 99 | iran-iraq-war(asia) |
| `Q1382298` | 11 | Operation Tariq al-Qods | Operation Tariq al-Quds | iran-iraq-war(asia) |
| `Q1584030` | 11 | Operation Dawn | Operation Dawn (1983) | iran-iraq-war(asia) |
| `Q2059536` | 11 | Operation Mersad | Operation Mersad | iran-iraq-war(asia) |
| `Q3267731` | 11 | Operation Beit ol-Moqaddas | Operation Beit ol-Moqaddas | iran-iraq-war(asia) |
| `Q698138` | 11 | Battle of Wanjialing | Battle of Wanjialing | second-sino-japanese-war(asia) |
| `Q700207` | 11 | Suiyuan Campaign | Suiyuan campaign | second-sino-japanese-war(asia) |
| `Q717963` | 11 | Battle of Zaoyang–Yichang | Battle of Zaoyang–Yichang | second-sino-japanese-war(asia) |
| `Q3140595` | 11 | protests against the Iraq War | Protests against the Iraq War | iraq-war(asia) |
| `Q538398` | 11 | Battle off the coast of Abkhazia | Battle off the coast of Abkhazia | russo-georgian-war(asia) |
| `Q1150465` | 11 | Operation Barras | Operation Barras | sierra-leone-civil-war(africa) |
| `Q139556342` | 11 | 2026 Mali offensives | 2026 Mali offensives | mali-war(africa) |
| `Q838065` | 10 | Wuhan incident | Wuhan incident | cultural-revolution(asia) |
| `Q3297468` | 10 | Shadian incident | Shadian incident | cultural-revolution(asia) |
| `Q1634629` | 10 | Battle of Medina Ridge | Battle of Medina Ridge | gulf-war(asia) |
| `Q4870849` | 10 | Battle of Dasman Palace | Battle of Dasman Palace | gulf-war(asia) |
| `Q2890719` | 10 | Battle of Yijiangshan Islands | Battle of Yijiangshan Islands | chinese-civil-war(asia) |
| `Q6484605` | 10 | Battle of Hainan Island | Battle of Hainan Island | chinese-civil-war(asia) |
| `Q18920712` | 10 | War in Afghanistan (2015–2021) | War in Afghanistan (2015–2021) | afghan-conflict(asia) |
| `Q113732316` | 10 | bombing of the Russian embassy in Kabul | Bombing of the Russian embassy in Kabul | afghan-conflict(asia) |
| `Q16130700` | 10 | 1912 Fes Anti-Jewish riots | 1912 Fez riots | french-conquest-of-morocco(africa) |
| `Q6190058` | 10 | Jewish insurgency in Mandatory Palestine | Jewish insurgency in Mandatory Palestine | decolonisation-of-asia(asia) |
| `Q42955668` | 10 | Levant Crisis | Levant Crisis | decolonisation-of-asia(asia) |
| `Q123422121` | 10 | Al-Shifa Hospital Siege | Al-Shifa Hospital siege | gaza-war(asia) |
| `Q130331542` | 10 | 20 September 2024 Beirut attack | 20 September 2024 Beirut attack | gaza-war(asia) |
| `Q133818618` | 10 | March 2025 Rafah humanitarian convoy attacks | Rafah paramedic massacre | gaza-war(asia) |
| `Q134352816` | 10 | May 2025 Gaza offensive | May 2025 Gaza offensive | gaza-war(asia) |
| `Q135975317` | 10 | 2025 Nasser Hospital strike | 2025 Nasser Hospital strikes | gaza-war(asia) |
| `Q3119043` | 10 | Six-Day War | Six-Day War (2000) | second-congo-war(africa) |
| `Q1118003` | 10 | Operation Prime Chance | Operation Prime Chance | iran-iraq-war(asia) |
| `Q1538974` | 10 | Operation Dawn-4 | Operation Dawn-4 | iran-iraq-war(asia) |
| `Q6135253` | 10 | Operation Dawn 6 | Operation Dawn 6 | iran-iraq-war(asia) |
| `Q2887840` | 10 | Battle of Amba Aradam | Battle of Amba Aradam | second-italo-ethiopian-war(africa) |
| `Q709364` | 10 | Battle of South Henan | Battle of South Henan | second-sino-japanese-war(asia) |
| `Q4087318` | 10 | Battle of Samarra | Battle of Samarra (2004) | iraq-war(asia) |
| `Q96201014` | 9 | Guangdong Cultural Revolution Massacre | Guangdong Cultural Revolution Massacre | cultural-revolution(asia) |
| `Q2661450` | 9 | Gdeim Izik protest camp | Gdeim Izik protest camp | arab-spring(africa) |
| `Q898487` | 9 | Operation Desert Shield | Operation Desert Shield | gulf-war(asia) |
| `Q4872216` | 9 | Battle of Rumaila | Battle of Rumaila | gulf-war(asia) |
| `Q4087324` | 9 | Battle of Tientsin | Battle of Tientsin | boxer-rebellion(asia) |
| `Q837376` | 9 | Siege of Changchun | Siege of Changchun | chinese-civil-war(asia) |
| `Q15896860` | 9 | Yangtze River Crossing Campaign | Yangtze River Crossing campaign | chinese-civil-war(asia) |
| `Q123058059` | 9 | Battle of Sufa | Battle of Sufa | gaza-war(asia) |
| `Q123264996` | 9 | 31 October 2023 Jabalia refugee camp airstrike | 31 October 2023 Jabalia refugee camp airstrike | gaza-war(asia) |
| `Q123431983` | 9 | killing of journalists in the Gaza war | Killing of journalists in the Gaza war | gaza-war(asia) |
| `Q127420299` | 9 | July 2024 al-Mawasi attack | 13 July 2024 al-Mawasi attack | gaza-war(asia) |
| `Q4872081` | 9 | Battle of Pork Chop Hill | Battle of Pork Chop Hill | korean-war(asia) |
| `Q1859354` | 9 | Operation Dawn 5 | Operation Dawn 5 | iran-iraq-war(asia) |
| `Q2835454` | 9 | Operation Samen-ol-A'emeh | Operation Samen-ol-A'emeh | iran-iraq-war(asia) |
| `Q3267800` | 9 | Operation Karbala-4 | Operation Karbala-4 | iran-iraq-war(asia) |
| `Q4202311` | 9 | Iraqi attack on USS Stark | USS Stark incident | iran-iraq-war(asia) |
| `Q700250` | 9 | Battle of Kunlun Pass | Battle of Kunlun Pass | second-sino-japanese-war(asia) |
| `Q709346` | 9 | Battle of South Shanxi | Battle of South Shanxi | second-sino-japanese-war(asia) |
| `Q712645` | 9 | Defense of Harbin | Defense of Harbin | second-sino-japanese-war(asia) |
| `Q2890074` | 9 | Battle of Suixian–Zaoyang | Battle of Suixian–Zaoyang | second-sino-japanese-war(asia) |
| `Q5033913` | 9 | Canton Operation | Canton Operation | second-sino-japanese-war(asia) |
| `Q6148020` | 9 | Operation Chahar | Operation Chahar | second-sino-japanese-war(asia) |
| `Q632741` | 9 | Operation Rah-e-Nijat | Operation Rah-e-Nijat | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q2497334` | 9 | Battle of Wana | Battle of Wana | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q17195717` | 9 | Operation Zarb-e-Azb | Operation Zarb-e-Azb | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q107177113` | 9 | Somaliland War of Independence | Somaliland War of Independence | somali-civil-war(africa) |
| `Q972831` | 9 | Battle of Tal Afar | Battle of Tal Afar (2005) | iraq-war(asia) |
| `Q2889747` | 9 | Battle of Ramadi | Battle of Ramadi (2006) | iraq-war(asia) |
| `Q114688543` | 9 | Evin Prison fire | Evin Prison fire | mahsa-amini-protests(asia) |
| `Q6541036` | 8 | Liberation of Kuwait Campaign | Liberation of Kuwait campaign | gulf-war(asia) |
| `Q7460102` | 8 | Shabin-Karahisar Uprising | Shabin-Karahisar uprising | armenian-genocide(asia) |
| `Q2890708` | 8 | Battle of Dagu Forts | Battle of the Taku Forts (1900) | boxer-rebellion(asia) |
| `Q4087414` | 8 | Battle of Beicang | Battle of Beicang | boxer-rebellion(asia) |
| `Q7459167` | 8 | Seymour Expedition | Seymour Expedition | boxer-rebellion(asia) |
| `Q137649289` | 8 | Fourth Taiwan Strait Crisis | Fourth Taiwan Strait Crisis | chinese-civil-war(asia) |
| `Q1091576` | 8 | Battle of Zinjibar | Battle of Zinjibar (2011–2012) | 2011-yemeni-revolution(asia) |
| `Q4818171` | 8 | Persian Constitutional Revolution | Persian Constitutional Revolution | constitutionalization-attempts-in-iran(asia) |
| `Q123046601` | 8 | attacks on Palestinians evacuating Gaza City | Attacks on Palestinians evacuating Gaza City | gaza-war(asia) |
| `Q123334064` | 8 | al-Fakhoora school airstrikes | Al-Fakhoora school airstrikes | gaza-war(asia) |
| `Q123369926` | 8 | Battle of Beit Hanoun | Battle of Beit Hanoun | gaza-war(asia) |
| `Q123550499` | 8 | attacks on health facilities during the Gaza war | Attacks on health facilities during the Gaza war | gaza-war(asia) |
| `Q126389700` | 8 | Al-Sardi school attack | Al-Sardi school attack | gaza-war(asia) |
| `Q127302766` | 8 | Al-Awda School massacre | Al-Awda school attack | gaza-war(asia) |
| `Q131470509` | 8 | December 2024 Israeli airstrikes in Yemen | December 2024 Israeli airstrikes in Yemen | gaza-war(asia) |
| `Q135918673` | 8 | 2025 Gaza City offensive | 2025 Gaza City offensive | gaza-war(asia) |
| `Q492671` | 8 | Battle of Triangle Hill | Battle of Triangle Hill | korean-war(asia) |
| `Q4870302` | 8 | Battle of Andong | Battle of Andong | korean-war(asia) |
| `Q4871945` | 8 | Battle of Onjong | Battle of Onjong | korean-war(asia) |
| `Q7521988` | 8 | Sinchon Massacre | Sinchon Massacre | korean-war(asia) |
| `Q1310631` | 8 | Operation Dawn 3 | Operation Dawn 3 | iran-iraq-war(asia) |
| `Q1584037` | 8 | Operation Dawn 2 | Operation Dawn 2 | iran-iraq-war(asia) |
| `Q1710143` | 8 | Operation Soltan 10 | Operation Sultan 10 | iran-iraq-war(asia) |
| `Q4384303` | 8 | Operation Kheibar | Operation Kheibar | iran-iraq-war(asia) |
| `Q4384813` | 8 | Operation Before the Dawn | Operation Before the Dawn | iran-iraq-war(asia) |
| `Q6135267` | 8 | Operation Dawn 8 | Operation Dawn 8 | iran-iraq-war(asia) |
| `Q6445746` | 8 | 1983–1986 Kurdish rebellions in Iraq | 1983–1986 Kurdish rebellions in Iraq | iran-iraq-war(asia) |
| `Q7689201` | 8 | Tawakalna ala Allah Operations | Tawakalna ala Allah Operations | iran-iraq-war(asia) |
| `Q1368278` | 8 | Battle of Maychew | Battle of Maychew | second-italo-ethiopian-war(africa) |
| `Q2713036` | 8 | First Battle of Tembien | First battle of Tembien | second-italo-ethiopian-war(africa) |
| `Q25540102` | 8 | 1978 Qom protest | 1978 Qom protest | iranian-revolution(asia) |
| `Q4127810` | 8 | Second Guangxi campaign | Second Guangxi campaign | second-sino-japanese-war(asia) |
| `Q4871917` | 8 | Battle of Northern Burma and Western Yunnan | Battle of Northern Burma and Western Yunnan | second-sino-japanese-war(asia) |
| `Q1478359` | 8 | Battle of Jilib | Battle of Jilib | somali-civil-war(africa) |
| `Q553332` | 8 | 2008 Abu Kamal raid | 2008 Abu Kamal raid | iraq-war(asia) |
| `Q642100` | 8 | Operation Steel Curtain | Operation Steel Curtain | iraq-war(asia) |
| `Q3486016` | 8 | Siege of Sadr City | Siege of Sadr City | iraq-war(asia) |
| `Q1764877` | 8 | Occupation of Poti | Occupation of Poti | russo-georgian-war(asia) |
| `Q16209296` | 8 | Bor massacre | Bor massacre | second-sudanese-civil-war(africa) |
| `Q16956086` | 8 | Bentiu massacre | Bentiu massacre | south-sudanese-civil-war(africa) |
| `Q114356054` | 8 | 2022 Zahedan massacre | 2022 Zahedan massacre | mahsa-amini-protests(asia) |
| `Q2460259` | 8 | 2008 attack on Omdurman and Khartoum | 2008 Omdurman attack | war-in-darfur(africa) |
| `Q3636251` | 7 | Battle of Wadi Al-Batin | Battle of Wadi al-Batin | gulf-war(asia) |
| `Q4870581` | 7 | Battle of Bubiyan | Battle of Bubiyan | gulf-war(asia) |
| `Q4872876` | 7 | Battle of the Bridges | Battle of the Bridges | gulf-war(asia) |
| `Q986637` | 7 | Battle of Nanri Island | Battle of Nanri Island | chinese-civil-war(asia) |
| `Q2935387` | 7 | Dongshan Island Campaign | Dongshan Island Campaign | chinese-civil-war(asia) |
| `Q124809504` | 7 | Second Kuomintang-Communist Civil War | Second Kuomintang-Communist Civil War | chinese-civil-war(asia) |
| `Q4558883` | 7 | 1908 Tehran bombardment | 1908 bombardment of the Majlis | constitutionalization-attempts-in-iran(asia) |
| `Q3429692` | 7 | 55 Day War | 55 Day War | angolan-civil-war(africa) |
| `Q5643106` | 7 | Halloween Massacre | Halloween Massacre (Angola) | angolan-civil-war(africa) |
| `Q123572171` | 7 | 2023 Israeli female tank crew fight | 2023 Israeli female tank crew fight | gaza-war(asia) |
| `Q126453114` | 7 | Nuseirat refugee camp massacre | Nuseirat refugee camp massacre | gaza-war(asia) |
| `Q128135642` | 7 | 2024 Haret Hreik airstrike | Killing of Fuad Shukr | gaza-war(asia) |
| `Q130418685` | 7 | Tulkarm camp airstrike | 2024 Tulkarm Camp airstrike | gaza-war(asia) |
| `Q134304227` | 7 | 2025 Gaza Freedom Flotilla incident | May 2025 drone attack on Gaza Freedom Flotilla | gaza-war(asia) |
| `Q134459908` | 7 | 2025 Gaza European Hospital strike | 2025 Gaza European Hospital strikes | gaza-war(asia) |
| `Q135954095` | 7 | September 2025 Israeli attacks in Yemen | September 2025 Israeli attacks in Yemen | gaza-war(asia) |
| `Q486367` | 7 | Battle of Chumonchin Chan | Battle of Chumonchin Chan | korean-war(asia) |
| `Q493131` | 7 | Battle of Pyongtaek | Battle of Pyongtaek | korean-war(asia) |
| `Q493295` | 7 | Battle of Kumsong | Battle of Kumsong | korean-war(asia) |
| `Q2888742` | 7 | Battle of Kyongju | Battle of Kyongju | korean-war(asia) |
| `Q4438418` | 7 | Battle of P'ohang-dong | Battle of P'ohang-dong | korean-war(asia) |
| `Q4870744` | 7 | Battle of Chuncheon | Battle of Chuncheon | korean-war(asia) |
| `Q1788937` | 7 | Battle of the Marshes | Battle of the Marshes | iran-iraq-war(asia) |
| `Q5692335` | 7 | Operation Nasr 4 | Operation Nasr 4 | iran-iraq-war(asia) |
| `Q6133239` | 7 | Operation Zafar 7 | Operation Zafar 7 | iran-iraq-war(asia) |
| `Q7097059` | 7 | Operation Forty Stars | Operation Forty Stars | iran-iraq-war(asia) |
| `Q2005204` | 7 | Second Battle of Tembien | Second battle of Tembien | second-italo-ethiopian-war(africa) |
| `Q7293530` | 7 | Ruhollah Khomeini's return to Iran | Ruhollah Khomeini's return to Iran | iranian-revolution(asia) |
| `Q10396694` | 7 | Battle of Yunnan-Burma Road | Battle of the Yunnan–Burma Road | second-sino-japanese-war(asia) |
| `Q1945485` | 7 | Battle of Bajaur | Battle of Bajaur | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q3477170` | 7 | Second Battle of Swat | Second Battle of Swat | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q4871455` | 7 | Battle of Kismayo | Battle of Kismayo (2012) | somali-civil-war(africa) |
| `Q3349532` | 7 | 2006 Ramadan Offensive | Ramadan Offensive (2006) | iraq-war(asia) |
| `Q4871794` | 7 | Battle of Mosul | Battle of Mosul (2004) | iraq-war(asia) |
| `Q4872157` | 7 | Battle of Ramadi | Battle of Ramadi (2004) | iraq-war(asia) |
| `Q7096988` | 7 | Operation Dingo | Operation Dingo | rhodesian-bush-war(africa) |
| `Q102301838` | 7 | Mai Kadra massacre | Mai Kadra massacre | tigray-war(africa) |
| `Q15070113` | 6 | 2013 Libyan coup d'état attempt | 2013 Libyan coup attempt | arab-spring(africa) |
| `Q3636316` | 6 | Battle of Al Busayyah | Battle of Al Busayyah | gulf-war(asia) |
| `Q4870995` | 6 | Battle of Failaka | Battle of Failaka | gulf-war(asia) |
| `Q8256467` | 6 | Gulf War air campaign | Gulf War air campaign | gulf-war(asia) |
| `Q19428991` | 6 | Battle of Kuwait International Airport | Battle of Kuwait International Airport | gulf-war(asia) |
| `Q8068632` | 6 | Zeitun Resistance | Zeitun Resistance (1914 and 1915) | armenian-genocide(asia) |
| `Q104863365` | 6 | Defense of Azakh | Defense of Azakh | armenian-genocide(asia),sayfo(asia) |
| `Q4087483` | 6 | Battle of Yangcun | Battle of Yangcun | boxer-rebellion(asia) |
| `Q3950658` | 6 | Battle of Siping | Battle of Siping | chinese-civil-war(asia) |
| `Q4116455` | 6 | Battle of Ta'izz | Battle of Taiz | 2011-yemeni-revolution(asia) |
| `Q4842737` | 6 | Bahrain Bloody Thursday | Bloody Thursday (Bahrain) | 2011-bahraini-uprising(asia) |
| `Q2039487` | 6 | Battle of Afabet | Battle of Afabet | eritrean-war-of-independence(africa) |
| `Q47004508` | 6 | Chindawol uprising | Chindawol uprising | afghan-conflict(asia) |
| `Q4872375` | 6 | Battle of Sidi Bou Othman | Battle of Sidi Bou Othman | french-conquest-of-morocco(africa) |
| `Q7097499` | 6 | Operation Savannah | Operation Savannah (Angola) | angolan-civil-war(africa) |
| `Q123000568` | 6 | Hajji Tower airstrike | Hajji Tower airstrike | gaza-war(asia) |
| `Q123555176` | 6 | attacks on refugee camps in the Gaza war | Attacks on refugee camps in the Gaza war | gaza-war(asia) |
| `Q123555181` | 6 | Israeli airstrikes on schools during the 2023 Israel–Hamas war | Attacks on schools during the Gaza war | gaza-war(asia) |
| `Q126180008` | 6 | May 2024 Al-Mawasi refugee camp attack | May 2024 Al-Mawasi refugee camp attack | gaza-war(asia) |
| `Q127220552` | 6 | June 2024 Al-Mawasi refugee camp attack | June 2024 Al-Mawasi refugee camp attack | gaza-war(asia) |
| `Q128799073` | 6 | Al-Tabaeen school attack | Al-Tabaeen school attack | gaza-war(asia) |
| `Q128810352` | 6 | Hamama School bombing | Hamama School bombing | gaza-war(asia) |
| `Q129559774` | 6 | Khadija School airstrike | Khadija School airstrike | gaza-war(asia) |
| `Q130301591` | 6 | September 2024 Al-Jawni School attack | 2024 Al-Jawni School attack | gaza-war(asia) |
| `Q134437528` | 6 | 2025 Saada prison airstrike | 2025 Saada prison airstrike | gaza-war(asia) |
| `Q483464` | 6 | Battle of Chipyong-ni | Battle of Chipyong-ni | korean-war(asia) |
| `Q493252` | 6 | Battle of Chonan | Battle of Chonan | korean-war(asia) |
| `Q626542` | 6 | Battle of White Horse | Battle of White Horse Hill | korean-war(asia) |
| `Q764177` | 6 | Battle of Wawon | Battle of Wawon | korean-war(asia) |
| `Q2889283` | 6 | First Battle of Maryang-san | First Battle of Maryang-san | korean-war(asia) |
| `Q4871130` | 6 | Battle of Gorangpo | Battle of Gorangpo | korean-war(asia) |
| `Q4871363` | 6 | Battle of Kaesong–Munsan | Battle of Kaesong–Munsan | korean-war(asia) |
| `Q4871689` | 6 | Battle of Masan | Battle of Masan | korean-war(asia) |
| `Q6808488` | 6 | Battle of Pyongyang (1950) | Battle of Pyongyang (1950) | korean-war(asia) |
| `Q7451679` | 6 | Seoul National University Hospital Massacre | Seoul National University Hospital massacre | korean-war(asia) |
| `Q63929552` | 6 | Operation Kitona | Operation Kitona | second-congo-war(africa) |
| `Q4384294` | 6 | Operation Karbala-6 | Operation Karbala-6 | iran-iraq-war(asia) |
| `Q4871708` | 6 | Battle of Mehran | Battle of Mehran (1986) | iran-iraq-war(asia) |
| `Q5876827` | 6 | War of the Cities | War of the cities | iran-iraq-war(asia) |
| `Q2890466` | 6 | Battle of the Ogaden | Battle of the Ogaden | second-italo-ethiopian-war(africa) |
| `Q2890824` | 6 | Battle of Shire | Battle of Shire (1936) | second-italo-ethiopian-war(africa) |
| `Q4871088` | 6 | Battle of Genale Doria | Battle of Ganale Doria | second-italo-ethiopian-war(africa) |
| `Q4748012` | 6 | Amoy Operation | Amoy Operation | second-sino-japanese-war(asia) |
| `Q5639369` | 6 | Hainan Island Operation | Hainan Island Operation | second-sino-japanese-war(asia) |
| `Q2082118` | 6 | Orakzai and Kurram offensive | Orakzai and Kurram offensive | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q3041128` | 6 | First Battle of Swat | First Battle of Swat | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q608609` | 6 | Ukrainian involvement in the Iraq War | Ukrainian involvement in the Iraq War | iraq-war(asia) |
| `Q3883935` | 6 | Operation Ancient Babylon | Operation Ancient Babylon | iraq-war(asia) |
| `Q4614896` | 6 | 2009 Taza bombing | 2009 Taza bombing | iraq-war(asia) |
| `Q4871173` | 6 | Battle of Haditha | Battle of Haditha | iraq-war(asia) |
| `Q7096767` | 6 | Operation Assured Delivery | Operation Assured Delivery | russo-georgian-war(asia) |
| `Q11370625` | 6 | Kanchazu Island incident | Kanchazu Island incident | soviet-japanese-border-conflicts(asia) |
| `Q5778556` | 6 | Battle of Abarrán | Battle of Abarrán | rif-war(africa) |
| `Q107331319` | 6 | Siege of Ighriben | Siege of Igueriben | rif-war(africa) |
| `Q63099653` | 6 | 1985 Sudanese coup d'état | 1985 Sudanese coup d'état | second-sudanese-civil-war(africa) |
| `Q25753955` | 6 | Battle of Juba | Battle of Juba (2016) | south-sudanese-civil-war(africa) |
| `Q110475879` | 6 | Dedebit Elementary School airstrike | Dedebit Elementary School airstrike | tigray-war(africa) |
| `Q114287651` | 6 | Operation Rabi' I | September–October 2022 attacks on Iraqi Kurdistan | mahsa-amini-protests(asia) |
| `Q4872769` | 6 | Battle of Yangxia | Battle of Yangxia | xinhai-revolution(asia) |
| `Q62070386` | 5 | 2019 Tel Aviv rocket strike | 2019 Tel Aviv rocket strike | arab-israeli-conflict(asia) |
| `Q4622886` | 5 | 2011 Western Saharan protests | 2011 Western Saharan protests | arab-spring(africa) |
| `Q3636571` | 5 | Battle of Phase Line Bullet | Battle of Phase Line Bullet | gulf-war(asia) |
| `Q710193` | 5 | Battle of Dachen Archipelago | Battle of Dachen Archipelago | chinese-civil-war(asia) |
| `Q2888438` | 5 | Battle of Dong-Yin | Battle of Dong-Yin | chinese-civil-war(asia) |
| `Q5027771` | 5 | campaign at the China–Burma border | 1960–1961 campaign at the China–Burma border | chinese-civil-war(asia) |
| `Q5027847` | 5 | Campaign to Defend Siping | Second Battle of Siping | chinese-civil-war(asia) |
| `Q16203620` | 5 | Operation Beleaguer | Operation Beleaguer | chinese-civil-war(asia) |
| `Q19910623` | 5 | Siege of Khiva | Siege of Khiva (1924) | basmachi-movement(asia) |
| `Q4871079` | 5 | Battle of Garibpur | Battle of Garibpur | bangladesh-liberation-war(asia) |
| `Q4128027` | 5 | Battle of Massawa | Second Battle of Massawa | eritrean-war-of-independence(africa) |
| `Q4337360` | 5 | Siege of Barentu | Siege of Barentu | eritrean-war-of-independence(africa) |
| `Q4349238` | 5 | Battle of Massawa | First Battle of Massawa | eritrean-war-of-independence(africa) |
| `Q65056773` | 5 | Massacres of Hutus during the First Congo War | Massacres of Hutus in the First Congo War | first-congo-war(africa) |
| `Q4924112` | 5 | Paknam Incident | Paknam incident | 1893-franco-siamese-crisis(asia) |
| `Q4397975` | 5 | Russian involvement in the Persian Constitutional Revolution | Russian involvement in the Persian Constitutional Revolution | constitutionalization-attempts-in-iran(asia) |
| `Q30744449` | 5 | Bombing of Casablanca | Bombardment of Casablanca | french-conquest-of-morocco(africa) |
| `Q116958167` | 5 | Hlaingthaya massacre | Hlaingthaya massacre | 2021-myanmar-coup-d-etat(asia) |
| `Q124119981` | 5 | Battle of Jabalia | Battle of Jabalia | gaza-war(asia) |
| `Q126888897` | 5 | June 2024 northern Gaza City airstrikes | June 2024 northern Gaza City airstrikes | gaza-war(asia) |
| `Q127597969` | 5 | July 2024 al-Shati refugee camp attack | July 2024 al-Shati refugee camp attack | gaza-war(asia) |
| `Q130546979` | 5 | October 2024 Deir al-Balah mosque bombing | 2024 Deir al-Balah mosque bombing | gaza-war(asia) |
| `Q133894632` | 5 | 2025 Ras Isa oil terminal airstrikes | 2025 Ras Isa oil terminal airstrikes | gaza-war(asia) |
| `Q134596372` | 5 | Fahmi al-Jarjawi School Massacre | Fahmi al-Jarjawi School attack | gaza-war(asia) |
| `Q624064` | 5 | Battle of Uijeongbu | Battle of Uijeongbu (1950) | korean-war(asia) |
| `Q2888378` | 5 | Battle of Taegu | Battle of Taegu | korean-war(asia) |
| `Q2890905` | 5 | Battle of the Samichon River | Battle of the Samichon River | korean-war(asia) |
| `Q2890955` | 5 | Battle of the Hook | Third Battle of the Hook | korean-war(asia) |
| `Q4871183` | 5 | Battle of Haman | Battle of Haman | korean-war(asia) |
| `Q4871225` | 5 | Battle of Hill 282 | Battle of Hill 282 | korean-war(asia) |
| `Q4871355` | 5 | Battle of Ka-san | Battle of Ka-san | korean-war(asia) |
| `Q4871937` | 5 | Battle of Old Baldy | Battle of Old Baldy | korean-war(asia) |
| `Q4872485` | 5 | Battle of Tabu-dong | Battle of Tabu-dong | korean-war(asia) |
| `Q4872788` | 5 | Battle of Yongju | Battle of Yongyu | korean-war(asia) |
| `Q4872790` | 5 | Battle of Yongsan | Battle of Yongsan | korean-war(asia) |
| `Q5454119` | 5 | First and Second Battles of Wonju | First and second battles of Wonju | korean-war(asia) |
| `Q108502717` | 5 | Kisangani massacre | Kisangani massacre | second-congo-war(africa) |
| `Q6135475` | 5 | Operation Karbala 10 | Operation Karbala 10 | iran-iraq-war(asia) |
| `Q18068170` | 5 | Operation Dezful | Operation Dezful | iran-iraq-war(asia) |
| `Q25424636` | 5 | 1978 Tabriz protests | 1978 Tabriz protests | iranian-revolution(asia) |
| `Q705279` | 5 | Battle of Wuyuan | Battle of Wuyuan | second-sino-japanese-war(asia) |
| `Q710295` | 5 | Battle of West Henan–North Hubei | Battle of West Henan–North Hubei | second-sino-japanese-war(asia) |
| `Q4467966` | 5 | Tianjin–Pukou Railway Operation | Tianjin–Pukou Railway Operation | second-sino-japanese-war(asia) |
| `Q7507448` | 5 | proposed Japanese invasion of Sichuan | Proposed Japanese invasion of Sichuan | second-sino-japanese-war(asia) |
| `Q4090316` | 5 | Battle of Mirali | Battle of Mirali | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q7096821` | 5 | Operation Black Thunderstorm | Operation Black Thunderstorm | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q1450547` | 5 | Mandingo Wars | Mandingo Wars | scramble-for-africa(africa) |
| `Q2887801` | 5 | Adibo dali | Battle of Adibo | scramble-for-africa(africa) |
| `Q1140554` | 5 | Battle of Mogadishu | Battle of Mogadishu (2010–2011) | somali-civil-war(africa) |
| `Q4870242` | 5 | Battle of Alapan | Battle of Alapan | philippine-revolution(asia) |
| `Q14542358` | 5 | Battle of Binakayan–Dalahican | Battle of Binakayan–Dalahican | philippine-revolution(asia) |
| `Q4187825` | 5 | 2004 Fallujah ambush | 2004 Fallujah ambush | iraq-war(asia) |
| `Q4871848` | 5 | Battle of Najaf | Battle of Najaf (2007) | iraq-war(asia) |
| `Q6067814` | 5 | Iraq War troop surge of 2007 | Iraq War troop surge | iraq-war(asia) |
| `Q7097646` | 5 | Operation Together Forward | Operation Together Forward | iraq-war(asia) |
| `Q890631` | 5 | Battle of Khalkhyn Temple | Battle of Khalkhyn Temple | soviet-japanese-border-conflicts(asia) |
| `Q20102483` | 5 | Kert campaign | Kert campaign | rif-war(africa) |
| `Q104852916` | 5 | Massacre of Monte Arruit | Massacre of Monte Arruit | rif-war(africa) |
| `Q4629452` | 5 | 2013 India–Pakistan border incidents | 2013 India–Pakistan border skirmishes | kashmir-conflict(asia) |
| `Q5420456` | 5 | Battle of Khalil | Battle of In Khalil | mali-war(africa) |
| `Q109924274` | 5 | 2021 Mali bus massacre | Mopti bus massacre | mali-war(africa) |
| `Q138011825` | 5 | Jonglei clashes (2025–present) | Jonglei clashes (2025–present) | south-sudanese-civil-war(africa) |
| `Q124254474` | 5 | Battle of Laukkai | Battle of Laukkai | myanmar-civil-war(asia) |
| `Q1113762` | 4 | Operation Friction | Operation Friction | gulf-war(asia) |
| `Q4698322` | 4 | Air engagements of the Gulf War | Air engagements of the Gulf War | gulf-war(asia) |
| `Q4870165` | 4 | Battle for Jalibah Airfield | Battle for Jalibah Airfield | gulf-war(asia) |
| `Q4870215` | 4 | Battle of Ad-Dawrah | Battle of Ad-Dawrah | gulf-war(asia) |
| `Q5939948` | 4 | Operation Alfil | Operativo Alfil | gulf-war(asia) |
| `Q7398852` | 4 | Safwan Airfield Standoff | Safwan Airfield standoff | gulf-war(asia) |
| `Q5526415` | 4 | Gaselee Expedition | Gaselee Expedition | boxer-rebellion(asia) |
| `Q1006470` | 4 | Battle of Jinzhou | Battle of Jinzhou | chinese-civil-war(asia) |
| `Q4827177` | 4 | Autumn Offensive of 1947 in Northeast China | Autumn Offensive of 1947 in Northeast China | chinese-civil-war(asia) |
| `Q4870864` | 4 | Battle of Dengbu Island | Battle of Dengbu Island | chinese-civil-war(asia) |
| `Q4872785` | 4 | Battle of Yiwu | Battle of Yiwu | chinese-civil-war(asia) |
| `Q5227714` | 4 | Datong–Jining Campaign | Datong–Jining Campaign | chinese-civil-war(asia) |
| `Q5447513` | 4 | Fifth Encirclement Campaign against Jiangxi Soviet | Fifth encirclement campaign against the Jiangxi Soviet | chinese-civil-war(asia) |
| `Q5960763` | 4 | Shangdang Campaign | Shangdang Campaign | chinese-civil-war(asia) |
| `Q6487716` | 4 | Lanzhou Campaign | Lanzhou Campaign | chinese-civil-war(asia) |
| `Q6942994` | 4 | Muslim conflict in Gansu | Muslim conflict in Gansu (1927–1930) | chinese-civil-war(asia) |
| `Q7504451` | 4 | Shuangduiji Campaign | Shuangduiji campaign | chinese-civil-war(asia) |
| `Q8565149` | 4 | Fourth Encirclement Campaign against Jiangxi Soviet | Fourth encirclement campaign against the Jiangxi Soviet | chinese-civil-war(asia) |
| `Q2889923` | 4 | Battle of Sana'a | Battle of Sanaa (2011) | 2011-yemeni-revolution(asia) |
| `Q23550326` | 4 | Saudi-led intervention in Bahrain | Saudi-led intervention in Bahrain | 2011-bahraini-uprising(asia) |
| `Q85765974` | 4 | Hawzen massacre | Hawzen massacre (1988) | ethiopian-civil-war(africa) |
| `Q6164557` | 4 | Jathibhanga massacre | Jathibhanga massacre | bangladesh-liberation-war(asia) |
| `Q4872624` | 4 | Battle of Ugeumchi | Battle of Ugeumchi | donghak-peasant-revolution(asia) |
| `Q16417840` | 4 | Tabriz Rebellion | Siege of Tabriz (1908–1909) | constitutionalization-attempts-in-iran(asia) |
| `Q111519094` | 4 | 2022 Kabul mosque attack | April 2022 Kabul mosque bombing | afghan-conflict(asia) |
| `Q123079232` | 4 | AL-Najjar family massacre | Killing of al-Najjar children | gaza-war(asia) |
| `Q123472618` | 4 | Al-Falah School airstrike | Al-Falah School airstrike | gaza-war(asia) |
| `Q123514490` | 4 | Israeli incursions in Tulkarm | Israeli incursions in Tulkarm | gaza-war(asia) |
| `Q124066180` | 4 | Kamal Adwan Hospital Siege | Kamal Adwan Hospital sieges | gaza-war(asia) |
| `Q124537822` | 4 | Rafah Massacre (12 February 2024) | 12 February 2024 Rafah strikes | gaza-war(asia) |
| `Q124795461` | 4 | Killing of Sidra Hassouna | Killing of Sidra Hassouna | gaza-war(asia) |
| `Q124855041` | 4 | Kuwait Roundabout mass killings | Kuwait Roundabout mass killings | gaza-war(asia) |
| `Q125462242` | 4 | Engineer's Building strike and massacre | Engineer's Building airstrike | gaza-war(asia) |
| `Q127425144` | 4 | 2024 targeted assassination of Mohammad Deif | 2024 targeted assassination of Muhammad Deif | gaza-war(asia) |
| `Q130213884` | 4 | August 2024 Deir el-Balah attacks | August 2024 Deir al-Balah attacks | gaza-war(asia) |
| `Q130279075` | 4 | September 2024 Al-Mawasi refugee camp attack | September 2024 Al-Mawasi refugee camp attack | gaza-war(asia) |
| `Q130469015` | 4 | Battle of Odaisseh | Battle of Odaisseh | gaza-war(asia) |
| `Q130483756` | 4 | 2024 Maroun al-Ras clashes | 2024 Maroun al-Ras clashes | gaza-war(asia) |
| `Q130493373` | 4 | Siege of North Gaza | Siege of North Gaza | gaza-war(asia) |
| `Q130537194` | 4 | Al-Aqsa Hospital massacre | 14 October 2024 Al-Aqsa Hospital attack | gaza-war(asia) |
| `Q130552096` | 4 | October 2024 Rufaida school attack | 2024 Rufaida school attack | gaza-war(asia) |
| `Q130590096` | 4 | October 2024 Abu Hussein school attack | 2024 Abu Hussein school attack | gaza-war(asia) |
| `Q130724831` | 4 | 29 October 2024 Beit Lahia airstrike | 29 October 2024 Beit Lahia airstrike | gaza-war(asia) |
| `Q131388283` | 4 | 4 December 2024 al-Mawasi attack | 4 December 2024 al-Mawasi attack | gaza-war(asia) |
| `Q131437176` | 4 | December 2024 Nuseirat refugee camp attack | December 2024 Nuseirat refugee camp attack | gaza-war(asia) |
| `Q134390503` | 4 | ? | 2025 Wehda Street airstrikes | gaza-war(asia) |
| `Q134837380` | 4 | Soumoud Convoy | Soumoud Convoy | gaza-war(asia) |
| `Q26757` | 4 | Battle of Ongjin | Battle of Ongjin Peninsula | korean-war(asia) |
| `Q493122` | 4 | Battle of Sangju | Battle of Sangju (1950) | korean-war(asia) |
| `Q2887781` | 4 | Battle of Sunchon | Battle of Sunchon (air) | korean-war(asia) |
| `Q4741033` | 4 | Battle of Sariwon | Battle of Sariwon | korean-war(asia) |
| `Q4870734` | 4 | Battle of Chochiwon | Battle of Chochiwon | korean-war(asia) |
| `Q4871179` | 4 | Battle of Haeju | Battle of Haeju | korean-war(asia) |
| `Q4872786` | 4 | Battle of Yongdong | Battle of Yongdong | korean-war(asia) |
| `Q4872797` | 4 | Battle of Yultong | Battle of Yultong | korean-war(asia) |
| `Q4873032` | 4 | Battle of the Twin Tunnels | Battle of the Twin Tunnels | korean-war(asia) |
| `Q5638024` | 4 | Hadong Ambush | Hadong Ambush | korean-war(asia) |
| `Q7112847` | 4 | Outpost Harry | Outpost Harry | korean-war(asia) |
| `Q15193698` | 4 | Attack on the Sui-ho Dam | Attack on the Sui-ho Dam | korean-war(asia) |
| `Q16169881` | 4 | Battle of Jangsari | Battle of Jangsari | korean-war(asia) |
| `Q5692409` | 4 | Operation Beit ol-Moqaddas 2 | Operation Beit ol-Moqaddas 2 | iran-iraq-war(asia) |
| `Q5701150` | 4 | Operation Karbala-7 | Operation Karbala-7 | iran-iraq-war(asia) |
| `Q5902652` | 4 | Operation Karbala-2 | Operation Karbala-2 | iran-iraq-war(asia) |
| `Q3881008` | 4 | De Bono's invasion of Abyssinia | De Bono's invasion of Ethiopia | second-italo-ethiopian-war(africa) |
| `Q4283206` | 4 | March of the Iron Will | March of the Iron Will | second-italo-ethiopian-war(africa) |
| `Q5403538` | 4 | Ethiopian Christmas Offensive | Christmas Offensive | second-italo-ethiopian-war(africa) |
| `Q16551154` | 4 | Gondrand massacre | Gondrand massacre | second-italo-ethiopian-war(africa) |
| `Q5613615` | 4 | Guanganmen Incident | Guanganmen incident | second-sino-japanese-war(asia) |
| `Q7675984` | 4 | Taihoku Air Strike | Taihoku Airstrike | second-sino-japanese-war(asia) |
| `Q18657971` | 4 | Battle of West Suiyuan | Battle of West Suiyuan | second-sino-japanese-war(asia) |
| `Q19619385` | 4 | 2015 Shikarpur bombing | Shikarpur bombing | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q55497361` | 4 | 2018 Peshawar suicide bombing | 2018 Peshawar suicide bombing | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q112728845` | 4 | Battle of Rezang La | Battle of Rezang La | sino-indian-war(asia) |
| `Q2913894` | 4 | Battle of Gedo | Battle of Gedo | somali-civil-war(africa) |
| `Q4871756` | 4 | Battle of Mogadishu | Battle of Mogadishu (2009) | somali-civil-war(africa) |
| `Q4872703` | 4 | Battle of Wabho | Battle of Wabho | somali-civil-war(africa) |
| `Q5518517` | 4 | Galgala campaign | Galgala campaign | somali-civil-war(africa) |
| `Q4871337` | 4 | Battle of Jijiga | Battle of Jijiga | ogaden-war(africa) |
| `Q108179232` | 4 | Somali invasion of Ogaden | Somali invasion of Ogaden | ogaden-war(africa) |
| `Q4871368` | 4 | Battle of Kakarong de Sili | Battle of Kakarong de Sili | philippine-revolution(asia) |
| `Q4872284` | 4 | Battle of San Juan del Monte | Battle of San Juan del Monte | philippine-revolution(asia) |
| `Q4872591` | 4 | Battle of Tres de Abril | Battle of Tres de Abril | philippine-revolution(asia) |
| `Q5190436` | 4 | Cry of Nueva Ecija | Cry of Nueva Ecija | philippine-revolution(asia) |
| `Q12966900` | 4 | Battle of Imus | Battle of Imus | philippine-revolution(asia) |
| `Q2935362` | 4 | Diyala campaign | Diyala campaign | iraq-war(asia) |
| `Q3354646` | 4 | Operation Augurs of Prosperity | Operation Augurs of Prosperity | iraq-war(asia) |
| `Q4871175` | 4 | Battle of Haifa Street | Battle of Haifa Street | iraq-war(asia) |
| `Q7038210` | 4 | 2008 Nineveh campaign | 2008 Nineveh campaign | iraq-war(asia) |
| `Q7097619` | 4 | Operation Telic | British involvement in the Iraq War | iraq-war(asia) |
| `Q16208641` | 4 | Operation Desert Shield | Operation Desert Shield (2006) | iraq-war(asia) |
| `Q65074171` | 4 | 2003 Mosul raid | Killing of Qusay and Uday Hussein | iraq-war(asia) |
| `Q21483833` | 4 | Chefchaouen retreat | 1924 retreat from Chaoen | rif-war(africa) |
| `Q97188229` | 4 | Defence of Iwardo | Defence of Iwardo | sayfo(asia) |
| `Q4574523` | 4 | 1971 Indian Airlines hijacking | 1971 Indian Airlines hijacking | kashmir-conflict(asia) |
| `Q16208818` | 4 | Battle of Sinoia | Battle of Sinoia | rhodesian-bush-war(africa) |
| `Q17013009` | 4 | Operation Eland | Operation Eland | rhodesian-bush-war(africa) |
| `Q12016335` | 4 | Battle of Djebok | Battle of Djebok | mali-war(africa) |
| `Q12838259` | 4 | Battle of In Arab | Battle of In Arab | mali-war(africa) |
| `Q12957884` | 4 | Battle of Hamakouladji | Battle of Hamakouladji | mali-war(africa) |
| `Q13218257` | 4 | Battle of Ber | Battle of Ber (2013) | mali-war(africa) |
| `Q13218258` | 4 | Battle of Anefif | Battle of Anéfis (May 2013) | mali-war(africa) |
| `Q135423253` | 4 | Battle of Anoumalane | Battle of Anoumalane | mali-war(africa) |
| `Q104803838` | 4 | Axum massacre | Axum massacre | tigray-war(africa) |
| `Q114554823` | 4 | Eritrean involvement in the Tigray War | Eritrean involvement in the Tigray war | tigray-war(africa) |
| `Q119149755` | 4 | Attack on Izeh market | Attack on Izeh market | mahsa-amini-protests(asia) |
| `Q121023675` | 4 | Battle of Foro Baranga | 2023 Foro Baranga clashes | war-in-darfur(africa) |
| `Q6040834` | 4 | Alaşehir Congress | Alaşehir Congress | turkish-war-of-independence(asia) |
| `Q10863956` | 3 | January Storm | January Storm | cultural-revolution(asia) |
| `Q4872147` | 3 | Battle of Qurah and Umm al Maradim | Battle of Qurah and Umm al Maradim | gulf-war(asia) |
| `Q7096973` | 3 | Operation Desert Farewell | Operation Desert Farewell | gulf-war(asia) |
| `Q4087302` | 3 | Battle of Beitang | Battle of Beitang | boxer-rebellion(asia) |
| `Q4188868` | 3 | Battle of Shanhaiguan | Battle of Shanhaiguan (1900) | boxer-rebellion(asia) |
| `Q7676655` | 3 | Taiyuan Massacre | Taiyuan massacre | boxer-rebellion(asia) |
| `Q4467971` | 3 | Tianjin Campaign | Tianjin campaign | chinese-civil-war(asia) |
| `Q4520117` | 3 | Shanghai Campaign | Shanghai Campaign | chinese-civil-war(asia) |
| `Q4871339` | 3 | Battle of Jinan | Battle of Jinan | chinese-civil-war(asia) |
| `Q4871370` | 3 | Battle of Kalgan | Battle of Kalgan | chinese-civil-war(asia) |
| `Q4871855` | 3 | Battle of Nan'ao Island | Battle of Nan'ao Island | chinese-civil-war(asia) |
| `Q4871861` | 3 | Battle of Nanpēng Archipelago | Battle of Nanpeng Archipelago | chinese-civil-war(asia) |
| `Q4872515` | 3 | Battle of Tashan | Battle of Tashan | chinese-civil-war(asia) |
| `Q4872784` | 3 | Battle of Yinji | Battle of Yinji | chinese-civil-war(asia) |
| `Q4872787` | 3 | Battle of Yongjiazhen | Battle of Yongjiazhen | chinese-civil-war(asia) |
| `Q5027861` | 3 | Campaign to Suppress Bandits in Northwestern China | Campaign to Suppress Bandits in Northwestern China | chinese-civil-war(asia) |
| `Q5452957` | 3 | First Encirclement Campaign against Jiangxi Soviet | First encirclement campaign against the Jiangxi Soviet | chinese-civil-war(asia) |
| `Q5745651` | 3 | Heshui Campaign | Heshui Campaign | chinese-civil-war(asia) |
| `Q6122219` | 3 | Taiyuan Campaign | Taiyuan campaign | chinese-civil-war(asia) |
| `Q6554207` | 3 | Linjiang Campaign | Linjiang Campaign | chinese-civil-war(asia) |
| `Q6819363` | 3 | Meridian Ridge Campaign | Meridian Ridge Campaign | chinese-civil-war(asia) |
| `Q7038737` | 3 | Ningxia Campaign | Ningxia Campaign (1949) | chinese-civil-war(asia) |
| `Q7443272` | 3 | Second Encirclement Campaign against Jiangxi Soviet | Second encirclement campaign against the Jiangxi Soviet | chinese-civil-war(asia) |
| `Q7525789` | 3 | Siping Campaign | Siping Campaign | chinese-civil-war(asia) |
| `Q7570059` | 3 | Southern Jiangsu Campaign | Southern Jiangsu Campaign | chinese-civil-war(asia) |
| `Q7637391` | 3 | Summer Offensive of 1947 in Northeast China | Summer Offensive of 1947 in Northeast China | chinese-civil-war(asia) |
| `Q7784838` | 3 | Third Encirclement Campaign against Jiangxi Soviet | Third encirclement campaign against the Jiangxi Soviet | chinese-civil-war(asia) |
| `Q7968089` | 3 | Wanshan Archipelago Campaign | Wanshan Archipelago Campaign | chinese-civil-war(asia) |
| `Q8026287` | 3 | Winter Offensive of 1947 in Northeast China | Winter Offensive of 1947 in Northeast China | chinese-civil-war(asia) |
| `Q8053018` | 3 | Yetaishan Campaign | Yetaishan Campaign | chinese-civil-war(asia) |
| `Q10945232` | 3 | Menglianggu Campaign | Menglianggu campaign | chinese-civil-war(asia) |
| `Q16924910` | 3 | Zhengtai Campaign | Zhengtai Campaign | chinese-civil-war(asia) |
| `Q19853280` | 3 | Campaign to the North of Baoding | Campaign to the North of Baoding | chinese-civil-war(asia) |
| `Q129254747` | 3 | Enver Pasha's Rebellion | Enver Pasha's Rebellion | basmachi-movement(asia) |
| `Q130377092` | 3 | Siege of Dushanbe | Siege of Dushanbe | basmachi-movement(asia) |
| `Q17108094` | 3 | Massacre of the Sixty | Massacre of the Sixty | ethiopian-civil-war(africa) |
| `Q4872474` | 3 | Battle of Sylhet | Battle of Sylhet | bangladesh-liberation-war(asia) |
| `Q60847470` | 3 | Battle of Kisangani | Battle of Kisangani (1997) | first-congo-war(africa) |
| `Q5940093` | 3 | Atabak Park Incident | Atabak Park Incident | constitutionalization-attempts-in-iran(asia) |
| `Q5964167` | 3 | Minor Tyranny | Minor Tyranny | constitutionalization-attempts-in-iran(asia) |
| `Q111719230` | 3 | 2019–2020 COVID-19 outbreak in mainland China | 2019–2020 COVID-19 outbreak in mainland China | covid-19-pandemic(asia) |
| `Q122969980` | 3 | stand-off in Be'eri and Ofakim | Stand-off in Be'eri and Ofakim | gaza-war(asia) |
| `Q123181886` | 3 | Al-Ansar Mosque airstrike | Al-Ansar Mosque airstrike | gaza-war(asia) |
| `Q123185470` | 3 | Musa family airstrike | Musa family airstrike | gaza-war(asia) |
| `Q123312810` | 3 | Osama bin Zaid school airstrike | Osama bin Zaid school airstrike | gaza-war(asia) |
| `Q123798802` | 3 | Shadia Abu Ghazala school massacre | Shadia Abu Ghazala School massacre | gaza-war(asia) |
| `Q123938869` | 3 | 2023 Zorob family airstrike | 2023 Zorob family airstrike | gaza-war(asia) |
| `Q130574839` | 3 | Beit Lahia massacre | 19 October 2024 Beit Lahia attacks | gaza-war(asia) |
| `Q136202486` | 3 | Al-Farabi School Bombing | Al-Farabi School bombing | gaza-war(asia) |
| `Q2888830` | 3 | Battle of Hwanggan | Battle of Hwanggan | korean-war(asia) |
| `Q2890898` | 3 | Naval Battle of the Han River | Naval Battle of the Han River (1951) | korean-war(asia) |
| `Q3270739` | 3 | Battle of Pakchon | Battle of Pakchon | korean-war(asia) |
| `Q4697761` | 3 | Air Battle of South Korea | Air Battle of South Korea | korean-war(asia) |
| `Q4870717` | 3 | Battle of Chatkol | Battle of Chatkol | korean-war(asia) |
| `Q4872128` | 3 | Battle of Pusan Perimeter logistics | Battle of Pusan Perimeter logistics | korean-war(asia) |
| `Q4872470` | 3 | Battle of Suwon Airfield | Battle of Kimpo Airfield | korean-war(asia) |
| `Q4927240` | 3 | Blockade of Wonsan | Blockade of Wonsan | korean-war(asia) |
| `Q7097631` | 3 | Operation Thunderbolt | Operation Thunderbolt (1951) | korean-war(asia) |
| `Q7097647` | 3 | Operation Tomahawk | Operation Tomahawk | korean-war(asia) |
| `Q11078546` | 3 | Operation Ripper | Operation Ripper | korean-war(asia) |
| `Q11121336` | 3 | Battle of Hoengsong | Battle of Hoengsong | korean-war(asia) |
| `Q15925263` | 3 | Second Phase Offensive | Second Phase Offensive | korean-war(asia) |
| `Q56275616` | 3 | Battle of the Soyang River | Battle of the Soyang River | korean-war(asia) |
| `Q64875976` | 3 | Daejeon massacre | Daejeon massacre | korean-war(asia) |
| `Q65056942` | 3 | UN retreat from North Korea | UN Forces retreat from North Korea | korean-war(asia) |
| `Q5090440` | 3 | chemical attack on Behbahan battalion | Chemical attack on Behbahan battalion | iran-iraq-war(asia) |
| `Q5685853` | 3 | Operation Fath 1 | Operation Fath 1 | iran-iraq-war(asia) |
| `Q40869704` | 3 | Lechemti massacre | Lechemti massacre | second-italo-ethiopian-war(africa) |
| `Q5061225` | 3 | Central Hubei Operation | Central Hubei Operation | second-sino-japanese-war(asia) |
| `Q6485990` | 3 | Langfang Incident | Langfang Incident | second-sino-japanese-war(asia) |
| `Q7654052` | 3 | Swatow Operation | Swatow Operation | second-sino-japanese-war(asia) |
| `Q3408736` | 3 | April 2010 Kohat bombings | April 2010 Kohat bombings | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q22087835` | 3 | Taunsa Sharif bombing | 2015 Tonsa bombing | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q28823870` | 3 | Operation Radd-ul-Fasaad | Operation Radd-ul-Fasaad | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q4871605` | 3 | Battle of Lougou | Battle of Lougou | scramble-for-africa(africa) |
| `Q18164954` | 3 | Battle of Halai | Battle of Halai | scramble-for-africa(africa) |
| `Q3883901` | 3 | Operation Deliverance | Operation Deliverance | somali-civil-war(africa) |
| `Q4870162` | 3 | Battle for Central Somalia | Battle for Central Somalia (2009) | somali-civil-war(africa) |
| `Q4870456` | 3 | Battle of Beledweyne | Battle of Beledweyne (2010) | somali-civil-war(africa) |
| `Q107720850` | 3 | Battle of Dire Dawa | Battle of Dire Dawa | ogaden-war(africa) |
| `Q2026267` | 3 | Operation Phantom Phoenix | Operation Phantom Phoenix | iraq-war(asia) |
| `Q4872982` | 3 | Battle of the Palm Grove | Battle of the Palm Grove | iraq-war(asia) |
| `Q6067924` | 3 | Iraq spring fighting of 2004 | 2004 Iraq spring fighting | iraq-war(asia) |
| `Q6067932` | 3 | Iraq spring fighting of 2008 | 2008 Iraq spring fighting | iraq-war(asia) |
| `Q16201247` | 3 | Iraq War and the war on terror | Iraq War and the war on terror | iraq-war(asia) |
| `Q57393172` | 3 | 2003 Latifiya ambush | 2003 Latifiya ambush | iraq-war(asia) |
| `Q5804054` | 3 | Larache landing | Larache landing | rif-war(africa) |
| `Q127260118` | 3 | 1987 Dhein massacre | 1987 Dhein massacre | second-sudanese-civil-war(africa) |
| `Q7563178` | 3 | 1993 Sopore massacre | 1993 Sopore massacre | kashmir-conflict(asia) |
| `Q54866668` | 3 | 2016 Indian Line of Control strike | 2016 Indian Line of Control strike | kashmir-conflict(asia) |
| `Q119909750` | 3 | 2023 India-Pakistan border skirmishes | 2023 India–Pakistan border skirmishes | kashmir-conflict(asia) |
| `Q42886502` | 3 | Operation Snoopy | Operation Snoopy | rhodesian-bush-war(africa) |
| `Q6337939` | 3 | Operation Panther | Operation Panther (2013) | mali-war(africa) |
| `Q13108147` | 3 | Battle of Tigharghar | Battle of Tigharghar | mali-war(africa) |
| `Q15231233` | 3 | Battle of Goumakoura | Battle of Tinzaouaten (2012) | mali-war(africa) |
| `Q15234126` | 3 | 2012 Malian counter-coup attempt | 2012 Malian counter-coup attempt | mali-war(africa) |
| `Q17149843` | 3 | Internal conflict in Azawad | Azawad conflict | mali-war(africa) |
| `Q52121701` | 3 | MINUSMA super camp attack | 2018 Timbuktu attack | mali-war(africa) |
| `Q56303040` | 3 | Soumpi Attack | Soumpi attack | mali-war(africa) |
| `Q106242304` | 3 | Opération eclipse | Operation Éclipse | mali-war(africa) |
| `Q116446540` | 3 | Battle of Talataye | Battle of Talataye (2022) | mali-war(africa) |
| `Q123058541` | 3 | Siege of Timbuktu | Siege of Timbuktu | mali-war(africa) |
| `Q135194308` | 3 | Battle of Boulikessi | Battle of Boulikessi (2025) | mali-war(africa) |
| `Q39086941` | 3 | Pagak offensive | Pagak offensive | south-sudanese-civil-war(africa) |
| `Q116470937` | 3 | Juba Nuer Massacre | Nuer massacre | south-sudanese-civil-war(africa) |
| `Q104816483` | 3 | Hagere Selam massacres | Hagere Selam massacres | tigray-war(africa) |
| `Q105525684` | 3 | Battle of Humera | Battle of Humera | tigray-war(africa) |
| `Q106610573` | 3 | Zalambessa massacre | Zalambessa massacre | tigray-war(africa) |
| `Q106612678` | 3 | Dengelat massacre | Dengelat massacre | tigray-war(africa) |
| `Q108131617` | 3 | Humera massacre | Humera massacre (2020) | tigray-war(africa) |
| `Q117101214` | 3 | Tar Taing massacre | Tar Taing massacre | myanmar-civil-war(asia) |
| `Q117212534` | 3 | Pinlaung massacre | Pinlaung massacre | myanmar-civil-war(asia) |
| `Q125576654` | 3 | Siege of Myawaddy | Siege of Myawaddy | myanmar-civil-war(asia) |
| `Q126689980` | 3 | Byian Phyu massacre | Byian Phyu massacre | myanmar-civil-war(asia) |
| `Q134255129` | 3 | Battle of Falam | Battle of Falam | myanmar-civil-war(asia) |
| `Q4501981` | 3 | Battle of Changsha | Battle of Changsha (1911) | xinhai-revolution(asia) |
| `Q8044582` | 3 | Xinhai Revolution in Xinjiang | 1911 Revolution in Xinjiang | xinhai-revolution(asia) |
| `Q4871389` | 3 | Battle of Karboğazı | Karboğazı ambush | turkish-war-of-independence(asia) |
| `Q5118507` | 2 | Chyah airstrike | 2006 Shiyyah airstrike | arab-israeli-conflict(asia) |
| `Q10891482` | 2 | Great Exchange of Revolutionary Experience | Great Exchange of Revolutionary Experience | cultural-revolution(asia) |
| `Q4872353` | 2 | Battle of Senluo Temple | Battle of Senluo Temple | boxer-rebellion(asia) |
| `Q112286219` | 2 | Siege of Beitang | Siege of Beitang | boxer-rebellion(asia) |
| `Q4870417` | 2 | Battle of Baoying | Battle of Baoying | chinese-civil-war(asia) |
| `Q4870834` | 2 | Battle of Dalushan Islands | Battle of Dalushan Islands | chinese-civil-war(asia) |
| `Q4870851` | 2 | Battle of Dazhongji | Battle of Dazhongji | chinese-civil-war(asia) |
| `Q4870898` | 2 | Battle of Dongshan Island | Battle of Dongshan Island | chinese-civil-war(asia) |
| `Q4871249` | 2 | Battle of Huaiyin–Huai'an | Battle of Huaiyin–Huai'an | chinese-civil-war(asia) |
| `Q4871560` | 2 | Battle of Lingbi | Battle of Lingbi | chinese-civil-war(asia) |
| `Q4871860` | 2 | Battle of Nanpéng Island | Battle of Nanpeng Island | chinese-civil-war(asia) |
| `Q4872365` | 2 | Battle of Shaobo | Battle of Shaobo | chinese-civil-war(asia) |
| `Q4872550` | 2 | Battle of Tianmen | Battle of Tianmen | chinese-civil-war(asia) |
| `Q4872756` | 2 | Battle of Wuhe | Battle of Wuhe | chinese-civil-war(asia) |
| `Q5027844` | 2 | Campaign of the North China Plain Pocket | Campaign of the North China Plain Pocket | chinese-civil-war(asia) |
| `Q5027852` | 2 | Campaign to Suppress Bandits in Central and Southern China | Campaign to Suppress Bandits in Central and Southern China | chinese-civil-war(asia) |
| `Q5027855` | 2 | Campaign to Suppress Bandits in Eastern China | Campaign to Suppress Bandits in Eastern China | chinese-civil-war(asia) |
| `Q5027858` | 2 | Campaign to Suppress Bandits in Northeast China | Campaign to Suppress Bandits in Northeast China | chinese-civil-war(asia) |
| `Q5027863` | 2 | Campaign to Suppress Bandits in Southwestern China | Campaign to Suppress Bandits in Southwestern China | chinese-civil-war(asia) |
| `Q5027870` | 2 | Campaign to the North of Daqing River | Campaign to the North of Daqing River | chinese-civil-war(asia) |
| `Q5027873` | 2 | Campaign to the South of Baoding | Campaign to the South of Baoding | chinese-civil-war(asia) |
| `Q5227710` | 2 | Datong–Puzhou Campaign | Datong–Puzhou campaign | chinese-civil-war(asia) |
| `Q5278273` | 2 | Dingtao Campaign | Dingtao Campaign | chinese-civil-war(asia) |
| `Q5375462` | 2 | Encirclement Campaign against Hunan–Jiangxi Soviet | Encirclement campaign against the Hunan-Jiangxi Soviet | chinese-civil-war(asia) |
| `Q5447509` | 2 | Fifth Encirclement Campaign against Hubei-Henan-Anhui Soviet | Fifth encirclement campaign against the Eyuwan Soviet | chinese-civil-war(asia) |
| `Q5452954` | 2 | First Encirclement Campaign against Shaanxi–Gansu Soviet | First encirclement campaign against the Shaanxi–Gansu Soviet | chinese-civil-war(asia) |
| `Q5476068` | 2 | Fourth Encirclement Campaign against Hubei-Henan-Anhui Soviet | Fourth encirclement campaign against the Eyuwan Soviet | chinese-civil-war(asia) |
| `Q5647237` | 2 | Handan Campaign | Handan Campaign | chinese-civil-war(asia) |
| `Q5925168` | 2 | Huaiyin–Huai'an Campaign | Huaiyin–Huai'an campaign | chinese-civil-war(asia) |
| `Q6553663` | 2 | Linfen Campaign | Linfen Campaign | chinese-civil-war(asia) |
| `Q6553666` | 2 | Linfen–Fushan Campaign | Linfen–Fushan Campaign | chinese-civil-war(asia) |
| `Q6555199` | 2 | Linyi Campaign | Linyi Campaign | chinese-civil-war(asia) |
| `Q6673867` | 2 | Longhai Campaign | Longhai Campaign | chinese-civil-war(asia) |
| `Q6963786` | 2 | Nanma–Linqu Campaign | Nanma–Linqu Campaign | chinese-civil-war(asia) |
| `Q7096504` | 2 | Opening Campaign | Opening Campaign | chinese-civil-war(asia) |
| `Q7784831` | 2 | Third Encirclement Campaign against Hubei-Henan-Anhui Soviet | Third encirclement campaign against the Eyuwan Soviet | chinese-civil-war(asia) |
| `Q15940930` | 2 | Battle of Shuangqiaozhen | Battle of Shuangqiaozhen | chinese-civil-war(asia) |
| `Q15941813` | 2 | Zhiluozhen Campaign | Zhiluozhen Campaign | chinese-civil-war(asia) |
| `Q16924353` | 2 | Chengdu Campaign | Chengdu campaign | chinese-civil-war(asia) |
| `Q16924905` | 2 | Yanzhou Campaign | Yanzhou campaign | chinese-civil-war(asia) |
| `Q135293415` | 2 | Battle of Cegan Hill | Battle of Cegan Hill | basmachi-movement(asia) |
| `Q112125056` | 2 | Fall of the Derg | Fall of the Derg regime | ethiopian-civil-war(africa) |
| `Q4870540` | 2 | Battle of Boyra | Battle of Boyra | bangladesh-liberation-war(asia) |
| `Q4870868` | 2 | Battle of Dhalai | Battle of Dhalai | bangladesh-liberation-war(asia) |
| `Q4871084` | 2 | Battle of Gazipur | Battle of Gazipur | bangladesh-liberation-war(asia) |
| `Q4871232` | 2 | Battle of Hilli | Battle of Hilli | bangladesh-liberation-war(asia) |
| `Q4871373` | 2 | Battle of Kamalpur | Battle of Kamalpur | bangladesh-liberation-war(asia) |
| `Q4871506` | 2 | Battle of Kushtia | Battle of Kushtia | bangladesh-liberation-war(asia) |
| `Q5329096` | 2 | East Pakistan Air Operations (1971) | East Pakistan Air Operations (1971) | bangladesh-liberation-war(asia) |
| `Q7097183` | 2 | Operation Jackpot | Operation Jackpot | bangladesh-liberation-war(asia) |
| `Q60524376` | 2 | Battle of Adal | Battle of Adal | eritrean-war-of-independence(africa) |
| `Q60524379` | 2 | Battle of Ansaba | Battle of Ansaba | eritrean-war-of-independence(africa) |
| `Q60524420` | 2 | Battle of Omal | Battle of Omal | eritrean-war-of-independence(africa) |
| `Q60524453` | 2 | Battle of Halhal | Battle of Halhal | eritrean-war-of-independence(africa) |
| `Q85800725` | 2 | She'eb massacre | She'eb massacre | eritrean-war-of-independence(africa) |
| `Q108523769` | 2 | Japanese occupation of Gyeongbokgung | Japanese occupation of Gyeongbokgung | donghak-peasant-revolution(asia) |
| `Q118967607` | 2 | Torit mutiny | Torit mutiny | first-sudanese-civil-war(africa) |
| `Q138798714` | 2 | 1965 Juba and Wau massacres | 1965 Juba and Wau massacres | first-sudanese-civil-war(africa) |
| `Q60773478` | 2 | Operation Thunderbolt | Operation Thunderbolt (1997) | first-congo-war(africa),second-sudanese-civil-war(africa) |
| `Q127608912` | 2 | Capture of Lubumbashi | Capture of Lubumbashi | first-congo-war(africa) |
| `Q5954003` | 2 | Battle of Rasht | Battle of Rasht | constitutionalization-attempts-in-iran(asia) |
| `Q25433076` | 2 | Recapture of Isfahan | Recapture of Isfahan | constitutionalization-attempts-in-iran(asia) |
| `Q126148092` | 2 | 1994 Liberian coup attempt | 1994 Liberian coup attempt | first-liberian-civil-war(africa) |
| `Q139715321` | 2 | Siege of Fez | Siege of Fez (1912) | french-conquest-of-morocco(africa) |
| `Q123527566` | 2 | Abu Hussein school airstrike | Abu Hussein School airstrike | gaza-war(asia) |
| `Q123683421` | 2 | Ma'an school airstrike | Ma'an school airstrike | gaza-war(asia) |
| `Q123851806` | 2 | Haifa School airstrike | Haifa School airstrike | gaza-war(asia) |
| `Q137942370` | 2 | Children killed during the January 2026 Iranian protests | Children killed during the 2025–2026 Iranian protests | 2025-2026-iranian-protests(asia) |
| `Q4871181` | 2 | Battle of Haktang-ni | Battle of Haktang-ni | korean-war(asia) |
| `Q4871230` | 2 | Battle of Hill Eerie | Battle of Hill Eerie | korean-war(asia) |
| `Q4872974` | 2 | Battle of the Notch | Battle of the Notch | korean-war(asia) |
| `Q7096937` | 2 | Operation Courageous | Operation Courageous | korean-war(asia) |
| `Q7097206` | 2 | Operation Killer | Operation Killer | korean-war(asia) |
| `Q7097404` | 2 | Operation Polecharge | Operation Polecharge | korean-war(asia) |
| `Q15932430` | 2 | First Phase Offensive | First Phase Offensive | korean-war(asia) |
| `Q16902263` | 2 | Battle of Uijeongbu | Battle of Uijeongbu (1951) | korean-war(asia) |
| `Q18639297` | 2 | Second Battle of the Hook | Second Battle of the Hook | korean-war(asia) |
| `Q19839896` | 2 | Battle for Outpost Vegas | Battle for Outpost Vegas | korean-war(asia) |
| `Q23133797` | 2 | Operation Rat Killer | Operation Rat Killer | korean-war(asia) |
| `Q55632762` | 2 | Second Battle of Maryang-san | Second Battle of Maryang-san | korean-war(asia) |
| `Q65086894` | 2 | UN offensive into North Korea | UN offensive into North Korea | korean-war(asia) |
| `Q85973240` | 2 | Battle of Chaegunghyon | Battle of Chaegunghyon | korean-war(asia) |
| `Q85985974` | 2 | Battle of Chongju | Battle of Chongju (1950) | korean-war(asia) |
| `Q65120655` | 2 | Dolo hospital airstrike | Dolo hospital airstrike | second-italo-ethiopian-war(africa) |
| `Q11105581` | 2 | Linnan Campaign | Linnan Campaign | second-sino-japanese-war(asia) |
| `Q18651827` | 2 | Battle of Baotou | Battle of Baotou | second-sino-japanese-war(asia) |
| `Q3354657` | 2 | Mohmand Offensive | Mohmand offensive | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q18711631` | 2 | Operation Khyber-1 | Operation Khyber | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q21896452` | 2 | Mardan suicide bombing | Mardan suicide bombing | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q29026281` | 2 | 2013 Dera Ismail Khan prison attack | 2013 Dera Ismail Khan prison attack | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q126708875` | 2 | Italian Somali Wars | Italian pacification campaigns in Somalia | scramble-for-africa(africa) |
| `Q134389533` | 2 | Battle of Shangi | Battle of Shangi | scramble-for-africa(africa) |
| `Q112728777` | 2 | Battle of Walong | Battle of Walong | sino-indian-war(asia) |
| `Q3636273` | 2 | Battle of Checkpoint Pasta | Battle of Checkpoint Pasta | somali-civil-war(africa) |
| `Q4681198` | 2 | Addis Ababa Agreement (1993) | Addis Ababa Agreement (1993) | somali-civil-war(africa) |
| `Q4870455` | 2 | Battle of Beledweyne | 2011 Battle of Beledweyne | somali-civil-war(africa) |
| `Q4871347` | 2 | Battle of Jubbada Hoose | Battle of Lower Juba | somali-civil-war(africa) |
| `Q4871451` | 2 | Battle of Kismayo | Battle of Kismayo (2009) | somali-civil-war(africa) |
| `Q54866535` | 2 | June 2013 Mogadishu attack | 2013 United Nations compound attack in Mogadishu | somali-civil-war(africa) |
| `Q131303108` | 2 | Puntland crisis | Puntland crisis (2001–2003) | somali-civil-war(africa) |
| `Q25101307` | 2 | Battle of Harar | Battle of Harar | ogaden-war(africa) |
| `Q4870262` | 2 | Battle of Aliaga | Battle of Aliaga | philippine-revolution(asia) |
| `Q4871918` | 2 | Battle of Noveleta | Battle of Noveleta | philippine-revolution(asia) |
| `Q4872016` | 2 | Battle of Perez Dasmariñas | Battle of Perez Dasmariñas | philippine-revolution(asia) |
| `Q4872272` | 2 | Battle of San Francisco De Malabon | Battle of San Francisco de Malabon | philippine-revolution(asia) |
| `Q4872285` | 2 | Battle of San Mateo and Montalban | Battle of San Mateo and Montalban | philippine-revolution(asia) |
| `Q4872803` | 2 | Battle of Zapote Bridge | Battle of Zapote Bridge (1897) | philippine-revolution(asia) |
| `Q16056918` | 2 | 1896 Manila mutiny | 1896 Manila mutiny | philippine-revolution(asia) |
| `Q16822600` | 2 | Battle of Camalig | Battle of Camalig | philippine-revolution(asia) |
| `Q16822661` | 2 | Battle of Manila | Battle of Manila (1896) | philippine-revolution(asia) |
| `Q16822722` | 2 | Battle of Talisay | Battle of Talisay | philippine-revolution(asia) |
| `Q16931487` | 2 | Siege of Zamboanga | Siege of Fort Pilar | philippine-revolution(asia) |
| `Q21187956` | 2 | Raid on Paombong | Raid on Paombong | philippine-revolution(asia) |
| `Q24204936` | 2 | Battle of Sambat | Battle of Sambat | philippine-revolution(asia) |
| `Q51169006` | 2 | Battle of San Rafael | Battle of San Rafael | philippine-revolution(asia) |
| `Q56063332` | 2 | Battle of San Jose de Buenavista | Battle of San Jose de Buenavista | philippine-revolution(asia) |
| `Q106610261` | 2 | Battle of Mount Puray | Battle of Mount Puray | philippine-revolution(asia) |
| `Q126454316` | 2 | Liberation of Nueva Cáceres | Liberation of Nueva Cáceres (1898) | philippine-revolution(asia) |
| `Q4611303` | 2 | 2008 Iraqi Day of Ashura fighting | 2008 Iraqi Day of Ashura fighting | iraq-war(asia) |
| `Q4870240` | 2 | Battle of Al Rumaythah | Battle of Al Rumaythah | iraq-war(asia) |
| `Q4870844` | 2 | Battle of Danny Boy | Battle of Danny Boy | iraq-war(asia) |
| `Q4870899` | 2 | Battle of Donkey Island | Battle of Donkey Island | iraq-war(asia) |
| `Q4871257` | 2 | Battle of Husaybah | Battle of Husaybah (2004) | iraq-war(asia) |
| `Q4872608` | 2 | Battle of Turki | Battle of Turki | iraq-war(asia) |
| `Q5027352` | 2 | Camp Liberty killings | Camp Liberty shooting | iraq-war(asia) |
| `Q7096734` | 2 | Operation Airborne Dragon | Operation Airborne Dragon | iraq-war(asia) |
| `Q7096735` | 2 | Operation Al Majid | Operation Al Majid | iraq-war(asia) |
| `Q7096739` | 2 | Operation Alljah | Operation Alljah | iraq-war(asia) |
| `Q7096918` | 2 | Operation Commando Eagle | Operation Commando Eagle | iraq-war(asia) |
| `Q7097057` | 2 | Operation Forsythe Park | Operation Forsythe Park | iraq-war(asia) |
| `Q7097173` | 2 | Operation Iron Hammer | Operation Iron Hammer (Iraq 2005) | iraq-war(asia) |
| `Q7097226` | 2 | Operation Leyte Gulf | Operation Leyte Gulf | iraq-war(asia) |
| `Q7097238` | 2 | Operation Lion's Leap | Operation Lion's Leap | iraq-war(asia) |
| `Q7097269` | 2 | Operation Marlborough | Operation Marlborough | iraq-war(asia) |
| `Q7097270` | 2 | Operation Marne Avalanche | Operation Marne Avalanche | iraq-war(asia) |
| `Q7097325` | 2 | Operation New Market | Operation New Market | iraq-war(asia) |
| `Q7097481` | 2 | Operation Saber Guardian | Operation Saber Guardian | iraq-war(asia) |
| `Q7097544` | 2 | Operation Shurta Nasir | Operation Shurta Nasir | iraq-war(asia) |
| `Q7097563` | 2 | Operation Sledgehammer | Operation Sledgehammer (2007) | iraq-war(asia) |
| `Q7097682` | 2 | Operation Valiant Guardian | Operation Valiant Guardian | iraq-war(asia) |
| `Q16932796` | 2 | Operation Mawtini | Operation Mawtini | iraq-war(asia) |
| `Q39086158` | 2 | Battle of Majar al-Kabir | Battle of Majar al-Kabir | iraq-war(asia) |
| `Q126372323` | 2 | Battle in the Liakhvi Gorge | Battles in the Liakhvi Gorge | russo-georgian-war(asia) |
| `Q136892242` | 2 | Capture of Ain Maatouf | Capture of Ain Maatouf | rif-war(africa) |
| `Q138654698` | 2 | Fez offensive | Fez Offensive | rif-war(africa) |
| `Q85814342` | 2 | War of the Peters | War of the Peters | second-sudanese-civil-war(africa) |
| `Q133094170` | 2 | Salmas massacre | Salmas massacre | sayfo(asia) |
| `Q4907195` | 2 | 1993 Bijbehara massacre | 1993 Bijbehara massacre | kashmir-conflict(asia) |
| `Q7510246` | 2 | Siege of Monrovia | Siege of Monrovia | second-liberian-civil-war(africa) |
| `Q96391518` | 2 | Maher Massacre | Maher Massacre | second-liberian-civil-war(africa) |
| `Q17058664` | 2 | Woolworths bombing | Salisbury Woolworths bombing | rhodesian-bush-war(africa) |
| `Q55627685` | 2 | Operation Gatling | Operation Gatling | rhodesian-bush-war(africa) |
| `Q108597603` | 2 | Vumba massacre | Vumba massacre | rhodesian-bush-war(africa) |
| `Q118853631` | 2 | Salisbury Fuel Depot Attack | Salisbury fuel depot attack | rhodesian-bush-war(africa) |
| `Q15231189` | 2 | Battle of Andéramboukane | Fall of Andéramboukane | mali-war(africa) |
| `Q15231481` | 2 | Battle of Anefis | Battle of Anéfis (June 2013) | mali-war(africa) |
| `Q15233581` | 2 | Fall of Timbuktu | Fall of Timbuktu | mali-war(africa) |
| `Q15233800` | 2 | Battle of In Emsal | Battle of In Emsal | mali-war(africa) |
| `Q15235237` | 2 | Battle of Sudere | Battle of Sudere | mali-war(africa) |
| `Q15296449` | 2 | Battle of Araouane | Battle of Araouane (2013) | mali-war(africa) |
| `Q16541008` | 2 | Battle of Kondaoui | Battle of Kondaoui | mali-war(africa) |
| `Q16627878` | 2 | Battle of Dayet in Maharat | Battle of Dayet in Maharat | mali-war(africa) |
| `Q18032620` | 2 | Battle of Timetrine | Battle of Timetrine | mali-war(africa) |
| `Q25933093` | 2 | 2016 Nampala attack | 2016 Nampala attack | mali-war(africa) |
| `Q54817720` | 2 | Inkadogotane ambush | Inkadogotane ambush | mali-war(africa) |
| `Q97166430` | 2 | Attack on Kafolo | Kafolo attack | mali-war(africa) |
| `Q111210487` | 2 | Danguèrè Wotoro massacre | Danguèrè Wotoro massacre | mali-war(africa) |
| `Q113839957` | 2 | Hombori massacre | Hombori massacre | mali-war(africa) |
| `Q125256362` | 2 | Labbezanga attack | Labbezanga attack | mali-war(africa) |
| `Q125685055` | 2 | Diafarabé and Koumara attacks | Diafarabé and Koumara attacks | mali-war(africa) |
| `Q126681300` | 2 | Mourdiah attack | Mourdiah attack | mali-war(africa) |
| `Q135333602` | 2 | 2025 Tessit attack | 2025 Tessit attack | mali-war(africa) |
| `Q141521916` | 2 | 2026 Dioura attack | 2026 Dioura attack | mali-war(africa) |
| `Q56277097` | 2 | 2014 retreat from Western Bahr el Ghazal | 2014 retreat from Western Bahr el Ghazal | south-sudanese-civil-war(africa) |
| `Q97358505` | 2 | Battle of Bor | Battle of Bor | south-sudanese-civil-war(africa) |
| `Q104816386` | 2 | Adigrat massacres | Adigrat massacres | tigray-war(africa) |
| `Q104816446` | 2 | Hitsats massacre | Hitsats massacre | tigray-war(africa) |
| `Q106584357` | 2 | Mekelle shelling | 2020 Mekelle airstrikes | tigray-war(africa) |
| `Q106616371` | 2 | December 2020 Wukro massacre | December 2020 Wukro massacre | tigray-war(africa) |
| `Q106616379` | 2 | March 2021 Wukro massacre | March 2021 Wukro massacre | tigray-war(africa) |
| `Q106616390` | 2 | November 2020 Wukro massacre | Wukro massacres | tigray-war(africa) |
| `Q106616395` | 2 | February 2021 Wukro massacre | February 2021 Wukro massacre | tigray-war(africa) |
| `Q106626698` | 2 | Goda massacre | Goda massacre | tigray-war(africa) |
| `Q106778692` | 2 | Bora massacre | Bora massacre | tigray-war(africa) |
| `Q106880748` | 2 | Debano massacre | Debano massacre | tigray-war(africa) |
| `Q106901006` | 2 | Mahbere Dego massacres | Mahbere Dego massacres | tigray-war(africa) |
| `Q107242093` | 2 | Kola Tembien February 2021 massacres | February 2021 Kola Tembien massacre | tigray-war(africa) |
| `Q107694764` | 2 | Zamr massacre | Zamr massacre | tigray-war(africa) |
| `Q107694770` | 2 | Finarwa massacre | Finarwa massacre | tigray-war(africa) |
| `Q108101874` | 2 | Gira Aras massacre | Gira Aras massacre | tigray-war(africa) |
| `Q108123402` | 2 | Guh massacre | Guh massacre | tigray-war(africa) |
| `Q108444614` | 2 | December 2020 Gijet massacre | December 2020 Gijet massacre | tigray-war(africa) |
| `Q120176510` | 2 | Battle of Mese | Battle of Mese | myanmar-civil-war(asia) |
| `Q136126152` | 2 | Khash massacre | 2022 Khash massacre | mahsa-amini-protests(asia) |
| `Q20715211` | 2 | Battle of Geyve | Battle of Geyve | turkish-war-of-independence(asia) |
| `Q137710627` | 2 | Ali Batı Revolt | Ali Batı Rebellion | turkish-war-of-independence(asia) |
| `Q134142653` | 1 | 2011 Dhabyani coup attempt | 2011 Dhabyani coup attempt | arab-spring(africa) |
| `Q4870405` | 1 | Battle of Bamianshan | Battle of Bamianshan | chinese-civil-war(asia) |
| `Q4871155` | 1 | Battle of Guanzhong | Battle of Guanzhong (1946–1947) | chinese-civil-war(asia) |
| `Q4871246` | 1 | Battle of Houmajia | Battle of Houmajia | chinese-civil-war(asia) |
| `Q4871567` | 1 | Battle of Lishi | Battle of Lishi | chinese-civil-war(asia) |
| `Q4871893` | 1 | Battle of Niangziguan | Battle of Niangziguan | chinese-civil-war(asia) |
| `Q4872027` | 1 | Battle of Phoenix Peak | Battle of Phoenix Peak | chinese-civil-war(asia) |
| `Q4872213` | 1 | Battle of Rugao | Battle of Rugao | chinese-civil-war(asia) |
| `Q4872214` | 1 | Battle of Rugao–Huangqiao | Battle of Rugao–Huangqiao | chinese-civil-war(asia) |
| `Q4872361` | 1 | Battle of Shangcai | Battle of Shangcai | chinese-civil-war(asia) |
| `Q4872362` | 1 | Battle of Shantou | Battle of Shantou (1927) | chinese-civil-war(asia) |
| `Q4872367` | 1 | Battle of Shicun | Battle of Shicun | chinese-civil-war(asia) |
| `Q4872499` | 1 | Battle of Tang'erli | Battle of Tang'erli | chinese-civil-war(asia) |
| `Q4872501` | 1 | Battle of Tangtou–Guocun | Battle of Tangtou–Guocun | chinese-civil-war(asia) |
| `Q4872553` | 1 | Battle of Tianquan | Battle of Tianquan | chinese-civil-war(asia) |
| `Q4872761` | 1 | Battle of Xiangshuikou | Battle of Xiangshuikou | chinese-civil-war(asia) |
| `Q4934546` | 1 | Bobai Campaign | Bobai campaign | chinese-civil-war(asia) |
| `Q5027768` | 1 | Campaign at the Eastern Foothills of Funiu Mountain | Campaign in the Eastern Foothills of the Funiu Mountains | chinese-civil-war(asia) |
| `Q5027854` | 1 | Campaign to Suppress Bandits in Dabieshan | Campaign to Suppress Bandits in Dabieshan | chinese-civil-war(asia) |
| `Q5027856` | 1 | Campaign to Suppress Bandits in Liuwandashan | Campaign to Suppress Bandits in Liuwandashan | chinese-civil-war(asia) |
| `Q5027857` | 1 | Campaign to Suppress Bandits in Longquan | Campaign to Suppress Bandits in Longquan | chinese-civil-war(asia) |
| `Q5027859` | 1 | Campaign to Suppress Bandits in Northern China | Campaign to Suppress Bandits in Northern China | chinese-civil-war(asia) |
| `Q5027860` | 1 | Campaign to Suppress Bandits in Northern Guangdong | Campaign to Suppress Bandits in Northern Guangdong | chinese-civil-war(asia) |
| `Q5027864` | 1 | Campaign to Suppress Bandits in Western Guangxi | Campaign to Suppress Bandits in Western Guangxi | chinese-civil-war(asia) |
| `Q5027865` | 1 | Campaign to Suppress Bandits in Western Hunan | Campaign to Suppress Bandits in Western Hunan | chinese-civil-war(asia) |
| `Q5027866` | 1 | Campaign to Suppress Bandits in Wuping | Campaign to Suppress Bandits in Wuping | chinese-civil-war(asia) |
| `Q5027867` | 1 | Campaign to Suppress Bandits in Northeastern Guizhou | Campaign to Suppress Bandits in Northeastern Guizhou | chinese-civil-war(asia) |
| `Q5027868` | 1 | Campaign to Suppress Bandits in the Border Region of Hunan–Hubei–Sichuan | Campaign to Suppress Bandits in the Border Region of Hunan–Hubei–Sichuan | chinese-civil-war(asia) |
| `Q5027871` | 1 | Campaign to the North of Nanchuan County | Campaign to the North of Nanchuan County | chinese-civil-war(asia) |
| `Q5375459` | 1 | Encirclement campaign against the Hunan–Western Hubei Soviet | Encirclement campaign against the Hunan–Western Hubei Soviet | chinese-civil-war(asia) |
| `Q5375460` | 1 | Encirclement Campaign against Hunan–Hubei–Jiangxi Soviet | Encirclement campaign against the Hunan-Hubei-Jiangxi Soviet | chinese-civil-war(asia) |
| `Q5375461` | 1 | Encirclement Campaign against Hunan–Hubei–Sichuan–Guizhou Soviet | Encirclement campaign against the Hunan-Hubei-Sichuan-Guizhou Soviet | chinese-civil-war(asia) |
| `Q5375463` | 1 | Encirclement Campaign against Northeastern Jiangxi Soviet | Encirclement campaign against the Northeastern Jiangxi Soviet | chinese-civil-war(asia) |
| `Q5452951` | 1 | First Encirclement Campaign against Hubei-Henan-Anhui Soviet | First encirclement campaign against the Eyuwan Soviet | chinese-civil-war(asia) |
| `Q5452952` | 1 | First Encirclement Campaign against Hubei–Henan–Shaanxi Soviet | First encirclement campaign against the Hubei–Henan–Shaanxi Soviet | chinese-civil-war(asia) |
| `Q5452953` | 1 | First Encirclement Campaign against Honghu Soviet | First encirclement campaign against the Honghu Soviet | chinese-civil-war(asia) |
| `Q5521722` | 1 | Gaoyou–Shaobo Campaign | Gaoyou–Shaobo campaign | chinese-civil-war(asia) |
| `Q5695525` | 1 | Hebei–Rehe–Chahar Campaign | Hebei–Rehe–Chahar Campaign | chinese-civil-war(asia) |
| `Q5913151` | 1 | Houma Campaign | Houma Campaign | chinese-civil-war(asia) |
| `Q6202423` | 1 | Jingshan–Zhongxiang Campaign | Jingshan–Zhongxiang Campaign | chinese-civil-war(asia) |
| `Q6711552` | 1 | Lüliang Campaign | Lüliang Campaign | chinese-civil-war(asia) |
| `Q7195774` | 1 | Pingdu Campaign | Pingdu Campaign | chinese-civil-war(asia) |
| `Q7443267` | 1 | Second Encirclement Campaign against Honghu Soviet | Second encirclement campaign against the Honghu Soviet | chinese-civil-war(asia) |
| `Q7443268` | 1 | Second Encirclement Campaign against Hubei-Henan-Anhui Soviet | Second encirclement campaign against the Eyuwan Soviet | chinese-civil-war(asia) |
| `Q7443269` | 1 | Second Encirclement Campaign against Hubei–Henan–Shaanxi Soviet | Second encirclement campaign against the Hubei–Henan–Shaanxi Soviet | chinese-civil-war(asia) |
| `Q7676641` | 1 | Taixing Campaign | Taixing Campaign | chinese-civil-war(asia) |
| `Q7784830` | 1 | Third Encirclement Campaign against Honghu Soviet | Third encirclement campaign against the Honghu Soviet | chinese-civil-war(asia) |
| `Q7784832` | 1 | Third Encirclement Campaign against Shaanxi–Gansu Soviet | Third encirclement campaign against the Shaanxi–Gansu Soviet | chinese-civil-war(asia) |
| `Q7980433` | 1 | Weixian–Guangling–Nuanquan Campaign | Weixian–Guangling–Nuanquan Campaign | chinese-civil-war(asia) |
| `Q7988371` | 1 | Western Tai'an Campaign | Western Tai'an Campaign | chinese-civil-war(asia) |
| `Q8039045` | 1 | Wudi Campaign | Wudi Campaign | chinese-civil-war(asia) |
| `Q8044548` | 1 | Xinghua Campaign | Xinghua Campaign | chinese-civil-war(asia) |
| `Q8071089` | 1 | Zhoucun–Zhangdian Campaign | Zhoucun–Zhangdian Campaign | chinese-civil-war(asia) |
| `Q8071198` | 1 | Zhucheng Campaign | Zhucheng Campaign | chinese-civil-war(asia) |
| `Q10747141` | 1 | Campaign to Suppress Bandits in Shiwandashan | Campaign to Suppress Bandits in Shiwandashan | chinese-civil-war(asia) |
| `Q16239687` | 1 | Battle of Jiulianshan | Battle of Jiulianshan | chinese-civil-war(asia) |
| `Q16924547` | 1 | Gongzhutun Campaign | Gongzhutun Campaign | chinese-civil-war(asia) |
| `Q16924641` | 1 | Second Encirclement Campaign against the Shaanxi-Gansu Soviet | Second encirclement campaign against the Shaanxi–Gansu Soviet | chinese-civil-war(asia) |
| `Q16924897` | 1 | Battle of Yan'an | Battle of Yan'an | chinese-civil-war(asia) |
| `Q17023398` | 1 | Campaign along the Southern Section of Datong–Puzhou Railway | Campaign along the Southern Section of Datong–Puzhou Railway | chinese-civil-war(asia) |
| `Q117336604` | 1 | Operation Red Star | Red Star Campaign | ethiopian-civil-war(africa) |
| `Q131160433` | 1 | Battle of Dhalai Outpost | Battle of Dhalai Outpost | bangladesh-liberation-war(asia) |
| `Q60524455` | 1 | Battle of Togoruba | Battle of Togoruba | eritrean-war-of-independence(africa) |
| `Q60761103` | 1 | Agordat Operation | Agordat Operation | eritrean-war-of-independence(africa) |
| `Q124683341` | 1 | Siege of Nakfa | Siege of Nakfa | eritrean-war-of-independence(africa) |
| `Q134376555` | 1 | Suez Emergency | Suez Emergency | decolonisation-of-africa(africa) |
| `Q141273381` | 1 | Battle of Menabha | Battle of Menabha | french-conquest-of-morocco(africa) |
| `Q139406998` | 1 | Battle of Calueque | Battle of Calueque | angolan-civil-war(africa) |
| `Q4870741` | 1 | Battle of Chuam-ni | Battle of Chuam-ni | korean-war(asia) |
| `Q4871500` | 1 | Battle of Kujin | Battle of Kujin | korean-war(asia) |
| `Q4871627` | 1 | Battle of Maehwa-san | Battle of Maehwa-san | korean-war(asia) |
| `Q7097291` | 1 | Operation Minden | Operation Minden | korean-war(asia) |
| `Q7097473` | 1 | Operation Roundup | Operation Roundup (1951) | korean-war(asia) |
| `Q56275438` | 1 | Operation Dauntless | Operation Dauntless | korean-war(asia) |
| `Q65059739` | 1 | Pohang Operation | Pohang Operation | korean-war(asia) |
| `Q111012658` | 1 | Battle of Hill 355 | Battle of Hill 355 | korean-war(asia) |
| `Q137885050` | 1 | 1979 Iranian ethnic unrest | 1979 Iranian ethnic unrest | iran-iraq-war(asia) |
| `Q4688008` | 1 | Aerial engagements of the Second Sino-Japanese War | Aerial engagements of the Second Sino-Japanese War | second-sino-japanese-war(asia) |
| `Q4871914` | 1 | Battle of Northern and Eastern Henan | Battle of Northern and Eastern Henan | second-sino-japanese-war(asia) |
| `Q4872762` | 1 | Battle of Xinfeng | Battle of Xinfeng | second-sino-japanese-war(asia) |
| `Q7100589` | 1 | Order of battle for Campaign of Northern and Eastern Henan 1938 | Order of battle for campaign of northern and eastern Henan 1938 | second-sino-japanese-war(asia) |
| `Q7100590` | 1 | Order of battle for Campaign of Northern and Eastern Honan 1938 | Order of battle for campaign of northern and eastern Honan 1938 | second-sino-japanese-war(asia) |
| `Q17036086` | 1 | Western Hubei Operation | Western Hubei Operation | second-sino-japanese-war(asia) |
| `Q7097728` | 1 | Operation Zalzala | Operation Zalzala | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q15983575` | 1 | 2014 Peshawar cinema bombings | 2014 Peshawar cinema bombings | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q16204206` | 1 | Operation Sirat-e-Mustaqeem | Operation Sirat-e-Mustaqeem | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q22087828` | 1 | 2015 Parachinar bombing | 2015 Parachinar bombing | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q28868528` | 1 | Operation Ghazi | Operation Ghazi | insurgency-in-khyber-pakhtunkhwa(asia) |
| `Q130372679` | 1 | Battle of New Moscow | Battle of New Moscow | scramble-for-africa(africa) |
| `Q134376352` | 1 | Blockade of Zanzibar | Blockade of Zanzibar | scramble-for-africa(africa) |
| `Q136483840` | 1 | Rabih War | Rabih War | scramble-for-africa(africa) |
| `Q130283276` | 1 | Battle of Gurung Hill | Battle of Gurung Hill | sino-indian-war(asia) |
| `Q4871990` | 1 | Battle of Pasong Tamo | Battle of Pasong Tamo | philippine-revolution(asia) |
| `Q4873197` | 1 | Battles of Batangas | Battles of Batangas | philippine-revolution(asia) |
| `Q6379999` | 1 | Kawit Revolt | Kawit revolt | philippine-revolution(asia) |
| `Q7316931` | 1 | Retreat to Montalban | Retreat to Montalban | philippine-revolution(asia) |
| `Q7510230` | 1 | Siege of Masbate | Siege of Masbate | philippine-revolution(asia) |
| `Q16822566` | 1 | Battle of Barrio Yating | Battle of Barrio Yating | philippine-revolution(asia) |
| `Q16822596` | 1 | Battle of Calamba | Battle of Calamba | philippine-revolution(asia) |
| `Q16822703` | 1 | Battle of Sapong Hills | Battle of Sapong Hills | philippine-revolution(asia) |
| `Q16822727` | 1 | Battle of Tayabas | Battle of Tayabas | philippine-revolution(asia) |
| `Q16828511` | 1 | Cry of Tarlac | Cry of Tarlac | philippine-revolution(asia) |
| `Q126721244` | 1 | Battle of Budla-an | Battle of Budla-an | philippine-revolution(asia) |
| `Q134740137` | 1 | Battle of Dagupan | Battle of Dagupan | philippine-revolution(asia) |
| `Q139760871` | 1 | Siege of Biak-na-Bato | Siege of Biak-na-Bato | philippine-revolution(asia) |
| `Q4872206` | 1 | Battle of Route Bismarck | Battle of Route Bismarck | iraq-war(asia) |
| `Q7096760` | 1 | Operation Ardennes | Operation Ardennes | iraq-war(asia) |
| `Q7096780` | 1 | Operation Badlands | Operation Badlands | iraq-war(asia) |
| `Q7096794` | 1 | Operation Bayonet Lightning | Operation Bayonet Lightning | iraq-war(asia) |
| `Q7096859` | 1 | Operation Bulldog Mammoth | Operation Bulldog Mammoth | iraq-war(asia) |
| `Q7096967` | 1 | Operation Defeat Al Qaeda in the North | Operation Defeat Al Qaeda in the North | iraq-war(asia) |
| `Q7097303` | 1 | Operation Murfreesboro | Operation Murfreesboro | iraq-war(asia) |
| `Q7097371` | 1 | Operation Panther Squeeze | Operation Panther Squeeze | iraq-war(asia) |
| `Q133306156` | 1 | Battle of the Bridges of Nasiriyah | Battle of the Bridges of Nasiriyah | iraq-war(asia) |
| `Q7097203` | 1 | Operation Khukri | Operation Khukri | sierra-leone-civil-war(africa) |
| `Q16733826` | 1 | Lungi Lol confrontation | Lungi Lol confrontation | sierra-leone-civil-war(africa) |
| `Q16734100` | 1 | Siege of Freetown | Siege of Freetown | sierra-leone-civil-war(africa) |
| `Q141310314` | 1 | Battle of Freetown | Battle of Freetown (1995) | sierra-leone-civil-war(africa) |
| `Q141362217` | 1 | Battle of Koidu | Battle of Koidu | sierra-leone-civil-war(africa) |
| `Q138942390` | 1 | 1989 El Jebelein massacre | 1989 El Jebelein massacre | second-sudanese-civil-war(africa) |
| `Q139263362` | 1 | Fur–Arab conflict | Fur–Arab conflict | second-sudanese-civil-war(africa) |
| `Q140700667` | 1 | Battle of Juba | Battle of Juba (1992) | second-sudanese-civil-war(africa) |
| `Q132745826` | 1 | Haydar Bey's Assyrian Expedition | Haydar Bey's Assyrian Expedition | sayfo(asia) |
| `Q4588608` | 1 | 1993 Lal Chowk fire | 1993 Lal Chowk fire | kashmir-conflict(asia) |
| `Q4621487` | 1 | 2011 India–Pakistan border shooting | 2011 India–Pakistan border skirmish | kashmir-conflict(asia) |
| `Q7023336` | 1 | Nhari Rebellion | Nhari rebellion | rhodesian-bush-war(africa) |
| `Q7097683` | 1 | Operation Uric | Operation Uric | rhodesian-bush-war(africa) |
| `Q16971210` | 1 | Operation Miracle | Operation Miracle (Rhodesia) | rhodesian-bush-war(africa) |
| `Q42886468` | 1 | Operation Yodel | Operation Yodel | rhodesian-bush-war(africa) |
| `Q42886499` | 1 | Operation Aztec | Operation Aztec | rhodesian-bush-war(africa) |
| `Q43083081` | 1 | Battle of Hill 31 | Battle of Hill 31 | rhodesian-bush-war(africa) |
| `Q48816486` | 1 | Operation Cauldron | Operation Cauldron (Rhodesia) | rhodesian-bush-war(africa) |
| `Q55648474` | 1 | Operation Flotilla | Operation Flotilla | rhodesian-bush-war(africa) |
| `Q56280369` | 1 | Operation Chamber | Operation Chamber | rhodesian-bush-war(africa) |
| `Q54811136` | 1 | Araouane clashes | Araouane clashes | mali-war(africa) |
| `Q54866576` | 1 | Battle of In-Delimane | Battle of In-Delimane (2018) | mali-war(africa) |
| `Q54866759` | 1 | Battle of Tabarde | Battle of Tabarde | mali-war(africa) |
| `Q116814614` | 1 | Sokoura attack | Sokoura attack | mali-war(africa) |
| `Q134574040` | 1 | 2025 Malian protests | 2025 Malian protests | mali-war(africa) |
| `Q137799875` | 1 | Liébé massacre | Liébé massacre | mali-war(africa) |
| `Q137921513` | 1 | Tessit massacres | Tessit massacres | mali-war(africa) |
| `Q27245755` | 1 | 2016–2019 Wau clashes | 2016–2019 Wau clashes | south-sudanese-civil-war(africa) |
| `Q107980543` | 1 | Tisha massacre | Tisha massacre | tigray-war(africa) |
| `Q107980571` | 1 | Haddush Addi massacre | Haddush Addi massacre | tigray-war(africa) |
| `Q107980577` | 1 | May Atsmi massacres | May Atsmi massacres | tigray-war(africa) |
| `Q108315102` | 1 | Galikoma massacre | Galikoma massacre | tigray-war(africa) |
| `Q108660995` | 1 | Chenna massacre | Chenna massacre | tigray-war(africa) |
| `Q109239143` | 1 | Kerebera Da Mariyam massacre | Kerebera Da Mariyam massacre | tigray-war(africa) |
| `Q111169604` | 1 | Kobo massacre | Kobo massacre | tigray-war(africa) |
| `Q117086191` | 1 | Kombolcha massacre | Kombolcha massacre | tigray-war(africa) |
| `Q121090645` | 1 | Siege of Tigray | Siege of Tigray | tigray-war(africa) |
| `Q137167091` | 1 | Adwa massacres | Adwa massacres | tigray-war(africa) |
| `Q139760034` | 1 | El Fasher airport attack | El Fasher airport attack (2003) | war-in-darfur(africa) |
| `Q139760413` | 1 | Battle of Tina | Battle of Tina (2003) | war-in-darfur(africa) |
| `Q126959794` | 1 | Anglo-Turkish War (1918–1923) | United Kingdom during the Turkish War of Independence | turkish-war-of-independence(asia) |
| `Q140389960` | 1 | Turkish invasion of Georgia | Turkish invasion of Georgia | turkish-war-of-independence(asia) |
