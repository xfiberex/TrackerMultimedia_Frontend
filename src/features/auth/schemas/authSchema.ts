// Tipos del módulo de autenticación.
// Espejo de los contratos del backend (Contracts/Auth/).

export interface User {
  id: string
  email: string
  displayName: string
  emailConfirmed: boolean
  hasPassword: boolean
  linkedProviders: string[]
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  /** Vida útil del access token en segundos */
  expiresIn: number
  user: User
}

export interface RegisterPayload {
  email: string
  password: string
  displayName?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface UpdateProfilePayload {
  displayName?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  email: string
  token: string
  newPassword: string
}

export interface ConfirmEmailPayload {
  email: string
  token: string
}

export interface ResendConfirmationPayload {
  email: string
}

export interface AuthMethodsResponse {
  manualEnabled: boolean
  googleEnabled: boolean
  gitHubEnabled: boolean
}

export interface OAuthInitResponse {
  authorizationUrl: string
}

/** El backend devuelve esto cuando el email ya existe en una cuenta manual. */
export interface OAuthLinkRequired {
  linkToken: string
  provider: string
  email: string
}

export interface OAuthLinkConfirmPayload {
  linkToken: string
  provider: string
  email: string
  password: string
}

