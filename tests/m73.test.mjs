// M73: a reader can see how sure the atlas is.
//
// Every edge has carried `confidence` since the first slice and the card has
// always said it in words. What nothing drawn said was which link the atlas
// is unsure of: on the graph a line's dash and weight say what *type* of
// claim it is, and a contested link and an established one were the same
// line. The map's walk lines said less still.
//
// What this file holds is the half that needs no browser: that one module
// decides what a confidence looks like, that the two views read it rather
// than each keeping an opinion, and that what the stylesheet spends on it is
// vocabulary `src/style.css` already declares — asserted the way M66
// asserted the halo's colours, by reading the stylesheet rather than by
// trusting a comment. Whether the three actually come out as three different
// lines on a page is `tests/m73-browser.test.mjs`, where a computed style
// can be read.
//
// Written before the module and the rules they judge (deviations 711 and
// 717). No test here pins a count: what is asserted is that the three levels
// differ and that both pictures say the same thing about one record, never
// how many edges of each the corpus holds.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './helpers.mjs';
import { CONFIDENCE_ORDER, CONFIDENCE_CLASS, confidenceOf, confidenceClass, leastSure } from '../src/confidence.js';

const read = (...parts) => readFile(path.join(ROOT, ...parts), 'utf8');

// Every `--name: value` the stylesheet declares, whatever the value is:
// `tools/lib/colour.mjs` reads the hex ones, and a confidence is not a
// colour, so the question here is the wider one of whether a name is
// declared at all.
function declaredTokens(css) {
  return new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]));
}

// Every `selector { … }` of a stylesheet, flattened. Enough for this file:
// style.css has no nested rules and the two at-rules it does have wrap whole
// rules rather than declarations.
function rules(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((m) => ({ selector: m[1].trim(), body: m[2].trim() }))
    .filter((r) => r.body && !r.selector.startsWith('@'));
}

test('one class per confidence, and a confidence nobody declared is the least sure', () => {
  assert.deepEqual([...CONFIDENCE_ORDER], ['consensus', 'probable', 'disputed'], 'surest first');
  const classes = CONFIDENCE_ORDER.map((c) => CONFIDENCE_CLASS[c]);
  assert.equal(new Set(classes).size, classes.length, 'no two confidences share a class');
  for (const c of CONFIDENCE_ORDER) {
    assert.equal(confidenceClass({ confidence: c }), CONFIDENCE_CLASS[c]);
  }
  // An unknown is not a settled claim — the rule `graph.js` already costs a
  // step by, said about what is drawn.
  const least = CONFIDENCE_ORDER[CONFIDENCE_ORDER.length - 1];
  assert.equal(confidenceOf(null), least);
  assert.equal(confidenceOf({}), least);
  assert.equal(confidenceOf({ confidence: 'fairly-sure' }), least);
  assert.equal(confidenceClass({ confidence: 'fairly-sure' }), CONFIDENCE_CLASS[least]);
});

test('a line carrying several links is drawn as the least sure of them', () => {
  const edge = (confidence) => ({ id: confidence, confidence });
  assert.equal(leastSure([edge('consensus'), edge('consensus')]), 'consensus');
  assert.equal(leastSure([edge('consensus'), edge('probable')]), 'probable');
  // The rule cluster.js already states for `disputed` — a bundle one of whose
  // links historians argue about is not a settled bundle — asked of all three.
  assert.equal(leastSure([edge('consensus'), edge('disputed'), edge('probable')]), 'disputed');
  assert.equal(leastSure([edge('probable'), edge('consensus')]), 'probable', 'order does not decide it');
  assert.equal(leastSure([]), CONFIDENCE_ORDER[CONFIDENCE_ORDER.length - 1], 'nothing said is not a settled claim');
});

test('the order lives in one file and the rest import it', async () => {
  const graph = await read('src', 'graph.js');
  const rules_ = await read('src', 'validate', 'rules.js');
  for (const [name, source] of [['graph.js', graph], ['validate/rules.js', rules_]]) {
    assert.ok(
      /from '\.{1,2}\/(\.\.\/)?confidence\.js'/.test(source),
      `${name} takes the confidence vocabulary from confidence.js`,
    );
    assert.ok(
      !/CONFIDENCE_ORDER\s*=\s*Object\.freeze\(\[/.test(source),
      `${name} keeps no second copy of the order`,
    );
  }
});

test('the two pictures read the module rather than each keeping an opinion', async () => {
  const drawn = [
    ['src/graph-view/graph-view.js', await read('src', 'graph-view', 'graph-view.js')],
    ['src/map/layers/events.js', await read('src', 'map', 'layers', 'events.js')],
  ];
  for (const [name, source] of drawn) {
    assert.ok(/confidence\.js'/.test(source), `${name} imports the confidence module`);
    // The class names are the module's to spell. A view building one of its
    // own is exactly how two pictures come to disagree about which link is
    // the shaky one, which is the fault this milestone is about.
    const body = source.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const c of CONFIDENCE_ORDER) {
      assert.ok(
        !body.includes(`'${CONFIDENCE_CLASS[c]}'`) && !body.includes(`"${CONFIDENCE_CLASS[c]}"`),
        `${name} does not spell ${CONFIDENCE_CLASS[c]} itself`,
      );
    }
  }
});

test('what a confidence is drawn in is vocabulary the stylesheet already declares', async () => {
  const css = await read('src', 'style.css');
  const tokens = declaredTokens(css);
  const mine = rules(css).filter((r) => CONFIDENCE_ORDER.some((c) => r.selector.includes(CONFIDENCE_CLASS[c])));
  assert.ok(mine.length > 0, 'the stylesheet says what a confidence looks like');
  for (const c of CONFIDENCE_ORDER) {
    assert.ok(
      mine.some((r) => r.selector.includes(CONFIDENCE_CLASS[c])),
      `${CONFIDENCE_CLASS[c]} is drawn`,
    );
  }
  for (const rule of mine) {
    // No new hex value and no new token: a confidence is not a colour, and
    // the atlas's one accent belongs to the path the reader is following.
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(rule.body), `${rule.selector} introduces no colour of its own`);
    assert.ok(!/(--[a-z0-9-]+)\s*:/i.test(rule.body), `${rule.selector} declares no token of its own`);
    for (const [, name] of rule.body.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
      assert.ok(tokens.has(name), `${rule.selector} uses ${name}, which style.css declares`);
    }
    // Type owns the dash pattern and the weight (m73-brief, §2); confidence
    // takes the dimension that is left. A confidence rule that wrote either
    // would make a disputed `caused` line read as an `enabled` one, which is
    // what the rule this milestone replaced actually did.
    assert.ok(!/stroke-dasharray\s*:/.test(rule.body), `${rule.selector} leaves the dash to the type`);
    assert.ok(!/stroke-width\s*:/.test(rule.body), `${rule.selector} leaves the weight to the type`);
  }
});

test('the three are told apart by the same property, at three different values', async () => {
  const css = await read('src', 'style.css');
  const mine = rules(css).filter((r) => CONFIDENCE_ORDER.some((c) => r.selector.includes(CONFIDENCE_CLASS[c])));
  const valueOf = (klass) => {
    const rule = mine.find((r) => r.selector.includes(klass));
    const found = [...rule.body.matchAll(/stroke-opacity\s*:\s*([0-9.]+)/g)].map((m) => Number(m[1]));
    assert.equal(found.length, 1, `${klass} says how solidly it is inked, once`);
    return found[0];
  };
  const values = CONFIDENCE_ORDER.map((c) => valueOf(CONFIDENCE_CLASS[c]));
  assert.equal(new Set(values).size, values.length, 'three values, not two wearing three names');
  for (let i = 1; i < values.length; i += 1) {
    assert.ok(values[i] < values[i - 1], 'the less sure the atlas is, the fainter the line');
    assert.ok(values[i - 1] - values[i] >= 0.2, 'far enough apart to be told apart on a page');
  }
});
