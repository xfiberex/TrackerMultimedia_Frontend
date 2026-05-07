import api from '@/shared/api/axios'
import { buildQueryString } from '@/shared/utils'
import type { DiscoverProvider, SearchMediaItem, SearchMediaItemsFilters } from '@/features/search/schemas/searchSchema'

export const SearchApi = {
  getProviders: async (signal?: AbortSignal): Promise<DiscoverProvider[]> => {
    const { data } = await api.get<DiscoverProvider[]>('/discover/providers', { signal })
    return data
  },

  search: async (
    filters: SearchMediaItemsFilters,
    signal?: AbortSignal,
  ): Promise<SearchMediaItem[]> => {
    const queryString = buildQueryString(filters)
    const { data } = await api.get<SearchMediaItem[]>(`/discover/search?${queryString}`, { signal })
    return data
  },
}