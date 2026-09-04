import { createContext } from 'react'
import type {
  AuthResponse,
  AuthMethodsResponse,
  DeleteAccountPayload,
  LoginPayload,
  OAuthLinkConfirmPayload,
  RegisterPayload,
  User,
} from '../schemas/authSchema'

export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  methods: AuthMethodsResponse | null
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  deleteAccount: (payload: DeleteAccountPayload) => Promise<void>
  refreshUser: () => Promise<void>
  completeSession: (session: AuthResponse) => void
  /** Redirige al proveedor OAuth indicado para iniciar el flujo. */
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>
  /** Completa la vinculación explícita cuando el email ya pertenece a una cuenta manual. */
  linkConfirm: (payload: OAuthLinkConfirmPayload) => Promise<void>
}

// El contexto vive aquí para que AuthProvider y useAuth puedan importarlo
// sin que ninguno de los dos mezcle componentes con no-componentes.
export const AuthContext = createContext<AuthContextValue | null>(null)
