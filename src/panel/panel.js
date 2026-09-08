// The side panel: one card at a time, and everything the cards share.
//
// This file owns the container, the clicks, the load token that cancels the
// text of a card the reader has already left, and the helpers every card
// needs — citations, the link to an event, the lane's name. The cards
// themselves are one file each: event.js, source.js, place.js, actor.js,
// office.js, cluster.js. Which one is shown is decided in render() and
// nowhere else.

import { shardsArrived } from '../render-key.js';
import { shardsOnScreen } from '../attributes.js';
import { esc, safeUrl } from '../util/esc.js';
import { formatInterval, bounds, isValidYear } from '../util/dates.js';
import { articleFor } from '../wikipedia.js';
import { windowAt, resolveWindow } from '../util/window.js';
import { OPENINGS, hasOpening } from '../state.js';
import {
  formatFocus, lensSet, lensLabels, withFocus, onlyFocus, withoutFocus, FOCUS_NONE,
} from '../lens.js';
import { lanesFor } from '../lanes.js';
import { shortestPaths, pathTo } from '../graph.js';
import { chainEdges } from '../chain.js';
import { identifiers, containerText } from '../citation.js';
import { renderEventCard, drawnHtml } from './event.js';
import { renderActorCard } from './actor.js';
import { renderOfficeCard, tenureClusterAt } from './office.js';
import { renderPlaceCard, placeEventsSection, EVENTS_SECTION } from './place.js';
import { renderSourceCard } from './source.js';
import { clusterHtml } from './cluster.js';
import { horizonHtml } from './horizon.js';
import { partOfHtml, renderNarrativeCard } from './narrative.js';
import { readingNarrative } from '../narrative.js';
import { createLinks, ENTRY_KINDS } from '../entry/entry.js';
import { discussUrl, recordUrl, editUrl } from '../share.js';
import { toggleSection, readOpenSection, sectionBodyHtml } from './sections.js';

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
  // Told whether the panel has a card to show at all. With nothing open there
  // is no column to keep: the layout collapses it and the view takes its width
  // (main.js). A cluster's list is a card for this purpose — it is what the
  // panel is showing — and it is not state, so it is said here and not read
  // off the URL.
  onCard = () => {},
}) {
  let token = 0;
  // Whether a cluster's member list is covering the card, and whether the
  // notification arriving now was caused by a click inside the panel. Neither
  // is state — a cluster's list is not in the URL and never was — and the
  // pair is how choosing from that list the record that is *already* open
  // puts its card back: nothing in the state changes, so nothing in the key
  // can say so. It works because the store notifies synchronously, which is
  // the half of its contract H1b deliberately did not touch.
  let covered = false;
  let asked = false;
  const links = createLinks({ fixtures });
  const laneLabel = (id) => atlas.regions.find((r) => r.id === id)?.label ?? id ?? '—';
  const startYear = (event) => bounds(event.when.start).min;

  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const s = state.get();
    asked = true;
    switch (el.dataset.action) {
      case 'select':
        // The actor stays selected: its events keep their emphasis while
        // they are read one after another.
        state.set({ selected: el.dataset.id, chain: [] });
        break;
      // The office goes with it, and it is the one card that does: an office
      // outranks an actor in the precedence, so the actor whose office it is
      // could not be opened from the office's own card without this. An
      // actor is a highlight the atlas keeps; an office is a card, and a
      // reader asking for the actor is asking to leave it.
      case 'actor':
        state.set({ actor: el.dataset.id, selected: null, office: null, chain: [] });
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
      // The lens. Not a selection and never clears one: a focus says which
      // events there are, and what the reader had open stays open — the card
      // is how they got here.
      //
      // Three verbs since H7, because the lens takes any number of foci:
      // "Focus on this" adds to the set, "Focus only on this" replaces it, and
      // a chip's × drops one. Each reads the list that is actually on, which
      // may be the implicit one-focus lens on an open actor or place — adding
      // to that is adding to a list of one, which is what a reader who has
      // opened Angola and then clicks Portugal means.
      case 'focus':
        state.set({ focus: withFocus(currentFocus(s), el.dataset.kind, el.dataset.id) });
        break;
      case 'focus-only':
        state.set({ focus: onlyFocus(el.dataset.kind, el.dataset.id) });
        break;
      case 'unfocus':
        state.set({ focus: withoutFocus(currentFocus(s), el.dataset.kind, el.dataset.id) });
        break;
      // `none` and not null: an absent parameter is what asks for the lens an
      // open actor or place gets, so clearing it would put that lens back.
      case 'clear-focus':
        state.set({ focus: FOCUS_NONE, focusAll: false });
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
      case 'clear-office':
        state.set({ office: null });
        break;
      // A post named on the card of the actor it belongs to. It keeps the
      // actor, as choosing a place does: an office outranks an actor in the
      // precedence, so the card changes and the highlight stays, and the
      // office's own card is the way back to it.
      case 'office':
        state.set({ office: el.dataset.id, selected: null, chain: [] });
        break;
      // A stack of turns under one bar of a tenure strip. The strip's own
      // grouping is pure (office.js), so it is done again here from the
      // office and the cluster's key rather than kept anywhere: what is under
      // the bar is not state, exactly as a cluster on the map is not.
      case 'tenure-cluster': {
        const office = atlas.offices?.get(el.dataset.office) ?? null;
        const actor = office ? atlas.actors.get(office.of) ?? null : null;
        const cluster = office && actor
          ? tenureClusterAt(atlas, actor, office, el.dataset.cluster)
          : null;
        if (cluster) showCluster(cluster);
        break;
      }
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
    asked = false;
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

  // The lens list that is actually on, which is not always the parameter:
  // an open actor or place with no `?focus=` is a lens on itself (lens.js),
  // and adding to it has to add to that and not to nothing.
  const currentFocus = (s) => lensLabels(atlas, s).map((f) => f.focus).join(',');

  // The two verbs, on the card of whatever the lens can be about: add to the
  // set, or make the set this one record. When the record is already a focus
  // the first becomes its ×, because "focus on this" twice is a control that
  // does nothing the second time. The card asks for it rather than being
  // handed the state, so a card's signature says what it draws and not how
  // the header works.
  function lensControl(kind, id) {
    const focus = formatFocus(kind, id);
    const s = state.get();
    const on = currentFocus(s).split(',').includes(focus);
    const attrs = `data-kind="${esc(kind)}" data-id="${esc(id)}"`;
    if (on) {
      return `<button type="button" class="link small lens-control on" data-action="unfocus" ${attrs}>stop focusing on this</button>`;
    }
    return `<button type="button" class="link small lens-control" data-action="focus" ${attrs}>Focus on this</button>
      <button type="button" class="link small lens-control" data-action="focus-only" ${attrs}>Focus only on this</button>`;
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
  // against it. It carries the record's own address and nothing else — the
  // reader's box, window, horizon and walked chain are not part of what is
  // wrong with the record, and a public issue is no place for them (share.js).
  // Two ways to disagree, side by side. "Discuss" opens an issue about the
  // record; "Edit" opens the contribution form on the record's own fields,
  // which is the correction a reader can actually write (health review B,
  // finding 26). The first leaves this site, the second does not.
  function discussLink(kind, id) {
    const page = typeof location === 'object'
      ? `${location.origin && location.origin !== 'null' ? location.origin : ''}${location.pathname}`
      : '';
    return `<p class="discuss"><a href="${esc(discussUrl(kind, id, { url: recordUrl(kind, id, { base: page }) }))}" rel="noopener" target="_blank">Discuss this record</a>
      <a class="edit-record" href="${esc(editUrl(kind, id, { fixtures }))}">Edit this record</a></p>`;
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
    if (opening.office) return atlas.offices?.get(opening.office)?.title ?? opening.office;
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

  // --- when the card is drawn again, and when it is only touched up -------
  //
  // The card used to be rebuilt on every state change, so a wheel notch over
  // the timeline closed the explanation being read, and the `bbox` the map
  // publishes 180 ms after a zoom replaced a cluster's member list with
  // "Pick an event" (B12, A3, A5).
  //
  // The key is what the card is actually drawn from: what is *open*, the
  // walked chain, the horizon year, and the window. Anything else — the pan,
  // the zoom, the box, the lens, the layers, the grouping's own controls — is
  // not a different card and does not rebuild one.
  //
  // The window is in the key and is still not a rebuild. It decides three
  // small things — the horizon's default year and therefore its list, the
  // lane an event is drawn in, which of a place's events are faded — and
  // those are written into the card that is already there, so that moving
  // the band under an open `<details>` leaves it open (review finding 7).
  let drawnFor = null;

  function keyOf(s) {
    const window = resolveWindow(s, atlas.extent);
    return {
      card: OPENINGS.map((field) => s[field] ?? '').join('|'),
      // A card draws nothing out of a fallback (index2 review, finding 21), so
      // until the record's shard has landed it is the loading line and not the
      // entry; when the shard lands the card is drawn again with its title, its
      // roles and its counts. Nothing in the state says the shard arrived, so
      // the count of arrivals is in the key — the same integer the three views
      // carry (render-key.js).
      shards: shardsArrived(atlas),
      chain: s.chain.join(','),
      horizon: s.horizon ?? null,
      // The lens the card is drawn under. `lensControl` reads it at render —
      // "Focus on this" or "stop focusing on this" — and nothing patched it in
      // place, so clicking the control left a header chip beside a button that
      // still offered to add the focus it had just added (health review of
      // 6 September, R9). It is the labels and not the raw parameter: an
      // implicit lens writes no `focus=` at all, and turning one into an
      // explicit chip is a change the card has to be redrawn for.
      lens: lensLabels(atlas, s).map((f) => f.focus).join(','),
      from: window ? window.from : null,
      to: window ? window.to : null,
    };
  }

  const sameCard = (a, b) => a.card === b.card && a.chain === b.chain && a.horizon === b.horizon
    && a.lens === b.lens && a.shards === b.shards;
  const sameWindow = (a, b) => a.from === b.from && a.to === b.to;

  // The window's own bits, put back into the card that is on screen. Each is
  // looked for and skipped when it is not there: the same call serves an
  // event's card, a place's, an actor's and a cluster's list, and only the
  // first two have anything the window decides.
  function updateWindow(s) {
    const found = s.selected && !s.narrative ? atlas.resolve(s.selected) : null;
    const event = found && found.kind === 'event' ? found.record : null;
    if (event) {
      const drawn = container.querySelector('[data-slot="drawn"]');
      if (drawn) drawn.outerHTML = drawnHtml(ctx, event, s);
      const horizon = container.querySelector('.horizon');
      if (horizon) {
        // The details and the year field are the reader's, not the state's:
        // an open section that closed itself and a field that lost the
        // caret would be the interruption this whole key exists to stop.
        const details = horizon.querySelector('details');
        const open = Boolean(details?.open);
        const doc = container.ownerDocument;
        const typing = Boolean(doc?.activeElement?.matches?.('[data-horizon]'))
          && container.contains(doc.activeElement);
        horizon.outerHTML = horizonHtml(ctx, { event, state: s });
        const now = container.querySelector('.horizon details');
        if (now && open) now.open = true;
        if (typing) container.querySelector('[data-horizon]')?.focus();
      }
      return;
    }
    const place = s.place && !s.selected && !s.source && !s.narrative ? atlas.resolve(s.place) : null;
    if (!place || place.kind !== 'place') return;
    const body = container.querySelector(`.card-section[data-section="${EVENTS_SECTION}"] .section-body`);
    if (body) body.innerHTML = sectionBodyHtml(placeEventsSection(ctx, place.record, s));
  }

  function onState(s) {
    const next = keyOf(s);
    // A cluster's list is covering the card and the reader has just clicked
    // inside the panel: they chose one of the members, so the card comes
    // back even when the record they chose is the one already open.
    if (covered && asked) {
      render(s);
      return;
    }
    if (drawnFor && sameCard(drawnFor, next)) {
      if (sameWindow(drawnFor, next)) return;
      drawnFor = next;
      updateWindow(s);
      return;
    }
    render(s);
  }

  // --- the shards the open card is drawn out of ----------------------------
  //
  // Which record is open, in render()'s own precedence, so that the shards held
  // below are the ones the card actually reads. A source resolves here and asks
  // for nothing: it is not in the graph file, and `attributeShardsOf` says so
  // by finding no shard for it.
  const OPENING_KINDS = [
    ['narrative', 'narrative'], ['selected', 'event'], ['source', 'source'],
    ['office', 'office'], ['place', 'place'], ['actor', 'actor'],
  ];
  function openingOf(s) {
    for (const [field, kind] of OPENING_KINDS) {
      if (!s[field]) continue;
      const found = atlas.resolve(s[field]);
      return found && found.kind === kind ? found : null;
    }
    return null;
  }

  // Asked for, and held outside the LRU cap while the card is on screen. The
  // cards are per-entity and not windowed, so an actor whose events span five
  // centuries would otherwise be drawn incomplete for ever (data.js,
  // ATTRIBUTE_SHARD_CAP). The new pin is taken before the old one is released,
  // so a shard both cards want is never dropped and fetched again in between.
  //
  // Nothing here waits: the card is drawn now out of what has landed, and drawn
  // again when the rest does — which is what the shard count in `keyOf` is for.
  let releaseShards = null;
  function holdShards(s) {
    if (typeof atlas.pinAttributes !== 'function') return;
    const opened = openingOf(s);
    const wanted = opened ? shardsOnScreen(atlas, opened.kind, opened.id) : [];
    const release = atlas.pinAttributes(wanted);
    releaseShards?.();
    releaseShards = release;
    for (const shard of wanted) atlas.loadAttributes(shard).then(refresh, () => {});
  }

  // A shard landing is not a state change, so nothing would tell the panel. The
  // key carries the count of arrivals, so this is the same comparison every
  // other notification goes through and it redraws only when one really landed.
  function refresh() {
    onState(state.get());
  }

  function render(s) {
    drawnFor = keyOf(s);
    covered = false;
    holdShards(s);
    onCard(hasOpening(s));
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
    // The precedence: an event, then a source, then an office, then a place,
    // then an actor. Opening an event from a place's list therefore does not
    // throw the place away, and an office opened from the card of the actor
    // it belongs to is what is shown.
    if (!s.selected) {
      if (s.source) {
        const found = atlas.resolve(s.source);
        if (found && found.kind === 'source') renderSourceCard(ctx, { container, source: found.record });
        else notFound('source', s.source);
        return;
      }
      if (s.office) {
        const found = atlas.resolve(s.office);
        if (found && found.kind === 'office') {
          renderOfficeCard(ctx, {
            container, office: found.record, mine, state: s, remembered: readOpenSection(storage),
          });
        } else notFound('office', s.office);
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

  // Cancels any record text still loading for the view being replaced. The
  // key is left where the card put it: the list is not state, so the next
  // change that really is a different card replaces it, and the zoom's own
  // `bbox` write no longer does (A5).
  function showCluster(cluster) {
    token += 1;
    covered = true;
    onCard(true);
    container.innerHTML = clusterHtml(ctx, cluster);
  }

  state.subscribe(onState);
  render(state.get());
  return { render, showCluster, refresh };
}
