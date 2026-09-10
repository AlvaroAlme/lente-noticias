import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { api } from "../api/client.js";

// Muestra qué otros medios (vía RSS) parecen estar cubriendo la misma
// noticia que se está leyendo. Es el corazón de la función de
// "contraste de fuentes" pedida en el proyecto.
export function SourceComparison({ title }) {
  const [state, setState] = useState({ loading: true, items: [], error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, items: [], error: null });

    api
      .getCoverage(title)
      .then((items) => !cancelled && setState({ loading: false, items, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, items: [], error: err.message }));

    return () => {
      cancelled = true;
    };
  }, [title]);

  if (state.loading) return <p className="muted">Buscando cobertura en otros medios…</p>;
  if (state.error) return <p className="error">No se pudo cargar el contraste: {state.error}</p>;
  if (state.items.length === 0) {
    return <p className="muted">No se encontró cobertura similar en los medios monitorizados ahora mismo.</p>;
  }

  return (
    <ul className="coverage-list">
      {state.items.map((item) => (
        <li key={item.link}>
          <a href={item.link} target="_blank" rel="noreferrer">
            <strong>{item.source}</strong>
            <span>{item.title}</span>
            <ArrowUpRight size={14} className="coverage-link-icon" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}
