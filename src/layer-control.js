// O controlo de camadas, que é também a legenda.
//
// Estava em `main.js` até à corrida dos símbolos, e as treze fichas das
// categorias empurraram esse ficheiro para além das trezentas linhas que o
// `CLAUDE.md` dá como limite. Sai inteiro: `main.js` volta a ser arranque, e o
// que uma ficha escreve no URL fica ao pé do que ela desenha.
//
// Duas das três `LAYERS` são interruptores: as costas desenham-se sempre
// (decisão 14 do plano) e `land` não tem linha, embora continue a ser membro
// para que um `?layers=` antigo continue a ler-se nas mesmas três. As fichas
// das categorias vêm dentro de um `<details>` fechado, de maneira que a gaveta
// do telemóvel fica com um alvo de 40 px e não com treze (M30b, A12) — e é por
// isto que o controlo é gerado e não escrito no `index.html`: o rótulo de uma
// categoria está em `data/categories.json`, e o que vem de `data/` é entrada
// não confiável.

import { esc } from './util/esc.js';
import { categoriesShown, eventsOn, eventsTokens } from './categories.js';
import { GLYPH_BOX, glyphId } from './map/glyphs.js';

const LAYER_ROWS = [
  { id: 'territories', label: 'territories' },
  { id: 'events', label: 'events' },
];

export function createLayerControl(group, { atlas, state }) {
  if (!group) return;
  // As categorias **em uso**, do manifesto, e não as doze que o vocabulário
  // permite: quatro das doze têm registo hoje, e oito fichas que não escondem
  // nada são oito mentiras sobre o que o atlas tem. Vazio não desenha
  // `<details>` nenhum — nada se desenha que não tenha dado por baixo.
  const categories = categoriesShown(atlas.manifest);
  const all = categories.map((c) => c.id);

  const row = ({ id, label }) => `<label><input type="checkbox" data-layer="${esc(id)}" checked> ${esc(label)}</label>`;
  // Cada linha leva o seu símbolo, que é a legenda inteira do mapa para as
  // categorias e não há outra (decisão 14 do plano; o `about.html` diz isso).
  const categoryRow = ({ id, label, count }) => `<label title="${esc(`${count} event${count === 1 ? '' : 's'}`)}">`
    + `<input type="checkbox" data-layer="${esc(`events:${id}`)}" data-category="${esc(id)}" checked>`
    + `<svg class="glyph" viewBox="0 0 ${GLYPH_BOX} ${GLYPH_BOX}" aria-hidden="true"><use href="#${esc(glyphId(id))}"></use></svg>`
    + ` ${esc(label)}</label>`;

  group.innerHTML = LAYER_ROWS.map(row).join('')
    // O `id` no bloco das fichas é o que permite abrir o grupo por uma âncora:
    // `#events-by-category` na ligação faz o Chrome abrir o `<details>` que o
    // contém, e é assim que `tools/screens.mjs` fotografa a folha de contacto
    // dos doze símbolos sem ter de clicar em nada.
    + (categories.length === 0 ? '' : '<details><summary>events by category</summary>'
      + `<div class="categories" id="events-by-category">${categories.map(categoryRow).join('')}</div></details>`);

  const boxes = (selector) => [...group.querySelectorAll(selector)];

  // O que as fichas dizem, como lista `?layers=`. As duas linhas simples são o
  // seu próprio nome; as categorias são o conjunto de fichas de A11 — a ficha
  // nua `events` enquanto estiverem todas ligadas, e uma `events:<id>` por
  // categoria ainda ligada assim que uma deixar de estar, para que o que o
  // leitor fez esteja sempre na ligação.
  //
  // Desligar todas as categorias não escreve ficha nenhuma, e a linha dos
  // acontecimentos apaga-se com elas: "nenhuma categoria e os que não têm
  // nenhuma" é um estado que o `?layers=` não sabe dizer, e um controlo que
  // escrevesse uma ligação que o atlas não soubesse ler de volta seria pior do
  // que um que diz com todas as letras que está tudo desligado (desvio 586).
  const layersFromBoxes = () => {
    const plain = boxes('input[data-layer]:not([data-category])')
      .filter((b) => b.checked && b.dataset.layer !== 'events')
      .map((b) => b.dataset.layer);
    const eventsBox = boxes('input[data-layer="events"]')[0];
    if (eventsBox && !eventsBox.checked) return plain;
    if (all.length === 0) return [...plain, 'events'];
    const on = boxes('input[data-category]').filter((b) => b.checked).map((b) => b.dataset.category);
    return [...plain, ...eventsTokens({ on, all })];
  };

  // E no outro sentido. A ficha de uma categoria segue também a ficha nua, que
  // quer dizer "todas as categorias"; a linha dos acontecimentos está ligada
  // sempre que a camada estiver ligada de todo, o que por A11 acontece
  // enquanto houver uma ficha `events:<id>` de pé.
  const checkedFor = (box, layers) => {
    if (box.dataset.category) return layers.includes('events') || layers.includes(box.dataset.layer);
    if (box.dataset.layer === 'events') return eventsOn(layers);
    return layers.includes(box.dataset.layer);
  };

  for (const box of boxes('input[data-layer]')) {
    box.checked = checkedFor(box, state.get().layers);
    box.addEventListener('change', () => state.set({ layers: layersFromBoxes() }));
  }
  state.subscribe((s) => {
    for (const box of boxes('input[data-layer]')) box.checked = checkedFor(box, s.layers);
  });
}
