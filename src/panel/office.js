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
import { formatInterval, formatYear, fromAstronomical, extent as intervalExtent } from '../util/dates.js';
import { OFFICE_CATEGORY_LABEL } from '../vocab.js';
import { clusterPoints } from '../cluster.js';
import { sectionHtml, openSection } from './sections.js';

// The section key of the holders, so panel.js and the tests name it once.
export const HOLDERS_SECTION = 'holders';
// And of the strips on the actor's card.
export const OFFICES_SECTION = 'offices';

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

// ─── The tenure strip ──────────────────────────────────────────────────────
//
// One strip per office on the card of the actor the offices belong to:
// holders as bars over time, so that "who has held this post" is a picture
// and not a list of years to read down.
//
// It is laid out without measuring anything. A card is a string and nothing
// in panel.js measures its container, so the strip is an inline
// `<svg viewBox="0 0 1000 H">` with `preserveAspectRatio="none"`: it fits
// whatever width the pane has, and the bars keep their height because the
// element's own height is fixed in the stylesheet.
//
// The `+n` of a merged bar is HTML beside the SVG rather than an `<svg>
// <text>` inside it, for the same reason: with the aspect ratio thrown away
// the horizontal is squashed by whatever the pane happens to be, and a
// stretched glyph is not a number anybody can read. A rectangle survives
// that; a letter does not.
//
// The scale is the actor's own interval clamped to what the atlas holds, and
// it does not move with the reader's window — the rest of the actor card does
// not either. A strip that rescaled under the band would make the same post
// look like two different histories.
//
// A bar is a mark and not a control: an SVG rect takes no focus, so the
// keyboard path to a holder is the office's own name beside the strip, which
// opens the card where every turn is a real button. The strip is the picture;
// the card is the list.

export const STRIP_UNITS = 1000;
export const STRIP_HEIGHT = 24;
const BAR_Y = 5;
const BAR_HEIGHT = 14;
// Two bars whose middles are closer than this are drawn as one, in the
// strip's own units. The timeline merges at eleven pixels of a lane
// (`BAR_MERGE` there) and the strip is a thousand units across a panel column
// about a third that wide, so the same judgement is about thirty units here.
// It is a question about the drawing and not about the years.
const BAR_MERGE = 32;
// A turn of a single year is still a turn: below this a bar is a hairline
// nobody can hit.
const MIN_BAR = 4;

// The years the strip runs over: the actor's own interval, held inside what
// the atlas actually holds. An actor with no interval gets the whole extent,
// which is the honest answer for a body whose dates nobody has written.
export function stripScale(actor, extent) {
  if (!extent) return null;
  const own = actor?.when ? intervalExtent(actor.when) : null;
  const min = Math.max(own?.min ?? extent.min, extent.min);
  const max = Math.min(own?.max ?? extent.max, extent.max);
  return max > min ? { min, max } : null;
}

// Where every turn at one office goes on that scale. A tenure that falls
// wholly outside it is left out of the picture rather than pinned to an edge
// where it would claim years it does not have; the office's own card lists
// every one of them.
export function tenureBars(atlas, actor, office) {
  const scale = stripScale(actor, atlas.extent);
  if (!scale) return null;
  const span = scale.max - scale.min;
  const at = (year) => ((Math.min(Math.max(year, scale.min), scale.max) - scale.min) / span) * STRIP_UNITS;
  const bars = [];
  for (const tenure of atlas.tenuresByOffice.get(office.id) ?? []) {
    const years = intervalExtent(tenure.when);
    const to = years.max ?? scale.max;
    if (to < scale.min || years.min > scale.max) continue;
    const x = at(years.min);
    const width = Math.max(at(to) - x, MIN_BAR);
    bars.push({ id: tenure.id, tenure, x, width });
  }
  return { scale, bars };
}

// The bars merged as the timeline merges its own: one dimension, `k: 1`, and
// the distance in the units the picture is drawn in. The widest turn seeds a
// stack, so the bar that is drawn is the one the reader can see anyway.
export function tenureClusters(atlas, actor, office) {
  const laid = tenureBars(atlas, actor, office);
  if (!laid) return null;
  const clusters = clusterPoints(
    laid.bars.map((bar) => ({ id: bar.id, x: bar.x + bar.width / 2, y: 0, weight: bar.width, bar })),
    { k: 1, distance: BAR_MERGE, epsilon: 0 },
  );
  return { ...laid, clusters };
}

// One merged bar's members, for the list the panel shows when it is clicked.
// The click has only the office and the cluster's key to go on, so the
// grouping is done again here rather than being kept anywhere: it is pure and
// the same input gives the same answer.
export function tenureClusterAt(atlas, actor, office, key) {
  const laid = tenureClusters(atlas, actor, office);
  const cluster = laid?.clusters.find((c) => c.key === key) ?? null;
  if (!cluster) return null;
  return { ...cluster, on: 'tenures', office, members: cluster.members.map((m) => ({ tenure: m.bar.tenure })) };
}

const holderName = (atlas, tenure) => atlas.actors.get(tenure.person)?.name ?? tenure.person;

function stripHtml(ctx, actor, office) {
  const { atlas } = ctx;
  const laid = tenureClusters(atlas, actor, office);
  const tenures = atlas.tenuresByOffice.get(office.id) ?? [];
  if (!laid || laid.bars.length === 0) {
    return `<p class="muted strip-empty">${tenures.length
      ? 'No turn at this post falls inside the years the atlas holds.'
      : 'No turn at this post is recorded yet.'}</p>`;
  }
  const rects = [];
  const counts = [];
  for (const cluster of laid.clusters) {
    const { bar } = cluster.representative;
    const box = `x="${bar.x.toFixed(2)}" y="${BAR_Y}" width="${bar.width.toFixed(2)}" height="${BAR_HEIGHT}"`;
    const label = `${holderName(atlas, bar.tenure)} · ${formatInterval(bar.tenure.when)}`;
    if (cluster.count === 1) {
      // Clicking a bar opens the holder: a tenure has no card of its own.
      rects.push(`<rect class="tenure-bar" ${box} data-action="actor" data-id="${esc(bar.tenure.person)}"
        data-tenure="${esc(bar.tenure.id)}"><title>${esc(label)}</title></rect>`);
      continue;
    }
    rects.push(`<rect class="tenure-bar merged" ${box} data-action="tenure-cluster"
      data-office="${esc(office.id)}" data-cluster="${esc(cluster.key)}"
      data-tenure="${esc(bar.tenure.id)}"><title>${esc(`${cluster.count} turns here, ${label} the longest`)}</title></rect>`);
    counts.push(`<span class="tenure-count" style="left:${(((bar.x + bar.width) / STRIP_UNITS) * 100).toFixed(2)}%">+${cluster.count}</span>`);
  }
  const from = formatYear(fromAstronomical(laid.scale.min));
  const to = formatYear(fromAstronomical(laid.scale.max));
  return `<div class="tenure-strip">
      <svg viewBox="0 0 ${STRIP_UNITS} ${STRIP_HEIGHT}" preserveAspectRatio="none" role="img"
        aria-label="${esc(`${office.title ?? office.id}: ${tenures.length} turn${tenures.length === 1 ? '' : 's'} between ${from} and ${to}`)}">${rects.join('')}</svg>
      ${counts.join('')}
    </div>
    <p class="strip-scale muted"><span>${esc(from)}</span><span>${esc(to)}</span></p>`;
}

// The section on the actor's card: one office, one strip. The office's own
// name opens its card, where the same turns are a list with their sources'
// worth of detail.
export function officeStripsSection(ctx, actor) {
  const offices = ctx.atlas.officesByActor?.get(actor.id) ?? [];
  if (offices.length === 0) return null;
  const rows = offices.map((office) => {
    const tenures = ctx.atlas.tenuresByOffice.get(office.id) ?? [];
    return `<li class="office-row">
      <p class="office-row-head">
        <button type="button" class="link" data-action="office" data-id="${esc(office.id)}">${esc(office.title ?? office.id)}</button>
        <span class="muted">${esc(OFFICE_CATEGORY_LABEL[office.category] ?? office.category ?? '')}</span>
        <span class="count">${tenures.length}</span>
      </p>
      ${stripHtml(ctx, actor, office)}
    </li>`;
  });
  return {
    key: OFFICES_SECTION,
    label: 'Offices',
    count: offices.length,
    hint: 'Posts that belong to this actor, and who held each one. A bar opens the person; the post\'s name opens its own card.',
    body: `<ul class="office-rows">${rows.join('')}</ul>`,
  };
}
