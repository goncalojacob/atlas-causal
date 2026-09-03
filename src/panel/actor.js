// The actor's card: type, dates, seat, summary, the territory the map draws
// for it, and the events it appears in with the role it played in each. An
// actor is never on the timeline on its own — it is reached through its
// events and read alongside them — so a selected event wins the panel and
// this is what the panel falls back to.

import { esc } from '../util/esc.js';
import { formatInterval, formatYear, bounds } from '../util/dates.js';
import { ACTOR_TYPE_LABEL } from './event.js';

const DEPENDENCY_LABEL = Object.freeze({
  colony: 'colony',
  protectorate: 'protectorate',
  mandate: 'mandate',
  occupied: 'occupied',
});

// What the map draws for this actor, and when. Presences carry no text, so
// this is built entirely from the topology — no record fetched, however many
// periods an entity has. Two lists: the ground it held itself, and the ground
// it held through somebody else.
function territoryHtml(ctx, actor) {
  const own = ctx.atlas.presencesByActor.get(actor.id) ?? [];
  const held = ctx.atlas.dependenciesOf.get(actor.id) ?? [];
  if (own.length === 0 && held.length === 0) return '';
  const row = (presence, name) => {
    const kind = presence.dependencyKind ? `<span class="role">${esc(DEPENDENCY_LABEL[presence.dependencyKind] ?? presence.dependencyKind)}</span>` : '';
    const sovereign = presence.dependencyOf && presence.dependencyOf !== actor.id
      ? ` <span class="muted">of</span> <button type="button" class="link" data-action="actor" data-id="${esc(presence.dependencyOf)}">${esc(ctx.atlas.actors.get(presence.dependencyOf)?.name ?? presence.dependencyOf)}</button>`
      : '';
    return `<li class="actor-row">
      ${name}<span class="when">${esc(formatInterval(presence.when))}</span>
      ${kind}${sovereign}
      ${presence.capital ? `<span class="muted">${esc(presence.capital.label)}</span>` : ''}
      <button type="button" class="link small" data-action="year" data-year="${esc(bounds(presence.when.start).min)}">map at ${esc(formatYear(bounds(presence.when.start).min))}</button>
    </li>`;
  };
  const ownRows = own.map((p) => row(p, ''));
  const heldRows = held.map((p) => row(
    p,
    `<button type="button" class="link" data-action="actor" data-id="${esc(p.actor)}">${esc(ctx.atlas.actors.get(p.actor)?.name ?? p.actor)}</button> `,
  ));
  return `<section class="territory">
    ${own.length ? `<h2>Territory shown on the map <span class="count">${own.length} period${own.length === 1 ? '' : 's'}</span></h2>
      <p class="hint">The outline the map draws for this actor in a given year, and the capital the source names.</p>
      <ul class="actor-rows">${ownRows.join('')}</ul>` : ''}
    ${held.length ? `<h2>What it held <span class="count">${held.length}</span></h2>
      <ul class="actor-rows">${heldRows.join('')}</ul>` : ''}
  </section>`;
}

function actorCardHtml(ctx, actor) {
  const appearances = ctx.atlas.eventsByActor.get(actor.id) ?? [];
  const variants = (actor.names ?? []).slice(1);
  const rows = appearances.map(({ event, role }) => `<li class="actor-row">
    ${ctx.eventLink(event)} <span class="role">${esc(role)}</span>
    <span class="muted">${esc(ctx.laneLabel(event.region))}</span>
  </li>`);
  return `
    ${actor.status !== 'active' ? `<p class="notice status">This actor is <strong>${esc(actor.status)}</strong>.</p>` : ''}
    <header class="actor-head">
      <h2>${esc(actor.name)}</h2>
      <p class="meta">
        <span class="actor-type">${esc(ACTOR_TYPE_LABEL[actor.actorType] ?? actor.actorType)}</span>
        · <span class="when">${esc(formatInterval(actor.when))}</span>
        <button type="button" class="link small" data-action="clear-actor">stop highlighting</button>
      </p>
      ${variants.length ? `<p class="also-known muted">also: ${variants.map((n) => esc(n)).join(' · ')}</p>` : ''}
    </header>
    <section class="summary" data-slot="actor-summary"><p class="muted">Loading…</p></section>
    ${territoryHtml(ctx, actor)}
    <section class="actor-events">
      <h2>Where it appears <span class="count">${appearances.length}</span></h2>
      ${appearances.length ? `<ul class="actor-rows">${rows.join('')}</ul>` : '<p class="muted">No event records this actor yet.</p>'}
    </section>
    <section class="sources" data-slot="actor-sources"></section>`;
}

export function renderActorCard(ctx, { container, actor, mine }) {
  container.innerHTML = actorCardHtml(ctx, actor);
  ctx.atlas.record('actor', actor.id).then(
    (rec) => {
      if (!ctx.isCurrent(mine)) return;
      const place = rec.where ? ` <span class="where">${esc(rec.where.label)}</span>` : '';
      container.querySelector('[data-slot="actor-summary"]').innerHTML = `<p>${esc(rec.summary)}</p>${place ? `<p class="meta">${place}</p>` : ''}`;
      container.querySelector('[data-slot="actor-sources"]').innerHTML = ctx.citationsHtml(rec.sources, 'Sources for this actor');
    },
    () => {
      if (!ctx.isCurrent(mine)) return;
      container.querySelector('[data-slot="actor-summary"]').innerHTML = '<p class="muted">Could not load the record text.</p>';
    },
  );
}
