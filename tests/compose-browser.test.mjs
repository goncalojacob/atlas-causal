// M71 in a real browser: a reader picks events by clicking them, writes the
// text, and opens an issue carrying a valid narrative record.
//
// What needs a browser and cannot be had from `tests/compose.test.mjs`: that
// the click which chose an event is the click that picks it (M65's own), that
// the composer's module is not loaded until somebody opens it, that the draft
// is still there after a reload and gone after a submit, and — the one the
// brief asks for in as many words — that **the page makes no network request
// on submit**.
//
// Written before the composer it judges (deviations 711 and 717). No test
// here pins a count: what is asserted is which events are steps and in what
// order, never how many there are in the atlas.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, seenIntro, watchErrors, errorsOn, skip } from './browser.mjs';

const DESK = { width: 1440, height: 900, deviceScaleFactor: 1 };
const desk = (fn) => withBrowser(fn, { device: DESK });

const MAP_READY = 'return Boolean(document.querySelector(".map .mark"));';
const COMPOSER_READY = 'return Boolean(document.querySelector("#composer .composer-steps"));';

// The walk the tests compose. Not three marks picked at random: choosing an
// event is a lens since M65, so the picture narrows to what the chosen event
// reaches and the next step is picked out of that — which is what following
// the consequences and writing as you go actually looks like. B reaches D and
// D reaches T in the fixtures.
const B = 'fixture-event-b';
const D = 'fixture-event-d';
const T = 'fixture-event-t';
const WALK = [B, D, T];
const SPAN = '1220 to 1280';

const TEXT = (n) => `Step ${n} of a synthetic walk, written in a test. It says why the step follows in `
  + 'enough words for the rules to count it as an argument, and it is not history.';
const SUMMARY = 'A synthetic walk composed in a browser test. It claims nothing about the world and exists '
  + 'only to prove that what the composer builds is what the validator accepts.';

// The reader's click on a mark, the way map-browser.test.mjs makes one: the
// pointer events the views actually listen for, not a synthetic .click().
const clickOn = (selector) => `
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('nothing at ' + ${JSON.stringify(selector)});
  const b = el.getBoundingClientRect();
  const at = { bubbles: true, cancelable: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 };
  el.dispatchEvent(new PointerEvent('pointerdown', { ...at, pointerId: 3 }));
  el.dispatchEvent(new PointerEvent('pointerup', { ...at, pointerId: 3 }));
  el.dispatchEvent(new MouseEvent('click', at));
  return true;`;

const openComposer = "document.getElementById('compose-button').click(); return true;";

const STEPS = `return [...document.querySelectorAll('#composer .composer-step')]
  .map((li) => ({
    ref: li.querySelector('.composer-step-ref').textContent,
    text: li.querySelector('.step-text').value,
  }));`;

const writeStep = (at, text) => `
  const el = document.querySelectorAll('#composer .composer-step .step-text')[${at}];
  el.value = ${JSON.stringify(text)};
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;`;

// Everything a reader has to say once, plus a source: rule 6 asks a narrative
// to cite what it rests on beyond the records it walks.
const fillOut = `
  const set = (sel, v) => {
    const el = document.querySelector(sel);
    el.value = v; el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  set('#compose-title', 'A synthetic walk');
  set('#compose-summary', ${JSON.stringify(SUMMARY)});
  set('#compose-your-name', 'A Reader');
  document.querySelector('#composer .citation-rows').parentElement.querySelector('button.link').click();
  const select = document.querySelector('#composer .citation-row select');
  select.value = 'fixture-source-1';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;`;

// Every door out of the page, counted rather than trusted. Installed before
// any script of the page runs, so nothing the composer does can get past it.
const COUNT_REQUESTS = `
  window.__requests = [];
  const note = (what, url) => { window.__requests.push(what + ' ' + url); };
  const realFetch = window.fetch;
  window.fetch = (...args) => { note('fetch', String(args[0])); return realFetch(...args); };
  const realOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    note('xhr', String(url));
    return realOpen.call(this, method, url, ...rest);
  };
  if (navigator.sendBeacon) {
    const realBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, ...rest) => { note('beacon', String(url)); return realBeacon(url, ...rest); };
  }
  window.__opened = [];
  window.open = (url) => { window.__opened.push(String(url)); return null; };`;

// 1. The picking, which is the milestone in one assertion.
test('events clicked on the map become the steps, in the order they were clicked', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await watchErrors(page);
    await open(page, url('?fixtures=1'), MAP_READY);

    // Nothing of the composer has been fetched while the atlas was drawn: the
    // module is imported when the button is pressed and not before, which is
    // the whole of "first paint must not get slower".
    const before = await page.eval(
      'return performance.getEntriesByType("resource").filter((e) => e.name.includes("/compose/")).map((e) => e.name);',
    );
    assert.deepEqual(before, [], 'the composer is not loaded at first paint');

    await page.eval(openComposer);
    await waitFor(page, COMPOSER_READY, 'the composer');
    const after = await page.eval(
      'return performance.getEntriesByType("resource").filter((e) => e.name.includes("/compose/")).length > 0;',
    );
    assert.equal(after, true, 'and it is loaded the moment it is opened');

    for (const id of WALK) await page.eval(clickOn(`#map circle.mark[data-id="${id}"]`));
    const steps = await page.eval(STEPS);
    assert.deepEqual(steps.map((s) => s.ref), WALK, 'the steps are the events picked, in order');

    // The same click is still the lens M65 made it: picking a step does not
    // take the reader's own way of reading the atlas away from them.
    const selected = await page.eval('return new URLSearchParams(location.search).get("selected");');
    assert.equal(selected, T, 'the last event clicked is still the chosen one');

    // The window is the span of the steps, and there is nothing to type it
    // into: the composer has no year field at all.
    const shown = await page.eval('return document.querySelector("#composer .composer-window").textContent;');
    assert.equal(shown, SPAN, 'the span of the three fixtures picked');
    const fields = await page.eval('return document.querySelectorAll("#composer input[type=number]").length;');
    assert.equal(fields, 0, 'the window is computed and shown, never typed');

    assert.deepEqual(await errorsOn(page), []);
  });
});

// 2. A step cannot name what the atlas has not got, and there is no way to
//    ask for one: the only door into the walk is a record drawn on a picture.
test('the composer offers nothing it cannot cite', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?fixtures=1'), MAP_READY);
    await page.eval(openComposer);
    await waitFor(page, COMPOSER_READY, 'the composer');

    const typed = await page.eval(`return [...document.querySelectorAll('#composer input, #composer select')]
      .filter((el) => !['compose-title', 'compose-your-name'].includes(el.id) && !el.closest('.citation-row'))
      .map((el) => el.id || el.className);`);
    assert.deepEqual(typed, [], 'the title, the name and the citations are all there is to type');

    // And a draft written before a record went away does not quietly lose the
    // step, nor quietly keep it: the rules say what is wrong with it, in the
    // browser, in the sentence the command line would use.
    await page.eval(`localStorage.setItem('atlas-causal.compose', JSON.stringify({
      title: 'A stale walk', summary: ${JSON.stringify(SUMMARY)}, author: 'A Reader',
      citations: [{ source: 'fixture-source-1', locator: '' }],
      steps: [
        { ref: ${JSON.stringify(B)}, text: ${JSON.stringify(TEXT(1))} },
        { ref: 'an-event-this-atlas-does-not-have', text: ${JSON.stringify(TEXT(2))} }
      ]
    })); return true;`);
    await open(page, url('?fixtures=1'), MAP_READY);
    await page.eval(openComposer);
    await waitFor(page, COMPOSER_READY, 'the composer');

    const refs = await page.eval(STEPS);
    assert.deepEqual(refs.map((s) => s.ref), [B, 'an-event-this-atlas-does-not-have']);
    await waitFor(page, 'return document.querySelectorAll("#composer .entry-errors li").length > 0;', 'the verdict');
    const problems = await page.eval('return [...document.querySelectorAll("#composer .entry-errors li")].map((li) => li.textContent);');
    assert.ok(problems.some((p) => p.includes('an-event-this-atlas-does-not-have')), 'the step is named');
    assert.ok(problems.some((p) => p.startsWith('rule 3')), 'by rule 3, which is the rule the CLI would report');
    assert.equal(await page.eval('return document.querySelector("#composer .submit").disabled;'), true,
      'and it cannot be submitted');
  });
});

// 3. The record, the link, and what the page does not send.
test('submitting opens a GitHub issue carrying the record, and asks nothing of the network', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await watchErrors(page);
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: COUNT_REQUESTS });
    await open(page, url('?fixtures=1'), MAP_READY);
    await page.eval(openComposer);
    await waitFor(page, COMPOSER_READY, 'the composer');

    for (const id of WALK) await page.eval(clickOn(`#map circle.mark[data-id="${id}"]`));
    for (let at = 0; at < WALK.length; at += 1) await page.eval(writeStep(at, TEXT(at + 1)));
    await page.eval(fillOut);

    await waitFor(page, 'return document.querySelector("#composer .submit").disabled === false;', 'a valid record');
    const verdict = await page.eval('return document.querySelector("#composer .report .summary").textContent;');
    assert.match(verdict, /the validator accepts/i, 'the rules ran in the browser and passed');

    // The line is drawn here: everything the page fetched up to this point.
    const fetchedBefore = await page.eval('return window.__requests.length;');

    await page.eval("document.querySelector('#composer .submit').click(); return true;");
    await waitFor(page, 'return window.__opened.length > 0;', 'the issue tab');

    const opened = await page.eval('return window.__opened;');
    assert.equal(opened.length, 1);
    const target = new URL(opened[0]);
    assert.equal(target.origin, 'https://github.com');
    assert.equal(target.pathname, '/goncalojacob/atlas-causal/issues/new');
    assert.equal(target.searchParams.get('template'), 'contribution.yml');
    assert.equal(target.searchParams.get('title'), 'Contribution: A synthetic walk');

    const bundle = JSON.parse(target.searchParams.get('bundle'));
    const record = bundle.records[0];
    assert.equal(record.kind, 'narrative');
    assert.equal(record.status, 'active');
    assert.equal(record.review.status, 'draft', 'and it says honestly that nobody has read it');
    assert.deepEqual(record.steps.map((s) => s.ref), WALK);
    assert.deepEqual(record.window, { from: 1220, to: 1280 });
    assert.deepEqual(record.sources, [{ source: 'fixture-source-1', locator: null }]);

    // No token, no secret, no API call — and no request of any kind.
    const requests = await page.eval('return window.__requests;');
    assert.equal(requests.length, fetchedBefore, 'submitting fetched nothing');
    assert.equal(/token|secret|api\.github/i.test(opened[0]), false);
    assert.deepEqual(await errorsOn(page), []);
  });
});

// 4. The draft: kept between visits, and ended by being sent.
test('a draft survives a reload and does not survive being submitted', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await watchErrors(page);
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: COUNT_REQUESTS });
    await open(page, url('?fixtures=1'), MAP_READY);
    await page.eval(openComposer);
    await waitFor(page, COMPOSER_READY, 'the composer');

    for (const id of WALK) await page.eval(clickOn(`#map circle.mark[data-id="${id}"]`));
    for (let at = 0; at < WALK.length; at += 1) await page.eval(writeStep(at, TEXT(at + 1)));
    await page.eval(fillOut);

    // Reloaded on the bare address, so what comes back is what the browser
    // kept and not what the URL carried: a draft is a preference and never
    // state, so there is nothing about it in the link (panes.js).
    await open(page, url('?fixtures=1'), MAP_READY);
    const clean = await page.eval('return new URLSearchParams(location.search).toString();');
    assert.equal(clean, 'fixtures=1', 'nothing of the draft is in the URL');
    await page.eval(openComposer);
    await waitFor(page, COMPOSER_READY, 'the composer');

    const back = await page.eval(STEPS);
    assert.deepEqual(back.map((s) => s.ref), WALK, 'the walk came back');
    assert.deepEqual(back.map((s) => s.text), [TEXT(1), TEXT(2), TEXT(3)], 'and so did every paragraph');
    assert.equal(await page.eval('return document.querySelector("#compose-title").value;'), 'A synthetic walk');
    assert.equal(await page.eval('return document.querySelector("#composer .citation-row select").value;'), 'fixture-source-1');

    await waitFor(page, 'return document.querySelector("#composer .submit").disabled === false;', 'a valid record');
    await page.eval("document.querySelector('#composer .submit').click(); return true;");
    await waitFor(page, 'return window.__opened.length > 0;', 'the issue tab');

    const emptied = await page.eval(STEPS);
    assert.deepEqual(emptied, [], 'the walk has gone with the issue');
    await open(page, url('?fixtures=1'), MAP_READY);
    await page.eval(openComposer);
    await waitFor(page, COMPOSER_READY, 'the composer');
    assert.deepEqual(await page.eval(STEPS), [], 'and it does not come back on the next visit');
    assert.equal(await page.eval('return document.querySelector("#compose-title").value;'), '');

    assert.deepEqual(await errorsOn(page), []);
  });
});

// 5. Reordering and removing, which is how an accidental pick is undone.
test('a step can be moved and taken out of the walk', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?fixtures=1'), MAP_READY);
    await page.eval(openComposer);
    await waitFor(page, COMPOSER_READY, 'the composer');

    for (const id of WALK) await page.eval(clickOn(`#map circle.mark[data-id="${id}"]`));
    await page.eval(writeStep(0, TEXT(1)));

    await page.eval("document.querySelectorAll('#composer .composer-step .move-down')[0].click(); return true;");
    const moved = await page.eval(STEPS);
    assert.deepEqual(moved.map((s) => s.ref), [D, B, T]);
    assert.equal(moved[1].text, TEXT(1), 'the paragraph travelled with its step');

    await page.eval("document.querySelectorAll('#composer .composer-step .composer-remove')[1].click(); return true;");
    assert.deepEqual((await page.eval(STEPS)).map((s) => s.ref), [D, T]);

    // The ends of the list say they are the ends.
    const ends = await page.eval(`return {
      firstUp: document.querySelectorAll('#composer .move-up')[0].disabled,
      lastDown: [...document.querySelectorAll('#composer .move-down')].pop().disabled,
    };`);
    assert.deepEqual(ends, { firstUp: true, lastDown: true });
  });
});

// 6. The page says what happens next, and that a GitHub account is needed.
test('the composer says where the issue goes and what is needed to send it', { skip }, async () => {
  await desk(async (page, url) => {
    await seenIntro(page);
    await open(page, url('?fixtures=1'), MAP_READY);
    await page.eval(openComposer);
    await waitFor(page, COMPOSER_READY, 'the composer');
    const said = await page.eval('return document.querySelector("#composer .submit-note").textContent;');
    assert.match(said, /GitHub account/);
    assert.match(said, /accepted/);
    assert.match(said, /pull request/);
    assert.match(said, /Nothing is sent from this page/i);
  });
});
