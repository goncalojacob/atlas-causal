# The queue fixtures

What `tools/queue/apply.mjs` is run against end to end, with `--fetcher
stub:tests/fixtures/queue`. Nothing here is history and nothing here is a
record: the items are invented, the way `tests/fixtures/wikidata/README.md`
says its own are, so that a test can state what an import does without
depending on what Wikidata says this week and without making a request.

- `Q92000NN.json` — an item, in the shape `wbgetentities` answers with. The
  stub serves one file per item.
- `<revision>.txt` — the article at that revision, as the action API's
  `action=parse` answers it. HTML on purpose: the reference markers, the
  curly quotes, the en dash, the soft hyphen and the infobox table are what
  `plainText` and `normaliseQuote` have to take out of the question before a
  quote can be checked verbatim.
- `summary/<Article title>.json` — the lead the import caches, in the shape
  the REST summary endpoint answers with.
- `refuse-network` — a sentinel, written by the test that asserts the tool
  stops and writes nothing when no request leaves the sandbox. Not committed.

The events the quotes name are the fixture corpus's own
(`tests/fixtures/data/events/`), so an edge written here runs between two
records a test can read.
