import { z } from 'zod'

export const createFormatInputSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(60, 'Máximo 60 caracteres'),
})

export const updateFormatInputSchema = createFormatInputSchema

export const userFormatSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
  createdAtUtc: z.string(),
})

export type UserFormat = z.infer<typeof userFormatSchema>
export type CreateFormatInput = z.infer<typeof createFormatInputSchema>
export type UpdateFormatInput = z.infer<typeof updateFormatInputSchema>
