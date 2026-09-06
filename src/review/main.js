// Bootstrap for review.html: the queue on the left, one record open on the
// right, and the two ways a save can go. Load, wire, nothing else — the
// decisions are in queue.js, sign.js, save.js and editor.js, all of them
// under test without a DOM.
//
// This page is not linked from the atlas and is not for readers. It exists to
// retire the exception in CLAUDE.md: every record the assistant drafted is
// unreviewed until a person reads it, corrects it and signs it, and the queue
// is empty when that is done. "Unreviewed" is `review.status: draft` — a fact
// on the record and not a name in `authors` — so anything else that arrives
// unread, a contribution or a later import, is in the same list.

import { esc } from '../util/esc.js';
import { html } from '../util/dom.js';
import { expandSpine } from '../data.js';
import { loadSchemas } from '../validate/schemas.js';
import {
  buildQueue, flagCounts, toolCounts, filterQueue, sortQueue, isDraft, labelOf,
  SORT_KEYS, SORT_LABELS, BY_HAND,
} from './queue.js';
import { createList } from './list.js';
import { queueRow as drawRow } from './row.js';
import { claimOf, heldBy, claimDaysLeft, claimRecord, releaseClaim, CLAIM_DAYS } from './claim.js';
import { diffAgainst } from './history.js';
import { signRecord, retractRecord, retractionPlan, reviewerProblems, normalizeReviewer, bundleOf, carriedReason } from './sign.js';
import { saveBundle, readStatus, isLocalHost } from './save.js';
import { unverified } from './citations.js';
import { createEditor } from './editor.js';
import { preparedFor } from '../contribute/bundle.js';
import { pickerIndex } from '../contribute/picker.js';
import { formatInterval } from '../util/dates.js';

const REVIEWER_KEY = 'atlas.reviewer';
// Every row is exactly this tall, in pixels. The list places rows by
// arithmetic — see src/review/list.js — so this number and the stylesheet
// have to agree, and the number is the one that decides: the row's height is
// set on the element.
const ROW_HEIGHT = 54;
// Below this many drafts the page fetches every kind at once, which is what
// it always did and what the atlas is today. Above it, it opens on one kind
// and fetches the others when they are asked for: eleven megabytes of digests
// before the first row is drawn is the thing the shards exist to stop.
const EAGER_DRAFTS = 2000;
const params = new URLSearchParams(window.location.search);
const fixtures = params.get('fixtures') === '1';
const dataRoot = fixtures ? 'tests/fixtures/data/' : 'data/';
const mount = document.getElementById('dashboard');

// The banner is in the page and hidden; this is the one line that shows it.
// Off localhost the queue still reads and the editor still validates — what
// changes is where a save can go, and the page now says so before somebody
// spends twenty minutes on a record (health review A, finding 35).
const banner = document.getElementById('deployed-banner');
if (banner && !isLocalHost(window.location.hostname)) banner.hidden = false;

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
  const [spine, sourcesIndex, summary, schemas, searchEntries] = await Promise.all([
    getJson(`${dataRoot}${manifest.files.spine}`),
    getJson(`${dataRoot}${manifest.files.sources}`),
    // The queue's summary: how many drafts of each kind there are and which
    // file holds them. The digests themselves are one file per kind and are
    // fetched when a kind is shown (health review B, finding 7).
    getJson(`${dataRoot}${manifest.files.review}`),
    loadSchemas({ root: 'schema/' }),
    // The search shard, which the pickers scan. Folded at build time, so a
    // dashboard that has it does not fold the corpus again; a dashboard
    // whose fetch fails builds the index from the spine instead.
    getJson(`${dataRoot}${manifest.files.search}`).then((file) => file.entries ?? null).catch(() => null),
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
    summary,
    // One kind's digests and the warnings about them.
    shardOf: (kind) => {
      const file = (summary.kinds ?? []).find((k) => k.kind === kind)?.file;
      return file ? getJson(`${dataRoot}${file}`) : Promise.resolve({ records: [], warnings: [] });
    },
    // A record's history, written by the index build out of what git holds.
    // Fetched when a record is opened and not before: there is one file per
    // record and a dashboard reads a handful of them in an evening.
    historyOf: (id) => getJson(`${dataRoot}${manifest.files.history}/${encodeURIComponent(id)}.json`)
      .catch(() => null),
    schemas,
    searchEntries,
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

function render({ topology, summary, shardOf, historyOf, schemas, citersOf, searchEntries = null }) {
  // The atlas's half of validation, built once for the page: a reviewer
  // opens one record after another and every editor validates against the
  // same universe and the same schema set (health review A, finding 11).
  const prepared = preparedFor(topology, schemas);
  // And the pickers' half: every reference field in every editor searches
  // this one index, built once for the page rather than once per record
  // opened (health review B, finding 6).
  const pickers = pickerIndex({ topology, entries: searchEntries });
  // The queue, a kind at a time. Each kind's digests are one file, fetched
  // the first time that kind is shown and kept; signing removes an entry from
  // the list, and reloading the page rebuilds it from the index the save
  // rewrote. What the summary says is what the page can count without
  // fetching anything: how many drafts there are, and of what.
  const shards = new Map();
  const counts = new Map((summary.kinds ?? []).map((k) => [k.kind, k.count]));
  let digests = [];
  let warnings = [];
  let queue = [];
  const filters = { kind: null, flag: null, tool: null, text: '' };
  let sortKey = 'kind';
  let open = null;
  let editor = null;
  // The record as the page fetched it, before this reviewer touched
  // anything: what the diff and the claim are written against.
  let drafted = null;
  // Which open is the current one. Opening a record fetches it, its history
  // and — for a link — both of its ends, so two clicks in quick succession
  // are two of these running at once, and the slower one would otherwise
  // paint its endpoints into the record the reviewer is now reading.
  let opening = 0;
  // The validation of what is in the inputs right now: the editor reports it
  // on every keystroke, and Save and Sign hang on it.
  let result = null;

  mount.textContent = '';
  const layout = html('div', { class: 'review' });

  // --- the queue -----------------------------------------------------------
  const side = html('aside', { class: 'queue' });
  const progressEl = html('p', { class: 'progress' });
  const search = html('input', { type: 'search', class: 'queue-search', 'aria-label': 'Search the queue', placeholder: 'id or name' });
  const sortRow = html('div', { class: 'queue-filters queue-sort' });
  const kindRow = html('div', { class: 'queue-filters' });
  const flagRow = html('div', { class: 'queue-filters' });
  const toolRow = html('div', { class: 'queue-filters' });
  const countEl = html('p', { class: 'queue-count', role: 'status' });
  const list = createList({ rowHeight: ROW_HEIGHT, render: queueRow });
  side.append(progressEl, search, sortRow, kindRow, flagRow, toolRow, countEl, list.root);

  // --- the record ----------------------------------------------------------
  // `contrib` is not decoration here: the editor is the contribution
  // form's fields, so it is styled by the contribution form's rules.
  const main = html('section', { class: 'record contrib' });
  const headEl = html('div', { class: 'record-head' });
  // An edge is two ends and a claim about what ran between them, and it was
  // reviewed as two ids and a textarea: a reviewer could not see what either
  // end said without leaving the page (health review B, finding 7). This is
  // both endpoints, with their summaries and their standing.
  const contextEl = html('div', { class: 'record-context' });
  // Who has already read this record, and what changed when. Built by the
  // index out of the repository's own commits.
  const historyEl = html('details', { class: 'record-history' });
  const claimEl = html('div', { class: 'record-claim' });
  const editorMount = html('div', { class: 'editor-mount' });
  // What this reviewer has changed about the record they are about to sign.
  const diffEl = html('details', { class: 'record-diff' });
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

  main.append(headEl, contextEl, claimEl, historyEl, editorMount, diffEl, signBox, citationWarning, actions, noteEl, bundleBox);
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

  // --- the shards ----------------------------------------------------------
  // A kind's digests, fetched once. Everything that paints waits on this and
  // nothing else does any fetching.
  async function load(kind) {
    if (shards.has(kind)) return;
    shards.set(kind, { records: [], warnings: [] });
    try {
      const shard = await shardOf(kind);
      shards.set(kind, { records: (shard.records ?? []).filter(isDraft), warnings: shard.warnings ?? [] });
    } catch (error) {
      shards.delete(kind);
      countEl.textContent = `The ${kind} queue could not be fetched: ${error.message}`;
      return;
    }
    rebuild();
  }

  function rebuild() {
    digests = [...shards.values()].flatMap((s) => s.records);
    warnings = [...shards.values()].flatMap((s) => s.warnings);
    queue = buildQueue(digests, { warnings });
    paintQueue();
  }

  // --- painting the queue --------------------------------------------------
  // The model the list is handed: filtered, then ordered. Held between paints
  // so that j and k, the list and the keyboard all step through one list.
  let rows = [];

  function refilter() {
    rows = sortQueue(filterQueue(queue, filters), sortKey);
    return rows;
  }

  function paintProgress() {
    // Off the summary, not off what has been fetched: the page can say how
    // much is left without holding every digest, which is the point of the
    // shards.
    const remaining = [...counts.values()].reduce((sum, n) => sum + n, 0);
    const total = summary.total ?? remaining;
    const byKind = [...counts].filter(([, n]) => n > 0).map(([kind, n]) => `${n} ${kind}`);
    progressEl.textContent = remaining === 0
      ? `Nothing left: all ${total} records carry a person's name.`
      : `${remaining} of ${total} records still unreviewed — ${byKind.join(', ')}.`;
  }

  function chip(label, active, onPick, { title = null } = {}) {
    const button = html('button', { type: 'button', class: `chip${active ? ' on' : ''}`, ...(title ? { title } : {}) }, label);
    button.addEventListener('click', onPick);
    return button;
  }

  function paintFilters() {
    sortRow.textContent = '';
    sortRow.appendChild(html('span', { class: 'queue-sort-label' }, 'by'));
    for (const key of SORT_KEYS) {
      sortRow.appendChild(chip(SORT_LABELS[key], sortKey === key, () => {
        sortKey = key;
        paintQueue();
      }));
    }

    // Every kind the summary knows about, whether or not its shard has been
    // fetched: the counts are the summary's, and choosing one fetches it.
    kindRow.textContent = '';
    const loaded = [...counts.keys()].every((kind) => shards.has(kind));
    kindRow.appendChild(chip(
      `all (${[...counts.values()].reduce((sum, n) => sum + n, 0)})`,
      filters.kind === null,
      () => {
        filters.kind = null;
        for (const kind of counts.keys()) load(kind);
        paintQueue();
      },
      { title: loaded ? null : 'fetches every kind’s digests' },
    ));
    for (const [kind, count] of counts) {
      if (!count) continue;
      kindRow.appendChild(chip(`${kind} (${count})`, filters.kind === kind, () => {
        filters.kind = filters.kind === kind ? null : kind;
        if (filters.kind) load(filters.kind);
        paintQueue();
      }));
    }

    // The flags and the writers are counted off what has been fetched, and
    // say so when that is not everything: a chip claiming a number it cannot
    // know would be worse than the sentence under it.
    flagRow.textContent = '';
    for (const { flag, count } of flagCounts(queue)) {
      flagRow.appendChild(chip(`${flag} (${count})`, filters.flag === flag, () => {
        filters.flag = filters.flag === flag ? null : flag;
        paintQueue();
      }));
    }
    toolRow.textContent = '';
    for (const { tool, count } of toolCounts(queue)) {
      toolRow.appendChild(chip(`${tool === BY_HAND ? 'by hand' : tool} (${count})`, filters.tool === tool, () => {
        filters.tool = filters.tool === tool ? null : tool;
        paintQueue();
      }));
    }
  }

  // What the list draws for one row: the row itself is in row.js, so that
  // what a browser measures is what the page draws, and this adds the one
  // thing a benchmark has no use for.
  function queueRow(item) {
    const button = drawRow(item, { current: Boolean(open && open.id === item.id), today: today() });
    button.addEventListener('click', () => openRecord(item));
    return button;
  }

  function paintQueue() {
    paintProgress();
    paintFilters();
    refilter();
    list.setRows(rows, { keepScroll: true });
    const missing = [...counts.keys()].filter((kind) => !shards.has(kind));
    countEl.textContent = rows.length === 0 && missing.length
      ? `Nothing fetched yet — choose a kind.`
      : `${rows.length} shown${missing.length ? `, of the ${[...counts].filter(([k]) => shards.has(k)).map(([k]) => k).join(', ') || 'nothing'} fetched so far` : ''}.`;
    list.setEmpty(rows.length ? null : html('p', { class: 'hint' }, queue.length ? 'Nothing matches these filters.' : 'The queue is empty.'));
  }

  // --- one record ----------------------------------------------------------
  async function openRecord(item) {
    const token = (opening += 1);
    const current = () => token === opening;
    open = item;
    noteEl.textContent = '';
    headEl.textContent = '';
    contextEl.textContent = '';
    claimEl.textContent = '';
    historyEl.textContent = '';
    diffEl.textContent = '';
    diffEl.hidden = true;
    editorMount.textContent = '';
    editor = null;
    drafted = null;
    result = null;
    // The open record's row is marked, and it is usually not one of the rows
    // in the DOM: the list is scrolled to it first, which is what makes it.
    const at = rows.findIndex((r) => r.id === item.id);
    if (at >= 0) list.scrollTo(at);
    list.repaint();
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
    if (!current()) return;
    // The record as it was fetched: what Sign diffs the inputs against.
    drafted = record;
    paintClaim();
    if (record.kind === 'edge' || record.kind === 'relation') paintContext(record, current);
    paintHistory(item.id, current);
    editor = createEditor({
      record,
      topology,
      schemas,
      prepared,
      pickers,
      today: today(),
      reviewer: () => normalizeReviewer({ name: nameInput.value, github: handleInput.value }),
      onChange: (state) => {
        result = state.result;
        saveButton.disabled = !result.ok;
        paintDiff();
        paintReviewer();
      },
    });
    editorMount.appendChild(editor.root);
    result = editor.result;
    saveButton.disabled = !result.ok;
    paintDiff();
    paintReviewer();
    editor.focus();
  }

  // --- what is beside the record -------------------------------------------

  // Both ends of a link, with what each says and whether it still stands. The
  // spine carries no summaries — it is what every page loads — so the two
  // records are fetched, and a fetch that fails leaves the id, which is what
  // the page had before.
  async function paintContext(record, current = () => true) {
    const ends = record.kind === 'edge'
      ? [['from', record.from, 'event'], ['to', record.to, 'event']]
      : [['from', record.from, 'actor'], ['to', record.to, 'actor']];
    contextEl.appendChild(html('h3', { class: 'context-head' }, `${record.type} — the two ends`));
    const list_ = html('div', { class: 'context-ends' });
    contextEl.appendChild(list_);
    for (const [side, id, kind] of ends) {
      const box = html('div', { class: `context-end ${side}` });
      box.appendChild(html('p', { class: 'context-side' }, side === 'from' ? 'from' : 'to'));
      box.appendChild(html('p', { class: 'context-id' }, id));
      list_.appendChild(box);
      let end = null;
      try {
        end = await getJson(`${dataRoot}${kind}s/${encodeURIComponent(id)}.json`);
      } catch {
        if (!current()) return;
        box.appendChild(html('p', { class: 'hint' }, 'this record could not be fetched'));
        continue;
      }
      if (!current()) return;
      // The id stays: it is what the field holds and what a reviewer checks.
      box.insertBefore(html('h4', {}, labelOf({ ...end, kind })), box.querySelector('.context-id'));
      const marks = html('p', { class: 'context-marks' });
      marks.appendChild(html('span', { class: `status ${end.status}` }, end.status));
      if (isDraft(end)) marks.appendChild(html('span', { class: 'flag' }, 'unreviewed'));
      if (end.when) marks.appendChild(html('span', { class: 'when' }, formatInterval(end.when)));
      box.appendChild(marks);
      if (end.summary) box.appendChild(html('p', { class: 'context-summary' }, end.summary));
    }
  }

  async function paintHistory(id, current = () => true) {
    const summaryEl = html('summary', {}, 'History');
    historyEl.appendChild(summaryEl);
    const history = await historyOf(id);
    if (!current()) return;
    if (!history) {
      historyEl.appendChild(html('p', { class: 'hint' }, 'No history file for this record. Rebuild the index (node tools/build-index.mjs).'));
      return;
    }
    const versions = history.versions ?? [];
    summaryEl.textContent = `History — ${versions.length} version${versions.length === 1 ? '' : 's'}`;
    if (history.from !== 'git') {
      historyEl.appendChild(html('p', { class: 'hint' }, 'Built from the record’s own dates: the index was made where the repository’s history could not be read, so what changed at each revision is not known.'));
    }
    const ul = html('ul', { class: 'history-list' });
    // Newest first: what happened last is what a reviewer is deciding about.
    for (const version of [...versions].reverse()) {
      const li = html('li', {});
      li.appendChild(html('span', { class: 'history-on' }, version.on ?? 'undated'));
      li.appendChild(html('span', { class: 'history-what' }, version.first
        ? 'written'
        : (version.fields ?? []).length ? (version.fields ?? []).join(', ') : 'changed'));
      for (const signature of version.signedBy ?? []) {
        li.appendChild(html('span', { class: 'history-signed' }, `signed by ${signature.name}`));
      }
      ul.appendChild(li);
    }
    historyEl.appendChild(ul);
  }

  // What Sign is about to write that the draft does not say. Live: the
  // editor reports every keystroke, and this is the answer to "what am I
  // putting my name on that was not already there".
  function paintDiff() {
    if (!editor || !drafted) { diffEl.hidden = true; return; }
    const changes = diffAgainst(drafted, editor.current());
    diffEl.hidden = changes.length === 0;
    if (!changes.length) return;
    diffEl.textContent = '';
    diffEl.appendChild(html('summary', {}, `${changes.length} field${changes.length === 1 ? '' : 's'} changed since the draft`));
    const ul = html('ul', { class: 'diff-list' });
    for (const change of changes) {
      const li = html('li', {});
      li.appendChild(html('span', { class: 'diff-field' }, change.field));
      li.appendChild(html('span', { class: 'diff-before' }, change.before));
      li.appendChild(html('span', { class: 'diff-after' }, change.after));
      ul.appendChild(li);
    }
    diffEl.appendChild(ul);
  }

  // The claim: a name and a day on the record, so a second reviewer sees the
  // first one before spending the evening on the same forty records. Never a
  // lock — see src/review/claim.js — and it expires after a week.
  function paintClaim() {
    claimEl.textContent = '';
    if (!drafted) return;
    const held = heldBy(claimOf(drafted), today());
    const who = normalizeReviewer({ name: nameInput.value, github: handleInput.value });
    const mine = held && ((who.github && held.github === who.github) || held.name === who.name);
    if (held) {
      const left = claimDaysLeft(held, today());
      claimEl.appendChild(html('p', { class: 'claim-held' },
        `${mine ? 'You are' : `${held.name} is`} reading this — claimed ${held.on}, ${left} day${left === 1 ? '' : 's'} left.`));
    }
    const button = html('button', { type: 'button', class: 'link' }, held ? 'Release' : 'Claim');
    button.disabled = Boolean(held && !mine);
    if (held && !mine) button.title = 'the claim is somebody else’s; it expires on its own';
    button.addEventListener('click', async () => {
      if (!drafted) return;
      if (!held && !who.name) {
        noteEl.textContent = 'A claim says who is reading it: put your name in the box below first.';
        return;
      }
      const next = held ? releaseClaim(drafted) : claimRecord(drafted, who, { today: today() });
      const outcome = await send([next], held ? 'Released' : `Claimed for ${CLAIM_DAYS} days`);
      if (outcome.mode === 'saved') {
        drafted = next;
        const row = queue.find((r) => r.id === next.id);
        if (row) row.claim = next.review?.claimedBy ?? null;
        paintClaim();
        list.repaint();
      }
    });
    claimEl.appendChild(button);
  }

  function step(delta) {
    if (!rows.length) return;
    const at = rows.findIndex((r) => open && r.id === open.id);
    const to = Math.min(rows.length - 1, Math.max(0, (at < 0 ? 0 : at + delta)));
    const next = rows[to];
    if (!next) return;
    // The row stepped onto is usually not one of the rows in the DOM, which
    // is the whole point of the list: it is scrolled to first, and the list
    // makes it on the way.
    list.scrollTo(to);
    openRecord(next);
  }

  // The record is gone from the queue only once it is on disk with a name on
  // it: the bundle path leaves it here, because nothing has been written yet.
  function forget(ids) {
    for (const [kind, shard] of shards) {
      const kept = shard.records.filter((d) => !ids.includes(d.id));
      if (kept.length !== shard.records.length) {
        counts.set(kind, Math.max(0, (counts.get(kind) ?? 0) - (shard.records.length - kept.length)));
        shards.set(kind, { ...shard, records: kept });
      }
    }
    digests = [...shards.values()].flatMap((s) => s.records);
    warnings = [...shards.values()].flatMap((s) => s.warnings);
    queue = buildQueue(digests, { warnings });
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
    // Why, in the reviewer's own words. A retraction is an argument for
    // withdrawing a record and it stays on the record for good (rule 27), so
    // it is asked for before anything is written and a blank one stops here.
    const reason = String(window.prompt(`Why is ${record.id} being retracted? This stays on the record.`) ?? '').trim();
    if (!reason) {
      noteEl.textContent = 'A retraction says why. Nothing was retracted.';
      return;
    }
    // The cascade is fetched whole: the topology carries a projection, and a
    // projection is not a record that may be written back.
    const others = [];
    for (const item of plan.retract) {
      others.push(retractRecord(await getJson(`${dataRoot}${item.kind}s/${encodeURIComponent(item.id)}.json`, { cache: 'no-store' }), { today: today(), reason: carriedReason(record.id) }));
    }
    const outcome = await send([retractRecord(record, { today: today(), reason }), ...others], 'Retracted');
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

  // `?open=<id>` opens one record by name. It is what the contribution
  // pipeline puts in a pull request body: a maintainer reading the diff of a
  // stranger's records has one link to the page the review actually happens
  // on, instead of a queue to find the record in (health review A, finding
  // 30). Any record, not only a queued one — a record somebody has already
  // signed is still a record to open — and an id that names nothing says so
  // rather than silently opening something else.
  function asked(id) {
    if (!id) return null;
    const queued = queue.find((item) => item.id === id);
    if (queued) return queued;
    // By kind, because an edge out of the spine carries no `kind` of its own:
    // it is the list it is in that says what it is.
    for (const [kind, records] of [
      ['event', topology.events], ['edge', topology.edges], ['actor', topology.actors],
      ['place', topology.places], ['relation', topology.relations],
      ['narrative', topology.narratives], ['source', topology.sources],
    ]) {
      const record = (records ?? []).find((r) => r.id === id);
      if (record) {
        return {
          kind, id, label: labelOf({ ...record, kind }), status: record.status,
          flags: [], note: null, degree: 0, revised: record.revised ?? null, tool: null, claim: null,
        };
      }
    }
    return null;
  }

  // Which kinds are fetched before the first row is drawn. The whole queue
  // where that is a few hundred digests, which is the atlas today and is what
  // the page always did; one kind where it is not, and the rest when they are
  // asked for.
  const first = [...counts].find(([, n]) => n > 0)?.[0] ?? null;
  const eager = (summary.drafts ?? 0) <= EAGER_DRAFTS ? [...counts.keys()] : [first].filter(Boolean);
  if (eager.length === 1 && first) filters.kind = first;

  paintQueue();
  saveButton.disabled = true;
  signButton.disabled = true;
  Promise.all(eager.map(load)).then(() => {
    const wanted = params.get('open');
    const opening = asked(wanted);
    // Otherwise the queue is in the order the sort chips say, and its first
    // row is the one a reviewer would open anyway.
    const opened = opening ?? rows[0];
    // Unless a reviewer got there first: rows are drawn as each kind's shard
    // arrives, so the list can be clicked before the last of them lands, and
    // opening the queue's first record over the one somebody just chose would
    // be the page taking the record away from them.
    if (opened && !open) openRecord(opened);
    // After opening, because opening a record clears this line: an address
    // that names nothing is said out loud rather than silently ignored, and
    // what was opened instead is the queue's own first record.
    if (wanted && !opening) noteEl.textContent = `Nothing here has the id ${wanted}.`;
    else progressEl.classList.add('good');
  });
}
