import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";

// Vive en el masthead (visible en toda la app). Al enviar, navega a
// /buscar?q=... en vez de filtrar en el sitio: así la búsqueda pide
// resultados reales a GNews (no solo lo que ya estuviera cargado en
// pantalla) y el resultado queda enlazable/compartible por URL.
export function SearchBar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  function handleSubmit(e) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    navigate(`/buscar?q=${encodeURIComponent(q)}`);
  }

  function handleClear() {
    setValue("");
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <Search size={15} strokeWidth={2.25} className="search-bar-icon" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar noticias…"
        aria-label="Buscar noticias"
      />
      {value && (
        <button type="button" className="search-bar-clear" onClick={handleClear} aria-label="Borrar búsqueda">
          <X size={14} strokeWidth={2.25} />
        </button>
      )}
    </form>
  );
}
