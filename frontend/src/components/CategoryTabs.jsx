import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { CATEGORY_ICONS } from "../config/categoryIcons.js";

// Declarado FUERA de CategoryTabs a propósito: si viviera dentro (como
// función anidada), React vería un tipo de componente nuevo en cada
// render de CategoryTabs y desmontaría/remontaría todos los botones de
// pestaña en cada clic — perdiendo, entre otras cosas, la animación del
// indicador deslizante (layoutId) que depende de que el elemento
// persista entre renders.
function Tab({ catKey, label, active, onSelect }) {
  const Icon = CATEGORY_ICONS[catKey];
  const isActive = catKey === active;
  return (
    <button className={isActive ? "tab tab-active" : "tab"} onClick={() => onSelect(catKey)}>
      {Icon && <Icon size={14} strokeWidth={2.25} aria-hidden="true" />}
      {label}
      {/* Indicador compartido: framer-motion anima su posición/tamaño
          entre pestañas usando layoutId, en vez de aparecer/desaparecer
          de golpe cada vez que cambia la categoría activa. */}
      {isActive && (
        <motion.span
          layoutId="tab-indicator"
          className="tab-indicator"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
    </button>
  );
}

// "general" es la portada por defecto: no tiene sentido marcarla como
// favorita (ya es el punto de partida), así que no lleva estrella.
export function CategoryTabs({ categories, active, onSelect, favorites, onToggleFavorite }) {
  const general = categories.find((c) => c.key === "general");
  const rest = categories.filter((c) => c.key !== "general");

  // Las categorías favoritas se anteponen al resto, para que sean lo
  // primero que se ve al abrir la web.
  const ordered = [
    ...rest.filter((c) => favorites.has(c.key)),
    ...rest.filter((c) => !favorites.has(c.key)),
  ];

  return (
    <nav className="category-tabs">
      {favorites.size > 0 && (
        <div className="tab-group">
          <Tab catKey="foryou" label="Tu enfoque" active={active} onSelect={onSelect} />
        </div>
      )}

      {general && (
        <div className="tab-group">
          <Tab catKey={general.key} label={general.label} active={active} onSelect={onSelect} />
        </div>
      )}

      {ordered.map((cat) => (
        <div className="tab-group" key={cat.key}>
          <Tab catKey={cat.key} label={cat.label} active={active} onSelect={onSelect} />
          <button
            className={favorites.has(cat.key) ? "star-btn star-btn-active" : "star-btn"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(cat.key);
            }}
            aria-label={favorites.has(cat.key) ? `Quitar ${cat.label} de favoritos` : `Añadir ${cat.label} a favoritos`}
            title={favorites.has(cat.key) ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <Star size={14} strokeWidth={2.25} fill={favorites.has(cat.key) ? "currentColor" : "none"} />
          </button>
        </div>
      ))}
    </nav>
  );
}
