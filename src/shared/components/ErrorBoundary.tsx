import { Component, type ErrorInfo, type ReactNode } from 'react'
import i18n from '@/shared/i18n'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Última red antes de la pantalla en blanco.
 *
 * Sin un límite de error, cualquier excepción durante el renderizado desmonta el
 * árbol entero y React deja el documento vacío: sin mensaje, sin navegación y sin
 * forma de volver. Con este componente el usuario al menos sabe que algo falló y
 * tiene dos salidas.
 *
 * Tiene que ser una clase: React no ofrece equivalente en hooks para
 * `getDerivedStateFromError` ni `componentDidCatch`.
 *
 * **No captura todo.** Quedan fuera los errores en manejadores de eventos, en
 * código asíncrono y durante el renderizado en servidor. Para los fallos de red,
 * la aplicación ya tiene su propio tratamiento en cada vista.
 *
 * Los textos salen de `i18n.t` y no de `useTranslation`, porque en una clase no hay
 * hooks. La consecuencia es que esta pantalla no se re-traduce si alguien cambia el
 * idioma mientras está puesta, y da igual: cuando se ve esta pantalla el árbol de la
 * aplicación —y con él el interruptor de idioma— ya no está montado.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Sin esto el error solo existiría en el estado del componente. La consola es
    // el único destino disponible: no hay servicio de registro en el cliente.
    console.error('Error no controlado durante el renderizado:', error, info.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    // Recarga completa a propósito, no navegación del router: si el árbol quedó
    // en un estado inconsistente, seguir dentro de la misma instancia de React
    // es lo que provocó el fallo.
    window.location.assign('/')
  }

  render() {
    const { error } = this.state

    if (!error) {
      return this.props.children
    }

    return (
      <div className="error-boundary" role="alert">
        <section className="error-boundary__panel">
          <h1 className="error-boundary__title">{i18n.t('errorGrave.titulo')}</h1>
          <p className="error-boundary__text">{i18n.t('errorGrave.mensaje')}</p>

          <div className="error-boundary__actions">
            <button type="button" className="button button--primary" onClick={this.handleReload}>
              {i18n.t('errorGrave.recargar')}
            </button>
            <button type="button" className="button button--ghost" onClick={this.handleGoHome}>
              {i18n.t('errorGrave.inicio')}
            </button>
          </div>

          {import.meta.env.DEV ? (
            <details className="error-boundary__details">
              <summary>{i18n.t('errorGrave.detalle')}</summary>
              <pre className="error-boundary__stack">{error.stack ?? error.message}</pre>
            </details>
          ) : null}
        </section>
      </div>
    )
  }
}
