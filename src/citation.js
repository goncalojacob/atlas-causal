// A source, rendered. Pure and free of the DOM — a record in, strings and
// link targets out — so the panel's source card and the bibliography page
// say the same thing about the same book without either owning the format.
//
// Nothing here escapes anything: the caller puts these into the DOM and the
// caller calls esc(). Keeping escaping at the edge is why this file can be
// tested as plain data.

import { safeUrl } from './util/esc.js';

export const CITER_LABEL = Object.freeze({
  event: 'Events',
  edge: 'Links',
  actor: 'Actors',
  relation: 'Relations between actors',
  place: 'Places',
  presence: 'Territories',
  narrative: 'Narratives',
});

// The order the groups are shown in on a source's card. A kind the record
// set does not have yet simply never appears.
export const CITER_ORDER = Object.freeze(['event', 'edge', 'actor', 'relation', 'place', 'presence', 'narrative']);

// The four things a work can be inside. A closed list, like the edge types
// and for the same reason: "in something" would collapse an article in a
// journal and a chapter in a book into one shape, and they are not cited
// alike.
export const CONTAINER_KINDS = Object.freeze(['journal', 'edited-volume', 'series', 'website']);

// The containing work, as the middle of a citation: everything between this
// work's title and its publisher.
//
//   journal        "Journal of Portuguese History, 12(3), 45-67."
//   edited-volume  "In The Cambridge History of Portugal, 45-67."
//   series         "Documentos Ultramarinos, 4."
//   website        "Arquivo.pt."
//
// One rule and not four: the volume and the issue read as "12(3)" wherever
// both are there, the pages come last, and only an edited volume takes the
// "In" that says this work is a part of that one. Empty when there is no
// container, which is every source record written before M28.
export function containerText(container) {
  if (!container?.title) return '';
  const parts = [container.kind === 'edited-volume' ? `In ${container.title}` : container.title];
  if (container.volume) parts.push(container.issue ? `${container.volume}(${container.issue})` : `${container.volume}`);
  else if (container.issue) parts.push(`(${container.issue})`);
  if (container.pages) parts.push(container.pages);
  return `${parts.join(', ')}.`;
}

// "Maxwell, K. (1995). The Making of Portuguese Democracy. Cambridge
// University Press." — the citation as the record has it, in one string, for
// a title attribute or a plain-text list. The card lays the same pieces out
// in markup instead.
export function citationText(source) {
  const creators = (source.creators ?? []).join(', ');
  const parts = [];
  if (creators) parts.push(source.year ? `${creators} (${source.year}).` : `${creators}.`);
  else if (source.year) parts.push(`(${source.year}).`);
  parts.push(`${source.title}.`);
  // After this work's title and before its publisher, which is where a
  // reader looks for "and where did that appear?".
  const inside = containerText(source.container);
  if (inside) parts.push(inside);
  if (source.publisher) parts.push(`${source.publisher}.`);
  if (source.repository) parts.push(`${source.repository}${source.reference ? `, ${source.reference}` : ''}.`);
  return parts.join(' ');
}

// The resolvable identifiers, in a fixed order, each as { label, href }.
// `href` is null when there is nothing safe to link to — an ISBN gets an
// Open Library link because a bare number is not a way to find a book, and a
// url that is not http(s) is shown as text by the caller and never as a link
// (safeUrl, esc.js).
export function identifiers(source) {
  const out = [];
  if (source.doi) out.push({ kind: 'doi', label: `doi:${source.doi}`, href: `https://doi.org/${encodeURIComponent(source.doi)}` });
  if (source.isbn) out.push({ kind: 'isbn', label: `ISBN ${source.isbn}`, href: `https://openlibrary.org/isbn/${encodeURIComponent(source.isbn)}` });
  if (source.url) out.push({ kind: 'url', label: source.url, href: safeUrl(source.url) });
  if (source.repository) {
    out.push({ kind: 'repository', label: `${source.repository}${source.reference ? `, ${source.reference}` : ''}`, href: null });
  }
  return out;
}

// What a bibliography sorts by: the first creator, then the year, then the
// title, then the id. Code-unit comparison and never localeCompare, so the
// list is the same list on every machine (build-index.mjs says why).
export function compareSources(a, b) {
  const key = (s) => [(s.creators ?? [])[0] ?? '', String(s.year ?? ''), s.title ?? '', s.id];
  const ka = key(a);
  const kb = key(b);
  for (let i = 0; i < ka.length; i += 1) {
    if (ka[i] < kb[i]) return -1;
    if (ka[i] > kb[i]) return 1;
  }
  return 0;
}

// The citers of one source, grouped in CITER_ORDER. The entries are the
// index's own — { kind, id, locator, dissent } — so this only arranges them.
export function groupCiters(citations = []) {
  const groups = new Map();
  for (const citation of citations) {
    if (!groups.has(citation.kind)) groups.set(citation.kind, []);
    groups.get(citation.kind).push(citation);
  }
  return CITER_ORDER
    .filter((kind) => groups.has(kind))
    .map((kind) => ({ kind, label: CITER_LABEL[kind] ?? kind, items: groups.get(kind) }))
    .concat([...groups.keys()]
      .filter((kind) => !CITER_ORDER.includes(kind))
      .sort()
      .map((kind) => ({ kind, label: CITER_LABEL[kind] ?? kind, items: groups.get(kind) })));
}
