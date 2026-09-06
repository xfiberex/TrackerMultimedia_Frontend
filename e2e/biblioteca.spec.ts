import { test, expect } from './fixtures'

/**
 * T4-04 — El ciclo completo de un registro de la biblioteca: crear, leer, editar y borrar.
 *
 * Cada prueba recibe su propia cuenta recién creada (ver `fixtures.ts`), así que empieza
 * con la biblioteca vacía y no depende de lo que hayan dejado las demás.
 */

test('crear, editar y borrar un registro', async ({ page }) => {
  await expect(page.getByText('Tu biblioteca todavía está vacía')).toBeVisible()

  // ── Crear ────────────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Nuevo registro' }).click()
  await page.getByLabel('Título principal').fill('Cowboy Bebop')
  await page.getByLabel('Año de estreno').fill('1998')
  await page.getByLabel('Puntuación personal (0–10)').fill('9.5')
  await page.getByRole('button', { name: 'Guardar nuevo registro' }).click()

  await expect(page.getByText('Cowboy Bebop').first()).toBeVisible()
  await expect(page.getByText('Tu biblioteca todavía está vacía')).toHaveCount(0)

  // ── Editar ───────────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Editar' }).first().click()
  const titulo = page.getByLabel('Título principal')
  await expect(titulo).toHaveValue('Cowboy Bebop')

  await titulo.fill('Cowboy Bebop (remasterizada)')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()

  // `.first()`: el título aparece en la fila y también en el encabezado del panel de
  // resultados, así que sin acotar hay dos coincidencias.
  await expect(page.getByText('Cowboy Bebop (remasterizada)').first()).toBeVisible()

  // El cambio tiene que estar guardado, no solo pintado: recargar lo confirma.
  await page.reload()
  await expect(page.getByText('Cowboy Bebop (remasterizada)').first()).toBeVisible()

  // ── Borrar ───────────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Eliminar' }).first().click()
  await page.getByRole('button', { name: 'Eliminar elemento' }).click()

  await expect(page.getByText('Cowboy Bebop (remasterizada)')).toHaveCount(0)
  await expect(page.getByText('Tu biblioteca todavía está vacía')).toBeVisible()
})

test('la biblioteca de una cuenta no se ve desde otra', async ({ page, browser }) => {
  await page.getByRole('button', { name: 'Nuevo registro' }).click()
  await page.getByLabel('Título principal').fill('Serie privada')
  await page.getByRole('button', { name: 'Guardar nuevo registro' }).click()
  await expect(page.getByText('Serie privada').first()).toBeVisible()

  // Segunda cuenta, en un contexto limpio: sin cookies ni almacenamiento de la primera.
  const contexto = await browser.newContext()
  const otraPagina = await contexto.newPage()
  const { correoNuevo, registrarCuenta, iniciarSesion } = await import('./fixtures')
  const otroEmail = correoNuevo()
  await registrarCuenta(otraPagina, otroEmail)
  await iniciarSesion(otraPagina, otroEmail)

  // El aislamiento entre usuarios ya tiene pruebas dedicadas en el backend; esta comprueba
  // que la interfaz tampoco lo filtra por su cuenta —una caché mal aislada, por ejemplo—.
  await expect(otraPagina.getByText('Serie privada')).toHaveCount(0)
  await expect(otraPagina.getByText('Tu biblioteca todavía está vacía')).toBeVisible()

  await contexto.close()
})

test('la búsqueda filtra la biblioteca', async ({ page }) => {
  for (const titulo of ['Berserk', 'Vinland Saga']) {
    await page.getByRole('button', { name: 'Nuevo registro' }).click()
    await page.getByLabel('Título principal').fill(titulo)
    await page.getByRole('button', { name: 'Guardar nuevo registro' }).click()
    await expect(page.getByText(titulo).first()).toBeVisible()
  }

  // El buscador vive dentro del panel de filtros, que empieza plegado.
  await page.getByRole('button', { name: 'Mostrar filtros' }).click()
  const buscador = page.getByLabel('Buscar título')
  await buscador.fill('vinland')
  await buscador.press('Enter')

  await expect(page.getByText('Vinland Saga').first()).toBeVisible()
  await expect(page.getByText('Berserk')).toHaveCount(0)
})
