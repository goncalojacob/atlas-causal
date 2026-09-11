// TopoJSON → GeoJSON, in the fifty lines this project needs and no more.
// Pure: no fs, no network, no dependencies.
//
// A TopoJSON topology stores every boundary once, as an *arc*, and every
// polygon as a list of indices into that shared list. That is the whole
// reason the import reads TopoJSON rather than GeoJSON: simplifying the arcs
// simplifies every polygon that uses them identically, so two countries that
// share a border still share it afterwards. Decoding first and simplifying
// after would tear those borders apart.

// An index of ~i (that is, -i-1) means "arc i, walked backwards".
export function arcIndex(index) {
  return index < 0 ? { index: ~index, reversed: true } : { index, reversed: false };
}

// The arcs one geometry of the collection walks, each once and without its
// direction: an arc walked backwards by one of two neighbours is the same
// line on the ground, and which way round it was walked says nothing about
// whether it is a border.
export function arcsOfGeometry(geometry) {
  const rings = geometry?.type === 'Polygon' ? geometry.arcs
    : geometry?.type === 'MultiPolygon' ? geometry.arcs.flat() : [];
  const out = new Set();
  for (const ring of rings) for (const raw of ring) out.add(arcIndex(raw).index);
  return out;
}

// Which geometries walk each arc: arc index → their indices in the
// collection, in the order the file gives them. This is the question the
// topology exists to answer and the reason the import reads TopoJSON at all —
// an arc two features share is the boundary between them, and an arc one
// feature has to itself is the edge of the world it sits in.
export function arcUsers(topology, objectName) {
  const object = topology.objects[objectName];
  if (!object || object.type !== 'GeometryCollection') {
    throw new Error(`${objectName} is not a GeometryCollection in this topology`);
  }
  const users = new Map();
  object.geometries.forEach((geometry, index) => {
    for (const arc of arcsOfGeometry(geometry)) {
      if (!users.has(arc)) users.set(arc, []);
      users.get(arc).push(index);
    }
  });
  return users;
}

// Coordinates are either absolute, or quantized deltas to be summed and
// scaled back by the topology's transform. CShapes 2.0 has no transform;
// the branch is here so the module is not a trap for the next file.
export function decodeArcs(topology) {
  const { transform } = topology;
  return topology.arcs.map((arc) => {
    if (!transform) return arc.map((p) => [p[0], p[1]]);
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * transform.scale[0] + transform.translate[0], y * transform.scale[1] + transform.translate[1]];
    });
  });
}

// One ring from its list of arc indices. Consecutive arcs share an endpoint,
// so every arc after the first contributes all but its first point.
export function ringFrom(arcs, indices) {
  const ring = [];
  for (const raw of indices) {
    const { index, reversed } = arcIndex(raw);
    const arc = arcs[index];
    if (!arc) continue;
    const points = reversed ? [...arc].reverse() : arc;
    for (let i = ring.length === 0 ? 0 : 1; i < points.length; i += 1) ring.push(points[i]);
  }
  return ring;
}

// A Polygon or MultiPolygon geometry object from the topology's geometry
// collection, as GeoJSON. Anything else returns null: this import has no use
// for points or lines and should say so rather than emit half a shape.
export function decodeGeometry(geometry, arcs) {
  if (geometry.type === 'Polygon') {
    return { type: 'Polygon', coordinates: geometry.arcs.map((ring) => ringFrom(arcs, ring)) };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.arcs.map((polygon) => polygon.map((ring) => ringFrom(arcs, ring))),
    };
  }
  return null;
}

// The whole object: [{ properties, geometry }], in the order the file gives.
export function decodeCollection(topology, objectName) {
  const object = topology.objects[objectName];
  if (!object || object.type !== 'GeometryCollection') {
    throw new Error(`${objectName} is not a GeometryCollection in this topology`);
  }
  const arcs = decodeArcs(topology);
  return object.geometries.map((geometry) => ({
    properties: geometry.properties ?? {},
    geometry: decodeGeometry(geometry, arcs),
  }));
}
