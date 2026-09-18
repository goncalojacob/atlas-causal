// Bootstrap for contribute.html: load the core and the schemas, wire the
// form. Same shape as src/main.js — load, wire, nothing else — and the same
// ?fixtures=1 switch, so the form can be exercised before any record exists.
//
// This is a **whole-universe reader**, which is the one thing that makes it
// different from the atlas. `checkRules` asks whether a `wikidata` id is
// unique across every record there is, and `findSimilar` reads every title and
// every alias, so no window and no century answers for it (index2 review,
// finding 2; STATUS.md, deviation 223). Since I4b it therefore draws out of
// the **core** and then fetches **every** attribute shard in year order behind
// it, holding them all; until the last one is in, the form says so where the
// verdict goes rather than reporting on half the corpus (i4-brief, A2).
//
// The search shard is the other file the page wants and the other one it no
// longer waits for: 2.75 MB at 10⁴, against a budget of 2.0 MB of index before
// the form is drawn. The pickers search what the page has and are given the
// shard's own entries when it lands (picker.js, `replace`).
//
// `?edit=<kind>/<id>` opens the form on a record that exists — "Edit this
// record", on every card — and the file is fetched here rather than in the
// form, which knows nothing about the network.

import { loadAtlas, loadSearchShard } from '../data.js';
import { loadSchemas } from '../validate/schemas.js';
import { createForm } from './form.js';
import { pickerIndex } from './picker.js';
import { preparedFor, valuesFromRecord } from './bundle.js';
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
    loadAtlas({ dataRoot, landFile: false }),
    loadSchemas({ root: 'schema/' }),
  ]);
  // The presences, which left the spine in I1 and which rule 17 and the
  // `actor-unused` warning read (rules.js; index2 review, finding 2). Awaited
  // still, unlike the shards: they are 261 KB on the real data and none at all
  // at 10⁴, they are one file rather than a century at a time, and the form's
  // universe is built once the corpus is whole anyway — so waiting for them
  // costs the draw nothing it was not already paying (STATUS.md, deviation
  // 421).
  //
  // A rejection leaves the form working on the universe without them, which
  // is the universe it had before this file existed.
  await atlas.loadPresences().catch(() => {});

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

  // Everything the form offers as a choice and everything a reference in the
  // bundle may resolve to. Actors were missing here since M4, which left the
  // actor row empty on the real dataset and made an event citing an actor that
  // exists fail rule 14 in the browser; places would have gone the same way.
  //
  // The records themselves are the atlas's own objects, which an attribute
  // shard fills **in place** when it lands (data.js, `applyAttributes`): this
  // list is the same list afterwards, with the titles, the names and the
  // identifiers on it.
  const topology = {
    events: [...atlas.events.values()],
    edges: [...atlas.edges.values()],
    sources: [...atlas.sources.values()],
    actors: [...atlas.actors.values()],
    places: [...atlas.places.values()],
    offices: [...(atlas.offices?.values() ?? [])],
    tenures: [...(atlas.tenures?.values() ?? [])],
    narratives: [...(atlas.narratives?.values() ?? [])],
    // The ground each actor held: not a choice the form offers — a presence
    // has no address and is in no picker — but part of the universe the
    // rules read, so that the form's `actor-unused` and rule 17 say what
    // the CLI says (index2 review, finding 2).
    presences: [...atlas.presences.values()],
    regions: atlas.regions,
    // The roles and the categories the atlas allows, off the manifest: the
    // form runs the same `checkRules` the CLI does, and without these two
    // it would accept a role the validator warns about on the pull request.
    // Absent stays absent, which is what turns the check off (A8).
    ...(atlas.manifest?.rolesAllowed === undefined ? {} : { rolesAllowed: atlas.manifest.rolesAllowed }),
    ...(atlas.manifest?.categoriesAllowed === undefined ? {} : { categoriesAllowed: atlas.manifest.categoriesAllowed }),
  };

  // The universe the rules and the duplicate search read, built only once the
  // whole corpus is in hand and `null` until then: a verdict on half of it
  // would file a duplicate as new and warn about what the CLI does not
  // (i4-brief, A2).
  let prepared = null;
  // And what the pickers search, which is the search shard when it lands. An
  // empty index rather than one folded from the topology: a picker that
  // offered ids as though they were names would be exactly the fallback text
  // this cycle refuses (i4-brief, "no fallback text").
  const pickers = pickerIndex({ topology, entries: [] });

  const form = createForm(mount, {
    topology,
    schemas,
    pickers,
    universe: () => prepared,
    initial,
    template: correction ? CORRECTION_TEMPLATE : CONTRIBUTION_TEMPLATE,
    fixtures,
  });

  // --- the corpus, behind the draw -----------------------------------------
  //
  // Every attribute shard, in the manifest's own year order, and the search
  // shard beside them. Nothing here is awaited before the form is on screen;
  // when the last one is in, the universe is built, the pickers are given the
  // shard's entries, and the form reports for the first time.
  //
  // A shard that will not load is not silently half a corpus: the page keeps
  // saying it is loading rather than passing judgement on what did arrive.
  let searchEntries = null;
  loadSearchShard({ dataRoot, manifest: atlas.manifest })
    .then((entries) => { searchEntries = entries; pickers.replace(entries); form.repaintPickers(); })
    .catch(() => {});
  const shards = atlas.attributeShards ?? [];
  // Held, all of them: this page is the whole universe or it is nothing, so
  // the LRU cap has nothing to say here (data.js, ATTRIBUTE_SHARD_CAP).
  atlas.pinAttributes(shards);
  Promise.all(shards.map((shard) => atlas.loadAttributes(shard))).then(() => {
    prepared = preparedFor(topology, schemas);
    // The pickers again, because their own memos hold labels: a link is named
    // after the two events it runs between, and those had no titles when the
    // form was drawn. `null` where the search shard never arrived, which folds
    // the topology — now that it has its names.
    pickers.replace(searchEntries);
    form.repaintPickers();
    form.refresh({ now: true });
  }, () => {});
} catch (error) {
  mount.innerHTML = `<p class="field-error"><code>${esc(error.message)}</code></p>
    <p>The form needs the atlas index. Serve the repository root (<code>python3 -m http.server 8000</code>)
    and make sure <code>data/index/</code> exists (<code>node tools/build-index.mjs</code>).
    With no records yet, <a href="contribute.html?fixtures=1">?fixtures=1</a> loads the synthetic set.</p>`;
  throw error;
}
