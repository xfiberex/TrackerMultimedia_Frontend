import { z } from 'zod'
import { mensaje } from '@/shared/i18n/mensajeZod'

// ── Validadores ──────────────────────────────────────────────────────────────

const emailSchema = z.string().email(mensaje('validacion.emailInvalido'))
const passwordSchema = z.string().min(8, mensaje('validacion.passwordMinima'))
const displayNameSchema = z
  .string()
  .min(1, mensaje('validacion.nombreRequerido'))
  .max(100, mensaje('validacion.maximo100'))
  .optional()

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  emailConfirmed: z.boolean(),
  hasPassword: z.boolean(),
  linkedProviders: z.array(z.string()),
})

// Sin `refreshToken`: desde T4-01 viaja en una cookie HttpOnly que este código no puede
// leer ni necesita leer. Si el backend volviera a mandarlo en el cuerpo, este esquema no
// lo detectaría —Zod ignora las claves de más— pero sí lo detecta el test de backend que
// mira el JSON crudo.
export const authResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().positive(),
  user: userSchema,
})

export const loginPayloadSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, mensaje('validacion.passwordRequerida')),
})

export const registerPayloadSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
})

export const changePasswordPayloadSchema = z.object({
  currentPassword: z.string().min(1, mensaje('validacion.passwordActualRequerida')),
  newPassword: passwordSchema,
})

/**
 * Reautenticación para borrar la cuenta. Los dos campos son opcionales aquí porque el
 * backend decide cuál exige según la cuenta tenga contraseña o venga solo de OAuth;
 * validarlo también en el cliente duplicaría esa regla en dos sitios y dejaría la
 * puerta abierta a que se separaran.
 */
export const deleteAccountPayloadSchema = z.object({
  password: z.string().optional(),
  confirmationEmail: z.string().optional(),
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
  password: z.string().min(1, mensaje('validacion.passwordRequerida')),
})

// ── Tipos inferidos ──────────────────────────────────────────────────────────

export type User = z.infer<typeof userSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type LoginPayload = z.infer<typeof loginPayloadSchema>
export type RegisterPayload = z.infer<typeof registerPayloadSchema>
export type ChangePasswordPayload = z.infer<typeof changePasswordPayloadSchema>
export type UpdateProfilePayload = z.infer<typeof updateProfilePayloadSchema>
export type DeleteAccountPayload = z.infer<typeof deleteAccountPayloadSchema>
export type ForgotPasswordPayload = z.infer<typeof forgotPasswordPayloadSchema>
export type ResetPasswordPayload = z.infer<typeof resetPasswordPayloadSchema>
export type ConfirmEmailPayload = z.infer<typeof confirmEmailPayloadSchema>
export type ResendConfirmationPayload = z.infer<typeof resendConfirmationPayloadSchema>
export type AuthMethodsResponse = z.infer<typeof authMethodsResponseSchema>
export type OAuthInitResponse = z.infer<typeof oauthInitResponseSchema>
export type OAuthLinkRequired = z.infer<typeof oauthLinkRequiredSchema>
export type OAuthLinkConfirmPayload = z.infer<typeof oauthLinkConfirmPayloadSchema>
