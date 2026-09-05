// Bootstrap for review.html: the queue on the left, one record open on the
// right, and the two ways a save can go. Load, wire, nothing else — the
// decisions are in queue.js, sign.js, save.js and editor.js, all of them
// under test without a DOM.
//
// This page is not linked from the atlas and is not for readers. It exists to
// retire the exception in CLAUDE.md: every record the assistant drafted is
// unreviewed until a person reads it, corrects it and signs it, and the queue
// is empty when that is done.

import { esc } from '../util/esc.js';
import { html } from '../util/dom.js';
import { expandSpine } from '../data.js';
import { loadSchemas } from '../validate/schemas.js';
import {
  buildQueue, groupByKind, flagCounts, filterQueue, progressOf, isDraft,
} from './queue.js';
import { signRecord, retractRecord, retractionPlan, reviewerProblems, normalizeReviewer, bundleOf } from './sign.js';
import { saveBundle, readStatus } from './save.js';
import { unverified } from './citations.js';
import { createEditor } from './editor.js';
import { preparedFor } from '../contribute/bundle.js';

const REVIEWER_KEY = 'atlas.reviewer';
const params = new URLSearchParams(window.location.search);
const fixtures = params.get('fixtures') === '1';
const dataRoot = fixtures ? 'tests/fixtures/data/' : 'data/';
const mount = document.getElementById('dashboard');

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function getJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

function readReviewer() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(REVIEWER_KEY) ?? 'null');
    return { name: stored?.name ?? '', github: stored?.github ?? '' };
  } catch {
    return { name: '', github: '' };
  }
}

function writeReviewer(reviewer) {
  try {
    window.localStorage.setItem(REVIEWER_KEY, JSON.stringify(reviewer));
  } catch {
    // A browser that refuses storage still reviews; it only retypes the name.
  }
}

try {
  const manifest = await getJson(`${dataRoot}index/manifest.json`, { cache: 'no-store' });
  const [spine, sourcesIndex, review, schemas] = await Promise.all([
    getJson(`${dataRoot}${manifest.files.spine}`),
    getJson(`${dataRoot}${manifest.files.sources}`),
    getJson(`${dataRoot}${manifest.files.review}`),
    loadSchemas({ root: 'schema/' }),
  ]);
  // The spine expanded back into the lists the editor and `checkRules` read.
  // The dashboard wants the records, not an atlas: nothing here is drawn on a
  // map, and every rule that runs in the browser runs against these arrays.
  const expanded = expandSpine(spine);

  document.getElementById('fixtures-badge').hidden = !fixtures;
  render({
    topology: {
      events: expanded.events,
      edges: expanded.edges,
      actors: expanded.actors,
      places: expanded.places,
      relations: expanded.relations,
      narratives: expanded.narratives,
      presences: expanded.presences,
      sources: sourcesIndex.sources ?? [],
      regions: manifest.regions ?? [],
    },
    review,
    schemas,
    // Which records cite a source: not in the index every page loads, one
    // file per source since H3b. `retractionPlan` is the only thing on this
    // page that needs them, and only for the one source a reviewer is about
    // to retract, so it is fetched at that moment and not before (A7).
    citersOf: (id) => getJson(`${dataRoot}${manifest.files.citers}/${encodeURIComponent(id)}.json`)
      .then((file) => file.citations ?? []),
  });
} catch (error) {
  mount.innerHTML = `<p class="field-error"><code>${esc(error.message)}</code></p>
    <p>The dashboard needs the atlas index. Serve the repository root
    (<code>node tools/serve.mjs</code>, which can also write what you sign) and make sure
    <code>data/index/</code> exists (<code>node tools/build-index.mjs</code>).</p>`;
  throw error;
}

function render({ topology, review, schemas, citersOf }) {
  // The atlas's half of validation, built once for the page: a reviewer
  // opens one record after another and every editor validates against the
  // same universe and the same schema set (health review A, finding 11).
  const prepared = preparedFor(topology, schemas);
  // The queue as the index left it. Signing removes an entry from this list;
  // reloading the page rebuilds it from the index the save rewrote.
  let digests = (review.records ?? []).filter(isDraft);
  let queue = buildQueue(digests, review);
  const filters = { kind: null, flag: null, text: '' };
  let open = null;
  let editor = null;
  // The validation of what is in the inputs right now: the editor reports it
  // on every keystroke, and Save and Sign hang on it.
  let result = null;

  mount.textContent = '';
  const layout = html('div', { class: 'review' });

  // --- the queue -----------------------------------------------------------
  const side = html('aside', { class: 'queue' });
  const progressEl = html('p', { class: 'progress' });
  const search = html('input', { type: 'search', class: 'queue-search', 'aria-label': 'Search the queue', placeholder: 'id or name' });
  const kindRow = html('div', { class: 'queue-filters' });
  const flagRow = html('div', { class: 'queue-filters' });
  const listEl = html('div', { class: 'queue-list' });
  side.append(progressEl, search, kindRow, flagRow, listEl);

  // --- the record ----------------------------------------------------------
  // `contrib` is not decoration here: the editor is the contribution
  // form's fields, so it is styled by the contribution form's rules.
  const main = html('section', { class: 'record contrib' });
  const headEl = html('div', { class: 'record-head' });
  const editorMount = html('div', { class: 'editor-mount' });
  const noteEl = html('p', { class: 'save-note', role: 'status' });
  // The bundle a save became when there was nothing to write it: the
  // clipboard can refuse, and then this box is the only copy there is.
  const bundleBox = html('details', { class: 'bundle-preview', hidden: 'hidden' });
  const bundleText = html('pre', { class: 'preview' });
  bundleBox.append(html('summary', {}, 'The bundle, as it would be filed'), bundleText);

  const reviewer = readReviewer();
  const nameInput = html('input', { type: 'text', id: 'reviewer-name', autocomplete: 'name' });
  const handleInput = html('input', { type: 'text', id: 'reviewer-github', autocomplete: 'off', placeholder: 'octocat' });
  nameInput.value = reviewer.name;
  handleInput.value = reviewer.github;
  const signBox = html('fieldset', { class: 'sign-box' });
  signBox.appendChild(html('legend', {}, 'Reviewed by'));
  const nameField = html('div', { class: 'field' });
  nameField.append(html('label', { for: 'reviewer-name' }, 'Your name *'), nameInput);
  const handleField = html('div', { class: 'field' });
  handleField.append(html('label', { for: 'reviewer-github' }, 'GitHub handle'), handleInput);
  const reviewerError = html('p', { class: 'field-error', hidden: 'hidden' });
  signBox.append(nameField, handleField, reviewerError);

  // Sign warns about citations nobody has opened and never stops the
  // signature: a reviewer who has read the record and not yet got hold of the
  // book is further along than nobody having read it at all.
  const citationWarning = html('p', { class: 'notice citations', hidden: 'hidden' });
  const saveButton = html('button', { type: 'button', class: 'submit' }, 'Save');
  const signButton = html('button', { type: 'button', class: 'submit' }, 'Sign');
  const retractButton = html('button', { type: 'button', class: 'link' }, 'Retract');
  const actions = html('div', { class: 'record-actions' });
  actions.append(saveButton, signButton, retractButton);

  main.append(headEl, editorMount, signBox, citationWarning, actions, noteEl, bundleBox);
  layout.append(side, main);
  mount.appendChild(layout);

  for (const input of [nameInput, handleInput]) {
    input.addEventListener('input', () => {
      writeReviewer({ name: nameInput.value, github: handleInput.value });
      paintReviewer();
    });
  }

  function paintReviewer() {
    const problems = reviewerProblems({ name: nameInput.value, github: handleInput.value });
    reviewerError.textContent = problems.join('; ');
    reviewerError.hidden = problems.length === 0;
    signButton.disabled = !open || problems.length > 0 || !editorIsValid();
    // The boxes need a name to write into the record, so they come alive as
    // soon as there is one.
    editor?.paintVerify();
    paintCitationWarning();
    return problems.length === 0;
  }

  function paintCitationWarning() {
    const open = editor ? unverified(editor.current()) : [];
    citationWarning.hidden = open.length === 0;
    const one = open.length === 1;
    citationWarning.textContent = open.length === 0 ? '' : `${open.length} citation${one ? '' : 's'} on this record ${one ? 'has' : 'have'} not been checked against the source: ${open.join(', ')}. Signing is allowed; the count stays in the validator.`;
  }

  function editorIsValid() {
    return Boolean(editor && result?.ok);
  }

  // --- painting the queue --------------------------------------------------
  function visible() {
    return filterQueue(queue, filters);
  }

  function paintProgress() {
    const progress = progressOf(digests, { total: review.total ?? null });
    progressEl.textContent = progress.remaining === 0
      ? `Nothing left: all ${progress.total} records carry a person's name.`
      : `${progress.remaining} of ${progress.total} records still unreviewed — ${progress.byKind.map((k) => `${k.count} ${k.kind}`).join(', ')}.`;
  }

  function chip(label, active, onPick) {
    const button = html('button', { type: 'button', class: `chip${active ? ' on' : ''}` }, label);
    button.addEventListener('click', onPick);
    return button;
  }

  function paintFilters() {
    kindRow.textContent = '';
    kindRow.appendChild(chip(`all (${queue.length})`, filters.kind === null, () => {
      filters.kind = null;
      paintQueue();
    }));
    for (const group of groupByKind(queue)) {
      kindRow.appendChild(chip(`${group.kind} (${group.count})`, filters.kind === group.kind, () => {
        filters.kind = filters.kind === group.kind ? null : group.kind;
        paintQueue();
      }));
    }
    flagRow.textContent = '';
    for (const { flag, count } of flagCounts(queue)) {
      flagRow.appendChild(chip(`${flag} (${count})`, filters.flag === flag, () => {
        filters.flag = filters.flag === flag ? null : flag;
        paintQueue();
      }));
    }
  }

  function paintQueue() {
    paintProgress();
    paintFilters();
    listEl.textContent = '';
    const rows = visible();
    if (!rows.length) {
      listEl.appendChild(html('p', { class: 'hint' }, queue.length ? 'Nothing matches these filters.' : 'The queue is empty.'));
      return;
    }
    for (const group of groupByKind(rows)) {
      listEl.appendChild(html('h3', { class: 'queue-kind' }, `${group.kind} — ${group.count}`));
      const ul = html('ul', { class: 'queue-items' });
      for (const item of group.items) {
        const li = html('li', {});
        const button = html('button', {
          type: 'button',
          class: `queue-item${open && open.id === item.id ? ' current' : ''}`,
        });
        button.appendChild(html('span', { class: 'queue-label' }, item.label));
        button.appendChild(html('span', { class: 'queue-id' }, item.id));
        for (const flag of item.flags) button.appendChild(html('span', { class: 'flag' }, flag));
        if (item.unverified) button.appendChild(html('span', { class: 'unverified' }, `${item.unverified} citation${item.unverified === 1 ? '' : 's'} unverified`));
        // Which records have a full entry written. Not a flag — nothing here
        // is wrong — but the one thing the queue can say about how much of a
        // record exists beyond the sentence on its card.
        if (item.body) button.appendChild(html('span', { class: 'has-entry' }, 'full entry'));
        button.addEventListener('click', () => openRecord(item));
        li.appendChild(button);
        ul.appendChild(li);
      }
      listEl.appendChild(ul);
    }
  }

  // --- one record ----------------------------------------------------------
  async function openRecord(item) {
    open = item;
    noteEl.textContent = '';
    headEl.textContent = '';
    editorMount.textContent = '';
    editor = null;
    result = null;
    paintQueue();
    headEl.append(
      html('h2', {}, item.label),
      html('p', { class: 'record-id' }, `${item.kind} · ${item.id}`),
    );
    if (item.note) headEl.appendChild(html('p', { class: 'review-note' }, item.note));
    if (item.flags.length) headEl.appendChild(html('p', { class: 'record-flags' }, item.flags.join(' · ')));

    let record;
    try {
      record = await getJson(`${dataRoot}${item.kind}s/${encodeURIComponent(item.id)}.json`, { cache: 'no-store' });
    } catch (error) {
      editorMount.appendChild(html('p', { class: 'field-error' }, error.message));
      return;
    }
    editor = createEditor({
      record,
      topology,
      schemas,
      prepared,
      today: today(),
      reviewer: () => normalizeReviewer({ name: nameInput.value, github: handleInput.value }),
      onChange: (state) => {
        result = state.result;
        saveButton.disabled = !result.ok;
        paintReviewer();
      },
    });
    editorMount.appendChild(editor.root);
    result = editor.result;
    saveButton.disabled = !result.ok;
    paintReviewer();
    editor.focus();
  }

  function step(delta) {
    const rows = visible();
    if (!rows.length) return;
    const at = rows.findIndex((r) => open && r.id === open.id);
    const next = rows[Math.min(rows.length - 1, Math.max(0, (at < 0 ? 0 : at + delta)))];
    if (next) openRecord(next);
  }

  // The record is gone from the queue only once it is on disk with a name on
  // it: the bundle path leaves it here, because nothing has been written yet.
  function forget(ids) {
    digests = digests.filter((d) => !ids.includes(d.id));
    queue = buildQueue(digests, review);
    open = null;
    headEl.textContent = '';
    editorMount.textContent = '';
    editor = null;
    result = null;
    paintQueue();
  }

  // The server answers a save as soon as the record files are written and
  // rebuilds data/index/ behind it, so the line the reviewer is reading says
  // "rebuilding" until /__status says otherwise. One poll every half second,
  // and it stops the moment another save writes a new line.
  let indexWatch = 0;
  function watchIndex(mine) {
    const token = (indexWatch += 1);
    const poll = async () => {
      if (token !== indexWatch || noteEl.textContent !== mine) return;
      const status = await readStatus();
      if (token !== indexWatch || noteEl.textContent !== mine) return;
      const state = status?.index?.state ?? null;
      if (state === 'rebuilding') {
        window.setTimeout(poll, 500);
        return;
      }
      noteEl.textContent = state === 'failed'
        ? `${mine.replace('The index is rebuilding…', '')}The index could not be rebuilt: ${status.index.message}`
        : mine.replace('The index is rebuilding…', 'The index has been rebuilt.');
    };
    window.setTimeout(poll, 250);
  }

  function say(outcome, what) {
    bundleBox.hidden = outcome.mode !== 'bundle';
    bundleText.textContent = outcome.mode === 'bundle' ? (outcome.text ?? '') : '';
    if (outcome.mode === 'bundle' && !outcome.copied) bundleBox.open = true;
    if (outcome.mode === 'saved') {
      const files = outcome.written.map((w) => w.path).join(', ');
      noteEl.textContent = outcome.indexing
        ? `${what}: ${files} written. The index is rebuilding…`
        : `${what}: ${files} written and the index rebuilt.`;
      if (outcome.indexing) watchIndex(noteEl.textContent);
    } else if (outcome.mode === 'refused') {
      noteEl.textContent = `Nothing was written. ${outcome.message}`;
    } else {
      noteEl.textContent = [
        outcome.copied ? 'No write endpoint here, so the bundle is on your clipboard.' : 'No write endpoint here, and the clipboard refused: copy the bundle from the box.',
        outcome.prefilled ? 'The correction issue opened with it filled in.' : 'Paste it into the correction issue that just opened.',
      ].join(' ');
    }
  }

  async function send(records, what) {
    const primary = records[0];
    noteEl.textContent = 'Saving…';
    const outcome = await saveBundle(bundleOf(records), primary, { title: `Review: ${primary.id}` });
    say(outcome, what);
    return outcome;
  }

  saveButton.addEventListener('click', async () => {
    if (!editorIsValid()) return;
    await send([editor.current()], 'Saved');
  });

  signButton.addEventListener('click', async () => {
    if (!editorIsValid() || !paintReviewer()) return;
    const who = normalizeReviewer({ name: nameInput.value, github: handleInput.value });
    const signed = signRecord(editor.current(), who, { today: today() });
    const outcome = await send([signed], `Signed by ${who.name}`);
    if (outcome.mode === 'saved') forget([signed.id]);
  });

  retractButton.addEventListener('click', async () => {
    if (!editor) return;
    const record = editor.current();
    // A source's blockers are the records that cite it, and refusing to
    // retract is the whole point of asking: a failed fetch must not read as
    // "nothing cites this". The reviewer is told and nothing is written.
    let citers = null;
    if (record.kind === 'source') {
      // The index says how many there are; a source nothing cites has no
      // file at all, and asking for one would 404 (deviation 217).
      const counted = (topology.sources ?? []).find((s) => s.id === record.id)?.citationCount ?? 0;
      try {
        citers = { [record.id]: counted > 0 ? await citersOf(record.id) : [] };
      } catch (error) {
        noteEl.textContent = `Cannot check what cites ${record.id}: ${error.message}. Nothing was retracted.`;
        return;
      }
    }
    const plan = retractionPlan(record, citers ? { ...topology, citers } : topology);
    if (plan.blockers.length) {
      noteEl.textContent = `This cannot be retracted while ${plan.blockers.map((b) => `${b.id} ${b.why}`).join(', ')}. Correct those records first.`;
      return;
    }
    const carried = plan.retract.map((r) => `${r.kind} ${r.id}`);
    const question = carried.length
      ? `Retract ${record.id} and, with it, ${carried.join(', ')}?`
      : `Retract ${record.id}?`;
    if (!window.confirm(question)) return;
    // The cascade is fetched whole: the topology carries a projection, and a
    // projection is not a record that may be written back.
    const others = [];
    for (const item of plan.retract) {
      others.push(retractRecord(await getJson(`${dataRoot}${item.kind}s/${encodeURIComponent(item.id)}.json`, { cache: 'no-store' }), { today: today() }));
    }
    const outcome = await send([retractRecord(record, { today: today() }), ...others], 'Retracted');
    if (outcome.mode === 'saved') forget([record.id, ...plan.retract.map((r) => r.id)]);
  });

  search.addEventListener('input', () => {
    filters.text = search.value;
    paintQueue();
  });

  // Keyboard: the queue is walked without the mouse, and the two writes have
  // the shortcuts a person would guess. Never while typing in a field.
  window.addEventListener('keydown', (event) => {
    const typing = event.target instanceof HTMLElement
      && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveButton.click();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      signButton.click();
      return;
    }
    if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'j' || event.key === 'ArrowDown') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'k' || event.key === 'ArrowUp') {
      event.preventDefault();
      step(-1);
    }
  });

  paintQueue();
  saveButton.disabled = true;
  signButton.disabled = true;
  // The queue is grouped in kind order; the first record of the first group
  // is the one a reviewer would open anyway.
  const first = visible()[0];
  if (first) openRecord(first);
  else progressEl.classList.add('good');
}
