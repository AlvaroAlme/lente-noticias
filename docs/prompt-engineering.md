# Prompt Engineering — registro técnico del desarrollo de Lente

Este documento recopila, en orden cronológico, las instrucciones dadas a un
asistente de IA (Claude Code) durante el desarrollo de **Lente**, reformuladas
como especificaciones técnicas. El objetivo es documentar el proceso de
*prompt engineering* como metodología de trabajo — cómo una serie de
instrucciones en lenguaje natural, cada vez más precisas, se tradujeron en
decisiones de arquitectura, elección de APIs, patrones de UI y correcciones
de calidad — no solo el resultado final.

Cada entrada sigue el formato: **prompt original** (resumen) → **especificación
técnica derivada** → **decisión/entregable**.

---

## Fase 0 — Especificación y elección de arquitectura

**0.1 — Brief inicial**
> Stack propuesto: React (Vite) + Node/Express en Render; fuente de noticias
> pendiente de decidir; contraste de fuentes; fact-checking vía Google Fact
> Check API; resumen/análisis vía Gemini API (free tier).

- Especificación técnica: monorepo con separación estricta frontend/backend,
  ninguna clave de API expuesta al cliente, arquitectura de proxy server-side
  para todas las integraciones externas.
- Decisión: estructura `frontend/` (Vite + React Router) + `backend/`
  (Express, ESM), comunicación exclusiva vía REST bajo `/api/*`.

**0.2 — Justificación de la fuente de noticias**
> Petición de comparar en profundidad GNews API, NewsAPI, RSS directo y una
> combinación GNews+RSS, con recomendación razonada.

- Análisis de trade-offs: cuota (100 req/día en ambas APIs gratuitas),
  restricciones de licencia (NewsAPI prohíbe producción en el plan free),
  capacidad de agrupar cobertura equivalente entre medios (nula en ambas
  APIs) y control total ofrecido por RSS.
- Decisión: **GNews** para *top-headlines* por categoría + **RSS** (parseo
  propio con `rss-parser`) para el matching de cobertura cruzada mediante
  solapamiento léxico de titulares — sin dependencias de pago ni límite de
  cuota en la pieza diferencial del producto.

**0.3 — Restricción de contexto: usuario sin experiencia previa en el stack**
> El usuario indica que es la primera vez que usa este stack y necesita
> poder defenderlo (contexto de evaluación académica).

- Implicación de proceso: cada decisión de arquitectura se documenta inline
  (comentarios explicando el *porqué*, no el *qué*) y en `README.md`, con
  una sección explícita de limitaciones conocidas para anticipar preguntas
  de una defensa técnica.

---

## Fase 1 — MVP funcional

Construcción del backend (`routes/` → `services/` → APIs externas), caché
en memoria con deduplicación de peticiones concurrentes (`utils/cache.js`)
para respetar la cuota de 100 req/día de GNews, y frontend con listado por
categoría, detalle de artículo, panel de IA (resumen/simplificación/
análisis) y contraste de fuentes vía RSS.

---

## Fase 2 — Calidad de contenido y primera identidad visual

**2.1**
> "Tenemos que evitar las noticias del tipo '¿Qué memoria USB comprar?' Son
> noticias vacías."

- Especificación: clasificador heurístico de contenido de afiliados
  (regex sobre patrones léxicos de guía de compra) aplicado como filtro
  post-fetch, sin coste de inferencia ni dependencia de un modelo.
- Iteración de precisión: ampliación de patrones tras detectar falsos
  negativos reales en producción (`"cuesta menos de X€"` sin la palabra
  "por"), y posterior corrección de un falso positivo (titulares de multas
  y sanciones que compartían la forma léxica "por X€" con las ofertas).

**2.2**
> "Utiliza las skills disponibles para rediseñar la web. Hazla atractiva,
> no una página llena de información toda junta."

- Especificación técnica: sistema de diseño con tokens CSS (color, tipo,
  espaciado) parametrizados para tema claro/oscuro vía
  `prefers-color-scheme`, jerarquía tipográfica real, y layout que evite el
  patrón por defecto de "lista de texto plano".
- Resultado: primera identidad de marca completa (tipografía editorial,
  paleta con acento único, componente de tarjeta destacada).

**2.3**
> Batch de cambios: favoritos por categoría, reformato del análisis de IA
> con marcas visuales de sesgo, resumen automático de 2-3 párrafos
> (eliminando la acción manual de "resumir"), y una segunda identidad
> visual completa.

- Especificación técnica clave: sustitución de la salida de texto libre del
  modelo de lenguaje por **salida JSON estructurada** (`responseSchema` de
  la API de Gemini) para el análisis de tono/sesgo — decisión motivada por
  la necesidad de renderizar indicadores visuales fiables sin parsear texto
  con expresiones regulares.
- Persistencia de preferencias de usuario en `localStorage` (sin backend de
  autenticación, dado que no hay cuentas de usuario en el alcance).

---

## Fase 3 — Expansión de categorías y distribución temprana

**3.1**
> "Crea una categoría nueva para los resultados de loterías (ONCE,
> Primitiva...)."

- Especificación: dado que GNews no expone esa categoría de forma nativa,
  uso del endpoint de *búsqueda* con términos específicos en lugar de
  *top-headlines*, y filtro de precisión post-búsqueda para descartar
  colisiones léxicas (p. ej. "ONCE" como número vs. como organización;
  "primitiva" como adjetivo vs. como sorteo).

**3.2**
> "Añade un apartado específico para el desarrollo de software con IA."

- Mismo patrón arquitectónico que 3.1 (categoría vía búsqueda + filtro de
  precisión), reutilizado como abstracción común
  (`SPECIAL_CATEGORIES` en el router).

**3.3**
> "Dame un acceso al puerto en formato URL para poder compartir."

- Especificación de infraestructura efímera: túnel HTTPS (`localtunnel`)
  para frontend y backend, con ajuste de configuración de Vite
  (`server.allowedHosts`) y de CORS para permitir el origen del túnel —
  documentado explícitamente como solución temporal, no como estrategia de
  despliegue.

---

## Fase 4 — Ampliación de producto (finanzas, salud, identidad final)

> Batch: newsletter (descartada tras aclarar alcance), panel de análisis
> financiero en "Economía" con gráficas de mercado y lectura de IA sobre
> oportunidades de inversión, disclaimer legal en "Salud", animación de
> carga, y cambio de nombre de la marca.

- Decisión de fuente de datos: **Twelve Data** (free tier) para series
  temporales de mercado, con hallazgo de restricción real de producto
  (los índices puros como S&P 500/Nasdaq no están disponibles en el plan
  gratuito; se sustituyen por ETFs líquidos que replican cada mercado,
  documentado explícitamente en UI y en código para no presentar datos de
  forma engañosa).
- Especificación de *AI safety* de producto: el prompt de análisis
  financiero se diseña para devolver etiquetas neutras
  (`Oportunidad`/`Precaución`/`Vigilar`) en vez de imperativos ("compra",
  "vende"), acompañado siempre de un disclaimer no descartable en la UI —
  mismo patrón aplicado al disclaimer sanitario en la categoría de Salud.
- Componente de gráfico: *sparkline* SVG construido a mano (sin librería,
  justificado por el volumen de datos — 8 puntos por serie) con capa de
  interacción (crosshair + tooltip on hover).

**4.1**
> "Añade que al pinchar en el nombre de la web te lleve a la página
> principal."

- Caso de estudio de enrutamiento en React Router: `Link` a la misma ruta
  activa no remonta el componente de destino (mismo `key` de ruta), por lo
  que el estado de navegación interno no se reseteaba. Solución: `key`
  dinámica en el elemento de ruta, incrementada en el `onClick` del logo,
  forzando remontaje explícito.

---

## Fase 5 — UX, accesibilidad y calidad de código

**5.1**
> "Cambia el panel de navegación de categorías, no quiero una barra de
> desplazamiento."

- `overflow-x: auto` → `flex-wrap: wrap`: las categorías pasan a
  envolver en varias líneas en vez de requerir scroll horizontal.

**5.2**
> "Perfecto, siguiente paso" (tras preguntar dirección; el usuario elige
> revisión de calidad sobre nueva funcionalidad).

- Ejecución de revisión de código a nivel de repositorio completo (sin
  historial git disponible en ese momento, por lo que el "diff" a revisar
  fue el árbol de código completo). 7 hallazgos corregidos, entre ellos:
  condición de carrera en respuestas de IA obsoletas (mitigada con un
  *request token* por componente), ausencia de deduplicación de peticiones
  concurrentes en la caché del backend, y un antipatrón de React
  (componente definido dentro del cuerpo de otro componente, forzando
  remontaje en cada render).

---

## Fase 6 — Rediseño UX/UI basado en investigación

> "Revisa todo el diseño. Busca sobre diseño de interfaces, web
> responsive, UX/UI. Cambia toda la vista, no quiero que parezca otra web
> de noticias. Usa animaciones para las transiciones entre categorías,
> iconos y mejora el aspecto."

- Metodología: investigación previa (tendencias de layout editorial
  asimétrico, mejores prácticas de *responsive design* mobile-first,
  convenciones de duración/easing para micro-interacciones en 2026) usada
  para fundamentar las decisiones de diseño antes de escribir CSS.
- Especificación técnica derivada:
  - Layout "mosaico editorial" (pieza destacada + secundaria + trama
    regular) sustituyendo el grid uniforme de tarjetas, con *breakpoints*
    de reflujo responsive sin depender de una librería de grid.
  - Transiciones de categoría con `framer-motion` (`AnimatePresence`,
    indicador de pestaña con animación de layout compartido vía
    `layoutId`), respetando `prefers-reduced-motion` de forma global
    (`MotionConfig reducedMotion="user"`).
  - Sistema de iconografía real (`lucide-react`) sustituyendo glifos de
    texto/ASCII previos.

---

## Fase 7 — Gobernanza: seguridad, diseño y calidad combinadas

> "/security-review /design /code-review" — ejecución de tres procesos de
> revisión en la misma iteración.

- **Bloqueador de infraestructura resuelto**: `/security-review` requiere
  un repositorio git con referencia remota (`origin/HEAD`) contra la que
  diferenciar cambios; el proyecto no tenía control de versiones. Se
  inicializó git, se creó un repositorio remoto en GitHub (autenticación
  vía `gh auth login`, instalación de la CLI con `winget` al no estar
  presente) y se estableció `origin/HEAD` manualmente
  (`git remote set-head origin -a`), ya que no se fija automáticamente al
  crear un remoto desde un repo local existente.
- **Resultado de seguridad**: cero hallazgos de alta confianza (inyección,
  XSS, exposición de secretos, fuga de errores internos), verificado
  mediante sub-agentes especializados en identificación y filtrado de
  falsos positivos, con trazado explícito del flujo de datos desde
  parámetros de usuario hasta las llamadas a APIs externas.
- **Resultado de calidad**: 8 hallazgos adicionales corregidos (mensajes de
  error de APIs upstream reenviados sin sanear al cliente, *crash* por
  valor `null` explícito no cubierto por un parámetro por defecto,
  resultado vacío cacheado como éxito en el servicio de mercados, texto
  truncado de la API de noticias filtrando al prompt de IA sin limpiar,
  entre otros).
- **Exploración de identidad visual**: generación de 4 direcciones de
  diseño de baja fidelidad, cada una explorando un eje estético distinto y
  con una justificación de negocio explícita, publicadas como un lienzo
  interactivo comparable antes de comprometer ninguna a código.

---

## Fase 8 — Selección e implementación de identidad final

> "Cristal" (selección directa de una de las cuatro direcciones
> presentadas).

- Traducción de una dirección estética validada visualmente a un sistema
  de tokens de producción: tipografía única, paleta de acento único,
  tratamiento de "vidrio esmerilado" (`backdrop-filter`) sustituyendo el
  patrón de tarjeta con borde de acento lateral en todos los componentes,
  con adaptación deliberada del motivo decorativo del boceto (círculo de
  marcador de posición) a un elemento ambiental que no recorta el
  contenido real de las fotografías de las noticias.

---

## Fase 9 — Publicación y distribución

> "Vamos a publicar en GitHub, añadirlo al portfolio y lanzarlo a GitHub
> Pages para poder presentarla."

- Restricciones de plataforma identificadas antes de ejecutar: GitHub
  Pages gratuito requiere repositorio público; solo sirve contenido
  estático, por lo que el backend Express necesita un host aparte con
  ejecución de servidor (Render, ya contemplado desde la especificación
  inicial).
- Pipeline de CI/CD: GitHub Actions con `base` de Vite condicionado a la
  ruta del repositorio de proyecto, *fallback* de `404.html` para el
  enrutamiento de cliente de React Router (GitHub Pages no soporta
  reescritura de rutas en servidor), y variable de entorno inyectable
  desde *repository variables* para apuntar al backend una vez desplegado.

---

## Observaciones sobre el proceso

- **Iteración por lotes frente a cambios atómicos**: buena parte de las
  peticiones agrupan 3-5 cambios no relacionados en un único prompt
  (ej. Fase 4). Esto exige descomponer la petición en especificaciones
  independientes y priorizar las que bloquean a las demás (p. ej. resolver
  el símbolo correcto de un activo financiero antes de poder construir el
  panel que lo consume).
- **Verificación empírica sobre supuestos**: varias decisiones que
  parecían triviales sobre el papel (símbolos de Twelve Data, plantillas
  de RSS, modelo de Gemini por defecto) resultaron incorrectas al
  probarlas contra las APIs reales, y se corrigieron iterando contra la
  respuesta real del proveedor en lugar de asumir documentación genérica.
- **Las correcciones de calidad no fueron reactivas**: la revisión de
  código y la de seguridad se ejecutaron como procesos explícitos
  solicitados por el usuario, no como reacción a fallos reportados — un
  patrón de desarrollo asistido por IA donde la revisión sistemática forma
  parte del flujo, no un paso opcional al final.
