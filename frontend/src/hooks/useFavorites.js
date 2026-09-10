import { useEffect, useState } from "react";

const STORAGE_KEY = "noticias:favoritos";

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    // localStorage puede fallar (modo privado, cuota, etc.): degradamos
    // a "sin favoritos" en vez de romper la app.
    return new Set();
  }
}

// Favoritos vive solo en el navegador de cada persona (localStorage):
// no hay cuentas de usuario en este proyecto, así que no hay backend
// al que persistir esto. Es una preferencia local, no un dato compartido.
export function useFavorites() {
  const [favorites, setFavorites] = useState(loadFavorites);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
    } catch {
      // Si no se puede guardar, la sesión sigue funcionando en memoria.
    }
  }, [favorites]);

  function toggleFavorite(categoryKey) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) next.delete(categoryKey);
      else next.add(categoryKey);
      return next;
    });
  }

  return { favorites, toggleFavorite };
}
