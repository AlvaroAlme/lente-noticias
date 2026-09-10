import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// A diferencia de "Explicar sencillo" o "Analizar" (que el usuario pide
// bajo demanda), el resumen se pide automáticamente al abrir el
// artículo: es la primera pieza de contexto que cualquiera quiere leer,
// no algo opcional detrás de un botón.
export function ArticleSummary({ text }) {
  const [state, setState] = useState({ loading: true, paragraphs: [], error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, paragraphs: [], error: null });

    api
      .askAI("summarize", text)
      .then(({ result }) => {
        if (cancelled) return;
        const paragraphs = result.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
        setState({ loading: false, paragraphs, error: null });
      })
      .catch((err) => !cancelled && setState({ loading: false, paragraphs: [], error: err.message }));

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (state.loading) return <div className="summary-block muted">Generando resumen…</div>;
  if (state.error) return <p className="error">No se pudo generar el resumen: {state.error}</p>;

  return (
    <div className="summary-block">
      <span className="eyebrow">Resumen</span>
      {state.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
