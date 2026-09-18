// A frase que um resumo do Historical Basemaps carrega sobre o seu intervalo,
// e o que lhe acontece quando esse intervalo deixa de ser o que os snapshots
// cobrem.
//
// O import escreve "The interval on this record is the span those snapshots
// cover, X to 1885, and not a claim about when this polity began or ended".
// Enquanto o `when` do registo for esses dois anos, a frase é verdadeira. Uma
// junção ou uma dissolução citada substituem o fim, e então a frase passaria a
// contradizer o próprio registo. M51 teve de a reapontar em nove resumos e
// escreveu-a assim: aponta para os snapshots, que é o que ela sempre soube.
//
// `REPAIR` existe porque a primeira versão disto cortou a frase cedo de mais e
// deixou "and that and not a claim", sem verbo, em cinco registos que já
// tinham sido escritos. Corrige-os e não faz nada a um resumo são.

const SENTENCE = /The interval on this record is the span those snapshots cover, (\d{4}) to (\d{4}), and not a claim/;
const REPAIR = /(The span those snapshots cover is \d{4} to \d{4}, and that) and not a claim/;

export function repointSpan(summary) {
  if (typeof summary !== 'string') return summary;
  return summary
    .replace(SENTENCE, 'The span those snapshots cover is $1 to $2, and that is not a claim')
    .replace(REPAIR, '$1 is not a claim');
}

export const carriesSpanSentence = (summary) => SENTENCE.test(String(summary ?? ''));
export const carriesBrokenSpanSentence = (summary) => REPAIR.test(String(summary ?? ''));
