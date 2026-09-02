// Event marks and the lines of the chain being followed. Renders only the
// events that have happened by the current year and have a place; a
// process with no honest point is timeline-only, not a dot in the ocean.

import { svg, svgTitle } from '../../util/dom.js';
import { extent } from '../../util/dates.js';

export function createEventsLayer(group, projection, { onSelect }) {
  group.addEventListener('click', (e) => {
    const mark = e.target.closest('[data-id]');
    if (mark) onSelect(mark.getAttribute('data-id'));
  });

  const place = (event) => (event.where ? projection.project([event.where.lon, event.where.lat]) : null);

  // year: astronomical, or null for "everything". k: current zoom factor,
  // so marks keep their screen size.
  return {
    render({ events, year, selected, pathIds, actorIds = null, chainEdges, consequenceEdges, eventById, k = 1 }) {
      group.replaceChildren();
      const line = (edge, cls) => {
        const a = eventById.get(edge.from);
        const b = eventById.get(edge.to);
        const pa = a && place(a);
        const pb = b && place(b);
        if (!pa || !pb) return;
        const classes = [cls, edge.confidence === 'disputed' ? 'disputed' : ''].join(' ').trim();
        group.appendChild(svg('line', { x1: pa[0], y1: pa[1], x2: pb[0], y2: pb[1], class: classes }));
      };
      for (const edge of consequenceEdges) line(edge, 'edge consequence');
      for (const edge of chainEdges) line(edge, 'edge chain');

      let selectedMark = null;
      for (const event of events) {
        const p = place(event);
        if (!p) continue;
        if (year !== null && extent(event.when).min > year) continue;
        const onPath = pathIds.has(event.id);
        const isSelected = event.id === selected;
        // The madder accent belongs to the walked path; an actor's events
        // are emphasised in cobalt so the two never say the same thing.
        const ofActor = actorIds ? actorIds.has(event.id) : false;
        const classes = ['mark', ofActor ? 'of-actor' : '', onPath ? 'on-path' : '', isSelected ? 'selected' : ''].join(' ').replace(/\s+/g, ' ').trim();
        const mark = svg('circle', {
          cx: p[0], cy: p[1], r: (isSelected ? 6 : 4) / k, class: classes, 'data-id': event.id,
        }, [svgTitle(event.title)]);
        if (isSelected) selectedMark = mark;
        else group.appendChild(mark);
      }
      if (selectedMark) group.appendChild(selectedMark);
    },
  };
}
