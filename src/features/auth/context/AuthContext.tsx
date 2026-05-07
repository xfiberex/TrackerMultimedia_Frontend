import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { AuthAPI } from '../api/AuthAPI'
import type {
  AuthMethodsResponse,
  LoginPayload,
  OAuthLinkConfirmPayload,
  RegisterPayload,
  User,
} from '../schemas/authSchema'
import { tokenStore } from '@/shared/api/tokenStore'
import { AUTH_LOGOUT_EVENT } from '@/shared/api/axios'
import { AuthContext } from './authContextDef'

// ---------------------------------------------------------------------------
// Provider  (único export de este archivo)
// ---------------------------------------------------------------------------

const REFRESH_TOKEN_KEY = 'refreshToken'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [methods, setMethods] = useState<AuthMethodsResponse | null>(null)

  // Cargar métodos disponibles al montar (independiente de la sesión)
  useEffect(() => {
    void AuthAPI.getMethods()
      .then(setMethods)
      .catch(() => {
        // Si falla, mostrar solo el método manual como fallback seguro
        setMethods({ manualEnabled: true, googleEnabled: false, gitHubEnabled: false })
      })
  }, [])

  // Al montar: intentar recuperar la sesión desde el refresh token guardado.
  useEffect(() => {
    const savedToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    const init = savedToken
      ? AuthAPI.refresh(savedToken)
          .then((response) => {
            tokenStore.set(response.accessToken)
            localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
            setUser(response.user)
          })
          .catch(() => {
            localStorage.removeItem(REFRESH_TOKEN_KEY)
          })
      : Promise.resolve()

    void init.finally(() => setIsLoading(false))
  }, [])

  // Escucha el evento que lanza el interceptor 401 cuando el refresh falla
  useEffect(() => {
    const handleForceLogout = () => {
      tokenStore.set(null)
      setUser(null)
    }
    window.addEventListener(AUTH_LOGOUT_EVENT, handleForceLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleForceLogout)
  }, [])

  // -------------------------------------------------------------------------
  // Acciones
  // -------------------------------------------------------------------------

  const login = async (payload: LoginPayload) => {
    const response = await AuthAPI.login(payload)
    tokenStore.set(response.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
    setUser(response.user)
  }

  const register = async (payload: RegisterPayload) => {
    return await AuthAPI.register(payload)
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    try {
      await AuthAPI.logout(refreshToken)
    } finally {
      tokenStore.set(null)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      setUser(null)
    }
  }

  const logoutAll = async () => {
    try {
      await AuthAPI.logoutAll()
    } finally {
      tokenStore.set(null)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    const updatedUser = await AuthAPI.me()
    setUser(updatedUser)
  }

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    const { authorizationUrl } = await AuthAPI.getOAuthUrl(provider)
    window.location.href = authorizationUrl
  }

  const linkConfirm = async (payload: OAuthLinkConfirmPayload) => {
    const response = await AuthAPI.linkConfirm(payload)
    tokenStore.set(response.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
    setUser(response.user)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, methods, login, register, logout, logoutAll, refreshUser, loginWithOAuth, linkConfirm }}
    >
      {children}
    </AuthContext.Provider>
  )
}


