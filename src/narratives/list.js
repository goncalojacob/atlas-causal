// narratives.html, as markup. Pure — narratives and the records they walk in,
// HTML out — so what the page lists can be held to its promises by node --test
// without a browser, the way the bibliography is.
//
// Generated at render from the index and never hand-written: a narrative
// added to data/narratives/ appears here the moment the index is rebuilt.
//
// The arrangement is the one thing this page has that the panel's list does
// not: **narratives are grouped by the centuries they cross**, so two
// accounts of the same years sit side by side and can be read against each
// other, which is what CONTEXT.md says narratives are for. A narrative that
// runs across a century boundary is listed under both centuries — it is an
// index and not a list of records, and hiding it from one of the two periods
// it is about would be the wrong kind of tidiness. Each card carries its own
// full period, so no reader has to work out which of the two they are in.

import { esc } from '../util/esc.js';
import { bounds, toAstronomical, formatYear } from '../util/dates.js';

// A narrative's period is the years of the records it walks, and not the
// `window` on the record: the window says what the atlas opens on, which is
// a choice about the picture, while this is what the account is about. A
// step pointing at a link is at the far end of it — that is the event the
// step arrives at (narrative.js resolves it the same way).
export function periodOf(narrative, { events, edges } = {}) {
  let min = null;
  let max = null;
  for (const step of narrative?.steps ?? []) {
    const edge = edges?.get?.(step.ref);
    const event = edge ? events?.get?.(edge.to) : events?.get?.(step.ref);
    if (!event?.when) continue;
    const start = bounds(event.when.start);
    // An ongoing record has no end year to reach; its start still counts.
    const end = event.when.end === null ? start : bounds(event.when.end);
    if (min === null || toAstronomical(start.min) < toAstronomical(min)) min = start.min;
    if (max === null || toAstronomical(end.max) > toAstronomical(max)) max = end.max;
  }
  return min === null ? null : { from: min, to: max };
}

// The century a year is in, as a number: 1961 → 20, 1415 → 15, 1 BCE → -1.
// Through toAstronomical, like every other piece of year arithmetic here, so
// the missing year 0 cannot produce an off-by-one in this file alone.
export function centuryOf(year) {
  const value = toAstronomical(year);
  return value > 0 ? Math.floor((value - 1) / 100) + 1 : -(Math.floor(-value / 100) + 1);
}

export function centuriesOf(period) {
  if (!period) return [];
  const first = centuryOf(period.from);
  const last = centuryOf(period.to);
  const out = [];
  for (let c = first; c <= last; c += 1) {
    // There is no century 0 for the same reason there is no year 0.
    if (c !== 0) out.push(c);
  }
  return out;
}

// "The 20th century", "The 15th century BCE". Ordinals rather than words:
// a list of headings is scanned, and "The sixteenth century" above "The
// seventeenth" is two words a reader has to actually read.
export function centuryLabel(century) {
  const n = Math.abs(century);
  const tens = n % 100;
  const ones = n % 10;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[ones] ?? 'th');
  return `The ${n}${suffix} century${century < 0 ? ' BCE' : ''}`;
}

export function formatPeriod(period) {
  if (!period) return 'no dated record';
  return period.from === period.to ? formatYear(period.from) : `${formatYear(period.from)}–${formatYear(period.to)}`;
}

function authorsOf(narrative) {
  const names = (narrative.authors ?? []).map((a) => a?.name).filter(Boolean);
  return names.length ? names.join(', ') : 'unsigned';
}

// Every narrative, in every century it crosses, oldest century first and
// inside each one the earliest account first — then by title, then by id, so
// the page is the same page on every machine (compareSources says why).
export function groupByCentury(narratives, records = {}) {
  const cards = (narratives ?? [])
    .filter((n) => n.status === 'active')
    .map((n) => ({ narrative: n, period: periodOf(n, records) }));
  const groups = new Map();
  // A narrative whose steps resolve to nothing dated is still a narrative and
  // is still listed; it simply has no century to be in.
  const undated = cards.filter((c) => c.period === null);
  for (const card of cards) {
    for (const century of centuriesOf(card.period)) {
      if (!groups.has(century)) groups.set(century, []);
      groups.get(century).push(card);
    }
  }
  const order = (a, b) => {
    const ka = [toAstronomical(a.period.from), a.narrative.title ?? '', a.narrative.id];
    const kb = [toAstronomical(b.period.from), b.narrative.title ?? '', b.narrative.id];
    for (let i = 0; i < ka.length; i += 1) {
      if (ka[i] < kb[i]) return -1;
      if (ka[i] > kb[i]) return 1;
    }
    return 0;
  };
  const out = [...groups.keys()].sort((a, b) => a - b).map((century) => ({
    century,
    label: centuryLabel(century),
    cards: groups.get(century).sort(order),
  }));
  if (undated.length) {
    out.push({
      century: null,
      label: 'No dated record',
      cards: undated.sort((a, b) => (a.narrative.title ?? '').localeCompare?.(b.narrative.title ?? '') ?? 0),
    });
  }
  return out;
}

// One card. The title opens the narrative at its first step, which is the
// only thing this page is for: `?narrative=<id>&step=0`, and step 0 is step
// one — the panel numbers them for the reader and the URL counts from zero,
// as it has since M12.
function cardHtml({ narrative, period }) {
  const steps = (narrative.steps ?? []).length;
  return `<li class="narrative-card">
    <h3><a href="index.html?narrative=${encodeURIComponent(narrative.id)}&amp;step=0">${esc(narrative.title)}</a></h3>
    <p class="narrative-meta">
      <span class="narrator">${esc(authorsOf(narrative))}</span>
      · <span class="when">${esc(formatPeriod(period))}</span>
      · <span class="count">${steps} step${steps === 1 ? '' : 's'}</span>
    </p>
    <p class="narrative-summary">${esc(narrative.summary ?? '')}</p>
  </li>`;
}

export function narrativesHtml(narratives, records = {}) {
  const active = (narratives ?? []).filter((n) => n.status === 'active');
  if (active.length === 0) {
    return `<p class="muted">No narrative has been written yet. A narrative is a signed walk through
      records that are already here; several may cross the same period and disagree, and the reader
      compares them.</p>`;
  }
  const groups = groupByCentury(narratives, records);
  const listed = groups.reduce((n, g) => n + g.cards.length, 0);
  const sections = groups.map((group) => `<section class="narrative-period">
    <h2>${esc(group.label)} <span class="count">${group.cards.length}</span></h2>
    <ol class="narrative-cards">${group.cards.map(cardHtml).join('')}</ol>
  </section>`);
  return `<p class="bib-summary">${active.length} narrative${active.length === 1 ? '' : 's'},
    arranged by the centuries they cross${listed > active.length ? ', an account that crosses two listed under both' : ''}.
    Each title opens the account at its first step.</p>
    ${sections.join('')}`;
}
