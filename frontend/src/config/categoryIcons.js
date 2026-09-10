import {
  Compass,
  TrendingUp,
  Cpu,
  Sparkles,
  Clapperboard,
  Trophy,
  FlaskConical,
  HeartPulse,
  Ticket,
  Star,
} from "lucide-react";

// Un icono por categoría: ayuda a reconocer la pestaña de un vistazo
// (y de paso rompe con el típico listado de texto plano de un
// agregador de noticias genérico).
export const CATEGORY_ICONS = {
  general: Compass,
  business: TrendingUp,
  technology: Cpu,
  "ia-dev": Sparkles,
  entertainment: Clapperboard,
  sports: Trophy,
  science: FlaskConical,
  health: HeartPulse,
  loteria: Ticket,
  foryou: Star,
};
