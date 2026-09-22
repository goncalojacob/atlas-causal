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
  //
  // The link said `group=region` until M77, when the grouping was removed and
  // the parameter became one an old link carries and nothing reads.
  { name: 'glyphs-map', query: '?fixtures=1&from=1195&to=1305', width: 1280, height: 820, scale: 2,
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

  // M64 had two shots here, the toggle closed and the band open, and neither
  // can be taken any more: there is no toggle to photograph closed and no
  // `band=open` to ask with, because M75 put the band on the map on every
  // visit. A shot definition that would now produce a different picture from
  // the sentence beside it is worse than no definition, so the two are gone
  // and `docs/screens/m64-map-closed.png` and `m64-map-open.png` stay where
  // they are: they are the record of what M64 looked like, which is the one
  // thing a picture of a removed control is still good for.

  // M66, the two the owner handed over.
  //
  // The graph at the zoom M61 took `m61-labels-close` at, over the same mark
  // and through the same frame, so the two files go side by side: the letters
  // are the size they were and the paper band behind them is the width it is
  // at the world view, where it used to be six times that and closing on the
  // letters.
  { name: 'm66-graph-zoom', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=graph&zoom=8&at=the-base-reforms-rally-1964',
    width: 1440, height: 900,
    what: 'a handful of nodes at MAX_ZOOM: the halo the width it is at the world view' },
  // And the timeline on the window every other shot is taken at, so it goes
  // beside m60-timeline and m65-timeline-rest: the twenty rows reach the
  // bottom of the pane instead of ending 297 px above it.
  { name: 'm66-timeline', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=timeline',
    width: 1440, height: 900,
    what: 'the rows taking the whole pane, with no band of empty ground under the bottom one' },
  // Taller still, where the cap is what stops them rather than the room: 44 px
  // a row, because a row tall enough to fill a 1400 px window draws an event
  // of one year as a column taller than it is wide (docs/m66-rows.md).
  { name: 'm66-timeline-tall', page: 'docs/screens/frame.html',
    query: '?w=1440&h=1400&from=1900&to=1999&view=timeline',
    width: 1440, height: 1400,
    what: 'a 1400 px window: the rows at their cap, and what the cap leaves rather than stripe the pane' },
  // M68. The category switches on the timeline, which is the milestone: they
  // were inside the map's legend, the legend is hidden here, and the filter
  // they hold narrows these lanes (deviation 858). `open=` is the frame asking
  // for the collapsed group — what a reader had open is not in the URL, for the
  // reason the band's toggle is not.
  { name: 'm68-timeline-categories', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=timeline&open=events-by-category',
    width: 1440, height: 900,
    what: 'the switches in the masthead over the lanes, one symbol a row, on a view that had none' },
  // And the same view with one of them off, through the very link the control
  // writes: the elections, which are 48 of the corpus's 78 categorised events,
  // leave the lanes and the switch says which one did it.
  { name: 'm68-timeline-narrowed', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=timeline&open=events-by-category'
      + '&layers=land,territories,events:death,events:disaster,events:revolution,events:treaty,events:war',
    width: 1440, height: 900,
    what: 'the elections switched off from the lanes: the picture narrowed and the switch saying so' },
  // M70. The standing marker, on the card the atlas has been photographed with
  // since M19 (`m19-event-card`), so the two can be laid side by side: the one
  // line under the head saying nobody has read this record, and `0 of N read`
  // in the masthead beside the window. Nothing else about the picture changes,
  // which is the point — the marker is honesty and not a filter.
  { name: 'm70-card-standing', query: '?selected=carnation-revolution-1974', width: 1440, height: 900,
    what: 'a card saying in one line that nobody has read the record, and the masthead counting it' },
  // And the graph where the fold used to fire. Below the zoom the semantic
  // collapse worked at, a parent's parts were drawn inside it with a `+N`
  // beside the mark; since M65 there were no parts in the picture to fold and
  // since M70 there is no fold. The ring is what says there is more inside
  // this one, and the Estado Novo — 25 parts, the most of any event in the
  // corpus — is where a reader can see it saying so alone.
  { name: 'm70-graph-parent', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=graph&selected=estado-novo-1933-1974',
    width: 1440, height: 900,
    what: 'a parent and its parts side by side: rings, no badge, and nothing folded into anything' },

  // M71. The composer, open beside the picture it is composed out of, with
  // three steps in it. `compose=` is the frame's, for the reason `band` and
  // `open` are: whether the composer is open is a preference and the draft
  // inside it lives in localStorage, so neither is in the URL the atlas keeps.
  //
  // Two pictures, and the split between them is the project's own rule about
  // what may be written here. The first is on the **real corpus** — three
  // events of the colonial war picked by clicking them, the window 1961 to
  // 1975 computed from them, and the paragraphs **not written**, because a
  // paragraph in this file arguing that one thing led to another would be a
  // historical claim nobody made. What it shows is the walk, the computed
  // window and the verdict saying what is still missing, which is the
  // composer as a reader meets it.
  //
  // The second is on the **fixtures**, where every word is synthetic and says
  // so: the same composer with the prose written, a source cited and the
  // verdict green — the whole of it working, with nothing asserted about the
  // world.
  { name: 'm71-composer', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1955&to=1980'
      + '&compose=angola-war-begins-1961,portugal-e-o-futuro-1974,carnation-revolution-1974',
    width: 1440, height: 900,
    what: 'the composer beside the map, three events picked by clicking them, the window computed from them' },
  { name: 'm71-composer-valid', page: 'docs/screens/frame.html',
    query: '?w=1440&h=1500&fixtures=1&fill=1'
      + '&compose=fixture-event-b,fixture-event-d,fixture-event-t',
    width: 1440, height: 1500,
    what: 'the same composer over the synthetic corpus, written and cited, the validator’s own rules saying yes' },

  // M73. How sure the atlas is, on the line itself. The same state twice,
  // because the milestone is that the two pictures cannot disagree about it:
  // the war in Angola, whose five consequences happen to be one of every
  // confidence the atlas has — `caused` to Lisbon twice, which historians
  // agree about; `inspired` to Guinea and Mozambique, which is probable; and
  // `enabled` to Goa, which is disputed and is the faintest line in both.
  //
  // Nothing about the state says "confidence". It is the ordinary picture of
  // an event's consequences, which is the point: a reader who opens an event
  // is already being told which of the lines in front of them the atlas is
  // not sure of.
  { name: 'm73-map', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1955&to=1980&selected=angola-war-begins-1961&bbox=-25,-25,90,55&layers=land,events',
    width: 1440, height: 900,
    what: 'the consequences of one event on the map: a disputed line to Goa beside two consensus lines to Lisbon' },
  { name: 'm73-graph', page: 'docs/screens/frame.html',
    query: '?w=1440&h=1400&from=1955&to=1980&view=graph&selected=angola-war-begins-1961',
    width: 1440, height: 1400,
    what: 'the same five links on the graph, inked alike, with the key saying what the difference means' },
  // M45b: the elevation bands, and the question the whole of M45 exists to
  // answer — *can a border be seen to sit on a ridge?* M45a made the ground
  // the base map already had legible; these are the half that costs bytes.
  //
  // **With the territories on**, as §2.4 asks, because the point is not that
  // the bands are pretty but that a frontier stays legible over them and that
  // a reader can see what the frontier is following. `relief` is named in the
  // `?layers=` list because it is the one layer off by default (deviation
  // 979), and a list is "these and nothing else".
  //
  // Two places, and they argue the two halves of it. **Iberia** is a frontier
  // that follows rivers in its middle and a range at either end — the Minho
  // and the Douro through the low bands, and the Serra da Estrela and the
  // Cantabrian and Central ranges standing out of them. **The Andes** is the
  // clearest case there is: two thousand miles of border between Chile and
  // Argentina drawn along the highest band on the continent, with the Amazon
  // basin's lowland beside it for the contrast.
  //
  // The events are off in both, as they were in M45a's four: at this scale a
  // mark is a mark on a border, and what these are of is the ground.
  { name: 'm45b-relief-iberia', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1911&to=1911&bbox=-10.5,35.8,-0.5,44.2&layers=land,territories,relief,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'Portugal and Spain over five bands: the border on the Minho and the Douro in the lowest, the ranges between them two bands higher' },
  { name: 'm45b-relief-andes', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1911&to=1911&bbox=-82,-56,-34,13&layers=land,territories,relief,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'the Andes as the top band down the spine of the continent, with Chile and Argentina divided along it' },
  // There is no pair of "without the bands" shots here, and there does not need
  // to be: `m45a-ground-iberia` and `m45a-ground-andes` are these very two
  // boxes with these very two `?layers=` lists and `relief` left out of them,
  // so the comparison is already on disk and is one picture and not three.
  // The world, once, for the shape of the planet and to show that the bands
  // are quiet at the scale the atlas opens at.
  { name: 'm45b-relief-world', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1911&to=1911&layers=land,territories,relief,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'the whole world in five bands under the colonial borders' },
  // Two more, and each answers something the three above leave open.
  //
  // **The Alps**, because Iberia's frontier follows rivers and the Andes are a
  // single narrow spine: the Alps are the case where the ridge is *wide*, and
  // four countries meet on the top band with the Po valley flat below it. It
  // is the picture in which the milestone's question — can a border be seen to
  // sit on a ridge? — is answered yes without having to be looked for.
  //
  // **The Andes with the territories off**, which is M45a's own measure asked
  // again (`m45a-ground-bare-andes`) and is here because the answer is not
  // flattering. The bands are right and they read: the cordillera is the top
  // band the length of the continent, the Amazon basin the lowest, Patagonia
  // between. Eight territory hues at 0.62 on top of that leave the broad bands
  // — the Meseta, the Alps — and very little of a narrow one at 48° across.
  // A set that showed only the two zooms where it works would be the assertion
  // §2.4 refused; this is the screenshot that proves the limit as well as the
  // promise, and STATUS.md says what it means.
  { name: 'm45b-relief-alps', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1911&to=1911&bbox=3.5,42.8,17.5,49.2&layers=land,territories,relief,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'a border on a wide ridge: France, Switzerland, Austria and Italy meeting on the top band, the Po valley two bands below it' },
  { name: 'm45b-relief-bare-andes', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1911&to=1911&bbox=-82,-56,-34,13&layers=land,relief,rivers,lakes,physical,mountains,cities',
    width: 1440, height: 900,
    what: 'the same continent with the territories off: the cordillera in five bands, which is what the eight hues are drawn over' },

  // M74. The two halves of one rule, and the pair is the milestone: the graph
  // opens on the window when nobody has asked it anything, and on the lens
  // when somebody has.
  //
  // The walk is the owner's own twelve-step argument about how the colonial
  // war ended the regime — the narrative `m48-narrative` photographs on the
  // map, here on the view that was losing it. Nothing in the query says where
  // the camera is: `?narrative=` is the whole of the state, and the frame
  // follows from the walk being the lens.
  { name: 'm74-graph-walk', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&view=graph&narrative=how-the-colonial-war-ended-the-regime',
    width: 1440, height: 900,
    what: 'the colonial-war walk framed on the graph: twelve steps, every one of them on the screen' },
  // M74's second picture, `m74-graph-rest`, and M75's two, `m75-map` and
  // `m75-map-phone`, were definitions here until M76 and their files are still
  // in `docs/screens/`. All three photograph rules this milestone replaced —
  // the graph opening on the window, and the band's profile at the corpus's
  // absolute scale beside two number fields — so re-pointing a definition at
  // the new picture would leave a sentence describing something else, and
  // deleting the PNGs would throw away the only record of what M74 and M75
  // looked like. The definitions went, the files stayed, and the four below
  // are what the same views show now. (Deviation 997's rule, applied again.)

  // M76. Three instructions from the owner on 21 September, one picture each
  // and a phone.
  //
  // The first: *"If for example I select portugal, the map timeline I use to
  // pick the dates should show only those events."* Nothing in the query but
  // the actor — no window, no view — because the band following the selection
  // is the whole of what is being photographed.
  { name: 'm76-map-portugal', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&actor=portugal',
    width: 1440, height: 900,
    what: 'Portugal selected: every column of the band is Portugal\u2019s own events, drawn at Portugal\u2019s own scale' },
  // The same map with nothing chosen, on the window M60, M61, M64, M65 and M75
  // photographed, so the run's pictures of the map go side by side. What is
  // different from `m75-map` is the whole of this milestone: a profile with a
  // shape in it, and a masthead with no year to type into.
  { name: 'm76-map', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999',
    width: 1440, height: 900,
    what: 'a first visit to the map: the band with a shape, and no field left in the masthead to type a year into' },
  // And on a phone, where the fields were the hardest thing in the masthead to
  // use and the band is the easiest.
  { name: 'm76-map-phone', page: 'docs/screens/frame.html',
    query: '?w=390&h=844&from=1900&to=1999',
    width: 500, height: 844,
    what: 'the same in a 390 x 844 viewport: the band is the control and there is nothing to type into' },
  // The third: *"I think the graph can always show all dates, then one can
  // zoom in and out and pan to look at different times."* The same narrow
  // window `m74-graph-rest` was taken on, which is the point — the window is
  // still in the link and the graph no longer obeys it.
  { name: 'm76-graph', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&from=1900&to=1999&view=graph',
    width: 1440, height: 900,
    what: 'the graph on a window of one century: every date drawn in full, no shaded band, the camera fitting all of it' },

  // M77. The three things the owner asked for on 21 September, each in the
  // state its own screenshot was taken in.
  //
  // The graph under a narrative — `who-was-buying`, twenty-eight steps, the
  // longest walk the atlas holds and the one the owner's picture was of. What
  // this is of is the answer to *"it looks clouded and there are too many
  // labels on top that don't really need to be always visible"*: the walk
  // named in full and in reading order, the neighbourhood faint and unnamed,
  // and no note across the top.
  { name: 'm77-graph', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&view=graph&narrative=who-was-buying',
    width: 1440, height: 900,
    what: 'the graph reading a narrative: every step named in full, the neighbourhood faint and unnamed' },
  // The graph at phone width, under a lens the reader asked for rather than a
  // narrative being read: opening a narrative opens its card, and on a phone
  // an open card is a sheet over the whole view (phone.js) — the picture would
  // have been of the sheet. A lens on one actor is the same rule at work with
  // nothing open, which is what a picture of the graph needs.
  { name: 'm77-graph-phone', page: 'docs/screens/frame.html',
    query: '?w=390&h=844&view=graph&focus=actor:salazar',
    width: 500, height: 844,
    what: 'a lens on one actor in a 390 x 844 viewport: fewer names, still whole ones' },
  // The timeline at rest, on the whole extent: every bar carrying its title,
  // no `+n` anywhere, and the rows as many as the titles need.
  { name: 'm77-timeline', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&view=timeline',
    width: 1440, height: 900,
    what: 'the resting timeline: every bar titled, no +n badge, the rows as many as the titles need' },
  { name: 'm77-timeline-phone', page: 'docs/screens/frame.html',
    query: '?w=390&h=844&view=timeline',
    width: 500, height: 844,
    what: 'the same in a 390 x 844 viewport' },
  // And a parent opened, which is the second half of the owner's sentence:
  // *"when you click on it it can show you everything that happened during
  // that time."* The Estado Novo, whose twenty-five parts are the regime's own
  // events.
  { name: 'm77-timeline-opened', page: 'docs/screens/frame.html',
    query: '?w=1440&h=900&view=timeline&selected=estado-novo-1933-1974',
    width: 1440, height: 900,
    what: 'an umbrella opened on the timeline: it and what happened during it, each titled' },
  // M79. An event may be part of several umbrellas (the owner, 22 September:
  // Angolan independence is inside the Third Republic and inside the
  // decolonisation of Africa), and the thing to show is that **either one
  // opens on it**.
  //
  // On the fixtures, and it has to be: no record under `data/` names two
  // parents — this milestone writes none and rewrites none — so the synthetic
  // corpus is the only place the picture exists. `fixture-event-h` is part of
  // F and of U and names them in that order; U is the *second* of the two, so
  // the pair of shots is the whole argument, and the page says in its own
  // corner that the records are synthetic.
  //
  // The timeline, because a bar carries its title and the two pictures can be
  // read side by side without a legend. No frame: something is open in both,
  // and the introduction only covers a view opened with nothing open
  // (deviation 709).
  { name: 'm79-umbrella-first', query: '?fixtures=1&view=timeline&from=1250&to=1310&selected=fixture-event-f',
    width: 1440, height: 900,
    what: 'the first umbrella opened: it, and the event inside it that names it first' },
  { name: 'm79-umbrella-second', query: '?fixtures=1&view=timeline&from=1250&to=1310&selected=fixture-event-u',
    width: 1440, height: 900,
    what: 'the second umbrella opened: the same event, which names this one second' },
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
