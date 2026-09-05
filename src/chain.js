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
