import { cached } from "../utils/cache.js";
import { upstreamError } from "../utils/upstreamError.js";

const FACTCHECK_BASE = "https://factchecktools.googleapis.com/v1alpha1/claims:search";

// Busca "claims" (afirmaciones) ya verificadas por fact-checkers
// registrados en Google Fact Check Tools (ej. Maldita.es, Newtral,
// AFP Factual...) relacionadas con una query de texto.
//
// Docs: https://developers.google.com/fact-check/tools/api/reference/rest/v1alpha1/claims/search
//
// Importante para tu defensa: esto NO es Google verificando la noticia
// con IA. Es una BÚSQUEDA sobre una base de datos de verificaciones que
// YA publicaron organizaciones de fact-checking humanas. Si nadie ha
// verificado esa afirmación todavía, la API simplemente no devuelve
// resultados — no hay "no hay bulos" garantizado, solo "no encontrado".
export async function searchClaims(query) {
  const cacheKey = `factcheck:${query}`;

  return cached(cacheKey, 3600, async () => {
    const apiKey = process.env.FACTCHECK_API_KEY;
    if (!apiKey) {
      throw new Error("Falta FACTCHECK_API_KEY en las variables de entorno");
    }

    const url = new URL(FACTCHECK_BASE);
    url.searchParams.set("query", query);
    url.searchParams.set("languageCode", "es");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw upstreamError("Fact Check", `HTTP ${res.status}: ${body}`);
    }

    const data = await res.json();

    if (!data.claims) return [];

    return data.claims.map((claim) => ({
      text: claim.text,
      claimant: claim.claimant ?? "Desconocido",
      reviews: (claim.claimReview ?? []).map((review) => ({
        publisher: review.publisher?.name ?? "Desconocido",
        url: review.url,
        rating: review.textualRating,
        reviewDate: review.reviewDate,
      })),
    }));
  });
}
