// Bootstrap for contribute.html: load the spine and the schemas, wire the
// form. Same shape as src/main.js — load, wire, nothing else — and the same
// ?fixtures=1 switch, so the form can be exercised before any record exists.
//
// The spine and not the search shard, for the pickers as well as for the
// rules. The corrected spine carries every field either needs — an event's
// `title` and `aliases` for the duplicate search, an actor's `name` and
// `actorType`, a place's `name`, a source's `title` — and the form has the
// whole file in hand anyway, because `checkRules` runs against the whole
// universe of records and no shard can answer for it (STATUS.md, deviation
// 223).

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
    loadAtlas({ dataRoot: fixtures ? 'tests/fixtures/data/' : 'data/', landFile: false, regions: false }),
    loadSchemas({ root: 'schema/' }),
  ]);

  document.getElementById('fixtures-badge').hidden = !fixtures;

  createForm(mount, {
    // Everything the form offers as a choice and everything a reference in
    // the bundle may resolve to. Actors were missing here since M4, which
    // left the actor row empty on the real dataset and made an event citing
    // an actor that exists fail rule 14 in the browser; places would have
    // gone the same way.
    topology: {
      events: [...atlas.events.values()],
      edges: [...atlas.edges.values()],
      sources: [...atlas.sources.values()],
      actors: [...atlas.actors.values()],
      places: [...atlas.places.values()],
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
