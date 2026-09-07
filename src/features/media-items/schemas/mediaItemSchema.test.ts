import { describe, it, expect } from 'vitest'
import {
  mediaItemSchema,
  mediaItemsFiltersSchema,
} from '@/features/media-items/schemas/mediaItemSchema'

describe('MediaItem Schemas', () => {
  it('validates correct media item data', () => {
    const validItem = {
      id: '1',
      title: 'Attack on Titan',
      alternativeTitle: null,
      type: 'Anime',
      description: 'Great anime',
      contentKind: 'Series',
      status: 'InProgress',
      coverImageUrl: 'https://example.com/cover.jpg',
      referenceUrl: 'https://myanimelist.net/anime/30629',
      releaseYear: 2013,
      progressUnit: 'Episodes',
      progressCount: 0,
      progressCurrent: 0,
      progressTotal: 25,
      currentSeason: 0,
      personalScore: null,
      notes: null,
      startedAtUtc: null,
      completedAtUtc: null,
      createdAtUtc: new Date().toISOString(),
      updatedAtUtc: new Date().toISOString(),
    }

    const result = mediaItemSchema.safeParse(validItem)
    expect(result.success).toBe(true)
  })

  it('rejects invalid score values', () => {
    const invalidItem = {
      id: '1',
      title: 'Test',
      alternativeTitle: null,
      type: null,
      description: null,
      contentKind: 'Series',
      status: 'InProgress',
      coverImageUrl: null,
      referenceUrl: null,
      releaseYear: null,
      progressUnit: 'Episodes',
      progressCount: 0,
      progressCurrent: 0,
      progressTotal: null,
      currentSeason: 0,
      personalScore: 15, // Invalido: > 10
      notes: null,
      startedAtUtc: null,
      completedAtUtc: null,
      createdAtUtc: new Date().toISOString(),
      updatedAtUtc: new Date().toISOString(),
    }

    const result = mediaItemSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
  })

  it('validates media items filters', () => {
    const validFilters = {
      search: 'Anime',
      type: 'Anime',
      status: 'InProgress',
      page: 1,
      pageSize: 10,
    }

    const result = mediaItemsFiltersSchema.safeParse(validFilters)
    expect(result.success).toBe(true)
  })

  it('rejects invalid page numbers', () => {
    const invalidFilters = {
      page: 0, // Invalid: must be positive
      pageSize: 10,
    }

    const result = mediaItemsFiltersSchema.safeParse(invalidFilters)
    expect(result.success).toBe(false)
  })
})
