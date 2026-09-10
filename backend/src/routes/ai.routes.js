import { Router } from "express";
import {
  summarizeArticle,
  simplifyArticle,
  analyzeArticle,
} from "../services/gemini.service.js";

export const aiRouter = Router();

// Body esperado en las tres rutas: { "text": "..." }
// Usamos POST (no GET) porque el texto de un artículo puede superar
// cómodamente el límite práctico de una query string.

aiRouter.post("/summarize", async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Falta 'text' en el body" });
    const result = await summarizeArticle(text);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/simplify", async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Falta 'text' en el body" });
    const result = await simplifyArticle(text);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/analyze", async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Falta 'text' en el body" });
    const result = await analyzeArticle(text);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});
