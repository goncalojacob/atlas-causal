// How sure the atlas is, and how sure it looks.
//
// `confidence` separates consensus from debate, and presenting a disputed
// link as fact is the worst mistake this project can make (CLAUDE.md). The
// card has always said which a link is, in words. Nothing drawn said it: on
// the graph a line's dash and weight say what *type* of claim it is, so a
// contested link and an established one were the same line, and the walk the
// map draws was the same. M73 is that gap.
//
// One module, because the graph's edges and the map's walk lines are two
// pictures of the same records: a view that worked out for itself what a
// confidence looks like is exactly how two pictures come to disagree about
// which link is the shaky one.
//
// What this hands back is a class and never a number. The stylesheet keeps
// deciding how a line is inked, as it already does for the five types and
// for the weight of a merged line; this says only which of the three a line
// is. Which dimension the stylesheet spends on it is its own comment to
// make, and the short of it is: type owns the dash pattern and the weight,
// so confidence takes how solidly the line is inked, through
// `stroke-opacity` rather than the `opacity` the emphasis states own — so
// that a disputed link outside the reader's window is outside the window
// *and* doubtful, rather than one of the two winning.

// Surest first. The order an answer list is sorted in, the order the costs
// in `graph.js` are written in, and the order the key is drawn in.
export const CONFIDENCE_ORDER = Object.freeze(['consensus', 'probable', 'disputed']);

// The least sure of the three, which is also what an unknown is drawn as:
// an unknown is not a settled claim, the rule `stepCost` already costs a
// step by.
const LEAST_SURE = CONFIDENCE_ORDER[CONFIDENCE_ORDER.length - 1];

// The class a line drawn for a record of each confidence carries. Prefixed:
// a bare `.consensus` beside the graph's own `.consequence` is a typo
// waiting to happen, and the map already draws a presence whose ground is
// argued about with a bare `.disputed`, which is a territory and not a link.
export const CONFIDENCE_CLASS = Object.freeze(Object.fromEntries(
  CONFIDENCE_ORDER.map((confidence) => [confidence, `confidence-${confidence}`]),
));

// What a record says it is, or the least sure where it says nothing this
// module has heard of. The vocabulary is closed and the validator enforces
// it, so this is about a record arriving from somewhere the validator has
// not been — an index half-decoded, a fixture, a contribution in a form.
export function confidenceOf(record) {
  const value = record?.confidence;
  return CONFIDENCE_ORDER.includes(value) ? value : LEAST_SURE;
}

export function confidenceClass(record) {
  return CONFIDENCE_CLASS[confidenceOf(record)];
}

// What a line carrying several links is: the least sure of them. Which is
// the rule `cluster.js` already states for `disputed` — a bundle one of
// whose links historians argue about is a bundle the reader must not read as
// settled — asked of all three levels instead of one. A bundle of nothing is
// the least sure too, for the reason an unknown is.
export function leastSure(records) {
  let worst = CONFIDENCE_ORDER[0];
  let any = false;
  for (const record of records ?? []) {
    any = true;
    const confidence = confidenceOf(record);
    if (CONFIDENCE_ORDER.indexOf(confidence) > CONFIDENCE_ORDER.indexOf(worst)) worst = confidence;
  }
  return any ? worst : LEAST_SURE;
}

// The class for a whole bundle, which is the class for the least sure of it.
export function bundleClass(records) {
  return CONFIDENCE_CLASS[leastSure(records)];
}
