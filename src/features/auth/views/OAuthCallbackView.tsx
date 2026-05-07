/**
 * OAuthCallbackView
 *
 * El backend redirige aquí tras completar el flujo OAuth con la URL:
 *   /oauth-callback#access_token=...&refresh_token=...&expires_in=...&return_path=...
 *
 * Los tokens viajan en el fragment (#) para que nunca lleguen a los logs
 * del servidor. Esta vista los lee, los guarda en el store y redirige.
 */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokenStore } from '@/shared/api/tokenStore'
import { useAuth } from '../context/useAuth'
import Loader from '@/shared/components/Loader'

const REFRESH_TOKEN_KEY = 'refreshToken'

export default function OAuthCallbackView() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)

    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const returnPath = params.get('return_path') ?? '/library'
    const oauthError = new URLSearchParams(window.location.search).get('oauth_error')

    if (oauthError) {
      navigate(`/login?oauth_error=${encodeURIComponent(oauthError)}`, { replace: true })
      return
    }

    if (!accessToken || !refreshToken) {
      navigate('/login?oauth_error=missing_tokens', { replace: true })
      return
    }

    tokenStore.set(accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)

    // Actualizar el estado global del usuario
    void refreshUser().then(() => {
      navigate(returnPath, { replace: true })
    }).catch(() => {
      navigate('/login?oauth_error=session_error', { replace: true })
    })
  }, [navigate, refreshUser])

  return <Loader />
}
