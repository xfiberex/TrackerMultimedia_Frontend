import { extractAuthError } from './authErrors'

describe('extractAuthError', () => {
  it('returns a network error message when there is no response payload', () => {
    expect(extractAuthError({}, 'Fallback message')).toBe(
      'Error de conexión. Verifica tu internet e intenta de nuevo.',
    )
  })

  it('returns the plain string response when available', () => {
    const error = {
      response: {
        data: 'Credenciales inválidas.',
      },
    }

    expect(extractAuthError(error, 'Fallback message')).toBe('Credenciales inválidas.')
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

    expect(extractAuthError(error, 'Fallback message')).toBe('El correo es obligatorio.')
  })

  it('falls back to detail and then title when there are no validation errors', () => {
    expect(
      extractAuthError({ response: { data: { detail: 'Detalle del error.' } } }, 'Fallback message'),
    ).toBe('Detalle del error.')

    expect(
      extractAuthError({ response: { data: { title: 'Título del error.' } } }, 'Fallback message'),
    ).toBe('Título del error.')
  })
})
