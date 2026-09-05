import api, { refreshSession } from '@/shared/api/axios'
import { resolveDownloadFileName } from '@/shared/utils'
import type {
  AuthMethodsResponse,
  AuthResponse,
  ChangePasswordPayload,
  ConfirmEmailPayload,
  DeleteAccountPayload,
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

  // Sin argumentos: el token de refresco va en la cookie que el navegador adjunta solo.
  // Pasa por `refreshSession` y no por `api` directamente para compartir la única petición
  // en vuelo con el interceptor de 401: dos renovaciones a la vez revocarían la sesión.
  refresh: () => refreshSession(),

  logout: () => api.post<void>('/auth/logout').then(() => {}),

  me: () => api.get<User>('/auth/me').then((r) => r.data),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post<void>('/auth/change-password', payload).then(() => {}),

  updateProfile: (payload: UpdateProfilePayload) =>
    api.put<User>('/auth/profile', payload).then((r) => r.data),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<{ message: string }>('/auth/forgot-password', payload).then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<void>('/auth/reset-password', payload).then(() => {}),

  logoutAll: () => api.post<void>('/auth/logout-all').then(() => {}),

  // El cuerpo viaja en un DELETE, que es poco habitual pero es lo correcto aquí: la
  // reautenticación no puede ir en la URL, donde acabaría en el historial y en los logs
  // de cualquier proxy.
  deleteAccount: (payload: DeleteAccountPayload) =>
    api.delete<void>('/auth/account', { data: payload }).then(() => {}),

  /**
   * Descarga todo lo que el servidor guarda sobre la cuenta. Se pide como blob y no
   * como JSON porque el navegador tiene que guardarlo en un archivo, no la aplicación
   * mostrarlo: una biblioteca grande no cabe en pantalla y no hay nada que renderizar.
   */
  exportPersonalData: async (): Promise<{ blob: Blob; fileName: string }> => {
    const response = await api.get<Blob>('/auth/account/export', { responseType: 'blob' })

    return {
      blob: response.data,
      fileName: resolveDownloadFileName(
        response.headers['content-disposition'] as string | undefined,
        'tracker-datos-personales.json',
      ),
    }
  },

  // ── Confirmación de email ──────────────────────────────────────────────────

  confirmEmail: (payload: ConfirmEmailPayload) =>
    api.post<{ message: string }>('/auth/confirm-email', payload).then((r) => r.data),

  resendConfirmation: (payload: ResendConfirmationPayload) =>
    api.post<{ message: string }>('/auth/resend-confirmation', payload).then((r) => r.data),

  // ── Métodos disponibles ────────────────────────────────────────────────────

  getMethods: () => api.get<AuthMethodsResponse>('/auth/methods').then((r) => r.data),

  // ── OAuth ──────────────────────────────────────────────────────────────────

  /** Obtiene la URL de autorización para iniciar el flujo OAuth del proveedor indicado. */
  getOAuthUrl: (provider: 'google' | 'github', returnPath?: string) => {
    const params = returnPath ? `?returnPath=${encodeURIComponent(returnPath)}` : ''
    return api.get<OAuthInitResponse>(`/auth/${provider}/init${params}`).then((r) => r.data)
  },

  /** Finaliza la vinculación explícita cuando el email ya pertenece a una cuenta manual. */
  linkConfirm: (payload: OAuthLinkConfirmPayload) =>
    api.post<AuthResponse>('/auth/link-confirm', payload).then((r) => r.data),
}
