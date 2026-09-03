import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SidePanelDialog from './SidePanelDialog'

/**
 * Monta el diálogo detrás de un botón real, porque medio comportamiento que se
 * quiere comprobar —a dónde vuelve el foco al cerrar— solo existe si hay algo
 * que lo tenía antes.
 */
function Escenario({ disableClose = false }: { disableClose?: boolean } = {}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir panel
      </button>
      <button type="button">Botón del fondo</button>

      <SidePanelDialog
        open={open}
        ariaLabel="Panel de prueba"
        disableClose={disableClose}
        onClose={() => setOpen(false)}
      >
        <button type="button">Primero</button>
        <button type="button">Segundo</button>
      </SidePanelDialog>
    </div>
  )
}

describe('SidePanelDialog', () => {
  it('mueve el foco dentro del diálogo al abrirse', async () => {
    const user = userEvent.setup()
    render(<Escenario />)

    await user.click(screen.getByRole('button', { name: 'Abrir panel' }))

    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus()
  })

  it('acota el tabulador al contenido del diálogo', async () => {
    const user = userEvent.setup()
    render(<Escenario />)

    await user.click(screen.getByRole('button', { name: 'Abrir panel' }))

    const primero = screen.getByRole('button', { name: 'Primero' })
    const segundo = screen.getByRole('button', { name: 'Segundo' })

    await user.tab()
    expect(segundo).toHaveFocus()

    // Desde el último, el tabulador vuelve al primero en lugar de salir al fondo.
    await user.tab()
    expect(primero).toHaveFocus()

    // Y hacia atrás desde el primero, al último.
    await user.tab({ shift: true })
    expect(segundo).toHaveFocus()
  })

  it('devuelve el foco a quien lo abrió al cerrarse', async () => {
    const user = userEvent.setup()
    render(<Escenario />)

    const trigger = screen.getByRole('button', { name: 'Abrir panel' })
    await user.click(trigger)
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(trigger).toHaveFocus()
  })

  it('no cierra con Escape mientras hay una operación en curso', async () => {
    const user = userEvent.setup()
    render(<Escenario disableClose />)

    await user.click(screen.getByRole('button', { name: 'Abrir panel' }))
    await user.keyboard('{Escape}')

    expect(screen.getByRole('dialog', { name: 'Panel de prueba' })).toBeInTheDocument()
  })

  it('devuelve el foco aunque el diálogo autoenfoque un campo propio', async () => {
    const user = userEvent.setup()

    function ConAutoFocus() {
      const [open, setOpen] = useState(false)
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Abrir panel
          </button>
          <SidePanelDialog open={open} ariaLabel="Panel con campo" onClose={() => setOpen(false)}>
            {/* React aplica autoFocus durante el commit, antes de los efectos.
                Si el hook leyera `document.activeElement` al abrir, guardaría este
                campo como «foco anterior» y al cerrarse ya no existiría. */}
            {/* eslint-disable-next-line jsx-a11y/no-autofocus -- el autoFocus es
                justo lo que este test comprueba: que no le gana la carrera al hook. */}
            <input aria-label="Título" autoFocus />
            <button type="button">Guardar</button>
          </SidePanelDialog>
        </div>
      )
    }

    render(<ConAutoFocus />)
    const trigger = screen.getByRole('button', { name: 'Abrir panel' })
    await user.click(trigger)

    expect(screen.getByRole('textbox', { name: 'Título' })).toHaveFocus()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(trigger).toHaveFocus()
  })

  it('deja el fondo fuera del orden de tabulación', async () => {
    const user = userEvent.setup()
    const { container } = render(<Escenario />)

    await user.click(screen.getByRole('button', { name: 'Abrir panel' }))

    // El fondo cierra al hacer clic, pero no es un control: los lectores de
    // pantalla lo ocultan por `aria-modal`, así que el teclado tampoco debe verlo.
    const scrim = container.querySelector('.side-panel-layer__scrim')
    expect(scrim).not.toBeNull()
    expect(scrim?.tagName).toBe('DIV')
    expect(scrim).toHaveAttribute('aria-hidden', 'true')
  })
})
