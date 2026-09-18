#!/usr/bin/env node
// Junta os pares que M59 decidiu serem um só polity, pela mecânica de M51.
//
//   node tools/m59-join.mjs [--dry-run] [--data <dir>]
//
// Cada junção é um registo que fica e outro que lhe aponta com `supersededBy`,
// e tudo o que nomeia o que se vai move no mesmo commit (regra 11). Nenhuma
// data é inventada: o intervalo do sobrevivente é o início do registo de 1885
// e o fim do registo de 1886, os dois já no atlas e cada um com a sua fonte.
//
// Nenhum texto atravessa. Os dois imports estão sob licenças diferentes e um
// registo carrega uma: o sobrevivente fica com os seus nomes, o seu resumo e a
// sua licença, cita os dois datasets, e o registo fundido fica com os seus.
//
// **A geometria nunca é redesenhada.** Uma presença muda de `actor` e mais
// nada; a sua `geometry.key` continua a apontar para o mesmo desenho no mesmo
// shard, que é o que "as presenças movem-se" quer dizer.

import { readdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inSchemaOrder } from './lib/order.mjs';
import { repointSpan } from './lib/span.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// O veredicto não é medido: está em `docs/m59-singletons.md` §5, e cada linha
// aqui repete a razão que lá está escrita. `survivor` é o id para que mais
// registos já apontavam, que é a regra de M51.
export const JOINS = Object.freeze([
  {
    survivor: 'french-guiana',
    merged: 'french-guyana',
    overlap: 0.9457,
    jaccard: 0.8681,
    why: 'Guiana and Guyana are one word in two spellings',
  },
  {
    survivor: 'british-guiana',
    merged: 'guyana-under-united-kingdom',
    overlap: 0.9589,
    jaccard: 0.5492,
    why: 'the same word in the same two spellings, under the sovereign the 1886 id states in its own fields',
  },
  {
    survivor: 'rumania',
    merged: 'romania',
    overlap: 0.9277,
    jaccard: 0.5819,
    why: 'Rumania is Romania in the older English spelling',
  },
  {
    survivor: 'ceylon',
    merged: 'sri-lanka-ceylon-under-united-kingdom',
    overlap: 0.9717,
    jaccard: 0.8790,
    why: 'the parenthetical is the same polity\'s other name, as "Madagascar (Malagasy)" was in M51',
  },
  {
    survivor: 'british-india',
    merged: 'british-raj',
    overlap: 0.9518,
    jaccard: 0.8975,
    why: 'the British Raj and British India are two English names for one polity',
  },
  {
    survivor: 'netherlands-indies',
    merged: 'dutch-east-indies',
    overlap: 0.9293,
    jaccard: 0.7977,
    why: 'Netherlands and Dutch are one adjective in two forms, and the Indies are the same Indies',
  },
  {
    survivor: 'dutch-guiana',
    merged: 'surinam-under-netherlands',
    overlap: 0.9717,
    jaccard: 0.9095,
    why: 'Dutch Guiana is the colony the other import files as Surinam',
  },
]);

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const writeJson = async (file, value, kind) => writeFile(file, `${JSON.stringify(kind ? inSchemaOrder(value, kind) : value, null, 2)}\n`);

const dedupe = (list) => {
  const seen = new Set();
  return list.filter((item) => {
    const key = typeof item === 'string' ? item : JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};


export async function join(dataDir, { today, dryRun = false } = {}) {
  const actorsDir = path.join(dataDir, 'actors');
  const touched = [];

  for (const { survivor: survivorId, merged: mergedId, overlap, jaccard, why } of JOINS) {
    const survivorFile = path.join(actorsDir, `${survivorId}.json`);
    const mergedFile = path.join(actorsDir, `${mergedId}.json`);
    const survivor = await readJson(survivorFile);
    const merged = await readJson(mergedFile);
    if (survivor.status !== 'active' || merged.status !== 'active') {
      console.log(`${survivorId} / ${mergedId}: already joined, skipped`);
      continue;
    }

    // Qual dos dois é o lado de 1885 decide-se pelo registo, não pela tabela.
    const [before, after] = survivor.when?.end === 1885 ? [survivor, merged] : [merged, survivor];
    const percent = (overlap * 100).toFixed(2);
    const note = `M59: joined with ${mergedId}, the same polity — ${why}. The outlines either side of the 1885/1886 seam share ${percent}% of the smaller and ${(jaccard * 100).toFixed(2)}% of the union (docs/m59-singletons.md), and that seam is where Historical Basemaps stops and CShapes 2.0 starts, not a date. The interval is now the 1885 record's own start (${before.when.start}) and the 1886 record's own end (${after.when.end ?? 'open'}); neither was authored here.`;

    survivor.when = { start: before.when.start, end: after.when.end };
    survivor.sources = dedupe([...(survivor.sources ?? []), ...(merged.sources ?? [])]);
    survivor.revised = today;
    survivor.review = {
      status: 'draft',
      ...(survivor.review ?? {}),
      flags: dedupe([...(survivor.review?.flags ?? []), 'm59-joined']),
      note: note.slice(0, 500),
    };
    if (typeof survivor.summary === 'string') survivor.summary = repointSpan(survivor.summary);

    merged.status = 'merged';
    merged.supersededBy = survivorId;
    merged.revised = today;
    merged.review = {
      status: 'draft',
      ...(merged.review ?? {}),
      flags: dedupe([...(merged.review?.flags ?? []), 'm59-joined']),
      note: `M59: merged into ${survivorId}, the same polity — ${why}. The outlines share ${percent}% of the smaller (docs/m59-singletons.md). The names, summary and licence here are this import's and stay here: the survivor carries the other import's licence and could not take them.`.slice(0, 500),
    };

    if (!dryRun) {
      await writeJson(survivorFile, survivor, 'actor');
      await writeJson(mergedFile, merged, 'actor');
    }
    touched.push(survivorFile, mergedFile);

    // Regra 11: tudo o que nomeia o registo fundido move-se com ele.
    const moved = await moveReferences(dataDir, mergedId, survivorId, today, dryRun);
    touched.push(...moved);
    console.log(`${survivorId} ← ${mergedId}: ${before.when.start}–${after.when.end ?? 'open'}, ${moved.length} record(s) moved`);
  }
  return touched;
}

// As presenças, as relações, os eventos e os mapas de import que nomeiam o
// registo fundido. Uma relação cujo id começa pelo id fundido muda de nome
// também, porque esse id é o que a nomeia.
async function moveReferences(dataDir, from, to, today, dryRun) {
  const moved = [];

  const presencesDir = path.join(dataDir, 'presences');
  for (const file of await readdir(presencesDir)) {
    if (!file.endsWith('.json')) continue;
    const full = path.join(presencesDir, file);
    const p = await readJson(full);
    if (p.actor !== from) continue;
    p.actor = to;
    p.revised = today;
    if (!dryRun) await writeJson(full, p, 'presence');
    moved.push(full);
  }

  const relationsDir = path.join(dataDir, 'relations');
  for (const file of await readdir(relationsDir)) {
    if (!file.endsWith('.json')) continue;
    const full = path.join(relationsDir, file);
    const r = await readJson(full);
    if (r.from !== from && r.to !== from) continue;
    if (r.from === from) r.from = to;
    if (r.to === from) r.to = to;
    const id = `${r.from}--${r.to}--${r.type}`;
    const renamed = id !== r.id;
    r.id = id;
    r.revised = today;
    const target = path.join(relationsDir, `${id}.json`);
    if (!dryRun) {
      await writeJson(full, r, 'relation');
      if (renamed) await rename(full, target);
    }
    moved.push(renamed ? target : full);
  }

  const eventsDir = path.join(dataDir, 'events');
  for (const file of await readdir(eventsDir)) {
    if (!file.endsWith('.json')) continue;
    const full = path.join(eventsDir, file);
    const e = await readJson(full);
    const entries = e.actors ?? [];
    if (!entries.some((a) => a.actor === from)) continue;
    for (const a of entries) if (a.actor === from) a.actor = to;
    e.revised = today;
    if (!dryRun) await writeJson(full, e, 'event');
    moved.push(full);
  }

  const importsDir = path.join(dataDir, 'imports');
  for (const file of ['cshapes-actors.json', 'basemaps-actors.json']) {
    const full = path.join(importsDir, file);
    const map = await readJson(full);
    let hit = false;
    for (const entry of Object.values(map.entries ?? {})) {
      if (entry.actor === from) { entry.actor = to; hit = true; }
      for (const split of entry.splits ?? []) if (split.actor === from) { split.actor = to; hit = true; }
    }
    if (!hit) continue;
    if (!dryRun) await writeJson(full, map);
    moved.push(full);
  }

  return moved;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const argv = process.argv.slice(2);
  const dataDir = argv.includes('--data') ? path.resolve(argv[argv.indexOf('--data') + 1]) : path.join(ROOT, 'data');
  const dryRun = argv.includes('--dry-run');
  const today = new Date().toISOString().slice(0, 10);
  const touched = await join(dataDir, { today, dryRun });
  console.log(`${touched.length} file(s)${dryRun ? ' would be written (dry run)' : ' written'}`);
}
