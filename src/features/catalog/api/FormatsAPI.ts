import api from '@/shared/api/axios'
import type { CreateFormatInput, UpdateFormatInput, UserFormat } from '@/features/catalog/schemas/formatsSchema'

export const FormatsApi = {
  getAll: async (signal?: AbortSignal): Promise<UserFormat[]> => {
    const { data } = await api.get<UserFormat[]>('/formats', { signal })
    return data
  },

  create: async (payload: CreateFormatInput): Promise<UserFormat> => {
    const { data } = await api.post<UserFormat>('/formats', payload)
    return data
  },

  update: async (id: string, payload: UpdateFormatInput): Promise<UserFormat> => {
    const { data } = await api.put<UserFormat>(`/formats/${id}`, payload)
    return data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/formats/${id}`)
  },
}
