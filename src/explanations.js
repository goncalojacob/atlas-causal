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
