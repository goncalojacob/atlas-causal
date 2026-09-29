// The link's card: what kind of claim it is, which two events it runs
// between, how sure the atlas is of it and why, what it rests on, and who
// disagrees.
//
// The owner, 22 September: *"In the graph I should be able to select a
// connection the same way I select an event, so I can check its sources,
// description, etc."* Until M80 an edge was the one record with an argument
// in it that had no card: it was walked — the panel showed the event at the
// far end and folded the argument into a `<details>` labelled "Why" — and a
// reader who wanted to read the link itself, rather than where it led, had
// nowhere to go. `?edge=<id>` is its address now and this is what opens
// there.
//
// **Choosing a link is not a lens.** Nothing in `lens.js` reads `edge`, so no
// picture narrows when one is opened: the line is drawn as chosen, its two
// ends are named, and the card is shown. A lens on a link would be a lens on
// its two events, which is what `vocab.js` has said since H7 about why an
// edge is not a focus kind.
//
// The head is drawn out of the core, which carries an edge's five slots — the
// two ends, the type, the confidence and the status — so the type, the
// confidence and both titles are on screen at once. Everything under it is
// the record's own text and arrives with the file, exactly as an event's
// summary and citations do.
//
// **And the head is the link, not the link's type** (M82, A11). It was a `<h2>`
// reading "enabled", with the two ends on the line under it — so the card of
// the one record in this atlas that is *between* two things was titled with the
// one word that says nothing about which two. The reviewer, on
// `m80-edge-chosen.png`: *"the card is headed 'enabled'"*. The heading is now
// what the link is — this event, the type, that event — which is also how
// `openingLabel` has named an edge in the breadcrumb since M80, and the
// confidence stands on the line below where the type used to repeat itself.

import { esc } from '../util/esc.js';
import { formatInterval } from '../util/dates.js';
import { sectionHtml, openSection } from './sections.js';
import { EDGE_TYPE_READING } from '../vocab.js';
import { badge, CONFIDENCE_HINT } from './event.js';
// How far this record has been read, in one line (M70). The slot goes in the
// card's head and is filled when the record's own file lands, because the core
// row a card is built from carries no signature.
import { standingSlot, fillStanding } from '../standing.js';
// The cross in the card's top right, the same on every card (M84).
import { closeControlHtml } from './close.js';

// One end of the link, named and opened. A link is between two events and
// says so in the order it was written — this one, then that one — so each end
// is the plain event control every other list uses, and choosing one leaves
// the link's card for the event's (state.js, `closedEdge`).
function endHtml(ctx, id, which) {
  const event = ctx.atlas.events.get(id);
  if (!event) return `<span class="end ${esc(which)} missing">unknown event <code>${esc(id)}</code></span>`;
  return `<span class="end ${esc(which)}">
    <button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>
    <span class="when">${esc(formatInterval(event.when))}</span></span>`;
}

// Exported for the tests: there is no DOM in node --test, and the card is the
// string, as the event's and the actor's are.
export function edgeCardHtml(ctx, { edge, state, remembered = null }) {
  const { atlas } = ctx;
  const narratives = atlas.narrativesByRef?.get(edge.id) ?? [];

  const notices = [];
  if (edge.status !== 'active') {
    notices.push(`<p class="notice status">This link is <strong>${esc(edge.status)}</strong>; it is in no picture and no path runs through it.</p>`);
  }

  const sections = [];
  sections.push({
    key: 'sources',
    label: 'Sources',
    // No count in the header. `citesCount` is written at build time for the
    // three kinds whose cards print it (data.js) and an edge is not one of
    // them, and a number invented here — counted off a record that has not
    // landed — would be a count of nothing for as long as the fetch takes.
    count: null,
    body: '<div data-slot="edge-sources"><p class="muted">Loading…</p></div>',
  });
  if (edge.confidence === 'disputed') {
    sections.push({
      key: 'dispute',
      label: 'The dispute',
      count: null,
      disputed: 1,
      hint: 'Qualified historians disagree about this link. Who, and why, with the dissenting citations.',
      body: '<div data-slot="edge-dispute"><p class="muted">Loading…</p></div>',
    });
  }
  if (narratives.length > 0) {
    sections.push({
      key: 'part-of', label: 'Part of', count: narratives.length, body: ctx.partOfHtml(edge.id, { bare: true }),
    });
  }
  const open = openSection(sections.map((s) => s.key), { source: state.source, remembered });

  return `
    ${notices.join('')}
    <header class="edge-card-head">
      ${closeControlHtml()}
      ${ctx.historyHtml()}
      <h2 class="link-ends">${endHtml(ctx, edge.from, 'from')}
        <span class="arrow">${esc(EDGE_TYPE_READING[edge.type] ?? edge.type)} →</span>
        ${endHtml(ctx, edge.to, 'to')}</h2>
      <p class="meta">${badge(edge.confidence)}
        <span class="confidence-hint">${esc(CONFIDENCE_HINT[edge.confidence] ?? '')}</span></p>
      ${standingSlot()}
      <div class="head-links">${ctx.discussLink('edge', edge.id)}</div>
    </header>
    <section class="summary" data-slot="edge-explanation"><p class="muted">Loading…</p></section>
    ${sections.map((s) => sectionHtml({ ...s, open: s.key === open })).join('')}
  `;
}

export function renderEdgeCard(ctx, { container, edge, state, mine, remembered = null }) {
  container.innerHTML = edgeCardHtml(ctx, { edge, state, remembered });
  ctx.atlas.record('edge', edge.id).then(
    (rec) => {
      if (!ctx.isCurrent(mine)) return;
      // The argument itself, which is the whole of what a link asserts and is
      // written by a person (CLAUDE.md). It goes where an event's summary
      // goes, because on this card it *is* the summary.
      container.querySelector('[data-slot="edge-explanation"]').innerHTML = `<p class="explanation">${esc(rec.explanation)}</p>`;
      container.querySelector('[data-slot="edge-sources"]').innerHTML = rec.sources?.length
        ? ctx.citationsHtml(rec.sources, '', rec)
        : '<p class="muted">This link cites nothing yet.</p>';
      const dispute = container.querySelector('[data-slot="edge-dispute"]');
      if (dispute) {
        dispute.innerHTML = rec.dispute
          ? `<p>${esc(rec.dispute.text)}</p>${ctx.citationsHtml(rec.dispute.sources, 'Dissenting sources', rec)}`
          : '<p class="muted">The record names no dissent.</p>';
      }
      fillStanding(container, rec);
    },
    () => {
      if (!ctx.isCurrent(mine)) return;
      container.querySelector('[data-slot="edge-explanation"]').innerHTML = '<p class="muted">Could not load the record text.</p>';
      container.querySelector('[data-slot="edge-sources"]').innerHTML = '<p class="muted">Could not load the citations.</p>';
    },
  );
}
