import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../schemas/categorySchema'

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/shared/api/axios', () => ({
  default: apiMock,
}))

import { CategoriesApi } from './CategoriesAPI'

describe('CategoriesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets categories with the provided abort signal', async () => {
    const categories: Category[] = [
      { id: 'cat-1', name: 'Backlog', color: '#336699', createdAtUtc: '2026-05-06T12:00:00.000Z' },
    ]
    const signal = new AbortController().signal
    apiMock.get.mockResolvedValue({ data: categories })

    await expect(CategoriesApi.getAll(signal)).resolves.toEqual(categories)
    expect(apiMock.get).toHaveBeenCalledWith('/categories', { signal })
  })

  it('creates a category', async () => {
    const payload: CreateCategoryInput = { name: 'Backlog', color: '#336699' }
    const category: Category = { id: 'cat-1', name: 'Backlog', color: '#336699', createdAtUtc: '2026-05-06T12:00:00.000Z' }
    apiMock.post.mockResolvedValue({ data: category })

    await expect(CategoriesApi.create(payload)).resolves.toEqual(category)
    expect(apiMock.post).toHaveBeenCalledWith('/categories', payload)
  })

  it('updates a category', async () => {
    const payload: UpdateCategoryInput = { name: 'Favoritos', color: null }
    const category: Category = { id: 'cat-1', name: 'Favoritos', color: null, createdAtUtc: '2026-05-06T12:00:00.000Z' }
    apiMock.put.mockResolvedValue({ data: category })

    await expect(CategoriesApi.update('cat-1', payload)).resolves.toEqual(category)
    expect(apiMock.put).toHaveBeenCalledWith('/categories/cat-1', payload)
  })

  it('removes a category', async () => {
    apiMock.delete.mockResolvedValue({})

    await expect(CategoriesApi.remove('cat-1')).resolves.toBeUndefined()
    expect(apiMock.delete).toHaveBeenCalledWith('/categories/cat-1')
  })
})