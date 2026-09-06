import { z } from 'zod'
import type { AxiosError } from 'axios'
import i18n from '@/shared/i18n'
import type { es } from '@/shared/i18n/es'
import { loginPayloadSchema } from '../schemas/authSchema'

// ── Re-export del schema de login ────────────────────────────────────────────
export { loginPayloadSchema }

export const problemDetailsSchema = z.object({
  title: z.string().optional(),
  detail: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
  status: z.number().optional(),
  instance: z.string().optional(),
})

export type ProblemDetails = z.infer<typeof problemDetailsSchema>

// ── Error discriminado ───────────────────────────────────────────────────────

export type AppError =
  | { type: 'validation'; errors: Record<string, string[]>; message: string }
  | { type: 'auth'; message: string; code?: string; status?: number }
  | { type: 'server'; message: string; status?: number }
  | { type: 'network'; message: string }
  | { type: 'unknown'; message: string; originalError?: unknown }

// ── Mapeos OAuth ─────────────────────────────────────────────────────────────

/**
 * Los códigos que el backend puede devolver en `?oauth_error=`. Ya no llevan el texto:
 * son la lista blanca, y el texto sale del diccionario con la misma clave.
 */
const CODIGOS_OAUTH = [
  'access_denied',
  'invalid_callback',
  'state_mismatch',
  'profile_error',
  'create_failed',
  'missing_tokens',
  'session_error',
  'account_unavailable',
] as const satisfies readonly (keyof typeof es.oauth)[]

// ── Funciones de extracción ──────────────────────────────────────────────────

/**
 * Convierte un error desconocido en un AppError tipado.
 * Soporta:
 *  - AxiosError con ProblemDetails (RFC 7807)
 *  - Errores de validación
 *  - Errores de red
 *  - Errores genéricos
 */
export function normalizeError(err: unknown): AppError {
  const axiosError = err as AxiosError<unknown>

  // Error de red (sin respuesta del servidor)
  if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
    return {
      type: 'network',
      message: i18n.t('errores.red'),
    }
  }

  const status = axiosError.response.status
  const data = axiosError.response.data

  // Validar como ProblemDetails
  const problemDetails = problemDetailsSchema.safeParse(data)
  if (problemDetails.success) {
    const pd = problemDetails.data

    // Errores de validación (400 con campo 'errors')
    if (status === 400 && pd.errors && Object.keys(pd.errors).length > 0) {
      const errors = pd.errors as Record<string, string[]>
      const firstMessage = Object.values(errors).flat()[0] ?? i18n.t('errores.validacion')
      return {
        type: 'validation' as const,
        errors,
        message: firstMessage,
      }
    }

    // Otros errores con detalles
    const message = pd.detail || pd.title || i18n.t('errores.servidor')
    return {
      type: status === 401 || status === 403 ? 'auth' : 'server',
      message,
      status,
    }
  }

  // Fallback: si es string
  if (typeof data === 'string' && data.trim().length > 0) {
    return {
      type: 'server',
      message: data,
      status,
    }
  }

  // Errores tipados HTTP
  if (status === 401 || status === 403) {
    return {
      type: 'auth',
      message: status === 401 ? i18n.t('errores.credenciales') : i18n.t('errores.sinPermiso'),
      status,
    }
  }

  if (status >= 500) {
    return {
      type: 'server',
      message: i18n.t('errores.interno'),
      status,
    }
  }

  return {
    type: 'unknown',
    message: i18n.t('errores.inesperado'),
    originalError: err,
  }
}

/**
 * Traduce un código de error OAuth al texto que ve el usuario.
 *
 * **Solo acepta códigos de la tabla de arriba, nunca texto libre.** Antes había
 * un segundo parámetro `oauth_error_message` que, si venía en la URL, se mostraba
 * tal cual y tenía prioridad sobre el código. Eso convertía la página de login en
 * un lienzo: bastaba enviar un enlace con
 * `?oauth_error_message=Tu+cuenta+fue+suspendida,+llama+al+900...` para que ese
 * texto apareciera en el sitio legítimo, con su dominio y su candado.
 */
export function getOAuthErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) {
    return null
  }

  const conocido = (CODIGOS_OAUTH as readonly string[]).includes(errorCode)
  return i18n.t(
    `oauth.${conocido ? (errorCode as (typeof CODIGOS_OAUTH)[number]) : 'profile_error'}`,
  )
}
