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

export const mediaSearchTypeLabels: Record<MediaSearchType, string> = {
  All: 'Todos',
  Anime: 'Anime',
  Manga: 'Manga',
  Donghua: 'Donghua',
  Manhwa: 'Manhwa',
  Manhua: 'Manhua',
}
