import { cached } from "../utils/cache.js";
import { MARKET_SYMBOLS } from "../config/markets.js";
import { upstreamError } from "../utils/upstreamError.js";

const TWELVEDATA_BASE = "https://api.twelvedata.com";

// Trae la serie de los últimos 8 cierres diarios de un índice. Con eso
// nos vale para: (a) dibujar el sparkline, (b) calcular la variación de
// hoy (último cierre vs. el anterior) y (c) darle a la IA algo de
// contexto de tendencia, no solo el dato de un día suelto.
async function fetchSeries(symbol, apiKey) {
  const url = new URL(`${TWELVEDATA_BASE}/time_series`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", "1day");
  url.searchParams.set("outputsize", "8");
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url);
  const data = await res.json();

  // Twelve Data devuelve 200 OK con { status: "error", message: "..." }
  // en vez de un código HTTP de error cuando el símbolo no existe o se
  // agota la cuota, así que hay que comprobar el body, no solo res.ok.
  if (!res.ok || data.status === "error") {
    throw upstreamError("Twelve Data", `${symbol}: ${data.message ?? res.status}`);
  }

  if (!data.values || data.values.length === 0) {
    throw upstreamError("Twelve Data", `${symbol}: values vacío`);
  }

  // Twelve Data devuelve los valores más recientes primero; los damos
  // la vuelta para que el sparkline se dibuje en orden cronológico.
  return [...data.values].reverse().map((v) => ({
    date: v.datetime,
    close: Number(v.close),
  }));
}

// Trae los 4 índices en paralelo y calcula la variación diaria de cada
// uno. Cacheado 30 min: con 4 símbolos y un refresco cada 30 min, el
// consumo máximo son ~192 peticiones/día, muy por debajo del límite de
// 800/día del free tier de Twelve Data.
//
// Usamos allSettled (no Promise.all) a propósito: si un solo símbolo
// falla (ticker renombrado, hueco de datos puntual...) no debe tumbar
// el panel entero — mismo criterio que rss.service.js con los feeds.
export async function getMarketData() {
  return cached("markets:all", 1800, async () => {
    const apiKey = process.env.TWELVEDATA_API_KEY;
    if (!apiKey) {
      throw new Error("Falta TWELVEDATA_API_KEY en las variables de entorno");
    }

    const results = await Promise.allSettled(
      MARKET_SYMBOLS.map(async ({ key, label, symbol }) => {
        const series = await fetchSeries(symbol, apiKey);
        const latest = series.at(-1);
        const previous = series.at(-2);
        const changePercent = previous
          ? ((latest.close - previous.close) / previous.close) * 100
          : 0;

        return { key, label, symbol, series, latest: latest.close, changePercent };
      })
    );

    for (const r of results) {
      if (r.status === "rejected") console.error("markets.service:", r.reason.message);
    }

    const markets = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

    // Si TODOS los símbolos fallan (clave inválida, cuota agotada...) no
    // devolvemos un array vacío: cached() lo trataría como un resultado
    // válido y lo guardaría 30 minutos, dejando el panel en blanco sin
    // ningún mensaje de error durante ese tiempo.
    if (markets.length === 0) {
      throw new Error("No se pudo obtener ningún dato de mercado");
    }

    return markets;
  });
}
