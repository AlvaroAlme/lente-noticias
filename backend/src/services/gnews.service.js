import { cached } from "../utils/cache.js";
import { isShoppingContent, isLotteryContent, isAIDevContent } from "../config/contentFilters.js";
import { upstreamError } from "../utils/upstreamError.js";

const GNEWS_BASE = "https://gnews.io/api/v4";

function requireApiKey() {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    throw new Error("Falta GNEWS_API_KEY en las variables de entorno");
  }
  return apiKey;
}

// Normalizamos la forma de cada artículo para que el frontend no tenga
// que saber nada sobre la forma específica de GNews (compartido entre
// top-headlines y search).
function normalizeArticles(rawArticles) {
  return rawArticles.map((a) => ({
    // Casi todos los artículos de GNews traen "url", pero si alguna vez
    // faltase (entrada mal formada), usar undefined como key de React
    // provocaría colisiones/renderizados erróneos en la lista.
    id: a.url || `${a.title ?? "sin-titulo"}-${a.publishedAt ?? ""}`,
    title: a.title,
    description: a.description,
    content: a.content,
    url: a.url,
    image: a.image,
    publishedAt: a.publishedAt,
    source: a.source?.name ?? "Desconocido",
  }));
}

// Trae los titulares de una categoría desde GNews.
// Documentación: https://gnews.io/docs/v4#top-headlines-endpoint
//
// Parámetros que usamos:
// - category: general | business | technology | entertainment | sports | science | health
// - lang=es y country=es: priorizamos noticias en español de España.
// - max=10: número de artículos (el free tier permite hasta 10 por request).
export async function getTopHeadlines(category) {
  const cacheKey = `gnews:${category}`;

  // TTL de 30 min: con 9 categorías, si cada una se refresca cada 30 min,
  // en el peor caso consumimos ~55 requests/día, muy por debajo del
  // límite de 100/día, incluso con tráfico simultáneo de varios usuarios.
  return cached(cacheKey, 1800, async () => {
    const apiKey = requireApiKey();

    const url = new URL(`${GNEWS_BASE}/top-headlines`);
    url.searchParams.set("category", category);
    url.searchParams.set("lang", "es");
    url.searchParams.set("country", "es");
    url.searchParams.set("max", "10");
    url.searchParams.set("apikey", apiKey);

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw upstreamError("GNews", `HTTP ${res.status}: ${body}`);
    }

    const data = await res.json();
    const articles = normalizeArticles(data.articles);

    // Filtramos dos tipos de contenido que GNews mezcla con noticias
    // reales (ver contentFilters.js):
    // - "guía de compra"/afiliados: no es noticia, es publicidad.
    // - resultados de loterías: sí interesan, pero tienen su propia
    //   categoría ("loteria", más abajo) en vez de mezclarse aquí.
    return articles.filter((a) => !isShoppingContent(a) && !isLotteryContent(a));
  });
}

// Helper compartido por las categorías que no existen como tal en GNews
// (loterías, IA y desarrollo): en vez de top-headlines, usamos búsqueda
// por palabras clave y cacheamos igual que el resto.
// Docs: https://gnews.io/docs/v4#search-endpoint
async function searchGNews(cacheKey, query) {
  return cached(cacheKey, 1800, async () => {
    const apiKey = requireApiKey();

    const url = new URL(`${GNEWS_BASE}/search`);
    url.searchParams.set("q", query);
    url.searchParams.set("lang", "es");
    url.searchParams.set("country", "es");
    url.searchParams.set("max", "10");
    url.searchParams.set("sortby", "publishedAt");
    url.searchParams.set("apikey", apiKey);

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw upstreamError("GNews", `HTTP ${res.status}: ${body}`);
    }

    const data = await res.json();
    return normalizeArticles(data.articles);
  });
}

// GNews no tiene una categoría de "loterías". Para darle a este contenido
// su propio espacio en vez de mezclarlo con noticias reales, buscamos por
// los nombres de los principales sorteos españoles.
export async function getLotteryNews() {
  const articles = await searchGNews(
    "gnews:loteria",
    '"ONCE" OR "Bonoloto" OR "Primitiva" OR "Euromillones" OR "Lotería Nacional"'
  );

  // La búsqueda por "ONCE" es ambigua: también es la palabra española
  // para el número 11 ("el once titular" de un equipo de fútbol), así
  // que el buscador trae ruido que nada tiene que ver con la lotería.
  // Reutilizamos el mismo filtro de patrones que usamos para SACAR estas
  // noticias de "general"/"business", pero aquí en sentido inverso: solo
  // nos quedamos con lo que sí encaja como lotería.
  return articles.filter((a) => isLotteryContent(a) && !isShoppingContent(a));
}

// Búsqueda libre para la barra de búsqueda: a diferencia de las
// categorías especiales (loterías, IA y desarrollo), aquí la query la
// escribe la persona usuaria, así que solo filtramos afiliados/guías de
// compra — NO lotería, porque si alguien busca explícitamente
// "bonoloto" sí queremos devolvérsela (para eso está buscando).
export async function searchNews(query) {
  const normalized = query.trim().toLowerCase();
  const articles = await searchGNews(`gnews:search:${normalized}`, query.trim());
  return articles.filter((a) => !isShoppingContent(a));
}

// Igual que loterías: "IA y desarrollo" tampoco es una categoría de GNews,
// así que buscamos por herramientas/términos concretos de IA aplicada a
// programación (no "inteligencia artificial" a secas, que traería ruido
// de IA en sanidad, regulación, robótica...).
export async function getAIDevNews() {
  const articles = await searchGNews(
    "gnews:ia-dev",
    '"vibe coding" OR "GitHub Copilot" OR "Claude Code" OR "Cursor AI" OR "programación con inteligencia artificial" OR "desarrollo de software con IA" OR "asistente de código IA"'
  );

  // El filtro post-búsqueda exige que el texto combine vocabulario de IA
  // con vocabulario de programación (ver contentFilters.js), por si el
  // buscador de GNews trae algo solo parcialmente relacionado.
  return articles.filter((a) => isAIDevContent(a) && !isShoppingContent(a));
}
