import Parser from "rss-parser";
import { RSS_FEEDS } from "../config/feeds.js";
import { cached } from "../utils/cache.js";
import { normalizeAccents } from "../utils/text.js";

const parser = new Parser({ timeout: 15000 });

// Palabras demasiado comunes en español como para servir de "huella"
// de una noticia. Las descartamos al comparar titulares.
const STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del",
  "en", "y", "a", "que", "por", "con", "para", "su", "sus", "es", "se",
  "al", "lo", "como", "más", "pero", "sobre", "entre", "ya", "tras",
  "este", "esta", "estos", "estas", "sin", "no", "si", "o", "u", "e",
]);

function significantWords(title) {
  return normalizeAccents(title)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

// Descarga y parsea TODOS los feeds RSS configurados en paralelo.
// Si un feed falla (URL caída, timeout...) lo ignoramos en vez de
// tumbar toda la función: es mejor mostrar contraste parcial que nada.
async function fetchAllFeeds() {
  return cached("rss:all", 900, async () => {
    const results = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        const parsed = await parser.parseURL(feed.url);
        return (parsed.items ?? []).map((item) => ({
          source: feed.source,
          title: (item.title ?? "").replace(/\s+/g, " ").trim(),
          link: item.link ?? "",
          publishedAt: item.isoDate ?? item.pubDate ?? null,
        }));
      })
    );

    return results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);
  });
}

// Dado el título de una noticia (normalmente la que el usuario está
// leyendo, venga de GNews), busca en los feeds RSS artículos de OTROS
// medios que probablemente traten el mismo tema, comparando cuántas
// "palabras significativas" comparten con el título original.
//
// Esto es una heurística simple (no NLP real) pero suficiente para un
// proyecto de este tamaño: es transparente, explicable, y no depende
// de ninguna API de pago para "entender" el texto.
export async function findRelatedCoverage(title, { minScore = 2, limit = 6 } = {}) {
  const targetWords = new Set(significantWords(title));
  if (targetWords.size === 0) return [];

  const allItems = await fetchAllFeeds();

  const scored = allItems
    .map((item) => {
      const itemWords = significantWords(item.title);
      const overlap = itemWords.filter((w) => targetWords.has(w)).length;
      return { ...item, score: overlap };
    })
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score);

  // Nos quedamos con la mejor coincidencia por medio, para no repetir
  // el mismo medio varias veces en el resultado de comparación.
  const bestPerSource = new Map();
  for (const item of scored) {
    if (!bestPerSource.has(item.source)) bestPerSource.set(item.source, item);
  }

  return [...bestPerSource.values()].slice(0, limit);
}
