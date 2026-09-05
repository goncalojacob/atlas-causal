// Event marks and the lines of the chain being followed. Renders the events
// whose interval overlaps the window, or the period either side of it, and
// that have a place; a process with no honest point is timeline-only, not a
// dot in the ocean.
//
// What the reader is working with is drawn whether or not it is in the
// window — the walked chain, the selected event, the events of the selected
// actor — because a chain that vanished as the band moved would be worse
// than a chain that greys. Those are given a `faded` class instead, as is
// anything in the margin; nothing beyond the margin is drawn at all.
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
import { overlaps } from '../../util/window.js';
import { clusterPoints, spreadPositions, SPREAD_RADIUS, SPREAD_GAP } from '../../cluster.js';
import { horizonBand } from '../../horizon.js';

// Sizes in SVG units at k = 1; every one of them is divided by k when drawn,
// so a mark, a badge and a label keep their size on screen at any zoom.
const MARK_RADIUS = 5;
const SELECTED_RADIUS = 7;
const HIT_RADIUS = 10;
const BADGE_SIZE = 10;
const LABEL_SIZE = 11;
const LABEL_HALO = 3; // the paper halo behind a label, in screen pixels
// Labels would be noise on the whole world; they start once the reader has
// zoomed to about a country, and only the heaviest clusters on screen get
// one.
const LABEL_ZOOM = 4;
const LABEL_LIMIT = 12;
const LABEL_CHARS = 30;

// Whether a point in projected space is on screen, with room around the
// rectangle for a mark that is only half outside it. `view` null is a caller
// with nothing to measure — a test, or a pane that has not been laid out —
// and then everything is in view, which is what the layer did before there
// was a rectangle to ask about.
export function inView(x, y, view, margin = 0) {
  if (!view) return true;
  return x >= view.x0 - margin && x <= view.x1 + margin
    && y >= view.y0 - margin && y <= view.y1 + margin;
}

function textNode(text, attrs) {
  const el = svg('text', attrs);
  el.textContent = text;
  return el;
}

function shorten(text, chars = LABEL_CHARS) {
  return text.length > chars ? `${text.slice(0, chars - 1).trimEnd()}…` : text;
}

function markClasses(event, { selected, pathIds, actorIds, narrativeIds = null, reachable = null, faded = false }) {
  // The madder accent belongs to the walked path; an actor's events are
  // emphasised in cobalt so the two never say the same thing. The horizon's
  // reachable set is a ring rather than a fill, fading with distance, so it
  // can be read underneath either of them.
  const band = reachable && reachable.has(event.id) ? `in-horizon ${horizonBand(reachable.get(event.id))}` : '';
  return ['mark',
    faded ? 'faded' : '',
    band,
    narrativeIds && narrativeIds.has(event.id) ? 'of-narrative' : '',
    actorIds && actorIds.has(event.id) ? 'of-actor' : '',
    pathIds.has(event.id) ? 'on-path' : '',
    event.id === selected ? 'selected' : '',
  ].join(' ').replace(/\s+/g, ' ').trim();
}

// pointOf resolves an event to the coordinates of the place it names; the
// coordinates are the place's, never the event's own (M9).
export function createEventsLayer(group, projection, { pointOf, onSelect, onCluster = null }) {
  // What the last render drew, so a click on a cluster can be answered with
  // the cluster itself rather than with an id the caller would have to look
  // the members up from.
  let drawn = new Map();

  const activate = (el) => {
    const id = el.getAttribute('data-id');
    if (id) {
      onSelect(id);
      return;
    }
    const cluster = drawn.get(el.getAttribute('data-cluster'));
    if (cluster && onCluster) onCluster(cluster);
  };

  group.addEventListener('click', (e) => {
    const el = e.target.closest('[data-id], [data-cluster]');
    if (el) activate(el);
  });

  // A mark is a control, so it answers Enter and Space. It is a <circle> and
  // not a <button>, so neither is free: nothing on the map or the timeline
  // could be reached from the keyboard at all, and the five focusable things
  // in the two panes were the export button, the pin and the band's handles
  // (health review B, finding 11).
  group.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest?.('[data-mark]');
    if (!el) return;
    e.preventDefault();
    activate(el);
  });

  const place = (event) => {
    const where = pointOf(event);
    return where ? projection.project([where.lon, where.lat]) : null;
  };

  // What a mark is called in the DOM: the record it opens, or the cluster it
  // stands for. Enough to find it again after the layer has been redrawn.
  const keyOf = (el) => el.getAttribute('data-id') ?? `cluster:${el.getAttribute('data-cluster')}`;
  const focusedKey = () => {
    const active = group.ownerDocument?.activeElement;
    return active && group.contains(active) && active.hasAttribute?.('data-mark') ? keyOf(active) : null;
  };
  const restoreFocus = (key) => {
    if (key === null) return;
    for (const el of group.querySelectorAll('[data-mark]')) {
      if (keyOf(el) === key) {
        el.focus?.({ preventScroll: true });
        return;
      }
    }
  };

  // window: { from, to } astronomical, or null for "everything". k: current
  // zoom factor. view: the rectangle of projected space on screen, for
  // deciding which clusters are worth labelling. spread: the key of a
  // coincident cluster the reader has opened, or null.
  return {
    render({
      events, window: timeWindow = null, margin = null, selected, pathIds, actorIds = null, narrativeIds = null, reachable = null,
      alone: drawnAlone, kept, chainEdges, consequenceEdges, eventById, k = 1, view = null, spread = null,
    }) {
      // Every mark is drawn again on every render, so a mark activated from
      // the keyboard would take the focus back to the document with it. What
      // was focused is remembered by what it names and given back at the end,
      // when the new marks exist.
      const focused = focusedKey();
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
      // The visible mark is the control: it takes the focus, carries the name
      // and answers the keys. The hit circle behind it is left unfocusable, or
      // Tab would visit every mark twice and the focus ring would land on
      // something that is not drawn.
      const appendMark = (target, { x, y, radius, classes, title, id = null, cluster = null }) => {
        const data = id === null ? { 'data-cluster': cluster } : { 'data-id': id };
        target.appendChild(svg('circle', { cx: x, cy: y, r: HIT_RADIUS / k, class: 'hit', ...data }));
        const mark = svg('circle', {
          cx: x, cy: y, r: radius / k, class: classes, ...data,
          'data-mark': '', tabindex: '0', role: 'button', 'aria-label': title,
        }, [svgTitle(title)]);
        target.appendChild(mark);
        return mark;
      };

      // `alone` is everything the reader is currently working with, which
      // keeps its own mark in the window or out of it — a chain that vanished
      // into a cluster would be worse than no cluster at all, and a walk
      // swallowed by one is a walk the reader cannot see ahead of. `kept` is
      // the wider set that is drawn at all: the same, plus the reachable set
      // when a horizon is open, since an answer to "what did this lead to by
      // 2011" that the band had hidden would not be an answer. Kept is not
      // the same as alone — a reachable event still joins a cluster, or forty
      // of them in Lisbon would be forty circles on one point.
      //
      // Both come from emphasis.js, because the timeline and the graph draw
      // the same idea and the three used to assemble it differently (health
      // review A, finding 27).

      const visible = [];
      for (const event of events) {
        const p = place(event);
        if (!p) continue;
        const inWindow = overlaps(event.when, timeWindow);
        // Inside the band, or within the period either side of it, or held.
        // Past the margin the map draws nothing at all: `margin` null is a
        // caller that has not asked for one, and then the window alone
        // decides, as it did before H3b.
        if (!inWindow && !kept.has(event.id) && !(margin && overlaps(event.when, margin))) continue;
        visible.push({ event, x: p[0], y: p[1], faded: !inWindow });
      }

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
            classes: markClasses(event, { selected, pathIds, actorIds, narrativeIds, reachable }),
          });
          continue;
        }
        const hidden = cluster.count - 1;
        const title = `${event.title} — and ${hidden} more event${hidden === 1 ? '' : 's'} here`;
        // A stack is in the horizon when any event under it is, at the band
        // of its nearest member: forty marks in Lisbon are not pulled apart
        // to say so, but the stack does not hide that the answer is in there.
        const nearest = reachable
          ? Math.min(...cluster.members.map((m) => reachable.get(m.id) ?? Infinity))
          : Infinity;
        appendMark(group, {
          x: cluster.x, y: cluster.y, radius: MARK_RADIUS, title, cluster: cluster.key,
          classes: `mark cluster ${cluster.coincident ? 'coincident' : 'splittable'}${Number.isFinite(nearest) ? ` in-horizon ${horizonBand(nearest)}` : ''}`,
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
      for (const { event, x, y, faded } of alone) {
        const isSelected = event.id === selected;
        const mark = appendMark(group, {
          x, y, radius: isSelected ? SELECTED_RADIUS : MARK_RADIUS,
          title: faded ? `${event.title} — outside the window` : event.title, id: event.id,
          classes: markClasses(event, { selected, pathIds, actorIds, narrativeIds, reachable, faded }),
        });
        if (isSelected) selectedMark = mark;
      }
      if (selectedMark) group.appendChild(selectedMark);

      if (spreadCluster) drawSpread(spreadCluster);
      if (k >= LABEL_ZOOM) drawLabels(clusters);
      restoreFocus(focused);

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
            classes: markClasses(member.event, { selected, pathIds, actorIds, narrativeIds, reachable }),
          });
          const right = positions[i].x >= 0;
          ring.appendChild(textNode(shorten(member.event.title), {
            x: x + (right ? 1 : -1) * (MARK_RADIUS + 3) / k,
            y: y + (LABEL_SIZE * 0.35) / k,
            class: 'mark-label spread-label',
            'text-anchor': right ? 'start' : 'end',
            'font-size': LABEL_SIZE / k,
            // The halo is a stroke in user units: left alone it grows with
            // the zoom and swallows the map.
            'stroke-width': LABEL_HALO / k,
          }));
        });
      }

      // At high zoom, the heaviest clusters on screen say what they are.
      // Greedy: a label that would land on one already placed is skipped
      // rather than nudged, so labels never drift away from their mark.
      function drawLabels(list) {
        const candidates = list.filter((c) => inView(c.x, c.y, view)).sort(
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
            'stroke-width': LABEL_HALO / k,
          }));
        }
      }

      return { clusters, spread: spreadCluster };
    },
  };
}
