import { useRef, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const W = 240;
const H = 64;
const PAD = 6;

const numberFmt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" });

function toPoints(series) {
  const values = series.map((p) => p.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (W - PAD * 2) / (series.length - 1 || 1);

  return series.map((p, i) => ({
    x: PAD + i * stepX,
    y: PAD + (1 - (p.close - min) / range) * (H - PAD * 2),
    date: p.date,
    close: p.close,
  }));
}

// Sparkline dibujado a mano en SVG (sin librería: son 8 puntos, no
// justifica una dependencia). Línea de 2px, extremos redondeados, área
// suave, y una capa de hover con línea guía + tooltip — igual que
// pediría cualquier gráfico de línea, aunque sea pequeño.
export function MarketTile({ market }) {
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const points = toPoints(market.series);
  const up = market.changePercent >= 0;
  const statusVar = up ? "var(--low)" : "var(--high)";

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points.at(-1).x},${H - PAD} L${points[0].x},${H - PAD} Z`;

  function handleMove(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const stepX = (W - PAD * 2) / (points.length - 1 || 1);
    const idx = Math.round((relX - PAD) / stepX);
    setHoverIndex(Math.min(Math.max(idx, 0), points.length - 1));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="market-tile">
      <div className="market-tile-head">
        <span className="eyebrow">{market.label}</span>
        <span className="market-change" data-dir={up ? "up" : "down"}>
          {up ? <TrendingUp size={13} strokeWidth={2.5} /> : <TrendingDown size={13} strokeWidth={2.5} />}
          {market.changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="market-value">{numberFmt.format(market.latest)}</div>

      <svg
        ref={svgRef}
        className="market-spark"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${market.label}: ${numberFmt.format(market.latest)} puntos, variación de hoy ${market.changePercent.toFixed(2)}%`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <path d={areaPath} fill={statusVar} opacity="0.12" stroke="none" />
        <path d={linePath} fill="none" stroke={statusVar} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {hovered && (
          <>
            <line x1={hovered.x} y1={PAD} x2={hovered.x} y2={H - PAD} stroke="var(--line)" strokeWidth="1" />
            <circle cx={hovered.x} cy={hovered.y} r="3" fill={statusVar} />
          </>
        )}
      </svg>

      {hovered && (
        <div className="market-tooltip">
          {dateFmt.format(new Date(hovered.date))} · {numberFmt.format(hovered.close)}
        </div>
      )}
    </div>
  );
}
