// A ordem das chaves de um registo é a ordem em que o esquema as declara.
//
// Porquê existe: um registo importado do CShapes não tem `review` nenhum, e
// pôr-lhe um com `record.review = {...}` escreve-o no fim do ficheiro, depois
// de `where`. O esquema não se importa — `additionalProperties: false` fala de
// quais chaves e não de por que ordem — mas o diff importa-se, e um envelope
// que aparece ora a meio ora no fim faz um registo parecer outra coisa.
//
// Nada aqui valida: é só a ordem. Uma chave que o esquema não declare fica no
// fim, pela ordem em que já estava, para que isto nunca perca um campo.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const cache = new Map();

export function schemaOrder(name) {
  if (!cache.has(name)) {
    const schema = JSON.parse(readFileSync(path.join(ROOT, 'schema', 'v1', `${name}.json`), 'utf8'));
    cache.set(name, Object.keys(schema.properties ?? {}));
  }
  return cache.get(name);
}

export function inSchemaOrder(record, name) {
  const order = schemaOrder(name);
  const out = {};
  for (const key of order) if (key in record) out[key] = record[key];
  for (const key of Object.keys(record)) if (!(key in out)) out[key] = record[key];
  return out;
}
