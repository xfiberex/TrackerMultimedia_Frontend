import { act, renderHook } from '@testing-library/react'
import { THEME_STORAGE_KEY, useDarkMode } from './useDarkMode'

/**
 * T3-18. Dos defectos distintos:
 *
 *  1. El hook leía `prefers-color-scheme` una sola vez y no se suscribía, así que
 *     cambiar el tema del sistema no hacía nada hasta recargar.
 *  2. El efecto escribía en `localStorage` **al montar**, así que desde la primera
 *     visita siempre había preferencia guardada y el modo «seguir al sistema» dejaba
 *     de existir sin que nadie lo hubiera desactivado. Ese es el que hacía inútil
 *     arreglar el primero.
 */
type Listener = (event: MediaQueryListEvent) => void

function stubMatchMedia(initialDark: boolean) {
  const listeners = new Set<Listener>()
  let matches = initialDark

  window.matchMedia = ((query: string) => ({
    get matches() {
      return matches
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia

  return {
    emitir(dark: boolean) {
      matches = dark
      listeners.forEach((listener) => listener({ matches: dark } as MediaQueryListEvent))
    },
    get suscritos() {
      return listeners.size
    },
  }
}

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('sigue al sistema y no guarda nada mientras nadie toque el interruptor', () => {
    const media = stubMatchMedia(true)

    const { result } = renderHook(() => useDarkMode())

    expect(result.current.isDark).toBe(true)
    // Lo importante de esta aserción: antes se escribía al montar, y eso destruía
    // el modo «seguir al sistema» para siempre en la primera visita.
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(media.suscritos).toBe(1)
  })

  it('reacciona a un cambio de tema del sistema', () => {
    const media = stubMatchMedia(false)
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.isDark).toBe(false)

    act(() => media.emitir(true))

    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('una elección explícita se guarda y deja de seguir al sistema', () => {
    const media = stubMatchMedia(false)
    const { result } = renderHook(() => useDarkMode())

    act(() => result.current.toggle())

    expect(result.current.isDark).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    // El sistema pasa a claro; la elección explícita manda.
    act(() => media.emitir(false))
    expect(result.current.isDark).toBe(true)
  })

  it('respeta la preferencia guardada por encima del sistema', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    stubMatchMedia(true)

    const { result } = renderHook(() => useDarkMode())

    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('se da de baja del listener al desmontarse', () => {
    const media = stubMatchMedia(false)
    const { unmount } = renderHook(() => useDarkMode())
    expect(media.suscritos).toBe(1)

    unmount()

    expect(media.suscritos).toBe(0)
  })
})
