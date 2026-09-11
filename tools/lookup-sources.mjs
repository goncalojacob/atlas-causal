#!/usr/bin/env node
// A review aid, not a check: for every source in a contribution that carries
// a DOI or an ISBN, ask a public catalogue what that identifier actually
// names, so the reviewer sees the title found beside the title submitted.
// A source record with a plausible title and a made-up identifier otherwise
// satisfies "every node has a source" and only a human looking it up would
// notice (docs/review-2026-09-01.md, finding 12).
//
// Best effort by design: it never fails the workflow, and nothing here runs
// in the browser or at deploy time — the site has no network dependency.
//
//   ISSUE_BODY=… node tools/lookup-sources.mjs

import { pathToFileURL } from 'node:url';
import { extractBundle } from './bundle-to-files.mjs';
import { similarity } from '../src/contribute/bundle.js';

export const DOI = /^10\.[0-9]{4,9}\/\S+$/;
export const ISBN = /^(?:[0-9]{9}[0-9Xx]|[0-9]{13})$/;
export const TIMEOUT = 10_000;
// Below this, the titles are different enough to be worth a second look.
export const CLOSE_ENOUGH = 0.6;

export function sourcesToCheck(bundle) {
  return (bundle?.records ?? [])
    .filter((r) => r?.kind === 'source' && typeof r.title === 'string')
    .map((r) => ({
      id: r.id,
      title: r.title,
      doi: typeof r.doi === 'string' && DOI.test(r.doi) ? r.doi : null,
      isbn: typeof r.isbn === 'string' && ISBN.test(r.isbn) ? r.isbn : null,
    }))
    .filter((s) => s.doi || s.isbn);
}

export function catalogueUrl({ doi, isbn }) {
  if (doi) return { catalogue: 'Crossref', url: `https://api.crossref.org/works/${encodeURI(doi)}` };
  return { catalogue: 'Open Library', url: `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json` };
}

export function titleFrom(catalogue, payload) {
  if (catalogue === 'Crossref') {
    const title = payload?.message?.title;
    return Array.isArray(title) ? title[0] ?? null : typeof title === 'string' ? title : null;
  }
  return typeof payload?.title === 'string' ? payload.title : null;
}

export async function lookup(source, { fetchJson } = {}) {
  const { catalogue, url } = catalogueUrl(source);
  try {
    const payload = fetchJson
      ? await fetchJson(url)
      : await (async () => {
        const response = await fetch(url, {
          headers: { accept: 'application/json', 'user-agent': 'atlas-causal contribution review' },
          signal: AbortSignal.timeout(TIMEOUT),
          redirect: 'follow',
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })();
    return { ...source, catalogue, found: titleFrom(catalogue, payload), error: null };
  } catch (error) {
    return { ...source, catalogue, found: null, error: error.message };
  }
}

// Markdown, for a comment on the pull request. The catalogue's answer is
// quoted, never acted on: this comment is for the person reviewing.
export function formatReport(results) {
  if (!results.length) return '';
  const lines = [
    'Identifiers, checked against the public catalogues. This is a reading aid for the reviewer — the atlas takes no action on it.',
    '',
    '| source | identifier | title submitted | title found |',
    '| --- | --- | --- | --- |',
  ];
  const cell = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
  let mismatch = false;
  for (const r of results) {
    const identifier = r.doi ? `DOI ${r.doi}` : `ISBN ${r.isbn}`;
    let found;
    if (r.error) found = `_${r.catalogue} could not answer: ${cell(r.error)}_`;
    else if (!r.found) found = `_${r.catalogue} knows the identifier but gave no title_`;
    else {
      const close = similarity(r.title, r.found) >= CLOSE_ENOUGH;
      if (!close) mismatch = true;
      found = `${close ? '' : '⚠ '}${cell(r.found)}`;
    }
    lines.push(`| \`${cell(r.id)}\` | ${cell(identifier)} | ${cell(r.title)} | ${found} |`);
  }
  if (mismatch) {
    lines.push('', '⚠ marks a title that does not resemble the one submitted. Usually a subtitle or an edition; sometimes the identifier belongs to a different work.');
  }
  return lines.join('\n');
}

async function main() {
  let bundle;
  try {
    bundle = extractBundle(process.env.ISSUE_BODY ?? '');
  } catch (error) {
    console.error(`no bundle to check: ${error.message}`);
    return 0;
  }
  const sources = sourcesToCheck(bundle);
  if (!sources.length) {
    console.error('no source in this bundle carries a DOI or an ISBN');
    return 0;
  }
  const results = [];
  for (const source of sources) results.push(await lookup(source));
  console.log(formatReport(results));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
