import type { TFunction } from 'i18next'
import type {
  ExternalMediaKind,
  MediaItemSourceType,
  MediaType,
} from '@/features/media-items/schemas/mediaItemSchema'

export const mediaSearchTypes = ['All', 'Anime', 'Manga', 'Donghua', 'Manhwa', 'Manhua'] as const

export type MediaSearchType = (typeof mediaSearchTypes)[number]

export interface SearchMediaItemsFilters {
  query: string
  type?: MediaSearchType
  limit?: number
  providers?: string[]
}

export interface DiscoverProvider {
  key: string
  displayName: string
  sourceType: MediaItemSourceType
  supportedTypes: MediaSearchType[]
}

export interface SearchMediaItem {
  externalId: number
  title: string
  alternativeTitle: string | null
  suggestedType: MediaType
  sourceType: MediaItemSourceType
  externalMediaKind: ExternalMediaKind
  externalStatusLabel: string | null
  externalScore: number | null
  coverImageUrl: string | null
  referenceUrl: string | null
  releaseYear: number | null
}

/**
 * De los seis tipos de búsqueda **solo `All` es una palabra**: los otros cinco son los
 * nombres de sus medios y se escriben igual en cualquier idioma. Por eso esto es una
 * función con un caso especial y no un mapa entero en el diccionario, que habría
 * duplicado cinco entradas idénticas en `es` y en `en`.
 */
export function etiquetaTipoBusqueda(tipo: MediaSearchType, t: TFunction): string {
  return tipo === 'All' ? t('filtros.todos') : tipo
}
