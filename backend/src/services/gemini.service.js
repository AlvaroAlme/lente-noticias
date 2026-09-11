import { upstreamError } from "../utils/upstreamError.js";

// GEMINI_MODEL es configurable por variable de entorno porque Google
// va renombrando/retirando modelos del free tier con el tiempo.
// Si en algún momento este modelo deja de estar disponible, consulta
// los modelos vigentes en https://ai.google.dev/gemini-api/docs/models
// y cambia la variable de entorno sin tocar código.
const DEFAULT_MODEL = "gemini-3.6-flash";

// Se ha observado que, sobre todo en modo de salida JSON estructurada
// (responseSchema), Gemini a veces genera texto en español SIN tildes
// ni "ñ" (p. ej. "indices", "ultimas", "espanol") aunque el prompt en sí
// esté bien escrito — es un quirk conocido de generación restringida a
// un esquema, no un error de nuestro código. Se añade esta instrucción
// a TODAS las llamadas (en vez de repetirla en cada prompt) para que
// cualquier función nueva que use callGemini quede cubierta también.
const SPANISH_SPELLING_REMINDER =
  "\n\nIMPORTANTE: escribe en español correcto, usando siempre las " +
  "tildes y la letra 'ñ' donde corresponda (por ejemplo: 'índices', " +
  "'última', 'presión', 'español', 'máximo', 'caída', no 'indices', " +
  "'ultima', 'presion', 'espanol', 'maximo', 'caida').";

async function callGemini(prompt, generationConfig) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta GEMINI_API_KEY en las variables de entorno");
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt + SPANISH_SPELLING_REMINDER }] }],
      ...(generationConfig ? { generationConfig } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw upstreamError("Gemini", `HTTP ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini no devolvió texto en la respuesta");
  return text.trim();
}

// Prompts centralizados aquí (no en el frontend) para que el
// "prompt engineering" del proyecto sea fácil de ajustar/defender
// desde un único sitio.

// Resumen corto que se muestra automáticamente en cada artículo (no
// requiere que el usuario pulse nada). 2-3 párrafos separados por una
// línea en blanco, para que el frontend los pinte como párrafos reales.
export async function summarizeArticle(articleText) {
  const prompt =
    "Resume la siguiente noticia en español en 2 o 3 párrafos cortos " +
    "(sepáralos con una línea en blanco), manteniendo solo los datos " +
    "objetivos más importantes (qué, quién, cuándo, dónde, por qué). " +
    "No opines ni añadas información que no esté en el texto original. " +
    "No repitas el titular.\n\nNOTICIA:\n" + articleText;
  return callGemini(prompt);
}

export async function simplifyArticle(articleText) {
  const prompt =
    "Reescribe la siguiente noticia en español sencillo, como si se lo " +
    "explicaras a alguien sin conocimientos previos del tema o a un " +
    "estudiante de secundaria. Evita tecnicismos y jerga; si es " +
    "imprescindible usar un término técnico, explícalo entre paréntesis. " +
    "Máximo 150 palabras.\n\nNOTICIA:\n" + articleText;
  return callGemini(prompt);
}

// Esquema fijo para el análisis de tono/sesgo: en vez de pedirle a Gemini
// texto libre y luego parsearlo con regex (frágil), le forzamos a devolver
// JSON con esta forma exacta (Gemini structured output / responseSchema).
// Esto es lo que permite pintar "marcas visuales" fiables en el frontend
// (badges de color, medidor de sesgo) en vez de solo texto.
const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    tone: {
      type: "STRING",
      enum: ["Neutral", "Positivo", "Negativo", "Sensacionalista"],
    },
    toneExplanation: { type: "STRING" },
    missingContext: { type: "STRING" },
    biasLevel: { type: "STRING", enum: ["Bajo", "Medio", "Alto"] },
    biasExplanation: { type: "STRING" },
    hasPoliticalConnotation: { type: "BOOLEAN" },
    politicalExplanation: { type: "STRING" },
  },
  required: [
    "tone",
    "toneExplanation",
    "missingContext",
    "biasLevel",
    "biasExplanation",
    "hasPoliticalConnotation",
    "politicalExplanation",
  ],
};

export async function analyzeArticle(articleText) {
  const prompt =
    "Analiza objetivamente, en español, el tono y el posible sesgo de la " +
    "siguiente noticia. Sé estricto: la mayoría de noticias de agencia " +
    "son neutrales y con sesgo bajo, así que solo marca tono " +
    "'Sensacionalista' o sesgo 'Alto'/'Medio' si el propio texto lo " +
    "justifica claramente (adjetivos cargados, omisiones evidentes, " +
    "lenguaje partidista). 'hasPoliticalConnotation' debe ser true solo " +
    "si la noticia trata sobre política, partidos, gobierno o políticas " +
    "públicas de forma directa. Cada campo de explicación debe tener " +
    "1-2 frases.\n\nNOTICIA:\n" + articleText;

  const raw = await callGemini(prompt, {
    responseMimeType: "application/json",
    responseSchema: ANALYSIS_SCHEMA,
  });

  return JSON.parse(raw);
}

// Igual que con el análisis de tono/sesgo: JSON estructurado en vez de
// texto libre. "signal" es deliberadamente neutro ("vigilar" en vez de
// "comprar ya") porque esto es una lectura educativa de datos públicos,
// no una recomendación de inversión personalizada — el frontend además
// muestra siempre un aviso legal junto a este panel (ver MarketAnalysis).
const MARKET_ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    marketOverview: { type: "STRING" },
    opportunities: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          asset: { type: "STRING" },
          signal: {
            type: "STRING",
            enum: ["Oportunidad", "Precaución", "Vigilar"],
          },
          rationale: { type: "STRING" },
        },
        required: ["asset", "signal", "rationale"],
      },
    },
  },
  required: ["marketOverview", "opportunities"],
};

export async function analyzeMarkets(marketData) {
  const dataDescription = marketData
    .map((m) => {
      const trend = m.series.map((p) => p.close.toFixed(2)).join(" → ");
      return `${m.label}: último cierre ${m.latest.toFixed(2)}, variación de hoy ${m.changePercent.toFixed(2)}%. Últimos cierres diarios: ${trend}`;
    })
    .join("\n");

  const prompt =
    "Eres un analista que comenta la sesión de mercado para un medio de " +
    "noticias generalista, NO un asesor financiero personal. A partir de " +
    "estos datos reales de cierre de los últimos días, en español:\n" +
    "1. Escribe un resumen de 2-3 frases sobre cómo se están comportando " +
    "los mercados y qué podría estar influyendo (sin inventar causas que " +
    "no se puedan inferir de los propios números).\n" +
    "2. Para cada índice, da una lectura breve (1-2 frases, basada solo " +
    "en los datos dados) y clasifícala como 'Oportunidad' (tendencia " +
    "positiva sostenida), 'Precaución' (caída o volatilidad notable) o " +
    "'Vigilar' (sin señal clara). No uses nunca frases como 'deberías " +
    "comprar' o 'te recomiendo vender': describe la tendencia, no des " +
    "una orden.\n\nDATOS:\n" + dataDescription;

  const raw = await callGemini(prompt, {
    responseMimeType: "application/json",
    responseSchema: MARKET_ANALYSIS_SCHEMA,
  });

  return JSON.parse(raw);
}
