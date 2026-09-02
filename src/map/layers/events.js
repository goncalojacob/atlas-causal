// Event marks and the lines of the chain being followed. Renders only the
// events that have happened by the current year and have a place; a
// process with no honest point is timeline-only, not a dot in the ocean.
//
// Marks that overlap are drawn as one, with a count of what is underneath.
// Thirty-seven of the sixty records in the test dataset sit on the same
// point in Lisbon, and one circle on top of thirty-six others tells the
// reader there is one event there. cluster.js decides the grouping and this
// file draws it; what is never grouped is decided here — the selected
// event, the path being walked, the endpoints of a drawn edge and the
// events of the selected actor are always their own mark, so the chain a
// reader is following is never swallowed by a cluster.

import { svg, svgTitle } from '../../util/dom.js';
import { extent } from '../../util/dates.js';
import { clusterPoints, spreadPositions, SPREAD_RADIUS, SPREAD_GAP } from '../cluster.js';

// Sizes in SVG units at k = 1; every one of them is divided by k when drawn,
// so a mark, a badge and a label keep their size on screen at any zoom.
const MARK_RADIUS = 5;
const SELECTED_RADIUS = 7;
const HIT_RADIUS = 10;
const BADGE_SIZE = 10;
const LABEL_SIZE = 11;
// Labels would be noise on the whole world; they start once the reader has
// zoomed to about a country, and only the heaviest clusters on screen get
// one.
const LABEL_ZOOM = 4;
const LABEL_LIMIT = 12;
const LABEL_CHARS = 30;

function textNode(text, attrs) {
  const el = svg('text', attrs);
  el.textContent = text;
  return el;
}

function shorten(text, chars = LABEL_CHARS) {
  return text.length > chars ? `${text.slice(0, chars - 1).trimEnd()}…` : text;
}

function markClasses(event, { selected, pathIds, actorIds }) {
  // The madder accent belongs to the walked path; an actor's events are
  // emphasised in cobalt so the two never say the same thing.
  return ['mark',
    actorIds && actorIds.has(event.id) ? 'of-actor' : '',
    pathIds.has(event.id) ? 'on-path' : '',
    event.id === selected ? 'selected' : '',
  ].join(' ').replace(/\s+/g, ' ').trim();
}

export function createEventsLayer(group, projection, { onSelect, onCluster = null }) {
  // What the last render drew, so a click on a cluster can be answered with
  // the cluster itself rather than with an id the caller would have to look
  // the members up from.
  let drawn = new Map();

  group.addEventListener('click', (e) => {
    const el = e.target.closest('[data-id], [data-cluster]');
    if (!el) return;
    const id = el.getAttribute('data-id');
    if (id) {
      onSelect(id);
      return;
    }
    const cluster = drawn.get(el.getAttribute('data-cluster'));
    if (cluster && onCluster) onCluster(cluster);
  });

  const place = (event) => (event.where ? projection.project([event.where.lon, event.where.lat]) : null);

  // year: astronomical, or null for "everything". k: current zoom factor.
  // view: the rectangle of projected space on screen, for deciding which
  // clusters are worth labelling. spread: the key of a coincident cluster
  // the reader has opened, or null.
  return {
    render({
      events, year, selected, pathIds, actorIds = null, chainEdges, consequenceEdges,
      eventById, k = 1, view = null, spread = null,
    }) {
      group.replaceChildren();
      drawn = new Map();

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

      // An invisible circle behind every mark, so a click that is merely
      // close still lands. Both carry the same data attribute; the handler
      // does not care which was hit.
      const appendMark = (target, { x, y, radius, classes, title, id = null, cluster = null }) => {
        const data = id === null ? { 'data-cluster': cluster } : { 'data-id': id };
        target.appendChild(svg('circle', { cx: x, cy: y, r: HIT_RADIUS / k, class: 'hit', ...data }));
        const mark = svg('circle', { cx: x, cy: y, r: radius / k, class: classes, ...data }, [svgTitle(title)]);
        target.appendChild(mark);
        return mark;
      };

      const visible = [];
      for (const event of events) {
        const p = place(event);
        if (!p) continue;
        if (year !== null && extent(event.when).min > year) continue;
        visible.push({ event, x: p[0], y: p[1] });
      }

      // Everything the reader is currently working with keeps its own mark.
      const drawnAlone = new Set([...chainEdges, ...consequenceEdges].flatMap((e) => [e.from, e.to]));
      if (selected) drawnAlone.add(selected);
      for (const id of pathIds) drawnAlone.add(id);
      if (actorIds) for (const id of actorIds) drawnAlone.add(id);

      const alone = visible.filter((v) => drawnAlone.has(v.event.id));
      const clusters = clusterPoints(
        visible.filter((v) => !drawnAlone.has(v.event.id))
          .map((v) => ({ id: v.event.id, x: v.x, y: v.y, weight: v.event.weight ?? 0, event: v.event })),
        { k },
      );
      for (const cluster of clusters) drawn.set(cluster.key, cluster);

      const opened = spread ? drawn.get(spread) ?? null : null;
      const spreadCluster = opened && opened.coincident && opened.count > 1 ? opened : null;

      for (const cluster of clusters) {
        const event = cluster.representative.event;
        if (cluster.count === 1) {
          appendMark(group, {
            x: cluster.x, y: cluster.y, radius: MARK_RADIUS, title: event.title, id: event.id,
            classes: markClasses(event, { selected, pathIds, actorIds }),
          });
          continue;
        }
        const hidden = cluster.count - 1;
        const title = `${event.title} — and ${hidden} more event${hidden === 1 ? '' : 's'} here`;
        appendMark(group, {
          x: cluster.x, y: cluster.y, radius: MARK_RADIUS, title, cluster: cluster.key,
          classes: `mark cluster ${cluster.coincident ? 'coincident' : 'splittable'}`,
        });
        group.appendChild(textNode(`+${hidden}`, {
          x: cluster.x + (MARK_RADIUS + 2) / k,
          y: cluster.y - (MARK_RADIUS + 1) / k,
          class: 'cluster-count',
          'font-size': BADGE_SIZE / k,
          'data-cluster': cluster.key,
        }));
      }

      // The events the reader is working with, on top of the clusters. The
      // selected one goes last of all.
      let selectedMark = null;
      for (const { event, x, y } of alone) {
        const isSelected = event.id === selected;
        const mark = appendMark(group, {
          x, y, radius: isSelected ? SELECTED_RADIUS : MARK_RADIUS, title: event.title, id: event.id,
          classes: markClasses(event, { selected, pathIds, actorIds }),
        });
        if (isSelected) selectedMark = mark;
      }
      if (selectedMark) group.appendChild(selectedMark);

      if (spreadCluster) drawSpread(spreadCluster);
      if (k >= LABEL_ZOOM) drawLabels(clusters);

      // A coincident cluster opened: its members on rings around the common
      // point, each with its own mark and title, each on a thin leg back to
      // where it really is. Chronological, so the ring reads as an order.
      function drawSpread(cluster) {
        const members = [...cluster.members].sort(
          (a, b) => extent(a.event.when).min - extent(b.event.when).min
            || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
        );
        const positions = spreadPositions(members.length, { radius: SPREAD_RADIUS, gap: SPREAD_GAP });
        const ring = svg('g', { class: 'spread' });
        group.appendChild(ring);
        ring.appendChild(svg('circle', { cx: cluster.x, cy: cluster.y, r: 2 / k, class: 'spread-hub' }));
        members.forEach((member, i) => {
          const x = cluster.x + positions[i].x / k;
          const y = cluster.y + positions[i].y / k;
          ring.appendChild(svg('line', { x1: cluster.x, y1: cluster.y, x2: x, y2: y, class: 'spread-leg' }));
          appendMark(ring, {
            x, y, radius: MARK_RADIUS, title: member.event.title, id: member.id,
            classes: markClasses(member.event, { selected, pathIds, actorIds }),
          });
          const right = positions[i].x >= 0;
          ring.appendChild(textNode(shorten(member.event.title), {
            x: x + (right ? 1 : -1) * (MARK_RADIUS + 3) / k,
            y: y + (LABEL_SIZE * 0.35) / k,
            class: 'mark-label spread-label',
            'text-anchor': right ? 'start' : 'end',
            'font-size': LABEL_SIZE / k,
          }));
        });
      }

      // At high zoom, the heaviest clusters on screen say what they are.
      // Greedy: a label that would land on one already placed is skipped
      // rather than nudged, so labels never drift away from their mark.
      function drawLabels(list) {
        const inView = (c) => !view || (c.x >= view.x0 && c.x <= view.x1 && c.y >= view.y0 && c.y <= view.y1);
        const candidates = list.filter(inView).sort(
          (a, b) => b.weight - a.weight || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
        );
        const placed = [];
        for (const cluster of candidates) {
          if (placed.length >= LABEL_LIMIT) break;
          const text = shorten(cluster.representative.event.title);
          const x = cluster.x + (HIT_RADIUS + 2) / k;
          const y = cluster.y;
          // Rough, and deliberately so: an em is about half the font size,
          // and the box only has to be good enough to keep two labels off
          // each other.
          const box = {
            x0: x,
            x1: x + (text.length * LABEL_SIZE * 0.55) / k,
            y0: y - (LABEL_SIZE * 0.7) / k,
            y1: y + (LABEL_SIZE * 0.7) / k,
          };
          if (placed.some((p) => box.x0 < p.x1 && p.x0 < box.x1 && box.y0 < p.y1 && p.y0 < box.y1)) continue;
          placed.push(box);
          group.appendChild(textNode(text, {
            x, y: y + (LABEL_SIZE * 0.35) / k, class: 'mark-label', 'font-size': LABEL_SIZE / k,
          }));
        }
      }

      return { clusters, spread: spreadCluster };
    },
  };
}
