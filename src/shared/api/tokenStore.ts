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
 * Refresh Token (opaco): Persistido en localStorage, legible por cualquier JS del origen.
 * - Ventaja: Permite recuperación de sesión tras recargas.
 * - Desventaja: expuesto a XSS. Un script inyectado puede leerlo y usarlo hasta que caduque.
 * - Ubicación: localStorage (necesario para recuperar sesión).
 * - Mitigaciones REALES hoy: el servidor guarda solo el hash SHA-256, rota el token en cada
 *   uso y, si alguien presenta uno ya rotado, revoca todas las sesiones del usuario.
 * - NO hay mitigación de cookie: `SameSite` es un atributo de cookie y no existe en
 *   localStorage. Una versión anterior de este comentario lo afirmaba; era falso.
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

