import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// BASE_URL refleja el "base" configurado en vite.config.js: "/" en local,
// "/lente-noticias/" en GitHub Pages. Sin pasarlo como basename, React
// Router intenta emparejar rutas contra la URL completa (incluyendo el
// prefijo del repo) y no encuentra ninguna coincidencia en producción.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
