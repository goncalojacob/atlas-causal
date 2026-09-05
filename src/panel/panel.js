// The side panel: one card at a time, and everything the cards share.
//
// This file owns the container, the clicks, the load token that cancels the
// text of a card the reader has already left, and the helpers every card
// needs — citations, the link to an event, the lane's name. The cards
// themselves are one file each: event.js, source.js, place.js, actor.js,
// cluster.js. Which one is shown is decided in render() and nowhere else.

import { esc, safeUrl } from '../util/esc.js';
import { formatInterval, bounds, isValidYear } from '../util/dates.js';
import { articleFor } from '../wikipedia.js';
import { windowAt, resolveWindow } from '../util/window.js';
import { formatFocus, lensSet } from '../lens.js';
import { lanesFor } from '../lanes.js';
import { shortestPaths, pathTo } from '../graph.js';
import { chainEdges } from '../chain.js';
import { identifiers, containerText } from '../citation.js';
import { renderEventCard } from './event.js';
import { renderActorCard } from './actor.js';
import { renderPlaceCard } from './place.js';
import { renderSourceCard } from './source.js';
import { clusterHtml } from './cluster.js';
import { partOfHtml, renderNarrativeCard } from './narrative.js';
import { readingNarrative } from '../narrative.js';
import { createLinks, ENTRY_KINDS } from '../entry/entry.js';
import { discussUrl } from '../share.js';
import { toggleSection, readOpenSection } from './sections.js';

// What the reader asked their browser for, in order. Read once: the cards
// use it to choose which Wikipedia edition to offer, and a list that changed
// under them mid-session would make one card disagree with the next.
function readerLanguages() {
  return typeof navigator === 'object' && Array.isArray(navigator?.languages) ? [...navigator.languages] : [];
}

export function createPanel(container, {
  atlas, state, fixtures = false, languages = readerLanguages(),
  history = globalThis.history, storage = globalThis.localStorage,
  // Whether the walk this page opened with was cut short by a step that has
  // been retracted since the link was made. main.js decides it, because it is
  // the only place that has seen the chain before it was cut; it stops being
  // true as soon as the reader opens something else (chain.js).
  walkWasCut = () => false,
}) {
  let token = 0;
  const links = createLinks({ fixtures });
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
      // A source is a card like a place's: it clears the event and the path
      // it was read from, and keeps the actor, since "which of this actor's
      // events rest on this book" is a question worth being left in.
      case 'source':
        state.set({ source: el.dataset.id, selected: null, chain: [] });
        break;
      case 'clear-source':
        state.set({ source: null });
        break;
      // The lens. Not a selection and never clears one: "show only these"
      // says which events there are, and what the reader had open stays
      // open — the card is how they got here.
      case 'focus':
        state.set({ focus: el.dataset.focus });
        break;
      case 'clear-focus':
        state.set({ focus: null });
        break;
      // An edge has no card of its own: opening one from a source's list
      // walks that single step, which names both ends and loads the argument.
      case 'follow-edge': {
        const edge = atlas.edges.get(el.dataset.edge);
        if (edge) state.set({ selected: edge.to, chain: [edge.id], source: null });
        break;
      }
      case 'clear-place':
        state.set({ place: null });
        break;
      case 'clear-actor':
        state.set({ actor: null });
        break;
      // Opening a narrative is entering a mode: the step is authoritative and
      // the selection and the path are derived from it (narrative-mode.js).
      case 'narrative':
        state.set({ narrative: el.dataset.id, step: 0 });
        break;
      case 'narrative-step':
        state.set({ step: Number(el.dataset.step) });
        break;
      case 'leave-narrative':
        state.set({ narrative: null });
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
      // A crumb of the breadcrumb: step 0 is where the walk started, step n
      // is the far end of the nth link. Returning to the middle of a path
      // drops what came after it — the path is the argument being followed,
      // and the steps beyond the one being re-read were not taken.
      case 'chain-to': {
        const at = Number(el.dataset.step);
        if (!Number.isInteger(at) || at < 0 || at > s.chain.length) break;
        const edges = chainEdges(atlas, s.chain);
        const target = at === 0 ? edges[0]?.from : edges[at - 1]?.to;
        if (target) state.set({ chain: s.chain.slice(0, at), selected: target });
        break;
      }
      // A section opening is not state: it says nothing about what the atlas
      // is showing, so it never reaches the store or the URL. Done in the DOM
      // rather than by re-rendering, because the summary and the citations
      // were fetched and a re-render would ask for them again.
      case 'section':
        toggleSection(container, el.dataset.section, storage);
        break;
      // Back and Forward are the browser's own, and say so by being it: the
      // store pushed a history entry when what is open changed (state.js),
      // and popstate restores it, so these buttons and the browser's own
      // chrome do exactly the same thing.
      case 'history-back':
        history?.back();
        break;
      case 'history-forward':
        history?.forward();
        break;
      case 'clear':
        state.set({ chain: [] });
        break;
      // Choosing an answer to "what did this lead to by then?" walks the
      // shortest path to it: the answer becomes a chain, and a chain has
      // convergence — what else fed the endpoint the reader picked.
      case 'horizon-walk': {
        if (!s.selected) break;
        const edges = pathTo(shortestPaths(atlas.adjacency, s.selected), el.dataset.id);
        if (edges.length) state.set({ chain: edges.map((e) => e.id), selected: el.dataset.id });
        break;
      }
      case 'clear-horizon':
        state.set({ horizon: null });
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

  // The horizon's year. On change rather than on input: a re-render per
  // keystroke would take the field out from under the reader's fingers, and
  // a year is finished when they stop typing it. A year that is not a year —
  // an empty field, a 0 — means "back to the window's end".
  container.addEventListener('change', (e) => {
    const el = e.target.closest('[data-horizon]');
    if (!el) return;
    const year = Number(el.value);
    state.set({ horizon: isValidYear(year) ? year : null });
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

  // A citation, wherever one is shown. The title is a way into the source's
  // own card — the citation is the door to the bibliography and not merely a
  // line of small print — and the identifiers stay as links out to the work
  // itself. Formatting is citation.js, so this and the bibliography page
  // cannot drift apart.
  //
  // `record` is the record the citations were read from, when there is one:
  // the verification flags live on it (`review.citations`), not in the
  // bibliography, because they are a claim about this citation and not about
  // the book. A citation nobody has opened the source for says so, quietly:
  // an atlas whose citations were never checked and did not admit it would be
  // making a stronger claim than it can support.
  //
  // A falsy heading leaves the sub-heading off, for the places where the
  // section header above already says what the list is.
  function citationsHtml(citations, heading, record = null) {
    if (!citations || citations.length === 0) return '';
    const flags = record?.review?.citations ?? {};
    const items = citations.map((c) => {
      const src = atlas.sources.get(c.source);
      if (!src) return `<li class="citation missing">unknown source <code>${esc(c.source)}</code></li>`;
      const ids = identifiers(src).map(({ label, href }) => (href
        ? `<a href="${esc(href)}" rel="noopener" target="_blank">${esc(label)}</a>`
        : `<span class="unsafe-url">${esc(label)}</span>`));
      const verified = flags[c.source]?.verified;
      const mark = verified
        ? `<span class="badge verified" title="${esc(`checked against the source by ${verified.by ?? 'a reviewer'}, ${verified.on ?? ''}`.trim())}">verified</span>`
        : '<span class="unchecked" title="nobody has yet opened the source to check this citation">unchecked</span>';
      return `<li class="citation">
        <span class="creators">${esc((src.creators ?? []).join(', '))}</span>${src.year ? ` (${esc(src.year)})` : ''}.
        <button type="button" class="link cite" data-action="source" data-id="${esc(src.id)}"><em>${esc(src.title)}</em></button>.
        ${containerText(src.container) ? `<span class="container">${esc(containerText(src.container))}</span>` : ''}${src.publisher ? ` ${esc(src.publisher)}.` : ''}
        ${c.locator ? `<span class="locator">${esc(c.locator)}.</span>` : ''}
        <span class="identifiers">${ids.join(' · ')}</span>
        ${mark}
        ${src.status !== 'active' ? `<span class="badge status">${esc(src.status)}</span>` : ''}
      </li>`;
    });
    return `${heading ? `<h3>${esc(heading)}</h3>` : ''}<ul class="citations">${items.join('')}</ul>`;
  }

  function edgeTextHtml(edge) {
    const parts = [`<p class="explanation">${esc(edge.explanation)}</p>`];
    parts.push(citationsHtml(edge.sources, 'Supporting sources', edge));
    if (edge.dispute) {
      parts.push(`<div class="dispute"><h3>The dispute</h3><p>${esc(edge.dispute.text)}</p>${citationsHtml(edge.dispute.sources, 'Dissenting sources', edge)}</div>`);
    }
    // A link is walked by narratives as an event is, and says so where its
    // argument is read: an edge has no card of its own to say it on.
    parts.push(partOfHtml(ctx, edge.id));
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

  // "Show only these" / "show everything", on the card of whatever the lens
  // can be about. The card asks for it rather than being handed the state,
  // so a card's signature says what it draws and not how the header works.
  function lensControl(kind, id) {
    const focus = formatFocus(kind, id);
    return state.get().focus === focus
      ? '<button type="button" class="link small lens-control on" data-action="clear-focus">show everything</button>'
      : `<button type="button" class="link small lens-control" data-action="focus" data-focus="${esc(focus)}">show only these</button>`;
  }

  // The way out to somebody else's account of the same thing. It is offered
  // and labelled as external: the atlas's own text is the summary above it,
  // and the two are never run together. Only a record the import has given a
  // title has one, so most cards show nothing here at all.
  function wikipediaHtml(record) {
    const article = articleFor(record, languages);
    const href = article ? safeUrl(article.href) : null;
    if (!href) return '';
    return `<p class="wikipedia"><a href="${esc(href)}" rel="noopener" target="_blank">Read more on Wikipedia</a>
      <span class="muted">${esc(article.title)} · ${esc(article.lang)}</span></p>`;
  }

  // The way out of the card and onto a page of its own. Offered on every
  // record that can have an entry, written or not: a card that only linked to
  // entries that exist would hide from the reader that the long form is a
  // thing this atlas has, and the page itself is where the invitation to
  // write one belongs.
  function entryLink(kind, id) {
    if (!ENTRY_KINDS.includes(kind)) return '';
    return `<p class="entry-link"><a href="${esc(links.entry(kind, id))}">Read the full entry →</a></p>`;
  }

  // On every card, and on the cards of every kind: a record here is an
  // argument somebody made, and the way to disagree with one is an issue
  // against it. It carries the URL the reader is looking at, so that whoever
  // answers opens the same picture and not merely the same record.
  function discussLink(kind, id) {
    const here = typeof location === 'object' ? location.href : null;
    return `<p class="discuss"><a href="${esc(discussUrl(kind, id, { url: here }))}" rel="noopener" target="_blank">Discuss this record</a></p>`;
  }

  // What Back would return to, and Forward go on to, named. The browser will
  // not say — there is no way to read its stack — so the store keeps its own
  // trail of the openings it pushed (state.js) and this resolves each one to
  // the card it would show, by the precedence render() uses below. The point
  // of naming it is the owner's own case: open an actor from an event, then
  // want the event back without searching for it again.
  function openingLabel(opening) {
    if (!opening) return null;
    if (opening.narrative) return atlas.narratives?.get(opening.narrative)?.title ?? opening.narrative;
    if (opening.selected) return atlas.resolve(opening.selected)?.record?.title ?? opening.selected;
    if (opening.source) return atlas.sources.get(opening.source)?.title ?? opening.source;
    if (opening.place) return atlas.places.get(opening.place)?.name ?? opening.place;
    if (opening.actor) return atlas.actors.get(opening.actor)?.name ?? opening.actor;
    return 'the atlas';
  }

  function historyHtml() {
    const trail = state.trail ? state.trail() : { back: null, forward: null };
    const back = openingLabel(trail.back);
    const forward = openingLabel(trail.forward);
    if (!back && !forward) return '';
    return `<p class="card-history">
      ${back ? `<button type="button" class="link small go-back" data-action="history-back">← ${esc(back)}</button>` : ''}
      ${forward ? `<button type="button" class="link small go-forward" data-action="history-forward">${esc(forward)} →</button>` : ''}
    </p>`;
  }

  // The lanes of the current grouping, so the event card can say where the
  // event is drawn and why. The same call the timeline and the graph make.
  function lanes(s) {
    if (s.group === 'none') return [];
    return lanesFor(s.group, atlas, resolveWindow(s, atlas.extent), lensSet(atlas, s), s.lanes);
  }

  // Everything a card is given. No card reaches for the container, the state
  // or the token on its own.
  const ctx = {
    atlas,
    laneLabel,
    lensControl,
    lanes,
    startYear,
    citationsHtml,
    edgeTextHtml,
    wikipediaHtml,
    entryLink,
    discussLink,
    historyHtml,
    partOfHtml: (id, options) => partOfHtml(ctx, id, options),
    eventLink,
    highlightedActor,
    walkWasCut,
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
    // Reading a narrative is a mode and wins the panel: everything else in
    // the state was derived from the step.
    if (s.narrative) {
      const narrative = readingNarrative(atlas, s);
      if (narrative) renderNarrativeCard(ctx, { container, narrative, state: s, mine });
      else notFound('narrative', s.narrative);
      return;
    }
    // The precedence: an event, then a source, then a place, then an actor.
    // Opening an event from a place's list therefore does not throw the
    // place away.
    if (!s.selected) {
      if (s.source) {
        const found = atlas.resolve(s.source);
        if (found && found.kind === 'source') renderSourceCard(ctx, { container, source: found.record });
        else notFound('source', s.source);
        return;
      }
      if (s.place) {
        const found = atlas.resolve(s.place);
        if (found && found.kind === 'place') {
          renderPlaceCard(ctx, {
            container, place: found.record, state: s, mine, remembered: readOpenSection(storage),
          });
        } else notFound('place', s.place);
        return;
      }
      if (s.actor) {
        const actor = highlightedActor(s);
        if (actor) renderActorCard(ctx, { container, actor, mine, state: s, remembered: readOpenSection(storage) });
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
    renderEventCard(ctx, {
      container, event: found.record, found, state: s, mine, remembered: readOpenSection(storage),
    });
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
