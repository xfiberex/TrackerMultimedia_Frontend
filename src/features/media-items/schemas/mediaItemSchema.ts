import { z } from 'zod'
import { mensaje } from '@/shared/i18n/mensajeZod'
import type { es } from '@/shared/i18n/es'

/** Clave del diccionario dentro de la sección `medios`. */
type ClaveMedios = `medios.${keyof typeof es.medios}`

export const mediaTypes = ['Anime', 'Manga', 'Donghua', 'Manhwa', 'Manhua'] as const
export const contentKinds = [
  'Series',
  'Movie',
  'Book',
  'Comic',
  'Game',
  'Podcast',
  'Video',
  'Album',
  'Other',
] as const
export const mediaTrackingStatuses = [
  'Planned',
  'InProgress',
  'Completed',
  'OnHold',
  'Dropped',
] as const
export const mediaItemSourceTypes = ['Manual', 'Jikan', 'AniList', 'MangaDex'] as const
export const externalMediaKinds = ['Anime', 'Manga'] as const
export const progressUnits = [
  'Episodes',
  'Chapters',
  'Volumes',
  'Pages',
  'Hours',
  'Seasons',
  'Tracks',
  'Items',
  'None',
] as const
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
  name: z.string().min(1, mensaje('validacion.nombreRequerido')),
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
  formatId: z.string().uuid().nullable().optional(),
  formatName: z.string().nullable().optional(),
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
  userFormatId?: string | null
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

/**
 * **Estos dos mapas no se traducen y no deben traducirse.**
 *
 * `Anime`, `Manga`, `Donghua`, `Manhwa` y `Manhua` son los nombres de sus medios en
 * cualquier idioma, y `Jikan`, `AniList` y `MangaDex` son nombres propios de servicios.
 * Meterlos en el diccionario solo crearía dos entradas idénticas en `es` y en `en` que
 * alguien acabaría «traduciendo» algún día.
 */
export const mediaTypeLabels: Record<MediaType, string> = {
  Anime: 'Anime',
  Manga: 'Manga',
  Donghua: 'Donghua',
  Manhwa: 'Manhwa',
  Manhua: 'Manhua',
}

export const mediaSourceLabels: Record<MediaItemSourceType, string> = {
  Manual: 'Manual',
  Jikan: 'Jikan',
  AniList: 'AniList',
  MangaDex: 'MangaDex',
}

/**
 * Los que sí se traducen guardan **la clave del diccionario**, no el texto (T4-03).
 *
 * Son constantes de módulo: si guardaran el resultado de `i18n.t`, se evaluaría al
 * importar y el idioma quedaría congelado en el de arranque. Guardando la clave, quien
 * pinta decide cuándo traducir —`t(contentKindLabelKeys[kind])`— y eso ocurre en cada
 * render, que es justo lo que hace falta para que el interruptor de idioma se note.
 *
 * Siguen siendo mapas y no funciones porque las listas desplegables recorren sus
 * entradas para construir las opciones.
 */
export const contentKindLabelKeys: Record<ContentKind, ClaveMedios> = {
  Series: 'medios.tipo_Series',
  Movie: 'medios.tipo_Movie',
  Book: 'medios.tipo_Book',
  Comic: 'medios.tipo_Comic',
  Game: 'medios.tipo_Game',
  Podcast: 'medios.tipo_Podcast',
  Video: 'medios.tipo_Video',
  Album: 'medios.tipo_Album',
  Other: 'medios.tipo_Other',
}

export const mediaTrackingStatusLabelKeys: Record<MediaTrackingStatus, ClaveMedios> = {
  Planned: 'medios.estado_Planned',
  InProgress: 'medios.estado_InProgress',
  Completed: 'medios.estado_Completed',
  OnHold: 'medios.estado_OnHold',
  Dropped: 'medios.estado_Dropped',
}

export const progressUnitLabelKeys: Record<ProgressUnit, ClaveMedios> = {
  Episodes: 'medios.unidad_Episodes',
  Chapters: 'medios.unidad_Chapters',
  Volumes: 'medios.unidad_Volumes',
  Pages: 'medios.unidad_Pages',
  Hours: 'medios.unidad_Hours',
  Seasons: 'medios.unidad_Seasons',
  Tracks: 'medios.unidad_Tracks',
  Items: 'medios.unidad_Items',
  None: 'medios.unidad_None',
}

export const progressUnitShortLabelKeys: Record<ProgressUnit, ClaveMedios> = {
  Episodes: 'medios.breve_Episodes',
  Chapters: 'medios.breve_Chapters',
  Volumes: 'medios.breve_Volumes',
  Pages: 'medios.breve_Pages',
  Hours: 'medios.breve_Hours',
  Seasons: 'medios.breve_Seasons',
  Tracks: 'medios.breve_Tracks',
  Items: 'medios.breve_Items',
  None: 'medios.breve_None',
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

export const mediaSortFieldLabelKeys: Record<MediaItemsSortField, ClaveMedios> = {
  CreatedAt: 'medios.orden_CreatedAt',
  PersonalScore: 'medios.orden_PersonalScore',
  ReleaseYear: 'medios.orden_ReleaseYear',
  Title: 'medios.orden_Title',
}

export const sortDirectionLabelKeys: Record<SortDirection, ClaveMedios> = {
  Asc: 'medios.sentido_Asc',
  Desc: 'medios.sentido_Desc',
}
