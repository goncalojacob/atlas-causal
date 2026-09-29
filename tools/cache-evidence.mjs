#!/usr/bin/env node
// A15(2) — the last step of every batch: the evidence the batch's citations
// name, on disk at the revision they name.
//
// `node tools/cache-evidence.mjs` reports; `--fill` closes what it can, which
// needs the network and is the half that runs nowhere but a fire that has one.
// `--json` for a script. `tests/a15-cache.test.mjs` asserts the report is
// empty, so a batch that forgets this step fails the check rather than the
// next reviewer.
//
// Two files are written, both under `tools/import/cache/` and neither under
// `data/`: `titles.json`, which is every cited article resolved through the
// action API to its Wikidata item and its canonical title — the table that
// makes one renamed article one group rather than two — and the leads
// themselves, by `leadRecord`, exactly as `fetchLeads` writes them.

import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readRecords, readCachedLeads } from './lib/read.mjs';
import { cacheGaps, citedArticles } from './import/citations.mjs';
import { leadRecord, USER_AGENT, API, summaryUrl, sleep } from './import/wikidata.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CACHE_DIR = path.join(ROOT, 'tools', 'import', 'cache', 'wikipedia');
export const TITLES_FILE = path.join(ROOT, 'tools', 'import', 'cache', 'titles.json');

// One request in flight at a time, 400 ms apart. The 29 September curation fire
// made 562 requests at this rate and saw no 429; a bare probe at no rate at all
// does (deviation 1440), so the pace is the point and not the politeness.
const DELAY_MS = 400;
const TITLES_PER_CALL = 50;

export async function readTitles(file = TITLES_FILE) {
  if (!existsSync(file)) return { generated: null, titles: {} };
  return JSON.parse(await readFile(file, 'utf8'));
}

async function get(url, { tries = 5 } = {}) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * (attempt + 1)); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error('gave up after five tries');
}

// The cited title as written, resolved to its item and its canonical title.
// A title already in the table is not asked again; a title no active record
// cites any more is dropped, so the file is the corpus's question and not an
// accumulation.
export async function fillTitles(cited, table, { fetchJson = get } = {}) {
  const wanted = [...cited.keys()].sort();
  const need = wanted.filter((title) => !table.titles[title]);
  let requests = 0;
  for (let i = 0; i < need.length; i += TITLES_PER_CALL) {
    const chunk = need.slice(i, i + TITLES_PER_CALL);
    const url = `${API}?action=query&format=json&formatversion=2&prop=pageprops&ppprop=wikibase_item`
      + `&redirects=1&titles=${chunk.map(encodeURIComponent).join('|')}`;
    const body = await fetchJson(url);
    requests += 1;
    await sleep(DELAY_MS);
    const query = body?.query ?? {};
    const normalized = new Map((query.normalized ?? []).map((n) => [n.from, n.to]));
    const redirects = new Map((query.redirects ?? []).map((r) => [r.from, r.to]));
    const pages = new Map((query.pages ?? []).map((p) => [p.title, p]));
    for (const asked of chunk) {
      let current = normalized.get(asked) ?? asked;
      const redirect = redirects.has(current);
      if (redirect) current = redirects.get(current);
      const page = pages.get(current);
      table.titles[asked] = {
        canonical: page?.missing ? null : (page?.title ?? null),
        qid: page?.pageprops?.wikibase_item ?? null,
        redirect,
        missing: Boolean(page?.missing),
      };
    }
  }
  const keep = new Set(wanted);
  for (const title of Object.keys(table.titles)) if (!keep.has(title)) delete table.titles[title];
  return { requests, asked: need.length };
}

// The lead at the revision the citations name, for each gap the cache can hold.
export async function fillLeads(missing, table, { today, cacheDir = CACHE_DIR, fetchJson = get } = {}) {
  const written = [];
  const refused = [];
  let requests = 0;
  for (const gap of missing) {
    const row = gap.titles.map((t) => table.titles[t]).find((r) => r?.qid) ?? null;
    const qid = gap.qid ?? row?.qid ?? null;
    const canonical = row?.canonical ?? gap.title;
    if (!qid) { refused.push({ ...gap, why: 'no Wikidata item for any of its titles' }); continue; }
    let body;
    try {
      // The same endpoint takes the revision as a second path segment, and
      // `summaryUrl` percent-encodes a slash, so the segment is appended after
      // it rather than passed through it.
      body = await fetchJson(`${summaryUrl('en', canonical)}/${gap.revid}`);
    } catch (e) {
      refused.push({ ...gap, why: e.message });
      await sleep(DELAY_MS);
      continue;
    }
    requests += 1;
    await sleep(DELAY_MS);
    const text = typeof body?.extract === 'string' ? body.extract.trim() : '';
    // Deviation 1457: the endpoint answers `revision` as a string, and a pass
    // that believes `Number.isInteger` refuses every good answer it gets.
    const revid = Number.isInteger(body?.revision) ? body.revision : Number(body?.revision) || 0;
    if (text === '') { refused.push({ ...gap, why: 'no extract at that revision' }); continue; }
    if (revid !== gap.revid) { refused.push({ ...gap, why: `the endpoint answered revision ${revid}` }); continue; }
    const lead = leadRecord({
      qid, lang: 'en', title: typeof body?.title === 'string' ? body.title : canonical, revid, fetched: today, text,
    });
    await writeFile(path.join(cacheDir, `${qid}.en.json`), `${JSON.stringify(lead, null, 2)}\n`, 'utf8');
    written.push({ title: gap.title, canonical, qid, revid, cites: gap.cites, replaced: gap.held });
  }
  return { written, refused, requests };
}

export async function report({ dataDir = path.join(ROOT, 'data'), cacheDir = CACHE_DIR, titlesFile = TITLES_FILE } = {}) {
  const [{ entries }, { leads }, table] = await Promise.all([
    readRecords(dataDir), readCachedLeads(cacheDir), readTitles(titlesFile),
  ]);
  const records = entries.map((e) => ({ kind: e.kind, ...e.record }));
  const gaps = cacheGaps(records, leads, { titles: table.titles });
  const cited = citedArticles(records).byTitle;
  const unresolved = [...cited.keys()].filter((t) => !table.titles[t]);
  const nowhere = [...cited.keys()].filter((t) => table.titles[t]?.missing);
  return { gaps, table, cited, unresolved, nowhere, records };
}

async function main(argv) {
  const fill = argv.includes('--fill');
  const asJson = argv.includes('--json');
  const today = new Date().toISOString().slice(0, 10);
  let state = await report();
  let titleRun = null;
  let leadRun = null;
  if (fill) {
    titleRun = await fillTitles(state.cited, state.table);
    await writeFile(TITLES_FILE, `${JSON.stringify(state.table, null, 1)}\n`, 'utf8');
    state = await report();
    leadRun = await fillLeads(state.gaps.missing, state.table, { today });
    state = await report();
  }
  const { gaps, unresolved, nowhere } = state;
  const unholdableRefs = gaps.unholdable.reduce((n, u) => n + u.cites, 0);
  if (asJson) {
    console.log(JSON.stringify({
      references: gaps.references,
      onDisk: gaps.onDisk,
      malformed: gaps.malformed,
      missing: gaps.missing,
      unholdable: gaps.unholdable,
      unholdableRefs,
      unresolved,
      nowhere,
      titleRun,
      leadRun,
    }, null, 1));
    return;
  }
  console.log(`wikipedia-en citations on active records: ${gaps.references}`);
  console.log(`  on disk at the revision cited            ${gaps.onDisk}`);
  console.log(`  a revision the cache cannot hold beside a more-cited one of the same item  ${unholdableRefs}`);
  console.log(`  a revision that should be on disk and is not  ${gaps.missing.reduce((n, m) => n + m.cites, 0)}`);
  if (titleRun) console.log(`title table: ${titleRun.asked} asked, ${titleRun.requests} request(s)`);
  if (leadRun) {
    console.log(`leads: ${leadRun.written.length} written, ${leadRun.refused.length} refused, ${leadRun.requests} request(s)`);
    for (const w of leadRun.written) console.log(`  + ${w.qid} "${w.canonical}" ${w.revid} (${w.cites} cite(s))${w.replaced.length ? ` replacing ${w.replaced.join(', ')}` : ''}`);
    for (const r of leadRun.refused) console.log(`  ! "${r.title}" ${r.revid}: ${r.why}`);
  }
  for (const m of gaps.malformed) console.log(`  ! ${m.kind} ${m.id}: a locator naming no article and revision: ${m.locator}`);
  for (const m of gaps.missing) console.log(`  ! "${m.title}" revision ${m.revid} (${m.cites} cite(s))`);
  for (const t of unresolved) console.log(`  ! "${t}" is not in the title table`);
  for (const t of nowhere) console.log(`  ! "${t}" names no page Wikipedia has`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
