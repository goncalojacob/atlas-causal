// O que uma lista `?layers=` diz sobre categorias, e o que o manifesto diz
// sobre as categorias que existem.
//
// Puro: uma lista de fichas e um manifesto à entrada, ids e rótulos à saída.
// Fica fora de `state.js` de propósito — esse ficheiro não conhece dado nenhum
// e aceita `events:<slug>` pela forma, sem saber que categorias há (M30b, A11)
// — e fora de `emphasis.js` porque o controlo de camadas precisa exactamente
// das mesmas respostas para desenhar as fichas que o filtro lê.
//
// O filtro propriamente dito é uma só remoção, em `workingSet`
// (`src/emphasis.js`), onde a lente também remove: assim o mapa, a linha do
// tempo, o grafo e a contagem do canto concordam (review do bloco do mapa, F6).

const PREFIX = 'events:';

// As categorias nomeadas na lista, quaisquer que sejam. `state.js` aceita a
// ficha pela forma, de modo que um nome que nenhuma categoria tem chega aqui e
// é deixado cair por quem lê — a mesma regra que `lanes.js` aplica a um id de
// faixa que já não existe.
function tokens(layers) {
  return (layers ?? []).filter((l) => typeof l === 'string' && l.startsWith(PREFIX))
    .map((l) => l.slice(PREFIX.length));
}

// Se a camada dos acontecimentos está ligada de todo. A ficha nua `events`
// quer dizer todas as categorias e mais os acontecimentos que não têm nenhuma;
// desligar uma categoria substitui-a por uma ficha `events:<id>` por cada
// categoria ainda ligada (M30b, A11), e nesse estado a ficha nua não está lá —
// mas a camada continua ligada.
export function eventsOn(layers) {
  return (layers ?? []).includes('events') || tokens(layers).length > 0;
}

// As categorias ainda ligadas, ou `null` quando não há nada a estreitar: com a
// ficha nua estão todas, e sem ficha nenhuma a camada está desligada e não é
// esta função que o diz.
export function categoriesOn(layers) {
  if ((layers ?? []).includes('events')) return null;
  const on = tokens(layers);
  return on.length === 0 ? null : new Set(on);
}

// The same answer said as the switches show it: which of the categories in use
// a `?layers=` list leaves ticked. All of them behind the bare `events` token,
// the named ones behind `events:<id>`, and none at all where the events layer
// is off — which `categoriesOn` cannot say on its own, because `null` there
// means "nothing to narrow" and not "nothing on".
//
// Since M68 a control that does not own the category switches reads its half of
// the list through this rather than off the boxes, because the boxes may be in
// another group and are no longer its to read.
export function categoriesChecked(layers, all) {
  if (!eventsOn(layers)) return [];
  const on = categoriesOn(layers);
  return on === null ? [...all] : all.filter((id) => on.has(id));
}

// A lista de fichas que o leitor acabou de escrever, a partir do que está
// ligado: a ficha nua quando estão todas, uma por categoria quando não estão.
// `all` são as categorias em uso — as que têm ficha no controlo — e não as doze
// permitidas, ou desligar uma das oito que não têm registo nenhum escreveria
// uma lista que nunca voltava a ser "todas".
export function eventsTokens({ on, all }) {
  const kept = all.filter((id) => on.includes(id));
  if (kept.length === all.length) return ['events'];
  return kept.map((id) => `${PREFIX}${id}`);
}

// O rótulo de cada categoria que o dado permite, do manifesto. Vazio onde o
// conjunto não tem ficheiro: "sem verificação" não é "um conjunto fechado e
// vazio", e é o manifesto que faz a diferença dizendo ou não dizendo.
export function categoryLabels(manifest) {
  return new Map((manifest?.categoriesAllowed ?? []).map((c) => [c.id, c.label ?? c.id]));
}

// E as que estão realmente em uso, com a contagem e o rótulo: uma linha do
// controlo cada. Vazio onde nenhum acontecimento tem categoria, e então não se
// desenha `<details>` nenhum — nada se desenha que não tenha dado por baixo
// (glyphs-brief, §4). O rótulo cai para o id quando o vocabulário não nomeia a
// categoria, que é um dado inconsistente e não uma razão para não desenhar a
// ficha que esconde os registos.
export function categoriesShown(manifest) {
  const labels = categoryLabels(manifest);
  return (manifest?.categories ?? []).map(({ id, count }) => ({
    id, count, label: labels.get(id) ?? id,
  }));
}
