import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * T5-11 — La flecha de los `select`, en los dos temas.
 *
 * La flecha nativa se dibuja pegada al borde derecho y **no la mueve `padding-right`**,
 * así que los doce `select` de la aplicación la tenían en el filo mientras su texto
 * respetaba el margen del otro lado. Se arregló con `appearance: none` y un
 * `background-image`, que es la forma habitual y trae consigo una trampa propia:
 *
 * **quitada la nativa, si el dibujo no aparece no hay flecha ninguna.** Y desaparece con
 * un descuido de una línea, porque `background` en forma corta reinicia
 * `background-image`. La regla del tema oscuro usa esa forma corta, de modo que la
 * flecha hay que reponerla ahí; quien la borre dejará los desplegables sin ningún
 * indicador de que se pueden desplegar. Eso no rompe ninguna prueba de comportamiento
 * —el control sigue funcionando— y en tema claro no se ve, que es donde se trabaja.
 *
 * Esta prueba recorre las reglas que afectan a `.select` **en el orden del archivo**,
 * imitando la cascada, y comprueba que al final de cada tema quede una imagen puesta.
 */

// Los comentarios se quitan antes de trocear. Si no, todo lo que hay entre una regla y
// la siguiente —incluido el comentario que explica esto mismo— acaba dentro del
// «selector» de la regla siguiente y ninguna coincide con nada.
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)

type Regla = { selector: string; cuerpo: string }

const reglas: Regla[] = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, cuerpo]) => ({
  selector: selector.trim(),
  cuerpo,
}))

/** Las reglas que alcanzan a `.select` dentro de un tema, en orden de aparición. */
function reglasDelTema(prefijo: string): Regla[] {
  return reglas.filter((regla) =>
    regla.selector
      .split(',')
      .map((parte) => parte.trim())
      .includes(`${prefijo}.select`),
  )
}

/**
 * Las cuatro propiedades que hacen falta para que la flecha se vea bien. Dibujarla no es
 * solo ponerla: sin `no-repeat` se empapela el campo, sin tamaño sale al natural del SVG
 * y sin posición se va a la esquina superior izquierda.
 */
const PROPIEDADES = [
  'background-image',
  'background-repeat',
  'background-size',
  'background-position',
] as const

type Propiedad = (typeof PROPIEDADES)[number]

/**
 * Reproduce lo único de la cascada que importa aquí, y que es más de lo que parece:
 * `background` en forma corta **reinicia las cuatro**, no solo la imagen. Esa fue
 * exactamente la equivocación que hubo que corregir —se repuso la imagen en tema oscuro y
 * se dieron por buenas las otras tres—, y el resultado fue un campo empapelado de flechas
 * gigantes que esta prueba, entonces, daba por bueno.
 */
function fondoFinal(reglasDelSelect: Regla[]): Record<Propiedad, string | null> {
  const estado: Record<Propiedad, string | null> = {
    'background-image': null,
    'background-repeat': null,
    'background-size': null,
    'background-position': null,
  }

  // Literal, no `new RegExp` con plantilla: una barra invertida dentro de una plantilla se
  // pierde en silencio y la comprobación pasa a no comprobar nada. Ver PITFALLS.md.
  const longhand = /(background-(?:image|repeat|size|position))\s*:\s*([^;]+)/g
  const formaCorta = /(?:^|[;\s])background\s*:/

  for (const { cuerpo } of reglasDelSelect) {
    if (formaCorta.test(cuerpo)) {
      for (const propiedad of PROPIEDADES) estado[propiedad] = null
    }

    for (const [, propiedad, valor] of cuerpo.matchAll(longhand)) {
      estado[propiedad as Propiedad] = valor.trim()
    }
  }

  return estado
}

describe('la flecha de los `select`', () => {
  const claro = reglasDelTema('')
  const oscuro = [...claro, ...reglasDelTema("[data-theme='dark'] ")]
  const temas: [string, Regla[]][] = [
    ['claro', claro],
    ['oscuro', oscuro],
  ]

  it('sustituye la nativa en vez de convivir con ella', () => {
    const cuerpos = claro.map(({ cuerpo }) => cuerpo).join('\n')

    // Sin esto la nativa vuelve, y con ella el defecto: pegada al borde y sorda al
    // `padding-right`. Con esto puesto, la flecha pasa a ser responsabilidad nuestra.
    expect(cuerpos, '`.select` ya no declara `appearance: none`').toMatch(/appearance:\s*none/)

    // El hueco que la flecha ocupa hay que reservarlo: sin él, una opción larga se le
    // mete por debajo, y eso solo se ve con los datos adecuados delante.
    expect(cuerpos, '`.select` no reserva sitio para la flecha con `padding-right`').toMatch(
      /padding-right\s*:/,
    )
  })

  it.each(temas)('deja la flecha entera en el tema %s', (tema, reglas) => {
    const fondo = fondoFinal(reglas)
    const perdidas = PROPIEDADES.filter((propiedad) => fondo[propiedad] === null)

    expect(
      perdidas,
      `en el tema ${tema} \`.select\` se queda sin ${perdidas.join(', ')}. ` +
        'Casi siempre es por pintar el fondo con `background` en forma corta, que reinicia ' +
        'las cuatro de golpe: sin imagen no hay flecha, y con imagen pero sin las otras tres ' +
        'el campo sale empapelado de flechas. Píntalo con `background-color`.',
    ).toEqual([])
  })

  it.each(temas)('coloca la flecha donde debe en el tema %s', (tema, reglas) => {
    const fondo = fondoFinal(reglas)

    // Una sola, no un mosaico. Es el valor por defecto de CSS el que empapela, así que
    // esto no es redundante: es justo lo que se pierde al reiniciar.
    expect(fondo['background-repeat'], `la flecha se repite en el tema ${tema}`).toBe('no-repeat')

    // `right var(--space-4)` es el mismo margen que el texto lleva al otro lado. Un
    // `right 0` o un `right` a secas la devuelven al filo, que es de donde venimos.
    expect(
      fondo['background-position'],
      `la flecha vuelve a estar pegada al borde en el tema ${tema}`,
    ).toMatch(/right\s+var\(--space-4\)/)
  })
})
