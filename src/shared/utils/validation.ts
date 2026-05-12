import type { ZodError, ZodSchema } from 'zod'

/**
 * Extrae errores de un ZodError y los organiza por campo.
 * Retorna un objeto Record<fieldName, errorMessage>.
 */
export function extractZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {}

  error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    errors[path] = issue.message
  })

  return errors
}

/**
 * Hook-like function para validar un objeto contra un schema Zod.
 * Retorna [isValid, errors].
 */
export function validateWithZod(schema: ZodSchema, data: unknown): [boolean, Record<string, string>] {
  const result = schema.safeParse(data)

  if (!result.success) {
    return [false, extractZodErrors(result.error)]
  }

  return [true, {}]
}

/**
 * Valida un solo campo contra su validador.
 * Útil para validación en tiempo real mientras se escribe.
 */
export function validateField(schema: ZodSchema, fieldValue: unknown): string | null {
  const result = schema.safeParse(fieldValue)
  if (!result.success && result.error.issues.length > 0) {
    return result.error.issues[0].message
  }
  return null
}
