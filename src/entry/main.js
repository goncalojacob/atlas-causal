// Bootstrap for entry.html: resolve ?id=, fetch the record, draw the page.
//
// It loads the core because an entry is not only its own text — it names the
// actors of an event, the relations of an actor, the narratives that walk
// through it — and the core carries every one of those links. What those links
// are *called* is in the attribute shards, one per century, and an entry is the
// one page whose lists are unwindowed: an actor's events span every century it
// was in. So it asks for the centuries its own lists reach and no others, and
// holds them while the page is on screen (i4-brief, A3; index2 review, finding
// 9). The record file itself is fetched for the prose. No coastlines: nothing
// here is drawn on a map.

import { loadAtlas } from '../data.js';
import { shardsOnScreen } from '../attributes.js';
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
    const atlas = await loadAtlas({
      dataRoot: fixtures ? 'tests/fixtures/data/' : 'data/', landFile: false,
    });
    const found = atlas.resolve(id);
    if (!found) {
      setTitle('');
      slot.innerHTML = notFoundHtml(id);
    } else if (!ENTRY_KINDS.includes(found.kind)) {
      setTitle('');
      slot.innerHTML = elsewhereHtml(found.kind, found.id, links);
    } else {
      // The core's entry says the record exists and nothing about what it is
      // called: the fallback for a missing title is the record's id, and a slug
      // in the tab's name is a derived string presented as the name of the
      // thing (index2 review, finding 21). So the head waits, as the body does,
      // and `atlas.record()` below is what it waits for — since I3 that awaits
      // the record's own shard before it asks for the file, so the title is
      // real by the time either arrives.
      slot.innerHTML = '<p class="muted">Loading the entry…</p>';
      const record = await atlas.record(found.kind, found.id);
      setTitle(displayName(record));

      // The centuries this entry's own lists reach — an actor's events, a
      // place's, the relations, the accounts that walk it — asked for and held
      // while the page is on screen. Never waited for: the page is drawn out of
      // what has landed and drawn again as the rest does, which is one redraw
      // per century and not one per row.
      const draw = () => {
        slot.innerHTML = entryHtml(atlas, {
          kind: found.kind,
          record,
          topologyEntry: found.record,
          found,
          links,
          languages,
        });
      };
      draw();
      const wanted = shardsOnScreen(atlas, found.kind, found.id);
      atlas.pinAttributes?.(wanted);
      for (const shard of wanted) atlas.loadAttributes(shard).then(draw, () => {});
    }
  } catch (error) {
    slot.innerHTML = `<p class="muted">Could not load the entry: <code>${esc(error.message)}</code>.
      Serve the repository root (<code>python3 -m http.server 8000</code>) and make sure
      <code>data/index/</code> exists (<code>node tools/build-index.mjs</code>).</p>`;
    throw error;
  }
}
