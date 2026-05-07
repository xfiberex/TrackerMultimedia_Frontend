export function buildQueryString<T extends object>(
  params: T,
): string {
  const searchParams = new URLSearchParams()

  Object.entries(params as Record<string, string | number | Array<string | number> | undefined | null>).forEach(([key, value]) => {
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

export function formatDate(value?: string | null): string {
  if (!value) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatScore(value?: number | null): string {
  if (value === undefined || value === null) {
    return 'Sin puntuación'
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