import { test, expect } from '@playwright/test'
import { correoNuevo, CONTRASENA, registrarCuenta, iniciarSesion } from './fixtures'

/**
 * T4-04 — Registro, confirmación y acceso, de punta a punta.
 *
 * Es el camino que ninguna de las otras dos suites recorre entero: la de vitest simula la
 * API y la de xUnit no tiene navegador. Aquí van juntos el formulario, la cookie de sesión
 * (T4-01), la comprobación de correo confirmado (T2-10) y la redirección.
 */

test('una cuenta recién registrada entra y cierra sesión', async ({ page }) => {
  const email = correoNuevo()

  await registrarCuenta(page, email)
  await iniciarSesion(page, email)

  await expect(page.getByRole('heading', { name: 'Tu biblioteca', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page).toHaveURL(/\/login/)

  // Volver atrás no debe devolver la sesión: si lo hiciera, «salir» sería solo un cambio
  // de pantalla. Al pedir la biblioteca sin sesión, la aplicación manda al login.
  await page.goto('/library')
  await expect(page).toHaveURL(/\/login/)
})

test('una cuenta sin confirmar no puede entrar', async ({ page }) => {
  const email = correoNuevo()

  // Registro sin pasar por `registrarCuenta`, que confirma el correo por su cuenta.
  await page.goto('/register')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel(/Nombre visible/).fill('Sin confirmar')
  await page.getByLabel('Contraseña', { exact: true }).fill(CONTRASENA)
  await page.getByLabel('Confirmar contraseña').fill(CONTRASENA)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByText(/enlace de confirmación/i)).toBeVisible()

  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña').fill(CONTRASENA)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: 'Tu biblioteca', exact: true })).toHaveCount(0)
})

test('una contraseña incorrecta no dice si la cuenta existe', async ({ page }) => {
  const email = correoNuevo()
  await registrarCuenta(page, email)

  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña').fill('EstaNoEsLaBuena!1')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  await expect(page).toHaveURL(/\/login/)

  // El mensaje no puede distinguir «no existe» de «contraseña incorrecta»: esa diferencia
  // es lo que convierte un formulario de acceso en un comprobador de direcciones (T1-04).
  const aviso = page.getByRole('alert')
  await expect(aviso).toBeVisible()
  await expect(aviso).not.toContainText(/no existe|no está registrad|no encontrad/i)
})

test('la sesión sobrevive a recargar la página', async ({ page }) => {
  const email = correoNuevo()
  await registrarCuenta(page, email)
  await iniciarSesion(page, email)

  // Es el defecto que arregló T4-01: al recargar, la aplicación pedía dos renovaciones a
  // la vez, el servidor lo tomaba por una sesión copiada y las cerraba todas. No se veía
  // en el momento, sino en la recarga siguiente.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tu biblioteca', exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tu biblioteca', exact: true })).toBeVisible()
})
