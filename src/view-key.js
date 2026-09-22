// The key to the marks on a picture, and there is one for each picture that
// has marks the reader has to take apart.
//
// The graph has had one since M28 — the five line patterns and the three
// confidences, in the corner of the view that uses them, drawn with the very
// same classes the edges are drawn with so that the key cannot come to
// disagree with the picture (graph-view.js, `edgeKey`). The map and the
// timeline had none, and between them they draw ten shapes: a plain mark, a
// mark with a ring, a wider and fainter mark for a place that is an area
// rather than a point, a mark with a count in it, and on the timeline a bar, a
// bar with a ring, a one-day mark and an open-ended bar. The reviewer, 22
// September (A7): *"the twelve symbols are explained only in
// docs/screens/glyphs-legend.html, which the site does not link."*
//
// So: the same box, in the same corner, built the same way. **Every row is
// drawn as the picture draws the thing it stands for** — the same element, the
// same classes on it, the same tokens inking it — so a row is the thing and not
// a picture of the thing. No new token, no new size and no colour of its own:
// the box is `.graph-key`, which is where those are already spent, and the
// shapes are `.view-key .mark`, `.view-key .bar` and so on, one short rule each
// beside it. `tests/m82-browser.test.mjs` holds a row and the mark it stands
// for to the same computed stroke and fill, which is a stronger bond than one
// selector would be and does not make `.map .mark` mean two things.
//
// The categories are not in here. One symbol per category of
// `data/categories.json` is drawn over a mark and at the left of a bar
// (map/glyphs.js), and what each one means is the switch that turns it off,
// which stands in the masthead with its own glyph beside it on every view
// (category-control.js). A second list of twelve in the corner of the picture
// would be the thing this box exists not to be.

import { svg } from './util/dom.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// One row: a small drawing and the words for it. `draw` is handed a `<svg>` to
// put the shape in, at the size the box gives it.
function rowHtml(into, row) {
  const dt = document.createElement('dt');
  const picture = document.createElementNS(SVG_NS, 'svg');
  // `key-shape` and **not** the view's own class, which is what the graph's
  // key does with `graph`. The map's and the timeline's ink is written
  // `.map .mark` and `.timeline .bar`, and those selectors are how the whole
  // browser suite asks whether the picture has drawn anything yet: a key that
  // carried the class would answer yes before a single mark existed. So the
  // key is inked by rules of its own in `src/style.css`, with the same
  // declarations and the same tokens — one line each, beside the box — and a
  // test holds the two to the same computed ink rather than to the same
  // selector.
  picture.setAttribute('class', 'key-shape');
  picture.setAttribute('viewBox', '0 0 24 12');
  picture.setAttribute('aria-hidden', 'true');
  draw(picture, row);
  dt.appendChild(picture);
  const dd = document.createElement('dd');
  dd.textContent = row.label;
  into.append(dt, dd);
}

// The box itself: a heading, a fold for a phone, and the rows. `title` is what
// the heading says and `rows` what it is a key to.
//
// The fold is the same one the graph's key grew in M82 (A1): on a phone a
// legend that covers half the picture is a legend hiding the thing it explains,
// so it is one button there and the whole key everywhere else. The stylesheet
// decides which, off the width; the class is all this writes.
export function viewKey(title, rows) {
  const box = document.createElement('div');
  box.className = 'graph-key view-key';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'graph-key-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.textContent = 'Key';
  const body = document.createElement('div');
  body.className = 'graph-key-body';
  const heading = document.createElement('h2');
  heading.textContent = title;
  const list = document.createElement('dl');
  list.className = 'edge-key';
  for (const row of rows) rowHtml(list, row);
  body.append(heading, list);
  button.addEventListener('click', () => {
    const open = box.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
  });
  box.append(button, body);
  return box;
}

// What each key is a key to: the shape, the classes the picture draws it with,
// and the words for it. Data and not drawing, so `node --test` can hold a key
// to its rows without a DOM, and so that adding a shape to a picture is a row
// here rather than a branch in the builder.
export const MAP_ROWS = Object.freeze([
  { shape: 'circle', classes: 'mark', label: 'one event' },
  { shape: 'circle', classes: 'mark', ring: true, label: 'opens into more' },
  { shape: 'circle', classes: 'mark coarse', label: 'a region, not a point' },
  { shape: 'circle', classes: 'mark cluster', count: '9', label: 'more than one here' },
]);

export const TIMELINE_ROWS = Object.freeze([
  { shape: 'rect', classes: 'bar', label: 'one event' },
  { shape: 'rect', classes: 'bar', ring: true, label: 'opens into more' },
  { shape: 'rect', classes: 'bar instant', narrow: true, label: 'one day' },
  { shape: 'rect', classes: 'bar ongoing', label: 'no end in the record' },
]);

// One row's shape, drawn into the little `<svg>` the box gives it. A mark is a
// circle at the middle of the range the map's layer uses and a bar is a bar;
// the ring is the second outline a parent wears on both pictures (parts.js).
function draw(into, row) {
  if (row.shape === 'circle') {
    into.appendChild(svg('circle', { cx: 12, cy: 6, r: row.classes.includes('cluster') ? 5 : 4, class: row.classes }));
    if (row.ring) into.appendChild(svg('circle', { cx: 12, cy: 6, r: 6, class: 'ring', 'stroke-width': 1 }));
  } else {
    const x = row.narrow ? 10 : 2;
    const width = row.narrow ? 4 : 20;
    into.appendChild(svg('rect', {
      x, y: 3, width, height: 6, rx: 2, class: row.classes,
    }));
    if (row.ring) {
      into.appendChild(svg('rect', {
        x: 0, y: 1, width: 24, height: 10, rx: 4, class: 'ring', 'stroke-width': 1,
      }));
    }
  }
  if (row.count) {
    const count = svg('text', {
      x: 12, y: 6, class: 'cluster-count', 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 7,
    });
    count.textContent = row.count;
    into.appendChild(count);
  }
}

export const mapKey = () => viewKey('Marks', MAP_ROWS);
export const timelineKey = () => viewKey('Bars', TIMELINE_ROWS);
