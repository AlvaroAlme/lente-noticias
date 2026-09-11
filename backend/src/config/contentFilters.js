import { normalizeAccents } from "../utils/text.js";

// GNews mezcla, sobre todo en "technology", contenido de afiliados
// ("¿Qué memoria USB comprar?", "Los mejores auriculares por menos de
// 30€") que no es noticia real, sino guías de compra con enlaces de
// afiliado. Como GNews no tiene un filtro para esto, lo detectamos por
// patrones típicos del titular/descripción y lo excluimos antes de
// devolver los artículos al frontend.
const SHOPPING_PATTERNS = [
  /\bqu[eé]\b[^.?!]{0,40}\bcomprar\b/, // "qué ... comprar"
  /\bcu[aá]l(es)?\b[^.?!]{0,40}\bcomprar\b/, // "cuál/es ... comprar"
  /\bmejores?\b[^.?!]{0,60}\b(comprar|ofertas?|precios?|chollos?)\b/,
  /\bchollo/,
  /\boferta(s)?\s+flash\b/,
  /\brebajad[oa]/,
  /\bc[oó]digo(s)?\s+descuento\b/,
  /\bgu[ií]a\s+de\s+compras?\b/,
  /\bblack\s?friday\b/,
  /\bcyber\s?monday\b/,
  /\d+%\s*(de\s*)?descuento/,
  // "solo/sólo" es obligatorio a propósito: "por 19,99€" a secas también
  // aparece en noticias reales de multas/sanciones ("multado por 3.000
  // euros"), pero solo el comercio enfatiza el precio con "por SOLO X€".
  /\bpor\s+(solo|s[oó]lo)\s?\d+[\d.,]*\s?€/,
  /\bmenos\s+de\s+\d+[\d.,]*\s?(€|euros)\b/, // "(cuesta/por) menos de 9 euros"
  /\b(cuesta|vale|precio\s+de)\b[^.?!]{0,25}\d+[\d.,]*\s?(€|euros)\b/, // "cuesta X euros"
  /\bgadget\b[^.?!]{0,60}\b(cuesta|precio|euros|€|amazon|lidl)\b/, // reseña de producto concreto
  /\d+[\d.,]*\s?€\s*\(antes\s+\d+[\d.,]*\s?€\)/, // "9,99€ (antes 19,99€)"
];

// Igual que con el contenido de afiliados: GNews mete los resultados
// diarios de loterías dentro de "general" y "business" como si fueran
// noticias normales. En vez de descartarlos (a alguien sí le interesa
// consultarlos), los sacamos de esas categorías y los movemos a su
// propia categoría "Loterías" (ver gnews.service.js: getLotteryNews).
const LOTTERY_PATTERNS = [
  /\bbonoloto\b/,
  /\beuromillones?\b/,
  /\beurodreams\b/,
  /\bloter[ií]a(s)?\b/,
  // Antes exigía la frase exacta "cupón de la once"; un titular real
  // como "Cupón diario de la ONCE: comprobar sorteo..." tiene una
  // palabra de por medio y no coincidía. "cupón" ya es lo bastante
  // específico de lotería como para no necesitar el "de la" exacto.
  /\bcup[oó]n(es)?\b[^.?!]{0,30}\b(once|sorteo|premio)\b/,
  /\bcuponazo\b/,
  /\bsueldazo\b/,
  /\btriplex\b/,
  /\bquiniela\b/,
  /\bquinigol\b/,
  /\bgordo\s+de\s+la\s+primitiva\b/,
  /\bel\s+ni[ñn]o\b.*\bsorteo\b/,
  // "primitiva" a secas es ambiguo (también significa "original/primera
  // versión", como en "la imagen primitiva de la hermandad"), así que
  // solo cuenta si aparece cerca de vocabulario de sorteo.
  /\bprimitiva\b[^.?!]{0,50}\b(sorteo|resultados?|premios?|euros?|bonoloto|gordo)\b/,
  /\b(sorteo|resultados?|premios?|gordo)\b[^.?!]{0,50}\bprimitiva\b/,
];

// Para la categoría "IA y desarrollo": la búsqueda en GNews por términos
// como "inteligencia artificial" trae de todo (IA en sanidad, regulación,
// robótica...), así que filtramos a posteriori exigiendo que el texto
// combine vocabulario de IA CON vocabulario de programación/desarrollo de
// software, o mencione una herramienta concreta de IA para programar.
const AI_DEV_PATTERNS = [
  /\bvibe coding\b/,
  /\bcopilot\b/,
  /\bclaude code\b/,
  /\bcursor\b[^.?!]{0,30}\b(ia|ai|inteligencia artificial)\b/,
  /\b(agente(s)?)\b[^.?!]{0,30}\b(codificaci[oó]n|c[oó]digo|programaci[oó]n)\b/,
  /\b(inteligencia artificial|ia generativa|ia|ai)\b[^.?!]{0,50}\b(programaci[oó]n|programador(es)?|desarroll\w*|c[oó]digo|codificaci[oó]n|software)\b/,
  /\b(programaci[oó]n|desarroll\w*|c[oó]digo|codificaci[oó]n|software)\b[^.?!]{0,50}\b(inteligencia artificial|ia generativa)\b/,
];

export function isShoppingContent(article) {
  const haystack = normalizeAccents(`${article.title ?? ""} ${article.description ?? ""}`);
  return SHOPPING_PATTERNS.some((re) => re.test(haystack));
}

export function isLotteryContent(article) {
  const haystack = normalizeAccents(`${article.title ?? ""} ${article.description ?? ""}`);
  return LOTTERY_PATTERNS.some((re) => re.test(haystack));
}

export function isAIDevContent(article) {
  const haystack = normalizeAccents(`${article.title ?? ""} ${article.description ?? ""}`);
  return AI_DEV_PATTERNS.some((re) => re.test(haystack));
}
