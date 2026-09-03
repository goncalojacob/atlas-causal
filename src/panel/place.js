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

function placeCardHtml(ctx, place, state) {
  const events = ctx.atlas.eventsByPlace.get(place.id) ?? [];
  const window = resolveWindow(state, ctx.atlas.extent);
  const variants = (place.names ?? []).slice(1);
  const inside = events.filter((e) => overlaps(e.when, window)).length;
  const rows = events.map((event) => `<li class="actor-row ${overlaps(event.when, window) ? '' : 'faded'}">
    <span class="when">${esc(formatYear(ctx.startYear(event)))}</span>
    <button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>
    <span class="muted">${esc(ctx.laneLabel(event.region))}</span>
  </li>`);
  const actors = actorsHere(ctx, events).map(({ record, count }) => `<li class="actor-row">
    <button type="button" class="link" data-action="actor" data-id="${esc(record.id)}">${esc(record.name)}</button>
    <span class="count">${count} event${count === 1 ? '' : 's'} here</span>
  </li>`);
  return `
    ${place.status !== 'active' ? `<p class="notice status">This place is <strong>${esc(place.status)}</strong>.</p>` : ''}
    <header class="place-head">
      <h2>${esc(place.name)}</h2>
      <p class="meta">
        <span class="where">${esc(place.where.lat.toFixed(2))}, ${esc(place.where.lon.toFixed(2))}
          <span class="muted">(${esc(place.where.precision)})</span></span>
        · <span class="lane">${esc(ctx.laneLabel(place.region))}</span>
        <button type="button" class="link small" data-action="clear-place">close</button>
      </p>
      ${variants.length ? `<p class="also-known muted">also: ${variants.map((n) => esc(n)).join(' · ')}</p>` : ''}
    </header>
    <section class="summary" data-slot="place-summary"></section>
    <section class="place-events">
      <h2>What happened here <span class="count">${events.length}</span></h2>
      ${events.length
    ? `<p class="hint">${inside === events.length ? 'All of them are inside the window.' : `${inside} of them ${inside === 1 ? 'is' : 'are'} inside the window; the rest are faded.`}</p>
        <ul class="actor-rows">${rows.join('')}</ul>`
    : '<p class="muted">No event happens here yet.</p>'}
    </section>
    ${actors.length ? `<section class="place-actors">
      <h2>Who turns up here <span class="count">${actors.length}</span></h2>
      <ul class="actor-rows">${actors.join('')}</ul>
    </section>` : ''}
    <section class="sources" data-slot="place-sources"></section>`;
}

export function renderPlaceCard(ctx, { container, place, state, mine }) {
  container.innerHTML = placeCardHtml(ctx, place, state);
  // A place needs no summary and usually has none, so the record is fetched
  // only for the text it might carry; nothing on the card waits for it.
  ctx.atlas.record('place', place.id).then(
    (rec) => {
      if (!ctx.isCurrent(mine)) return;
      if (rec.summary) container.querySelector('[data-slot="place-summary"]').innerHTML = `<p>${esc(rec.summary)}</p>`;
      container.querySelector('[data-slot="place-sources"]').innerHTML = ctx.citationsHtml(rec.sources, 'Sources for this place');
    },
    () => {},
  );
}
