import type { AxiosError } from 'axios'

interface ProblemDetails {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

/**
 * Extrae un mensaje de error legible de una respuesta de axios.
 * Soporta:
 *  - Strings simples (ej. 401 "Credenciales inválidas.")
 *  - RFC 7807 ProblemDetails (ej. 400 con errors de validación)
 */
export function extractAuthError(err: unknown, fallback: string): string {
  const axiosError = err as AxiosError<ProblemDetails | string>
  const data = axiosError.response?.data

  if (!data) return fallback
  if (typeof data === 'string') return data

  // Errores de validación de Identity: coger el primer mensaje disponible
  if (data.errors) {
    const firstMessages = Object.values(data.errors).flat()
    if (firstMessages.length > 0) return firstMessages[0]
  }

  if (data.detail) return data.detail
  if (data.title) return data.title

  return fallback
}
