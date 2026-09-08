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
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { withBrowser, open, waitFor, skip } from './browser.mjs';
import { ROOT } from './helpers.mjs';

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

// I1 and index2 review finding 2. The dashboard runs the browser's half of
// the validator against the whole universe, and the presences are part of it:
// rule 17 and `actor-unused` read them (rules.js). They left the spine, so
// the page draws its queue first and fetches them beside it, then rebuilds
// the universe every editor opened after that is validated against.
// What the missing list would cost is
// `tests/presence-rules.test.mjs`, over the same rules.
test('review.html draws its queue and fetches the presences beside it', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('review.html'), QUEUE_READY);
    await waitFor(page, 'return performance.getEntriesByType("resource").some((e) => /\\/index\\/presences-/.test(e.name));', 'the presence file');
    // Asked for once, and after the core the page draws its queue out of.
    const timing = await page.eval(`return performance.getEntriesByType("resource")
      .filter((e) => /\\/index\\/(core|presences)-/.test(e.name))
      .map((e) => ({ what: e.name.includes("/index/core-") ? "core" : "presences", at: e.startTime }));`);
    assert.equal(timing.filter((e) => e.what === 'presences').length, 1, JSON.stringify(timing));
    const core = timing.find((e) => e.what === 'core');
    const presences = timing.find((e) => e.what === 'presences');
    assert.ok(presences.at >= core.at, JSON.stringify(timing));
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
      const role = row ? row.querySelector('select[aria-label$="text"]') : null;
      return {
        kind: root.querySelector('.editor').className,
        parentIsPicker: Boolean(root.querySelector('.field-parent .picker')),
        scope: [...root.querySelectorAll('.field-scope option')].map((o) => o.value),
        category: root.querySelector('.field-category select').value,
        blank: root.querySelector('.field-category option').textContent,
        roleOptions: role ? [...role.options].map((o) => o.value) : null,
        roleBlank: role ? role.options[0].textContent : null,
        roleTitle: role ? role.options[1].getAttribute('title') : null,
        roleIsFreeText: Boolean(row && row.querySelector('input[aria-label$="text"]')),
        noteBox: row ? Boolean([...row.querySelectorAll('input[aria-label]')].find((i) => /note$/i.test(i.getAttribute('aria-label')))) : false,
        // A citation's locator and a narrative step's text are free text and
        // stay free text: the closed list is the actor list's alone.
        freeTextColumns: [...root.querySelectorAll('.field.list input[aria-label$="text"], .field.list textarea[aria-label$="text"]')].map((i) => i.getAttribute('aria-label')),
      };`);
    assert.match(drawn.kind, /\bevent\b/, 'the queue opens on an event');
    assert.ok(drawn.parentIsPicker, 'Part of is a picker over the events');
    assert.deepEqual(drawn.scope, ['', 'regional', 'worldwide']);
    // M32b-2 gave every imported event the category its Wikidata class
    // carries, so the select opens on what the record says rather than on
    // nothing — which is the stronger assertion, and the one the field was
    // always for: the editor reads a category as well as writing one.
    const opened = JSON.parse(await readFile(
      path.join(ROOT, 'data', 'events', '1908-portuguese-legislative-election.json'), 'utf8'));
    assert.equal(opened.category, 'election', 'the record the queue opens on');
    assert.equal(drawn.category, opened.category, 'the select shows the record\'s own category');
    assert.equal(drawn.blank, '— not said —');
    // M32b-1: the role is a closed list, since a role outside
    // `data/roles.json` is rule 25 and the dashboard must not offer what the
    // validator would refuse. The note beside it is where free text went.
    const roles = JSON.parse(await readFile(path.join(ROOT, 'data', 'roles.json'), 'utf8'));
    assert.deepEqual(drawn.roleOptions, ['', ...roles.map((r) => r.id)]);
    assert.equal(drawn.roleBlank, '— no role —');
    assert.equal(drawn.roleTitle, roles[0].description, 'what the role covers, from data/');
    assert.equal(drawn.roleIsFreeText, false, 'a role cannot be typed here either');
    assert.ok(drawn.noteBox, 'the note beside the role');
    assert.ok(drawn.freeTextColumns.length > 0, 'a citation locator is still free text');
    assert.ok(drawn.freeTextColumns.every((label) => !/^Actors/.test(label)), drawn.freeTextColumns.join(' | '));

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


// I4b, A2: the dashboard is a whole-universe reader. It draws its queue out of
// the review shards and the record out of the core, and fetches every attribute
// shard behind that — so until the last one is in, the editor says it is still
// loading the corpus rather than reporting on half of it, and a save hangs on a
// verdict nobody has given.
//
// What pins that the shards really were folded in is rule 21, which asks
// whether a `wikidata` id is unique **across the atlas**: `wikidata` is in no
// core row, so an editor reporting from the core alone would let a second
// record take an item another one already has — which is the one mistake
// nothing downstream can undo (index2 review, finding 2).
test('the editor waits for the corpus and then warns what the CLI warns', { skip }, async () => {
  // The other record's item, read off the repository rather than typed in
  // here: what is asserted is that the browser finds the collision the CLI
  // finds, so the CLI's own answer is where the number comes from.
  const other = JSON.parse(await readFile(path.join(ROOT, 'data', 'events', '1890-portuguese-legislative-election.json'), 'utf8'));
  assert.ok(other.wikidata, 'the record this test collides with carries a Wikidata item');

  await withBrowser(async (page, url) => {
    await open(page, url('review.html?open=1908-portuguese-legislative-election'), QUEUE_READY);
    await waitFor(page, 'return document.querySelectorAll(".editor .field-wikidata input").length > 0;', 'the record open');
    // Either the corpus is already in, or the editor is saying so and nothing
    // can be saved on it. Asserted this way round because the alternative is a
    // race with the network, which is never what a test should be about.
    const early = await page.eval(`return {
      loading: !document.querySelector('.editor .corpus-loading').hidden,
      text: document.querySelector('.editor .corpus-loading').textContent,
      save: (document.querySelector('.record-actions button, button.save') || {}).disabled,
    };`);
    if (early.loading) {
      assert.match(early.text, /still loading the corpus/);
      assert.equal(early.save, true, 'nothing is saved on a verdict nobody gave');
    }

    await waitFor(page, 'return document.querySelector(".editor .corpus-loading").hidden;', 'the corpus');
    await page.eval(`const box = document.querySelector('.editor .field-wikidata input');
      box.value = ${JSON.stringify(other.wikidata)};
      box.dispatchEvent(new Event('input', { bubbles: true }));
      return true;`);
    await waitFor(page, 'return document.querySelectorAll(".editor .field-wikidata .field-error:not([hidden]), .editor .entry-errors li").length > 0;', 'rule 21');
    const said = await page.eval(`return [...document.querySelectorAll('.editor .field-wikidata .field-error, .editor .entry-errors li')]
      .map((e) => e.textContent).join(' ');`);
    assert.match(said, /already the Wikidata item of the event 1890-portuguese-legislative-election/);
  });
});
