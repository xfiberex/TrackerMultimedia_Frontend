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

// `refresh` no pasa por la instancia de axios sino por `refreshSession`, que comparte una
// única petición en vuelo con el interceptor de 401.
const refreshSessionMock = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/axios', () => ({
  default: apiMock,
  refreshSession: refreshSessionMock,
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
    refreshSessionMock.mockResolvedValue(authResponse)

    await expect(AuthAPI.login({ email: 'user@test.com', password: 'Pass123$' })).resolves.toEqual(
      authResponse,
    )
    await expect(AuthAPI.refresh()).resolves.toEqual(authResponse)

    expect(apiMock.post).toHaveBeenNthCalledWith(1, '/auth/login', {
      email: 'user@test.com',
      password: 'Pass123$',
    })
    // Sin argumentos y sin pasar por la instancia de axios: el token va en la cookie y la
    // petición se comparte con cualquier otra renovación que esté en curso.
    expect(refreshSessionMock).toHaveBeenCalledWith()
  })

  it('logout-style endpoints resolve void after posting the expected payload', async () => {
    apiMock.post.mockResolvedValue({})

    await expect(AuthAPI.logout()).resolves.toBeUndefined()
    await expect(AuthAPI.logoutAll()).resolves.toBeUndefined()
    await expect(
      AuthAPI.resetPassword({
        email: 'user@test.com',
        token: 'reset-token',
        newPassword: 'New123$',
      }),
    ).resolves.toBeUndefined()

    expect(apiMock.post).toHaveBeenNthCalledWith(1, '/auth/logout')
    expect(apiMock.post).toHaveBeenNthCalledWith(2, '/auth/logout-all')
    expect(apiMock.post).toHaveBeenNthCalledWith(3, '/auth/reset-password', {
      email: 'user@test.com',
      token: 'reset-token',
      newPassword: 'New123$',
    })
  })

  // Cambiar la contraseña dejó de ser un endpoint sin cuerpo en T6-01: revoca todas las
  // sesiones del usuario y emite una nueva, que es lo que viaja en la respuesta. El test
  // vive aparte de la tanda de arriba justamente por eso — si volviera a devolver void, el
  // usuario se quedaría sin forma de renovar y lo descubriría al expirar el access token,
  // no aquí.
  it('changePassword returns the freshly issued session', async () => {
    const session = {
      accessToken: 'jwt-nuevo',
      expiresIn: 900,
      user: {
        id: 'user-1',
        email: 'user@test.com',
        displayName: 'User',
        emailConfirmed: true,
        hasPassword: true,
        linkedProviders: ['password'],
      },
    }
    apiMock.post.mockResolvedValue({ data: session })

    await expect(
      AuthAPI.changePassword({ currentPassword: 'Old123$', newPassword: 'New123$' }),
    ).resolves.toEqual(session)

    expect(apiMock.post).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: 'Old123$',
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
