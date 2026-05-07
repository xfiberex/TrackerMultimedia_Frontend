import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '@/shared/components/ToastProvider'
import { useAuth } from '../context/useAuth'
import { extractAuthError } from '../utils/authErrors'

export default function LoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [oauthPending, setOAuthPending] = useState<'google' | 'github' | null>(null)

  const { user, isLoading, login, loginWithOAuth, methods } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const consumedFlashRef = useRef<string | null>(null)
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ??
    '/library'
  const flashMessage =
    (location.state as { message?: string } | null)?.message ?? null

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/library', { replace: true })
    }
  }, [user, isLoading, navigate])

  useEffect(() => {
    if (!flashMessage || consumedFlashRef.current === flashMessage) {
      return
    }

    consumedFlashRef.current = flashMessage
    showToast({ tone: 'success', message: flashMessage })
  }, [flashMessage, showToast])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      const msg = extractAuthError(err, 'Credenciales inválidas. Revisa tu correo y contraseña.')
      setError(msg)
    } finally {
      setIsPending(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null)
    setOAuthPending(provider)
    try {
      await loginWithOAuth(provider)
      // loginWithOAuth redirige; si llegamos aquí hubo un error
    } catch (err) {
      setError(extractAuthError(err, `No se pudo iniciar el acceso con ${provider}.`))
      setOAuthPending(null)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand__title">TrackerMultimedia</span>
        </div>

        <h1 className="auth-card__title">Iniciar sesión</h1>
        <p className="auth-card__subtitle">Bienvenido de vuelta.</p>

        {error ? <div className="auth-error" role="alert">{error}</div> : null}

        {/* Botones OAuth — solo si el backend los tiene habilitados */}
        {(methods?.googleEnabled || methods?.gitHubEnabled) && (
          <>
            <div className="oauth-buttons">
              {methods?.googleEnabled && (
                <button
                  type="button"
                  className="button button--secondary oauth-button"
                  disabled={oauthPending !== null}
                  onClick={() => handleOAuth('google')}
                >
                  {oauthPending === 'google' ? 'Redirigiendo…' : 'Continuar con Google'}
                </button>
              )}
              {methods?.gitHubEnabled && (
                <button
                  type="button"
                  className="button button--secondary oauth-button"
                  disabled={oauthPending !== null}
                  onClick={() => handleOAuth('github')}
                >
                  {oauthPending === 'github' ? 'Redirigiendo…' : 'Continuar con GitHub'}
                </button>
              )}
            </div>

            <div className="auth-divider">
              <span>o</span>
            </div>
          </>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="control">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="control">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="button button--primary" disabled={isPending || oauthPending !== null}>
            {isPending ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/register">Regístrate</Link>
        </p>
        <p className="auth-footer">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="auth-footer">
          <Link to="/resend-confirmation">¿No recibiste el correo de confirmación?</Link>
        </p>
      </div>
    </div>
  )
}

