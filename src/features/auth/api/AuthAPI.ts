import api from '@/shared/api/axios'
import type {
  AuthMethodsResponse,
  AuthResponse,
  ChangePasswordPayload,
  ConfirmEmailPayload,
  ForgotPasswordPayload,
  LoginPayload,
  OAuthInitResponse,
  OAuthLinkConfirmPayload,
  RegisterPayload,
  ResendConfirmationPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
  User,
} from '../schemas/authSchema'

/**
 * Llamadas HTTP al módulo /api/auth del backend.
 * El interceptor de axios añade automáticamente el Bearer token cuando está disponible.
 */
export const AuthAPI = {
  register: (payload: RegisterPayload) =>
    api.post<User>('/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string | null) =>
    api.post<void>('/auth/logout', { refreshToken }).then(() => {}),

  me: () => api.get<User>('/auth/me').then((r) => r.data),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post<void>('/auth/change-password', payload).then(() => {}),

  updateProfile: (payload: UpdateProfilePayload) =>
    api.put<User>('/auth/profile', payload).then((r) => r.data),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<{ message: string }>('/auth/forgot-password', payload).then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<void>('/auth/reset-password', payload).then(() => {}),

  logoutAll: () =>
    api.post<void>('/auth/logout-all').then(() => {}),

  // ── Confirmación de email ──────────────────────────────────────────────────

  confirmEmail: (payload: ConfirmEmailPayload) =>
    api.post<{ message: string }>('/auth/confirm-email', payload).then((r) => r.data),

  resendConfirmation: (payload: ResendConfirmationPayload) =>
    api.post<{ message: string }>('/auth/resend-confirmation', payload).then((r) => r.data),

  // ── Métodos disponibles ────────────────────────────────────────────────────

  getMethods: () =>
    api.get<AuthMethodsResponse>('/auth/methods').then((r) => r.data),

  // ── OAuth ──────────────────────────────────────────────────────────────────

  /** Obtiene la URL de autorización para iniciar el flujo OAuth del proveedor indicado. */
  getOAuthUrl: (provider: 'google' | 'github', returnPath?: string) => {
    const params = returnPath ? `?returnPath=${encodeURIComponent(returnPath)}` : ''
    return api
      .get<OAuthInitResponse>(`/auth/${provider}/init${params}`)
      .then((r) => r.data)
  },

  /** Finaliza la vinculación explícita cuando el email ya pertenece a una cuenta manual. */
  linkConfirm: (payload: OAuthLinkConfirmPayload) =>
    api.post<AuthResponse>('/auth/link-confirm', payload).then((r) => r.data),
}

