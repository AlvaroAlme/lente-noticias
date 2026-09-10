// Índices que se muestran en el panel de Economía.
//
// IMPORTANTE (confirmado contra la API real): el plan free de Twelve
// Data NO da acceso a índices en directo (SPX, NDX...) ni a bolsas
// europeas (BME) — solo a instrumentos cotizados en mercados de EEUU.
// Los símbolos de índice "de calle" (IBEX, SPX, NDX, STOXX50E) o bien
// resuelven a un ticker sin relación (IBEX colisiona con una acción de
// Nasdaq) o devuelven 404 pidiendo plan de pago.
//
// Solución: usamos ETFs cotizados en EEUU que replican cada mercado.
// No son el índice exacto (tienen una pequeña diferencia por comisiones
// y tracking error), pero es una aproximación estándar y de uso común
// para seguir la tendencia de un mercado sin pagar un plan premium.
export const MARKET_SYMBOLS = [
  { key: "ibex", label: "Bolsa española (MSCI Spain)", symbol: "EWP" },
  { key: "sp500", label: "S&P 500", symbol: "SPY" },
  { key: "nasdaq", label: "Nasdaq 100", symbol: "QQQ" },
  { key: "eurostoxx", label: "Euro Stoxx 50", symbol: "FEZ" },
];
