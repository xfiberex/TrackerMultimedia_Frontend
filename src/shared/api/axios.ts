import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { tokenStore } from './tokenStore'
import type { AuthResponse } from '@/features/auth/schemas/authSchema'

// Nombre del evento DOM que el interceptor dispara cuando el refresh falla,
// para que AuthContext pueda limpiar el estado sin dependencia circular.
export const AUTH_LOGOUT_EVENT = 'auth:logout'

/**
 * Cabecera propia que exigen `/auth/refresh` y `/auth/logout`.
 *
 * Es la defensa contra CSRF de los dos únicos endpoints que se autentican con la cookie:
 * un `<form>` de otro sitio no puede añadir cabeceras, y un `fetch` que lo intente deja de
 * ser una petición simple y dispara un preflight que el allowlist de CORS del backend
 * rechaza. El valor da igual; lo que importa es que la petición no se pueda construir
 * desde fuera.
 */
export const CLIENT_HEADER = 'X-TM-Client'

// `withCredentials` es lo que hace que el navegador adjunte la cookie de refresco. Sin
// esto la sesión no sobrevive a una recarga y el fallo es mudo: el refresh responde 401
// como si no hubiera sesión.
const sharedConfig = {
  baseURL: env.apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    [CLIENT_HEADER]: 'web',
  },
}

// Instancia privada solo para renovar tokens (evita dependencia circular con AuthAPI)
const refreshClient = axios.create(sharedConfig)

const api = axios.create(sharedConfig)

// Adjunta el access token en memoria a cada petición (si hay uno)
api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Renovación de sesión, con una sola petición en vuelo a la vez.
 *
 * El *single-flight* no es una optimización: es correctitud. Los tokens de refresco rotan
 * y presentar uno ya rotado es la señal de robo que revoca **todas** las sesiones del
 * usuario. Dos llamadas concurrentes salen con el mismo valor de cookie —la segunda parte
 * antes de que llegue el `Set-Cookie` de la primera—, así que la segunda parece un robo y
 * cierra la sesión de quien no ha hecho nada.
 *
 * No es hipotético: `StrictMode` monta los efectos dos veces en desarrollo, y eso bastaba
 * para disparar la alarma en **cada carga de página**. El síntoma era peor que evidente:
 * la aplicación seguía funcionando con el access token ya obtenido, y la sesión aparecía
 * revocada solo en la recarga siguiente.
 */
let inFlightRefresh: Promise<AuthResponse> | null = null

export function refreshSession(): Promise<AuthResponse> {
  inFlightRefresh ??= refreshClient
    .post<AuthResponse>('/auth/refresh')
    .then((response) => response.data)
    .finally(() => {
      inFlightRefresh = null
    })

  return inFlightRefresh
}

// --- Queue para peticiones concurrentes que llegan mientras se refresca el token ---
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void }
let isRefreshing = false
let failedQueue: QueueItem[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

// Interceptor de respuesta: renueva el access token automáticamente al recibir un 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }
    const originalRequest = error.config as RetryConfig | undefined

    // Solo actuar en 401 y en peticiones que no sean ya un reintento
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Si la petición que falló ES el endpoint de refresh, no intentar refrescar de nuevo.
    // Esto evita que el interceptor consuma tokens OAuth recién recibidos cuando el
    // init de AuthContext intenta restaurar una sesión expirada en paralelo.
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    // Ya no hay nada que comprobar antes de intentarlo: la cookie no es legible desde
    // aquí, así que la única forma de saber si hay sesión es preguntar. Un 401 del propio
    // refresh es la señal de que no la hay.

    // Si ya hay un refresh en curso, encolar esta petición
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const data = await refreshSession()
      tokenStore.set(data.accessToken)
      processQueue(null, data.accessToken)
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      tokenStore.set(null)
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
