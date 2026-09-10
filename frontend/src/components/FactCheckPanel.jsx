import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { api } from "../api/client.js";

const TONE_ICON = { true: CheckCircle2, false: XCircle };

// Los publishers usan texto libre para el veredicto ("Falso", "False",
// "Cierto", "Engañoso"...). No intentamos cubrir todos los casos, solo
// detectar los dos extremos más comunes para dar una pista de color;
// cualquier otro texto se queda en el tono neutro (ámbar).
function ratingTone(rating) {
  // "?? \"\"" (no un valor por defecto del parámetro) porque un
  // textualRating explícitamente null desde la API rompería un default
  // de parámetro, que solo actúa sobre "undefined".
  const r = (rating ?? "").toLowerCase();
  if (/(falso|false|incorrecto|bulo)/.test(r)) return "false";
  if (/(verdadero|cierto|true|correcto)/.test(r)) return "true";
  return undefined;
}

export function FactCheckPanel({ query }) {
  const [state, setState] = useState({ loading: true, claims: [], error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, claims: [], error: null });

    api
      .getFactChecks(query)
      .then((claims) => !cancelled && setState({ loading: false, claims, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, claims: [], error: err.message }));

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (state.loading) return <p className="muted">Consultando Google Fact Check…</p>;
  if (state.error) return <p className="error">No se pudo consultar fact-checking: {state.error}</p>;
  if (state.claims.length === 0) {
    return (
      <p className="muted">
        No hay verificaciones publicadas sobre esta afirmación (esto no confirma
        que sea cierta, solo que aún nadie la ha verificado).
      </p>
    );
  }

  return (
    <ul className="claims-list">
      {state.claims.map((claim, i) => (
        <li key={i}>
          <p className="claim-text">&ldquo;{claim.text}&rdquo;</p>
          {claim.reviews.map((review, j) => {
            const tone = ratingTone(review.rating);
            const Icon = TONE_ICON[tone] ?? HelpCircle;
            return (
              <a key={j} href={review.url} target="_blank" rel="noreferrer" className="claim-review">
                <span className="claim-rating" data-tone={tone}>
                  <Icon size={12} strokeWidth={2.5} /> {review.rating}
                </span>
                <span>verificado por {review.publisher}</span>
              </a>
            );
          })}
        </li>
      ))}
    </ul>
  );
}
