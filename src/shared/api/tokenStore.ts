/**
 * Almacén del access token en memoria del módulo.
 * Al estar fuera del árbol React, el interceptor de axios puede leerlo
 * sin depender del ciclo de vida de los componentes.
 *
 * ── POLÍTICA DE SEGURIDAD ──
 *
 * Access Token (JWT): NUNCA persistido, solo en memoria (volátil).
 * - Ventaja: un XSS no puede extraerlo de ningún almacenamiento, porque no está en ninguno.
 * - Desventaja: se pierde al recargar, y se recupera con una llamada a /auth/refresh.
 * - Ubicación: ámbito de módulo privado (_accessToken).
 *
 * Refresh Token (opaco): en una cookie `HttpOnly` que este código no puede leer (T4-01).
 * - Antes vivía en localStorage y era legible por cualquier JS del origen: un script
 *   inyectado se llevaba la sesión y podía renovarla durante siete días.
 * - Defensas actuales: `HttpOnly` (JavaScript no lo ve), `SameSite=Strict`, `Path` acotado
 *   a /api/auth, y la cabecera `X-TM-Client` que exigen /auth/refresh y /auth/logout, que
 *   es lo que impide que otro sitio construya esas peticiones.
 * - En el servidor sigue estando lo de antes: solo se guarda el hash SHA-256, el token rota
 *   en cada uso, y presentar uno ya rotado revoca todas las sesiones del usuario.
 *
 * ── LO QUE SIGUE SIN RESOLVERSE ──
 *
 * Un XSS con la página abierta sigue pudiendo usar la sesión: no puede robar la cookie,
 * pero sí provocar peticiones desde el propio origen, que es donde la cookie viaja. Lo que
 * se ha eliminado es la exfiltración —llevarse la credencial y usarla después, desde otro
 * sitio y durante días—, no el abuso en vivo. Contra eso lo que hay es la CSP.
 */

let _accessToken: string | null = null

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string | null): void => {
    _accessToken = token
  },
}
