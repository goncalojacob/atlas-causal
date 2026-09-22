// M70's standing marker in a real browser: the line on the card and the count
// in the masthead, and the two saying the same thing about the same records.
//
// `tests/m70.test.mjs` holds the predicate, the sentence and the arithmetic
// without a DOM, and it is where the structural half of the removal lives.
// What needs a browser is that the line is actually on the card a reader
// opens, that it says *unread* where nobody has read the record, that the
// masthead says how much of the picture has been read, and — the one thing
// this milestone must not break — that an unread record is drawn exactly as a
// signed one would be.
//
// On the fixtures, where — like the repository — **nobody has signed
// anything**: every card says *unread* and the masthead says nought of the
// picture has been read, which is the true answer and the one a reader
// deserves. The signed case is `tests/m70.test.mjs`, which adds a signature in
// memory rather than writing one into a synthetic record that four migration
// tools would then rightly refuse to touch.
//
// Written before the behaviour it judges (deviations 711 and 717). **No test
// here pins a count**: the numbers are read off the page and compared with
// each other, never with a constant.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBrowser, open, waitFor, seenIntro, watchErrors, errorsOn, skip } from './browser.mjs';

// The card's line, once the record's own file has landed. Empty until then:
// the card is built from a core row, which carries no signature.
const STANDING = `
  const el = document.querySelector('.panel .standing');
  return el === null ? null : { text: el.textContent.trim(), classes: el.getAttribute('class') };`;
const FILLED = `
  const el = document.querySelector('.panel .standing');
  return Boolean(el) && el.textContent.trim() !== '';`;

// The masthead's, which is there from the first frame because the core is.
const MASTHEAD = `
  const el = document.querySelector('#window-control .window-read');
  return el === null ? null : el.textContent.trim();`;

const MARKS = 'return document.querySelectorAll(".map .mark").length;';

test('a card says in one line that nobody has read the record', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);

    // The card is built before the record's own file arrives — the core row it
    // is drawn from carries no signature — so the slot is there and empty, and
    // the line is written when the file lands. A card that said "unread" while
    // it was still loading would be making a claim it had not checked.
    await open(page, url('?review=1&fixtures=1&from=1100&to=2100&selected=fixture-event-a'));
    const empty = await page.eval(STANDING);
    assert.ok(empty !== null, 'the slot is in the head from the first frame');
    await waitFor(page, FILLED, "the record's own file");

    const standing = await page.eval(STANDING);
    assert.match(standing.text, /[Uu]nread/, 'and says so in a word a reader knows');
    assert.match(standing.classes, /\bunread\b/);
    assert.doesNotMatch(standing.text, /Read by/, 'naming nobody, because nobody has read it');

    // A second record, one click away: the line is about the record and not
    // about the page.
    await open(page, url('?review=1&fixtures=1&from=1100&to=2100&selected=fixture-event-b'));
    await waitFor(page, FILLED, "the second record's own file");
    assert.match((await page.eval(STANDING)).text, /[Uu]nread/);

    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

// One source, seen from the outside: the masthead's count and the cards agree
// about the same corpus. Asserted by reading the number out of the bar and
// checking it against the records the page itself is drawing, never against a
// constant — a fixture signed tomorrow moves both.
test('the masthead says how much of the picture has been read', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?review=1&fixtures=1&from=1100&to=2100'), MARKS);
    await waitFor(page, `
      const el = document.querySelector('#window-control .window-read');
      return Boolean(el) && el.textContent.trim() !== '';`, 'the standing line in the masthead');

    const text = await page.eval(MASTHEAD);
    const [, read, of] = /^(\d+) of (\d+) read$/.exec(text) ?? [];
    assert.ok(read !== undefined, `the masthead says "N of N read", not ${JSON.stringify(text)}`);
    assert.ok(Number(of) > 0, 'over a picture that has events in it');
    assert.ok(Number(read) <= Number(of), 'and never more read than there are');
    // The count the bar shows and the count the picture supports are the same
    // question: nothing on these fixtures is signed, so the honest answer is
    // nought — asserted against the records the page is drawing, not against
    // the number nought, so a fixture signed tomorrow moves both.
    const drawn = await page.eval(`
      return [...document.querySelectorAll('.map .mark')].map((el) => el.getAttribute('data-id'));`);
    assert.ok(drawn.length > 0, 'the map has marks on it');
    assert.equal(Number(read), 0, 'nobody has signed a fixture, and the bar says so');
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});

// The line this milestone must never cross. The marker is honesty on the
// surface; a filter is what it would be if the picture changed with it.
test('an unread record is still drawn, marker or no marker', { skip }, async () => {
  await withBrowser(async (page, url) => {
    await watchErrors(page);
    await seenIntro(page);
    await open(page, url('?fixtures=1&from=1100&to=2100'), MARKS);
    const drawn = await page.eval(MARKS);
    assert.ok(drawn > 1, 'the map has marks on it');
    // `fixture-event-b` is one nobody has read, and it is one of them: the
    // mark is on the page and the card opens from it.
    assert.equal(
      await page.eval('return Boolean(document.querySelector(\'.map .mark[data-id="fixture-event-b"]\'));'),
      true,
      'an unread record has a mark of its own',
    );
    assert.deepEqual(await errorsOn(page), [], 'the console is clean');
  });
});
