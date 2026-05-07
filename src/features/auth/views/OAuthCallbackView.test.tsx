import { render, waitFor } from '@testing-library/react'
import { tokenStore } from '@/shared/api/tokenStore'

const navigateMock = vi.hoisted(() => vi.fn())
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
    expect(refreshUserMock).not.toHaveBeenCalled()
  })

  it('redirects to login when the callback hash does not contain both tokens', async () => {
    window.history.replaceState({}, '', '/oauth-callback#access_token=only-access')

    render(<OAuthCallbackView />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login?oauth_error=missing_tokens', { replace: true })
    })
    expect(refreshUserMock).not.toHaveBeenCalled()
  })

  it('stores both tokens, refreshes the user and redirects to the requested path', async () => {
    refreshUserMock.mockResolvedValue(undefined)
    window.history.replaceState(
      {},
      '',
      '/oauth-callback#access_token=oauth-access&refresh_token=oauth-refresh&return_path=%2Fprofile',
    )

    render(<OAuthCallbackView />)

    await waitFor(() => {
      expect(refreshUserMock).toHaveBeenCalledTimes(1)
    })

    expect(tokenStore.get()).toBe('oauth-access')
    expect(localStorage.getItem('refreshToken')).toBe('oauth-refresh')

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/profile', { replace: true })
    })
  })

  it('falls back to a session error when refreshing the user fails', async () => {
    refreshUserMock.mockRejectedValue(new Error('refresh failed'))
    window.history.replaceState({}, '', '/oauth-callback#access_token=oauth-access&refresh_token=oauth-refresh')

    render(<OAuthCallbackView />)

    await waitFor(() => {
      expect(refreshUserMock).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login?oauth_error=session_error', { replace: true })
    })
  })
})