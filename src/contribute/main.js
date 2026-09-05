// Bootstrap for contribute.html: load the spine and the schemas, wire the
// form. Same shape as src/main.js — load, wire, nothing else — and the same
// ?fixtures=1 switch, so the form can be exercised before any record exists.
//
// The spine, because `checkRules` runs against the whole universe of records
// and no shard can answer for it (STATUS.md, deviation 223), and the search
// shard beside it, because the pickers scan what the build already folded.
// Neither replaces the other: the shard is names, the spine is records.
//
// `?edit=<kind>/<id>` opens the form on a record that exists — "Edit this
// record", on every card — and the file is fetched here rather than in the
// form, which knows nothing about the network.

import { loadAtlas, loadSearchShard } from '../data.js';
import { loadSchemas } from '../validate/schemas.js';
import { createForm } from './form.js';
import { valuesFromRecord } from './bundle.js';
import { CONTRIBUTION_TEMPLATE, CORRECTION_TEMPLATE } from './submit.js';
import { KIND_DIRS } from '../kinds.js';
import { parseEdit } from '../share.js';
import { esc } from '../util/esc.js';

const params = new URLSearchParams(window.location.search);
const fixtures = params.get('fixtures') === '1';
const dataRoot = fixtures ? 'tests/fixtures/data/' : 'data/';
const mount = document.getElementById('form');

const edit = parseEdit(params.get('edit'));
// An edit is a correction whether or not the link said so: what it produces
// is a record with an id that already exists, and that is what the correction
// template accepts.
const correction = params.get('correction') === '1' || edit !== null;

try {
  const [atlas, schemas] = await Promise.all([
    loadAtlas({ dataRoot, landFile: false, regions: false }),
    loadSchemas({ root: 'schema/' }),
  ]);
  const searchEntries = await loadSearchShard({ dataRoot, manifest: atlas.manifest }).catch(() => null);

  // The record being corrected, if the address named one. A record that
  // cannot be read is not a blank form that silently forgets what was asked
  // for: the page says which record it could not open.
  let initial = null;
  let missing = null;
  if (edit) {
    try {
      const response = await fetch(`${dataRoot}${KIND_DIRS[edit.kind]}/${encodeURIComponent(edit.id)}.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${response.status}`);
      const record = await response.json();
      initial = [{ kind: edit.kind, values: valuesFromRecord(edit.kind, record) }];
    } catch {
      missing = `${edit.kind}/${edit.id}`;
    }
  }

  document.getElementById('fixtures-badge').hidden = !fixtures;
  if (missing) {
    mount.appendChild(Object.assign(document.createElement('p'), {
      className: 'field-error',
      textContent: `${missing} could not be read; the form below is empty.`,
    }));
  }

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
      narratives: [...(atlas.narratives?.values() ?? [])],
      regions: atlas.regions,
    },
    schemas,
    searchEntries,
    initial,
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
