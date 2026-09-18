#!/usr/bin/env node
// O que fica do 1885 depois das junções: as dissoluções citadas e as marcas.
//
//   node tools/m59-ends.mjs [--dry-run] [--data <dir>]
//
// Um registo que acaba em exatamente 1885 acaba onde o Historical Basemaps
// acaba. Isso não é um facto sobre polity nenhum, e esta ferramenta trata os
// dois casos que sobram depois de `tools/m59-join.mjs`:
//
//   1. **A dissolução citada.** Wikidata diz quando o polity acabou, com um
//      QID e um P576, e é isso que o registo passa a dizer. A data não é
//      inventada nem lembrada: está em `docs/m59-dates.md`, que
//      `tools/import/wikidata.mjs --dates` escreveu, e o `locator` da fonte
//      carrega o item e a propriedade.
//
//   2. **A marca.** Não há junção nem data, e então o honesto é dizer na
//      própria ficha que 1885 é o horizonte da fonte e não uma dissolução.
//      Não há tipo de registo novo nem campo novo para isto: `review.flags` e
//      `review.note` são o que M51 já usou para dizer porque é que um registo
//      é o que é, e o resumo do import já diz que o intervalo é o que os
//      snapshots cobrem. A marca torna explícito o que está lá implícito.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inSchemaOrder } from './lib/order.mjs';
import { repointSpan } from './lib/span.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const HORIZON_FLAG = 'source-horizon';
export const DATED_FLAG = 'm59-dissolved';

// De `docs/m59-dates.md`, que pergunta aos 100 e traz 40 itens e 21 P576.
//
// Quatro dos 21 não entram, e a regra que os exclui é uma só: **um item cujo
// P571 é posterior ao último snapshot do registo não é o polity que o registo
// desenha.** O "Dominion of Ceylon" começa em 1948 e a "Netherlands Antilles"
// em 1954; a "French Indochina" em 1887, dois anos depois do último desenho
// que este registo tem. Um match não é uma data e uma data não é um veredicto.
// (Ceilão e as Índias Neerlandesas juntam-se de qualquer maneira, e o fim que
// a junção lhes dá — 1948 e 1945 — é o mesmo que o P576 do item diz.)
export const DISSOLUTIONS = Object.freeze([
  { actor: 'basutoland', qid: 'Q2340665', label: 'Basutoland', value: '1966', end: 1966 },
  { actor: 'bokhara-khanate', qid: 'Q746558', label: 'Emirate of Bukhara', value: '1920-10-07', end: 1920 },
  { actor: 'buganda', qid: 'Q473748', label: 'Buganda', value: '1966', end: 1966 },
  { actor: 'bunyoro', qid: 'Q889897', label: 'Bunyoro', value: '1899', end: 1899 },
  { actor: 'dendi-kingdom', qid: 'Q761103', label: 'Dendi Kingdom', value: '1901', end: 1901 },
  { actor: 'imerina', qid: 'Q1071439', label: 'Merina Kingdom', value: '1897', end: 1897 },
  { actor: 'imperial-japan', qid: 'Q188712', label: 'Empire of Japan', value: '1947-05-03', end: 1947 },
  { actor: 'kingdom-of-hawaii', qid: 'Q156418', label: 'Kingdom of Hawaiʻi', value: '1895-01-24', end: 1895 },
  { actor: 'kong-empire', qid: 'Q1587244', label: 'Kong Empire', value: '1898', end: 1898 },
  { actor: 'oyo', qid: 'Q849623', label: 'Oyo Empire', value: '1905', end: 1905 },
  { actor: 'sokoto-caliphate', qid: 'Q600524', label: 'Sokoto Caliphate', value: '1903', end: 1903 },
  { actor: 'sultanate-of-damagaram', qid: 'Q4154364', label: 'Sultanate of Damagaram', value: '1899', end: 1899 },
  { actor: 'sultanate-of-utetera', qid: 'Q60775599', label: "Tippu Tip's state", value: '1887', end: 1887 },
  { actor: 'united-kingdom-of-great-britain-and-ireland', qid: 'Q174193', label: 'United Kingdom of Great Britain and Ireland', value: '1927-04-12', end: 1927 },
  { actor: 'wadai-empire', qid: 'Q1132786', label: 'Ouaddai Empire', value: '1909', end: 1909 },
  { actor: 'wassoulou-empire', qid: 'Q568712', label: 'Samorian state', value: '1898-09-29', end: 1898 },
  { actor: 'zululand', qid: 'Q729768', label: 'Zulu Kingdom', value: '1897', end: 1897 },
]);

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const writeJson = async (file, value) => writeFile(file, `${JSON.stringify(inSchemaOrder(value, 'actor'), null, 2)}\n`);
const dedupe = (list) => [...new Set(list)];


export async function run(dataDir, { today, dryRun = false } = {}) {
  const actorsDir = path.join(dataDir, 'actors');
  const byId = new Map(DISSOLUTIONS.map((d) => [d.actor, d]));
  const dated = [];
  const marked = [];

  for (const file of (await readdir(actorsDir)).sort()) {
    if (!file.endsWith('.json')) continue;
    const full = path.join(actorsDir, file);
    const a = await readJson(full);
    if (a.status !== 'active' || a.when?.end !== 1885) continue;

    const d = byId.get(a.id);
    if (d) {
      a.when = { ...a.when, end: d.end };
      a.sources = [...(a.sources ?? []), { source: 'wikidata', locator: `${d.qid}, P576 ${d.value}` }];
      a.summary = repointSpan(a.summary);
      a.review = {
        status: 'draft',
        ...(a.review ?? {}),
        flags: dedupe([...(a.review?.flags ?? []), DATED_FLAG]),
        note: `M59: this record ended in 1885 because that is where Historical Basemaps stops, not because the polity did. Wikidata's ${d.qid} (${d.label}) gives P576 ${d.value}, and that is the end this record now asserts. The start is still the first snapshot the dataset draws and is not a claim about when the polity began.`.slice(0, 500),
      };
      a.revised = today;
      if (!dryRun) await writeJson(full, a);
      dated.push(a.id);
      continue;
    }

    // A marca. O `when` não se mexe: 1885 continua a ser o que a fonte cobre,
    // e é exatamente isso que a nota passa a dizer em vez de o deixar por
    // dizer.
    if ((a.review?.flags ?? []).includes(HORIZON_FLAG)) continue;
    a.review = {
      status: 'draft',
      ...(a.review ?? {}),
      flags: dedupe([...(a.review?.flags ?? []), HORIZON_FLAG]),
      note: `M59: 1885 is where Historical Basemaps stops, not where this polity ended. No 1886-side record stands on this ground under any name (docs/m59-singletons.md), and Wikidata gives no dissolution this record could cite, so the end here is the horizon of the source and nothing more. The summary above says the same of the whole interval; this says it of the end, which is the number a reader would otherwise take for a fact.`.slice(0, 500),
    };
    a.revised = today;
    if (!dryRun) await writeJson(full, a);
    marked.push(a.id);
  }

  const missing = DISSOLUTIONS.filter((d) => !dated.includes(d.actor)).map((d) => d.actor);
  return { dated, marked, missing };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const argv = process.argv.slice(2);
  const dataDir = argv.includes('--data') ? path.resolve(argv[argv.indexOf('--data') + 1]) : path.join(ROOT, 'data');
  const dryRun = argv.includes('--dry-run');
  const today = new Date().toISOString().slice(0, 10);
  const { dated, marked, missing } = await run(dataDir, { today, dryRun });
  console.log(`${dated.length} dated from Wikidata, ${marked.length} marked as the source's horizon${dryRun ? ' (dry run: nothing written)' : ''}`);
  if (missing.length) console.log(`already dated or no longer ending in 1885: ${missing.join(', ')}`);
}
