/**
 * ResendConfirmationView
 *
 * Ruta: /resend-confirmation
 * Permite al usuario solicitar un nuevo correo de confirmación si el primero expiró.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import LanguageToggle from '@/shared/components/LanguageToggle'
import { useToast } from '@/shared/hooks/useToast'
import { AuthAPI } from '../api/AuthAPI'
import { extractApiError } from '@/shared/utils'

export default function ResendConfirmationView() {
  const [email, setEmail] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()
  const { t } = useTranslation()

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    try {
      await AuthAPI.resendConfirmation({ email })
      showToast({
        tone: 'success',
        message: t('reenvio.aviso', { correo: email }),
      })
      setSent(true)
    } catch (err) {
      setError(extractApiError(err, t('reenvio.error')))
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
            <LanguageToggle />
          </div>
          <h1 className="auth-card__title">{t('reenvio.hechoTitulo')}</h1>
          <p className="auth-card__subtitle">
            <Trans
              i18nKey="reenvio.hechoSubtitulo"
              values={{ correo: email }}
              components={{ destacado: <strong /> }}
            />
          </p>
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

        <h1 className="auth-card__title">{t('reenvio.titulo')}</h1>
        <p className="auth-card__subtitle">{t('reenvio.subtitulo')}</p>

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
            {isPending ? t('reenvio.enviando') : t('reenvio.enviar')}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">{t('comun.volverAlLogin')}</Link>
        </p>
      </div>
    </div>
  )
}
