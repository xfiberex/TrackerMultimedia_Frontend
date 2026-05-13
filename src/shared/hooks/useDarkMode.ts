import { useEffect, useState } from 'react'

const STORAGE_KEY = 'tm-theme'
const DARK_VALUE = 'dark'

function getInitialDark(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === DARK_VALUE) return true
    if (stored === 'light') return false
  } catch {
    // localStorage not available
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.setAttribute('data-theme', DARK_VALUE)
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const dark = getInitialDark()
    applyTheme(dark)
    return dark
  })

  useEffect(() => {
    applyTheme(isDark)
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? DARK_VALUE : 'light')
    } catch {
      // localStorage not available
    }
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  return { isDark, toggle }
}
