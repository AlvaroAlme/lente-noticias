# Lente — agregador con contraste de fuentes, fact-checking y resumen por IA

## 1. Qué hace la aplicación

1. Muestra titulares de noticias organizados por categoría (Portada, Economía,
   Tecnología, IA y desarrollo, Entretenimiento, Deportes, Ciencia, Salud,
   Loterías), con contenido de afiliados/guías de compra filtrado
   automáticamente.
2. Favoritos por categoría: el usuario puede marcar qué temas le interesan;
   la pestaña "Tu enfoque" agrupa entonces solo esas categorías.
3. Al abrir una noticia, el usuario puede:
   - Leer un **resumen automático** de 2-3 párrafos (se genera solo, sin
     pulsar nada) y pedir una **explicación en lenguaje sencillo** o un
     **análisis de tono/sesgo** con marcas visuales (medidor de sesgo,
     bandera de connotación política) generados por IA (Gemini).
   - Ver **qué otros medios están cubriendo la misma noticia** (contraste de
     fuentes), para comparar cómo distintos periódicos narran el mismo hecho.
   - Ver si esa noticia (o afirmaciones relacionadas) ya han sido
     **verificadas por fact-checkers profesionales** (Google Fact Check
     Tools API).
4. En **Economía**: panel de mercados con la cotización y gráfica de los
   últimos días de 4 índices (IBEX 35, S&P 500, Nasdaq 100, Euro Stoxx 50) vía
   Twelve Data, más una lectura de la sesión generada por IA — con aviso legal
   explícito de que no es asesoramiento financiero.
5. En **Salud**: aviso recordando que el contenido no sustituye a un
   profesional sanitario, tanto en el listado como en cada noticia.

## 2. Arquitectura

```
Navegador (React) ──HTTP/JSON──> Backend (Express, Render) ──> GNews API
                                                             ──> RSS feeds de medios
                                                             ──> Google Fact Check API
                                                             ──> Gemini API
                                                             ──> Twelve Data API
```

**Por qué esta separación (frontend/backend) y no todo en el navegador:**
las tres APIs externas requieren claves privadas. Si el frontend las
llamara directamente, las claves quedarían visibles en el código JavaScript
que se descarga al navegador de cualquier visitante (F12 → Network/Sources).
El backend es el único que conoce las claves; el frontend solo habla con
*nuestro propio* servidor.

## 3. Stack y justificación de cada elección

| Pieza | Elección | Por qué |
|---|---|---|
| Frontend | React + Vite | Vite compila con ESBuild (mucho más rápido que Webpack/CRA) y es el estándar actual para arrancar proyectos React. React nos da componentes reutilizables (tarjeta de noticia, panel de IA, panel de fact-check) y `react-router-dom` para navegar entre el listado y el detalle sin recargar la página. |
| Backend | Node.js + Express | Express expone rutas HTTP de forma explícita y minimalista (`/api/news`, `/api/factcheck`, `/api/ai`), con muchísima documentación de referencia — importante si es tu primer proyecto con este stack. Node comparte lenguaje (JavaScript) con el frontend, evitando cambiar de contexto mental. |
| Noticias por categoría | GNews API | Da titulares ya estructurados (título, imagen, fuente, fecha) filtrados por categoría e idioma, sin tener que parsear HTML. Free tier: 100 requests/día — mitigado con caché (ver sección 5). |
| Contraste de fuentes | RSS de medios (`rss-parser`) | GNews agrupa mal noticias equivalentes de distintos medios. En vez de depender de un agregador de terceros para "saber" qué historias son la misma, leemos directamente los RSS de varios periódicos españoles/internacionales y hacemos nuestra propia comparación de titulares (ver sección 6). Sin coste ni límite de cuota. |
| Fact-checking | Google Fact Check Tools API | Es una API pública y gratuita sobre una base de datos de verificaciones ya publicadas por organizaciones de fact-checking reales (Maldita.es, Newtral, AFP Factual, etc.). No "inventa" veredictos con IA: solo busca si alguien ya verificó una afirmación relacionada. |
| Resumen / simplificación / análisis | Gemini API (free tier) | Modelo de lenguaje de Google con capa gratuita generosa. Cada modo usa su propio prompt centralizado en el backend; el análisis de tono/sesgo y el de mercados piden salida en JSON estructurado (`responseSchema`) en vez de texto libre, para poder pintar marcas visuales fiables en el frontend sin parsear texto con regex. |
| Datos de mercado (Economía) | Twelve Data (free tier) | 800 peticiones/día, buena cobertura de índices bursátiles. Devuelve series de cierres diarios ya estructuradas, suficiente para dibujar el sparkline y calcular la variación sin necesitar scraping. |
| Despliegue | Render | Backend como "Web Service" (Node) y frontend como "Static Site", ambos con despliegue automático desde git. Tiene capa gratuita y es sencillo de configurar sin tarjeta de crédito para el uso básico. |

## 4. Estructura de carpetas

```
noticias/
├── backend/
│   ├── src/
│   │   ├── server.js              # arranque de Express, monta las rutas
│   │   ├── routes/                # capa HTTP (valida input, llama a services)
│   │   │   ├── news.routes.js
│   │   │   ├── factcheck.routes.js
│   │   │   ├── ai.routes.js
│   │   │   └── markets.routes.js
│   │   ├── services/               # lógica de negocio + llamadas a APIs externas
│   │   │   ├── gnews.service.js
│   │   │   ├── rss.service.js
│   │   │   ├── factcheck.service.js
│   │   │   ├── gemini.service.js
│   │   │   └── markets.service.js
│   │   ├── utils/cache.js          # caché en memoria (TTL)
│   │   └── config/
│   │       ├── feeds.js            # feeds RSS y categorías
│   │       ├── contentFilters.js   # detecta afiliados/loterías por patrones de texto
│   │       └── markets.js          # índices bursátiles a mostrar
│   └── .env.example
└── frontend/
    └── src/
        ├── api/client.js           # único punto de contacto con el backend
        ├── hooks/useFavorites.js   # favoritos por categoría (localStorage)
        ├── pages/Home.jsx          # listado por categoría
        ├── pages/Article.jsx       # detalle: IA + contraste + fact-check
        └── components/             # CategoryTabs, NewsCard, Skeleton, MarketsPanel,
                                     # MarketTile, MarketAnalysis, HealthDisclaimer...
```

La separación `routes/` vs `services/` es un patrón común en Express: las
rutas se encargan de HTTP (leer parámetros, devolver códigos de estado), los
servicios de la lógica real (llamar a la API externa, transformar datos).
Así, si mañana cambias GNews por otra API, solo tocas `gnews.service.js`.

## 5. Por qué hace falta caché (`backend/src/utils/cache.js`)

GNews free tier permite **100 peticiones al día**. Sin caché, cada vez que
alguien visitase la web y cambiase de categoría se gastaría una petición
real — con un puñado de usuarios se agotaría la cuota en minutos.

Solución: `node-cache` guarda en memoria la respuesta de cada categoría
durante 30 minutos. La primera persona que pide "tecnología" hoy dispara la
llamada real a GNews; el resto de visitas durante los siguientes 30 minutos
reciben la respuesta guardada, sin gastar cuota. Los feeds RSS y las
búsquedas de fact-check también se cachean (15 min y 1 hora respectivamente)
por la misma razón, aunque no tengan límite de cuota tan estricto.

## 6. Cómo funciona el contraste de fuentes (`rss.service.js`)

No usamos IA ni una API de pago para esto — es una heurística simple y
explicable, importante para poder defenderla:

1. Descargamos y parseamos en paralelo los RSS de varios medios (El País,
   El Mundo, ABC, La Vanguardia, 20minutos, elDiario.es, BBC Mundo).
2. Cuando el usuario abre una noticia, tomamos su titular y extraemos las
   "palabras significativas" (quitamos tildes, minúsculas, y descartamos
   palabras muy cortas o vacías como "el", "la", "de", "que"...).
3. Comparamos esas palabras con los titulares de todos los ítems RSS
   descargados, contando cuántas palabras coinciden (`score`).
4. Nos quedamos con la mejor coincidencia por medio (para no repetir el
   mismo periódico) y devolvemos las que superan un umbral mínimo de
   coincidencia.

Es una aproximación por solapamiento léxico, no comprensión semántica real
— pero es transparente, gratuita, y funciona bien para noticias de
actualidad donde varios medios usan vocabulario similar (nombres propios,
lugares, términos del suceso). Ya probado en local: para una noticia sobre
"la ley de nietos y el Supremo", detectó correctamente que los 6 medios
monitorizados la estaban cubriendo el mismo día.

## 7. Filtrado de contenido de baja calidad (`contentFilters.js`)

GNews mezcla, dentro de categorías normales, dos tipos de contenido que no
son noticia:

- **Guías de compra/afiliados** (ej. "¿Qué memoria USB comprar?", "Los
  mejores auriculares por menos de 30€"): se detectan por patrones de texto
  (regex) típicos de este tipo de titular y se descartan antes de llegar
  al frontend.
- **Resultados de loterías** (ONCE, Bonoloto, Primitiva...): no son
  publicidad, pero tampoco encajan como noticia dentro de "Portada" o
  "Economía", así que se sacan de ahí y se sirven en su propia categoría
  ("Loterías"), usando el endpoint de búsqueda de GNews en vez de
  `top-headlines` (que no tiene esa categoría).

La categoría **"IA y desarrollo"** sigue el mismo patrón que "Loterías"
(búsqueda dedicada, no `top-headlines`), pero al revés: en vez de sacar
contenido de otras categorías, junta noticias sobre IA aplicada a
programación (herramientas como GitHub Copilot, Claude Code, vibe coding...)
que de otra forma quedarían dispersas dentro de "Tecnología" mezcladas con
IA en general (sanidad, regulación, robótica). El filtro exige que el texto
combine vocabulario de IA con vocabulario de desarrollo de software, para
no colar cualquier noticia de IA que use la palabra de pasada.

Es una heurística por patrones de texto, no un clasificador de IA —
deliberado: es gratis, rápido, y fácil de ajustar añadiendo un patrón nuevo
si se cuela algo.

## 8. Panel de mercados y avisos legales

El análisis de IA en Economía (oportunidades de inversión) y el aviso en
Salud comparten una misma idea de diseño responsable: la IA puede describir
tendencias a partir de datos reales, pero nunca debe presentarse como
sustituto de un profesional (financiero o sanitario). Por eso:

- El prompt de mercados (`gemini.service.js: analyzeMarkets`) pide
  explícitamente evitar imperativos como "compra" o "vende", y clasifica
  cada activo con etiquetas neutras ("Oportunidad", "Precaución", "Vigilar")
  basadas solo en los datos de cierre proporcionados.
- El frontend muestra siempre, de forma visible y no descartable, un aviso
  de que no es asesoramiento financiero antes de mostrar el análisis.
- El mismo patrón se repite en Salud con `HealthDisclaimer.jsx`.

## 9. Puesta en marcha en local

### Backend
```bash
cd backend
npm install
cp .env.example .env
# edita .env y rellena GNEWS_API_KEY, FACTCHECK_API_KEY, GEMINI_API_KEY,
# TWELVEDATA_API_KEY
npm run dev
```
Corre en `http://localhost:4000`.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Corre en `http://localhost:5173`.

### Cómo conseguir cada API key
- **GNews**: regístrate en https://gnews.io/ y copia la key del dashboard.
- **Google Fact Check Tools API**: en https://console.cloud.google.com/,
  crea un proyecto, habilita "Fact Check Tools API" en la librería de APIs,
  y genera una clave en "APIs y servicios > Credenciales".
- **Gemini**: en https://aistudio.google.com/apikey, "Create API key"
  (capa gratuita, sin tarjeta de crédito).
- **Twelve Data**: en https://twelvedata.com/pricing, plan "Free" →
  regístrate y copia la key del dashboard.

## 10. Despliegue en Render

**Backend (Web Service):**
1. Sube el repo a GitHub.
2. En Render: New > Web Service > conecta el repo.
3. Root directory: `backend`. Build command: `npm install`. Start command: `npm start`.
4. En "Environment", añade las variables del `.env` (`GNEWS_API_KEY`,
   `FACTCHECK_API_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
   `TWELVEDATA_API_KEY`, y `CORS_ORIGIN` con la URL del frontend una vez
   desplegado).

**Frontend (Static Site):**
1. New > Static Site > mismo repo.
2. Root directory: `frontend`. Build command: `npm install && npm run build`. Publish directory: `dist`.
3. Variable de entorno `VITE_API_URL` = URL pública del backend en Render.

## 11. Limitaciones conocidas (útil mencionarlas en la defensa)

- **Matching de RSS por palabras clave, no por NLP real**: puede fallar con
  titulares que describen el mismo hecho con vocabulario muy distinto, o
  dar falsos positivos si dos noticias distintas comparten nombres propios.
- **Las URLs de RSS cambian**: los medios reestructuran sus feeds de vez en
  cuando; si uno deja de responder, se ignora automáticamente (no rompe la
  app) pero conviene revisar `backend/src/config/feeds.js` periódicamente.
- **El detalle de artículo depende de navegación en memoria**: el artículo
  completo se pasa de `Home` a `Article` vía `react-router` (`state`), no
  por la URL. Si el usuario recarga `/article` directamente, se le redirige
  a portada. Alternativa más robusta (no implementada): guardar un ID y
  volver a pedir el artículo al backend.
- **Fact-checking depende de que alguien ya haya verificado esa afirmación**:
  la ausencia de resultados no significa que la noticia sea cierta, solo
  que no hay una verificación publicada todavía.
- **Cuotas gratuitas**: GNews (100 req/día), Gemini (límite por minuto en
  el free tier) y Twelve Data (800 req/día) son suficientes para
  desarrollo/demo, no para tráfico alto en producción sin pasar a un plan
  de pago.
- **Los "índices" del panel de mercados son en realidad ETFs**: el plan free
  de Twelve Data no da acceso a índices en directo (SPX, NDX) ni a bolsas
  europeas (BME) — solo a instrumentos cotizados en EEUU. Se usan ETFs que
  replican cada mercado (SPY, QQQ, FEZ, y EWP para España) como aproximación
  estándar; tienen una pequeña diferencia con el índice real por comisiones
  y tracking error. Confirmado contra la API real, ver `config/markets.js`.
- **Twelve Data free tier: 8 peticiones/minuto**, no solo 800/día — con 4
  símbolos por refresco (cada 30 min) va sobrado, pero si se prueban
  endpoints manualmente conviene espaciar las llamadas.
- **Favoritos solo en el navegador**: se guardan en `localStorage`, no en el
  backend — no hay cuentas de usuario, así que no viajan entre dispositivos
  ni sobreviven a borrar los datos del sitio.
- **El análisis de mercados es una lectura de datos públicos, no
  asesoramiento financiero**: el prompt está diseñado para describir
  tendencias con etiquetas neutras y el frontend siempre muestra un aviso
  legal junto al análisis — pero sigue siendo texto generado por un modelo
  de lenguaje, no un analista financiero real.
