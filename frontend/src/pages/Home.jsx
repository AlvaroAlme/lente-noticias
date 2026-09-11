import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../api/client.js";
import { CategoryTabs } from "../components/CategoryTabs.jsx";
import { NewsCard } from "../components/NewsCard.jsx";
import { MosaicSkeleton, NewsGridSkeleton } from "../components/Skeleton.jsx";
import { HealthDisclaimer } from "../components/HealthDisclaimer.jsx";
import { MarketsPanel } from "../components/MarketsPanel.jsx";
import { useFavorites } from "../hooks/useFavorites.js";
import { CATEGORY_ICONS } from "../config/categoryIcons.js";

// Primera noticia a toda plancha, la segunda algo más grande que el
// resto: un mosaico editorial en vez del típico grid uniforme de
// tarjetas idénticas de cualquier agregador de noticias.
function sizeFor(index) {
  if (index === 0) return "hero";
  if (index === 1) return "wide";
  return "normal";
}

const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: "easeIn" } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

export function Home() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState(null);
  const [state, setState] = useState({ loading: true, articles: [], error: null });
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Primera visita: si hay favoritos guardados, arrancamos directamente
  // en "Tu enfoque"; si no, en la portada general. Solo se decide una
  // vez, al montar (después el usuario cambia de pestaña libremente).
  useEffect(() => {
    if (active === null) setActive(favorites.size > 0 ? "foryou" : "general");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el usuario se queda sin favoritos mientras está viendo "Tu
  // enfoque" (desmarca el último), esa pestaña desaparece de
  // CategoryTabs y "active" se queda apuntando a un modo que ya no
  // existe en la navegación. Lo devolvemos a portada general.
  useEffect(() => {
    if (active === "foryou" && favorites.size === 0) setActive("general");
  }, [active, favorites]);

  // Modo categoría única (comportamiento original). Cada artículo se
  // etiqueta con su categoría: así el detalle (Article.jsx) sabe, por
  // ejemplo, si debe mostrar el aviso de salud, sin tener que volver a
  // pedir nada al backend.
  useEffect(() => {
    if (!active || active === "foryou") return;
    let cancelled = false;
    setState({ loading: true, articles: [], error: null });

    api
      .getNewsByCategory(active)
      .then(
        (articles) =>
          !cancelled &&
          setState({ loading: false, articles: articles.map((a) => ({ ...a, category: active })), error: null })
      )
      .catch((err) => !cancelled && setState({ loading: false, articles: [], error: err.message }));

    return () => {
      cancelled = true;
    };
  }, [active]);

  // Modo "Tu enfoque": pedimos, en paralelo, los titulares de cada
  // categoría marcada como favorita — pero cada sección se actualiza EN
  // CUANTO llega su respuesta, en vez de esperar con Promise.all a que
  // lleguen todas: si una categoría va lenta, no debe retener en
  // pantalla las que ya están listas.
  useEffect(() => {
    if (active !== "foryou") return;
    let cancelled = false;

    const favKeys = [...favorites];
    setGroups(
      favKeys.map((key) => ({
        key,
        label: categories.find((c) => c.key === key)?.label ?? key,
        loading: true,
        articles: [],
        error: null,
      }))
    );

    favKeys.forEach((key) => {
      api
        .getNewsByCategory(key)
        .then((articles) => {
          if (cancelled) return;
          setGroups((prev) =>
            prev.map((g) =>
              g.key === key
                ? { ...g, loading: false, articles: articles.map((a) => ({ ...a, category: key })) }
                : g
            )
          );
        })
        .catch((err) => {
          if (cancelled) return;
          setGroups((prev) => prev.map((g) => (g.key === key ? { ...g, loading: false, error: err.message } : g)));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [active, favorites, categories]);

  function openArticle(article) {
    navigate("/article", { state: { article } });
  }

  return (
    <div className="page page-home">
      <CategoryTabs
        categories={categories}
        active={active}
        onSelect={setActive}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

      {active === "health" && <HealthDisclaimer />}
      {active === "business" && <MarketsPanel />}

      {/* mode="wait": la vista saliente termina de desvanecerse antes de
          que entre la nueva, para que el cambio de categoría se lea como
          una transición y no como un parpadeo de contenido. */}
      <AnimatePresence mode="wait">
        {active === "foryou" ? (
          <motion.div key="foryou" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
            {groups.map((group) => {
              const Icon = CATEGORY_ICONS[group.key];
              return (
                <section key={group.key} className="signal-section">
                  <h2 className="signal-heading">
                    {Icon && <Icon size={14} strokeWidth={2.5} aria-hidden="true" />}
                    {group.label}
                  </h2>
                  {group.loading && <NewsGridSkeleton count={3} />}
                  {group.error && <p className="error">No se pudo cargar {group.label}: {group.error}</p>}
                  {!group.loading && !group.error && (
                    <div className="news-grid">
                      {group.articles.slice(0, 3).map((article) => (
                        <NewsCard key={article.id} article={article} onOpen={openArticle} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </motion.div>
        ) : (
          <motion.div key={active} variants={fadeVariants} initial="initial" animate="animate" exit="exit">
            {state.loading && <MosaicSkeleton />}
            {state.error && <p className="error">Error al cargar noticias: {state.error}</p>}
            {!state.loading && !state.error && (
              <motion.div className="news-mosaic" variants={stagger} initial="initial" animate="animate">
                {state.articles.map((article, i) => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    onOpen={openArticle}
                    size={sizeFor(i)}
                    variants={fadeVariants}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
