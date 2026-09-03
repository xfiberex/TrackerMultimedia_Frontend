import { z } from 'zod'

// ── Validadores ──────────────────────────────────────────────────────────────

const emailSchema = z.string().email('Email inválido')
const passwordSchema = z.string().min(8, 'Contraseña: mínimo 8 caracteres')
const displayNameSchema = z
  .string()
  .min(1, 'Nombre requerido')
  .max(100, 'Máximo 100 caracteres')
  .optional()

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  emailConfirmed: z.boolean(),
  hasPassword: z.boolean(),
  linkedProviders: z.array(z.string()),
})

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().positive(),
  user: userSchema,
})

export const loginPayloadSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
})

export const registerPayloadSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
})

export const changePasswordPayloadSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: passwordSchema,
})

export const updateProfilePayloadSchema = z.object({
  displayName: displayNameSchema,
})

export const forgotPasswordPayloadSchema = z.object({
  email: emailSchema,
})

export const resetPasswordPayloadSchema = z.object({
  email: emailSchema,
  token: z.string().min(1),
  newPassword: passwordSchema,
})

export const confirmEmailPayloadSchema = z.object({
  email: emailSchema,
  token: z.string().min(1),
})

export const resendConfirmationPayloadSchema = z.object({
  email: emailSchema,
})

export const authMethodsResponseSchema = z.object({
  manualEnabled: z.boolean(),
  googleEnabled: z.boolean(),
  gitHubEnabled: z.boolean(),
})

export const oauthInitResponseSchema = z.object({
  authorizationUrl: z.string().url(),
})

export const oauthLinkRequiredSchema = z.object({
  linkToken: z.string(),
  provider: z.string(),
  email: z.string().email(),
})

export const oauthLinkConfirmPayloadSchema = z.object({
  linkToken: z.string().min(1),
  provider: z.string().min(1),
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
})

// ── Tipos inferidos ──────────────────────────────────────────────────────────

export type User = z.infer<typeof userSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type LoginPayload = z.infer<typeof loginPayloadSchema>
export type RegisterPayload = z.infer<typeof registerPayloadSchema>
export type ChangePasswordPayload = z.infer<typeof changePasswordPayloadSchema>
export type UpdateProfilePayload = z.infer<typeof updateProfilePayloadSchema>
export type ForgotPasswordPayload = z.infer<typeof forgotPasswordPayloadSchema>
export type ResetPasswordPayload = z.infer<typeof resetPasswordPayloadSchema>
export type ConfirmEmailPayload = z.infer<typeof confirmEmailPayloadSchema>
export type ResendConfirmationPayload = z.infer<typeof resendConfirmationPayloadSchema>
export type AuthMethodsResponse = z.infer<typeof authMethodsResponseSchema>
export type OAuthInitResponse = z.infer<typeof oauthInitResponseSchema>
export type OAuthLinkRequired = z.infer<typeof oauthLinkRequiredSchema>
export type OAuthLinkConfirmPayload = z.infer<typeof oauthLinkConfirmPayloadSchema>
