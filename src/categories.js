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

// ─── o que um interruptor deixou de fora, dito (M89 §8, achado A8) ──────────
//
// `?layers=territories,events:war` mostrava "186 main events of 1257 in view":
// 35 dos 240 acontecimentos principais são guerras, 151 não têm categoria
// nenhuma e continuam desenhados, e o leitor via um filtro que parecia não
// filtrar. O ensaio explica a regra — quem não tem categoria não é escondido
// por uma categoria — mas o ensaio não está no ecrã em que o interruptor é
// carregado.
//
// Então o controlo diz o que guardou: "35 wars, and 151 events without a
// category still drawn". Os dois números são da imagem que está desenhada, e
// são contados aqui, uma vez, para que a frase não possa dizer uma coisa e o
// mapa outra.

// O plural de um rótulo, em inglês, que é a língua de toda a interface
// (CLAUDE.md). Uma regra e não uma segunda coluna nos dados: acrescentar
// `plural` a `data/categories.json` seria pedir a quem escreve um registo que
// escrevesse gramática. `y` depois de consoante vira `ies` — "treaty" é a única
// das doze a que isso acontece hoje — e o resto leva um `s`.
export function pluralLabel(label) {
  const word = String(label ?? '').toLowerCase();
  if (word === '') return '';
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

// Quantos de cada categoria ainda ligada estão desenhados, e quantos dos
// desenhados não têm categoria nenhuma. Puro: recebe os acontecimentos que a
// imagem desenha e as categorias ligadas, pela ordem do manifesto.
export function categoryCounts(events, shown) {
  const counts = new Map();
  let uncategorised = 0;
  for (const event of events ?? []) {
    const id = event?.category ?? null;
    if (id === null) { uncategorised += 1; continue; }
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return {
    kept: (shown ?? []).map(({ id, label }) => ({ id, label, count: counts.get(id) ?? 0 })),
    uncategorised,
  };
}

// E a frase. Vazia onde não há nada a explicar — nenhuma categoria ligada, ou
// nada desenhado — porque um controlo que fala quando não filtrou nada é ruído
// no mastro. A cláusula do sem-categoria cai quando não há nenhum: é ela que é
// a notícia, e "and 0 events without a category" seria a frase a inventar uma.
export function categoryCountText({ kept, uncategorised }) {
  const named = (kept ?? []).filter((one) => one.count > 0)
    .map((one) => `${one.count} ${pluralLabel(one.label)}`);
  if (named.length === 0 && !(uncategorised > 0)) return '';
  const list = named.length === 0 ? ''
    : named.length === 1 ? named[0]
      : `${named.slice(0, -1).join(', ')} and ${named[named.length - 1]}`;
  if (!(uncategorised > 0)) return `${list} drawn`;
  const rest = `${uncategorised} ${uncategorised === 1 ? 'event' : 'events'} without a category still drawn`;
  return list === '' ? `${rest[0].toUpperCase()}${rest.slice(1)}` : `${list}, and ${rest}`;
}
