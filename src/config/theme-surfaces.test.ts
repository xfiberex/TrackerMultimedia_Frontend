import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

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

/**
 * T5-07 — Un `backdrop-filter` solo cuenta si algo puede atravesarlo.
 *
 * Cuatro emergentes —el menú de acciones, los avisos, el panel lateral y el selector de
 * color— difuminaban lo que tenían detrás y lo tapaban con un fondo al 0,97–0,98 de
 * alfa: pasaba el 2–3 %. `.auth-card` era el caso extremo: fondo **opaco** en tema
 * claro, así que su desenfoque no podía verse jamás. Cinco declaraciones que costaban
 * una capa de composición y un repintado por scroll a cambio de nada.
 *
 * Se quitó el desenfoque en vez de bajar el alfa, y la razón no es estética: son las
 * superficies con más texto de la aplicación y aparecen sobre contenido arbitrario. Con
 * un fondo translúcido su contraste deja de ser una propiedad del CSS y pasa a depender
 * de lo que haya debajo, que es justo lo que la red de pruebas de contraste no puede
 * medir. El cristal se queda donde sí se ve y no lleva texto encima: la cabecera (0,88),
 * el cargador (0,92) y los dos velos de fondo (0,40).
 */
describe('cristal declarado y cristal real', () => {
  const reglas = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, cuerpo]) => ({
    selector: selector.trim(),
    cuerpo,
  }))

  const tokens = new Map(
    [...css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/gi)].map((m) => [m[1], m[2].trim()]),
  )

  /** El fondo declarado por una regla, con los `var()` de un solo nivel ya resueltos. */
  function fondo(cuerpo: string): string | null {
    const match = /(?:^|[\s;])background(?:-color)?:\s*([^;]+);/.exec(cuerpo)
    if (!match) return null
    return match[1].replace(
      /var\(\s*(--[a-z0-9-]+)[^)]*\)/gi,
      (todo, nombre) => tokens.get(nombre) ?? todo,
    )
  }

  /**
   * La opacidad de la capa que se pinta **encima**, que es la primera de la lista —la
   * misma trampa que dio un falso positivo al medir el contraste del acceso—. Corta por
   * la primera coma de nivel superior, sin entrar en los paréntesis del degradado.
   */
  function opacidadDeLaCapaSuperior(valor: string): number {
    let profundidad = 0
    let corte = valor.length
    for (let i = 0; i < valor.length; i += 1) {
      if (valor[i] === '(') profundidad += 1
      else if (valor[i] === ')') profundidad -= 1
      else if (valor[i] === ',' && profundidad === 0) {
        corte = i
        break
      }
    }

    const capa = valor.slice(0, corte)
    const colores = [...capa.matchAll(/rgba?\(([^)]*)\)|#[0-9a-f]{3,8}/gi)]
    if (colores.length === 0) return 1

    return Math.max(
      ...colores.map(([, argumentos]) => {
        if (argumentos === undefined) return 1
        const partes = argumentos.split(/[\s,/]+/).filter(Boolean)
        return partes.length < 4 ? 1 : Number(partes[3])
      }),
    )
  }

  const conCristal = reglas.filter(({ cuerpo }) => cuerpo.includes('backdrop-filter'))

  it('hay reglas con `backdrop-filter` que comprobar', () => {
    expect(conCristal.length).toBeGreaterThan(0)
  })

  it.each(conCristal.map(({ selector }) => selector))(
    '`%s` deja pasar algo de lo que difumina',
    (selector) => {
      // La regla del tema oscuro no repite el `backdrop-filter`, pero sí el fondo, así que
      // una superficie puede ser cristal en un tema y un muro en el otro.
      const variantes = reglas.filter(
        (regla) =>
          regla.selector === selector || regla.selector === `[data-theme='dark'] ${selector}`,
      )

      for (const variante of variantes) {
        const valor = fondo(variante.cuerpo)
        if (valor === null) continue

        const opacidad = opacidadDeLaCapaSuperior(valor)
        expect(
          opacidad,
          `\`${variante.selector}\` difumina lo que hay detrás y lo tapa con un fondo al ` +
            `${opacidad} de alfa: no se ve nada de lo difuminado, y la capa de composición se paga igual`,
        ).toBeLessThanOrEqual(0.95)
      }
    },
  )
})
