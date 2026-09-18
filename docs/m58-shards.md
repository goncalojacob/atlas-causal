# M58 — what each of the two answers costs, and which one this took

The fault is one sentence, and M50 wrote it: an attribute row is written into
the shard of its record's **start** century, and a view fetches the shards its
**window** covers. A record long enough to reach into the window from an
earlier century is drawn — correctly, it is in the window — with its name in a
file nobody asked for, and its bar reads "still loading" for ever.

The brief names two answers and asks for both to be measured before either is
built. This is the measurement. Every number is this repository's own data at
`860c24c1`, from `node tools/build-index.mjs`'s own report, with each answer
applied to a copy of the tree and nothing else changed.

## 0. How big the fault is

A record "reaches out" when its interval touches a century later than the one
it begins in. An interval with no end reaches to the end of the corpus, which
is **2026**, because that is how `overlaps()` already draws it: a record that
has not ended is in every window after it began.

| kind | reaching out | of which open-ended |
| --- | ---: | ---: |
| event | 23 | 1 |
| edge | 35 | — |
| actor | 1,203 | 236 |
| relation | 13 | 13 |
| tenure | 4 | — |
| narrative | 1 | — |
| **all** | **1,279** of 3,906 | **250** |

**23 events have the fault** — not two. `the-atlantic-slave-trade-to-brazil`
and `indigenous-depopulation-of-coastal-brazil` are the two M50 found by
walking the timeline; the other twenty-one were never looked at. A third of
the whole corpus reaches out, which is what a corpus of polities and long
processes looks like: an actor is an interval, and most polities outlive the
century they were founded in.

## 1. Today

| file | raw | gzipped |
| --- | ---: | ---: |
| `core` | 168,129 B | 46,240 B |
| the ten attribute shards | 486,783 B | 114,938 B |

The atlas opens on **1900–1999** (`opensOn`, the busiest century), so first
paint is the core plus three attribute shards — the window's century and the
two that answer no year:

| first paint | raw | gzipped | requests |
| --- | ---: | ---: | ---: |
| `attributes-1900-1999` | 167,786 B | 40,585 B | |
| `attributes-null` | 2,328 B | 833 B | |
| `attributes-place` | 7,090 B | 2,339 B | |
| **the attributes together** | **177,204 B** | **43,757 B** | **3** |

## 2. Answer one — the row goes in every shard its span touches

A record's row is written into every century its interval overlaps, not only
the one it begins in. Nothing else changes: `attributeShardsIn(window)` asks
for the same shards it asks for today, and they now carry the names of
everything the window draws.

| | raw | gzipped |
| --- | ---: | ---: |
| the attribute shards | 717,682 B | 166,127 B |
| **against today** | **+230,899 B (+47.4 %)** | **+51,189 B (+44.5 %)** |

Twelve files rather than ten: `1200-1299` and `1300-1399` appear, centuries no
record *begins* in and two records *cross*. 2,096 rows are written more than
once.

First paint, on the window the atlas opens on:

| first paint | raw | gzipped | requests |
| --- | ---: | ---: | ---: |
| `attributes-1900-1999` | 198,144 B | 46,808 B | |
| the two that answer no year | 9,418 B | 3,172 B | |
| **together** | **207,562 B** | **49,980 B** | **3** |
| **against today** | **+30,358 B (+17.1 %)** | **+6,223 B (+14.2 %)** | **±0** |

## 3. Answer two — the window's shards plus an index of what reaches in

The shards stay as they are and one more file is written beside them, holding
the rows of every record that reaches out of its own century. A view fetches
the shards its window covers **and that file**, whatever the window is,
because it cannot know what reaches in until it has read it.

| | raw | gzipped |
| --- | ---: | ---: |
| the ten shards, unchanged | 486,783 B | 114,938 B |
| `attributes-reaching` | 145,906 B | 33,191 B |
| **together** | **632,689 B** | **148,129 B** |
| **against today** | **+145,906 B (+30.0 %)** | **+33,191 B (+28.9 %)** |

First paint:

| first paint | raw | gzipped | requests |
| --- | ---: | ---: | ---: |
| the three shards, unchanged | 177,204 B | 43,757 B | |
| `attributes-reaching` | 145,906 B | 33,191 B | |
| **together** | **323,110 B** | **76,948 B** | **4** |
| **against today** | **+145,906 B (+82.3 %)** | **+33,191 B (+75.9 %)** | **+1** |

## 4. The choice: answer one

Answer two is the smaller index and the more expensive atlas, and the index is
not what anybody waits for.

1. **First paint.** Answer one costs **+6,223 B gzipped** on the window the
   atlas opens on and not one extra request. Answer two costs **+33,191 B
   gzipped** — five and a third times as much — and a fourth request. The
   brief's constraint is first paint, not bytes on disk.

2. **Answer two makes every window pay for every other.** Its file is fetched
   whatever the window is, so a reader of the 1400s downloads the names of
   1,279 records reaching across centuries they are not looking at. The
   brief's third test — *first paint fetches no more shards than today for a
   window containing no long event* — is a test answer two cannot pass, and it
   is not a technicality: that is the cost being described.

3. **Answer one charges the bytes to the century that draws the record.** The
   1900–1999 shard grows by 30 KB because 1900–1999 draws thirty kilobytes
   more names than it could label before. Nothing is fetched that is not on
   screen. Answer two's file grows with every long record the atlas will ever
   hold and is paid by every reader of every century for ever.

4. **One rule about which file a record is in.** `attributePeriod` is that
   rule and three readers share it so that two sharding schemes cannot come to
   disagree (index2-plan A8; index2 review, findings 4 and 10). Answer one
   widens it — one key becomes the keys the interval touches — and it stays
   one rule. Answer two is a second mechanism beside it, with a file that must
   be pinned outside the LRU cap for ever like `null` and `place`, and a
   record whose row is in two places by two different rules.

What answer one costs, said plainly: **the attribute shards grow 44.5 %
gzipped**, 51 KB on this corpus, and 2,096 rows are written twice or more. It
buys a corpus where a third of the records can be named in the window that
draws them.

## 5. What the loader has to change with it

The build is half of it. `data.js` files each record under one key —
`shardOfId`, `shardOfRecord`, `recordsByShard` — and three things read it:

- `attributesLoaded(id)` asks whether *the* shard is in hand. A record filed
  in four would still read as unloaded in three of them, and the bar would
  say "still loading" with its name already on the page.
- eviction strips a record's attributes when its shard is dropped, which would
  strip a record another shard still in hand is carrying.
- `attributeShardsOf` pins the shard a card needs, and one is enough — a card
  keeps asking for the record's own century, as it does today.

So the filing key becomes the filing **keys**, `attributesLoaded` is *any of
them*, and eviction strips only what no loaded shard still carries. Nothing a
reader sees changes except the fault: a bar that said "still loading" says the
event's name and draws.
