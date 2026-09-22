// First contact.
//
// The atlas used to open on a hundred and thirty-seven identical marks and a
// panel saying "Pick an event" (health review A, finding 17). Everything past
// the first click is well made — the consequences, the convergence, the
// horizon — and the first click was unguided: nothing said which events are
// the spine of this dataset, which walks somebody has already written, or what
// "follow the consequences" actually means here. Since H1c the panel is not
// even there when nothing is open, so the ground for saying it is the view.
//
// **This card quotes and does not claim.** Every title, every author's name
// and every count in it is read off records that are already in the atlas; the
// only prose is about the interface — what a click does, what a lens is. A
// card that summarised the history would be an unsigned historical claim on
// the front page of a project whose first rule is that a person writes those
// (CLAUDE.md, CONTEXT.md).
//
// Shown on a first visit, and only when nothing is open: a link somebody was
// sent opens on the record it names, not on an introduction to the site. The
// "?" in the masthead brings it back at any time, so dismissing it is never a
// door closing.
//
// **In the reader's words and not the builder's** (M82, A3). The card used to
// open on "A map, a graph and a timeline of the same records" and then spend
// *walk*, *lens*, *focus*, *chip*, *other branches* and *breadcrumb* before the
// reader had clicked once. Those are the names this project uses among itself
// for parts of its own machinery; a funder reading the front page has no way to
// attach any of them to anything. So the lead is the one sentence the masthead
// carries (`WHAT_IT_IS`), the steps say what a click does — open an event, read
// what it led to, click one of those — and the words a reader would have to be
// taught are simply not used before the first click. What is behind them is
// still all there; it is met on the card of a record, where there is something
// on screen for it to be about.

import { esc } from './util/esc.js';
import { formatInterval } from './util/dates.js';
import { hasOpening } from './state.js';
import { bylineOf } from './demo.js';

// Per reader, per browser, like the open section and the pane sizes: it says
// nothing about what the atlas is showing, so it stays out of the URL.
export const STORAGE_KEY = 'atlas-causal.intro';
export const SEEN = 'seen';

// How many of the heaviest events to offer. Enough to show that the dataset
// has a shape, few enough to read in one look and not become a second index.
export const HEAVIEST = 6;

export function hasSeen(storage) {
  try {
    return storage?.getItem(STORAGE_KEY) === SEEN;
  } catch {
    // A browser with storage turned off shows the card every time, which is
    // the safer failure: an introduction seen twice is a smaller harm than a
    // reader who never sees it.
    return false;
  }
}

export function markSeen(storage) {
  try {
    storage?.setItem(STORAGE_KEY, SEEN);
    return true;
  } catch {
    return false;
  }
}

// Nothing open and nothing asked for: a first visit to the atlas itself,
// rather than a link to a record inside it. A window, a lens or a view in the
// URL is a picture somebody chose, and covering it would be taking it away.
// Whether a record is open is asked of `state.js` and no longer written out
// here (M80). It was a list of five of the openings, and the two it did not
// name were covered by this card on arrival: an office, and — the moment a
// link became a record that can be opened — `?edge=`, whose whole purpose is
// to be a link to an argument inside the atlas. A list of the openings kept
// beside the openings is a list that goes stale the next time one is added.
export function opensOnNothing(state) {
  return !hasOpening(state) && !state.focus && !state.chain?.length
    && state.from === null && state.to === null && !state.bbox;
}

// The events this dataset hangs on, by the weight the index already computes.
// Ties broken by the year and then the id, so the card is the same card twice
// running.
export function heaviest(atlas, limit = HEAVIEST) {
  return [...atlas.activeEvents]
    .filter((e) => (e.weight ?? 0) > 0)
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)
      || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, limit);
}

// What the atlas is, in one sentence, in the reader's own words (M82, A3).
// The masthead of `index.html` carries the same sentence under the title, and
// `tests/m82.test.mjs` holds the two together: a page that said one thing and
// a card that said another would be the fault this fixes, written twice.
//
// It claims nothing about history. "since 1492" is the corpus's own earliest
// year — `atlas.extent.min`, asserted in the same test — and not a period
// anybody here decided on.
export const WHAT_IT_IS = 'The history of the world since 1492 as a graph: every event linked to what caused it and what it led to, with sources.';

// How many of the atlas's links carry a written argument and at least one
// source, and how many there are (M85, A14). The card asserted that *every*
// one of them does, in prose, on the front page — a claim about the data
// nothing checked and the browser cannot: an edge's `explanation` is in an
// explanation shard and its `sources` are in no index file at all.
//
// So the build counts it (`validate/core.js`, `linkCounts`) and the manifest
// carries the answer. Where the whole corpus is in hand — the two writer
// pages, the fixtures, a test — the records answer for themselves and the
// manifest is not needed; the count is the same question either way.
export function explainedLinks(atlas) {
  const counted = atlas.manifest?.links;
  if (counted && Number.isInteger(counted.active) && Number.isInteger(counted.explained)) {
    return { total: counted.active, explained: counted.explained };
  }
  // No manifest: the records themselves, where a caller has them. An atlas
  // built from the core alone has neither — the core carries an edge's five
  // slots and nothing of its argument — and then the answer is **null** and
  // the card says nothing rather than guessing. A front page that reported
  // "0 of the 658" because it had not been told is worse than one that is
  // quiet about it.
  const active = [...atlas.edges.values()].filter((e) => e.status === 'active');
  if (!active.some((e) => typeof e.explanation === 'string')) return null;
  const explained = active.filter((e) => typeof e.explanation === 'string'
    && e.explanation.trim() !== '' && (e.sources ?? []).length > 0).length;
  return { total: active.length, explained };
}

// And the sentence it becomes. "Every link" only where it is every link: a
// front page that rounds its own gaps away is the one thing this project
// cannot afford to do.
export function linksSentence(counted) {
  if (counted === null) return '';
  const { total, explained } = counted;
  if (total > 0 && explained === total) return 'Every link carries a written explanation and its sources.';
  return `${explained} of the ${total} links carry a written explanation and their sources.`;
}

// The card, as a string, so `node --test` can hold it to quoting and to
// claiming nothing.
export function introHtml(atlas) {
  const narratives = atlas.activeNarratives ?? [];
  const first = narratives[0] ?? null;
  const events = heaviest(atlas);
  const counted = explainedLinks(atlas);
  const links = counted?.total ?? [...atlas.edges.values()].filter((e) => e.status === 'active').length;

  return `<div class="intro-card" role="dialog" aria-modal="false" aria-labelledby="intro-title">
    <button type="button" class="intro-close" data-intro="close" aria-label="Close">×</button>
    <h2 id="intro-title">Atlas causal</h2>
    <p class="intro-lead">${esc(WHAT_IT_IS)}</p>
    <p class="muted">${esc(atlas.activeEvents.length)} events · ${esc(links)} links ·
      ${esc(atlas.actors.size)} actors · ${esc(atlas.sources.size)} sources.
      ${esc(linksSentence(counted))}</p>

    ${first ? `<section class="intro-start">
      <h3>Start here</h3>
      <p><button type="button" class="intro-go" data-intro="narrative" data-id="${esc(first.id)}">${esc(first.title)}</button>
        <span class="muted">${esc(bylineOf(first))} · ${esc((first.steps ?? []).length)} steps</span></p>
      <p class="hint">A short account that takes you through the events in order, one at a time. The
        map, the graph and the timeline follow it as you read; it changes nothing it goes through.</p>
    </section>` : ''}

    ${narratives.length > 1 ? `<section class="intro-narratives">
      <h3>Accounts to read <span class="count">${esc(narratives.length)}</span></h3>
      <ul>${narratives.map((n) => `<li>
        <button type="button" class="link" data-intro="narrative" data-id="${esc(n.id)}">${esc(n.title)}</button>
        <span class="muted">${esc(bylineOf(n))}</span>
      </li>`).join('')}</ul>
    </section>` : ''}

    ${events.length ? `<section class="intro-heaviest">
      <h3>What most of it hangs on</h3>
      <p class="hint">The events with the most of the atlas downstream of them. Opening one is as good a
        place to start as any.</p>
      <ul>${events.map((e) => `<li>
        <button type="button" class="link" data-intro="event" data-id="${esc(e.id)}">${esc(e.title)}</button>
        <span class="when">${esc(formatInterval(e.when))}</span>
      </li>`).join('')}</ul>
    </section>` : ''}

    <section class="intro-walkthrough">
      <h3>How to read it</h3>
      <ol>
        <li>Click an event — a mark on the map, a bar on the timeline, a dot on the graph. A card
          opens on it with its dates, who was in it and where it happened.</li>
        <li>The card lists <strong>what this event led to</strong>. Click one of those to go forward a
          step. The trail you have followed is drawn in red on all three pictures.</li>
        <li>The card also lists <strong>what led to this event</strong>, including the causes you did
          not arrive through: getting here one way does not mean that way explains it.</li>
        <li>Every link between two events says <em>why</em>, in a paragraph somebody wrote, with the
          books and articles it rests on. Where historians disagree, the link is marked
          <em>disputed</em> and says who disagrees.</li>
      </ol>
      <p class="hint">The atlas opens on the events that are not part of any larger one. Open a war, a
        regime or a revolution and what happened inside it appears.</p>
    </section>

    <p class="intro-actions">
      <button type="button" data-intro="close">Start exploring</button>
      <a href="about.html">What this is, and what it is not →</a>
    </p>
  </div>`;
}

// The overlay itself: shown on a first visit with nothing open, dismissed by
// the button, by Escape or by a click on the ground outside it, and brought
// back by the "?" in the masthead.
export function createIntro(container, {
  atlas, state, storage = globalThis.localStorage, toggle = null,
}) {
  let shown = false;

  function draw() {
    container.innerHTML = introHtml(atlas);
  }

  // **And drawn again when a century lands** (M82, A3). The card names
  // narratives and events, and what a record is *called* arrives with its
  // attribute shard and not with the core (attributes.js); the card was built
  // once, at load, so a first visit read `world-war-ii` and
  // `how-the-colonial-war-ended-the-regime` where the titles go — the front
  // page of the atlas printing slugs. Nothing in the state has changed when a
  // shard arrives, so the card has to be told, exactly as the three views, the
  // panel, the chips and the composer are (main.js, `shardLanded`).
  //
  // Only while it is on screen: a card nobody is looking at is rebuilt the
  // next time it is opened, and rewriting the markup under a reader's pointer
  // costs a click.
  function refresh() {
    if (shown && !container.hidden) draw();
  }

  function show() {
    // Always drawn afresh: the titles it quotes may have landed since it was
    // last built, and the "?" is often pressed long after the load.
    draw();
    shown = true;
    container.hidden = false;
    toggle?.setAttribute('aria-expanded', 'true');
    container.querySelector('.intro-close')?.focus();
  }

  function hide() {
    container.hidden = true;
    toggle?.setAttribute('aria-expanded', 'false');
    markSeen(storage);
  }

  container.addEventListener('click', (e) => {
    // The ground outside the card dismisses it, as a dialog's backdrop does.
    if (e.target === container) {
      hide();
      return;
    }
    const el = e.target.closest('[data-intro]');
    if (!el) return;
    if (el.dataset.intro === 'narrative') {
      // Step 0 is the first step of the walk, which is where "start here"
      // starts. The brief says "step 1" and means the same one; the URL
      // numbers from zero and always has (state.js).
      state.set({ narrative: el.dataset.id, step: 0 });
    } else if (el.dataset.intro === 'event') {
      state.set({ selected: el.dataset.id, chain: [] });
    }
    hide();
  });

  container.ownerDocument?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !container.hidden) hide();
  });

  toggle?.addEventListener('click', () => {
    if (container.hidden) show();
    else hide();
  });

  if (!hasSeen(storage) && opensOnNothing(state.get())) show();
  else container.hidden = true;

  return { show, hide, refresh, isOpen: () => !container.hidden };
}
