import { useCallback, useEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'tm-theme'
const DARK = 'dark'
const LIGHT = 'light'

/**
 * Tres estados, no dos. `null` significa «sigue al sistema», y es distinto de haber
 * elegido claro: mientras nadie toque el interruptor, cambiar el tema del sistema
 * operativo tiene que cambiar el de la aplicación.
 *
 * Antes esa distinción se perdía en el primer render: el efecto escribía en
 * `localStorage` al montar, así que a partir de la primera visita **siempre** había
 * preferencia guardada y el modo «seguir al sistema» dejaba de existir sin que nadie
 * lo hubiera desactivado. Ahora solo se persiste al pulsar el interruptor.
 */
type ThemeChoice = typeof DARK | typeof LIGHT | null

function readStoredChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === DARK || stored === LIGHT ? stored : null
  } catch {
    // Ventana privada, cookies bloqueadas: se sigue al sistema y ya está.
    return null
  }
}

function systemPrefersDark(): boolean {
  // matchMedia no existe en jsdom ni en entornos sin DOM completo.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.setAttribute('data-theme', DARK)
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export function useDarkMode() {
  const [choice, setChoice] = useState<ThemeChoice>(readStoredChoice)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  const isDark = choice === null ? systemDark : choice === DARK

  // El atributo ya lo deja puesto el script de `index.html` antes del primer pintado;
  // esto lo mantiene al día cuando cambia la elección o el tema del sistema.
  useEffect(() => {
    applyTheme(isDark)
  }, [isDark])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    // Pulsar el interruptor es lo único que fija una preferencia explícita.
    const next = isDark ? LIGHT : DARK
    setChoice(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Sin almacenamiento el tema no sobrevive a la recarga, pero la sesión funciona.
    }
  }, [isDark])

  return { isDark, toggle }
}
