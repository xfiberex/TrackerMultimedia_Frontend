/**
 * ResendConfirmationView
 *
 * Ruta: /resend-confirmation
 * Permite al usuario solicitar un nuevo correo de confirmación si el primero expiró.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/shared/hooks/useToast'
import { AuthAPI } from '../api/AuthAPI'
import { extractApiError } from '@/shared/utils'

export default function ResendConfirmationView() {
  const [email, setEmail] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    try {
      await AuthAPI.resendConfirmation({ email })
      showToast({
        tone: 'success',
        message: `Si existe una cuenta sin confirmar para ${email}, enviaremos un nuevo enlace.`,
      })
      setSent(true)
    } catch (err) {
      setError(extractApiError(err, 'No se pudo enviar el correo. Inténtalo más tarde.'))
    } finally {
      setIsPending(false)
    }
  }

  if (sent) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand__title">TrackerMultimedia</span>
          </div>
          <h1 className="auth-card__title">Correo enviado</h1>
          <p className="auth-card__subtitle">
            Si existe una cuenta sin confirmar para <strong>{email}</strong>, recibirás el enlace de
            confirmación.
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

        <h1 className="auth-card__title">Reenviar confirmación</h1>
        <p className="auth-card__subtitle">
          Ingresa tu correo y te enviaremos un nuevo enlace de confirmación.
        </p>

        {error ? (
          <div className="auth-error" role="alert">
            {error}
          </div>
        ) : null}

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

          <button type="submit" className="button button--primary" disabled={isPending}>
            {isPending ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}
