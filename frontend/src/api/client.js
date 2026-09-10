// Todas las llamadas al backend pasan por aquí. Centralizar el fetch
// evita repetir la URL base y el manejo de errores en cada componente.
const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      // Salta la página de aviso de localtunnel (solo relevante cuando
      // VITE_API_URL apunta a un túnel *.loca.lt para compartir en local;
      // en producción, contra Render, esta cabecera no tiene efecto).
      "bypass-tunnel-reminder": "true",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCategories: () => request("/api/news/categories"),
  getNewsByCategory: (category) => request(`/api/news/${category}`),
  getCoverage: (title) =>
    request(`/api/news/compare/coverage?title=${encodeURIComponent(title)}`),
  getFactChecks: (query) =>
    request(`/api/factcheck?query=${encodeURIComponent(query)}`),
  askAI: (mode, text) =>
    request(`/api/ai/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }),
  getMarkets: () => request("/api/markets"),
  getMarketAnalysis: () => request("/api/markets/analysis"),
};
