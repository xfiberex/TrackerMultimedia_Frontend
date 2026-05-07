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
