// Mede as singletons da costura de 1885/1886 e imprime a tabela que
// `docs/m59-singletons.md` carrega. Sem dependências.
//
//   node tools/m59-singletons.mjs          # tabela markdown
//   node tools/m59-singletons.mjs --json   # as mesmas linhas, para os testes
//
// M51 emparelhou pelo nome e mediu os 26 pares que o nome encontrou. O que
// sobra são registos sem parceiro: um lado de 1885 sem nada com que casar.
// Aqui a pergunta é feita ao contrário — para cada registo que acaba em 1885,
// qual é o registo de 1886 que está no mesmo chão? — e é a geometria que
// responde, não a string.
//
// O veredicto não é medido. Está escrito em `docs/m59-singletons.md`, que é a
// leitura de uma pessoa sobre o que a medida e o nome dizem juntos.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPresences, geometryFor, ringsOf, bboxOf, overlap } from './overlap.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function readActors() {
  const dir = path.join(ROOT, 'data', 'actors');
  const out = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    out.push(JSON.parse(readFileSync(path.join(dir, name), 'utf8')));
  }
  return out;
}

// Os dois lados da costura, tal como os registos os declaram hoje.
export function sides(actors) {
  const active = actors.filter((a) => a.status === 'active');
  return {
    ending: active.filter((a) => a.when?.end === 1885).sort((a, b) => a.id.localeCompare(b.id)),
    beginning: active.filter((a) => a.when?.start === 1886).sort((a, b) => a.id.localeCompare(b.id)),
  };
}

// Duas caixas que não se tocam não precisam de varrimento nenhum. Sem isto
// são dez mil varrimentos; com isto são algumas centenas.
function disjoint(a, b) {
  return a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY;
}

export function measure() {
  const actors = readActors();
  const { ending, beginning } = sides(actors);
  const presences = readPresences().filter((p) => p.status === 'active');

  const byActor = new Map();
  for (const p of presences) {
    if (!byActor.has(p.actor)) byActor.set(p.actor, []);
    byActor.get(p.actor).push(p);
  }
  const sorted = (id) => (byActor.get(id) ?? []).slice().sort((x, y) => x.when.start - y.when.start);

  // Um registo pode ter mais do que uma presença a começar no mesmo ano.
  // `guinea-bissau-under-portugal` tem duas em 1886, chaves 218 e 219, e
  // `namibia-under-south-africa` outras duas: são dois desenhos sucessivos do
  // mesmo ano — um vale 1886-1886 e o outro 1886-1942 — e não duas metades de
  // um território.
  //
  // Juntá-las num MultiPolygon seria errado nos dois sentidos. Dois anéis
  // iguais sobrepostos **anulam-se** sob a regra par-ímpar, porque um ponto
  // dentro dos dois atravessa um número par de vezes: a Guiné Portuguesa
  // media 0.0572 contra a parte que via e zero contra a união das duas. E
  // mesmo sem se anularem, a área do maior ficaria contada duas vezes.
  //
  // Então cada desenho é medido por si e fica o que melhor casa. Nada é
  // unido, simplificado ou redesenhado, e a linha diz qual das presenças foi.
  const sameYearAs = (id, p) => sorted(id).filter((q) => q.when.start === p.when.start);

  // O lado de 1886: cada desenho do primeiro ano de cada registo que começa
  // em 1886.
  const after = [];
  for (const a of beginning) {
    const first = sorted(a.id).find((p) => p.when.start >= 1886);
    if (!first) continue;
    for (const part of sameYearAs(a.id, first)) {
      const geom = geometryFor(part);
      const rings = ringsOf(geom);
      if (!rings.length) continue;
      after.push({ actor: a.id, presence: part.id, geom, box: bboxOf(rings) });
    }
  }

  const rows = [];
  for (const a of ending) {
    // O lado de 1885: a última presença antes da costura.
    const before = sorted(a.id).filter((p) => p.when.start <= 1885);
    const last = before[before.length - 1] ?? null;
    const row = { actor: a.id, name: a.names?.[0] ?? null, start: a.when.start, lastBefore: null, best: null, ratio: null, jaccard: null, runnerUp: null, runnerUpRatio: null };
    if (!last) { rows.push(row); continue; }
    // O lado de 1885, pela mesma regra: cada desenho do último ano antes da
    // costura, medido por si.
    const mine = [];
    for (const part of sameYearAs(a.id, last)) {
      const geom = geometryFor(part);
      const rings = ringsOf(geom);
      if (rings.length) mine.push({ presence: part.id, geom, box: bboxOf(rings) });
    }
    row.lastBefore = mine.map((m) => m.presence).sort().join(' / ') || null;
    if (!mine.length) { rows.push(row); continue; }

    const scored = [];
    for (const cand of after) for (const side of mine) {
      if (disjoint(side.box, cand.box)) continue;
      const o = overlap(side.geom, cand.geom);
      if (!o || o.ratio === null || o.ratio === 0) continue;
      // `ratio` é interseção sobre o MENOR, como em M51, e vale 1 tanto para
      // dois registos idênticos como para um pequeno inteiramente dentro de um
      // grande. Só por si não distingue identidade de contenção, que é a
      // pergunta desta milestone — Lunda está dentro do Estado Livre do Congo
      // e mede 1.0000 contra ele. `jaccard`, interseção sobre a UNIÃO, é a que
      // separa: cai com a diferença de tamanho e só fica alta quando os dois
      // chãos são o mesmo chão nos dois sentidos.
      const union = o.areaA + o.areaB - o.areaI;
      scored.push({
        actor: cand.actor,
        presence: cand.presence,
        mine: side.presence,
        ratio: Number(o.ratio.toFixed(4)),
        jaccard: union > 0 ? Number((o.areaI / union).toFixed(4)) : null,
        areaBefore: Number(o.areaA.toFixed(3)),
        areaAfter: Number(o.areaB.toFixed(3)),
        smaller: o.smallerSide,
      });
    }
    scored.sort((x, y) => (y.jaccard ?? -1) - (x.jaccard ?? -1));
    if (scored[0]) {
      row.best = scored[0].actor;
      row.lastBefore = scored[0].mine;
      row.firstAfter = scored[0].presence;
      row.ratio = scored[0].ratio;
      row.jaccard = scored[0].jaccard;
      row.areaBefore = scored[0].areaBefore;
      row.areaAfter = scored[0].areaAfter;
      row.smaller = scored[0].smaller;
    }
    if (scored[1]) {
      row.runnerUp = scored[1].actor;
      row.runnerUpRatio = scored[1].ratio;
      row.runnerUpJaccard = scored[1].jaccard;
    }
    rows.push(row);
  }
  return rows;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const rows = measure();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    const sorted = [...rows].sort((a, b) => (b.jaccard ?? -1) - (a.jaccard ?? -1));
    console.log('| jaccard | overlap | 1885 side | best 1886-side match | area before | area after | last before | first after |');
    console.log('|---|---|---|---|---|---|---|---|');
    for (const r of sorted) {
      const n = (v) => (v === null || v === undefined ? '—' : v.toFixed(4));
      console.log(`| ${n(r.jaccard)} | ${n(r.ratio)} | \`${r.actor}\` | ${r.best ? `\`${r.best}\`` : '—'} | ${r.areaBefore ?? '—'} | ${r.areaAfter ?? '—'} | \`${r.lastBefore ?? '—'}\` | \`${r.firstAfter ?? '—'}\` |`);
    }
  }
}
