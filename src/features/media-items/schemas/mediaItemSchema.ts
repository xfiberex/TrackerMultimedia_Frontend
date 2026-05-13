import { z } from 'zod'

export const mediaTypes = ['Anime', 'Manga', 'Donghua', 'Manhwa', 'Manhua'] as const
export const contentKinds = ['Series', 'Movie', 'Book', 'Comic', 'Game', 'Podcast', 'Video', 'Album', 'Other'] as const
export const mediaTrackingStatuses = ['Planned', 'InProgress', 'Completed', 'OnHold', 'Dropped'] as const
export const mediaItemSourceTypes = ['Manual', 'Jikan', 'AniList', 'MangaDex'] as const
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

// ── Validadores Zod ─────────────────────────────────────────────────────────

const mediaTypeSchema = z.enum(mediaTypes)
const contentKindSchema = z.enum(contentKinds)
const statusSchema = z.enum(mediaTrackingStatuses)
const sourceTypeSchema = z.enum(mediaItemSourceTypes)
const progressUnitSchema = z.enum(progressUnits)
const sortFieldSchema = z.enum(mediaItemsSortFields)
const sortDirSchema = z.enum(sortDirections)

export const mediaItemCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nombre requerido'),
  color: z.string().nullable(),
})

export const mediaItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  alternativeTitle: z.string().nullable(),
  type: mediaTypeSchema.nullable(),
  description: z.string().nullable(),
  contentKind: contentKindSchema,
  status: statusSchema,
  sourceType: sourceTypeSchema,
  externalId: z.number().nullable(),
  externalMediaKind: z.enum(externalMediaKinds).nullable(),
  externalStatusLabel: z.string().nullable(),
  externalScore: z.number().min(0).max(10).nullable(),
  coverImageUrl: z.string().url().nullable(),
  referenceUrl: z.string().url().nullable(),
  releaseYear: z.number().int().positive().nullable(),
  progressUnit: progressUnitSchema,
  progressCount: z.number().int().min(0),
  progressCurrent: z.number().int().min(0),
  progressTotal: z.number().int().positive().nullable(),
  currentSeason: z.number().int().min(0),
  personalScore: z.number().min(0).max(10).nullable(),
  notes: z.string().nullable(),
  categories: z.array(mediaItemCategorySchema).optional(),
  startedAtUtc: z.string().datetime().nullable(),
  completedAtUtc: z.string().datetime().nullable(),
  createdAtUtc: z.string().datetime(),
  updatedAtUtc: z.string().datetime(),
})

export const pagedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalCount: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })

export const mediaItemsFiltersSchema = z.object({
  search: z.string().optional(),
  type: mediaTypeSchema.optional(),
  categoryIds: z.array(z.string()).optional(),
  status: statusSchema.optional(),
  sourceType: sourceTypeSchema.optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  minPersonalScore: z.number().min(0).max(10).optional(),
  maxPersonalScore: z.number().min(0).max(10).optional(),
  sortBy: sortFieldSchema.optional(),
  sortDirection: sortDirSchema.optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
})

// ── Tipos ────────────────────────────────────────────────────────────────────

export type MediaItemCategory = z.infer<typeof mediaItemCategorySchema>
export type MediaItem = z.infer<typeof mediaItemSchema>
export type PagedResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}
export type MediaItemsFilters = z.infer<typeof mediaItemsFiltersSchema>

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

export type UpdateMediaItemInput = CreateMediaItemInput

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
  AniList: 'AniList',
  MangaDex: 'MangaDex',
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