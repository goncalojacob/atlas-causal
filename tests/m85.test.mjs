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

import { defaultState, DEGREE_CHOICES, DEGREE_DEFAULT, LAYERS } from '../src/state.js';
import { resolveWindow, centuryOf, WHEEL_FACTOR, zoomWindow } from '../src/util/window.js';
import { extent } from '../src/util/dates.js';
import { workingSet } from '../src/emphasis.js';
import { convergence } from '../src/graph.js';
import { stackTitle, stackBadge } from '../src/cluster.js';
import { degreeLabel } from '../src/graph-filters.js';
import { legendRows } from '../src/layer-control.js';
import { WINDOW_CONTROL_HTML } from '../src/window-control.js';
import { explainedLinks, linksSentence, introHtml } from '../src/intro.js';
import { esc } from '../src/util/esc.js';
import { bordersNote } from '../src/map/layers/presences.js';
import {
  bibliographyHtml, isBaseMapSource, BASE_MAP_HEADING, WORKS_HEADING,
} from '../src/sources/bibliography.js';
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

// ─── 6. the bibliography groups the base maps (A17) ────────────────────────

test('the bibliography counts the works apart from the base maps', () => {
  const sources = [...atlas.sources.values()];
  const html = bibliographyHtml(sources);
  assert.ok(html.includes(`<h3>${WORKS_HEADING}</h3>`), 'the works have a heading');
  assert.ok(html.includes(`<h3>${BASE_MAP_HEADING}</h3>`), 'and the base maps one of their own');

  const maps = sources.filter(isBaseMapSource);
  const works = sources.filter((source) => !isBaseMapSource(source));
  assert.ok(maps.length > 0, 'the atlas draws its borders from somebody');
  // The two add up to the whole, which is the only arithmetic here: what
  // either group *is* belongs to the corpus and moves with the next import.
  assert.equal(maps.length + works.length, sources.length);
  const citations = (list) => list.reduce((n, source) => n + (source.citationCount ?? 0), 0);
  assert.equal(citations(maps) + citations(works), citations(sources));
  for (const list of [maps, works]) {
    assert.ok(html.includes(`${list.length} source${list.length === 1 ? '' : 's'},`),
      'each heading carries its own count');
    assert.ok(html.includes(`carrying ${citations(list)} citation`),
      'and its own share of the citations');
  }
  // Which sources are base maps is asked of `origin.tool` — the two territory
  // imports — and not of a list of ids, so Wikidata is a dataset that stays
  // with the works.
  assert.ok(!maps.some((source) => source.id === 'wikidata'),
    'Wikidata is where identifiers come from, not where a border is drawn');
});

// ─── 7. emphasis.js assembles once (B13) ───────────────────────────────────
//
// `pathIds = new Set([...working.path, ...working.selected])` was written in
// map.js, timeline.js and graph-view.js; the walked edges and the consequence
// edges likewise; and the convergence query ran twice per state, once here for
// the events and once in the graph for their edges.

test('the working set carries the four things the three views used to rebuild', () => {
  // An event with consequences, a convergence and a walk into it, chosen from
  // the corpus rather than named: what this asserts is the shape of the answer.
  const chosen = [...atlas.events.values()]
    .find((e) => (atlas.adjacency.in.get(e.id) ?? []).length > 1
      && (atlas.adjacency.out.get(e.id) ?? []).length > 0);
  assert.ok(chosen, 'some event both leads somewhere and was fed by more than one branch');
  const working = workingSet(atlas, { ...defaultState(), selected: chosen.id });

  assert.deepEqual([...working.pathIds].sort(),
    [...new Set([...working.path, ...working.selected])].sort(),
    'the path is the walked chain and the selection, as every view composed it');
  for (const edges of [working.walkedEdges, working.consequenceEdges]) {
    assert.ok(Array.isArray(edges));
    assert.ok(edges.every((e) => working.shown.has(e.from) && working.shown.has(e.to)),
      'the lines are inside what the view draws');
  }
  assert.equal(working.consequenceEdges.length,
    (atlas.adjacency.out.get(chosen.id) ?? [])
      .filter((e) => working.shown.has(e.from) && working.shown.has(e.to)).length);

  // One convergence query, two halves. The events are filtered to what the view
  // draws and the edges are not — which is exactly what the graph drew before,
  // and the rule is that the two come out of one walk: every edge here is the
  // one a branch fed the target through, so its `from` is a branch's event.
  assert.ok(working.convergingEdges instanceof Set);
  assert.ok(working.convergingEdges.size > 0, 'the branches fed it through some link');
  const branches = new Set(convergence(atlas.adjacency, chosen.id, [...working.pathIds])
    .map((branch) => branch.edge.id));
  assert.deepEqual([...working.convergingEdges].sort(), [...branches].sort(),
    'and the set is the query’s own answer, run once');
});

test('and the `shown` contract is exactly what it was', () => {
  // M65's rule, unchanged by this milestone: `shown` is a set on every frame —
  // the lens, or the resting picture of the main events where there is none —
  // and never null.
  for (const [name, each] of CORPORA) {
    for (const patch of [{}, { selected: [...each.events.keys()][0] }, { degree: 3 }]) {
      const shown = workingSet(each, { ...defaultState(), ...patch }).shown;
      assert.ok(shown instanceof Set, `${name}: shown is a set`);
      assert.ok(shown.size > 0, `${name}: and there is always a picture`);
    }
  }
});

test('the wheel factor is one export and three readers', async () => {
  assert.equal(typeof WHEEL_FACTOR, 'number');
  // The rule held by the shape of the code and not by the absence of a string
  // (B14): the two pictures that answer a wheel of their own import the factor
  // the band zooms by, so they cannot come to answer at different rates.
  for (const file of ['src/map/map.js', 'src/graph-view/graph-view.js']) {
    const source = await read(file);
    assert.match(source, /WHEEL_FACTOR/, `${file} answers the wheel at the shared rate`);
  }
  const narrower = zoomWindow({ from: 1900, to: 2000 }, 1950, -100);
  const wider = zoomWindow({ from: 1900, to: 2000 }, 1950, 100);
  assert.ok(narrower.to - narrower.from < 100, 'a wheel up narrows the band');
  assert.ok(wider.to - wider.from > 100, 'and a wheel down widens it');
});

// ─── 8. rules held by shape, not by grep (B14) ─────────────────────────────
//
// Three tests held conventions by regex over file text: the legend's source
// must not contain `glyphId` or `eventsTokens` (m68), the window control's must
// not contain `<input` (m76), and the two band drawings' must not contain
// `addEventListener('wheel'` (m64). Brittle both ways — a comment naming one of
// them failed the test, a rename passed it while breaking the rule — and the
// third never reached the copy that mattered, the graph's own wheel.
//
// Each is now the module boundary it stood for, and the tests themselves moved
// with the rules; what is here is that the boundaries exist and are what the
// other suites can ask.

test('the legend is handed its rows, so a category cannot be one', () => {
  const { rows, base } = legendRows([{ id: 'relief' }, { id: 'coast' }]);
  for (const id of [...rows.map((row) => row.id), ...base]) {
    assert.ok(LAYERS.includes(id), `${id} is a layer the state knows`);
  }
  // It takes the base layers and nothing else: no manifest, no categories, no
  // way to learn of one.
  assert.deepEqual(legendRows().rows, rows);
});

test('the window control renders a constant a test can read', () => {
  assert.equal(typeof WINDOW_CONTROL_HTML, 'string');
  assert.ok(!/<input/.test(WINDOW_CONTROL_HTML), 'no field to type a year into');
  assert.match(WINDOW_CONTROL_HTML, /window-count/, 'and the count is still there');
});
