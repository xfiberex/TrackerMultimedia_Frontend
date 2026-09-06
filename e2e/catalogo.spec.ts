import { test, expect } from './fixtures'

/**
 * T5-12 — El desplegable de color no se corta dentro del diálogo.
 *
 * Este defecto **solo se puede ver aquí**. No es de comportamiento —el color se elegía
 * perfectamente— sino de disposición, y la disposición hay que calcularla: jsdom no
 * maqueta, así que ninguna prueba de vitest puede medir un recorte. Hace falta un
 * navegador de verdad.
 *
 * Lo que pasaba: el desplegable flotaba con `position: absolute` dentro de
 * `.side-panel__content`, que se desplaza. Un hijo posicionado en absoluto no ensancha la
 * caja de su contenedor pero sí cuenta como desbordamiento, de modo que el diálogo sacaba
 * una barra y cortaba la última fila —la del color personalizado— **con espacio de sobra
 * en pantalla**. Medido antes del arreglo: el diálogo terminaba en 720 y el desplegable,
 * en 725.
 *
 * Por eso las dos aserciones son necesarias y distintas: que no haya barra no garantiza
 * que se vea entero, y verse entero no garantiza que no haya barra.
 */
test('el desplegable de color cabe entero en el diálogo de nueva categoría', async ({ page }) => {
  await page.goto('/catalog')
  await page.getByRole('button', { name: 'Nueva categoría' }).first().click()

  const dialogo = page.locator('.side-panel__content')
  await expect(dialogo).toBeVisible()

  await page.getByRole('button', { name: /Sin color/ }).click()
  await expect(page.locator('.color-picker-popover')).toBeVisible()

  const medidas = await dialogo.evaluate((el) => {
    const popover = el.querySelector('.color-picker-popover')
    if (!popover) throw new Error('no se encontró el desplegable de color')

    return {
      desborda: el.scrollHeight > el.clientHeight,
      // El píxel de margen absorbe el redondeo del navegador, no un recorte real.
      recortado: popover.getBoundingClientRect().bottom > el.getBoundingClientRect().bottom + 1,
    }
  })

  expect(medidas.desborda, 'el diálogo volvió a necesitar barra de desplazamiento').toBe(false)
  expect(medidas.recortado, 'la última fila del desplegable de color queda cortada').toBe(false)
})
