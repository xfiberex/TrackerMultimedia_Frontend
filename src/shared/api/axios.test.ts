type MockHandler<TArgs extends unknown[] = unknown[], TResult = unknown> = (
  ...args: TArgs
) => TResult

interface MockAxiosInstance extends ReturnType<typeof vi.fn> {
  post: ReturnType<typeof vi.fn>
  interceptors: {
    request: {
      use: ReturnType<typeof vi.fn>
      handlers: MockHandler[]
    }
    response: {
      use: ReturnType<typeof vi.fn>
      successHandlers: MockHandler[]
      errorHandlers: MockHandler[]
    }
  }
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })

  return { promise, resolve, reject }
}

const axiosState = vi.hoisted(() => {
  const instances: MockAxiosInstance[] = []

  // Las configuraciones se guardan para poder afirmar sobre cómo se construye cada
  // instancia —`withCredentials` y la cabecera anti-CSRF—, no solo sobre lo que hace.
  const configs: Record<string, unknown>[] = []

  const create = vi.fn((config: Record<string, unknown>) => {
    configs.push(config)
    const requestHandlers: MockHandler[] = []
    const responseSuccessHandlers: MockHandler[] = []
    const responseErrorHandlers: MockHandler[] = []

    const instance = vi.fn() as MockAxiosInstance
    instance.post = vi.fn()
    instance.interceptors = {
      request: {
        handlers: requestHandlers,
        use: vi.fn((handler: MockHandler) => {
          requestHandlers.push(handler)
          return requestHandlers.length - 1
        }),
      },
      response: {
        successHandlers: responseSuccessHandlers,
        errorHandlers: responseErrorHandlers,
        use: vi.fn((onFulfilled: MockHandler, onRejected: MockHandler) => {
          responseSuccessHandlers.push(onFulfilled)
          responseErrorHandlers.push(onRejected)
          return responseErrorHandlers.length - 1
        }),
      },
    }

    instances.push(instance)
    return instance
  })

  return {
    create,
    instances,
    configs,
    reset() {
      instances.length = 0
      configs.length = 0
      create.mockClear()
    },
  }
})

vi.mock('axios', () => ({
  default: {
    create: axiosState.create,
  },
}))

async function loadAxiosModule() {
  vi.resetModules()
  axiosState.reset()

  const axiosModule = await import('./axios')
  const { tokenStore } = await import('./tokenStore')

  return {
    api: axiosModule.default,
    refreshSession: axiosModule.refreshSession,
    authLogoutEvent: axiosModule.AUTH_LOGOUT_EVENT,
    tokenStore,
    refreshClient: axiosState.instances[0],
    apiClient: axiosState.instances[1],
  }
}

describe('shared api axios client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('attaches the access token to outbound requests when available', async () => {
    const { apiClient, tokenStore } = await loadAxiosModule()
    tokenStore.set('access-token')

    const requestHandler = apiClient.interceptors.request.handlers[0]
    const config = { headers: {} as Record<string, string> }

    expect(requestHandler(config)).toEqual({
      headers: {
        Authorization: 'Bearer access-token',
      },
    })
  })

  it('creates both clients with credentials and the anti-CSRF header', async () => {
    await loadAxiosModule()

    // `withCredentials` es lo que hace que el navegador adjunte la cookie de refresco:
    // sin él la sesión no sobrevive a una recarga y el fallo es mudo, porque el refresh
    // responde 401 igual que si no hubiera sesión. Y sin la cabecera, el backend rechaza
    // /auth/refresh y /auth/logout por su defensa contra CSRF.
    expect(axiosState.configs).toHaveLength(2)

    for (const config of axiosState.configs) {
      expect(config).toMatchObject({
        withCredentials: true,
        headers: expect.objectContaining({ 'X-TM-Client': 'web' }),
      })
    }
  })

  it('collapses concurrent refreshes into a single request', async () => {
    const { refreshSession, refreshClient } = await loadAxiosModule()
    const deferred = createDeferred<{ data: { accessToken: string } }>()
    refreshClient.post.mockReturnValue(deferred.promise)

    // Es lo que hace StrictMode al montar los efectos dos veces. Sin un único vuelo, las
    // dos peticiones salen con el mismo valor de cookie, la segunda presenta un token ya
    // rotado, y el backend lo interpreta como robo y revoca TODAS las sesiones.
    const primera = refreshSession()
    const segunda = refreshSession()

    deferred.resolve({ data: { accessToken: 'unico-access' } })

    await expect(Promise.all([primera, segunda])).resolves.toEqual([
      { accessToken: 'unico-access' },
      { accessToken: 'unico-access' },
    ])
    expect(refreshClient.post).toHaveBeenCalledTimes(1)
  })

  it('starts a new request once the previous refresh has settled', async () => {
    const { refreshSession, refreshClient } = await loadAxiosModule()
    refreshClient.post.mockResolvedValue({ data: { accessToken: 'access' } })

    await refreshSession()
    await refreshSession()

    // El vuelo compartido se libera al terminar: si no, la sesión no podría renovarse
    // nunca más después de la primera vez.
    expect(refreshClient.post).toHaveBeenCalledTimes(2)
  })

  it('refreshes the token and retries the original request after a 401', async () => {
    const { apiClient, refreshClient, tokenStore } = await loadAxiosModule()
    const interceptor = apiClient.interceptors.response.errorHandlers[0]
    const originalRequest = { headers: {} as Record<string, string> }

    refreshClient.post.mockResolvedValue({
      data: {
        accessToken: 'new-access',
        user: {
          id: 'user-1',
          email: 'user@test.com',
          userName: 'tester',
          isEmailConfirmed: true,
          hasPassword: true,
          loginProviders: ['password'],
        },
      },
    })
    apiClient.mockResolvedValue({ data: 'retried-response' })

    await expect(
      interceptor({
        response: { status: 401 },
        config: originalRequest,
      }),
    ).resolves.toEqual({ data: 'retried-response' })

    // Sin cuerpo: el token va en la cookie.
    expect(refreshClient.post).toHaveBeenCalledWith('/auth/refresh')
    expect(tokenStore.get()).toBe('new-access')
    // Y la rotación no deja rastro en ningún almacenamiento legible por JavaScript.
    expect(localStorage.length).toBe(0)
    expect(apiClient).toHaveBeenCalledWith(
      expect.objectContaining({
        _retry: true,
        headers: expect.objectContaining({ Authorization: 'Bearer new-access' }),
      }),
    )
  })

  it('queues concurrent 401 requests while the refresh call is already running', async () => {
    const { apiClient, refreshClient } = await loadAxiosModule()
    const interceptor = apiClient.interceptors.response.errorHandlers[0]
    const refreshDeferred = createDeferred<{
      data: {
        accessToken: string
        user: {
          id: string
          email: string
          userName: string
          isEmailConfirmed: boolean
          hasPassword: boolean
          loginProviders: string[]
        }
      }
    }>()

    refreshClient.post.mockReturnValue(refreshDeferred.promise)
    apiClient
      .mockResolvedValueOnce({ data: 'first-retry' })
      .mockResolvedValueOnce({ data: 'second-retry' })

    const firstRequest = { headers: {} as Record<string, string> }
    const secondRequest = { headers: {} as Record<string, string> }

    const firstPromise = interceptor({
      response: { status: 401 },
      config: firstRequest,
    })

    const secondPromise = interceptor({
      response: { status: 401 },
      config: secondRequest,
    })

    refreshDeferred.resolve({
      data: {
        accessToken: 'queued-access',
        user: {
          id: 'user-1',
          email: 'user@test.com',
          userName: 'tester',
          isEmailConfirmed: true,
          hasPassword: true,
          loginProviders: ['password'],
        },
      },
    })

    await expect(Promise.all([firstPromise, secondPromise])).resolves.toEqual([
      { data: 'first-retry' },
      { data: 'second-retry' },
    ])

    expect(refreshClient.post).toHaveBeenCalledTimes(1)
    expect(apiClient).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer queued-access' }),
      }),
    )
    expect(apiClient).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer queued-access' }),
      }),
    )
  })

  it('clears the session and dispatches a logout event when refresh fails', async () => {
    const { apiClient, refreshClient, tokenStore, authLogoutEvent } = await loadAxiosModule()
    const interceptor = apiClient.interceptors.response.errorHandlers[0]
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    const refreshError = new Error('refresh failed')

    tokenStore.set('stale-access')
    refreshClient.post.mockRejectedValue(refreshError)

    await expect(
      interceptor({
        response: { status: 401 },
        config: { headers: {} as Record<string, string> },
      }),
    ).rejects.toBe(refreshError)

    expect(tokenStore.get()).toBeNull()
    expect(localStorage.length).toBe(0)
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: authLogoutEvent }))
  })
})
