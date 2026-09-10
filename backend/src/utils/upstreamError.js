// Los mensajes de error de las APIs externas (GNews, Fact Check, Gemini,
// Twelve Data) pueden incluir texto interno de esa API (detalles de
// cuota, mensajes de depuración...) que no deberíamos reenviar tal cual
// al navegador de cualquier visitante. Lo registramos en el log del
// servidor (para poder depurar) y devolvemos al cliente un mensaje
// genérico y seguro.
export function upstreamError(service, detail) {
  console.error(`[${service}]`, detail);
  return new Error(`${service} no está disponible en este momento`);
}
