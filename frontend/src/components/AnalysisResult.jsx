import { Flag, Smile, Frown, Minus, Megaphone } from "lucide-react";

const BIAS_FILL = { Bajo: 33, Medio: 66, Alto: 100 };

const TONE_ICON = {
  Neutral: Minus,
  Positivo: Smile,
  Negativo: Frown,
  Sensacionalista: Megaphone,
};

// Panel de "lectura rápida": tres marcas visuales (tono, medidor de
// sesgo, bandera de connotación política) para que se pueda evaluar
// una noticia de un vistazo, antes de leer la explicación completa.
export function AnalysisResult({ data }) {
  const ToneIcon = TONE_ICON[data.tone] ?? Minus;

  return (
    <div className="analysis">
      <div className="analysis-verdict">
        <div className="verdict-item">
          <span className="eyebrow">Tono</span>
          <span className="tone-chip">
            <ToneIcon size={13} strokeWidth={2.5} /> {data.tone}
          </span>
        </div>

        <div className="verdict-item">
          <span className="eyebrow">Nivel de sesgo</span>
          <div className="bias-meter" data-level={data.biasLevel}>
            <span className="bias-meter-fill" style={{ width: `${BIAS_FILL[data.biasLevel] ?? 33}%` }} />
          </div>
          <span className="bias-meter-label" data-level={data.biasLevel}>{data.biasLevel}</span>
        </div>

        <div className="verdict-item">
          <span className="eyebrow">Connotación política</span>
          <span className={data.hasPoliticalConnotation ? "flag-chip flag-chip-active" : "flag-chip"}>
            <Flag size={13} strokeWidth={2.5} fill={data.hasPoliticalConnotation ? "currentColor" : "none"} />
            {data.hasPoliticalConnotation ? "Sí" : "Sin detectar"}
          </span>
        </div>
      </div>

      <div className="analysis-body">
        <p><strong>Tono.</strong> {data.toneExplanation}</p>
        <p><strong>Contexto faltante.</strong> {data.missingContext}</p>
        <p><strong>Posible sesgo.</strong> {data.biasExplanation}</p>
        {data.hasPoliticalConnotation && (
          <p><strong>Connotación política.</strong> {data.politicalExplanation}</p>
        )}
      </div>
    </div>
  );
}
