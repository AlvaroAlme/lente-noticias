// Esqueletos con la misma silueta que NewsCard (y sus variantes de
// tamaño), para que el mosaico no dé un salto de layout cuando llegan
// los datos reales.
export function NewsCardSkeleton({ size = "normal" }) {
  const isLarge = size === "hero" || size === "wide";
  return (
    <div className={`news-card news-card-${size} skeleton-card`} aria-hidden="true">
      <div className="skeleton-block skeleton-image" />
      <div className="news-card-body">
        <div className="skeleton-block skeleton-line" style={{ width: "40%" }} />
        <div className="skeleton-block skeleton-line" style={{ width: "90%", height: isLarge ? "1.6rem" : undefined }} />
        <div className="skeleton-block skeleton-line" style={{ width: "70%" }} />
      </div>
    </div>
  );
}

// Reproduce el mismo patrón de mosaico que Home.jsx (hero + wide + resto),
// para que la carga inicial ya "respire" como el diseño final.
export function MosaicSkeleton({ count = 7 }) {
  const sizes = ["hero", "wide", ...Array(Math.max(count - 2, 0)).fill("normal")];
  return (
    <div className="news-mosaic">
      {sizes.map((size, i) => (
        <NewsCardSkeleton key={i} size={size} />
      ))}
    </div>
  );
}

export function NewsGridSkeleton({ count = 6 }) {
  return (
    <div className="news-grid">
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  );
}
