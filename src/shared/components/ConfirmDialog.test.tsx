import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from './ConfirmDialog'

function Escenario({ tone = 'default' as 'default' | 'danger', onConfirm = () => {} }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>Eliminar elemento</button>
      <ConfirmDialog
        open={open}
        title="¿Eliminar el elemento?"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        tone={tone}
        onConfirm={onConfirm}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}

describe('ConfirmDialog', () => {
  it('enfoca la acción de confirmar cuando no es destructiva', async () => {
    const user = userEvent.setup()
    render(<Escenario />)

    await user.click(screen.getByRole('button', { name: 'Eliminar elemento' }))

    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveFocus()
  })

  it('enfoca «Cancelar» cuando la acción es destructiva', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Escenario tone="danger" onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Eliminar elemento' }))

    // Quien pulsa Intro por inercia no debería borrar nada.
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('acota el tabulador y devuelve el foco al cerrarse', async () => {
    const user = userEvent.setup()
    render(<Escenario tone="danger" />)

    const trigger = screen.getByRole('button', { name: 'Eliminar elemento' })
    await user.click(trigger)

    const cancelar = screen.getByRole('button', { name: 'Cancelar' })
    const eliminar = screen.getByRole('button', { name: 'Eliminar' })

    await user.tab()
    expect(eliminar).toHaveFocus()
    await user.tab()
    expect(cancelar).toHaveFocus()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(trigger).toHaveFocus()
  })

  it('describe el diálogo con su mensaje', async () => {
    const user = userEvent.setup()
    render(<Escenario />)

    await user.click(screen.getByRole('button', { name: 'Eliminar elemento' }))

    expect(screen.getByRole('alertdialog', { name: '¿Eliminar el elemento?' }))
      .toHaveAccessibleDescription('Esta acción no se puede deshacer.')
  })
})
