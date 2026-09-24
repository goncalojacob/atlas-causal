// A record's summary as a card prints it: the source's own account, one credit
// line under it, and the importer's note about the record's standing only where
// a maintainer has asked for it (M86 §1, review A finding 1).
//
// One function and five cards, because the fault the review found was one
// paragraph rendered verbatim in five places: the event's, the actor's, the
// place's, the office's and the step of a narrative being read. A sixth caller
// is a sixth reader of `readSummary` and not a sixth copy of this decision.
//
// The split itself is pure and lives in `src/summary.js`; what is here is the
// markup, the escaping and the one question `src/demo.js` answers.

import { esc, safeUrl } from '../util/esc.js';
import { readSummary } from '../summary.js';
import { showingReview } from '../demo.js';
import { revisionUrl, itemUrl } from '../wikipedia.js';

// The credit, in one line: where the words above came from and a way to go and
// check them. The revision and not the article, because the article moves and
// the revision is what was copied.
export function creditHtml(credit) {
  if (!credit) return '';
  const href = credit.article
    ? safeUrl(revisionUrl(credit.lang ?? 'en', credit.revision) ?? '')
    : safeUrl(itemUrl(credit.wikidata) ?? '');
  const words = credit.article
    ? `From Wikipedia, revision ${credit.revision}`
    : `From Wikidata item ${credit.wikidata}`;
  const title = credit.article ? credit.article : credit.wikidata;
  if (!href) return `<p class="summary-credit muted">${esc(words)}</p>`;
  return `<p class="summary-credit muted"><a href="${esc(href)}" rel="noopener" target="_blank"
    title="${esc(title ?? '')}">${esc(words)} →</a></p>`;
}

// The whole slot. `extra` is whatever the card already put under its summary —
// the actor card's place line — and is appended unchanged, so moving a card
// onto this function changes the order of nothing.
export function summaryHtml(text, { extra = '' } = {}) {
  const { body, credit, provenance } = readSummary(text);
  const shown = showingReview() && provenance ? `<p class="muted provenance">${esc(provenance)}</p>` : '';
  return `${body ? `<p>${esc(body)}</p>` : ''}${creditHtml(credit)}${shown}${extra}`;
}
