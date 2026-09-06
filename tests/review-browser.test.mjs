// The review dashboard in a real browser: the queue as a list of twenty
// thousand drafts, and the record pane's three new blocks.
//
// The numbers here cannot be had from Node. What the health review measured
// was the drawing — 30,543 rows in the DOM and 461 ms per keystroke in the
// queue search at twenty thousand drafts, five and a half seconds to first
// paint (finding 7) — and a benchmark without a DOM measures the half that
// was never the problem. `tests/bench/run.mjs list` measures that half; this
// measures the rows.
//
// The corpus is synthetic and made in the page: no fixture on disk is this
// size, and what is being timed is the list and not a fetch.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, skip } from './browser.mjs';

const QUEUE_READY = 'return document.querySelectorAll(".queue-item").length > 0;';

// The thresholds the brief names.
const RENDER_MS = 500;
const KEY_MS = 50;

test('the queue draws 20 000 drafts and answers a keystroke', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('review.html'), QUEUE_READY);
    const measured = await page.eval(`return (async () => {
      const { createList } = await import("/src/review/list.js");
      const { queueRow } = await import("/src/review/row.js");
      const { buildQueue, filterQueue, sortQueue } = await import("/src/review/queue.js");

      // Twenty thousand digests shaped like the ones the index writes.
      const flags = ["imported-facts", "contributed", "no-identifier"];
      const digests = [];
      const warnings = [];
      for (let i = 0; i < 20000; i += 1) {
        const id = "bench-event-" + String(i).padStart(5, "0");
        digests.push({
          kind: "event", id, status: "active", title: "Bench event " + i,
          created: "2026-01-01", revised: "2026-0" + ((i % 9) + 1) + "-01",
          degree: i % 41,
          review: { status: "draft", ...(i % 5 === 0 ? { flags: [flags[i % 3]] } : {}) },
        });
        if (i % 20 === 0) warnings.push({ id, kind: "event", rule: "degree-zero", message: "event has no edges" });
      }

      // First paint: the model, the order, and the rows that go in the DOM.
      const started = performance.now();
      const queue = buildQueue(digests, { warnings });
      const list = createList({ rowHeight: 54, render: (item) => queueRow(item, { today: "2026-09-05" }) });
      const pane = document.createElement("div");
      pane.style.height = "540px";
      pane.style.overflow = "auto";
      pane.appendChild(list.root);
      document.body.appendChild(pane);
      list.root.style.height = "540px";
      list.setRows(sortQueue(filterQueue(queue, {}), "kind"));
      // Forced layout, so the time below covers the browser's own work and
      // not only ours: a paint that has not been laid out is not a paint.
      const height = list.root.scrollHeight;
      const render = performance.now() - started;

      // A keystroke: filter, order, and make one screenful.
      const keys = [];
      for (const [text, key] of [["b", "kind"], ["be", "flags"], ["bench event 1", "degree"], ["bench event 1234", "age"]]) {
        const at = performance.now();
        list.setRows(sortQueue(filterQueue(queue, { text }), key));
        void list.root.scrollHeight;
        keys.push(performance.now() - at);
      }

      list.setRows(sortQueue(filterQueue(queue, {}), "kind"));
      void list.root.scrollHeight;
      const inDom = list.root.querySelectorAll(".queue-item").length;

      // Scrolled a thousand rows down, the rows are the ones down there and
      // there are no more of them than at the top.
      list.root.scrollTop = 54 * 1000;
      list.root.dispatchEvent(new Event("scroll"));
      const afterScroll = [...list.root.querySelectorAll(".queue-item .queue-id")].map((el) => el.textContent);

      return {
        render, keys, inDom, height, total: queue.length,
        afterScroll: afterScroll.length,
        firstDown: afterScroll[0] ?? null,
        row: [...list.root.querySelector(".queue-item").children].map((el) => el.className),
      };
    })();`);

    assert.equal(measured.total, 20000, 'every draft is in the model');
    // The whole point: the model is twenty thousand and the DOM is a
    // screenful. 30,543 rows was the measured figure this replaces.
    assert.ok(measured.inDom > 0 && measured.inDom < 40, `${measured.inDom} rows in the DOM, of 20 000`);
    assert.equal(measured.afterScroll, measured.inDom, 'a scroll makes rows, it does not add them');
    assert.match(measured.firstDown ?? '', /^bench-event-0099/, `scrolled to row 1000, the DOM starts near it: ${measured.firstDown}`);
    assert.equal(measured.height, 20000 * 54, 'the scroller is as tall as every row would be');
    assert.deepEqual(measured.row, ['queue-label', 'queue-marks']);

    assert.ok(measured.render < RENDER_MS, `the list at 20 000 drafts took ${measured.render.toFixed(0)} ms to draw`);
    for (const took of measured.keys) {
      assert.ok(took < KEY_MS, `a keystroke took ${took.toFixed(1)} ms: ${measured.keys.map((t) => t.toFixed(1)).join(', ')}`);
    }
    console.log(`      review list at 20k: ${measured.render.toFixed(0)} ms to draw, keystrokes ${measured.keys.map((t) => `${t.toFixed(1)} ms`).join(', ')}, ${measured.inDom} rows in the DOM`);
  });
});

// The three blocks H6b puts beside the record. On the repository's own data
// and not on the fixtures: the fixtures carry no draft at all, so the queue
// there is empty and there is nothing to open.
test('the record pane shows the history, the claim and the diff against the draft', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('review.html'), QUEUE_READY);
    await waitFor(page, 'return document.querySelector(".record-history summary") !== null;', 'the history block');
    const shown = await page.eval(`return {
      history: (document.querySelector(".record-history summary") || {}).textContent || "",
      versions: document.querySelectorAll(".record-history .history-list li").length,
      claim: (document.querySelector(".record-claim button") || {}).textContent || "",
      diffHidden: document.querySelector(".record-diff").hidden,
    };`);
    assert.match(shown.history, /^History — \d+ version/, shown.history);
    assert.ok(shown.versions > 0, 'the history has at least the day the record was written');
    assert.equal(shown.claim, 'Claim', 'nothing is claimed to start with');
    assert.equal(shown.diffHidden, true, 'nothing has been changed yet, so there is no diff');

    // One keystroke in the editor, and the diff says which field moved.
    await page.eval(`const field = document.querySelector(".editor-mount .field-title input");
      field.value = field.value + " (corrected)";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      return true;`);
    await waitFor(page, 'return document.querySelector(".record-diff").hidden === false;', 'the diff');
    const diff = await page.eval(`return {
      summary: document.querySelector(".record-diff summary").textContent,
      fields: [...document.querySelectorAll(".record-diff .diff-field")].map((el) => el.textContent),
      after: [...document.querySelectorAll(".record-diff .diff-after")].map((el) => el.textContent),
    };`);
    assert.match(diff.summary, /field.* changed since the draft/);
    assert.ok(diff.fields.length > 0, 'the field that moved is named');
    assert.ok(diff.after.some((t) => t.includes('(corrected)')), diff.after.join(' | '));
  });
});

// An edge was reviewed as two ids and a textarea: what ran between the two
// events could not be judged without leaving the page (health review B,
// finding 7).
test('an edge is reviewed with both of its ends beside it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('review.html'), QUEUE_READY);
    // The queue's own edge, chosen by its chip rather than by scrolling.
    await page.eval(`const chip = [...document.querySelectorAll(".queue-filters .chip")].find((b) => b.textContent.startsWith("edge ("));
      if (!chip) throw new Error("no edge in the fixture queue");
      chip.click();
      return true;`);
    // The rows arrive when the kind's shard does, so waiting for "some row"
    // would find the kind that was showing before the chip was clicked.
    await waitFor(page, 'return (document.querySelector(".queue-item .queue-id") || {}).textContent?.includes("--") === true;', 'the edge rows');
    await page.eval('document.querySelector(".queue-item").click(); return true;');
    await waitFor(page, 'return (document.querySelector(".record-id") || {}).textContent?.startsWith("edge ·") === true;', 'an edge open');
    await waitFor(page, 'return document.querySelectorAll(".context-end h4").length === 2;', 'both ends');
    const ends = await page.eval(`return [...document.querySelectorAll(".context-end")].map((box) => ({
      side: box.querySelector(".context-side").textContent,
      title: (box.querySelector("h4") || {}).textContent || "",
      id: box.querySelector(".context-id").textContent,
      status: (box.querySelector(".status") || {}).textContent || "",
      summary: (box.querySelector(".context-summary") || {}).textContent || "",
    }));`);
    assert.equal(ends.length, 2);
    assert.deepEqual(ends.map((e) => e.side), ['from', 'to']);
    for (const end of ends) {
      assert.ok(end.title, `the end is named, not only its id: ${JSON.stringify(end)}`);
      assert.ok(end.id, 'and the id the field holds is still there');
      assert.match(end.status, /^(active|retracted)$/, end.status);
      assert.ok(end.summary.length > 10, `what the end says: ${end.summary}`);
    }
  });
});

// The other half of A16: the editor is generic over FIELDS, so the three
// fields arrive here with the form's — and the point of them arriving is that
// a reviewer can now change one, which until this run was a key the editor
// carried across without being able to see it (deviation 343).
test('a reviewer can set an event\'s category, and the diff says so', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // Named, because the head of the queue is whichever record is oldest and
    // need not be an event; this one is a draft the elections import wrote.
    await open(page, url('review.html?open=1908-portuguese-legislative-election'), QUEUE_READY);
    await waitFor(page, 'return document.querySelector(".editor-mount .field-category select") !== null;', 'the editor');
    const drawn = await page.eval(`const root = document.querySelector('.editor-mount');
      const row = root.querySelector('.field.list .citation-row');
      const role = row ? row.querySelector('input[aria-label$="text"]') : null;
      return {
        kind: root.querySelector('.editor').className,
        parentIsPicker: Boolean(root.querySelector('.field-parent .picker')),
        scope: [...root.querySelectorAll('.field-scope option')].map((o) => o.value),
        category: root.querySelector('.field-category select').value,
        blank: root.querySelector('.field-category option').textContent,
        roleSuggestions: role && role.list ? role.list.options.length : 0,
      };`);
    assert.match(drawn.kind, /\bevent\b/, 'the queue opens on an event');
    assert.ok(drawn.parentIsPicker, 'Part of is a picker over the events');
    assert.deepEqual(drawn.scope, ['', 'regional', 'worldwide']);
    assert.equal(drawn.category, '', 'no record in data/ carries a category yet');
    assert.equal(drawn.blank, '— not said —');
    assert.ok(drawn.roleSuggestions > 0, 'the roles are offered on the actor rows');

    await page.eval(`const select = document.querySelector('.editor-mount .field-category select');
      select.value = 'revolution';
      select.dispatchEvent(new Event('input', { bubbles: true }));
      return true;`);
    await waitFor(page, 'return document.querySelector(".record-diff").hidden === false;', 'the diff');
    const diff = await page.eval(`return {
      fields: [...document.querySelectorAll('.record-diff .diff-field')].map((el) => el.textContent),
      after: [...document.querySelectorAll('.record-diff .diff-after')].map((el) => el.textContent),
    };`);
    assert.ok(diff.fields.some((t) => t.includes('category')), diff.fields.join(' | '));
    assert.ok(diff.after.some((t) => t.includes('revolution')), diff.after.join(' | '));
  });
});
