// What of an imported summary is the source's own account, and what is the
// importer's note about the record's standing. Pure: text in, parts out, no
// DOM and no flag — `src/panel/summary.js` is what turns these into a card.
//
// The second Fable review, 24 September, finding A1: 580 of 858 active events
// carry a `summary` that quotes the article's lead and then says, in the
// record, that nobody has read it and where `review.html` is. `src/demo.js`
// takes that message out of the chrome and cannot reach text that lives in a
// record, so the message the flag removed from the masthead was back in the
// first paragraph of two thirds of the cards, with a pointer to a page a
// funder must not be sent to.
//
// **Nothing in the record changes.** The sentences are still on disk, the
// validator still counts them, `review.html` still shows them, and `?review=1`
// still prints them on the card. What changes is which of them the published
// page puts first.
//
// **Detected by its markers and never by length** (the brief). The importer
// wrote two fixed sentences and two fixed framings, and they are matched
// literally: a record whose summary a person has written matches none of them
// and comes back untouched, which is the answer for every record the exception
// of CLAUDE.md is retired on.

// The two sentences the importer writes about the record's own standing. Both
// are literal — they were written by one tool, with one wording each, and a
// pattern loose enough to catch a person's prose would be a pattern that eats
// somebody's writing.
export const PROVENANCE_SENTENCES = Object.freeze([
  "That is the article's account and not yet this atlas's; nobody has read this record, and review.html is where somebody does.",
  "Everything here is copied from the item's own fields and nothing in it is this atlas's account of the thing: that is still to be written, and review.html is where somebody writes it.",
]);

// And the sentence that names the tool. It carries the item's id, which is the
// credit; what is left of it is the importer talking about itself.
const IMPORTED_BY = /Wikidata item (Q\d+), imported by tools\/import\/wikidata\.mjs\./;
// The other shape the same fact takes, where the description rides along.
const ITEM_DESCRIBED = /Wikidata item (Q\d+), whose own description reads "([^"]*)"\./;
// The description on its own, in the shape the tool writes it after the
// sentence above, and the sentence it writes instead when there is none.
const DESCRIPTION = /The item's own description reads "([^"]*)"\./;
const NO_DESCRIPTION = /The item carries no description in English or Portuguese\./;

// The framing around a quoted lead: the article, the revision it was read at,
// and the opening quotation mark. Not anchored at the start of the string,
// because an actor's summary opens with the item's area and population and
// the article comes after it; and the title is matched lazily rather than as
// "anything but a quote", because one article this atlas cites is called
// `"False positives" scandal`.
const OPENS = /The English Wikipedia article "(.*?)", at revision (\d+), opens: "/;

// And the same framing without the quoted lead behind it: `…, at revision N,
// records a battle of…`, `…, describes itself in its short description as…`,
// `…, § Rise of Nazi Germany, states: "…"`. Three of the 993 imported events
// carry it — written by the curation fire in the importer's voice rather than
// by the importer's own fixed sentence — and `OPENS` could not see past the
// verb, so the whole framing stayed in the body: the card printed a revision
// number as the first thing it said about the Battle of Kapyong, and the
// search index was findable by "revision" and "wikipedia" for all three
// (M88 §2, deviation below). The article and the revision are the credit here
// exactly as they are above; what is left of the sentence is the account, and
// it keeps the record's own next word — these summaries go on saying "The
// article states that…" two sentences later, which is the voice this leaves
// them in and not one invented for them.
const FRAMED = /The English Wikipedia article "(.*?)", at revision (\d+), /;
const FRAMED_AS = 'The article ';

// And the catch-all, after the four framings above have been lifted out: any
// sentence still left that names the maintainer's page or says the record is
// unread. It exists because the list above is a list, and a list goes stale:
// one event's summary was written by hand in the importer's own voice
// ("review.html is where somebody writes the account"), and the next import
// may invent a sixth wording. **Nobody writing for a reader points them at
// `review.html`**, so a sentence that does is the apparatus and not the
// account — which is the whole of the rule.
const STANDING_WORDS = ['review.html', 'nobody has read'];

// Where the quoted lead ends: at the first provenance marker after it. The
// lead itself holds quotation marks — "New Imperialism", "the Directory" —
// so the closing one cannot be found by looking for a quote.
const AFTER_LEAD = [
  PROVENANCE_SENTENCES[0],
  PROVENANCE_SENTENCES[1],
  'Wikidata item Q',
];

const firstOf = (text, from, needles) => needles
  .map((needle) => text.indexOf(needle, from))
  .filter((at) => at >= 0)
  .reduce((best, at) => (best < 0 || at < best ? at : best), -1);

// Tidy what is left after a sentence has been lifted out of the middle of a
// paragraph: the two spaces that closed around the hole, and a space or a
// stray closing quote at either end.
const tidy = (text) => text.replace(/\s+/g, ' ').replace(/^["\s]+|\s+$/g, '').trim();

// Whether this is the importer's shape at all. One question, asked by the
// card, the tests and the review page alike.
export function isImportedSummary(text) {
  const s = typeof text === 'string' ? text : '';
  if (s === '') return false;
  return OPENS.test(s) || IMPORTED_BY.test(s) || ITEM_DESCRIBED.test(s)
    || STANDING_WORDS.some((words) => s.includes(words));
}

// A summary, read.
//
//   { body, credit: { article, revision, lang, wikidata } | null, provenance }
//
// `body` is what the source itself says — the quoted lead, or the item's own
// description where there is no article, with anything the importer wrote
// around neither of them kept as it was (a polity's area and population, the
// CShapes account of its periods). `credit` is the one line the card prints
// instead of the framing. `provenance` is every sentence the importer wrote
// about this record's standing, in the order it wrote them, which is what
// `?review=1` shows.
//
// A summary that is nobody's import comes back as `{ body: text, credit: null,
// provenance: '' }`: one shape for every caller, so a card has no branch.
export function readSummary(text) {
  const s = typeof text === 'string' ? text : '';
  if (!isImportedSummary(s)) return { body: s, credit: null, provenance: '' };

  const provenance = [];
  let body = s;
  let article = null;
  let revision = null;
  let wikidata = null;

  // The lead first, because everything else is measured from where it ends.
  const opens = OPENS.exec(body);
  if (opens) {
    article = opens[1];
    revision = opens[2];
    const from = opens.index + opens[0].length;
    const ends = firstOf(body, from, AFTER_LEAD);
    const lead = (ends >= 0 ? body.slice(from, ends) : body.slice(from)).replace(/"\s*$/, '');
    body = `${body.slice(0, opens.index)}${lead}${ends >= 0 ? body.slice(ends) : ''}`;
  }
  // The same framing with no quoted lead behind it, read only where the first
  // did not match: the two are one sentence and one credit, never two.
  const framed = opens ? null : FRAMED.exec(body);
  if (framed) {
    [, article, revision] = framed;
    body = `${body.slice(0, framed.index)}${FRAMED_AS}${body.slice(framed.index + framed[0].length)}`;
  }
  // Whether the article's own account is now in the body, which is what says
  // the item's description would be a second account beside it rather than the
  // only one there is.
  const fromArticle = Boolean(opens || framed);

  // Then the item, whose id is the other half of the credit. Where the
  // description rides on the same sentence it is kept, in the quotation marks
  // that say it is quoted; where the tool says there is none, nothing is kept.
  const described = ITEM_DESCRIBED.exec(body);
  if (described) {
    [, wikidata] = described;
    body = body.replace(ITEM_DESCRIBED, fromArticle ? '' : `"${described[2]}"`);
    provenance.push(described[0]);
  }
  const imported = IMPORTED_BY.exec(body);
  if (imported) {
    [, wikidata] = imported;
    body = body.replace(IMPORTED_BY, '');
    provenance.push(imported[0]);
  }
  const description = DESCRIPTION.exec(body);
  if (description) {
    body = body.replace(DESCRIPTION, fromArticle ? '' : `"${description[1]}"`);
    provenance.push(description[0]);
  }
  const none = NO_DESCRIPTION.exec(body);
  if (none) {
    body = body.replace(NO_DESCRIPTION, '');
    provenance.push(none[0]);
  }

  for (const sentence of PROVENANCE_SENTENCES) {
    if (!body.includes(sentence)) continue;
    body = body.split(sentence).join(' ');
    provenance.push(sentence);
  }

  // And then sentence by sentence, for whatever wording the list above does
  // not know. The split is on the full stop and the pieces are put back with
  // the space that separated them, so a lead cut at its own full stops comes
  // out as it went in.
  if (STANDING_WORDS.some((words) => body.includes(words))) {
    const kept = [];
    for (const sentence of body.split(/(?<=[.!?])\s+/)) {
      if (STANDING_WORDS.some((words) => sentence.includes(words))) provenance.push(sentence);
      else kept.push(sentence);
    }
    body = kept.join(' ');
  }

  const credit = article || wikidata
    ? { article, revision, lang: article ? 'en' : null, wikidata }
    : null;
  return { body: tidy(body), credit, provenance: tidy(provenance.join(' ')) };
}
