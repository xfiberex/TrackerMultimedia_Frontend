import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL debe ser una URL válida').optional(),
})

const parsed = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
})

const defaultApiUrl = 'http://localhost:5218/api'
const configuredApiUrl = parsed.VITE_API_URL?.trim()

const apiUrl = (configuredApiUrl && configuredApiUrl.length > 0 ? configuredApiUrl : defaultApiUrl).replace(/\/$/, '')

export const env = {
  apiUrl,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  isProduction: import.meta.env.PROD,
  apiBaseWithoutPath: apiUrl.replace(/\/api$/, ''),
}