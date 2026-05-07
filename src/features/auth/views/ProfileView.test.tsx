import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/shared/components/ToastProvider'
import type { User } from '../schemas/authSchema'

const navigateMock = vi.hoisted(() => vi.fn())
const updateProfileMock = vi.hoisted(() => vi.fn())
const changePasswordMock = vi.hoisted(() => vi.fn())
const logoutAllMock = vi.hoisted(() => vi.fn())
const authState = vi.hoisted(() => ({
  user: null as User | null,
  refreshUser: vi.fn(),
  logoutAll: logoutAllMock,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../api/AuthAPI', () => ({
  AuthAPI: {
    updateProfile: updateProfileMock,
    changePassword: changePasswordMock,
  },
}))

vi.mock('../context/useAuth', () => ({
  useAuth: () => authState,
}))

import ProfileView from './ProfileView'

function renderProfileView() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<ProfileView />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = {
      id: 'user-1',
      email: 'user@test.com',
      displayName: 'Old Name',
      emailConfirmed: true,
      hasPassword: true,
      linkedProviders: ['password'],
    }
  })

  it('navigates back when the back button is pressed', async () => {
    const user = userEvent.setup()

    renderProfileView()
    await user.click(screen.getByRole('button', { name: '← Volver' }))

    expect(navigateMock).toHaveBeenCalledWith(-1)
  })

  it('updates the display name, refreshes the session and shows a toast', async () => {
    const user = userEvent.setup()
    updateProfileMock.mockResolvedValue(undefined)
    authState.refreshUser.mockResolvedValue(undefined)

    renderProfileView()

    const displayNameInput = screen.getByLabelText('Nombre mostrado')
    await user.clear(displayNameInput)
    await user.type(displayNameInput, 'New Name')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({ displayName: 'New Name' })
    })
    expect(authState.refreshUser).toHaveBeenCalled()
    expect(await screen.findByText('Perfil actualizado correctamente.')).toBeInTheDocument()
  })

  it('blocks the password change when the new passwords do not match', async () => {
    const user = userEvent.setup()

    renderProfileView()

    await user.type(screen.getByLabelText('Contraseña actual'), 'OldPass123$')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'NewPass123$')
    await user.type(screen.getByLabelText('Confirmar nueva contraseña'), 'OtherPass123$')
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Las contraseñas nuevas no coinciden.')
    expect(changePasswordMock).not.toHaveBeenCalled()
  })

  it('changes the password, clears the form and shows a toast', async () => {
    const user = userEvent.setup()
    changePasswordMock.mockResolvedValue(undefined)

    renderProfileView()

    const currentPassword = screen.getByLabelText('Contraseña actual')
    const newPassword = screen.getByLabelText('Nueva contraseña')
    const confirmPassword = screen.getByLabelText('Confirmar nueva contraseña')

    await user.type(currentPassword, 'OldPass123$')
    await user.type(newPassword, 'NewPass123$')
    await user.type(confirmPassword, 'NewPass123$')
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    await waitFor(() => {
      expect(changePasswordMock).toHaveBeenCalledWith({
        currentPassword: 'OldPass123$',
        newPassword: 'NewPass123$',
      })
    })

    expect(await screen.findByText('Contraseña actualizada correctamente.')).toBeInTheDocument()
    expect(currentPassword).toHaveValue('')
    expect(newPassword).toHaveValue('')
    expect(confirmPassword).toHaveValue('')
  })

  it('confirms logout-all, shows a toast and redirects back to login', async () => {
    const user = userEvent.setup()
    logoutAllMock.mockResolvedValue(undefined)

    renderProfileView()

    await user.click(screen.getByRole('button', { name: 'Cerrar todas las sesiones' }))
    expect(screen.getByRole('alertdialog', { name: 'Cerrar todas las sesiones' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sí, cerrar todas' }))

    await waitFor(() => {
      expect(logoutAllMock).toHaveBeenCalledTimes(1)
    })

    expect(await screen.findByText('Se cerraron todas tus sesiones correctamente.')).toBeInTheDocument()
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })
})
