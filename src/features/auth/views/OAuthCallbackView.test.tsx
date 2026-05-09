import { render, waitFor } from '@testing-library/react'
import { tokenStore } from '@/shared/api/tokenStore'

const navigateMock = vi.hoisted(() => vi.fn())
const completeSessionMock = vi.hoisted(() => vi.fn())
const refreshUserMock = vi.hoisted(() => vi.fn())

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
    refreshUser: refreshUserMock,
  }),
}))

import OAuthCallbackView from './OAuthCallbackView'

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
      expect(navigateMock).toHaveBeenCalledWith('/login?oauth_error=provider_denied', { replace: true })
    })
    expect(completeSessionMock).not.toHaveBeenCalled()
    expect(refreshUserMock).not.toHaveBeenCalled()
  })

  it('redirects to login when the callback hash does not contain both tokens', async () => {
    window.history.replaceState({}, '', '/oauth-callback#access_token=only-access')

    render(<OAuthCallbackView />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login?oauth_error=missing_tokens', { replace: true })
    })
    expect(completeSessionMock).not.toHaveBeenCalled()
    expect(refreshUserMock).not.toHaveBeenCalled()
  })

  it('completes the session from the callback payload and redirects to the requested path', async () => {
    const encodedUser = encodeURIComponent(JSON.stringify({
      id: 'oauth-user',
      email: 'oauth@test.com',
      displayName: 'OAuth User',
      emailConfirmed: true,
      hasPassword: false,
      linkedProviders: ['google'],
    }))

    window.history.replaceState(
      {},
      '',
      `/oauth-callback#access_token=oauth-access&refresh_token=oauth%2Brefresh%2Fvalue%3D&return_path=%2Fprofile&expires_in=900&user=${encodedUser}`,
    )

    render(<OAuthCallbackView />)

    await waitFor(() => {
      expect(completeSessionMock).toHaveBeenCalledWith({
        accessToken: 'oauth-access',
        refreshToken: 'oauth+refresh/value=',
        expiresIn: 900,
        user: {
          id: 'oauth-user',
          email: 'oauth@test.com',
          displayName: 'OAuth User',
          emailConfirmed: true,
          hasPassword: false,
          linkedProviders: ['google'],
        },
      })
    })

    expect(refreshUserMock).not.toHaveBeenCalled()
    expect(tokenStore.get()).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/profile', { replace: true })
    })
  })

  it('falls back to the legacy refresh flow when the embedded user is absent', async () => {
    refreshUserMock.mockResolvedValue(undefined)
    window.history.replaceState({}, '', '/oauth-callback#access_token=oauth-access&refresh_token=oauth%2Brefresh%2Fvalue%3D')

    render(<OAuthCallbackView />)

    await waitFor(() => {
      expect(refreshUserMock).toHaveBeenCalledTimes(1)
    })

    expect(tokenStore.get()).toBe('oauth-access')
    expect(localStorage.getItem('refreshToken')).toBe('oauth+refresh/value=')
  })

  it('falls back to a session error when the legacy refresh flow fails', async () => {
    refreshUserMock.mockRejectedValue(new Error('refresh failed'))
    window.history.replaceState({}, '', '/oauth-callback#access_token=oauth-access&refresh_token=oauth%2Brefresh%2Fvalue%3D')

    render(<OAuthCallbackView />)

    await waitFor(() => {
      expect(refreshUserMock).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login?oauth_error=session_error', { replace: true })
    })
  })
})