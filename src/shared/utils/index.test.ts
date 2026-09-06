import i18n from '@/shared/i18n'
import {
  buildQueryString,
  formatDate,
  formatScore,
  toNumberOrUndefined,
  toPositiveInt,
} from './index'

describe('shared utils', () => {
  it('buildQueryString omits empty values and serializes the rest', () => {
    expect(
      buildQueryString({
        search: 'naruto',
        categoryIds: ['cat-1', 'cat-2'],
        page: 2,
        empty: '',
        missing: undefined,
        nullable: null,
      }),
    ).toBe('search=naruto&categoryIds=cat-1&categoryIds=cat-2&page=2')
  })

  it('formatDate returns a fallback when there is no date', () => {
    expect(formatDate()).toBe('Sin fecha')
    expect(formatDate(null)).toBe('Sin fecha')
  })

  it('formatDate formats ISO dates for display', () => {
    const formatted = formatDate('2026-05-05T12:00:00.000Z')

    expect(formatted).toContain('2026')
  })

  /**
   * T4-03 — La fecha sigue al idioma elegido para la interfaz, no a uno fijo.
   *
   * Estaba clavada a `es-DO`. Comparar el texto formateado **no sirve como prueba** en
   * este equipo, porque su configuración regional es precisamente `es-DO` y el resultado
   * salía idéntico con el defecto y sin él. Lo que se comprueba es el argumento con el
   * que se construye el formateador.
   *
   * Ese argumento cambió al terminar T4-03: era `undefined` —«lo que diga el
   * navegador»—, que era lo correcto mientras no había idioma de interfaz que respetar.
   * Ahora lo hay, y una pantalla en inglés con las fechas en español es una mezcla que
   * no pidió nadie. Por eso la prueba cambia el idioma y comprueba que la fecha lo sigue.
   */
  it('formatDate sigue al idioma de la interfaz y no a uno fijo', async () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat')

    formatDate('2026-05-05T12:00:00.000Z')
    expect(spy.mock.calls[0][0]).toBe('es')

    await i18n.changeLanguage('en')
    formatDate('2026-05-05T12:00:00.000Z')
    expect(spy.mock.calls[1][0]).toBe('en')

    // El `afterEach` del setup lo devolvería igualmente; explícito aquí porque la
    // siguiente comprobación de este mismo archivo compara textos en español.
    await i18n.changeLanguage('es')
  })

  it('formatScore handles numbers and missing values', () => {
    expect(formatScore(8.25)).toBe('8.3')
    expect(formatScore(null)).toBe('Sin puntuación')
  })

  it('toNumberOrUndefined parses finite numbers only', () => {
    expect(toNumberOrUndefined('12')).toBe(12)
    expect(toNumberOrUndefined('')).toBeUndefined()
    expect(toNumberOrUndefined('abc')).toBeUndefined()
  })

  it('toPositiveInt falls back when the value is not a positive integer', () => {
    expect(toPositiveInt('3', 1)).toBe(3)
    expect(toPositiveInt('0', 7)).toBe(7)
    expect(toPositiveInt('2.5', 7)).toBe(7)
    expect(toPositiveInt(null, 7)).toBe(7)
  })
})
