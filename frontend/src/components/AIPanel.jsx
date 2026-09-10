import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, ScanSearch, Loader2 } from "lucide-react";
import { api } from "../api/client.js";
import { AnalysisResult } from "./AnalysisResult.jsx";

// El resumen ya no vive aquí: se pide automáticamente al abrir el
// artículo (ver ArticleSummary). Aquí quedan solo los dos modos que
// tiene sentido pedir bajo demanda.
const MODES = [
  { key: "simplify", label: "Explicar sencillo", icon: Wand2 },
  { key: "analyze", label: "Analizar sesgo y tono", icon: ScanSearch },
];

export function AIPanel({ text }) {
  const [activeMode, setActiveMode] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Token de la petición en curso: si el componente se desmonta (el
  // usuario navega a otro artículo) antes de que Gemini responda, o si
  // en algún momento se permitiera lanzar dos peticiones seguidas, la
  // respuesta obsoleta no debe pisar el estado de una más reciente.
  const requestId = useRef(0);
  useEffect(() => () => {
    requestId.current += 1;
  }, []);

  async function handleClick(mode) {
    const id = ++requestId.current;
    setActiveMode(mode);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { result } = await api.askAI(mode, text);
      if (id !== requestId.current) return;
      setResult(result);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  return (
    <div className="ai-panel">
      <div className="ai-buttons">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={activeMode === m.key ? "ai-btn ai-btn-active" : "ai-btn"}
            onClick={() => handleClick(m.key)}
            disabled={loading}
          >
            <m.icon size={15} strokeWidth={2.25} />
            {m.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {loading && (
          <motion.p
            key="loading"
            className="muted ai-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 size={14} className="spin" /> Generando con Gemini…
          </motion.p>
        )}
        {error && <p className="error">Error: {error}</p>}
        {result && activeMode === "analyze" && (
          <motion.div key="analyze" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <AnalysisResult data={result} />
          </motion.div>
        )}
        {result && activeMode === "simplify" && (
          <motion.p
            key="simplify"
            className="ai-result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {result}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
