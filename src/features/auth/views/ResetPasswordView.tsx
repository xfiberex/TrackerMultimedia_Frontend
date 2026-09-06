import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '@/shared/components/LanguageToggle'
import { AuthAPI } from '../api/AuthAPI'
import { extractApiError } from '@/shared/utils'

export default function ResetPasswordView() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

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
      setError(t('registro.noCoinciden'))
      return
    }

    setIsPending(true)

    try {
      await AuthAPI.resetPassword({ email, token, newPassword })
      navigate('/login', {
        state: { message: t('nuevaContrasena.hecho') },
      })
    } catch (err) {
      setError(extractApiError(err, t('nuevaContrasena.enlaceInvalido')))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand__title">TrackerMultimedia</span>
          <LanguageToggle />
        </div>

        <h1 className="auth-card__title">{t('nuevaContrasena.titulo')}</h1>
        <p className="auth-card__subtitle">{t('nuevaContrasena.subtitulo')}</p>

        {error ? (
          <div className="auth-error" role="alert">
            {error}
          </div>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email y token se rellenan desde URL; se muestran como ocultos/readonly */}
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
              readOnly={!!searchParams.get('email')}
            />
          </div>

          {!searchParams.get('token') && (
            <div className="control">
              <label htmlFor="token">{t('nuevaContrasena.codigo')}</label>
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
            <label htmlFor="newPassword">{t('nuevaContrasena.nueva')}</label>
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
            <label htmlFor="confirmPassword">{t('nuevaContrasena.confirmar')}</label>
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
            {isPending ? t('nuevaContrasena.actualizando') : t('nuevaContrasena.establecer')}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">{t('comun.volverAlLogin')}</Link>
        </p>
      </div>
    </div>
  )
}
