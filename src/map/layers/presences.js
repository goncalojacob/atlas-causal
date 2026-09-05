// Territories: who held which ground in the last year of the window. Drawn
// under the events and over the coastlines, so a mark still sits on top of
// the state it happened in.
//
// One year and not the window, because a border is a state of affairs and
// not an interval: drawing every outline a fifteen-year window touches would
// stack four Angolas on each other. The far end is the year the reader has
// dragged to, and the timeline's band says which year that is.
//
// Colour, and what it does and does not say. Since M19 a state is filled
// with one of eight muted hues and outlined in the same hue darkened; a
// dependency is filled with the lighter tint OF ITS OWNER and outlined
// dotted, so Portugal, Angola-before-1975 and Goa read as one family and
// Belgian Congo reads as another; a presence whose confidence is `disputed`
// is dashed, which is what a disputed edge already looks like on this map.
//
// The hue means "not the same as the one beside it" and nothing else. Which
// actor gets which is a graph colouring over the borders themselves
// (tools/build-palette.mjs → data/geo/palette.json), so there is no legend
// by hue and there is not going to be one: who was where is still answered by
// hovering and by clicking, which is the only honest answer when two hundred
// polities share eight colours. about.html says this in prose.
//
// What colour must not do is take the top of the hierarchy. The selected
// actor is cobalt over everything — drawn last as well as loudest — and the
// walked chain stays madder above that, so territory colour sits under both.

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

// Whose hue a presence is drawn in: its owner's when it is somebody's, its
// own otherwise. The same rule the palette was built with, and it has to be
// the same rule or a dependency would be filled with a hue chosen for a
// border it does not have.
export const hueActorOf = (presence) => presence.dependencyOf ?? presence.actor;

export function presenceClasses(presence, { actorId, dependencyIds, hueOf = () => null }) {
  const hue = hueOf(hueActorOf(presence));
  return ['presence',
    presence.dependencyOf ? 'dependency' : 'sovereign',
    // No hue at all is a territory the palette has never been rebuilt for:
    // it keeps the old cobalt wash rather than disappearing.
    hue === null ? 'unhued' : `hue-${hue}`,
    presence.confidence === 'disputed' ? 'disputed' : '',
    presence.actor === actorId || dependencyIds.has(presence.id) ? 'of-actor' : '',
  ].filter(Boolean).join(' ');
}

export function createPresencesLayer(group, projection, { onSelect, atlas, onFailed = null }) {
  // What the last render drew, so moving the band inside one period does not
  // rebuild two hundred paths on every tick.
  let signature = null;
  // Which render asked for a shard: an older fetch arriving late must not
  // draw over a newer year.
  let token = 0;
  // Whether the last attempt at a shard failed. Nothing is cleared when one
  // does — the year before it is usually the same map — so without a word the
  // reader is looking at borders that are not the ones they asked for, and a
  // dropped request on a train is indistinguishable from a century with no
  // borders in it. Said once, and unsaid when a shard arrives.
  let failed = false;
  const report = (now) => {
    if (now === failed) return;
    failed = now;
    if (onFailed) onFailed(now);
  };

  group.addEventListener('click', (e) => {
    const el = e.target.closest('[data-actor]');
    if (el) onSelect(el.getAttribute('data-actor'));
  });

  const nameOf = (id) => atlas.actors.get(id)?.name ?? null;
  const hueOf = (id) => atlas.hueOfActor(id);

  return {
    // year: astronomical, the window's far end; clamped by the atlas to the
    // last year the outlines cover. actorId: the selected actor, whose
    // territory and whose dependencies' territory are filled in.
    render({ year: requested, actorId = null, onReady = null }) {
      const year = atlas.territoryYear(requested);
      if (year === null) {
        group.replaceChildren();
        signature = null;
        return { drawn: 0, pending: false, failed };
      }
      const shard = atlas.shardForYear(year);
      if (!shard) {
        group.replaceChildren();
        signature = null;
        return { drawn: 0, pending: false, failed };
      }
      const outlines = atlas.loadedGeometry(shard.file);
      if (!outlines) {
        // Nothing is cleared while a shard loads: the year before it is
        // usually the same map, and a blank flash would be worse than a
        // frame of staleness.
        const mine = (token += 1);
        atlas.loadGeometry(shard.file).then(() => {
          report(false);
          if (mine === token && onReady) onReady();
        }, () => {
          report(true);
        });
        return { drawn: 0, pending: true, failed };
      }

      const visible = atlas.presencesAt(year);
      const dependencyIds = new Set(
        actorId ? (atlas.dependenciesOf.get(actorId) ?? []).map((p) => p.id) : [],
      );
      const isOfActor = (p) => p.actor === actorId || dependencyIds.has(p.id);
      const key = `${shard.file}|${actorId ?? ''}|${visible.map((p) => p.id).join(',')}`;
      if (key === signature) return { drawn: visible.length, pending: false, failed };
      signature = key;

      group.replaceChildren();
      // The selected actor's ground last, so its cobalt is over every hue
      // rather than under whichever territory happens to sort after it.
      const order = [...visible].sort((a, b) => Number(isOfActor(a)) - Number(isOfActor(b)));
      for (const presence of order) {
        const outline = outlines.get(presence.geometry.key);
        if (!outline) continue;
        const d = geometryPath(outline, projection.project);
        if (!d) continue;
        group.appendChild(svg('path', {
          d,
          class: presenceClasses(presence, { actorId, dependencyIds, hueOf }),
          'fill-rule': 'evenodd',
          'data-actor': presence.actor,
          'data-presence': presence.id,
        }, [svgTitle(presenceTitle(presence, { nameOf }))]));
      }
      return { drawn: visible.length, pending: false, failed };
    },
  };
}
