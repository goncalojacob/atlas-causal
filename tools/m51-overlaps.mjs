// Mede as 26 costuras de 1885/1886 e imprime a tabela que
// `docs/m51-overlaps.md` carrega. Sem dependências; corre em segundos.
//
//   node tools/m51-overlaps.mjs          # tabela markdown
//   node tools/m51-overlaps.mjs --json   # as mesmas linhas, para os testes
//
// Os pares são os de `docs/m49-actors.md` §4, na ordem em que lá estão. O
// veredicto não é medido — é a leitura de uma pessoa sobre o que a medida e o
// nome dizem juntos — e está escrito no documento, não aqui.

import { readPresences, geometryFor, overlap } from './overlap.mjs';

export const PAIRS = Object.freeze([
  ['algeria-fr', 'algeria-under-france'],
  ['angola-portugal', 'angola-under-portugal'],
  ['annam', 'vietnam-annam-cochin-china-tonkin'],
  ['belize-before-1886', 'belize-under-united-kingdom'],
  ['bhutan-before-1886', 'bhutan-under-united-kingdom'],
  ['congo-before-1886', 'congo-under-france'],
  ['egypt-before-1886', 'egypt-under-united-kingdom'],
  ['fiji-before-1886', 'fiji-under-united-kingdom'],
  ['gabon-before-1886', 'gabon-under-france'],
  ['germany', 'germany-prussia'],
  ['harer-egypt', 'egypt-under-united-kingdom'],
  ['iceland-before-1886', 'iceland-under-denmark'],
  ['italy', 'italy-sardinia'],
  ['madagascar', 'madagascar-malagasy'],
  ['malta-before-1886', 'malta-under-united-kingdom'],
  ['mozambique-before-1886', 'mozambique-under-portugal'],
  ['new-south-wales-uk', 'new-south-wales'],
  ['ottoman-empire', 'turkey-ottoman-empire'],
  ['persia', 'iran-persia'],
  ['philippines-before-1886', 'philippines-under-united-states-of-america'],
  ['queensland-uk', 'queensland'],
  ['senegal-fr', 'senegal-under-france'],
  ['sierra-leone-before-1886', 'sierra-leone-under-united-kingdom'],
  ['south-australia-uk', 'south-australia'],
  ['victoria-uk', 'victoria'],
  ['western-australia-uk', 'western-australia'],
]);

// O par a medir é a última presença antes da costura contra a primeira
// depois dela. Uma presença fundida por este marco continua a ser a última
// antes de 1886 ou a primeira depois: a medida não muda quando os registos
// se juntam, porque é do chão que fala, e é por isso que os ids aqui são os
// do levantamento e não os que sobreviveram.
export function measure() {
  const byActor = new Map();
  for (const p of readPresences()) {
    if (p.status !== 'active') continue;
    if (!byActor.has(p.actor)) byActor.set(p.actor, []);
    byActor.get(p.actor).push(p);
  }
  // Uma presença fundida guarda `aliases` com o id antigo, e é por aí que o
  // actor do levantamento ainda se encontra depois de uma junção.
  const originalActor = new Map();
  for (const list of byActor.values()) {
    for (const p of list) for (const a of p.aliases ?? []) originalActor.set(a, p.actor);
  }
  const listFor = (id) => byActor.get(id) ?? byActor.get(originalActor.get(id)) ?? [];

  return PAIRS.map(([before, after]) => {
    const pick = (id, keep) => {
      const seen = listFor(id).filter(keep).sort((a, b) => a.when.start - b.when.start);
      return seen;
    };
    const pb = pick(before, (p) => p.when.start <= 1885 && (p.aliases ?? []).concat(p.id).some((x) => x.startsWith(`${before}-`)));
    const pa = pick(after, (p) => p.when.start >= 1886 && (p.aliases ?? []).concat(p.id).some((x) => x.startsWith(`${after}-`)));
    const lastBefore = pb[pb.length - 1] ?? null;
    const firstAfter = pa[0] ?? null;
    const row = {
      before,
      after,
      lastBefore: lastBefore?.id ?? null,
      firstAfter: firstAfter?.id ?? null,
      ratio: null,
    };
    if (!lastBefore || !firstAfter) return row;
    const o = overlap(geometryFor(lastBefore), geometryFor(firstAfter));
    if (!o) return row;
    row.ratio = Number(o.ratio.toFixed(4));
    row.areaBefore = Number(o.areaA.toFixed(3));
    row.areaAfter = Number(o.areaB.toFixed(3));
    row.areaShared = Number(o.areaI.toFixed(3));
    row.smaller = o.smallerSide;
    return row;
  });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const rows = measure();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    const sorted = [...rows].sort((a, b) => (a.ratio ?? -1) - (b.ratio ?? -1));
    console.log('| overlap | 1885 side | 1886 side | last before | first after | smaller side |');
    console.log('|---|---|---|---|---|---|');
    for (const r of sorted) {
      console.log(`| ${r.ratio === null ? '—' : r.ratio.toFixed(4)} | \`${r.before}\` | \`${r.after}\` | \`${r.lastBefore ?? '—'}\` | \`${r.firstAfter ?? '—'}\` | ${r.smaller ?? '—'} |`);
    }
  }
}
