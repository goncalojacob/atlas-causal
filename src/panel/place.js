// The place's card: what it is called, where it is, everything that happened
// there in order, and the actors who turn up there most. A place is a thing
// with a history of its own — thirty-seven of the sixty records in the test
// dataset happened in Lisbon — and this is where that history is read.
//
// The window applies to the list the way it applies to the map: the events
// inside it are drawn plainly and the rest are faded rather than hidden,
// because a place's history does not stop at the edge of the band.

import { esc } from '../util/esc.js';
import { formatYear } from '../util/dates.js';
import { overlaps, resolveWindow } from '../util/window.js';
import { sectionHtml, openSection } from './sections.js';

// The section key of the list below, so panel.js can find it in the card it
// is about to rewrite without spelling the string a second time.
export const EVENTS_SECTION = 'events';

// The actors that appear most often at this place. Ties break by name, so the
// list is the same on every machine.
const MOST = 6;

function actorsHere(ctx, events) {
  const counts = new Map();
  for (const event of events) {
    for (const { actor } of event.actors ?? []) {
      const record = ctx.atlas.actors.get(actor);
      if (!record) continue;
      counts.set(actor, (counts.get(actor) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ record: ctx.atlas.actors.get(id), count }))
    .sort((a, b) => b.count - a.count
      || (a.record.name < b.record.name ? -1 : a.record.name > b.record.name ? 1 : 0))
    .slice(0, MOST);
}

// The place's own history, faded where it falls outside the band. The one
// part of any card the window decides, so it is a function of its own: when
// the band moves, panel.js rewrites this section rather than the card, and
// the two have to be the same list or the rewrite would be a second version
// of the rule (B12, A3).
export function placeEventsSection(ctx, place, state) {
  const events = ctx.atlas.eventsByPlace.get(place.id) ?? [];
  const window = resolveWindow(state, ctx.atlas.extent);
  const inside = events.filter((e) => overlaps(e.when, window)).length;
  const rows = events.map((event) => `<li class="actor-row ${overlaps(event.when, window) ? '' : 'faded'}">
    <span class="when">${esc(formatYear(ctx.startYear(event)))}</span>
    <button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>
    <span class="muted">${esc(ctx.laneLabel(event.region))}</span>
  </li>`);
  return {
    key: EVENTS_SECTION,
    label: 'What happened here',
    count: events.length,
    hint: events.length
      ? (inside === events.length ? 'All of them are inside the window.' : `${inside} of them ${inside === 1 ? 'is' : 'are'} inside the window; the rest are faded.`)
      : '',
    body: events.length ? `<ul class="actor-rows">${rows.join('')}</ul>` : '<p class="muted">No event happens here yet.</p>',
  };
}

export function placeCardHtml(ctx, place, state, { remembered = null } = {}) {
  const events = ctx.atlas.eventsByPlace.get(place.id) ?? [];
  const variants = (place.names ?? []).slice(1);
  const actors = actorsHere(ctx, events).map(({ record, count }) => `<li class="actor-row">
    <button type="button" class="link" data-action="actor" data-id="${esc(record.id)}">${esc(record.name)}</button>
    <span class="count">${count} event${count === 1 ? '' : 's'} here</span>
  </li>`);
  // The same arrangement as the other cards (sections.js). "What happened
  // here" is what a place opens on: it is the place's own history, and there
  // are no consequences on this card to fall back to.
  const sections = [placeEventsSection(ctx, place, state)];
  if (actors.length) {
    sections.push({
      key: 'actors', label: 'Who turns up here', count: actors.length, body: `<ul class="actor-rows">${actors.join('')}</ul>`,
    });
  }
  sections.push({
    key: 'sources',
    label: 'Sources',
    count: ctx.atlas.citationCount ? ctx.atlas.citationCount('place', place.id) : 0,
    // A place is a geographic fact and is exempt from "every node cites a
    // source" (M9), so most of these are empty and say so rather than
    // waiting on a fetch that will bring nothing.
    body: '<div data-slot="place-sources"><p class="muted">A place is a geographic fact and need cite nothing.</p></div>',
  });
  const open = openSection(sections.map((s) => s.key), { source: state.source, remembered });

  return `
    ${place.status !== 'active' ? `<p class="notice status">This place is <strong>${esc(place.status)}</strong>.</p>` : ''}
    ${events.length === 0 ? '<p class="notice no-events">No event here happens in this place, so the pictures are not narrowed to it.</p>' : ''}
    <header class="place-head">
      ${ctx.historyHtml()}
      <h2>${esc(place.name)}</h2>
      <p class="meta">
        <span class="where">${esc(place.where.lat.toFixed(2))}, ${esc(place.where.lon.toFixed(2))}
          <span class="muted">(${esc(place.where.precision)})</span></span>
        · <span class="lane">${esc(ctx.laneLabel(place.region))}</span>
        <button type="button" class="link small" data-action="clear-place">close</button>
        ${ctx.lensControl('place', place.id)}
      </p>
      ${variants.length ? `<p class="also-known muted">also: ${variants.map((n) => esc(n)).join(' · ')}</p>` : ''}
      <div class="head-links">${ctx.entryLink('place', place.id)}${ctx.wikipediaHtml(place)}${ctx.discussLink('place', place.id)}</div>
    </header>
    <section class="summary" data-slot="place-summary"></section>
    ${sections.map((s) => sectionHtml({ ...s, open: s.key === open })).join('')}`;
}

export function renderPlaceCard(ctx, { container, place, state, mine, remembered = null }) {
  container.innerHTML = placeCardHtml(ctx, place, state, { remembered });
  // A place needs no summary and usually has none, so the record is fetched
  // only for the text it might carry; nothing on the card waits for it.
  ctx.atlas.record('place', place.id).then(
    (rec) => {
      if (!ctx.isCurrent(mine)) return;
      if (rec.summary) container.querySelector('[data-slot="place-summary"]').innerHTML = `<p>${esc(rec.summary)}</p>`;
      if (rec.sources?.length) {
        container.querySelector('[data-slot="place-sources"]').innerHTML = ctx.citationsHtml(rec.sources, '', rec);
      }
    },
    () => {},
  );
}
