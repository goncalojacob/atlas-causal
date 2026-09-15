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
import { cellsFor } from '../grid.js';

// O diâmetro de um ponto, em unidades da página, antes de ser dividido pelo
// zoom. As duas camadas de pontos são desenhadas aos tamanhos que a tabela do
// briefing nomeia; é o único número deste ficheiro que não vem do manifesto,
// porque não há campo no manifesto que o carregue.
const DOT = Object.freeze({ mountains: 1.5, cities: 2 });
const DEFAULT_DOT = 2;

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

const linesOf = (geometry) => (geometry?.type === 'LineString' ? [geometry.coordinates]
  : geometry?.type === 'MultiLineString' ? geometry.coordinates : []);

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
  id, geometry, minZoom = 1, world = null, cells = [], nearZoom = Infinity,
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
    render({ k = 1, view = null, on = true } = {}) {
      const drawable = Boolean(on) && k >= minZoom;
      if (!drawable) {
        // Uma camada desligada, ou abaixo do seu zoom, não desenha nada **e
        // não pede nada**: é a regra que `map.js` já aplica aos territórios.
        if (signature !== null) {
          group.replaceChildren();
          signature = null;
          count = 0;
        }
        return { drawn: 0, complete: false, cells: [] };
      }

      const far = world ? loaded(world) : null;
      if (world && !far) ask(world);

      // As células da caixa no ecrã, a partir de `nearZoom` e não antes. Uma
      // célula que o manifesto não nomeia não tem nada desta camada lá dentro:
      // não há o que pedir nem o que esperar, e conta como estando em mão.
      const wanted = k >= nearZoom && view ? cellsFor(view) : [];
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
    const value = ((DOT[id] ?? DEFAULT_DOT) / k).toFixed(3);
    for (const el of group.childNodes) {
      if (el.getAttribute && el.getAttribute('r') !== value) el.setAttribute('r', value);
    }
  }

  function draw(files, tolerance, k, covered) {
    group.replaceChildren();
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
      // E depois, feature a feature, o `z` que os dados lhe deram: nenhum
      // destes números está em código.
      if (zOf(feature) > k) continue;
      const el = element(file, index, feature, tolerance, k);
      if (!el) continue;
      group.appendChild(el);
      drawn += 1;
    }
    return drawn;
  }

  function element(file, index, feature, tolerance, k) {
    if (geometry === 'point') {
      const { lon, lat } = feature;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      const [x, y] = projection.project([lon, lat]);
      const name = nameOf(feature);
      return svg('circle', {
        cx: x.toFixed(2), cy: y.toFixed(2), r: ((DOT[id] ?? DEFAULT_DOT) / k).toFixed(3),
      }, name ? [svgTitle(name)] : []);
    }
    const d = pathFor(file, index, feature, tolerance);
    if (!d) return null;
    // `fill-rule` para os polígonos, porque um lago com uma ilha lá dentro é um
    // anel dentro de outro e a ilha tem de ficar por encher.
    return svg('path', geometry === 'polygon' ? { d, 'fill-rule': 'evenodd' } : { d });
  }
}
