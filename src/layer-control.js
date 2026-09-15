// O controlo de camadas, que é também a legenda.
//
// Estava em `main.js` até à corrida dos símbolos, e as treze fichas das
// categorias empurraram esse ficheiro para além das trezentas linhas que o
// `CLAUDE.md` dá como limite. Sai inteiro: `main.js` volta a ser arranque, e o
// que uma ficha escreve no URL fica ao pé do que ela desenha.
//
// Sete das oito `LAYERS` são interruptores: as costas desenham-se sempre
// (decisão 14 do plano) e nem sequer são membro — a costa ao perto é a costa, e
// um interruptor para ela seria um interruptor para um nível de detalhe (desvio
// 523) —, e `land` é membro sem linha, para que um `?layers=` antigo continue a
// ler-se. Duas linhas visíveis e dois grupos fechados: os territórios, os
// acontecimentos, o mapa de base e as categorias. A gaveta do telemóvel fica
// com quatro alvos e não com dezanove (M30b, A12; M37b) — e é por isto que o
// controlo é gerado e não escrito no `index.html`: o rótulo de uma categoria
// está em `data/categories.json` e o id de uma camada em `manifest.base`, e o
// que vem de `data/` é entrada não confiável.
//
// **O controlo é a legenda, e é a única.** Não há legenda por cor de território
// e não vai haver: a amostra ao lado de uma camada de base e o símbolo ao lado
// de uma categoria são tudo o que o mapa explica de si mesmo, e o `about.html`
// diz isso por palavras (emenda A6 do briefing de M37).

import { esc } from './util/esc.js';
import { categoriesShown, eventsOn, eventsTokens } from './categories.js';
import { GLYPH_BOX, glyphId } from './map/glyphs.js';
import { LAYERS } from './state.js';

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
  // As camadas do mapa de base, do manifesto e pela ordem do manifesto — a
  // mesma ordem por que são desenhadas (map.js). Só as que `LAYERS` conhece:
  // `coast` está na lista do manifesto porque é desenhada, e não tem ficha
  // porque não se desliga.
  const base = (atlas.baseLayers ?? []).map((layer) => layer.id).filter((id) => LAYERS.includes(id));

  const row = ({ id, label }) => `<label><input type="checkbox" data-layer="${esc(id)}" checked> ${esc(label)}</label>`;
  // O rótulo de uma camada de base é o seu id, e a amostra ao lado dele é o que
  // diz o que aquela cor quer dizer no mapa. A amostra é uma classe do CSS e
  // não um valor escrito aqui: as cores estão todas em `style.css` e nenhuma
  // delas se escreve duas vezes.
  const baseRow = (id) => `<label><input type="checkbox" data-layer="${esc(id)}" checked>`
    + `<span class="swatch swatch-${esc(id)}" aria-hidden="true"></span> ${esc(id)}</label>`;
  // Cada linha leva o seu símbolo, que é a legenda inteira do mapa para as
  // categorias e não há outra (decisão 14 do plano; o `about.html` diz isso).
  const categoryRow = ({ id, label, count }) => `<label title="${esc(`${count} event${count === 1 ? '' : 's'}`)}">`
    + `<input type="checkbox" data-layer="${esc(`events:${id}`)}" data-category="${esc(id)}" checked>`
    + `<svg class="glyph" viewBox="0 0 ${GLYPH_BOX} ${GLYPH_BOX}" aria-hidden="true"><use href="#${esc(glyphId(id))}"></use></svg>`
    + ` ${esc(label)}</label>`;

  group.innerHTML = LAYER_ROWS.map(row).join('')
    // O mapa de base, fechado e antes das categorias: são as camadas de baixo,
    // e a ordem do controlo é a ordem em que a página é desenhada. Vazio — um
    // manifesto sem `base` — não desenha `<details>` nenhum, pela mesma regra
    // que as categorias seguem: nada se desenha que não tenha dado por baixo.
    + (base.length === 0 ? '' : '<details><summary>base map</summary>'
      + `<div class="base-layers" id="base-map">${base.map(baseRow).join('')}</div></details>`)
    // O `id` no bloco das fichas é o que permite abrir o grupo por uma âncora:
    // `#events-by-category` na ligação faz o Chrome abrir o `<details>` que o
    // contém, e é assim que `tools/screens.mjs` fotografa a folha de contacto
    // dos doze símbolos sem ter de clicar em nada.
    + (categories.length === 0 ? '' : '<details><summary>events by category</summary>'
      + `<div class="categories" id="events-by-category">${categories.map(categoryRow).join('')}</div></details>`);

  const boxes = (selector) => [...group.querySelectorAll(selector)];

  // O que as fichas dizem, como lista `?layers=`. **Pela ordem de `LAYERS`**, e
  // não pela ordem das fichas: é assim que `formatState` reconhece o estado por
  // omissão e não escreve `?layers=` nenhum enquanto nada estiver desligado. E
  // `land` vai sempre, porque não tem ficha e está sempre ligado — sem ele,
  // desligar os territórios e voltar a ligá-los escrevia uma lista à qual
  // faltava um nome, e desde M37b uma lista a que falta um nome é esse nome
  // desligado (desvio 522).
  //
  // As categorias tomam o lugar da ficha `events`: a ficha nua enquanto
  // estiverem todas ligadas, e uma `events:<id>` por categoria ainda ligada
  // assim que uma deixar de estar (A11), para que o que o leitor fez esteja
  // sempre na ligação.
  //
  // Desligar todas as categorias não escreve ficha nenhuma, e a linha dos
  // acontecimentos apaga-se com elas: "nenhuma categoria e os que não têm
  // nenhuma" é um estado que o `?layers=` não sabe dizer, e um controlo que
  // escrevesse uma ligação que o atlas não soubesse ler de volta seria pior do
  // que um que diz com todas as letras que está tudo desligado (desvio 586).
  const layersFromBoxes = () => {
    const on = new Set(boxes('input[data-layer]:not([data-category])')
      .filter((b) => b.checked).map((b) => b.dataset.layer));
    const out = [];
    for (const id of LAYERS) {
      if (id !== 'events') {
        // `land` não tem ficha: as costas desenham-se sempre.
        if (id === 'land' || on.has(id)) out.push(id);
        continue;
      }
      if (!on.has('events')) continue;
      if (all.length === 0) { out.push('events'); continue; }
      const kept = boxes('input[data-category]').filter((b) => b.checked).map((b) => b.dataset.category);
      out.push(...eventsTokens({ on: kept, all }));
    }
    return out;
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
