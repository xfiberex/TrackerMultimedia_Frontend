import { globSync, readFileSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * T5-10 — Todo campo de formulario lleva su clase del sistema de diseño.
 *
 * El borde, el radio, el relleno y la altura mínima de los campos los pone la clase
 * `.input` / `.select`, no un selector de elemento. Un `<input>` sin `className` no
 * sale sin estilo: sale con el **estilo nativo del navegador**, que es un campo
 * distinto y reconocible en medio de una pantalla que usa el otro.
 *
 * Eso es exactamente lo que pasaba en «Borrar la cuenta»: era el único `<input>` de
 * `ProfileView` sin la clase, en el mismo bloque donde T5-09 ya había encontrado un
 * grupo de campo mal puesto. Dos defectos del mismo tipo en el mismo sitio, ninguno
 * detectable por las pruebas de comportamiento —el campo funciona perfectamente—, y
 * ambos vistos por el propietario a simple vista.
 *
 * De ahí esta prueba: revisa **todos** los campos del frontend, no el que ya se
 * arregló. Lo que no se puede automatizar es mirar la pantalla; lo que sí, es que no
 * quede ningún campo sin vestir.
 */

const raiz = resolve(__dirname, '..')

/**
 * Campos que se estilan desde su contenedor y por eso no llevan clase propia.
 * Cada entrada tiene que explicar **quién** los pinta; si no se puede explicar, es
 * un defecto y no una excepción.
 */
// Vacía desde el 2026-09-06. La única excepción que hubo era la casilla del
// interruptor de proveedor de «Descubrir», que se pintaba desde `.toggle-switch`;
// al retirarse esa pantalla no queda ni un campo del frontend sin la clase del
// sistema de diseño. Si vuelve a hacer falta una excepción, tiene que explicar
// **quién** pinta el campo: si no se puede explicar, es un defecto.
const EXCEPCIONES: { archivo: string; motivo: string }[] = []

const archivos = globSync('**/*.tsx', { cwd: raiz })
  .filter((ruta) => !ruta.includes('.test.'))
  // `globSync` devuelve las rutas con el separador del sistema; en Windows eso es la
  // contrabarra y las excepciones de arriba no coincidirían nunca.
  .map((ruta) => ({
    ruta: ruta.split(sep).join('/'),
    texto: readFileSync(resolve(raiz, ruta), 'utf8'),
  }))

/**
 * Cada etiqueta abierta de campo, con sus atributos.
 *
 * No se puede recortar con `[^>]*` hasta el primer `>`: dentro de la etiqueta hay
 * manejadores como `onChange={(e) => …}`, y el `>` de la flecha corta el atributo por
 * la mitad. Con eso, dos campos que **sí** tienen `className` salían denunciados. Hay
 * que recorrer contando llaves y cerrar la etiqueta en el `>` que está a nivel cero.
 */
function campos(texto: string) {
  const encontrados: { etiqueta: string; atributos: string; linea: number }[] = []

  // Los comentarios se blanquean conservando los saltos de línea, para que los números
  // de línea sigan siendo los del archivo. Hace falta: el comentario que explica esta
  // misma regla en `ProfileView` menciona `<input>` en prosa, y sin esto la prueba se
  // denunciaba a sí misma.
  const sinComentarios = texto.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (bloque) =>
    bloque.replace(/[^\n]/g, ' '),
  )

  for (const inicio of sinComentarios.matchAll(/<(input|select|textarea)(?=[\s/>])/g)) {
    let profundidad = 0
    let i = inicio.index + inicio[0].length

    while (i < sinComentarios.length) {
      const c = sinComentarios[i]
      if (c === '{') profundidad += 1
      else if (c === '}') profundidad -= 1
      else if (c === '>' && profundidad === 0) break
      i += 1
    }

    encontrados.push({
      etiqueta: inicio[1],
      atributos: sinComentarios.slice(inicio.index + inicio[0].length, i),
      linea: texto.slice(0, inicio.index).split('\n').length,
    })
  }

  return encontrados
}

describe('los campos de formulario', () => {
  it('encuentra campos que revisar', () => {
    expect(archivos.length, 'no se leyó ningún componente').toBeGreaterThan(10)
    expect(archivos.flatMap((a) => campos(a.texto)).length).toBeGreaterThan(30)
  })

  it('todos llevan la clase del sistema de diseño, salvo las excepciones declaradas', () => {
    const sinClase: string[] = []

    for (const { ruta, texto } of archivos) {
      const exento = EXCEPCIONES.some((e) => e.archivo === ruta)

      for (const campo of campos(texto)) {
        if (campo.atributos.includes('className=')) continue
        // Un campo oculto no tiene aspecto que arreglar. Los dos de `LibraryView` son
        // los selectores de archivo de la importación: se abren desde un botón y no se
        // pintan nunca.
        if (/(^|\s)hidden(\s|$)/.test(campo.atributos)) continue
        if (/type="hidden"/.test(campo.atributos)) continue
        if (exento) continue

        sinClase.push(`${ruta}:${campo.linea} <${campo.etiqueta}>`)
      }
    }

    expect(
      sinClase,
      'estos campos se pintarán con el estilo nativo del navegador. Añade `className="input"` ' +
        '(o `select`), o declara la excepción en EXCEPCIONES explicando quién los estila:\n' +
        sinClase.join('\n'),
    ).toEqual([])
  })

  it('no sobra ninguna excepción', () => {
    for (const excepcion of EXCEPCIONES) {
      const archivo = archivos.find((a) => a.ruta === excepcion.archivo)
      expect(archivo, `la excepción apunta a ${excepcion.archivo}, que ya no existe`).toBeDefined()

      const sinClase = campos(archivo!.texto).some((c) => !c.atributos.includes('className='))
      expect(
        sinClase,
        `${excepcion.archivo} ya no tiene campos sin clase: quita la excepción`,
      ).toBe(true)
    }
  })
})
