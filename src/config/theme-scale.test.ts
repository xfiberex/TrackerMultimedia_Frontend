import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * T5-03 — La escala de medidas, y la pantalla que sirve de plantilla.
 *
 * Los 33 tokens que había eran todos de color y sombra, así que cada clase escribía sus
 * medidas a mano. Medido antes de la escala: **39 espaciados**, 9 radios y **19 tamaños
 * de texto**. Muchos de esos tamaños se diferenciaban en `0,02rem` —un tercio de píxel—,
 * de modo que `0,8`, `0,82`, `0,84`, `0,85`, `0,875` y `0,88` eran seis maneras de
 * escribir lo mismo sin que nadie pudiera verlas distintas.
 *
 * Estas pruebas no comprueban que la escala sea bonita, sino las dos cosas que pueden
 * dejar de ser ciertas sin que se note: que la escala siga siendo una escala, y que la
 * vista migrada siga sin medidas a mano. La segunda es la que importa, porque la
 * plantilla solo sirve mientras siga siéndolo.
 */

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8')

const raiz = css.slice(css.indexOf(':root {'), css.indexOf('\n}', css.indexOf(':root {')))

function tokens(prefijo: string): [string, string][] {
  return [...raiz.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/gi)]
    .filter(([, nombre]) => nombre.startsWith(`--${prefijo}`))
    .map((m) => [m[1], m[2].trim()])
}

const aPx = (valor: string) =>
  valor.endsWith('rem') ? Number.parseFloat(valor) * 16 : Number.parseFloat(valor)

describe('la escala de medidas', () => {
  it('el espaciado es la rejilla de 4px y el número es el múltiplo', () => {
    const escala = tokens('space-')
    expect(escala.length, 'no se encontró ninguna variable `--space-*`').toBeGreaterThan(5)

    for (const [nombre, valor] of escala) {
      const multiplo = Number(nombre.replace('--space-', ''))
      expect(
        aPx(valor),
        `\`${nombre}\` vale ${valor}; en una rejilla de 4px tendría que valer ${multiplo * 4}px`,
      ).toBe(multiplo * 4)
    }
  })

  /**
   * El defecto que originó la tarea: tamaños separados por menos de un píxel. Una escala
   * con dos peldaños indistinguibles no es una escala, es la misma cola de valores a mano
   * con nombres nuevos.
   */
  it('los peldaños de la tipografía se distinguen entre sí', () => {
    const escala = tokens('type-').map(([nombre, valor]) => ({ nombre, px: aPx(valor) }))
    expect(escala.length, 'no se encontró ninguna variable `--type-*`').toBeGreaterThan(4)

    for (let i = 1; i < escala.length; i += 1) {
      const salto = escala[i].px - escala[i - 1].px
      expect(
        salto,
        `\`${escala[i - 1].nombre}\` (${escala[i - 1].px}px) y \`${escala[i].nombre}\` ` +
          `(${escala[i].px}px) se llevan ${salto}px: o no van en orden, o nadie los ve distintos`,
      ).toBeGreaterThanOrEqual(2)
    }
  })
})

/**
 * La pantalla de acceso es la vista migrada entera, y por eso es la plantilla del resto.
 * Mientras nada vuelva a escribir una medida a mano ahí, sirve de referencia para mirar
 * cómo se hace; en cuanto una se cuele, deja de servir y esta prueba lo dice.
 */
it('la pantalla de acceso no escribe ninguna medida a mano', () => {
  const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '')

  // Literal, no `new RegExp` con plantilla: una barra invertida dentro de una plantilla
  // se pierde en silencio y la comprobación pasa a no comprobar nada. Ver PITFALLS.md.
  const medidas =
    /(?:^|[\s;])(padding[a-z-]*|margin[a-z-]*|gap|row-gap|column-gap|border-radius|font-size|line-height):\s*([^;}]+)/g

  const culpables = [...sinComentarios.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, selector]) => selector.includes('auth') || selector.includes('oauth'))
    .flatMap(([, selector, cuerpo]) =>
      [...cuerpo.matchAll(medidas)]
        .filter(([, , valor]) => /[\d.]+(rem|px|em)/.test(valor) || /^\s*[\d.]+\s*$/.test(valor))
        .map(([, propiedad, valor]) => `${selector.trim()} → ${propiedad}: ${valor.trim()}`),
    )

  expect(
    culpables,
    `estas medidas están escritas a mano en vez de salir de la escala:\n  ${culpables.join('\n  ')}`,
  ).toEqual([])
})
