// The one placer, on its own. It is pure — no DOM, no layer, no state — so
// everything the map's labels do about order, about competition and about
// limits can be asserted here and nowhere else has to be opened to read it.
//
// M38, test 1.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LABEL_CHARS, LABEL_SIZE, LIMITS, PRIORITY, labelBox, placeLabels, shorten,
} from '../src/map/labels.js';

// Candidates far enough apart that nothing competes, so a test about order is
// about order alone. 200 units apart at k = 1 is well over the widest box a
// thirty-character name makes (about 181).
const apart = (i) => ({ x: 0, y: i * 40 });

const candidate = (id, { priority = 0, weight = 0, text = id, at = 0 }) => ({
  id, text, priority, weight, ...apart(at),
});

test('the order is priority, then weight, then id — and it is the same twice', () => {
  const candidates = [
    candidate('serra-da-estrela', { priority: PRIORITY.features, weight: 900, at: 0 }),
    candidate('porto', { priority: PRIORITY.cities, weight: 200, at: 1 }),
    candidate('lisbon', { priority: PRIORITY.cities, weight: 2812000, at: 2 }),
    candidate('restoration-1640', { priority: PRIORITY.events, weight: 3, at: 3 }),
    candidate('ceuta-1415', { priority: PRIORITY.events, weight: 3, at: 4 }),
    candidate('carnation-1974', { priority: PRIORITY.events, weight: 9, at: 5 }),
  ];
  const placed = placeLabels(candidates, { k: 1 });
  assert.deepEqual(placed.map((p) => p.id), [
    // The events first, heaviest first, and the tie broken by the id and not
    // by the order they arrived in.
    'carnation-1974', 'ceuta-1415', 'restoration-1640',
    // Then the cities, then the ground under them.
    'lisbon', 'porto', 'serra-da-estrela',
  ]);
  // The same input twice is the same picture: the sort never reads the input
  // order, so the same map places the same labels however the layers answered.
  const again = placeLabels([...candidates].reverse(), { k: 1 });
  assert.deepEqual(again.map((p) => p.id), placed.map((p) => p.id));
});

test('a label that would land on one already placed is skipped, never moved', () => {
  // Both want the same point. The event is priority 0, so it is placed and
  // the city is dropped — and the city is dropped *where it was*: nothing in
  // the result sits anywhere its candidate did not ask for.
  const event = { id: 'e', text: 'Restoration', x: 100, y: 100, priority: PRIORITY.events, weight: 1 };
  const city = { id: 'c', text: 'Lisbon', x: 104, y: 101, priority: PRIORITY.cities, weight: 2812000 };
  const placed = placeLabels([city, event], { k: 1 });
  assert.deepEqual(placed.map((p) => p.id), ['e']);
  assert.equal(placed[0].x, 100);
  assert.equal(placed[0].y, 100);

  // Far enough apart and both are placed, which is what says the skip above
  // was the collision and not the priority.
  const far = placeLabels([{ ...city, x: 400 }, event], { k: 1 });
  assert.deepEqual(far.map((p) => p.id), ['e', 'c']);
  assert.equal(far[1].x, 400, 'the city is where it asked to be, not nudged clear');
});

test('the limits are per priority, and one kind cannot spend another\'s', () => {
  const candidates = [];
  // A hundred cities down the page, none touching the next.
  for (let i = 0; i < 100; i += 1) candidates.push(candidate(`city-${String(i).padStart(3, '0')}`, { priority: PRIORITY.cities, weight: 100 - i, at: i }));
  // And two events, last in the list and beneath every one of them.
  candidates.push(candidate('event-a', { priority: PRIORITY.events, weight: 1, at: 200 }));
  candidates.push(candidate('event-b', { priority: PRIORITY.events, weight: 1, at: 201 }));

  const placed = placeLabels(candidates, { k: 1, limits: LIMITS });
  const byPriority = (p) => placed.filter((entry) => entry.priority === p);
  assert.equal(byPriority(PRIORITY.cities).length, 24, 'the cities stop at their own limit');
  assert.equal(byPriority(PRIORITY.events).length, 2, 'and both events are drawn all the same');
  // The twenty-four that survived are the heaviest twenty-four.
  assert.deepEqual(byPriority(PRIORITY.cities).map((p) => p.id), candidates.slice(0, 24).map((c) => c.id));

  // The events' limit is `LABEL_LIMIT` unchanged, and it binds on its own.
  const many = [];
  for (let i = 0; i < 30; i += 1) many.push(candidate(`e-${String(i).padStart(3, '0')}`, { priority: PRIORITY.events, weight: 30 - i, at: i }));
  assert.equal(placeLabels(many, { k: 1, limits: LIMITS }).length, 12);
  // A priority with no limit given places nothing, rather than everything: a
  // caller that forgot a kind gets a quiet map and not a full one.
  assert.equal(placeLabels(many, { k: 1, limits: { 1: 24 } }).length, 0);
});

test('a candidate whose anchor is outside the view is dropped before ordering', () => {
  const view = { x0: 0, y0: 0, x1: 960, y1: 540 };
  const out = { id: 'out', text: 'Ultramar', x: 2000, y: 100, priority: PRIORITY.cities, weight: 1e9 };
  const inside = { id: 'in', text: 'Lisbon', x: 100, y: 100, priority: PRIORITY.cities, weight: 1 };
  const placed = placeLabels([out, inside], { k: 1, view });
  assert.deepEqual(placed.map((p) => p.id), ['in']);
  // And it did not spend the limit on its way out: with a limit of one, the
  // one that is on screen is still drawn, though the other outweighs it by a
  // billion.
  assert.deepEqual(placeLabels([out, inside], { k: 1, view, limits: { 1: 1 } }).map((p) => p.id), ['in']);
  // No view at all is a caller with nothing to measure, and then everything is
  // in view — which is what the events layer did before there was a rectangle.
  assert.equal(placeLabels([out, inside], { k: 1 }).length, 2);
});

test('a text of zero length is placed like any other', () => {
  const empty = { id: 'a', text: '', x: 100, y: 100, priority: PRIORITY.cities, weight: 1 };
  const placed = placeLabels([empty], { k: 1 });
  assert.equal(placed.length, 1);
  // Its box is a bar of no width at the anchor, and still has the height of a
  // line: a nameless thing takes no room across and is not a hole in the page.
  assert.equal(placed[0].box.x0, placed[0].box.x1);
  assert.ok(placed[0].box.y1 > placed[0].box.y0);
});

// The box is `events.js`'s, moved here without a number changed. Ten
// candidates and the boxes the old `drawLabels` computed for them, written out
// so that a future tidy-up of the arithmetic has to say so out loud.
test('the box arithmetic is the one the events layer had', () => {
  const rows = [
    { text: 'Lisbon', x: 100, y: 100, k: 1 },
    { text: 'Ceuta', x: 0, y: 0, k: 1 },
    { text: '', x: 10, y: 20, k: 1 },
    { text: 'A', x: -50, y: 300, k: 1 },
    { text: 'Restoration of independence', x: 480, y: 270, k: 1 },
    { text: 'Lisbon', x: 100, y: 100, k: 4 },
    { text: 'Lisbon', x: 100, y: 100, k: 8 },
    { text: 'São Tomé', x: 12.5, y: 33.25, k: 2 },
    { text: 'Goa', x: 900, y: 500, k: 16 },
    { text: 'Nagasaki', x: 700, y: 120, k: 40 },
  ];
  // Exactly the expression the layer carried: an em is about half the font
  // size, and the height is 0.7 of it either side of the baseline.
  const was = ({ text, x, y, k }) => ({
    x0: x,
    x1: x + (text.length * 11 * 0.55) / k,
    y0: y - (11 * 0.7) / k,
    y1: y + (11 * 0.7) / k,
  });
  for (const row of rows) {
    assert.deepEqual(labelBox(row.text, row.x, row.y, row.k), was(row),
      `${row.text || '(empty)'} at k = ${row.k}`);
  }
  // And the size it is made of is the one the map already had.
  assert.equal(LABEL_SIZE, 11);
});

test('a long name is cut at a word, and a long word is cut at a letter', () => {
  const long = 'Humberto Delgado\'s presidential campaign';
  const cut = shorten(long);
  assert.ok(cut.length <= LABEL_CHARS, `${cut} fits in ${LABEL_CHARS}`);
  assert.ok(cut.endsWith('…'));
  assert.ok(!cut.includes('presidenti'), `no half word: ${cut}`);
  assert.equal(cut, 'Humberto Delgado\'s…');
  // A name that fits is untouched, ellipsis and all.
  assert.equal(shorten('Lisbon'), 'Lisbon');
  assert.equal(shorten(''), '');
  // And one long word has nowhere to break, so it breaks where it must.
  const word = 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch';
  assert.equal(shorten(word), `${word.slice(0, LABEL_CHARS - 1)}…`);
  assert.equal(shorten(word).length, LABEL_CHARS);
});
