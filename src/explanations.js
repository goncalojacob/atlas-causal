// Where a link's argument lives, and how it is fetched in bulk.
//
// An edge's `explanation` is the value of this project — it is the small
// historiographical argument CLAUDE.md says an edge is — and until now it was
// read one `<details>` at a time, one request per link (panel.js). That is the
// right shape for a reader opening one "Why", and the wrong shape for anything
// that reads a *path*: a six-step walk is six requests, and the Why mode the
// plan reserves (M35) wants the whole subgraph's arguments before it can write
// a sentence (health review B, finding 18).
//
// So the index emits the explanations beside the spine, sharded by period —
// `explanations-<from>-<to>-<hash>.json` — and a caller that has a set of
// edges in hand asks for the shards those edges fall in, which is at most a
// handful of requests however long the path. Sharded rather than carried in
// the spine because the spine is loaded whole by every page: 319 characters a
// link is 50 KB on this dataset and 48 MB at a hundred and fifty thousand
// links, and none of it is needed to draw a single mark.
//
// Pure and leaf-ish: `dates.js` and nothing else, so the index build and the
// browser's loader compute the same period from the same function and the two
// cannot come to disagree about which file an edge is in.

import { extent } from './util/dates.js';

// A century. Long enough that a walk stays inside one or two files, short
// enough that a reader of the 1970s never fetches the arguments of the 1400s.
export const PERIOD = 100;

// The period a year falls in, astronomical, as an inclusive pair. Floor
// division, so it is the same answer either side of year zero.
export function periodOf(year) {
  const from = Math.floor(year / PERIOD) * PERIOD;
  return { from, to: from + PERIOD - 1 };
}

// The start of an event's interval, or null when it will not parse — the
// validator's business, not this file's.
function startOf(event) {
  if (!event) return null;
  try {
    return extent(event.when).min;
  } catch {
    return null;
  }
}

// The period an edge's argument is filed under: the one its **cause** begins
// in. A link is an argument about how one thing led to another, and the thing
// it starts from is where a reader walking forward meets it. An edge whose
// `from` is missing or will not parse has no period and is in no shard: the
// card still fetches the edge's own record, as it always did.
export function periodOfEdge(edge, events) {
  const year = startOf(events.get?.(edge?.from) ?? null);
  return year === null ? null : periodOf(year);
}

// `explanations-<from>-<to>-<hash>.json`. The years are in the name and not
// only in the manifest so that a file found on disk says what is in it.
export function shardName(period, hash) {
  return `explanations-${period.from}-${period.to}-${hash}.json`;
}

// ─── The filing key, for every kind (I3) ───────────────────────────────────
//
// One table, used by the attribute shards of I3 and by the history shards of
// I5, so that two sharding schemes cannot come to disagree about which file a
// record is in (index2-plan, A8; index2 review, findings 4 and 10).
//
// An event is filed by the year it begins in, an edge by the year its **cause**
// begins in — `periodOfEdge` above, which the explanation shards already use —
// and an actor, a relation, a tenure, an office or a presence by the year its
// interval begins in. A narrative goes by the years it says it is about.
//
// Two answers are not a century. **A place has no year at all** and every event
// points at one, so the places are a single shard rather than 470 KB of them at
// 10^4 in the file that is always fetched. And a record whose key is null — an
// office with `when: null`, an edge whose cause will not parse — is in the
// `null` shard, which is fetched with the first century.
export const PLACE_SHARD = 'place';

// A source has no year either — a book is not an event — and it is the one kind
// this table answers for that is in no attribute shard at all, being no part of
// the spine. I5's histories are what ask: 200 sources at 10^4 are one file, not
// two hundred of them in the `null` shard beside every dateless record of every
// other kind (index2-plan, A8; index2 review, finding 10).
export const SOURCE_SHARD = 'source';

export function attributePeriod(kind, record, events) {
  if (kind === 'place') return PLACE_SHARD;
  if (kind === 'source') return SOURCE_SHARD;
  if (kind === 'edge') return periodOfEdge(record, events);
  if (kind === 'narrative') {
    const from = record?.window?.from;
    if (!Number.isInteger(from)) return null;
    // Through `extent` like every other kind, so that a window and an interval
    // are read by one rule: `{ from, to }` is an interval whose bounds are two
    // years.
    return periodOf(extent({ start: from, end: from }).min);
  }
  const year = startOf(record);
  return year === null ? null : periodOf(year);
}

// What that answer is called, in the file's name and in the manifest: the
// middle of `attributes-<key>-<hash>.json`. A string, so that "the shard this
// record is in" is one comparison whichever of the answers it was — the two
// that are a kind rather than a period included.
export function attributeShardKey(period) {
  if (typeof period === 'string') return period;
  return period === null || period === undefined ? 'null' : `${period.from}-${period.to}`;
}

export function attributeShardName(key, hash) {
  return `attributes-${key}-${hash}.json`;
}

// ─── Every century a record reaches into (M58) ─────────────────────────────
//
// `attributePeriod` above answers "which century does this record *begin* in",
// and until M58 that was the only answer the build had: a row went into the
// shard of its start century and nowhere else. A view, meanwhile, fetches the
// shards its **window** covers. The two disagree the moment a record is longer
// than a century: the slave trade to Brazil begins in the 1500s and runs to the
// 1860s, so a reader of the 1800s is drawn a bar — correctly, it is in the
// window — whose name is in a file that window never asks for, and the bar says
// "still loading" for ever (M50, deviation 779; docs/m58-shards.md).
//
// So the filing key becomes the filing *keys*: a row goes in every century its
// interval touches. 23 events and 1,279 records of every kind reach out of
// their own century on this corpus, which is a third of it.
//
// The interval is the record's own, read through `extent` like the start bound
// is, so one function decides both and they cannot come to disagree. An edge is
// filed by its cause, so its interval is the cause's; a narrative's is the
// window it says it is about; a place and a source have no year and are one
// shard each, as they were.
export function attributeSpan(kind, record, events) {
  const period = attributePeriod(kind, record, events);
  if (typeof period === 'string' || period === null) return null;
  if (kind === 'narrative') {
    const from = record?.window?.from;
    const to = record?.window?.to;
    if (!Number.isInteger(from)) return null;
    const min = extent({ start: from, end: from }).min;
    return { min, max: Number.isInteger(to) ? extent({ start: to, end: to }).max : min };
  }
  const source = kind === 'edge' ? (events.get?.(record?.from) ?? null) : record;
  if (!source) return null;
  try {
    const { min, max } = extent(source.when);
    return min === null || min === undefined ? null : { min, max };
  } catch {
    return null;
  }
}

// The shards of `periods` that interval reaches into. **An interval with no end
// reaches into every one of them after it began**, because that is already how
// `overlaps()` draws it: a polity that has not fallen is in every window after
// its founding, and 250 records here are of that shape.
//
// `periods` is the list of centuries the index has — the groups the build made,
// or the manifest's own `attributeShards` in the browser — so that the build and
// the loader read one list and file one record in one set of files.
export function periodsTouched(span, periods) {
  if (span === null) return [];
  const { min } = span;
  const max = span.max === null || span.max === undefined ? null : span.max;
  return periods.filter((period) => period.from <= (max === null ? Infinity : max) && period.to >= min);
}

// `history-<kind>-<key>-<hash>.json` (I5). The kind is in the name as well as
// the key because a history shard holds one kind and one period, where an
// attribute shard holds one period of every kind: a reviewer opens a record,
// not a century. So `history-place-place-<hash>.json` repeats itself, which is
// the price of one naming rule rather than one per kind.
export function historyShardName(kind, key, hash) {
  return `history-${kind}-${key}-${hash}.json`;
}

// Every shard, in year order: the edges grouped by period, each group's
// explanations keyed by edge id. Only active edges that have an explanation —
// a tombstone's argument was withdrawn with it, and an edge with no text
// contributes an empty string nobody can read.
export function explanationShards(edges, events) {
  const byPeriod = new Map();
  for (const edge of edges) {
    if (edge.status !== 'active' || typeof edge.explanation !== 'string' || edge.explanation === '') continue;
    const period = periodOfEdge(edge, events);
    if (!period) continue;
    let group = byPeriod.get(period.from);
    if (!group) {
      group = { from: period.from, to: period.to, explanations: {} };
      byPeriod.set(period.from, group);
    }
    group.explanations[edge.id] = edge.explanation;
  }
  return [...byPeriod.values()].sort((a, b) => a.from - b.from);
}
