// Whether a quoted sentence states a cause or only an order of events, and
// which events this atlas holds it names.
//
// A15(5): *chronology is not a claim.* A batch that reads an article for
// causation finds a great many sentences of the shape *"Following the war, X
// happened"* — which says when X happened and nothing about why. Three
// curation fires refused that class by eye, after reading it; A15(5) makes the
// refusal a rule applied **when the edge is written**, so the batch note counts
// what it refused rather than a later review finding what it let through.
//
// The second half is the harder one. *"Following the dissolution of the Soviet
// Union in December 1991, all support to the Democratic Republic was stopped,
// leading to the toppling of the government"* **does** state a cause, and the
// cause it names is a third event — one the atlas holds under its own id. An
// edge drawn from the article's own subject to its object gets the direction
// right and the cause wrong. A15(5): *written from that event or not at all.*
//
// Pure. The atlas's names are handed in, and nothing here fetches or decides
// what to write: it says what the sentence says.

// --- folding ---------------------------------------------------------------
//
// Deviation 1460: the REST extract of a whole article carries its section
// headings as `=== Analysis ===` in the middle of the prose, and a matcher that
// reads them as sentences matches names that are only in a heading. They are
// cut before anything else.
export function stripHeadings(text) {
  return String(text ?? '').replace(/^=+[^=\n]*=+\s*$/gm, ' ');
}

// Everything the fold does except lower the case, so a matcher can still ask
// what the text capitalised (deviation 1464).
export function tidy(text) {
  return stripHeadings(text)
    .normalize('NFC')
    .replace(/[‐-―]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fold(text) {
  return tidy(text).toLowerCase();
}

// --- the refusal class -----------------------------------------------------

// The four openers A15(5) names, and nothing else: a class a fire can widen is
// a class nobody can count.
export const CHRONOLOGY_OPENERS = Object.freeze([
  'after', 'following', 'in the aftermath', 'shortly after',
]);

// What it takes for a sentence to state a cause rather than an order. These are
// the phrases the three curation fires accepted, written down; a sentence with
// none of them and a chronological opener is refused.
export const CAUSAL_MARKERS = Object.freeze([
  'led to', 'leading to', 'led the', 'caused', 'causing', 'resulted in',
  'resulting in', 'as a result', 'because', 'prompted', 'prompting',
  'triggered', 'triggering', 'sparked', 'sparking', 'in response to',
  'in reaction to', 'forced', 'forcing', 'enabled', 'enabling',
  'made possible', 'owing to', 'due to', 'thanks to', 'brought about',
  'gave rise to', 'so that', 'in order to', 'paved the way',
]);

// The opener has to be the opening, and what follows it may be a comma as
// easily as a space: *"Shortly after, the garrison withdrew"* is the class as
// much as *"Shortly after the siege"* is.
export function opensWithChronology(quote) {
  const folded = fold(quote);
  return CHRONOLOGY_OPENERS.some((opener) => folded.startsWith(opener)
    && /^[^a-z0-9]/.test(folded.slice(opener.length)));
}

export function statesACause(quote) {
  const folded = fold(quote);
  return CAUSAL_MARKERS.some((marker) => folded.includes(marker));
}

// The rule itself: a quote that opens on the order of events and states no
// cause is not an argument and no edge may be written from it.
export function isChronologyOnly(quote) {
  return opensWithChronology(quote) && !statesACause(quote);
}

// --- which events a sentence names -----------------------------------------

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Deviation 1459: a record whose name is only a date — `carnation-revolution-1974`
// carries "25 April" — matches every article that names that day, and matches
// nothing about the event. A name with no letters in it is not a name this can
// look for.
export function usableName(name) {
  const folded = fold(name);
  if (folded.length < 4) return false;
  if (!/[a-z]{3}/.test(folded)) return false;
  // A bare date, with or without a year: "25 april", "april 1974", "1974".
  if (/^\d{1,2} [a-z]+( \d{4})?$/.test(folded)) return false;
  if (/^[a-z]+ \d{1,2}(, \d{4})?$/.test(folded)) return false;
  if (/^[a-z]+ \d{4}$/.test(folded)) return false;
  return true;
}

// Deviation 1464: a name that carries a capital is a proper noun in its own
// record, and prose that means that thing keeps at least one of those capitals.
// *"the troubles in Sudan"* and *"a reign of terror"* keep none, and they were
// matching `the-troubles` and `reign-of-terror`. One capital is enough rather
// than all of them, because an article writes *"the treaty of Lausanne"* for the
// Treaty of Lausanne; and a leading article is never one of them, because it
// writes *"the Troubles"* for The Troubles.
const LEADING_ARTICLE = /^(?:the|a|an) /i;

export function capitalsOf(name) {
  return tidy(name)
    .replace(LEADING_ARTICLE, '')
    .split(' ')
    .filter((word) => /^\p{Lu}/u.test(word));
}

// Deviation 1458: a substring match makes every "World War II" a "World War I".
// The name is matched on word boundaries, so the second `I` stops it.
//
// Deviation 1467: a hyphen is not a letter, so that boundary let a name begin
// in the middle of a compound — *"America's support for Iraq in the Iran-Iraq
// War"* was naming `iraq-war`, which is this atlas's 2003 war, and
// *"the Anglo-Zulu War"* would name a Zulu War. A name may not begin
// immediately after a hyphen that joins it to the word before, which is the
// letter-hyphen the lookbehind below refuses; a dash used as punctuation has no
// letter in front of it and is still a boundary. Only the leading side, because
// only the leading side builds another event's name out of this one: English
// puts the qualifier first (Anglo-, Franco-, Soviet-, Iran-), and a trailing
// "War-era" is not a different war.
export function mentions(text, name) {
  if (!usableName(name)) return false;
  const wanted = capitalsOf(name);
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?<![\\p{L}\\p{N}]-)${escape(fold(name))}(?![\\p{L}\\p{N}])`, 'giu');
  // The capital has to be inside the occurrence that matched and not loose in
  // the paragraph, so each match is weighed on its own.
  for (const found of tidy(text).matchAll(pattern)) {
    if (wanted.length === 0) return true;
    const kept = found[0].split(' ').some((word) => wanted.some(
      (want) => word.toLowerCase() === want.toLowerCase() && word[0] === want[0],
    ));
    if (kept) return true;
  }
  return false;
}

// Every event of `candidates` the text names. `candidates` is `[{ id, names }]`
// — an event's title and whatever else it is called — and `exclude` is the ids
// the edge already runs between, which a sentence naming them says nothing new
// about.
export function namesHeldEvents(text, candidates, { exclude = [] } = {}) {
  const skip = new Set(exclude);
  // The text is handed on unfolded: since deviation 1464 `mentions()` reads the
  // capitals, and a caller that folded first would take them away.
  const out = [];
  for (const candidate of candidates ?? []) {
    if (skip.has(candidate.id)) continue;
    const hit = (candidate.names ?? []).find((name) => mentions(text, name));
    if (hit) out.push({ id: candidate.id, name: hit });
  }
  return out;
}

// A15(5)'s verdict on one candidate edge, given its quote. `refuse` is the
// chronology class; `reattribute` is a third event the quote names, which the
// edge must be written from instead or not at all.
export function verdictFor(quote, { from, to, candidates = [] } = {}) {
  if (isChronologyOnly(quote)) {
    return { write: false, why: 'chronology with no cause stated', reattribute: [] };
  }
  const named = namesHeldEvents(quote, candidates, { exclude: [from, to] });
  if (named.length > 0) {
    return { write: false, why: 'the quote names a third event the atlas holds as the cause', reattribute: named };
  }
  return { write: true, why: null, reattribute: [] };
}
