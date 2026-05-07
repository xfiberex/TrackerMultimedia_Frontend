/**
 * Almacén del access token en memoria del módulo.
 * Al estar fuera del árbol React, el interceptor de axios puede leerlo
 * sin depender del ciclo de vida de los componentes.
 *
 * El access token NUNCA se persiste en localStorage — solo en memoria.
 * El refresh token sí se persiste en localStorage para recuperar la sesión.
 */

let _accessToken: string | null = null

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string | null): void => {
    _accessToken = token
  },
}
