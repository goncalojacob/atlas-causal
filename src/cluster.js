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
// was exactly on the threshold is on the far side of it.
const SPLIT_MARGIN = 1.05;

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
// Returns one cluster per group, heaviest seed first; every point is in
// exactly one cluster.
export function clusterPoints(points, { k = 1, distance = MERGE_DISTANCE, epsilon = COINCIDENT_EPSILON } = {}) {
  const threshold = distance / Math.max(k, Number.EPSILON);
  const withinCluster = threshold * threshold;
  const withinEpsilon = epsilon * epsilon;
  // Greedy, in seed order. O(n²) and honest about it: the dataset is in the
  // hundreds. At tens of thousands the fix is a grid index here, not a
  // different rule — the result would be the same clusters.
  const seeds = [...points].sort(byWeightThenId);
  const taken = new Set();
  const clusters = [];
  for (const seed of seeds) {
    if (taken.has(seed.id)) continue;
    taken.add(seed.id);
    const members = [seed];
    for (const other of seeds) {
      if (taken.has(other.id)) continue;
      if (distanceSquared(seed, other) <= withinCluster) {
        taken.add(other.id);
        members.push(other);
      }
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
      // Zooming in will eventually separate these; zooming into a
      // coincident cluster never would.
      splittable: members.length > 1 && !coincident,
      coreZoom: nearestSeparable === null ? null : (distance / nearestSeparable) * SPLIT_MARGIN,
      weight: members.reduce((sum, m) => sum + (m.weight ?? 0), 0),
    });
  }
  return clusters;
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
