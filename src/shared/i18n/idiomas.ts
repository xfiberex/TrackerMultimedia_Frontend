/**
 * Los dos idiomas del proyecto, decididos por el propietario el 2026-09-05 (T4-03).
 *
 * El español es el de partida y el de reserva: los textos originales de la aplicación
 * están escritos en español, y las 189 pruebas unitarias y las 13 end-to-end localizan
 * los elementos **por su texto en español**. Si algún día deja de ser el idioma de
 * reserva, esas pruebas dejan de encontrar nada.
 */
export const IDIOMAS = ['es', 'en'] as const

export type Idioma = (typeof IDIOMAS)[number]

export const IDIOMA_POR_DEFECTO: Idioma = 'es'

/** Cómo se llama cada idioma **en ese idioma**, que es como se ponen en un selector. */
export const NOMBRE_DE_IDIOMA: Record<Idioma, string> = {
  es: 'Español',
  en: 'English',
}

export const IDIOMA_STORAGE_KEY = 'tm-idioma'

export function esIdiomaValido(valor: unknown): valor is Idioma {
  return typeof valor === 'string' && (IDIOMAS as readonly string[]).includes(valor)
}
