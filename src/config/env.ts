const defaultApiUrl = 'http://localhost:5218/api'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const env = {
  apiUrl: (configuredApiUrl && configuredApiUrl.length > 0 ? configuredApiUrl : defaultApiUrl).replace(/\/$/, ''),
  dev: import.meta.env.DEV,
}