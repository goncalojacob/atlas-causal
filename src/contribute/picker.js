// The reference picker: how a contributor names a record that already exists.
//
// It replaced a `<select>` of every record in the atlas. That control was
// unusable long before it was slow — twenty thousand titles in alphabetical
// order, with no date, no place and no sign of what the record already
// connects to, is not a way to find "the 1911 election" among nine elections
// — and it was slow as well: every select on the page was refilled on every
// keystroke, 41,036 `<option>` elements at twenty thousand events and 1.16 s
// per key (health review B, finding 6; A, finding 10).
//
// So this is a typeahead over the same index the search box scans, which the
// build already folded (`data/index/search-*.json`), narrowed to the kind the
// field wants. Beside each hit it puts what tells two records of one name
// apart: the years, the place, and the degree — how much of the atlas already
// hangs on it. On a choice it says what the record is already linked to,
// which is the other half of "is this the right one".
//
// Nothing here is drawn from anything but the atlas and the bundle in hand.
// The DOM half is at the bottom; everything above it is a lookup table built
// once per page and shared by every picker on it.

import { html } from '../util/dom.js';
import { search, flatten, fold, buildSearchIndex } from '../search.js';
import { formatInterval } from '../util/dates.js';

// How many rows the list offers. The same eight the search box shows: past
// that a reader is reading rather than choosing, and the answer is to type
// another letter.
export const LIMIT = 8;

// Which kinds a field named `optionsFrom` may point at. `records` is the
// narrative step's field, which takes an event or the link between two.
const KINDS_OF = Object.freeze({
  events: ['event'],
  actors: ['actor'],
  places: ['place'],
  sources: ['source'],
  records: ['event', 'edge'],
});

export function kindsFor(name) {
  return KINDS_OF[name] ?? [];
}

const asArray = (value) => (value instanceof Map ? [...value.values()] : value ?? []);

// The atlas's half of every picker on the page, built once and lazily: a
// contribution form that walked the whole corpus on load would pay for the
// narrative-step picker on a page where nobody adds a narrative.
//
// `entries` is the search shard, when the page has it — the same array the
// search box scans, with the terms already folded. Without one the index is
// built from the topology, which is what every page did before the shard
// existed and what the fixtures still do.
export function pickerIndex({ topology = {}, entries = null } = {}) {
  const events = asArray(topology.events);
  const edges = asArray(topology.edges);

  const shard = entries ?? buildSearchIndex({
    events,
    actors: asArray(topology.actors),
    places: asArray(topology.places),
    sources: asArray(topology.sources),
  });

  // One pass, the first time anything asks: the entries by kind, the events
  // by id, and the places by id, so a row's place has a name on it.
  let byKind = null;
  function grouped() {
    if (byKind) return byKind;
    byKind = new Map();
    for (const entry of shard) {
      const list = byKind.get(entry.kind);
      if (list) list.push(entry);
      else byKind.set(entry.kind, [entry]);
    }
    return byKind;
  }

  let eventsById = null;
  const eventById = (id) => {
    if (!eventsById) eventsById = new Map(events.map((e) => [e.id, e]));
    return eventsById.get(id) ?? null;
  };

  let placeNames = null;
  const placeName = (id) => {
    if (!placeNames) {
      placeNames = new Map();
      for (const place of asArray(topology.places)) placeNames.set(place.id, place.names?.[0] ?? place.name ?? place.id);
    }
    return placeNames.get(id) ?? id;
  };

  // How much already hangs on a record: the edges that touch an event, the
  // events that name an actor or happen at a place, the records that cite a
  // source. One pass over the atlas, and only when a picker first asks.
  let degrees = null;
  function degreeTable() {
    if (degrees) return degrees;
    degrees = new Map();
    const bump = (kind, id, by = 1) => {
      if (typeof id !== 'string' || id === '') return;
      const key = `${kind}:${id}`;
      degrees.set(key, (degrees.get(key) ?? 0) + by);
    };
    for (const edge of edges) {
      if (edge.status && edge.status !== 'active') continue;
      bump('event', edge.from);
      bump('event', edge.to);
    }
    for (const event of events) {
      if (event.status && event.status !== 'active') continue;
      bump('place', event.place);
      for (const a of event.actors ?? []) bump('actor', a?.actor);
    }
    for (const source of asArray(topology.sources)) {
      bump('source', source.id, source.citationCount ?? (source.citations ?? []).length);
    }
    return degrees;
  }

  // The links between events are not in the search shard: the shard is what a
  // reader searches, and nobody searches for an edge by name. The narrative
  // step field does, so its entries are made here, once, out of the two
  // titles the link runs between.
  let edgeEntries = null;
  function linkEntries() {
    if (edgeEntries) return edgeEntries;
    edgeEntries = [];
    for (const edge of edges) {
      if (edge.status && edge.status !== 'active') continue;
      const from = eventById(edge.from)?.title ?? edge.from;
      const to = eventById(edge.to)?.title ?? edge.to;
      const label = `${from} — ${edge.type} → ${to}`;
      edgeEntries.push({
        kind: 'edge', id: edge.id, label, detail: edge.type, when: null, weight: 0,
        terms: [fold(`${from} ${to}`), fold(edge.type)],
      });
    }
    return edgeEntries;
  }

  // The list one field searches, held: a field over events searches the
  // shard's own array, and only the step field, which is over two kinds at
  // once, ever needs a list of its own built.
  const lists = new Map();
  const ids = new Map();

  return {
    entriesOf(name) {
      if (lists.has(name)) return lists.get(name);
      const kinds = kindsFor(name);
      const of = (kind) => (kind === 'edge' ? linkEntries() : grouped().get(kind) ?? []);
      const list = kinds.length === 1 ? of(kinds[0]) : kinds.flatMap(of);
      lists.set(name, list);
      return list;
    },
    // What is shown beside a hit: the years it covers, where it happened, and
    // how much already hangs on it.
    describe(entry) {
      if (!entry) return { when: '', place: '', degree: 0 };
      const event = entry.kind === 'event' ? eventById(entry.id) : null;
      return {
        when: entry.when ? formatInterval(entry.when) : '',
        place: event?.place ? placeName(event.place) : '',
        degree: degreeTable().get(`${entry.kind}:${entry.id}`) ?? 0,
      };
    },
    // What the chosen record already connects to, which is what says whether
    // it is the one meant. Only an event has links; for everything else the
    // degree above is the whole answer.
    linksOf(kind, id) {
      if (kind !== 'event' || !id) return [];
      const out = [];
      for (const edge of edges) {
        if (edge.status && edge.status !== 'active') continue;
        if (edge.from === id) out.push({ way: 'out', type: edge.type, other: eventById(edge.to)?.title ?? edge.to });
        else if (edge.to === id) out.push({ way: 'in', type: edge.type, other: eventById(edge.from)?.title ?? edge.from });
      }
      return out;
    },
    // The entry a chosen id stands for, or null when the id names nothing
    // active — a reference into a record that has been retracted, which the
    // editor has to say rather than quietly swallow. Looked up through a map
    // per field, because a form with twenty citation rows would otherwise
    // walk the corpus twenty times to write its own labels.
    find(name, id) {
      if (!id) return null;
      let byId = ids.get(name);
      if (!byId) {
        byId = new Map(this.entriesOf(name).map((entry) => [entry.id, entry]));
        ids.set(name, byId);
      }
      return byId.get(id) ?? null;
    },
  };
}

// A row of the bundle being written, as something the picker can search. The
// contributor may cite a source they are adding in the same breath, and it
// has to come first: it is the one thing on the page that is certainly not a
// record they should be looking for in the atlas.
export function localEntries(rows = []) {
  const out = [];
  for (const row of rows) {
    const id = String(row?.id ?? '').trim();
    if (!id) continue;
    const label = String(row.label ?? '').trim() || id;
    out.push({ kind: row.kind, id, label, detail: null, when: row.when ?? null, weight: 0, local: true, terms: [fold(label), fold(id)] });
  }
  return out;
}

// --- the control ------------------------------------------------------------

// One picker. `name` is the field's `optionsFrom`; `index` is the table
// above; `local` is asked for the bundle's own rows at the moment of the
// search, because they change with every keystroke elsewhere on the page.
//
// The value is an id and is only ever set by choosing a row or by `set`.
// Text left in the box that names nothing chooses nothing: a half-typed name
// is not a reference, and a form that guessed one would file a bundle
// pointing at a record that does not exist.
export function createPicker({
  name,
  index,
  value = '',
  label = 'Record',
  id: domId = null,
  emptyLabel = 'nothing chosen',
  local = () => [],
  onChange = () => {},
  limit = LIMIT,
} = {}) {
  const root = html('div', { class: 'picker' });
  const input = html('input', {
    type: 'text',
    role: 'combobox',
    autocomplete: 'off',
    'aria-expanded': 'false',
    'aria-autocomplete': 'list',
    'aria-label': label,
    placeholder: `type a name — ${emptyLabel}`,
  });
  if (domId) input.id = domId;
  const list = html('ul', { class: 'picker-results', role: 'listbox', hidden: 'hidden', 'aria-label': `${label} matches` });
  const chosenEl = html('p', { class: 'picker-chosen' });
  const linksEl = html('ul', { class: 'picker-links', hidden: 'hidden' });
  root.append(input, list, chosenEl, linksEl);

  let current = '';
  let items = [];
  let active = -1;

  function close() {
    list.hidden = true;
    list.textContent = '';
    input.setAttribute('aria-expanded', 'false');
    items = [];
    active = -1;
  }

  // What the field says once something is chosen: the id, because that is
  // what goes in the file, and what already hangs on it.
  function paintChosen() {
    linksEl.textContent = '';
    linksEl.hidden = true;
    if (!current) {
      chosenEl.textContent = '';
      chosenEl.classList.remove('unknown');
      return;
    }
    const known = index.find(name, current);
    chosenEl.classList.toggle('unknown', known === null);
    chosenEl.textContent = known === null
      ? `${current} — not an active record`
      : `${known.label} · ${current}`;
    const links = known ? index.linksOf(known.kind, current) : [];
    if (!links.length) return;
    linksEl.hidden = false;
    for (const link of links.slice(0, 6)) {
      // The same shape a link is named in everywhere else — from, type, to —
      // with "this" standing where the chosen record does.
      linksEl.appendChild(html('li', {}, link.way === 'out'
        ? `this — ${link.type} → ${link.other}`
        : `${link.other} — ${link.type} → this`));
    }
    if (links.length > 6) linksEl.appendChild(html('li', { class: 'muted' }, `and ${links.length - 6} more`));
  }

  function draw(result) {
    items = flatten(result);
    list.textContent = '';
    if (!result.query) {
      close();
      return;
    }
    if (items.length === 0) {
      list.appendChild(html('li', { class: 'picker-empty', role: 'presentation' }, 'Nothing by that name.'));
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      active = -1;
      return;
    }
    items.forEach((item, i) => {
      const row = html('li', { class: `picker-option${item.local ? ' local' : ''}`, role: 'option', 'data-index': String(i), 'data-id': item.id, 'data-kind': item.kind, 'aria-selected': 'false' });
      row.id = `${domId ?? 'picker'}-option-${i}`;
      row.appendChild(html('span', { class: 'picker-label' }, item.label));
      const { when, place, degree } = item.local ? { when: '', place: '', degree: 0 } : index.describe(item);
      row.appendChild(html('span', { class: 'kind' }, item.kind));
      if (when) row.appendChild(html('span', { class: 'when' }, when));
      if (place) row.appendChild(html('span', { class: 'muted' }, place));
      if (item.local) row.appendChild(html('span', { class: 'badge' }, 'in this bundle'));
      else row.appendChild(html('span', { class: 'degree' }, degree === 1 ? '1 link' : `${degree} links`));
      list.appendChild(row);
    });
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(0);
  }

  function setActive(at) {
    active = Math.max(0, Math.min(at, items.length - 1));
    for (const el of list.querySelectorAll('[role="option"]')) {
      const on = Number(el.dataset.index) === active;
      el.setAttribute('aria-selected', String(on));
      el.classList.toggle('active', on);
      if (on) {
        input.setAttribute('aria-activedescendant', el.id);
        el.scrollIntoView?.({ block: 'nearest' });
      }
    }
  }

  // The bundle's own rows first, then the atlas's, each scanned with the same
  // ranking the search box uses. Two scans and not one: a row being written
  // in this bundle can never be outranked by a record that is already there,
  // however much better the name matches.
  //
  // Between them, the record whose id is exactly what was typed. The index is
  // searched by name and an id is not a name — "25 April" is filed under
  // `carnation-revolution-1974` — so an id pasted from a URL or from
  // `data/events/` would otherwise find nothing at all.
  function run(text) {
    const query = text.trim();
    const mine = search(localEntries(local()), text, { limit });
    const theirs = search(index.entriesOf(name), text, { limit });
    const seen = new Set();
    const out = [];
    let left = limit;
    const take = (kind, rows) => {
      const kept = rows.filter((row) => !seen.has(row.id)).slice(0, left);
      for (const row of kept) seen.add(row.id);
      left -= kept.length;
      if (kept.length) out.push({ kind, items: kept });
    };
    for (const group of mine.groups) if (left > 0) take(group.kind, group.items);
    const exact = left > 0 ? index.find(name, query) : null;
    if (exact && !seen.has(exact.id)) take(exact.kind, [exact]);
    for (const group of theirs.groups) if (left > 0) take(group.kind, group.items);
    draw({ groups: out, total: mine.total + theirs.total + (exact ? 1 : 0), query: fold(text) });
  }

  function choose(item) {
    if (!item) return;
    current = item.id;
    input.value = item.label;
    close();
    paintChosen();
    onChange(current);
  }

  input.addEventListener('input', () => {
    // Typing again unchooses: what is in the box no longer names what the
    // field points at, and a stale id under a changed name is exactly the
    // reference nobody would catch.
    if (current !== '') {
      current = '';
      paintChosen();
      onChange(current);
    }
    run(input.value);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (items.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(active + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(active - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(items.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(items[active]);
    }
  });

  // mousedown and not click, as in the search box: the blur a click fires
  // first would close the list out from under it.
  list.addEventListener('mousedown', (event) => {
    const option = event.target.closest?.('[role="option"]');
    if (!option) return;
    event.preventDefault();
    choose(items[Number(option.dataset.index)]);
  });

  input.addEventListener('blur', () => {
    setTimeout(close, 120);
  });

  function set(next) {
    current = String(next ?? '');
    input.value = current ? index.find(name, current)?.label ?? current : '';
    close();
    paintChosen();
  }

  set(value);

  return {
    root,
    input,
    name,
    value: () => current,
    set,
    // What drives the control from outside — a test, and the browser
    // benchmark — and answers at once: nothing is typing, so there is
    // nothing to wait for.
    search: (text) => {
      input.value = text;
      run(text);
    },
    rows: () => items,
    close,
    focus: () => input.focus(),
  };
}
