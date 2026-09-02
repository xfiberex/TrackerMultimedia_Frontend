import type {
  CreateMediaItemInput,
  MediaItem,
  PagedResponse,
  UpdateMediaItemInput,
} from '../schemas/mediaItemSchema'

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/shared/api/axios', () => ({
  default: apiMock,
}))

import { MediaItemsApi } from './MediaItemsAPI'

describe('MediaItemsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets paged media items with or without filters', async () => {
    const pagedResult: PagedResponse<MediaItem> = {
      items: [],
      page: 1,
      pageSize: 12,
      totalCount: 0,
      totalPages: 0,
    }
    const signal = new AbortController().signal
    apiMock.get.mockResolvedValue({ data: pagedResult })

    await expect(MediaItemsApi.getAll({}, signal)).resolves.toEqual(pagedResult)
    await expect(
      MediaItemsApi.getAll({ search: 'frieren', status: 'InProgress', categoryIds: ['cat-1', 'cat-2'], page: 2, pageSize: 24 }, signal),
    ).resolves.toEqual(pagedResult)

    expect(apiMock.get).toHaveBeenNthCalledWith(1, '/media-items', { signal })
    expect(apiMock.get).toHaveBeenNthCalledWith(2, '/media-items?search=frieren&status=InProgress&categoryIds=cat-1&categoryIds=cat-2&page=2&pageSize=24', {
      signal,
    })
  })

  it('creates a media item and returns the created payload', async () => {
    const payload: CreateMediaItemInput = {
      title: 'Frieren',
      alternativeTitle: 'Sousou no Frieren',
      type: null,
      description: 'Fantasy journey',
      contentKind: 'Series',
      status: 'Planned',
      sourceType: 'Manual',
      progressUnit: 'Episodes',
      progressCount: 0,
      progressCurrent: 0,
      progressTotal: 28,
      currentSeason: 1,
      personalScore: 9,
      startedAtUtc: null,
      completedAtUtc: null,
    }
    const item: MediaItem = {
      id: 'item-1',
      title: 'Frieren',
      alternativeTitle: 'Sousou no Frieren',
      type: null,
      description: 'Fantasy journey',
      contentKind: 'Series',
      status: 'Planned',
      sourceType: 'Manual',
      externalId: null,
      externalMediaKind: null,
      externalStatusLabel: null,
      externalScore: null,
      coverImageUrl: null,
      referenceUrl: null,
      releaseYear: 2023,
      progressUnit: 'Episodes',
      progressCount: 0,
      progressCurrent: 0,
      progressTotal: 28,
      currentSeason: 1,
      personalScore: 9,
      notes: null,
      startedAtUtc: null,
      completedAtUtc: null,
      createdAtUtc: '2026-05-05T12:00:00.000Z',
      updatedAtUtc: '2026-05-05T12:00:00.000Z',
    }
    apiMock.post.mockResolvedValue({ data: item })

    await expect(MediaItemsApi.create(payload)).resolves.toEqual(item)
    expect(apiMock.post).toHaveBeenCalledWith('/media-items', payload)
  })

  it('updates an existing media item and returns the updated payload', async () => {
    const payload: UpdateMediaItemInput = {
      title: 'Frieren actualizado',
      alternativeTitle: 'Sousou no Frieren',
      type: 'Anime',
      description: 'Fantasy journey',
      contentKind: 'Series',
      status: 'Completed',
      sourceType: 'Manual',
      progressUnit: 'Episodes',
      progressCount: 28,
      progressCurrent: 28,
      progressTotal: 28,
      currentSeason: 1,
      personalScore: 9.4,
      startedAtUtc: null,
      completedAtUtc: null,
      notes: 'Cierre fuerte.',
    }
    const item: MediaItem = {
      id: 'item-1',
      title: payload.title,
      alternativeTitle: payload.alternativeTitle ?? null,
      type: payload.type ?? null,
      description: payload.description ?? null,
      contentKind: payload.contentKind,
      status: payload.status,
      sourceType: payload.sourceType,
      externalId: null,
      externalMediaKind: null,
      externalStatusLabel: null,
      externalScore: null,
      coverImageUrl: null,
      referenceUrl: null,
      releaseYear: null,
      progressUnit: payload.progressUnit,
      progressCount: payload.progressCount ?? payload.progressCurrent,
      progressCurrent: payload.progressCurrent,
      progressTotal: payload.progressTotal ?? null,
      currentSeason: payload.currentSeason ?? 1,
      personalScore: payload.personalScore ?? null,
      notes: payload.notes ?? null,
      startedAtUtc: payload.startedAtUtc ?? null,
      completedAtUtc: payload.completedAtUtc ?? null,
      createdAtUtc: '2026-05-05T12:00:00.000Z',
      updatedAtUtc: '2026-05-06T12:00:00.000Z',
    }
    apiMock.put.mockResolvedValue({ data: item })

    await expect(MediaItemsApi.update('item-1', payload)).resolves.toEqual(item)
    expect(apiMock.put).toHaveBeenCalledWith('/media-items/item-1', payload)
  })

  it('removes a media item by id', async () => {
    apiMock.delete.mockResolvedValue({})

    await expect(MediaItemsApi.remove('item-1')).resolves.toBeUndefined()
    expect(apiMock.delete).toHaveBeenCalledWith('/media-items/item-1')
  })
})