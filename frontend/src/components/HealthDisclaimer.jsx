import { Stethoscope } from "lucide-react";

export function HealthDisclaimer() {
  return (
    <p className="disclaimer">
      <Stethoscope size={16} strokeWidth={2.25} className="disclaimer-icon" />
      <span>
        <strong>Aviso:</strong> el contenido de esta sección es informativo y no sustituye
        el diagnóstico, consejo o tratamiento de un profesional sanitario. Ante cualquier
        duda o síntoma, consulta siempre a tu médico u otro profesional de la salud
        cualificado.
      </span>
    </p>
  );
}
