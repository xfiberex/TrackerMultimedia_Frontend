import { render, waitFor } from '@testing-library/react'
import { tokenStore } from '@/shared/api/tokenStore'

const navigateMock = vi.hoisted(() => vi.fn())
const completeSessionMock = vi.hoisted(() => vi.fn())
const refreshMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    completeSession: completeSessionMock,
  }),
}))

vi.mock('../api/AuthAPI', () => ({
  AuthAPI: {
    refresh: refreshMock,
  },
}))

import OAuthCallbackView from './OAuthCallbackView'

const session = {
  accessToken: 'oauth-access',
  expiresIn: 900,
  user: {
    id: 'oauth-user',
    email: 'oauth@test.com',
    displayName: 'OAuth User',
    emailConfirmed: true,
    hasPassword: false,
    linkedProviders: ['google'],
  },
}

describe('OAuthCallbackView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tokenStore.set(null)
    localStorage.clear()
    window.history.replaceState({}, '', '/oauth-callback')
  })

  it('redirects back to login when the backend returns an oauth error', async () => {
    window.history.replaceState({}, '', '/oauth-callback?oauth_error=provider_denied')

    render(<OAuthCallbackView />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login?oauth_error=provider_denied', {
        replace: true,
      })
    })
    expect(completeSessionMock).not.toHaveBeenCalled()
    // Un error del proveedor no se convierte en un intento de sesión.
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('exchanges the refresh cookie for a session and redirects to the requested path', async () => {
    refreshMock.mockResolvedValue(session)
    window.history.replaceState({}, '', '/oauth-callback#return_path=%2Fprofile')

    render(<OAuthCallbackView />)

    await waitFor(() => {
      expect(completeSessionMock).toHaveBeenCalledWith(session)
    })

    // Sin argumentos: la sesión llega en la cookie que el backend escribió al redirigir.
    expect(refreshMock).toHaveBeenCalledWith()
    expect(localStorage.length).toBe(0)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/profile', { replace: true })
    })
  })

  it('defaults to the library when the fragment carries no return path', async () => {
    refreshMock.mockResolvedValue(session)

    render(<OAuthCallbackView />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/library', { replace: true })
    })
  })

  it('sends the user back to login when the exchange fails', async () => {
    refreshMock.mockRejectedValue(new Error('refresh failed'))
    window.history.replaceState({}, '', '/oauth-callback#return_path=%2Fprofile')

    render(<OAuthCallbackView />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login?oauth_error=session_error', {
        replace: true,
      })
    })
    expect(completeSessionMock).not.toHaveBeenCalled()
  })

  it('never leaves a token in the address bar', async () => {
    refreshMock.mockResolvedValue(session)
    window.history.replaceState({}, '', '/oauth-callback#return_path=%2Flibrary')

    render(<OAuthCallbackView />)

    await waitFor(() => expect(completeSessionMock).toHaveBeenCalled())

    // El backend ya no manda tokens en el fragmento; esta vista tampoco los espera. Si
    // alguien reintrodujera el formato antiguo, este test no lo detectaría solo: lo que
    // lo sostiene es el test de backend sobre la cabecera Location del callback.
    expect(window.location.hash).not.toContain('access_token')
    expect(window.location.hash).not.toContain('refresh_token')
  })
})
