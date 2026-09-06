// The event card: the record itself, the link that was followed to reach it,
// the path walked, the consequences, the causes, and the other branches that
// fed the same endpoint. Confidence and status are shown as such; a disputed
// link is never walked through silently. Traversal logic lives in graph.js;
// this file only asks it, and panel.js gives it everything shared in `ctx`.
//
// The card is a head, a summary, and then one collapsible section per
// question, with the count in the header (sections.js). Nothing was removed
// when it was arranged this way: everything is still on the card, one click
// away, and the counts say what is behind each header before it is opened.

import { esc } from '../util/esc.js';
import { consequences, antecedents, convergence, convergenceByDepth } from '../graph.js';
import { chainEdges as walkedEdges } from '../chain.js';
import { formatInterval, formatYear, defaultCalendar } from '../util/dates.js';
import { laneExplain } from '../lanes.js';
import { horizonHtml } from './horizon.js';
import { eventsOfFocus } from '../lens.js';
import { largeEvent } from '../large.js';
import { sectionHtml, openSection } from './sections.js';
import { EDGE_TYPE_LABEL } from '../vocab.js';

// What a card calls each edge type, from the one list of them (vocab.js).
export const TYPE_LABEL = EDGE_TYPE_LABEL;

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

const disputedIn = (list) => list.filter(({ edge }) => edge.confidence === 'disputed').length;

function whenLine(ctx, event) {
  const { when } = event;
  let text = formatInterval(when);
  if (when.date) {
    const calendar = when.calendar ?? defaultCalendar(ctx.startYear(event));
    text += ` · ${esc(when.date)} (${calendar})`;
  }
  return text;
}

// The path walked, as a breadcrumb at the top of the panel: where the reader
// started, every event since, and the one they are on last. Each earlier step
// is a link back to itself, which drops the rest of the path — the chain is
// the argument being followed, so returning to its middle means the steps
// after it were not taken.
//
// Only a disputed step is marked. A badge on every crumb would be a row of
// badges nobody reads, and the point of marking one is that it stands out.
function breadcrumbHtml(ctx, chainEdges, event) {
  if (chainEdges.length === 0) return '';
  const first = ctx.atlas.events.get(chainEdges[0].from);
  const crumb = (title, at) => `<button type="button" class="link" data-action="chain-to" data-step="${esc(at)}">${esc(title)}</button>`;
  const items = [`<li>${first ? crumb(first.title, 0) : esc(chainEdges[0].from)}</li>`];
  chainEdges.forEach((edge, i) => {
    const to = ctx.atlas.events.get(edge.to);
    const title = to?.title ?? edge.to;
    const last = i === chainEdges.length - 1;
    items.push(`<li${last ? ' aria-current="true"' : ''}>
      <span class="arrow">${esc(TYPE_LABEL[edge.type] ?? edge.type)}</span>
      ${edge.confidence === 'disputed' ? badge('disputed') : ''}
      ${last ? `<span class="current">${esc(event.title ?? title)}</span>` : crumb(title, i + 1)}
    </li>`);
  });
  return `<nav class="breadcrumb" aria-label="The path you walked">
    <ol>${items.join('')}</ol>
    <p class="actions"><button type="button" data-action="back">Step back</button>
      <button type="button" data-action="clear">Clear the path</button></p>
  </nav>`;
}

// The actors of one event as chips in the head, with what each did in it.
// The role is on the chip's title attribute and shown on hover or focus:
// six names have to fit on two lines, and six names each trailing a role
// would be the paragraph this card was reorganised to stop being.
function actorChipsHtml(ctx, event, highlighted) {
  const listed = (event.actors ?? []).filter((a) => ctx.atlas.actors.has(a.actor));
  if (listed.length === 0) return '';
  const chips = listed.map(({ actor, role, note }) => {
    const record = ctx.atlas.actors.get(actor);
    const type = ACTOR_TYPE_LABEL[record.actorType] ?? record.actorType;
    // The note beside the role goes in the title with it: it is the phrase
    // that says what this actor did *here*, and the chip has room for a name
    // and nothing else.
    const did = note ? `${role}, ${note}` : role;
    return `<button type="button" class="chip${actor === highlighted ? ' highlighted' : ''}" data-action="actor" data-id="${esc(actor)}" title="${esc(`${record.name} — ${did} (${type})`)}">${esc(record.name)}<span class="role"> · ${esc(role)}</span></button>`;
  });
  return `<p class="chips" aria-label="Who is in it">${chips.join(' ')}</p>`;
}

function edgeRowsHtml(list, { follow }) {
  const items = list.map(({ edge, event }) => {
    const title = `${esc(event?.title ?? (follow ? edge.to : edge.from))} <span class="when">${esc(event ? formatInterval(event.when) : '')}</span>`;
    const open = follow
      ? `<button type="button" class="follow" data-action="follow" data-edge="${esc(edge.id)}">${title} →</button>`
      : `<button type="button" class="follow" data-action="select" data-id="${esc(edge.from)}">← ${title}</button>`;
    return `<li class="edge-row ${esc(edge.confidence)}">
      <div class="edge-head">
        <span class="arrow">${esc(TYPE_LABEL[edge.type] ?? edge.type)}</span> ${badge(edge.confidence)}
        ${open}
      </div>
      <details data-edge="${esc(edge.id)}"><summary>Why</summary><div data-slot="explanation"><p class="muted">Loading…</p></div></details>
    </li>`;
  });
  return `<ul class="edges">${items.join('')}</ul>`;
}

// The other ancestors of this event that are not on the path the reader
// walked (graph.js). Shown only while a path is being walked, because
// without one there is nothing to be "other" than — what fed the event
// directly is the Causes section, and everything further up is reached by
// walking.
//
// In tiers by how far up each was met, with a count on
// each tier. One flat list was forty-four rows for a three-step walk here and
// thousands at twenty thousand events, in which the branch that fed this event
// directly and one met eight steps up read alike (health review B, finding
// 30). "What fed this" and "what fed the thing that fed it" are different
// questions, so the list divides where they divide; the first tier is open and
// the rest are folded, because the first is the one a reader can act on.
//
// Inside a tier the branches are ordered by what the edge costs — confidence
// before type (graph.js) — which is the same ordering the horizon's list uses.
function branchesHtml(ctx, list, selectedId) {
  const row = ({ event, edge, to, depth }) => `<li class="edge-row ${esc(edge.confidence)}">
    <div class="edge-head">
      ${ctx.eventLink(event)}
      <span class="arrow">${esc(TYPE_LABEL[edge.type] ?? edge.type)}</span> ${badge(edge.confidence)}
      ${to.id === selectedId ? '' : `<span class="via">→ ${esc(to.title)}</span>`}
      ${depth > 1 ? `<span class="depth">${depth} steps up</span>` : ''}
    </div>
    <details data-edge="${esc(edge.id)}"><summary>Why</summary><div data-slot="explanation"><p class="muted">Loading…</p></div></details>
  </li>`;
  const tiers = convergenceByDepth(list);
  // One tier is not a grouping: it is the same list with a header nobody needs.
  if (tiers.length <= 1) return `<ul class="edges">${list.map(row).join('')}</ul>`;
  return tiers.map((tier, i) => `<details class="branch-tier" data-depth="${tier.depth}"${i === 0 ? ' open' : ''}>
    <summary>${tier.depth === 1 ? 'Fed this event directly' : `${tier.depth} steps up`}
      <span class="count">${tier.count}</span></summary>
    <ul class="edges">${tier.rows.map(row).join('')}</ul>
  </details>`).join('');
}

// The event this one is inside, where it names one. `parent` is a display
// fact and never an argument (CLAUDE.md): it is not in the adjacency, so
// nothing on this card below the head is different for it, and the reader is
// told what the event is part of rather than shown a link that changes what
// follows from what.
function partOfEventHtml(ctx, event) {
  const parent = typeof event.parent === 'string' ? ctx.atlas.events.get(event.parent) ?? null : null;
  if (!parent) return '';
  return `<p class="part-of-event">Part of
    <button type="button" class="link" data-action="select" data-id="${esc(parent.id)}">${esc(parent.title)}</button>
    <span class="when">${esc(formatInterval(parent.when))}</span></p>`;
}

// A large event is drawn unlike every other event — a band across the whole
// timeline, and a wash, a line in the corner or nothing at all on the map —
// and a reader who is looking for its mark deserves to be told which of the
// three it is and why, rather than hunting for a dot that was never drawn
// (m30b-brief, A8). Which it is, is `large.js`'s answer and not a second one.
export function largeEventHtml(ctx, event) {
  const large = largeEvent(ctx.atlas, event);
  if (!large) return '';
  const onTheMap = large.scope === 'worldwide'
    ? 'the map names it in its corner instead of washing the whole world, which would put a film over every coastline and mark'
    : large.region
      ? `the map washes ${esc(ctx.laneLabel(large.region))} rather than putting a dot in one city`
      : 'it is in no lane, so the map has nothing to wash and it is on the timeline alone';
  const why = large.reason === 'scope'
    ? `Its record says its reach is <strong>${esc(event.scope)}</strong>.`
    : 'The events inside it fall in more than one lane.';
  return `<p class="large-event muted">A large event: a band across the whole timeline, and
    ${onTheMap}. ${why}</p>`;
}

// What "Focus only on this" would leave, said once on the card of an event
// that has parts. The lens on an `event:` focus is the event and everything
// inside it (lens.js), which is not what the two controls above it meant
// before M30b and is not what a reader would guess from their labels. No third
// control: `lensControl` already draws both verbs, and a "Show only this" with
// the same effect as "Focus only on this" would be one control too many
// (m30b-brief, A6).
//
// The count is asked of `eventsOfFocus` itself rather than counted here, so
// the sentence cannot come to say something the lens does not do.
function subtreeLensHtml(ctx, event) {
  const kept = eventsOfFocus({ kind: 'event', id: event.id }, ctx.atlas)?.size ?? 0;
  if (kept < 2) return '';
  const parts = kept - 1;
  return `<p class="subtree-lens muted">Focusing only on this keeps it and the ${parts}
    ${parts === 1 ? 'event' : 'events'} inside it; every other event leaves all three views.</p>`;
}

// The other direction: the events inside this one, in the order they
// happened. A list and not a walk — following a part is opening a record,
// not taking a step of an argument — so the rows are the plain event link
// every other list uses.
function partsHtml(ctx, event) {
  const children = ctx.atlas.childrenOf?.get(event.id) ?? [];
  const rows = children.map((id) => ctx.atlas.events.get(id)).filter(Boolean).map((child) => `<li class="actor-row">
    ${ctx.eventLink(child)}
    <span class="muted">${child.region ? esc(ctx.laneLabel(child.region)) : 'no lane'}</span>
  </li>`);
  if (rows.length === 0) return null;
  return {
    key: 'parts',
    label: 'Parts',
    count: rows.length,
    hint: 'The events inside this one. Being part of something is a fact about how the atlas files it, not a link: it changes no consequence and no cause.',
    body: `<ul class="actor-rows">${rows.join('')}</ul>`,
  };
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
//
// Which lane that is depends on the window — the heaviest of an event's
// actors is counted inside the band (lanes.js) — so this is one of the two
// bits of the event card the band moves. It carries a slot of its own
// because panel.js writes it back into a card it is deliberately not
// rebuilding (B12, A3).
export function drawnHtml(ctx, event, state) {
  const lanes = ctx.lanes(state);
  const { lane, reason, others } = laneExplain(event, lanes, state.group, ctx.atlas);
  if (!lane) {
    return `<p class="drawn muted" data-slot="drawn">Drawn in a packed row: with no grouping the timeline fits the bars
      where they go and the graph has no bands.</p>`;
  }
  const also = others.length
    ? ` Also involves ${others.map((o) => esc(o.label)).join(', ')}.`
    : '';
  return `<p class="drawn muted" data-slot="drawn">Drawn in the <strong>${esc(lane.label)}</strong> lane${reason ? ` (${esc(reason)})` : ''}.${also}</p>`;
}

// Exported for the tests: there is no DOM in node --test, and the card is
// the string, as the actor's and the source's are. `remembered` is the
// section this reader last had open, read from localStorage by panel.js.
export function eventCardHtml(ctx, { event, found, state, remembered = null }) {
  const { atlas } = ctx;
  const chainEdges = walkedEdges(atlas, state.chain);
  const pathIds = [...new Set([...chainEdges.flatMap((e) => [e.from, e.to]), event.id])];
  const lastEdge = chainEdges[chainEdges.length - 1] ?? null;
  const out = consequences(atlas.adjacency, event.id);
  const into = antecedents(atlas.adjacency, event.id);
  const conv = chainEdges.length > 0 ? convergence(atlas.adjacency, event.id, pathIds) : [];
  const narratives = atlas.narrativesByRef?.get(event.id) ?? [];
  // From the sources index, not from the record: the count has to be in the
  // header at the moment the card is drawn, and the record's own text is
  // still on its way (data.js).
  const sourceCount = atlas.citationCount ? atlas.citationCount('event', event.id) : 0;

  const notices = found.via.map((v) => (v.reason === 'alias'
    ? `<p class="notice"><code>${esc(v.id)}</code> is a former id of this event.</p>`
    : `<p class="notice"><code>${esc(v.id)}</code> was merged into this event.</p>`));
  if (event.status !== 'active') notices.push(`<p class="notice status">This event is <strong>${esc(event.status)}</strong>; it has no active links.</p>`);
  // The link this page was opened with named a step that has been withdrawn
  // since; main.js cut the walk there. A path quietly shorter than the one
  // that was shared is a different argument, so the card says so.
  if (ctx.walkWasCut?.(state)) {
    notices.push(`<p class="notice status">A step of the link you followed has been <strong>retracted</strong>.
      The walk is drawn as far as that step, since what came after it followed from it.</p>`);
  }
  if (lastEdge && lastEdge.confidence === 'disputed') {
    notices.push(`<p class="notice disputed">You arrived here through a <strong>disputed</strong> link.
      <button type="button" class="link" data-action="section" data-section="followed">Read the dispute</button> before going on.</p>`);
  }
  const highlightedActor = ctx.highlightedActor(state);
  if (highlightedActor) {
    notices.push(`<p class="notice actor">Highlighting the events of
      <button type="button" class="link" data-action="actor" data-id="${esc(highlightedActor.id)}">${esc(highlightedActor.name)}</button>.
      <button type="button" class="link small" data-action="clear-actor">stop</button></p>`);
  }

  // The order the questions are asked in: how did I get here, what did it
  // lead to, what led to it, what else led to it, what is it all resting on,
  // who has written about it.
  const sections = [];
  if (lastEdge) {
    sections.push({
      key: 'followed',
      label: 'The link you followed',
      disputed: lastEdge.confidence === 'disputed' ? 1 : 0,
      count: null,
      body: `<p class="edge-head"><span class="arrow">${esc(atlas.events.get(lastEdge.from)?.title ?? lastEdge.from)} — ${esc(TYPE_LABEL[lastEdge.type] ?? lastEdge.type)} →</span> ${badge(lastEdge.confidence)}</p>
        <div class="last-step ${lastEdge.confidence === 'disputed' ? 'disputed' : ''}" data-slot="last-step"><p class="muted">Loading…</p></div>`,
    });
  }
  sections.push({
    key: 'consequences',
    label: 'Consequences',
    count: out.length,
    disputed: disputedIn(out),
    body: (out.length
      ? edgeRowsHtml(out, { follow: true })
      : '<p class="muted">No outgoing links recorded.</p>')
      + horizonHtml(ctx, { event, state }),
  });
  sections.push({
    key: 'causes',
    label: 'Causes',
    count: into.length,
    disputed: disputedIn(into),
    hint: 'What led directly to this event. Walk one backwards to read its own causes.',
    body: into.length ? edgeRowsHtml(into, { follow: false }) : '<p class="muted">No incoming links recorded.</p>',
  });
  const parts = partsHtml(ctx, event);
  if (parts) sections.push(parts);
  if (chainEdges.length > 0) {
    sections.push({
      key: 'branches',
      label: 'Other branches',
      count: conv.length,
      disputed: disputedIn(conv),
      hint: 'Ancestors of this event that are not on the path you walked. Arriving one way does not mean that way explains it.',
      body: conv.length ? branchesHtml(ctx, conv, event.id) : '<p class="muted">Nothing else fed this event.</p>',
    });
  }
  sections.push({
    key: 'sources',
    label: 'Sources',
    count: sourceCount,
    body: '<div data-slot="sources"><p class="muted">Loading…</p></div>',
  });
  if (narratives.length > 0) {
    sections.push({ key: 'part-of', label: 'Part of', count: narratives.length, body: ctx.partOfHtml(event.id, { bare: true }) });
  }

  const open = openSection(sections.map((s) => s.key), { chain: state.chain, source: state.source, remembered });

  return `
    ${breadcrumbHtml(ctx, chainEdges, event)}
    ${notices.join('')}
    <header class="event-head">
      ${ctx.historyHtml()}
      <h2>${esc(event.title)}</h2>
      <p class="meta">
        <span class="when">${whenLine(ctx, event)}</span>
        ${whereHtml(ctx, event)}
        · <span class="lane">${event.region ? esc(ctx.laneLabel(event.region)) : 'no lane'}</span>
        <button type="button" class="link small" data-action="year" data-year="${esc(ctx.startYear(event))}">map at ${esc(formatYear(ctx.startYear(event)))}</button>
        ${ctx.lensControl('event', event.id)}
      </p>
      ${partOfEventHtml(ctx, event)}
      ${subtreeLensHtml(ctx, event)}
      ${actorChipsHtml(ctx, event, highlightedActor?.id ?? null)}
      ${drawnHtml(ctx, event, state)}
      ${largeEventHtml(ctx, event)}
      <div class="head-links">${ctx.entryLink('event', event.id)}${ctx.wikipediaHtml(event)}${ctx.discussLink('event', event.id)}</div>
    </header>
    <section class="summary" data-slot="summary"><p class="muted">Loading…</p></section>
    ${sections.map((s) => sectionHtml({ ...s, open: s.key === open })).join('')}
  `;
}

export function renderEventCard(ctx, { container, event, found, state, mine, remembered = null }) {
  const { atlas } = ctx;
  const chainEdges = walkedEdges(atlas, state.chain);
  const lastEdge = chainEdges[chainEdges.length - 1] ?? null;
  container.innerHTML = eventCardHtml(ctx, { event, found, state, remembered });

  atlas.record('event', event.id).then(
    (rec) => {
      if (!ctx.isCurrent(mine)) return;
      container.querySelector('[data-slot="summary"]').innerHTML = `<p>${esc(rec.summary)}</p>`;
      // No sub-heading: the section's own header already says "Sources".
      container.querySelector('[data-slot="sources"]').innerHTML = rec.sources?.length
        ? ctx.citationsHtml(rec.sources, '', rec)
        : '<p class="muted">This event cites nothing yet.</p>';
    },
    () => {
      if (!ctx.isCurrent(mine)) return;
      container.querySelector('[data-slot="summary"]').innerHTML = '<p class="muted">Could not load the record text.</p>';
      container.querySelector('[data-slot="sources"]').innerHTML = '<p class="muted">Could not load the citations.</p>';
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
