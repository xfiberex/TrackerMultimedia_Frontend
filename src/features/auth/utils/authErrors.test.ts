import { extractApiError } from '@/shared/utils'

describe('extractApiError', () => {
  it('returns the fallback when there is no response payload', () => {
    expect(extractApiError({}, 'Fallback message')).toBe('Fallback message')
  })

  it('returns the plain string response when available', () => {
    const error = {
      response: {
        data: 'Credenciales inválidas.',
      },
    }

    expect(extractApiError(error, 'Fallback message')).toBe('Credenciales inválidas.')
  })

  it('returns the first validation error from problem details', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errors: {
            Email: ['El correo es obligatorio.'],
            Password: ['La contraseña es demasiado corta.'],
          },
        },
      },
    }

    expect(extractApiError(error, 'Fallback message')).toBe('El correo es obligatorio.')
  })

  it('falls back to detail and then title when there are no validation errors', () => {
    expect(
      extractApiError({ response: { data: { detail: 'Detalle del error.' } } }, 'Fallback message'),
    ).toBe('Detalle del error.')

    expect(
      extractApiError({ response: { data: { title: 'Título del error.' } } }, 'Fallback message'),
    ).toBe('Título del error.')
  })
})
