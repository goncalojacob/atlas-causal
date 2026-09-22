// The measurement docs/m42-pool.md carries, read off data/ rather than typed.
// M42's amendment A1 says §0's numbers are stale and the run's first commit is
// the re-measurement; A3 asks for main against filed at every batch; A5 asks
// for the largest connected component of the causal graph before and after
// each batch, because that is what "chains throughout the globe and time" is.
//
// Run from the repository root:  node tools/m42-pool.mjs [--json]
// A revision may be named to measure the corpus as it stood then:
//   node tools/m42-pool.mjs --at <rev>
import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parentsOf } from '../src/parts.js';

const root = new URL('..', import.meta.url).pathname;

function fromDisk(dir) {
  return readdirSync(`${root}/data/${dir}`).filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(`${root}/data/${dir}/${f}`, 'utf8')));
}

function fromRev(rev, dir) {
  const names = execFileSync('git', ['ls-tree', '--name-only', `${rev}:data/${dir}`], {
    cwd: root, encoding: 'utf8', maxBuffer: 1 << 28,
  }).trim().split('\n').filter((f) => f.endsWith('.json'));
  return names.map((f) => JSON.parse(execFileSync('git', ['show', `${rev}:data/${dir}/${f}`], {
    cwd: root, encoding: 'utf8', maxBuffer: 1 << 28,
  })));
}

// The causal graph: active events as nodes, active edges between two of them
// as undirected links. `parent` is a display fact and never an argument
// (CLAUDE.md), so it is not a link here and the component count does not
// borrow connectedness from the filing.
export function components(events, edges) {
  const active = events.filter((e) => e.status === 'active');
  const ids = new Set(active.map((e) => e.id));
  const adj = new Map(active.map((e) => [e.id, new Set()]));
  let links = 0;
  for (const g of edges) {
    if (g.status !== 'active' || !ids.has(g.from) || !ids.has(g.to)) continue;
    adj.get(g.from).add(g.to);
    adj.get(g.to).add(g.from);
    links += 1;
  }
  const seen = new Set();
  const sizes = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    let size = 0;
    const stack = [id];
    seen.add(id);
    while (stack.length) {
      const n = stack.pop();
      size += 1;
      for (const m of adj.get(n)) if (!seen.has(m)) { seen.add(m); stack.push(m); }
    }
    sizes.push(size);
  }
  sizes.sort((a, b) => b - a);
  return {
    adj,
    active,
    links,
    sizes,
    largest: sizes[0] ?? 0,
    isolated: sizes.filter((s) => s === 1).length,
    count: sizes.length,
  };
}

// Portuguese reach, the measurement M42's brief §1 keeps after retiring
// M44b's gate: the rule is `docs/m44-connections.md` §1, frozen there, and it
// is read off the records here rather than retyped. It decides nothing now;
// it is the single clearest number for how connected the corpus is.
const PT_PLACES = new Set(['alvor', 'belem', 'boe', 'braga', 'central-portugal', 'chai', 'dili',
  'lajes', 'lisbon', 'luanda', 'macau', 'panaji', 'parque-das-nacoes', 'pedrogao-grande', 'porto',
  'tete-district', 'tite']);
const PT_ACTORS = new Set(['portugal', 'first-portuguese-republic', 'military-dictatorship',
  'estado-novo', 'third-portuguese-republic', 'carlos-i', 'luis-filipe', 'manuel-ii', 'joao-franco',
  'manuel-de-arriaga', 'afonso-costa', 'pimenta-de-castro', 'sidonio-pais', 'paiva-couceiro',
  'gomes-da-costa', 'oscar-carmona', 'salazar', 'humberto-delgado', 'norton-de-matos',
  'henrique-galvao', 'marcelo-caetano', 'americo-tomas', 'antonio-de-spinola',
  'otelo-saraiva-de-carvalho', 'vasco-goncalves', 'ramalho-eanes', 'mario-soares', 'alvaro-cunhal',
  'cavaco-silva', 'pedro-passos-coelho', 'antonio-costa', 'marcelo-rebelo-de-sousa',
  'luis-montenegro', 'andre-ventura', 'ricardo-salgado', 'regenerator-party',
  'partido-republicano-portugues', 'carbonaria', 'partido-democratico', 'republican-liberal-party',
  'democratic-leftwing-republican-party', 'portuguese-expeditionary-corps', 'uniao-nacional',
  'legiao-portuguesa', 'pvde-pide-dgs', 'mud', 'people-s-monarchist-party', 'pcp',
  'armed-forces-movement', 'council-of-the-revolution', 'partido-socialista', 'psd', 'cds-pp',
  'bloco-de-esquerda', 'ecologist-party-the-greens', 'chega', 'liberal-initiative',
  'people-animals-nature', 'portuguese-democratic-movement', 'banco-de-portugal',
  'banco-espirito-santo', 'novo-banco', 'redes-energeticas-nacionais']);

export const isPortuguese = (e) => (e.place && PT_PLACES.has(e.place))
  || (e.actors ?? []).some((a) => PT_ACTORS.has(a.actor))
  || /\bPortugal|\bPortuguese/i.test(e.title ?? '');

function reachTable(active, adj, pt, max = 8) {
  const table = {};
  for (const e of active) {
    let d = Infinity;
    if (pt.has(e.id)) d = 0;
    else {
      const seen = new Set([e.id]);
      let frontier = [e.id];
      for (let step = 1; step <= max && d === Infinity; step += 1) {
        const next = [];
        for (const n of frontier) for (const m of adj.get(n) ?? []) {
          if (seen.has(m)) continue;
          seen.add(m);
          if (pt.has(m)) { d = step; break; }
          next.push(m);
        }
        if (d !== Infinity || !next.length) break;
        frontier = next;
      }
    }
    const key = d === Infinity ? 'unreachable' : String(d);
    table[key] = (table[key] ?? 0) + 1;
  }
  return table;
}

export function measure(events, edges) {
  const byId = new Map(events.map((e) => [e.id, e]));
  // isMain of src/lens.js, read here off the records: an event is main when it
  // is part of no *active* event — of none of them, since M79 lets a record
  // name several (`parentsOf`, src/parts.js).
  const isMain = (e) => !parentsOf(e).some((id) => (byId.get(id)?.status ?? null) === 'active');
  const g = components(events, edges);
  const main = g.active.filter(isMain);
  const activeEdges = edges.filter((e) => e.status === 'active');
  const byStatus = {};
  for (const e of events) byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
  const review = {};
  for (const e of g.active) {
    const s = e.review?.status ?? 'none';
    review[s] = (review[s] ?? 0) + 1;
  }
  const origins = {};
  for (const e of g.active) {
    const t = e.origin?.tool ?? 'person';
    origins[t] = (origins[t] ?? 0) + 1;
  }
  const pt = new Set(g.active.filter(isPortuguese).map((e) => e.id));
  const reach = reachTable(g.active, g.adj, pt);
  return {
    events: events.length,
    active: g.active.length,
    byStatus,
    main: main.length,
    filed: g.active.length - main.length,
    review,
    origins,
    edges: edges.length,
    activeEdges: activeEdges.length,
    linksBetweenActive: g.links,
    components: g.count,
    largestComponent: g.largest,
    componentSizes: g.sizes.slice(0, 10),
    isolated: g.isolated,
    noEdge: g.active.filter((e) => g.adj.get(e.id).size === 0).length,
    portuguese: pt.size,
    world: g.active.length - pt.size,
    reach,
  };
}

// Only when run, never when imported: a test or a script that wants
// `measure()` or `components()` must not have the tables printed at it.
const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {

const at = process.argv.indexOf('--at');
const rev = at >= 0 ? process.argv[at + 1] : null;
const load = rev ? (d) => fromRev(rev, d) : fromDisk;
const out = measure(load('events'), load('edges'));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`${rev ? `at ${rev}` : 'on disk'}
event records: ${out.events} (${Object.entries(out.byStatus).map(([k, v]) => `${k} ${v}`).join(', ')})
active events: ${out.active} — main ${out.main}, filed under a parent ${out.filed}
  review status: ${Object.entries(out.review).map(([k, v]) => `${k} ${v}`).join(', ')}
  written by: ${Object.entries(out.origins).map(([k, v]) => `${k} ${v}`).join(', ')}
edge records: ${out.edges}, active ${out.activeEdges}, between two active events ${out.linksBetweenActive}
components of the causal graph: ${out.components}
  largest: ${out.largestComponent}
  next: ${out.componentSizes.slice(1).join(', ')}
  active events with no edge at all: ${out.noEdge}
Portuguese ${out.portuguese}, world ${out.world}
  hops to a Portuguese event: ${Object.entries(out.reach).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
}
}
