/**
 * Almacén del access token en memoria del módulo.
 * Al estar fuera del árbol React, el interceptor de axios puede leerlo
 * sin depender del ciclo de vida de los componentes.
 *
 * ── POLÍTICA DE SEGURIDAD ──
 *
 * Access Token (JWT): NUNCA persistido, solo en memoria (volátil).
 * - Ventaja: Seguro contra XSS — si un atacante inyecta JS, no puede extraer el token del storage.
 * - Desventaja: Se pierde al recargar (pero se recupera con el refresh token).
 * - Ubicación: Módulo scope privado (_accessToken).
 *
 * Refresh Token (opaco): Persistido en localStorage con SameSite=Strict.
 * - Ventaja: Permite recuperación de sesión tras recargas.
 * - Desventaja: Potencialmente vulnerable a XSS, pero la expiración corta y SameSite mitigan riesgo.
 * - Ubicación: localStorage (necesario para recuperar sesión).
 * - Consideración: Rotar refresh tokens en cada uso (lo hace el backend).
 *
 * ── MEJORA FUTURO (OPCIONAL) ──
 *
 * Para máxima seguridad en producción:
 * 1. Usar cookies httpOnly + SameSite=Strict (requiere backend que maneje cookies automáticamente).
 * 2. Omitir refresh token del cliente (usar Automatic Token Refresh con cookies, sin JS).
 * 3. CORS + Credentials incluidas en requests.
 */

let _accessToken: string | null = null

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string | null): void => {
    _accessToken = token
  },
}

