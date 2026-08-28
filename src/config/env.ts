import { z } from 'zod'

/**
 * `VITE_API_URL` admite dos formas:
 *
 *   - Ruta relativa, como `/api` (lo habitual y el valor por defecto). El navegador la
 *     resuelve contra el host desde el que se sirvió la página, y el proxy de Vite la
 *     reenvía al backend. Es la única forma que funciona igual en `localhost` y al
 *     servir con `vite --host` desde otro dispositivo de la red.
 *   - URL absoluta, como `http://localhost:5218/api`, para apuntar a un backend que no
 *     esté detrás del proxy.
 */
const envSchema = z.object({
  VITE_API_URL: z
    .string()
    .refine(
      (value) => value.startsWith('/') || URL.canParse(value),
      'VITE_API_URL debe ser una URL absoluta o una ruta que empiece por "/"',
    )
    .optional(),
})

const parsed = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
})

const defaultApiUrl = '/api'
const configuredApiUrl = parsed.VITE_API_URL?.trim()

const apiUrl = (configuredApiUrl && configuredApiUrl.length > 0 ? configuredApiUrl : defaultApiUrl).replace(
  /\/$/,
  '',
)

export const env = {
  apiUrl,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  isProduction: import.meta.env.PROD,
}
