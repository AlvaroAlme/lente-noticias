// Lista curada de feeds RSS usados para el CONTRASTE DE FUENTES.
// GNews ya nos da noticias por categoría; estos feeds sirven para buscar
// si otros medios cubrieron la misma noticia (comparación de cobertura).
//
// IMPORTANTE: las URLs de RSS de los medios cambian de vez en cuando.
// Si un feed deja de responder, el servicio lo ignora (ver rss.service.js)
// y sigue funcionando con el resto — conviene revisar esta lista cada
// cierto tiempo con una herramienta como https://validator.w3.org/feed/.
export const RSS_FEEDS = [
  { source: "El País", url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada" },
  { source: "El Mundo", url: "https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml" },
  { source: "ABC", url: "https://www.abc.es/rss/2.0/portada/" },
  { source: "La Vanguardia", url: "https://www.lavanguardia.com/rss/home.xml" },
  { source: "20minutos", url: "https://www.20minutos.es/rss" },
  { source: "elDiario.es", url: "https://www.eldiario.es/rss/" },
  { source: "BBC Mundo", url: "https://feeds.bbci.co.uk/mundo/rss.xml" },
];

// Categorías soportadas por GNews (top-headlines): general, world, nation,
// business, technology, entertainment, sports, science, health.
// Las mapeamos a etiquetas en español para el frontend.
//
// "loteria" e "ia-dev" son categorías especiales que NO vienen de GNews
// top-headlines (GNews no tiene esos conceptos): se sirven mediante una
// búsqueda específica en vez de por categoría fija (ver gnews.service.js:
// getLotteryNews / getAIDevNews).
export const CATEGORIES = [
  { key: "general", label: "Portada" },
  { key: "business", label: "Economía" },
  { key: "technology", label: "Tecnología" },
  { key: "ia-dev", label: "IA y desarrollo" },
  { key: "entertainment", label: "Entretenimiento" },
  { key: "sports", label: "Deportes" },
  { key: "science", label: "Ciencia" },
  { key: "health", label: "Salud" },
  { key: "loteria", label: "Loterías" },
];
