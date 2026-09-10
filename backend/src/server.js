import "dotenv/config";
import express from "express";
import cors from "cors";
import { newsRouter } from "./routes/news.routes.js";
import { factcheckRouter } from "./routes/factcheck.routes.js";
import { aiRouter } from "./routes/ai.routes.js";
import { marketsRouter } from "./routes/markets.routes.js";

const app = express();

// CORS: en desarrollo, el frontend (Vite, puerto 5173) y el backend
// (puerto 4000) viven en orígenes distintos, así que el navegador
// bloquearía las peticiones sin esta cabecera. En producción,
// CORS_ORIGIN se fija a la URL real del frontend desplegado.
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/news", newsRouter);
app.use("/api/factcheck", factcheckRouter);
app.use("/api/ai", aiRouter);
app.use("/api/markets", marketsRouter);

// Middleware de error centralizado: cualquier next(err) de las rutas
// termina aquí en vez de tumbar el servidor o dejar la petición colgada.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
