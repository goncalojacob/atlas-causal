// The office's card: a post held one person after another, the actor it
// belongs to, and every turn at it in the order they happened.
//
// An office asserts that the post exists and nothing more (CLAUDE.md), so it
// cites nothing and has no Sources section; the claim that somebody held it
// is the tenure, and the tenure is what carries the sources. That is said on
// the card rather than left as an empty header, the way the place card says
// why a place cites nothing.
//
// A tenure has no card of its own — `tenure.urlParam` is null — so a row here
// opens the person who held the post, and the event that began the turn where
// the record names one.

import { esc } from '../util/esc.js';
import { formatInterval } from '../util/dates.js';
import { OFFICE_CATEGORY_LABEL } from '../vocab.js';
import { sectionHtml, openSection } from './sections.js';

// The section key of the holders, so panel.js and the tests name it once.
export const HOLDERS_SECTION = 'holders';

// One turn at the post: who, when, and what began it. `startedBy` is an event
// and opens its own card; a tenure that names none says nothing rather than
// saying "unknown", which would be a claim the record does not make.
function tenureRowHtml(ctx, tenure) {
  const person = ctx.atlas.actors.get(tenure.person) ?? null;
  const who = person
    ? `<button type="button" class="link" data-action="actor" data-id="${esc(person.id)}">${esc(person.name)}</button>`
    : esc(tenure.person);
  const started = tenure.startedBy ? ctx.atlas.events.get(tenure.startedBy) ?? null : null;
  const began = started
    ? `<span class="row-meta">began with <button type="button" class="link" data-action="select" data-id="${esc(started.id)}">${esc(started.title)}</button></span>`
    : '';
  return `<li class="actor-row tenure-row" data-tenure="${esc(tenure.id)}">
    <span class="row-what">${who}</span>
    <span class="when">${esc(formatInterval(tenure.when))}</span>
    ${began}
    ${tenure.note ? `<span class="row-meta muted">${esc(tenure.note)}</span>` : ''}
  </li>`;
}

// Exported for the tests: there is no DOM in node --test, and the card is the
// string, as the actor's and the place's are.
export function officeCardHtml(ctx, office, { state = null, remembered = null } = {}) {
  const of = ctx.atlas.actors.get(office.of) ?? null;
  const belongs = of
    ? `<button type="button" class="link" data-action="actor" data-id="${esc(of.id)}">${esc(of.name)}</button>`
    : esc(office.of ?? '');
  const category = OFFICE_CATEGORY_LABEL[office.category] ?? office.category ?? '';
  const tenures = ctx.atlas.tenuresByOffice.get(office.id) ?? [];
  const rows = tenures.map((tenure) => tenureRowHtml(ctx, tenure));

  const sections = [{
    key: HOLDERS_SECTION,
    label: 'Who held it',
    count: tenures.length,
    body: tenures.length
      ? `<ul class="actor-rows">${rows.join('')}</ul>`
      : '<p class="muted">No turn at this post is recorded yet.</p>',
  }];
  const open = openSection(sections.map((s) => s.key), {
    source: state?.source ?? null, remembered,
  });

  return `<section class="card office-card">
    ${office.status !== 'active' ? `<p class="notice status">This office is <strong>${esc(office.status)}</strong>.</p>` : ''}
    <header class="office-head">
      ${ctx.historyHtml()}
      <h2>${esc(office.title ?? office.id)}</h2>
      <p class="meta">
        ${belongs}
        · <span class="office-category">${esc(category)}</span>
        ${office.when ? ` · <span class="when">${esc(formatInterval(office.when))}</span>` : ''}
        <button type="button" class="link small" data-action="clear-office">close</button>
      </p>
      <div class="head-links">${ctx.wikipediaHtml(office)}${ctx.discussLink('office', office.id)}</div>
    </header>
    <section class="summary" data-slot="office-summary"></section>
    ${sections.map((s) => sectionHtml({ ...s, open: s.key === open })).join('')}
    <p class="muted office-cites">An office says that the post exists and nothing more, so it cites nothing.
      Each turn at it is a tenure, and the tenure is what carries the sources.</p>
  </section>`;
}

export function renderOfficeCard(ctx, {
  container, office, mine, state = null, remembered = null,
}) {
  container.innerHTML = officeCardHtml(ctx, office, { state, remembered });
  // The spine carries an office without its prose, so the summary is fetched
  // and nothing on the card waits for it — most offices have none.
  ctx.atlas.record('office', office.id).then(
    (rec) => {
      if (!ctx.isCurrent(mine)) return;
      const slot = container.querySelector('[data-slot="office-summary"]');
      if (slot && rec.summary) slot.innerHTML = `<p>${esc(rec.summary)}</p>`;
    },
    () => {},
  );
}
