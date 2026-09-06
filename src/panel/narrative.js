// The card of a narrative being read, the "Part of" list on every other
// card, and the pair of keys that move a step.
//
// Reading is a mode (narrative-mode.js). This file draws the step the reader
// is at — the narrator's own words, then the record those words are about,
// as the panel already renders it — and the controls that move the step. The
// map, the graph and the timeline follow because the state they read was
// derived from the step before they were told about it.

import { esc } from '../util/esc.js';
import { formatInterval } from '../util/dates.js';
import { narrativeSteps, readingNarrative, clampStep } from '../narrative.js';
import { TYPE_LABEL, badge } from './event.js';
import { RELATION_LABEL } from '../vocab.js';

function authorsLine(narrative) {
  const names = (narrative.authors ?? []).map((a) => a.name).filter(Boolean);
  return names.length ? esc(names.join(', ')) : 'unsigned';
}

// The narratives a record is part of, wherever a record is shown. Empty when
// none passes through it, so nothing is said about a record that no one has
// written about yet.
// `bare` leaves off the section and its heading: on a card the list is drawn
// inside a collapsible section that already carries the label and the count
// (sections.js), and a second heading there would be the same words twice.
// An edge has no card, so its explanation still asks for the whole thing.
export function partOfHtml(ctx, id, { bare = false } = {}) {
  const list = ctx.atlas.narrativesByRef?.get(id) ?? [];
  if (list.length === 0) return '';
  const items = list.map((n) => `<li class="narrative-row">
    <button type="button" class="link" data-action="narrative" data-id="${esc(n.id)}">${esc(n.title)}</button>
    <span class="muted">${authorsLine(n)}</span>
  </li>`);
  const inner = `<p class="hint">Narratives that walk through this record. A narrative is one person's account and changes nothing it walks.</p>
    <ul class="narrative-rows">${items.join('')}</ul>`;
  return bare ? inner : `<section class="part-of"><h2>Part of <span class="count">${list.length}</span></h2>${inner}</section>`;
}

// What the walk calls a step, one line, for the list at the foot of the card.
// An edge is named by the event it arrives at, which is what it always was;
// the three kinds H7 added are named by themselves, and a ref that resolves to
// nothing is drawn as the ref, so a gap in a walk says which id it is a gap in.
export function stepLabel(ctx, step) {
  if (step.event) return step.event.title;
  if (step.kind === 'actor') return step.record.name ?? step.ref;
  if (step.kind === 'presence') return ctx.atlas.actors.get(step.record.actor)?.name ?? step.record.actor;
  if (step.kind === 'relation') {
    const name = (id) => ctx.atlas.actors.get(id)?.name ?? id;
    return `${name(step.record.from)} — ${RELATION_LABEL[step.record.type]?.out ?? step.record.type} → ${name(step.record.to)}`;
  }
  return step.ref;
}

// One step: the record it is about, drawn as the panel draws that kind
// elsewhere. The prose above it is the narrator's; this is the atlas's.
function stepRecordHtml(ctx, resolved) {
  if (resolved.kind === 'edge') {
    const { edge } = resolved;
    const from = ctx.atlas.events.get(edge.from);
    const to = ctx.atlas.events.get(edge.to);
    return `<section class="step-record">
      <p class="edge-head">
        <span class="arrow">${esc(from?.title ?? edge.from)} — ${esc(TYPE_LABEL[edge.type] ?? edge.type)} → ${esc(to?.title ?? edge.to)}</span>
        ${badge(edge.confidence)}
      </p>
      <div data-slot="step-record"><p class="muted">Loading…</p></div>
    </section>`;
  }
  if (resolved.kind === 'event') {
    const { event } = resolved;
    return `<section class="step-record">
      <p class="edge-head"><span class="arrow">${esc(event.title)}</span> <span class="when">${esc(formatInterval(event.when))}</span></p>
      <div data-slot="step-record"><p class="muted">Loading…</p></div>
    </section>`;
  }
  // Since H7 a step may name an actor, a relation or a presence. None of the
  // three is an event, so the views draw nothing new for it and the card says
  // what it is out of the topology alone: an actor's card and a relation's
  // two ends are already in hand, and a presence carries no text at all.
  if (resolved.kind === 'actor') {
    const actor = resolved.record;
    return `<section class="step-record">
      <p class="edge-head">
        <button type="button" class="link" data-action="actor" data-id="${esc(actor.id)}">${esc(actor.name ?? actor.id)}</button>
        <span class="when">${esc(formatInterval(actor.when))}</span>
      </p>
      <p class="hint">An actor, not an event: this step is about who, not about what happened.</p>
    </section>`;
  }
  if (resolved.kind === 'relation') {
    const relation = resolved.record;
    const name = (id) => esc(ctx.atlas.actors.get(id)?.name ?? id);
    const label = RELATION_LABEL[relation.type]?.out ?? relation.type;
    return `<section class="step-record">
      <p class="edge-head"><span class="arrow">${name(relation.from)} — ${esc(label)} → ${name(relation.to)}</span>
        <span class="when">${esc(formatInterval(relation.when))}</span></p>
      ${relation.note ? `<p class="muted">${esc(relation.note)}</p>` : ''}
      <p class="hint">A link between actors, not between events.</p>
    </section>`;
  }
  if (resolved.kind === 'presence') {
    const presence = resolved.record;
    const held = esc(ctx.atlas.actors.get(presence.actor)?.name ?? presence.actor);
    return `<section class="step-record">
      <p class="edge-head">
        <button type="button" class="link" data-action="actor" data-id="${esc(presence.actor)}">${held}</button>
        <span class="when">${esc(formatInterval(presence.when))}</span>
      </p>
      ${presence.capital ? `<p class="muted">${esc(presence.capital.label)}</p>` : ''}
      <p class="hint">Ground held, not an event: what the map draws for this actor in those years.</p>
    </section>`;
  }
  return `<section class="step-record"><p class="notice">This step names <code>${esc(resolved.ref)}</code>, which is not in the atlas.</p></section>`;
}

export function renderNarrativeCard(ctx, { container, narrative, state, mine }) {
  const steps = narrativeSteps(ctx.atlas, narrative);
  const index = clampStep(narrative, state.step);
  const resolved = steps[index] ?? null;
  const total = steps.length;

  const walk = steps.map((step, i) => `<li class="step ${i === index ? 'current' : ''} ${i < index ? 'walked' : ''}">
    <button type="button" class="link" data-action="narrative-step" data-step="${i}">${esc(stepLabel(ctx, step))}</button>
  </li>`);

  container.innerHTML = `
    <p class="notice narrative">Reading a narrative. The map, the graph and the timeline follow the step.
      <button type="button" class="link small" data-action="leave-narrative">leave</button></p>
    <header class="narrative-head">
      <h2>${esc(narrative.title)}</h2>
      <p class="meta"><span class="muted">${authorsLine(narrative)}</span> · <span class="count">step ${index + 1} of ${total}</span></p>
      <p class="entry-link"><a href="narratives.html">Every narrative, by the years it is about →</a></p>
      ${ctx.discussLink('narrative', narrative.id)}
    </header>
    <section class="step-text" data-slot="step-text"><p class="muted">Loading…</p></section>
    ${resolved ? stepRecordHtml(ctx, resolved) : ''}
    <p class="actions">
      <button type="button" data-action="narrative-step" data-step="${index - 1}" ${index === 0 ? 'disabled' : ''}>← Previous</button>
      <button type="button" data-action="narrative-step" data-step="${index + 1}" ${index >= total - 1 ? 'disabled' : ''}>Next →</button>
    </p>
    <section class="narrative-walk"><h2>The walk</h2><ol class="steps">${walk.join('')}</ol></section>
    <section class="summary"><h2>What it claims</h2><p>${esc(narrative.summary)}</p></section>
    <section class="sources" data-slot="narrative-sources"></section>
  `;

  // The step's prose lives in the record, not in the index: the topology
  // carries the refs so the views can follow the walk, and the words come
  // with the record when the step is read.
  ctx.atlas.record('narrative', narrative.id).then(
    (record) => {
      if (!ctx.isCurrent(mine)) return;
      const text = record.steps?.[index]?.text ?? '';
      container.querySelector('[data-slot="step-text"]').innerHTML = `<p>${esc(text)}</p>`;
      container.querySelector('[data-slot="narrative-sources"]').innerHTML = ctx.citationsHtml(record.sources, 'What this narrative rests on');
    },
    () => {
      if (!ctx.isCurrent(mine)) return;
      container.querySelector('[data-slot="step-text"]').innerHTML = '<p class="muted">Could not load the narrative.</p>';
    },
  );

  const slot = () => container.querySelector('[data-slot="step-record"]');
  if (resolved?.kind === 'edge') {
    ctx.atlas.record('edge', resolved.edge.id).then(
      (record) => { if (ctx.isCurrent(mine)) slot().innerHTML = ctx.edgeTextHtml(record); },
      () => { if (ctx.isCurrent(mine)) slot().innerHTML = '<p class="muted">Could not load the link text.</p>'; },
    );
  } else if (resolved?.kind === 'event') {
    ctx.atlas.record('event', resolved.event.id).then(
      (record) => {
        if (!ctx.isCurrent(mine)) return;
        slot().innerHTML = `<p>${esc(record.summary)}</p>${ctx.citationsHtml(record.sources, 'Sources for this event')}`;
      },
      () => { if (ctx.isCurrent(mine)) slot().innerHTML = '<p class="muted">Could not load the record text.</p>'; },
    );
  }
}

// The arrow keys, while a narrative is open. Bound to the document because a
// reader stepping through a walk is looking at the map, not at the panel; a
// key typed into a field is left alone.
export function bindNarrativeKeys(target, { atlas, state }) {
  target.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.target;
    if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
    const s = state.get();
    const narrative = readingNarrative(atlas, s);
    if (!narrative) return;
    const step = clampStep(narrative, s.step);
    if (e.key === 'ArrowRight') {
      if (step < (narrative.steps ?? []).length - 1) state.set({ step: step + 1 });
    } else if (e.key === 'ArrowLeft') {
      if (step > 0) state.set({ step: step - 1 });
    } else if (e.key === 'Escape') {
      state.set({ narrative: null });
    } else {
      return;
    }
    e.preventDefault();
  });
}
