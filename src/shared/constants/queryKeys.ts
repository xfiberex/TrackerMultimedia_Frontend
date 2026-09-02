import type { MediaItemsFilters } from '@/features/media-items/schemas/mediaItemSchema'
import type { Category } from '@/features/categories/schemas/categorySchema'
import type { UserFormat } from '@/features/catalog/schemas/formatsSchema'
import type { SearchMediaItemsFilters } from '@/features/search/schemas/searchSchema'

export const queryKeys = {
  categories: {
    root: ['categories'] as const,
    list: () => ['categories', 'list'] as const,
    detail: (categoryId: Category['id']) => ['categories', 'detail', categoryId] as const,
  },
  formats: {
    root: ['formats'] as const,
    list: () => ['formats', 'list'] as const,
    detail: (formatId: UserFormat['id']) => ['formats', 'detail', formatId] as const,
  },
  mediaItems: {
    root: ['media-items'] as const,
    list: (filters: MediaItemsFilters) => ['media-items', 'list', filters] as const,
  },
  search: {
    root: ['search'] as const,
    providers: () => ['search', 'providers'] as const,
    results: (filters: SearchMediaItemsFilters) => ['search', 'results', filters] as const,
  },
}