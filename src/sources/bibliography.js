// The bibliography as markup. Pure — sources in, HTML out — so what the page
// lists can be held to its promises by node --test without a browser.
//
// It is generated from the sources index at render and never hand-written:
// a source added to data/sources/ appears here the moment the index is
// rebuilt, and a citation count nobody maintains cannot go stale.

import { esc } from '../util/esc.js';
import { citationText, identifiers, compareSources } from '../citation.js';

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
  const ids = identifiers(source).map(({ label, href }) => (href
    ? `<a href="${esc(href)}" rel="noopener">${esc(label)}</a>`
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

export function bibliographyHtml(sources) {
  const list = [...sources].sort(compareSources);
  if (list.length === 0) {
    return '<p class="muted">The bibliography is empty: no source record has been written yet.</p>';
  }
  const cited = list.filter((s) => (s.citationCount ?? 0) > 0).length;
  const citations = list.reduce((n, s) => n + (s.citationCount ?? 0), 0);
  return `<p class="bib-summary">${list.length} source${list.length === 1 ? '' : 's'},
    ${cited} of them cited, carrying ${citations} citation${citations === 1 ? '' : 's'} between them.
    Each title opens what rests on it.</p>
    <ol class="bib-list">${list.map(entryHtml).join('')}</ol>`;
}
