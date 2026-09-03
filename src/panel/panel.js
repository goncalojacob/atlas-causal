// The side panel: one card at a time, and everything the cards share.
//
// This file owns the container, the clicks, the load token that cancels the
// text of a card the reader has already left, and the helpers every card
// needs — citations, the link to an event, the lane's name. The cards
// themselves are one file each: event.js, place.js, actor.js, cluster.js.
// Which one is shown is decided in render() and nowhere else.

import { esc, safeUrl } from '../util/esc.js';
import { formatInterval, bounds } from '../util/dates.js';
import { windowAt } from '../util/window.js';
import { renderEventCard } from './event.js';
import { renderActorCard } from './actor.js';
import { renderPlaceCard } from './place.js';
import { clusterHtml } from './cluster.js';

export function createPanel(container, { atlas, state, fixtures = false }) {
  let token = 0;
  const laneLabel = (id) => atlas.regions.find((r) => r.id === id)?.label ?? id ?? '—';
  const startYear = (event) => bounds(event.when.start).min;

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
      // Choosing a place clears the event and the path and keeps the actor,
      // the way choosing an actor does: they are different questions about
      // the same graph.
      case 'place':
        state.set({ place: el.dataset.id, selected: null, chain: [] });
        break;
      case 'clear-place':
        state.set({ place: null });
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

  // The selected actor, when it resolves to one: the cards show it as a
  // highlight rather than as the subject, and it outlives the event being
  // read.
  function highlightedActor(s) {
    const found = s.actor ? atlas.resolve(s.actor) : null;
    return found && found.kind === 'actor' ? found.record : null;
  }

  // Everything a card is given. No card reaches for the container, the state
  // or the token on its own.
  const ctx = {
    atlas,
    laneLabel,
    startYear,
    citationsHtml,
    edgeTextHtml,
    eventLink,
    highlightedActor,
    isCurrent: (mine) => mine === token,
  };

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

  function notFound(kind, id) {
    container.innerHTML = `<section class="intro"><h2>Not found</h2><p>No ${esc(kind)} with id <code>${esc(id)}</code>.</p></section>`;
  }

  function render(s) {
    token += 1;
    const mine = token;
    // The precedence: an event, then a place, then an actor. Opening an
    // event from a place's list therefore does not throw the place away.
    if (!s.selected) {
      if (s.place) {
        const found = atlas.resolve(s.place);
        if (found && found.kind === 'place') renderPlaceCard(ctx, { container, place: found.record, state: s, mine });
        else notFound('place', s.place);
        return;
      }
      if (s.actor) {
        const actor = highlightedActor(s);
        if (actor) renderActorCard(ctx, { container, actor, mine });
        else notFound('actor', s.actor);
        return;
      }
      container.innerHTML = introHtml();
      return;
    }
    const found = atlas.resolve(s.selected);
    if (!found || found.kind !== 'event') {
      notFound('event', s.selected);
      return;
    }
    renderEventCard(ctx, { container, event: found.record, found, state: s, mine });
  }

  // Cancels any record text still loading for the view being replaced.
  function showCluster(cluster) {
    token += 1;
    container.innerHTML = clusterHtml(ctx, cluster);
  }

  state.subscribe(render);
  render(state.get());
  return { render, showCluster };
}
