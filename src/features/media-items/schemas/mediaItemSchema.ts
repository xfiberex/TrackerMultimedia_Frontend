export const mediaTypes = ['Anime', 'Manga', 'Donghua', 'Manhwa', 'Manhua'] as const
export const contentKinds = ['Series', 'Movie', 'Book', 'Comic', 'Game', 'Podcast', 'Video', 'Album', 'Other'] as const
export const mediaTrackingStatuses = ['Planned', 'InProgress', 'Completed', 'OnHold', 'Dropped'] as const
export const mediaItemSourceTypes = ['Manual', 'Jikan'] as const
export const externalMediaKinds = ['Anime', 'Manga'] as const
export const progressUnits = ['Episodes', 'Chapters', 'Volumes', 'Pages', 'Hours', 'Seasons', 'Tracks', 'Items', 'None'] as const
export const mediaItemsSortFields = ['CreatedAt', 'PersonalScore', 'ReleaseYear', 'Title'] as const
export const sortDirections = ['Asc', 'Desc'] as const
export const libraryTransferFormats = ['Json', 'Csv'] as const

export type MediaType = (typeof mediaTypes)[number]
export type ContentKind = (typeof contentKinds)[number]
export type MediaTrackingStatus = (typeof mediaTrackingStatuses)[number]
export type MediaItemSourceType = (typeof mediaItemSourceTypes)[number]
export type ExternalMediaKind = (typeof externalMediaKinds)[number]
export type ProgressUnit = (typeof progressUnits)[number]
export type MediaItemsSortField = (typeof mediaItemsSortFields)[number]
export type SortDirection = (typeof sortDirections)[number]
export type LibraryTransferFormat = (typeof libraryTransferFormats)[number]

export interface MediaItemCategory {
  id: string
  name: string
  color: string | null
}

export interface MediaItem {
  id: string
  title: string
  alternativeTitle: string | null
  type: MediaType | null
  description: string | null
  contentKind: ContentKind
  status: MediaTrackingStatus
  sourceType: MediaItemSourceType
  externalId: number | null
  externalMediaKind: ExternalMediaKind | null
  externalStatusLabel: string | null
  externalScore: number | null
  coverImageUrl: string | null
  referenceUrl: string | null
  releaseYear: number | null
  progressUnit: ProgressUnit
  progressCount: number
  progressCurrent: number
  progressTotal: number | null
  currentSeason: number
  personalScore: number | null
  notes: string | null
  categories?: MediaItemCategory[]
  startedAtUtc: string | null
  completedAtUtc: string | null
  createdAtUtc: string
  updatedAtUtc: string
}

export interface PagedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface MediaItemsFilters {
  search?: string
  type?: MediaType
  categoryIds?: string[]
  status?: MediaTrackingStatus
  sourceType?: MediaItemSourceType
  createdFrom?: string
  createdTo?: string
  minPersonalScore?: number
  maxPersonalScore?: number
  sortBy?: MediaItemsSortField
  sortDirection?: SortDirection
  page?: number
  pageSize?: number
}

export interface ContentKindStat {
  contentKind: ContentKind
  count: number
}

export interface MediaSourceStat {
  sourceType: MediaItemSourceType
  count: number
}

export interface CategoryStat {
  categoryId: string
  categoryName: string
  color: string | null
  count: number
}

export interface ContentKindAverageScoreStat {
  contentKind: ContentKind
  averagePersonalScore: number
  scoredItemsCount: number
}

export interface MediaItemsStatsResponse {
  totalCount: number
  plannedCount: number
  inProgressCount: number
  completedCount: number
  onHoldCount: number
  droppedCount: number
  startedThisMonthCount: number
  completedThisMonthCount: number
  backlogWithoutStartCount: number
  averagePersonalScore: number | null
  scoredItemsCount: number
  contentKindBreakdown: ContentKindStat[]
  sourceBreakdown: MediaSourceStat[]
  categoryBreakdown: CategoryStat[]
  averageScoreByContentKind: ContentKindAverageScoreStat[]
}

export interface LibraryImportResponse {
  format: LibraryTransferFormat
  itemsProcessed: number
  itemsCreated: number
  itemsUpdated: number
  categoriesCreated: number
}

export interface CreateMediaItemInput {
  title: string
  alternativeTitle?: string | null
  type?: MediaType | null
  description?: string | null
  contentKind: ContentKind
  categoryIds?: string[]
  status: MediaTrackingStatus
  sourceType: MediaItemSourceType
  externalId?: number | null
  externalMediaKind?: ExternalMediaKind | null
  externalStatusLabel?: string | null
  externalScore?: number | null
  coverImageUrl?: string | null
  referenceUrl?: string | null
  releaseYear?: number | null
  progressUnit: ProgressUnit
  progressCount?: number
  progressCurrent: number
  progressTotal?: number | null
  currentSeason?: number
  personalScore?: number | null
  notes?: string | null
  startedAtUtc?: string | null
  completedAtUtc?: string | null
}

export interface UpdateMediaItemInput extends CreateMediaItemInput {}

export const mediaTypeToContentKind: Record<MediaType, ContentKind> = {
  Anime: 'Series',
  Manga: 'Comic',
  Donghua: 'Series',
  Manhwa: 'Comic',
  Manhua: 'Comic',
}

export const mediaTypeToProgressUnit: Record<MediaType, ProgressUnit> = {
  Anime: 'Episodes',
  Manga: 'Chapters',
  Donghua: 'Episodes',
  Manhwa: 'Chapters',
  Manhua: 'Chapters',
}

export const mediaTypeLabels: Record<MediaType, string> = {
  Anime: 'Anime',
  Manga: 'Manga',
  Donghua: 'Donghua',
  Manhwa: 'Manhwa',
  Manhua: 'Manhua',
}

export const contentKindLabels: Record<ContentKind, string> = {
  Series: 'Serie',
  Movie: 'Película',
  Book: 'Libro',
  Comic: 'Cómic',
  Game: 'Juego',
  Podcast: 'Podcast',
  Video: 'Video',
  Album: 'Álbum',
  Other: 'Otro',
}

export const mediaTrackingStatusLabels: Record<MediaTrackingStatus, string> = {
  Planned: 'Planeado',
  InProgress: 'En progreso',
  Completed: 'Completado',
  OnHold: 'En pausa',
  Dropped: 'Abandonado',
}

export const mediaSourceLabels: Record<MediaItemSourceType, string> = {
  Manual: 'Manual',
  Jikan: 'Jikan',
}

export const progressUnitLabels: Record<ProgressUnit, string> = {
  Episodes: 'Episodios',
  Chapters: 'Capítulos',
  Volumes: 'Volúmenes',
  Pages: 'Páginas',
  Hours: 'Horas',
  Seasons: 'Temporadas',
  Tracks: 'Pistas',
  Items: 'Elementos',
  None: 'Sin unidad',
}

export const defaultProgressUnitByContentKind: Record<ContentKind, ProgressUnit> = {
  Series: 'Episodes',
  Movie: 'None',
  Book: 'Pages',
  Comic: 'Chapters',
  Game: 'Hours',
  Podcast: 'Episodes',
  Video: 'Items',
  Album: 'Tracks',
  Other: 'Items',
}

export const mediaSortFieldLabels: Record<MediaItemsSortField, string> = {
  CreatedAt: 'Fecha agregado',
  PersonalScore: 'Puntuación personal',
  ReleaseYear: 'Año de estreno',
  Title: 'Título',
}

export const sortDirectionLabels: Record<SortDirection, string> = {
  Asc: 'Ascendente',
  Desc: 'Descendente',
}