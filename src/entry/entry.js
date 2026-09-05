// The full entry, as markup. One page for the three kinds that are about a
// thing in the world — an event, an actor, a place — because a reader who
// wants to read about one of them wants the same things about each: what it
// is, when it was, what it touches, the long text, and where all of that
// came from.
//
// Pure: topology and a fetched record in, a string out, so node --test holds
// it to what it draws. main.js is the half that fetches and assigns.
//
// Every link here is an <a href>, never a button with a data-action: this is
// a page, and a page's links are the browser's — they open in a new tab, they
// can be copied, and they work before any script has run.

import { esc, safeUrl } from '../util/esc.js';
import { formatInterval } from '../util/dates.js';
import { renderBody, tocHtml } from '../markdown.js';
import { identifiers, containerText } from '../citation.js';
import { articleFor } from '../wikipedia.js';
import { ACTOR_TYPE_LABEL } from '../panel/event.js';
import { RELATION_LABEL, RELATION_ORDER } from '../panel/actor.js';

// The kinds with a page. Anything else — an edge, a narrative, a source — is
// read inside the atlas, and the page says so rather than pretending.
export const ENTRY_KINDS = Object.freeze(['event', 'actor', 'place']);

// Which of the atlas's own parameters opens a record: the way back, and what
// a link from one entry to the atlas means.
const ATLAS_PARAM = Object.freeze({ event: 'selected', actor: 'actor', place: 'place', source: 'source', narrative: 'narrative' });

// The two link builders the page needs, with the fixture flag carried through
// both: a reader who opened the synthetic dataset stays in it, and a link
// that quietly dropped the flag would take them to a page about nothing.
export function createLinks({ fixtures = false } = {}) {
  const tail = fixtures ? '&fixtures=1' : '';
  return {
    entry: (kind, id) => (ENTRY_KINDS.includes(kind)
      ? `entry.html?id=${encodeURIComponent(id)}${tail}`
      : `index.html?${ATLAS_PARAM[kind] ?? 'selected'}=${encodeURIComponent(id)}${tail}`),
    atlas: (kind, id) => `index.html?${ATLAS_PARAM[kind] ?? 'selected'}=${encodeURIComponent(id)}${tail}`,
  };
}

export function displayName(record) {
  if (!record) return '';
  return record.title ?? (record.names ?? [])[0] ?? record.name ?? record.id;
}

function wikipediaHtml(record, languages) {
  const article = articleFor(record, languages);
  const href = article ? safeUrl(article.href) : null;
  if (!href) return '';
  return `<p class="wikipedia"><a href="${esc(href)}" rel="noopener" target="_blank">Read more on Wikipedia</a>
    <span class="muted">${esc(article.title)} · ${esc(article.lang)}</span></p>`;
}

// One citation, as a bibliography line with an anchor the body's marks aim
// at. `mark` is the number the entry gave it, when the entry cited it: a work
// the record rests on but the entry never names is still listed, unnumbered,
// because the record rests on it either way.
function citationHtml(source, { mark = null, locators = [], links = createLinks() } = {}) {
  const ids = identifiers(source).map(({ label, href }) => (href
    ? `<a href="${esc(href)}" rel="noopener" target="_blank">${esc(label)}</a>`
    : `<span class="unsafe-url">${esc(label)}</span>`));
  return `<li class="citation" id="entry-cite-${esc(source.id)}">
    ${mark === null ? '' : `<span class="cite-number">[${esc(mark)}]</span>`}
    <span class="creators">${esc((source.creators ?? []).join(', '))}</span>${source.year ? ` (${esc(source.year)})` : ''}.
    <a href="${esc(links.atlas('source', source.id))}"><em>${esc(source.title)}</em></a>.
    ${containerText(source.container) ? `<span class="container">${esc(containerText(source.container))}</span>` : ''}${source.publisher ? ` ${esc(source.publisher)}.` : ''}
    ${locators.length ? `<span class="locator">${esc(locators.join('; '))}.</span>` : ''}
    <span class="identifiers">${ids.join(' · ')}</span>
    ${source.status !== 'active' ? `<span class="badge status">${esc(source.status)}</span>` : ''}
  </li>`;
}

// Everything the record rests on, resolved: the works the entry cites first,
// in the order it first names them and numbered to match its marks, then the
// rest of the record's own sources. One list, because a reader following a
// mark and a reader asking "what is this built on" are looking for the same
// shelf.
function sourcesHtml(atlas, record, { order = [], citations = [] }, links = createLinks()) {
  const cited = (record.sources ?? []).map((c) => c.source);
  const locators = new Map();
  for (const { source, locator } of citations) {
    if (!locators.has(source)) locators.set(source, []);
    if (locator && !locators.get(source).includes(locator)) locators.get(source).push(locator);
  }
  const inOrder = [...order.filter((id) => cited.includes(id)), ...cited.filter((id) => !order.includes(id))];
  const rows = inOrder.map((id) => {
    const source = atlas.sources.get(id);
    const mark = order.indexOf(id) < 0 ? null : order.indexOf(id) + 1;
    if (!source) return `<li class="citation missing">unknown source <code>${esc(id)}</code></li>`;
    const own = (record.sources ?? []).find((c) => c.source === id);
    const all = [...locators.get(id) ?? []];
    if (own?.locator && !all.includes(own.locator)) all.unshift(own.locator);
    return citationHtml(source, { mark, locators: all, links });
  });
  if (rows.length === 0) {
    return `<section class="entry-sources"><h2>Sources</h2>
      <p class="muted">This record cites nothing. A place is a geographic fact rather than an
      argument, so it needs no source; anything else here without one is a gap.</p></section>`;
  }
  return `<section class="entry-sources"><h2>Sources <span class="count">${rows.length}</span></h2>
    <ul class="citations">${rows.join('')}</ul></section>`;
}

// The narratives that walk this record: the same "Part of" the panel shows,
// as links into the atlas at the step, because a narrative is read there.
function partOfHtml(atlas, links, id) {
  const walking = atlas.narrativesByRef.get(id) ?? [];
  if (walking.length === 0) return '';
  const items = walking.map((n) => `<li><a href="${esc(links.atlas('narrative', n.id))}">${esc(n.title)}</a>
    <span class="muted">${esc(n.summary)}</span></li>`);
  return `<section class="entry-narratives"><h2>Part of <span class="count">${walking.length}</span></h2>
    <p class="hint">Accounts that walk through this record. Each is somebody's argument, signed and cited.</p>
    <ul class="entry-list">${items.join('')}</ul></section>`;
}

function actorsHtml(atlas, links, record) {
  const listed = (record.actors ?? []).filter((a) => atlas.actors.has(a.actor));
  if (listed.length === 0) return '';
  const chips = listed.map(({ actor, role }) => {
    const entry = atlas.actors.get(actor);
    return `<a class="chip" href="${esc(links.entry('actor', actor))}">${esc(entry.name)}
      <span class="role">${esc(role)}</span></a>`;
  });
  return `<section class="entry-actors"><h2>Who is in it <span class="count">${listed.length}</span></h2>
    <p class="chips">${chips.join(' ')}</p></section>`;
}

function relationsHtml(atlas, links, record) {
  const standing = atlas.relationsByActor.get(record.id) ?? [];
  if (standing.length === 0) return '';
  const groups = new Map();
  for (const { relation, direction, other } of standing) {
    const key = `${relation.type}:${relation.type === 'allied-with' ? 'out' : direction}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ relation, other });
  }
  const sections = [];
  for (const key of RELATION_ORDER) {
    const rows = groups.get(key);
    if (!rows) continue;
    const [type, direction] = key.split(':');
    const items = rows.map(({ relation, other }) => `<li>
      <a href="${esc(links.entry('actor', other))}">${esc(atlas.actors.get(other)?.name ?? other)}</a>
      <span class="when">${esc(formatInterval(relation.when))}</span>
      ${relation.note ? `<span class="muted">${esc(relation.note)}</span>` : ''}</li>`);
    sections.push(`<h3>${esc(RELATION_LABEL[type][direction])}</h3><ul class="entry-list">${items.join('')}</ul>`);
  }
  return `<section class="entry-relations"><h2>Relations <span class="count">${standing.length}</span></h2>
    ${sections.join('')}</section>`;
}

function eventsHereHtml(atlas, links, record) {
  const here = atlas.eventsByPlace.get(record.id) ?? [];
  if (here.length === 0) return '';
  const items = here.map((event) => `<li><a href="${esc(links.entry('event', event.id))}">${esc(event.title)}</a>
    <span class="when">${esc(formatInterval(event.when))}</span></li>`);
  return `<section class="entry-events"><h2>What happened here <span class="count">${here.length}</span></h2>
    <ul class="entry-list">${items.join('')}</ul></section>`;
}

function appearancesHtml(atlas, links, record) {
  const appearances = atlas.eventsByActor.get(record.id) ?? [];
  if (appearances.length === 0) return '';
  const items = appearances.map(({ event, role }) => `<li><a href="${esc(links.entry('event', event.id))}">${esc(event.title)}</a>
    <span class="when">${esc(formatInterval(event.when))}</span> <span class="role">${esc(role)}</span></li>`);
  return `<section class="entry-events"><h2>Where it appears <span class="count">${appearances.length}</span></h2>
    <ul class="entry-list">${items.join('')}</ul></section>`;
}

// The meta line under the title: the dates, and where the thing was.
function metaHtml(atlas, links, kind, record, topologyEntry) {
  const parts = [];
  if (record.when) parts.push(`<span class="when">${esc(formatInterval(record.when))}</span>`);
  if (kind === 'event') {
    const place = typeof record.place === 'string' ? atlas.places.get(record.place) : null;
    if (place) parts.push(`<a href="${esc(links.entry('place', place.id))}">${esc(place.name ?? place.id)}</a>`);
    else parts.push('<span class="muted">no place: timeline only</span>');
    const lane = atlas.regions.find((r) => r.id === (topologyEntry?.region ?? record.region));
    if (lane) parts.push(`<span class="lane">${esc(lane.label)}</span>`);
  }
  if (kind === 'actor') {
    parts.unshift(`<span class="actor-type">${esc(ACTOR_TYPE_LABEL[record.actorType] ?? record.actorType)}</span>`);
    if (record.where?.label) parts.push(`<span class="where">${esc(record.where.label)}</span>`);
  }
  if (kind === 'place' && record.where) {
    parts.push(`<span class="where">${esc(record.where.label)} <span class="muted">(${esc(record.where.precision)})</span></span>`);
  }
  return `<p class="meta">${parts.join(' · ')}</p>`;
}

// The entry itself, or the notice that stands in for one. A record with no
// entry written is the common case for a long time yet, and the page says so
// plainly and asks for the entry rather than looking broken.
function bodyHtml(atlas, links, record) {
  if (typeof record.body !== 'string' || record.body.trim() === '') {
    return {
      html: `<section class="entry-body empty">
        <h2>The full entry</h2>
        <p>Nobody has written the long entry for this record yet. What is above is the summary the
        cards show — a sentence or two — and an entry is the extensive text under it: what happened,
        what is argued about it, and what each claim rests on.</p>
        <p class="hint">Entries are written by people, from any sources they can cite. If you want to
        write this one, <a href="contribute.html">the contribution form</a> has a field for it, and
        <a href="CONTRIBUTING.md">CONTRIBUTING.md</a> says what the text may contain.</p>
      </section>`,
      order: [],
      citations: [],
    };
  }
  const cited = new Set((record.sources ?? []).map((c) => c.source));
  const rendered = renderBody(record.body, {
    cited,
    href: (kind, id) => links.entry(kind, id),
  });
  return {
    html: `${tocHtml(rendered.headings)}
      <section class="entry-body"><h2>The full entry</h2>${rendered.html}</section>`,
    order: rendered.order,
    citations: rendered.citations,
  };
}

// record: the whole record file, as fetched. topologyEntry: what the index
// says about it, which is where a derived region lives.
export function entryHtml(atlas, {
  kind, record, topologyEntry = null, found = null, links = createLinks(), languages = [],
} = {}) {
  const notices = (found?.via ?? []).map((v) => (v.reason === 'alias'
    ? `<p class="notice"><code>${esc(v.id)}</code> is a former id of this record.</p>`
    : `<p class="notice"><code>${esc(v.id)}</code> was merged into this record.</p>`));
  if (record.status !== 'active') {
    notices.push(`<p class="notice status">This record is <strong>${esc(record.status)}</strong>. It is kept
      so that links to it still resolve; what it says is no longer part of the atlas.</p>`);
  }
  const variants = kind === 'event' ? [] : (record.names ?? []).slice(1);
  const entry = bodyHtml(atlas, links, record);

  return `
    ${notices.join('')}
    <header class="entry-head">
      <p class="entry-kind">${esc(kind)}</p>
      <h1>${esc(displayName(record))}</h1>
      ${metaHtml(atlas, links, kind, record, topologyEntry)}
      ${variants.length ? `<p class="also-known muted">also: ${variants.map((n) => esc(n)).join(' · ')}</p>` : ''}
      <p class="entry-back"><a href="${esc(links.atlas(kind, record.id))}">Open this on the map and the timeline →</a></p>
      ${wikipediaHtml(record, languages)}
    </header>
    ${record.summary ? `<section class="entry-summary"><p>${esc(record.summary)}</p></section>` : ''}
    ${kind === 'event' ? actorsHtml(atlas, links, record) : ''}
    ${kind === 'actor' ? relationsHtml(atlas, links, record) : ''}
    ${entry.html}
    ${sourcesHtml(atlas, record, entry, links)}
    ${kind === 'actor' ? appearancesHtml(atlas, links, record) : ''}
    ${kind === 'place' ? eventsHereHtml(atlas, links, record) : ''}
    ${partOfHtml(atlas, links, record.id)}
  `;
}

// What the page shows when the id names something real that has no entry page
// of its own: an edge, a narrative, a source. Not an error — the record
// exists — so it is a way through rather than a dead end.
export function elsewhereHtml(kind, id, links = createLinks()) {
  return `<header class="entry-head"><p class="entry-kind">${esc(kind)}</p>
    <h1>Read inside the atlas</h1></header>
    <section class="entry-body"><p>A full entry is written about an event, an actor or a place.
    <code>${esc(id)}</code> is ${kind === 'edge' ? 'a link between events' : `a ${esc(kind)}`}, which is read
    where it stands: <a href="${esc(links.atlas(kind, id))}">open it in the atlas</a>.</p></section>`;
}

export function notFoundHtml(id) {
  return `<header class="entry-head"><h1>Not found</h1></header>
    <section class="entry-body"><p>No record with id <code>${esc(id)}</code>.</p>
    <p class="hint">Former ids keep working, so this is a link to something that never existed or a
    typing mistake. <a href="index.html">The atlas</a> has a search box.</p></section>`;
}
