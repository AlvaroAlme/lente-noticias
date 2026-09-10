import { useEffect, useState } from "react";
import { LineChart } from "lucide-react";
import { api } from "../api/client.js";
import { MarketTile } from "./MarketTile.jsx";
import { MarketAnalysis } from "./MarketAnalysis.jsx";

// Panel de mercados que se muestra solo en la categoría "Economía": los
// números (rápidos) se piden aparte del análisis de IA (más lento), así
// que cada uno tiene su propio estado de carga y no se bloquean entre sí.
export function MarketsPanel() {
  const [state, setState] = useState({ loading: true, markets: [], error: null });

  useEffect(() => {
    let cancelled = false;
    api
      .getMarkets()
      .then((markets) => !cancelled && setState({ loading: false, markets, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, markets: [], error: err.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="markets-panel">
      <h2 className="signal-heading">
        <LineChart size={14} strokeWidth={2.5} aria-hidden="true" /> Mercados
      </h2>
      <p className="section-hint">
        Seguimiento vía ETFs cotizados que replican cada mercado (no el índice en directo)
      </p>

      {state.loading && <p className="muted">Cargando cotizaciones…</p>}
      {state.error && <p className="error">No se pudieron cargar los mercados: {state.error}</p>}

      {state.markets.length > 0 && (
        <div className="markets-grid">
          {state.markets.map((m) => (
            <MarketTile key={m.key} market={m} />
          ))}
        </div>
      )}

      <MarketAnalysis />
    </section>
  );
}
