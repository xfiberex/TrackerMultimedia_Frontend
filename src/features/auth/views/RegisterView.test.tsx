import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { AuthMethodsResponse, User } from '../schemas/authSchema'

const navigateMock = vi.hoisted(() => vi.fn())
const authState = vi.hoisted(() => ({
  user: null as User | null,
  isLoading: false,
  methods: null as AuthMethodsResponse | null,
  register: vi.fn(),
  loginWithOAuth: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../context/useAuth', () => ({
  useAuth: () => authState,
}))

import RegisterView from './RegisterView'

function renderRegisterView() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterView />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RegisterView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = null
    authState.isLoading = false
    authState.methods = null
  })

  it('redirects authenticated users to the library', async () => {
    authState.user = {
      id: 'user-1',
      email: 'user@test.com',
      displayName: 'Tester',
      emailConfirmed: true,
      hasPassword: true,
      linkedProviders: ['password'],
    }

    renderRegisterView()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/library', { replace: true })
    })
  })

  it('blocks submission when the passwords do not match', async () => {
    const user = userEvent.setup()

    renderRegisterView()

    await user.type(screen.getByLabelText('Correo electrónico'), 'user@test.com')
    await user.type(screen.getByLabelText(/Nombre visible/i), 'New User')
    await user.type(screen.getByLabelText('Contraseña'), 'Pass123$')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'OtherPass123$')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.')
    expect(authState.register).not.toHaveBeenCalled()
  })

  it('submits the registration data and shows the confirmation state', async () => {
    const user = userEvent.setup()
    authState.register.mockResolvedValue({})

    renderRegisterView()

    await user.type(screen.getByLabelText('Correo electrónico'), 'user@test.com')
    await user.type(screen.getByLabelText(/Nombre visible/i), '  New User  ')
    await user.type(screen.getByLabelText('Contraseña'), 'Pass123$')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Pass123$')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => {
      expect(authState.register).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'Pass123$',
        displayName: 'New User',
      })
    })

    expect(await screen.findByText('¡Cuenta creada!')).toBeInTheDocument()
    expect(screen.getByText('user@test.com')).toBeInTheDocument()
  })

  it('renders oauth actions and shows their error message when the start fails', async () => {
    const user = userEvent.setup()
    authState.methods = {
      manualEnabled: true,
      googleEnabled: true,
      gitHubEnabled: false,
    }
    authState.loginWithOAuth.mockRejectedValue({ response: { data: 'No se pudo iniciar OAuth.' } })

    renderRegisterView()

    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    await waitFor(() => {
      expect(authState.loginWithOAuth).toHaveBeenCalledWith('google')
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo iniciar OAuth.')
  })
})
