# The recorded responses the Wikidata import is tested against

These files have the exact shape of the responses `tools/import/wikidata.mjs`
asks for — `wbgetentities` and `wbsearchentities` with
`formatversion=2`, the Wikipedia REST summary endpoint, and a SPARQL
`SELECT` — and none of their content is real.

Every item in them is a `Q9…` identifier that Wikidata does not use, and
every label is plainly invented. That is deliberate twice over. The sandbox
these were written in has no network, so nothing could have been recorded
from the live service; and a fixture that looked like a real item would put
a claim about the world into the test suite, where nobody reviews it. What
the tests check is the tool's behaviour — how it batches, retries, refuses,
classifies and merges — and behaviour is the same whatever the item is.

The one thing that follows from this: these fixtures cannot catch a mistaken
belief about what Wikidata actually returns for a real item. The first run
against the live service is the Action, on an `import/…` branch, and it is
built to fail loudly and restore `data/` rather than commit something odd.

| file | what it is |
|---|---|
| `entities.json` | `wbgetentities` for the six synthetic items, one of each case the import has to handle |
| `search.json` | `wbsearchentities` for a name with two plausible items behind it |
| `summary-en.json` | the REST summary of one article, the shape the lead cache is built from |
| `sparql.json` | a SPARQL `SELECT ?item ?itemLabel ?labelPt ?itemDescription ?date ?typeLabel ?sitelinks` result, the shape `--candidates` reads: one row with everything bound, one with only a label, one that is not an item at all |
