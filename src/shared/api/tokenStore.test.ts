import { tokenStore } from './tokenStore'

describe('tokenStore', () => {
  afterEach(() => {
    tokenStore.set(null)
  })

  it('stores and returns the current access token', () => {
    expect(tokenStore.get()).toBeNull()

    tokenStore.set('access-token')

    expect(tokenStore.get()).toBe('access-token')
  })

  it('clears the token when set to null', () => {
    tokenStore.set('access-token')

    tokenStore.set(null)

    expect(tokenStore.get()).toBeNull()
  })
})