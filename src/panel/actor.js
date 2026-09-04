// The actor's card: type, dates, seat, summary, the territory the map draws
// for it, and the events it appears in with the role it played in each.
// "Show only these" is the lens — the other views hold this actor's events
// and nothing else — and is not the same as the highlight above it, which
// leaves everything drawn and emphasises some of it. An
// actor is never on the timeline on its own — it is reached through its
// events and read alongside them — so a selected event wins the panel and
// this is what the panel falls back to.

import { esc } from '../util/esc.js';
import { formatInterval, formatYear, bounds } from '../util/dates.js';
import { ACTOR_TYPE_LABEL } from './event.js';

// What a relation is called from each end. The same record reads two ways —
// "Regime of Portugal" on the Estado Novo's card and "Regimes" on Portugal's —
// which is the whole reason the card groups by type *and* direction.
// `allied-with` is symmetric and is the one type whose two directions are one
// group.
const RELATION_LABEL = Object.freeze({
  'regime-of': { out: 'Regime of', in: 'Regimes' },
  succeeded: { out: 'Succeeded by', in: 'Successor of' },
  'member-of': { out: 'Member of', in: 'Members' },
  'part-of': { out: 'Part of', in: 'Parts of it' },
  led: { out: 'Led', in: 'Led by' },
  'allied-with': { out: 'Allied with', in: 'Allied with' },
});

// The order the groups are drawn in: what this actor is, then what it was
// made of, then who ran it, then who it stood beside.
const RELATION_ORDER = Object.freeze([
  'regime-of:out', 'regime-of:in', 'succeeded:out', 'succeeded:in',
  'part-of:out', 'part-of:in', 'member-of:out', 'member-of:in',
  'led:out', 'led:in', 'allied-with:out',
]);

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
    // Three cells: what, when, and the way in. Everything else — the kind of
    // dependency, whose it was, the capital — is a second line under them, so
    // that a dozen periods read as a table and not as a dozen paragraphs.
    return `<li class="actor-row">
      <span class="row-what">${name || `<span class="muted">its own ground</span>`}</span>
      <span class="when">${esc(formatInterval(presence.when))}</span>
      <button type="button" class="link small row-go" data-action="year" data-year="${esc(bounds(presence.when.start).min)}">map at ${esc(formatYear(bounds(presence.when.start).min))}</button>
      ${kind || sovereign || presence.capital ? `<span class="row-meta">${kind}${sovereign}
        ${presence.capital ? `<span class="muted">${esc(presence.capital.label)}</span>` : ''}</span>` : ''}
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

// The relations this actor stands in, both ways round, grouped by type. Built
// from the topology alone — a relation carries its note there — so however
// many of them an actor has, the card costs no further request.
function relationsHtml(ctx, actor) {
  const standing = ctx.atlas.relationsByActor.get(actor.id) ?? [];
  if (standing.length === 0) return '';
  const groups = new Map();
  for (const { relation, direction, other } of standing) {
    // Symmetric: an alliance read from either end says the same thing, so
    // both directions land in one group.
    const key = `${relation.type}:${relation.type === 'allied-with' ? 'out' : direction}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ relation, other });
  }
  const sections = [];
  for (const key of RELATION_ORDER) {
    const rows = groups.get(key);
    if (!rows) continue;
    const [type, direction] = key.split(':');
    const items = rows.map(({ relation, other }) => `<li class="actor-row">
      <span class="row-what"><button type="button" class="link" data-action="actor" data-id="${esc(other)}">${esc(ctx.atlas.actors.get(other)?.name ?? other)}</button></span>
      <span class="when">${esc(formatInterval(relation.when))}</span>
      ${relation.note ? `<span class="row-meta muted">${esc(relation.note)}</span>` : ''}
    </li>`);
    sections.push(`<h3>${esc(RELATION_LABEL[type][direction])}</h3><ul class="actor-rows">${items.join('')}</ul>`);
  }
  return `<section class="relations">
    <h2>Relations <span class="count">${standing.length}</span></h2>
    <p class="hint">Links between actors, not between events: who a body belonged to, who led it, what came after it.</p>
    ${sections.join('')}
  </section>`;
}

// Exported for the tests: there is no DOM in node --test, and the card is
// the string, exactly as the source card is.
export function actorCardHtml(ctx, actor) {
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
        ${ctx.lensControl('actor', actor.id)}
      </p>
      ${variants.length ? `<p class="also-known muted">also: ${variants.map((n) => esc(n)).join(' · ')}</p>` : ''}
      ${ctx.wikipediaHtml(actor)}
    </header>
    <section class="summary" data-slot="actor-summary"><p class="muted">Loading…</p></section>
    ${relationsHtml(ctx, actor)}
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
