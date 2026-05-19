import { z } from 'zod'
import { contentKinds } from '@/features/media-items/schemas/mediaItemSchema'

export const createFormatInputSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(60, 'Máximo 60 caracteres'),
  contentKind: z.enum(contentKinds).nullable().optional(),
})

export const updateFormatInputSchema = createFormatInputSchema

export const userFormatSchema = z.object({
  id: z.string(),
  name: z.string(),
  contentKind: z.enum(contentKinds).nullable(),
  order: z.number(),
  createdAtUtc: z.string(),
})

export type UserFormat = z.infer<typeof userFormatSchema>
export type CreateFormatInput = z.infer<typeof createFormatInputSchema>
export type UpdateFormatInput = z.infer<typeof updateFormatInputSchema>
