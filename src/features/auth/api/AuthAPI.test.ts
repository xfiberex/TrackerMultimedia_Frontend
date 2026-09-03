import type {
  AuthMethodsResponse,
  AuthResponse,
  OAuthInitResponse,
  User,
} from '../schemas/authSchema'

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock('@/shared/api/axios', () => ({
  default: apiMock,
}))

import { AuthAPI } from './AuthAPI'

describe('AuthAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('register posts to the register endpoint and returns the created user', async () => {
    const user: User = {
      id: 'user-1',
      email: 'user@test.com',
      displayName: 'tester',
      emailConfirmed: false,
      hasPassword: true,
      linkedProviders: ['password'],
    }
    apiMock.post.mockResolvedValue({ data: user })

    const payload = {
      email: 'user@test.com',
      userName: 'tester',
      password: 'Pass123$',
      confirmPassword: 'Pass123$',
    }

    await expect(AuthAPI.register(payload)).resolves.toEqual(user)
    expect(apiMock.post).toHaveBeenCalledWith('/auth/register', payload)
  })

  it('login and refresh return the auth response payload', async () => {
    const authResponse: AuthResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      user: {
        id: 'user-1',
        email: 'user@test.com',
        displayName: 'tester',
        emailConfirmed: true,
        hasPassword: true,
        linkedProviders: ['password'],
      },
    }
    apiMock.post.mockResolvedValue({ data: authResponse })

    await expect(AuthAPI.login({ email: 'user@test.com', password: 'Pass123$' })).resolves.toEqual(
      authResponse,
    )
    await expect(AuthAPI.refresh('refresh-token')).resolves.toEqual(authResponse)

    expect(apiMock.post).toHaveBeenNthCalledWith(1, '/auth/login', {
      email: 'user@test.com',
      password: 'Pass123$',
    })
    expect(apiMock.post).toHaveBeenNthCalledWith(2, '/auth/refresh', {
      refreshToken: 'refresh-token',
    })
  })

  it('logout-style endpoints resolve void after posting the expected payload', async () => {
    apiMock.post.mockResolvedValue({})

    await expect(AuthAPI.logout('refresh-token')).resolves.toBeUndefined()
    await expect(AuthAPI.logoutAll()).resolves.toBeUndefined()
    await expect(
      AuthAPI.changePassword({ currentPassword: 'Old123$', newPassword: 'New123$' }),
    ).resolves.toBeUndefined()
    await expect(
      AuthAPI.resetPassword({
        email: 'user@test.com',
        token: 'reset-token',
        newPassword: 'New123$',
      }),
    ).resolves.toBeUndefined()

    expect(apiMock.post).toHaveBeenNthCalledWith(1, '/auth/logout', {
      refreshToken: 'refresh-token',
    })
    expect(apiMock.post).toHaveBeenNthCalledWith(2, '/auth/logout-all')
    expect(apiMock.post).toHaveBeenNthCalledWith(3, '/auth/change-password', {
      currentPassword: 'Old123$',
      newPassword: 'New123$',
    })
    expect(apiMock.post).toHaveBeenNthCalledWith(4, '/auth/reset-password', {
      email: 'user@test.com',
      token: 'reset-token',
      newPassword: 'New123$',
    })
  })

  it('reads and updates the current profile through the expected endpoints', async () => {
    const user: User = {
      id: 'user-1',
      email: 'updated@test.com',
      displayName: 'updated-user',
      emailConfirmed: true,
      hasPassword: true,
      linkedProviders: ['password', 'google'],
    }
    apiMock.get.mockResolvedValueOnce({ data: user })
    apiMock.put.mockResolvedValueOnce({ data: user })

    await expect(AuthAPI.me()).resolves.toEqual(user)
    await expect(AuthAPI.updateProfile({ displayName: 'updated-user' })).resolves.toEqual(user)

    expect(apiMock.get).toHaveBeenCalledWith('/auth/me')
    expect(apiMock.put).toHaveBeenCalledWith('/auth/profile', { displayName: 'updated-user' })
  })

  it('handles password recovery and email confirmation endpoints', async () => {
    apiMock.post
      .mockResolvedValueOnce({ data: { message: 'Recovery email sent.' } })
      .mockResolvedValueOnce({ data: { message: 'Email confirmed.' } })
      .mockResolvedValueOnce({ data: { message: 'Confirmation resent.' } })

    await expect(AuthAPI.forgotPassword({ email: 'user@test.com' })).resolves.toEqual({
      message: 'Recovery email sent.',
    })
    await expect(
      AuthAPI.confirmEmail({ email: 'user@test.com', token: 'token-1' }),
    ).resolves.toEqual({
      message: 'Email confirmed.',
    })
    await expect(AuthAPI.resendConfirmation({ email: 'user@test.com' })).resolves.toEqual({
      message: 'Confirmation resent.',
    })

    expect(apiMock.post).toHaveBeenNthCalledWith(1, '/auth/forgot-password', {
      email: 'user@test.com',
    })
    expect(apiMock.post).toHaveBeenNthCalledWith(2, '/auth/confirm-email', {
      email: 'user@test.com',
      token: 'token-1',
    })
    expect(apiMock.post).toHaveBeenNthCalledWith(3, '/auth/resend-confirmation', {
      email: 'user@test.com',
    })
  })

  it('reads auth methods and oauth initialization responses', async () => {
    const methods: AuthMethodsResponse = {
      manualEnabled: true,
      googleEnabled: true,
      gitHubEnabled: false,
    }
    const oauthInit: OAuthInitResponse = {
      authorizationUrl: 'https://accounts.test/oauth',
    }
    apiMock.get.mockResolvedValueOnce({ data: methods }).mockResolvedValueOnce({ data: oauthInit })

    await expect(AuthAPI.getMethods()).resolves.toEqual(methods)
    await expect(AuthAPI.getOAuthUrl('google', '/profile settings')).resolves.toEqual(oauthInit)

    expect(apiMock.get).toHaveBeenNthCalledWith(1, '/auth/methods')
    expect(apiMock.get).toHaveBeenNthCalledWith(
      2,
      '/auth/google/init?returnPath=%2Fprofile%20settings',
    )
  })

  it('posts the link confirmation payload and returns a session', async () => {
    const authResponse: AuthResponse = {
      accessToken: 'linked-access',
      refreshToken: 'linked-refresh',
      expiresIn: 3600,
      user: {
        id: 'user-1',
        email: 'linked@test.com',
        displayName: 'linked-user',
        emailConfirmed: true,
        hasPassword: true,
        linkedProviders: ['password', 'github'],
      },
    }
    apiMock.post.mockResolvedValue({ data: authResponse })

    await expect(
      AuthAPI.linkConfirm({
        provider: 'github',
        email: 'linked@test.com',
        linkToken: 'oauth-token',
        password: 'Pass123$',
      }),
    ).resolves.toEqual(authResponse)

    expect(apiMock.post).toHaveBeenCalledWith('/auth/link-confirm', {
      provider: 'github',
      email: 'linked@test.com',
      linkToken: 'oauth-token',
      password: 'Pass123$',
    })
  })
})
