// The tenure strip on the actor's card: one per office the actor owns,
// holders as bars over the actor's own years, merged where they would overlap
// and opening the person who held the post.
//
// Laid out without measuring anything, so all of it can be held here: the
// scale is a pure function of two intervals and the bars are numbers in the
// strip's own units.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  stripScale, tenureBars, tenureClusters, tenureClusterAt, officeStripsSection, STRIP_UNITS,
} from '../src/panel/office.js';
import { clusterHtml } from '../src/panel/cluster.js';
import { atlasOf, FIXTURE_DATA, ROOT } from './helpers.mjs';

function context(atlas) {
  return {
    atlas,
    laneLabel: (region) => region ?? '',
    startYear: (event) => event.when.start,
  };
}

const atlas = await atlasOf(FIXTURE_DATA);
const polity = atlas.actors.get('fixture-polity-three');
const office = atlas.offices.get('fixture-office-one');

test('the scale is the actor\'s own interval, held inside what the atlas holds', () => {
  // The polity runs from 1100 with no end and the fixture atlas holds
  // 1200–1300, so the strip starts where the records do and ends where they
  // end: an actor's own years never stretch the picture past the corpus.
  assert.deepEqual(atlas.extent, { min: 1200, max: 1300 });
  assert.deepEqual(stripScale(polity, atlas.extent), { min: 1200, max: 1300 });
  assert.deepEqual(stripScale({ when: { start: 1220, end: 1250 } }, atlas.extent), { min: 1220, max: 1250 });
  // An actor with no interval of its own gets the extent whole.
  assert.deepEqual(stripScale({ when: null }, atlas.extent), { min: 1200, max: 1300 });
  // And with nothing to scale against there is no strip.
  assert.equal(stripScale(polity, null), null);
});

test('a bar spans the years of its turn, in the strip\'s own units', () => {
  const { scale, bars } = tenureBars(atlas, polity, office);
  assert.deepEqual(scale, { min: 1200, max: 1300 });
  const at = (year) => ((year - 1200) / 100) * STRIP_UNITS;
  assert.deepEqual(bars.map((b) => b.id),
    ['fixture-tenure-one', 'fixture-tenure-two', 'fixture-tenure-three']);
  assert.equal(bars[0].x.toFixed(2), at(1200).toFixed(2));
  assert.equal((bars[0].x + bars[0].width).toFixed(2), at(1210).toFixed(2));
  assert.equal(bars[2].x.toFixed(2), at(1230).toFixed(2));
});

test('bars that would overlap are merged, and the widest turn is what is drawn', () => {
  const { clusters } = tenureClusters(atlas, polity, office);
  // 1200–1210 and 1208–1220 are 133 units apart in the middle, so they stay
  // apart at this width; three separate turns, three bars.
  assert.deepEqual(clusters.map((c) => c.count), [1, 1, 1]);

  // Squeeze the same three turns into a tenth of the scale and they merge.
  const narrow = { ...polity, when: { start: 1200, end: 1800 } };
  const merged = tenureClusters({ ...atlas, extent: { min: 1200, max: 1800 } }, narrow, office);
  const stacks = merged.clusters.filter((c) => c.count > 1);
  assert.ok(stacks.length > 0, 'the three turns are one bar at this width');
  // The seed is the widest of them, which is the bar the reader can see.
  const widest = Math.max(...stacks[0].members.map((m) => m.bar.width));
  assert.equal(stacks[0].representative.bar.width, widest);
});

test('a merged bar opens a list of its turns, and each row opens the holder', () => {
  const narrow = { ...polity, when: { start: 1200, end: 1800 } };
  const wide = { ...atlas, extent: { min: 1200, max: 1800 } };
  const key = tenureClusters(wide, narrow, office).clusters.find((c) => c.count > 1).key;
  const cluster = tenureClusterAt(wide, narrow, office, key);
  assert.equal(cluster.on, 'tenures');
  assert.equal(cluster.office.id, 'fixture-office-one');
  const html = clusterHtml(context(atlas), cluster);
  assert.match(html, /turns here/);
  assert.match(html, /data-action="actor" data-id="fixture-actor-one"/);
  assert.match(html, /data-action="office" data-id="fixture-office-one"/);
  // A key nothing was grouped under is not a list of everything.
  assert.equal(tenureClusterAt(wide, narrow, office, 'no-such-cluster'), null);
});

test('the section draws one strip per office, and a bar opens the holder', () => {
  const section = officeStripsSection(context(atlas), polity);
  assert.equal(section.key, 'offices');
  assert.equal(section.count, 1);
  assert.match(section.body, /viewBox="0 0 1000 24"/);
  assert.match(section.body, /preserveAspectRatio="none"/);
  // Clicking a bar opens the person, never the tenure.
  assert.match(section.body, /<rect class="tenure-bar"[^>]*data-action="actor" data-id="fixture-actor-one"/);
  assert.doesNotMatch(section.body, /data-action="tenure"/);
  // The office's own name is the way to its card.
  assert.match(section.body, /data-action="office" data-id="fixture-office-one"/);
  // The scale is written out, so the picture says which years it covers.
  assert.match(section.body, /<span>1200<\/span>\s*<span>1300<\/span>/);
});

test('an actor that owns no office has no section at all', () => {
  assert.equal(officeStripsSection(context(atlas), atlas.actors.get('fixture-actor-one')), null);
});

test('nothing from a record reaches the strip unescaped', () => {
  const nasty = {
    ...atlas,
    offices: new Map([['x', { ...office, id: 'x', title: '<script>alert(1)</script>' }]]),
    officesByActor: new Map([['fixture-polity-three', [{ ...office, id: 'x', title: '<script>alert(1)</script>' }]]]),
    tenuresByOffice: new Map([['x', atlas.tenuresByOffice.get('fixture-office-one')]]),
  };
  const section = officeStripsSection(context(nasty), polity);
  assert.doesNotMatch(section.body, /<script>/);
  assert.match(section.body, /&lt;script&gt;/);
});

test("the atlas's own strip: Portugal's three posts, and every turn counted", async () => {
  const own = await atlasOf(path.join(ROOT, 'data'));
  const section = officeStripsSection(context(own), own.actors.get('portugal'));
  assert.equal(section.count, 3, 'monarch, president, prime minister');
  assert.match(section.body, /data-action="office" data-id="prime-minister-of-portugal"/);
  assert.match(section.body, /data-action="actor" data-id="salazar"/);
  // Which bars survive the clustering is the strip's business and moves with
  // the corpus — Marcelo Caetano's is inside a cluster now that M31-2 has
  // written twenty-five more turns at this post. What each row must say is how
  // many turns there are, which is the number of records and not a number
  // written out here.
  for (const office of ['monarch-of-portugal', 'president-of-portugal', 'prime-minister-of-portugal']) {
    const count = section.body.match(new RegExp(`data-id="${office}"[\\s\\S]*?<span class="count">(\\d+)</span>`))?.[1];
    assert.equal(Number(count), (own.tenuresByOffice.get(office) ?? []).length, office);
  }
  // Until M31-1 two of the three had no holder recorded and said so rather
  // than drawing an empty picture. The crown and the presidency have their
  // holders now, so nothing says it.
  assert.equal((section.body.match(/No turn at this post is recorded yet\./g) ?? []).length, 0);
  assert.match(section.body, /data-action="office" data-id="monarch-of-portugal"/);
  assert.match(section.body, /data-action="office" data-id="president-of-portugal"/);
  // Portugal starts in 1886, the earliest record is 1899, and the strip is
  // held to what the atlas holds: it starts at the corpus and not at the
  // actor's own first year.
  assert.deepEqual(own.extent, { min: 1899, max: 2025 });
  assert.match(section.body, /<span>1899<\/span>\s*<span>2025<\/span>/);
});
