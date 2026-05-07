import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const navigateMock = vi.hoisted(() => vi.fn())
const resetPasswordMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../api/AuthAPI', () => ({
  AuthAPI: {
    resetPassword: resetPasswordMock,
  },
}))

import ResetPasswordView from './ResetPasswordView'

function renderResetPasswordView(initialEntry = '/reset-password') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordView />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResetPasswordView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses email and token from the URL and completes the reset flow', async () => {
    const user = userEvent.setup()
    resetPasswordMock.mockResolvedValue(undefined)

    renderResetPasswordView('/reset-password?email=user%40test.com&token=reset-token')

    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('user@test.com')
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('readonly')
    expect(screen.queryByLabelText('Código de recuperación')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Nueva contraseña'), 'NewPass123$')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'NewPass123$')
    await user.click(screen.getByRole('button', { name: 'Establecer nueva contraseña' }))

    await waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith({
        email: 'user@test.com',
        token: 'reset-token',
        newPassword: 'NewPass123$',
      })
    })

    expect(navigateMock).toHaveBeenCalledWith('/login', {
      state: { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' },
    })
  })

  it('blocks submission when the passwords do not match', async () => {
    const user = userEvent.setup()

    renderResetPasswordView('/reset-password?email=user%40test.com&token=reset-token')

    await user.type(screen.getByLabelText('Nueva contraseña'), 'NewPass123$')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'OtherPass123$')
    await user.click(screen.getByRole('button', { name: 'Establecer nueva contraseña' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.')
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('shows the token field when it is missing from the URL and surfaces API errors', async () => {
    const user = userEvent.setup()
    resetPasswordMock.mockRejectedValue({ response: { data: 'El enlace ya expiró.' } })

    renderResetPasswordView('/reset-password?email=user%40test.com')

    await user.type(screen.getByLabelText('Código de recuperación'), 'manual-token')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'NewPass123$')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'NewPass123$')
    await user.click(screen.getByRole('button', { name: 'Establecer nueva contraseña' }))

    await waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith({
        email: 'user@test.com',
        token: 'manual-token',
        newPassword: 'NewPass123$',
      })
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace ya expiró.')
  })
})
