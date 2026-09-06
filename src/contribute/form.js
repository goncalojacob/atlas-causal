// The contribution form: inputs → bundle → validation against the loaded
// topology → clipboard and issue. The DOM half; bundle.js holds everything
// pure and submit.js everything that knows about GitHub.
//
// Two things this form refuses to do quietly. It will not offer submission
// while validate() reports an error, because the Action would reject exactly
// what the form called fine (docs/review-2026-09-01.md, finding 14). And it
// searches existing titles, ids and former ids before accepting a new event,
// because transliteration makes duplicate slugs a certainty (finding 5): the
// near-matches have to be acknowledged, not merely displayed.

import { html } from '../util/dom.js';
import {
  FIELDS, CITATION_LISTS, ACTOR_LISTS, STEP_LISTS, emptyValues, buildBundle, slugify,
  comparableOf, findDuplicates, NO_DUPLICATES, validateBundle, preparedFor,
  isVocabulary, vocabularyChoices, roleChoices,
} from './bundle.js';
import { createPicker, pickerIndex, kindsFor } from './picker.js';
import { reorderControls, refreshAll } from './reorder.js';
import { submitBundle } from './submit.js';
import { previewHtml } from '../entry/preview.js';
import { byKind, CONTRIBUTED_KINDS } from '../kinds.js';

// What each kind is called and the sentence under it, and the field whose
// text suggests an id: the registry's, so a kind arrives with its name, its
// explanation and its fields together (kinds.js).
const KIND_LABEL = byKind('label');
const KIND_HINT = byKind('hint');
const TITLE_KEY = byKind('titleKey');

let sequence = 0;

function today() {
  return new Date().toISOString().slice(0, 10);
}

// The error at /where/lon belongs to the longitude input; the one at
// /sources/0/source to the citation list. Walk up the path until a field
// claims it, and let the entry keep whatever nothing claims (rules 4 and 5
// report on the record as a whole, with no path at all).
function claim(fields, path) {
  let p = path ?? '';
  for (;;) {
    if (fields.has(p)) return fields.get(p);
    const cut = p.lastIndexOf('/');
    if (cut < 0) break;
    p = p.slice(0, cut);
  }
  // An error on a subtree — /dispute, when the whole block fails its oneOf —
  // belongs to the first input inside it.
  if (path) for (const [key, view] of fields) if (key.startsWith(`${path}/`)) return view;
  return null;
}

// A blank required field says "required": the schema's own message for an
// empty year is that none of the alternatives matched, which is true and
// useless. Otherwise, when a oneOf failed, the alternative that got past the
// first key is the one the contributor meant, so report what it objected to.
// A picker's input holds the name that was typed, not the id that was
// chosen, so "is this field empty" is a question for the picker.
function isEmpty(view) {
  if (view?.picker) return view.picker.value() === '';
  return Boolean(view?.input) && view.input.value.trim() === '';
}

function messageOf(error, view) {
  if (view?.field?.required && isEmpty(view)) return 'required';
  const deeper = (error.alternatives ?? []).find((alt) => alt.some((e) => (e.path ?? '').length > (error.path ?? '').length));
  if (deeper) return deeper.map((e) => e.message).join('; ');
  return error.message;
}

export function createForm(container, {
  topology, schemas, template, fixtures = false, prepared = null, searchEntries = null, initial = null,
} = {}) {
  // The indexed universe and the compiled schema set, once for the life of
  // the form rather than once per keystroke (health review B, finding 27).
  const reuse = prepared ?? preparedFor(topology, schemas);
  // What every picker on the page searches, built once for the same reason.
  // `searchEntries` is the shard the build folded; without one the index
  // folds the topology itself, which is what the fixtures do.
  const pickers = pickerIndex({ topology, entries: searchEntries });
  const entries = [];
  const state = { author: '' };

  const root = html('div', { class: 'contrib' });
  const authorError = html('p', { class: 'field-error', hidden: 'hidden' });
  const entriesEl = html('div', { class: 'entries' });
  const reportEl = html('div', { class: 'report', role: 'status' });
  const previewEl = html('pre', { class: 'preview' });
  const submitButton = html('button', { type: 'button', class: 'submit', disabled: 'disabled' }, 'Copy the bundle and open the issue');
  const submitNote = html('p', { class: 'submit-note' });

  // --- about you ---------------------------------------------------------
  const authorInput = html('input', { type: 'text', id: 'contributor-name', autocomplete: 'name' });
  authorInput.addEventListener('input', () => {
    state.author = authorInput.value;
    refresh();
  });
  root.appendChild(html('fieldset', { class: 'about-you' }));
  const aboutYou = root.lastChild;
  aboutYou.appendChild(html('legend', {}, 'About you'));
  const nameField = html('div', { class: 'field' });
  nameField.appendChild(html('label', { for: 'contributor-name' }, 'Your name *'));
  nameField.appendChild(authorInput);
  nameField.appendChild(html('p', { class: 'hint' }, 'Attribution under CC BY-SA 4.0. Your GitHub account is added by the review Action from the issue you open, not from this field.'));
  nameField.appendChild(authorError);
  aboutYou.appendChild(nameField);

  root.appendChild(entriesEl);

  // --- add buttons -------------------------------------------------------
  const addRow = html('div', { class: 'add-row' });
  for (const kind of CONTRIBUTED_KINDS) {
    const button = html('button', { type: 'button' }, `Add ${kind}`);
    button.addEventListener('click', () => {
      addEntry(kind);
      refresh();
    });
    addRow.appendChild(button);
  }
  root.appendChild(addRow);

  root.appendChild(reportEl);
  const details = html('details', { class: 'bundle-preview' });
  details.appendChild(html('summary', {}, 'The bundle, as it will be filed'));
  details.appendChild(previewEl);
  root.appendChild(details);

  const submitRow = html('div', { class: 'submit-row' });
  submitButton.addEventListener('click', submit);
  submitRow.appendChild(submitButton);
  submitRow.appendChild(submitNote);
  root.appendChild(submitRow);
  container.appendChild(root);

  // --- the pickers --------------------------------------------------------
  //
  // The lane and the category are the two reference fields that stay a
  // `<select>`: closed lists, short, and nothing to type at. Everything else
  // points into a corpus and is a picker (picker.js). Which vocabulary each
  // one reads, and what its blank row says, is in bundle.js so that the
  // review editor cannot come to offer a different list.
  function vocabularySelect(select, name) {
    select.textContent = '';
    for (const option of vocabularyChoices(name, topology)) {
      select.appendChild(html('option', { value: option.value }, option.label));
    }
  }

  // The rows of this bundle a picker offers before the atlas's. A record
  // being written here has no id until its title has one, which is exactly
  // when it becomes referenceable.
  function bundleRows(name) {
    const kinds = kindsFor(name);
    const rows = [];
    for (const entry of entries) {
      if (!kinds.includes(entry.kind)) continue;
      const id = (entry.values.id ?? '').trim();
      if (!id) continue;
      const titleKey = TITLE_KEY[entry.kind];
      const written = titleKey ? String(entry.values[titleKey] ?? '').split(';')[0].trim() : '';
      rows.push({ kind: entry.kind, id, label: written || id });
    }
    return rows;
  }

  function pickerFor(name, { value, label, id: domId, onChange }) {
    return createPicker({
      name,
      index: pickers,
      value,
      label,
      id: domId,
      emptyLabel: name === 'places' ? 'no place: timeline only' : 'nothing chosen yet',
      local: () => bundleRows(name),
      onChange,
    });
  }

  // --- entries -----------------------------------------------------------
  function addEntry(kind, values = emptyValues(kind)) {
    sequence += 1;
    const entry = { key: `e${sequence}`, kind, values, idTouched: false, acknowledged: false, fields: new Map(), previews: [] };
    entries.push(entry);
    entriesEl.appendChild(renderEntry(entry));
    return entry;
  }

  function removeEntry(entry) {
    const at = entries.indexOf(entry);
    if (at >= 0) entries.splice(at, 1);
    entry.node.remove();
    refresh();
  }

  function renderEntry(entry) {
    const node = html('section', { class: `entry ${entry.kind}` });
    entry.node = node;
    const head = html('div', { class: 'entry-head' });
    head.appendChild(html('h3', {}, KIND_LABEL[entry.kind]));
    const remove = html('button', { type: 'button', class: 'link small' }, 'remove');
    remove.addEventListener('click', () => removeEntry(entry));
    head.appendChild(remove);
    node.appendChild(head);
    node.appendChild(html('p', { class: 'hint' }, KIND_HINT[entry.kind]));

    entry.errorEl = html('ul', { class: 'entry-errors', hidden: 'hidden' });
    node.appendChild(entry.errorEl);

    // Every kind that can be entered twice gets the near-match box: an actor,
    // a place and a source are as easy to duplicate as an event, and were not
    // looked for at all. An edge and a relation are their two ends and their
    // type, and a second one under that id is rule 2's to refuse.
    if (!NO_DUPLICATES.includes(entry.kind)) {
      entry.similarEl = html('div', { class: 'similar', hidden: 'hidden' });
      node.appendChild(entry.similarEl);
    }

    for (const field of FIELDS[entry.kind]) node.appendChild(renderField(entry, field));
    for (const list of ACTOR_LISTS[entry.kind]) node.appendChild(renderActors(entry, list));
    for (const list of STEP_LISTS[entry.kind]) node.appendChild(renderSteps(entry, list));
    for (const list of CITATION_LISTS[entry.kind]) node.appendChild(renderCitations(entry, list));
    applyVisibility(entry);
    return node;
  }

  function renderField(entry, field) {
    const id = `${entry.key}-${field.key}`;
    const wrap = html('div', { class: `field field-${field.key}` });
    wrap.appendChild(html('label', { for: id }, field.required ? `${field.label} *` : field.label));

    // A field that points into the atlas is a picker, and the picker's own
    // input is the field's: an error at this path still lands on something a
    // contributor can see and type into.
    if (field.optionsFrom && !isVocabulary(field.optionsFrom)) {
      const picker = pickerFor(field.optionsFrom, {
        value: entry.values[field.key] ?? '',
        label: field.label,
        id,
        onChange: (chosen) => {
          entry.values[field.key] = chosen;
          applyVisibility(entry);
          refresh();
        },
      });
      wrap.appendChild(picker.root);
      if (field.hint) wrap.appendChild(html('p', { class: 'hint' }, field.hint));
      const pickerError = html('p', { class: 'field-error', hidden: 'hidden' });
      wrap.appendChild(pickerError);
      entry.fields.set(field.path, { wrap, input: picker.input, picker, error: pickerError, field });
      return wrap;
    }

    let input;
    if (field.input === 'textarea') {
      input = html('textarea', { id, rows: '4' });
    } else if (field.input === 'select') {
      input = html('select', { id });
      if (field.optionsFrom) vocabularySelect(input, field.optionsFrom);
      else {
        for (const option of field.options) {
          const label = option === '' ? (field.required ? '— choose —' : '— none —') : option;
          input.appendChild(html('option', { value: option }, label));
        }
      }
    } else {
      input = html('input', { type: 'text', id });
    }
    input.value = entry.values[field.key] ?? '';
    input.addEventListener('input', () => {
      entry.values[field.key] = input.value;
      // A field that knows how to read what was pasted into it says so in
      // the input: the contributor pastes the Wikidata URL of an item and
      // sees the Q-number it became, rather than finding out at submit.
      if (field.derive) {
        const derived = field.derive(input.value);
        if (derived !== input.value) {
          entry.values[field.key] = derived;
          input.value = derived;
        }
      }
      if (field.key === 'id') entry.idTouched = true;
      if (field.key === TITLE_KEY[entry.kind] && !entry.idTouched) {
        entry.values.id = slugify(input.value.split(';')[0]);
        const idInput = entry.fields.get('/id')?.input;
        if (idInput) idInput.value = entry.values.id;
      }
      applyVisibility(entry);
      refresh();
    });
    wrap.appendChild(input);
    if (field.hint) wrap.appendChild(html('p', { class: 'hint' }, field.hint));
    // The long form is a syntax, small as it is, and a contributor who cannot
    // see what a citation mark or a record link did will guess. The preview
    // is redrawn by refresh(), so editing a citation row re-checks the marks.
    if (field.body) {
      const preview = html('div', { class: 'entry-preview' });
      preview.appendChild(html('p', { class: 'preview-label' }, 'What the entry will look like'));
      const slot = html('div', { class: 'preview-slot entry' });
      preview.appendChild(slot);
      wrap.appendChild(preview);
      entry.previews.push({ slot, field });
    }
    const error = html('p', { class: 'field-error', hidden: 'hidden' });
    wrap.appendChild(error);
    entry.fields.set(field.path, { wrap, input, error, field });
    return wrap;
  }

  // The actors of an event: a repeatable row of an actor and the role it
  // played. The actor is chosen with the picker, which is the search the
  // brief asks for — the atlas's actors and this bundle's, by name.
  function renderActors(entry, list) {
    const wrap = html('div', { class: 'field actors' });
    const head = html('div', { class: 'citations-head' });
    head.appendChild(html('span', { class: 'citations-label' }, list.label));
    const add = html('button', { type: 'button', class: 'link small' }, 'add');
    head.appendChild(add);
    wrap.appendChild(head);
    wrap.appendChild(html('p', { class: 'hint' }, 'The actors of this event and what each did in it — not everyone alive at the time. The role comes from the atlas\'s list; the note beside it is yours.'));
    // Offered, not enforced: a role outside the list is the warning
    // `role-unknown` until M32b applies the mapping, and a `<datalist>` on a
    // text input is exactly that — suggestions over free text, and no
    // suggestions at all where the dataset has no `data/roles.json`.
    const roles = roleChoices(topology);
    const rolesId = `${entry.key}-${list.key}-roles`;
    if (roles.length) {
      const datalist = html('datalist', { id: rolesId });
      for (const role of roles) datalist.appendChild(html('option', { value: role }));
      wrap.appendChild(datalist);
    }
    const rows = html('ul', { class: 'citation-rows' });
    wrap.appendChild(rows);
    const error = html('p', { class: 'field-error', hidden: 'hidden' });
    wrap.appendChild(error);

    const addRowFor = (item) => {
      const row = html('li', { class: 'citation-row' });
      const picker = pickerFor('actors', {
        value: item.actor ?? '',
        label: 'Actor',
        onChange: (chosen) => {
          item.actor = chosen;
          refresh();
        },
      });
      const role = html('input', {
        type: 'text', placeholder: 'role: leader, signatory, deposed', 'aria-label': 'Role', list: roles.length ? rolesId : null,
      });
      role.value = item.role ?? '';
      role.addEventListener('input', () => {
        item.role = role.value;
        refresh();
      });
      // The phrase the role cannot hold — "president under whom it was held" —
      // now that the role itself is a vocabulary (plan decision 7). Free text,
      // optional, and an empty one writes no key at all.
      const note = html('input', { type: 'text', placeholder: 'note: what the role cannot say', 'aria-label': 'Note' });
      note.value = item.note ?? '';
      note.addEventListener('input', () => {
        item.note = note.value;
        refresh();
      });
      const drop = html('button', { type: 'button', class: 'link small' }, 'remove');
      drop.addEventListener('click', () => {
        const at = entry.values[list.key].indexOf(item);
        if (at >= 0) entry.values[list.key].splice(at, 1);
        row.remove();
        refresh();
      });
      row.append(picker.root, role, note, drop);
      rows.appendChild(row);
    };

    add.addEventListener('click', () => {
      const item = { actor: '', role: '' };
      entry.values[list.key].push(item);
      addRowFor(item);
      refresh();
    });
    for (const item of entry.values[list.key]) addRowFor(item);

    entry.fields.set(list.path, { wrap, input: null, error, field: list });
    return wrap;
  }

  // The steps of a narrative, in the order of the rows: a record chosen by
  // name and the paragraph that says why this step follows. Removing a row
  // renumbers the walk, which is what a walk with a step taken out is.
  function renderSteps(entry, list) {
    // The live array, asked for rather than captured: a row's controls outlive
    // any one reference to it.
    const items = () => entry.values[list.key];
    const wrap = html('div', { class: 'field steps' });
    const head = html('div', { class: 'citations-head' });
    head.appendChild(html('span', { class: 'citations-label' }, `${list.label} *`));
    const add = html('button', { type: 'button', class: 'link small' }, 'add');
    head.appendChild(add);
    wrap.appendChild(head);
    wrap.appendChild(html('p', { class: 'hint' }, 'At least two, in the order they are read — ↑ and ↓ move a step, and so does Alt with an arrow from anywhere in the row. The text is yours; the record it points at is the atlas\'s and is not changed by walking it.'));
    const rows = html('ul', { class: 'citation-rows' });
    wrap.appendChild(rows);
    const error = html('p', { class: 'field-error', hidden: 'hidden' });
    wrap.appendChild(error);

    const addRowFor = (item) => {
      const row = html('li', { class: 'citation-row step-row' });
      const picker = pickerFor('records', {
        value: item.ref ?? '',
        label: 'Event or link',
        onChange: (chosen) => {
          item.ref = chosen;
          refresh();
        },
      });
      const text = html('textarea', { rows: '3', placeholder: 'why this step follows, in your own words', 'aria-label': 'Step text' });
      text.value = item.text ?? '';
      text.addEventListener('input', () => {
        item.text = text.value;
        refresh();
      });
      const drop = html('button', { type: 'button', class: 'link small' }, 'remove');
      drop.addEventListener('click', () => {
        const at = entry.values[list.key].indexOf(item);
        if (at >= 0) entry.values[list.key].splice(at, 1);
        row.remove();
        refreshAll(rows, items);
        refresh();
      });
      row.append(picker.root, text, reorderControls({ rows, row, item, items, onMove: refresh }), drop);
      rows.appendChild(row);
      refreshAll(rows, items);
    };

    add.addEventListener('click', () => {
      const item = { ref: '', text: '' };
      entry.values[list.key].push(item);
      addRowFor(item);
      refresh();
    });
    for (const item of entry.values[list.key]) addRowFor(item);

    entry.fields.set(list.path, { wrap, input: null, error, field: list });
    return wrap;
  }

  function renderCitations(entry, list) {
    const wrap = html('div', { class: 'field citations' });
    const head = html('div', { class: 'citations-head' });
    head.appendChild(html('span', { class: 'citations-label' }, `${list.label} *`));
    const add = html('button', { type: 'button', class: 'link small' }, 'add');
    head.appendChild(add);
    wrap.appendChild(head);
    const rows = html('ul', { class: 'citation-rows' });
    wrap.appendChild(rows);
    const error = html('p', { class: 'field-error', hidden: 'hidden' });
    wrap.appendChild(error);

    const addRowFor = (citation) => {
      const row = html('li', { class: 'citation-row' });
      const picker = pickerFor('sources', {
        value: citation.source ?? '',
        label: 'Source',
        onChange: (chosen) => {
          citation.source = chosen;
          refresh();
        },
      });
      const locator = html('input', { type: 'text', placeholder: 'locator: ch. 2, p. 41', 'aria-label': 'Locator' });
      locator.value = citation.locator ?? '';
      locator.addEventListener('input', () => {
        citation.locator = locator.value;
        refresh();
      });
      const drop = html('button', { type: 'button', class: 'link small' }, 'remove');
      drop.addEventListener('click', () => {
        const at = entry.values[list.key].indexOf(citation);
        if (at >= 0) entry.values[list.key].splice(at, 1);
        row.remove();
        refresh();
      });
      row.append(picker.root, locator, drop);
      rows.appendChild(row);
    };

    add.addEventListener('click', () => {
      const citation = { source: '', locator: '' };
      entry.values[list.key].push(citation);
      addRowFor(citation);
      refresh();
    });
    for (const citation of entry.values[list.key]) addRowFor(citation);

    entry.fields.set(list.path, { wrap, input: null, error, field: list });
    return wrap;
  }

  // Dispute fields exist only for a disputed edge (rule 8 rejects a dispute
  // block on anything else), so they are hidden rather than removed.
  function applyVisibility(entry) {
    for (const [, view] of entry.fields) {
      if (view.field.when) view.wrap.hidden = !view.field.when(entry.values);
    }
  }

  // --- duplicates --------------------------------------------------------
  // The atlas's records of this kind, and the other records of this kind in
  // the bundle: a contribution that adds Lisbon twice in one bundle is the
  // same mistake as adding it beside the one that is already there.
  function candidates(entry, built) {
    const mine = [];
    for (const [other, record] of built) {
      if (other === entry || other.kind !== entry.kind) continue;
      if ((record.id ?? '').trim()) mine.push(comparableOf(record));
    }
    return [...(reuse.comparables?.get(entry.kind) ?? []), ...mine];
  }

  function paintSimilar(entry, built) {
    if (!entry.similarEl) return true;
    const record = built.get(entry);
    const hits = findDuplicates(comparableOf(record), candidates(entry, built));
    entry.similarEl.textContent = '';
    entry.similarEl.hidden = hits.length === 0;
    if (!hits.length) {
      entry.acknowledged = false;
      return true;
    }
    // A record under an id the atlas already has is a replacement of it and
    // is said so, in those words: it is not a near-match somebody has to
    // judge (health review of 6 September, R20).
    const replaced = hits.find((hit) => hit.replaces);
    const certain = hits.some((hit) => hit.certain);
    entry.similarEl.appendChild(html('p', {}, replaced
      ? `This id already exists: filing this would replace “${replaced.label || replaced.id}”. That is what a correction is; a new ${entry.kind} needs an id of its own.`
      : certain
        ? 'A record already in the atlas carries one of the identifiers on this one. An identifier names an item, and two records for one item is the one mistake nothing downstream can undo:'
        : `${KIND_LABEL[entry.kind]} records with a similar name already exist. Adding a second record for the same thing is the one mistake nothing downstream can undo:`));
    const ul = html('ul', {});
    for (const hit of hits) {
      ul.appendChild(html('li', {}, `${hit.label || hit.id} (${hit.id}) — ${hit.why}${hit.matched && hit.matched !== hit.label ? `: “${hit.matched}”` : ''}`));
    }
    entry.similarEl.appendChild(ul);
    const label = html('label', { class: 'acknowledge' });
    const box = html('input', { type: 'checkbox' });
    box.checked = entry.acknowledged;
    box.addEventListener('input', () => {
      entry.acknowledged = box.checked;
      refresh();
    });
    label.append(box, document.createTextNode(replaced
      ? ` I mean to replace “${replaced.label || replaced.id}”: this is a correction of it.`
      : ` I looked: this is a different ${entry.kind} from the ones above.`));
    entry.similarEl.appendChild(label);
    return entry.acknowledged;
  }

  // --- validation and painting -------------------------------------------
  function currentBundle() {
    return buildBundle(entries.map((e) => ({ kind: e.kind, values: e.values })), { author: state.author, today: today() });
  }

  // The ids the topology holds, by kind, built once: a preview redrawn on
  // every keystroke cannot walk a thousand records each time.
  const idCache = new Map();
  const KIND_LIST = Object.freeze({ event: 'events', actor: 'actors', place: 'places', source: 'sources' });
  function idsOfKind(kind) {
    if (!idCache.has(kind)) {
      idCache.set(kind, new Set((topology[KIND_LIST[kind]] ?? []).map((r) => r.id)));
    }
    return idCache.get(kind);
  }

  // The entry as it will be read, under the field it is typed into. `cited`
  // is the citation rows as they stand right now, so a mark is checked
  // against what the contributor has actually cited; `known` is the topology
  // plus the records in this bundle, since a contribution may link to an
  // event it is adding in the same breath.
  function drawPreviews(entry) {
    if (entry.previews.length === 0) return;
    const cited = new Set((entry.values.citations ?? []).map((c) => c?.source).filter(Boolean));
    const inBundle = new Set(entries.map((e) => `${e.kind}:${e.values.id ?? ''}`));
    const known = (kind, id) => inBundle.has(`${kind}:${id}`) || idsOfKind(kind).has(id);
    for (const { slot, field } of entry.previews) {
      slot.innerHTML = previewHtml(entry.values[field.key], { cited, known });
    }
  }

  // The duplicate search runs a moment after the last key rather than on
  // every one of them. It reads every record of the kind being written —
  // twenty thousand of them, on the corpus this is built for — and a burst of
  // typing, a paste or a held-down key is one scan and not eight (health
  // review B, finding 6). The grace is the search box's, so the page has one
  // number and not two. Submitting forces the scan first: a control that
  // hangs on the answer cannot be pressed while the answer is in the air.
  const GRACE = 120;
  let pending = null;
  let acknowledged = true;
  let lastResult = { errors: [], warnings: [], ok: false };
  let lastCount = 0;
  let summaryEl = null;

  // The one sentence at the foot of the report, painted from both halves:
  // the validation, which is fresh, and the near-matches, which are a moment
  // behind. It never says the bundle validates while a duplicate is waiting
  // to be looked at — a stranger's "new place" under an id the atlas already
  // has was told exactly that (health review of 6 September, R20).
  function paintSummary() {
    if (!summaryEl) return;
    summaryEl.className = lastCount === 0 && acknowledged ? 'summary good' : 'summary bad';
    summaryEl.textContent = entries.length === 0 ? 'Add a source, then the event it supports.'
      : lastCount > 0 ? `${lastCount} problem${lastCount === 1 ? '' : 's'} to fix before this can be filed.`
        : acknowledged ? 'The bundle validates against the records already in the atlas.'
          : 'The records above match ones the atlas already has. Look at them before this can be filed.';
  }

  function runDuplicates() {
    if (pending !== null) {
      clearTimeout(pending);
      pending = null;
    }
    const records = currentBundle().records;
    const built = new Map(entries.map((entry, i) => [entry, records[i]]));
    let all = true;
    for (const entry of entries) all = paintSimilar(entry, built) && all;
    acknowledged = all;
    paintSummary();
  }

  function scheduleDuplicates() {
    if (pending !== null) clearTimeout(pending);
    pending = setTimeout(() => {
      pending = null;
      runDuplicates();
      paintSubmit();
    }, GRACE);
  }

  // Whether the bundle can be filed, said in the one place both halves reach:
  // the validation, which is fresh, and the near-matches, which may be a
  // moment behind.
  function paintSubmit() {
    const count = lastResult.errors.length;
    const ready = lastResult.ok && acknowledged;
    submitButton.disabled = !ready;
    submitNote.textContent = ready
      ? 'The bundle is copied to your clipboard and the issue opens with it filled in. A person reads it before anything is merged.'
      : !acknowledged && count === 0 ? 'Confirm the near-matches above first.' : '';
    return ready;
  }

  function refresh({ now = false } = {}) {
    const bundle = currentBundle();
    const result = validateBundle(bundle, topology, schemas, reuse);
    const byId = new Map();
    bundle.records.forEach((record, i) => {
      if (!byId.has(record.id)) byId.set(record.id, entries[i]);
    });

    authorError.hidden = true;
    authorError.textContent = '';
    for (const entry of entries) {
      entry.errorEl.textContent = '';
      entry.errorEl.hidden = true;
      for (const [, view] of entry.fields) {
        view.error.textContent = '';
        view.error.hidden = true;
        view.wrap.classList.remove('has-error');
      }
    }

    const loose = [];
    for (const error of result.errors) {
      const message = `[rule ${error.rule}] ${error.message}`;
      if ((error.path ?? '').startsWith('/authors')) {
        authorError.textContent = error.message;
        authorError.hidden = false;
        continue;
      }
      const entry = byId.get(error.id);
      if (!entry) {
        loose.push(message);
        continue;
      }
      const view = claim(entry.fields, error.path);
      if (view && !view.wrap.hidden) {
        const text = messageOf(error, view);
        view.error.textContent = view.error.textContent ? `${view.error.textContent} ${text}` : text;
        view.error.hidden = false;
        view.wrap.classList.add('has-error');
      } else {
        entry.errorEl.appendChild(html('li', {}, message));
        entry.errorEl.hidden = false;
      }
    }

    if (now) runDuplicates();
    else scheduleDuplicates();

    reportEl.textContent = '';
    if (loose.length) {
      const ul = html('ul', { class: 'entry-errors' });
      for (const message of loose) ul.appendChild(html('li', {}, message));
      reportEl.appendChild(ul);
    }
    for (const warning of result.warnings) {
      reportEl.appendChild(html('p', { class: 'warning' }, `warning — ${warning.id ?? ''}: ${warning.message}`));
    }
    lastCount = result.errors.length;
    summaryEl = html('p', {});
    reportEl.appendChild(summaryEl);
    paintSummary();

    for (const entry of entries) drawPreviews(entry);

    previewEl.textContent = JSON.stringify(bundle, null, 2);
    lastResult = result;
    const ready = paintSubmit();
    return { bundle, result, ready };
  }

  async function submit() {
    const { bundle, ready } = refresh({ now: true });
    if (!ready) return;
    const outcome = await submitBundle(bundle, { template });
    submitNote.textContent = [
      outcome.copied ? 'Copied to your clipboard.' : 'Could not reach the clipboard — copy the bundle from the box above.',
      outcome.prefilled
        ? 'The issue opened with the bundle filled in; tick the licence box and file it.'
        : `The bundle is ${outcome.bytes} encoded bytes, too long for a URL: paste it into the issue that just opened.`,
    ].join(' ');
  }

  // A blank form opens on the two entries a first contribution needs. One
  // opened from "Edit this record" opens on that record instead, with its
  // fields already in the inputs and its id in the box the id is typed into:
  // a correction is the record as it should read, and the shortest way to
  // write one is to start from how it reads now.
  if (initial?.length) {
    for (const { kind, values } of initial) addEntry(kind, values).idTouched = true;
  } else {
    addEntry('source');
    addEntry('event');
  }
  refresh({ now: true });
  if (fixtures) root.classList.add('fixtures');

  return { root, entries, addEntry, refresh, currentBundle };
}
