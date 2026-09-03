import { z } from 'zod'

/**
 * `VITE_API_URL` admite dos formas:
 *
 *   - Ruta relativa, como `/api` (lo habitual y el valor por defecto). El navegador la
 *     resuelve contra el host desde el que se sirvió la página, y el proxy de Vite la
 *     reenvía al backend. Es la única forma que funciona igual en `localhost` y al
 *     servir con `npm run dev:lan` desde otro dispositivo de la red.
 *   - URL absoluta, como `http://localhost:5218/api`, para apuntar a un backend que no
 *     esté detrás del proxy.
 */
/**
 * Interruptor booleano de .env. Vite entrega todas las variables como cadenas, así que
 * aquí se acepta la escritura habitual (`true`/`false`, `1`/`0`) sin distinguir mayúsculas,
 * y la cadena vacía cae al valor por defecto igual que `VITE_API_URL`.
 *
 * El valor por defecto es `true`: quien no declare nada en su .env sigue viendo lo mismo
 * que antes, y solo quien quiera ocultar un proveedor tiene que escribir la variable.
 */
const flagSchema = z
  .string()
  .refine(
    (value) =>
      value.length === 0 || ['true', 'false', '1', '0'].includes(value.trim().toLowerCase()),
    'debe ser "true", "false", "1" o "0"',
  )
  .optional()

const envSchema = z.object({
  VITE_API_URL: z
    .string()
    .refine(
      // Se valida el valor **recortado**, que es el que se va a usar: diez líneas
      // más abajo `apiUrl` hace `.trim()`, y validar sin recortar dejaba al esquema
      // más estricto que el consumidor. Dos formas del mismo fallo, y las dos
      // tumbaban la aplicación entera antes de que React montara: `VITE_API_URL=`
      // sin valor y `VITE_API_URL= /api` con un espacio de más.
      (value) => {
        const normalized = value.trim()
        return normalized.length === 0 || normalized.startsWith('/') || URL.canParse(normalized)
      },
      'VITE_API_URL debe ser una URL absoluta o una ruta que empiece por "/"',
    )
    .optional(),
  VITE_ENABLE_GOOGLE_AUTH: flagSchema,
  VITE_ENABLE_GITHUB_AUTH: flagSchema,
})

/**
 * Este módulo se valida al importarse, y lo importa `axios.ts`, que a su vez importa
 * media aplicación. Una excepción aquí ocurre **antes** de que React monte nada: ni el
 * límite de error la ve, ni queda pantalla donde escribir. Antes eso era una página en
 * blanco y un mensaje de Zod en la consola, que es donde nadie mira.
 *
 * Así que el mensaje se pinta a mano en el documento, sin React, y solo después se
 * relanza. No se recurre a un valor por defecto: una variable mal escrita es un error de
 * configuración, y taparlo haría que la aplicación hablara con un backend que no es.
 */
function reportEnvError(message: string): void {
  if (typeof document === 'undefined') return

  const panel = document.createElement('div')
  panel.setAttribute('role', 'alert')
  panel.style.cssText =
    'margin:2rem auto;max-width:38rem;padding:1.5rem;border:1px solid #b91c1c;border-radius:8px;' +
    'font:16px/1.5 system-ui,sans-serif;color:#7f1d1d;background:#fef2f2'
  const title = document.createElement('h1')
  title.textContent = 'Configuración incorrecta'
  title.style.cssText = 'margin:0 0 .5rem;font-size:1.15rem'
  const detail = document.createElement('p')
  detail.textContent = message
  detail.style.margin = '0 0 .5rem'
  const hint = document.createElement('p')
  hint.textContent = 'Corrige el archivo .env y vuelve a arrancar el servidor de desarrollo.'
  hint.style.margin = '0'
  panel.append(title, detail, hint)

  // `append` y no `innerHTML`: el valor viene de la configuración, pero pintarlo como
  // markup convertiría un error de configuración en un punto de inyección.
  document.body.append(panel)
}

const result = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_ENABLE_GOOGLE_AUTH: import.meta.env.VITE_ENABLE_GOOGLE_AUTH,
  VITE_ENABLE_GITHUB_AUTH: import.meta.env.VITE_ENABLE_GITHUB_AUTH,
})

if (!result.success) {
  const detalle = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'variable'}: ${issue.message}`)
    .join(' · ')
  reportEnvError(`No se pudo leer la configuración de la aplicación. ${detalle}`)
  throw new Error(`Variables de entorno inválidas — ${detalle}`)
}

const parsed = result.data

const defaultApiUrl = '/api'
const configuredApiUrl = parsed.VITE_API_URL?.trim()

const apiUrl = (
  configuredApiUrl && configuredApiUrl.length > 0 ? configuredApiUrl : defaultApiUrl
).replace(/\/$/, '')

function parseFlag(value: string | undefined, fallback: boolean): boolean {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return fallback
  return normalized === 'true' || normalized === '1'
}

// Ocultar un proveedor aquí es una decisión del despliegue, no del backend: sirve para
// escenarios donde el proveedor está configurado y funcionando pero su redirección no
// puede volver a este origen — servir con `npm run dev:lan` es el caso típico, porque
// Google solo admite `localhost` o un dominio público https como URI de callback.
//
// Es una máscara, nunca un permiso: `AuthContext` la aplica *sobre* lo que responde
// `/auth/methods`, así que puede apagar un proveedor pero no encender uno que el backend
// tenga deshabilitado. La autorización sigue viviendo entera en el servidor.
const enableGoogleAuth = parseFlag(parsed.VITE_ENABLE_GOOGLE_AUTH, true)
const enableGitHubAuth = parseFlag(parsed.VITE_ENABLE_GITHUB_AUTH, true)

// Solo `apiUrl`. `dev`, `prod` e `isProduction` estaban aquí sin que nadie los leyera:
// quien necesita saber el modo usa `import.meta.env.DEV` directamente, que además Vite
// sustituye en tiempo de compilación y permite eliminar el código muerto del bundle.
export const env = {
  apiUrl,
  enableGoogleAuth,
  enableGitHubAuth,
}
