// The pages the build writes: `sources.html`'s and `narratives.html`'s lists,
// and `entry/<id>.html` for every record that carries a full entry.
//
// Pure — templates and an atlas in, a { path: text } map out — so what the
// build commits can be held to its promises by node --test, and so the
// filesystem half stays in build-index.mjs where the rest of it is.
//
// **The same functions the browser runs.** `bibliographyHtml`,
// `narrativesHtml` and `entryHtml` are the page modules' own, imported from
// `src/`; nothing here re-implements a list. That is the whole point of
// prerendering: the markup a reader gets before any script has run is the
// markup the script would have produced, so the two cannot disagree
// (health review A, finding 15).
//
// **`entry.html?id=` stays the address** (health plan, decision 4; review of
// the plan, finding 9). A prerendered page is a second, static rendering of
// a record, and it says so with a canonical link back to the parameterised
// address; every link inside it still points at `entry.html?id=`, so the
// atlas has one URL grammar and not two.

import { bibliographyHtml } from '../../src/sources/bibliography.js';
import { narrativesHtml } from '../../src/narratives/list.js';
import { entryHtml, createLinks, displayName, ENTRY_KINDS } from '../../src/entry/entry.js';
import { esc } from '../../src/util/esc.js';

// The generated region of a hand-written page. The markers are in the file
// itself, so a reader of sources.html can see where the list comes from, and
// so the build never has to guess how much of the page is its own.
export const OPEN = '<!--prerendered-->';
export const CLOSE = '<!--/prerendered-->';

// Everything the entry pages sit under, relative to the site root.
export const ENTRY_DIR = 'entry';

// A page is one directory down, so every relative URL in the template — the
// stylesheet, the bootstrap module, `index.html`, `entry.html?id=` — has to
// resolve against the root and not against `entry/`. One <base> does that for
// all of them, including the fetches the script makes, and leaves the
// template's own hrefs exactly as they are written.
const BASE = '<base href="../">';

export function injectInto(html, markup, { where = 'the page' } = {}) {
  const open = html.indexOf(OPEN);
  const close = html.indexOf(CLOSE);
  if (open < 0 || close < open) {
    throw new Error(`${where}: no ${OPEN} … ${CLOSE} region to write the generated list into`);
  }
  return `${html.slice(0, open + OPEN.length)}\n${markup}\n${html.slice(close)}`;
}

// The record kinds that get a page of their own, and the ones that have
// something to put on it. A record with no `body` is read as a card in the
// atlas and through `entry.html?id=`, which says plainly that nobody has
// written the long entry yet; committing a file per record to say that would
// be a file per record saying nothing (review of the health plan, finding 9).
export function entryRecords(records) {
  return (records ?? [])
    .filter((r) => ENTRY_KINDS.includes(r.kind) && typeof r.body === 'string' && r.body.trim() !== '')
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// The template with its head extended and its slot filled. The surgery is
// deliberately strict: a template that has stopped carrying one of these
// marks throws here rather than producing a page with no stylesheet or a
// canonical link pointing at nothing.
export function entryPage(template, { kind, record, markup }) {
  const title = displayName(record);
  const canonical = `entry.html?id=${encodeURIComponent(record.id)}`;
  let html = template;

  const titleTag = /<title>[^<]*<\/title>/;
  if (!titleTag.test(html)) throw new Error('entry.html: no <title> to name the record in');
  html = html.replace(titleTag, `<title>${esc(title)} — Atlas causal</title>`);

  const head = '<!--prerender:head-->';
  if (!html.includes(head)) throw new Error(`entry.html: no ${head} to put the base and the canonical link in`);
  html = html.replace(head, `${BASE}\n  <link rel="canonical" href="${esc(canonical)}">`);

  const slot = /<div id="entry"[^>]*>[\s\S]*?<\/div>/;
  if (!slot.test(html)) throw new Error('entry.html: no <div id="entry"> to render the record into');
  return html.replace(
    slot,
    `<div id="entry" data-prerendered="1" data-id="${esc(record.id)}" data-kind="${esc(kind)}">\n${markup}\n    </div>`,
  );
}

// Every page the build owns, keyed by its path from the site root.
//
// `templates` are the three hand-written files as they stand on disk; the
// generated regions in them are replaced whatever they currently hold, so a
// build is idempotent and a build over a stale page is a fresh page.
export function sitePages({ atlas, records, narratives, events, edges, templates }) {
  const links = createLinks();
  const pages = {
    'sources.html': injectInto(
      templates['sources.html'],
      bibliographyHtml([...atlas.sources.values()]),
      { where: 'sources.html' },
    ),
    'narratives.html': injectInto(
      templates['narratives.html'],
      narrativesHtml(narratives, { events, edges }),
      { where: 'narratives.html' },
    ),
  };
  for (const record of entryRecords(records)) {
    const markup = entryHtml(atlas, {
      kind: record.kind,
      record,
      topologyEntry: atlas.resolve(record.id)?.record ?? null,
      links,
      languages: [],
    });
    pages[`${ENTRY_DIR}/${record.id}.html`] = entryPage(templates['entry.html'], {
      kind: record.kind, record, markup,
    });
  }
  return pages;
}
