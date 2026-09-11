// Which events have parts, once.
//
// M30b-2 gave a parent two *behaviours* — a bracket over its parts where they
// share a lane, a collapsed badge on the graph while the reader is zoomed out
// — and neither is a *look*: a parent whose parts are spread over lanes, or
// under `group: none`, or at a zoom where nothing collapses, was drawn exactly
// like any other event. M30c gives it one look on the three views, a ring
// outside its mark, and this is the file that says which events get it, so the
// map, the timeline and the graph cannot come to disagree about what a ring
// means (the same argument large.js makes about a band).
//
// `parent` is a display fact and never an argument (CLAUDE.md): this is read
// out of `childrenOf`, which is built from the active events alone and is
// deliberately not in the adjacency, so nothing here touches a consequence or
// a cause.
//
// Pure: the atlas and an event in, an answer out. Nothing here knows the DOM.

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
  return ['ring', ...classes.split(' ').filter((c) => c && c !== base)].join(' ');
}
