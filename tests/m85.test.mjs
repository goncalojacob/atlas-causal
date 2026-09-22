// M85, the first review's remainder: the first picture is the whole span, the
// controls speak the reader's language, the public pages are one screen and a
// bibliography a reader can place, and two structural clean-ups.
//
// What a browser has to answer — that the first paint really does draw events
// from more than one century on each of the three views — is in
// `tests/m85-browser.test.mjs`. What is here needs no DOM.
//
// Written before the behaviour it judges (deviations 711 and 717). **Nothing
// here pins a count or a pixel**: every expectation about the corpus is
// derived from the corpus the test is run on, which is 22 September's lesson —
// M83's merged-lines test was true at 581 events and false at 668.

import { test } from 'node:test';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

import { defaultState, DEGREE_CHOICES, DEGREE_DEFAULT } from '../src/state.js';
import { resolveWindow, centuryOf } from '../src/util/window.js';
import { extent } from '../src/util/dates.js';
import { workingSet } from '../src/emphasis.js';
import { stackTitle, stackBadge } from '../src/cluster.js';
import { degreeLabel } from '../src/graph-filters.js';
import { explainedLinks, linksSentence, introHtml } from '../src/intro.js';
import { esc } from '../src/util/esc.js';
import { bordersNote } from '../src/map/layers/presences.js';
import { degreeOf } from '../src/graph-view/arrangement.js';
import { atlasOf, FIXTURE_DATA, ROOT } from './helpers.mjs';

const atlas = await atlasOf(path.join(ROOT, 'data'));
const fixtures = await atlasOf(FIXTURE_DATA);
const CORPORA = [['data/', atlas], ['the fixtures', fixtures]];
const read = (file) => fs.readFile(path.join(ROOT, file), 'utf8');

// ─── 1. the first picture is the whole span (A4) ───────────────────────────
//
// `opensOn()` opened a crowded corpus on its densest century, so the resting
// map was 1900–1999: nothing of 1492–1899, and the first screen of an atlas
// about the world since 1492 said "Portugal in the 20th century". M65 is what
// makes the whole span cheap — at rest a view draws the main events alone.

test('at rest the window is the corpus’s own extent, and no century is chosen for the reader', () => {
  for (const [name, each] of CORPORA) {
    assert.ok(each.extent, `${name} has an extent`);
    assert.deepEqual(resolveWindow(defaultState(), each.extent),
      { from: each.extent.min, to: each.extent.max },
      `${name}: the resting window is the whole of the data`);
    assert.equal(each.opens, undefined,
      `${name}: nothing computes an opening window for the reader`);
  }
});

test('and the resting picture really does cross more than one century', () => {
  for (const [name, each] of CORPORA) {
    const centuries = new Set();
    for (const id of workingSet(each, defaultState()).shown) {
      const event = each.events.get(id);
      if (event) centuries.add(centuryOf(extent(event.when).min));
    }
    assert.ok(centuries.size > 1,
      `${name}: the main events at rest fall in ${centuries.size} century/centuries`);
  }
});

test('a stack says how many events it hides, in the words its own title uses', () => {
  assert.match(stackTitle('Carnation Revolution', 47), /— and 46 more events here$/);
  assert.match(stackTitle('One thing', 2), /— and 1 more event here$/, 'and in the singular');
  // A stack the graph draws adds the years it covers; the words are the same.
  assert.match(stackTitle('A thing', 3, { span: '1910–1911' }), /2 more events here, 1910–1911$/);

  // The badge beside the mark: the same count, in the same words, and never a
  // bare "+46", which a reader of the first screen reads as a typo (A4).
  for (const count of [2, 3, 47]) {
    const badge = stackBadge(count);
    assert.doesNotMatch(badge, /^\+\d+$/, `"${badge}" is a bare count behind a plus`);
    assert.match(badge, new RegExp(`^${count - 1} more$`), 'and it says how many are hidden');
    assert.ok(stackTitle('x', count).includes(badge), 'in the title’s own words');
  }
});

// ─── 2. the graph's control speaks the reader's language (A12) ─────────────
//
// "draws [two links or more ▾]" — and a reader does not know what "two links"
// filters (review A, finding 12). The control is kept rather than dropped
// because the floor is measurably live: the measurement is below, derived from
// the corpus, and `STATUS.md` carries the numbers of the day.

test('the degree floor still changes the picture, so the control stays', () => {
  const shown = workingSet(atlas, defaultState()).shown;
  const kept = (floor) => [...shown].filter((id) => degreeOf(atlas, id) >= floor).length;
  assert.equal(kept(DEGREE_DEFAULT), shown.size,
    'at its default it takes nothing away, which is M82’s own rule');
  const highest = Math.max(...DEGREE_CHOICES);
  assert.ok(kept(highest) < shown.size,
    `the floor removes ${shown.size - kept(highest)} of ${shown.size} at ${highest}`);
});

test('and it says what it does, in words that are not the builder’s', () => {
  for (const n of DEGREE_CHOICES) {
    const label = degreeLabel(n);
    assert.doesNotMatch(label, /links or more/, `"${label}" is the builder’s phrasing`);
    assert.match(label, /^Show /, 'each option is a whole sentence about the picture');
    if (n > 0) assert.match(label, new RegExp(`at least ${n} connections?$`));
  }
});

// ─── 3. the intro's claim is computed (A14) ────────────────────────────────
//
// "Every link carries a written explanation and its sources" was prose on the
// front page asserting a fact about the data. It is counted at build time now
// (`validate/core.js`, `linkCounts`) and carried in the manifest, because the
// browser cannot see an edge's argument — it is in an explanation shard — or
// its sources, which are in no index file at all.

test('the intro counts the links it makes a claim about, and never guesses', () => {
  for (const [name, each] of CORPORA) {
    const counted = explainedLinks(each);
    assert.ok(counted, `${name}: the manifest carries the count`);
    assert.equal(counted.total,
      [...each.edges.values()].filter((e) => e.status === 'active').length,
      `${name}: the denominator is every active link`);
    assert.ok(counted.explained <= counted.total);

    const html = introHtml(each);
    assert.ok(html.includes(esc(linksSentence(counted))), `${name}: the card says what was counted`);
    if (counted.explained === counted.total) {
      assert.match(html, /Every link carries a written explanation and its sources\./);
    } else {
      assert.ok(html.includes(esc(`${counted.explained} of the ${counted.total} links carry`)),
        `${name}: where it is not every one, the card says which`);
      assert.doesNotMatch(html, /Every link carries/);
    }
  }
});

test('and an atlas that has not been told says nothing rather than zero', () => {
  // The core carries an edge's five slots and nothing of its argument, so an
  // atlas with neither a manifest count nor the records in hand cannot answer.
  // "0 of the 658" would be the front page reporting its own ignorance as a
  // fact about the data.
  const blind = { edges: new Map([['e', { id: 'e', status: 'active' }]]), manifest: {} };
  assert.equal(explainedLinks(blind), null);
  assert.equal(linksSentence(null), '');
});

// ─── 4. two labels (A15) ───────────────────────────────────────────────────

test('the borders line is the map’s, and it says the year the layer draws', () => {
  const coverage = atlas.presenceCoverage;
  assert.ok(coverage, 'the atlas has territories to say something about');
  // Inside the coverage, and past each end of it: the three sentences, with
  // the years read off the corpus rather than written here.
  const inside = Math.round((coverage.from + coverage.to) / 2);
  assert.match(bordersNote(atlas, inside), /^borders as of /);
  assert.match(bordersNote(atlas, coverage.to + 1), /the latest the source covers$/);
  assert.match(bordersNote(atlas, coverage.from - 1), /^no borders before /);
  // And nothing to say where there are no territories at all.
  assert.equal(bordersNote({ presenceCoverage: null, territoryYear: (y) => y }, inside), null);
  assert.equal(bordersNote(atlas, null), null);
});

test('and the timeline, which draws no borders, no longer writes one', async () => {
  const timeline = await read('src/timeline.js');
  assert.ok(!timeline.includes('borders as of'),
    'the timeline says nothing about borders it does not draw');
  const map = await read('src/map/map.js');
  assert.match(map, /bordersNote/, 'the line is printed beside the picture it is about');
});

test('the export button says what the file is', async () => {
  const share = await read('src/share.js');
  assert.match(share, /textContent = 'Export as SVG'/, 'the button names the file');
  assert.match(share, /button\.title = 'The picture on screen, as an SVG file'/, 'and its title stays');
});

// ─── 5. the about page is one screen (A16) ─────────────────────────────────
//
// `about.html` was 40,000 characters of design essay that opened on
// "thirty-seven of the records in the current test dataset happened in
// Lisbon" and read as a design document rather than as an about page (review
// A, finding 16). The bound below is the one this run states in `STATUS.md`:
// eight thousand characters is about a screen of prose at this type size, and
// what was there was six times that.

export const ABOUT_BOUND = 8000;

test('about.html is one screen, and the essay is kept whole beside it', async () => {
  const about = await read('about.html');
  const essay = await read('essay.html');
  assert.ok(about.length < ABOUT_BOUND,
    `about.html is ${about.length} characters; the bound is ${ABOUT_BOUND}`);
  // "Kept whole" is a comparison and not a number: the essay is still the
  // essay, which is what "linked below it" has to mean.
  assert.ok(essay.length > about.length * 4,
    `the essay is ${essay.length} characters against the about page's ${about.length}`);
  assert.match(about, /href="essay\.html"/, 'the about page links to the essay at its foot');
  assert.match(essay, /href="about\.html"/, 'and the essay links back');
  // Nothing about history is written on either: the one-screen page says what
  // the repository already says of itself, in the words it already uses.
  assert.ok(about.includes('The history of the world since 1492 as a graph'),
    'the lead is the sentence the masthead and the intro card already carry');
});

test('and the essay still holds the page it was, section for section', async () => {
  const about = await read('about.html');
  const essay = await read('essay.html');
  // The headings the about page keeps are a handful; the essay keeps those and
  // every other one it had. Asked as a comparison between the two files, so
  // neither a count nor a list of titles is written here.
  const headings = (html) => [...html.matchAll(/<h[23]>([^<]+)<\/h[23]>/g)].map((m) => m[1]);
  const inEssay = new Set(headings(essay));
  assert.ok(inEssay.size > headings(about).length,
    `the essay carries ${inEssay.size} sections against the about page's ${headings(about).length}`);
  for (const name of ['The five edge types', 'What the colours mean, and what they do not']) {
    assert.ok(inEssay.has(name), `the essay still explains "${name}"`);
  }
});
