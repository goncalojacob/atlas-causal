// Which events have parts, once.
//
// M30b-2 gave a parent two *behaviours* — a bracket over its parts where they
// share a lane, and a fold on the graph that drew them inside it while the
// reader was zoomed out — and neither was a *look*: a parent whose parts were
// spread over lanes, or under `group: none`, or zoomed past the fold's
// threshold, was drawn exactly like any other event. M30c gives it one look on
// the three views, a ring
// outside its mark, and this is the file that says which events get it, so the
// map, the timeline and the graph cannot come to disagree about what a ring
// means (the same argument large.js makes about a band). The graph's fold is
// gone since M70 and the bracket is what is left beside the ring.
//
// `parent` is a display fact and never an argument (CLAUDE.md): this is read
// out of `childrenOf`, which is built from the active events alone and is
// deliberately not in the adjacency, so nothing here touches a consequence or
// a cause.
//
// Pure: the atlas and an event in, an answer out. Nothing here knows the DOM.

// What an event is part of, whatever shape its record spells it in. The owner,
// 22 September: *"Can't we have many umbrellas for the same event? For example,
// the angola independence is both under the Portuguese third republic and
// african decolonization."* So `parent` admits a list of ids as well as one id
// or null, and **one parent is a list of one**.
//
// Three spellings and one answer (M79):
//
//   absent or null  → `[]`, and the event is main
//   `"war"`         → `["war"]`, which is what every record in `data/` says
//                     today and what nothing rewrites: churn on eight hundred
//                     files would say nothing a reader could see
//   `["war", "..."]` → itself, in the order the writer put it in
//
// Order is the record's own and is never sorted here: the card says "part of"
// each parent in that order, and a writer who put the regime before the
// continent meant that.
//
// Nothing is deduplicated and nothing is dropped but a slot that is not a
// string: the same parent twice is rule 24's error and the rule has to be able
// to see it. This is the one place any of the three shapes is read — the
// validator, the index, the three views, the card, the form and `m42-pool` all
// come through here, because two readings of one field are how a ring and a
// card come to disagree about what an event is inside.
export function parentsOf(event) {
  const parent = event?.parent;
  if (typeof parent === 'string') return [parent];
  if (Array.isArray(parent)) return parent.filter((id) => typeof id === 'string');
  return [];
}

// A retracted or merged event is never a parent for this purpose. Its parts
// may well still be active and still name it, but a record the atlas has
// withdrawn is not something to send a reader inside.
export function isParent(atlas, event) {
  if (!event || event.status !== 'active') return false;
  return (atlas?.childrenOf?.get(event.id)?.length ?? 0) > 0;
}

// What a ring is called, and what it inherits. The word is `ring` on the three
// views, so about.html has one thing to explain; the rest is whatever the
// record's own mark is wearing, so the ring reddens with the walked chain and
// dims and fades exactly as the mark does and can never say something the mark
// is not saying.
//
// `base` is the view's own word for a record — `mark`, `bar`, `node` — and the
// ring does not take it: it is an outline and not a record, and every selector
// that counts records has to go on counting records.
export function ringClasses(classes, base) {
  return overlayClasses('ring', classes, base);
}

// And the same substitution for anything else drawn over a record and not
// instead of it. The glyph run wanted a second copy of the line above
// (glyphs-brief, §2); two copies of a convention are how the ring and the
// symbol come to disagree about what a record is wearing, so there is one —
// `name` is what the thing is called on every view, `base` is the word it does
// not take, and the rest is whatever the record's own mark or bar is wearing.
export function overlayClasses(name, classes, base) {
  return [name, ...classes.split(' ').filter((c) => c && c !== base)].join(' ');
}
