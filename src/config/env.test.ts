import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

/**
 * T3-17. `env.ts` valida al importarse, y lo importa `axios.ts`, que a su vez importa
 * media aplicación: la excepción ocurre antes de que React monte nada, así que ni el
 * límite de error la ve ni queda pantalla donde escribir. El resultado era una página
 * en blanco con un mensaje de Zod en la consola.
 */
describe('config/env', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('acepta una ruta relativa y una URL absoluta', async () => {
    vi.stubEnv('VITE_API_URL', '/api')
    const { env } = await import('./env')
    expect(env.apiUrl).toBe('/api')

    vi.resetModules()
    vi.stubEnv('VITE_API_URL', 'http://localhost:5218/api/')
    const recargado = await import('./env')
    // La barra final se recorta para que no salgan rutas con doble barra.
    expect(recargado.env.apiUrl).toBe('http://localhost:5218/api')
  })

  it('cae al valor por defecto cuando la variable no está definida', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const { env } = await import('./env')
    expect(env.apiUrl).toBe('/api')
  })

  it('muestra los proveedores OAuth cuando las variables no están definidas', async () => {
    vi.stubEnv('VITE_API_URL', '/api')
    vi.stubEnv('VITE_ENABLE_GOOGLE_AUTH', '')
    vi.stubEnv('VITE_ENABLE_GITHUB_AUTH', '')
    const { env } = await import('./env')
    expect(env.enableGoogleAuth).toBe(true)
    expect(env.enableGitHubAuth).toBe(true)
  })

  it('lee los interruptores OAuth sin distinguir mayúsculas y admite 1/0', async () => {
    vi.stubEnv('VITE_API_URL', '/api')
    vi.stubEnv('VITE_ENABLE_GOOGLE_AUTH', 'False')
    vi.stubEnv('VITE_ENABLE_GITHUB_AUTH', '0')
    const { env } = await import('./env')
    expect(env.enableGoogleAuth).toBe(false)
    expect(env.enableGitHubAuth).toBe(false)
  })

  it('rechaza un interruptor OAuth que no sea booleano', async () => {
    vi.stubEnv('VITE_API_URL', '/api')
    vi.stubEnv('VITE_ENABLE_GOOGLE_AUTH', 'quizá')

    await expect(import('./env')).rejects.toThrow(/Variables de entorno inválidas/)

    const alerta = document.querySelector('[role="alert"]')
    expect(alerta!.textContent).toContain('VITE_ENABLE_GOOGLE_AUTH')
  })

  it('pinta un mensaje legible en el documento cuando el valor es inválido', async () => {
    vi.stubEnv('VITE_API_URL', 'no-es-una-url-ni-una-ruta')

    await expect(import('./env')).rejects.toThrow(/Variables de entorno inválidas/)

    const alerta = document.querySelector('[role="alert"]')
    expect(alerta).not.toBeNull()
    expect(alerta!.textContent).toContain('Configuración incorrecta')
    expect(alerta!.textContent).toContain('VITE_API_URL')
    expect(alerta!.textContent).toContain('.env')
  })
})
