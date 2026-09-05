import { useEffect, useState, type ReactNode } from 'react'
import { AuthAPI } from '../api/AuthAPI'
import type {
  AuthResponse,
  DeleteAccountPayload,
  AuthMethodsResponse,
  LoginPayload,
  OAuthLinkConfirmPayload,
  RegisterPayload,
  User,
} from '../schemas/authSchema'
import { tokenStore } from '@/shared/api/tokenStore'
import { AUTH_LOGOUT_EVENT } from '@/shared/api/axios'
import { AuthContext } from './authContextDef'
import { env } from '@/config/env'

// ---------------------------------------------------------------------------
// Provider  (único export de este archivo)
// ---------------------------------------------------------------------------

/**
 * Aplica los interruptores de .env sobre lo que responde `/auth/methods`.
 *
 * Se hace aquí y no en cada vista porque `methods` es el único sitio del que salen los
 * botones OAuth: una vista nueva hereda la decisión sin tener que acordarse de ella.
 *
 * La operación es un AND, nunca un OR. El .env puede ocultar un proveedor que el backend
 * ofrece, pero no puede mostrar uno que el backend no tenga habilitado; y aunque lo
 * mostrara no serviría de nada, porque la autorización la decide el servidor.
 */
function applyClientOverrides(response: AuthMethodsResponse): AuthMethodsResponse {
  return {
    ...response,
    googleEnabled: response.googleEnabled && env.enableGoogleAuth,
    gitHubEnabled: response.gitHubEnabled && env.enableGitHubAuth,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [methods, setMethods] = useState<AuthMethodsResponse | null>(null)

  // El token de refresco no pasa por aquí: el servidor lo pone en una cookie HttpOnly en
  // la misma respuesta. Lo único que este código guarda es el access token, en memoria.
  const applySession = (response: AuthResponse) => {
    tokenStore.set(response.accessToken)
    setUser(response.user)
  }

  // Cargar métodos disponibles al montar (independiente de la sesión)
  useEffect(() => {
    void AuthAPI.getMethods()
      .then((response) => setMethods(applyClientOverrides(response)))
      .catch(() => {
        // Si falla, mostrar solo el método manual como fallback seguro
        setMethods({ manualEnabled: true, googleEnabled: false, gitHubEnabled: false })
      })
  }, [])

  // Al montar: intentar recuperar la sesión. Se llama siempre, no solo cuando había algo
  // guardado, porque la cookie no es legible desde JavaScript: preguntar al servidor es la
  // única forma de saber si hay sesión. Un 401 significa que no la hay, y no es un error.
  useEffect(() => {
    void AuthAPI.refresh()
      .then(applySession)
      .catch(() => {
        // Sin sesión: se sigue como visitante.
      })
      .finally(() => setIsLoading(false))
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
    applySession(response)
  }

  const register = async (payload: RegisterPayload) => {
    return await AuthAPI.register(payload)
  }

  const logout = async () => {
    try {
      await AuthAPI.logout()
    } finally {
      tokenStore.set(null)
      setUser(null)
    }
  }

  const logoutAll = async () => {
    try {
      await AuthAPI.logoutAll()
    } finally {
      tokenStore.set(null)
      setUser(null)
    }
  }

  /**
   * El borrado limpia la sesión local **solo si el servidor confirma**. Al revés que en
   * `logout`, aquí un fallo tiene que dejar al usuario dentro: si se limpiara igualmente,
   * quien escriba mal la contraseña se vería en la pantalla de login creyendo que borró
   * su cuenta, y no habría forma de saber desde el cliente que sigue existiendo.
   */
  const deleteAccount = async (payload: DeleteAccountPayload) => {
    await AuthAPI.deleteAccount(payload)
    tokenStore.set(null)
    setUser(null)
  }

  const refreshUser = async () => {
    const updatedUser = await AuthAPI.me()
    setUser(updatedUser)
  }

  const completeSession = (response: AuthResponse) => {
    applySession(response)
  }

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    const { authorizationUrl } = await AuthAPI.getOAuthUrl(provider)
    window.location.href = authorizationUrl
  }

  const linkConfirm = async (payload: OAuthLinkConfirmPayload) => {
    const response = await AuthAPI.linkConfirm(payload)
    applySession(response)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        methods,
        login,
        register,
        logout,
        logoutAll,
        deleteAccount,
        refreshUser,
        completeSession,
        loginWithOAuth,
        linkConfirm,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
