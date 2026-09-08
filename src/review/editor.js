// The editor half of the review dashboard: one record, every field the
// contribution form has for its kind, validated against the atlas on every
// keystroke. The field definitions are the form's own — FIELDS,
// CITATION_LISTS, ACTOR_LISTS and STEP_LISTS in src/contribute/bundle.js —
// so a field added for contributors appears here without being added twice.
//
// What this does not do is what tells it apart from the form: it never
// invents an id, never searches for near-matches, and never writes the
// envelope. It opens a record that exists, replaces the fields a person
// edited, and hands back the record — `created`, `aliases`, `supersededBy`
// and `authors` exactly as they were on disk (applyValues), because only
// Sign and Retract may touch those.

import { html } from '../util/dom.js';
import { createPicker, pickerIndex } from '../contribute/picker.js';
import { reorderControls, refreshAll } from '../contribute/reorder.js';
import {
  FIELDS, CITATION_LISTS, ACTOR_LISTS, STEP_LISTS, valuesFromRecord, applyValues, validateBundle, preparedFor,
  isVocabulary, vocabularyChoices, roleChoices, roleOptionsFor,
} from '../contribute/bundle.js';
import { identifiers, citationText } from '../citation.js';
import { citationRows, setVerified, clearVerified } from './citations.js';
import { previewHtml } from '../entry/preview.js';
import { LOADING_CORPUS } from '../attributes.js';

// The error at /where/lon belongs to the longitude input, the one at
// /sources/0/source to the citation list: walk up the path until a field
// claims it. The same rule as the form's, and for the same reason — an error
// nobody claims is shown against the record instead of being lost.
export function claim(fields, path) {
  let p = path ?? '';
  for (;;) {
    if (fields.has(p)) return fields.get(p);
    const cut = p.lastIndexOf('/');
    if (cut < 0) break;
    p = p.slice(0, cut);
  }
  if (path) for (const [key, view] of fields) if (key.startsWith(`${path}/`)) return view;
  return null;
}

// A picker's input holds the name that was typed, not the id that was
// chosen, so whether the field is empty is a question for the picker.
function isEmpty(view) {
  if (view?.picker) return view.picker.value() === '';
  return Boolean(view?.input) && view.input.value.trim() === '';
}

// A blank required field says "required" rather than repeating the schema's
// "none of the alternatives matched", which is true and useless.
export function messageOf(error, view) {
  if (view?.field?.required && isEmpty(view)) return 'required';
  const deeper = (error.alternatives ?? []).find((alt) => alt.some((e) => (e.path ?? '').length > (error.path ?? '').length));
  if (deeper) return deeper.map((e) => e.message).join('; ');
  return error.message;
}

// The lanes, which are one of the two reference fields that are a `<select>`
// here as in the form: a closed list, short, nothing to type at. Every other
// reference is a picker over the search index (src/contribute/picker.js).
// The `<select>` of every event in the atlas that used to stand in its place
// was 23,015 options across seven controls and 224 ms per keystroke at
// twenty thousand events (health review B, finding 6). The categories are the
// other, and both lists come out of `bundle.js`, so the dashboard and the
// form cannot offer two different ones.
export function regionChoices(topology) {
  return vocabularyChoices('regions', topology);
}

// What the import wrote about this record's identity, shown and not offered
// for editing: the article titles and how many language editions have one.
// A reviewer's job here is to see whether the item is the right one — a
// wrong title is corrected on Wikidata and re-imported, never typed in.
// Returns null when the record claims nothing, so a record the import has
// not touched looks exactly as it did before.
export function identityBlock(record) {
  const titles = record?.wikipedia && typeof record.wikipedia === 'object' ? Object.entries(record.wikipedia) : [];
  const count = Number.isInteger(record?.sitelinks?.count) ? record.sitelinks.count : null;
  if (titles.length === 0 && count === null) return null;
  const wrap = html('div', { class: 'field identity' });
  wrap.appendChild(html('span', { class: 'citations-label' }, 'From the import'));
  const list = html('ul', { class: 'identity-rows' });
  for (const [lang, title] of titles) {
    const row = html('li', {});
    row.append(html('span', { class: 'lang' }, lang), html('span', { class: 'title' }, title));
    list.appendChild(row);
  }
  if (count !== null) {
    list.appendChild(html('li', { class: 'muted' }, `${count} language edition${count === 1 ? '' : 's'} have an article`));
  }
  wrap.appendChild(list);
  wrap.appendChild(html('p', { class: 'hint' }, 'Read-only: written by the Wikidata import, and corrected there rather than here.'));
  return wrap;
}

// record: the file as it is on disk. onChange is called after every edit,
// with the validation result, so the page can enable or disable Save.
export function createEditor({
  record, topology, schemas, onChange = () => {}, reviewer = () => ({ name: '' }), today = null,
  prepared = null, pickers = null, searchEntries = null, universe = null,
}) {
  // Built once per editor, or handed in by the dashboard so that opening
  // one record after another does not rebuild the atlas's half each time.
  const own = prepared ?? preparedFor(topology, schemas);
  // Since I4b the dashboard draws its queue out of the review shards and the
  // record out of the core, while the corpus itself is still arriving a century
  // at a time; `universe()` answers `null` until the last shard is in
  // (i4-brief, A2). It is asked on every refresh, so an editor opened before
  // then starts reporting the moment the corpus is whole — and until then it
  // says so rather than warning about things the CLI does not.
  const universeOf = universe ?? (() => own);
  const index = pickers ?? pickerIndex({ topology, entries: searchEntries });
  const kind = record.kind;
  const values = valuesFromRecord(kind, record);
  const fields = new Map();
  const previews = [];
  // The ids the topology holds, by kind, built once: the preview is redrawn
  // on every keystroke and cannot walk a thousand records each time.
  const idCache = new Map();
  const KIND_LIST = Object.freeze({ event: 'events', actor: 'actors', place: 'places', source: 'sources' });
  const idsOfKind = (k) => {
    if (!idCache.has(k)) idCache.set(k, new Set((topology[KIND_LIST[k]] ?? []).map((r) => r.id)));
    return idCache.get(k);
  };
  // The record the save starts from. Only its `review` block ever differs
  // from what was opened: the body is always what is in the inputs, so a tick
  // and an edit cannot drift apart.
  let opened = record;

  const root = html('form', { class: `editor entry ${kind}`, autocomplete: 'off' });
  root.addEventListener('submit', (event) => event.preventDefault());
  const recordErrors = html('ul', { class: 'entry-errors', hidden: 'hidden' });
  root.appendChild(recordErrors);
  // Beside the rule output, and where it would be: what the editor says while
  // the corpus is still on its way (attributes.js, LOADING_CORPUS).
  const loadingEl = html('p', { class: 'muted corpus-loading', role: 'status', hidden: 'hidden' }, LOADING_CORPUS);
  root.appendChild(loadingEl);

  let sequence = 0;
  const uid = (key) => `edit-${kind}-${key}-${(sequence += 1)}`;

  // The picker for one reference, wired to whatever holds the value: a field
  // of the record, or one row of a repeatable list.
  // Every picker in this editor, so that they can all be repainted when what
  // they search changes underneath them: the dashboard draws before the search
  // shard lands and gives the index its entries afterwards (i4-brief, A2).
  const drawn = [];

  function pickerFor(name, { value, label, id: domId, onChange: chose }) {
    const picker = createPicker({
      name,
      index,
      value,
      label,
      id: domId,
      emptyLabel: name === 'places' ? 'no place: timeline only' : 'nothing chosen yet',
      onChange: chose,
    });
    drawn.push(picker);
    return picker;
  }

  function renderField(field) {
    const id = uid(field.key);
    const wrap = html('div', { class: `field field-${field.key}` });
    wrap.appendChild(html('label', { for: id }, field.required ? `${field.label} *` : field.label));

    if (field.optionsFrom && !isVocabulary(field.optionsFrom)) {
      const picker = pickerFor(field.optionsFrom, {
        value: values[field.key] ?? '',
        label: field.label,
        id,
        onChange: (chosen) => {
          values[field.key] = chosen;
          applyVisibility();
          refresh();
        },
      });
      wrap.appendChild(picker.root);
      if (field.hint) wrap.appendChild(html('p', { class: 'hint' }, field.hint));
      const pickerError = html('p', { class: 'field-error', hidden: 'hidden' });
      wrap.appendChild(pickerError);
      fields.set(field.path, { wrap, input: picker.input, picker, error: pickerError, field });
      return wrap;
    }

    let input;
    if (field.input === 'textarea') {
      input = html('textarea', { id, rows: '6' });
    } else if (field.input === 'select') {
      input = html('select', { id });
      if (field.optionsFrom) {
        for (const option of vocabularyChoices(field.optionsFrom, topology)) {
          input.appendChild(html('option', { value: option.value }, option.label));
        }
      } else {
        for (const option of field.options) {
          const label = option === '' ? (field.required ? '— choose —' : '— none —') : option;
          input.appendChild(html('option', { value: option }, label));
        }
      }
    } else {
      input = html('input', { type: 'text', id });
    }
    input.value = values[field.key] ?? '';
    // What a record is catalogued as elsewhere is not corrected by editing
    // this atlas: the identity fields are shown so a reviewer can check that
    // the item is the right one, and changed by re-running the import.
    if (field.identity) input.readOnly = true;
    input.addEventListener('input', () => {
      values[field.key] = input.value;
      applyVisibility();
      refresh();
    });
    wrap.appendChild(input);
    if (field.hint) wrap.appendChild(html('p', { class: 'hint' }, field.hint));
    // The same preview the contribution form shows, from the same renderer:
    // a reviewer editing an entry sees what a reader will see.
    if (field.body) {
      const preview = html('div', { class: 'entry-preview' });
      preview.appendChild(html('p', { class: 'preview-label' }, 'What the entry will look like'));
      const slot = html('div', { class: 'preview-slot entry' });
      preview.appendChild(slot);
      wrap.appendChild(preview);
      previews.push({ slot, field });
    }
    const error = html('p', { class: 'field-error', hidden: 'hidden' });
    wrap.appendChild(error);
    fields.set(field.path, { wrap, input, error, field });
    return wrap;
  }

  // The three repeatable lists are the same shape: a reference chosen from
  // the atlas and a bit of text beside it. `text` names the second column's
  // key, and the row is built once for all three.
  // `ordered` marks the one list whose order is part of what the record says:
  // a narrative's steps are its walk, and a step in the wrong place is a
  // different argument. Citations and actors are sets and get no controls.
  // `extraKey` is the third column, which only the actors have: the free text
  // beside the role, now that the role itself is a vocabulary. `choices` is
  // that vocabulary, and where it is given the second column is a closed
  // `<select>` and not a text box — a role outside `data/roles.json` is rule
  // 25 since M32b-1. It is given for the actor list alone: a citation's
  // locator and a narrative step's text stay free text, which is what they
  // are. An empty list (a dataset with no vocabulary, checked against
  // nothing) leaves the column free text too.
  function renderList(list, {
    optionsName, textKey, refKey, placeholder, hint, label, ordered = false,
    extraKey = null, extraPlaceholder = '', choices = [],
  }) {
    const items = () => values[list.key];
    const wrap = html('div', { class: 'field list' });
    const head = html('div', { class: 'citations-head' });
    head.appendChild(html('span', { class: 'citations-label' }, label));
    const add = html('button', { type: 'button', class: 'link small' }, 'add');
    head.appendChild(add);
    wrap.appendChild(head);
    if (hint) wrap.appendChild(html('p', { class: 'hint' }, hint));
    const rows = html('ul', { class: 'citation-rows' });
    wrap.appendChild(rows);
    const error = html('p', { class: 'field-error', hidden: 'hidden' });
    wrap.appendChild(error);

    const addRowFor = (item) => {
      const row = html('li', { class: 'citation-row' });
      // A reference the atlas no longer has — a retracted source, an event
      // that became a tombstone — is shown as the id it is, said to be gone,
      // and left alone: the picker never silently chooses something else.
      const picker = pickerFor(optionsName, {
        value: item[refKey] ?? '',
        label,
        onChange: (chosen) => {
          item[refKey] = chosen;
          refresh();
        },
      });
      // The option's label goes in with `textContent` and its title with
      // `setAttribute`, so record text is safe without `esc()`, which is for
      // markup built as strings (src/util/dom.js, amendment A8).
      let text;
      if (choices.length) {
        text = html('select', { 'aria-label': `${label} text` });
        for (const choice of roleOptionsFor(choices, item[textKey])) {
          text.appendChild(html('option', { value: choice.value, title: choice.title || null }, choice.label));
        }
      } else if (textKey === 'text') {
        text = html('textarea', { rows: '3', placeholder, 'aria-label': `${label} text` });
      } else {
        text = html('input', { type: 'text', placeholder, 'aria-label': `${label} text` });
      }
      text.value = item[textKey] ?? '';
      text.addEventListener(choices.length ? 'change' : 'input', () => {
        item[textKey] = text.value;
        refresh();
      });
      const extra = extraKey
        ? html('input', { type: 'text', placeholder: extraPlaceholder, 'aria-label': `${label} note` })
        : null;
      if (extra) {
        extra.value = item[extraKey] ?? '';
        extra.addEventListener('input', () => {
          item[extraKey] = extra.value;
          refresh();
        });
      }
      const drop = html('button', { type: 'button', class: 'link small' }, 'remove');
      drop.addEventListener('click', () => {
        const at = values[list.key].indexOf(item);
        if (at >= 0) values[list.key].splice(at, 1);
        row.remove();
        if (ordered) refreshAll(rows, items);
        refresh();
      });
      row.append(picker.root, text);
      if (extra) row.appendChild(extra);
      if (ordered) row.appendChild(reorderControls({ rows, row, item, items, onMove: refresh }));
      row.appendChild(drop);
      rows.appendChild(row);
      if (ordered) refreshAll(rows, items);
    };

    add.addEventListener('click', () => {
      const item = { [refKey]: '', [textKey]: '', ...(extraKey ? { [extraKey]: '' } : {}) };
      values[list.key].push(item);
      addRowFor(item);
      refresh();
    });
    for (const item of values[list.key]) addRowFor(item);
    fields.set(list.path, { wrap, input: null, error, field: list });
    return wrap;
  }

  function applyVisibility() {
    for (const [, view] of fields) if (view.field.when) view.wrap.hidden = !view.field.when(values);
  }

  for (const field of FIELDS[kind]) root.appendChild(renderField(field));
  const identity = identityBlock(record);
  if (identity) root.appendChild(identity);
  for (const list of ACTOR_LISTS[kind]) {
    root.appendChild(renderList(list, {
      optionsName: 'actors', refKey: 'actor', textKey: 'role', label: list.label,
      placeholder: 'role: leader, signatory, deposed',
      extraKey: 'note', extraPlaceholder: 'note: what the role cannot say',
      choices: roleChoices(topology),
      hint: 'The actors of this event and what each did in it — not everyone alive at the time. The role comes from the atlas\'s list; the note beside it is the reviewer\'s own.',
    }));
  }
  for (const list of STEP_LISTS[kind]) {
    root.appendChild(renderList(list, {
      optionsName: 'records', refKey: 'ref', textKey: 'text', label: `${list.label} *`,
      placeholder: 'why this step follows', ordered: true,
      hint: 'At least two, in the order they are read — ↑ and ↓ move a step, and so does Alt with an arrow from anywhere in the row. The records walked are not changed by walking them.',
    }));
  }
  for (const list of CITATION_LISTS[kind]) {
    root.appendChild(renderList(list, {
      optionsName: 'sources', refKey: 'source', textKey: 'locator', label: `${list.label} *`,
      placeholder: 'locator: ch. 2, p. 41',
    }));
  }

  // Whether each source says what this record says it says. One line per
  // source the record rests on, with a way to the work itself, and a box that
  // records who checked it and when. A flag, never a gate: nothing here
  // disables Save or Sign, and a citation nobody has opened is counted rather
  // than forbidden.
  const verifyBox = CITATION_LISTS[kind].length ? html('div', { class: 'field verify' }) : null;
  const verifyRows = verifyBox ? html('ul', { class: 'verify-rows' }) : null;
  const verifyNote = verifyBox ? html('p', { class: 'hint' }) : null;
  if (verifyBox) {
    verifyBox.appendChild(html('span', { class: 'citations-label' }, 'Checked against the source'));
    verifyBox.append(verifyRows, verifyNote);
    root.appendChild(verifyBox);
  }

  function sourceOf(id) {
    return (topology.sources ?? []).find((s) => s.id === id) ?? null;
  }

  function paintVerify() {
    if (!verifyBox) return;
    const rows = citationRows(current());
    verifyRows.textContent = '';
    verifyBox.hidden = rows.length === 0;
    const open = rows.filter((row) => row.verified === null).length;
    verifyNote.textContent = open === 0
      ? 'Every source this record names has been opened and checked.'
      : `${open} of ${rows.length} not opened yet. Sign warns about them; it does not stop you.`;
    for (const row of rows) {
      const item = html('li', { class: `verify-row${row.verified ? ' done' : ''}` });
      const box = html('input', { type: 'checkbox', id: uid(`verify-${row.source}`) });
      box.checked = Boolean(row.verified);
      // A tick has to say who ticked it: without a name there is nothing to
      // record, so the box waits for the reviewer's name to be typed.
      box.disabled = String(reviewer()?.name ?? '').trim() === '';
      box.addEventListener('change', () => {
        const now = current();
        opened = withReview(box.checked
          ? setVerified(now, row.source, reviewer(), { today })
          : clearVerified(now, row.source));
        refresh();
      });
      const source = sourceOf(row.source);
      const label = html('label', { for: box.id }, source ? citationText(source) : row.source);
      item.append(box, label);
      for (const { label: text, href } of source ? identifiers(source) : []) {
        item.appendChild(href
          ? html('a', { href, rel: 'noopener', target: '_blank', class: 'identifier' }, text)
          : html('span', { class: 'identifier muted' }, text));
      }
      if (row.verified) {
        item.appendChild(html('span', { class: 'muted' }, `${row.verified.by}, ${row.verified.on}`));
      }
      verifyRows.appendChild(item);
    }
  }

  // The record as the file would be after this edit: the envelope from disk,
  // the body from the inputs.
  function current() {
    return applyValues(kind, opened, values);
  }

  // A tick is a statement about the review, not about the record's body, so
  // it changes the review block and nothing else.
  function withReview(next) {
    const out = { ...record };
    if (Object.hasOwn(next, 'review')) out.review = next.review;
    else delete out.review;
    return out;
  }

  // Validation is the same validateBundle() the contribution form runs, so
  // the server refuses nothing the dashboard called fine — and, because the
  // record under edit shadows its own entry in the topology, an edge that
  // already exists is judged as the atlas would be after the save, not as a
  // duplicate of itself.
  // The entry as a reader will see it, checked against the citation rows as
  // they stand: a mark whose source the reviewer has just removed is marked
  // here before the validator says the same thing at /body.
  function drawPreviews() {
    if (previews.length === 0) return;
    const cited = new Set((values.citations ?? []).map((c) => c?.source).filter(Boolean));
    const known = (k, id) => idsOfKind(k).has(id);
    for (const { slot, field } of previews) {
      slot.innerHTML = previewHtml(values[field.key], { cited, known });
    }
  }

  function refresh() {
    const edited = current();
    const reuse = universeOf();

    recordErrors.textContent = '';
    recordErrors.hidden = true;
    for (const [, view] of fields) {
      view.error.textContent = '';
      view.error.hidden = true;
      view.wrap.classList.remove('has-error');
    }

    // The corpus is still arriving, so nothing is judged: rule 21 reads every
    // record's `wikidata` and the interval rules read other records' `when`,
    // and both of those come with the shards. What goes where the verdict
    // would be is the one line saying so, and a save hangs on the empty
    // result exactly as it hangs on a failing one (i4-brief, A2).
    if (reuse === null) {
      loadingEl.hidden = false;
      const waiting = { errors: [], warnings: [], ok: false };
      paintVerify();
      drawPreviews();
      onChange({ record: edited, result: waiting });
      return { record: edited, result: waiting };
    }
    loadingEl.hidden = true;

    const result = validateBundle({ schema: 1, records: [edited] }, topology, schemas, reuse);
    for (const error of result.errors) {
      const view = claim(fields, error.path);
      if (view && !view.wrap.hidden) {
        const text = messageOf(error, view);
        view.error.textContent = view.error.textContent ? `${view.error.textContent} ${text}` : text;
        view.error.hidden = false;
        view.wrap.classList.add('has-error');
      } else {
        recordErrors.appendChild(html('li', {}, `[rule ${error.rule}] ${error.message}`));
        recordErrors.hidden = false;
      }
    }
    paintVerify();
    drawPreviews();
    onChange({ record: edited, result });
    return { record: edited, result };
  }

  applyVisibility();
  const first = refresh();

  return {
    root,
    kind,
    id: record.id,
    values,
    current,
    refresh,
    // Every reference's label again, on an index that has changed underneath
    // it: a record opened before the search shard landed wrote its labels out
    // of an index that could not name anything yet (picker.js, `set`).
    repaintPickers() {
      for (const picker of drawn) picker.set(picker.value());
    },
    paintVerify,
    result: first.result,
    focus() {
      root.querySelector('input, textarea, select')?.focus();
    },
  };
}
