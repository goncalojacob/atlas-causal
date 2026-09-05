// Bootstrap for narratives.html: load the spine, draw the cards. The
// bibliography needs one small index; this needs the graph, because a
// narrative's period is the years of the records it walks and those live
// there. Nothing that is only drawn is fetched — no coastlines, no
// territories, no palette. ?fixtures=1 reads the synthetic dataset, as
// everywhere else.

import { loadNarratives } from '../data.js';
import { narrativesHtml } from './list.js';
import { esc } from '../util/esc.js';

const params = new URLSearchParams(window.location.search);
const fixtures = params.get('fixtures') === '1';
const slot = document.getElementById('narratives');
const badge = document.getElementById('fixtures-badge');

try {
  const { narratives, events, edges } = await loadNarratives({ dataRoot: fixtures ? 'tests/fixtures/data/' : 'data/' });
  if (badge) badge.hidden = !fixtures;
  slot.innerHTML = narrativesHtml(narratives, { events, edges });
} catch (error) {
  slot.innerHTML = `<p class="muted">Could not load the narratives: <code>${esc(error.message)}</code>.
    Serve the repository root (<code>python3 -m http.server 8000</code>) and make sure
    <code>data/index/</code> exists (<code>node tools/build-index.mjs</code>).</p>`;
  throw error;
}
