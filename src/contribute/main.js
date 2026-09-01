// Bootstrap for contribute.html: load the topology and the schemas, wire the
// form. Same shape as src/main.js — load, wire, nothing else — and the same
// ?fixtures=1 switch, so the form can be exercised before any record exists.

import { loadAtlas } from '../data.js';
import { loadSchemas } from '../validate/schemas.js';
import { createForm } from './form.js';
import { CONTRIBUTION_TEMPLATE, CORRECTION_TEMPLATE } from './submit.js';
import { esc } from '../util/esc.js';

const params = new URLSearchParams(window.location.search);
const fixtures = params.get('fixtures') === '1';
const correction = params.get('correction') === '1';
const mount = document.getElementById('form');

try {
  const [atlas, schemas] = await Promise.all([
    loadAtlas({ dataRoot: fixtures ? 'tests/fixtures/data/' : 'data/', landFile: false }),
    loadSchemas({ root: 'schema/' }),
  ]);

  document.getElementById('fixtures-badge').hidden = !fixtures;

  createForm(mount, {
    topology: {
      events: [...atlas.events.values()],
      edges: [...atlas.edges.values()],
      sources: [...atlas.sources.values()],
      regions: atlas.regions,
    },
    schemas,
    template: correction ? CORRECTION_TEMPLATE : CONTRIBUTION_TEMPLATE,
    fixtures,
  });
} catch (error) {
  mount.innerHTML = `<p class="field-error"><code>${esc(error.message)}</code></p>
    <p>The form needs the atlas index. Serve the repository root (<code>python3 -m http.server 8000</code>)
    and make sure <code>data/index/</code> exists (<code>node tools/build-index.mjs</code>).
    With no records yet, <a href="contribute.html?fixtures=1">?fixtures=1</a> loads the synthetic set.</p>`;
  throw error;
}
