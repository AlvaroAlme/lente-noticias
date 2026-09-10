import { Router } from "express";
import { searchClaims } from "../services/factcheck.service.js";

export const factcheckRouter = Router();

// GET /api/factcheck?query=... -> verificaciones ya publicadas por
// fact-checkers relacionadas con el texto dado (normalmente el titular).
factcheckRouter.get("/", async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Falta el parámetro 'query'" });
    }
    const claims = await searchClaims(String(query));
    res.json(claims);
  } catch (err) {
    next(err);
  }
});
