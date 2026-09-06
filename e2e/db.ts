import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'

/**
 * Acceso directo a la base de datos de desarrollo, **solo para preparar y limpiar**.
 *
 * Hace falta por una razón concreta: el registro exige confirmar el correo (T2-10), y el
 * correo sale hacia un buzón de Mailtrap que estas pruebas no pueden leer. Confirmar la
 * cuenta aquí es la alternativa honesta a desactivar la comprobación solo para los tests,
 * que dejaría sin cubrir justo la regla que más importa.
 *
 * **Nunca se usa para comprobar nada.** Lo que la prueba afirma se afirma contra la
 * interfaz o contra la API; si una aserción mira la base, deja de ser end-to-end.
 */

/**
 * La cadena sale de los mismos user-secrets que usa la aplicación, para no tener otra
 * copia de la contraseña de PostgreSQL en el repositorio. Si algún día se separa la base
 * de las pruebas E2E, `TRACKERMULTIMEDIA_E2E_POSTGRES` tiene prioridad.
 */
function connectionString(): string {
  const desdeElEntorno = process.env.TRACKERMULTIMEDIA_E2E_POSTGRES
  if (desdeElEntorno) return desdeElEntorno

  // El identificador sale del `.csproj` del backend, **no** se recorre la carpeta entera
  // de user-secrets quedándose con el primero que encaje. En este equipo hay tres
  // carpetas de secretos y una de ellas, de otro proyecto, apunta a un PostgreSQL en el
  // 5434 que ni siquiera está arrancado: la búsqueda por tanteo daba con esa.
  // `import.meta.dirname` y no `__dirname`: el paquete es ESM (`"type": "module"`) y ahí
  // `__dirname` no existe. Es el mismo aviso que Vite da sobre su propia configuración.
  const csproj = join(
    import.meta.dirname,
    '..',
    '..',
    'TrackerMultimedia_Backend',
    'TrackerMultimedia_Backend.csproj',
  )
  if (!existsSync(csproj)) {
    throw new Error(
      `No se encontró el .csproj del backend en ${csproj}. Las pruebas E2E sacan de ahí el ` +
        'identificador de user-secrets; si los repositorios se movieron, actualiza esta ruta ' +
        'o define TRACKERMULTIMEDIA_E2E_POSTGRES.',
    )
  }

  const id = readFileSync(csproj, 'utf8').match(/<UserSecretsId>([^<]+)<\/UserSecretsId>/)?.[1]
  if (!id) throw new Error('El .csproj del backend no declara UserSecretsId.')

  const archivo = join(process.env.APPDATA ?? '', 'Microsoft', 'UserSecrets', id, 'secrets.json')
  if (!existsSync(archivo)) {
    throw new Error(
      `No hay secretos para el backend en ${archivo}. Al cambiar de equipo hay que volver a ` +
        'ponerlos a mano: ver la sección «Secretos» de docs/WORKFLOW.md.',
    )
  }

  // La marca de orden de bytes se detecta por su código y no con un literal: es un
  // carácter invisible en el editor, y ESLint lo rechaza precisamente por eso.
  const bruto = readFileSync(archivo, 'utf8')
  const sinMarca = bruto.charCodeAt(0) === 0xfeff ? bruto.slice(1) : bruto
  const secretos = JSON.parse(sinMarca)
  for (const [clave, valor] of Object.entries(secretos)) {
    if (clave.endsWith('DefaultConnection') && typeof valor === 'string') return valor
  }

  throw new Error(`No se encontró ConnectionStrings:DefaultConnection en ${archivo}.`)
}

async function conectar(): Promise<Client> {
  const cs = connectionString()
  const kv = Object.fromEntries(
    [...cs.matchAll(/(\w+)\s*=\s*([^;]+)/g)].map((m) => [m[1].toLowerCase(), m[2].trim()]),
  )
  const client = new Client({
    host: kv.host,
    port: Number(kv.port ?? 5432),
    user: kv.username ?? kv.userid,
    password: kv.password,
    database: kv.database,
  })
  await client.connect()
  return client
}

/** Marca el correo como confirmado, que es lo que el buzón de Mailtrap no nos deja hacer. */
export async function confirmarCorreo(email: string): Promise<void> {
  const client = await conectar()
  try {
    const r = await client.query(
      'UPDATE "AspNetUsers" SET "EmailConfirmed" = true WHERE "NormalizedEmail" = $1',
      [email.toUpperCase()],
    )
    if (r.rowCount === 0) {
      throw new Error(
        `No existe ninguna cuenta con el correo ${email}: el registro no llegó a crearla.`,
      )
    }
  } finally {
    await client.end()
  }
}

/**
 * Borra las cuentas que crean estas pruebas. Se reconocen por el sufijo del correo, y se
 * borran **solo esas**: la base de desarrollo tiene cuentas reales y no se tocan.
 */
export async function borrarCuentasDePrueba(): Promise<number> {
  const client = await conectar()
  try {
    const r = await client.query(
      `DELETE FROM "AspNetUsers" WHERE "NormalizedEmail" LIKE '%@E2E.TEST'`,
    )
    return r.rowCount ?? 0
  } finally {
    await client.end()
  }
}
