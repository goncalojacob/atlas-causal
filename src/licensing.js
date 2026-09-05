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
export const LICENSES = Object.freeze({
  'CC-BY-SA-4.0': Object.freeze({
    name: 'CC BY-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    attribution: null,
    source: null,
  }),
  'CC-BY-NC-SA-4.0': Object.freeze({
    name: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    attribution: 'CShapes 2.0 — Schvitz, Girardin, Rüegger, Weidmann, Cederman and Gleditsch',
    source: 'https://doi.org/10.1177/00220027211013563',
  }),
  PD: Object.freeze({
    name: 'Public domain',
    url: null,
    attribution: 'Natural Earth',
    source: 'https://www.naturalearthdata.com/about/terms-of-use/',
  }),
});

// The licence a directory of generated geometry carries, which is per source
// and not per record — those files have no `license` field of their own, so
// this is the only place it is written down. `data/index/` is the one entry
// that is honestly two answers: it projects NC actors and presences into the
// same files as CC BY-SA records, so a reuser of the index is bound by both.
const GEOMETRY = Object.freeze({
  'data/geo/land-present.json': ['PD'],
  'data/geo/regions.json': ['PD'],
  'data/geo/presences/': ['CC-BY-NC-SA-4.0'],
  'data/geo/palette.json': ['CC-BY-NC-SA-4.0'],
  'data/index/': ['CC-BY-SA-4.0', 'CC-BY-NC-SA-4.0'],
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
