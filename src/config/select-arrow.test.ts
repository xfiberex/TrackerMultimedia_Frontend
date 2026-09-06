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
 * Reproduce lo único de la cascada que importa aquí: `background` en forma corta borra
 * la imagen; `background-image` la pone.
 */
function imagenFinal(reglasDelSelect: Regla[]): string | null {
  let imagen: string | null = null

  for (const { cuerpo } of reglasDelSelect) {
    if (/(^|;|\s)background\s*:/.test(cuerpo)) imagen = null
    const declarada = /background-image\s*:\s*([^;]+)/.exec(cuerpo)
    if (declarada) imagen = declarada[1].trim()
  }

  return imagen
}

describe('la flecha de los `select`', () => {
  const claro = reglasDelTema('')
  const oscuro = [...claro, ...reglasDelTema("[data-theme='dark'] ")]

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

  it.each([
    ['claro', claro],
    ['oscuro', oscuro],
  ])('deja una flecha puesta en el tema %s', (tema, reglasDelTema) => {
    expect(
      imagenFinal(reglasDelTema),
      `en el tema ${tema} no queda ninguna \`background-image\` sobre \`.select\`. ` +
        'Con `appearance: none` puesto, eso son desplegables sin ningún indicador. ' +
        'Suele pasar por escribir `background` en forma corta, que reinicia la imagen: ' +
        'la flecha hay que volver a declararla después.',
    ).not.toBeNull()
  })

  it('separa la flecha del borde, que es lo que se venía a arreglar', () => {
    const posicion = /background-position\s*:\s*([^;]+)/.exec(
      claro.map(({ cuerpo }) => cuerpo).join('\n'),
    )

    expect(posicion, '`.select` no coloca su flecha con `background-position`').not.toBeNull()

    // `right var(--space-4)` es el mismo margen que el texto lleva al otro lado. Un
    // `right 0` o un `right` a secas la devuelven al filo, que es de donde venimos.
    expect(
      posicion![1],
      'la flecha vuelve a estar en el borde: `background-position` no la separa',
    ).toMatch(/right\s+var\(--space-4\)/)
  })
})
