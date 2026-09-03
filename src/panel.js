// The side panel: detail of the selected event, the chain walked, its
// consequences, the other branches that fed it (convergence), citations
// with supporting and dissenting sources shown apart. Confidence and status
// are shown as such; a disputed link is never walked through silently.
// Traversal logic lives in graph.js; this file only asks it.
//
// It also shows an actor's card — type, dates, seat, summary, the events it
// appears in with the role it played in each — because an actor is never on
// the timeline on its own: it is reached through its events and read
// alongside them. A selected event wins the panel; the actor's card is what
// the panel falls back to, and the highlight on the map and the timeline
// outlives it.

import { esc, safeUrl } from './util/esc.js';
import { consequences, convergence } from './graph.js';
import { formatInterval, formatYear, bounds, defaultCalendar } from './util/dates.js';
import { windowAt } from './util/window.js';

const TYPE_LABEL = Object.freeze({
  caused: 'caused',
  enabled: 'enabled',
  'reacted-to': 'reacted to',
  'precondition-of': 'precondition of',
  inspired: 'inspired',
});

const ACTOR_TYPE_LABEL = Object.freeze({
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

function badge(confidence) {
  return `<span class="badge ${esc(confidence)}" title="${esc(CONFIDENCE_HINT[confidence] ?? '')}">${esc(confidence)}</span>`;
}

function startYear(event) {
  return bounds(event.when.start).min;
}

function whenLine(event) {
  const { when } = event;
  let text = formatInterval(when);
  if (when.date) {
    const calendar = when.calendar ?? defaultCalendar(startYear(event));
    text += ` · ${esc(when.date)} (${calendar})`;
  }
  return text;
}

export function createPanel(container, { atlas, state, fixtures = false }) {
  let token = 0;
  const laneLabel = (id) => atlas.regions.find((r) => r.id === id)?.label ?? id ?? '—';

  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const s = state.get();
    switch (el.dataset.action) {
      case 'select':
        // The actor stays selected: its events keep their emphasis while
        // they are read one after another.
        state.set({ selected: el.dataset.id, chain: [] });
        break;
      case 'actor':
        state.set({ actor: el.dataset.id, selected: null, chain: [] });
        break;
      case 'clear-actor':
        state.set({ actor: null });
        break;
      case 'follow': {
        const edge = atlas.edges.get(el.dataset.edge);
        if (edge) state.set({ chain: [...s.chain, edge.id], selected: edge.to });
        break;
      }
      case 'back': {
        const chain = s.chain.slice(0, -1);
        const last = atlas.edges.get(chain[chain.length - 1] ?? '');
        const first = atlas.edges.get(s.chain[0] ?? '');
        state.set({ chain, selected: last ? last.to : first ? first.from : s.selected });
        break;
      }
      case 'clear':
        state.set({ chain: [] });
        break;
      case 'year':
        // "Map at 1911" puts the window's far end there and takes the near
        // end with it only if it was later, so the year asked for is always
        // inside the window that results.
        state.set(windowAt(s, Number(el.dataset.year)));
        break;
      default:
    }
  });

  // Explanations load when their <details> opens. toggle does not bubble,
  // hence the capturing listener.
  container.addEventListener('toggle', (e) => {
    const details = e.target;
    if (!(details instanceof HTMLDetailsElement) || !details.open || !details.dataset.edge) return;
    const slot = details.querySelector('[data-slot="explanation"]');
    if (!slot || slot.dataset.loaded) return;
    slot.dataset.loaded = '1';
    atlas.record('edge', details.dataset.edge).then(
      (edge) => { slot.innerHTML = edgeTextHtml(edge); },
      () => { slot.innerHTML = '<p class="muted">Could not load the record.</p>'; },
    );
  }, true);

  function citationsHtml(citations, heading) {
    if (!citations || citations.length === 0) return '';
    const items = citations.map((c) => {
      const src = atlas.sources.get(c.source);
      if (!src) return `<li class="citation missing">unknown source <code>${esc(c.source)}</code></li>`;
      const ids = [];
      if (src.isbn) ids.push(`ISBN ${esc(src.isbn)}`);
      if (src.doi) ids.push(`<a href="https://doi.org/${encodeURIComponent(src.doi)}" rel="noopener" target="_blank">doi:${esc(src.doi)}</a>`);
      if (src.url) {
        const url = safeUrl(src.url);
        ids.push(url ? `<a href="${esc(url)}" rel="noopener" target="_blank">${esc(url)}</a>` : `<span class="unsafe-url">${esc(src.url)}</span>`);
      }
      if (src.repository) ids.push(`${esc(src.repository)}${src.reference ? `, ${esc(src.reference)}` : ''}`);
      return `<li class="citation">
        <span class="creators">${esc((src.creators ?? []).join(', '))}</span>${src.year ? ` (${esc(src.year)})` : ''}.
        <em>${esc(src.title)}</em>${src.publisher ? `. ${esc(src.publisher)}` : ''}.
        ${c.locator ? `<span class="locator">${esc(c.locator)}.</span>` : ''}
        <span class="identifiers">${ids.join(' · ')}</span>
        ${src.status !== 'active' ? `<span class="badge status">${esc(src.status)}</span>` : ''}
      </li>`;
    });
    return `<h3>${esc(heading)}</h3><ul class="citations">${items.join('')}</ul>`;
  }

  function edgeTextHtml(edge) {
    const parts = [`<p class="explanation">${esc(edge.explanation)}</p>`];
    parts.push(citationsHtml(edge.sources, 'Supporting sources'));
    if (edge.dispute) {
      parts.push(`<div class="dispute"><h3>The dispute</h3><p>${esc(edge.dispute.text)}</p>${citationsHtml(edge.dispute.sources, 'Dissenting sources')}</div>`);
    }
    return parts.join('');
  }

  function eventLink(event, extra = '') {
    return `<button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button> <span class="when">${esc(formatInterval(event.when))}</span>${extra}`;
  }

  function chainHtml(chainEdges) {
    if (chainEdges.length === 0) return '';
    const first = atlas.events.get(chainEdges[0].from);
    const steps = chainEdges.map((edge) => {
      const to = atlas.events.get(edge.to);
      return `<li class="step ${edge.confidence === 'disputed' ? 'disputed' : ''}">
        <span class="arrow">${esc(TYPE_LABEL[edge.type] ?? edge.type)}</span> ${badge(edge.confidence)}
        <span class="step-target">${to ? eventLink(to) : esc(edge.to)}</span>
      </li>`;
    });
    return `<section class="chain">
      <h2>The path you walked <span class="count">${chainEdges.length} step${chainEdges.length === 1 ? '' : 's'}</span></h2>
      <ol class="steps"><li class="step start">${first ? eventLink(first) : esc(chainEdges[0].from)}</li>${steps.join('')}</ol>
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

  function convergenceHtml(list, walked, selectedId) {
    const heading = walked ? 'Other branches into this event' : 'What fed this event';
    const hint = walked
      ? 'Ancestors of this event that are not on the path you walked. Arriving one way does not mean that way explains it.'
      : 'Every ancestor. Walk a path to see which branches are not the one you took.';
    if (list.length === 0) return `<section class="convergence"><h2>${heading}</h2><p class="muted">${walked ? 'Nothing else fed this event.' : 'No incoming links recorded.'}</p></section>`;
    const items = list.map(({ event, edge, to, depth }) => `<li class="edge-row ${esc(edge.confidence)}">
      <div class="edge-head">
        ${eventLink(event)}
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
  function actorsHtml(event, highlighted) {
    const listed = (event.actors ?? []).filter((a) => atlas.actors.has(a.actor));
    if (listed.length === 0) return '';
    const items = listed.map(({ actor, role }) => {
      const record = atlas.actors.get(actor);
      return `<li class="actor-row ${actor === highlighted ? 'highlighted' : ''}">
        <button type="button" class="link" data-action="actor" data-id="${esc(actor)}">${esc(record.name)}</button>
        <span class="role">${esc(role)}</span>
        <span class="muted">${esc(ACTOR_TYPE_LABEL[record.actorType] ?? record.actorType)}</span>
      </li>`;
    });
    return `<section class="actors"><h2>Who is in it <span class="count">${listed.length}</span></h2><ul class="actor-rows">${items.join('')}</ul></section>`;
  }

  const DEPENDENCY_LABEL = Object.freeze({
    colony: 'colony',
    protectorate: 'protectorate',
    mandate: 'mandate',
    occupied: 'occupied',
  });

  // What the map draws for this actor, and when. Presences carry no text, so
  // this is built entirely from the topology — no record fetched, however
  // many periods an entity has. Two lists: the ground it held itself, and
  // the ground it held through somebody else.
  function territoryHtml(actor) {
    const own = atlas.presencesByActor.get(actor.id) ?? [];
    const held = atlas.dependenciesOf.get(actor.id) ?? [];
    if (own.length === 0 && held.length === 0) return '';
    const row = (presence, name) => {
      const kind = presence.dependencyKind ? `<span class="role">${esc(DEPENDENCY_LABEL[presence.dependencyKind] ?? presence.dependencyKind)}</span>` : '';
      const sovereign = presence.dependencyOf && presence.dependencyOf !== actor.id
        ? ` <span class="muted">of</span> <button type="button" class="link" data-action="actor" data-id="${esc(presence.dependencyOf)}">${esc(atlas.actors.get(presence.dependencyOf)?.name ?? presence.dependencyOf)}</button>`
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
      `<button type="button" class="link" data-action="actor" data-id="${esc(p.actor)}">${esc(atlas.actors.get(p.actor)?.name ?? p.actor)}</button> `,
    ));
    return `<section class="territory">
      ${own.length ? `<h2>Territory shown on the map <span class="count">${own.length} period${own.length === 1 ? '' : 's'}</span></h2>
        <p class="hint">The outline the map draws for this actor in a given year, and the capital the source names.</p>
        <ul class="actor-rows">${ownRows.join('')}</ul>` : ''}
      ${held.length ? `<h2>What it held <span class="count">${held.length}</span></h2>
        <ul class="actor-rows">${heldRows.join('')}</ul>` : ''}
    </section>`;
  }

  function actorCardHtml(actor) {
    const appearances = atlas.eventsByActor.get(actor.id) ?? [];
    const variants = (actor.names ?? []).slice(1);
    const rows = appearances.map(({ event, role }) => `<li class="actor-row">
      ${eventLink(event)} <span class="role">${esc(role)}</span>
      <span class="muted">${esc(laneLabel(event.region))}</span>
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
      ${territoryHtml(actor)}
      <section class="actor-events">
        <h2>Where it appears <span class="count">${appearances.length}</span></h2>
        ${appearances.length ? `<ul class="actor-rows">${rows.join('')}</ul>` : '<p class="muted">No event records this actor yet.</p>'}
      </section>
      <section class="sources" data-slot="actor-sources"></section>`;
  }

  function renderActorCard(actor, mine) {
    container.innerHTML = actorCardHtml(actor);
    atlas.record('actor', actor.id).then(
      (rec) => {
        if (mine !== token) return;
        const place = rec.where ? ` <span class="where">${esc(rec.where.label)}</span>` : '';
        container.querySelector('[data-slot="actor-summary"]').innerHTML = `<p>${esc(rec.summary)}</p>${place ? `<p class="meta">${place}</p>` : ''}`;
        container.querySelector('[data-slot="actor-sources"]').innerHTML = citationsHtml(rec.sources, 'Sources for this actor');
      },
      () => {
        if (mine !== token) return;
        container.querySelector('[data-slot="actor-summary"]').innerHTML = '<p class="muted">Could not load the record text.</p>';
      },
    );
  }

  // The events under one mark on the map. Not part of the state — clicking
  // a cluster does not change what the URL points at — so the next state
  // change replaces this, which is right: choosing one of them is what the
  // list is for. It is also the keyboard path into a stack of marks, and
  // the only way to see the whole stack at once.
  function clusterHtml(cluster) {
    const members = cluster.members
      .map((m) => m.event)
      .sort((a, b) => startYear(a) - startYear(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const onTimeline = cluster.on === 'timeline';
    // On the map a stack is a place; on the timeline it is a stretch of one
    // lane, and saying "here" of a lane means the lane's own name.
    const where = onTimeline ? cluster.lane?.label ?? null : cluster.representative.event.where?.label ?? null;
    const hint = onTimeline
      ? 'The timeline draws these as one bar at this width. Narrow the window and they separate.'
      : cluster.coincident
        ? 'These records share the same coordinates, so no amount of zooming separates them. The map spreads them in a ring instead.'
        : 'The map draws these as one mark at this zoom. Zoom in and they separate.';
    const rows = members.map((event) => `<li class="actor-row">
      <span class="when">${esc(formatYear(startYear(event)))}</span>
      <button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>
      <span class="muted">${esc(laneLabel(event.region))}</span>
    </li>`);
    return `<section class="cluster-list">
      <h2>${members.length} event${members.length === 1 ? '' : 's'} here${where ? ` <span class="count">${esc(where)}</span>` : ''}</h2>
      <p class="hint">${hint}</p>
      <ul class="actor-rows">${rows.join('')}</ul>
    </section>`;
  }

  function introHtml() {
    const n = atlas.activeEvents.length;
    if (n === 0 && !fixtures) {
      return `<section class="intro"><h2>No records yet</h2>
        <p>The dataset is empty. Write the first event with <code>node tools/new-record.mjs</code>, run the validator and <code>node tools/build-index.mjs</code>.</p>
        <p>To see the interface working on a synthetic graph, open <a href="?fixtures=1">?fixtures=1</a>.</p></section>`;
    }
    return `<section class="intro"><h2>Pick an event</h2>
      <p>Click a mark on the map or a bar on the timeline. Then follow its consequences; the panel will show which other branches fed the same endpoint.</p>
      <p class="muted">${n} events, ${[...atlas.edges.values()].filter((e) => e.status === 'active').length} links, ${atlas.actors.size} actors, ${atlas.sources.size} sources.${fixtures ? ' Synthetic fixtures: nothing here is history.' : ''}</p></section>`;
  }

  function render(s) {
    token += 1;
    const mine = token;
    const highlighted = s.actor ? atlas.resolve(s.actor) : null;
    if (!s.selected) {
      if (s.actor && highlighted && highlighted.kind === 'actor') {
        renderActorCard(highlighted.record, mine);
        return;
      }
      if (s.actor) {
        container.innerHTML = `<section class="intro"><h2>Not found</h2><p>No actor with id <code>${esc(s.actor)}</code>.</p></section>`;
        return;
      }
      container.innerHTML = introHtml();
      return;
    }
    const found = atlas.resolve(s.selected);
    if (!found || found.kind !== 'event') {
      container.innerHTML = `<section class="intro"><h2>Not found</h2><p>No event with id <code>${esc(s.selected)}</code>.</p></section>`;
      return;
    }
    const event = found.record;
    const chainEdges = s.chain.map((id) => atlas.edges.get(id)).filter(Boolean);
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
    const highlightedActor = highlighted && highlighted.kind === 'actor' ? highlighted.record : null;
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
          <span class="when">${whenLine(event)}</span>
          ${event.where ? ` · <span class="where">${esc(event.where.label)} <span class="muted">(${esc(event.where.precision)})</span></span>` : ' · <span class="muted">no place: timeline only</span>'}
          · <span class="lane">${esc(laneLabel(event.region))}</span>
          <button type="button" class="link small" data-action="year" data-year="${esc(startYear(event))}">map at ${esc(formatYear(startYear(event)))}</button>
        </p>
      </header>
      <section class="summary" data-slot="summary"><p class="muted">Loading…</p></section>
      ${actorsHtml(event, highlightedActor?.id ?? null)}
      ${lastEdge ? `<section class="last-step ${lastEdge.confidence === 'disputed' ? 'disputed' : ''}">
        <h2>The link you followed</h2>
        <p class="edge-head"><span class="arrow">${esc(atlas.events.get(lastEdge.from)?.title ?? lastEdge.from)} — ${esc(TYPE_LABEL[lastEdge.type] ?? lastEdge.type)} →</span> ${badge(lastEdge.confidence)}</p>
        <div data-slot="last-step"><p class="muted">Loading…</p></div>
      </section>` : ''}
      ${chainHtml(chainEdges)}
      ${consequencesHtml(out)}
      ${convergenceHtml(conv, chainEdges.length > 0, event.id)}
      <section class="sources" data-slot="sources"></section>
    `;

    atlas.record('event', event.id).then(
      (rec) => {
        if (mine !== token) return;
        container.querySelector('[data-slot="summary"]').innerHTML = `<p>${esc(rec.summary)}</p>`;
        container.querySelector('[data-slot="sources"]').innerHTML = citationsHtml(rec.sources, 'Sources for this event');
      },
      () => {
        if (mine !== token) return;
        container.querySelector('[data-slot="summary"]').innerHTML = '<p class="muted">Could not load the record text.</p>';
      },
    );
    if (lastEdge) {
      atlas.record('edge', lastEdge.id).then(
        (rec) => {
          if (mine !== token) return;
          container.querySelector('[data-slot="last-step"]').innerHTML = edgeTextHtml(rec);
        },
        () => {
          if (mine !== token) return;
          container.querySelector('[data-slot="last-step"]').innerHTML = '<p class="muted">Could not load the link text.</p>';
        },
      );
    }
  }

  // Cancels any record text still loading for the view being replaced.
  function showCluster(cluster) {
    token += 1;
    container.innerHTML = clusterHtml(cluster);
  }

  state.subscribe(render);
  render(state.get());
  return { render, showCluster };
}
