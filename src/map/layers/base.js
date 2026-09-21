// O mapa de base: a costa ao perto, os rios, os lagos, as regiões físicas, os
// picos e as cidades. Um módulo e não seis — as seis camadas diferem num nome
// de classe e num tipo de geometria, e seis ficheiros que desenham cada um um
// `path` seriam cinco cópias de `land.js` (desvio 521). Tudo o que numa camada
// não é código vem do manifesto: a ordem por que são desenhadas, o zoom a que
// aparecem, os ficheiros que tem e o tipo de geometria que carregam.
//
// Fica por baixo dos territórios e por cima da costa: uma fronteira é uma
// afirmação e um rio é o chão em que ela é desenhada, e um rio dentro de terra
// é precisamente o que se quer ver. É a coisa mais silenciosa da página — nada
// do que este ficheiro desenha passa acima da hierarquia de ênfase (a cor do
// território por baixo do cobalto do actor seleccionado por baixo do garança
// da cadeia percorrida), nada é clicável e nada apanha o rato.
//
// **Longe, depois perto.** Acima do `minZoom` da camada pede-se uma vez o
// ficheiro do mundo e desenha-se; a partir de `nearZoom` pedem-se também as
// células que `cellsFor` nomeia para a caixa no ecrã, deixam-se cair as
// features do ficheiro do mundo cujo chão já está coberto por uma célula que
// se tem em mão, e desenham-se as da célula. O desenho de longe nunca é
// apagado enquanto uma célula vem a caminho: a costa grosseira é a costa
// certa, apenas menos dela, e um clarão em branco seria pior do que um
// fotograma de grosseria — que é o que `presences.js` já argumenta sobre um
// shard.
//
// **Uma célula que não carrega cai sem uma palavra** (desvio 525). `.map-note`
// quer dizer "a imagem não é a que pediu"; um rio que falta está ausente e não
// diz nada de falso. O pedido não fica guardado, por isso a próxima passagem
// por aquela célula volta a pedir — que é a regra de `regions.js` e a de
// `data.js`.

import { svg, svgTitle } from '../../util/dom.js';
import { geometryPath, linePath } from './land.js';
import { simplifyGeometry, simplifyLine } from '../../util/simplify.js';
// A escada do detalhe é uma só (desvio 526): quanto detalhe vale um zoom é uma
// pergunta sobre o mapa e não uma por camada, e duas escadas divergiriam.
// Importada de onde já estava exportada, não mudada de casa (emenda A0).
import { detailFor } from './presences.js';
import { cellsFor, spanOf } from '../grid.js';
// O corte de um nome comprido é o mesmo para todas as etiquetas do mapa, e
// vive com o colocador (labels.js).
import { shorten } from '../labels.js';
// Como se chama uma coisa, e em que ano: o nome datado que o registo de lugar
// traz e a linha de todos os nomes que o rato faz aparecer (names.js).
import { faceName, titleLine } from '../names.js';

// The diameter of a dot, in page units, before it is divided by the zoom. It
// is the one number in this file that does not come from the manifest, because
// there is no field in the manifest that would carry it. The peaks left this
// table in M45a and are measured by their own height (`peakRadius`, below);
// what is left is the cities, which are all one size because what ranks a city
// is its label and not its mark.
const DOT = Object.freeze({ cities: 2 });
const DEFAULT_DOT = 2;

// --- a peak drawn at its height ---------------------------------------------
//
// M45a, §1.2. The 711 elevation points have carried their height in metres
// since M36b and were all the same 1.5 dot: Everest at 8,848 m and a 400-metre
// hill were worth the same on the page. Height is geography and not history —
// nothing here asserts anything about the past — and it is what tells a reader
// that a frontier follows a ridge rather than a line somebody drew.
//
// **Not a linear scale.** Linearly the median of the 711 (2,453 m) would sit
// at 0.27 of the range and nearly every range in the world would be heaped at
// the bottom of it with Everest alone making a blob. The square root is the
// function: monotone over the whole domain, bounded at both ends, and it
// spreads the range over where the heights actually are — the median lands at
// 0.52 of it. Measured against the file itself — minimum −416 (the Dead Sea),
// quartiles 1,447 and 3,480, median 2,453, maximum 8,848 — it gives 1.02 to a
// 400-metre hill, 1.64 to the median, 1.54 to the Serra da Estrela and 2.58 to
// Everest, where the whole layer used to be 1.5.
//
// The ceiling is a round 9,000 m and not the file's own 8,848: the function
// belongs to the map and not to the version of Natural Earth in `vendor/`. The
// floor is sea level, and a point below it — the Dead Sea is the only one —
// draws at the minimum. A depression is a `physical` feature and is drawn as
// one.
export const PEAK_RADIUS = Object.freeze({ min: 0.6, max: 2.6, floor: 0, ceiling: 9000 });

export function peakRadius(elevation) {
  const { min, max, floor, ceiling } = PEAK_RADIUS;
  if (!Number.isFinite(elevation)) return min;
  const clamped = Math.min(Math.max(elevation, floor), ceiling);
  return min + (max - min) * Math.sqrt((clamped - floor) / (ceiling - floor));
}

// --- what family a physical region is drawn in ------------------------------
//
// M45a, §1.1. The family travels in the file, written by the import off the
// closed `FEATURECLA` allow-list (tools/import/features.mjs); here is that
// same list a second time, and it is here for one reason: **`data/` is
// untrusted input** (CLAUDE.md) and this ends up in a `class` attribute in the
// DOM. A `kind` this list does not hold draws in the default family and never
// in a class of its own.
//
// `outline` — the default family, which is what all seventeen classes were
// before M45a — is not in it: it is what a feature with no `kind` draws as,
// and the import does not write it for that very reason.
const KINDS = Object.freeze(['relief', 'cover', 'hollow']);

const kindOf = (feature) => {
  const kind = feature?.kind ?? feature?.properties?.kind;
  return typeof kind === 'string' && KINDS.includes(kind) ? kind : null;
};

// --- which band a relief polygon is ------------------------------------------
//
// M45b. The band travels in the file, written by the import off the five
// frozen edges (tools/import/elevation.mjs), and here it is turned into a
// class. `BANDS` is how many there are, a second time, for the reason `KINDS`
// is a second copy of the families: this ends up in a `class` attribute and
// `data/` is untrusted input. A band this range does not hold draws in no
// class at all, which is the lowest tint and never a class of its own.
const BANDS = 5;

const bandOf = (feature) => {
  const band = feature?.band ?? feature?.properties?.band;
  return Number.isInteger(band) && band >= 0 && band < BANDS ? band : null;
};

// O que uma camada desenhou, num texto. Igual, não se reconstrói nada: mexer a
// banda, seleccionar um acontecimento ou mudar o agrupamento não pode
// reconstruir quatro mil caminhos.
//
// `files` — e não "células" — porque o ficheiro do mundo entra na conta pela
// mesma razão que uma célula entra: a imagem muda quando ele chega. E o zoom
// entra por um balde e não como float, senão uma volta da roda reconstruía
// tudo por uma diferença que não se vê.
export function baseSignature({ on, drawable, bucket, files }) {
  return `${on}|${drawable}|${bucket}|${[...files].sort().join(',')}`;
}

// Um ficheiro é uma FeatureCollection para linhas e polígonos e um array de
// pontos para pontos (M36a, desvio 600).
const featuresOf = (data) => (Array.isArray(data) ? data : data?.features ?? []);

const idOf = (feature) => {
  const id = feature?.id ?? feature?.properties?.id;
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
};

const zOf = (feature) => {
  const z = feature?.z ?? feature?.properties?.z;
  return typeof z === 'number' ? z : 1;
};

const nameOf = (feature) => {
  const name = feature?.name ?? feature?.properties?.name;
  return typeof name === 'string' && name !== '' ? name : null;
};

// O nome inglês, e só quando é outro: o importador escreve-o apenas onde
// difere de `name`, por isso a comparação aqui é uma segurança e não uma
// regra nova (emenda A6 de M36).
const nameEnOf = (feature) => {
  const name = feature?.nameEn ?? feature?.properties?.nameEn;
  return typeof name === 'string' && name !== '' && name !== nameOf(feature) ? name : null;
};

// O zoom a que o nome de uma feature aparece, que não é o zoom a que o ponto
// aparece: o importador escreve-o por feature, do `min_label` de Natural Earth
// onde o ficheiro o tem e de `z + 1` onde não tem (M38, emenda A2). Uma
// feature sem `zl` é uma feature sem nome, e essas não são candidatas a nada.
const zlOf = (feature) => {
  const zl = feature?.zl ?? feature?.properties?.zl;
  return typeof zl === 'number' ? zl : null;
};

// A peak's height in metres, where the source gives one. Since M45a it is the
// radius the peak is drawn at (`peakRadius`) and the tie-breaker of its weight
// among the other physical features (`labelCandidates` below), and nothing
// else.
const elevationOf = (feature) => {
  const value = feature?.elevation ?? feature?.properties?.elevation;
  return typeof value === 'number' ? value : null;
};

// A `id` do registo de lugar que esta cidade é, onde o importador a escreveu.
// Quem é quem continua a ser dados e não código: a correspondência é feita em
// `data/imports/naturalearth-places.json` por uma pessoa ou pelo `wikidata`, e
// nunca adivinhada aqui (emenda A3 — a `id` vem na própria feature, e o
// navegador nunca vai buscar nada a `data/imports/`).
const placeIdOf = (feature) => {
  const id = feature?.place ?? feature?.properties?.place;
  return typeof id === 'string' && id !== '' ? id : null;
};

const linesOf = (geometry) => (geometry?.type === 'LineString' ? [geometry.coordinates]
  : geometry?.type === 'MultiLineString' ? geometry.coordinates : []);

// --- onde se escreve o nome de um acidente físico ---------------------------
//
// Um ponto é a sua própria âncora, mas um rio é uma linha e uma região física é
// um polígono, e um nome tem de ficar **sobre a coisa que nomeia**. Por isso
// cada geometria dá o seu próprio ponto de etiqueta: o meio do percurso mais
// longo para uma linha, o centróide do maior anel para um polígono.
//
// É uma estimativa e assume-se: o centróide de uma região em forma de arco cai
// fora dela. O que a regra garante é que o nome não anda — o mesmo ficheiro dá
// sempre o mesmo ponto — e que não é o centro da caixa envolvente, que para um
// rio que corre na diagonal é um sítio onde o rio não passa.

const span = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// O vértice a meio do percurso mais longo. Um vértice e não um ponto
// interpolado: o nome fica onde a linha realmente passa, e um rio desenhado com
// dois vértices é o seu segundo.
function midpointOfLines(lines) {
  let longest = null;
  let longestLength = -1;
  for (const line of lines) {
    if (!Array.isArray(line) || line.length < 2) continue;
    let length = 0;
    for (let i = 1; i < line.length; i += 1) length += span(line[i - 1], line[i]);
    if (length > longestLength) { longestLength = length; longest = line; }
  }
  if (longest === null) return null;
  let walked = 0;
  for (let i = 1; i < longest.length; i += 1) {
    walked += span(longest[i - 1], longest[i]);
    if (walked >= longestLength / 2) return [longest[i][0], longest[i][1]];
  }
  return [longest[0][0], longest[0][1]];
}

// O centróide de um anel, pela fórmula da área com sinal. Nulo quando a área é
// zero — um anel degenerado, três pontos em linha — e então quem chama cai para
// o centro da caixa, que é o melhor que resta.
function ringCentroid(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return null;
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    twiceArea += cross;
    x += (ring[j][0] + ring[i][0]) * cross;
    y += (ring[j][1] + ring[i][1]) * cross;
  }
  if (twiceArea === 0) return null;
  return [x / (3 * twiceArea), y / (3 * twiceArea)];
}

const ringArea = (ring) => {
  let twiceArea = 0;
  for (let i = 0, j = (ring?.length ?? 0) - 1; i < (ring?.length ?? 0); j = i, i += 1) {
    twiceArea += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(twiceArea) / 2;
};

// O maior polígono de um multi-polígono, pelo seu anel de fora: um lago com uma
// ilha lá dentro é nomeado no lago e não na ilha, e um arquipélago é nomeado na
// ilha maior.
function largestRing(coordinates, multi) {
  if (!multi) return coordinates?.[0] ?? null;
  let best = null;
  let bestArea = -1;
  for (const polygon of coordinates ?? []) {
    const ring = polygon?.[0];
    if (!Array.isArray(ring)) continue;
    const area = ringArea(ring);
    if (area > bestArea) { bestArea = area; best = ring; }
  }
  return best;
}

export function labelPointOf(feature) {
  if (typeof feature?.lon === 'number' && typeof feature?.lat === 'number') {
    return [feature.lon, feature.lat];
  }
  const geometry = feature?.geometry;
  const type = geometry?.type;
  if (type === 'LineString' || type === 'MultiLineString') return midpointOfLines(linesOf(geometry));
  if (type === 'Polygon' || type === 'MultiPolygon') {
    const ring = largestRing(geometry.coordinates, type === 'MultiPolygon');
    const centroid = ring ? ringCentroid(ring) : null;
    if (centroid) return centroid;
    const box = bboxOf(feature);
    return box ? [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2] : null;
  }
  return null;
}

// A caixa de uma feature, percorrendo as coordenadas sejam quantos níveis
// forem. Um ponto é a sua própria caixa.
function extend(box, coords) {
  if (typeof coords?.[0] === 'number') {
    const [lon, lat] = coords;
    if (lon < box[0]) box[0] = lon;
    if (lat < box[1]) box[1] = lat;
    if (lon > box[2]) box[2] = lon;
    if (lat > box[3]) box[3] = lat;
    return box;
  }
  for (const part of coords ?? []) extend(box, part);
  return box;
}

export function bboxOf(feature) {
  if (typeof feature?.lon === 'number' && typeof feature?.lat === 'number') {
    return [feature.lon, feature.lat, feature.lon, feature.lat];
  }
  const geometry = feature?.geometry;
  if (!geometry?.coordinates) return null;
  const box = extend([Infinity, Infinity, -Infinity, -Infinity], geometry.coordinates);
  return Number.isFinite(box[0]) ? box : null;
}

export function createBaseLayer(group, projection, {
  id, geometry, minZoom = 1, world = null, cells = [], nearSpan = 0,
  load, loaded, onReady = null, defer = (fn) => fn(),
}) {
  const fileOf = new Map(cells.map((cell) => [cell.key, cell.file]));
  // A projecção é fixa enquanto o mapa existir, mas está na chave na mesma:
  // uma mudança de projecção é a única coisa que tornaria errado tudo o que
  // está aqui guardado, e uma cache que não sabe dizer de que projecção é uma
  // cache que lhe sobrevive (é o que `presences.js` já diz da sua).
  const projectionKey = [
    projection.width, projection.height, projection.scale, ...(projection.center ?? []),
  ].join(':');
  const paths = new Map();
  const boxes = new Map();
  const thresholds = new Map();
  // The radius of one of this layer's dots, in page units and before it is
  // divided by the zoom. A city is the table's size; a peak is its own height
  // (M45a). How wide a dot of this layer is, is this layer's business — which
  // is what `labelCandidates` already says about where a name is anchored.
  const radiusOf = (feature) => (id === 'mountains'
    ? peakRadius(elevationOf(feature))
    : (DOT[id] ?? DEFAULT_DOT));
  // Os ficheiros por que esta camada está à espera. `load` já junta dois
  // pedidos do mesmo ficheiro num só; isto é para não pendurar um `onReady` por
  // cada render que passa enquanto o pedido está no ar.
  const waiting = new Set();
  // Nada sai antes da primeira imagem estar pintada. Não é "o primeiro pedido"
  // como em `presences.js` — esse pede um shard de cada vez e este pode pedir o
  // ficheiro do mundo e três células no mesmo render —, é o primeiro *render*:
  // tudo o que ele pedir vai atrás de um fotograma, de uma vez, e a partir daí
  // os pedidos saem quando são feitos, porque a essa altura o leitor já está a
  // olhar para o mapa de base e à espera dele.
  let released = false;
  const pending = [];
  let signature = null;
  let count = 0;
  // O que esta camada desenhou e tem nome, para a ronda das etiquetas que vem
  // depois de todas as camadas terem desenhado. Não é uma segunda lista do que
  // está no ecrã: é a mesma passagem do `draw` que a enche, e quem decide o
  // que cabe é o colocador, uma vez, em `map.js` (labels.js).
  let labelled = [];
  // The radius of each circle drawn, in the order they were hung. A point
  // layer stopped having one radius in M45a, so `resize` cannot write the same
  // number onto every node: it writes what each one is. A parallel list and
  // not one more attribute in the DOM — the same pass of `draw` fills it, and
  // the group's children are in that same order.
  let radii = [];
  // Os registos de lugar que os ficheiros em mão nomeiam, desenhados ou não.
  let placesHeld = new Set();
  let lastK = 1;

  const go = (file) => load(file).then(() => {
    waiting.delete(file);
    if (onReady) onReady();
  }, () => {
    // Sem uma palavra, e sem guardar a rejeição: a próxima passagem por esta
    // célula volta a pedir.
    waiting.delete(file);
  });

  function ask(file) {
    if (waiting.has(file)) return;
    waiting.add(file);
    if (released) { go(file); return; }
    pending.push(file);
    if (pending.length > 1) return;
    defer(() => {
      released = true;
      while (pending.length > 0) go(pending.shift());
    });
  }

  function boxFor(file, index, feature) {
    const key = `${file}|${index}`;
    if (!boxes.has(key)) boxes.set(key, bboxOf(feature));
    return boxes.get(key);
  }

  // Os degraus de zoom que este ficheiro tem, ordenados e sem repetições: os
  // `z` que as suas features carregam. É por eles que o zoom entra na
  // assinatura — entre dois degraus desenham-se exactamente as mesmas features
  // a partir das mesmas cordas, e uma volta da roda lá dentro não reconstrói
  // nada.
  function zThresholds(file, data) {
    if (!thresholds.has(file)) {
      thresholds.set(file, [...new Set(featuresOf(data).map(zOf))].sort((a, b) => a - b));
    }
    return thresholds.get(file);
  }

  function pathFor(file, index, feature, tolerance) {
    const key = `${projectionKey}|${file}|${index}|${tolerance}`;
    if (paths.has(key)) return paths.get(key);
    let d = '';
    if (geometry === 'polygon') {
      const simplified = simplifyGeometry(feature.geometry, { tolerance });
      // Uma geometria que a simplificação apagou inteira fica com o detalhe
      // todo: uma ilha que desaparecesse a um zoom e voltasse ao seguinte seria
      // o nível de detalhe a dizer ao leitor uma coisa falsa (presences.js).
      d = geometryPath(simplified ?? feature.geometry, projection.project);
    } else if (geometry === 'line') {
      // Sem `Z`: um traço de costa cortado numa célula tem duas pontas, e
      // fechá-lo desenharia uma recta de uma ponta à outra (emenda A0).
      d = linesOf(feature.geometry)
        .map((line) => linePath(simplifyLine(line, { tolerance }), projection.project))
        .join('');
    }
    paths.set(key, d);
    return d;
  }

  return {
    // k: o zoom em vigor. view: a caixa no ecrã em graus, [oeste, sul, este,
    // norte], como `viewBboxIn` a devolve — é por ela que se sabe que células
    // pedir, e nunca pelo zoom (grid.js). on: se a camada está ligada.
    // Os candidatos desta camada para a ronda das etiquetas, em lista pura:
    // sem desenhar, sem DOM e sem decidir o que cabe. `priority` é dada de
    // fora porque é o mapa que conhece a hierarquia e não a camada — uma
    // cidade é 1 e um acidente físico é 2 (labels.js).
    //
    // A âncora é à direita do ponto, à distância do seu raio: saber quão largo
    // é um ponto desta camada é assunto desta camada. Um rio, um lago e uma
    // região física não têm ponto desenhado nenhum, por isso o nome começa no
    // ponto de etiqueta da sua própria geometria e sem afastamento.
    //
    // `placeOf` é como esta camada chega ao registo de lugar que uma cidade é —
    // dado de fora, porque a camada não conhece o atlas — e `year` é o extremo
    // da janela, que é o ano por que um nome datado é escolhido.
    labelCandidates({ priority = 1, placeOf = () => null, weightOf = null, year = null } = {}) {
      const candidates = [];
      for (const entry of labelled) {
        // O nome aparece depois do ponto e nunca antes: é o que `zl` quer
        // dizer, e é o que qualquer mapa faz.
        if (entry.zl > lastK) continue;
        const place = entry.place === null ? null : placeOf(entry.place);
        const historicalNames = place?.historicalNames ?? null;
        const face = faceName({ name: entry.name, historicalNames, year });
        if (face === null) continue;
        // The gap is **this** dot's radius and not the layer's: since M45a a
        // peak is the size of its own height, and a name anchored to an
        // average radius sat on top of Everest and too far from a hill.
        const gap = geometry === 'point' ? (entry.r + 2) / lastK : 0;
        candidates.push({
          id: entry.id,
          text: shorten(face),
          title: titleLine({ name: entry.name, nameEn: entry.nameEn, historicalNames }),
          x: entry.x + gap,
          y: entry.y,
          priority,
          // Uma cidade que é um lugar **deste** atlas pesa o que os lugares
          // deste atlas pesam, e não a sua população: é a mesma regra de quem
          // não tem cidade nenhuma no Natural Earth (names.js), e sem ela
          // Lisboa — 2,8 milhões — perdia a sua etiqueta para o Cairo num mapa
          // da expansão portuguesa. Um lugar é um lugar deste atlas tenha ou
          // não a fonte uma cidade para ele.
          weight: place && weightOf ? weightOf(place) : entry.weight,
          // Um rio e um lago chegam partidos: Natural Earth corta o Tejo em
          // sete troços com `id` diferentes e escreve o lago inteiro em todas
          // as células que a sua caixa toca. Sete "Tejo" no mesmo ecrã diziam
          // que são sete rios, por isso o nome é dito uma vez (labels.js). Dois
          // pontos com o mesmo nome são duas coisas e não levam chave nenhuma:
          // duas serras podem chamar-se o mesmo.
          ...(geometry === 'point' ? {} : { once: `${id}|${face}` }),
        });
      }
      return candidates;
    },

    // As `id` dos registos de lugar que esta camada **tem em mão** — todas as
    // que estão nos ficheiros de que este desenho saiu, e não só as das
    // features que o `z` deixou desenhar. O mapa precisa delas para saber
    // quais dos seus lugares não têm cidade nenhuma no Natural Earth: esses são
    // nomeados a partir do próprio registo (map.js).
    //
    // Em mão e não desenhada, porque a pergunta é "o Natural Earth tem esta
    // cidade?" e não "já se vê?". Com as desenhadas, Braga — que tem cidade e
    // cujo ponto só aparece a k = 12 — era nomeada pelo registo a k = 8 e pela
    // cidade a k = 12, e a mesma palavra mudava de dono a meio de uma roda.
    placeIds() {
      return new Set(placesHeld);
    },

    render({ k = 1, view = null, on = true } = {}) {
      const drawable = Boolean(on) && k >= minZoom;
      lastK = k;
      if (!drawable) {
        // Uma camada desligada, ou abaixo do seu zoom, não desenha nada **e
        // não pede nada**: é a regra que `map.js` já aplica aos territórios.
        if (signature !== null) {
          group.replaceChildren();
          signature = null;
          count = 0;
          labelled = [];
          radii = [];
          placesHeld = new Set();
        }
        return { drawn: 0, complete: false, cells: [] };
      }

      const far = world ? loaded(world) : null;
      if (world && !far) ask(world);

      // The cells of the box on screen, once the box is small enough and not
      // before. A cell the manifest does not name holds nothing of this layer:
      // there is nothing to ask for and nothing to wait for, and it counts as
      // being in hand.
      const wanted = view && spanOf(view) <= nearSpan ? cellsFor(view) : [];
      const held = [];
      const covered = new Set();
      for (const key of wanted) {
        const file = fileOf.get(key);
        if (!file) { held.push(key); continue; }
        if (loaded(file)) { held.push(key); covered.add(key); } else ask(file);
      }
      // Toda a caixa no ecrã em mão: é o que diz a `map.js` que pode apagar o
      // traço da costa de longe (emenda A2).
      const complete = wanted.length > 0 && held.length === wanted.length;

      const files = [];
      if (far) files.push(world);
      for (const key of held) {
        const file = fileOf.get(key);
        if (file && covered.has(key)) files.push(file);
      }

      const { tolerance } = detailFor(k);
      const passed = new Set();
      for (const file of files) {
        for (const z of zThresholds(file, file === world ? far : loaded(file))) {
          if (z <= k) passed.add(z);
        }
      }
      // Uma camada de pontos não tem geometria para simplificar, por isso o
      // degrau da escada não faz parte do que ela desenhou: o raio é escrito
      // por cima dos nós que já lá estão, e mais nada em k a muda.
      const bucket = `${geometry === 'point' ? '' : tolerance}:${passed.size}`;
      const key = baseSignature({ on: Boolean(on), drawable, bucket, files });
      if (key !== signature) {
        signature = key;
        count = draw(files, tolerance, k, covered);
      }
      // O raio é uma marca na página e não um pedaço de chão, por isso vai
      // dividido pelo zoom — que se move continuamente enquanto a assinatura
      // não se move. Escrito por cima dos nós que já lá estão: uma assinatura
      // igual continua a não construir nada.
      if (geometry === 'point') resize(k);
      return { drawn: count, complete, cells: held };
    },
  };

  function resize(k) {
    const children = group.childNodes;
    for (let i = 0; i < children.length; i += 1) {
      const el = children[i];
      if (!el.getAttribute) continue;
      const value = ((radii[i] ?? DEFAULT_DOT) / k).toFixed(3);
      if (el.getAttribute('r') !== value) el.setAttribute('r', value);
    }
  }

  function draw(files, tolerance, k, covered) {
    group.replaceChildren();
    labelled = [];
    radii = [];
    placesHeld = new Set();
    // Uma feature que chega em mais do que uma célula — um lago e uma região
    // física são escritos inteiros em todas as células que a sua caixa toca —
    // é desenhada uma vez, pela sua `id` (emenda A1).
    const seen = new Set();
    const near = [];
    for (const file of files) {
      if (file === world) continue;
      for (const [index, feature] of featuresOf(loaded(file)).entries()) {
        const fid = idOf(feature);
        if (fid !== null) {
          if (seen.has(fid)) continue;
          seen.add(fid);
        }
        near.push({ file, index, feature });
      }
    }
    // E do ficheiro do mundo cai tudo o que o nível de perto já cobre: a mesma
    // feature pela `id`, ou uma cujo chão esteja todo em células que se tem em
    // mão. O que sai daí sai do ecrã — as células em mão são as da caixa no
    // ecrã —, por isso não se perde nada que se estivesse a ver.
    const world0 = [];
    if (files.includes(world)) {
      const data = loaded(world);
      for (const [index, feature] of featuresOf(data).entries()) {
        const fid = idOf(feature);
        if (fid !== null && seen.has(fid)) continue;
        const box = covered.size > 0 ? boxFor(world, index, feature) : null;
        if (box && cellsFor(box).some((cell) => covered.has(cell))) continue;
        world0.push({ file: world, index, feature });
      }
    }

    let drawn = 0;
    // Longe primeiro e perto por cima, que é a ordem em que a imagem fica
    // certa enquanto uma célula ainda vem a caminho.
    for (const { file, index, feature } of [...world0, ...near]) {
      // O registo de lugar que esta feature é conta antes do `z`: a pergunta
      // que `placeIds` responde é sobre o que o Natural Earth tem e não sobre
      // o que já se vê.
      const placeId = placeIdOf(feature);
      if (placeId !== null) placesHeld.add(placeId);
      // E depois, feature a feature, o `z` que os dados lhe deram: nenhum
      // destes números está em código.
      if (zOf(feature) > k) continue;
      const el = element(file, index, feature, tolerance, k);
      if (!el) continue;
      group.appendChild(el);
      if (geometry === 'point') radii.push(radiusOf(feature));
      remember(feature);
      drawn += 1;
    }
    return drawn;
  }

  // Uma feature desenhada que tem nome é uma candidata a etiqueta. Guardada na
  // mesma passagem que a desenha — não há uma segunda volta pelos dados — e
  // com o ponto já projectado, porque é o mesmo que o círculo usou.
  //
  // Guarda o que a feature **traz** e não o nome já escolhido: qual dos nomes
  // vai na cara depende do ano do extremo da banda, e a banda mexe-se sem que
  // a assinatura desta camada mude — se o nome fosse decidido aqui, arrastar a
  // banda deixava o mapa a dizer o nome do ano anterior.
  function remember(feature) {
    const name = nameOf(feature);
    const zl = zlOf(feature);
    if (name === null || zl === null) return;
    const point = labelPointOf(feature);
    if (!point || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) return;
    const [x, y] = projection.project(point);
    const elevation = elevationOf(feature);
    labelled.push({
      id: idOf(feature) ?? `${point[0]},${point[1]}`,
      name,
      nameEn: nameEnOf(feature),
      place: placeIdOf(feature),
      zl,
      // O peso é a população: numa costa cheia, a cidade maior é a que fica
      // com a caixa. Um acidente físico não tem população nenhuma, e o que o
      // ordena é o `zl`: escrito para aparecer cedo é escrito por ser grande.
      // A altura de um pico desempata **dentro** do degrau e nunca salta um,
      // porque entra como uma fracção — o Evereste vale 0,885 de um degrau.
      weight: id === 'cities'
        ? (typeof feature.pop === 'number' ? feature.pop : 0)
        : -zl + (elevation === null ? 0 : Math.min(Math.max(elevation, 0), 9_999) / 10_000),
      // The radius of the dot this name names, for the anchor's gap. Zero
      // where no dot is drawn at all: a river, a lake and a physical region
      // are named at their own label point and with no gap.
      r: geometry === 'point' ? radiusOf(feature) : 0,
      x,
      y,
    });
  }

  function element(file, index, feature, tolerance, k) {
    if (geometry === 'point') {
      const { lon, lat } = feature;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      const [x, y] = projection.project([lon, lat]);
      const name = nameOf(feature);
      return svg('circle', {
        cx: x.toFixed(2), cy: y.toFixed(2), r: (radiusOf(feature) / k).toFixed(3),
      }, name ? [svgTitle(name)] : []);
    }
    const d = pathFor(file, index, feature, tolerance);
    if (!d) return null;
    // `fill-rule` para os polígonos, porque um lago com uma ilha lá dentro é um
    // anel dentro de outro e a ilha tem de ficar por encher.
    const attributes = geometry === 'polygon' ? { d, 'fill-rule': 'evenodd' } : { d };
    // And the family this feature is drawn in, where the file carries one and
    // it is one that exists (M45a). The stylesheet draws `ground-relief`,
    // `ground-cover` and `ground-hollow`; everything else — and everything
    // `kindOf` does not recognise — keeps the rule the layer already had.
    const kind = kindOf(feature);
    if (kind !== null) attributes.class = `ground-${kind}`;
    // And the band, where the file carries one (M45b). Five tints, lightest
    // low, all of them opacities over tokens that already existed: the
    // stylesheet is where every colour on this map is, and a band index is not
    // a colour.
    const band = bandOf(feature);
    if (band !== null) attributes.class = `band-${band}`;
    return svg('path', attributes);
  }
}
