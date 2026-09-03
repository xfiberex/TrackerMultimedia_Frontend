import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthAPI } from '../api/AuthAPI'
import { extractApiError } from '@/shared/utils'

export default function ResetPasswordView() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsPending(true)

    try {
      await AuthAPI.resetPassword({ email, token, newPassword })
      navigate('/login', {
        state: { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' },
      })
    } catch (err) {
      setError(extractApiError(err, 'El enlace de recuperación no es válido o ha expirado.'))
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

        <h1 className="auth-card__title">Nueva contraseña</h1>
        <p className="auth-card__subtitle">Introduce tu nueva contraseña.</p>

        {error ? (
          <div className="auth-error" role="alert">
            {error}
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email y token se rellenan desde URL; se muestran como ocultos/readonly */}
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
              readOnly={!!searchParams.get('email')}
            />
          </div>

          {!searchParams.get('token') && (
            <div className="control">
              <label htmlFor="token">Código de recuperación</label>
              <input
                id="token"
                type="text"
                className="input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
          )}

          <div className="control">
            <label htmlFor="newPassword">Nueva contraseña</label>
            <input
              id="newPassword"
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              // Página de un solo propósito: el formulario ES el contenido, así que
              // llevar el foco a su primer campo no se salta nada que el usuario
              // necesite antes. La regla apunta al autoFocus en medio de una página
              // con contenido, que sí desorienta.
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>

          <div className="control">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="button button--primary" disabled={isPending}>
            {isPending ? 'Actualizando…' : 'Establecer nueva contraseña'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}
