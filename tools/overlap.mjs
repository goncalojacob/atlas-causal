// Mede a sobreposição de território entre dois registos, sem dependências.
//
// Porquê existe: a costura de 1885/1886 pergunta "são o mesmo polity?", e a
// resposta está no chão, não numa data. Medir que dois polígonos cobrem a
// mesma terra é ler dois registos, não decidir entre eles (M48, `grounds`).
//
// Como mede: varrimento por linhas de latitude. Em cada linha, as travessias
// de todos os anéis dão intervalos de longitude por paridade; o comprimento
// do intervalo pesa cos(lat), porque um grau de longitude encolhe com a
// latitude. Não há projeção nem biblioteca: é a mesma aritmética que
// `src/map.js` faria, restringida a uma linha de cada vez.
//
// A razão devolvida é interseção sobre a área do MENOR, para que uma colónia
// que cresceu não seja castigada por ter crescido.

import fs from 'node:fs';
import path from 'node:path';

const DATA = path.join(process.cwd(), 'data');

export function readPresences() {
  const dir = path.join(DATA, 'presences');
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    out.push(JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
  }
  return out;
}

const shardCache = new Map();
function shard(file) {
  if (!shardCache.has(file)) {
    const fc = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
    const byId = new Map();
    for (const f of fc.features) byId.set(f.id, f.geometry);
    shardCache.set(file, byId);
  }
  return shardCache.get(file);
}

// Todos os anéis de um Polygon ou MultiPolygon, achatados. A paridade trata
// buracos e ilhas da mesma maneira, que é o que a regra par-ímpar quer.
export function ringsOf(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  return [];
}

export function geometryFor(presence) {
  const file = presence.geometry.files[0];
  return shard(file).get(presence.geometry.key) ?? null;
}

export function bboxOf(rings) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY };
}

// Intervalos de longitude cobertos pelos anéis à latitude y, por paridade.
function spansAt(rings, y) {
  const xs = [];
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i += 1) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      if ((y1 <= y) === (y2 <= y)) continue;
      xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
  }
  if (xs.length < 2) return [];
  xs.sort((a, b) => a - b);
  const spans = [];
  for (let i = 0; i + 1 < xs.length; i += 2) spans.push([xs[i], xs[i + 1]]);
  return spans;
}

function lengthOf(spans) {
  let total = 0;
  for (const [a, b] of spans) total += b - a;
  return total;
}

function intersectSpans(a, b) {
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    const lo = Math.max(a[i][0], b[j][0]);
    const hi = Math.min(a[i][1], b[j][1]);
    if (hi > lo) out.push([lo, hi]);
    if (a[i][1] < b[j][1]) i += 1; else j += 1;
  }
  return out;
}

const RAD = Math.PI / 180;
// Graus quadrados ponderados por cos(lat). A unidade não importa: a razão
// cancela-a. Fica em "graus² equivalentes ao equador" para ser legível.
function sweep(ringsA, ringsB, dLat) {
  const a = bboxOf(ringsA);
  const b = bboxOf(ringsB);
  let areaA = 0, areaB = 0, areaI = 0;
  const lo = Math.min(a.minY, b.minY);
  const hi = Math.max(a.maxY, b.maxY);
  for (let y = lo + dLat / 2; y < hi; y += dLat) {
    const w = Math.cos(y * RAD) * dLat;
    const inA = y >= a.minY && y <= a.maxY;
    const inB = y >= b.minY && y <= b.maxY;
    const sa = inA ? spansAt(ringsA, y) : [];
    const sb = inB ? spansAt(ringsB, y) : [];
    if (sa.length) areaA += lengthOf(sa) * w;
    if (sb.length) areaB += lengthOf(sb) * w;
    if (sa.length && sb.length) areaI += lengthOf(intersectSpans(sa, sb)) * w;
  }
  return { areaA, areaB, areaI };
}

// A resolução vem do MENOR dos dois, para que uma ilha não desapareça entre
// linhas, e é travada para que o MAIOR não custe um milhão de varrimentos.
function resolutionFor(ringsA, ringsB) {
  const a = bboxOf(ringsA);
  const b = bboxOf(ringsB);
  const small = Math.min(a.maxY - a.minY, b.maxY - b.minY);
  const wide = Math.max(a.maxY - a.minY, b.maxY - b.minY);
  return Math.max(small / 1500, wide / 120000, 0.0002);
}

export function overlap(geomA, geomB) {
  const ringsA = ringsOf(geomA);
  const ringsB = ringsOf(geomB);
  if (!ringsA.length || !ringsB.length) return null;
  const dLat = resolutionFor(ringsA, ringsB);
  const { areaA, areaB, areaI } = sweep(ringsA, ringsB, dLat);
  const smaller = Math.min(areaA, areaB);
  return {
    dLat,
    areaA,
    areaB,
    areaI,
    ratio: smaller > 0 ? areaI / smaller : null,
    smallerSide: areaA <= areaB ? 'before' : 'after',
  };
}
