// The bibliography as markup. Pure — sources in, HTML out — so what the page
// lists can be held to its promises by node --test without a browser.
//
// It is generated from the sources index at render and never hand-written:
// a source added to data/sources/ appears here the moment the index is
// rebuilt, and a citation count nobody maintains cannot go stale.

import { esc } from '../util/esc.js';
import { citationText, identifiers, compareSources } from '../citation.js';
import { IMPORT_LICENCE_ORIGINS, originTool } from '../origin.js';

const TYPE_LABEL = Object.freeze({
  book: 'book',
  chapter: 'chapter',
  article: 'article',
  thesis: 'thesis',
  primary: 'primary source',
  dataset: 'dataset',
  web: 'web',
});

function entryHtml(source) {
  const count = source.citationCount ?? (source.citations ?? []).length;
  const ids = identifiers(source).map(({ label, href, title }) => (href
    ? `<a href="${esc(href)}" rel="noopener"${title ? ` title="${esc(title)}"` : ''}>${esc(label)}</a>`
    : `<span class="unsafe-url">${esc(label)}</span>`));
  return `<li class="bib-entry${source.status === 'active' ? '' : ' inactive'}">
    <p class="bib-citation"><a href="index.html?source=${encodeURIComponent(source.id)}">${esc(citationText(source))}</a></p>
    <p class="bib-meta">
      <span class="bib-type">${esc(TYPE_LABEL[source.type] ?? source.type ?? '')}</span>
      · <span class="bib-count">${count} citation${count === 1 ? '' : 's'}</span>
      ${source.status !== 'active' ? ` · <span class="badge status">${esc(source.status)}</span>` : ''}
      ${ids.length ? ` · ${ids.join(' · ')}` : ''}
    </p>
  </li>`;
}

// ─── The base maps, counted apart from the works (M85, A17) ────────────────
//
// The page read "65 sources … 11,901 citations", of which Historical Basemaps
// alone was 8,175 and CShapes most of the rest, while the books that carry the
// causal arguments have a few dozen citations each. A reader skimming it saw a
// map-dataset atlas (review of 22 September, finding 17).
//
// **Which sources those are is asked of `origin.tool`, not of a list of ids.**
// `IMPORT_LICENCE_ORIGINS` is already the atlas's answer to "which imports may
// put a licence on a record that `data/LICENSE` does not cover", and it is the
// two territory imports and nothing else. A third base map would be a line in
// `origin.js` and would land in this group without being named again here.
//
// Wikidata is a dataset too and stays above: it is where identifiers are read
// from, not where a border is drawn, and "Base maps and borders" would be a
// false heading over it.
export const isBaseMapSource = (source) => IMPORT_LICENCE_ORIGINS.includes(originTool(source));

export const WORKS_HEADING = 'Works cited';
export const BASE_MAP_HEADING = 'Base maps and borders';

function groupHtml(heading, list, note) {
  if (list.length === 0) return '';
  const cited = list.filter((s) => (s.citationCount ?? 0) > 0).length;
  const citations = list.reduce((n, s) => n + (s.citationCount ?? 0), 0);
  return `<section class="bib-group">
    <h3>${esc(heading)}</h3>
    <p class="bib-summary">${list.length} source${list.length === 1 ? '' : 's'},
    ${cited} of them cited, carrying ${citations} citation${citations === 1 ? '' : 's'} between them.
    ${esc(note)}</p>
    <ol class="bib-list">${list.map(entryHtml).join('')}</ol>
  </section>`;
}

export function bibliographyHtml(sources) {
  const list = [...sources].sort(compareSources);
  if (list.length === 0) {
    return '<p class="muted">The bibliography is empty: no source record has been written yet.</p>';
  }
  const maps = list.filter(isBaseMapSource);
  const works = list.filter((source) => !isBaseMapSource(source));
  return groupHtml(WORKS_HEADING, works, 'Each title opens what rests on it.')
    + groupHtml(BASE_MAP_HEADING, maps,
      'One citation per territory drawn, which is why the counts are what they are.');
}
