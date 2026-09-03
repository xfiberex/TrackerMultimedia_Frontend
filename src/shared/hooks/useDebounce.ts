import { useEffect, useState } from 'react'

/**
 * Hook para debounce de valores.
 * Retarda la actualización de un valor hasta que se deje de cambiar por `delay` ms.
 * Útil para búsquedas, validaciones, API calls mientras se escribe.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para throttle de funciones.
 * Ejecuta una función como máximo una vez cada `delay` ms.
 * Útil para eventos de scroll, resize, o acciones repetitivas.
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 500,
) {
  const [lastCall, setLastCall] = useState<number>(0)

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      setLastCall(now)
      callback(...args)
    }
  }) as T
}
