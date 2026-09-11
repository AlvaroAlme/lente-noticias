import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages sirve un repo de proyecto en usuario.github.io/repo/,
  // no en la raíz del dominio: sin esto, los assets del build (JS/CSS)
  // se pedirían con rutas absolutas equivocadas y la página saldría en
  // blanco. Solo afecta al build de producción (npm run dev usa "/").
  base: process.env.GITHUB_PAGES ? "/lente-noticias/" : "/",
  server: {
    // Permite acceder al dev server a través de un túnel público
    // (localtunnel) para compartirlo, sin tener que fijar cada
    // subdominio aleatorio que asigna cada vez que se levanta.
    // Solo afecta a "npm run dev"; el build de producción no usa esto.
    allowedHosts: [".loca.lt"],
  },
})
