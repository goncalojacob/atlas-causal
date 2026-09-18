// Which licence covers what under `data/`, and what each one asks to be said.
//
// A leaf module. `data/LICENSE` and `data/geo/LICENSE` are the licences
// themselves and the reasoning behind them, written for a person; this is the
// same boundary in a form a machine can read, because a downstream reuser
// could not tell from a record which third party it derives from except by
// parsing `authors[].name`, the index files carried no licence at all, and
// the site never said on an NC-licensed card that it was one (health review
// A, finding 24).
//
// It states nothing `data/LICENSE` does not; `tests/licensing.test.mjs` holds
// the two together, and the per-kind rows against `src/kinds.js`, so a
// directory cannot come to hold a licence that only one of the three knows
// about.

import { licensesOf } from './kinds.js';
import { esc, safeUrl } from './util/esc.js';

// What a licence is, and whom it asks to be named. `attribution` is null
// where the answer is "this project" — CC BY-SA is what the atlas's own
// records are under and `about.html` says so once for the whole site. It is a
// name where the material is somebody else's, and then a card carrying that
// material has to say so beside it.
// `imported` is the load-bearing flag and not a synonym for "has an
// attribution": it says this licence binds a reuser with terms the atlas's own
// licence does not have, and so may stand on a record **only** where an import
// put it there (rule 12). Natural Earth asks to be named and binds nobody, so
// PD is attributed and not imported; CC BY-NC-SA forbids commercial use and
// GPL-3.0 demands the same licence downstream, so both are.
export const LICENSES = Object.freeze({
  'CC-BY-SA-4.0': Object.freeze({
    name: 'CC BY-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    attribution: null,
    source: null,
    imported: false,
  }),
  'CC-BY-NC-SA-4.0': Object.freeze({
    name: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    attribution: 'CShapes 2.0 — Schvitz, Girardin, Rüegger, Weidmann, Cederman and Gleditsch',
    source: 'https://doi.org/10.1177/00220027211013563',
    imported: true,
  }),
  // M43a. The territories before 1886 come from a repository whose single
  // LICENSE is the stock GPLv3, covering its GeoJSON with everything else.
  // GPL-3.0 permits commercial use where CC BY-NC-SA forbids it, which is why
  // it was taken at all; it demands the same licence of anything derived from
  // it, which is why it is `imported` like the other.
  'GPL-3.0-only': Object.freeze({
    name: 'GPL-3.0',
    url: 'https://www.gnu.org/licenses/gpl-3.0.html',
    attribution: 'Historical Basemaps — André Ourednik and contributors',
    source: 'https://github.com/aourednik/historical-basemaps',
    imported: true,
  }),
  PD: Object.freeze({
    name: 'Public domain',
    url: null,
    attribution: 'Natural Earth',
    source: 'https://www.naturalearthdata.com/about/terms-of-use/',
    imported: false,
  }),
});

// The licences whose material is somebody else's and whose terms data/LICENSE
// cannot absorb. Rule 12 lets one of these stand on a record only where an
// import created it (`origin.tool` in IMPORT_LICENCE_ORIGINS), whatever
// directory the record lives in: the exception follows the origin, not the
// directory (I8, owner question 4). Derived from the table above rather than
// listed twice.
//
// It was `NON_COMMERCIAL` until M43a. The NC clause was never what rule 12
// tested for — it tested for "a licence this project does not own" — and the
// name stopped being true the moment a GPL source arrived. `NC_LICENSES` below
// is still here because data/LICENSE's prose and about.html say something
// about the NC clause in particular that is not true of GPL.
export const IMPORTED_LICENSES = Object.freeze(
  Object.keys(LICENSES).filter((id) => LICENSES[id].imported),
);

// The subset that forbids commercial use, which is a different sentence and
// is said in a different place.
export const NC_LICENSES = Object.freeze(
  Object.keys(LICENSES).filter((id) => id.includes('-NC-')),
);

// The licence a directory of generated geometry carries, which is per source
// and not per record — those files have no `license` field of their own, so
// this is the only place it is written down. `data/index/` is the one entry
// that is honestly two answers: it projects NC actors and presences into the
// same files as CC BY-SA records, so a reuser of the index is bound by both.
const GEOMETRY = Object.freeze({
  'data/geo/land-present.json': ['PD'],
  'data/geo/regions.json': ['PD'],
  // The base map (M36): Natural Earth 10 m, public domain like the other two,
  // and **not** an NC directory. Nothing from CShapes is in it and nothing in
  // it goes into a CShapes file; Natural Earth asks to be named nowhere, so
  // the card and entry-page attribution line is unchanged by its arrival.
  'data/geo/base/': ['PD'],
  // Two imports share this directory since M43a and the shards do not mix:
  // 1400-1885 is Historical Basemaps under GPL-3.0, 1886-2019 is CShapes
  // under CC BY-NC-SA, and which is which is the file name. The row is both
  // because the directory is both, and a reuser of all of it is bound by both.
  'data/geo/presences/': ['CC-BY-NC-SA-4.0', 'GPL-3.0-only'],
  // The palette is a graph colouring over every border at once, so it is
  // derived from both and cannot be split the way the shards can.
  'data/geo/palette.json': ['CC-BY-NC-SA-4.0', 'GPL-3.0-only'],
  'data/index/': ['CC-BY-SA-4.0', 'CC-BY-NC-SA-4.0', 'GPL-3.0-only'],
});

// Directory → the licences its files may carry, and for each the attribution
// it asks for. The record directories come from the registry, so a kind whose
// licences change here changes in one place; the generated trees are the
// table above.
export function licensingTable() {
  const rows = {};
  const add = (where, licenses) => {
    rows[where] = {
      licenses: [...licenses],
      attribution: licenses
        .filter((id) => LICENSES[id]?.attribution)
        .map((id) => ({ license: id, name: LICENSES[id].attribution, source: LICENSES[id].source })),
    };
  };
  for (const [kind, licenses] of Object.entries(licensesOf())) add(`data/${kind}s/`, licenses);
  for (const [where, licenses] of Object.entries(GEOMETRY)) add(where, licenses);
  return rows;
}

// What a card or an entry page has to say beside this record, or null when
// there is nothing to say beyond the site's own licence. One line: whose
// material it is, under what, and where the dataset lives.
export function attributionOf(record) {
  const id = record?.license;
  const licence = LICENSES[id];
  if (!licence?.attribution) return null;
  return { license: id, name: licence.name, url: licence.url, attribution: licence.attribution, source: licence.source };
}

// The first of these records whose material is somebody else's, or null. A
// page draws more than one record: an actor's card and its entry page draw
// the relations the actor stands in, and a relation has no card of its own,
// so a succession the CShapes import derived would otherwise be NC material
// shown with nothing beside it (I8, A3). The licence asks for the line once
// per page and not once per record, and this is what picks which record it is
// said about — the record itself first, where that is one of them.
export function attributionSource(records) {
  return (records ?? []).find((record) => attributionOf(record)) ?? null;
}

// The line itself, for a card and for an entry page — one function, because
// the licence asks for the same sentence wherever the material is shown and
// two copies of it would be two chances to drop it. Empty for a record under
// the site's own licence: `about.html` says that once for everything.
export function attributionHtml(record) {
  const notice = attributionOf(record);
  if (!notice) return '';
  const link = (url, text) => {
    const href = safeUrl(url);
    return href ? `<a href="${esc(href)}" rel="license noopener" target="_blank">${esc(text)}</a>` : esc(text);
  };
  const dataset = notice.source ? ` — ${link(notice.source, 'the dataset')}` : '';
  return `<p class="notice licence">This record is derived from ${esc(notice.attribution)} and is licensed
    ${link(notice.url, notice.name)}, not under the licence of the rest of this atlas${dataset}.</p>`;
}
