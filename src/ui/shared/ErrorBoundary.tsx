import { Component, type ReactNode } from 'react'
import { reloadApp } from '../../net/appUpdate'

/** Muestra el error en pantalla (en el móvil no hay consola a mano) y permite reintentar sin tocar la partida */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="app">
        <div className="screen scroll">
          <h2 className="section-title">Algo ha fallado</h2>
          <pre className="error-box">{`${error.message}\n\n${error.stack ?? ''}`}</pre>
          <button className="btn primary" onClick={() => this.setState({ error: null })}>
            Reintentar
          </button>
          <button className="btn" onClick={() => void reloadApp()}>
            Recargar aplicación
          </button>
        </div>
      </div>
    )
  }
}
