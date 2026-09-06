import { z } from 'zod'
import { mensaje } from '@/shared/i18n/mensajeZod'

export const createCategoryInputSchema = z.object({
  name: z
    .string()
    .min(1, mensaje('validacion.nombreRequerido'))
    .max(100, mensaje('validacion.maximo100')),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, mensaje('validacion.colorInvalido'))
    .nullable()
    .optional(),
})

export const updateCategoryInputSchema = createCategoryInputSchema

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  createdAtUtc: z.string().datetime(),
})

export type Category = z.infer<typeof categorySchema>
export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>
export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>
