/**
 * ConfirmEmailView
 *
 * Ruta: /confirm-email?email=...&token=...
 * El backend genera el enlace con estos parámetros en la URL.
 * Esta vista los lee, llama al endpoint de confirmación y muestra el resultado.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '@/shared/components/LanguageToggle'
import { useToast } from '@/shared/hooks/useToast'
import { AuthAPI } from '../api/AuthAPI'

type Status = 'pending' | 'success' | 'error'

export default function ConfirmEmailView() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<Status>('pending')
  const [message, setMessage] = useState('')
  const called = useRef(false)
  const { showToast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    if (called.current) return
    called.current = true

    const email = searchParams.get('email') ?? ''
    const token = searchParams.get('token') ?? ''

    const doConfirm =
      !email || !token
        ? Promise.reject(new Error('invalid_params'))
        : AuthAPI.confirmEmail({ email, token })

    doConfirm
      .then((res) => {
        setMessage(res.message)
        showToast({ tone: 'success', message: res.message })
        setStatus('success')
      })
      .catch(() => {
        setMessage(t('confirmacion.enlaceInvalido'))
        setStatus('error')
      })

    return () => {
      called.current = false
    }
  }, [searchParams, showToast, t])

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand__title">TrackerMultimedia</span>
          <LanguageToggle />
        </div>

        {status === 'pending' && (
          <>
            <h1 className="auth-card__title">{t('confirmacion.confirmando')}</h1>
            <p className="auth-card__subtitle">{t('confirmacion.espera')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="auth-card__title">{t('confirmacion.hechoTitulo')}</h1>
            <p className="auth-card__subtitle">{message}</p>
            <p className="auth-footer">
              <Link
                to="/login"
                className="button button--primary"
                style={{ display: 'inline-block', marginTop: '1rem' }}
              >
                {t('acceso.entrar')}
              </Link>
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="auth-card__title">{t('confirmacion.errorTitulo')}</h1>
            <div className="auth-error" role="alert">
              {message}
            </div>
            <p className="auth-footer">
              <Link to="/resend-confirmation">{t('confirmacion.nuevoEnlace')}</Link>
            </p>
            <p className="auth-footer">
              <Link to="/login">{t('comun.volverAlLogin')}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
