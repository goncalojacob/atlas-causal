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
import fs from 'node:fs';
import path from 'node:path';
import { withBrowser, open, waitFor, skip } from './browser.mjs';
import { atlasOf, FIXTURE_DATA, ROOT } from './helpers.mjs';
import { lensView } from '../src/lens.js';
import { openingState } from '../src/narrative-mode.js';
import { defaultState } from '../src/state.js';

const dataDir = path.join(ROOT, 'data');

// An actor with few enough events that the whole neighbourhood is small, and
// two that overlap in thirteen events, which is what makes "any of these" and
// "all of these" different pictures.
//
// It was `portugal` until M48, when an actor's lens became the events on its
// ground as well as the events that name it: Portugal went from eight events
// to eighty, which is the milestone's own headline and no longer a small
// neighbourhood. Fretilin is one that stayed small — two events and two
// neighbours — and holds no ground in this corpus, so it asserts what this
// test is about and not what the test below is.
const FEW = 'fretilin';
// Wide enough that the views draw the lens rather than the packing.
const DESK = { width: 1280, height: 900, deviceScaleFactor: 1 };
const SALAZAR = 'actor:salazar';
const REGIME = 'actor:estado-novo';

const expected = async (patch) => {
  const atlas = await atlasOf(dataDir);
  const view = lensView(atlas, { ...defaultState(), ...patch });
  // An event with no place is on the timeline and the graph and never on the
  // map (M30b's unplaced count says so); the map is not asked to draw it.
  const placeless = new Set([...view.set].filter((id) => {
    const file = path.join(dataDir, 'events', `${id}.json`);
    return !fs.existsSync(file) || !JSON.parse(fs.readFileSync(file, 'utf8')).place;
  }));
  return { ...view, placeless };
};

// Every event id the page has actually drawn a mark, a node or a bar for, in
// one view. A stack carries no ids — it is what the view drew *instead* of
// them — so this is what is drawn alone, which is what "in full" and "dimmed"
// are said about.
const DRAWN = (selector) => `return [...document.querySelectorAll('${selector}')]
  .map((el) => el.dataset.id).filter(Boolean);`;

// Everything the page asked the network for, as the browser recorded it —
// `performance`'s own resource timeline, which is what tests/spine-pages.test
// asserts every promise about fetching against.
const REQUESTS = 'return performance.getEntriesByType("resource").map((e) => e.name);';

const NEAR = (selector) => `return [...document.querySelectorAll('${selector}')]
  .filter((el) => el.classList.contains('lens-near')).map((el) => el.dataset.id).filter(Boolean);`;

const VIEWS = {
  map: { selector: '#map svg .mark[data-id]', url: '' },
  graph: { selector: '#graph svg.graph circle.node[data-id]', url: '&view=graph' },
  timeline: { selector: '.timeline-area svg rect.bar[data-id]', url: '&view=timeline' },
};

// Each view is built the first time it is asked for, so a page opened on the
// map has neither the graph nor the lanes in it: each view is a page load of
// its own, and the lens is the state all three read (M60).
const ready = 'return Boolean(document.querySelector("#map svg.map"));';

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
      for (const id of view.set) {
        if (name === 'map' && view.placeless.has(id)) continue;
        assert.ok(drawn.includes(id), `${name} left out ${id}, which is what was asked for`);
      }

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
  // At a stated desktop viewport since M50, and the reason is the one the
  // comment above already gives about stacks carrying no id. A mark with an id
  // is a proxy for an event drawn, and the proxy is only good while the
  // picture has room: in the default headless window the timeline packs the
  // union into fewer rows than the intersection and draws 11 ids for 60 events
  // against 13 for 35, which inverts the comparison without either lens being
  // wrong. At 1280 x 900 it draws 60 and 35 and the sets are what they say
  // they are. M50's corpus is what pushed it over — the assertion is about the
  // two lenses and should not be about how many rows fit.
  }, { device: DESK });
});

test('the header carries a chip per focus, and each chip drops its own', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(`?focus=${SALAZAR},${REGIME}&from=1800&to=2030`), ready);
    await waitFor(page, 'return document.querySelectorAll(".lens-chips .lens-badge").length === 2;',
      'two chips in the header');
    // A chip whose record's century has not landed has no name yet and says
    // "loading…"; the header is drawn again when the shard arrives (lens.js,
    // index2 review finding 21). The names are what this asserts, so the names
    // are what it waits for — never a duration. Deviation 488 saw it fail once
    // in twelve local runs during I4b, and it is what turned the check red on
    // I6's own bench push. **Both of them, counted**: `every` over an empty
    // list is true, and the header is emptied and written again in one go, so
    // a poll that landed between the two would pass on no chips at all.
    await waitFor(
      page,
      `return [...document.querySelectorAll('.lens-chips .lens-name')]
        .filter((el) => el.textContent !== 'loading…').length === 2;`,
      'both chips to be named',
    );
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
    // and "Focus on this" is not offered for a record that is already the
    // lens.
    await waitFor(
      page,
      'return document.querySelector(".panel .lens-control")?.textContent === "stop focusing on this";',
      'the control to say what it does now',
    );
    assert.equal(
      await page.eval('return document.querySelectorAll(".panel [data-action=\'focus\']").length;'),
      0,
      'one verb, and it is the × now',
    );

    // A reader who wants one focus drops the others from the bar, which is
    // where the list they are editing is. "Focus only on this" was a third
    // verb saying that from the far side of the interface, and it is gone
    // (owner, 8 September, M30c §2b).
    assert.equal(await page.eval('return document.querySelectorAll(".panel [data-action=\'focus-only\']").length;'), 0);
    await page.eval('document.querySelector(\'.lens-chips .lens-drop\').click(); return true;');
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
  // Since M65 the event the reader has open is itself the lens — the actor's
  // card is open behind it — and the first step of a two-hop walk is outside
  // it. What this test is about is unchanged: the walk is drawn all the same.
  assert.ok(view, 'the open event is a lens');
  assert.ok(view.set.has(END), 'and it is what the lens is of');
  const FIRST_STEP = '1908-portuguese-legislative-election';
  assert.ok(!view.set.has(FIRST_STEP) && !view.near.has(FIRST_STEP), 'and the walk has left its neighbourhood');
  assert.ok(view.shown.has(FIRST_STEP), 'and is drawn all the same');

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

// M30b-2, A6: `event:` narrows to the subtree. `data/` holds no event inside
// another yet, so this one is on the fixtures — which is where the three
// records that make a parent live (?fixtures=1, src/main.js).
test('an event lens on a parent narrows every view to its parts', { skip }, async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const view = lensView(atlas, { ...defaultState(), focus: 'event:fixture-event-f' });
  assert.deepEqual(
    [...view.set].sort(),
    ['fixture-event-f', 'fixture-event-h', 'fixture-event-t'],
    'the parent and both of its parts',
  );

  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?fixtures=1&focus=event:fixture-event-f${extra}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw a mark`);
      const drawn = await page.eval(DRAWN(selector));
      assert.ok(drawn.length > 0, `${name} drew nothing`);
      for (const id of drawn) assert.ok(view.shown.has(id), `${name} drew ${id}, outside the subtree`);
      // The parts are drawn wherever the view has somewhere to put them: the
      // parent itself has no place, so the map has no mark for it, which is
      // the absence the map has always had for a placeless event.
      for (const id of ['fixture-event-t', 'fixture-event-h']) {
        assert.ok(drawn.includes(id), `${name} left out ${id}, which is inside the focus`);
      }
      // And the ring is still the atlas's own edges: being part of something
      // is not a link, so nothing was dimmed for being a sibling.
      const dimmed = await page.eval(NEAR(selector));
      for (const id of dimmed) assert.ok(view.near.has(id), `${name} dimmed ${id}, which is not a neighbour`);
    }
  });
});

// ─── the walk as a lens (M48 §1) ───────────────────────────────────────────
//
// Reading a narrative used to suspend the lens, so the owner's twelve-step
// argument about how the colonial war ended the regime was drawn over all 250
// events in the corpus. It sets the lens now, and these are the three things
// the brief asks of that: the walk in full, its one hop dimmed, nothing else;
// leaving puts the atlas back; and a `?focus=` the reader wrote themselves
// still wins.
const WALK = 'how-the-colonial-war-ended-the-regime';

// The state the page is actually in while reading, which is not the one in the
// URL: the selection, the chain and the window are derived from the step
// (narrative-mode.js), and the first two are what an implicit lens keeps
// regardless (lens.js). Computed the same way here so that the expectation is
// the page's lens and not a second lens that resembles it.
const reading = async (patch = {}) => {
  const atlas = await atlasOf(dataDir);
  return openingState(atlas, { ...defaultState(), narrative: WALK, step: 0, ...patch });
};

test('reading a narrative draws the walk, its neighbours dimmed, and nothing else', { skip }, async () => {
  const state = await reading();
  const view = await expected(state);
  assert.ok(view, 'reading a narrative is a lens on the walk');
  assert.ok(view.set.size > 1 && view.near.size > 0, 'a walk with a neighbourhood to dim');

  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?narrative=${WALK}${extra}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw a mark`);
      // The whole walk, which the lens holds out of every stack, so it is
      // waited for rather than read once: a shard landing redraws the view.
      //
      // The graph is excepted, and not because of the lens: it opens zoomed in
      // and draws only what is inside the rectangle on screen, which is
      // deviation 714's opening zoom and costs it half of any walk this long.
      // What it is held to is the same rule as the other two — nothing outside
      // the lens, and the steps it does draw drawn in full.
      const wanted = [...view.set].filter((id) => !(name === 'map' && view.placeless.has(id)));
      if (name !== 'graph') {
        await waitFor(
          page,
          `return ${JSON.stringify(wanted)}.every((id) => document.querySelector('${selector}[data-id="' + id + '"]'));`,
          `${name} to draw every step of the walk`,
        );
      }

      const drawn = await page.eval(DRAWN(selector));
      assert.ok(drawn.some((id) => view.set.has(id)), `${name} drew no step of the walk at all`);
      for (const id of drawn) assert.ok(view.shown.has(id), `${name} drew ${id}, which the walk does not touch`);

      const dimmed = await page.eval(NEAR(selector));
      assert.ok(dimmed.length > 0, `${name} dimmed nothing, so the walk has no shadow`);
      for (const id of dimmed) assert.ok(view.near.has(id), `${name} dimmed ${id}, which is not a neighbour`);
      for (const id of view.set) assert.ok(!dimmed.includes(id), `${name} dimmed ${id}, which is the walk itself`);
    }
  });
});

test('leaving the narrative gives the atlas back', { skip }, async () => {
  const view = await expected(await reading());

  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?narrative=${WALK}${extra}`), ready);
      // A narrative's steps are an attribute and arrive with their century
      // (spine.js), so the first frame is the atlas whole and the lens lands
      // with the shard. The ring is what says it has.
      await waitFor(page, `return document.querySelectorAll('${selector}.lens-near').length > 0;`,
        `${name} to draw the walk's shadow`);
      const drawn = await page.eval(DRAWN(selector));
      for (const id of drawn) assert.ok(view.shown.has(id), `${name} drew ${id} while reading`);

      await page.eval('document.querySelector(\'[data-action="leave-narrative"]\').click(); return true;');
      await waitFor(page, "return !new URLSearchParams(location.search).get('narrative');", 'the narrative to close');
      // The lens goes with it, and that is asserted as the rule rather than as
      // a count: what comes back is the whole atlas in the window the reader
      // was left in, and the number of *marks* can perfectly well fall when it
      // does — the walk stops being held out of the stacks the moment it stops
      // being a lens, and a dozen marks become one.
      await waitFor(
        page,
        `return [...document.querySelectorAll('${selector}')].map((el) => el.dataset.id)
          .some((id) => id && !${JSON.stringify([...view.shown])}.includes(id));`,
        `${name} to draw something the walk does not touch`,
      );
      assert.deepEqual(await page.eval(NEAR(selector)), [], `${name} still dims a ring, so a lens is still on`);
    }
  });
});

test('a focus the reader wrote wins over the walk, and none turns the lens off', { skip }, async () => {
  const focus = SALAZAR;
  const state = await reading({ focus });
  const view = await expected(state);
  const walk = await expected(await reading());
  assert.ok(view.set.size > 0, 'the actor has events');
  assert.ok([...walk.set].some((id) => !view.shown.has(id)),
    'and the walk runs outside them, so the two lenses are different pictures');

  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?narrative=${WALK}&focus=${focus}${extra}`), ready);
      await waitFor(page, `return document.querySelectorAll('${selector}').length > 0;`, `${name} to draw a mark`);
      const drawn = await page.eval(DRAWN(selector));
      for (const id of drawn) assert.ok(view.shown.has(id), `${name} drew ${id}, outside the reader's own lens`);

      // And the parameter survives a step, which is the whole reason reading
      // mode writes it at all (state.js): everything else derived from the
      // step is deliberately not in the address bar. The card is drawn when
      // the narrative's own shard lands, so the control is waited for and
      // never assumed — it was null once in a full run and nowhere else.
      await waitFor(page, 'return Boolean(document.querySelector(\'[data-action="narrative-step"][data-step="1"]\'));',
        'the card to offer the next step');
      await page.eval('document.querySelector(\'[data-action="narrative-step"][data-step="1"]\').click(); return true;');
      await waitFor(page, "return new URLSearchParams(location.search).get('step') === '1';", 'the step to move');
      assert.equal(await page.eval("return new URLSearchParams(location.search).get('focus');"), focus,
        `${name} lost the reader's lens on the next step`);
    }

    // `none` is the reader turning the lens off, while reading as everywhere
    // else: the walk is drawn over the whole atlas, which is what it did
    // before M48 and is now something they have to ask for.
    await open(page, url(`?narrative=${WALK}&focus=none&view=timeline`), ready);
    await waitFor(
      page,
      `return [...document.querySelectorAll('${VIEWS.timeline.selector}')].map((el) => el.dataset.id)
        .some((id) => id && !${JSON.stringify([...walk.shown])}.includes(id));`,
      'the timeline to draw the whole atlas again',
    );
  });
});

// "Focus on this" stays on the narrative card and comes to mean narrowing to
// the *step*, which is what a reader would expect it to mean once the walk
// itself is the frame (M48 §1). It is the one lens control in the atlas that
// replaces the list rather than adding to it: adding the step to a lens that
// is already the whole walk would narrow nothing.
test('“Focus on this” while reading narrows to the step, and lets go back to the walk', { skip }, async () => {
  const atlas = await atlasOf(dataDir);
  // Step 0, because a walk's steps are an attribute: a link naming a later
  // step opens on the first one, since `clampStep` is asked before the shard
  // that says how long the walk is has landed (narrative.js). That is older
  // than this milestone and is not what this test is about.
  const step = 0;
  const state = openingState(atlas, { ...defaultState(), narrative: WALK, step });
  const only = `event:${state.selected}`;
  const walk = lensView(atlas, state);
  const narrowed = lensView(atlas, { ...state, focus: only });
  assert.ok(walk.set.size > narrowed.set.size, 'the step is narrower than the walk');

  await withBrowser(async (page, url) => {
    await open(page, url(`?narrative=${WALK}&step=${step}&view=timeline`),
      'return Boolean(document.querySelector(".panel .narrative-head"));');
    await waitFor(page, 'return document.querySelector(".panel .lens-control")?.textContent === "Focus on this";',
      'the card to offer the step');

    await page.eval('document.querySelector(\'.panel [data-action="focus-only"]\').click(); return true;');
    await waitFor(page, `return new URLSearchParams(location.search).get('focus') === '${only}';`,
      'the URL to carry the step alone');
    await waitFor(
      page,
      `return [...document.querySelectorAll('${VIEWS.timeline.selector}')].map((el) => el.dataset.id)
        .every((id) => !id || ${JSON.stringify([...narrowed.shown])}.includes(id));`,
      'the timeline to hold the step and its neighbours alone',
    );
    // The reader is still reading: the step, the walk and the card are where
    // they were, and only the lens moved.
    assert.equal(await page.eval("return new URLSearchParams(location.search).get('step');"), String(step));
    assert.equal(await page.eval("return new URLSearchParams(location.search).get('narrative');"), WALK);

    // And letting go goes back to the walk, not to no lens at all: an absent
    // parameter is what asks for the lens the mode implies.
    await waitFor(
      page,
      'return document.querySelector(".panel .lens-control")?.textContent === "stop focusing on this step";',
      'the control to say what it does now',
    );
    await page.eval('document.querySelector(\'.panel [data-action="unfocus-only"]\').click(); return true;');
    await waitFor(page, "return new URLSearchParams(location.search).get('focus') === null;", 'the parameter to go');
    await waitFor(
      page,
      `return ${JSON.stringify([...walk.set])}.every((id) =>
        document.querySelector('${VIEWS.timeline.selector.replace(/\[data-id\]$/, '')}[data-id="' + id + '"]'));`,
      'the timeline to hold the whole walk again',
    );
  });
});

// ─── the ground under an event (M48 §2) ────────────────────────────────────
//
// Selecting Portugal used to find the events that name Portugal and miss every
// event in Lisbon. The join is worked out at build time and fetched when a
// lens on an actor asks for it, so what this has to show is that the request
// is made, that the picture widens when it lands, and that what it widened by
// is the ground and not something else.
const POLITY = 'portugal';

test('selecting a polity finds the events on its ground, and asks for the file to do it', { skip }, async () => {
  const atlas = await atlasOf(dataDir);
  const view = lensView(atlas, { ...defaultState(), actor: POLITY });
  const named = new Set((atlas.eventsByActor.get(POLITY) ?? []).map((a) => a.event.id));
  // The owner's own case: the events in Lisbon that name nobody at all.
  const onGround = [...view.set].filter((id) => !named.has(id) && atlas.groundOf(id).includes(POLITY));
  assert.ok(onGround.some((id) => atlas.events.get(id)?.place === 'lisbon'),
    'the corpus has events in Lisbon that do not name Portugal');

  await withBrowser(async (page, url) => {
    for (const [name, { selector, url: extra }] of Object.entries(VIEWS)) {
      await open(page, url(`?actor=${POLITY}&from=1800&to=2030${extra}`), ready);
      // The lens widens when the file lands, so this is waited for and not
      // read once — the same discipline every other fetched input here gets.
      // *Some* of them and not a named one: sixty events in Lisbon are a stack
      // on the map, and a stack carries no id (cluster.js). What is asserted
      // is that the ground reached the picture at all.
      await waitFor(
        page,
        `return [...document.querySelectorAll('${selector}')].map((el) => el.dataset.id)
          .some((id) => ${JSON.stringify(onGround)}.includes(id));`,
        `${name} to draw an event on Portuguese ground and not in its actors`,
      );
      const drawn = await page.eval(DRAWN(selector));
      for (const id of drawn) assert.ok(view.shown.has(id), `${name} drew ${id}, outside the lens`);
    }

    // One request, and only because a lens asked: the file is named in the
    // manifest and is not part of first paint (tests/spine-pages.test.mjs).
    const requests = await page.eval(REQUESTS);
    assert.equal(requests.filter((n) => n.includes('/index/grounds-')).length, 1,
      'the grounds are fetched once');
  });
});
