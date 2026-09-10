import { Router } from "express";
import { getMarketData } from "../services/markets.service.js";
import { analyzeMarkets } from "../services/gemini.service.js";
import { cached } from "../utils/cache.js";

export const marketsRouter = Router();

// GET /api/markets -> índices con su serie de cierres y variación diaria.
marketsRouter.get("/", async (req, res, next) => {
  try {
    const markets = await getMarketData();
    res.json(markets);
  } catch (err) {
    next(err);
  }
});

// GET /api/markets/analysis -> lectura de la IA sobre esos mismos datos.
// Va en su propio endpoint (no dentro de /api/markets) porque es una
// llamada a Gemini, más lenta que leer los datos de mercado, y así el
// frontend puede pintar los números al instante y el análisis después.
marketsRouter.get("/analysis", async (req, res, next) => {
  try {
    // Cacheado 1h aparte del propio dato de mercado (que se refresca
    // cada 30 min): no tiene sentido gastar una llamada a Gemini cada
    // vez que alguien visita la categoría de Economía.
    const analysis = await cached("markets:analysis", 3600, async () => {
      const markets = await getMarketData();
      return analyzeMarkets(markets);
    });
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});
