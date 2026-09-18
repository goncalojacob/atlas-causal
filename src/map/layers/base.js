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

// O diâmetro de um ponto, em unidades da página, antes de ser dividido pelo
// zoom. É o único número deste ficheiro que não vem do manifesto, porque não
// há campo no manifesto que o carregue. Os picos saíram desta tabela em M45a e
// são medidos pela sua altura (`peakRadius`, abaixo); ficou a das cidades, que
// são todas do mesmo tamanho porque o que as ordena é a etiqueta e não a marca.
const DOT = Object.freeze({ cities: 2 });
const DEFAULT_DOT = 2;

// --- um pico é desenhado à sua altura ---------------------------------------
//
// M45a, §1.2. Os 711 pontos de elevação traziam a sua altura em metros desde
// M36b e eram todos o mesmo ponto de 1,5: o Evereste a 8.848 m e uma colina de
// 400 m valiam o mesmo na página. A altura é geografia e não história — nada
// aqui é uma afirmação sobre o passado —, e é ela que diz ao leitor que uma
// fronteira segue uma crista e não uma linha qualquer.
//
// **Não é uma escala linear.** Linearmente a mediana dos 711 (2.453 m) daria
// 0,27 do intervalo e quase toda a serra do mundo ficaria amontoada na ponta
// de baixo, com o Evereste sozinho a fazer de borrão. A raiz quadrada é a
// função: monótona em todo o domínio, limitada nas duas pontas, e reparte o
// intervalo por onde as alturas estão — a mediana fica a 0,52 dele. Medida
// sobre o próprio ficheiro — mínimo −416 (o mar Morto), quartil 1.447, mediana
// 2.453, quartil 3.480, máximo 8.848 — dá 1,02 a uma colina de 400 m, 1,64 à
// mediana, 1,54 à serra da Estrela e 2,58 ao Evereste, onde a camada inteira
// era 1,5.
//
// O tecto são 9.000 m redondos e não os 8.848 do ficheiro: a função é da
// carta e não da versão do Natural Earth que está em `vendor/`. O chão é o
// nível do mar, e um ponto abaixo dele — o mar Morto é o único — desenha-se ao
// mínimo. Uma depressão é um acidente do `physical` e é desenhada como tal.
export const PEAK_RADIUS = Object.freeze({ min: 0.6, max: 2.6, floor: 0, ceiling: 9000 });

export function peakRadius(elevation) {
  const { min, max, floor, ceiling } = PEAK_RADIUS;
  if (!Number.isFinite(elevation)) return min;
  const clamped = Math.min(Math.max(elevation, floor), ceiling);
  return min + (max - min) * Math.sqrt((clamped - floor) / (ceiling - floor));
}

// --- de que família é uma região física -------------------------------------
//
// M45a, §1.1. A família vem no ficheiro, escrita pelo importador a partir da
// lista fechada de `FEATURECLA` (tools/import/features.mjs); aqui está a mesma
// lista outra vez, e está por uma razão: **`data/` é entrada não confiável**
// (CLAUDE.md) e isto vai parar a um atributo `class` no DOM. Um `kind` que esta
// lista não tenha desenha na família por omissão e nunca numa classe sua.
//
// `outline` — a família por omissão, o que as dezassete classes eram todas
// antes de M45a — não está aqui: é o que uma feature sem `kind` desenha, e o
// importador não a escreve por isso mesmo.
const KINDS = Object.freeze(['relief', 'cover', 'hollow']);

const kindOf = (feature) => {
  const kind = feature?.kind ?? feature?.properties?.kind;
  return typeof kind === 'string' && KINDS.includes(kind) ? kind : null;
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

// A altura de um pico, em metros, onde a fonte a dá. Desde M45a é o raio a que
// o pico é desenhado (`peakRadius`) e o desempate do seu peso entre os outros
// acidentes físicos (`labelCandidates` abaixo), e mais nada.
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
  // O raio de um ponto desta camada, em unidades da página e antes de ser
  // dividido pelo zoom. Uma cidade é do tamanho da tabela; um pico é da sua
  // própria altura (M45a). Saber quão largo é um ponto desta camada é assunto
  // desta camada — é o que `labelCandidates` já dizia da âncora do nome.
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
  // O raio de cada círculo desenhado, na ordem por que foram pendurados. Uma
  // camada de pontos deixou de ter um raio só em M45a, por isso `resize` não
  // pode escrever o mesmo número em todos os nós: escreve o que cada um é.
  // Uma lista paralela e não um atributo a mais no DOM — é a mesma passagem
  // do `draw` que a enche, e os filhos do grupo estão pela mesma ordem.
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
        // O afastamento é o raio **deste** ponto e não o da camada: desde M45a
        // um pico é do tamanho da sua altura, e um nome ancorado ao raio médio
        // ficava por cima do Evereste e longe de mais de uma colina.
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
      // O raio do ponto que este nome nomeia, para o afastamento da âncora.
      // Zero onde não há ponto nenhum desenhado: um rio, um lago e uma região
      // física são nomeados no seu próprio ponto de etiqueta e sem folga.
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
    // E a família em que esta feature é desenhada, onde o ficheiro traz uma e
    // é uma das que existem (M45a). A folha de estilo desenha `ground-relief`,
    // `ground-cover` e `ground-hollow`; tudo o resto — e tudo o que `kindOf`
    // não reconhece — fica com a regra que a camada já tinha.
    const kind = kindOf(feature);
    if (kind !== null) attributes.class = `ground-${kind}`;
    return svg('path', attributes);
  }
}
