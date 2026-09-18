// Um símbolo por categoria, desenhado sobre a marca e à esquerda da barra.
//
// `data/categories.json` tem doze categorias desde M30a e M32b deu uma a 175
// dos 421 acontecimentos; até aqui nada na página o mostrava. Este ficheiro diz
// que forma tem cada categoria, e nada mais: quem desenha é `map/layers/
// events.js` e `timeline.js`, e quem decide o que está visível é `emphasis.js`.
//
// **O símbolo nunca substitui `circle.mark`** (m30b-brief, A2). A marca é o
// controlo — é ela que recebe o clique, o foco e as teclas, e é ela que todos
// os testes do browser nomeiam. O símbolo é um `<use>` ao lado, sem `data-id`,
// sem `tabindex` e sem `pointer-events`: um acontecimento sem categoria fica
// com o círculo simples que já tinha.
//
// Puro tirando os elementos que constrói: importável em Node sem DOM no topo
// (`tests/site.test.mjs` importa todos os módulos de `src/`).
//
// Cor nenhuma aqui. Cada traço é `currentColor`, que resolve contra o `<use>`,
// e é a folha de estilo que escolhe o token — cobalto sobre o papel da marca,
// papel sobre o preenchimento cheio de uma marca realçada (glyphs-brief, §2).

import { svg } from '../util/dom.js';
import { overlayClasses } from '../parts.js';

// A caixa de cada símbolo, e a caixa em que é desenhado: o diâmetro da marca,
// dez unidades a k = 1 (review do bloco do mapa, F14 e amendment A1). Seis
// unidades foram tentadas e riscadas: doze desenhos de linha não se distinguem
// a seis pixéis.
export const GLYPH_BOX = 10;
// O `<defs>` vive uma vez no documento e os dois desenhos referem-se-lhe pelo
// id. Dois `<svg>` no mesmo documento partilham os ids, e duas cópias dos doze
// símbolos seriam doze ids repetidos.
export const GLYPH_DEFS_ID = 'glyph-defs';

export const glyphId = (category) => `glyph-${category}`;

// As doze formas, em traço e sem preenchimento, geométricas à maneira do
// azulejo e nenhuma delas um controlo: nada de ✓, ✕, ⓘ ou ⚠, ou um leitor
// pensaria que a marca se fecha ou se confirma ao clicar na forma lá dentro
// (glyphs-brief, "o que esta corrida não pode fazer").
//
// O dono julga-as pela folha de contacto e diz quais redesenhar; redesenhar uma
// é um `<symbol>` e nenhum teste.
const SHAPES = Object.freeze({
  // Duas lâminas cruzadas. Desiguais de propósito — uma longa e deitada, uma
  // curta e a prumo — e com uma guarda atravessada na segunda: duas linhas
  // iguais a cruzarem-se no meio da caixa lêem-se como um ✕, e nenhum destes
  // desenhos pode dar a um leitor a ideia de que a marca se fecha ao clicar na
  // forma que está lá dentro.
  war: [
    ['path', { d: 'M1.6 8.8 L8.6 2.6' }],
    ['path', { d: 'M6.6 9.2 L3.4 1.2' }],
    ['path', { d: 'M4.6 8.4 L7.4 7.2' }],
  ],
  // Duas mãos como dois parênteses opostos que se encontram.
  treaty: [
    ['path', { d: 'M4 1.8 L2 5 L4 8.2' }],
    ['path', { d: 'M6 1.8 L8 5 L6 8.2' }],
  ],
  // Uma urna com o boletim a entrar por cima.
  election: [
    ['path', { d: 'M1.5 5.6 L8.5 5.6 L8.5 9 L1.5 9 Z' }],
    ['path', { d: 'M3.6 1.2 L6.4 1.2 L6.4 5.6' }],
  ],
  // Uma seta que se volta contra si própria.
  revolution: [
    ['path', { d: 'M8 5.4 A3.2 3.2 0 1 1 4.8 2.2' }],
    ['path', { d: 'M3.3 1.1 L4.8 2.2 L3.6 3.6' }],
  ],
  // Uma balança: travessa, haste, base e dois pratos.
  law: [
    ['path', { d: 'M1.4 3.4 L8.6 3.4' }],
    ['path', { d: 'M5 3.4 L5 8.2' }],
    ['path', { d: 'M3.2 8.2 L6.8 8.2' }],
    ['path', { d: 'M1.4 5.6 L2.4 3.4 L3.4 5.6' }],
    ['path', { d: 'M6.6 5.6 L7.6 3.4 L8.6 5.6' }],
  ],
  // Uma pedra angular: o quadrado e a linha que sobe dele.
  founding: [
    ['path', { d: 'M1.4 5.6 L5.4 5.6 L5.4 9 L1.4 9 Z' }],
    ['path', { d: 'M5.4 5.6 L8.8 2.2' }],
  ],
  // Um raio.
  disaster: [
    ['path', { d: 'M6.4 1 L2.6 5.4 L4.8 5.4 L3.6 9 L7.4 4.6 L5.2 4.6 Z' }],
  ],
  // Uma moeda: um círculo com uma barra atravessada.
  economy: [
    ['circle', { cx: 5, cy: 5, r: 3.6 }],
    ['path', { d: 'M2.2 5 L7.8 5' }],
  ],
  // Um arco sobre dois pilares.
  culture: [
    ['path', { d: 'M2 9 L2 5 A3 3 0 0 1 8 5 L8 9' }],
  ],
  // Um compasso de pontas secas: as duas pernas e a charneira.
  science: [
    ['path', { d: 'M5 2.6 L2.4 8.8' }],
    ['path', { d: 'M5 2.6 L7.6 8.8' }],
    ['circle', { cx: 5, cy: 2, r: 0.9 }],
  ],
  // Um ponto e a linha por baixo dele.
  death: [
    ['circle', { cx: 5, cy: 3.2, r: 1 }],
    ['path', { d: 'M2 7 L8 7' }],
  ],
  // Um traço curto, e nada mais: a categoria que ainda não tem nome.
  other: [
    ['path', { d: 'M3 5 L7 5' }],
  ],
});

// O que todos os traços partilham. Sem preenchimento, um só peso, pontas e
// junções redondas, e o traço em pixéis de ecrã a qualquer zoom — a mesma
// regra que `.map .mark` já segue.
const STROKE = Object.freeze({
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 1,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'vector-effect': 'non-scaling-stroke',
});

// As categorias que têm símbolo. Uma categoria sem símbolo é um erro que este
// módulo comunica não desenhando nada — nunca desenhando um ponto de
// interrogação, que seria a interface a inventar uma resposta.
export const GLYPH_CATEGORIES = Object.freeze(Object.keys(SHAPES));

export function hasGlyph(category) {
  return typeof category === 'string' && Object.hasOwn(SHAPES, category);
}

// Os doze `<symbol>`, cada um numa caixa de 10 × 10. Precisa de DOM, como tudo
// o que constrói elementos, e por isso é uma função e não uma constante.
export function glyphSymbols() {
  return GLYPH_CATEGORIES.map((id) => svg(
    'symbol',
    { id: glyphId(id), viewBox: `0 0 ${GLYPH_BOX} ${GLYPH_BOX}` },
    SHAPES[id].map(([tag, attrs]) => svg(tag, { ...STROKE, ...attrs })),
  ));
}

// O bloco `<defs>`, uma vez por documento. Quem o pedir primeiro fica com ele;
// os outros desenhos referem-se aos mesmos ids, que é como o mapa e a linha do
// tempo desenham o mesmo símbolo sem o escreverem duas vezes.
export function installGlyphs(root) {
  const doc = root?.ownerDocument ?? (typeof document === 'undefined' ? null : document);
  const found = doc?.getElementById(GLYPH_DEFS_ID);
  if (found) return found;
  const defs = svg('defs', { id: GLYPH_DEFS_ID }, glyphSymbols());
  root.insertBefore(defs, root.firstChild);
  return defs;
}

// Como se chama um símbolo, e o que herda. `glyph` é a palavra nas duas vistas,
// e o resto é o que a marca ou a barra está a vestir, para que o símbolo
// avermelhe com a cadeia percorrida, esmoreça com a lente e esbata fora da
// janela exactamente como ela — e nunca diga nada que ela não esteja a dizer.
//
// `base` é a palavra da vista para um registo (`mark`, `bar`) e o símbolo não a
// leva: não é um registo, e todos os selectores que contam registos têm de
// continuar a contá-los. É a mesma substituição que `ringClasses` faz, e é a
// mesma função (parts.js).
export function glyphClasses(classes, base) {
  return overlayClasses('glyph', classes, base);
}

// Um `<use>` sobre um ponto, centrado nele. `null` quando não há categoria ou
// quando a categoria não tem símbolo: quem chama desenha a marca na mesma e o
// acontecimento fica com o círculo simples.
//
// Sem `data-id`, sem `data-mark`, sem `tabindex` e com `pointer-events` a
// `none` no próprio elemento — não só na folha de estilo, ou uma página sem
// CSS teria um símbolo a apanhar o clique que é da marca.
export function glyphUse(category, {
  x, y, size = GLYPH_BOX, classes = 'glyph',
}) {
  if (!hasGlyph(category)) return null;
  return svg('use', glyphAttributes(category, { x, y, size, classes }));
}

// Os mesmos atributos, para quem desenha através de `reuse` e não constrói o
// elemento (timeline.js). Todos de uma vez, sempre: `reuse` retira o que lhe
// deu antes e não lhe dá agora.
export function glyphAttributes(category, {
  x, y, size = GLYPH_BOX, classes = 'glyph',
}) {
  return {
    href: `#${glyphId(category)}`,
    x: x - size / 2,
    y: y - size / 2,
    width: size,
    height: size,
    class: classes,
    'pointer-events': 'none',
  };
}
