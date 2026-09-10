// Compartido por contentFilters.js (detección de afiliados/lotería/IA-dev)
// y rss.service.js (comparación de titulares): minúsculas + quitar tildes,
// para que "café" y "cafe" (o "Política" y "politica") cuenten como la
// misma palabra al comparar texto. Una sola implementación evita que las
// dos fuentes de matching diverjan si algún día se ajusta este detalle.
export function normalizeAccents(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
