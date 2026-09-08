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
import { RELATION_LABEL, RELATION_GROUP_ORDER } from '../vocab.js';
import { sectionHtml, openSection } from './sections.js';
import { officeStripsSection } from './office.js';
import { attributionHtml } from '../licensing.js';

// What a relation is called from each end, and the order the groups are drawn
// in: both from the one list of relation types (vocab.js), which is also
// where rule 19's endpoints live, so a seventh type cannot arrive with an
// endpoint rule and no label.
export { RELATION_LABEL };
export const RELATION_ORDER = RELATION_GROUP_ORDER;

const DEPENDENCY_LABEL = Object.freeze({
  colony: 'colony',
  protectorate: 'protectorate',
  mandate: 'mandate',
  occupied: 'occupied',
});

// What the map draws for this actor, and when. Presences carry no text, so
// this is built entirely from the index — no record fetched, however many
// periods an entity has. Two lists: the ground it held itself, and the ground
// it held through somebody else.
//
// Since I1 the presence metadata is its own file and is not in hand when the
// card is first drawn, so this answers null while it is on its way and the
// card draws a "loading" line in place of the section, exactly as the source
// card does for its citers. Null once it has landed means what it always
// meant: this actor held no ground, and there is no section at all.
export function territoryHtml(ctx, actor) {
  const own = ctx.atlas.presencesByActor.get(actor.id) ?? [];
  const held = ctx.atlas.dependenciesOf.get(actor.id) ?? [];
  if (own.length === 0 && held.length === 0) return null;
  const row = (presence, name) => {
    const kind = presence.dependencyKind ? `<span class="role">${esc(DEPENDENCY_LABEL[presence.dependencyKind] ?? presence.dependencyKind)}</span>` : '';
    const sovereign = presence.dependencyOf && presence.dependencyOf !== actor.id
      ? ` <span class="muted">of</span> <button type="button" class="link" data-action="actor" data-id="${esc(presence.dependencyOf)}">${esc(ctx.atlas.actors.get(presence.dependencyOf)?.name ?? presence.dependencyOf)}</button>`
      : '';
    // Three cells: what, when, and the way in. Everything else — the kind of
    // dependency, whose it was, the capital — is a second line under them, so
    // that a dozen periods read as a table and not as a dozen paragraphs.
    return `<li class="actor-row">
      <span class="row-what">${name}</span>
      <span class="when">${esc(formatInterval(presence.when))}</span>
      <button type="button" class="link small row-go" data-action="year" data-year="${esc(bounds(presence.when.start).min)}">map at ${esc(formatYear(bounds(presence.when.start).min))}</button>
      ${kind || sovereign || presence.capital ? `<span class="row-meta">${kind}${sovereign}
        ${presence.capital ? `<span class="muted">${esc(presence.capital.label)}</span>` : ''}</span>` : ''}
    </li>`;
  };
  // The actor's own name in the first column rather than an empty cell: a
  // table with a blank first column is a list of dates nobody can scan.
  const ownRows = own.map((p) => row(p, `<span class="muted">${esc(actor.name)}</span>`));
  const heldRows = held.map((p) => row(
    p,
    `<button type="button" class="link" data-action="actor" data-id="${esc(p.actor)}">${esc(ctx.atlas.actors.get(p.actor)?.name ?? p.actor)}</button> `,
  ));
  return {
    count: own.length + held.length,
    body: `<div class="territory">
      ${own.length ? `<h3>Shown on the map <span class="count">${own.length} period${own.length === 1 ? '' : 's'}</span></h3>
        <p class="hint">The outline the map draws for this actor in a given year, and the capital the source names.</p>
        <ul class="actor-rows">${ownRows.join('')}</ul>` : ''}
      ${held.length ? `<h3>What it held <span class="count">${held.length}</span></h3>
        <ul class="actor-rows">${heldRows.join('')}</ul>` : ''}
    </div>`,
  };
}

// Whether the atlas has the presence metadata yet. An atlas that predates
// `loadPresences` — the build's own, a hand-made one in a test — has it by
// construction and says so.
const territoryKnown = (ctx) => (ctx.atlas.presencesLoaded ? ctx.atlas.presencesLoaded() : true);

// The Territory section, or none. Three states and not two: the list, the
// "loading" line while the file is on its way, and nothing at all for an
// actor that held no ground — which is most of them, so a permanent empty
// section would be a lie on nearly every card.
export function territorySection(ctx, actor) {
  const territory = territoryHtml(ctx, actor);
  if (territory) return { key: 'territory', label: 'Territory', ...territory };
  if (territoryKnown(ctx)) return null;
  return { key: 'territory', label: 'Territory', count: null, body: '<p class="muted">Loading…</p>' };
}

// The relations this actor stands in, both ways round, grouped by type. Built
// from the topology alone — a relation carries its note there — so however
// many of them an actor has, the card costs no further request.
function relationsHtml(ctx, actor) {
  const standing = ctx.atlas.relationsByActor.get(actor.id) ?? [];
  if (standing.length === 0) return null;
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
  return {
    count: standing.length,
    hint: 'Links between actors, not between events: who a body belonged to, who led it, what came after it.',
    body: `<div class="relations">${sections.join('')}</div>`,
  };
}

// One appearance: the event, what this actor did in it, the note beside that
// role where the line carries one, and the lane it is drawn in. The note is
// the line's and not the actor's — "as prime minister" belongs to this event
// and to no other — which is why it is here and not in the head.
function appearanceRow(ctx, { event, role, note }) {
  return `<li class="actor-row">
    ${ctx.eventLink(event)} <span class="role">${esc(role)}</span>
    ${note ? `<span class="row-note muted">${esc(note)}</span>` : ''}
    <span class="muted">${esc(ctx.laneLabel(event.region))}</span>
  </li>`;
}

// What came before this actor and what came after, along `succeeded`, with
// **their** events.
//
// The M27 splits made seventy-seven pairs like Angola: a CShapes state from
// 1975 and a colony before it, with the same name in the search box and every
// event filed under the colony. `?actor=angola` then opened a card with no
// appearances at all, which reads as "nothing happened here" and is the
// opposite of what the atlas holds (health review B, finding 28). A reader who
// has asked about a polity has asked about the thing it succeeded too.
//
// Only `succeeded`, and both ways round: "Before" is what this actor is the
// successor of, "After" is what succeeded it. Not `regime-of` or `part-of` —
// those are a body inside a state rather than the same ground under another
// name, and rolling their events in here would say the two were one.
function successionHtml(ctx, actor) {
  const standing = (ctx.atlas.relationsByActor.get(actor.id) ?? [])
    .filter(({ relation }) => relation.type === 'succeeded');
  if (standing.length === 0) return null;
  // `in` is "Successor of": the other actor came first. `out` is "Succeeded
  // by": the other one came after.
  const groups = [
    { direction: 'in', label: 'Before', rows: standing.filter((r) => r.direction === 'in') },
    { direction: 'out', label: 'After', rows: standing.filter((r) => r.direction === 'out') },
  ].filter((g) => g.rows.length > 0);

  let total = 0;
  const sections = groups.map((group) => {
    const parts = group.rows.map(({ relation, other }) => {
      const name = ctx.atlas.actors.get(other)?.name ?? other;
      const events = ctx.atlas.eventsByActor.get(other) ?? [];
      total += events.length;
      const rows = events.map((row) => appearanceRow(ctx, row));
      return `<h3>${esc(group.label)} <span class="when">${esc(formatInterval(relation.when))}</span>
          <button type="button" class="link" data-action="actor" data-id="${esc(other)}">${esc(name)}</button>
          <span class="count">${events.length} event${events.length === 1 ? '' : 's'}</span></h3>
        ${events.length
    ? `<ul class="actor-rows">${rows.join('')}</ul>`
    : '<p class="muted">No event records that one either.</p>'}`;
    });
    return parts.join('');
  });

  return {
    count: total,
    hint: 'The same ground under another name. These events are filed under the actor that held it at the time, not under this one.',
    body: `<div class="succession">${sections.join('')}</div>`,
  };
}

// Exported for the tests: there is no DOM in node --test, and the card is
// the string, exactly as the source card is.
export function actorCardHtml(ctx, actor, { state = null, remembered = null } = {}) {
  const appearances = ctx.atlas.eventsByActor.get(actor.id) ?? [];
  const variants = (actor.names ?? []).slice(1);
  const narratives = ctx.atlas.narrativesByRef?.get(actor.id) ?? [];
  const rows = appearances.map((row) => appearanceRow(ctx, row));
  const relations = relationsHtml(ctx, actor);
  const territory = territorySection(ctx, actor);

  // The same arrangement the event card has (sections.js): the head and
  // whatever text there is, then one collapsible section per question with
  // its count in the header.
  const succession = successionHtml(ctx, actor);
  const appearancesSection = {
    key: 'appearances',
    label: 'Where it appears',
    count: appearances.length,
    body: appearances.length ? `<ul class="actor-rows">${rows.join('')}</ul>` : '<p class="muted">No event records this actor yet.</p>',
  };
  const successionSection = succession ? { key: 'succession', label: 'Before and after', ...succession } : null;
  // With no appearances of its own, what came before is the first thing to
  // show and the section the card opens on: `openSection` falls back to the
  // first key, and a card that opened on an empty list to say "nothing
  // happened here" is the whole of finding 28.
  const sections = appearances.length === 0 && successionSection
    ? [successionSection, appearancesSection]
    : [appearancesSection, ...(successionSection ? [successionSection] : [])];
  if (relations) sections.push({ key: 'relations', label: 'Relations', ...relations });
  // The posts that belong to this actor, each as a strip of its holders
  // (office.js). Between the relations and the territory because it is the
  // same kind of question — what this body is made of — asked of its own
  // offices rather than of its links.
  const offices = officeStripsSection(ctx, actor);
  if (offices) sections.push(offices);
  if (territory) sections.push(territory);
  sections.push({
    key: 'sources',
    label: 'Sources',
    count: ctx.atlas.citationCount ? ctx.atlas.citationCount('actor', actor.id) : 0,
    body: '<div data-slot="actor-sources"><p class="muted">Loading…</p></div>',
  });
  if (narratives.length > 0) {
    sections.push({ key: 'part-of', label: 'Part of', count: narratives.length, body: ctx.partOfHtml(actor.id, { bare: true }) });
  }
  // An actor's card has no consequences to fall back to, so "where it
  // appears" is what it opens on: it is the actor's own history.
  const open = openSection(sections.map((s) => s.key), {
    source: state?.source ?? null, remembered,
  });

  return `
    ${actor.status !== 'active' ? `<p class="notice status">This actor is <strong>${esc(actor.status)}</strong>.</p>` : ''}
    ${appearances.length === 0 ? `<p class="notice no-events">No event here names this actor, so the pictures are not narrowed to it${successionSection ? ' — see <em>Before and after</em>' : ''}.</p>` : ''}
    <header class="actor-head">
      ${ctx.historyHtml()}
      <h2>${esc(actor.name)}</h2>
      <p class="meta">
        <span class="actor-type">${esc(ACTOR_TYPE_LABEL[actor.actorType] ?? actor.actorType)}</span>
        · <span class="when">${esc(formatInterval(actor.when))}</span>
        <button type="button" class="link small" data-action="clear-actor">stop highlighting</button>
        ${ctx.lensControl('actor', actor.id)}
      </p>
      ${variants.length ? `<p class="also-known muted">also: ${variants.map((n) => esc(n)).join(' · ')}</p>` : ''}
      <div class="head-links">${ctx.entryLink('actor', actor.id)}${ctx.wikipediaHtml(actor)}${ctx.discussLink('actor', actor.id)}</div>
    </header>
    <section class="summary" data-slot="actor-summary"><p class="muted">Loading…</p></section>
    ${sections.map((s) => sectionHtml({ ...s, open: s.key === open })).join('')}`;
}

// The Territory section rewritten in place once the presence file lands, the
// way the source card rewrites its citers: the head, the summary and whatever
// the reader has already opened stay where they are. An actor with no ground
// loses the section altogether, because that is what the card says about the
// four hundred actors that never held any.
function swapTerritory(ctx, container, actor) {
  const held = container.querySelector('.card-section[data-section="territory"]');
  if (!held) return;
  const section = territorySection(ctx, actor);
  if (!section) {
    held.remove();
    return;
  }
  held.outerHTML = sectionHtml({ ...section, open: held.classList.contains('open') });
}

export function renderActorCard(ctx, { container, actor, mine, state = null, remembered = null }) {
  container.innerHTML = actorCardHtml(ctx, actor, { state, remembered });
  // The presences left the spine in I1, so a card opened before the file
  // lands has no territory to show yet and asks for it here (index2-plan D1).
  // A rejection leaves the "loading" line saying what happened; the layer's
  // own note on the map says the same thing about the same file.
  if (!territoryKnown(ctx)) {
    ctx.atlas.loadPresences().then(
      () => {
        if (!ctx.isCurrent(mine)) return;
        swapTerritory(ctx, container, actor);
      },
      () => {
        if (!ctx.isCurrent(mine)) return;
        const held = container.querySelector('.card-section[data-section="territory"] .section-body');
        if (held) held.innerHTML = '<p class="muted">The territory this actor held could not be loaded.</p>';
      },
    );
  }
  ctx.atlas.record('actor', actor.id).then(
    (rec) => {
      if (!ctx.isCurrent(mine)) return;
      const place = rec.where ? ` <span class="where">${esc(rec.where.label)}</span>` : '';
      // The licence line goes with the summary because that is the text it
      // covers: an actor an import created carries the dataset's licence and
      // not this atlas's, and the card said nothing about it (health review
      // A, finding 24). It is rendered here rather than in the card's markup
      // because the spine carries no `license` and this is where the record
      // itself arrives.
      container.querySelector('[data-slot="actor-summary"]').innerHTML = `${attributionHtml(rec)}<p>${esc(rec.summary)}</p>${place ? `<p class="meta">${place}</p>` : ''}`;
      container.querySelector('[data-slot="actor-sources"]').innerHTML = rec.sources?.length
        ? ctx.citationsHtml(rec.sources, '', rec)
        : '<p class="muted">This actor cites nothing yet.</p>';
    },
    () => {
      if (!ctx.isCurrent(mine)) return;
      container.querySelector('[data-slot="actor-summary"]').innerHTML = '<p class="muted">Could not load the record text.</p>';
    },
  );
}
