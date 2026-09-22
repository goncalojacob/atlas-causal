// M70: dead code out, standing in.
//
// Two things the owner decided on 21 September, and this is the half of both
// that `node --test` can hold without a browser.
//
// **The fold is gone.** M30c's semantic collapse drew a parent's parts inside
// it while the reader was zoomed out; M65 made it unreachable and left the
// code standing, with its own tests still green on a rule nothing followed.
// The owner: *"Remove it."* What is asserted here is **structural** — no
// module under `src/` imports or names the file, and the class it wrote is in
// no stylesheet — because a behaviour that is gone cannot be tested by
// exercising it, and the only honest guard against it coming back by accident
// is that nothing reaches for it.
//
// **A reader can see what has been read.** One predicate, `hasBeenRead`, read
// by the card and by the masthead and written into the index by the builder;
// what is asserted is that the three are the same answer, record by record, on
// the real corpus and on the fixtures. That is the whole point of the
// milestone: a count in the bar and a line on a card that could drift apart
// would be worse than neither.
//
// Written before the behaviour it judges (deviations 711 and 717).
//
// **No test here pins a count.** Every number below is read off the corpus and
// compared with another reading of the same corpus, so the next import cannot
// make one of them false while leaving the atlas right.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import {
  hasBeenRead, readersOf, standingText, standingHtml, standingSlot, readCount, readCountText,
} from '../src/standing.js';
import { isReviewed, REVIEW_STATUS } from '../src/origin.js';
import { CORE_COLUMNS, SPINE_COLUMNS, decodeSpineFile, SPINE_KINDS } from '../src/spine.js';
import { buildCore, buildTopology } from '../src/validate/core.js';
import { workingSet } from '../src/emphasis.js';
import { defaultState } from '../src/state.js';
import { ROOT, atlasOf, topologyOf, FIXTURE_DATA } from './helpers.mjs';
// The records as they are on disk, `review` block and all — the reference the
// index's own column is checked against. `corpusOf` would not do: it reads the
// built index, and comparing the index with itself would say nothing.
import { readRecords, readRegions } from '../tools/lib/read.mjs';

const dataDir = path.join(ROOT, 'data');

async function walk(dir, ext = '.js') {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

// ─── 1. The fold is gone ───────────────────────────────────────────────────

test('nothing under src/ imports collapse.js, and the file is not there', async () => {
  await assert.rejects(stat(path.join(ROOT, 'src', 'graph-view', 'collapse.js')), 'collapse.js is deleted');
  const files = await walk(path.join(ROOT, 'src'));
  assert.ok(files.length >= 15, 'the walk found the modules');
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const where = path.relative(ROOT, file);
    assert.doesNotMatch(text, /from\s+'[^']*collapse\.js'/, `${where} imports collapse.js`);
    assert.doesNotMatch(text, /\bcollapseLayout\b/, `${where} calls collapseLayout`);
    assert.doesNotMatch(text, /\bCOLLAPSE_ZOOM\b/, `${where} reads COLLAPSE_ZOOM`);
  }
});

// The look the fold wore, and the one it left behind. `node.collapsed` was a
// filled mark with a `+N` beside it; nothing writes that class now, so the
// stylesheet must not still be dressing it — a rule for a class no drawing
// produces is the next reader's false lead.
test('the graph writes no collapsed node, and the stylesheet dresses none', async () => {
  const graph = await readFile(path.join(ROOT, 'src', 'graph-view', 'graph-view.js'), 'utf8');
  assert.doesNotMatch(graph, /'collapsed'/, 'no node is classed collapsed');
  assert.doesNotMatch(graph, /data-collapsed/, 'and no badge names one');
  const css = await readFile(path.join(ROOT, 'src', 'style.css'), 'utf8');
  assert.doesNotMatch(css, /\.node\.collapsed/, 'the stylesheet has no rule for it');
});

// What the fold said is still said, by the rule and by the ring. Asserted on
// `emphasis.js`'s own answer rather than on a drawing: at rest a part is not
// in the picture at all, which is the sentence *there is more inside this one*
// told by leaving the parts out, and `parts.js` is what puts the ring on.
test('what the fold said, the resting rule and the ring still say', async () => {
  const atlas = await atlasOf(FIXTURE_DATA);
  const resting = workingSet(atlas, { ...defaultState(), degree: 0 }).shown;
  const parents = [...atlas.childrenOf.keys()].filter((id) => (atlas.childrenOf.get(id) ?? []).length > 0);
  assert.ok(parents.length > 0, 'the fixtures hold a parent');
  for (const id of parents) {
    const event = atlas.events.get(id);
    if (!event || event.status !== 'active' || !resting.has(id)) continue;
    for (const child of atlas.childrenOf.get(id) ?? []) {
      assert.equal(resting.has(child), false, `${child} is part of ${id} and is out of the resting picture`);
    }
  }
});

// ─── 2. The standing marker: what it says ──────────────────────────────────

const signed = (on = '2026-09-21', name = 'Ana Sousa') => ({
  id: 'x', kind: 'event', status: 'active',
  review: { status: REVIEW_STATUS.reviewed, signedBy: [{ name, github: null, on }] },
});
const draft = () => ({ id: 'y', kind: 'event', status: 'active', review: { status: REVIEW_STATUS.draft } });
const nothing = () => ({ id: 'z', kind: 'event', status: 'active' });

test('a draft says unread and a reviewed record names its reviewer', () => {
  assert.equal(hasBeenRead(draft()), false);
  assert.match(standingText(draft()), /^Unread/);

  const record = signed();
  assert.equal(hasBeenRead(record), true);
  assert.match(standingText(record), /Ana Sousa/);
  assert.match(standingText(record), /2026-09-21/);
  assert.deepEqual(readersOf(record), [{ name: 'Ana Sousa', on: '2026-09-21' }]);
});

// A record that claims no standing at all is not a third kind of thing to a
// reader: nobody has signed it, so nobody has read it, and it says the same
// words a draft says. The distinction between the two is the validator's
// (`unread` warning) and the review queue's, not the card's.
test('a record with no review block reads as unread, in the same words', () => {
  assert.equal(hasBeenRead(nothing()), false);
  assert.equal(standingText(nothing()), standingText(draft()));
});

test('two signatures are both named', () => {
  const record = signed();
  record.review.signedBy.push({ name: 'Bo Lima', github: null, on: '2026-09-22' });
  const text = standingText(record);
  assert.match(text, /Ana Sousa/);
  assert.match(text, /Bo Lima/);
});

// `data/` is untrusted input and a card puts this in the DOM.
test('a name out of the data is escaped before it is markup', () => {
  const record = signed('2026-09-21', '<script>alert(1)</script>');
  const html = standingHtml(record);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /class="standing read"/);
  assert.match(standingHtml(draft()), /class="standing unread"/);
  // A malformed signature is dropped rather than printed as `undefined`.
  const bad = { review: { status: REVIEW_STATUS.reviewed, signedBy: [{ github: 'nobody' }] } };
  assert.deepEqual(readersOf(bad), []);
  assert.doesNotMatch(standingText(bad), /undefined/);
  assert.equal(hasBeenRead(bad), true, 'signed with no readable name is still read');
});

// The slot a card is built with, before its own file has landed: empty, so a
// card never says "unread" about a record it has not seen.
test('the empty slot claims nothing', () => {
  assert.match(standingSlot(), /data-slot="standing"/);
  assert.doesNotMatch(standingSlot(), /[Uu]nread/);
  assert.doesNotMatch(standingSlot(), /Read by/);
});

// ─── 3. One source: the masthead and the cards cannot disagree ─────────────

test('the read count is the per-record answer, counted', () => {
  const records = [signed(), draft(), nothing(), signed('2026-09-22', 'Bo Lima')];
  const counted = readCount(records);
  assert.equal(counted.of, records.length);
  assert.equal(counted.read, records.filter((r) => hasBeenRead(r)).length);
  assert.match(readCountText(counted), /read$/);
  assert.equal(readCountText({ read: 0, of: 0 }), '', 'nothing in view says nothing');
});

// The core the masthead counts over and the record a card reads are the same
// answer, event by event, on the real corpus. Not a number: the two readings
// are compared with each other, so a corpus somebody starts signing tomorrow
// moves both at once or fails here.
const eventsOnDisk = async (dir) => {
  const { entries, problems } = await readRecords(dir);
  assert.deepEqual(problems, [], `${dir}: the records read cleanly`);
  return entries.map((e) => e.record).filter((r) => r.kind === 'event');
};

for (const [label, dir] of [['the repository', dataDir], ['the fixtures', FIXTURE_DATA]]) {
  test(`the index column and the record agree about every event, over ${label}`, async () => {
    const core = decodeSpineFile(buildCore(await topologyOf(dir)), SPINE_KINDS, CORE_COLUMNS);
    const rows = new Map(core.events.map((e) => [e.id, e]));
    const records = await eventsOnDisk(dir);
    assert.ok(records.length > 0);
    for (const record of records) {
      const row = rows.get(record.id);
      if (!row) continue;
      assert.equal(
        hasBeenRead(row), isReviewed(record),
        `${record.id}: the index says ${hasBeenRead(row)} and the file's review block says ${isReviewed(record)}`,
      );
      assert.equal(hasBeenRead(record), isReviewed(record), `${record.id}: and it is review.status and nothing else`);
    }
  });
}

// The positive case, which no corpus on disk can supply: **nought of the
// 10,638 records have been signed**, so a column that was never written at all
// would agree with every record above and say nothing whatever.
//
// So the signature is added **in memory**, to the fixtures' own records, and
// the corpus on disk is left exactly as it is. That is deliberate and not a
// shortcut: signing a fixture file is a claim about a synthetic record that
// four migration tools then rightly refuse to touch — `migrate.js`'s
// migration 4 will not take a signature back, and the roles and categories
// tools stand off a reviewed record — and five suites would have had to be
// taught about a signature that exists only to be looked at.
//
// What is asserted is the whole path: the record's `review` block, the
// topology's `reviewed`, the core row the masthead counts, the count itself,
// and the sentence a card prints.
test('a signature travels from the record to the count and the sentence', async () => {
  const { entries, problems } = await readRecords(FIXTURE_DATA);
  assert.deepEqual(problems, []);
  const records = entries.map((e) => e.record);
  const subject = records.find((r) => r.kind === 'event' && r.status === 'active');
  assert.ok(subject, 'the fixtures hold an active event');
  assert.equal(isReviewed(subject), false, 'and nobody has signed it on disk');

  const before = decodeSpineFile(
    buildCore(buildTopology(records, await readRegions(FIXTURE_DATA))), SPINE_KINDS, CORE_COLUMNS,
  );
  assert.equal(readCount(before.events).read, 0, 'so nothing is read to begin with');

  const signature = { name: 'Fixture Reviewer', github: null, on: '2026-02-01' };
  const read = { ...subject, review: { status: REVIEW_STATUS.reviewed, signedBy: [signature] } };
  const after = decodeSpineFile(
    buildCore(buildTopology(records.map((r) => (r.id === subject.id ? read : r)), await readRegions(FIXTURE_DATA))),
    SPINE_KINDS, CORE_COLUMNS,
  );

  const row = after.events.find((e) => e.id === subject.id);
  assert.equal(hasBeenRead(row), true, 'the core row carries the signature');
  assert.equal(readCount(after.events).read, 1, 'the masthead counts exactly the one that was signed');
  assert.equal(readCount(after.events).of, readCount(before.events).of, 'and no event left the picture for it');
  assert.ok(readCount(after.events).read < readCount(after.events).of, 'with unread events beside it');
  // And what the card would print about the same record.
  assert.match(standingText(read), /^Read by Fixture Reviewer/);
  assert.match(standingText(read), /2026-02-01/);
  assert.deepEqual(readersOf(read), [{ name: signature.name, on: signature.on }]);
});

// The column is in the core and in the spine, and it is what a trailing trim
// takes away on a record nobody has signed. Said on the tables, because it is
// the tables that decide what a row costs.
test('the reviewed column is the core\'s, and costs nothing where nobody has signed', () => {
  const names = (table) => table.event.columns.map((c) => c.name);
  assert.ok(names(CORE_COLUMNS).includes('reviewed'), 'a mark is drawn from the core, and so is the count over it');
  assert.ok(names(SPINE_COLUMNS).includes('reviewed'));
  const column = CORE_COLUMNS.event.byName.get('reviewed');
  assert.equal(column.absent, 'omit', 'absent means unread, and no key is written for it');
  assert.equal(
    names(CORE_COLUMNS)[names(CORE_COLUMNS).length - 1], 'reviewed',
    'and it is last, so the trim reaches it',
  );
});

// ─── 4. A draft is still drawn ─────────────────────────────────────────────
//
// The one thing this milestone must not become. The marker is honesty on the
// surface; if it ever starts narrowing a picture, this fails.
test('a draft is still drawn, and nothing that decides what is drawn reads standing', async () => {
  const atlas = await atlasOf(dataDir);
  const shown = workingSet(atlas, { ...defaultState(), degree: 0 }).shown;
  const drawn = atlas.activeEvents.filter((e) => shown.has(e.id));
  assert.ok(drawn.length > 0, 'the resting picture has events in it');
  assert.ok(drawn.some((e) => !hasBeenRead(e)), 'and unread events are among them');
  // The corpus is drafts almost end to end today, so "some" is weak on its
  // own: every event the picture is of is drawn whatever its standing, which
  // is asserted by counting the picture against itself rather than by naming
  // a number.
  const read = drawn.filter((e) => hasBeenRead(e)).length;
  assert.equal(drawn.length, read + drawn.filter((e) => !hasBeenRead(e)).length);

  for (const file of ['emphasis.js', 'lens.js', 'lanes.js', 'cluster.js', 'large.js', 'parts.js']) {
    const text = await readFile(path.join(ROOT, 'src', file), 'utf8');
    assert.doesNotMatch(text, /from\s+'[^']*standing\.js'/, `${file} must not read standing: it decides what is drawn`);
    assert.doesNotMatch(text, /\bhasBeenRead\b/, `${file} must not ask whether a record has been read`);
  }
});
