import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Permite acceder al dev server a través de un túnel público
    // (localtunnel) para compartirlo, sin tener que fijar cada
    // subdominio aleatorio que asigna cada vez que se levanta.
    // Solo afecta a "npm run dev"; el build de producción no usa esto.
    allowedHosts: [".loca.lt"],
  },
})
