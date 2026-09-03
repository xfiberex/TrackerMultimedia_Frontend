import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/shared/components/ToastProvider'

const confirmEmailMock = vi.hoisted(() => vi.fn())

vi.mock('../api/AuthAPI', () => ({
  AuthAPI: {
    confirmEmail: confirmEmailMock,
  },
}))

import ConfirmEmailView from './ConfirmEmailView'

function renderConfirmEmailView(initialEntry = '/confirm-email') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/confirm-email" element={<ConfirmEmailView />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ConfirmEmailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('confirms the account when both params are present', async () => {
    confirmEmailMock.mockResolvedValue({ message: 'Tu cuenta fue confirmada.' })

    renderConfirmEmailView('/confirm-email?email=user%40test.com&token=confirm-token')

    await waitFor(() => {
      expect(confirmEmailMock).toHaveBeenCalledWith({
        email: 'user@test.com',
        token: 'confirm-token',
      })
    })

    expect(await screen.findByText('¡Cuenta confirmada!')).toBeInTheDocument()
    expect(screen.getAllByText('Tu cuenta fue confirmada.').length).toBeGreaterThan(0)
  })

  it('fails fast when the confirmation params are missing', async () => {
    renderConfirmEmailView('/confirm-email?email=user%40test.com')

    expect(await screen.findByText('Enlace no válido')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El enlace de confirmación no es válido o ha expirado.',
    )
    expect(confirmEmailMock).not.toHaveBeenCalled()
  })

  it('shows the error state when the API rejects the confirmation', async () => {
    confirmEmailMock.mockRejectedValue(new Error('expired token'))

    renderConfirmEmailView('/confirm-email?email=user%40test.com&token=confirm-token')

    expect(await screen.findByText('Enlace no válido')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El enlace de confirmación no es válido o ha expirado.',
    )
  })
})
