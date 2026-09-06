import { z } from 'zod'
import { mensaje } from '@/shared/i18n/mensajeZod'

export const createFormatInputSchema = z.object({
  name: z
    .string()
    .min(1, mensaje('validacion.nombreRequerido'))
    .max(60, mensaje('validacion.maximo60')),
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
