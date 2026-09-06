import { defineConfig, devices } from '@playwright/test'

/**
 * T4-04 — Pruebas end-to-end.
 *
 * A diferencia de las suites de vitest y xUnit, estas hablan con **la aplicación entera**:
 * navegador real, servidor de Vite, backend de ASP.NET y PostgreSQL. Por eso no sustituyen
 * a las otras dos, sino que cubren lo que ninguna ve: que las piezas encajen entre sí.
 *
 * **Los requisitos son reales y hay que tenerlos en marcha:**
 *   1. PostgreSQL arrancado (`Start-Service postgresql-x64-17`, como administrador).
 *   2. El backend en `http://localhost:5218` (`dotnet run` en el repositorio de backend).
 * El servidor de Vite lo levanta esta configuración por su cuenta.
 *
 * `webServer` no arranca el backend a propósito: necesita user-secrets y una base de datos,
 * y un fallo suyo aquí saldría como un timeout críptico de Playwright en vez de como el
 * error que de verdad ocurrió. Ver `e2e/global-setup.ts`, que lo comprueba y lo dice.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',

  // Las pruebas comparten una base de datos, así que se ejecutan en serie. En paralelo
  // se pisarían: dos registros a la vez agotan el límite de 10 peticiones/minuto que
  // protege los endpoints de autenticación, y el 429 saldría como un fallo confuso.
  fullyParallel: false,
  workers: 1,

  // Sin CI (T1-12, anulada) esto se ejecuta a mano, así que un reintento automático
  // escondería precisamente la inestabilidad que interesa ver.
  retries: 0,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-ES',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
