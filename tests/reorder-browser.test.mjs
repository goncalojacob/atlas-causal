// Moving a narrative's steps, in a real browser: the buttons, Alt with an
// arrow from inside the textarea, the ends that have nowhere to go, and the
// bundle that is actually filed following the rows. `moveItem` is held to the
// arithmetic in tests/bundle.test.mjs; what needs a browser is whether the
// rows and the record agree afterwards.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, skip } from './browser.mjs';

// The form with a narrative entry open and three steps in it, each pointing
// at a different fixture record and carrying its own text, so a move that
// took a text with the wrong ref would show.
const THREE_STEPS = `const add = [...document.querySelectorAll(".add-row button")].find((b) => b.textContent === "Add narrative");
  add.click();
  const steps = document.querySelector(".field.steps");
  const addStep = steps.querySelector(".citations-head button");
  for (let i = 0; i < 3; i += 1) addStep.click();
  const rows = [...steps.querySelectorAll(".step-row")];
  const refs = ["fixture-event-a", "fixture-event-b", "fixture-event-c"];
  rows.forEach((row, i) => {
    // The picker, driven the way a contributor drives it: the id pasted in,
    // and the row it offers chosen. There is no select to set any more.
    const box = row.querySelector(".picker input");
    box.value = refs[i];
    box.dispatchEvent(new Event("input", { bubbles: true }));
    const option = row.querySelector('.picker-option[data-id="' + refs[i] + '"]');
    if (!option) throw new Error("the picker did not offer " + refs[i]);
    option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    const text = row.querySelector("textarea");
    text.value = "Step " + (i + 1) + ": a sentence long enough to be a step.";
    text.dispatchEvent(new Event("input", { bubbles: true }));
  });
  return rows.length;`;

// What the rows say, and what the bundle that would be filed says. The two
// have to agree after every move: the preview is the record.
const ORDER = `const rows = [...document.querySelectorAll(".field.steps .step-row")];
  const bundle = JSON.parse(document.querySelector(".preview").textContent || "{}");
  const narrative = (bundle.records ?? []).find((r) => r.kind === "narrative");
  return {
    rows: rows.map((r) => (r.querySelector(".picker-chosen").textContent.split(" · ")[1] || "").trim()),
    texts: rows.map((r) => r.querySelector("textarea").value.slice(0, 6)),
    filed: (narrative?.steps ?? []).map((s) => s.ref),
    filedTexts: (narrative?.steps ?? []).map((s) => s.text.slice(0, 6)),
    upDisabled: rows.map((r) => r.querySelector(".move-up").disabled),
    downDisabled: rows.map((r) => r.querySelector(".move-down").disabled),
  };`;

async function withForm(fn) {
  await withBrowser(async (page, url) => {
    await open(page, url('contribute.html?fixtures=1'), 'return document.querySelectorAll(".add-row button").length > 0;');
    assert.equal(await page.eval(THREE_STEPS), 3);
    await fn(page);
  });
}

test('the ↑ and ↓ on a step row move it, and the ends are disabled', { skip }, async () => {
  await withForm(async (page) => {
    const start = await page.eval(ORDER);
    assert.deepEqual(start.rows, ['fixture-event-a', 'fixture-event-b', 'fixture-event-c']);
    assert.deepEqual(start.filed, start.rows, 'the bundle is the rows');
    assert.deepEqual(start.upDisabled, [true, false, false], 'the first step has nothing above it');
    assert.deepEqual(start.downDisabled, [false, false, true], 'and the last nothing below it');

    // The middle one, up.
    await page.eval('document.querySelectorAll(".step-row")[1].querySelector(".move-up").click(); return true;');
    const up = await page.eval(ORDER);
    assert.deepEqual(up.rows, ['fixture-event-b', 'fixture-event-a', 'fixture-event-c']);
    assert.deepEqual(up.texts, ['Step 2', 'Step 1', 'Step 3'], 'the text travelled with its own ref');
    assert.deepEqual(up.filed, up.rows, 'and the bundle followed');
    assert.deepEqual(up.filedTexts, up.texts);

    // And the same row down again — it is the first one now — so the list is
    // back where it started.
    await page.eval('document.querySelectorAll(".step-row")[0].querySelector(".move-down").click(); return true;');
    const back = await page.eval(ORDER);
    assert.deepEqual(back.rows, ['fixture-event-a', 'fixture-event-b', 'fixture-event-c']);
    assert.deepEqual(back.filed, back.rows);

    // The last one down and the first one up do nothing: the buttons there
    // are disabled, and a click on a disabled button is not a click.
    await page.eval('document.querySelectorAll(".step-row")[2].querySelector(".move-down").click(); return true;');
    await page.eval('document.querySelectorAll(".step-row")[0].querySelector(".move-up").click(); return true;');
    assert.deepEqual((await page.eval(ORDER)).rows, ['fixture-event-a', 'fixture-event-b', 'fixture-event-c']);
  });
});

test('Alt and an arrow move the step being written, without leaving the textarea', { skip }, async () => {
  await withForm(async (page) => {
    // From inside the textarea, which is the point of Alt: the arrows alone
    // move the cursor through the paragraph being typed.
    const moved = await page.eval(`const text = document.querySelectorAll(".step-row")[0].querySelector("textarea");
      text.focus();
      text.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, cancelable: true }));
      return document.activeElement === text;`);
    assert.equal(moved, true, 'focus stayed in the field being typed in');
    const after = await page.eval(ORDER);
    assert.deepEqual(after.rows, ['fixture-event-b', 'fixture-event-a', 'fixture-event-c']);
    assert.deepEqual(after.filed, after.rows);

    // A plain arrow is a cursor key and must not move anything.
    await page.eval(`const text = document.querySelectorAll(".step-row")[0].querySelector("textarea");
      text.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
      return true;`);
    assert.deepEqual((await page.eval(ORDER)).rows, ['fixture-event-b', 'fixture-event-a', 'fixture-event-c']);

    // Alt+↑ on the row that is now first: nowhere to go.
    await page.eval(`const row = document.querySelectorAll(".step-row")[0];
      row.querySelector(".picker input").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true, bubbles: true, cancelable: true }));
      return true;`);
    assert.deepEqual((await page.eval(ORDER)).rows, ['fixture-event-b', 'fixture-event-a', 'fixture-event-c']);
  });
});

test('removing a step renumbers the ends, and the walk is still the rows', { skip }, async () => {
  await withForm(async (page) => {
    await page.eval('document.querySelectorAll(".step-row")[0].querySelector(".move-down").click(); return true;');
    await page.eval(`const row = [...document.querySelectorAll(".step-row")].at(-1);
      [...row.querySelectorAll("button")].find((b) => b.textContent === "remove").click();
      return true;`);
    const after = await page.eval(ORDER);
    assert.deepEqual(after.rows, ['fixture-event-b', 'fixture-event-a']);
    assert.deepEqual(after.filed, after.rows);
    assert.deepEqual(after.upDisabled, [true, false], 'the ends moved with the list');
    assert.deepEqual(after.downDisabled, [false, true]);
  });
});

test('the review dashboard moves a narrative\'s steps the same way', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // The real dataset and not the fixtures: every fixture record is signed,
    // so the review queue is empty there, and the one narrative that still
    // carries the draft marker is the one in data/.
    await open(page, url('review.html'), 'return document.querySelectorAll(".queue-item").length > 0;');
    await page.eval(`const search = document.querySelector(".queue-search");
      search.value = "how the colonial war";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      return true;`);
    await waitFor(page, 'return document.querySelectorAll(".queue-item").length === 1;', 'the narrative in the queue');
    await page.eval('document.querySelector(".queue-item").click(); return true;');
    await waitFor(page, 'return document.querySelectorAll(".field.list .citation-row .move-up").length > 0;', 'the editor');

    // Nothing here is saved: tools/serve.mjs really does write to data/, so
    // this only reads the rows the editor built and moves two of them.
    const steps = () => page.eval(`return [...document.querySelectorAll(".field.list .citation-row")]
      .filter((r) => r.querySelector(".move-up"))
      .map((r) => [(r.querySelector(".picker-chosen").textContent.split(" · ")[1] || "").trim(), r.querySelector("textarea").value.slice(0, 24)]);`);
    const before = await steps();
    assert.equal(before.length, 12, 'the narrative in data/ has twelve steps');
    assert.deepEqual(
      await page.eval(`const rows = [...document.querySelectorAll(".field.list .citation-row")].filter((r) => r.querySelector(".move-up"));
        return [rows[0].querySelector(".move-up").disabled, rows.at(-1).querySelector(".move-down").disabled];`),
      [true, true],
      'the ends have nowhere to go',
    );

    await page.eval(`const rows = [...document.querySelectorAll(".field.list .citation-row")].filter((r) => r.querySelector(".move-up"));
      rows[1].querySelector(".move-up").click();
      return true;`);
    // The row moved, and its own text moved with it.
    assert.deepEqual(await steps(), [before[1], before[0], ...before.slice(2)]);

    // Citations are a set, not a walk, and get no controls at all.
    const others = await page.eval(`return [...document.querySelectorAll(".record .field.list")]
      .map((f) => [f.querySelector(".citations-label").textContent, Boolean(f.querySelector(".move-up"))]);`);
    assert.deepEqual(others.filter(([, movable]) => movable).map(([label]) => label), ['Steps *']);
  });
});
