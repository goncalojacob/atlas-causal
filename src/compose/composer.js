// The composer: a reader writes a narrative inside the atlas.
//
// The owner, on the suggestion that readers should be able to write narratives
// here and submit them: **"Yes that is a feature I want."** And the thesis the
// whole project rests on: *"if everything is connected people can then easily
// write narratives."* Everything a narrative needs was already here — the
// record kind, the reading mode, the validator, the contribution pipeline —
// except the one thing a reader could use, which is this.
//
// Four things it must be, and the rest follows from them:
//
//   * **picked, not typed.** The reader clicks an event on the map, the graph
//     or the lanes — the same click M65 made a filter — and it becomes the
//     next step. A step is an event the atlas has, so the composer offers
//     nothing it cannot cite and there is no field to mistype an id into.
//   * **checked here, by the rules that will check it there.** The verdict is
//     `validate()` from `src/validate/core.js`, the function
//     `node tools/validate.mjs` runs, over the topology this page already
//     holds. Imported, never copied: two answers to "is this a valid
//     narrative" would be one answer too many.
//   * **sent by the reader, under their own account.** Submitting opens a
//     prefilled GitHub new-issue URL in a tab. No token, no secret, no API
//     call and no request of any kind leaves this page — the maintainer
//     labels the issue `accepted` and `contribution.yml` does the rest.
//   * **free at first paint.** This module is imported dynamically the first
//     time the button in the masthead is pressed. A reader who never writes a
//     narrative pays for one `<button>`, which is `map-band.js`'s rule and the
//     same argument.
//
// The draft is kept in localStorage, per reader and per browser, the way the
// panel's width and the band's toggle are (`panes.js`): a narrative half
// written is not lost, and it is never sent anywhere until the reader submits.
// It is not in the URL — a link is the picture its sender saw, not the essay
// they were in the middle of.
//
// The pure half — the draft, the record, the verdict, the link, the
// storage — is `narrative.js` and is under test without a DOM.

import { html } from '../util/dom.js';
import { citationText, compareSources } from '../citation.js';
import { labelOf } from '../attributes.js';
import { moveKey } from '../contribute/reorder.js';
import { loadSchemas } from '../validate/schemas.js';
import { copyText } from '../contribute/submit.js';
import {
  emptyDraft, pickStep, removeStep, moveStep, setStepText,
  windowOf, atlasReader, topologyFor, composeRecord, checkRecord,
  submitUrl, recordText, readDraft, writeDraft, clearDraft,
} from './narrative.js';

// What the page says about where the issue goes. Said on the page and not in
// a tooltip, because a reader about to publish under their own name is owed
// the whole of what is about to happen.
const NEXT = 'Submitting opens a new issue on GitHub, in this browser and under your own account — '
  + 'so a GitHub account is needed. Nothing is sent from this page: the issue is yours to read '
  + 'before you post it. A maintainer then reads it and labels it “accepted”, which opens a pull '
  + 'request carrying your narrative; a person reviews that before anything is merged.';

const PICK = 'Click an event on the map, the graph or the lanes and it becomes the next step. '
  + 'A step is always an event the atlas already has.';

const today = () => new Date().toISOString().slice(0, 10);

export function createComposer(layout, {
  atlas, state, storage = globalThis.localStorage, toggle = null,
  onLayout = () => {}, schemaRoot = 'schema/',
  open: openUrl = (url) => globalThis.window?.open(url, '_blank', 'noopener'),
} = {}) {
  const root = document.getElementById('composer');
  if (!root || !layout) return { open: () => {}, close: () => {}, toggle: () => {}, refresh: () => {} };

  const reader = atlasReader(atlas);
  const topology = topologyFor(atlas);
  // The rules arrive with the composer and not with the atlas: sixteen small
  // files, fetched the first time somebody opens this and never at first paint.
  let schemas = null;
  loadSchemas({ root: schemaRoot }).then((s) => { schemas = s; update(); }, () => { update(); });

  let draft = readDraft(storage) ?? emptyDraft();
  let opened = false;

  // ─── the markup ──────────────────────────────────────────────────────────
  //
  // `contrib` as well as `composer`, so the fields, the step rows, the move
  // arrows and the verdict are dressed by the stylesheet's contribution-form
  // block rather than by a second copy of it.
  root.className = 'composer contrib';
  root.innerHTML = '';

  const head = html('div', { class: 'composer-head' });
  head.append(html('h2', {}, 'Write a narrative'));
  const close = html('button', { type: 'button', class: 'link small composer-close', title: 'Close the composer; the draft is kept' }, 'close');
  head.append(close);
  root.append(head);
  root.append(html('p', { class: 'hint' }, PICK));

  const stepsHead = html('div', { class: 'citations-head' });
  stepsHead.append(html('h3', { class: 'composer-steps-label' }, 'The walk'));
  const spanText = html('span', { class: 'composer-window' });
  stepsHead.append(spanText);
  root.append(stepsHead);
  const list = html('ol', { class: 'composer-steps' });
  const noSteps = html('p', { class: 'hint composer-empty' }, 'No steps yet — click an event and it becomes the first.');
  root.append(list, noSteps);

  const field = (label, control, hint = null) => {
    const wrap = html('div', { class: 'field' });
    const id = `compose-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
    control.id = id;
    wrap.append(html('label', { for: id }, label), control);
    if (hint) wrap.append(html('p', { class: 'hint' }, hint));
    root.append(wrap);
    return wrap;
  };

  const titleInput = html('input', { type: 'text', maxlength: '200', placeholder: 'How the colonial war ended the regime' });
  field('Title', titleInput, 'It becomes the narrative’s id, and the title of the issue.');
  const summaryInput = html('textarea', { rows: '4', maxlength: '2000', placeholder: 'What this narrative claims, in a paragraph.' });
  field('Summary', summaryInput, 'Enough for a reader choosing between two accounts of the same period.');
  const authorInput = html('input', { type: 'text', maxlength: '120', placeholder: 'the name this should be attributed to' });
  field('Your name', authorInput, 'Attribution. Your GitHub handle is taken from the issue you open, not from here.');

  const citeWrap = html('div', { class: 'field' });
  citeWrap.append(html('span', { class: 'citations-label' }, 'Sources'));
  const citeRows = html('ul', { class: 'citation-rows' });
  const addCite = html('button', { type: 'button', class: 'link small' }, '+ cite a source');
  citeWrap.append(citeRows, addCite);
  citeWrap.append(html('p', { class: 'hint' }, 'A narrative cites what it rests on beyond the records it walks — at least one (rule 6).'));
  root.append(citeWrap);

  const report = html('div', { class: 'report' });
  const verdict = html('p', { class: 'summary' });
  const problems = html('ul', { class: 'entry-errors', hidden: 'hidden' });
  report.append(verdict, problems);
  root.append(report);

  const submitRow = html('div', { class: 'submit-row' });
  const submit = html('button', { type: 'button', class: 'submit' }, 'Open the issue on GitHub');
  const note = html('p', { class: 'submit-note hint' }, NEXT);
  const discard = html('button', { type: 'button', class: 'link small composer-discard' }, 'discard this draft');
  submitRow.append(submit, note, discard);
  root.append(submitRow);

  // ─── the steps ───────────────────────────────────────────────────────────
  //
  // Rebuilt when the walk changes — a step picked, moved or removed — and
  // never while one is being typed into: a redrawn list would take away the
  // textarea the reader is in, which is the reason `reorder.js` moves a row
  // rather than redrawing its list. What is focused is put back afterwards,
  // caret and all, so Alt+↑ from inside a paragraph leaves the reader where
  // they were.
  function stepName(ref) {
    const found = atlas.resolve(ref);
    return found?.record ? labelOf(atlas, found.record) : null;
  }

  function renderSteps() {
    const active = document.activeElement;
    const focused = active && list.contains(active)
      ? {
        at: [...list.children].indexOf(active.closest('li')),
        what: active.classList.contains('step-text') ? 'text' : null,
        start: active.selectionStart ?? null,
        end: active.selectionEnd ?? null,
      }
      : null;

    list.innerHTML = '';
    draft.steps.forEach((step, at) => {
      const row = html('li', { class: 'step-row composer-step' });
      const name = stepName(step.ref);
      const line = html('p', { class: 'composer-step-head' });
      // The title when its century has landed, and never a slug drawn where a
      // name goes (attributes.js). The id is always shown beside it, as an
      // identifier and not as a name: it is what the step actually names.
      if (name) line.append(html('span', { class: 'composer-step-name' }, name));
      line.append(html('code', { class: 'composer-step-ref' }, step.ref));
      row.append(line);

      const move = html('span', { class: 'row-move' });
      const up = html('button', { type: 'button', class: 'link small move-up', title: 'move this step up (Alt+↑)' }, '↑');
      const down = html('button', { type: 'button', class: 'link small move-down', title: 'move this step down (Alt+↓)' }, '↓');
      up.disabled = at === 0;
      down.disabled = at === draft.steps.length - 1;
      up.addEventListener('click', () => { draft = moveStep(draft, at, -1); changed(); });
      down.addEventListener('click', () => { draft = moveStep(draft, at, 1); changed(); });
      move.append(up, down);
      const drop = html('button', { type: 'button', class: 'link small composer-remove', title: 'take this step out of the walk' }, 'remove');
      drop.addEventListener('click', () => { draft = removeStep(draft, at); changed(); });
      row.append(move, drop);

      const text = html('textarea', {
        class: 'step-text', rows: '3', maxlength: '4000',
        placeholder: 'Why this step follows, in your own words.',
        'aria-label': `Step ${at + 1}: why it follows`,
      });
      text.value = step.text;
      text.addEventListener('input', () => {
        // The draft only: redrawing here would take the textarea away from
        // under the reader's cursor.
        draft = setStepText(draft, at, text.value);
        save();
        update();
      });
      text.addEventListener('keydown', (e) => {
        const delta = moveKey(e);
        if (delta === 0) return;
        e.preventDefault();
        draft = moveStep(draft, at, delta);
        changed();
      });
      row.append(text);
      list.append(row);
    });

    noSteps.hidden = draft.steps.length > 0;

    if (focused && focused.at >= 0) {
      const at = Math.min(focused.at, list.children.length - 1);
      const row = list.children[at];
      const back = row?.querySelector(focused.what === 'text' ? '.step-text' : 'button');
      if (back) {
        back.focus();
        if (focused.what === 'text' && focused.start !== null) back.setSelectionRange(focused.start, focused.end);
      }
    }
  }

  // ─── the citations ───────────────────────────────────────────────────────
  //
  // A `<select>` over the bibliography the page already has: `atlas.sources` is
  // the sources index, loaded with the core, so there is nothing to fetch and
  // nothing to type. Everything in it is untrusted input and goes in as text.
  const bibliography = [...atlas.sources.values()].sort(compareSources);

  function renderCitations() {
    citeRows.innerHTML = '';
    draft.citations.forEach((citation, at) => {
      const row = html('li', { class: 'citation-row' });
      const select = html('select', { 'aria-label': `Source ${at + 1}` });
      select.append(html('option', { value: '' }, '— choose a source —'));
      for (const source of bibliography) {
        const option = html('option', { value: source.id }, citationText(source));
        if (source.id === citation.source) option.selected = true;
        select.append(option);
      }
      select.addEventListener('change', () => {
        draft = { ...draft, citations: draft.citations.map((c, i) => (i === at ? { ...c, source: select.value } : c)) };
        changed();
      });
      const locator = html('input', { type: 'text', maxlength: '200', placeholder: 'page, chapter, folio', 'aria-label': `Locator ${at + 1}` });
      locator.value = citation.locator ?? '';
      locator.addEventListener('input', () => {
        draft = { ...draft, citations: draft.citations.map((c, i) => (i === at ? { ...c, locator: locator.value } : c)) };
        save();
        update();
      });
      const drop = html('button', { type: 'button', class: 'link small' }, 'remove');
      drop.addEventListener('click', () => {
        draft = { ...draft, citations: draft.citations.filter((_, i) => i !== at) };
        changed();
      });
      row.append(select, locator, drop);
      citeRows.append(row);
    });
  }

  addCite.addEventListener('click', () => {
    draft = { ...draft, citations: [...draft.citations, { source: '', locator: '' }] };
    changed();
  });

  // ─── the verdict ─────────────────────────────────────────────────────────

  let current = null;

  function update() {
    const span = windowOf(draft, reader.years);
    spanText.textContent = span ? `${span.from} to ${span.to}` : 'no years yet';
    spanText.title = 'The window is the span of the steps. It is computed, not typed.';

    current = composeRecord(draft, { years: reader.years, today: today() });
    if (!schemas) {
      verdict.textContent = 'Loading the rules…';
      verdict.classList.remove('bad');
      problems.hidden = true;
      submit.disabled = true;
      return;
    }
    const checked = checkRecord(current, topology, schemas);
    submit.disabled = !checked.ok;
    verdict.classList.toggle('bad', !checked.ok);
    verdict.textContent = checked.ok
      ? 'This is a record the validator accepts.'
      : `${checked.errors.length === 1 ? '1 thing' : `${checked.errors.length} things`} to put right before this can be submitted.`;
    problems.innerHTML = '';
    for (const error of checked.errors) {
      problems.append(html('li', {}, `rule ${error.rule}${error.path ? ` at ${error.path}` : ''}: ${error.message}`));
    }
    problems.hidden = checked.errors.length === 0;
  }

  // The walk changed: the rows are rebuilt, the draft is stored, the verdict
  // is taken again.
  function changed() {
    renderSteps();
    renderCitations();
    save();
    update();
  }

  const save = () => writeDraft(storage, draft);

  titleInput.addEventListener('input', () => { draft = { ...draft, title: titleInput.value }; save(); update(); });
  summaryInput.addEventListener('input', () => { draft = { ...draft, summary: summaryInput.value }; save(); update(); });
  authorInput.addEventListener('input', () => { draft = { ...draft, author: authorInput.value }; save(); update(); });

  // ─── submitting ──────────────────────────────────────────────────────────
  //
  // A link and a clipboard. `copyText` is the textarea fallback `submit.js`
  // keeps for a page that is not a secure context; nothing here is a request.
  submit.addEventListener('click', async () => {
    const record = current;
    const target = submitUrl(record);
    await copyText(recordText(record));
    openUrl(target.url);
    // The argument has left the browser and is an issue with a number of its
    // own. A composer that opened tomorrow on the narrative already sent would
    // invite the reader to send it twice.
    clearDraft(storage);
    draft = emptyDraft();
    fill();
    changed();
    note.textContent = target.prefilled
      ? 'The issue is open in another tab, prefilled. Post it there when you are happy with it.'
      : 'The walk was too long to put in the address, so it is on your clipboard: paste it into the issue that just opened.';
  });

  discard.addEventListener('click', () => {
    clearDraft(storage);
    draft = emptyDraft();
    fill();
    changed();
  });

  function fill() {
    titleInput.value = draft.title;
    summaryInput.value = draft.summary;
    authorInput.value = draft.author;
  }

  // ─── picking ─────────────────────────────────────────────────────────────
  //
  // The click that chose an event is the click that picks it: M65 made
  // choosing an event a lens, and the composer reads the same `selected`
  // rather than asking the reader to click a second thing. It watches only
  // while it is open, so a reader who has closed it is choosing events and
  // nothing else.
  let last = state.get().selected;
  const unsubscribe = state.subscribe((s) => {
    if (!opened || s.selected === last) return;
    last = s.selected;
    if (!s.selected) return;
    const before = draft;
    draft = pickStep(draft, s.selected, reader);
    if (draft !== before) changed();
  });

  // ─── open and close ──────────────────────────────────────────────────────

  function setOpen(next) {
    opened = next;
    root.hidden = !next;
    layout.classList.toggle('composing', next);
    toggle?.setAttribute('aria-expanded', String(next));
    if (next) last = state.get().selected;
    onLayout();
  }

  close.addEventListener('click', () => setOpen(false));

  fill();
  changed();

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!opened),
    isOpen: () => opened,
    // A century landed and the steps may have names now (main.js, shardLanded).
    refresh: () => { if (opened) renderSteps(); },
    destroy: () => { unsubscribe?.(); },
    // What the browser test reads, so that an assertion about the record is
    // about the record the page would send and not one rebuilt beside it.
    record: () => current,
    link: () => submitUrl(current),
  };
}
