import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
// Antes que App: los estilos de cada pantalla se cargan después y pueden pisar a los base
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ui/shared/ErrorBoundary'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
