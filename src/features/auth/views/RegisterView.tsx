import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { extractApiError } from '@/shared/utils'

export default function RegisterView() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [oauthPending, setOAuthPending] = useState<'google' | 'github' | null>(null)
  const [registered, setRegistered] = useState(false)

  const { user, isLoading, register, loginWithOAuth, methods } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/library', { replace: true })
    }
  }, [user, isLoading, navigate])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsPending(true)

    try {
      await register({ email, password, displayName: displayName.trim() || undefined })
      setRegistered(true)
    } catch (err) {
      setError(extractApiError(err, 'No se pudo crear la cuenta. Inténtalo de nuevo.'))
    } finally {
      setIsPending(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null)
    setOAuthPending(provider)
    try {
      await loginWithOAuth(provider)
    } catch (err) {
      setError(extractApiError(err, `No se pudo iniciar el acceso con ${provider}.`))
      setOAuthPending(null)
    }
  }

  if (registered) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand__title">TrackerMultimedia</span>
          </div>
          <h1 className="auth-card__title">¡Cuenta creada!</h1>
          <p className="auth-card__subtitle">
            Te hemos enviado un correo a <strong>{email}</strong>. Abre el enlace de confirmación
            para activar tu cuenta.
          </p>
          <p className="auth-footer">
            <Link to="/resend-confirmation">¿No recibiste el correo?</Link>
          </p>
          <p className="auth-footer">
            <Link to="/login">Volver al inicio de sesión</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand__title">TrackerMultimedia</span>
        </div>

        <h1 className="auth-card__title">Crear cuenta</h1>
        <p className="auth-card__subtitle">Comienza a gestionar tu contenido multimedia.</p>

        {error ? (
          <div className="auth-error" role="alert">
            {error}
          </div>
        ) : null}

        {/* Botones OAuth */}
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
              <span>o regístrate con correo</span>
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
              // Página de un solo propósito: el formulario ES el contenido, así que
              // llevar el foco a su primer campo no se salta nada que el usuario
              // necesite antes. La regla apunta al autoFocus en medio de una página
              // con contenido, que sí desorienta.
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>

          <div className="control">
            <label htmlFor="displayName">
              Nombre visible <span className="control__optional">(opcional)</span>
            </label>
            <input
              id="displayName"
              type="text"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              autoComplete="name"
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
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="control">
            <label htmlFor="confirm">Confirmar contraseña</label>
            <input
              id="confirm"
              type="password"
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="button button--primary"
            disabled={isPending || oauthPending !== null}
          >
            {isPending ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
