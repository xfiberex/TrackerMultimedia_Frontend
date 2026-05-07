import api from '@/shared/api/axios'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/features/categories/schemas/categorySchema'

export const CategoriesApi = {
  getAll: async (signal?: AbortSignal): Promise<Category[]> => {
    const { data } = await api.get<Category[]>('/categories', { signal })
    return data
  },

  create: async (payload: CreateCategoryInput): Promise<Category> => {
    const { data } = await api.post<Category>('/categories', payload)
    return data
  },

  update: async (id: string, payload: UpdateCategoryInput): Promise<Category> => {
    const { data } = await api.put<Category>(`/categories/${id}`, payload)
    return data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`)
  },
}