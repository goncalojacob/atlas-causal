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
// ler-se. Duas linhas visíveis e um grupo fechado: os territórios, os
// acontecimentos e o mapa de base. É por isto que o controlo é gerado e não
// escrito no `index.html`: o id de uma camada está em `manifest.base`, e o que
// vem de `data/` é entrada não confiável.
//
// **O controlo é a legenda, e é a única.** Não há legenda por cor de território
// e não vai haver: a amostra ao lado de uma camada de base é o que o mapa
// explica de si mesmo, e o `about.html` diz isso por palavras (emenda A6 do
// briefing de M37).
//
// **Since M68 the categories are not here.** They narrowed all three pictures
// and could be switched only from the one control that is the map's own legend
// (deviation 858), so they went to the masthead, where the window and the
// grouping are: `category-control.js`, which owns them and keeps the only copy.
// The events row stays, because switching the events layer off is switching a
// layer off; what it must not do is decide the events half of the `?layers=`
// list behind the switches' back, so it asks for that list rather than
// assembling one of its own.

import { esc } from './util/esc.js';
import { categoriesChecked, categoriesShown, eventsOn } from './categories.js';
import { layersFrom } from './category-control.js';
import { LAYERS } from './state.js';

const LAYER_ROWS = [
  { id: 'territories', label: 'territories' },
  { id: 'events', label: 'events' },
];

export function createLayerControl(group, { atlas, state }) {
  if (!group) return;
  // The categories **in use**, from the manifest — not read to draw a switch
  // any more, which is `category-control.js`'s since M68, but to know how many
  // there are: the events half of the `?layers=` list is written as one token
  // per category still on, and a control that did not know the categories in
  // use would write a list that could never mean "all of them" again.
  const all = categoriesShown(atlas.manifest).map((c) => c.id);
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
  group.innerHTML = LAYER_ROWS.map(row).join('')
    // O mapa de base, fechado e no fim: são as camadas de baixo, e a ordem do
    // controlo é a ordem em que a página é desenhada. Vazio — um manifesto sem
    // `base` — não desenha `<details>` nenhum: nada se desenha que não tenha
    // dado por baixo.
    + (base.length === 0 ? '' : '<details><summary>base map</summary>'
      + `<div class="base-layers" id="base-map">${base.map(baseRow).join('')}</div></details>`);

  const boxes = (selector) => [...group.querySelectorAll(selector)];

  // What the switches here say, as a `?layers=` list — and only the half of it
  // they own. The events half is the category switches', so it is read out of
  // the state the write is about to replace and handed back untouched: turning
  // the territories off must not widen or narrow what the reader chose to see
  // (M68). `layersFrom` is the assembly, and it is theirs, so the two controls
  // cannot write two different lists out of one state — the order of `LAYERS`,
  // `land` with no switch of its own (deviation 522), and every category off
  // taking the events layer with it (deviation 586) are all decided there.
  const layersFromBoxes = () => {
    const on = new Set(boxes('input[data-layer]')
      .filter((b) => b.checked).map((b) => b.dataset.layer));
    return layersFrom({ on, categories: categoriesChecked(state.get().layers, all), all });
  };

  // E no outro sentido. A linha dos acontecimentos está ligada sempre que a
  // camada estiver ligada de todo, o que por A11 acontece enquanto houver uma
  // ficha `events:<id>` de pé.
  const checkedFor = (box, layers) => {
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
