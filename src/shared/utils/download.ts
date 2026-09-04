/**
 * Ayudantes de descarga compartidos por la exportación de biblioteca y la de datos
 * personales. Estaban duplicados —el nombre de archivo en `MediaItemsAPI` y el anclaje
 * en `LibraryView`— y la segunda exportación necesitaba exactamente los mismos dos.
 */

/**
 * Saca el nombre de archivo de la cabecera `Content-Disposition`. Se mira primero
 * `filename*`, que es la variante que lleva la codificación declarada: con `filename`
 * a secas, un nombre con acentos llega mal a los navegadores.
 */
export function resolveDownloadFileName(
  contentDisposition: string | undefined,
  fallback: string,
): string {
  if (!contentDisposition) {
    return fallback
  }

  const utf8FileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8FileNameMatch?.[1]) {
    return decodeURIComponent(utf8FileNameMatch[1])
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return fileNameMatch?.[1] ?? fallback
}

/**
 * Descarga un blob creando un anclaje temporal. La URL se libera siempre: sin
 * `revokeObjectURL` el blob se queda en memoria hasta que se recarga la página, y una
 * exportación de biblioteca no es pequeña.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}
