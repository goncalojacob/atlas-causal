// Coastlines: every land polygon as one SVG path. Knows the projection's
// project() and nothing else.

import { svg } from '../../util/dom.js';

function ringPath(ring, project) {
  return ring
    .map(([lon, lat], i) => {
      const [x, y] = project([lon, lat]);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join('') + 'Z';
}

// GeoJSON Polygon or MultiPolygon → path data. Holes are rings too; the
// even-odd fill rule in the stylesheet punches them out.
export function geometryPath(geometry, project) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  return polygons.map((polygon) => polygon.map((ring) => ringPath(ring, project)).join('')).join('');
}

export function createLandLayer(group, projection) {
  return {
    render(land) {
      group.replaceChildren();
      if (!land) return;
      const d = land.features.map((f) => geometryPath(f.geometry, projection.project)).join('');
      group.appendChild(svg('path', { d, class: 'land', 'fill-rule': 'evenodd' }));
    },
  };
}
