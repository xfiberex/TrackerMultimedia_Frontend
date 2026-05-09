import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/shared/components/ToastProvider'
import type { AuthMethodsResponse, User } from '../schemas/authSchema'

const navigateMock = vi.hoisted(() => vi.fn())
const authState = vi.hoisted(() => ({
  user: null as User | null,
  isLoading: false,
  methods: null as AuthMethodsResponse | null,
  login: vi.fn(),
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

import LoginView from './LoginView'

function renderLoginView(initialEntry: string | { pathname: string; state?: unknown } = '/login') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginView />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = null
    authState.isLoading = false
    authState.methods = null
  })

  it('redirects authenticated users straight to the library', async () => {
    authState.user = {
      id: 'user-1',
      email: 'user@test.com',
      displayName: 'Tester',
      emailConfirmed: true,
      hasPassword: true,
      linkedProviders: ['password'],
    }

    renderLoginView()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/library', { replace: true })
    })
  })

  it('submits credentials and returns to the requested path on success', async () => {
    const user = userEvent.setup()
    authState.login.mockResolvedValue(undefined)

    renderLoginView({ pathname: '/login', state: { from: { pathname: '/profile' } } })

    await user.type(screen.getByLabelText('Correo electrónico'), 'user@test.com')
    await user.type(screen.getByLabelText('Contraseña'), 'Pass123$')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() => {
      expect(authState.login).toHaveBeenCalledWith({ email: 'user@test.com', password: 'Pass123$' })
    })

    expect(navigateMock).toHaveBeenCalledWith('/profile', { replace: true })
  })

  it('shows the extracted manual login error', async () => {
    const user = userEvent.setup()
    authState.login.mockRejectedValue({ response: { data: 'Credenciales inválidas.' } })

    renderLoginView()

    await user.type(screen.getByLabelText('Correo electrónico'), 'user@test.com')
    await user.type(screen.getByLabelText('Contraseña'), 'wrong-pass')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas.')
  })

  it('shows the oauth error returned in the query string', async () => {
    renderLoginView('/login?oauth_error=profile_error&oauth_error_message=No%20se%20pudo%20intercambiar%20el%20c%C3%B3digo%20con%20Google.')

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo intercambiar el código con Google.')
  })

  it('renders OAuth methods and shows an error when an OAuth start fails', async () => {
    const user = userEvent.setup()
    authState.methods = {
      manualEnabled: true,
      googleEnabled: true,
      gitHubEnabled: true,
    }
    authState.loginWithOAuth.mockRejectedValue({ response: { data: 'OAuth no disponible.' } })

    renderLoginView({ pathname: '/login', state: { message: 'Sesión cerrada correctamente.' } })

    expect(screen.getByText('Sesión cerrada correctamente.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    await waitFor(() => {
      expect(authState.loginWithOAuth).toHaveBeenCalledWith('google')
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('OAuth no disponible.')
    expect(screen.getByRole('button', { name: 'Continuar con GitHub' })).toBeEnabled()
  })
})
