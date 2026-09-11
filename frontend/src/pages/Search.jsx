import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import { api } from "../api/client.js";
import { NewsCard } from "../components/NewsCard.jsx";
import { NewsGridSkeleton } from "../components/Skeleton.jsx";

export function Search() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const [state, setState] = useState({ loading: true, articles: [], error: null });

  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    setState({ loading: true, articles: [], error: null });

    api
      .searchNews(q)
      .then((articles) => !cancelled && setState({ loading: false, articles, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, articles: [], error: err.message }));

    return () => {
      cancelled = true;
    };
  }, [q]);

  function openArticle(article) {
    navigate("/article", { state: { article } });
  }

  return (
    <div className="page page-home">
      <p className="eyebrow">Resultados de búsqueda</p>
      <h1 className="search-heading">"{q}"</h1>

      {state.loading && <NewsGridSkeleton />}
      {state.error && <p className="error">No se pudo buscar: {state.error}</p>}

      {!state.loading && !state.error && state.articles.length === 0 && (
        <div className="search-empty">
          <SearchX size={28} strokeWidth={1.75} aria-hidden="true" />
          <p>No se encontraron noticias para "{q}". Prueba con otras palabras.</p>
        </div>
      )}

      {!state.loading && state.articles.length > 0 && (
        <motion.div
          className="news-grid"
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
        >
          {state.articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onOpen={openArticle}
              variants={{
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
