// Grouping the marks that overlap, so that a stack of events at one point
// can be seen, counted and reached. Pure and free of the DOM: points and the
// current zoom factor in, clusters out, so node --test can hold it to its
// promises.
//
// It lives at the top of src/ and not under map/ because the timeline stacks
// its bars with the same function, in one dimension: a lane is the same
// problem with y held at zero.
//
// Why at render time and not at index time: what overlaps depends on the
// projection and on how far the user has zoomed in, and the index knows
// neither. What the index contributes is `weight` — which member of a stack
// is the one worth showing.

// D: two marks closer than this at k = 1 overlap once their hit targets are
// counted, so they are drawn as one. The threshold is D / k, a screen
// constant, so zooming in shrinks it and clusters split on their own.
export const MERGE_DISTANCE = 16;

// How far the map zooms. It lives here and not only in map.js because the
// clustering rule and the zoom limit are one question: whether a cluster
// can ever be pulled apart depends on how far in the reader is allowed to
// go. map.js imports this so the two cannot drift.
export const DEEPEST_ZOOM = 40;

// Members closer together than this are coincident: D / DEEPEST_ZOOM is the
// merge threshold at the deepest zoom, so nothing this close can be
// separated by any zoom the map allows. Two records a kilometre apart in
// Lisbon are coincident by this measure, which is the honest answer —
// zooming to the limit would leave them a mark's width apart with
// thirty-seven others still stacked underneath. Such a cluster is spread in
// a ring instead.
export const COINCIDENT_EPSILON = MERGE_DISTANCE / DEEPEST_ZOOM;

// The spread: the radius of the first ring and the room one member needs on
// it, both in SVG units at k = 1 and divided by k when drawn, so the ring
// keeps its size on screen however far the map is zoomed.
export const SPREAD_RADIUS = 46;
export const SPREAD_GAP = 24;

// A hair past the zoom at which a cluster comes apart, so the member that
// was exactly on the threshold is on the far side of it. Exported for the
// test that holds the grid to the greedy pass's own output: a reference
// implementation has to be able to produce `coreZoom` too.
export const SPLIT_MARGIN = 1.05;

// The grid's cells are strictly wider than the merge threshold, which is the
// first of the four conditions under which the grid gives the greedy pass's
// own answer: two points within the threshold of each other cannot then be
// more than one cell apart on either axis, so the 3×3 neighbourhood of a
// seed's cell holds every candidate the full scan would have found. Equal
// widths would do in exact arithmetic; a hair over covers the rounding of
// `x / cell` at the far edge of a cell.
const CELL_MARGIN = 1 + 2 ** -20;

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

// Heaviest first, then by id: the seed order is what makes the greedy pass
// deterministic, and therefore what makes a cluster's representative stable
// between renders.
export function byWeightThenId(a, b) {
  return (b.weight ?? 0) - (a.weight ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

// points: [{ id, x, y, weight, ...anything the caller wants back }].
// `alone` is the set of ids that must keep a mark of their own — what the
// reader is currently working with. Every view has such a set and every one
// of them used to hold it out of the input and add the singletons back by
// hand; passing it here instead means one pass, one ordering, and one place
// where "a cluster never swallows the chain" is true.
// Returns one cluster per group, heaviest seed first; every point is in
// exactly one cluster.
export function clusterPoints(points, {
  k = 1, distance = MERGE_DISTANCE, epsilon = COINCIDENT_EPSILON, alone = null,
} = {}) {
  const threshold = distance / Math.max(k, Number.EPSILON);
  const withinCluster = threshold * threshold;
  const withinEpsilon = epsilon * epsilon;
  const solitary = alone ?? new Set();
  // Greedy, in seed order, over a uniform grid. It was a double loop until
  // H4a — O(n²), and at 14 000 points half a second per frame of the zoom
  // animation (health review B, finding 2; A, finding 13). The grid changes
  // what is *looked at*, never what is decided, and the four conditions that
  // make that true are worth naming because a later simplification could
  // break any of them without a test noticing:
  //
  //   1. cells strictly wider than the threshold, so the 3×3 neighbourhood
  //      of a seed holds every candidate (CELL_MARGIN above);
  //   2. one globally sorted walk of the seeds, not a walk per cell: which
  //      point seeds a cluster is decided by `byWeightThenId` over the whole
  //      set, and a per-cell order would hand a cell's own heaviest point a
  //      cluster that belongs to a heavier neighbour;
  //   3. the members re-sorted by `byWeightThenId` before `centre` and
  //      `weight` are reduced over them, because the grid meets them in
  //      cell order and floating-point addition is not associative — the
  //      order they are summed in is part of the answer;
  //   4. the exact `<=` predicate on every candidate the neighbourhood
  //      offers. The grid narrows the candidates; it never decides one.
  //
  // `tests/cluster.test.mjs` keeps the old implementation and holds the two
  // to the same output, member order and centres included.
  const seeds = [...points].sort(byWeightThenId);
  const taken = new Set();
  const clusters = [];
  // A threshold that is zero, infinite or not a number at all leaves nothing
  // to divide by; one bucket is then the whole grid, which is the double loop
  // again and the right answer at the size such a call can only be.
  const cell = threshold > 0 && Number.isFinite(threshold) ? threshold * CELL_MARGIN : null;
  const cellOf = (p) => (cell === null ? '0,0' : `${Math.floor(p.x / cell)},${Math.floor(p.y / cell)}`);
  const grid = new Map();
  for (const p of seeds) {
    const key = cellOf(p);
    const bucket = grid.get(key);
    if (bucket) bucket.push(p);
    else grid.set(key, [p]);
  }
  for (const seed of seeds) {
    if (taken.has(seed.id)) continue;
    taken.add(seed.id);
    const solo = solitary.has(seed.id);
    const members = [seed];
    // A solitary point neither gathers neighbours nor is gathered: the scan
    // below skips it on both sides, so it comes out as its own cluster of
    // one, which is exactly what a lone point produces anyway.
    if (!solo) {
      const cx = cell === null ? 0 : Math.floor(seed.x / cell);
      const cy = cell === null ? 0 : Math.floor(seed.y / cell);
      for (let i = -1; i <= 1; i += 1) {
        for (let j = -1; j <= 1; j += 1) {
          const bucket = grid.get(`${cx + i},${cy + j}`);
          if (!bucket) continue;
          // A point that has been taken is dropped from its cell as it is
          // passed, so the grid thins out as the walk goes on and no seed
          // looks at a member of an earlier cluster twice.
          let write = 0;
          for (let n = 0; n < bucket.length; n += 1) {
            const other = bucket[n];
            if (taken.has(other.id)) continue;
            bucket[write] = other;
            write += 1;
            if (solitary.has(other.id)) continue;
            if (distanceSquared(seed, other) <= withinCluster) {
              taken.add(other.id);
              members.push(other);
              write -= 1;
            }
          }
          bucket.length = write;
        }
      }
      // Condition 3: the reductions below are order-dependent in their last
      // bits, and the order that is part of the answer is the seed order.
      members.sort(byWeightThenId);
    }
    const coincident = members.every((m) => distanceSquared(seed, m) <= withinEpsilon);
    // The zoom at which everything that *can* leave this cluster has left,
    // and only the members no zoom can part are still on the mark. Clicking
    // a splittable cluster goes straight there instead of peeling one
    // neighbour off per click. null when there is nothing to shed.
    const separable = members.filter((m) => distanceSquared(seed, m) > withinEpsilon);
    const nearestSeparable = separable.length
      ? Math.sqrt(Math.min(...separable.map((m) => distanceSquared(seed, m))))
      : null;
    clusters.push({
      // The representative's id names the cluster: stable across renders as
      // long as the same events are on screen, so a spread survives one.
      key: seed.id,
      representative: seed,
      members,
      count: members.length,
      // The mark is drawn on the representative's own point, which is a
      // real place, rather than on a centroid in the sea between two.
      x: seed.x,
      y: seed.y,
      centre: {
        x: members.reduce((sum, m) => sum + m.x, 0) / members.length,
        y: members.reduce((sum, m) => sum + m.y, 0) / members.length,
      },
      coincident,
      // Held out of the grouping on purpose, rather than merely alone
      // because nothing was near it.
      alone: solo,
      // Zooming in will eventually separate these; zooming into a
      // coincident cluster never would.
      splittable: members.length > 1 && !coincident,
      coreZoom: nearestSeparable === null ? null : (distance / nearestSeparable) * SPLIT_MARGIN,
      weight: members.reduce((sum, m) => sum + (m.weight ?? 0), 0),
    });
  }
  return clusters;
}

// The other half of a level of detail: once the points have merged, the
// links between them have to merge too, or a picture with forty nodes still
// carries five hundred lines and nothing has been gained.
//
// links: [{ id, from, to, type, confidence, ...anything the caller wants
// back }] — the endpoints named by point id. clusterOf: Map<point id,
// cluster key>, which is what a caller builds from `clusterPoints` above.
// A link whose ends are unknown is dropped, as a link with one end missing
// already was; a link whose two ends are in the *same* cluster is dropped
// too, because it would be drawn from a mark to itself and the members are
// in the panel's list anyway.
//
// The merged link's type is the commonest among its members — ties by the
// type's own name, so the answer does not depend on the order they arrived
// in — and it is disputed if any single member is. Disputed wins over the
// majority on purpose: a bundle of links one of which historians argue
// about is a bundle the reader must not read as settled.
export function mergeEdges(links, clusterOf) {
  const groups = new Map();
  for (const link of links) {
    const from = clusterOf.get(link.from);
    const to = clusterOf.get(link.to);
    if (from === undefined || to === undefined || from === to) continue;
    const key = `${from}|${to}`;
    if (!groups.has(key)) groups.set(key, { key, from, to, members: [] });
    groups.get(key).members.push(link);
  }
  return [...groups.values()]
    .map((group) => {
      const members = [...group.members].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const counts = new Map();
      for (const member of members) counts.set(member.type, (counts.get(member.type) ?? 0) + 1);
      const type = [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
      return {
        ...group,
        members,
        count: members.length,
        type,
        disputed: members.some((m) => m.confidence === 'disputed'),
      };
    })
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

// Where the members of a coincident cluster go when it is spread open:
// offsets from the common point, in SVG units at k = 1. A ring while they
// fit on one, then further rings outward — a spiral in effect — with the
// members shared out between the rings in proportion to the room each has,
// so the outer ring is never left holding one lonely mark.
export function spreadPositions(count, { radius = SPREAD_RADIUS, gap = SPREAD_GAP } = {}) {
  if (count <= 0) return [];
  const capacityOf = (ring) => Math.max(1, Math.floor((2 * Math.PI * radius * (ring + 1)) / gap));
  const capacities = [];
  let total = 0;
  while (total < count) {
    capacities.push(capacityOf(capacities.length));
    total += capacities[capacities.length - 1];
  }
  // Largest-remainder apportionment over the rings' capacities.
  const exact = capacities.map((c) => (count * c) / total);
  const share = exact.map(Math.floor);
  const order = exact
    .map((value, ring) => ({ ring, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.ring - b.ring);
  for (let i = 0; i < count - share.reduce((a, b) => a + b, 0); i += 1) {
    share[order[i % order.length].ring] += 1;
  }

  const positions = [];
  share.forEach((n, ring) => {
    const r = radius * (ring + 1);
    for (let i = 0; i < n; i += 1) {
      // From the top, clockwise; odd rings offset by half a step so the
      // marks of one ring do not sit directly outside those of the last.
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n + (ring % 2 ? Math.PI / n : 0);
      positions.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r, ring, radius: r, angle });
    }
  });
  return positions;
}
