const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

// Convierte una fecha ISO en algo tipo "hace 3 h" para el byline de cada
// noticia, en vez de mostrar una marca de tiempo completa poco legible.
export function timeAgo(isoDate) {
  if (!isoDate) return null;
  const diffMs = new Date(isoDate).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);

  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return rtf.format(diffH, "hour");
  const diffD = Math.round(diffH / 24);
  return rtf.format(diffD, "day");
}
