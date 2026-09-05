// The contributor's path, in a real browser: "Edit this record" on a card,
// and the reference picker under a corpus the size the atlas is built for.
//
// Both need a browser and neither can be faked. The prefill is a card, a
// navigation and a form that has to come up with the record's own fields in
// it; the picker's cost is a keystroke on the thread that draws, which is
// exactly what a Node benchmark cannot measure.
//
// The driven browser is tests/browser.mjs; it says why it is built by hand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, skip } from './browser.mjs';

const FORM_READY = 'return document.querySelectorAll(".add-row button").length > 0;';

test('"Edit this record" on a card opens the form on that record', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('index.html?selected=carnation-revolution-1974'));
    const href = await page.eval('return document.querySelector(".panel .discuss .edit-record")?.getAttribute("href") ?? null;');
    assert.equal(href, 'contribute.html?correction=1&edit=event%2Fcarnation-revolution-1974');

    await open(page, url(href), FORM_READY);
    const form = await page.eval(`const card = document.querySelector("section.entry.event");
      const field = (key) => card.querySelector(".field-" + key + " input, .field-" + key + " textarea");
      return {
        entries: document.querySelectorAll("section.entry").length,
        id: field("id").value,
        title: field("title").value,
        start: field("start").value,
        summaryLength: field("summary").value.length,
        place: (card.querySelector(".field-place .picker-chosen") || {}).textContent || "",
        cited: [...document.querySelectorAll(".citations .picker-chosen")].map((p) => p.textContent),
      };`);
    // One entry, and it is the record: a blank form opens on a source and an
    // event, this one opens on what the card was showing.
    assert.equal(form.entries, 1);
    assert.equal(form.id, 'carnation-revolution-1974');
    assert.equal(form.title, '25 April');
    assert.equal(form.start, '1974');
    assert.ok(form.summaryLength > 40, 'the summary came with it');
    assert.match(form.place, /lisbon/, `the place picker opened on the record's place, not empty: ${form.place}`);
    assert.ok(form.cited.length > 0, 'and the sources it rests on');
    assert.ok(form.cited.every((t) => t.includes(' · ')), `each citation names its source: ${form.cited.join(' | ')}`);

    // The bundle it would file is the record under its own id, which is what
    // the correction template accepts.
    const filed = await page.eval('return JSON.parse(document.querySelector(".preview").textContent || "{}");');
    assert.equal(filed.records.length, 1);
    assert.equal(filed.records[0].id, 'carnation-revolution-1974');
    assert.equal(filed.records[0].kind, 'event');
  });
});

// The threshold the brief names: three letters typed into a picker over
// twenty thousand events, under 100 ms per keystroke, and the record chosen
// with the keyboard. The corpus is synthetic and generated in the page — no
// fixture on disk is this size, and what is being measured is the scan and
// the drawing, not a fetch.
test('the picker answers a keystroke among 20 000 records in under 100 ms', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('contribute.html?fixtures=1'), FORM_READY);
    // An async body inside the page: the module is imported there, so what
    // is timed is the real picker on the real thread.
    const measured = await page.eval(`return (async () => {
      const { pickerIndex, createPicker } = await import("/src/contribute/picker.js");
      const events = [];
      for (let i = 0; i < 20000; i += 1) {
        events.push({
          id: "bench-event-" + String(i).padStart(5, "0"),
          kind: "event",
          status: "active",
          title: "Bench event " + i + " at Porto",
          place: "bench-place-" + (i % 500),
          when: { start: 1400 + (i % 400), end: 1400 + (i % 400) },
        });
      }
      const places = [];
      for (let i = 0; i < 500; i += 1) places.push({ id: "bench-place-" + i, name: "Bench place " + i, names: ["Bench place " + i], status: "active" });
      const edges = [];
      for (let i = 1; i < 20000; i += 1) {
        edges.push({
          id: events[i - 1].id + "--" + events[i].id + "--caused",
          kind: "edge", status: "active", type: "caused", from: events[i - 1].id, to: events[i].id,
        });
      }
      const index = pickerIndex({ topology: { events, edges, places, actors: [], sources: [] } });
      let chosen = null;
      const picker = createPicker({ name: "events", index, label: "Event", onChange: (id) => { chosen = id; } });
      document.body.appendChild(picker.root);

      // The first search pays for the index the others reuse, and it is a
      // keystroke like any other: it is measured with them.
      const took = [];
      for (const text of ["b", "be", "ben"]) {
        const started = performance.now();
        picker.search(text);
        took.push(performance.now() - started);
      }
      const rows = [...picker.root.querySelectorAll(".picker-option")];
      // Down twice and Enter: the second row, chosen without a mouse.
      const key = (k) => picker.input.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
      key("ArrowDown");
      key("Enter");
      return {
        took,
        offered: rows.length,
        first: rows[0] ? [...rows[0].children].map((el) => el.className + ":" + el.textContent) : [],
        chosen,
        shown: picker.input.value,
        under: picker.root.querySelector(".picker-chosen").textContent,
        links: picker.root.querySelectorAll(".picker-links li").length,
      };
    })();`);

    assert.equal(measured.offered, 8, 'eight rows, however many matched');
    // The kind, the years, the place and the degree, beside the name: what
    // tells two records of one name apart (health review B, finding 6).
    assert.deepEqual(measured.first, [
      'picker-label:Bench event 0 at Porto',
      'kind:event',
      'when:1400',
      'muted:Bench place 0',
      'degree:1 link',
    ]);
    assert.equal(measured.chosen, 'bench-event-00001', 'the arrow keys and Enter chose the second row');
    assert.match(measured.under, /^Bench event 1 at Porto · bench-event-00001$/);
    assert.equal(measured.links, 2, 'and what it already connects to: one link in, one out');

    for (const took of measured.took) {
      assert.ok(took < 100, `a keystroke over 20 000 events took ${took.toFixed(1)} ms: ${measured.took.map((t) => t.toFixed(1)).join(', ')}`);
    }
    console.log(`      picker at 20k: ${measured.took.map((t) => `${t.toFixed(1)} ms`).join(', ')}`);
  });
});

// The duplicate search, on the page and over every kind: a place typed under
// a name the atlas already has one of has to be caught before it is filed,
// which before H6a it was not — the search covered events alone.
test('a second place under a name the atlas already has is caught in the form', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('contribute.html'), FORM_READY);
    await page.eval(`const add = [...document.querySelectorAll(".add-row button")].find((b) => b.textContent === "Add place");
      add.click();
      const names = document.querySelector("section.entry.place .field-names input");
      names.value = "Lisboa";
      names.dispatchEvent(new Event("input", { bubbles: true }));
      return true;`);
    await waitFor(page, 'return document.querySelectorAll("section.entry.place .similar li").length > 0;', 'the near-match');
    const said = await page.eval('return [...document.querySelectorAll("section.entry.place .similar li")].map((li) => li.textContent.replace(/\\s+/g, " ").trim());');
    assert.ok(said.some((t) => /lisbon/i.test(t)), said.join(' · '));
    // And the acknowledgement is the place's, not the event's.
    const label = await page.eval('return document.querySelector("section.entry.place .acknowledge").textContent;');
    assert.match(label, /different place/);
  });
});

// The other end of the pipeline: the address a pull request body carries, so
// that a maintainer reading a stranger's diff has one link to the page the
// review actually happens on rather than a queue to find the record in
// (health review A, finding 30).
test('?open= opens the record the pull request names, not the first in the queue', { skip }, async () => {
  await withBrowser(async (page, url) => {
    const wanted = '1911-portuguese-constituent-national-assembly-election';
    await open(page, url(`review.html?open=${wanted}`), 'return document.querySelectorAll(".editor").length > 0;');
    assert.deepEqual(await page.eval(`return {
      id: document.querySelector(".record-id").textContent,
      title: document.querySelector(".editor .field-title input").value,
      current: document.querySelector(".queue-item.current .queue-id")?.textContent ?? null,
    };`), {
      id: `event · ${wanted}`,
      title: '1911 Constituent Assembly election',
      current: wanted,
    });

    // An id that names nothing says so, and opens the queue's own first
    // record rather than pretending the address was right.
    await open(page, url('review.html?open=no-such-record-anywhere'), 'return document.querySelectorAll(".editor").length > 0;');
    assert.match(await page.eval('return document.querySelector(".save-note")?.textContent ?? "";'), /no-such-record-anywhere/);
  });
});
