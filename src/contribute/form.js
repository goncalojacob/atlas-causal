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
  FIELDS, CITATION_LISTS, ACTOR_LISTS, emptyValues, buildBundle, slugify, findSimilar, validateBundle,
} from './bundle.js';
import { submitBundle } from './submit.js';

const KIND_LABEL = Object.freeze({
  event: 'Event', edge: 'Edge', source: 'Source', actor: 'Actor', place: 'Place', relation: 'Relation',
});
const KIND_HINT = Object.freeze({
  event: 'One point in space and time, or a long process with an interval and no place.',
  edge: 'One causal link, with the argument for it. The id is derived: from, to and type.',
  source: 'A bibliography entry, cited by reference. Fifty records citing the same book cite one file.',
  actor: 'A person, polity, institution or people. Actors are reached through their events, never listed on their own.',
  place: 'Somewhere events happen, with its own coordinates. A place is a geographic fact, so it needs no source — the events that point at it still do.',
  relation: 'A dated link between two actors — a regime of a state, a member of a party, who led a body. The id is derived: from, to and type.',
});

// The field whose text suggests the id, per kind. An actor's and a place's
// display name is the first of its semicolon-separated names.
const TITLE_KEY = Object.freeze({ event: 'title', actor: 'names', place: 'names' });

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
function messageOf(error, view) {
  if (view?.field?.required && view.input && view.input.value.trim() === '') return 'required';
  const deeper = (error.alternatives ?? []).find((alt) => alt.some((e) => (e.path ?? '').length > (error.path ?? '').length));
  if (deeper) return deeper.map((e) => e.message).join('; ');
  return error.message;
}

export function createForm(container, { topology, schemas, template, fixtures = false } = {}) {
  const entries = [];
  const dynamic = new Set();
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
  for (const kind of ['source', 'event', 'edge', 'actor', 'place', 'relation']) {
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

  // --- options that depend on what exists --------------------------------
  function eventChoices() {
    const seen = new Map();
    for (const e of topology.events ?? []) if (e.status === 'active') seen.set(e.id, e.title ?? e.id);
    for (const entry of entries) {
      if (entry.kind !== 'event') continue;
      const id = (entry.values.id ?? '').trim();
      if (id) seen.set(id, `${entry.values.title || id} — in this bundle`);
    }
    return [...seen].sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0)).map(([value, label]) => ({ value, label }));
  }

  function sourceChoices() {
    const seen = new Map();
    for (const s of topology.sources ?? []) if (s.status === 'active') seen.set(s.id, `${s.id} — ${s.title ?? ''}`);
    for (const entry of entries) {
      if (entry.kind !== 'source') continue;
      const id = (entry.values.id ?? '').trim();
      if (id) seen.set(id, `${id} — in this bundle`);
    }
    return [...seen].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([value, label]) => ({ value, label }));
  }

  function actorChoices() {
    const seen = new Map();
    for (const a of topology.actors ?? []) if (a.status === 'active') seen.set(a.id, `${a.name ?? a.id} — ${a.actorType ?? ''}`);
    for (const entry of entries) {
      if (entry.kind !== 'actor') continue;
      const id = (entry.values.id ?? '').trim();
      if (id) seen.set(id, `${(entry.values.names ?? '').split(';')[0].trim() || id} — in this bundle`);
    }
    return [...seen].sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0)).map(([value, label]) => ({ value, label }));
  }

  function placeChoices() {
    const seen = new Map();
    for (const p of topology.places ?? []) if (p.status === 'active') seen.set(p.id, p.name ?? p.id);
    for (const entry of entries) {
      if (entry.kind !== 'place') continue;
      const id = (entry.values.id ?? '').trim();
      if (id) seen.set(id, `${(entry.values.names ?? '').split(';')[0].trim() || id} — in this bundle`);
    }
    return [...seen].sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0)).map(([value, label]) => ({ value, label }));
  }

  function regionChoices() {
    return (topology.regions ?? []).map((r) => ({ value: r.id, label: r.label ?? r.id }));
  }

  function optionsFor(name) {
    if (name === 'events') return [{ value: '', label: '— choose an event —' }, ...eventChoices()];
    if (name === 'sources') return [{ value: '', label: '— choose a source —' }, ...sourceChoices()];
    if (name === 'regions') return [{ value: '', label: '— derived from the place —' }, ...regionChoices()];
    if (name === 'actors') return [{ value: '', label: '— choose an actor —' }, ...actorChoices()];
    if (name === 'places') return [{ value: '', label: '— no place: timeline only —' }, ...placeChoices()];
    return [];
  }

  function fill(select, name) {
    const chosen = select.value;
    select.textContent = '';
    for (const option of optionsFor(name)) {
      select.appendChild(html('option', { value: option.value }, option.label));
    }
    select.value = chosen;
    // The chosen id disappeared (its entry was removed or renamed): say so
    // rather than silently selecting something else.
    if (select.value !== chosen) {
      select.appendChild(html('option', { value: chosen }, `${chosen} — no longer in the bundle`));
      select.value = chosen;
    }
  }

  function refreshOptions() {
    for (const { select, name } of dynamic) fill(select, name);
  }

  // --- entries -----------------------------------------------------------
  function addEntry(kind, values = emptyValues(kind)) {
    sequence += 1;
    const entry = { key: `e${sequence}`, kind, values, idTouched: false, acknowledged: false, fields: new Map() };
    entries.push(entry);
    entriesEl.appendChild(renderEntry(entry));
    refreshOptions();
    return entry;
  }

  function removeEntry(entry) {
    const at = entries.indexOf(entry);
    if (at >= 0) entries.splice(at, 1);
    for (const d of [...dynamic]) if (entry.node.contains(d.select)) dynamic.delete(d);
    entry.node.remove();
    refreshOptions();
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

    if (entry.kind === 'event') {
      entry.similarEl = html('div', { class: 'similar', hidden: 'hidden' });
      node.appendChild(entry.similarEl);
    }

    for (const field of FIELDS[entry.kind]) node.appendChild(renderField(entry, field));
    for (const list of ACTOR_LISTS[entry.kind]) node.appendChild(renderActors(entry, list));
    for (const list of CITATION_LISTS[entry.kind]) node.appendChild(renderCitations(entry, list));
    applyVisibility(entry);
    return node;
  }

  function renderField(entry, field) {
    const id = `${entry.key}-${field.key}`;
    const wrap = html('div', { class: `field field-${field.key}` });
    wrap.appendChild(html('label', { for: id }, field.required ? `${field.label} *` : field.label));

    let input;
    if (field.input === 'textarea') {
      input = html('textarea', { id, rows: '4' });
    } else if (field.input === 'select') {
      input = html('select', { id });
      if (field.optionsFrom) {
        dynamic.add({ select: input, name: field.optionsFrom });
        fill(input, field.optionsFrom);
      } else {
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
      if (field.key === 'id') entry.idTouched = true;
      if (field.key === TITLE_KEY[entry.kind] && !entry.idTouched) {
        entry.values.id = slugify(input.value.split(';')[0]);
        const idInput = entry.fields.get('/id')?.input;
        if (idInput) idInput.value = entry.values.id;
      }
      applyVisibility(entry);
      refreshOptions();
      refresh();
    });
    wrap.appendChild(input);
    if (field.hint) wrap.appendChild(html('p', { class: 'hint' }, field.hint));
    const error = html('p', { class: 'field-error', hidden: 'hidden' });
    wrap.appendChild(error);
    entry.fields.set(field.path, { wrap, input, error, field });
    return wrap;
  }

  // The actors of an event: a repeatable row of an actor and the role it
  // played. The select is the search the brief asks for — it lists every
  // active actor in the atlas and every actor in this bundle, by name.
  function renderActors(entry, list) {
    const wrap = html('div', { class: 'field actors' });
    const head = html('div', { class: 'citations-head' });
    head.appendChild(html('span', { class: 'citations-label' }, list.label));
    const add = html('button', { type: 'button', class: 'link small' }, 'add');
    head.appendChild(add);
    wrap.appendChild(head);
    wrap.appendChild(html('p', { class: 'hint' }, 'The actors of this event and what each did in it — not everyone alive at the time.'));
    const rows = html('ul', { class: 'citation-rows' });
    wrap.appendChild(rows);
    const error = html('p', { class: 'field-error', hidden: 'hidden' });
    wrap.appendChild(error);

    const addRowFor = (item) => {
      const row = html('li', { class: 'citation-row' });
      const select = html('select', { 'aria-label': 'Actor' });
      dynamic.add({ select, name: 'actors' });
      fill(select, 'actors');
      select.value = item.actor ?? '';
      select.addEventListener('input', () => {
        item.actor = select.value;
        refresh();
      });
      const role = html('input', { type: 'text', placeholder: 'role: leader, signatory, deposed', 'aria-label': 'Role' });
      role.value = item.role ?? '';
      role.addEventListener('input', () => {
        item.role = role.value;
        refresh();
      });
      const drop = html('button', { type: 'button', class: 'link small' }, 'remove');
      drop.addEventListener('click', () => {
        const at = entry.values[list.key].indexOf(item);
        if (at >= 0) entry.values[list.key].splice(at, 1);
        for (const d of [...dynamic]) if (d.select === select) dynamic.delete(d);
        row.remove();
        refresh();
      });
      row.append(select, role, drop);
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
      const select = html('select', { 'aria-label': 'Source' });
      dynamic.add({ select, name: 'sources' });
      fill(select, 'sources');
      select.value = citation.source ?? '';
      select.addEventListener('input', () => {
        citation.source = select.value;
        refresh();
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
        for (const d of [...dynamic]) if (d.select === select) dynamic.delete(d);
        row.remove();
        refresh();
      });
      row.append(select, locator, drop);
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
  function candidates(entry) {
    const list = (topology.events ?? []).map((e) => ({ id: e.id, title: e.title, aliases: e.aliases ?? [] }));
    for (const other of entries) {
      if (other === entry || other.kind !== 'event') continue;
      if ((other.values.id ?? '').trim()) list.push({ id: other.values.id.trim(), title: other.values.title, aliases: [] });
    }
    return list;
  }

  function paintSimilar(entry) {
    if (entry.kind !== 'event') return true;
    const hits = findSimilar(entry.values.title || entry.values.id, candidates(entry));
    entry.similarEl.textContent = '';
    entry.similarEl.hidden = hits.length === 0;
    if (!hits.length) {
      entry.acknowledged = false;
      return true;
    }
    entry.similarEl.appendChild(html('p', {}, 'Records with a similar name already exist. Adding a second record for the same thing is the one mistake nothing downstream can undo:'));
    const ul = html('ul', {});
    for (const hit of hits) {
      ul.appendChild(html('li', {}, `${hit.title || hit.id} (${hit.id})${hit.matched && hit.matched !== hit.title ? ` — matched on “${hit.matched}”` : ''}`));
    }
    entry.similarEl.appendChild(ul);
    const label = html('label', { class: 'acknowledge' });
    const box = html('input', { type: 'checkbox' });
    box.checked = entry.acknowledged;
    box.addEventListener('input', () => {
      entry.acknowledged = box.checked;
      refresh();
    });
    label.append(box, document.createTextNode(' I looked: this is a different event from the ones above.'));
    entry.similarEl.appendChild(label);
    return entry.acknowledged;
  }

  // --- validation and painting -------------------------------------------
  function currentBundle() {
    return buildBundle(entries.map((e) => ({ kind: e.kind, values: e.values })), { author: state.author, today: today() });
  }

  function refresh() {
    const bundle = currentBundle();
    const result = validateBundle(bundle, topology, schemas);
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

    let acknowledged = true;
    for (const entry of entries) acknowledged = paintSimilar(entry) && acknowledged;

    reportEl.textContent = '';
    if (loose.length) {
      const ul = html('ul', { class: 'entry-errors' });
      for (const message of loose) ul.appendChild(html('li', {}, message));
      reportEl.appendChild(ul);
    }
    for (const warning of result.warnings) {
      reportEl.appendChild(html('p', { class: 'warning' }, `warning — ${warning.id ?? ''}: ${warning.message}`));
    }
    const count = result.errors.length;
    reportEl.appendChild(html('p', { class: count ? 'summary bad' : 'summary good' },
      entries.length === 0 ? 'Add a source, then the event it supports.'
        : count === 0 ? 'The bundle validates against the records already in the atlas.'
          : `${count} problem${count === 1 ? '' : 's'} to fix before this can be filed.`));

    previewEl.textContent = JSON.stringify(bundle, null, 2);
    const ready = result.ok && acknowledged;
    submitButton.disabled = !ready;
    submitNote.textContent = ready
      ? 'The bundle is copied to your clipboard and the issue opens with it filled in. A person reads it before anything is merged.'
      : !acknowledged && count === 0 ? 'Confirm the near-matches above first.' : '';
    return { bundle, result, ready };
  }

  async function submit() {
    const { bundle, ready } = refresh();
    if (!ready) return;
    const outcome = await submitBundle(bundle, { template });
    submitNote.textContent = [
      outcome.copied ? 'Copied to your clipboard.' : 'Could not reach the clipboard — copy the bundle from the box above.',
      outcome.prefilled
        ? 'The issue opened with the bundle filled in; tick the licence box and file it.'
        : `The bundle is ${outcome.bytes} encoded bytes, too long for a URL: paste it into the issue that just opened.`,
    ].join(' ');
  }

  addEntry('source');
  addEntry('event');
  refresh();
  if (fixtures) root.classList.add('fixtures');

  return { root, entries, addEntry, refresh, currentBundle };
}
