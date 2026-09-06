import { borrarCuentasDePrueba } from './db'

/**
 * Comprueba los dos requisitos que esta suite **no** levanta por su cuenta y falla con un
 * mensaje que dice qué hacer. Sin esto, un backend apagado sale como una cascada de
 * timeouts de Playwright: el síntoma no se parece en nada a la causa.
 */
export default async function globalSetup() {
  try {
    await comprobarYLimpiar()
  } catch (error) {
    // Playwright imprime un `AggregateError:` vacío si el fallo de `globalSetup` viene de
    // un error agregado —los de red y los de `pg` lo son—, y con eso no se puede
    // diagnosticar nada. Aquí se despliega antes de volver a lanzarlo.
    const e = error as { message?: string; errors?: unknown[] }
    const detalle = Array.isArray(e.errors)
      ? e.errors.map((x) => (x as Error)?.message ?? String(x)).join(' | ')
      : ''
    throw new Error(`Fallo preparando las pruebas E2E: ${e.message ?? error} ${detalle}`.trim(), {
      cause: error,
    })
  }
}

async function comprobarYLimpiar() {
  try {
    const respuesta = await fetch('http://localhost:5218/health/ready')
    if (!respuesta.ok) {
      throw new Error(
        `El backend responde en /health/ready con ${respuesta.status}. ` +
          'Suele ser que PostgreSQL no está arrancado: `Start-Service postgresql-x64-17` ' +
          'en una consola de administrador.',
      )
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('/health/ready')) throw error
    throw new Error(
      'No hay backend en http://localhost:5218. Arráncalo con `dotnet run` en el ' +
        'repositorio de backend antes de ejecutar las pruebas E2E.',
      { cause: error },
    )
  }

  // Restos de una ejecución cancelada. Se limpian al empezar y no al terminar, para poder
  // mirar el estado que dejó un fallo.
  const borradas = await borrarCuentasDePrueba()
  if (borradas > 0) {
    console.log(`Limpiadas ${borradas} cuentas de una ejecución anterior.`)
  }
}
