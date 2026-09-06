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
 * T2-29, cerrada el 2026-09-06.
 *
 * Hasta ese día un JSON que no tenía nada que ver con una exportación se aceptaba y se
 * respondía «Importación JSON completada sin cambios», con el tono de éxito: quien se
 * equivocara de archivo podía concluir que su copia de seguridad estaba vacía. Ahora el
 * servidor lo rechaza y lo dice.
 *
 * Esta prueba comprueba las dos mitades a la vez, porque separadas no significan nada:
 * que **avisa** y que **no ha metido nada** en la biblioteca. Recorre el camino entero
 * —archivo, servidor, mensaje en pantalla—, que es justo donde el aviso se perdía: el
 * mensaje viaja en `errors` de un ProblemDetails, y el frontend leía antes el `title`
 * genérico en inglés que ASP.NET pone siempre.
 */
test('un archivo que no es una exportación se rechaza y se dice por qué', async ({ page }) => {
  const seleccion = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Importar' }).click()
  await page.getByRole('menuitem', { name: 'JSON' }).click()
  const selector = await seleccion

  await selector.setFiles({
    name: 'cualquier-cosa.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"esto":"no es una exportación"}'),
  })

  // El mensaje concreto, no uno cualquiera: que diga que el archivo no es una exportación
  // es la diferencia entre esta prueba y la de antes, que se daba por satisfecha con
  // «Importación JSON» y por eso pasaba con el defecto dentro.
  const aviso = page.locator('.toast-stack')
  await expect(aviso).toContainText(/no es una exportación de TrackerMultimedia/i)
  await expect(aviso).not.toContainText(/validation errors/i)

  // Y sigue sin entrar basura. Un 500 con el mensaje de la excepción a la vista es lo que
  // cerraron T2-05 y T2-11.
  await expect(page.getByText('Tu biblioteca todavía está vacía')).toBeVisible()
})
