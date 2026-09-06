import { test, expect } from '@playwright/test'

/**
 * T4-04 — Los flujos OAuth, hasta donde se puede llegar sin hablar con Google.
 *
 * **Lo que estas pruebas no hacen, y por qué:** completar el flujo exigiría autenticarse
 * de verdad contra Google o GitHub, con una cuenta real y su segundo factor. Eso no es
 * automatizable ni conviene: la prueba dependería de un tercero y de unas credenciales
 * guardadas en algún sitio.
 *
 * Lo que sí se comprueba es lo que **es nuestro**: que la petición que se manda al
 * proveedor lleva lo que debe llevar —el `state` anti-CSRF y el `code_challenge` de PKCE
 * (T4-02)—, y que la vuelta con un `state` inválido acaba donde debe. Eso cubre los dos
 * extremos del flujo, que son los que puede romper un cambio nuestro.
 */

test('el inicio del flujo de Google lleva state y el reto de PKCE', async ({ request }) => {
  const respuesta = await request.get('http://localhost:5218/api/auth/google/init', {
    headers: { 'X-TM-Client': 'web' },
  })
  expect(respuesta.status()).toBe(200)

  const { authorizationUrl } = await respuesta.json()
  const url = new URL(authorizationUrl)

  expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
  expect(url.searchParams.get('response_type')).toBe('code')

  // El `state` es lo que ata la vuelta con la ida; sin él, cualquiera podría inyectar un
  // callback (T2-07).
  expect(url.searchParams.get('state')).toBeTruthy()

  // PKCE (T4-02). Solo S256: `plain` manda el verificador en claro y no protege de nada.
  expect(url.searchParams.get('code_challenge_method')).toBe('S256')
  const reto = url.searchParams.get('code_challenge')
  expect(reto).toBeTruthy()

  // El reto es un SHA-256 en Base64 URL-safe sin relleno: 43 caracteres del juego que
  // permite el RFC. Si aquí apareciera el verificador en claro, PKCE no serviría.
  expect(reto).toMatch(/^[A-Za-z0-9\-_]{43}$/)
})

test('dos inicios seguidos no repiten el state ni el reto', async ({ request }) => {
  const leer = async () => {
    const r = await request.get('http://localhost:5218/api/auth/google/init', {
      headers: { 'X-TM-Client': 'web' },
    })
    const { authorizationUrl } = await r.json()
    const u = new URL(authorizationUrl)
    return { state: u.searchParams.get('state'), reto: u.searchParams.get('code_challenge') }
  }

  const primero = await leer()
  const segundo = await leer()

  // Reutilizar cualquiera de los dos convertiría el flujo de vinculación en reutilizable,
  // que es justo lo que cerró T2-07.
  expect(primero.state).not.toBe(segundo.state)
  expect(primero.reto).not.toBe(segundo.reto)
})

test('un callback con state inválido vuelve al login con aviso, no con un 500', async ({
  page,
}) => {
  await page.goto(
    'http://localhost:5218/api/auth/google/callback?code=inventado&state=no-existe-este-state',
  )

  // Lo que importa es que el usuario acabe en una pantalla suya y con una explicación.
  // Antes de T2-06 y T2-11 esto era un 500 con el mensaje de la excepción a la vista.
  await expect(page).toHaveURL(/localhost:5173\/login/)
  await expect(page.getByRole('alert')).toBeVisible()
})

test('un proveedor que no existe no abre ningún flujo', async ({ request }) => {
  const respuesta = await request.get('http://localhost:5218/api/auth/discord/init', {
    headers: { 'X-TM-Client': 'web' },
  })

  expect(respuesta.status()).toBe(400)
})
