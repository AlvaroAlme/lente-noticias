import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Sparkles, Newspaper, ShieldCheck } from "lucide-react";
import { SourceComparison } from "../components/SourceComparison.jsx";
import { FactCheckPanel } from "../components/FactCheckPanel.jsx";
import { AIPanel } from "../components/AIPanel.jsx";
import { ArticleSummary } from "../components/ArticleSummary.jsx";
import { HealthDisclaimer } from "../components/HealthDisclaimer.jsx";
import { timeAgo } from "../utils/format.js";

export function Article() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const article = state?.article;

  // Si el usuario recarga la página directamente en /article (sin pasar
  // por Home), no tenemos el artículo en memoria: es una limitación
  // conocida de guardar el estado en la navegación en vez de en la URL.
  // La solución simple: devolver a Home en vez de romper la página.
  if (!article) {
    return (
      <div className="page">
        <p>No se encontró el artículo (¿recargaste la página?).</p>
        <button onClick={() => navigate("/")}>Volver a portada</button>
      </div>
    );
  }

  // Texto que se manda a Gemini y se usa para las búsquedas de contraste
  // y fact-check: preferimos el contenido si existe, si no la descripción.
  // El "content" del free tier de GNews viene truncado con un sufijo
  // literal tipo "[+1234 chars]" — hay que quitarlo, o ese texto (que no
  // es parte de la noticia) acaba colándose en el prompt de la IA.
  const cleanContent = article.content?.replace(/\s*\[\+\d+ chars\]\s*$/, "");
  const fullText = cleanContent || article.description || article.title;

  const ago = timeAgo(article.publishedAt);

  return (
    <motion.div
      className="page article-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Link to="/" className="back-link">
        <ArrowLeft size={14} strokeWidth={2.25} /> Volver a portada
      </Link>

      {article.image && <img className="article-hero" src={article.image} alt="" />}
      <span className="byline">
        {article.source}
        {ago ? ` · ${ago}` : ""}
      </span>
      <h1>{article.title}</h1>
      <p className="article-description">{article.description}</p>

      {article.category === "health" && <HealthDisclaimer />}

      <ArticleSummary text={fullText} />

      <a href={article.url} target="_blank" rel="noreferrer" className="original-link">
        Leer noticia completa en {article.source} <ArrowUpRight size={14} strokeWidth={2.5} />
      </a>

      <section>
        <h2><Sparkles size={18} strokeWidth={2.25} aria-hidden="true" /> Lectura crítica</h2>
        <p className="section-hint">Explicación sencilla y análisis de tono/sesgo generados por IA (Gemini)</p>
        <AIPanel text={fullText} />
      </section>

      <section>
        <h2><Newspaper size={18} strokeWidth={2.25} aria-hidden="true" /> Contraste con otros medios</h2>
        <p className="section-hint">Cobertura de la misma noticia encontrada en otras cabeceras</p>
        <SourceComparison title={article.title} />
      </section>

      <section>
        <h2><ShieldCheck size={18} strokeWidth={2.25} aria-hidden="true" /> Fact-checking</h2>
        <p className="section-hint">Verificaciones publicadas por fact-checkers profesionales</p>
        <FactCheckPanel query={article.title} />
      </section>
    </motion.div>
  );
}
