// The search box in a real browser: what choosing a result does to the band.
//
// It has to be driven rather than dumped, because the defect is in the second
// state change — the box is typed into, a result is chosen, and only then does
// the URL say whether the window moved. The driven browser itself is
// tests/browser.mjs; the reasons it is built by hand are there.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, skip } from './browser.mjs';

// Type into the box the way a reader does — the module listens for `input` —
// and wait for the list to be drawn.
const type = (text) => `const box = document.getElementById("search-input");
  box.value = ${JSON.stringify(text)};
  box.dispatchEvent(new Event("input"));
  return true;`;

// mousedown and not click: the box chooses on mousedown, because the blur a
// click fires first closes the list out from under it.
const choose = (id) => `const option = document.querySelector('[role="option"][data-id="${id}"]');
  if (!option) return false;
  option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  return true;`;

const params = 'return Object.fromEntries(new URLSearchParams(location.search));';

test('choosing an event the window already holds leaves the band alone', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url('?from=1950&to=2000&selected=republic-proclaimed-1910'));

    await page.eval(type('25 April'));
    await waitFor(page, `return Boolean(document.querySelector('[role="option"][data-id="carnation-revolution-1974"]'));`,
      'the search list to offer 25 April');
    assert.equal(await page.eval(choose('carnation-revolution-1974')), true);

    // 1974 is inside 1950–2000, so the only thing that changed is what is
    // open. Before H1a the band came back as 1950–1974 and the nine
    // consequences the reader was about to follow were drawn faded.
    assert.deepEqual(await page.eval(params), {
      from: '1950', to: '2000', selected: 'carnation-revolution-1974',
    });
    assert.equal(
      await page.eval('return document.querySelector(".panel .event-head h2")?.textContent ?? null;'),
      '25 April',
      'the record really was opened',
    );
  });
});

test('choosing an event outside the window still widens it to include the event', { skip }, async () => {
  await withBrowser(async (page, url) => {
    // Nothing is open, so the panel's first card is not what says the atlas
    // arrived: the search box is built from the topology and is.
    await open(page, url('?from=1950&to=2000'),
      'return document.querySelectorAll("#search-input").length > 0 && Boolean(document.querySelector(".timeline-area svg"));');

    await page.eval(type('Lisbon Regicide'));
    await waitFor(page, `return Boolean(document.querySelector('[role="option"][data-id="lisbon-regicide"]'));`,
      'the search list to offer the Regicide');
    assert.equal(await page.eval(choose('lisbon-regicide')), true);

    // 1908 is before the band, so the far end goes to it and the near end
    // comes with it — "map at Y", unchanged.
    assert.deepEqual(await page.eval(params), {
      from: '1908', to: '1908', selected: 'lisbon-regicide',
    });
  });
});

// --- one scan for a burst of typing ----------------------------------------
//
// The scan ran on every keystroke, over every entry in the index, on the
// thread that draws (health review A, finding 19). It is fast now — the box
// holds the best eight per kind rather than sorting the whole match — and it
// also waits out a moment's grace, so a reader typing a word is answered once
// and not once per letter. Both together are what keeps the box responsive at
// twenty thousand records.
test('typing a word in a burst draws the list once, and Enter does not wait', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await open(page, url(''), 'return document.querySelectorAll("#search-input").length > 0;');
    await page.eval(`
      window.__draws = 0;
      new MutationObserver(() => { window.__draws += 1; })
        .observe(document.querySelector('#search [data-slot="results"]'), { childList: true });
      return true;`);

    // Six keystrokes, as fast as the event loop will carry them.
    await page.eval(`const box = document.getElementById("search-input");
      for (const text of ["a", "ab", "abr", "abri", "abril", "25 abril"]) {
        box.value = text;
        box.dispatchEvent(new Event("input"));
      }
      return true;`);
    await waitFor(page, 'return window.__draws > 0;', 'the list to be drawn');
    await new Promise((resolve) => { setTimeout(resolve, 400); });
    const draws = await page.eval('return window.__draws;');
    assert.ok(draws <= 2, `six keystrokes drew the list ${draws} time(s)`);

    // And what it settled on is the answer to the last of them, not to one
    // of the letters on the way.
    const shown = await page.eval('return document.getElementById("search-input").value;');
    assert.equal(shown, '25 abril');

    // Enter inside the grace still chooses: the scan the reader is waiting on
    // runs at once rather than leaving them pressing Enter on an empty list.
    await page.eval(`const box = document.getElementById("search-input");
      box.value = "25 April";
      box.dispatchEvent(new Event("input"));
      box.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
      return true;`);
    await waitFor(
      page,
      'return new URLSearchParams(location.search).get("selected") === "carnation-revolution-1974";',
      'Enter to have chosen 25 April without waiting the grace out',
    );
  });
});
