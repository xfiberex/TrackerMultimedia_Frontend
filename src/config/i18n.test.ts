import { globSync, readFileSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import i18n from '@/shared/i18n'
import { en } from '@/shared/i18n/en'
import { es } from '@/shared/i18n/es'
import { IDIOMAS } from '@/shared/i18n/idiomas'

/**
 * T4-03 — La capa de textos, vigilada por lo que TypeScript no puede ver.
 *
 * El tipado ya impide dos cosas por su cuenta: una clave que exista en español y no en
 * inglés, y una clave mal escrita en un `t(...)`. Lo que no ve el compilador es lo que
 * comprueban estas pruebas:
 *
 * - que las **interpolaciones** sobrevivan a la traducción. Si `es` dice
 *   «Escribe {{correo}} para continuar» y en `en` alguien escribe «Type to continue»,
 *   compila igual y la frase pierde el dato delante del usuario;
 * - que no vuelva a aparecer **texto incrustado** en un componente. Migrar 27 archivos
 *   una vez es fácil; que el número 28 nazca ya traducido, no;
 * - que cambiar de idioma **cambie de verdad** lo que se ve.
 */

// ── 1. Las interpolaciones ───────────────────────────────────────────────────

const marcadores = (texto: string) => [...texto.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort()

describe('el diccionario', () => {
  it('tiene los dos idiomas cargados', () => {
    expect(IDIOMAS).toEqual(['es', 'en'])
    expect(Object.keys(es).length).toBeGreaterThan(15)
  })

  it('conserva las mismas interpolaciones en los dos idiomas', () => {
    const rotas: string[] = []

    for (const [seccion, entradas] of Object.entries(es)) {
      for (const [clave, textoEs] of Object.entries(entradas as Record<string, string>)) {
        // El tipado ya garantiza que la clave exista en inglés; el `?? ''` está para que,
        // si alguna vez dejara de ser cierto, esta prueba lo cuente en vez de reventar
        // con un «Cannot read properties of undefined».
        const textoEn =
          (en as unknown as Record<string, Record<string, string>>)[seccion]?.[clave] ?? ''
        const esperados = marcadores(textoEs)
        const encontrados = marcadores(textoEn)

        if (esperados.join('|') !== encontrados.join('|')) {
          rotas.push(
            `${seccion}.${clave}: es usa [${esperados.join(', ')}] y en usa [${encontrados.join(', ')}]`,
          )
        }
      }
    }

    expect(rotas, `traducciones que pierden o inventan un dato:\n${rotas.join('\n')}`).toEqual([])
  })

  it('define las dos formas de plural en los dos idiomas', () => {
    // Una clave `_one` sin su `_other` —o al revés, o presente en un idioma y no en el
    // otro— hace que i18next devuelva la clave cruda en cuanto el número no encaje.
    const plurales = new Set<string>()

    for (const [seccion, entradas] of Object.entries(es)) {
      for (const clave of Object.keys(entradas as Record<string, string>)) {
        const base = clave.replace(/_(one|other)$/, '')
        if (base !== clave) plurales.add(`${seccion}.${base}`)
      }
    }

    expect(plurales.size, 'no se encontró ninguna clave con plural').toBeGreaterThan(3)

    for (const ruta of plurales) {
      const [seccion, base] = ruta.split('.')
      for (const idioma of [es, en] as const) {
        const entradas = (idioma as unknown as Record<string, Record<string, string>>)[seccion]
        expect(entradas[`${base}_one`], `falta ${ruta}_one`).toBeTruthy()
        expect(entradas[`${base}_other`], `falta ${ruta}_other`).toBeTruthy()
      }
    }
  })
})

// ── 2. Nada de texto incrustado ──────────────────────────────────────────────

const raiz = resolve(__dirname, '..')

const COMENTARIO = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g

/**
 * Literales que **no** son idioma y por eso no van al diccionario. Cada uno tiene que
 * poder explicarse; si no, es un texto sin traducir.
 */
const EXCEPCIONES: { literal: string; motivo: string }[] = [
  {
    literal: 'TrackerMultimedia',
    motivo: 'El nombre del producto. Una marca no se traduce.',
  },
  {
    literal: '#336699',
    motivo: 'Ejemplo de color hexadecimal en el campo del selector; no es una palabra.',
  },
]

const componentes = globSync('**/*.tsx', { cwd: raiz })
  .filter((ruta) => !ruta.includes('.test.'))
  .map((ruta) => ({
    ruta: ruta.split(sep).join('/'),
    texto: readFileSync(resolve(raiz, ruta), 'utf8').replace(COMENTARIO, (b) =>
      '\n'.repeat((b.match(/\n/g) ?? []).length),
    ),
  }))

describe('los textos de la interfaz', () => {
  it('encuentra componentes que revisar', () => {
    expect(componentes.length).toBeGreaterThan(15)
  })

  it('no deja ningún literal suelto en el JSX ni en los atributos de texto', () => {
    // Texto entre etiquetas —`>Hola<`, nunca `>{t('x')}<`— y los atributos que acaban
    // leyéndose o anunciándose. `label` y `message` entran porque son props de
    // componentes propios (`EmptyState`, `ConfirmDialog`) que sí se pintan.
    //
    // La búsqueda es sobre el archivo entero y **no línea a línea**: el JSX con formato
    // pone el texto en su propia línea, sin `>` ni `<` al lado, así que una expresión
    // que los exija en el mismo renglón solo encuentra las etiquetas cortas. Con la
    // versión por líneas esta prueba daba verde con «Cerrar sesión» incrustado a mano en
    // la cabecera, que es justo lo que tiene que cazar.
    // El `</` final es lo que separa un texto JSX de un genérico de TypeScript:
    // `useState<Categoria | null>(null)` también tiene un `>` seguido de texto, pero lo
    // que viene después nunca es una etiqueta de cierre.
    const textoSuelto = />\s*([A-Za-zÁÉÍÓÚÑáéíóúñ¿¡][^<>{}]*?)\s*<\//gs
    const atributos = /\b(aria-label|placeholder|title|ariaLabel|label|message)="([^"]+)"/g

    const sueltos: string[] = []

    for (const { ruta, texto } of componentes) {
      const linea = (indice: number) => texto.slice(0, indice).split('\n').length

      const anota = (valor: string, tipo: string, indice: number) => {
        const limpio = valor.trim()
        if (limpio.length === 0) return
        if (EXCEPCIONES.some((e) => e.literal === limpio)) return
        sueltos.push(`${ruta}:${linea(indice)} ${tipo} «${limpio}»`)
      }

      for (const m of texto.matchAll(textoSuelto)) anota(m[1], 'texto', m.index)
      for (const m of texto.matchAll(atributos)) anota(m[2], `atributo ${m[1]}`, m.index)
    }

    expect(
      sueltos,
      'estos textos no pasan por el diccionario y no se traducen. Muévelos a `es.ts` y ' +
        '`en.ts` y píntalos con `t(...)`, o declara la excepción en EXCEPCIONES:\n' +
        sueltos.join('\n'),
    ).toEqual([])
  })
})

// ── 3. Cambiar de idioma cambia lo que se ve ─────────────────────────────────

describe('el cambio de idioma', () => {
  it('cambia el texto sin recargar y deja el documento en el idioma correcto', async () => {
    expect(i18n.language).toBe('es')
    expect(i18n.t('nav.biblioteca')).toBe('Biblioteca')
    expect(document.documentElement.lang).toBe('es')

    await i18n.changeLanguage('en')

    expect(i18n.t('nav.biblioteca')).toBe('Library')
    // El atributo `lang` no es decorativo: de él dependen el corte de palabras y, sobre
    // todo, con qué pronunciación lee la página un lector de pantalla.
    expect(document.documentElement.lang).toBe('en')

    await i18n.changeLanguage('es')
  })

  it('interpola y pluraliza en los dos idiomas', () => {
    expect(i18n.t('biblioteca.registros', { count: 1 })).toBe('1 registro')
    expect(i18n.t('biblioteca.registros', { count: 5 })).toBe('5 registros')
    expect(i18n.t('vinculacion.vincularCon', { proveedor: 'Google' })).toBe('Vincular con Google')
  })
})
