import { test as base, expect, type Page } from '@playwright/test'
import { confirmarCorreo } from './db'

/**
 * Cada prueba estrena su propia cuenta. Compartir una las ataría entre sí: la que borrase
 * la cuenta rompería a las demás, y el orden pasaría a ser parte del contrato.
 *
 * El sufijo `@e2e.test` es lo que reconoce la limpieza; no lo cambies sin cambiarla.
 */
export function correoNuevo(): string {
  const marca = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
  return `e2e-${marca}@e2e.test`
}

export const CONTRASENA = 'PruebaE2E!2026'

/** Registra una cuenta por la interfaz y la deja confirmada y lista para entrar. */
export async function registrarCuenta(page: Page, email: string): Promise<void> {
  await page.goto('/register')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel(/Nombre visible/).fill('Cuenta E2E')
  await page.getByLabel('Contraseña', { exact: true }).fill(CONTRASENA)
  await page.getByLabel('Confirmar contraseña').fill(CONTRASENA)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  // El aviso no dice si el correo ya existía: revelarlo permitiría enumerar cuentas
  // (T1-04). Comprobamos ese texto, no uno que confirme que la cuenta es nueva.
  await expect(page.getByText(/enlace de confirmación/i)).toBeVisible()

  await confirmarCorreo(email)
}

/** Entra por la interfaz y espera a estar dentro. */
export async function iniciarSesion(page: Page, email: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña').fill(CONTRASENA)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/library/)
}

/**
 * `test` con una cuenta ya creada y con sesión iniciada. Las pruebas que quieran ver el
 * registro o el login por sí mismos usan el `test` normal de Playwright.
 */
export const test = base.extend<{ email: string }>({
  // `auto: true` es imprescindible: sin él Playwright solo instancia los fixtures que la
  // prueba nombra en su firma, así que una que reciba solo `{ page }` empezaría sin cuenta
  // y sin sesión, en `about:blank`. El síntoma no se parece a la causa —el primer
  // localizador no encuentra nada— y cuesta un rato verlo.
  email: [
    async ({ page }, use) => {
      const email = correoNuevo()
      await registrarCuenta(page, email)
      await iniciarSesion(page, email)
      await use(email)
    },
    { auto: true },
  ],
})

export { expect }
