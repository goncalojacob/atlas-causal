// Como se chama uma coisa neste mapa, e em que ano. Puro: não toca no DOM, não
// lê o estado e não vai buscar nada — recebe o que a feature traz, o registo de
// lugar que lhe corresponde (quando há um) e o ano do extremo da banda, e
// devolve duas cordas: a que vai na cara do mapa e a que vai no `<title>`.
//
// **Na cara vai um nome e no título vão todos** (desvio 528, emenda A0). Vinte
// e quatro cidades com dois nomes cada é um mapa que não se lê. Por isso:
//
//   cara    o nome datado de `historicalNames` para o extremo da janela;
//           na falta dele, o `name` que Natural Earth dá.
//   título  o `name`, o `nameEn` onde é outro, e depois **todos** os nomes
//           datados com os seus anos ("Lourenço Marques, 1895–1976").
//
// Não há "nome local" e nenhum `NAME_<lang>` é lido até a camada de i18n dar
// nome a uma língua (emenda A0). E **nada aqui é inventado**: um nome datado
// vem de um registo que uma pessoa escreveu, os anos são os que lá estão, e uma
// cidade para a qual este atlas não tem nome datado não ganha um porque o ano o
// sugeria. É a regra dura de `CLAUDE.md` sobre afirmações históricas escritas
// por uma máquina — o nome antigo de uma cidade é exactamente uma dessas.

import { formatYear, isValidYear, toAstronomical } from '../util/dates.js';
import { shorten } from './labels.js';

// O ponto médio que separa os nomes numa linha só. Uma entrada datada já traz
// uma vírgula lá dentro e vírgulas a separar vírgulas não se lêem (desvio 655).
export const TITLE_SEPARATOR = ' · ';

// As entradas que são mesmo entradas. `data/` é entrada não fidedigna aqui como
// em todo o lado: uma lista que não é lista, uma entrada sem nome ou com um ano
// que não é ano são deitadas fora em silêncio, e nunca fazem o mapa parar.
function entriesOf(list) {
  return (Array.isArray(list) ? list : []).filter((entry) => typeof entry?.name === 'string' && entry.name !== '');
}

// Um ano do registo em anos astronómicos, que é a única numeração em que a
// aritmética é permitida (util/dates.js). Nulo quando não há ano nenhum ou
// quando o que lá está não é um ano.
const yearOf = (value) => (isValidYear(value) ? toAstronomical(value) : null);

// O nome que este lugar tinha no ano dado, ou nulo.
//
// `from` conta e `to` não: "Lourenço Marques até 1976, Maputo a partir de
// 1976" são dois intervalos que se tocam num ano e não se sobrepõem em
// nenhum, que é como uma pessoa escreve uma mudança de nome. `to: null`
// quer dizer que ainda é o nome de hoje, e `from: null` que já o era antes
// de este atlas começar.
//
// A primeira entrada que contém o ano, pela ordem em que o registo as escreve:
// duas que se sobreponham são um erro de dados e não uma escolha a fazer aqui.
export function datedName(list, year) {
  if (!Number.isFinite(year)) return null;
  for (const entry of entriesOf(list)) {
    const from = yearOf(entry.from);
    const to = yearOf(entry.to);
    if (from !== null && year < from) continue;
    if (to !== null && year >= to) continue;
    return entry.name;
  }
  return null;
}

// O nome que vai na cara do mapa. O datado quando o há para este ano, o
// moderno quando não.
//
// Um registo sem `historicalNames` é o nome moderno e mais nada, e uma janela
// cujo extremo não cai em intervalo nenhum também: é aqui que "nada é
// inventado" é uma linha de código e não uma intenção.
export function faceName({ name = null, historicalNames = null, year = null } = {}) {
  return datedName(historicalNames, year) ?? (typeof name === 'string' && name !== '' ? name : null);
}

// Os anos de uma entrada datada, ditos como uma pessoa os diz. Sem anos, a
// entrada é só um nome: um registo que não a datou não é datado por isto.
function yearsOf(entry) {
  const from = isValidYear(entry.from) ? formatYear(entry.from) : null;
  const to = isValidYear(entry.to) ? formatYear(entry.to) : null;
  if (from && to) return `${from}–${to}`;
  if (from) return `from ${from}`;
  if (to) return `until ${to}`;
  return '';
}

// A linha que o rato faz aparecer: todos os nomes que esta coisa tem.
//
// Vai para o DOM por `textContent` e não por concatenação, por isso não passa
// por `esc()` — é a razão por que `svgTitle` existe (util/dom.js). Repetidos
// exactos caem fora: um nome datado que diga o mesmo que o moderno e não traga
// anos não acrescenta nada à linha.
export function titleLine({ name = null, nameEn = null, historicalNames = null } = {}) {
  const parts = [];
  const add = (text) => { if (text && !parts.includes(text)) parts.push(text); };
  add(typeof name === 'string' && name !== '' ? name : null);
  // Só quando é outro: o importador escreve `nameEn` apenas onde difere de
  // `name`, e a comparação aqui é uma segurança e não uma regra nova.
  if (typeof nameEn === 'string' && nameEn !== '' && nameEn !== name) add(nameEn);
  for (const entry of entriesOf(historicalNames)) {
    const years = yearsOf(entry);
    add(years ? `${entry.name}, ${years}` : entry.name);
  }
  return parts.length > 0 ? parts.join(TITLE_SEPARATOR) : null;
}

// --- os lugares que este atlas nomeia e o Natural Earth não ------------------
//
// Treze dos vinte e seis registos de `data/places/` não têm cidade nenhuma no
// Natural Earth, e **isso é o caso normal e não um remendo**: `belem` é uma
// freguesia de Lisboa, `tete-district` um distrito e
// `near-villanueva-del-fresno` um campo de batalha, e um gazeteiro mundial não
// tem nenhum dos três. Um registo assim não ganha ponto de cidade: o nome sai
// do próprio registo, no ponto que o registo dá, ao lado das cidades e à sua
// prioridade — é assim que uma vila de que o Natural Earth nunca ouviu falar
// entra no mapa (`docs/naturalearth-places.md`).
//
// Um registo cuja cidade **está** desenhada não entra aqui: essa cidade já o
// nomeia, e dois nomes no mesmo sítio é o erro que esta lista existe para não
// cometer.

// O peso de um lugar deste atlas ao pé de uma cidade do Natural Earth. Mil
// milhões, que é acima de qualquer população que o Natural Earth registe (a
// maior é Tóquio, com trinta e sete milhões): quando as vinte e quatro
// etiquetas do degrau não chegam para todos, os lugares **deste** atlas ficam
// com elas. O mapa é sobre o que aconteceu nestes lugares; uma cidade que o
// mapa apenas conhece vem depois.
export const ATLAS_PLACE_WEIGHT = 1e9;

export function placeCandidates(places, {
  drawn = null,
  project = (point) => point,
  priority = 1,
  year = null,
  nameOf = (place) => (typeof place?.name === 'string' && place.name !== '' ? place.name : null),
  // O peso inteiro e não um acréscimo: é o mesmo `weightOf` que a camada de
  // base usa para uma cidade que é um lugar deste atlas, e a regra é uma só.
  weightOf = () => ATLAS_PLACE_WEIGHT,
} = {}) {
  const candidates = [];
  for (const place of places ?? []) {
    if (!place || place.status !== 'active') continue;
    if (drawn && drawn.has(place.id)) continue;
    const { lon, lat } = place.where ?? {};
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    // Um nome que ainda não chegou não é escrito: "still loading" é uma frase
    // para um tooltip e não uma palavra para atravessar um país, que é o que a
    // camada dos acontecimentos já diz das suas (attributes.js).
    const name = nameOf(place);
    if (typeof name !== 'string' || name === '') continue;
    const historicalNames = place.historicalNames ?? null;
    const face = faceName({ name, historicalNames, year });
    if (face === null) continue;
    const [x, y] = project([lon, lat]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    candidates.push({
      id: place.id,
      text: shorten(face),
      title: titleLine({ name, historicalNames }),
      x,
      y,
      priority,
      weight: weightOf(place),
    });
  }
  return candidates;
}
