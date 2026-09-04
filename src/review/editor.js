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
import {
  FIELDS, CITATION_LISTS, ACTOR_LISTS, STEP_LISTS, valuesFromRecord, applyValues, validateBundle,
} from '../contribute/bundle.js';
import { identifiers, citationText } from '../citation.js';
import { citationRows, setVerified, clearVerified } from './citations.js';
import { previewHtml } from '../entry/preview.js';

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

// A blank required field says "required" rather than repeating the schema's
// "none of the alternatives matched", which is true and useless.
export function messageOf(error, view) {
  if (view?.field?.required && view.input && view.input.value.trim() === '') return 'required';
  const deeper = (error.alternatives ?? []).find((alt) => alt.some((e) => (e.path ?? '').length > (error.path ?? '').length));
  if (deeper) return deeper.map((e) => e.message).join('; ');
  return error.message;
}

// The lists a select offers, out of the topology alone. The form has to add
// what is in the bundle being written; here everything a reference may point
// at is already in the atlas.
export function choicesFrom(topology) {
  const active = (list) => (list ?? []).filter((r) => r?.status === 'active');
  const byLabel = (a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0);
  const titleOf = (id) => (topology.events ?? []).find((e) => e.id === id)?.title ?? id;

  const events = () => active(topology.events).map((e) => ({ value: e.id, label: e.title ?? e.id })).sort(byLabel);
  const records = () => [
    ...events(),
    ...active(topology.edges).map((e) => ({ value: e.id, label: `${titleOf(e.from)} — ${e.type} → ${titleOf(e.to)}` })),
  ];

  return (name) => {
    if (name === 'events') return [{ value: '', label: '— choose an event —' }, ...events()];
    if (name === 'records') return [{ value: '', label: '— choose an event or a link —' }, ...records()];
    if (name === 'sources') {
      return [{ value: '', label: '— choose a source —' },
        ...active(topology.sources).map((s) => ({ value: s.id, label: `${s.id} — ${s.title ?? ''}` })).sort((a, b) => (a.value < b.value ? -1 : 1))];
    }
    if (name === 'actors') {
      return [{ value: '', label: '— choose an actor —' },
        ...active(topology.actors).map((a) => ({ value: a.id, label: `${a.name ?? a.id} — ${a.actorType ?? ''}` })).sort(byLabel)];
    }
    if (name === 'places') {
      return [{ value: '', label: '— no place: timeline only —' },
        ...active(topology.places).map((p) => ({ value: p.id, label: p.name ?? p.id })).sort(byLabel)];
    }
    if (name === 'regions') {
      return [{ value: '', label: '— derived from the place —' },
        ...(topology.regions ?? []).map((r) => ({ value: r.id, label: r.label ?? r.id }))];
    }
    return [];
  };
}

// What the import wrote about this record's identity, shown and not offered
// for editing: the article titles and how many language editions have one.
// A reviewer's job here is to see whether the item is the right one — a
// wrong title is corrected on Wikidata and re-imported, never typed in.
// Returns null when the record claims nothing, so a record the import has
// not touched looks exactly as it did before.
export function identityBlock(record) {
  const titles = record?.wikipedia && typeof record.wikipedia === 'object' ? Object.entries(record.wikipedia) : [];
  const count = Number.isInteger(record?.sitelinks) ? record.sitelinks : null;
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
}) {
  const kind = record.kind;
  const values = valuesFromRecord(kind, record);
  const fields = new Map();
  const previews = [];
  const optionsFor = choicesFrom(topology);
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

  let sequence = 0;
  const uid = (key) => `edit-${kind}-${key}-${(sequence += 1)}`;

  function fill(select, name) {
    const chosen = select.value;
    select.textContent = '';
    for (const option of optionsFor(name)) select.appendChild(html('option', { value: option.value }, option.label));
    select.value = chosen;
    // The id on the record is not among the choices — it points at something
    // retracted, or at nothing. Say so rather than silently choosing another.
    if (select.value !== chosen && chosen !== '') {
      select.appendChild(html('option', { value: chosen }, `${chosen} — not an active record`));
      select.value = chosen;
    }
  }

  function renderField(field) {
    const id = uid(field.key);
    const wrap = html('div', { class: `field field-${field.key}` });
    wrap.appendChild(html('label', { for: id }, field.required ? `${field.label} *` : field.label));

    let input;
    if (field.input === 'textarea') {
      input = html('textarea', { id, rows: '6' });
    } else if (field.input === 'select') {
      input = html('select', { id });
      if (field.optionsFrom) fill(input, field.optionsFrom);
      else {
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
  function renderList(list, { optionsName, textKey, refKey, placeholder, hint, label }) {
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
      const select = html('select', { 'aria-label': label });
      fill(select, optionsName);
      select.value = item[refKey] ?? '';
      // The value may not be among the options (a retracted reference): fill
      // again so the row says so instead of showing the first choice.
      if (select.value !== (item[refKey] ?? '')) fill(select, optionsName);
      select.addEventListener('input', () => {
        item[refKey] = select.value;
        refresh();
      });
      const text = textKey === 'text'
        ? html('textarea', { rows: '3', placeholder, 'aria-label': `${label} text` })
        : html('input', { type: 'text', placeholder, 'aria-label': `${label} text` });
      text.value = item[textKey] ?? '';
      text.addEventListener('input', () => {
        item[textKey] = text.value;
        refresh();
      });
      const drop = html('button', { type: 'button', class: 'link small' }, 'remove');
      drop.addEventListener('click', () => {
        const at = values[list.key].indexOf(item);
        if (at >= 0) values[list.key].splice(at, 1);
        row.remove();
        refresh();
      });
      row.append(select, text, drop);
      rows.appendChild(row);
    };

    add.addEventListener('click', () => {
      const item = { [refKey]: '', [textKey]: '' };
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
      hint: 'The actors of this event and what each did in it — not everyone alive at the time.',
    }));
  }
  for (const list of STEP_LISTS[kind]) {
    root.appendChild(renderList(list, {
      optionsName: 'records', refKey: 'ref', textKey: 'text', label: `${list.label} *`,
      placeholder: 'why this step follows',
      hint: 'At least two, in the order they are read. The records walked are not changed by walking them.',
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
    const result = validateBundle({ schema: 1, records: [edited] }, topology, schemas);

    recordErrors.textContent = '';
    recordErrors.hidden = true;
    for (const [, view] of fields) {
      view.error.textContent = '';
      view.error.hidden = true;
      view.wrap.classList.remove('has-error');
    }
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
    paintVerify,
    result: first.result,
    focus() {
      root.querySelector('input, textarea, select')?.focus();
    },
  };
}
