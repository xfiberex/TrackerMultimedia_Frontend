/**
 * OAuthCallbackView
 *
 * El backend redirige aquí tras completar el flujo OAuth con la URL:
 *   /oauth-callback#return_path=...
 *
 * **En la URL ya no viaja ningún token.** La sesión llega en la cookie de refresco que el
 * backend escribe en esa misma redirección, y esta vista la cambia por un access token
 * llamando a `/auth/refresh`. Antes el fragmento llevaba el access token, el refresco y el
 * usuario serializado: el fragmento no se manda al servidor, así que no llegaba a los logs,
 * pero sí queda en el historial del navegador y en cualquier sitio donde se pegue la
 * dirección, y eso no tiene arreglo una vez ha ocurrido (T4-01).
 */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { AuthAPI } from '../api/AuthAPI'
import Loader from '@/shared/components/Loader'

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
  const { completeSession } = useAuth()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const params = parseFragmentParams(window.location.hash)
    const returnPath = params.get('return_path') ?? '/library'
    const oauthError = new URLSearchParams(window.location.search).get('oauth_error')

    if (oauthError) {
      navigate(`/login?oauth_error=${encodeURIComponent(oauthError)}`, { replace: true })
      return
    }

    // Una ida y vuelta que antes no hacía falta, y es el precio de que la sesión no pase
    // por la barra de direcciones. Si el proveedor falló, el backend ya habrá redirigido a
    // /login con su código de error y aquí no se llega.
    void AuthAPI.refresh()
      .then((session) => {
        completeSession(session)
        navigate(returnPath, { replace: true })
      })
      .catch(() => {
        navigate('/login?oauth_error=session_error', { replace: true })
      })
  }, [navigate, completeSession])

  return <Loader />
}
