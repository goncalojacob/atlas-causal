// The card in a real browser, driven rather than only dumped: opening a
// section, doing it from the keyboard, the choice surviving a reload, and the
// browser's own Back coming back to the event.
//
// None of that can be checked by --dump-dom, which renders one URL and stops.
// The driven browser itself is tests/browser.mjs, shared with the phone
// checks; the reasons it is built by hand are there.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, skip } from './browser.mjs';

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

    // The head: the actors are chips, and the summary is its own text.
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
    assert.equal(before.horizon, '46');

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
