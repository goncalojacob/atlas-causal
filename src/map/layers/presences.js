// Territories: who held which ground in the last year of the window. Drawn
// under the events and over the coastlines, so a mark still sits on top of
// the state it happened in.
//
// One year and not the window, because a border is a state of affairs and
// not an interval: drawing every outline a fifteen-year window touches would
// stack four Angolas on each other. The far end is the year the reader has
// dragged to, and the timeline's band says which year that is.
//
// Honesty in the drawing, not a legend of forty hues. Everything is cobalt
// on white: an independent state is a thin line and a very faint fill; a
// dependency is a lighter line and a slightly stronger fill, so the eye
// separates "its own" from "somebody's" without being told which sovereign
// by colour; a presence whose confidence is `disputed` is dashed, which is
// what a disputed edge already looks like on this map. Who was where is
// answered by hovering and by clicking, which is the only honest way when
// two hundred polities share one palette.

import { svg, svgTitle } from '../../util/dom.js';
import { geometryPath } from './land.js';
import { formatInterval } from '../../util/dates.js';

const DEPENDENCY_LABEL = Object.freeze({
  colony: 'colony of',
  protectorate: 'protectorate of',
  mandate: 'mandate of',
  occupied: 'occupied by',
});

// What a presence says when the pointer rests on it: who, how long, and
// whose, when it was somebody's.
export function presenceTitle(presence, { nameOf }) {
  const who = nameOf(presence.actor) ?? presence.actor;
  const held = presence.dependencyKind
    ? `${DEPENDENCY_LABEL[presence.dependencyKind]} ${presence.dependencyOf ? nameOf(presence.dependencyOf) ?? presence.dependencyOf : 'an administration that is not a state on this map'}`
    : null;
  const when = formatInterval(presence.when);
  return `${who}${held ? ` — ${held}` : ''} · ${when}${presence.confidence === 'disputed' ? ' · disputed' : ''}`;
}

export function presenceClasses(presence, { actorId, dependencyIds }) {
  return ['presence',
    presence.dependencyOf ? 'dependency' : 'sovereign',
    presence.confidence === 'disputed' ? 'disputed' : '',
    presence.actor === actorId || dependencyIds.has(presence.id) ? 'of-actor' : '',
  ].filter(Boolean).join(' ');
}

export function createPresencesLayer(group, projection, { onSelect, atlas }) {
  // What the last render drew, so scrubbing the slider inside one period
  // does not rebuild two hundred paths on every tick.
  let signature = null;
  // Which render asked for a shard: an older fetch arriving late must not
  // draw over a newer year.
  let token = 0;

  group.addEventListener('click', (e) => {
    const el = e.target.closest('[data-actor]');
    if (el) onSelect(el.getAttribute('data-actor'));
  });

  const nameOf = (id) => atlas.actors.get(id)?.name ?? null;

  return {
    // year: astronomical, the window's far end; clamped by the atlas to the
    // last year the outlines cover. actorId: the selected actor, whose
    // territory and whose dependencies' territory are filled in.
    render({ year: requested, actorId = null, onReady = null }) {
      const year = atlas.territoryYear(requested);
      if (year === null) {
        group.replaceChildren();
        signature = null;
        return { drawn: 0, pending: false };
      }
      const shard = atlas.shardForYear(year);
      if (!shard) {
        group.replaceChildren();
        signature = null;
        return { drawn: 0, pending: false };
      }
      const outlines = atlas.loadedGeometry(shard.file);
      if (!outlines) {
        // Nothing is cleared while a shard loads: the year before it is
        // usually the same map, and a blank flash would be worse than a
        // frame of staleness.
        const mine = (token += 1);
        atlas.loadGeometry(shard.file).then(() => {
          if (mine === token && onReady) onReady();
        }, () => {});
        return { drawn: 0, pending: true };
      }

      const visible = atlas.presencesAt(year);
      const dependencyIds = new Set(
        actorId ? (atlas.dependenciesOf.get(actorId) ?? []).map((p) => p.id) : [],
      );
      const key = `${shard.file}|${actorId ?? ''}|${visible.map((p) => p.id).join(',')}`;
      if (key === signature) return { drawn: visible.length, pending: false };
      signature = key;

      group.replaceChildren();
      for (const presence of visible) {
        const outline = outlines.get(presence.geometry.key);
        if (!outline) continue;
        const d = geometryPath(outline, projection.project);
        if (!d) continue;
        group.appendChild(svg('path', {
          d,
          class: presenceClasses(presence, { actorId, dependencyIds }),
          'fill-rule': 'evenodd',
          'data-actor': presence.actor,
          'data-presence': presence.id,
        }, [svgTitle(presenceTitle(presence, { nameOf }))]));
      }
      return { drawn: visible.length, pending: false };
    },
  };
}
