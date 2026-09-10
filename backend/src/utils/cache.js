import NodeCache from "node-cache";

// Caché en memoria compartida por todo el backend.
// stdTTL en segundos: tiempo de vida por defecto de cada entrada.
//
// Por qué hace falta: GNews free tier = 100 requests/día. Si cada visita
// a la web disparase una llamada nueva a GNews, esa cuota se agotaría en
// minutos con un puñado de usuarios. Con esta caché, la primera persona
// que pide "tecnología" hoy dispara la llamada real; el resto de visitas
// durante los próximos 30 minutos reciben la respuesta guardada aquí,
// sin gastar cuota.
export const cache = new NodeCache({ stdTTL: 1800, checkperiod: 120 });

// Peticiones "en vuelo" por key: si dos requests llegan a la vez con la
// caché vacía (ej. dos usuarios abriendo "tecnología" en el mismo
// segundo), la segunda no debe disparar su propia llamada a GNews —
// debe esperar el resultado de la que ya está en curso. Sin esto, el
// cálculo de cuota documentado en gnews.service.js (una llamada real por
// ventana de caché) se rompe en cuanto hay tráfico simultáneo.
const pending = new Map();

// Envuelve una función asíncrona "productora de datos" con caché:
// si la key existe y no ha caducado, devuelve el valor cacheado; si no,
// ejecuta fetcher() (compartiendo la misma llamada entre peticiones
// concurrentes) y guarda el resultado.
export async function cached(key, ttlSeconds, fetcher) {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const inFlight = pending.get(key);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const value = await fetcher();
      cache.set(key, value, ttlSeconds);
      return value;
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, promise);
  return promise;
}
