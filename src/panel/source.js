// The source's card: the citation as the record has it, its identifiers as
// links, and everything in the atlas that cites it, grouped by kind and each
// with its locator. It is the bibliography read from the other end — a
// source is written once and cited fifty times, and this is where those
// fifty are visible.
//
// The citer rows are one file per source since H3b, so opening a source
// costs one request and the section says it is loading until it lands; the
// sources index every page holds carries the count and no rows (A7). Long
// lists are cut: `cshapes-2-0` alone cites 1,041 records, and a thousand rows
// nobody scrolled to is a thousand rows the browser laid out — the first 200
// are drawn and the rest are one button away.
//
// A dissenting citation — one an edge made from its `dispute.sources` — is
// shown apart and marked, because a book that argues against a link is not
// evidence for it.

import { esc } from '../util/esc.js';
import { formatInterval } from '../util/dates.js';
import { citationText, identifiers, groupCiters } from '../citation.js';
import { TYPE_LABEL } from './event.js';

const TYPE_HINT = Object.freeze({
  book: 'book',
  chapter: 'chapter',
  article: 'article',
  thesis: 'thesis',
  primary: 'primary source',
  dataset: 'dataset',
  web: 'web',
});

export function identifiersHtml(source) {
  const ids = identifiers(source).map(({ label, href }) => (href
    ? `<a href="${esc(href)}" rel="noopener" target="_blank">${esc(label)}</a>`
    : `<span class="unsafe-url">${esc(label)}</span>`));
  return ids.length ? `<p class="identifiers">${ids.join(' · ')}</p>` : '';
}

// One citer, as a row that opens what cited it. An edge is not a card of its
// own: opening one walks its own single step, which is the only honest way
// to show a link — the panel then names both ends and loads the argument.
function citerRow(ctx, citation) {
  const { atlas } = ctx;
  const locator = citation.locator ? ` <span class="locator">${esc(citation.locator)}</span>` : '';
  const dissent = citation.dissent ? ' <span class="badge disputed">dissenting</span>' : '';
  if (citation.kind === 'event') {
    const event = atlas.events.get(citation.id);
    if (!event) return '';
    return `<li class="actor-row">${ctx.eventLink(event)}${locator}${dissent}</li>`;
  }
  if (citation.kind === 'edge') {
    const edge = atlas.edges.get(citation.id);
    if (!edge) return '';
    const from = atlas.events.get(edge.from);
    const to = atlas.events.get(edge.to);
    return `<li class="actor-row">
      <button type="button" class="link" data-action="follow-edge" data-edge="${esc(edge.id)}">${esc(from?.title ?? edge.from)}</button>
      <span class="arrow">${esc(TYPE_LABEL[edge.type] ?? edge.type)}</span>
      <button type="button" class="link" data-action="follow-edge" data-edge="${esc(edge.id)}">${esc(to?.title ?? edge.to)}</button>
      ${locator}${dissent}</li>`;
  }
  if (citation.kind === 'actor') {
    const actor = atlas.actors.get(citation.id);
    if (!actor) return '';
    return `<li class="actor-row"><button type="button" class="link" data-action="actor" data-id="${esc(actor.id)}">${esc(actor.name)}</button>${locator}${dissent}</li>`;
  }
  // A relation has no card of its own either: it is drawn as the two actors
  // with its type between them, and either name opens that actor's card,
  // where the relation is listed with everything else about it.
  if (citation.kind === 'relation') {
    const relation = atlas.relations?.get(citation.id);
    if (!relation) return '';
    const name = (id) => esc(atlas.actors.get(id)?.name ?? id);
    return `<li class="actor-row">
      <button type="button" class="link" data-action="actor" data-id="${esc(relation.from)}">${name(relation.from)}</button>
      <span class="arrow">${esc(relation.type)}</span>
      <button type="button" class="link" data-action="actor" data-id="${esc(relation.to)}">${name(relation.to)}</button>
      ${locator}${dissent}</li>`;
  }
  // A narrative is read as a walk rather than as a card of fields: the row
  // opens it at its first step.
  if (citation.kind === 'narrative') {
    const narrative = atlas.narratives?.get(citation.id);
    if (!narrative) return '';
    return `<li class="actor-row"><button type="button" class="link" data-action="narrative" data-id="${esc(narrative.id)}">${esc(narrative.title)}</button>${locator}${dissent}</li>`;
  }
  if (citation.kind === 'place') {
    const place = atlas.places.get(citation.id);
    if (!place) return '';
    return `<li class="actor-row"><button type="button" class="link" data-action="place" data-id="${esc(place.id)}">${esc(place.name)}</button>${locator}${dissent}</li>`;
  }
  if (citation.kind === 'presence') {
    const presence = atlas.presences.get(citation.id);
    if (!presence) return '';
    const actor = atlas.actors.get(presence.actor);
    return `<li class="actor-row">
      <button type="button" class="link" data-action="actor" data-id="${esc(presence.actor)}">${esc(actor?.name ?? presence.actor)}</button>
      <span class="when">${esc(formatInterval(presence.when))}</span>${locator}${dissent}</li>`;
  }
  return `<li class="actor-row"><code>${esc(citation.id)}</code>${locator}${dissent}</li>`;
}

// How many rows are drawn before the reader has to ask for the rest (A7).
export const CITER_LIMIT = 200;

// `citations` is null while the file is on its way, and a list once it is
// here. `all` is the reader having asked for the whole thing.
export function citersHtml(ctx, source, citations, { all = false } = {}) {
  const head = (extra = '') => `<section class="citers"><h2>What cites it${extra}</h2>`;
  if (citations === null) {
    return `${head()}<p class="muted">Loading what cites it…</p></section>`;
  }
  if (citations.length === 0) {
    return `${head()}<p class="muted">Nothing in the atlas cites this source yet.</p></section>`;
  }
  const shown = all ? citations : citations.slice(0, CITER_LIMIT);
  const hidden = citations.length - shown.length;
  const groups = groupCiters(shown).map((group) => {
    const rows = group.items.map((c) => citerRow(ctx, c)).filter(Boolean);
    if (rows.length === 0) return '';
    return `<h3>${esc(group.label)} <span class="count">${rows.length}</span></h3><ul class="actor-rows">${rows.join('')}</ul>`;
  }).join('');
  return `${head(` <span class="count">${citations.length}</span>`)}
    <p class="hint">Every record in the atlas that rests on this source, with the page or section each one names.</p>
    ${groups}
    ${hidden > 0 ? `<p class="muted"><button type="button" class="link" data-action="all-citers">Show the remaining ${hidden}</button></p>` : ''}
    </section>`;
}

// `citations` defaults to whatever the atlas already has for this source —
// the rows if the file is in hand, the empty list if nothing cites it, null
// while it is on its way — so a caller that is not the panel need not know
// where they came from.
export function sourceCardHtml(ctx, source, citations = ctx.atlas?.citersOf?.(source.id) ?? source.citations ?? null, options = {}) {
  const creators = (source.creators ?? []).join(', ');
  return `
    ${source.status !== 'active' ? `<p class="notice status">This source is <strong>${esc(source.status)}</strong>.</p>` : ''}
    <header class="source-head">
      <h2>${esc(source.title)}</h2>
      <p class="meta">
        ${creators ? `<span class="creators">${esc(creators)}</span>` : '<span class="muted">no creator recorded</span>'}
        ${source.year ? ` · <span class="when">${esc(source.year)}</span>` : ''}
        · <span class="source-type">${esc(TYPE_HINT[source.type] ?? source.type)}</span>
        <button type="button" class="link small" data-action="clear-source">close</button>
        ${ctx.lensControl('source', source.id)}
      </p>
      ${source.publisher ? `<p class="muted">${esc(source.publisher)}</p>` : ''}
      ${identifiersHtml(source)}
      ${source.accessed ? `<p class="muted">accessed ${esc(source.accessed)}</p>` : ''}
      ${ctx.discussLink('source', source.id)}
    </header>
    <p class="citation-full">${esc(citationText(source))}</p>
    ${citersHtml(ctx, source, citations, options)}`;
}

// The card, then the rows when they arrive. The section is replaced rather
// than the whole card: the head, the citation and whatever the reader has
// already got hold of stay where they are, which is the same discipline the
// event card follows when its record text lands (panel/event.js).
export function renderSourceCard(ctx, { container, source }) {
  const { atlas } = ctx;
  const swap = (rows, options) => {
    const section = container.querySelector('.citers');
    if (section) section.outerHTML = citersHtml(ctx, source, rows, options);
    const more = container.querySelector('[data-action="all-citers"]');
    if (more) more.addEventListener('click', () => swap(rows, { all: true }));
  };
  const known = atlas.citersOf ? atlas.citersOf(source.id) : source.citations ?? [];
  container.innerHTML = sourceCardHtml(ctx, source, known);
  if (known) {
    swap(known, {});
    return;
  }
  atlas.loadCiters(source.id).then(
    (rows) => {
      // The card may have been replaced while the file was in the air.
      if (container.querySelector('.citers')) swap(rows, {});
    },
    () => {
      const section = container.querySelector('.citers');
      if (section) section.outerHTML = '<section class="citers"><h2>What cites it</h2><p class="muted">The list of what cites this source could not be loaded.</p></section>';
    },
  );
}
