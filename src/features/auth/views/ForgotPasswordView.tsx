import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/shared/hooks/useToast'
import { AuthAPI } from '../api/AuthAPI'
import { extractApiError } from '@/shared/utils'

export default function ForgotPasswordView() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const { showToast } = useToast()

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    try {
      await AuthAPI.forgotPassword({ email })
      showToast({
        tone: 'success',
        message: 'Si el correo existe, te enviaremos instrucciones para recuperar tu cuenta.',
      })
      setSubmitted(true)
    } catch (err) {
      setError(extractApiError(err, 'No se pudo procesar la solicitud. Inténtalo de nuevo.'))
    } finally {
      setIsPending(false)
    }
  }

  if (submitted) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand__title">TrackerMultimedia</span>
          </div>

          <h1 className="auth-card__title">Revisa tu correo</h1>
          <p className="auth-card__subtitle">
            Si ese correo está registrado, recibirás las instrucciones para recuperar tu cuenta.
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

        <h1 className="auth-card__title">Recuperar contraseña</h1>
        <p className="auth-card__subtitle">
          Introduce tu correo y te enviaremos las instrucciones.
        </p>

        {error ? <div className="auth-error" role="alert">{error}</div> : null}

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

          <button
            type="submit"
            className="button button--primary"
            disabled={isPending}
          >
            {isPending ? 'Enviando…' : 'Enviar instrucciones'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}
