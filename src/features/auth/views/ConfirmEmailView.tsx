/**
 * ConfirmEmailView
 *
 * Ruta: /confirm-email?email=...&token=...
 * El backend genera el enlace con estos parámetros en la URL.
 * Esta vista los lee, llama al endpoint de confirmación y muestra el resultado.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useToast } from '@/shared/components/ToastProvider'
import { AuthAPI } from '../api/AuthAPI'

type Status = 'pending' | 'success' | 'error'

export default function ConfirmEmailView() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<Status>('pending')
  const [message, setMessage] = useState('')
  const called = useRef(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (called.current) return
    called.current = true

    const email = searchParams.get('email') ?? ''
    const token = searchParams.get('token') ?? ''

    const doConfirm = !email || !token
      ? Promise.reject(new Error('invalid_params'))
      : AuthAPI.confirmEmail({ email, token })

    doConfirm
      .then((res) => {
        setMessage(res.message)
        showToast({ tone: 'success', message: res.message })
        setStatus('success')
      })
      .catch(() => {
        setMessage('El enlace de confirmación no es válido o ha expirado.')
        setStatus('error')
      })

    return () => { called.current = false }
  }, [searchParams, showToast])

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand__title">TrackerMultimedia</span>
        </div>

        {status === 'pending' && (
          <>
            <h1 className="auth-card__title">Confirmando cuenta…</h1>
            <p className="auth-card__subtitle">Por favor espera un momento.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="auth-card__title">¡Cuenta confirmada!</h1>
            <p className="auth-card__subtitle">{message}</p>
            <p className="auth-footer">
              <Link to="/login" className="button button--primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
                Iniciar sesión
              </Link>
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="auth-card__title">Enlace no válido</h1>
            <div className="auth-error" role="alert">{message}</div>
            <p className="auth-footer">
              <Link to="/resend-confirmation">Solicitar un nuevo enlace</Link>
            </p>
            <p className="auth-footer">
              <Link to="/login">Volver al inicio de sesión</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
