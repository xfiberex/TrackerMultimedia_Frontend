import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { tokenStore } from './tokenStore'
import type { AuthResponse } from '@/features/auth/schemas/authSchema'

// Nombre del evento DOM que el interceptor dispara cuando el refresh falla,
// para que AuthContext pueda limpiar el estado sin dependencia circular.
export const AUTH_LOGOUT_EVENT = 'auth:logout'

// Instancia privada solo para renovar tokens (evita dependencia circular con AuthAPI)
const refreshClient = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
})

const api = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Adjunta el access token en memoria a cada petición (si hay uno)
api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      // Sin refresh token: no se puede renovar, dejar pasar el error
      return Promise.reject(error)
    }

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
      const { data } = await refreshClient.post<AuthResponse>('/auth/refresh', { refreshToken })
      tokenStore.set(data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      processQueue(null, data.accessToken)
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      tokenStore.set(null)
      localStorage.removeItem('refreshToken')
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
