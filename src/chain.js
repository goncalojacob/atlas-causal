// The walked chain, resolved. `?chain=` is a list of edge ids — one per step
// the reader followed — and `atlas.edges` is status-blind: it holds every edge
// the topology carries, tombstones included. So a link somebody was sent can
// name a step the project has since withdrawn, and drawing it would present a
// retracted argument as one that stands.
//
// The walk is cut at the first step that does not stand rather than having
// that step lifted out of its middle. The chain is one argument followed in
// order and the later steps were reached through the earlier ones: a walk
// with a hole in it is not the walk that was shared, and what came after the
// withdrawn step no longer follows from anything. state.js cuts a chain the
// same way, for the same reason, when a step is not an edge id at all.

// The steps that still stand, in the order they were walked.
export function chainEdges(atlas, chain) {
  const edges = [];
  for (const id of chain) {
    const edge = atlas.edges.get(id);
    if (!edge || edge.status !== 'active') break;
    edges.push(edge);
  }
  return edges;
}

// How many steps the walk lost, when what cut it was a withdrawal. Zero for a
// step that names no edge at all: state.js checks the *shape* of a chain step
// and never whether it exists, so a mistyped link has always simply had
// nothing to draw there, and saying "retracted" about it would be a claim the
// atlas cannot support.
export function retractedSteps(atlas, chain) {
  const stood = chainEdges(atlas, chain).length;
  if (stood === chain.length) return 0;
  return atlas.edges.has(chain[stood]) ? chain.length - stood : 0;
}

// --- one click, three pictures ---------------------------------------------
//
// Clicking a mark that is a consequence of the event already open means
// "follow that link", and it means it wherever the reader is standing. The
// graph knew this and the map and the timeline did not: a click on the Alvor
// mark from the Carnation Revolution left `?selected=alvor-agreement-1975`
// with the walk thrown away, while the same click in the graph appended the
// step — and the map had just drawn the consequence line the reader was
// following (health review B, finding 10).
//
// `walkPatch` is the rule, pure: the patch a click on `id` makes. Anything
// that is not a step out of what is open starts afresh, which is what a click
// on an unrelated mark has always meant.
export function walkPatch(atlas, state, id) {
  const chain = state.chain ?? [];
  const step = state.selected
    ? (atlas.adjacency.out.get(state.selected) ?? []).find((edge) => edge.to === id)
    : null;
  return step ? { selected: id, chain: [...chain, step.id] } : { selected: id, chain: [] };
}

// And the rule applied, which is what the three views call.
export function walkOrSelect(state, atlas, id) {
  state.set(walkPatch(atlas, state.get(), id));
}
