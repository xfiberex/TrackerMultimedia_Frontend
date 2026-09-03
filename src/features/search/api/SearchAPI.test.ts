import type { DiscoverProvider, SearchMediaItem } from '../schemas/searchSchema'

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/shared/api/axios', () => ({
  default: apiMock,
}))

import { SearchApi } from './SearchAPI'

describe('SearchApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the available discover providers', async () => {
    const providers: DiscoverProvider[] = [
      {
        key: 'jikan',
        displayName: 'Jikan',
        sourceType: 'Jikan',
        supportedTypes: ['All', 'Anime', 'Manga'],
      },
    ]
    const signal = new AbortController().signal
    apiMock.get.mockResolvedValue({ data: providers })

    await expect(SearchApi.getProviders(signal)).resolves.toEqual(providers)

    expect(apiMock.get).toHaveBeenCalledWith('/discover/providers', { signal })
  })

  it('serializes filters into the search query and returns the payload', async () => {
    const results: SearchMediaItem[] = [
      {
        externalId: 1,
        title: 'Naruto',
        alternativeTitle: 'ナルト',
        suggestedType: 'Anime',
        sourceType: 'Jikan',
        externalMediaKind: 'Anime',
        externalStatusLabel: 'Activo',
        externalScore: 8.5,
        coverImageUrl: 'https://img.test/naruto.jpg',
        referenceUrl: 'https://example.com/naruto',
        releaseYear: 2002,
      },
    ]
    const signal = new AbortController().signal
    apiMock.get.mockResolvedValue({ data: results })

    await expect(
      SearchApi.search({ query: 'naruto', type: 'Anime', limit: 5 }, signal),
    ).resolves.toEqual(results)

    expect(apiMock.get).toHaveBeenCalledWith('/discover/search?query=naruto&type=Anime&limit=5', {
      signal,
    })
  })
})
