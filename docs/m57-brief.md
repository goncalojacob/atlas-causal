# Build brief — M57: "Who was buying" — the narrative, and the events it needs

The owner, 17 September, asked for a narrative that reaches the present:

> **"the whole colonization history led to Brazil being a producer of certain
> goods, and when the US rose they wanted to have control over several of them
> they decided to intervene when Brazil elected a socialist government. I want
> to have a narrative that reflects all of this"**

## 1. The thesis, which is what makes it a narrative and not a chronology

**Brazil has been organised around exporting commodities since 1500, and the
identity of the buyer kept changing — Portugal, then Britain, then the United
States, now China. Each change was political.**

## 2. What exists and what does not

The atlas already holds the first two movements: Tordesillas, the landfall,
the sugar cycle, the Atlantic trade to Brazil, the gold cycle, the transfer of
the court, independence, the Aberdeen Act, the Queirós law, Lei Áurea, the
Republic, the Vargas era, **and the 1964 coup**. The Caribbean chain and the
British Industrial Revolution are there too, with M50's three `disputed` edges.

**What is missing is the third and fourth movements**, and they are the
owner's actual question. Roughly fifteen events, researched from Wikipedia
under the owner's decision of 16 September, every one sourced:

- **coffee**, the republic's economy, and **rubber** and its collapse when
  Southeast Asian plantations undercut it — the commodities between sugar and
  steel, without which the thesis has a hole;
- **Volta Redonda, 1941** — American finance for Brazil's first integrated
  steelworks, against bases in the Northeast and wartime rubber. **This is the
  hinge of the whole narrative**: strategic commodities exchanged for
  industrial capital;
- **Petrobras, 1953**;
- **Goulart's base reforms, 1961–64**, and specifically the **profit
  remittance law of 1962**, which capped what foreign companies could send
  home — the sharpest economic fact in the story;
- **Operation Brother Sam, 1964** — the American naval task force that sailed
  and was stood down when the coup succeeded without it;
- the **dictatorship and its foreign-capital boom**, the **1980s debt crisis**,
  **1985**, the **1988 constitution**;
- the **2000s commodity boom with China as the buyer**, **Lava Jato**, **2016**,
  **2018**, **2023**.

## 3. The link that must be `disputed`, and this is not optional

**Whether the United States backed the 1964 coup because of what Brazil
produced, or out of Cold War anticommunism with economics secondary, is
contested by serious historians.** The atlas has exactly one mechanism for
telling a reader that, and this is the claim it was built for.

**Write that edge `disputed`, with both readings sourced and named.** Asserting
it flatly turns the atlas into an opinion. Marking it disputed — with the
profit remittance law and Brother Sam sitting in the graph as evidence a
reader can weigh — is what makes it useful. **A run that quietly writes it as
`caused` has failed this milestone**, whatever else it did.

## 4. The narrative itself

A `narrative` record walking the four movements, each step naming the event it
stands on. **The walk must pass through the disputed edge**, so a reader
following it meets the banner M50 built — *"You arrived here through a
disputed link"* — in the middle of the argument rather than as a curiosity.

**Confidence, per M50's A2**: Wikipedia is one source however many articles are
read, so these edges are **`probable`**. Rule 22 will not catch a run that
inflates them. Promotion means a work Wikipedia itself cites, with a page.

## 5. What must stay true

No claim without a source, and no source that is the assistant. Events and
their edges land **in the same commit** — an event without edges is the fault
M50 exists to cure. Every event carries a place and a dated `when`; every
event names at least one actor **whose span overlaps its own** (M56's rule).
No new record type, confidence value, edge type, hex value, token or type
size. **No display change.** `validate --index` clean, records first then the
index (deviation 798). Tests before the records they judge (711, 717).

## 6. Tests

1. Every event in this milestone is reachable from every other in the chain in
   four hops or fewer.
2. No event here has fewer than two active edges.
3. **The 1964 motive edge is `disputed` and carries two sources naming the two
   readings.**
4. The narrative's walk includes that edge.
5. Every event names an actor whose span overlaps its own.
6. No test pins a count.

## 7. Done when

The four movements exist; the narrative walks them; the disputed edge is
disputed and the walk passes through it; `docs/m57-claims.md` lists every claim
with its source; `STATUS.md` carries the confidence distribution and what the
narrative looks like to a reader; `validate --index` clean; tests green;
`M57 done`.

## Deviations this brief takes, numbered on from the last in `STATUS.md`
