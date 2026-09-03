import { z } from 'zod'

export const createCategoryInputSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color inválido')
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
