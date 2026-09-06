// The wash a large event is drawn as: the polygons of its lane, tinted, in
// place of a mark it has no honest point for (m30b-brief, A8).
//
// A regional event — a war across a continent, a famine — is not a dot in one
// city, and drawing it as one would be a claim the record does not make. So
// the ground it covers is tinted instead, and the mark it does have, if it has
// one, is still drawn on top of it by the events layer.
//
// A `worldwide` event has no wash at all: a tint over the whole viewport would
// put a film over every coastline, territory and mark, and several of them
// would stack. The map says so in its corner instead (map.js).
//
// The shapes are `data/geo/regions.json`, the same file the lane derivation
// reads and the same one the boxes come from (data.js, util/geo.js). Knows the
// projection's project() and nothing else.

import { svg, svgTitle } from '../../util/dom.js';
import { geometryPath } from './land.js';

export function createRegionsLayer(group, projection, { shapes = null } = {}) {
  // One path per region, built once: the projection does not change under the
  // reader (a change of projection rebuilds the map), and these are the
  // largest shapes on the page.
  const paths = new Map();
  for (const feature of shapes?.features ?? []) {
    const id = feature?.properties?.region;
    if (typeof id !== 'string' || !feature.geometry) continue;
    const d = geometryPath(feature.geometry, projection.project);
    if (!d) continue;
    paths.set(id, (paths.get(id) ?? '') + d);
  }

  return {
    // washes: [{ region, title }], in the order they are to be drawn. A region
    // named twice is drawn once — two wars over one continent are two records
    // and one piece of ground, and stacking the tint would make the second one
    // look heavier than the first.
    render(washes) {
      group.replaceChildren();
      const seen = new Map();
      for (const { region, title } of washes) {
        if (!paths.has(region)) continue;
        if (!seen.has(region)) seen.set(region, []);
        seen.get(region).push(title);
      }
      for (const [region, titles] of seen) {
        group.appendChild(svg('path', {
          d: paths.get(region), class: 'region-wash', 'fill-rule': 'evenodd',
          'data-region': region, 'aria-hidden': 'true',
        }, [svgTitle(titles.join(' · '))]));
      }
      return seen.size;
    },
  };
}
