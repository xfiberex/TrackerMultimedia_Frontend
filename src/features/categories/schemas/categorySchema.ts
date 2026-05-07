import type { MediaItemCategory } from '@/features/media-items/schemas/mediaItemSchema'

export interface Category extends MediaItemCategory {
  createdAtUtc: string
}

export interface CreateCategoryInput {
  name: string
  color?: string | null
}

export interface UpdateCategoryInput extends CreateCategoryInput {}