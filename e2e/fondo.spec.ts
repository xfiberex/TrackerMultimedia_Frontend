import { test, expect } from './fixtures'

/**
 * T5-13 — El fondo ambiental está quieto, y sigue al tema estando quieto.
 *
 * El fondo es un shader WebGL. Tenía dos animaciones —seguía al puntero y derivaba con el
 * tiempo— y las dos se quitaron, con lo que se fue también el `requestAnimationFrame` que
 * repintaba la pantalla entera sesenta veces por segundo para siempre.
 *
 * Eso deja **tres cosas que fallan sin hacer ruido**, y de ahí las tres comprobaciones:
 *
 * 1. Si el shader deja de compilar, `initGL` devuelve `null` y el componente cae al
 *    degradado CSS de reserva. No hay error, ni en consola ni en el build: solo un fondo
 *    distinto que nadie mira.
 * 2. Si alguien devuelve el bucle, vuelve el gasto permanente. Y no se ve, porque un
 *    fondo que deriva despacio parece quieto.
 * 3. **Sin bucle, el lienzo ya no se refresca solo.** Antes el fotograma siguiente traía
 *    el color nuevo al cambiar de tema; ahora hay que repintar a mano. Olvidarlo deja el
 *    fondo del tema anterior debajo de una interfaz que ya cambió.
 *
 * Nada de esto lo puede ver vitest: jsdom no tiene WebGL ni compone píxeles.
 */

// Una esquina de la ventana donde solo se ve el fondo. El test comprueba que sigue
// siéndolo antes de medir nada: si algún día la interfaz llega hasta aquí, estas medidas
// pasarían a hablar de otra cosa y seguirían en verde.
const ESQUINA = { x: 2, y: 700, width: 30, height: 16 }

test('el fondo se pinta una sola vez y repinta al cambiar de tema', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window)
    ;(window as unknown as { __raf: number }).__raf = 0
    window.requestAnimationFrame = (cb) => {
      ;(window as unknown as { __raf: number }).__raf += 1
      return original(cb)
    }
  })

  await page.goto('/library')

  // (1) El shader compila: hay lienzo y no hay degradado de reserva.
  await expect(page.locator('canvas.ambient-bg--canvas')).toHaveCount(1)
  await expect(page.locator('.ambient-bg--fallback')).toHaveCount(0)

  // Lo que hay que saber no es qué elemento cae en ese punto —siempre cae alguno: los
  // contenedores de la página lo cubren todo, y el lienzo ni siquiera responde a
  // `elementFromPoint` porque lleva `pointer-events: none`— sino **si algo pinta ahí
  // encima**. Así que se recorre la pila desde el punto hasta `body` buscando cualquier
  // fondo opaco.
  const esquina = await page.evaluate(({ x, y }) => {
    const lienzo = document.querySelector('canvas.ambient-bg--canvas')!.getBoundingClientRect()
    const cubierta = x >= lienzo.left && x < lienzo.right && y >= lienzo.top && y < lienzo.bottom

    const pintanEncima: string[] = []
    for (
      let el = document.elementFromPoint(x, y);
      el && el !== document.body;
      el = el.parentElement
    ) {
      const estilo = getComputedStyle(el)
      const transparente =
        (estilo.backgroundColor === 'rgba(0, 0, 0, 0)' ||
          estilo.backgroundColor === 'transparent') &&
        estilo.backgroundImage === 'none'
      if (!transparente) pintanEncima.push(el.tagName + (el.className ? `.${el.className}` : ''))
    }

    return { cubierta, pintanEncima }
  }, ESQUINA)

  const aviso =
    'la esquina que se mide ya no es solo el fondo, así que las dos comprobaciones ' +
    'siguientes estarían mirando otra cosa y pasarían por el motivo equivocado. ' +
    'Mueve `ESQUINA` a un hueco libre.'

  expect(esquina.cubierta, aviso).toBe(true)
  expect(esquina.pintanEncima, aviso).toEqual([])

  // (2) En reposo no se programa ni un fotograma.
  const contarFotogramas = () => page.evaluate(() => (window as unknown as { __raf: number }).__raf)

  await page.waitForTimeout(500)
  const antes = await contarFotogramas()
  const enClaro = await page.screenshot({ clip: ESQUINA })
  await page.waitForTimeout(1500)
  const despues = await contarFotogramas()

  expect(
    despues - antes,
    'algo volvió a programar fotogramas con la ventana quieta: el fondo está animándose',
  ).toBe(0)
  expect(
    await page.screenshot({ clip: ESQUINA }),
    'el fondo cambió sin que nadie lo tocara',
  ).toEqual(enClaro)

  // (3) Y aun así sigue al tema, que es lo que el bucle hacía gratis.
  await page.getByRole('button', { name: /Cambiar a modo/ }).click()
  await expect(page.locator('html[data-theme="dark"]')).toHaveCount(1)
  await page.waitForTimeout(400)

  expect(
    await page.screenshot({ clip: ESQUINA }),
    'el fondo se quedó en el tema anterior: falta repintar al cambiar `data-theme`',
  ).not.toEqual(enClaro)
})
