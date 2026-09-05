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
 * El botón de borrar es el control más consecuente de la aplicación, y su tinta salía
 * de `--status-dropped` —el color del estado «abandonado» de un elemento—. El tema
 * oscuro sobreescribía su fondo pero no su color, así que quedaba en **2,47:1**:
 * ilegible. Ahora la tinta es `--destructive`, que cada tema define por su cuenta, y
 * este test comprueba la pareja real: la tinta sobre el fondo teñido del propio botón.
 */
describe.each(temas)('acción destructiva en el tema $nombre', ({ selector }) => {
  const body = ruleBody(selector)

  it('la tinta de peligro supera 4,5:1 sobre el fondo del botón', () => {
    const stops = gradientStops(body)
    const panel = parseColor(token(body, 'surface-strong'), stops[0])

    // `--destructive-surface` es translúcido: se compone sobre el panel que hay detrás.
    const fondo = parseColor(token(body, 'destructive-surface'), panel)
    const tinta = parseColor(token(body, 'destructive'))

    const ratio = contrastRatio(tinta, fondo)
    expect(
      Number(ratio.toFixed(2)),
      `--destructive sobre --destructive-surface da ${ratio.toFixed(2)}:1, por debajo del mínimo AA`,
    ).toBeGreaterThanOrEqual(4.5)
  })
})

/**
 * La regresión concreta que hubo: reutilizar un token de `--status-*` como tinta de una
 * acción. Son semánticas distintas —uno describe un elemento de la biblioteca, el otro
 * lo que hace un botón— y acoplarlas hizo que el color de «abandonado» decidiera cómo
 * se ve el botón de borrar.
 */
it('las acciones destructivas no toman su tinta de un token de estado', () => {
  for (const regla of ['.button--danger', '.feedback-banner--danger']) {
    const inicio = css.indexOf(`${regla} {`)
    expect(inicio, `no se encontró la regla ${regla}`).toBeGreaterThan(-1)

    const cuerpo = css.slice(inicio, css.indexOf('}', inicio))
    expect(cuerpo, `${regla} debe usar --destructive, no un --status-*`).not.toContain(
      'var(--status-',
    )
  }
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

/**
 * La pantalla de acceso se escribió entera con valores del tema claro y solo tenía dos
 * reglas `[data-theme='dark']`. Lo que se veía bien se salvaba porque una regla oscura
 * genérica aparecía más abajo en el archivo y ganaba el desempate por orden — no por
 * diseño. En cuanto una de esas desapareció, el botón de acceso volvió a ser azul
 * marino sobre una tarjeta azul marino, y con él salieron a la luz la marca, el título,
 * los enlaces del pie y el mensaje de error, todos en `#0f172a` o `#dc2626` fijos.
 *
 * Un fondo fijo se nota; una tinta fija que no sigue al tema desaparece. De ahí que la
 * regla sea sobre `color`: en esta sección la tinta siempre sale de un token.
 */
it('la pantalla de acceso no fija ninguna tinta a mano', () => {
  const reglas = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .map(([, selector, cuerpo]) => ({ selector: selector.trim(), cuerpo }))
    .filter(({ selector }) => selector.includes('auth') || selector.includes('oauth'))

  expect(reglas.length, 'no se encontró ninguna regla de la pantalla de acceso').toBeGreaterThan(10)

  const culpables = reglas
    .filter(({ cuerpo }) => /(^|[\s;])color:\s*#[0-9a-f]{3,8}/i.test(cuerpo))
    .map(({ selector }) => selector)

  expect(
    culpables,
    `estas reglas fijan la tinta a mano en vez de usar un token, así que no siguen al tema: ${culpables.join(', ')}`,
  ).toEqual([])
})

/**
 * Una variable CSS que no existe no falla: cae en su valor de respaldo, en silencio.
 *
 * El enlace «Saltar al contenido» pedía `--surface`, `--border` y `--accent`, tres
 * nombres que este proyecto nunca ha definido —los suyos son `--surface-strong`,
 * `--border-strong` y `--accent-primary`—, así que su fondo se quedaba en el `#fff` de
 * respaldo. Pero `--text-primary` sí existe, de modo que en tema oscuro el texto se
 * aclaraba sobre un fondo que no: **1,48:1**. Justo en la ayuda de accesibilidad que
 * añadió T1-18.
 */
it('no se usa ninguna variable CSS que no esté definida', () => {
  const definidas = new Set([...css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1]))
  const usadas = new Set([...css.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1]))

  const huerfanas = [...usadas].filter((n) => !definidas.has(n)).sort()

  expect(
    huerfanas,
    `estas variables se usan pero no se definen, así que siempre caen en su valor de respaldo: ${huerfanas.join(', ')}`,
  ).toEqual([])
})
