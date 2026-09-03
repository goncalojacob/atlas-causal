// Bootstrap for sources.html: load the sources index, draw the bibliography.
// One fetch of the manifest and one of the index, and nothing else — the
// topology, which is twenty times the size, is not needed to list books.
// ?fixtures=1 reads the synthetic dataset, as everywhere else.

import { loadSources } from '../data.js';
import { bibliographyHtml } from './bibliography.js';
import { esc } from '../util/esc.js';

const params = new URLSearchParams(window.location.search);
const fixtures = params.get('fixtures') === '1';
const slot = document.getElementById('bibliography');

try {
  const { sources } = await loadSources({ dataRoot: fixtures ? 'tests/fixtures/data/' : 'data/' });
  slot.innerHTML = bibliographyHtml(sources);
} catch (error) {
  slot.innerHTML = `<p class="muted">Could not load the bibliography: <code>${esc(error.message)}</code>.
    Serve the repository root (<code>python3 -m http.server 8000</code>) and make sure
    <code>data/index/</code> exists (<code>node tools/build-index.mjs</code>).</p>`;
  throw error;
}
