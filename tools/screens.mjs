#!/usr/bin/env node
// Takes the screenshots under docs/screens/. Serves the repository with
// tools/serve.mjs and drives a headless Chromium through its command line —
// no Puppeteer, no Playwright, no npm at all, which is the rule for this
// repository and not a preference. Anything the browser cannot be told from
// its own arguments is not worth a dependency.
//
//   CHROME=/path/to/chrome node tools/screens.mjs [--port 8123] [--only m19-map-1911]
//
// The browser is found through $CHROME, or in the usual places; without one
// the tool says so and exits 0, because a machine with no browser is not a
// broken repository and CI never takes screenshots.

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer, HOST } from './serve.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SCREENS = path.join(ROOT, 'docs', 'screens');
const DEFAULT_PORT = 8123;

// A browser cache keeps one directory per build — chromium-1194, and the
// next one tomorrow — so the versioned ones are looked up rather than
// written down. Newest first, by the number in the name.
function cachedChromium(root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers') {
  if (!root || !existsSync(root)) return [];
  return readdirSync(root)
    .filter((name) => /^chromium(_headless_shell)?-\d+$/.test(name))
    .sort((a, b) => Number(b.replace(/\D+/g, '')) - Number(a.replace(/\D+/g, '')))
    .flatMap((name) => [`${root}/${name}/chrome-linux/chrome`, `${root}/${name}/chrome-linux/headless_shell`]);
}

const CANDIDATES = [
  process.env.CHROME,
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
  ...cachedChromium(),
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

// What each screenshot is of. The name is the file, the query is the state —
// which is the whole of it, because the atlas keeps what it is showing in the
// URL and nothing else has to be clicked to get there.
export const SHOTS = Object.freeze([
  { name: 'm19-map-1911', query: '?from=1911&to=1911', width: 1440, height: 900,
    what: 'the colonial world in eight hues, no two neighbours alike' },
  { name: 'm19-map-1975', query: '?from=1975&to=1975', width: 1440, height: 900,
    what: 'the same actors keeping their hues after independence' },
  { name: 'm19-map-angola', query: '?from=1974&to=1974&actor=angola', width: 1440, height: 900,
    what: 'a selected actor filled cobalt over its hue' },
  { name: 'm19-event-card', query: '?selected=carnation-revolution-1974', width: 1440, height: 900,
    what: 'the panel: title, prose, consequences, a dispute' },
  { name: 'm19-graph', query: '?view=graph&selected=carnation-revolution-1974', width: 1440, height: 900,
    what: 'the graph and the key to the five line patterns' },
  { name: 'm19-about', page: 'about.html', query: '', width: 1100, height: 1000,
    what: 'a reading page on the same tokens' },
  // M39. The first is the seam: the whole world centred on 150 east, with
  // nothing torn at 30 west. The second is what the borders cost before
  // M39b — Iberia close enough that CShapes' shore and Natural Earth's were
  // two lines a few tenths of a degree apart, and are now one.
  { name: 'm39-map-world', query: '?from=1911&to=1911', width: 1440, height: 900,
    what: 'the world Pacific-centred, uncut at the seam' },
  { name: 'm39-map-iberia', query: '?from=1911&to=1911&bbox=-12,35,1,45', width: 1440, height: 900,
    what: 'one coastline and one border: the shore is Natural Earth\'s alone' },
  // The glyph run. The contact sheet is a page of its own under docs/screens/
  // and not the layer control: the control lists the categories *in use*, which
  // is four of the twelve today, and owner question 11 is about all twelve. The
  // page holds no copy of the symbols — it imports `src/map/glyphs.js` — so it
  // cannot fall behind the module, and the owner can open it as well as look
  // at the PNG.
  { name: 'glyphs-legend', page: 'docs/screens/glyphs-legend.html', query: '', width: 1200, height: 1100,
    what: 'the twelve symbols at three sizes, on paper and on an emphasised mark' },
  // On the fixtures, and it has to be: of the 54 active events that carry a
  // category today, three have a place and two of those are the same point in
  // Lisbon, so a shot of the repository's own data would show one symbol on
  // one mark. The fixtures carry three categories on three points apart, and
  // the page says in its own corner that they are synthetic.
  { name: 'glyphs-map', query: '?fixtures=1&group=region&from=1195&to=1305', width: 1280, height: 820, scale: 2,
    what: 'the symbols over the marks and at the left of a bar, on the fixtures' },
  // M37. The base map at both of its levels, and `?bbox=` does the zooming
  // because the state is the URL and there is nothing here to click. The
  // territories are switched off in both — through the very link the control
  // writes — because the base map is what these are of, and eight hues of wash
  // over it is exactly the emphasis hierarchy working as it should. The first
  // is the whole world, where no cell has been fetched and what is drawn is
  // the far files alone; the second is Lisbon at the near level, where the
  // shore, the rivers, the lakes, the peaks and the cities are the cells of
  // that one viewport and the far coastline has given up its stroke. Neither
  // group of the control is open: a `<details>` opens on a click or on an
  // anchor, and what these two are for is the picture.
  { name: 'm37-base-world', query: '?from=1911&to=1911&layers=land,events,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'the base map at the whole world: the far files, no cell, and no wash over them' },
  { name: 'm37-base-lisbon', query: '?from=1911&to=1911&bbox=-12,36.5,-4,45&layers=land,events,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'the near level over Lisbon: shore, rivers, lakes, peaks and cities from the cells' },
  // M38a. The same picture as `m37-base-lisbon` and the same link, so the two
  // can be put side by side: what is added is the names, and what changed
  // about the old ones is that the halo behind them is a halo again.
  { name: 'm38-labels-lisbon', query: '?from=1911&to=1911&bbox=-12,36.5,-4,45&layers=land,events,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'the cities named beside the events, over the near level at Lisbon' },
  // M38b. The same box as the two above, so the three go side by side and what
  // is added each time is the only thing that differs: the ground has its names
  // now — the Tagus, the Douro, the Cantabrian range — and the places this
  // atlas names and Natural Earth has no city for are on the map under their
  // own names. The events are off in the Iberia shot: at Lisbon thirty-seven of
  // them stand on the city's own point, and with them on the picture is about
  // the marks rather than about the ground.
  { name: 'm38-names-lisbon', query: '?from=1911&to=1911&bbox=-12,36.5,-4,45&layers=land,events,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'the rivers and the ranges named under the cities, over the near level at Lisbon' },
  { name: 'm38-names-iberia', query: '?from=1911&to=1911&bbox=-28,25.34,17,50.66&layers=land,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'Iberia at k = 8 with the events off: the cities, the atlas\'s own places, and the ground named' },
  { name: 'm38-labels-world', query: '?from=1911&to=1911&layers=land,events,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'the whole world, where this map writes no name at all' },
  // M43b. On the fixtures, and it has to be: `data/` runs from 1894 to 2026
  // and is one picture on a linear scale — it is M42 that brings the records
  // from before 1890, and until then the synthetic corpus is the only one that
  // reaches 1415. The fixtures run from the thirteenth century to the
  // twenty-first and the page says in its own corner that they are synthetic.
  //
  // No `?from=` and no `?to=` in either link, because what these are of is
  // what the atlas opens on: the century holding most of the corpus, with the
  // rest of five centuries beside it, each century a column of its own width
  // and the part past the band's margin drawn as the density strip.
  //
  // Both go through `docs/screens/frame.html`, which says in its own head why:
  // headless Chromium will not give a window narrower than 500 CSS pixels, so
  // a shot asked for at 390 comes out as the left 390 pixels of a 500-pixel
  // page; and the introduction covers a view opened with no window in the URL,
  // which is the one thing these two may not name. The frame answers both — a
  // viewport of exactly the width asked for, and a reader who has been here
  // before — and passes every other parameter through, so what is inside it is
  // the atlas at the link a reader would have.
  { name: 'm43-timeline-wide', page: 'docs/screens/frame.html', query: '?w=1440&h=900&fixtures=1&view=timeline',
    width: 1440, height: 900,
    what: 'five centuries on one axis at 1440 px: a column per century, the band on the busiest' },
  { name: 'm43-timeline-phone', page: 'docs/screens/frame.html', query: '?w=390&h=844&fixtures=1&view=timeline',
    width: 500, height: 844,
    what: 'the same five centuries in a 390 x 844 viewport, labelled only where a label fits' },
  // M43a. The check the brief names and the one the owner can make by eye:
  // Portugal at 1500, drawn, four centuries before CShapes begins. Every
  // outline in the picture is dashed all the way round because every one of
  // them is `probable` — a border the source drew for 1500 and this map holds
  // until 1530 — and the dash runs along the coast as well, which is the one
  // place this atlas draws a line on a shore. The bounding box is Iberia and
  // the near Atlantic, so a reader can see the shore and the Castile border
  // in the same frame.
  { name: 'm43a-borders-1500', query: '?from=1500&to=1500&bbox=-14,34,6,45', width: 1440, height: 900,
    what: 'Portugal at 1500: a probable outline, dashed shore and all, against Castile and Aragon' },
  // M48. The two faults the owner found, as they look once they are fixed.
  //
  // The narrative: reading one is a lens on the walk (lens.js), so the twelve
  // steps of "how the colonial war ended the regime" are drawn in full, their
  // one hop of causes and consequences is dimmed around them, and the other
  // two hundred events of the corpus are not in the picture. It used to be
  // drawn over all of them.
  { name: 'm48-narrative', query: '?narrative=how-the-colonial-war-ended-the-regime', width: 1440, height: 900,
    what: 'reading a narrative: the walk in full, its neighbours dimmed, and nothing else' },
  // The graph at the default floor: the events with at least two active links,
  // which is 147 of 250 here. The rest are still on the map, still on the
  // timeline, still found by the search and still reachable by walking — the
  // floor is a filter and not a deletion — and the control that moves it is in
  // the masthead, in the frame.
  // Through the frame, which marks the introduction as seen: the card covers
  // the view on a first visit with nothing open, and a browser started for one
  // screenshot has never been anywhere (deviation 709). The narrative shot
  // above needs no frame, because opening a narrative is opening something.
  { name: 'm48-graph', page: 'docs/screens/frame.html', query: '?w=1440&h=900&view=graph', width: 1440, height: 900,
    what: 'the graph drawing what organises other events, at the default floor of two links' },
  // M50, §5: the worst case, measured rather than fixed. The longest edge the
  // two chains carry is 349 years — the Atlantic slave trade to Brazil, which
  // begins in 1540, standing as a precondition of the Republic of 1889 — and
  // nobody had asked whether either view can draw a link of that length so
  // that a reader can see both of its ends.
  //
  // Both go through the frame, which marks the introduction as seen: a browser
  // started for one screenshot has never been anywhere (deviation 709). Both
  // carry the same `?chain=`, which is the walked path and draws it in the
  // madder accent, and the same `?selected=`, so the panel is open on the far
  // end of the edge.
  //
  // The timeline shot names its own window. Left to itself the view opens on
  // the century holding most of the corpus, and the question here is precisely
  // whether the two ends fit in one frame when a reader asks for the span that
  // holds them both.
  { name: 'm50-long-edge-graph', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&view=graph&chain=the-atlantic-slave-trade-to-brazil--proclamation-of-the-brazilian-republic-1889--precondition-of&selected=proclamation-of-the-brazilian-republic-1889',
    width: 1440, height: 900,
    what: 'the graph drawing a 349-year edge: 1540 to 1889, walked' },
  { name: 'm50-long-edge-timeline', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&view=timeline&from=1480&to=1980&chain=the-atlantic-slave-trade-to-brazil--proclamation-of-the-brazilian-republic-1889--precondition-of&selected=proclamation-of-the-brazilian-republic-1889',
    width: 1440, height: 900,
    what: 'the same 349-year link on the timeline, over the five centuries that hold both ends' },
  // And the same edge under a lens, which is what tells the difference between
  // "the graph cannot draw a link of this length" and "the graph cannot draw
  // anything in a corpus of 250 events without a lens". M48 built the lens;
  // this is the first long edge it has been asked to hold.
  { name: 'm50-long-edge-focus', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&view=graph&focus=event:the-atlantic-slave-trade-to-brazil&chain=the-atlantic-slave-trade-to-brazil--proclamation-of-the-brazilian-republic-1889--precondition-of&selected=proclamation-of-the-brazilian-republic-1889',
    width: 1440, height: 900,
    what: 'the 349-year edge with a lens on its near end: the chain alone, not the corpus' },
  // The same lens with the window opened to hold both ends, which is the shot
  // that turns the §5 finding from "the graph cannot draw this" into something
  // a follow-on milestone can actually fix. Ten nodes, twelve links and no
  // label over another; the only difference from the shot above is `?from=`
  // and `?to=`, and nothing in the interface sets them for a reader who walks
  // to an edge this long.
  { name: 'm50-long-edge-window', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1480&to=1980&view=graph&focus=event:the-atlantic-slave-trade-to-brazil&chain=the-atlantic-slave-trade-to-brazil--proclamation-of-the-brazilian-republic-1889--precondition-of&selected=proclamation-of-the-brazilian-republic-1889',
    width: 1440, height: 900,
    what: 'the same lens with the window opened to 1480-1980: all ten nodes, and the long edge whole' },
  // And the thing M50 says the owner should look at first: a disputed edge
  // with its dispute open. §4 of the brief asks whether the interface can show
  // a disagreement instead of asserting a line, and the Williams question is
  // where that value earns its place — the claim on one side, Engerman's five
  // per cent and Richardson's one per cent on the other, in the record rather
  // than in a footnote somebody has to go and find.
  { name: 'm50-disputed-edge', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1480&to=1980&chain=the-atlantic-slave-trade-to-the-caribbean--the-british-industrial-revolution--enabled&selected=the-british-industrial-revolution',
    width: 1440, height: 900,
    what: 'a disputed edge with its dispute: the Williams thesis, and the two historians who put a number against it' },
  // M54: the case the owner reported, as it looks once the ground is what
  // finds the events. Brazil is a CShapes record beginning in 1886 and names
  // no event at all, so its card used to open on an empty list under an atlas
  // narrowed to one hijacking; it opens on its ground now, and the ground runs
  // from the landfall of 1500.
  //
  // The band is deliberately the twentieth century and not the whole span,
  // because the other half of the owner's sentence is what happens when it is
  // narrowed: the list holds everything it found and the rows outside the band
  // are **faded** rather than taken away, with the hint counting those inside.
  // Through the frame, which marks the introduction as seen: a browser started
  // for one screenshot has never been anywhere (deviation 709).
  { name: 'm54-territory', page: 'docs/screens/frame.html',
    query: '?w=1440&h=1400&actor=brazil&from=1900&to=2030',
    width: 1440, height: 1400,
    what: 'a territory selected: everything that happened on its ground, faded where the band does not reach' },
  // M45a: the oldest request in the file, answered. The owner asked for a
  // topographical map on 16 September and, when it was argued that relief
  // would compete with the territories, said the thing that settled it —
  // relief is how a reader understands that a border moves around a
  // geographical feature. So all four of these are taken **with the
  // territories on**, which is the whole question: the ground has to be
  // legible *underneath* a frontier and never instead of it. Nothing else
  // changed about what is fetched — these are the same files M37 drew.
  //
  // The events are off in all four. At this scale a mark is a mark on a
  // border, and what these are of is the ground the border sits on.
  //
  // Three zooms, and the third twice because the two cases argue different
  // halves of it: Iberia is a frontier that follows rivers — the Minho, the
  // Douro, the Guadiana — and the Alps and the Andes are frontiers that follow
  // a ridge. All through `frame.html`, which marks the introduction as seen: a
  // browser started for one screenshot has never been anywhere (deviation 709).
  { name: 'm45a-ground-world', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1911&to=1911&layers=land,territories,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'the whole world: the ranges of the planet as relief, the deserts as cover, under the colonial borders' },
  { name: 'm45a-ground-andes', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1911&to=1911&bbox=-82,-56,-34,13&layers=land,territories,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'a continent: the Andes down the spine of South America, and Chile and Argentina divided along them' },
  { name: 'm45a-ground-iberia', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1911&to=1911&bbox=-10.5,35.8,-0.5,44.2&layers=land,territories,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'a border on rivers: Portugal and Spain along the Minho, the Douro and the Guadiana, with the ranges between them' },
  { name: 'm45a-ground-alps', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1911&to=1911&bbox=3.5,42.8,17.5,49.2&layers=land,territories,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'a border on a ridge: France, Switzerland, Austria and Italy around the Alps, peaks drawn at their heights' },
  // And the fifth, which is the only one with the territories **off**: the same
  // box as `m45a-ground-andes`, so the two go side by side and the difference
  // between them is the one thing the owner and I disagreed about. It is the
  // measure of "does not compete": the ground is a whole topography on its own
  // — the cordillera, the Amazon basin as a hollow, the Gran Chaco, Patagonia
  // — and under eight hues at 0.62 what survives is the ridge the border sits
  // on, which is exactly what was asked for and no more.
  { name: 'm45a-ground-bare-andes', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1911&to=1911&bbox=-82,-56,-34,13&layers=land,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'the same continent with the territories off: the ground alone, which is what the washes are drawn over' },
  // M60: the three views, at one link apart. The owner asked for the strip
  // along the bottom of the map to go and for "something to choose the
  // timeline" instead; these are what that turned out to be. The same window
  // in all three — the point of the milestone is that choosing a view does not
  // move it — and the same masthead, where the control now stands: the two
  // ends of the window, the density of the corpus beside them as one column
  // per century, and the count of what the map is looking at when there is one.
  //
  // All through `frame.html`, which marks the introduction as seen: a browser
  // started for one screenshot has never been anywhere (deviation 709).
  { name: 'm60-map', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999',
    width: 1440, height: 900,
    what: 'the map with the whole pane: no strip under it, and the window in the masthead' },
  { name: 'm60-graph', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=graph',
    width: 1440, height: 900,
    what: 'the graph, the same window, the same height back' },
  { name: 'm60-timeline', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=timeline',
    width: 1440, height: 900,
    what: 'the timeline as a view: the lanes, the clusters and the band, in a pane the strip never had' },

  // The three zooms M61 measured, over the same mark it measured them over:
  // `the-base-reforms-rally-1964`, whose name is 53 characters and was cut to
  // 28 at every one of them. The zoom is not in the URL — it is not what the
  // reader is looking at, it is how far they have wheeled into it — so these
  // go through the frame's `zoom` and `at`, which drive the wheel the way a
  // reader would (docs/screens/frame.html).
  { name: 'm61-labels-world', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=graph&zoom=1&at=the-base-reforms-rally-1964',
    width: 1440, height: 900,
    what: 'the world view: the same fourteen names, none longer than they were, none off the pane' },
  { name: 'm61-labels-continent', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=graph&zoom=3.5&at=the-base-reforms-rally-1964',
    width: 1440, height: 900,
    what: 'a continent: the names using the room the zoom opened, and no two of them on each other' },
  { name: 'm61-labels-close', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=graph&zoom=8&at=the-base-reforms-rally-1964',
    width: 1440, height: 900,
    what: 'a handful of nodes at MAX_ZOOM, each named in full where the room is there' },

  // M65: the two rules, on the same window as M60 and M61 so that the three
  // runs' pictures can be laid beside each other. At rest each view draws the
  // main events alone — 242 of the corpus's 309 — and choosing an event hides
  // everything unrelated.
  //
  // `angola-war-begins-1961` is the event chosen, because it is a part: what
  // it is part of is the colonial war, and the pair of shots is the whole of
  // the milestone in one picture — the war is still there, dimmed, and a
  // reader who has walked down into it can walk back out.
  { name: 'm65-map-rest', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999',
    width: 1440, height: 900,
    what: 'the map at rest: the main events, and no mark for anything inside one of them' },
  { name: 'm65-map-chosen', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&selected=angola-war-begins-1961',
    width: 1440, height: 900,
    what: 'the map with an event chosen: it, its one hop, and the war it is part of — the rest gone' },
  { name: 'm65-graph-rest', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=graph',
    width: 1440, height: 900,
    what: 'the graph at rest, on the same window as m60-graph and a fifth lighter' },
  { name: 'm65-graph-chosen', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=graph&selected=angola-war-begins-1961',
    width: 1440, height: 900,
    what: 'the graph with the same event chosen: a neighbourhood and not a corpus' },
  { name: 'm65-timeline-rest', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=timeline',
    width: 1440, height: 900,
    what: 'the timeline at rest: one bar per main event, and the parts inside their umbrellas' },
  { name: 'm65-timeline-chosen', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=timeline&selected=angola-war-begins-1961',
    width: 1440, height: 900,
    what: 'the timeline with the same event chosen: the same few bars the other two views draw' },

  // M64: the toggle closed and open, on the same window as M60, M61 and M65,
  // so that five runs' pictures of the map go side by side and what differs
  // between the last two is only the control.
  //
  // The first is the point of the milestone as much as the second: **closed it
  // costs nothing**, the map is the whole pane M60 gave it, and all that is on
  // it is one button in the corner. The second is the band over the map, with
  // the profile under it saying where the events are — `density.js`'s own
  // columns over what the atlas is currently showing (M65).
  //
  // `band=open` is the frame's, not the atlas's: the window is URL state and
  // the toggle is not, so a shot of the band open cannot be asked for by link
  // alone (docs/screens/frame.html).
  { name: 'm64-map-closed', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999',
    width: 1440, height: 900,
    what: 'a first visit: the whole pane, and the toggle in the corner costing nothing' },
  { name: 'm64-map-open', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&band=open',
    width: 1440, height: 900,
    what: 'the band open over the map: two handles to sweep, and where the events are under them' },
]);

export function findChrome(candidates = CANDIDATES) {
  return candidates.find((file) => existsSync(file)) ?? null;
}

// Not spawnSync: the server that answers the browser is this process, and a
// synchronous child blocks the event loop that would have served the page —
// the browser then waits for a request that can never be answered and the
// tool hangs until somebody kills it.
function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (status) => resolve({ status, stderr }));
  });
}

// `scale` is the device pixel ratio the shot is taken at, 1 unless a shot says
// otherwise. The glyph shots ask for 2: a symbol is ten SVG units on a mark,
// which is about fifteen screen pixels, and fifteen pixels in a PNG somebody
// is reading at arm's length is not something they can judge line work from.
export function chromeArgs(chrome, { url, file, width, height, scale = 1 }) {
  return [chrome, [
    '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    `--window-size=${width},${height}`,
    `--force-device-scale-factor=${scale}`,
    // Long enough for the spine, a geometry shard and two typefaces; the
    // browser advances its own clock, so this is not a sleep.
    '--virtual-time-budget=20000',
    `--screenshot=${file}`,
    url,
  ]];
}

async function main(argv) {
  let port = DEFAULT_PORT;
  let only = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--port') port = Number(argv[++i]);
    else if (argv[i] === '--only') only = argv[++i];
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  const chrome = findChrome();
  if (!chrome) {
    console.log('no headless browser found; set $CHROME to one. Nothing written.');
    return 0;
  }
  await mkdir(SCREENS, { recursive: true });
  const server = createServer({ port });
  await new Promise((resolve) => server.listen(port, HOST, resolve));
  try {
    for (const shot of SHOTS) {
      if (only && shot.name !== only) continue;
      const file = path.join(SCREENS, `${shot.name}.png`);
      const url = `http://${HOST}:${port}/${shot.page ?? ''}${shot.query}`;
      const [bin, args] = chromeArgs(chrome, { url, file, width: shot.width, height: shot.height, scale: shot.scale ?? 1 });
      const result = await run(bin, args);
      if (result.status !== 0) {
        console.error(`${shot.name}: chrome exited ${result.status}\n${result.stderr}`);
        return 1;
      }
      console.log(`docs/screens/${shot.name}.png — ${shot.what}`);
    }
  } finally {
    server.close();
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
