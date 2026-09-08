// The card in a real browser, driven rather than only dumped: opening a
// section, doing it from the keyboard, the choice surviving a reload, and the
// browser's own Back coming back to the event.
//
// None of that can be checked by --dump-dom, which renders one URL and stops.
// The driven browser itself is tests/browser.mjs, shared with the phone
// checks; the reasons it is built by hand are there.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { withBrowser, open, waitFor, seenIntro, skip } from './browser.mjs';
import { atlasOf, ROOT } from './helpers.mjs';
import { defaultState } from '../src/state.js';
import { horizonSet } from '../src/horizon.js';
import { MARGIN_YEARS } from '../src/util/window.js';

// A real drag of one end of the time band: press on the handle, move across
// the lanes, let go. The events are dispatched rather than synthesised at a
// higher level because what is being tested is that the panel survives the
// twenty state changes a drag makes, and the handlers that make them are the
// timeline's own (timeline.js).
const dragWindowTo = (kind, x) => `
  const root = document.querySelector('#timeline svg');
  const handle = root.querySelector('[data-window="${kind}"]');
  const box = handle.getBoundingClientRect();
  const y = box.top + box.height / 2;
  const at = (clientX, type, target) => target.dispatchEvent(new PointerEvent(type, {
    bubbles: true, clientX, clientY: y, pointerId: 1,
  }));
  const start = box.left + box.width / 2;
  at(start, 'pointerdown', handle);
  for (let i = 1; i <= 20; i += 1) at(start + ((${x} - start) * i) / 20, 'pointermove', root);
  at(${x}, 'pointerup', root);
  return true;`;

// What the reader can see of the sections: which are there, and which is open.
const SECTIONS = `return [...document.querySelectorAll(".panel .card-section")].map((s) => ({
  key: s.dataset.section,
  label: s.querySelector(".section-label").textContent,
  count: s.querySelector(".count")?.textContent ?? null,
  open: s.querySelector(".section-toggle").getAttribute("aria-expanded") === "true",
  hidden: s.querySelector(".section-body").hidden,
}));`;

const openOne = (sections) => sections.filter((s) => s.open).map((s) => s.key);

test('an event card renders head, summary and the collapsed sections with their counts', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    const sections = await page.eval(SECTIONS);
    assert.deepEqual(sections.map((s) => s.key), ['consequences', 'causes', 'sources', 'part-of']);
    assert.deepEqual(
      sections.map((s) => [s.label, s.count]),
      [['Consequences', '9'], ['Causes', '7'], ['Sources', '2'], ['Part of', '1']],
    );
    // Fresh, with nothing walked and nothing remembered: consequences, and
    // every other section's body actually hidden.
    assert.deepEqual(openOne(sections), ['consequences']);
    assert.deepEqual(sections.filter((s) => !s.open).map((s) => s.hidden), [true, true, true]);

    // The head: the actors are chips, and the summary is its own text. The
    // summary is a slot the card fills once the record's own text has been
    // fetched (event.js), so what is waited for is that text arriving and
    // never a duration — on a slow runner the assertion below was reading the
    // placeholder (I4b's fix to the record pane's history, one card over).
    await waitFor(
      page,
      'return (document.querySelector(".panel .summary p")?.textContent ?? "Loading…") !== "Loading…";',
      "the record's own text",
    );
    const head = await page.eval(`return {
      chips: [...document.querySelectorAll(".event-head .chip")].map((c) => c.dataset.id),
      role: document.querySelector(".event-head .chip").title,
      summary: document.querySelector(".panel .summary p").textContent.slice(0, 40),
    };`);
    assert.equal(head.chips.length, 6);
    assert.match(head.role, /Armed Forces Movement — leader/);
    assert.match(head.summary, /^Units led by the Armed Forces Movement/);
  });
});

test('a section opens on a click and from the keyboard, one at a time', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));

    await page.eval('document.querySelector(\'[data-action="section"][data-section="causes"]\').click(); return true;');
    assert.deepEqual(openOne(await page.eval(SECTIONS)), ['causes']);

    // Enter and Space on a native button are a click; this asserts the header
    // really is one, which is where the card's keyboard access comes from.
    await page.eval(`const b = document.querySelector('[data-action="section"][data-section="sources"]');
      b.focus();
      for (const key of ["Enter", " "]) {
        b.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
        b.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
      }
      return document.activeElement === b;`);
    assert.equal(await page.eval('return document.activeElement.dataset.section;'), 'sources',
      'the header is focusable, which a div would not be');
    assert.equal(await page.eval('return document.querySelector(\'.card-section[data-section="sources"] .section-toggle\').tagName;'), 'BUTTON');

    // Clicking the open one closes it, and then nothing is open.
    await page.eval('document.querySelector(\'[data-action="section"][data-section="causes"]\').click(); return true;');
    assert.deepEqual(openOne(await page.eval(SECTIONS)), []);
  });
});

test('the choice survives a reload, and the arrival still overrides it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    await page.eval('document.querySelector(\'[data-action="section"][data-section="causes"]\').click(); return true;');
    assert.equal(await page.eval('return localStorage.getItem("atlas-causal.card-section");'), 'causes');

    await open(page, url('?selected=carnation-revolution-1974'));
    assert.deepEqual(openOne(await page.eval(SECTIONS)), ['causes'], 'remembered across a reload');

    // Walking a chain is an instruction about what to read, and beats it.
    await open(page, url('?selected=alvor-agreement-1975&chain=carnation-revolution-1974--alvor-agreement-1975--caused'));
    assert.deepEqual(openOne(await page.eval(SECTIONS)), ['consequences']);
    const crumbs = await page.eval(`const nav = document.querySelector(".panel .breadcrumb");
      return nav && {
        steps: [...nav.querySelectorAll("li")].map((li) => li.textContent.replace(/\\s+/g, " ").trim()),
        links: [...nav.querySelectorAll("[data-action='chain-to']")].map((b) => b.dataset.step),
        current: nav.querySelector("[aria-current]") !== null,
      };`);
    assert.deepEqual(crumbs.links, ['0']);
    assert.equal(crumbs.current, true);
    assert.match(crumbs.steps.join(' | '), /25 April \| caused The Alvor Agreement/);
  });
});

test('following a consequence walks the chain and grows the breadcrumb', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    await page.eval('document.querySelector(\'.card-section[data-section="consequences"] [data-action="follow"]\').click(); return true;');
    const after = await page.eval(`return {
      selected: new URLSearchParams(location.search).get("selected"),
      chain: new URLSearchParams(location.search).get("chain"),
      crumbs: [...document.querySelectorAll(".panel .breadcrumb li")].length,
    };`);
    assert.equal(after.selected, 'alvor-agreement-1975');
    assert.equal(after.chain, 'carnation-revolution-1974--alvor-agreement-1975--caused');
    assert.equal(after.crumbs, 2);
    // A walked chain has other branches; without one there is nothing to be
    // other than, and the section is not drawn at all.
    assert.ok((await page.eval(SECTIONS)).some((s) => s.key === 'branches'));
  });
});

test('opening an actor from an event, then Back, shows the event again', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    await page.eval('document.querySelector(\'.event-head .chip[data-id="estado-novo"]\').click(); return true;');
    assert.equal(await page.eval('return document.querySelector(".panel .actor-head h2").textContent;'), 'Estado Novo');

    // The panel's own Back names what it returns to, and is history.back().
    const label = await page.eval('return document.querySelector(".panel .card-history .go-back").textContent.trim();');
    assert.equal(label, '← 25 April');
    await page.eval('document.querySelector(".panel .card-history .go-back").click(); return true;');
    for (let tries = 0; tries < 100; tries += 1) {
      if (await page.eval('return Boolean(document.querySelector(".panel .event-head h2"));')) break;
      await new Promise((resolve) => { setTimeout(resolve, 20); });
    }
    assert.equal(await page.eval('return document.querySelector(".panel .event-head h2").textContent;'), '25 April');
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("actor");'), null,
      'going back to the event closes the actor rather than leaving it open');

    // And the browser's own Back and Forward do exactly the same thing.
    await page.eval('history.forward(); return true;');
    for (let tries = 0; tries < 100; tries += 1) {
      if (await page.eval('return Boolean(document.querySelector(".panel .actor-head h2"));')) break;
      await new Promise((resolve) => { setTimeout(resolve, 20); });
    }
    assert.equal(await page.eval('return document.querySelector(".panel .actor-head h2").textContent;'), 'Estado Novo');
    await page.eval('history.back(); return true;');
    for (let tries = 0; tries < 100; tries += 1) {
      if (await page.eval('return Boolean(document.querySelector(".panel .event-head h2"));')) break;
      await new Promise((resolve) => { setTimeout(resolve, 20); });
    }
    assert.equal(await page.eval('return document.querySelector(".panel .event-head h2").textContent;'), '25 April');
  });
});

test('moving the view is not an opening: Back does not undo a pan', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    const before = await page.eval('return history.length;');
    await page.eval('document.querySelector(\'.panel [data-action="year"]\').click(); return true;');
    assert.equal(await page.eval('return history.length;'), before,
      'a change to the window replaced the entry rather than adding one');
    assert.match(await page.eval('return location.search;'), /to=1974/);
  });
});

// A shared link naming a step that has been retracted since. The fixtures
// carry one — no edge in `data/` is retracted yet, which is what makes this
// latent rather than visible — so the whole path is exercised here: the walk
// cut at load, the URL normalised to what is actually drawn, and the card
// saying that the argument the reader was sent is not the one they have.
test('a link whose walk names a retracted step is cut, and the card says so', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?fixtures=1&selected=fixture-event-t&chain=fixture-event-e--fixture-event-t--inspired'),
      'return Boolean(document.querySelector(".panel .event-head h2"));');

    assert.deepEqual(
      await page.eval('return Object.fromEntries(new URLSearchParams(location.search));'),
      { fixtures: '1', selected: 'fixture-event-t' },
      'the URL describes the walk that is drawn, not the one that was sent',
    );
    const notice = await page.eval('return document.querySelector(".panel .notice.status")?.textContent.replace(/\\s+/g, " ").trim() ?? null;');
    assert.match(notice, /A step of the link you followed has been retracted\./);
    assert.match(notice, /drawn as far as that step/);
    // Cut, so there is no walk left and no breadcrumb over the card.
    assert.equal(await page.eval('return document.querySelectorAll(".panel .breadcrumb").length;'), 0);
  });
});

// The same link with its step still standing: nothing is cut and nothing is
// said, so the notice is not something every shared walk now carries.
test('a walk whose steps all stand is left alone and says nothing', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?fixtures=1&selected=fixture-event-b&chain=fixture-event-a--fixture-event-b--caused'),
      'return Boolean(document.querySelector(".panel .event-head h2"));');
    assert.deepEqual(
      await page.eval('return Object.fromEntries(new URLSearchParams(location.search));'),
      { fixtures: '1', selected: 'fixture-event-b', chain: 'fixture-event-a--fixture-event-b--caused' },
    );
    assert.equal(await page.eval('return document.querySelectorAll(".panel .notice.status").length;'), 0);
  });
});

// The card used to be rebuilt on every state change, so the reader could not
// read an explanation and move the band at the same time: the first pointer
// move closed the <details> under them (B12, A3). The card is now drawn again
// only when its key changes — what is open, the chain, the horizon, the
// window — and the window's own bits are written into the card that is there.
test('a drag of the band leaves the open explanation open and moves the horizon', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    await waitFor(page, 'return document.querySelectorAll("#timeline [data-window]").length === 3;', 'the band');

    // Open the first "Why" in Consequences and wait for its text, so that
    // what is being protected is a section with something in it.
    await page.eval(`document.querySelector('.card-section[data-section="consequences"] details[data-edge] summary').click();
      return true;`);
    await waitFor(page, 'return Boolean(document.querySelector(\'.card-section[data-section="consequences"] details[data-edge] .explanation\'));', 'the explanation');

    // Marks on the nodes themselves: a property does not survive innerHTML,
    // so this says the card was touched up rather than built again.
    const before = await page.eval(`document.querySelector('.panel .event-head h2').dataset.kept = 'yes';
      document.querySelector('.card-section[data-section="consequences"] details[data-edge]').dataset.kept = 'yes';
      return {
        horizon: document.querySelector('.panel .horizon .count').textContent,
        summary: document.querySelector('.panel .summary p').textContent.slice(0, 20),
      };`);
    // 50 since the world merge of 8 September 2026 joined M40's and M41's
    // events to 25 April's descendants (46 before it).
    assert.equal(before.horizon, '50');

    await page.eval(dragWindowTo('to', 450));
    await waitFor(page, 'return /to=/.test(location.search);', 'the window in the URL');

    const after = await page.eval(`return {
      head: document.querySelector('.panel .event-head h2').dataset.kept ?? null,
      details: document.querySelector('.card-section[data-section="consequences"] details[data-edge]').dataset.kept ?? null,
      open: document.querySelector('.card-section[data-section="consequences"] details[data-edge]').open,
      explanation: Boolean(document.querySelector('.card-section[data-section="consequences"] details[data-edge] .explanation')),
      horizon: document.querySelector('.panel .horizon .count').textContent,
      asks: document.querySelector('.panel .horizon summary').textContent.replace(/\\s+/g, ' ').trim(),
      summary: document.querySelector('.panel .summary p').textContent.slice(0, 20),
      to: Number(new URLSearchParams(location.search).get('to')),
    };`);
    assert.equal(after.head, 'yes', 'the card was not rebuilt');
    assert.equal(after.details, 'yes');
    assert.equal(after.open, true, 'the explanation the reader was reading is still open');
    assert.equal(after.explanation, true, 'and its text was not thrown away and re-fetched');
    assert.equal(after.summary, before.summary);
    // The one thing that did change: the horizon's default year is the far
    // end of the band, so its question and its count followed the drag.
    assert.ok(after.to < 2025 && after.to > 1400, `the band moved: to=${after.to}`);
    assert.notEqual(after.horizon, before.horizon);
    assert.equal(after.asks, `What did this lead to by ${after.to}? ${after.horizon}`);
  });
});

// The map publishes the box it is looking at 180 ms after a zoom settles, and
// that write used to replace a cluster's member list with "Pick an event"
// about a second after the reader asked for it (A5, B12).
test('a cluster’s list survives the bbox the zoom writes when it settles', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // Nothing open: the panel is the intro, and the card the list must not be
    // replaced by is what the atlas shows before anything is chosen.
    await open(page, url(''), 'return Boolean(document.querySelector(".panel .intro"));');
    await waitFor(page, 'return document.querySelectorAll("#map .mark.cluster.splittable").length > 0;', 'a cluster');

    await page.eval(`document.querySelector('#map .mark.cluster.splittable')
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;`);
    const members = await page.eval('return document.querySelectorAll(".panel .cluster-list .actor-row").length;');
    assert.ok(members > 1, `the list has its members: ${members}`);

    // The zoom animation, then the settle, then the write. Waiting on the
    // URL rather than on a timer: the box is what used to wipe the list.
    await waitFor(page, 'return /bbox=/.test(location.search);', 'the box the zoom published');
    assert.equal(
      await page.eval('return document.querySelectorAll(".panel .cluster-list .actor-row").length;'),
      members,
      'the list is still the list',
    );
    assert.equal(await page.eval('return document.querySelectorAll(".panel .intro").length;'), 0);

    // And choosing a member still opens it, including the one the atlas may
    // already have open: the list is not state, so nothing in the key says
    // it is there, and the panel has to know it on its own.
    const id = await page.eval('return document.querySelector(".panel .cluster-list [data-action=\'select\']").dataset.id;');
    await page.eval('document.querySelector(".panel .cluster-list [data-action=\'select\']").click(); return true;');
    await waitFor(page, 'return Boolean(document.querySelector(".panel .event-head h2"));', 'the card');
    assert.equal(await page.eval('return new URLSearchParams(location.search).get("selected");'), id);
  });
});

// A place's list is faded event by event against the band, and the count in
// the hint says how many are inside it. Both follow the window without the
// card being drawn again.
test('a place’s faded rows follow the band without rebuilding the card', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?place=lisbon'));
    await waitFor(page, 'return document.querySelectorAll("#timeline [data-window]").length === 3;', 'the band');
    const before = await page.eval(`document.querySelector('.panel .place-head h2').dataset.kept = 'yes';
      return {
        faded: document.querySelectorAll('.card-section[data-section="events"] .actor-row.faded').length,
        hint: document.querySelector('.card-section[data-section="events"] .hint').textContent.trim(),
      };`);
    assert.equal(before.faded, 0, 'the whole span: nothing is outside it');
    assert.match(before.hint, /All of them are inside the window\./);

    await page.eval(dragWindowTo('to', 450));
    await waitFor(page, 'return /to=/.test(location.search);', 'the window in the URL');
    const after = await page.eval(`return {
      head: document.querySelector('.panel .place-head h2').dataset.kept ?? null,
      faded: document.querySelectorAll('.card-section[data-section="events"] .actor-row.faded').length,
      hint: document.querySelector('.card-section[data-section="events"] .hint').textContent.trim(),
    };`);
    assert.equal(after.head, 'yes', 'the card was not rebuilt');
    assert.ok(after.faded > 0, `the rows outside the band are faded: ${after.faded}`);
    assert.match(after.hint, /inside the window; the rest are faded\./);
  });
});

// "Open an event, open an actor, narrow the band, Back": the address bar and
// the band used to disagree from there on. The popped entry was parsed with
// the live state as its defaults, so the band the reader had just dragged
// stayed where it was and the link they copied gave the recipient a century
// they had never been looking at (B14, A6).
test('Back comes back to the picture, and the URL says so', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974'));
    await page.eval('document.querySelector(\'.event-head .chip[data-id="estado-novo"]\').click(); return true;');
    await waitFor(page, 'return Boolean(document.querySelector(".panel .actor-head h2"));', 'the actor');

    // The band, narrowed on this second entry, and the graph instead of the
    // map: both are the picture and neither is what is open.
    await page.eval('document.querySelector(\'[data-view="graph"]\').click(); return true;');
    await page.eval(dragWindowTo('from', 400));
    await waitFor(page, 'return /from=/.test(location.search);', 'the band in the URL');
    const narrowed = await page.eval(`return {
      from: Number(new URLSearchParams(location.search).get('from')),
      view: new URLSearchParams(location.search).get('view'),
      whole: Number(document.querySelector('#timeline [data-window="band"]').getAttribute('aria-valuemin')),
    };`);
    assert.ok(narrowed.from > narrowed.whole, `the band was narrowed: from=${narrowed.from}`);
    assert.equal(narrowed.view, 'graph');

    await page.eval('history.back(); return true;');
    await waitFor(page, 'return Boolean(document.querySelector(".panel .event-head h2"));', 'the event again');

    const after = await page.eval(`const band = document.querySelector('#timeline [data-window="band"]');
    return {
      url: Object.fromEntries(new URLSearchParams(location.search)),
      from: Number(document.querySelector('#timeline [data-window="from"]').getAttribute('aria-valuenow')),
      whole: Number(band.getAttribute('aria-valuemin')),
      graphShown: !document.getElementById('graph').hidden,
      pressed: document.querySelector('[data-view="map"]').getAttribute('aria-pressed'),
    };`);
    // The entry was made before any of that, so the URL is the entry and the
    // screen is the URL: no band, no view, and the actor closed.
    assert.deepEqual(after.url, { selected: 'carnation-revolution-1974' });
    assert.equal(after.graphShown, false, 'the map is back with the entry that had no view');
    assert.equal(after.pressed, 'true');
    assert.equal(after.from, after.whole, 'the band is the whole span again');
  });
});

// The correction issue used to carry `location.href` whole: the box, the
// window, the horizon and every step of the walk went into a public issue
// about one record (health review A, finding 33). It carries the record's own
// address now, which is the only part of the URL the record is responsible
// for. Driven, because the whole point is what `location` says at the time.
test('the discuss link carries the record\'s address and nothing the reader did', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?selected=carnation-revolution-1974&bbox=-10,36,-6,43&from=1900&to=1980&horizon=2000'));
    // Walk a step, so there is a chain to leak.
    await page.eval('document.querySelector(\'[data-action="follow"]\').click(); return true;');
    await waitFor(page, 'return new URLSearchParams(location.search).has("chain");', 'a walked chain');

    const link = await page.eval(`return {
      href: document.querySelector('.panel .discuss a').href,
      search: location.search,
    };`);
    assert.match(link.search, /chain=/, 'the reader really is holding one');
    const notes = new URL(link.href).searchParams.get('notes');
    const seen = notes.split('\n').find((line) => line.startsWith('Seen at: '));
    assert.ok(seen, 'the issue says where the record was seen');
    const carried = new URL(seen.slice('Seen at: '.length));
    assert.deepEqual([...carried.searchParams.keys()], ['selected']);
    assert.equal(carried.pathname, '/');
  });
});

// --- the panel is not a column of "Pick an event" --------------------------

const PANES = `const layout = document.querySelector('.layout');
  const box = (el) => { const b = el.getBoundingClientRect(); return Math.round(b.width); };
  return {
    empty: layout.classList.contains('panel-empty'),
    layout: box(layout),
    panel: box(document.querySelector('.panel')),
    map: box(document.getElementById('map')),
    edge: box(document.getElementById('split-panel')),
  };`;

// With nothing open, a third of the width said "Pick an event" beside the
// picture the reader had come for (owner, 5 September).
test('with nothing open the panel is not there, and opening a record brings it back', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?fixtures=1'), 'return Boolean(document.querySelector(".map .mark"));');

    let panes = await page.eval(PANES);
    assert.equal(panes.empty, true);
    assert.equal(panes.panel, 0, 'no panel');
    assert.equal(panes.edge, 0, 'and no edge to drag either');
    assert.equal(panes.map, panes.layout, 'the map has the whole width');

    // Opening a record brings the panel back, at the width the stylesheet or
    // the reader gives it.
    await page.eval(`const el = document.querySelector('#map circle.mark[data-id="fixture-event-b"]');
      const b = el.getBoundingClientRect();
      const at = { bubbles: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 };
      el.dispatchEvent(new PointerEvent('pointerdown', { ...at, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent('pointerup', { ...at, pointerId: 1 }));
      el.dispatchEvent(new MouseEvent('click', at));
      return true;`);
    await waitFor(page, 'return Boolean(document.querySelector(".panel .event-head h2"));', 'the card');

    panes = await page.eval(PANES);
    assert.equal(panes.empty, false);
    assert.ok(panes.panel > 200, `the panel is back (${panes.panel}px)`);
    assert.ok(panes.edge > 0, 'and so is its edge');
    assert.equal(panes.map + panes.edge + panes.panel, panes.layout);

    // A click on the sea puts the record down, and the panel goes with it.
    await page.eval(`const root = document.querySelector('#map svg.map');
      const b = root.getBoundingClientRect();
      root.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: b.left + 4, clientY: b.bottom - 4 }));
      return true;`);
    await waitFor(page, 'return document.querySelector(".layout").classList.contains("panel-empty");', 'the panel to go again');
    panes = await page.eval(PANES);
    assert.equal(panes.map, panes.layout);
  });
});

// A cluster's list is what the panel is showing, and it never reaches the
// URL: the panel has to say so itself or the column would collapse under the
// list the reader had just asked for.
test('a cluster\'s list keeps the panel open although nothing is selected', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?bbox=-10,38,-9,39'), 'return Boolean(document.querySelector(".map .mark.cluster"));');
    assert.equal(await page.eval('return document.querySelector(".layout").classList.contains("panel-empty");'), true);

    await page.eval(`const el = document.querySelector('#map circle.mark.cluster');
      const b = el.getBoundingClientRect();
      const at = { bubbles: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 };
      el.dispatchEvent(new MouseEvent('click', at));
      return true;`);
    await waitFor(page, 'return Boolean(document.querySelector(".panel .cluster-list"));', 'the members of the cluster');
    const panes = await page.eval(PANES);
    assert.equal(panes.empty, false);
    assert.ok(panes.panel > 200);
    assert.equal(await page.eval('return new URLSearchParams(location.search).has("selected");'), false);
  });
});

// H7 item 3: the state actor that holds none of its own events says where
// they are. `european-union` is this dataset's own case of the shape health
// review B, finding 28 describes — zero appearances, four events under the
// EEC it succeeded — and the card has to open on that rather than on an empty
// list saying nothing happened.
test('an actor with no events of its own opens on what came before it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?actor=european-union&from=1900&to=2030'));
    await waitFor(page, 'return Boolean(document.querySelector(\'[data-section="succession"]\'));',
      'the card to say what came before');

    // Open, and open because it is the section with something in it.
    assert.equal(
      await page.eval('return document.querySelector(\'.card-section[data-section="succession"]\')?.classList.contains("open") ?? false;'),
      true,
    );
    assert.equal(
      await page.eval('return document.querySelector(\'[data-section="appearances"] .count\')?.textContent ?? null;'),
      '0',
      'the actor itself records nothing',
    );
    const listed = await page.eval(`return [...document.querySelectorAll('.succession [data-action="select"]')]
      .map((el) => el.dataset.id);`);
    assert.ok(listed.length >= 4, `only ${listed.length} events under what it succeeded`);

    // And each one opens, which is the point: the card is a way into them.
    const first = listed[0];
    await page.eval(`document.querySelector('.succession [data-action="select"][data-id="${first}"]').click(); return true;`);
    await waitFor(page, `return new URLSearchParams(location.search).get('selected') === '${first}';`,
      'the event to open');
  });
});

// R9: the card's own lens control was computed at render and the render key
// did not carry the lens, so nothing redrew it. Clicking "Focus on this" put
// a chip in the header, wrote the focus into the URL, and left the button
// still offering to add the focus it had just added.
test('“Focus on this” becomes “stop focusing on this” without leaving the card', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?selected=carnation-revolution-1974&from=1800&to=2030'));
    await waitFor(page, 'return Boolean(document.querySelector(".panel .lens-control"));', 'the card to offer the lens');
    assert.equal(
      await page.eval('return document.querySelector(".panel .lens-control").textContent;'),
      'Focus on this',
    );
    // The card is marked, so that what follows can say it was patched rather
    // than thrown away and built again — the whole reason the key exists.
    await page.eval('document.querySelector(".panel .card-section").dataset.witness = "kept"; return true;');

    await page.eval('document.querySelector(\'.panel [data-action="focus"]\').click(); return true;');
    await waitFor(page, 'return document.querySelectorAll(".lens-chips .lens-badge").length === 1;', 'the header chip');
    await waitFor(
      page,
      'return document.querySelector(".panel .lens-control")?.textContent === "stop focusing on this";',
      'the control to say what it does now',
    );
    assert.equal(
      await page.eval('return document.querySelector(".panel [data-action=\'focus\']") ? "still there" : "gone";'),
      'gone',
      'and “Focus on this” is not offered twice',
    );

    // And back again: the × on the chip leaves `focus=none`, and the card
    // offers the lens once more.
    await page.eval('document.querySelector(".panel [data-action=\'unfocus\']").click(); return true;');
    await waitFor(
      page,
      'return document.querySelector(".panel .lens-control")?.textContent === "Focus on this";',
      'the control to offer the lens again',
    );
  });
});

// R11: `panel/horizon.js` says the reachable set is lit "on the map, the graph
// and the timeline". The timeline held out the working set without
// `{ reachable: true }`, so a reachable event past the fifty-year margin went
// into the density strip with no `in-horizon` class and nothing to click.
test('the timeline lights a reachable event past the margin, as the hint promises', { skip }, async () => {
  // What the horizon answers, from the module the page runs, and the half of
  // that answer which falls outside the band and its fifty-year margin: the
  // events the timeline was dropping into the density strip.
  const atlas = await atlasOf(path.join(ROOT, 'data'));
  const state = {
    ...defaultState(), selected: 'republic-proclaimed-1910', horizon: 2011, from: 1908, to: 1912,
  };
  const reachable = [...horizonSet(atlas, state).keys()];
  const beyond = reachable.filter((id) => (atlas.events.get(id)?.when?.start ?? 0) > 1912 + MARGIN_YEARS);
  assert.ok(beyond.length > 0, 'the fixture question has an answer past the margin');

  await withBrowser(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?selected=republic-proclaimed-1910&from=1908&to=1912&horizon=2011'));
    await waitFor(page, 'return document.querySelectorAll(".timeline-area svg rect.bar").length > 0;', 'the bars');
    const lit = new Set(await page.eval(`return [...document.querySelectorAll(".timeline-area svg rect.bar.in-horizon")]
      .map((el) => el.dataset.id).filter(Boolean);`));
    assert.ok(lit.size > 0, 'the timeline lights the reachable set at all');
    // A bar, and lit: which is to say it can be seen, and clicked, and walked
    // to. It was a tick in the density strip with no class and no click.
    const found = beyond.filter((id) => lit.has(id));
    assert.ok(found.length > 0, `none of the ${beyond.length} events past the margin is lit`);
    assert.ok(await page.eval(`return Boolean(document.querySelector('.timeline-area svg rect.bar.in-horizon[data-id="${found[0]}"]'));`));
  });
});

// A3 and A4: `?office=` opens a real card — the actor it belongs to, the
// category, and every turn at the post in order — and closes on its own
// control. A tenure has no address, so a row opens the person who held it.
test('an office opens on a card that names the actor, the category and its holders', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?office=prime-minister-of-portugal'));
    const card = await page.eval(`const el = document.querySelector('.panel .office-card');
      return {
        title: el.querySelector('h2').textContent,
        meta: el.querySelector('.meta').textContent.replace(/\\s+/g, ' ').trim(),
        actor: el.querySelector('.meta [data-action="actor"]')?.dataset.id ?? null,
        holders: [...el.querySelectorAll('.tenure-row')].map((r) => r.dataset.tenure),
        people: [...el.querySelectorAll('.tenure-row [data-action="actor"]')].map((b) => b.dataset.id),
        sources: Boolean(el.querySelector('[data-section="sources"]')),
        cites: el.querySelector('.office-cites')?.textContent.trim().slice(0, 20) ?? null,
      };`);
    assert.equal(card.title, 'Prime Minister of Portugal');
    assert.equal(card.actor, 'portugal');
    assert.match(card.meta, /Portugal · Head of government/);
    // Named as members and not as the whole list: M31 fills this post from
    // 1926 onward, and every row is one holder's turn in start order.
    const salazar = card.holders.indexOf('salazar-prime-minister-1932');
    const caetano = card.holders.indexOf('marcelo-caetano-prime-minister-1968');
    assert.ok(salazar >= 0 && caetano > salazar, 'Salazar and, after him, Marcelo Caetano');
    assert.deepEqual(card.people.slice(salazar, caetano + 1), ['salazar', 'marcelo-caetano']);
    assert.equal(card.people.length, card.holders.length, 'a row a holder');
    assert.equal(card.sources, false, 'an office cites nothing and has no Sources section');
    assert.match(card.cites, /^An office says that/);

    // A row opens the person, not the tenure: a tenure has no card. The row is
    // taken by name and not by position — the first turn at this post is of
    // 1926 now, and which one is drawn first is not what is being tested.
    await page.eval('document.querySelector(\'.panel .tenure-row[data-tenure="salazar-prime-minister-1932"] [data-action="actor"]\').click();');
    await waitFor(page, 'return /actor=salazar/.test(location.search) && !/office=/.test(location.search);', 'the holder in the URL and the office out of it');

    // A3: an office is one of the openings the trail carries, so Back names
    // the post the reader came from. Without its branch in `openingLabel`
    // this reads "← the atlas", which is the label for an opening the panel
    // does not recognise and would be a card the reader cannot name.
    await waitFor(page, 'return Boolean(document.querySelector(".panel .card-history .go-back"));',
      'the trail on the holder\'s card');
    assert.equal(
      await page.eval('return document.querySelector(".panel .card-history .go-back").textContent.trim();'),
      '← Prime Minister of Portugal',
    );

    // And the card's own close control takes the office out of the URL
    // without opening anything in its place.
    await open(page, url('?office=prime-minister-of-portugal'));
    await page.eval('document.querySelector(\'.panel [data-action="clear-office"]\').click();');
    await waitFor(page, 'return !/office=/.test(location.search);', 'the office out of the URL');

    // An id that names nothing says so, rather than showing the intro as if
    // the reader had asked for nothing.
    const missing = 'return /No office with id/.test(document.querySelector(".panel")?.textContent ?? "");';
    await open(page, url('?office=no-such-office'), missing);
  });
});

// A5: the strip is drawn without measuring anything — an SVG a thousand units
// across that throws its aspect ratio away — so what only a browser can say
// is that it really does fill the pane and that a bar can be clicked.
test('the actor card draws one tenure strip per office, and a bar opens the holder', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?actor=portugal'));
    // The section is collapsed like every other; open it the way a reader
    // would, through its own header.
    await page.eval('document.querySelector(\'.panel [data-action="section"][data-section="offices"]\').click();');
    await waitFor(page, 'return document.querySelectorAll(".panel .office-row").length === 3;', 'three offices');
    const strip = await page.eval(`const rows = [...document.querySelectorAll('.panel .office-row')];
      const svg = document.querySelector('.panel .tenure-strip svg');
      return {
        offices: rows.map((r) => r.querySelector('[data-action="office"]').dataset.id),
        holders: [...document.querySelectorAll('.panel .tenure-bar')].map((b) => b.dataset.tenure),
        width: Math.round(svg.getBoundingClientRect().width),
        height: Math.round(svg.getBoundingClientRect().height),
        pane: Math.round(svg.parentElement.getBoundingClientRect().width),
        empty: document.querySelectorAll('.panel .strip-empty').length,
      };`);
    assert.deepEqual(strip.offices, ['monarch-of-portugal', 'president-of-portugal', 'prime-minister-of-portugal']);
    // M31-1 filled the two head-of-state posts, so no strip says it is empty
    // any more and the bars are clustered at this width: which of them
    // survives the clustering is the strip's business and not this test's, so
    // what is asserted is that every bar is a turn at one of the three posts
    // and that the two prime ministers are still among them.
    assert.equal(strip.empty, 0, 'every post has a holder now');
    assert.ok(strip.holders.length > 3, `only ${strip.holders.length} bars`);
    for (const id of strip.holders) assert.match(id, /-(monarch|president|prime-minister)-\d{4}$/, id);
    assert.ok(strip.holders.includes('salazar-prime-minister-1932'), 'Salazar');
    assert.ok(strip.holders.includes('marcelo-caetano-prime-minister-1968'), 'Caetano');
    // It fills whatever width the pane has and keeps the height it was drawn
    // at: that is the whole of "no card measures its container".
    assert.equal(strip.width, strip.pane);
    assert.ok(strip.width > 100, `the strip is ${strip.width}px wide`);
    assert.equal(strip.height, 24);

    // And a bar is a way to the person, not to the tenure. A `<rect>` has no
    // `click()` of its own — that is HTMLElement's — so the event is
    // dispatched, which is what a real click does anyway: the panel listens
    // on its container and the click bubbles out of the SVG to it.
    await page.eval('document.querySelector(\'.panel .tenure-bar[data-tenure="salazar-prime-minister-1932"]\').dispatchEvent(new MouseEvent("click", { bubbles: true }));');
    await waitFor(page, 'return /actor=salazar/.test(location.search);', 'the holder in the URL');
  });
});

// A14: `historicalNames` is on the record and not in the spine, so the only
// honest test of the place card drawing it is one that lets the fetch happen.
// The fixture place carries two; nothing in the repository's own data does.
test('a place card draws the names it held, with the years each held them', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?fixtures=1&place=fixture-place-b'));
    await waitFor(page, 'return Boolean(document.querySelector(".panel .historical-names"));',
      'the dated names to arrive with the record');
    const names = await page.eval(`return [...document.querySelectorAll('.panel .historical-names li')]
      .map((li) => li.textContent.replace(/\\s+/g, ' ').trim());`);
    assert.deepEqual(names, [
      'Fixture Place B, as it was called until 1300',
      'Fixture place B from 1300',
    ]);
  });
});

// Item 2, the card half: `parent` is a display fact, so what a browser can
// say is that the head names the whole and the sections list the parts.
// Nothing in the repository's own data carries a parent yet; the fixtures do.
test('the card names what an event is part of, and a parent lists its parts', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?fixtures=1&selected=fixture-event-h'));
    assert.equal(
      await page.eval('return document.querySelector(".panel .part-of-event [data-action=\'select\']").dataset.id;'),
      'fixture-event-f',
    );

    // And opening the whole from the part lists the parts in order.
    await page.eval('document.querySelector(".panel .part-of-event [data-action=\'select\']").click();');
    await waitFor(page, 'return Boolean(document.querySelector(\'.panel [data-section="parts"]\'));', 'the parts section');
    const parts = await page.eval(`const s = document.querySelector('.panel [data-section="parts"]');
      return {
        count: s.querySelector('.count').textContent,
        ids: [...s.querySelectorAll('[data-action="select"]')].map((b) => b.dataset.id),
        partOf: Boolean(document.querySelector('.panel .part-of-event')),
      };`);
    assert.equal(parts.count, '2');
    assert.deepEqual(parts.ids, ['fixture-event-t', 'fixture-event-h']);
    assert.equal(parts.partOf, false, 'the parent is itself inside nothing');
  });
});

// I4a: a link somebody was sent, opened cold, into a century that is not the
// first shard the page asks for. The card is what a reader reads, so it never
// draws out of the core's fallbacks — a title that is the record's id, a count
// of 0, a year computed from an astronomical bound (index2 review, finding 21).
// It says it is loading, the shard the record is filed in is asked for and
// pinned, and the card is drawn whole when it lands.
test('a link into a later century opens the card with the record’s own title', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // 1974: the second of the three century shards on the repository's data,
    // so the page cannot have got there by fetching only the first.
    await open(page, url('index.html?selected=carnation-revolution-1974'), 'return document.querySelectorAll(".panel .card-section").length > 0;');
    const card = await page.eval(`return {
      head: (document.querySelector(".panel .event-head")?.textContent ?? "").replace(/\\s+/g, " ").trim(),
      chips: [...document.querySelectorAll(".panel .event-head .chip")].map((c) => c.textContent.replace(/\\s+/g, " ").trim()),
      shards: performance.getEntriesByType("resource").filter((e) => e.name.includes("/index/attributes-")).map((e) => e.name),
    };`);
    // The card is the record's own words: the actors are named, not slugged.
    assert.ok(card.chips.length > 0, `no actors on the card: ${card.head}`);
    for (const chip of card.chips) {
      assert.ok(!/^[a-z0-9-]+ ·/.test(chip), `${chip} is an id where a name goes`);
    }
    assert.match(card.chips.join(' · '), /Armed Forces Movement/);
    assert.ok(
      card.shards.some((n) => /attributes-1900-1999-/.test(n)),
      `the century it is filed in was asked for: ${card.shards.join(' · ')}`,
    );
  });
});

// The office cards are the ones that would have shown it first: all nine
// offices carry `when: null`, so they are filed in the `null` shard, and the
// card printed `prime-minister-of-portugal` where the title goes until this
// run stopped it drawing before that shard landed.
test('a card waits for its own shard rather than drawing the core’s fallbacks', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html?office=prime-minister-of-portugal'), 'return document.querySelectorAll(".panel .office-head").length > 0;');
    const title = await page.eval('return document.querySelector(".panel .office-head h2")?.textContent ?? "";');
    assert.equal(title, 'Prime Minister of Portugal');
    assert.notEqual(title, 'prime-minister-of-portugal', 'never the id where the title goes');
  });
});
