import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Home } from "./pages/Home.jsx";
import { Article } from "./pages/Article.jsx";

function formatToday() {
  return new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function App() {
  // Si ya estás en "/" y pulsas el nombre de la web, React Router no
  // remonta Home (misma ruta) y por tanto no se resetea la categoría
  // que tuvieras abierta. Cambiando la "key" forzamos ese remontaje
  // cada vez, así el logo siempre vuelve a la vista inicial de portada.
  const [homeKey, setHomeKey] = useState(0);

  // Si alguien deja la pestaña abierta de un día para otro sin recargar,
  // la fecha del cabecero se quedaría clavada en el día en que se cargó
  // la página. Se revisa cada minuto y solo se actualiza el estado
  // cuando el texto formateado realmente cambia (una vez al día).
  const [today, setToday] = useState(formatToday);
  useEffect(() => {
    const id = setInterval(() => {
      setToday((prev) => {
        const next = formatToday();
        return next === prev ? prev : next;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    // reducedMotion="user": si la persona tiene activado "reducir
    // movimiento" en su sistema operativo, framer-motion recorta
    // automáticamente todas las animaciones de la app a algo mínimo
    // (sin desactivar la lógica de transición en sí).
    <MotionConfig reducedMotion="user">
      <div className="app">
        <header className="masthead">
          <div className="masthead-inner">
            <Link to="/" className="masthead-brand" onClick={() => setHomeKey((k) => k + 1)}>
              <span className="masthead-mark" aria-hidden="true" />
              <div>
                <h1 className="masthead-title">Lente</h1>
                <p className="masthead-tagline">Para ver las noticias con más nitidez</p>
              </div>
            </Link>
            <time className="masthead-date">{today}</time>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home key={homeKey} />} />
            <Route path="/article" element={<Article />} />
          </Routes>
        </main>
      </div>
    </MotionConfig>
  );
}
