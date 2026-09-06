import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * T5-03 y T5-08 — La escala de medidas, y el archivo entero apoyado en ella.
 *
 * Los 33 tokens que había eran todos de color y sombra, así que cada clase escribía sus
 * medidas a mano. Medido antes de la escala: **39 espaciados**, 9 radios y **19 tamaños
 * de texto**. Muchos de esos tamaños se diferenciaban en `0,02rem` —un tercio de píxel—,
 * de modo que `0,8`, `0,82`, `0,84`, `0,85`, `0,875` y `0,88` eran seis maneras de
 * escribir lo mismo sin que nadie pudiera verlas distintas.
 *
 * T5-03 montó la escala y migró una vista; **T5-08 migró las 296 medidas restantes** y con
 * ello esta prueba pasó de vigilar una lista de prefijos a vigilar el archivo completo.
 *
 * Estas pruebas no comprueban que la escala sea bonita, sino las dos cosas que pueden
 * dejar de ser ciertas sin que se note: que la escala siga siendo una escala, y que no
 * vuelva a colarse una medida a mano en ninguna regla.
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
 * Medidas que **no** son de diseño, y por eso no salen de la escala. La lista es corta a
 * propósito: cada entrada necesita un motivo por el que la rejilla de 4px no tiene nada
 * que decir sobre ese valor. «Queda mejor así» no es un motivo — para eso está la escala.
 */
const EXCEPCIONES: { selector: string; propiedad: string; porque: string }[] = [
  {
    selector: '.toggle-switch',
    propiedad: 'margin-top',
    porque:
      'Ajuste óptico de 2px para alinear el interruptor con la línea base de su etiqueta. ' +
      'No es espaciado, es un empujón.',
  },
  {
    selector: '.catalog-tab',
    propiedad: 'margin-bottom',
    porque:
      'Los -1,5px suben la pestaña para que su subrayado de 2,5px monte sobre el borde ' +
      'del contenedor. Va atado al grosor del borde, no a la rejilla de espaciado.',
  },
]

/**
 * T5-08 — **Ya no hay una lista de bloques migrados: se comprueba el archivo entero.**
 *
 * T5-03 dejó la escala montada y una sola vista sobre ella, y esta prueba vigilaba solo
 * esa vista por su prefijo. Al terminar la migración la lista habría tenido los 43
 * prefijos del archivo, que es una forma peor de decir «todos»: invertida, cualquier clase
 * nueva queda vigilada desde el momento en que se escribe, sin que nadie tenga que
 * acordarse de apuntarla.
 */
it('ninguna regla del archivo escribe una medida a mano', () => {
  const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '')

  // Literal, no `new RegExp` con plantilla: una barra invertida dentro de una plantilla
  // se pierde en silencio y la comprobación pasa a no comprobar nada. Ver PITFALLS.md.
  const medidas =
    /(?:^|[\s;])(padding[a-z-]*|margin[a-z-]*|gap|row-gap|column-gap|border-radius|font-size|line-height):\s*([^;}]+)/g

  /**
   * `0` no es una medida de la escala: es la ausencia de medida, y no hay ningún token
   * que darle. Un `margin: 0` que quitara el margen por defecto del navegador tendría que
   * escribirse igual con escala o sin ella.
   *
   * La comprobación original no lo excluía y nadie se enteró, porque la pantalla de acceso
   * —la única vista migrada entonces— no tenía ni un cero. Apareció al migrar el catálogo
   * de categorías, con cuatro.
   */
  const esMedidaAMano = (valor: string) => {
    // Lo que ya sale de la escala no cuenta, y `5vw` de un `clamp()` tampoco: son
    // proporciones de la ventana, no peldaños.
    const sinTokens = valor.replace(/var\([^)]*\)/g, '').replace(/[\d.]+(vw|vh|vmin|vmax|%)/g, '')

    const conUnidad = [...sinTokens.matchAll(/([\d.]+)(rem|px|em)\b/g)].map((m) => Number(m[1]))
    const sinUnidad = [...sinTokens.matchAll(/(?:^|[\s,(])([\d.]+)(?![\d.]*[a-z%])/g)].map((m) =>
      Number(m[1]),
    )

    return [...conUnidad, ...sinUnidad].some((numero) => numero !== 0)
  }

  const exceptuada = (selector: string, propiedad: string) =>
    EXCEPCIONES.some((e) => selector.includes(e.selector) && propiedad.trim() === e.propiedad)

  // `[^{}]*` en el cuerpo, no `[^}]*`: este último se traga la llave de apertura de una
  // regla anidada, así que el «selector» de una regla dentro de `@media` acababa siendo la
  // propia consulta de medios y sus reglas internas quedaban fuera del alcance. Con esto
  // solo casan las reglas más internas, que son las que tienen un selector de verdad.
  const culpables = [...sinComentarios.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(
    ([, selector, cuerpo]) =>
      [...cuerpo.matchAll(medidas)]
        .filter(([, propiedad, valor]) => esMedidaAMano(valor) && !exceptuada(selector, propiedad))
        .map(([, propiedad, valor]) => `${selector.trim()} → ${propiedad}: ${valor.trim()}`),
  )

  expect(
    culpables,
    `estas medidas están escritas a mano en vez de salir de la escala:\n  ${culpables.join('\n  ')}`,
  ).toEqual([])
})
