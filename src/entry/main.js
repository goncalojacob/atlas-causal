// Bootstrap for entry.html: resolve ?id=, fetch the record, draw the page.
//
// It loads the spine because an entry is not only its own text — it names the
// actors of an event, the relations of an actor, the narratives that walk
// through it — and the spine carries every one of those links. The record
// file itself is fetched second, for the prose. No coastlines: nothing here
// is drawn on a map.

import { loadAtlas } from '../data.js';
import { esc } from '../util/esc.js';
import { entryHtml, elsewhereHtml, notFoundHtml, createLinks, displayName, ENTRY_KINDS } from './entry.js';

const params = new URLSearchParams(window.location.search);
const fixtures = params.get('fixtures') === '1';
const id = params.get('id') ?? '';
const slot = document.getElementById('entry');
const links = createLinks({ fixtures });
const languages = Array.isArray(navigator?.languages) ? [...navigator.languages] : [];

// The tab's name is the record's, which is what a reader with eleven tabs
// open is reading them by.
function setTitle(text) {
  document.title = text ? `${text} — Atlas causal` : 'Entry — Atlas causal';
}

// A prerendered page — entry/<id>.html, written by tools/build-index.mjs from
// this same entryHtml() — is already the whole entry, with its title in
// <title> and a canonical link back to entry.html?id=. Nothing here would
// change a pixel of it, and re-rendering it would mean fetching the spine to
// arrive at the markup already on screen. `entry.html?id=` is the address and
// still does all of the work below.
if (slot.dataset.prerendered === '1') {
  // Nothing: the build wrote this page.
} else if (id === '') {
  slot.innerHTML = `<header class="entry-head"><h1>No record asked for</h1></header>
    <section class="entry-body"><p>This page shows one record's full entry, and the address says which:
    <code>entry.html?id=…</code>. <a href="index.html">The atlas</a> links here from every card.</p></section>`;
} else {
  try {
    const atlas = await loadAtlas({ dataRoot: fixtures ? 'tests/fixtures/data/' : 'data/', landFile: false, regions: false });
    const found = atlas.resolve(id);
    if (!found) {
      setTitle('');
      slot.innerHTML = notFoundHtml(id);
    } else if (!ENTRY_KINDS.includes(found.kind)) {
      setTitle('');
      slot.innerHTML = elsewhereHtml(found.kind, found.id, links);
    } else {
      // The spine entry is enough for the title and the meta line, so the
      // page has a head before the record file has arrived.
      setTitle(displayName(found.record));
      slot.innerHTML = '<p class="muted">Loading the entry…</p>';
      const record = await atlas.record(found.kind, found.id);
      setTitle(displayName(record));
      slot.innerHTML = entryHtml(atlas, {
        kind: found.kind,
        record,
        topologyEntry: found.record,
        found,
        links,
        languages,
      });
    }
  } catch (error) {
    slot.innerHTML = `<p class="muted">Could not load the entry: <code>${esc(error.message)}</code>.
      Serve the repository root (<code>python3 -m http.server 8000</code>) and make sure
      <code>data/index/</code> exists (<code>node tools/build-index.mjs</code>).</p>`;
    throw error;
  }
}
