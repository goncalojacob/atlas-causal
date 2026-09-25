// M88 §13 — "reacted to" reads the right way round (the third review, part C,
// finding 3).
//
// The atlas's `reacted-to` runs **forward in time**: `A --reacted-to--> B`
// says *B answered A*, which is what rule 4 enforces and what deviation 1420
// wrote down after four edges were first written on the sense of the English
// verb and refused, by name and with both dates, in one run.
//
// The link's card read the record left to right with the type's own label
// between the ends — `A  reacted to →  B` — which says the opposite of what
// the record says, and says it on the one page whose whole job is to state the
// argument for a link. A curation fire reading its own cards wrote two
// disputes from that reading; they stay `disputed` for the owner, because
// what was wrong is the sentence the card printed and not the records.
//
// The expectation here is derived from the records rather than written down:
// for a `reacted-to` edge the reaction is the **later** event, so the card
// must name the earlier one first and the later one second. Nothing is pinned
// — the corpus grows on two other branches — and if the corpus ever holds no
// active `reacted-to` edge at all, the test says so rather than passing quietly.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { atlasOf, ROOT } from './helpers.mjs';
import { defaultState } from '../src/state.js';
import { edgeCardHtml } from '../src/panel/edge.js';
import { EDGE_TYPES, EDGE_TYPE_LABEL, EDGE_TYPE_READING } from '../src/vocab.js';
import { extent } from '../src/util/dates.js';
import { esc } from '../src/util/esc.js';

const atlas = await atlasOf(path.join(ROOT, 'data'));

// The same stub `tests/m82.test.mjs` hands the card, for the same reason.
const edgeContext = (which) => ({
  atlas: which,
  historyHtml: () => '',
  discussLink: () => '',
  partOfHtml: () => '',
  citationsHtml: () => '',
  isCurrent: () => true,
});

// The heading as markup: a title is escaped into it, so what is looked for is
// the escaped title and not the record's own string — `coup d'état` is
// `coup d&#39;état` by the time the card has it.
const headingOf = (edge) => {
  const html = edgeCardHtml(edgeContext(atlas), { edge, state: defaultState() });
  return /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(html)[1];
};

const startOf = (event) => extent(event.when).min;

const liveEdges = [...atlas.edges.values()].filter((e) => e.status === 'active'
  && atlas.events.has(e.from) && atlas.events.has(e.to));

test('the card reads a reacted-to link the way the record means it', () => {
  const reacted = liveEdges.filter((e) => e.type === 'reacted-to');
  assert.ok(reacted.length > 0, 'the corpus holds an active reacted-to link to read');
  const wrong = [];
  for (const edge of reacted) {
    const from = atlas.events.get(edge.from);
    const to = atlas.events.get(edge.to);
    // Rule 4's own direction, read off the two records: the reaction is the
    // later event. An edge whose two events start in the same year says
    // nothing about which is the answer, so it is not evidence either way.
    if (startOf(to) <= startOf(from)) continue;
    const heading = headingOf(edge);
    const said = heading;
    const first = said.indexOf(esc(from.title));
    const second = said.indexOf(esc(to.title));
    if (first < 0 || second < 0) { wrong.push(`${edge.id}: the heading names neither end`); continue; }
    if (first > second) {
      wrong.push(`${edge.id}: the card names the reaction (${to.id}, ${startOf(to)}) before what it answered (${from.id}, ${startOf(from)})`);
    }
    // And the words between them are the reading and not the bare verb, which
    // is what said the opposite.
    if (!said.includes(esc(EDGE_TYPE_READING['reacted-to']))) {
      wrong.push(`${edge.id}: the card says ${JSON.stringify(said.trim().slice(0, 80))}`);
    }
  }
  assert.deepEqual(wrong.slice(0, 5), [], `${wrong.length} reacted-to links: ${wrong.slice(0, 3).join('; ')}`);
});

test('every other type still reads as its own label, in the record\'s own order', () => {
  for (const type of EDGE_TYPES) {
    if (type.id === 'reacted-to') {
      assert.notEqual(EDGE_TYPE_READING[type.id], EDGE_TYPE_LABEL[type.id],
        'reacted-to is the one type whose card does not read as the verb');
      continue;
    }
    assert.equal(EDGE_TYPE_READING[type.id], EDGE_TYPE_LABEL[type.id], type.id);
  }
  // And on the card itself, for whatever other types the corpus holds.
  const seen = new Set();
  for (const edge of liveEdges) {
    if (edge.type === 'reacted-to' || seen.has(edge.type)) continue;
    seen.add(edge.type);
    const said = headingOf(edge);
    const from = atlas.events.get(edge.from);
    const to = atlas.events.get(edge.to);
    assert.ok(said.includes(esc(EDGE_TYPE_LABEL[edge.type])), `${edge.id} says its own label`);
    assert.ok(said.indexOf(esc(from.title)) < said.indexOf(esc(to.title)), `${edge.id} reads from its start to its end`);
  }
  assert.ok(seen.size > 0, 'the corpus holds links of other types too');
});
