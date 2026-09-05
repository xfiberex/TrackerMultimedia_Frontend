import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Contraste de los colores de texto contra WCAG AA (4,5:1 para texto normal).
 *
 * Existe porque este defecto no lo detecta nada de lo que ya hay. `eslint-plugin-jsx-a11y`
 * mira el marcado, no los colores; `tsc` no ve CSS; y los tests de componentes pasan
 * igual con texto ilegible, porque `getByText` encuentra el nodo aunque nadie pueda
 * leerlo. Estuvo roto meses: el texto secundario daba **1,96:1** sobre el fondo de
 * página, y la pestaña activa del catálogo en modo oscuro, **1,41:1**.
 *
 * El test lee los tokens del CSS en vez de repetirlos, así que cambiar un color y
 * bajar del mínimo pone la suite en rojo con el número exacto.
 */

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8')

/** Relación de contraste del WCAG 2.1, sobre la luminancia relativa de sRGB. */
function relativeLuminance([r, g, b]: RGB): number {
  const toLinear = (channel: number) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastRatio(foreground: RGB, background: RGB): number {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

type RGB = [number, number, number]

/**
 * Un color translúcido no tiene contraste por sí mismo: depende de lo que tenga
 * detrás. Se compone sobre blanco, que es el lienzo del navegador y el caso menos
 * favorable para texto oscuro.
 */
function parseColor(value: string, over: RGB = [255, 255, 255]): RGB {
  const hex = /^#([0-9a-f]{6})$/i.exec(value.trim())
  if (hex) {
    const n = parseInt(hex[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }

  const rgba = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/i.exec(
    value,
  )
  if (!rgba) throw new Error(`No se pudo interpretar el color: ${value}`)

  const alpha = rgba[4] === undefined ? 1 : Number(rgba[4])
  return [1, 2, 3].map((i) =>
    Math.round(alpha * Number(rgba[i]) + (1 - alpha) * over[i - 1]),
  ) as RGB
}

/** Extrae el cuerpo de una regla CSS por su selector. */
function ruleBody(selector: string): string {
  const index = css.indexOf(`${selector} {`)
  expect(index, `no se encontró la regla \`${selector}\` en index.css`).toBeGreaterThan(-1)
  return css.slice(index, css.indexOf('\n}', index))
}

function token(body: string, name: string): string {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(body)
  expect(match, `el token \`--${name}\` no está definido en el bloque`).not.toBeNull()
  return match![1].trim()
}

/** Los colores de fondo declarados en el degradado de página de un tema. */
function gradientStops(body: string): RGB[] {
  const gradient = /background:\s*linear-gradient\(([^;]+)\);/.exec(body)
  expect(gradient, 'no se encontró el degradado de fondo del tema').not.toBeNull()

  const stops = gradient![1].match(/#[0-9a-f]{6}|rgba?\([^)]*\)/gi) ?? []
  expect(stops.length, 'el degradado no declara ningún color').toBeGreaterThan(0)
  return stops.map((stop) => parseColor(stop))
}

const temas = [
  { nombre: 'claro', selector: ':root' },
  { nombre: 'oscuro', selector: "[data-theme='dark']" },
] as const

describe.each(temas)('contraste del tema $nombre', ({ selector }) => {
  const body = ruleBody(selector)

  // Todo fondo sobre el que se pinta texto: las paradas del degradado de página y
  // las superficies de tarjeta y panel, compuestas sobre la peor de esas paradas.
  const fondos = () => {
    const stops = gradientStops(body)
    const peor = stops[0]
    return [
      ...stops.map((rgb, i) => ({ nombre: `degradado ${i + 1}`, rgb })),
      { nombre: 'surface-strong', rgb: parseColor(token(body, 'surface-strong'), peor) },
      { nombre: 'surface-primary', rgb: parseColor(token(body, 'surface-primary'), peor) },
    ]
  }

  it.each(['text-primary', 'text-secondary', 'text-muted'])(
    '`--%s` supera 4,5:1 sobre todos los fondos del tema',
    (nombre) => {
      const texto = parseColor(token(body, nombre))

      for (const fondo of fondos()) {
        const ratio = contrastRatio(texto, fondo.rgb)
        expect(
          Number(ratio.toFixed(2)),
          `--${nombre} sobre ${fondo.nombre} da ${ratio.toFixed(2)}:1, por debajo del mínimo AA`,
        ).toBeGreaterThanOrEqual(4.5)
      }
    },
  )
})

/**
 * `--accent-primary` es un tono de superficie, no de tinta: en oscuro vale #334155 y
 * sobre el panel daba 1,41:1. Se usó como color de texto en la pestaña activa del
 * catálogo, que quedó indistinguible de las inactivas. Este test fija que la tinta de
 * los elementos activos salga de `--accent-ink`, que es el token que sí contrasta.
 */
it('la pestaña activa del catálogo en oscuro no usa un color de superficie como tinta', () => {
  const regla = /\[data-theme='dark'\] \.catalog-tab--active \{([^}]*)\}/.exec(css)
  expect(regla, 'no se encontró la regla de la pestaña activa en oscuro').not.toBeNull()

  expect(regla![1]).not.toContain('var(--accent-primary)')
  expect(regla![1]).toContain('var(--accent-ink)')
})
