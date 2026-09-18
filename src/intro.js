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

import { esc } from './util/esc.js';
import { formatInterval } from './util/dates.js';

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
export function opensOnNothing(state) {
  return !state.selected && !state.source && !state.place && !state.actor
    && !state.narrative && !state.focus && !state.chain?.length
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

const authorsLine = (record) => {
  const names = (record.authors ?? []).map((a) => a.name).filter(Boolean);
  return names.length ? names.join(', ') : 'unsigned';
};

// The card, as a string, so `node --test` can hold it to quoting and to
// claiming nothing.
export function introHtml(atlas) {
  const narratives = atlas.activeNarratives ?? [];
  const first = narratives[0] ?? null;
  const events = heaviest(atlas);
  const links = [...atlas.edges.values()].filter((e) => e.status === 'active').length;

  return `<div class="intro-card" role="dialog" aria-modal="false" aria-labelledby="intro-title">
    <button type="button" class="intro-close" data-intro="close" aria-label="Close">×</button>
    <h2 id="intro-title">Atlas causal</h2>
    <p class="intro-lead">A map, a graph and a timeline of the same records. Pick an event and follow
      its consequences one link at a time; at any point the panel will show which
      <em>other</em> branches fed the event you have reached.</p>
    <p class="muted">${esc(atlas.activeEvents.length)} events · ${esc(links)} links ·
      ${esc(atlas.actors.size)} actors · ${esc(atlas.sources.size)} sources.
      Every link carries a written explanation and its sources.</p>

    ${first ? `<section class="intro-start">
      <h3>Start here</h3>
      <p><button type="button" class="intro-go" data-intro="narrative" data-id="${esc(first.id)}">${esc(first.title)}</button>
        <span class="muted">${esc(authorsLine(first))} · ${esc((first.steps ?? []).length)} steps</span></p>
      <p class="hint">A narrative is one person's walk through records that are already here. The map,
        the graph and the timeline follow each step; nothing in it changes what it walks.</p>
    </section>` : ''}

    ${narratives.length > 1 ? `<section class="intro-narratives">
      <h3>Every walk <span class="count">${esc(narratives.length)}</span></h3>
      <ul>${narratives.map((n) => `<li>
        <button type="button" class="link" data-intro="narrative" data-id="${esc(n.id)}">${esc(n.title)}</button>
        <span class="muted">${esc(authorsLine(n))}</span>
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
      <h3>Follow the consequences</h3>
      <ol>
        <li>Click a mark on the map, or a bar on the timeline. The panel opens on that event.</li>
        <li>Under <strong>Consequences</strong>, click a link to walk it. The path you have walked is
          drawn in red, and a breadcrumb at the top of the panel takes you back to any step of it.</li>
        <li>Once you have walked a step, <strong>Other branches</strong> appears: the ancestors of where
          you are that are <em>not</em> on the path you took. Arriving one way does not mean that way
          explains it.</li>
        <li>Every link says <em>Why</em>, and behind it is the argument somebody wrote and the sources
          it rests on. A link historians disagree about is marked <em>disputed</em> and is never walked
          through silently.</li>
        <li>Any card offers <strong>Focus on this</strong>, which keeps that record's events and dims
          what they connect to directly. Foci add up, and each one is a chip in the header.</li>
      </ol>
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

  function show() {
    if (!shown) draw();
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

  return { show, hide, isOpen: () => !container.hidden };
}
