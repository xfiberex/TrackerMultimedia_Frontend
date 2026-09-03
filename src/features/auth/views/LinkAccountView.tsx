/**
 * LinkAccountView
 *
 * Ruta: /link-account?link_token=...&provider=...&email=...
 *
 * El backend redirige aquí cuando un usuario OAuth tiene el mismo email
 * que una cuenta manual existente. El usuario debe confirmar con su contraseña
 * para vincular los dos proveedores.
 */
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { extractApiError } from '@/shared/utils'

export default function LinkAccountView() {
  const [searchParams] = useSearchParams()
  const linkToken = searchParams.get('link_token') ?? ''
  const provider = searchParams.get('provider') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const { linkConfirm } = useAuth()
  const navigate = useNavigate()

  if (!linkToken || !provider || !email) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand__title">TrackerMultimedia</span>
          </div>
          <h1 className="auth-card__title">Enlace inválido</h1>
          <p className="auth-card__subtitle">
            El enlace de vinculación no es válido o ha expirado.
          </p>
          <p className="auth-footer">
            <Link to="/login">Volver al inicio de sesión</Link>
          </p>
        </div>
      </div>
    )
  }

  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1)

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    try {
      await linkConfirm({ linkToken, provider, email, password })
      navigate('/library', { replace: true })
    } catch (err) {
      setError(extractApiError(err, 'No se pudo vincular la cuenta. Verifica tu contraseña.'))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand__title">TrackerMultimedia</span>
        </div>

        <h1 className="auth-card__title">Vincular cuenta</h1>
        <p className="auth-card__subtitle">
          Ya existe una cuenta con el correo <strong>{email}</strong>. Ingresa tu contraseña para
          vincular tu cuenta de {providerLabel}.
        </p>

        {error ? (
          <div className="auth-error" role="alert">
            {error}
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="control">
            <label htmlFor="password">Contraseña actual</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              // Página de un solo propósito: el formulario ES el contenido, así que
              // llevar el foco a su primer campo no se salta nada que el usuario
              // necesite antes. La regla apunta al autoFocus en medio de una página
              // con contenido, que sí desorienta.
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>

          <button type="submit" className="button button--primary" disabled={isPending}>
            {isPending ? 'Vinculando…' : `Vincular con ${providerLabel}`}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Cancelar</Link>
        </p>
      </div>
    </div>
  )
}
