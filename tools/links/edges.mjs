#!/usr/bin/env node
// Causal links between events the atlas holds. Part 2 of the links plan, M105.
//
//   node tools/links/edges.mjs candidates --out <file> [--limit 50] [--data data]
//        [--cache /tmp/oc-m105-cache] [--budget 3000] [--wikidata-articles 25] [--json]
//   node tools/links/edges.mjs queue --candidates <file> --judgments <file> --out <queue.json>
//        [--date YYYY-MM-DD] [--data data] [--used <queue-or-log.json>]...
//
// Two stages, and no model in either.
//
// **Stage 1, `candidates`.** For the biggest events (by their own
// `sitelinks.count`) this tool reads the English article at one revision and
// keeps the sentences that link exactly one other event the atlas holds.
// Every link is resolved to a Wikidata id and matched on the record's
// `wikidata`, never on a title. The sentence is read out of the article's `<p>`
// elements and confirmed against the writer's own `plainText` with the
// writer's own `quoteFound`, so a sentence kept here is one the writer will
// find. Then the writer's own verdicts are asked in the order of the funnel:
// the third-event rule and the chronology rule (`namesHeldEvents`,
// `isChronologyOnly` of tools/import/chronology.mjs), the arrow of time
// (`writeVerdictFor` of tools/queue/queue.mjs), a pair that an active edge of
// any type already joins, and a cycle in the graph as it is plus the batch.
// What is left is written to a file for someone to judge. Wikidata's P828,
// P1542, P1478, P1479, P1536 and P1537 between held events are tagged on the
// candidates they match, and where the subject's article has no sentence for
// such a pair the other event's article is read for one.
//
// **Stage 2, `queue`.** A judgments file `{ key: { accept, type } }` and the
// candidates become `existing` queue items, one for each subject with all of
// its accepted edges. The explanation is a template and carries the article's
// sentence and nothing else, so no sentence of a model's reaches a record.
//
// Wikipedia is asked once a second with this atlas's User-Agent, a 429 is
// waited out as its Retry-After says, and each answer is kept under the cache
// directory so a second run asks nothing. A Wikidata call keeps the project's
// maxlag of five seconds.

import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { claimIds, wikipediaApi, sleep } from '../import/wikidata.mjs';
import {
  fold, isChronologyOnly, namesHeldEvents, mentions, usableName, undisambiguated, CAUSAL_MARKERS,
} from '../import/chronology.mjs';
import { quoteFound, writeVerdictFor, EDGE_TYPES, LANES } from '../queue/queue.mjs';
import { plainText } from '../queue/apply.mjs';
import { readRecords } from '../lib/read.mjs';
import {
  ROOT, USER_AGENT, MAXLAG, BATCH, loadCorpus, createWikidataFetcher, qidOf,
} from './parents.mjs';

export { ROOT, USER_AGENT };
export const DEFAULT_CACHE = '/tmp/oc-m105-cache';
export const DEFAULT_LIMIT = 50;
export const DEFAULT_BUDGET = 3000;
export const DEFAULT_WIKIDATA_ARTICLES = 25;
export const WIKIPEDIA_DELAY_MS = 1000;
export const WIKIPEDIA_RETRIES = 6;
export const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
// The schema's floor and a ceiling that keeps the template under its 4000.
export const QUOTE_MIN = 40;
export const QUOTE_MAX = 1500;
export const MAX_PER_LANE_DAY = 999;

// Wikidata's causal properties, and which way each one points from the event
// that carries the statement: 'in' means the value is the cause of it.
export const WIKIDATA_PROPERTIES = Object.freeze({
  P828: 'in', P1478: 'in', P1479: 'in', P1542: 'out', P1536: 'out', P1537: 'out',
});

// --- asking Wikipedia ------------------------------------------------------

// One request a second, a 429 or a 503 waited out as long as Retry-After says
// (two seconds doubling when it says nothing), and a spent budget is an error.
export function createWikipediaFetcher({
  fetchImpl = globalThis.fetch, delay = sleep, delayMs = WIKIPEDIA_DELAY_MS,
  retries = WIKIPEDIA_RETRIES, budget = DEFAULT_BUDGET,
} = {}) {
  let calls = 0;
  let first = true;
  return {
    get calls() { return calls; },
    async get(url) {
      for (let attempt = 0; ; attempt += 1) {
        if (calls >= budget) throw new Error(`the budget of ${budget} Wikipedia requests is spent`);
        if (!first) await delay(delayMs);
        first = false;
        calls += 1;
        const response = await fetchImpl(url, { headers: { 'user-agent': USER_AGENT, accept: 'application/json' } });
        if (response.ok) {
          const body = await response.json();
          if (body?.error) throw Object.assign(new Error(`${url}: ${body.error.info ?? body.error.code}`), { apiCode: body.error.code ?? null });
          return body;
        }
        if ((response.status === 429 || response.status === 503) && attempt < retries) {
          const asked = Number(response.headers?.get?.('retry-after'));
          await delay(Number.isFinite(asked) && asked > 0 ? asked * 1000 : 2000 * 2 ** attempt);
          continue;
        }
        throw Object.assign(new Error(`${url}: ${response.status}`), { status: response.status });
      }
    },
  };
}

const sha = (text) => createHash('sha1').update(text).digest('hex');

export const parsePageUrl = (title) => `${wikipediaApi('en')}?action=parse&prop=text%7Cwikitext%7Crevid`
  + `&page=${encodeURIComponent(title)}&redirects=1&format=json&disablelimitreport=1&disableeditsection=1&disabletoc=1`;

export const pagePropsUrl = (titles) => `${wikipediaApi('en')}?action=query&prop=pageprops&ppprop=wikibase_item`
  + `&titles=${encodeURIComponent(titles.join('|'))}&redirects=1&format=json&formatversion=2`;

export const claimsUrl = (ids, maxlag = MAXLAG) => `${WIKIDATA_API}?action=wbgetentities&ids=${ids.join('|')}`
  + `&props=claims&format=json&maxlag=${maxlag}`;

const starOf = (x) => (typeof x === 'string' ? x : x?.['*'] ?? '');

// An article at one revision. The HTML is kept by revision id, so a second
// look at the same revision costs nothing and a later run can name it.
export async function fetchArticle(title, { fetcher, cacheDir = DEFAULT_CACHE } = {}) {
  await mkdir(cacheDir, { recursive: true });
  const pointer = path.join(cacheDir, `page-${sha(parsePageUrl(title))}.json`);
  let known;
  if (existsSync(pointer)) known = JSON.parse(await readFile(pointer, 'utf8'));
  if (known && existsSync(path.join(cacheDir, `${known.revid}.html`))) {
    return { title: known.title, revision: known.revid, html: await readFile(path.join(cacheDir, `${known.revid}.html`), 'utf8') };
  }
  const parsed = (await fetcher.get(parsePageUrl(title)))?.parse ?? {};
  const html = starOf(parsed.text);
  const revision = Number(parsed.revid);
  if (html === '' || !Number.isInteger(revision)) throw new Error(`no text or revision for "${title}"`);
  await writeFile(path.join(cacheDir, `${revision}.html`), html, 'utf8');
  await writeFile(path.join(cacheDir, `${revision}.wiki`), starOf(parsed.wikitext), 'utf8');
  await writeFile(pointer, JSON.stringify({ title: parsed.title ?? title, revid: revision }), 'utf8');
  return { title: parsed.title ?? title, revision, html };
}

// Titles to Wikidata ids, fifty a call, redirects followed. A title with no
// item (or no page) maps to null.
export async function resolveTitles(titles, { fetcher, cacheDir = DEFAULT_CACHE } = {}) {
  await mkdir(cacheDir, { recursive: true });
  const out = new Map();
  const unique = [...new Set(titles)];
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const url = pagePropsUrl(batch);
    const file = path.join(cacheDir, `props-${sha(url)}.json`);
    let query;
    if (existsSync(file)) query = JSON.parse(await readFile(file, 'utf8'));
    else {
      query = (await fetcher.get(url))?.query ?? {};
      await writeFile(file, JSON.stringify(query), 'utf8');
    }
    const normalized = new Map((query.normalized ?? []).map((n) => [n.from, n.to]));
    const redirects = new Map((query.redirects ?? []).map((n) => [n.from, n.to]));
    const pages = new Map((query.pages ?? []).map((p) => [p.title, p]));
    for (const title of batch) {
      let at = normalized.get(title) ?? title;
      for (let hops = 0; hops < 5 && redirects.has(at); hops += 1) at = redirects.get(at);
      const q = pages.get(at)?.pageprops?.wikibase_item;
      out.set(title, typeof q === 'string' ? q : null);
    }
  }
  return out;
}

// The causal statements of each id, as `{ id: [{ property, value }] }` where
// `value` is the other event. One compact file for each call.
export async function fetchWikidataLinks(ids, { fetcher, cacheDir = DEFAULT_CACHE, maxlag = MAXLAG } = {}) {
  await mkdir(cacheDir, { recursive: true });
  const out = new Map();
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const url = claimsUrl(batch, maxlag);
    const file = path.join(cacheDir, `claims-${sha(url)}.json`);
    let compact;
    if (existsSync(file)) compact = JSON.parse(await readFile(file, 'utf8'));
    else {
      const body = await fetcher.get(url);
      compact = {};
      for (const [id, entity] of Object.entries(body?.entities ?? {})) {
        compact[id] = Object.keys(WIKIDATA_PROPERTIES).flatMap((property) => claimIds(entity, property).map((value) => ({ property, value })));
      }
      await writeFile(file, JSON.stringify(compact), 'utf8');
    }
    for (const id of batch) out.set(id, compact[id] ?? []);
  }
  return out;
}

// --- reading an article ----------------------------------------------------

const LINK_START = '';
const LINK_MID = '';
const LINK_END = '';

const stripTags = (html) => plainText(html).replace(/\[edit\]/g, '').replace(/\s+/g, ' ').trim();

// An article link's title, or null for a link that is not to an article: a
// file, a category, a help page, an anchor on this page, a red link.
export function linkTitle(attributes) {
  if (/\bclass="[^"]*\bnew\b/.test(attributes)) return null;
  const href = /\bhref="([^"]*)"/.exec(attributes)?.[1];
  if (!href?.startsWith('/wiki/')) return null;
  let title;
  try {
    title = decodeURIComponent(href.slice(6).split('#')[0]).replace(/_/g, ' ').trim();
  } catch {
    return null;
  }
  return title === '' || title.includes(':') ? null : title;
}

// The paragraphs of an article, in order, each with the heading it sits under
// and the links in it as `{ title, start, end }` over the paragraph's text.
// The tables are cut first, the way `plainText` cuts them, so a paragraph
// that `plainText` does not show is not read here either.
export function paragraphs(html) {
  const body = String(html ?? '').replace(/<(script|style|table)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  const out = [];
  let h2 = '';
  let h3 = '';
  for (const m of body.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>|<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    if (m[1]) {
      const text = stripTags(m[2]);
      if (m[1] === '2') { h2 = text; h3 = ''; } else if (m[1] === '3') h3 = text;
      continue;
    }
    const titles = [];
    const marked = m[3].replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (whole, attributes, inner) => {
      const title = linkTitle(attributes);
      if (title === null) return inner;
      titles.push(title);
      return `${LINK_START}${titles.length - 1}${LINK_MID}${inner}${LINK_END}`;
    });
    const text = plainText(marked);
    let clean = '';
    const links = [];
    for (let i = 0; i < text.length; i += 1) {
      if (text[i] === LINK_START) {
        const mid = text.indexOf(LINK_MID, i);
        links.push({ title: titles[Number(text.slice(i + 1, mid))], start: clean.length, end: null });
        i = mid;
      } else if (text[i] === LINK_END) {
        const open = [...links].reverse().find((l) => l.end === null);
        if (open) open.end = clean.length;
      } else clean += text[i];
    }
    const trimmed = clean.replace(/^\s+/, '');
    const shift = clean.length - trimmed.length;
    if (trimmed.trim() === '') continue;
    out.push({
      heading: [h2, h3].filter(Boolean).join(' / ') || 'Lead',
      text: trimmed,
      links: links.filter((l) => l.end !== null).map((l) => ({ title: l.title, start: l.start - shift, end: l.end - shift })),
    });
  }
  return out;
}

// Words a full stop can follow without ending a sentence.
const ABBREVIATIONS = new Set(['mr', 'mrs', 'ms', 'dr', 'st', 'mt', 'no', 'vs', 'c', 'ca', 'jr', 'sr', 'gen', 'col',
  'lt', 'capt', 'sgt', 'gov', 'sen', 'rep', 'prof', 'fr', 'ft', 'inc', 'ltd', 'co', 'approx', 'cf', 'ca', 'esp',
  'hon', 'rev', 'maj', 'cdr', 'adm', 'cmdr', 'bros', 'vol', 'vols', 'pp', 'ed', 'eds', 'est', 'dept', 'etc']);

// Where each sentence of a paragraph begins and ends, as `[start, end)`.
export function splitSentences(text) {
  const out = [];
  let start = 0;
  const end = /[.!?]["'”’)\]]*(?:\[[^\]]*\])*\s+(?=["'“‘(\[]?[A-Z0-9])/g;
  for (let m = end.exec(text); m; m = end.exec(text)) {
    const before = text.slice(start, m.index + 1);
    const word = /([A-Za-z.]+)\.$/.exec(before)?.[1] ?? '';
    const last = word.split('.').pop();
    if (m[0][0] === '.' && (ABBREVIATIONS.has(last.toLowerCase()) || /^[A-Z]$/.test(last) || /^(?:[A-Za-z]\.)+[A-Za-z]$/.test(word))) continue;
    out.push([start, m.index + m[0].replace(/\s+$/, '').length]);
    start = m.index + m[0].length;
  }
  if (text.slice(start).trim() !== '') out.push([start, text.trimEnd().length]);
  return out;
}

const CITATION_NEEDED = /\[(?:[a-z ]*needed|when\?|who\?|where\?|dubious[^\]]*|according to whom\?|clarification[^\]]*)\]/i;

// Every sentence of the article with the titles it links to.
export function sentencesOf(html) {
  const out = [];
  for (const p of paragraphs(html)) {
    for (const [s, e] of splitSentences(p.text)) {
      out.push({
        heading: p.heading,
        sentence: p.text.slice(s, e).trim(),
        titles: [...new Set(p.links.filter((l) => l.start >= s && l.start < e).map((l) => l.title))],
      });
    }
  }
  return out;
}

// --- the atlas -------------------------------------------------------------

export async function loadAtlas(dataDir) {
  const corpus = await loadCorpus(dataDir);
  const { entries } = await readRecords(dataDir);
  const edges = entries.map((e) => e.record).filter((r) => r.kind === 'edge' && r.status === 'active');
  return { ...corpus, edges };
}

// The biggest events first, by the records' own sitelink count, and only
// those with an English article and a Wikidata id to match links against.
export function chooseSubjects(events, limit = DEFAULT_LIMIT) {
  return events
    .filter((r) => typeof r.wikipedia?.en === 'string' && r.wikipedia.en !== '' && qidOf(r))
    .sort((a, b) => (b.sitelinks?.count ?? 0) - (a.sitelinks?.count ?? 0) || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export const namesOfEvent = (r) => [r.title, ...(r.names ?? [])].filter((n) => typeof n === 'string' && n !== '');

// The names a record answers to, folded, for the cheap test that comes before
// `namesHeldEvents`: a name that is not a substring of the sentence cannot be
// mentioned in it.
function nameIndex(events) {
  return events.map((r) => {
    const names = namesOfEvent(r);
    const folds = names.flatMap((n) => [n, undisambiguated(n)]).filter((n) => n && usableName(n)).map(fold);
    return { id: r.id, names, when: r.when ?? null, folds };
  });
}

function thirdEvents(sentence, index, ends) {
  const folded = fold(sentence);
  const near = index.filter((c) => ends.includes(c.id) || c.folds.some((f) => folded.includes(f)));
  return namesHeldEvents(sentence, near, { exclude: ends });
}

// --- the direction ---------------------------------------------------------

// Which way an edge between two events may run, by the writer's own arrow of
// time. One direction, or both where the starts do not tell them apart.
export function directionsFor(a, b, whenOf) {
  const ok = (from, to) => writeVerdictFor({ type: 'caused' }, { from, to, whenOf }).ok;
  const out = [];
  if (ok(a, b)) out.push([a, b]);
  if (ok(b, a)) out.push([b, a]);
  return out;
}

// --- the graph -------------------------------------------------------------

export function reaches(adjacency, from, to) {
  const seen = new Set([from]);
  const stack = [from];
  while (stack.length) {
    const at = stack.pop();
    if (at === to) return true;
    for (const next of adjacency.get(at) ?? []) if (!seen.has(next)) { seen.add(next); stack.push(next); }
  }
  return false;
}

const adjacencyOf = (edges) => {
  const adjacency = new Map();
  for (const e of edges) adjacency.set(e.from, [...(adjacency.get(e.from) ?? []), e.to]);
  return adjacency;
};

const unordered = (a, b) => (a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`);

// --- the candidates --------------------------------------------------------

export const hasMarker = (sentence) => {
  const folded = fold(sentence);
  return CAUSAL_MARKERS.some((m) => folded.includes(m));
};

export const keyOf = (subject, other, quote) => `${subject}|${other}|${sha(fold(quote)).slice(0, 8)}`;

const bump = (counts, key, n = 1) => { counts[key] = (counts[key] ?? 0) + n; };

// The whole of stage 1 after the fetching, pure. `articles` is a list of
// `{ owner, title, revision, html, only }` where `owner` is the record whose
// article it is and `only` (optional) is a set of record ids: the sentence
// must be about one of those. `qidOfTitle` maps a linked title to a Wikidata
// id. `wikidataTags` maps an unordered pair to `[{ property, from, to }]`.
export function buildCandidates({ articles, qidOfTitle, atlas, wikidataTags = new Map() }) {
  const { events, byId } = atlas;
  const heldByQid = new Map(events.filter((r) => qidOf(r)).map((r) => [qidOf(r), r]));
  const index = nameIndex(events);
  const whenOf = (id) => byId.get(id)?.when ?? null;
  const joined = new Set(atlas.edges.map((e) => unordered(e.from, e.to)));
  const adjacency = adjacencyOf(atlas.edges);

  const counts = {
    subjects: articles.length, sentences: 0, linkingHeld: 0, quoteNotFound: 0, tooShortOrLong: 0, citationNeeded: 0,
    thirdEvent: 0, chronology: 0, arrow: 0, pairDedupe: 0, cycle: 0, withMarker: 0, withoutMarker: 0, tagged: 0,
  };
  const stages = [];
  for (const article of articles) {
    const text = plainText(article.html);
    for (const s of sentencesOf(article.html)) {
      counts.sentences += 1;
      const others = [...new Set(s.titles.map((t) => heldByQid.get(qidOfTitle.get(t))?.id)
        .filter((id) => id && id !== article.owner))];
      if (others.length === 0) continue;
      if (article.only && !others.some((id) => article.only.has(id))) continue;
      counts.linkingHeld += 1;
      stages.push({ article, s, others, text });
    }
  }

  // Step 1: the sentence has to be the article's own words, of a length the
  // queue takes, and not marked as unsourced.
  const usable = [];
  for (const row of stages) {
    if (CITATION_NEEDED.test(row.s.sentence)) { counts.citationNeeded += 1; continue; }
    if (row.s.sentence.length < QUOTE_MIN || row.s.sentence.length > QUOTE_MAX) { counts.tooShortOrLong += 1; continue; }
    if (!quoteFound(row.s.sentence, row.text)) { counts.quoteNotFound += 1; continue; }
    usable.push(row);
  }
  const funnel = { linkingHeld: counts.linkingHeld, quoteFound: usable.length };

  // Step 2: the third-event rule, and exactly one other event linked.
  const afterThird = usable.filter((row) => {
    if (row.others.length !== 1) return false;
    return thirdEvents(row.s.sentence, index, [row.article.owner, row.others[0]]).length === 0;
  });
  counts.thirdEvent = usable.length - afterThird.length;
  funnel.afterThirdEvent = afterThird.length;

  // Step 3: the sentence states a cause or does not open on the order of events.
  const afterChronology = afterThird.filter((row) => !isChronologyOnly(row.s.sentence));
  counts.chronology = afterThird.length - afterChronology.length;
  funnel.afterChronology = afterChronology.length;

  // Step 4: the arrow of time gives the direction.
  const directed = [];
  for (const row of afterChronology) {
    const other = row.others[0];
    const directions = directionsFor(row.article.owner, other, whenOf);
    if (directions.length) directed.push({ ...row, other, directions });
  }
  counts.arrow = afterChronology.length - directed.length;
  funnel.afterArrow = directed.length;

  // Step 5: a pair that an active edge of any type already joins.
  const fresh = directed.filter((row) => !joined.has(unordered(row.article.owner, row.other)));
  counts.pairDedupe = directed.length - fresh.length;
  funnel.afterPairDedupe = fresh.length;

  // Step 6: a cycle, in the graph as it is and the edges of this batch.
  const candidates = [];
  const graph = new Map([...adjacency].map(([k, v]) => [k, [...v]]));
  for (const row of fresh) {
    const free = row.directions.filter(([from, to]) => !reaches(graph, to, from));
    if (!free.length) { counts.cycle += 1; continue; }
    const [from, to] = free[0];
    graph.set(from, [...(graph.get(from) ?? []), to]);
    const quote = row.s.sentence;
    const subject = row.article.owner;
    const tags = wikidataTags.get(unordered(subject, row.other)) ?? [];
    if (tags.length) counts.tagged += 1;
    const marker = hasMarker(quote);
    bump(counts, marker ? 'withMarker' : 'withoutMarker');
    candidates.push({
      key: keyOf(subject, row.other, quote),
      subject,
      other: row.other,
      from,
      to,
      tie: free.length > 1,
      article: row.article.title,
      revision: row.article.revision,
      section: row.s.heading,
      quote,
      marker,
      namesSubject: mentions(quote, byId.get(subject)?.title ?? ''),
      wikidata: tags.map((t) => t.property),
    });
  }
  funnel.afterCycle = candidates.length;
  funnel.withMarker = counts.withMarker;
  funnel.withoutMarker = counts.withoutMarker;
  return { candidates, counts, funnel };
}

// Wikidata's statements as tags on unordered pairs, from the events that carry
// them. Only pairs between two held events.
export function wikidataPairs(links, events) {
  const heldByQid = new Map(events.filter((r) => qidOf(r)).map((r) => [qidOf(r), r]));
  const tags = new Map();
  for (const [qid, statements] of links) {
    const holder = heldByQid.get(qid);
    if (!holder) continue;
    for (const { property, value } of statements) {
      const other = heldByQid.get(value);
      if (!other || other.id === holder.id) continue;
      const [from, to] = WIKIDATA_PROPERTIES[property] === 'in' ? [other.id, holder.id] : [holder.id, other.id];
      const key = unordered(holder.id, other.id);
      tags.set(key, [...(tags.get(key) ?? []), { property, from, to }]);
    }
  }
  return tags;
}

// --- running stage 1 -------------------------------------------------------

export async function run({
  dataDir = path.join(ROOT, 'data'), cacheDir = DEFAULT_CACHE, limit = DEFAULT_LIMIT, budget = DEFAULT_BUDGET,
  wikidataArticles = DEFAULT_WIKIDATA_ARTICLES, maxlag = MAXLAG,
  wikipedia = createWikipediaFetcher({ budget }), wikidata = createWikidataFetcher({ budget: 200 }),
  log = () => {},
} = {}) {
  const atlas = await loadAtlas(dataDir);
  const subjects = chooseSubjects(atlas.events, limit);
  const articles = [];
  for (const [i, r] of subjects.entries()) {
    log(`article ${i + 1}/${subjects.length}: ${r.wikipedia.en}`);
    const got = await fetchArticle(r.wikipedia.en, { fetcher: wikipedia, cacheDir });
    articles.push({ owner: r.id, ...got });
  }

  // Wikidata's own pairs, for the subjects. Where a pair has no sentence in
  // the subject's article, the other event's article is the second place to
  // look (up to `wikidataArticles` of them).
  const links = await fetchWikidataLinks(subjects.map(qidOf), { fetcher: wikidata, cacheDir, maxlag });
  const tags = wikidataPairs(links, atlas.events);

  const collect = async (list) => {
    const titles = [];
    for (const a of list) for (const s of sentencesOf(a.html)) titles.push(...s.titles);
    return resolveTitles(titles, { fetcher: wikipedia, cacheDir });
  };
  let qidOfTitle = await collect(articles);
  let built = buildCandidates({ articles, qidOfTitle, atlas, wikidataTags: tags });

  const subjectIds = new Set(subjects.map((r) => r.id));
  const covered = new Set(built.candidates.map((c) => unordered(c.subject, c.other)));
  const wanted = [];
  for (const [pair] of tags) {
    if (covered.has(pair)) continue;
    const [a, b] = pair.split('\u0000');
    for (const [near, far] of [[a, b], [b, a]]) {
      const r = atlas.byId.get(far);
      if (subjectIds.has(near) && !subjectIds.has(far) && typeof r?.wikipedia?.en === 'string') wanted.push({ owner: far, partner: near });
    }
  }
  const extra = [];
  for (const [i, w] of wanted.slice(0, wikidataArticles).entries()) {
    log(`wikidata pair ${i + 1}/${Math.min(wanted.length, wikidataArticles)}: ${atlas.byId.get(w.owner).wikipedia.en}`);
    const got = await fetchArticle(atlas.byId.get(w.owner).wikipedia.en, { fetcher: wikipedia, cacheDir });
    extra.push({ owner: w.owner, only: new Set([w.partner]), ...got });
  }
  if (extra.length) {
    const more = await collect(extra);
    qidOfTitle = new Map([...qidOfTitle, ...more]);
    built = buildCandidates({ articles: [...articles, ...extra], qidOfTitle, atlas, wikidataTags: tags });
  }
  const bySubject = new Map(subjects.map((r, i) => [r.id, i]));
  built.candidates.sort((a, b) => (bySubject.get(a.subject) ?? 1e9) - (bySubject.get(b.subject) ?? 1e9));
  return {
    ...built,
    wikidata: { pairs: tags.size, articlesWanted: wanted.length, articlesRead: extra.length },
    requests: { wikipedia: wikipedia.calls, wikidata: wikidata.calls },
    subjects: subjects.map((r) => ({ id: r.id, title: r.title, sitelinks: r.sitelinks?.count ?? 0 })),
  };
}

export function report(result) {
  const f = result.funnel;
  const rate = f.linkingHeld ? ((result.counts.quoteNotFound / f.linkingHeld) * 100).toFixed(2) : '0.00';
  return [
    `Subjects: ${result.counts.subjects}; sentences read: ${result.counts.sentences}`,
    `Sentences linking a held event: ${f.linkingHeld}`,
    `  quote found by the writer's own check: ${f.quoteFound} (not found ${result.counts.quoteNotFound} = ${rate}%; too short or long ${result.counts.tooShortOrLong}; citation needed ${result.counts.citationNeeded})`,
    `  after the third-event rule (exactly one other event): ${f.afterThirdEvent}`,
    `  after the chronology rule: ${f.afterChronology}`,
    `  after the arrow of time: ${f.afterArrow}`,
    `  after the pair dedupe (any type): ${f.afterPairDedupe}`,
    `  after the cycle check: ${f.afterCycle}`,
    `  with a causal marker: ${f.withMarker}; without: ${f.withoutMarker}`,
    `Wikidata pairs between held events: ${result.wikidata.pairs} (${result.counts.tagged} candidates tagged; other articles read: ${result.wikidata.articlesRead} of ${result.wikidata.articlesWanted})`,
    `Requests: Wikipedia ${result.requests.wikipedia}, Wikidata ${result.requests.wikidata} (cached ones not counted)`,
  ].join('\n');
}

// --- stage 2: the queue ----------------------------------------------------

// The closing clause in plain English, `from` the earlier record and `to` the
// later. "reacted-to" runs from the earlier to the later and means the later
// answered the earlier, so it is read the other way round.
export const CLAUSES = Object.freeze({
  caused: (from, to) => `${from} caused ${to}`,
  enabled: (from, to) => `${from} made ${to} possible`,
  'reacted-to': (from, to) => `${to} was a response to ${from}`,
  'precondition-of': (from, to) => `${from} was a precondition of ${to}`,
  inspired: (from, to) => `${from} inspired ${to}`,
});

export function explanationFor(candidate, { from, to, type }) {
  return `The English Wikipedia article "${candidate.article}" (revision ${candidate.revision}) says: "${candidate.quote}" `
    + `The edge reads that sentence as: ${CLAUSES[type](from, to)}, and nothing more.`;
}

// The serial numbers already used for each `<date>-<lane>`, from any queue or
// log file's ids.
export function usedSerials(documents) {
  const used = new Map();
  for (const doc of documents) {
    for (const row of [...(doc?.items ?? []), ...(doc?.entries ?? [])]) {
      const m = /^(\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*)-(\d{3})$/.exec(String(row?.id ?? ''));
      if (m) used.set(m[1], Math.max(used.get(m[1]) ?? 0, Number(m[2])));
    }
  }
  return used;
}

// `existing` queue items, one for each subject, with all of its accepted
// edges. A judgment is `{ accept, type }`; for a candidate that may run either
// way, `reverse: true` turns it round. Pure.
export function buildQueue({ candidates, judgments, atlas, date, planned, used = new Map() }) {
  const { byId, laneOf } = atlas;
  const accepted = new Map();
  const skipped = { rejected: 0, unjudged: 0, badType: 0, samePair: 0, noLane: 0 };
  const pairs = new Set();
  for (const c of candidates) {
    const j = judgments[c.key];
    if (!j) { skipped.unjudged += 1; continue; }
    if (j.accept !== true) { skipped.rejected += 1; continue; }
    if (!EDGE_TYPES.includes(j.type)) { skipped.badType += 1; continue; }
    const pair = unordered(c.subject, c.other);
    if (pairs.has(pair)) { skipped.samePair += 1; continue; }
    pairs.add(pair);
    const [from, to] = j.reverse === true && c.tie ? [c.to, c.from] : [c.from, c.to];
    accepted.set(c.subject, [...(accepted.get(c.subject) ?? []), {
      from, to, type: j.type, confidence: 'probable', article: c.article, revision: c.revision, quote: c.quote,
      explanation: explanationFor(c, { from: byId.get(from).title, to: byId.get(to).title, type: j.type }),
    }]);
  }

  const serial = new Map(used);
  const items = [];
  for (const [subject, edges] of accepted) {
    const lane = [laneOf.get(subject), ...edges.map((e) => laneOf.get(e.from === subject ? e.to : e.from))].find((l) => LANES.includes(l));
    if (!lane) { skipped.noLane += edges.length; continue; }
    const stem = `${date}-${lane}`;
    const n = (serial.get(stem) ?? 0) + 1;
    if (n > MAX_PER_LANE_DAY) throw new Error(`more than ${MAX_PER_LANE_DAY} items for ${stem}: use another date`);
    serial.set(stem, n);
    items.push({
      id: `${stem}-${String(n).padStart(3, '0')}`,
      planned,
      lane,
      writer: items.length % 2 === 0 ? 'A' : 'B',
      existing: subject,
      title: byId.get(subject).title,
      edges,
      rank: 'edges-from-articles',
      why: `${edges.length === 1 ? 'One sentence' : `${edges.length} sentences`} of the English Wikipedia link this event to another event the atlas holds, and each is quoted in full.`,
    });
  }
  return { queue: { schema: 1, kind: 'import-queue', generated: date, items }, skipped };
}

// --- the command line -------------------------------------------------------

export const USAGE = 'usage: node tools/links/edges.mjs candidates --out <file> [--limit 50] [--data <dir>] [--cache <dir>]'
  + ' [--budget 3000] [--wikidata-articles 25] [--maxlag 5] [--json]\n'
  + '       node tools/links/edges.mjs queue --candidates <file> --judgments <file> --out <queue.json>'
  + ' [--date YYYY-MM-DD] [--data <dir>] [--used <queue-or-log.json>]...';

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

export async function main(argv) {
  const [command, ...rest] = argv;
  const opts = {};
  const used = [];
  let out = null;
  let candidatesFile = null;
  let judgmentsFile = null;
  let date = new Date().toISOString().slice(0, 10);
  let dataDir = path.join(ROOT, 'data');
  let asJson = false;
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--out') out = path.resolve(rest[++i]);
    else if (arg === '--data') dataDir = path.resolve(rest[++i]);
    else if (arg === '--cache') opts.cacheDir = path.resolve(rest[++i]);
    else if (arg === '--limit') opts.limit = Number(rest[++i]);
    else if (arg === '--budget') opts.budget = Number(rest[++i]);
    else if (arg === '--wikidata-articles') opts.wikidataArticles = Number(rest[++i]);
    else if (arg === '--maxlag') opts.maxlag = Number(rest[++i]);
    else if (arg === '--candidates') candidatesFile = path.resolve(rest[++i]);
    else if (arg === '--judgments') judgmentsFile = path.resolve(rest[++i]);
    else if (arg === '--date') date = rest[++i];
    else if (arg === '--used') used.push(path.resolve(rest[++i]));
    else if (arg === '--json') asJson = true;
    else { console.error(`unknown argument ${arg}\n${USAGE}`); return 2; }
  }
  if (command === 'candidates') {
    if (!out) { console.error(USAGE); return 2; }
    const result = await run({ ...opts, dataDir, log: (m) => console.error(m) });
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, `${JSON.stringify({ schema: 1, kind: 'edge-candidates', funnel: result.funnel, counts: result.counts, wikidata: result.wikidata, subjects: result.subjects, candidates: result.candidates }, null, 1)}\n`, 'utf8');
    console.log(asJson ? JSON.stringify({ funnel: result.funnel, counts: result.counts }, null, 1) : report(result));
    console.log(`${result.candidates.length} candidates written to ${out}`);
    return 0;
  }
  if (command === 'queue') {
    if (!out || !candidatesFile || !judgmentsFile) { console.error(USAGE); return 2; }
    const atlas = await loadAtlas(dataDir);
    const documents = [];
    for (const file of [...used, path.join(dataDir, 'imports', 'queue.json'), path.join(dataDir, 'imports', 'queue-log.json')]) {
      if (existsSync(file)) documents.push(await readJson(file));
    }
    const { candidates } = await readJson(candidatesFile);
    const judgments = await readJson(judgmentsFile);
    const planned = `${new Date().toISOString().slice(0, 16)}Z`;
    const { queue, skipped } = buildQueue({ candidates, judgments, atlas, date, planned, used: usedSerials(documents) });
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, `${JSON.stringify(queue, null, 2)}\n`, 'utf8');
    console.log(`${queue.items.length} items, ${queue.items.reduce((n, i) => n + i.edges.length, 0)} edges written to ${out}`);
    console.log(`left out: ${Object.entries(skipped).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    return 0;
  }
  console.error(USAGE);
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
