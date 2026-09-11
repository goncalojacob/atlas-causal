// What crosses to the Worker and what comes back, as two pure functions.
//
// A Worker is only worth having if what it is given is small. The events and
// edges of an atlas carry summaries, actors, citations and prose, and none of
// that decides where a node goes: the arrangement needs an id, a year, a
// weight and which band the event belongs in, and nothing else (review of the
// health plan, finding 14, which asked for exactly those four). So the
// message is columns of primitives, the bands are two strings each, and the
// membership of a lane travels as one integer per event rather than as a set
// of ids per lane.
//
// Coming back is the same idea: coordinates by id, and the records they
// belong to are re-attached on this side, where they never left. The scale is
// a pair of arrays there and a function again here — a function does not
// survive a structured clone, and rebuilding it is two numbers of arithmetic.
//
// Both directions are pure and neither touches a Worker, which is what lets
// `node --test` hold them to a round trip that changes nothing.

import { createLinearScale } from '../timeline-scale.js';
import { laneOf } from '../lanes.js';

// The arrangement's input, as a structured-cloneable object.
export function packInput({ events, edges, lanes = [], extent: dataExtent, width = null }) {
  const at = new Map();
  events.forEach((event, i) => at.set(event.id, i));
  const laneAt = new Map(lanes.map((lane, i) => [lane.id, i]));
  const id = [];
  const start = [];
  const end = [];
  const weight = [];
  const lane = [];
  for (const event of events) {
    id.push(event.id);
    // The bounds as the record writes them — an integer, or a `{ min, max }`
    // for a year that is not certain — and not the astronomical reading of
    // them. `toAstronomical` moves a year before the era by one and would do
    // it again on the other side (util/dates.js).
    start.push(event.when.start);
    end.push(event.when.end ?? null);
    weight.push(event.weight ?? 0);
    // Which band, decided here where the members are: -1 is an event no lane
    // claims, which layoutGraph puts in the last band rather than nowhere.
    lane.push(lanes.length === 0 ? -1 : (laneAt.get(laneOf(event, lanes)?.id) ?? -1));
  }
  const edgeId = [];
  const from = [];
  const to = [];
  for (const edge of edges) {
    // An edge whose ends are not both in the arrangement has nothing to join,
    // and the caller has already dropped those; this is the guard, not a case.
    if (!at.has(edge.from) || !at.has(edge.to)) continue;
    edgeId.push(edge.id);
    from.push(at.get(edge.from));
    to.push(at.get(edge.to));
  }
  return {
    events: { id, start, end, weight, lane },
    edges: { id: edgeId, from, to },
    lanes: lanes.map((l) => ({ id: l.id, label: l.label })),
    extent: dataExtent ? { min: dataExtent.min, max: dataExtent.max } : null,
    width,
  };
}

// And back into the shape `layoutGraph` takes. The events are the four
// fields it reads and no more, which is why this is not the atlas's own
// record: a node's `event` is put back on the other side.
export function unpackInput(message) {
  const events = message.events.id.map((id, i) => ({
    id,
    when: { start: message.events.start[i], end: message.events.end[i] },
    weight: message.events.weight[i],
  }));
  const lanes = message.lanes.map((lane) => ({ ...lane, members: new Set() }));
  message.events.lane.forEach((band, i) => {
    if (band >= 0 && lanes[band]) lanes[band].members.add(events[i].id);
  });
  const edges = message.edges.id.map((id, i) => ({
    id,
    from: events[message.edges.from[i]].id,
    to: events[message.edges.to[i]].id,
  }));
  const input = { events, edges, lanes, extent: message.extent };
  if (message.width !== null && message.width !== undefined) input.width = message.width;
  return input;
}

// The arrangement's output, without the records and without the scale.
export function packLayout(layout) {
  const nodes = { id: [], lane: [], year: [], weight: [], x: [], y: [] };
  for (const node of layout.nodes) {
    nodes.id.push(node.id);
    nodes.lane.push(node.lane);
    nodes.year.push(node.year);
    nodes.weight.push(node.weight);
    nodes.x.push(node.x);
    nodes.y.push(node.y);
  }
  const edges = { id: [], from: [], to: [], x1: [], y1: [], x2: [], y2: [] };
  for (const line of layout.edges) {
    edges.id.push(line.id);
    edges.from.push(line.from);
    edges.to.push(line.to);
    edges.x1.push(line.x1);
    edges.y1.push(line.y1);
    edges.x2.push(line.x2);
    edges.y2.push(line.y2);
  }
  return {
    width: layout.width,
    height: layout.height,
    bands: layout.bands.map((b) => ({ ...b })),
    nodes,
    edges,
    crossings: layout.crossings,
    naiveCrossings: layout.naiveCrossings,
    scale: { domain: [...layout.scale.domain], range: [...layout.scale.range] },
  };
}

// The records are re-attached from the maps the atlas already holds. An id
// the atlas no longer knows would be a node drawn for a record that is not
// there, so it is dropped rather than drawn empty — it can only happen if the
// arrangement outlived the atlas it was built from, which nothing does today.
export function unpackLayout(message, { events, edges }) {
  const nodes = [];
  for (let i = 0; i < message.nodes.id.length; i += 1) {
    const event = events.get(message.nodes.id[i]);
    if (!event) continue;
    nodes.push({
      id: message.nodes.id[i],
      event,
      lane: message.nodes.lane[i],
      year: message.nodes.year[i],
      weight: message.nodes.weight[i],
      x: message.nodes.x[i],
      y: message.nodes.y[i],
    });
  }
  const laid = [];
  for (let i = 0; i < message.edges.id.length; i += 1) {
    const edge = edges.get(message.edges.id[i]);
    if (!edge) continue;
    laid.push({
      id: message.edges.id[i],
      edge,
      from: message.edges.from[i],
      to: message.edges.to[i],
      x1: message.edges.x1[i],
      y1: message.edges.y1[i],
      x2: message.edges.x2[i],
      y2: message.edges.y2[i],
    });
  }
  return {
    width: message.width,
    height: message.height,
    bands: message.bands,
    nodes,
    edges: laid,
    scale: createLinearScale(message.scale),
    crossings: message.crossings,
    naiveCrossings: message.naiveCrossings,
  };
}
