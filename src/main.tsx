import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Antes que App: los estilos de cada pantalla se cargan después y pueden pisar a los base
import './index.css'
import App from './App.tsx'
import { startAppUpdates } from './net/appUpdate'
import { ErrorBoundary } from './ui/shared/ErrorBoundary'

startAppUpdates()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
