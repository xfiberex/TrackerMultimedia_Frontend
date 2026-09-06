import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import LanguageToggle from '@/shared/components/LanguageToggle'
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
  const { t } = useTranslation()

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/library', { replace: true })
    }
  }, [user, isLoading, navigate])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError(t('registro.noCoinciden'))
      return
    }

    setIsPending(true)

    try {
      await register({ email, password, displayName: displayName.trim() || undefined })
      setRegistered(true)
    } catch (err) {
      setError(extractApiError(err, t('registro.noSePudoCrear')))
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
      setError(extractApiError(err, t('oauth.noSePudoIniciar', { proveedor: provider })))
      setOAuthPending(null)
    }
  }

  if (registered) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand__title">TrackerMultimedia</span>
            <LanguageToggle />
          </div>
          <h1 className="auth-card__title">{t('registro.hechoTitulo')}</h1>
          {/* `Trans` y no `t`: el correo va dentro de la frase y en negrita. Partir el
              texto en tres trozos para intercalar el <strong> ata el orden de las
              palabras al español, y en otro idioma la frase puede colocarlo en otro
              sitio. Así el traductor mueve `<destacado>` dentro de su propia frase. */}
          <p className="auth-card__subtitle">
            <Trans
              i18nKey="registro.hechoSubtitulo"
              values={{ correo: email }}
              components={{ destacado: <strong /> }}
            />
          </p>
          <p className="auth-footer">
            <Link to="/resend-confirmation">{t('registro.hechoNoRecibiste')}</Link>
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

        <h1 className="auth-card__title">{t('registro.titulo')}</h1>
        <p className="auth-card__subtitle">{t('registro.subtitulo')}</p>

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
                  {oauthPending === 'google' ? t('oauth.redirigiendo') : t('oauth.conGoogle')}
                </button>
              )}
              {methods?.gitHubEnabled && (
                <button
                  type="button"
                  className="button button--secondary oauth-button"
                  disabled={oauthPending !== null}
                  onClick={() => handleOAuth('github')}
                >
                  {oauthPending === 'github' ? t('oauth.redirigiendo') : t('oauth.conGitHub')}
                </button>
              )}
            </div>

            <div className="auth-divider">
              <span>{t('registro.separador')}</span>
            </div>
          </>
        )}

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

          <div className="control">
            <label htmlFor="displayName">
              {t('registro.nombreVisible')}{' '}
              <span className="control__optional">{t('registro.opcional')}</span>
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
            <label htmlFor="password">{t('acceso.contrasena')}</label>
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
            <label htmlFor="confirm">{t('registro.confirmarContrasena')}</label>
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
            {isPending ? t('registro.creando') : t('registro.crear')}
          </button>
        </form>

        <p className="auth-footer">
          {t('registro.yaTienesCuenta')} <Link to="/login">{t('registro.iniciaSesion')}</Link>
        </p>
      </div>
    </div>
  )
}
