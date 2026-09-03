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

  it('shows email validation error on real-time validation', async () => {
    const user = userEvent.setup()

    renderLoginView()

    const emailInput = screen.getByLabelText('Correo electrónico')
    await user.type(emailInput, 'invalid-email')

    // Wait for debounced validation
    await waitFor(
      () => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
      },
      { timeout: 1000 },
    )

    // Submit button should be disabled
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeDisabled()
  })

  it('clears email validation error when corrected', async () => {
    const user = userEvent.setup()

    renderLoginView()

    const emailInput = screen.getByLabelText('Correo electrónico')
    await user.type(emailInput, 'invalid')

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
    })

    // Clear and type valid email
    await user.clear(emailInput)
    await user.type(emailInput, 'valid@example.com')

    // Wait for error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/email inválido/i)).not.toBeInTheDocument()
    })

    // Submit button should be enabled
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).not.toBeDisabled()
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
    renderLoginView('/login?oauth_error=profile_error')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo completar el acceso con el proveedor.',
    )
  })

  it('ignores free text passed in the query string as an oauth error', async () => {
    // Antes, `oauth_error_message` se mostraba tal cual y tenía prioridad sobre el
    // código: bastaba enviar un enlace para poner cualquier texto en la página de
    // login legítima, con su dominio y su candado. Solo se aceptan códigos conocidos.
    renderLoginView(
      '/login?oauth_error=profile_error&oauth_error_message=Tu%20cuenta%20fue%20suspendida%2C%20llama%20al%20900123456',
    )

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No se pudo completar el acceso con el proveedor.')
    expect(alerta).not.toHaveTextContent('900123456')
  })

  it('falls back to a generic message for an unknown oauth error code', async () => {
    renderLoginView('/login?oauth_error=codigo_que_no_existe')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo completar el acceso con el proveedor.',
    )
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
