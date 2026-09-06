// The lens in a real browser, on all three views.
//
// `lens.js` is held to what it keeps by tests of its own, without a DOM. What
// needs a browser is whether the three pictures actually draw it: whether the
// map, the graph and the timeline hide the same events, dim the same ring, and
// answer the same way to a list of foci and to "all of these" rather than "any
// of these" (H7 item 5; the owner's own request of 5 September).
//
// What each view is expected to draw is computed here by the very module the
// page uses, over an atlas built from the same index the page fetches. That is
// deliberate: the assertion is "the picture is the lens", not a second
// implementation of the lens written in test code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { withBrowser, open, waitFor, skip } from './browser.mjs';
import { atlasOf, ROOT } from './helpers.mjs';
import { lensView } from '../src/lens.js';
import { defaultState } from '../src/state.js';

const dataDir = path.join(ROOT, 'data');

// An actor with few enough events that the whole neighbourhood is small, and
// two that overlap in thirteen events, which is what makes "any of these" and
// "all of these" different pictures.
const FEW = 'portugal';
const SALAZAR = 'actor:salazar';
const REGIME = 'actor:estado-novo';

const expected = async (patch) => {
  const atlas = await atlasOf(dataDir);
  return lensView(atlas, { ...defaultState(), ...patch });
};

// Every event id the page has actually drawn a mark, a node or a bar for, in
// one view. A stack carries no ids — it is what the view drew *instead* of
// them — so this is what is drawn alone, which is what "in full" and "dimmed"
// are said about.
const DRAWN = (selector) => `return [...document.querySelectorAll('${selector}')]
  .map((el) => el.dataset.id).filter(Boolean);`;

const NEAR = (selector) => `return [...document.querySelectorAll('${selector}')]
  .filter((el) => el.classList.contains('lens-near')).map((el) => el.dataset.id).filter(Boolean);`;

const VIEWS = {
  map: { selector: '#map svg .mark[data-id]', url: '' },
  graph: { selector: '#graph svg.graph circle.node[data-id]', url: '&view=graph' },
  timeline: { selector: '.timeline-area svg rect.bar[data-id]', url: '' },
};

// The graph is built the first time it is asked for, so a page opened on the
// map has no graph in it: each view is a page load of its own.
const ready = 'return Boolean(document.querySelector(".timeline-area svg"));';

test('with ?actor=portugal every view draws that actor and its direct neighbours, and nothing else', { skip }, async () => {
  const view = await expected({ actor: FEW });
  assert.ok(view, 'an open actor with no lens is a lens on itself');
  assert.ok(view.set.size > 0 && view.near.size > 0, 'and it has a neighbourhood to dim');

  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?actor=${FEW}&from=1800&to=2030${extra}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw a mark`);

      const drawn = await page.eval(DRAWN(selector));
      assert.ok(drawn.length > 0, `${name} drew something`);
      for (const id of drawn) {
        assert.ok(view.shown.has(id), `${name} drew ${id}, which is outside the lens`);
      }
      // The actor's own events are drawn, in full, in every view.
      for (const id of view.set) assert.ok(drawn.includes(id), `${name} left out ${id}, which is what was asked for`);

      // The ring is drawn too, and dimmed: hidden it would say the atlas has
      // nothing next to Portugal, and undimmed it would say Portugal is in it.
      const dimmed = await page.eval(NEAR(selector));
      assert.ok(dimmed.length > 0, `${name} dimmed nothing`);
      for (const id of dimmed) assert.ok(view.near.has(id), `${name} dimmed ${id}, which is not a neighbour`);
      for (const id of view.set) assert.ok(!dimmed.includes(id), `${name} dimmed ${id}, which was asked for`);
    }
  });
});

test('a list of foci is the union, and &focusAll=1 is the intersection, on all three views', { skip }, async () => {
  const focus = `${SALAZAR},${REGIME}`;
  const any = await expected({ focus });
  const all = await expected({ focus, focusAll: true });
  assert.ok(all.set.size > 0, 'the two actors share events');
  assert.ok(all.set.size < any.set.size, 'and the union is the wider question');
  for (const id of all.set) assert.ok(any.set.has(id), 'the intersection is inside the union');

  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      const seen = {};
      for (const [key, view, query] of [['any', any, ''], ['all', all, '&focusAll=1']]) {
        await open(page, url(`?focus=${focus}${query}&from=1800&to=2030${extra}`), ready);
        await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw a mark`);
        const drawn = await page.eval(DRAWN(selector));
        // Nothing outside the lens, and something inside it. Not *everything*
        // inside it: forty events in Lisbon are a stack on the map, and a
        // stack carries no id — what it stands for is still in the picture,
        // folded into it (cluster.js), and that is a different promise, kept
        // by tests/map-browser.test.mjs.
        assert.ok(drawn.length > 0, `${name}/${key} drew nothing`);
        for (const id of drawn) assert.ok(view.shown.has(id), `${name}/${key} drew ${id}, outside the lens`);
        seen[key] = new Set(drawn);
      }
      // "All of these" is the narrower picture, in every view.
      assert.ok(seen.all.size < seen.any.size, `${name} drew ${seen.all.size} for all and ${seen.any.size} for any`);
    }
  });
});

test('the header carries a chip per focus, and each chip drops its own', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(`?focus=${SALAZAR},${REGIME}&from=1800&to=2030`), ready);
    await waitFor(page, 'return document.querySelectorAll(".lens-chips .lens-badge").length === 2;',
      'two chips in the header');
    const names = await page.eval('return [...document.querySelectorAll(".lens-chips .lens-name")].map((el) => el.textContent);');
    assert.deepEqual(names, ['António de Oliveira Salazar', 'Estado Novo'], 'each chip names its own record');

    // The × of the first chip: one focus left, and the URL says so. Waited
    // for rather than read: a lens is a change of the view and not an
    // opening, so its URL write is coalesced to a frame (state.js).
    await page.eval(`document.querySelector('.lens-chips .lens-drop[data-focus="${SALAZAR}"]').click(); return true;`);
    await waitFor(page, 'return document.querySelectorAll(".lens-chips .lens-badge").length === 1;', 'one chip left');
    await waitFor(page, `return new URLSearchParams(location.search).get('focus') === '${REGIME}';`, 'the URL to carry one focus');

    // And the last one leaves `none`, not an empty parameter: an absent one is
    // what asks for the lens an open actor or place gets.
    await page.eval(`document.querySelector('.lens-chips .lens-drop[data-focus="${REGIME}"]').click(); return true;`);
    await waitFor(page, 'return document.querySelectorAll(".lens-chips .lens-badge").length === 0;', 'no chips left');
    await waitFor(page, "return new URLSearchParams(location.search).get('focus') === 'none';", 'the URL to say none');
  });
});

test('a card adds to the lens, or replaces it, and never clears the selection', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(`?focus=${SALAZAR}&selected=carnation-revolution-1974&from=1800&to=2030`));
    await waitFor(page, 'return Boolean(document.querySelector(".panel .lens-control"));', 'the card to offer the lens');

    // "Focus on this" adds the open event to the list the reader already has.
    await page.eval('document.querySelector(\'.panel [data-action="focus"]\').click(); return true;');
    await waitFor(page, 'return document.querySelectorAll(".lens-chips .lens-badge").length === 2;', 'a second chip');
    await waitFor(
      page,
      `return new URLSearchParams(location.search).get('focus') === '${SALAZAR},event:carnation-revolution-1974';`,
      'the URL to carry both foci',
    );
    assert.equal(
      await page.eval('return new URLSearchParams(location.search).get("selected");'),
      'carnation-revolution-1974',
      'a lens is not a selection and never takes one away',
    );

    // And the card says what it did: since R9 the lens is in the panel's
    // render key, so the control that added the focus now offers to drop it,
    // and neither "Focus on this" nor "Focus only on this" is offered for a
    // record that is already the lens.
    await waitFor(
      page,
      'return document.querySelector(".panel .lens-control")?.textContent === "stop focusing on this";',
      'the control to say what it does now',
    );
    assert.equal(await page.eval('return document.querySelectorAll(".panel [data-action=\'focus-only\']").length;'), 0);

    // "Focus only on this" replaces the list with one focus — from a card
    // that is not the lens yet, which is the only state that offers it.
    await open(page, url(`?focus=${SALAZAR}&selected=carnation-revolution-1974&from=1800&to=2030`));
    await waitFor(page, 'return Boolean(document.querySelector(".panel [data-action=\'focus-only\']"));', 'the card to offer it');
    await page.eval('document.querySelector(\'.panel [data-action="focus-only"]\').click(); return true;');
    await waitFor(page, 'return document.querySelectorAll(".lens-chips .lens-badge").length === 1;', 'one chip');
    await waitFor(
      page,
      "return new URLSearchParams(location.search).get('focus') === 'event:carnation-revolution-1974';",
      'the URL to carry one focus',
    );
  });
});

// R8, in the browser: the two pictures the correction of 6 September is about.
// The atlas has 412 actors and 350 of them are polities imported with their
// borders and no event, so a blank map is the search's most common answer.
const NO_EVENTS = 'angola';

test('an actor with no events draws the whole atlas, and its card says so', { skip }, async () => {
  const atlas = await atlasOf(dataDir);
  assert.deepEqual(atlas.eventsByActor.get(NO_EVENTS) ?? [], [], `${NO_EVENTS} has no events`);
  assert.equal(lensView(atlas, { ...defaultState(), actor: NO_EVENTS }), null, 'so it is not a lens');

  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?actor=${NO_EVENTS}&from=1800&to=2030${extra}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw a mark`);
      const drawn = await page.eval(DRAWN(selector));
      assert.ok(drawn.length > 0, `${name} drew nothing at all`);
      const dimmed = await page.eval(NEAR(selector));
      assert.deepEqual(dimmed, [], `${name} dimmed something, so a lens is on`);
    }
    // And the card says why the pictures were not narrowed, rather than
    // leaving the reader with an atlas that looks unchanged for no reason.
    await open(page, url(`?actor=${NO_EVENTS}&from=1800&to=2030`));
    await waitFor(page, 'return Boolean(document.querySelector(".panel .notice.no-events"));', 'the card to say it has no events');
    assert.equal(await page.eval("return document.querySelectorAll('.lens-chips .lens-badge').length;"), 0, 'and no chip claims one');
  });
});

test('two hops walked out of an actor keep the selected event drawn', { skip }, async () => {
  const OPEN = 'regenerator-party';
  const FIRST = '1908-portuguese-legislative-election--republic-proclaimed-1910--precondition-of';
  const SECOND = 'republic-proclaimed-1910--1911-portuguese-constituent-national-assembly-election--caused';
  const END = '1911-portuguese-constituent-national-assembly-election';
  const chain = `${FIRST},${SECOND}`;

  const atlas = await atlasOf(dataDir);
  const view = lensView(atlas, {
    ...defaultState(), actor: OPEN, chain: chain.split(','), selected: END,
  });
  assert.ok(view, 'the actor has an event, so it is a lens');
  assert.ok(!view.set.has(END) && !view.near.has(END), 'and the walk has left its neighbourhood');

  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?actor=${OPEN}&chain=${chain}&selected=${END}&from=1800&to=2030${extra}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw a mark`);
      const drawn = await page.eval(DRAWN(selector));
      // What the card is showing is in the picture, and so is every step of
      // the walk that reached it. Both elections are events with no place —
      // the map has nowhere to put one, which is a different absence and one
      // the map has always had.
      const walked = [END, 'republic-proclaimed-1910', '1908-portuguese-legislative-election']
        .filter((id) => name !== 'map' || atlas.events.get(id).place);
      assert.ok(walked.length > 0, `${name} has something of the walk to draw`);
      for (const id of walked) {
        assert.ok(drawn.includes(id), `${name} left out ${id}, which the reader has just walked to`);
      }
    }
  });
});
