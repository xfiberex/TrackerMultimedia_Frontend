import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '@/shared/components/ToastProvider'
import { useAuth } from '../context/useAuth'
import { loginPayloadSchema, normalizeError, getOAuthErrorMessage } from '../utils/authErrors'
import { validateField } from '@/shared/utils/validation'
import { useDebounce } from '@/shared/hooks/useDebounce'

export default function LoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
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

  // Debounced email para validación en tiempo real
  const debouncedEmail = useDebounce(email, 300)

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/library', { replace: true })
    }
  }, [user, isLoading, navigate])

  // Extraer error OAuth de la URL al montar el componente
  const oauthError = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    return getOAuthErrorMessage(
      searchParams.get('oauth_error'),
      searchParams.get('oauth_error_message'),
    )
  }, [location.search])

  useEffect(() => {
    if (oauthError) {
      setError(oauthError)
    }
  }, [oauthError])

  useEffect(() => {
    if (!flashMessage || consumedFlashRef.current === flashMessage) {
      return
    }

    consumedFlashRef.current = flashMessage
    showToast({ tone: 'success', message: flashMessage })
  }, [flashMessage, showToast])

  // Validación en tiempo real del email
  useEffect(() => {
    if (!debouncedEmail) {
      setFieldErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { email, ...rest } = prev
        return rest
      })
      return
    }

    const emailError = validateField(loginPayloadSchema.shape.email, debouncedEmail)
    setFieldErrors((prev) => ({
      ...prev,
      email: emailError || '',
    }))
  }, [debouncedEmail])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      const appError = normalizeError(err)
      setError(appError.message)
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
      const appError = normalizeError(err)
      setError(appError.message || `No se pudo iniciar el acceso con ${provider}.`)
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
                  disabled={oauthPending !== null || isPending}
                  onClick={() => handleOAuth('google')}
                >
                  {oauthPending === 'google' ? 'Redirigiendo…' : 'Continuar con Google'}
                </button>
              )}
              {methods?.gitHubEnabled && (
                <button
                  type="button"
                  className="button button--secondary oauth-button"
                  disabled={oauthPending !== null || isPending}
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
              className={`input${fieldErrors.email ? ' input--error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
            {fieldErrors.email && (
              <span id="email-error" className="field-error" role="alert">{fieldErrors.email}</span>
            )}
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

          <button type="submit" className="button button--primary" disabled={isPending || oauthPending !== null || !!fieldErrors.email}>
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

