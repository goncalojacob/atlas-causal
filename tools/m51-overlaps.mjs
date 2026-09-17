// Mede as 26 costuras de 1885/1886 e imprime a tabela que
// `docs/m51-overlaps.md` carrega. Sem dependências; corre em segundos.
//
//   node tools/m51-overlaps.mjs          # tabela markdown
//   node tools/m51-overlaps.mjs --json   # as mesmas linhas, para os testes
//
// Os pares são os de `docs/m49-actors.md` §4, na ordem em que lá estão. O
// veredicto não é medido — é a leitura de uma pessoa sobre o que a medida e o
// nome dizem juntos — e está escrito no documento, não aqui.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
// depois dela.
//
// As presenças são encontradas pelo **id**, `<actor>-<ano>`, e não pelo campo
// `actor`. A medida é sobre o chão de 1885 e o de 1886 e não muda quando os
// dois registos se juntam — mas uma junção reescreve o `actor` de todas as
// presenças do registo fundido, e procurá-las por aí dava a medida antes da
// junção e nada depois dela. O id é o que não se mexe.
//
// O `-` e o ano importam: `victoria-uk-1880` começa por `victoria-` e não é
// uma presença de `victoria`.
// **M56 moved the id after all**, which the paragraph above did not expect.
// Five actors carried a handle that had stopped describing them —
// `belize-before-1886` running to 1981 — and renaming one renames the
// presences whose ids the territory imports derive from it, so
// `belize-before-1886-1650` is `belize-before-1981-1650` today.
//
// The table above keeps the ids `docs/m51-overlaps.md` was written with,
// because that document is M51's account and the rows are its rows. What moves
// is where they are looked for: `filedAs` follows the `aliases` a rename
// leaves behind, which is the whole of the promise that a former id keeps
// resolving. The measure is over the same two outlines either way.
function filedAs() {
  const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'actors');
  const now = new Map();
  for (const file of readdirSync(here)) {
    if (!file.endsWith('.json')) continue;
    const a = JSON.parse(readFileSync(path.join(here, file), 'utf8'));
    for (const alias of a.aliases ?? []) if (!now.has(alias)) now.set(alias, a.id);
  }
  return (id) => now.get(id) ?? id;
}

export function measure() {
  const all = readPresences().filter((p) => p.status === 'active');
  const now = filedAs();
  const byPrefix = new Map();
  for (const p of all) {
    const m = /^(.*)-\d{4}(-[a-z0-9]+)?$/.exec(p.id);
    if (!m) continue;
    if (!byPrefix.has(m[1])) byPrefix.set(m[1], []);
    byPrefix.get(m[1]).push(p);
  }

  return PAIRS.map(([before, after]) => {
    const pick = (id, keep) => (byPrefix.get(id) ?? []).filter(keep).sort((a, b) => a.when.start - b.when.start);
    const pb = pick(now(before), (p) => p.when.start <= 1885);
    const pa = pick(now(after), (p) => p.when.start >= 1886);
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
