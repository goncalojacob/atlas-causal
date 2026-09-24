// Onde cabe cada nome. Há **um** colocador neste mapa e nunca há um segundo
// (achado 27 da revisão do plano: "dois colocadores de etiquetas vão colidir →
// um colocador partilhado com prioridades"). Este ficheiro é ele, e é puro:
// não toca no DOM, não sabe o que é uma camada e não lê o estado. Recebe
// candidatos de qualquer origem na mesma forma e devolve os que ficam.
//
//   placeLabels(candidatos, { k, view, limits })
//   candidato: { id, text, x, y, priority, weight, em?, once? }
//   → [{ id, text, x, y, priority, box }] pela ordem de desenho
//
// **A ordem é determinada e não negociada**: prioridade a subir, depois peso a
// descer, depois `id`. A mesma imagem coloca as mesmas etiquetas duas vezes,
// que é o que separa um mapa de uma animação — um nome que aparece e
// desaparece conforme a ordem em que os ficheiros chegaram seria pior do que
// nome nenhum.
//
// **Uma etiqueta que bate noutra é saltada e não empurrada.** É a regra que a
// camada dos acontecimentos já seguia e é a razão por que uma etiqueta nunca
// se afasta daquilo que nomeia: empurrada o suficiente, passa a apontar para o
// vizinho. Quem perde a caixa fica sem nome, e o leitor aproxima-se.

// O tamanho de uma etiqueta em unidades da página, antes de ser dividido por
// k. Onze, que é `--text-xs` e é o que a camada dos acontecimentos já usava:
// há um tamanho para os três tipos de etiqueta e não há um segundo (desvio
// 530). O halo é o traço de papel por trás dela, em pixéis do ecrã.
//
// Os dois vivem aqui porque é aqui que a caixa é feita das letras, e quem
// desenha uma etiqueta — a ronda em `map.js` — lê-os daqui e não de si.
export const LABEL_SIZE = 11;
// Dois e não três. Três era o número de quando por baixo de uma etiqueta não
// havia nada; por cima de costa, rios e cidades a 10 m era uma mancha branca
// que escondia o chão que a etiqueta nomeia (o que o dono viu em
// `docs/screens/m37-base-lisbon.png`). Um halo existe para separar as letras
// do que está por baixo, não para o apagar.
export const LABEL_HALO = 2;
// Onde um nome é cortado. Não é aritmética da caixa — é sobre o texto — mas é
// a mesma pergunta e os dois chamadores fazem-na.
export const LABEL_CHARS = 30;

// O zoom a partir do qual este mapa escreve nomes. Quatro, que é onde as
// etiquetas dos acontecimentos sempre começaram: nomes no mundo inteiro são
// ruído, e a esta altura o leitor já está a olhar para um país.
//
// Vale para as etiquetas todas e não só para as dos acontecimentos, porque a
// frase é sobre o mapa e não sobre uma camada. Natural Earth marca dezassete
// cidades — Tóquio, Nova Iorque, Moscovo — para serem escritas à escala do
// mundo, que é a decisão certa para o atlas *dela*; num mapa da expansão
// portuguesa seriam dezassete nomes de outro mapa por cima do primeiro
// fotograma. Acima deste piso é o `zl` de cada uma que decide, que é o que o
// briefing pede.
export const LABEL_ZOOM = 4;

// **Menos os acontecimentos, que são escritos sempre** (M86 §2, achado A2 da
// segunda revisão). O piso acima é sobre o mapa *de base*: as dezassete
// cidades que Natural Earth marca para a escala do mundo são dezassete nomes
// de outro atlas por cima do primeiro fotograma, e isso não mudou. O que
// mudou foi o que ficava por baixo delas: `m85-first-screen.png` é o mundo
// inteiro em sessenta círculos numerados e nem um nome, e é a primeira imagem
// que um financiador vê. Um acontecimento é o que este atlas é — prioridade
// zero, a hierarquia dita em três números logo abaixo — por isso tem um piso
// só seu, que é o zoom mais afastado que há.
export const EVENT_LABEL_ZOOM = 1;

// E quantos, ao longe. Dez, que é o que cabe num mundo sem se tornar a mancha
// que `LABEL_ZOOM` existe para evitar; quais são os dez é a ordem que o
// colocador já tem — peso a descer — e não uma segunda regra aqui.
export const RESTING_EVENT_LABELS = 10;

// As prioridades, que são a hierarquia do mapa dita em três números: um
// acontecimento é o que este atlas é, uma cidade é onde ele aconteceu, e uma
// serra é o chão por baixo dos dois (decisão 9 do plano). Um pico, um rio e um
// lago são acidentes físicos e partilham a terceira — competem pelo mesmo
// espaço e perder para uma cidade é o resultado certo para os três (desvio
// 531).
export const PRIORITY = Object.freeze({ events: 0, cities: 1, features: 2 });

// Quantas etiquetas de cada prioridade, no máximo. Passados de fora: o
// colocador não tem número nenhum seu a não ser a aritmética da caixa. Sem um
// limite por prioridade, cem cidades numa costa cheia enchiam o ecrã antes de
// o primeiro acontecimento ser considerado — e os acontecimentos são o mapa.
export const LIMITS = Object.freeze({ 0: 12, 1: 24, 2: 8 });

// Um nome demasiado comprido, cortado. Pelo espaço anterior quando há um perto
// do fim, senão pela letra: "Humberto Delgado's presidenti…" é o corte a
// meio de uma palavra que o dono viu, e "Humberto Delgado's…" diz o mesmo sem
// deixar meia palavra na página. O sinal de reticências conta para o
// comprimento, como contava.
export function shorten(text, chars = LABEL_CHARS) {
  if (text.length <= chars) return text;
  const cut = text.slice(0, chars - 1).trimEnd();
  const space = cut.lastIndexOf(' ');
  // Só se sobrar pelo menos metade do que cabia: um nome de uma palavra só, ou
  // um cujo último espaço está logo no princípio, fica cortado pela letra como
  // estava — meia palavra é melhor do que duas letras e umas reticências.
  return `${space >= Math.floor((chars - 1) / 2) ? cut.slice(0, space).trimEnd() : cut}…`;
}

// Quanto do tamanho da letra ocupa um carácter, em média. `EM` é o número que
// a camada dos acontecimentos usava e continua a ser o que a caixa assume;
// `EM_TRACKED` é o mesmo mais o `--tracking-label` que separa as letras de um
// acidente físico no `style.css` (0.08em), porque uma etiqueta espaçada ocupa
// mesmo mais chão e uma caixa que o ignorasse deixava dois nomes montados um no
// outro. Está aqui em número e lá em token porque a caixa é feita sem DOM: é
// uma estimativa da folha de estilo e não uma segunda folha de estilo.
export const EM = 0.55;
export const EM_TRACKED = EM + 0.08;

// A caixa que uma etiqueta ocupa, aproximada. É a da camada dos
// acontecimentos, movida sem mudar um número: um em é cerca de metade do
// tamanho da letra, e a caixa só tem de ser boa o suficiente para manter duas
// etiquetas fora uma da outra. Medir o texto a sério obrigaria a tê-lo no DOM,
// que é precisamente o que este ficheiro não faz.
//
// `x` é a âncora — onde o texto começa — e `y` a linha de base do que nomeia.
// `em` é quanto ocupa um carácter e só não é `EM` para quem escreve espaçado.
export function labelBox(text, x, y, k, em = EM) {
  return {
    x0: x,
    x1: x + (text.length * LABEL_SIZE * em) / k,
    y0: y - (LABEL_SIZE * 0.7) / k,
    y1: y + (LABEL_SIZE * 0.7) / k,
  };
}

const hits = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

// Se a âncora está dentro do rectângulo em vista. `view` nulo é um chamador
// sem nada para medir — um teste, ou um painel que ainda não foi disposto — e
// então está tudo em vista, que é o que a camada dos acontecimentos fazia
// antes de haver um rectângulo para perguntar.
const inView = (x, y, view) => !view || (x >= view.x0 && x <= view.x1 && y >= view.y0 && y <= view.y1);

// E a **caixa** também, e não só a âncora (M86 §2). Uma etiqueta é escrita a
// partir da sua âncora para a direita, por isso um nome ancorado dentro do
// rectângulo pode acabar fora dele: no primeiro ecrã, agora que os
// acontecimentos são escritos ao longe, era "The 1964 Brazilian c" cortado
// pela borda. Um nome é escrito inteiro ou não é escrito — é a regra que o
// grafo já segue (graph-view/labels.js) e a que a linha do tempo passou a
// seguir em M86 §4 — e quem perde a borda fica sem nome, como quem perde a
// caixa a outro.
const boxInView = (box, view) => !view || box.x1 <= view.x1;

// As etiquetas que ficam, pela ordem em que são desenhadas.
//
// `k` é o zoom em vigor: a caixa é em unidades da página e o texto tem o mesmo
// tamanho no ecrã a qualquer zoom, por isso encolhe em unidades à medida que o
// leitor se aproxima — e é por isso que cabem mais nomes lá dentro.
export function placeLabels(candidates, { k = 1, view = null, limits = LIMITS } = {}) {
  // Fora do ecrã não é candidato, e é deitado fora antes da ordenação: uma
  // etiqueta que não vai ser desenhada não pode gastar o limite da sua
  // prioridade nem a caixa de outra.
  const wanted = [];
  for (const candidate of candidates ?? []) {
    if (!candidate || typeof candidate.text !== 'string') continue;
    if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.y)) continue;
    if (!inView(candidate.x, candidate.y, view)) continue;
    wanted.push(candidate);
  }
  wanted.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)
    || (b.weight ?? 0) - (a.weight ?? 0)
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const placed = [];
  const boxes = [];
  // Por prioridade e não no total: é isto que faz com que cem cidades nunca
  // possam empurrar um acontecimento para fora do mapa.
  const used = new Map();
  // Um nome dito uma vez não é dito outra. Um candidato pode trazer uma chave
  // `once`, e o segundo que a traga é saltado: o Tejo chega em sete troços com
  // `id` diferentes e o Danúbio em três, porque é assim que Natural Earth corta
  // um rio, e escrever "Tejo" duas vezes no mesmo ecrã é dizer que são dois
  // rios. Contado só quando a etiqueta é mesmo colocada — se a primeira perde a
  // caixa, a seguinte ainda pode dizer o nome.
  const said = new Set();
  for (const candidate of wanted) {
    const priority = candidate.priority ?? 0;
    const limit = limits?.[priority] ?? 0;
    const spent = used.get(priority) ?? 0;
    if (spent >= limit) continue;
    if (candidate.once && said.has(candidate.once)) continue;
    const box = labelBox(candidate.text, candidate.x, candidate.y, k, candidate.em ?? EM);
    if (!boxInView(box, view)) continue;
    if (boxes.some((other) => hits(box, other))) continue;
    boxes.push(box);
    used.set(priority, spent + 1);
    if (candidate.once) said.add(candidate.once);
    placed.push({ id: candidate.id, text: candidate.text, x: candidate.x, y: candidate.y, priority, box });
  }
  return placed;
}
