// The rename tool: `tools/migrate/ids.mjs`.
//
// What is being proved is that correcting an id changes what a record is
// filed under and nothing about what it says — the text, the review block,
// the signatures and the citation audit trail come out the other side
// untouched — and that everything written against the former id keeps
// working: a reference, a narrative step, a `review.citations` key, a
// `?chain=` link and the record's own history.
//
// Every test works on records built here or on a scratch copy of the fixture
// dataset, never on the repository's own files and never on the fixtures
// themselves (i7-brief, "Files this run touches"). **No record is renamed in
// this run**; the tool is written and held, and what to rename is the owner's
// and M31's to decide.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { renamePlan, partsOf, DERIVED_ID_KINDS } from '../tools/migrate/ids.mjs';
import { rewriteReferences } from '../src/references.js';
import { aliasIndex, resolveId } from '../src/validate/rules.js';
import { bodyCitations, bodyLinks } from '../src/markdown.js';
import { readRecords } from '../tools/lib/read.mjs';
import { recordHistories } from '../tools/lib/history.mjs';
import { chainEdges } from '../src/chain.js';
import { resolveRef } from '../src/narrative.js';
import { atlasOf, FIXTURE_DATA, ROOT } from './helpers.mjs';

const run = promisify(execFile);
const TOOL = path.join(ROOT, 'tools', 'migrate', 'ids.mjs');
const TODAY = '2026-09-08';

const ids = (list) => list.map((r) => r.id ?? r);
const read = async (data, rel) => JSON.parse(await readFile(path.join(data, rel), 'utf8'));

async function scratch(name = 'migrate-ids-') {
  const dir = await mkdtemp(path.join(tmpdir(), name));
  const data = path.join(dir, 'data');
  await cp(FIXTURE_DATA, data, { recursive: true });
  return { dir, data };
}

// The tool, over a scratch copy. `--today` is fixed so the assertions about
// `revised` are about the rename and not about the day the suite ran.
const tool = (data, ...args) => run(process.execPath, [TOOL, ...args, '--data', data, '--today', TODAY]);

// A universe of the shape checkRules builds, so `resolveId` can be asked the
// question the validator asks.
const universeOf = (records) => new Map(records.map((r) => [r.id, { kind: r.kind, entry: r }]));

// ─── Records built here, for the pure half ──────────────────────────────────
//
// Small and hand-made rather than read off the fixtures: what the plan does
// is easier to read against six records than against fifty-four, and the
// scratch-copy tests below are what hold it against the real shapes.

const envelope = (id, kind, over = {}) => ({
  schema: 1,
  id,
  kind,
  status: 'active',
  supersededBy: null,
  aliases: [],
  authors: [{ name: 'Fixture Author', github: 'fixture-author' }],
  license: 'CC-BY-SA-4.0',
  created: '2026-01-01',
  revised: null,
  sources: [{ source: 'a-book', locator: null }],
  ...over,
});

const event = (id, over = {}) => envelope(id, 'event', {
  title: `Event ${id}`,
  summary: 'Synthetic.',
  when: { start: 1400, end: 1400 },
  place: 'a-place',
  region: null,
  actors: [],
  ...over,
});

const edgeOf = (from, to, type = 'caused', over = {}) => envelope(`${from}--${to}--${type}`, 'edge', {
  from, to, type, confidence: 'consensus', explanation: 'Synthetic.', ...over,
});

// One event, two events it links to, an actor, a narrative that walks the
// link, and a source. Enough for a cascade and for every reference shape.
function corpus() {
  return [
    envelope('a-book', 'source', { sources: undefined, type: 'book', title: 'A book', creators: [] }),
    envelope('a-place', 'place', { sources: [], names: ['A place'], where: { lon: 0, lat: 0 } }),
    envelope('an-actor', 'actor', { names: ['An actor'], when: null }),
    event('first', { actors: [{ actor: 'an-actor', role: 'leader' }] }),
    event('second', { parent: 'first' }),
    edgeOf('first', 'second'),
    envelope('a-walk', 'narrative', {
      title: 'A walk',
      summary: 'Synthetic.',
      steps: [{ ref: 'first', text: 'One.' }, { ref: 'first--second--caused', text: 'Two.' }],
      window: { from: 1400, to: 1401 },
    }),
  ];
}

const find = (plan, id) => plan.writes.find((w) => w.from === id)?.record;

test('a rename changes the id, keeps the former one as an alias, and touches no other word', () => {
  const before = corpus();
  const plan = renamePlan(before, 'event', 'second', 'the-second', { today: TODAY });
  assert.equal(plan.error, undefined);

  const was = before.find((r) => r.id === 'second');
  const now = find(plan, 'second');
  assert.equal(now.id, 'the-second');
  assert.deepEqual(now.aliases, ['second'], 'the former id is what keeps resolving');
  assert.equal(now.revised, TODAY, 'the file changed, and ?v=<revised> is what tells a cache so');
  // Everything else, field for field: a rename is not an edit.
  for (const key of Object.keys(was)) {
    if (['id', 'aliases', 'revised'].includes(key)) continue;
    assert.deepEqual(now[key], was[key], key);
  }
  assert.deepEqual(Object.keys(now), Object.keys(was), 'and the fields stay in the order they were written in');
});

test('every reference to the renamed record is rewritten, in every kind that makes one', () => {
  const plan = renamePlan(corpus(), 'event', 'first', 'the-first', { today: TODAY });

  assert.equal(find(plan, 'second').parent, 'the-first');
  const edge = find(plan, 'first--second--caused');
  assert.equal(edge.from, 'the-first');
  assert.deepEqual(ids(find(plan, 'a-walk').steps.map((s) => ({ id: s.ref }))),
    ['the-first', 'the-first--second--caused'], 'a narrative step is a reference like any other');
  // Counted by the kind of the record that made the reference, which is what
  // the report prints.
  assert.deepEqual(plan.counts, { event: 1, edge: 1, narrative: 2 });
});

test('the cascade: a derived id follows its ends, and each renamed link keeps its own former id', () => {
  const plan = renamePlan(corpus(), 'event', 'first', 'the-first', { today: TODAY });
  assert.deepEqual(plan.renames, [
    { kind: 'event', from: 'first', to: 'the-first' },
    { kind: 'edge', from: 'first--second--caused', to: 'the-first--second--caused' },
  ]);
  const edge = find(plan, 'first--second--caused');
  assert.equal(edge.id, 'the-first--second--caused');
  assert.deepEqual(edge.aliases, ['first--second--caused']);
  assert.equal(edge.type, 'caused', 'a cascade moves an end and never the type');
});

test('a source rename moves the review.citations key and leaves the rest of the block alone', () => {
  const signed = {
    status: 'reviewed',
    signedBy: [{ name: 'A Reviewer', github: 'a-reviewer', on: '2026-02-02' }],
    flags: ['date'],
    note: 'Read against the book.',
    citations: { 'a-book': { verified: { by: 'A Reviewer', on: '2026-02-02' } } },
  };
  const before = corpus().map((r) => (r.id === 'first' ? { ...r, review: signed } : r));
  const plan = renamePlan(before, 'source', 'a-book', 'the-book', { today: TODAY });

  const now = find(plan, 'first').review;
  assert.deepEqual(Object.keys(now.citations), ['the-book'], 'the key is the cited source\'s id');
  assert.deepEqual(now.citations['the-book'], signed.citations['a-book'], 'and who checked it, on what day, is untouched');
  assert.equal(now.status, 'reviewed');
  assert.deepEqual(now.signedBy, signed.signedBy, 'a rename is not a change of content, so no signature is lost');
  assert.deepEqual(now.flags, signed.flags);
  assert.equal(now.note, signed.note);
  assert.equal(find(plan, 'first').sources[0].source, 'the-book');
});

// Rule 23: a body's citation marks must name sources the record cites and its
// links by id must resolve, so both are references and both move with a
// rename — while not a word of what the entry says is edited.
test('the two references inside a full entry move, and the prose around them does not', () => {
  const body = 'The fleet sailed [^a-book pp. 1-10] under [the actor](actor:an-actor).\n\n'
    + 'Not a reference: a-book, an-actor, [a link](https://example.invalid/a-book).';
  const before = corpus().map((r) => (r.id === 'first' ? { ...r, body } : r));
  const plan = renamePlan(before, 'source', 'a-book', 'the-book', { today: TODAY });
  const now = find(plan, 'first').body;

  assert.match(now, /\[\^the-book pp\. 1-10\]/, 'the mark moves and its locator does not');
  assert.match(now, /\[the actor\]\(actor:an-actor\)/, 'and a link to something else is left alone');
  assert.match(now, /Not a reference: a-book, an-actor/, 'an id in prose is prose');
  assert.match(now, /https:\/\/example\.invalid\/a-book/, 'and a URL is a URL');
  // The rewrite is by regex and the parser is by tokens, so what the parser
  // reads out of the new body is what holds the two together.
  assert.deepEqual(bodyCitations(now).map((c) => c.source), ['the-book']);

  const linked = renamePlan(before, 'actor', 'an-actor', 'the-actor', { today: TODAY });
  assert.deepEqual(bodyLinks(find(linked, 'first').body), [{ kind: 'actor', id: 'the-actor' }]);
  assert.deepEqual(bodyCitations(find(linked, 'first').body).map((c) => c.source), ['a-book']);
});

test('a former id resolves the way the validator resolves one', () => {
  const plan = renamePlan(corpus(), 'event', 'first', 'the-first', { today: TODAY });
  const after = plan.writes.map((w) => w.record)
    .concat(corpus().filter((r) => !plan.writes.some((w) => w.from === r.id)));
  const universe = universeOf(after);
  const aliases = aliasIndex(universe);

  assert.equal(resolveId('first', universe, { aliases }).id, 'the-first');
  assert.equal(resolveId('first--second--caused', universe, { aliases }).id, 'the-first--second--caused');
  assert.equal(resolveId('the-first', universe, { aliases }).id, 'the-first');
});

// ─── The refusals ───────────────────────────────────────────────────────────

test('every refusal in §1.1 refuses before anything is planned, and says which', () => {
  const cases = [
    [['event', 'first', 'The First'], /"The First" is not a slug/],
    [['event', 'first', 'second'], /already the id of an event/],
    [['event', 'nowhere', 'somewhere'], /no record has the id "nowhere"/],
    [['event', 'an-actor', 'the-actor'], /is an actor, not an event/],
    [['event', 'first', 'first'], /already has that id/],
    [['nonsense', 'first', 'the-first'], /unknown kind "nonsense"/],
    // An edge's id is three fields joined, so a "rename" of one is a
    // re-typing; moving an end is a different claim and is refused.
    [['edge', 'first--second--caused', 'first--second--enabled'], null],
    [['edge', 'first--second--caused', 'first--nowhere--caused'], /moves an end/],
    [['edge', 'first--second--caused', 'not-an-edge-id'], /is not a from--to--type edge id/],
  ];
  for (const [args, message] of cases) {
    const plan = renamePlan(corpus(), ...args, { today: TODAY });
    if (message === null) {
      assert.equal(plan.error, undefined, args.join(' '));
      continue;
    }
    assert.match(plan.error ?? '', message, args.join(' '));
    assert.equal(plan.writes, undefined, 'a refusal plans nothing');
  }
});

test('a new id that is already somebody\'s former id is refused: rule 2 keeps both unique', () => {
  const before = corpus().map((r) => (r.id === 'second' ? { ...r, aliases: ['the-first'] } : r));
  const plan = renamePlan(before, 'event', 'first', 'the-first', { today: TODAY });
  assert.match(plan.error, /already an alias of "second"/);
});

test('a tombstone is not renamed: the record that stands in its place is', () => {
  const before = corpus().map((r) => (r.id === 'second'
    ? { ...r, status: 'merged', supersededBy: 'first' } : r));
  assert.match(renamePlan(before, 'event', 'second', 'the-second', { today: TODAY }).error,
    /is merged, not an active record — rename "first", which superseded it/);

  const retracted = corpus().map((r) => (r.id === 'second'
    ? { ...r, status: 'retracted', retraction: { on: '2026-02-02', reason: 'Synthetic.' } } : r));
  assert.match(renamePlan(retracted, 'event', 'second', 'the-second', { today: TODAY }).error,
    /is retracted, not an active record/);
});

// Amendment A2, plan review finding 14. A CShapes actor's presences are
// `<actor>-<year>` and its id is a value in the mapping file: the next
// `--import` re-derives both from the map, so a rename made here would be
// undone beside the stale records the import still owns.
test('a record an import created is refused, and the message says where it is corrected', () => {
  for (const t of ['cshapes', 'wikidata']) {
    const before = corpus().map((r) => (r.id === 'an-actor' ? { ...r, origin: { tool: t } } : r));
    const plan = renamePlan(before, 'actor', 'an-actor', 'the-actor', { today: TODAY });
    assert.match(plan.error, new RegExp(`created by the ${t} import and is corrected in data/imports/`));
    assert.match(plan.error, /re-run the import/);
  }
  // A record the assistant or the form wrote is a record a person owns.
  for (const t of ['assistant', 'form']) {
    const before = corpus().map((r) => (r.id === 'an-actor' ? { ...r, origin: { tool: t } } : r));
    assert.equal(renamePlan(before, 'actor', 'an-actor', 'the-actor', { today: TODAY }).error, undefined, t);
  }
});

test('a cascade that would collide with an id already taken is refused whole', () => {
  const before = [...corpus(), edgeOf('the-first', 'second')];
  const plan = renamePlan(before, 'event', 'first', 'the-first', { today: TODAY });
  assert.match(plan.error, /would give "first--second--caused" the id "the-first--second--caused", which is already taken/);
});

// ─── The tool, over a scratch copy of the fixtures ──────────────────────────

test('the tool renames a record on disk, carries the cascade and leaves a corpus that validates', async () => {
  const { dir, data } = await scratch();
  try {
    // Without `--index`: a scratch copy is outside any repository, so the
    // histories fall back to `revised` and the committed fixture index is
    // not what a build here produces. What the count is for is the rename.
    const before = await run(process.execPath, [path.join(ROOT, 'tools', 'validate.mjs'), '--data', data, '--quiet']);
    const warnings = /(\d+) warning\(s\)/.exec(before.stdout)[1];

    const { stdout } = await tool(data, 'event/fixture-event-a', 'fixture-event-alpha');
    assert.match(stdout, /rename {2}event {5}fixture-event-a {2}→ {2}fixture-event-alpha/);
    // Both edges out of A, each with its own former id, and the narrative
    // that walks one of them.
    assert.match(stdout, /fixture-event-a--fixture-event-b--caused {2}→ {2}fixture-event-alpha--fixture-event-b--caused/);
    assert.match(stdout, /3 record\(s\) renamed/);
    assert.match(stdout, /0 error\(s\)/, 'the tool rebuilds the index and validates, and says so');

    assert.ok(!existsSync(path.join(data, 'events', 'fixture-event-a.json')), 'the file is renamed, not copied');
    const renamed = await read(data, 'events/fixture-event-alpha.json');
    assert.deepEqual(renamed.aliases, ['fixture-event-a']);
    const edge = await read(data, 'edges/fixture-event-alpha--fixture-event-b--caused.json');
    assert.equal(edge.from, 'fixture-event-alpha');
    assert.deepEqual(edge.aliases, ['fixture-event-a--fixture-event-b--caused']);
    // A tenure names the event that began it; a narrative walks it.
    assert.equal((await read(data, 'tenures/fixture-tenure-one.json')).startedBy, 'fixture-event-alpha');

    // Green, with the same warnings it had before: a rename adds none and
    // clears none, because nothing about any record's standing changed.
    const after = await run(process.execPath, [path.join(ROOT, 'tools', 'validate.mjs'), '--data', data, '--index', '--quiet']);
    assert.match(after.stdout, new RegExp(`0 error\\(s\\), ${warnings} warning\\(s\\)`));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the old links keep working: a reference, a narrative step and a ?chain= built before the rename', async () => {
  const { dir, data } = await scratch();
  try {
    await tool(data, 'event/fixture-event-a', 'fixture-event-alpha');

    // The validator's side: every reference resolves through `aliases`.
    const { entries } = await readRecords(data);
    const records = entries.map((e) => e.record);
    const universe = universeOf(records);
    assert.equal(resolveId('fixture-event-a', universe).id, 'fixture-event-alpha');

    // The browser's side, over the index the tool rebuilt.
    const atlas = await atlasOf(data);
    assert.equal(atlas.resolve('fixture-event-a').id, 'fixture-event-alpha');
    assert.equal(atlas.resolve('fixture-event-a').kind, 'event');

    // A `?chain=` somebody was sent before the rename still walks: the ids in
    // it are the edges' former ones, and an edge's id is derived, so both
    // steps moved when the event did.
    const shared = ['fixture-event-a--fixture-event-b--caused', 'fixture-event-b--fixture-event-d--enabled'];
    assert.deepEqual(chainEdges(atlas, shared).map((e) => e.id),
      ['fixture-event-alpha--fixture-event-b--caused', 'fixture-event-b--fixture-event-d--enabled']);

    // And a narrative step written against either former id still resolves.
    assert.equal(resolveRef(atlas, 'fixture-event-a').record.id, 'fixture-event-alpha');
    assert.equal(resolveRef(atlas, 'fixture-event-a--fixture-event-b--caused').record.id,
      'fixture-event-alpha--fixture-event-b--caused');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a reviewed record keeps its standing, its signature and its citation audit trail', async () => {
  const { dir, data } = await scratch();
  try {
    // The fixtures carry no review block at all (deviation 307), so the case
    // is made by putting one on a scratch record before the tool runs.
    const before = await read(data, 'events/fixture-event-e.json');
    const review = {
      status: 'reviewed',
      signedBy: [{ name: 'A Reviewer', github: 'a-reviewer', on: '2026-02-02' }],
      flags: ['date'],
      citations: { 'fixture-source-1': { verified: { by: 'A Reviewer', on: '2026-02-02' } } },
    };
    await writeFile(path.join(data, 'events', 'fixture-event-e.json'),
      `${JSON.stringify({ ...before, review }, null, 2)}\n`, 'utf8');

    await tool(data, 'event/fixture-event-e', 'fixture-event-epsilon');
    const now = await read(data, 'events/fixture-event-epsilon.json');
    assert.deepEqual(now.review, review, 'a rename is not a change of content');

    // And the key follows the source when it is the source that is renamed.
    await tool(data, 'source/fixture-source-1', 'fixture-source-one');
    const moved = await read(data, 'events/fixture-event-epsilon.json');
    assert.deepEqual(Object.keys(moved.review.citations), ['fixture-source-one']);
    assert.deepEqual(moved.review.citations['fixture-source-one'], review.citations['fixture-source-1']);
    assert.deepEqual(moved.review.signedBy, review.signedBy);
    assert.equal(moved.sources[0].source, 'fixture-source-one');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('--dry-run prints the same plan and writes nothing', async () => {
  const { dir, data } = await scratch();
  try {
    const before = await readdir(path.join(data, 'events'));
    const dry = await tool(data, 'event/fixture-event-a', 'fixture-event-alpha', '--dry-run');
    assert.match(dry.stdout, /dry run: nothing written/);
    assert.deepEqual(await readdir(path.join(data, 'events')), before);
    assert.ok(existsSync(path.join(data, 'events', 'fixture-event-a.json')));

    const wet = await tool(data, 'event/fixture-event-a', 'fixture-event-alpha');
    // The same plan, line for line, up to the summary the run adds.
    const plan = (out) => out.split('\n').filter((l) => l.startsWith('rename') || l.startsWith('rewrite')).join('\n');
    assert.equal(plan(dry.stdout), plan(wet.stdout));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a refusal on disk writes nothing and exits non-zero', async () => {
  const { dir, data } = await scratch();
  try {
    const before = await readdir(path.join(data, 'events'));
    await assert.rejects(() => tool(data, 'event/fixture-event-a', 'fixture-event-b'),
      (e) => /already the id of an event/.test(e.stderr) && e.code === 1);
    assert.deepEqual(await readdir(path.join(data, 'events')), before);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// Amendment A3. The files under data/imports/ are not records and carry no
// envelope, and their values name records all the same: which actor a
// territory's entity code belongs to, which source an import cites.
test('the files under data/imports/ are rewritten too, in the serialisation they had', async () => {
  const { dir, data } = await scratch();
  try {
    await mkdir(path.join(data, 'imports'), { recursive: true });
    const map = {
      schema: 1,
      source: 'fixture-source-1',
      entries: {
        900: {
          actor: 'fixture-actor-one',
          splits: [{ from: '1210-01-01', actor: 'fixture-polity-three' }],
        },
      },
    };
    const seeds = { schema: 1, kind: 'import-seeds', source: 'fixture-source-1', items: ['Q1'] };
    await writeFile(path.join(data, 'imports', 'a-map.json'), `${JSON.stringify(map, null, 2)}\n`, 'utf8');
    await writeFile(path.join(data, 'imports', 'a-seeds.json'), `${JSON.stringify(seeds, null, 2)}\n`, 'utf8');

    const { stdout } = await tool(data, 'actor/fixture-actor-one', 'fixture-actor-uno');
    assert.match(stdout, /rewrite imports\/a-map\.json 1 reference\(s\)/);
    const now = await read(data, 'imports/a-map.json');
    assert.equal(now.entries['900'].actor, 'fixture-actor-uno');
    assert.equal(now.entries['900'].splits[0].actor, 'fixture-polity-three', 'and nothing else moved');
    // The same canonical serialisation the file had: two spaces, one trailing
    // newline, the keys in the order they were written.
    const text = await readFile(path.join(data, 'imports', 'a-map.json'), 'utf8');
    assert.equal(text, `${JSON.stringify(now, null, 2)}\n`);

    const source = await tool(data, 'source/fixture-source-1', 'fixture-source-one');
    assert.match(source.stdout, /rewrite imports\/a-map\.json 1 reference\(s\)/);
    assert.match(source.stdout, /rewrite imports\/a-seeds\.json 1 reference\(s\)/);
    assert.equal((await read(data, 'imports/a-seeds.json')).source, 'fixture-source-one');
    assert.deepEqual((await read(data, 'imports/a-seeds.json')).items, ['Q1'], 'a seed is not an atlas id');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// Amendment A1, plan review finding 13. `git log --diff-filter=AM` drops the
// rename commit as an `R`, and the walk asks only about the path the record
// is at now: without the former names a renamed record reads in the dashboard
// as one written once and never touched.
test('a renamed record keeps the versions it had under its former name', async () => {
  const { dir, data } = await scratch('migrate-ids-git-');
  try {
    const git = (...args) => run('git', args, { cwd: dir });
    await git('init', '-q', '-b', 'main');
    await git('config', 'user.email', 'test@example.invalid');
    await git('config', 'user.name', 'Test');
    await git('add', '-A');
    await git('commit', '-qm', 'the fixtures');

    // A second version of the record, under its original name.
    const first = await read(data, 'events/fixture-event-e.json');
    await writeFile(path.join(data, 'events', 'fixture-event-e.json'),
      `${JSON.stringify({ ...first, summary: `${first.summary} Revised.`, revised: '2026-09-07' }, null, 2)}\n`, 'utf8');
    await git('add', '-A');
    await git('commit', '-qm', 'the summary');

    await tool(data, 'event/fixture-event-e', 'fixture-event-epsilon');
    await git('add', '-A');
    await git('commit', '-qm', 'the rename');

    const record = await read(data, 'events/fixture-event-epsilon.json');
    const { from, histories } = await recordHistories([record], { dataDir: data });
    assert.equal(from, 'git');
    const [history] = histories;
    assert.equal(history.from, 'git');
    // Three versions: written, revised under the old name, renamed. Without
    // the alias path the first two are gone and the record reads as new.
    assert.equal(history.versions.length, 3, JSON.stringify(history.versions));
    assert.equal(history.versions[0].first, true);
    assert.deepEqual(history.versions[1].fields, ['summary']);
    assert.deepEqual(history.versions[2].fields, ['aliases', 'id']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// ─── The table ──────────────────────────────────────────────────────────────
//
// `tests/registry.test.mjs` holds it against the schemas; this is what it
// does, which is the half a schema cannot say.

test('the rewrite is structural: an untouched record comes back as it was', () => {
  const record = event('first', { parent: 'nothing-renamed' });
  const { record: out, count } = rewriteReferences(record, (id) => id);
  assert.equal(out, record, 'the same object, so an untouched file is not rewritten');
  assert.equal(count, 0);

  const { record: moved, count: n } = rewriteReferences(record, (id) => (id === 'a-place' ? 'the-place' : id));
  assert.notEqual(moved, record);
  assert.equal(moved.place, 'the-place');
  assert.equal(n, 1);
  assert.equal(record.place, 'a-place', 'and the original is not mutated');
});

test('a derived id is read with its own vocabulary and never the other one', () => {
  assert.deepEqual(partsOf('edge', 'a--b--caused'), { from: 'a', to: 'b', type: 'caused' });
  assert.equal(partsOf('edge', 'a--b--member-of'), null, 'a relation type is not an edge type');
  assert.deepEqual(partsOf('relation', 'a--b--member-of'), { from: 'a', to: 'b', type: 'member-of' });
  assert.equal(partsOf('relation', 'a--b--caused'), null);
  assert.deepEqual([...DERIVED_ID_KINDS], ['edge', 'relation']);
});
