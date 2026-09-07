import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/shared/components/ToastProvider'
import type { User } from '../schemas/authSchema'

const navigateMock = vi.hoisted(() => vi.fn())
const updateProfileMock = vi.hoisted(() => vi.fn())
const changePasswordMock = vi.hoisted(() => vi.fn())
const logoutAllMock = vi.hoisted(() => vi.fn())
const deleteAccountMock = vi.hoisted(() => vi.fn())
const exportPersonalDataMock = vi.hoisted(() => vi.fn())
const completeSessionMock = vi.hoisted(() => vi.fn())
const authState = vi.hoisted(() => ({
  user: null as User | null,
  refreshUser: vi.fn(),
  logoutAll: logoutAllMock,
  deleteAccount: deleteAccountMock,
  completeSession: completeSessionMock,
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
    exportPersonalData: exportPersonalDataMock,
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

  it('downloads the personal data file and revokes the object URL', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn(() => 'blob:datos')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true })
    exportPersonalDataMock.mockResolvedValue({
      blob: new Blob(['{}'], { type: 'application/json' }),
      fileName: 'tracker-datos-personales-20260904-120000.json',
    })

    renderProfileView()
    await user.click(screen.getByRole('button', { name: 'Descargar mis datos' }))

    await waitFor(() => expect(exportPersonalDataMock).toHaveBeenCalledTimes(1))
    expect(createObjectURL).toHaveBeenCalled()
    // Sin revoke, el blob de una biblioteca entera se queda en memoria hasta recargar.
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:datos')
    expect(await screen.findByText('Se descargó el archivo con tus datos.')).toBeInTheDocument()
  })

  it('reports the error and re-enables the button when the download fails', async () => {
    const user = userEvent.setup()
    exportPersonalDataMock.mockRejectedValue(new Error('boom'))

    renderProfileView()
    await user.click(screen.getByRole('button', { name: 'Descargar mis datos' }))

    expect(await screen.findByText('No se pudieron descargar tus datos.')).toBeInTheDocument()
    // El botón vuelve a estar disponible: un fallo de red no debe dejarlo bloqueado.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Descargar mis datos' })).toBeEnabled(),
    )
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

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Las contraseñas nuevas no coinciden.',
    )
    expect(changePasswordMock).not.toHaveBeenCalled()
  })

  it('changes the password, adopts the new session, clears the form and shows a toast', async () => {
    const user = userEvent.setup()
    const session = {
      accessToken: 'jwt-nuevo',
      expiresIn: 900,
      user: authState.user,
    }
    changePasswordMock.mockResolvedValue(session)

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

    // El servidor acaba de revocar el token de refresco de este navegador junto con los
    // demás (T6-01). Si la vista no adopta la sesión que viene en la respuesta, el usuario
    // se queda sin poder renovar y acaba en la pantalla de login sin saber por qué.
    expect(completeSessionMock).toHaveBeenCalledWith(session)

    expect(
      await screen.findByText(
        'Contraseña actualizada. Se han cerrado las sesiones de los demás dispositivos.',
      ),
    ).toBeInTheDocument()
    expect(currentPassword).toHaveValue('')
    expect(newPassword).toHaveValue('')
    expect(confirmPassword).toHaveValue('')
  })

  it('confirms logout-all, shows a toast and redirects back to login', async () => {
    const user = userEvent.setup()
    logoutAllMock.mockResolvedValue(undefined)

    renderProfileView()

    await user.click(screen.getByRole('button', { name: 'Cerrar todas las sesiones' }))
    expect(
      screen.getByRole('alertdialog', { name: 'Cerrar todas las sesiones' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sí, cerrar todas' }))

    await waitFor(() => {
      expect(logoutAllMock).toHaveBeenCalledTimes(1)
    })

    expect(
      await screen.findByText('Se cerraron todas tus sesiones correctamente.'),
    ).toBeInTheDocument()
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })

  /**
   * T1-14. Lo que se comprueba aquí es la doble confirmación, no la llamada: la
   * operación no tiene vuelta atrás y el requisito es que un clic suelto no baste.
   */
  it('mantiene el borrado deshabilitado hasta escribir la contraseña', async () => {
    renderProfileView()

    const borrar = screen.getByRole('button', { name: 'Borrar mi cuenta' })
    expect(borrar).toBeDisabled()

    await userEvent.setup().type(screen.getByLabelText('Escribe tu contraseña para continuar'), 'x')

    expect(borrar).toBeEnabled()
  })

  it('borra la cuenta tras la segunda confirmación y vuelve al login', async () => {
    const user = userEvent.setup()
    deleteAccountMock.mockResolvedValue(undefined)

    renderProfileView()

    await user.type(screen.getByLabelText('Escribe tu contraseña para continuar'), 'Test1234!')
    await user.click(screen.getByRole('button', { name: 'Borrar mi cuenta' }))

    expect(
      screen.getByRole('alertdialog', { name: 'Borrar la cuenta definitivamente' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sí, borrar mi cuenta' }))

    await waitFor(() => {
      expect(deleteAccountMock).toHaveBeenCalledWith({ password: 'Test1234!' })
    })
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('muestra el error junto al campo y no sale de la sesión si el borrado falla', async () => {
    const user = userEvent.setup()
    deleteAccountMock.mockRejectedValue({
      response: { data: { detail: 'La contraseña no es correcta.' } },
    })

    renderProfileView()

    await user.type(screen.getByLabelText('Escribe tu contraseña para continuar'), 'mal')
    await user.click(screen.getByRole('button', { name: 'Borrar mi cuenta' }))
    await user.click(screen.getByRole('button', { name: 'Sí, borrar mi cuenta' }))

    expect(await screen.findByText('La contraseña no es correcta.')).toBeInTheDocument()
    // Quedarse dentro importa: si se limpiara la sesión igualmente, quien escriba mal la
    // contraseña acabaría en el login creyendo que borró su cuenta.
    expect(navigateMock).not.toHaveBeenCalledWith('/login', { replace: true })
  })

  it('pide escribir el correo exacto en una cuenta sin contraseña', async () => {
    const user = userEvent.setup()
    authState.user = { ...authState.user!, hasPassword: false, linkedProviders: ['google'] }
    deleteAccountMock.mockResolvedValue(undefined)

    renderProfileView()

    const campo = screen.getByLabelText(`Escribe ${authState.user!.email} para continuar`)
    const borrar = screen.getByRole('button', { name: 'Borrar mi cuenta' })

    await user.type(campo, 'otro@correo.com')
    expect(borrar).toBeDisabled()

    await user.clear(campo)
    await user.type(campo, authState.user!.email)
    expect(borrar).toBeEnabled()
  })
})
