// `--dates`, the mode M49 needs: given a list of actor ids, what Wikidata's
// P571 (inception) and P576 (dissolved) say about the item each one resolves
// to. Nothing here touches the network — the fetch layer is injected, exactly
// as the other modes are tested — and the items below are invented, like the
// ones under tests/fixtures/wikidata/.
//
// What these tests are really guarding is the milestone's first rule: no
// invented date, ever. So they check the refusals more than the answers. A
// subject the matcher cannot settle must come back marked doubtful with its
// candidates named, never as a date; an alternate name the record itself does
// not carry must be refused rather than searched for; and the mode must leave
// data/ untouched, because a lookup of dates is not an import of records.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createFetcher, HttpError, MODES, SUBJECTS_FILE, DATES_FILE,
  derivableNames, parseSubjects, datedClaims, runDatesMode, datesMarkdown, USER_AGENT,
} from '../tools/import/wikidata.mjs';

// The classes table these items are read through: in a real run it is the
// editorial decision in data/imports/wikidata-seeds.json → classes.
const CLASSES = {
  Q9200100: { kind: 'actor', actorType: 'polity', label: 'historical country' },
  Q9200101: { kind: 'place', label: 'city' },
};

const Q_POLITY = 'Q9200100';

const time = (iso, precision) => ({ mainsnak: { snaktype: 'value', datavalue: { value: { time: iso, precision } } } });
const instanceOf = (qid) => ({ mainsnak: { snaktype: 'value', datavalue: { value: { id: qid } } } });

const item = (qid, label, { classes = [Q_POLITY], inception = [], dissolved = [], description = null } = {}) => ({
  id: qid,
  labels: { en: { language: 'en', value: label } },
  descriptions: description ? { en: { language: 'en', value: description } } : {},
  aliases: {},
  claims: {
    P31: classes.map(instanceOf),
    ...(inception.length ? { P571: inception } : {}),
    ...(dissolved.length ? { P576: dissolved } : {}),
  },
  sitelinks: {},
});

// Persia is the case the survey found and could not answer: one polity on
// each side of the seam, one item, two dates. Egypt is the case it is most
// afraid of — two items a search answers with, neither of which the tool may
// pick between.
const ITEMS = {
  Q9200001: item('Q9200001', 'Persia', {
    inception: [time('+1501-00-00T00:00:00Z', 9)],
    dissolved: [time('+1925-12-15T00:00:00Z', 11)],
    description: 'an invented polity, used only to test a lookup',
  }),
  Q9200002: item('Q9200002', 'Egypt', { inception: [time('+1805-00-00T00:00:00Z', 9)] }),
  Q9200003: item('Q9200003', 'Egypt', { inception: [time('+1922-02-28T00:00:00Z', 11)] }),
  Q9200004: item('Q9200004', 'Harer', { classes: [Q_POLITY] }),
  Q9200005: item('Q9200005', 'Bergen', { classes: ['Q9200101'] }),
  Q9200006: item('Q9200006', 'Undated Kingdom', { classes: [Q_POLITY] }),
};

// What a search answers, by term. The real service answers a term with what
// it thinks the term means; a fixture that answered every term the same way
// would make the matching untestable, which is the whole subject here.
const SEARCH = {
  Persia: ['Q9200001'],
  'Iran (Persia)': ['Q9200001'],
  Egypt: ['Q9200002', 'Q9200003'],
  Harer: ['Q9200004'],
  'Harer (Egypt)': ['Q9200004', 'Q9200002'],
  Bergen: ['Q9200005'],
  'Undated Kingdom': ['Q9200006'],
};

function fakeFetcher(options = {}) {
  const asked = [];
  const fetchJson = async (url, init) => {
    asked.push({ url, init });
    if (options.before) {
      const forced = options.before(url, asked.length);
      if (forced) throw forced;
    }
    const params = new URL(url).searchParams;
    if (params.get('action') === 'wbgetentities') {
      const ids = params.get('ids').split('|');
      return { entities: Object.fromEntries(ids.map((id) => [id, ITEMS[id] ?? { id, missing: '' }])) };
    }
    if (params.get('action') === 'wbsearchentities') {
      const hits = SEARCH[params.get('search')] ?? [];
      return { search: hits.map((id) => ({ id, label: ITEMS[id]?.labels?.en?.value ?? null })) };
    }
    throw new HttpError(404, url);
  };
  return { asked, fetcher: createFetcher({ fetchJson, delay: async () => {}, ...options.fetcher }) };
}

const actor = (id, names, when, over = {}) => ({
  schema: 1, id, kind: 'actor', status: 'active', supersededBy: null, aliases: [],
  authors: [{ name: 'a test', github: null }], license: 'CC-BY-4.0', created: '2026-09-16',
  revised: null, sources: [], actorType: 'polity', names, summary: 'An invented record.',
  when, where: null, ...over,
});

const ACTORS = [
  actor('persia', ['Persia'], { start: 1783, end: 1885 }),
  actor('iran-persia', ['Iran (Persia)'], { start: 1886, end: null }),
  actor('egypt-before-1886', ['Egypt'], { start: 1715, end: 1885 }),
  actor('harer-egypt', ['Harer (Egypt)'], { start: 1878, end: 1885 }),
  actor('bergen-polity', ['Bergen'], { start: 1815, end: 1885 }),
  actor('undated-kingdom', ['Undated Kingdom'], { start: 1650, end: 1885 }),
];

async function scratch() {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-m49-dates-'));
  for (const sub of ['events', 'actors', 'places', 'sources', 'imports']) await mkdir(path.join(dir, sub), { recursive: true });
  await writeFile(path.join(dir, 'imports', 'wikidata-seeds.json'), JSON.stringify({
    schema: 1, kind: 'import-seeds', source: 'wikidata', items: [], queries: [], classes: CLASSES, reconcile: true,
  }, null, 2), 'utf8');
  for (const record of ACTORS) {
    await writeFile(path.join(dir, 'actors', `${record.id}.json`), JSON.stringify(record, null, 2), 'utf8');
  }
  return dir;
}

const run = async (dir, subjectsText, options = {}) => {
  const { fetcher, asked } = fakeFetcher(options);
  const result = await runDatesMode(dir, { fetcher, today: '2026-09-16', subjectsText });
  return { ...result, asked, fetcher };
};

const rowFor = (report, id, alternate = null) => report.rows.find((r) => r.id === id && r.alternate === alternate);

// --- the subject list -------------------------------------------------------

test('the subject list is ids, one per line, with comments and blanks ignored', () => {
  const { subjects, problems } = parseSubjects([
    '# the 26 candidate pairs',
    '',
    'persia',
    'iran-persia   ',
    '   # indented comment',
    'russia-soviet-union | Soviet Union',
  ].join('\n'));
  assert.deepEqual(problems, []);
  assert.deepEqual(subjects, [
    { id: 'persia', alternate: null },
    { id: 'iran-persia', alternate: null },
    { id: 'russia-soviet-union', alternate: 'Soviet Union' },
  ]);
});

test('a line the list cannot read is named rather than skipped', () => {
  const { subjects, problems } = parseSubjects('persia\nnot an id\npersia |\n');
  assert.deepEqual(subjects.map((s) => s.id), ['persia']);
  assert.equal(problems.length, 2);
  assert.match(problems.join('\n'), /line 2/);
  assert.match(problems.join('\n'), /line 3/);
});

// --- which names a record entitles the list to search for --------------------

test('a record entitles the list to its own names and to the parts of them', () => {
  assert.deepEqual(derivableNames(actor('x', ['Iran (Persia)'], { start: 1886, end: null })).sort(),
    ['Iran', 'Iran (Persia)', 'Persia']);
  assert.deepEqual(derivableNames(actor('x', ['Algeria under France'], { start: 1886, end: null })).sort(),
    ['Algeria', 'Algeria under France']);
  assert.deepEqual(derivableNames(actor('x', ['Vietnam (Annam/Cochin China/Tonkin)'], { start: 1886, end: null })).sort(),
    ['Annam', 'Cochin China', 'Tonkin', 'Vietnam', 'Vietnam (Annam/Cochin China/Tonkin)']);
});

test('an alternate the record does not carry is refused and never searched for', async () => {
  const dir = await scratch();
  const { report, asked } = await run(dir, 'persia | Parthia\n');
  assert.deepEqual(report.rows, []);
  assert.deepEqual(report.refused.map((r) => r.subject), ['persia | Parthia']);
  assert.match(report.refused[0].why, /"Parthia" is not a name `persia` carries/);
  assert.equal(asked.length, 0, 'a name the repository does not hold is not a name to put to Wikidata');
});

test('a subject with no record here is refused by name', async () => {
  const dir = await scratch();
  const { report } = await run(dir, 'atlantis\n');
  assert.deepEqual(report.refused.map((r) => r.subject), ['atlantis']);
  assert.match(report.refused[0].why, /no actor called `atlantis`/);
});

// --- what the lookup answers -------------------------------------------------

test('one surviving item is a safe match, and its dates come back with their precision', async () => {
  const dir = await scratch();
  const { report } = await run(dir, 'persia\n');
  const row = rowFor(report, 'persia');
  assert.equal(row.match, 'safe');
  assert.equal(row.qid, 'Q9200001');
  assert.equal(row.label, 'Persia');
  assert.deepEqual(row.inception, [{ year: 1501, date: null, precision: 9, precisionLabel: 'year' }]);
  assert.deepEqual(row.dissolved, [{ year: 1925, date: '1925-12-15', precision: 11, precisionLabel: 'day' }]);
});

test('two items a search answers with is doubtful, and no date is taken from either', async () => {
  const dir = await scratch();
  const { report } = await run(dir, 'egypt-before-1886\n');
  const row = rowFor(report, 'egypt-before-1886');
  assert.equal(row.match, 'doubtful');
  assert.equal(row.qid, null);
  assert.deepEqual(row.inception, []);
  assert.deepEqual(row.dissolved, []);
  assert.deepEqual(row.candidates, ['Q9200002', 'Q9200003']);
  assert.match(row.why, /2 items survived/);
});

test('nothing surviving is doubtful too, and says what was thrown out and why', async () => {
  const dir = await scratch();
  const { report } = await run(dir, 'bergen-polity\n');
  const row = rowFor(report, 'bergen-polity');
  assert.equal(row.match, 'doubtful');
  assert.equal(row.qid, null);
  assert.deepEqual(row.candidates, []);
  assert.match(row.rejected.join('\n'), /Q9200005: it is a place here, not a actor/);
});

test('the seam dates are not offered to the matcher, because they are what is being asked', async () => {
  const dir = await scratch();
  // `persia` runs 1783–1885 here and the item is 1501–1925. Under the date
  // check --reconcile applies, that is a rejection; under this mode it must
  // not be, because 1783 and 1885 are where two datasets stop and start and
  // asserting them would settle the question the lookup exists to ask.
  const { report } = await run(dir, 'persia\niran-persia\n');
  assert.deepEqual(report.rows.map((r) => [r.id, r.match, r.qid]), [
    ['persia', 'safe', 'Q9200001'],
    ['iran-persia', 'safe', 'Q9200001'],
  ], 'both sides of a pair may resolve to the same item — that is the answer, not an error');
});

test('a safe match with no P571 settles nothing, and says so rather than filling it in', async () => {
  const dir = await scratch();
  const { report } = await run(dir, 'undated-kingdom\n');
  const row = rowFor(report, 'undated-kingdom');
  assert.equal(row.match, 'safe');
  assert.deepEqual([row.inception, row.dissolved], [[], []]);
  assert.equal(row.settles, false, 'a match without a date is a match, not an answer');
});

test('the false pair the survey named comes back doubtful, not as Egypt', async () => {
  const dir = await scratch();
  const { report } = await run(dir, 'harer-egypt\n');
  const row = rowFor(report, 'harer-egypt');
  assert.equal(row.match, 'doubtful');
  assert.deepEqual(row.candidates.sort(), ['Q9200002', 'Q9200003', 'Q9200004'],
    'the parts of "Harer (Egypt)" find Harer and two Egypts, and the tool may pick none of them');
  assert.deepEqual([row.inception, row.dissolved], [[], []]);
});

test('a subject may be narrowed to one of the names its record carries', async () => {
  const dir = await scratch();
  const { report } = await run(dir, 'harer-egypt | Harer\n');
  const row = rowFor(report, 'harer-egypt', 'Harer');
  assert.deepEqual(row.probed, ['Harer']);
  assert.equal(row.match, 'safe');
  assert.equal(row.qid, 'Q9200004');
});

// --- what it does not do -----------------------------------------------------

test('--dates writes nothing under data/', async () => {
  const dir = await scratch();
  const before = await Promise.all(['actors', 'events', 'imports'].map((s) => readdir(path.join(dir, s))));
  await run(dir, 'persia\negypt-before-1886\n');
  const after = await Promise.all(['actors', 'events', 'imports'].map((s) => readdir(path.join(dir, s))));
  assert.deepEqual(after, before);
  assert.equal(before[2].includes('wikidata-state.json'), false, 'and it keeps no cursor: a lookup is one pass');
});

test('every request goes through the injected fetch layer and says who it is', async () => {
  const dir = await scratch();
  const { asked, report } = await run(dir, 'persia\n');
  assert.ok(asked.length >= 2, 'a search and then the item');
  for (const call of asked) assert.equal(call.init.headers['user-agent'], USER_AGENT);
  assert.equal(report.calls, asked.length);
});

test('a search the service refuses leaves the subject listed, not answered', async () => {
  const dir = await scratch();
  const { report } = await run(dir, 'persia\n', {
    before: (url, n) => (n === 1 ? new HttpError(500, url) : null),
    fetcher: { retries: 0 },
  });
  assert.deepEqual(report.rows, []);
  assert.deepEqual(report.refused.map((r) => r.subject), ['persia']);
  assert.match(report.refused[0].why, /500/);
});

test('the mode is one of the tool\'s modes and has its own files', () => {
  assert.ok(MODES.includes('dates'));
  assert.equal(SUBJECTS_FILE, path.join('docs', 'm49-subjects.txt'));
  assert.equal(DATES_FILE, path.join('docs', 'm49-dates.md'));
});

// --- the page ----------------------------------------------------------------

test('the page is a table a person can read down, and a section for each refusal', async () => {
  const dir = await scratch();
  const { report } = await run(dir, 'persia\negypt-before-1886\natlantis\n');
  const page = datesMarkdown(report.rows, { generated: '2026-09-16', refused: report.refused });
  assert.match(page, /^\| actor \| probed as \| item \| label \| P571 inception \| P576 dissolved \| match \|$/m);
  assert.match(page, /\| `persia` \| Persia \| \[`Q9200001`\]\(https:\/\/www\.wikidata\.org\/wiki\/Q9200001\) \| Persia \| 1501 \(year\) \| 1925-12-15 \(day\) \| safe \|/);
  assert.match(page, /\| `egypt-before-1886` \| Egypt \| — \| — \| — \| — \| doubtful \|/);
  assert.match(page, /^## The doubtful ones$/m);
  assert.match(page, /^## Subjects that were not asked$/m);
  assert.match(page, /`atlantis`/);
  assert.match(page, /writes nothing under `data\/`/);
});

test('a bar in a label does not become a column', () => {
  const page = datesMarkdown([{
    id: 'a', alternate: null, probed: ['A | B'], qid: 'Q1', label: 'A | B',
    inception: [], dissolved: [], match: 'safe', settles: false, candidates: [], rejected: [],
  }], { generated: '2026-09-16' });
  assert.match(page, /A \\\| B/);
  assert.doesNotMatch(page, /[^\\]\| B \|/, 'the bar inside the label is escaped everywhere it appears');
});

// --- the claims the dates come out of ----------------------------------------

test('a date coarser than a year is dropped rather than rounded', () => {
  const entity = { claims: { P571: [time('+1500-00-00T00:00:00Z', 7), time('+1501-00-00T00:00:00Z', 9)] } };
  assert.deepEqual(datedClaims(entity, 'P571'), [{ year: 1501, date: null, precision: 9, precisionLabel: 'year' }]);
});

test('an item with two inceptions reports both, because choosing between them is a person\'s', () => {
  const entity = { claims: { P571: [time('+1822-00-00T00:00:00Z', 9), time('+1918-11-11T00:00:00Z', 11)] } };
  assert.deepEqual(datedClaims(entity, 'P571').map((d) => d.year), [1822, 1918]);
});
