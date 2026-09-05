import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

/**
 * T5-04 — Por qué `--surface-strong: #ffffff` se queda como está.
 *
 * La ficha de *Glassmorphism* lista los fondos blancos puros como anti-patrón del
 * estilo, y con razón: el cristal necesita algo detrás que se transparente, y sobre
 * blanco puro no hay nada que enseñar. Pero eso habla del cristal, y este token no lo
 * es. Sus cuatro usuarios —el enlace de saltar al contenido, el campo y el botón
 * secundario de la pantalla de acceso, y el panel del límite de errores— son
 * superficies deliberadamente opacas, y ninguno lleva `backdrop-filter`. El cristal
 * de verdad está en otras nueve reglas, que fijan su propio alfa y no tocan este token.
 *
 * Además, cambiarlo no se vería: `--surface-primary` es `rgba(255, 255, 255, 0.92)`, que
 * compuesto sobre el arranque del degradado de página da **#fdfdfe**. Las tarjetas ya
 * se pintan a un 1 % del blanco puro, así que un «blanco roto» para las superficies
 * opacas solo añadiría un segundo casi-blanco sin regla que diga cuándo usar cuál.
 *
 * Este test fija la premisa, que es lo único que puede dejar de ser cierto: el día que
 * alguien pinte una superficie esmerilada con `--surface-strong`, el anti-patrón pasa a
 * aplicarse de verdad y la decisión hay que volver a tomarla. La suite lo dirá.
 */

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8')

it('ninguna superficie esmerilada se pinta con `--surface-strong`', () => {
  const reglas = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, cuerpo]) => ({
    selector: selector.trim(),
    cuerpo,
  }))

  const conCristal = reglas.filter(({ cuerpo }) => cuerpo.includes('backdrop-filter'))
  expect(conCristal.length, 'no se encontró ninguna regla con `backdrop-filter`').toBeGreaterThan(0)

  const culpables = conCristal
    .filter(({ cuerpo }) => cuerpo.includes('var(--surface-strong'))
    .map(({ selector }) => selector)

  expect(
    culpables,
    `estas reglas difuminan lo que hay detrás y lo tapan con un blanco opaco, que es el ` +
      `anti-patrón que T5-04 dio por no aplicable: ${culpables.join(', ')}`,
  ).toEqual([])
})
