import i18n from '@/shared/i18n'

export * from './download'

export function buildQueryString<T extends object>(params: T): string {
  const searchParams = new URLSearchParams()

  Object.entries(
    params as Record<string, string | number | Array<string | number> | undefined | null>,
  ).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry === undefined || entry === null || entry === '') {
          return
        }

        searchParams.append(key, String(entry))
      })
      return
    }

    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  return searchParams.toString()
}

/**
 * Formatea una fecha en el idioma elegido para la interfaz.
 *
 * Estaba clavado a `es-DO`. El primer arreglo de T4-03 lo dejó en `undefined`, que es
 * «lo que diga el navegador»: era lo correcto **mientras los textos seguían incrustados
 * en español**, porque entonces no había ningún idioma de interfaz que respetar.
 *
 * Ahora sí lo hay, y manda ese. Con `undefined`, elegir English dejaba una pantalla en
 * inglés con las fechas en «05 sept 2026»; la mezcla no la pidió nadie.
 */
export function formatDate(value?: string | null): string {
  if (!value) {
    return i18n.t('comun.sinFecha')
  }

  return new Intl.DateTimeFormat(i18n.language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatScore(value?: number | null): string {
  if (value === undefined || value === null) {
    return i18n.t('comun.sinPuntuacion')
  }

  return value.toFixed(1)
}

export function toNumberOrUndefined(value: string): number | undefined {
  if (value.trim().length === 0) {
    return undefined
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

export function toPositiveInt(value: string | null, fallback: number): number {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback
  }

  return parsedValue
}

export function extractApiError(err: unknown, fallback: string): string {
  if (typeof err !== 'object' || err === null || !('response' in err)) {
    return fallback
  }

  const response = (err as { response?: { data?: unknown } }).response
  const data = response?.data

  if (typeof data === 'string') {
    return data
  }

  if (typeof data === 'object' && data !== null) {
    // `errors` va primero, y no es un detalle de orden. Un `ValidationProblemDetails` de
    // ASP.NET trae SIEMPRE `title: "One or more validation errors occurred."`, que es
    // genérico y está en inglés, junto al mensaje de verdad dentro de `errors`. Mirando
    // `title` antes, todos los errores de validación del backend llegaban al usuario como
    // esa frase, y ninguno de los mensajes escritos a mano en el servidor se veía nunca.
    // Descubierto al cerrar T2-29, cuyo aviso nuevo habría muerto aquí.
    if ('errors' in data && typeof data.errors === 'object' && data.errors !== null) {
      for (const fieldErrors of Object.values(data.errors as Record<string, unknown>)) {
        if (Array.isArray(fieldErrors) && typeof fieldErrors[0] === 'string') {
          return fieldErrors[0]
        }
      }
    }

    if ('detail' in data && typeof data.detail === 'string') {
      return data.detail
    }

    if ('title' in data && typeof data.title === 'string') {
      return data.title
    }
  }

  return fallback
}
