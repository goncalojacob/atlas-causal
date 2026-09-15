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

// Degrees between the record's own point and the candidate's. About 110 km at
// the equator and less further north, which is wide enough for a record whose
// point is a harbour, a parish or a fort rather than the city centre, and far
// too narrow for a city of the same name on another continent.
export const NEAR_DEGREES = 1;

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

  const refuse = (place, reason, candidates = []) => {
    unresolved.push({ place: place.id, names: place.names, wikidata: place.wikidata, reason, candidates });
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
      away: how === 'name' ? degreesApart(place, city) : null,
      // A record whose own wikidata is not the city's is matched on the name
      // and the point and is worth saying so: the two ids may be the city and
      // its municipality, or the record's may simply be wrong.
      wikidataDiffers: Boolean(place.wikidata && city.wikidata && place.wikidata !== city.wikidata),
    });
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

// The file as it is written: entries in numeric id order, so that two runs
// write one file and a diff is what actually changed.
export function placesFile(entries, { source }) {
  const keys = Object.keys(entries).sort((a, b) => (Number(a) - Number(b)) || (a < b ? -1 : 1));
  const ordered = {};
  for (const key of keys) ordered[key] = entries[key];
  return { schema: 1, kind: 'import-places', source, entries: ordered };
}
