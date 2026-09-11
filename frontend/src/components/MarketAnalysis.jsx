import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Scale, TrendingUp, AlertTriangle, Eye } from "lucide-react";
import { api } from "../api/client.js";

const SIGNAL = {
  Oportunidad: {
    tone: "low",
    icon: TrendingUp,
    meaning: "Tendencia positiva sostenida en los últimos cierres.",
  },
  Precaución: {
    tone: "high",
    icon: AlertTriangle,
    meaning: "Caída o volatilidad notable: conviene vigilarlo de cerca.",
  },
  Vigilar: {
    tone: "medium",
    icon: Eye,
    meaning: "Sin una señal clara todavía, ni al alza ni a la baja.",
  },
};

export function MarketAnalysis() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    api
      .getMarketAnalysis()
      .then((data) => !cancelled && setState({ loading: false, data, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="market-analysis">
      <p className="disclaimer">
        <Scale size={16} strokeWidth={2.25} className="disclaimer-icon" />
        <span>
          <strong>Aviso:</strong> esta lectura la genera un modelo de IA a partir de datos
          públicos de cierre y tiene fines informativos/educativos. No es asesoramiento
          financiero ni una recomendación de compra o venta. Antes de invertir, consulta
          a un profesional cualificado.
        </span>
      </p>

      <ul className="signal-legend">
        {Object.entries(SIGNAL).map(([label, { tone, icon: Icon, meaning }]) => (
          <li key={label}>
            <span className="signal-chip" data-tone={tone}>
              <Icon size={12} strokeWidth={2.5} /> {label}
            </span>
            <span>{meaning}</span>
          </li>
        ))}
      </ul>

      {state.loading && <p className="muted">Analizando la sesión de mercado…</p>}
      {state.error && <p className="error">No se pudo generar el análisis: {state.error}</p>}

      {state.data && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <p className="market-overview">{state.data.marketOverview}</p>
          <ul className="opportunity-list">
            {state.data.opportunities.map((op, i) => {
              const { tone, icon: Icon } = SIGNAL[op.signal] ?? SIGNAL.Vigilar;
              return (
                <li key={i}>
                  <div className="opportunity-head">
                    <strong>{op.asset}</strong>
                    <span className="signal-chip" data-tone={tone}>
                      <Icon size={12} strokeWidth={2.5} /> {op.signal}
                    </span>
                  </div>
                  <p>{op.rationale}</p>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
