type MockHandler<TArgs extends unknown[] = unknown[], TResult = unknown> = (...args: TArgs) => TResult

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

  const create = vi.fn(() => {
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
    reset() {
      instances.length = 0
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

  it('rejects the original error when a 401 arrives without a refresh token', async () => {
    const { apiClient, refreshClient } = await loadAxiosModule()
    const interceptor = apiClient.interceptors.response.errorHandlers[0]
    const error = {
      response: { status: 401 },
      config: { headers: {} as Record<string, string> },
    }

    await expect(interceptor(error)).rejects.toBe(error)
    expect(refreshClient.post).not.toHaveBeenCalled()
  })

  it('refreshes the token and retries the original request after a 401', async () => {
    const { apiClient, refreshClient, tokenStore } = await loadAxiosModule()
    const interceptor = apiClient.interceptors.response.errorHandlers[0]
    const originalRequest = { headers: {} as Record<string, string> }

    localStorage.setItem('refreshToken', 'old-refresh')
    refreshClient.post.mockResolvedValue({
      data: {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
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

    expect(refreshClient.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'old-refresh' })
    expect(tokenStore.get()).toBe('new-access')
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh')
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
        refreshToken: string
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

    localStorage.setItem('refreshToken', 'shared-refresh')
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
        refreshToken: 'queued-refresh',
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
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer queued-access' }) }),
    )
    expect(apiClient).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer queued-access' }) }),
    )
  })

  it('clears the session and dispatches a logout event when refresh fails', async () => {
    const { apiClient, refreshClient, tokenStore, authLogoutEvent } = await loadAxiosModule()
    const interceptor = apiClient.interceptors.response.errorHandlers[0]
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    const refreshError = new Error('refresh failed')

    tokenStore.set('stale-access')
    localStorage.setItem('refreshToken', 'stale-refresh')
    refreshClient.post.mockRejectedValue(refreshError)

    await expect(
      interceptor({
        response: { status: 401 },
        config: { headers: {} as Record<string, string> },
      }),
    ).rejects.toBe(refreshError)

    expect(tokenStore.get()).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: authLogoutEvent }))
  })
})