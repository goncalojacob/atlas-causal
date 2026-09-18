// Which records are on screen when one record is open, and therefore which
// attribute shards a card or an entry page has to hold to be drawn whole.
//
// Since I4 the titles, the roles, the names and the counts arrive a century at
// a time behind the picture (docs/index2-plan.md, D4). The three views may draw
// a bar, a mark and a node before their century lands and label them when it
// does; a card and an entry page may not — they draw out of a shard that has
// landed or say they are loading, and never out of the core's fallbacks
// (index2 review, finding 21).
//
// The readers here are the unwindowed ones, which is the whole reason this is a
// list of records and not a window: an actor's events may span five centuries,
// and a cap of four unpinned shards would otherwise draw that actor incomplete
// for ever — the fifth shard evicting the first, the redraw asking for the
// first again (index2 review, finding 9; h3a-brief, A4). What comes back from
// here is pinned while the card is on screen.
//
// Pure and free of the DOM: it reads the joins `createAtlas` already built and
// nothing else.

// The ids a card for `kind`/`id` prints something out of a shard about. The
// record itself always, and then whatever its own lists reach: an event's
// actors, its place, its parts, the events one link away and the accounts that
// walk it; an actor's events, relations, offices and their turns; a place's
// events; an office's turns and the people who held them.
//
// A source is not in the graph file at all — the sources index carries it whole
// — so a source's card asks for nothing here, and neither does a record the
// atlas cannot resolve.
export function recordsOnScreen(atlas, kind, id) {
  const ids = new Set();
  const note = (value) => { if (typeof value === 'string' && value !== '') ids.add(value); };
  const noteAll = (list) => { for (const each of list ?? []) note(each); };
  note(id);

  // What the accounts that walk this record are called: the title is in the
  // narrative's own shard, wherever the record it walks is filed.
  noteAll((atlas.narrativesByRef.get(id) ?? []).map((n) => n.id));

  if (kind === 'event') {
    const event = atlas.events.get(id);
    if (!event) return ids;
    note(event.place);
    note(event.parent);
    noteAll((event.actors ?? []).map((a) => a.actor));
    noteAll(atlas.childrenOf.get(id));
    // One link out and one link in: the card names the event at the far end of
    // each, so its title is on screen as much as this one's is.
    for (const edge of [...(atlas.adjacency.out.get(id) ?? []), ...(atlas.adjacency.in.get(id) ?? [])]) {
      note(edge.id);
      note(edge.from);
      note(edge.to);
    }
    return ids;
  }

  if (kind === 'edge') {
    const edge = atlas.edges.get(id);
    if (edge) { note(edge.from); note(edge.to); }
    return ids;
  }

  if (kind === 'actor') {
    noteAll((atlas.eventsByActor.get(id) ?? []).map((row) => row.event.id));
    for (const { relation, other } of atlas.relationsByActor.get(id) ?? []) {
      note(relation.id);
      note(other);
    }
    for (const office of atlas.officesByActor.get(id) ?? []) {
      note(office.id);
      for (const tenure of atlas.tenuresByOffice.get(office.id) ?? []) {
        note(tenure.id);
        note(tenure.person);
      }
    }
    return ids;
  }

  if (kind === 'place') {
    noteAll((atlas.eventsByPlace.get(id) ?? []).map((event) => event.id));
    return ids;
  }

  if (kind === 'office') {
    const office = atlas.offices.get(id);
    if (office) note(office.of);
    for (const tenure of atlas.tenuresByOffice.get(id) ?? []) {
      note(tenure.id);
      note(tenure.person);
    }
    return ids;
  }

  if (kind === 'narrative') {
    // The steps are attributes themselves, so a narrative whose own shard has
    // not landed knows only that it exists. That is not a hole: this is called
    // again when a shard lands, and the walk's records are asked for then.
    for (const step of atlas.narratives.get(id)?.steps ?? []) note(step?.ref);
    return ids;
  }

  return ids;
}

// The shards those records are filed in, ready to be pinned and fetched. Empty
// on an atlas built from the spine, which has every attribute in hand already
// and shards nothing.
export function shardsOnScreen(atlas, kind, id) {
  if (typeof atlas.attributeShardsOf !== 'function') return [];
  return atlas.attributeShardsOf(recordsOnScreen(atlas, kind, id));
}

// What a view may print as a record's name, and null while it has none yet.
//
// The core's fallback for a missing title is the record's id (spine.js,
// ATTRIBUTE_FALLBACKS), which is right for a sort and wrong for anything a
// reader reads: a slug drawn where a title goes is the atlas presenting a
// derived string as the name of the thing. So a bar, a mark and a node are
// drawn with no label until their century lands, and labelled when it does
// (i4-brief, "no fallback text that could be mistaken for data").
export function labelOf(atlas, record) {
  return record && atlas.attributesLoaded(record.id) ? record.title : null;
}

// And what a control called by that name has to say to a screen reader, which
// cannot be nothing: a bar and a mark are buttons, and a button with no
// accessible name is a button nobody can find. It is the interface saying it is
// still loading — the same thing the source card says about its citers — and
// never a fallback that could be read as the record's own name.
export const LOADING_LABEL = 'still loading';

// And what the two writer pages say in place of a verdict. `contribute.html`
// and `review.html` are whole-universe readers — rule 21 asks whether a
// `wikidata` id is unique across the atlas, `findSimilar` reads every title
// and every alias — so they draw out of the core and then fetch **every**
// attribute shard, and neither `checkRules` nor `findSimilar` runs until the
// last one is in (i4-brief, A2; index2 review, finding 2).
//
// A verdict on half the corpus is worse than none: it would file a duplicate
// as new and warn about things the CLI does not. So the form and the editor
// print this beside the rule output until the corpus is whole.
export const LOADING_CORPUS = 'still loading the corpus';
