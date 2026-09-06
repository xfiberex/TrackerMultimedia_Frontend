import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '@/shared/components/LanguageToggle'
import { useToast } from '@/shared/hooks/useToast'
import { AuthAPI } from '../api/AuthAPI'
import { extractApiError } from '@/shared/utils'

export default function ForgotPasswordView() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const { showToast } = useToast()
  const { t } = useTranslation()

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    try {
      await AuthAPI.forgotPassword({ email })
      showToast({
        tone: 'success',
        message: t('recuperar.aviso'),
      })
      setSubmitted(true)
    } catch (err) {
      setError(extractApiError(err, t('recuperar.error')))
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
            <LanguageToggle />
          </div>

          <h1 className="auth-card__title">{t('recuperar.hechoTitulo')}</h1>
          <p className="auth-card__subtitle">{t('recuperar.hechoSubtitulo')}</p>

          <p className="auth-footer">
            <Link to="/login">{t('comun.volverAlLogin')}</Link>
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
          <LanguageToggle />
        </div>

        <h1 className="auth-card__title">{t('recuperar.titulo')}</h1>
        <p className="auth-card__subtitle">{t('recuperar.subtitulo')}</p>

        {error ? (
          <div className="auth-error" role="alert">
            {error}
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="control">
            <label htmlFor="email">{t('acceso.correo')}</label>
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
            {isPending ? t('recuperar.enviando') : t('recuperar.enviar')}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">{t('comun.volverAlLogin')}</Link>
        </p>
      </div>
    </div>
  )
}
