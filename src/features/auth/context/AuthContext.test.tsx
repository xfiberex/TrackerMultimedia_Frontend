import { useState } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'
import { tokenStore } from '@/shared/api/tokenStore'
import { AUTH_LOGOUT_EVENT } from '@/shared/api/axios'
import type { AuthMethodsResponse, AuthResponse, User } from '../schemas/authSchema'

const authApiMocks = vi.hoisted(() => ({
  getMethods: vi.fn(),
  refresh: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  logoutAll: vi.fn(),
  me: vi.fn(),
  getOAuthUrl: vi.fn(),
  linkConfirm: vi.fn(),
}))

vi.mock('@/features/auth/api/AuthAPI', () => ({
  AuthAPI: authApiMocks,
}))

// `env` se lee del `.env` real del equipo, que es un archivo sin versionar. Sin este
// mock, poner `VITE_ENABLE_GOOGLE_AUTH=false` en el .env de tu máquina ponía esta
// suite en rojo mientras que en un clon limpio pasaba: el resultado dependía de la
// configuración local de quien la ejecutara. Aquí los interruptores se declaran.
const envMock = vi.hoisted(() => ({
  apiUrl: '/api',
  enableGoogleAuth: true,
  enableGitHubAuth: true,
}))

vi.mock('@/config/env', () => ({ env: envMock }))

const loginPayload = { email: 'user@test.com', password: 'Test1234!' }
const registerPayload = { email: 'new@test.com', password: 'Test1234!', displayName: 'New User' }
const linkPayload = {
  linkToken: 'link-token',
  provider: 'google',
  email: 'linked@test.com',
  password: 'Test1234!',
} as const

const baseUser: User = {
  id: 'user-1',
  email: 'user@test.com',
  displayName: 'User Test',
  emailConfirmed: true,
  hasPassword: true,
  linkedProviders: [],
}

const updatedUser: User = {
  ...baseUser,
  displayName: 'Updated User',
}

const registerUser: User = {
  id: 'user-2',
  email: registerPayload.email,
  displayName: 'New User',
  emailConfirmed: false,
  hasPassword: true,
  linkedProviders: [],
}

const methods: AuthMethodsResponse = {
  manualEnabled: true,
  googleEnabled: true,
  gitHubEnabled: false,
}

function makeAuthResponse(overrides?: Partial<AuthResponse>): AuthResponse {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 900,
    user: baseUser,
    ...overrides,
  }
}

function ContextProbe() {
  const auth = useAuth()
  const [registeredEmail, setRegisteredEmail] = useState('')

  return (
    <section>
      <div data-testid="user-email">{auth.user?.email ?? 'anonymous'}</div>
      <div data-testid="display-name">{auth.user?.displayName ?? 'none'}</div>
      <div data-testid="loading">{String(auth.isLoading)}</div>
      <div data-testid="methods">
        {auth.methods
          ? `${auth.methods.manualEnabled}-${auth.methods.googleEnabled}-${auth.methods.gitHubEnabled}`
          : 'none'}
      </div>
      <div data-testid="registered-email">{registeredEmail || 'none'}</div>
      <button onClick={() => void auth.login(loginPayload)}>login</button>
      <button onClick={() => void auth.logout().catch(() => {})}>logout</button>
      <button onClick={() => void auth.logoutAll().catch(() => {})}>logout-all</button>
      <button onClick={() => void auth.refreshUser()}>refresh-user</button>
      <button
        onClick={() => {
          void auth.register(registerPayload).then((user) => setRegisteredEmail(user.email))
        }}
      >
        register
      </button>
      <button onClick={() => void auth.linkConfirm(linkPayload)}>link-confirm</button>
    </section>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    tokenStore.set(null)
    authApiMocks.getMethods.mockResolvedValue(methods)
    authApiMocks.refresh.mockResolvedValue(makeAuthResponse())
    authApiMocks.login.mockResolvedValue(makeAuthResponse())
    authApiMocks.register.mockResolvedValue(registerUser)
    authApiMocks.logout.mockResolvedValue(undefined)
    authApiMocks.logoutAll.mockResolvedValue(undefined)
    authApiMocks.me.mockResolvedValue(updatedUser)
    authApiMocks.linkConfirm.mockResolvedValue(
      makeAuthResponse({
        user: {
          ...baseUser,
          email: linkPayload.email,
          displayName: 'Linked User',
          linkedProviders: ['google'],
        },
        accessToken: 'linked-access',
        refreshToken: 'linked-refresh',
      }),
    )
  })

  afterEach(() => {
    localStorage.clear()
    tokenStore.set(null)
    envMock.enableGoogleAuth = true
    envMock.enableGitHubAuth = true
  })

  it('loads available auth methods and finishes initialization without refresh token', async () => {
    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    expect(authApiMocks.getMethods).toHaveBeenCalledTimes(1)
    expect(authApiMocks.refresh).not.toHaveBeenCalled()
    expect(screen.getByTestId('methods')).toHaveTextContent('true-true-false')
    expect(screen.getByTestId('user-email')).toHaveTextContent('anonymous')
  })

  it('oculta un proveedor que el .env apaga aunque el backend lo ofrezca', async () => {
    envMock.enableGoogleAuth = false

    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('methods')).toHaveTextContent('true-false-false')
  })

  it('no puede encender un proveedor que el backend tiene deshabilitado', async () => {
    // La operación es un AND, no un OR: el .env es una máscara de interfaz y la
    // autorización sigue viviendo entera en el servidor. Si esto llegara a pasar a
    // OR, el frontend ofrecería un botón que el backend rechaza.
    authApiMocks.getMethods.mockResolvedValueOnce({
      manualEnabled: true,
      googleEnabled: false,
      gitHubEnabled: false,
    })
    envMock.enableGoogleAuth = true
    envMock.enableGitHubAuth = true

    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('methods')).toHaveTextContent('true-false-false')
  })

  it('falls back to manual auth methods when loading methods fails', async () => {
    authApiMocks.getMethods.mockRejectedValueOnce(new Error('methods failed'))

    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('methods')).toHaveTextContent('true-false-false'))
  })

  it('recovers the session from a stored refresh token on mount', async () => {
    localStorage.setItem('refreshToken', 'saved-refresh')
    authApiMocks.refresh.mockResolvedValueOnce(
      makeAuthResponse({
        accessToken: 'restored-access',
        refreshToken: 'rotated-refresh',
      }),
    )

    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent(baseUser.email))

    expect(authApiMocks.refresh).toHaveBeenCalledWith('saved-refresh')
    expect(tokenStore.get()).toBe('restored-access')
    expect(localStorage.getItem('refreshToken')).toBe('rotated-refresh')
  })

  it('logs in and persists the new session', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await user.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent(baseUser.email))

    expect(authApiMocks.login).toHaveBeenCalledWith(loginPayload)
    expect(tokenStore.get()).toBe('access-token')
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token')
  })

  it('register proxies the created user result', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await user.click(screen.getByRole('button', { name: 'register' }))

    await waitFor(() => expect(screen.getByTestId('registered-email')).toHaveTextContent(registerPayload.email))
    expect(authApiMocks.register).toHaveBeenCalledWith(registerPayload)
  })

  it('logout clears the session even when the API request fails', async () => {
    const user = userEvent.setup()
    localStorage.setItem('refreshToken', 'saved-refresh')
    authApiMocks.refresh.mockResolvedValueOnce(
      makeAuthResponse({
        accessToken: 'restored-access',
        refreshToken: 'rotated-refresh',
      }),
    )
    authApiMocks.logout.mockRejectedValueOnce(new Error('logout failed'))

    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent(baseUser.email))
    await user.click(screen.getByRole('button', { name: 'logout' }))

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent('anonymous'))

    expect(authApiMocks.logout).toHaveBeenCalledWith('rotated-refresh')
    expect(tokenStore.get()).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('refreshUser reloads the current user from the backend', async () => {
    const user = userEvent.setup()
    localStorage.setItem('refreshToken', 'saved-refresh')

    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('display-name')).toHaveTextContent(baseUser.displayName))
    await user.click(screen.getByRole('button', { name: 'refresh-user' }))

    await waitFor(() => expect(screen.getByTestId('display-name')).toHaveTextContent(updatedUser.displayName))
    expect(authApiMocks.me).toHaveBeenCalledTimes(1)
  })

  it('logoutAll clears the current session even when the API request fails', async () => {
    const user = userEvent.setup()
    localStorage.setItem('refreshToken', 'saved-refresh')
    authApiMocks.refresh.mockResolvedValueOnce(
      makeAuthResponse({
        accessToken: 'restored-access',
        refreshToken: 'rotated-refresh',
      }),
    )
    authApiMocks.logoutAll.mockRejectedValueOnce(new Error('logout all failed'))

    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent(baseUser.email))
    await user.click(screen.getByRole('button', { name: 'logout-all' }))

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent('anonymous'))

    expect(authApiMocks.logoutAll).toHaveBeenCalledTimes(1)
    expect(tokenStore.get()).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('linkConfirm stores the linked session and user', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await user.click(screen.getByRole('button', { name: 'link-confirm' }))

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent(linkPayload.email))
    expect(authApiMocks.linkConfirm).toHaveBeenCalledWith(linkPayload)
    expect(tokenStore.get()).toBe('linked-access')
    expect(localStorage.getItem('refreshToken')).toBe('linked-refresh')
  })

  it('clears the current session when the forced logout event is dispatched', async () => {
    localStorage.setItem('refreshToken', 'saved-refresh')

    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent(baseUser.email))

    tokenStore.set('restored-access')
    act(() => {
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
    })

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent('anonymous'))
    expect(tokenStore.get()).toBeNull()
  })
})
