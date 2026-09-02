import api from '@/shared/api/axios'
import { buildQueryString } from '@/shared/utils'
import type {
  CreateMediaItemInput,
  LibraryImportResponse,
  LibraryTransferFormat,
  MediaItem,
  MediaItemsFilters,
  PagedResponse,
  UpdateMediaItemInput,
} from '@/features/media-items/schemas/mediaItemSchema'

function resolveDownloadFileName(contentDisposition: string | undefined, fallback: string): string {
  if (!contentDisposition) {
    return fallback
  }

  const utf8FileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8FileNameMatch?.[1]) {
    return decodeURIComponent(utf8FileNameMatch[1])
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return fileNameMatch?.[1] ?? fallback
}

export const MediaItemsApi = {
  getAll: async (
    filters: MediaItemsFilters = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<MediaItem>> => {
    const queryString = buildQueryString(filters)
    const requestPath = queryString.length > 0 ? `/media-items?${queryString}` : '/media-items'
    const { data } = await api.get<PagedResponse<MediaItem>>(requestPath, { signal })
    return data
  },

  create: async (payload: CreateMediaItemInput): Promise<MediaItem> => {
    const { data } = await api.post<MediaItem>('/media-items', payload)
    return data
  },

  update: async (id: string, payload: UpdateMediaItemInput): Promise<MediaItem> => {
    const { data } = await api.put<MediaItem>(`/media-items/${id}`, payload)
    return data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/media-items/${id}`)
  },

  exportLibrary: async (format: LibraryTransferFormat): Promise<{ blob: Blob; fileName: string }> => {
    const response = await api.get<Blob>(`/media-items/export?format=${encodeURIComponent(format)}`, {
      responseType: 'blob',
    })

    return {
      blob: response.data,
      fileName: resolveDownloadFileName(
        response.headers['content-disposition'] as string | undefined,
        `tracker-library.${format === 'Json' ? 'json' : 'csv'}`,
      ),
    }
  },

  importLibrary: async (format: LibraryTransferFormat, file: File): Promise<LibraryImportResponse> => {
    const { data } = await api.postForm<LibraryImportResponse>(
      `/media-items/import?format=${encodeURIComponent(format)}`,
      { file },
    )

    return data
  },
}