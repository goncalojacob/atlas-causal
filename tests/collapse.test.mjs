// The graph's semantic level of detail: an event's parts drawn inside it
// while the reader is zoomed out (m30b-brief, A7).
//
// It is a pure function over a laid-out layout, so everything about it can be
// asserted here: which nodes are left, that none of them has moved, where the
// links went, and that nothing the reader is holding was ever folded away.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collapseLayout } from '../src/graph-view/collapse.js';
import { layoutGraph, stackLayout, COLLAPSE_ZOOM } from '../src/graph-view/layout.js';

const event = (id, year, { parent = null, weight = 1, subtreeWeight = undefined } = {}) => ({
  id, title: id, status: 'active', when: { start: year, end: year }, region: 'europe', weight, parent,
  ...(subtreeWeight === undefined ? {} : { subtreeWeight }),
});
const edge = (from, to, type = 'caused') => ({
  id: `${from}--${to}--${type}`, from, to, type, confidence: 'consensus', status: 'active',
});

// A war with two battles inside it, an event before it that caused the first
// battle, and an event after it the second battle caused. Plus one event
// inside nothing, so there is always something the collapse must not touch.
function sample() {
  return {
    events: [
      event('before', 1900),
      event('war', 1910, { weight: 2, subtreeWeight: 9 }),
      event('battle-one', 1911, { parent: 'war', weight: 3 }),
      event('battle-two', 1912, { parent: 'war', weight: 4 }),
      event('after', 1920),
      event('elsewhere', 1915),
    ],
    edges: [
      edge('before', 'battle-one'),
      edge('battle-one', 'battle-two', 'enabled'),
      edge('battle-two', 'after'),
    ],
    extent: { min: 1900, max: 1920 },
  };
}

const laid = () => layoutGraph({ ...sample(), lanes: [] });
const ids = (layout) => layout.nodes.map((n) => n.id).sort();
const zoomedOut = COLLAPSE_ZOOM - 0.5;

test('below the threshold the parts are drawn inside the parent, and above it they are not', () => {
  const layout = laid();
  const out = collapseLayout(layout, { k: zoomedOut });
  assert.deepEqual(ids(out), ['after', 'before', 'elsewhere', 'war']);

  // At a reading zoom nothing is collapsed at all — and the very same object
  // comes back, so the picture costs nothing where it is not wanted.
  assert.equal(collapseLayout(layout, { k: COLLAPSE_ZOOM }), layout);
  assert.equal(collapseLayout(layout, { k: 8 }), layout);
});

test('a collapsed parent is drawn where it already was, and so is everything else', () => {
  const layout = laid();
  const out = collapseLayout(layout, { k: zoomedOut });
  const before = new Map(layout.nodes.map((n) => [n.id, `${n.x},${n.y}`]));
  for (const node of out.nodes) {
    assert.equal(`${node.x},${node.y}`, before.get(node.id), `${node.id} moved`);
  }
  assert.equal(out.width, layout.width);
  assert.equal(out.height, layout.height);
  assert.equal(out.scale, layout.scale);
});

test('the collapsed node carries the subtree weight and a count of what is folded into it', () => {
  const out = collapseLayout(laid(), { k: zoomedOut });
  const war = out.nodes.find((n) => n.id === 'war');
  assert.deepEqual(war.collapsed.members, ['battle-one', 'battle-two']);
  assert.equal(war.collapsed.count, 2);
  // `subtreeWeight` where the index derived one, the event's own weight where
  // it did not: M30a's A11 omits the field on every leaf.
  assert.equal(war.weight, 9);
  assert.equal(war.collapsed.weight, 9);
  assert.deepEqual(war.collapsed.years, { min: 1911, max: 1912 });

  const bare = sample();
  delete bare.events[1].subtreeWeight;
  const plain = collapseLayout(layoutGraph({ ...bare, lanes: [] }), { k: zoomedOut });
  assert.equal(plain.nodes.find((n) => n.id === 'war').weight, 2);
});

test('a link into a part becomes a link into the parent, and a link inside it is dropped', () => {
  const out = collapseLayout(laid(), { k: zoomedOut });
  assert.deepEqual(
    out.edges.map((e) => `${e.from}→${e.to}`).sort(),
    ['before→war', 'war→after'],
    'battle-one → battle-two is a loop on the collapsed mark and says nothing',
  );
  // And the lines are drawn to where the marks are.
  const at = new Map(out.nodes.map((n) => [n.id, n]));
  for (const line of out.edges) {
    assert.equal(line.x1, at.get(line.from).x);
    assert.equal(line.y2, at.get(line.to).y);
  }
  // The edge records themselves are untouched: a collapse is a way of drawing
  // the graph and never a change to it.
  assert.deepEqual(out.edges.map((e) => e.edge.id).sort(), ['battle-two--after--caused', 'before--battle-one--caused']);
});

test('nothing the reader is holding is folded away, and its parent stays open', () => {
  const layout = laid();
  const out = collapseLayout(layout, { k: zoomedOut, alone: new Set(['battle-two']) });
  // The held part keeps its own node; so does its sibling, because a parent
  // holding anything the reader is working with is not collapsed at all —
  // half a subtree folded and half not would be the worst of both.
  assert.deepEqual(ids(out), ['after', 'battle-one', 'battle-two', 'before', 'elsewhere', 'war']);
  assert.equal(out.nodes.find((n) => n.id === 'war').collapsed, undefined);
  assert.equal(out.edges.length, layout.edges.length);
  // A parent that holds nothing held is still collapsed.
  assert.deepEqual(ids(collapseLayout(layout, { k: zoomedOut, alone: new Set(['elsewhere']) })),
    ['after', 'before', 'elsewhere', 'war']);
});

test('a part whose parent is not in the arrangement keeps its own node', () => {
  // The band moved past the war: its battles are still here, and there is
  // nothing to fold them into.
  const one = sample();
  one.events = one.events.filter((e) => e.id !== 'war');
  const out = collapseLayout(layoutGraph({ ...one, lanes: [] }), { k: zoomedOut });
  assert.deepEqual(ids(out), ['after', 'battle-one', 'battle-two', 'before', 'elsewhere']);
});

test('a subtree three deep folds into its topmost parent, and a cycle terminates', () => {
  const deep = sample();
  deep.events.push(event('skirmish', 1911, { parent: 'battle-one' }));
  const out = collapseLayout(layoutGraph({ ...deep, lanes: [] }), { k: zoomedOut });
  assert.deepEqual(ids(out), ['after', 'before', 'elsewhere', 'war']);
  assert.deepEqual(out.nodes.find((n) => n.id === 'war').collapsed.members,
    ['battle-one', 'skirmish', 'battle-two']);

  // Rule 24 refuses a ring of parents; a drawing should not hang on a file
  // that has one anyway, and it must not fold the two ends of the ring into
  // each other and draw neither. Each stands for itself, exactly as
  // `subtreeWeights` gives such a node its own weight (M30a, A11).
  const ring = { events: [event('a', 1900, { parent: 'b' }), event('b', 1901, { parent: 'a' })], edges: [], extent: { min: 1900, max: 1901 } };
  assert.deepEqual(ids(collapseLayout(layoutGraph({ ...ring, lanes: [] }), { k: zoomedOut })), ['a', 'b']);
});

test('the geometric stacking runs on what the collapse produced', () => {
  const out = collapseLayout(laid(), { k: zoomedOut });
  const stacked = stackLayout(out, { k: zoomedOut });
  const drawn = stacked.nodes.flatMap((s) => s.members.map((m) => m.id));
  assert.ok(!drawn.includes('battle-one'), 'a folded part is not a member of any stack');
  assert.ok(drawn.includes('war'));
  // And what a stack stands for still carries its collapse, so the drawing
  // can say how many are inside the mark it draws.
  const war = stacked.nodes.find((s) => s.members.some((m) => m.id === 'war'));
  assert.equal(war.members.find((m) => m.id === 'war').collapsed.count, 2);
});
