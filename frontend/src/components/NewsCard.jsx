import { motion } from "framer-motion";
import { timeAgo } from "../utils/format.js";

// Una sola tarjeta con variantes de tamaño ("hero" | "wide" | "normal")
// en vez de un componente aparte para la destacada: así el mosaico
// editorial (ver Home.jsx) solo tiene que decidir qué tamaño le toca a
// cada noticia, sin duplicar el marcado ni el hover.
//
// "variants" (opcional) se recibe de Home.jsx para la animación de
// entrada escalonada del mosaico. Es importante que se aplique
// directamente sobre este elemento (el que lleva las clases de tamaño
// news-card-hero/wide/normal) y NO envolviéndolo en un <motion.div>
// aparte: CSS Grid solo respeta grid-column/grid-row en hijos DIRECTOS
// del contenedor grid, así que un wrapper intermedio haría que el
// "span" de la tarjeta destacada se ignorase silenciosamente (ocurrió
// de verdad: todas las tarjetas del mosaico ocupaban 1 sola columna).
export function NewsCard({ article, onOpen, size = "normal", variants }) {
  const ago = timeAgo(article.publishedAt);
  const isLarge = size === "hero" || size === "wide";

  return (
    <motion.article
      className={`news-card news-card-${size}`}
      variants={variants}
      onClick={() => onOpen(article)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {article.image && <img src={article.image} alt="" loading="lazy" />}
      <div className="news-card-body">
        <span className="byline">
          {article.source}
          {ago ? ` · ${ago}` : ""}
        </span>
        {isLarge ? <h2>{article.title}</h2> : <h3>{article.title}</h3>}
        <p>{article.description}</p>
      </div>
    </motion.article>
  );
}
