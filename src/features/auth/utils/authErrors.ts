import type { AxiosError } from 'axios'

interface ProblemDetails {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

const oauthErrorMessages: Record<string, string> = {
  access_denied: 'Cancelaste el acceso con el proveedor.',
  invalid_callback: 'La respuesta del proveedor llegó incompleta. Inténtalo de nuevo.',
  state_mismatch: 'La sesión de acceso con el proveedor expiró. Vuelve a intentarlo.',
  profile_error: 'No se pudo completar el acceso con el proveedor.',
  create_failed: 'No se pudo crear tu cuenta con el proveedor.',
  missing_tokens: 'La respuesta del proveedor no incluyó la sesión esperada.',
  session_error: 'No se pudo abrir la sesión devuelta por el proveedor.',
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

export function getOAuthErrorMessage(errorCode: string | null, errorMessage: string | null): string | null {
  if (errorMessage && errorMessage.trim().length > 0) {
    return errorMessage.trim()
  }

  if (!errorCode) {
    return null
  }

  return oauthErrorMessages[errorCode] ?? oauthErrorMessages.profile_error
}
