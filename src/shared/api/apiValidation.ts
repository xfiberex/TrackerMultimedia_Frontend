/**
 * API Response Validation Hook
 *
 * Wrapper para axios que valida todas las respuestas del API contra schemas Zod.
 * Previene errores causados por cambios en contratos backend.
 */
import type { ZodSchema } from 'zod'
import type { AxiosResponse } from 'axios'
import axios from 'axios'

export interface ValidationError {
  type: 'validation'
  message: string
  errors: Record<string, string[]>
  statusCode: number
}

/**
 * Valida una respuesta del API contra un schema.
 * Lanza ValidationError si no coincide.
 */
export function validateApiResponse<T>(response: AxiosResponse<unknown>, schema: ZodSchema): T {
  const result = schema.safeParse(response.data)

  if (!result.success) {
    const errors: Record<string, string[]> = {}

    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.')
      if (!errors[path]) {
        errors[path] = []
      }
      errors[path].push(issue.message)
    })

    const error: ValidationError = {
      type: 'validation',
      message: `Respuesta del API no coincide con schema esperado`,
      errors,
      statusCode: response.status,
    }

    throw error
  }

  return result.data as T
}

/**
 * Wrapper para GET con validación.
 * Uso:
 *   const user = await apiGet<User>('/auth/me', userSchema)
 */
export async function apiGet<T>(
  url: string,
  schema: ZodSchema,
  config?: Parameters<typeof axios.get>[1],
): Promise<T> {
  const response = await axios.get(url, config)
  return validateApiResponse<T>(response, schema)
}

/**
 * Wrapper para POST con validación.
 */
export async function apiPost<T>(
  url: string,
  data: unknown,
  schema: ZodSchema,
  config?: Parameters<typeof axios.post>[2],
): Promise<T> {
  const response = await axios.post(url, data, config)
  return validateApiResponse<T>(response, schema)
}

/**
 * Wrapper para PUT con validación.
 */
export async function apiPut<T>(
  url: string,
  data: unknown,
  schema: ZodSchema,
  config?: Parameters<typeof axios.put>[2],
): Promise<T> {
  const response = await axios.put(url, data, config)
  return validateApiResponse<T>(response, schema)
}

/**
 * Ejemplo de uso en AuthAPI:
 *
 * export const AuthAPI = {
 *   me: () => apiGet<User>('/auth/me', userSchema),
 *   login: (payload) => apiPost<AuthResponse>('/auth/login', payload, authResponseSchema),
 * }
 */
