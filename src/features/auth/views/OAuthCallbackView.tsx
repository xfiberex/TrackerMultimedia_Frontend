/**
 * OAuthCallbackView
 *
 * El backend redirige aquí tras completar el flujo OAuth con la URL:
 *   /oauth-callback#access_token=...&refresh_token=...&expires_in=...&return_path=...&user=...
 *
 * Los tokens viajan en el fragment (#) para que nunca lleguen a los logs
 * del servidor. Esta vista los lee, los guarda en el store y redirige.
 */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokenStore } from '@/shared/api/tokenStore'
import { useAuth } from '../context/useAuth'
import type { User } from '../schemas/authSchema'
import Loader from '@/shared/components/Loader'

const REFRESH_TOKEN_KEY = 'refreshToken'

function parseFragmentParams(hash: string): Map<string, string> {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new Map<string, string>()

  if (!fragment) {
    return params
  }

  for (const pair of fragment.split('&')) {
    if (!pair) {
      continue
    }

    const separatorIndex = pair.indexOf('=')
    const rawKey = separatorIndex >= 0 ? pair.slice(0, separatorIndex) : pair
    const rawValue = separatorIndex >= 0 ? pair.slice(separatorIndex + 1) : ''

    params.set(decodeURIComponent(rawKey), decodeURIComponent(rawValue))
  }

  return params
}

export default function OAuthCallbackView() {
  const navigate = useNavigate()
  const { completeSession, refreshUser } = useAuth()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const params = parseFragmentParams(window.location.hash)

    const accessToken = params.get('access_token') ?? null
    const refreshToken = params.get('refresh_token') ?? null
    const returnPath = params.get('return_path') ?? '/library'
    const rawUser = params.get('user') ?? null
    const expiresIn = Number(params.get('expires_in') ?? '0')
    const oauthError = new URLSearchParams(window.location.search).get('oauth_error')

    if (oauthError) {
      navigate(`/login?oauth_error=${encodeURIComponent(oauthError)}`, { replace: true })
      return
    }

    if (!accessToken || !refreshToken) {
      navigate('/login?oauth_error=missing_tokens', { replace: true })
      return
    }

    if (rawUser) {
      try {
        const user = JSON.parse(rawUser) as User
        completeSession({
          accessToken,
          refreshToken,
          expiresIn: Number.isFinite(expiresIn) ? expiresIn : 0,
          user,
        })
        navigate(returnPath, { replace: true })
        return
      } catch {
        // Si el payload embebido no se puede decodificar, intentamos el fallback legacy.
      }
    }

    tokenStore.set(accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)

    // Actualizar el estado global del usuario
    void refreshUser()
      .then(() => {
        navigate(returnPath, { replace: true })
      })
      .catch(() => {
        navigate('/login?oauth_error=session_error', { replace: true })
      })
  }, [navigate, refreshUser, completeSession])

  return <Loader />
}
