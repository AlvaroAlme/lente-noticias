import { Router } from "express";
import { getTopHeadlines, getLotteryNews, getAIDevNews, searchNews } from "../services/gnews.service.js";
import { findRelatedCoverage, getFeaturedBySource } from "../services/rss.service.js";
import { CATEGORIES } from "../config/feeds.js";

export const newsRouter = Router();

// Categorías que no existen como tal en GNews y se sirven con una
// búsqueda dedicada en vez de top-headlines (ver gnews.service.js).
const SPECIAL_CATEGORIES = {
  loteria: getLotteryNews,
  "ia-dev": getAIDevNews,
};

// IMPORTANTE: estas rutas de un solo segmento ("categories", "search",
// "periodicos") deben declararse ANTES de "/:category" — Express prueba
// las rutas en el orden en que se registran, y "/:category" acepta
// cualquier segmento único, así que si fuera primera capturaría estas
// peticiones como si "search"/"periodicos" fuesen el nombre de una
// categoría.

// GET /api/news/categories -> lista de categorías disponibles (para
// que el frontend construya las pestañas sin hardcodearlas dos veces).
newsRouter.get("/categories", (req, res) => {
  res.json(CATEGORIES);
});

// GET /api/news/search?q=... -> búsqueda libre en GNews (barra de
// búsqueda). A diferencia de las categorías, la query la escribe la
// persona usuaria.
newsRouter.get("/search", async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !String(q).trim()) {
      return res.status(400).json({ error: "Falta el parámetro 'q'" });
    }
    const articles = await searchNews(String(q));
    res.json(articles);
  } catch (err) {
    next(err);
  }
});

// GET /api/news/periodicos -> titulares más recientes de cada medio
// configurado en RSS_FEEDS, agrupados por cabecera (ver rss.service.js).
newsRouter.get("/periodicos", async (req, res, next) => {
  try {
    const groups = await getFeaturedBySource();
    res.json(groups);
  } catch (err) {
    next(err);
  }
});

// GET /api/news/:category -> titulares de esa categoría (vía GNews).
newsRouter.get("/:category", async (req, res, next) => {
  try {
    const { category } = req.params;
    const valid = CATEGORIES.some((c) => c.key === category);
    if (!valid) {
      return res.status(400).json({ error: `Categoría desconocida: ${category}` });
    }
    const fetcher = SPECIAL_CATEGORIES[category] ?? (() => getTopHeadlines(category));
    const articles = await fetcher();
    res.json(articles);
  } catch (err) {
    next(err);
  }
});

// GET /api/news/compare/coverage?title=... -> noticias de otros medios
// (vía RSS) que probablemente traten el mismo tema que ese título.
newsRouter.get("/compare/coverage", async (req, res, next) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: "Falta el parámetro 'title'" });
    }
    const coverage = await findRelatedCoverage(String(title));
    res.json(coverage);
  } catch (err) {
    next(err);
  }
});
