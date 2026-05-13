import type { ContentKind } from '@/features/media-items/schemas/mediaItemSchema'

export interface UserFormat {
  id: string
  name: string
  contentKind: ContentKind | null
  order: number
  createdAtUtc: string
}

export interface CreateFormatInput {
  name: string
  contentKind?: ContentKind | null
}

export type UpdateFormatInput = CreateFormatInput
