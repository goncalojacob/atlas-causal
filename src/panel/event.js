// The event card: the record itself, the link that was followed to reach it,
// the path walked, the consequences, and the other branches that fed the same
// endpoint. Confidence and status are shown as such; a disputed link is never
// walked through silently. Traversal logic lives in graph.js; this file only
// asks it, and panel.js gives it everything shared in `ctx`.

import { esc } from '../util/esc.js';
import { consequences, convergence } from '../graph.js';
import { formatInterval, formatYear, defaultCalendar } from '../util/dates.js';
import { laneExplain } from '../lanes.js';
import { horizonHtml } from './horizon.js';

export const TYPE_LABEL = Object.freeze({
  caused: 'caused',
  enabled: 'enabled',
  'reacted-to': 'reacted to',
  'precondition-of': 'precondition of',
  inspired: 'inspired',
});

export const ACTOR_TYPE_LABEL = Object.freeze({
  person: 'person',
  polity: 'polity',
  institution: 'institution',
  people: 'people',
});

const CONFIDENCE_HINT = Object.freeze({
  consensus: 'accepted; at least two independent sources',
  probable: 'supported by the cited sources, no known dissent',
  disputed: 'qualified historians disagree about this link',
});

export function badge(confidence) {
  return `<span class="badge ${esc(confidence)}" title="${esc(CONFIDENCE_HINT[confidence] ?? '')}">${esc(confidence)}</span>`;
}

function whenLine(ctx, event) {
  const { when } = event;
  let text = formatInterval(when);
  if (when.date) {
    const calendar = when.calendar ?? defaultCalendar(ctx.startYear(event));
    text += ` · ${esc(when.date)} (${calendar})`;
  }
  return text;
}

function chainHtml(ctx, chainEdges) {
  if (chainEdges.length === 0) return '';
  const first = ctx.atlas.events.get(chainEdges[0].from);
  const steps = chainEdges.map((edge) => {
    const to = ctx.atlas.events.get(edge.to);
    return `<li class="step ${edge.confidence === 'disputed' ? 'disputed' : ''}">
      <span class="arrow">${esc(TYPE_LABEL[edge.type] ?? edge.type)}</span> ${badge(edge.confidence)}
      <span class="step-target">${to ? ctx.eventLink(to) : esc(edge.to)}</span>
    </li>`;
  });
  return `<section class="chain">
    <h2>The path you walked <span class="count">${chainEdges.length} step${chainEdges.length === 1 ? '' : 's'}</span></h2>
    <ol class="steps"><li class="step start">${first ? ctx.eventLink(first) : esc(chainEdges[0].from)}</li>${steps.join('')}</ol>
    <p class="actions"><button type="button" data-action="back">Step back</button> <button type="button" data-action="clear">Clear the path</button></p>
  </section>`;
}

function consequencesHtml(list) {
  if (list.length === 0) return '<section class="consequences"><h2>Consequences</h2><p class="muted">No outgoing links recorded.</p></section>';
  const items = list.map(({ edge, event }) => `<li class="edge-row ${esc(edge.confidence)}">
    <div class="edge-head">
      <span class="arrow">${esc(TYPE_LABEL[edge.type] ?? edge.type)}</span> ${badge(edge.confidence)}
      <button type="button" class="follow" data-action="follow" data-edge="${esc(edge.id)}">${esc(event.title)} <span class="when">${esc(formatInterval(event.when))}</span> →</button>
    </div>
    <details data-edge="${esc(edge.id)}"><summary>Why</summary><div data-slot="explanation"><p class="muted">Loading…</p></div></details>
  </li>`);
  return `<section class="consequences"><h2>Consequences <span class="count">${list.length}</span></h2><ul class="edges">${items.join('')}</ul></section>`;
}

function convergenceHtml(ctx, list, walked, selectedId) {
  const heading = walked ? 'Other branches into this event' : 'What fed this event';
  const hint = walked
    ? 'Ancestors of this event that are not on the path you walked. Arriving one way does not mean that way explains it.'
    : 'Every ancestor. Walk a path to see which branches are not the one you took.';
  if (list.length === 0) return `<section class="convergence"><h2>${heading}</h2><p class="muted">${walked ? 'Nothing else fed this event.' : 'No incoming links recorded.'}</p></section>`;
  const items = list.map(({ event, edge, to, depth }) => `<li class="edge-row ${esc(edge.confidence)}">
    <div class="edge-head">
      ${ctx.eventLink(event)}
      <span class="arrow">${esc(TYPE_LABEL[edge.type] ?? edge.type)}</span> ${badge(edge.confidence)}
      ${to.id === selectedId ? '' : `<span class="via">→ ${esc(to.title)}</span>`}
      ${depth > 1 ? `<span class="depth">${depth} steps up</span>` : ''}
    </div>
    <details data-edge="${esc(edge.id)}"><summary>Why</summary><div data-slot="explanation"><p class="muted">Loading…</p></div></details>
  </li>`);
  return `<section class="convergence"><h2>${heading} <span class="count">${list.length}</span></h2><p class="hint">${hint}</p><ul class="edges">${items.join('')}</ul></section>`;
}

// The actors of one event, with what each did in it. Short by design: the
// actors *of* the event, not everyone alive.
function actorsHtml(ctx, event, highlighted) {
  const listed = (event.actors ?? []).filter((a) => ctx.atlas.actors.has(a.actor));
  if (listed.length === 0) return '';
  const items = listed.map(({ actor, role }) => {
    const record = ctx.atlas.actors.get(actor);
    return `<li class="actor-row ${actor === highlighted ? 'highlighted' : ''}">
      <button type="button" class="link" data-action="actor" data-id="${esc(actor)}">${esc(record.name)}</button>
      <span class="role">${esc(role)}</span>
      <span class="muted">${esc(ACTOR_TYPE_LABEL[record.actorType] ?? record.actorType)}</span>
    </li>`;
  });
  return `<section class="actors"><h2>Who is in it <span class="count">${listed.length}</span></h2><ul class="actor-rows">${items.join('')}</ul></section>`;
}

// Where it happened: the place record, by name, and a way into its card. An
// event with no place is timeline-only and says so.
function whereHtml(ctx, event) {
  const place = ctx.atlas.placeOf(event);
  const where = ctx.atlas.pointOf(event);
  if (!where) return ' · <span class="muted">no place: timeline only</span>';
  const name = place
    ? `<button type="button" class="link" data-action="place" data-id="${esc(place.id)}">${esc(place.name)}</button>`
    : esc(where.label);
  return ` · <span class="where">${name} <span class="muted">(${esc(where.precision)})</span></span>`;
}

// Where this event is drawn, and by what rule. An event is in exactly one
// lane and the rule that picked it is mechanical, so it can be stated: a
// rule the reader cannot see is a rule they cannot check.
function drawnHtml(ctx, event, state) {
  const lanes = ctx.lanes(state);
  const { lane, reason, others } = laneExplain(event, lanes, state.group, ctx.atlas);
  if (!lane) {
    return `<p class="drawn muted">Drawn in a packed row: with no grouping the timeline fits the bars
      where they go and the graph has no bands.</p>`;
  }
  const also = others.length
    ? ` Also involves ${others.map((o) => esc(o.label)).join(', ')}.`
    : '';
  return `<p class="drawn muted">Drawn in the <strong>${esc(lane.label)}</strong> lane${reason ? ` (${esc(reason)})` : ''}.${also}</p>`;
}

export function renderEventCard(ctx, { container, event, found, state, mine }) {
  const { atlas } = ctx;
  const chainEdges = state.chain.map((id) => atlas.edges.get(id)).filter(Boolean);
  const pathIds = [...new Set([...chainEdges.flatMap((e) => [e.from, e.to]), event.id])];
  const lastEdge = chainEdges[chainEdges.length - 1] ?? null;
  const out = consequences(atlas.adjacency, event.id);
  const conv = convergence(atlas.adjacency, event.id, pathIds);

  const notices = found.via.map((v) => (v.reason === 'alias'
    ? `<p class="notice"><code>${esc(v.id)}</code> is a former id of this event.</p>`
    : `<p class="notice"><code>${esc(v.id)}</code> was merged into this event.</p>`));
  if (event.status !== 'active') notices.push(`<p class="notice status">This event is <strong>${esc(event.status)}</strong>; it has no active links.</p>`);
  if (lastEdge && lastEdge.confidence === 'disputed') {
    notices.push('<p class="notice disputed">You arrived here through a <strong>disputed</strong> link. Read the dispute below before going on.</p>');
  }
  const highlightedActor = ctx.highlightedActor(state);
  if (highlightedActor) {
    notices.push(`<p class="notice actor">Highlighting the events of
      <button type="button" class="link" data-action="actor" data-id="${esc(highlightedActor.id)}">${esc(highlightedActor.name)}</button>.
      <button type="button" class="link small" data-action="clear-actor">stop</button></p>`);
  }

  container.innerHTML = `
    ${notices.join('')}
    <header class="event-head">
      <h2>${esc(event.title)}</h2>
      <p class="meta">
        <span class="when">${whenLine(ctx, event)}</span>
        ${whereHtml(ctx, event)}
        · <span class="lane">${esc(ctx.laneLabel(event.region))}</span>
        <button type="button" class="link small" data-action="year" data-year="${esc(ctx.startYear(event))}">map at ${esc(formatYear(ctx.startYear(event)))}</button>
      </p>
      ${drawnHtml(ctx, event, state)}
      ${ctx.entryLink('event', event.id)}
      ${ctx.discussLink('event', event.id)}
      ${ctx.wikipediaHtml(event)}
    </header>
    <section class="summary" data-slot="summary"><p class="muted">Loading…</p></section>
    ${actorsHtml(ctx, event, highlightedActor?.id ?? null)}
    ${lastEdge ? `<section class="last-step ${lastEdge.confidence === 'disputed' ? 'disputed' : ''}">
      <h2>The link you followed</h2>
      <p class="edge-head"><span class="arrow">${esc(atlas.events.get(lastEdge.from)?.title ?? lastEdge.from)} — ${esc(TYPE_LABEL[lastEdge.type] ?? lastEdge.type)} →</span> ${badge(lastEdge.confidence)}</p>
      <div data-slot="last-step"><p class="muted">Loading…</p></div>
    </section>` : ''}
    ${chainHtml(ctx, chainEdges)}
    ${consequencesHtml(out)}
    ${horizonHtml(ctx, { event, state })}
    ${convergenceHtml(ctx, conv, chainEdges.length > 0, event.id)}
    ${ctx.partOfHtml(event.id)}
    <section class="sources" data-slot="sources"></section>
  `;

  atlas.record('event', event.id).then(
    (rec) => {
      if (!ctx.isCurrent(mine)) return;
      container.querySelector('[data-slot="summary"]').innerHTML = `<p>${esc(rec.summary)}</p>`;
      container.querySelector('[data-slot="sources"]').innerHTML = ctx.citationsHtml(rec.sources, 'Sources for this event');
    },
    () => {
      if (!ctx.isCurrent(mine)) return;
      container.querySelector('[data-slot="summary"]').innerHTML = '<p class="muted">Could not load the record text.</p>';
    },
  );
  if (lastEdge) {
    atlas.record('edge', lastEdge.id).then(
      (rec) => {
        if (!ctx.isCurrent(mine)) return;
        container.querySelector('[data-slot="last-step"]').innerHTML = ctx.edgeTextHtml(rec);
      },
      () => {
        if (!ctx.isCurrent(mine)) return;
        container.querySelector('[data-slot="last-step"]').innerHTML = '<p class="muted">Could not load the link text.</p>';
      },
    );
  }
}
