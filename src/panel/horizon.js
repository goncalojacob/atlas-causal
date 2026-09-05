// "What did this lead to by year X?" — the panel's half of it. The traversal
// is graph.js and horizon.js; this file only asks and draws.
//
// A different question from the consequences list above it, which is one
// step out. This one is the whole downstream, cut at a year the reader
// chooses, ordered by how far away it is and then by when it happened: what
// this event had led to by 1976, and how directly. Choosing a line walks the
// shortest path to it, which turns the answer back into a chain — and a
// chain has convergence, so the reader can then ask what else fed the
// endpoint they picked.
//
// The default year is the window's far end and is never written to the URL.
// Only a chosen year lights the reachable set on the map, the graph and the
// timeline (util/window.js).

import { esc } from '../util/esc.js';
import { formatYear, fromAstronomical } from '../util/dates.js';
import { horizonResults, horizonYear, SHOWN } from '../horizon.js';
import { badge, TYPE_LABEL } from './event.js';

// A list, not a listing: past `SHOWN` the answer stops being readable and
// the count in the summary is the honest figure. The number is horizon.js's,
// because the same one decides how much of the answer the map and the graph
// keep out of their stacks.

function rowHtml(ctx, result) {
  const { event, first, depth, disputed } = result;
  return `<li class="actor-row horizon-row${disputed ? ' disputed' : ''}">
    <span class="when">${esc(formatYear(ctx.startYear(event)))}</span>
    <button type="button" class="link" data-action="horizon-walk" data-id="${esc(event.id)}">${esc(event.title)}</button>
    ${first ? `<span class="arrow">${esc(TYPE_LABEL[first.type] ?? first.type)}</span> ${badge(first.confidence)}` : ''}
    <span class="depth">${depth} step${depth === 1 ? '' : 's'}</span>
    ${disputed ? '<span class="badge disputed">through a dispute</span>' : ''}
  </li>`;
}

export function horizonHtml(ctx, { event, state }) {
  const horizon = horizonYear(ctx.atlas, state);
  if (horizon === null) return '';
  const chosen = state.horizon !== null && state.horizon !== undefined;
  const year = fromAstronomical(horizon);
  const results = horizonResults(ctx.atlas, state, event.id);
  const shown = results.slice(0, SHOWN);
  const hidden = results.length - shown.length;
  const bounds = ctx.atlas.extent
    ? `min="${esc(fromAstronomical(ctx.atlas.extent.min))}" max="${esc(fromAstronomical(ctx.atlas.extent.max))}"`
    : '';
  return `<section class="horizon">
    <details${chosen ? ' open' : ''}>
      <summary>What did this lead to by <strong>${esc(formatYear(year))}</strong>?
        <span class="count">${results.length}</span></summary>
      <p class="horizon-control">
        <label for="horizon-year">by the year</label>
        <input type="number" id="horizon-year" data-horizon step="1" ${bounds} value="${esc(year)}">
        ${chosen ? '<button type="button" class="link small" data-action="clear-horizon">back to the window’s end</button>' : ''}
      </p>
      <p class="hint">Everything this event leads to, however far away, that had begun by then —
        ordered by how many steps away it is, then by when. Choosing one walks the shortest path
        to it${chosen ? ', and the whole set is lit on the map, the graph and the timeline' : ''}.</p>
      ${results.length
    ? `<ul class="actor-rows">${shown.map((r) => rowHtml(ctx, r)).join('')}</ul>
        ${hidden > 0 ? `<p class="muted">and ${hidden} more, further out.</p>` : ''}`
    : `<p class="muted">Nothing this event leads to had begun by ${esc(formatYear(year))}.</p>`}
    </details>
  </section>`;
}
