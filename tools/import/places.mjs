// Which Natural Earth city, if any, a `data/places/` record is. Pure: no fs,
// no network, no command line — `naturalearth.mjs` reads the files and hands
// the features and the records to `matchPlaces`, which answers with the
// entries of `data/imports/naturalearth-places.json` and with everything it
// refused, so `docs/naturalearth-places.md` can put it in front of a person.
//
// **A match is never guessed** (brief §3, review finding 26). Two signals are
// accepted and no third:
//
//   1. `wikidata` — the record's own Q-id against Natural Earth's
//      `WIKIDATAID`. The strongest thing either side carries, and the only
//      one that survives a city being renamed.
//   2. An **exact fold** of one of the record's `names` against the city's
//      `NAME` or `NAME_EN`, **where exactly one city survives** and it is
//      within `NEAR_DEGREES` of the point the record already gives.
//
// The second signal needs the first half of that guard because a name is not
// an identity — 7,342 cities hold a great many of the same words — and it
// needs the second half because of this atlas's own corpus: the place record
// `belem` is Belém in Lisbon and Natural Earth's only Belém is the one in
// Pará, four thousand kilometres away, and `lajes` is in Terceira while
// Natural Earth's Lajes is Lages in Santa Catarina. Both are saved today by
// the qualifier a person happened to write into the name ("Belém, Lisbon"),
// which is a thin thing to rest an identity on. The distance guard is the
// real one, and it only ever **refuses**: nothing is matched by being near.
//
// A place record with no city is not an error (brief §3). It gets no city
// feature, M38 labels it from the record itself, and it is listed for a
// person, who resolves it by adding the entry by hand — a hand-written entry
// is kept by `--places` on the next run and never recomputed away.

import { PROPERTIES } from './features.mjs';

// The one committed file a city is read off, named here because `--places`
// reads it before there is a `cities` layer to ask for it and the layer table
// names it from here afterwards: one spelling, in one place.
export const CITIES_SOURCE = 'ne_10m_populated_places.geojson';

// Where the two files this writes live, relative to data/ and to the
// repository root. `data/imports/` is not in the deploy artifact (deploy.yml),
// which is why the import copies `place` onto the city itself.
export const PLACES_FILE = 'imports/naturalearth-places.json';
export const PLACES_DOC = 'docs/naturalearth-places.md';

// Degrees between the record's own point and the candidate's. About 110 km at
// the equator and less further north, which is wide enough for a record whose
// point is a harbour, a parish or a fort rather than the city centre, and far
// too narrow for a city of the same name on another continent.
export const NEAR_DEGREES = 1;

// How far around a refused record the document looks for something to show a
// person, and how many it shows. **Nothing is ever matched by being near** —
// this is the other half of the job, which is making the refusal useful:
// `recife` is named "Recife, at the end of the voyage", so no name folds, and
// Natural Earth's Recife is three hundredths of a degree from the record's
// own point. Without this the document would say "no candidate" and leave a
// person to search 7,342 cities by hand.
export const NEARBY_DEGREES = 2;
export const NEARBY_LIMIT = 3;

// Case, accents and surrounding space, and nothing else. Not a
// transliteration and not a stemmer: two names fold together when they are
// the same name written with different diacritics, which is what "São Tomé"
// and "Sao Tome" are, and never when they are different names that look
// alike. `\p{Diacritic}` over the decomposed string is the whole of it.
export function fold(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Longitude difference across the antimeridian: 179 and -179 are two degrees
// apart and not 358. The atlas is cut at 30°W and a record may sit on either
// side of the line the picture is cut at, so this cannot be a subtraction.
export function lonDelta(a, b) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

// Infinity where either side has no point, which is what refuses the match:
// a place record always has one (the schema requires it — "a place with no
// coordinates is a word"), so this is the answer for a Natural Earth feature
// whose geometry is not a point, and for a record read from somewhere else.
export function degreesApart(a, b) {
  if (!a || !b) return Infinity;
  if (![a.lon, a.lat, b.lon, b.lat].every((n) => Number.isFinite(n))) return Infinity;
  return Math.hypot(lonDelta(a.lon, b.lon), a.lat - b.lat);
}

// One Natural Earth feature reduced to what matching needs, read through the
// property table so that no property name is spelled here either.
export function cityIdentity(feature, table = PROPERTIES.cities) {
  const properties = feature?.properties ?? {};
  const [lon, lat] = feature?.geometry?.coordinates ?? [];
  const id = properties[table.id];
  if (id === null || id === undefined) return null;
  const name = properties[table.name];
  const nameEn = properties[table.nameEn];
  const wikidata = properties[table.wikidata];
  return {
    id: String(id),
    name: typeof name === 'string' ? name : null,
    nameEn: typeof nameEn === 'string' && nameEn !== '' ? nameEn : null,
    wikidata: typeof wikidata === 'string' && wikidata !== '' ? wikidata : null,
    pop: Number.isFinite(properties[table.population]) ? properties[table.population] : null,
    lon: Number.isFinite(lon) ? lon : null,
    lat: Number.isFinite(lat) ? lat : null,
  };
}

// A place record reduced the same way. `names` is the list rule 18 keeps
// non-empty; `historicalNames` is deliberately not folded, because a name a
// city had in 1500 is not a name Natural Earth publishes and matching on one
// would be matching a modern dot to a dated word.
export function placeIdentity(record) {
  return {
    id: record?.id ?? null,
    names: (record?.names ?? []).filter((name) => typeof name === 'string' && name !== ''),
    wikidata: typeof record?.wikidata === 'string' && record.wikidata !== '' ? record.wikidata : null,
    lon: Number.isFinite(record?.where?.lon) ? record.where.lon : null,
    lat: Number.isFinite(record?.where?.lat) ? record.where.lat : null,
  };
}

// --- the match -----------------------------------------------------------

// → { entries, matched, unresolved }
//
// `entries` is the file's own `{ "<ne_id>": { "place": "<id>" } }`, keyed by
// Natural Earth's id because that is what the import has in its hand when it
// reads a city; `matched` says how each one was arrived at and `unresolved`
// why the rest were not, both in place-id order, which is what makes the
// document below the tool the same document on a second run.
export function matchPlaces(features, records, { table = PROPERTIES.cities, near = NEAR_DEGREES } = {}) {
  const cities = [];
  for (const feature of features ?? []) {
    const city = cityIdentity(feature, table);
    if (city) cities.push(city);
  }

  const byWikidata = new Map();
  const byName = new Map();
  for (const city of cities) {
    if (city.wikidata) {
      if (!byWikidata.has(city.wikidata)) byWikidata.set(city.wikidata, []);
      byWikidata.get(city.wikidata).push(city);
    }
    for (const name of [city.name, city.nameEn]) {
      if (!name) continue;
      const key = fold(name);
      if (!key) continue;
      if (!byName.has(key)) byName.set(key, new Map());
      byName.get(key).set(city.id, city);
    }
  }

  const places = (records ?? []).map(placeIdentity).filter((place) => place.id);
  places.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const entries = {};
  const matched = [];
  const unresolved = [];
  // Which place already took a city, so that two records cannot name one dot
  // and the file cannot say a city is two places ("names no place twice",
  // brief's Done-when). The first in id order keeps it and the second is
  // listed, because whichever is right is a person's judgement and not a
  // tie-break.
  const taken = new Map();

  // What lies near the record's point, for the document alone. Never a match
  // and never an entry: it is what a person is shown so that resolving one of
  // these is reading a line rather than searching a file of 7,342 cities.
  const nearbyTo = (place, exclude) => cities
    .map((city) => ({ city, away: degreesApart(place, city) }))
    .filter(({ city, away }) => away <= NEARBY_DEGREES && !exclude.has(city.id))
    .sort((a, b) => a.away - b.away || (a.city.id < b.city.id ? -1 : 1))
    .slice(0, NEARBY_LIMIT);

  const refuse = (place, reason, candidates = []) => {
    const exclude = new Set(candidates.map((city) => city.id));
    unresolved.push({
      place: place.id,
      names: place.names,
      wikidata: place.wikidata,
      reason,
      candidates,
      nearby: nearbyTo(place, exclude),
    });
  };

  for (const place of places) {
    let how = null;
    let candidates = [];

    if (place.wikidata && byWikidata.has(place.wikidata)) {
      candidates = byWikidata.get(place.wikidata);
      if (candidates.length > 1) {
        refuse(place, `${place.wikidata} is on ${candidates.length} Natural Earth cities`, candidates);
        continue;
      }
      how = 'wikidata';
    } else {
      const seen = new Map();
      for (const name of place.names) {
        for (const city of (byName.get(fold(name)) ?? new Map()).values()) seen.set(city.id, city);
      }
      candidates = [...seen.values()];
      if (candidates.length === 0) {
        refuse(place, 'no city of that name and no wikidata match', []);
        continue;
      }
      if (candidates.length > 1) {
        refuse(place, `${candidates.length} cities fold to that name`, candidates);
        continue;
      }
      how = 'name';
    }

    const city = candidates[0];
    // The distance guard, on the name path only: `wikidata` is an identity
    // and a disagreement about where a city is does not make it another city.
    if (how === 'name') {
      const away = degreesApart(place, city);
      if (!(away <= near)) {
        refuse(place, `the one city of that name is ${away === Infinity ? 'somewhere this record gives no point for' : `${away.toFixed(2)}° away`}, over the ${near}° a name alone is trusted within`, candidates);
        continue;
      }
    }
    if (taken.has(city.id)) {
      refuse(place, `Natural Earth ${city.id} is already "${taken.get(city.id)}"`, candidates);
      continue;
    }

    taken.set(city.id, place.id);
    entries[city.id] = { place: place.id };
    matched.push({
      place: place.id,
      id: city.id,
      how,
      city,
      wikidata: place.wikidata,
      away: how === 'name' ? degreesApart(place, city) : null,
      // A record whose own wikidata is not the city's is matched on the name
      // and the point and is worth saying so: the two ids may be the city and
      // its municipality, or the record's may simply be wrong.
      wikidataDiffers: Boolean(place.wikidata && city.wikidata && place.wikidata !== city.wikidata),
    });
  }

  // Which of the nearby cities is already somebody's, said after the fact
  // because a refusal happens while the list is still being built. It matters:
  // `belem` is a parish of Lisbon and `alvor` of Portimão, and the nearest
  // city to each is exactly the city it is *part of* rather than the city it
  // is. One place is one city, so pasting that line would be an error the
  // validator then refuses, and the document says so first.
  for (const one of unresolved) {
    for (const near of one.nearby) near.takenBy = taken.get(near.city.id) ?? null;
  }

  return { entries, matched, unresolved };
}

// The entries of a file that the matcher did not produce: a person's own
// resolutions, which `--places` keeps rather than recomputing away. That is
// the whole point of the document — somebody reads it, adds the entry, and
// the next run leaves it alone.
export function handEntries(existing, entries) {
  const out = {};
  for (const [id, entry] of Object.entries(existing?.entries ?? {})) {
    if (!Object.hasOwn(entries, id)) out[id] = entry;
  }
  return out;
}

// --- the document a person reads ------------------------------------------

const pad = (n) => n.toLocaleString('en-US');

const cityLine = (city) => [
  city.name ?? '(unnamed)',
  city.nameEn && city.nameEn !== city.name ? ` / ${city.nameEn}` : '',
  ` — ne_id \`${city.id}\``,
  city.wikidata ? `, ${city.wikidata}` : ', no wikidata',
  city.pop === null ? '' : `, pop ${pad(city.pop)}`,
  city.lon === null ? '' : `, at ${city.lon}, ${city.lat}`,
].join('');

// `docs/naturalearth-places.md`, whole. Pure and with no date in it, so that
// a second run over the same inputs writes the same document and a diff is
// what actually changed.
//
// Half of it is a record of what the matcher did, which is rewritten every
// run; the other half is the only part that is anybody's business — the
// records it refused, each with the candidates it refused and the line to
// paste to accept one.
export function placesDocument({ matched, unresolved, hand = {}, cities = 0 }) {
  const out = [];
  const say = (line = '') => out.push(line);
  const byWikidata = matched.filter((m) => m.how === 'wikidata');
  const byName = matched.filter((m) => m.how === 'name');
  const total = matched.length + unresolved.length;

  say('# Natural Earth cities and the places this atlas names');
  say();
  say('GENERATED by `node tools/import/naturalearth.mjs --places`, which rewrites');
  say('this file whole. Do not edit it: what a person decides goes into');
  say('`data/imports/naturalearth-places.json`, and an entry written there by hand');
  say('is kept by the next run and appears at the end of this document.');
  say();
  say(`${total} place records against ${pad(cities)} Natural Earth populated places:`);
  say(`**${byWikidata.length} matched on \`wikidata\`**, **${byName.length} on an exact fold of the name**,`);
  say(`**${unresolved.length} left for a person**, and ${Object.keys(hand).length} entries already written by hand.`);
  say();
  say('A match is never guessed. Two signals are accepted: the record\'s own');
  say('`wikidata` against Natural Earth\'s `WIKIDATAID`, and an exact fold of one of');
  say(`the record's \`names\` against \`NAME\` or \`NAME_EN\` **where exactly one city`);
  say(`survives it and it is within ${NEAR_DEGREES}° of the point the record already gives**.`);
  say('A place record with no Natural Earth city is not an error: it gets no city');
  say('feature, and the label layer draws it from the place record itself.');
  say();
  say('**To resolve one of the candidates below**, add its line to the `entries` of');
  say('`data/imports/naturalearth-places.json` — keyed by the `ne_id`, with a `note`');
  say('saying why you are sure — and re-run `--places` to refresh this document and');
  say('`node tools/import/naturalearth.mjs --source vendor/natural-earth/10m` to put');
  say('the city into the base map. Nothing here is urgent: an unresolved record');
  say('costs a link between a dot and a record, and never a wrong label.');
  say();
  say('**A place inside a city is not that city.** `belem` is a parish of Lisbon,');
  say('`alvor` of Portimão and `parque-das-nacoes` of Lisbon again, and the nearest');
  say('city to each of them is the one it is *part of*. One place is one city: the');
  say('validator refuses a second entry on a city that already has one, and a line');
  say('marked ALREADY below is that trap. Such a record wants no entry at all — the');
  say('label layer draws it from its own point, which is where it actually is.');
  say();

  say('## Matched on wikidata');
  say();
  if (byWikidata.length === 0) say('None.');
  else for (const m of byWikidata) say(`- **${m.place}** → ${cityLine(m.city)}`);
  say();

  say('## Matched on the name, and on the point');
  say();
  if (byName.length === 0) say('None.');
  else {
    for (const m of byName) {
      // Worth saying, because the two ids may be a city and its municipality
      // — or the record's may simply be wrong, which is a correction to the
      // record and not to this file.
      const differs = m.wikidataDiffers
        ? ` — **the record carries \`${m.wikidata}\` and the city \`${m.city.wikidata}\`**, so one of the two is about something else`
        : '';
      say(`- **${m.place}** → ${cityLine(m.city)}, ${m.away.toFixed(3)}° from the record's own point${differs}`);
    }
  }
  say();

  say('## For a person to resolve');
  say();
  if (unresolved.length === 0) say('Nothing: every place record has its city.');
  for (const one of unresolved) {
    say(`### ${one.place}`);
    say();
    say(`Named ${one.names.map((n) => `"${n}"`).join(', ') || '(nothing)'}${one.wikidata ? `, \`${one.wikidata}\`` : ', no wikidata'}. Refused because ${one.reason}.`);
    say();
    if (one.candidates.length === 0 && one.nearby.length === 0) {
      say('No candidate by name and nothing within');
      say(`${NEARBY_DEGREES}° of the record's own point. If Natural Earth has this place under`);
      say('another name, its `ne_id` is what to write; if it does not have it at all —');
      say('and it has no village, no parish and no fort — there is nothing to write and');
      say('the label layer will draw the record alone, which is the ordinary case for');
      say('a place this atlas names and a world gazetteer does not.');
    }
    if (one.candidates.length) {
      say('Candidates by name, one line each, to paste into `entries`:');
      say();
      say('```json');
      for (const city of one.candidates) say(`  "${city.id}": { "place": "${one.place}", "note": "" },   // ${cityLine(city).replace(/`/g, '')}`);
      say('```');
      say();
    }
    if (one.nearby.length) {
      say(`Nothing below is a match — these are the cities within ${NEARBY_DEGREES}° of the point the`);
      say('record already gives, nearest first, so that accepting one is a line and not');
      say('a search:');
      say();
      say('```json');
      for (const { city, away, takenBy } of one.nearby) {
        const already = takenBy ? ` — ALREADY "${takenBy}"` : '';
        say(`  "${city.id}": { "place": "${one.place}", "note": "" },   // ${cityLine(city).replace(/`/g, '')} — ${away.toFixed(3)}° away${already}`);
      }
      say('```');
    }
    say();
  }

  say('## Entries written by hand');
  say();
  const handKeys = Object.keys(hand).sort((a, b) => (Number(a) - Number(b)) || (a < b ? -1 : 1));
  if (handKeys.length === 0) {
    say('None yet. Everything in `data/imports/naturalearth-places.json` today is');
    say('what the two signals above proved.');
  } else {
    for (const key of handKeys) {
      say(`- \`${key}\` → **${hand[key].place}**${hand[key].note ? ` — ${hand[key].note}` : ''}`);
    }
  }
  say();
  return `${out.join('\n')}\n`;
}

// The file as it is written: entries in numeric id order, so that two runs
// write one file and a diff is what actually changed.
export function placesFile(entries, { source }) {
  const keys = Object.keys(entries).sort((a, b) => (Number(a) - Number(b)) || (a < b ? -1 : 1));
  const ordered = {};
  for (const key of keys) ordered[key] = entries[key];
  return { schema: 1, kind: 'import-places', source, entries: ordered };
}
