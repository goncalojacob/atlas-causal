// The events under one mark on the map, one bar on the timeline, or one node
// of the graph.
// Not part of the state — clicking a cluster does not change what the URL
// points at — so the next state change replaces it, which is right: choosing
// one of them is what the list is for. It is also the keyboard path into a
// stack of marks, and the only way to see the whole stack at once.

import { esc } from '../util/esc.js';
import { formatYear } from '../util/dates.js';

export function clusterHtml(ctx, cluster) {
  const members = cluster.members
    .map((m) => m.event)
    .sort((a, b) => ctx.startYear(a) - ctx.startYear(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const onTimeline = cluster.on === 'timeline';
  const onGraph = cluster.on === 'graph';
  const onMap = !onTimeline && !onGraph;
  // On the map a stack is a place — a record of its own, so the heading names
  // it and opens its card; on the timeline it is a stretch of one lane, and
  // saying "here" of a lane means the lane's own name. In the graph "here" is
  // a stretch of time inside one band, so the band names it where there is
  // one and nothing does where the reader has switched grouping off.
  const place = onMap ? ctx.atlas.placeOf(cluster.representative.event) : null;
  const label = onMap
    ? ctx.atlas.pointOf(cluster.representative.event)?.label ?? null
    : cluster.lane?.label || null;
  const where = place
    ? `<span class="count"><button type="button" class="link" data-action="place" data-id="${esc(place.id)}">${esc(place.name)}</button></span>`
    : label ? `<span class="count">${esc(label)}</span>` : '';
  const hint = onTimeline
    ? 'The timeline draws these as one bar at this width. Narrow the window and they separate.'
    : onGraph
      ? cluster.coincident
        ? 'These sit at the same point of the arrangement, so no zoom the graph allows separates them. Choose one here.'
        : 'The graph draws these as one node at this zoom. Zoom in and they separate.'
      : cluster.coincident
        ? 'These records share the same coordinates, so no amount of zooming separates them. The map spreads them in a ring instead.'
        : 'The map draws these as one mark at this zoom. Zoom in and they separate.';
  const rows = members.map((event) => `<li class="actor-row">
    <span class="when">${esc(formatYear(ctx.startYear(event)))}</span>
    <button type="button" class="link" data-action="select" data-id="${esc(event.id)}">${esc(event.title)}</button>
    <span class="muted">${esc(ctx.laneLabel(event.region))}</span>
  </li>`);
  return `<section class="cluster-list">
    <h2>${members.length} event${members.length === 1 ? '' : 's'} here ${where}</h2>
    <p class="hint">${hint}</p>
    <ul class="actor-rows">${rows.join('')}</ul>
  </section>`;
}
