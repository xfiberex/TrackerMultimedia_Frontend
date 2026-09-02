import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from './ErrorBoundary'

function Explota({ falla }: { falla: boolean }) {
  if (falla) {
    throw new Error('fallo durante el renderizado')
  }
  return <p>Contenido normal</p>
}

describe('ErrorBoundary', () => {
  // React vuelca el error en consola aunque el límite lo capture. Silenciarlo
  // aquí evita ensuciar la salida sin ocultar fallos reales de otros tests.
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  it('deja pasar el contenido mientras no haya error', () => {
    render(
      <ErrorBoundary>
        <Explota falla={false} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Contenido normal')).toBeInTheDocument()
  })

  it('muestra una salida en lugar de la pantalla en blanco', () => {
    render(
      <ErrorBoundary>
        <Explota falla />
      </ErrorBoundary>,
    )

    // Sin límite de error, React desmonta el árbol entero y deja el documento
    // vacío: sin mensaje, sin navegación y sin forma de volver.
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /algo se ha roto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recargar la página' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver al inicio' })).toBeInTheDocument()
    expect(screen.queryByText('Contenido normal')).not.toBeInTheDocument()
  })

  it('registra el error para que no se pierda', () => {
    render(
      <ErrorBoundary>
        <Explota falla />
      </ErrorBoundary>,
    )

    expect(errorSpy).toHaveBeenCalledWith(
      'Error no controlado durante el renderizado:',
      expect.objectContaining({ message: 'fallo durante el renderizado' }),
      expect.anything(),
    )
  })

  it('recarga la página cuando se pulsa la acción de recuperación', async () => {
    const user = userEvent.setup()
    const reload = vi.fn()
    const original = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...original, reload, assign: vi.fn() },
    })

    render(
      <ErrorBoundary>
        <Explota falla />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: 'Recargar la página' }))
    expect(reload).toHaveBeenCalledOnce()

    Object.defineProperty(window, 'location', { configurable: true, value: original })
  })
})
