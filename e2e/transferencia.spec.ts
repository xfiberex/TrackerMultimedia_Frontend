import { readFileSync } from 'node:fs'
import { test, expect } from './fixtures'

/**
 * T4-04 — Exportar la biblioteca y volver a importarla.
 *
 * Es el recorrido con más piezas de la aplicación: el navegador descarga un archivo que
 * genera el servidor, y ese mismo archivo vuelve por un formulario de subida. Ninguna de
 * las otras dos suites lo ve entero —la de vitest simula la descarga y la de xUnit no
 * tiene navegador—, y es justo donde un cambio de formato se nota tarde.
 */

test('lo exportado se puede volver a importar', async ({ page }) => {
  await page.getByRole('button', { name: 'Nuevo registro' }).click()
  await page.getByLabel('Título principal').fill('Monster')
  await page.getByLabel('Año de estreno').fill('2004')
  await page.getByRole('button', { name: 'Guardar nuevo registro' }).click()
  await expect(page.getByText('Monster').first()).toBeVisible()

  // ── Exportar ─────────────────────────────────────────────────────────────
  const descarga = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar' }).click()
  await page.getByRole('menuitem', { name: 'JSON' }).click()
  const archivo = await descarga

  const ruta = await archivo.path()
  const contenido = JSON.parse(readFileSync(ruta, 'utf8'))
  expect(JSON.stringify(contenido)).toContain('Monster')

  // ── Borrar y volver a importar ───────────────────────────────────────────
  await page.getByRole('button', { name: 'Eliminar' }).first().click()
  await page.getByRole('button', { name: 'Eliminar elemento' }).click()
  await expect(page.getByText('Tu biblioteca todavía está vacía')).toBeVisible()

  const seleccion = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Importar' }).click()
  await page.getByRole('menuitem', { name: 'JSON' }).click()
  const selector = await seleccion
  await selector.setFiles(ruta)

  // Si el formato de exportación y el que espera la importación se separan, es aquí donde
  // se ve, y no meses después al intentar recuperar una copia.
  await expect(page.getByText('Monster').first()).toBeVisible()
})

/**
 * **Esta prueba fija el comportamiento de hoy, que no es el que debería ser.**
 *
 * Un JSON que no tiene nada que ver con una exportación se acepta y se responde
 * «Importación JSON completada sin cambios», con el tono de éxito. La aplicación no se
 * rompe —que es lo que esta prueba garantiza— pero tampoco dice que el archivo no era
 * suyo, así que quien se equivoque de archivo puede concluir que su copia estaba vacía.
 *
 * Queda anotado como T2-29 en el ROADMAP. Cuando se decida qué hacer, esta prueba es la
 * que hay que cambiar, y el cambio se verá aquí en vez de pasar desapercibido.
 */
test('un archivo que no es una exportación no rompe la biblioteca', async ({ page }) => {
  const seleccion = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Importar' }).click()
  await page.getByRole('menuitem', { name: 'JSON' }).click()
  const selector = await seleccion

  await selector.setFiles({
    name: 'cualquier-cosa.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"esto":"no es una exportación"}'),
  })

  // Lo que sí está garantizado: la aplicación sigue en pie, avisa de algo y no ha metido
  // basura en la biblioteca. Un 500 con el mensaje de la excepción a la vista es lo que
  // cerraron T2-05 y T2-11.
  await expect(page.locator('.toast-stack')).toContainText(/Importación JSON/i)
  await expect(page.getByText('Tu biblioteca todavía está vacía')).toBeVisible()
})
