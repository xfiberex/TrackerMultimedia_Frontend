import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import { useToast } from '@/shared/hooks/useToast'
import { AuthAPI } from '../api/AuthAPI'
import { useAuth } from '../context/useAuth'
import { extractApiError } from '@/shared/utils'

export default function ProfileView() {
  const { user, refreshUser, logoutAll } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  // --- Nombre mostrado ---
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [syncedDisplayName, setSyncedDisplayName] = useState(user?.displayName ?? '')

  // Reajuste del campo cuando el usuario cambia (por ejemplo tras refreshUser).
  // Se hace durante el render, que es el patrón que recomienda React: hacerlo en un
  // useEffect provoca un render en cascada, con el campo mostrando el valor viejo
  // durante un fotograma.
  const currentDisplayName = user?.displayName ?? ''
  if (user && currentDisplayName !== syncedDisplayName) {
    setSyncedDisplayName(currentDisplayName)
    setDisplayName(currentDisplayName)
  }

  const [profileError, setProfileError] = useState<string | null>(null)
  const [isProfilePending, setIsProfilePending] = useState(false)

  // --- Cambio de contraseña ---
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [isPwPending, setIsPwPending] = useState(false)

  // --- Sesiones ---
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isLogoutAllPending, setIsLogoutAllPending] = useState(false)

  const handleProfileSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setProfileError(null)
    setIsProfilePending(true)

    try {
      await AuthAPI.updateProfile({ displayName })
      await refreshUser()
      showToast({ tone: 'success', message: 'Perfil actualizado correctamente.' })
    } catch (err) {
      setProfileError(extractApiError(err, 'No se pudo actualizar el perfil.'))
    } finally {
      setIsProfilePending(false)
    }
  }

  const handlePasswordSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setPwError(null)

    if (newPassword !== confirmPassword) {
      setPwError('Las contraseñas nuevas no coinciden.')
      return
    }

    setIsPwPending(true)

    try {
      await AuthAPI.changePassword({ currentPassword, newPassword })
      showToast({ tone: 'success', message: 'Contraseña actualizada correctamente.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError(extractApiError(err, 'No se pudo cambiar la contraseña.'))
    } finally {
      setIsPwPending(false)
    }
  }

  const handleLogoutAll = async () => {
    setIsLogoutAllPending(true)

    try {
      await logoutAll()
      setIsLogoutDialogOpen(false)
      showToast({ tone: 'success', message: 'Se cerraron todas tus sesiones correctamente.' })
      navigate('/login', { replace: true })
    } catch (err) {
      setIsLogoutDialogOpen(false)
      showToast({
        tone: 'danger',
        message: extractApiError(err, 'No se pudieron cerrar todas las sesiones.'),
      })
    } finally {
      setIsLogoutAllPending(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </button>
        <h1>Mi perfil</h1>
      </div>

      <div className="profile-sections">
        {/* Información de cuenta */}
        <section className="profile-card">
          <h2 className="profile-card__title">Información de cuenta</h2>

          <div className="control">
            <label htmlFor="email-readonly">Correo electrónico</label>
            <input
              id="email-readonly"
              type="text"
              className="input input--readonly-ellipsis"
              value={user?.email ?? ''}
              title={user?.email ?? ''}
              readOnly
              disabled
            />
          </div>

          <form className="auth-form" onSubmit={handleProfileSubmit} noValidate>
            <div className="control">
              <label htmlFor="displayName">Nombre mostrado</label>
              <input
                id="displayName"
                type="text"
                className="input"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                }}
                required
                autoComplete="nickname"
              />
            </div>

            {profileError ? <div className="auth-error" role="alert">{profileError}</div> : null}

            <button
              type="submit"
              className="button button--primary"
              disabled={isProfilePending}
            >
              {isProfilePending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        </section>

        {/* Cambio de contraseña */}
        <section className="profile-card">
          <h2 className="profile-card__title">Cambiar contraseña</h2>

          <form className="auth-form" onSubmit={handlePasswordSubmit} noValidate>
            <div className="control">
              <label htmlFor="currentPassword">Contraseña actual</label>
              <input
                id="currentPassword"
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value)
                }}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="control">
              <label htmlFor="newPassword">Nueva contraseña</label>
              <input
                id="newPassword"
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                }}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="control">
              <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                }}
                required
                autoComplete="new-password"
              />
            </div>

            {pwError ? <div className="auth-error" role="alert">{pwError}</div> : null}

            <button
              type="submit"
              className="button button--primary"
              disabled={isPwPending}
            >
              {isPwPending ? 'Actualizando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </section>

        <section className="profile-card">
          <h2 className="profile-card__title">Sesiones</h2>
          <p className="results-subtitle" style={{ marginBottom: '1rem' }}>
            Revoca todos los refresh tokens y fuerza un nuevo inicio de sesión en todos tus dispositivos.
          </p>

          <button
            type="button"
            className="button button--secondary"
            onClick={() => setIsLogoutDialogOpen(true)}
            disabled={isLogoutAllPending}
          >
            {isLogoutAllPending ? 'Cerrando sesiones…' : 'Cerrar todas las sesiones'}
          </button>
        </section>
      </div>

      <ConfirmDialog
        open={isLogoutDialogOpen}
        title="Cerrar todas las sesiones"
        message="Se invalidarán tus refresh tokens y tendrás que iniciar sesión de nuevo en todos tus dispositivos. Usa esta acción cuando sospeches actividad ajena o quieras forzar un reinicio completo."
        confirmLabel="Sí, cerrar todas"
        cancelLabel="Seguir conectado"
        tone="danger"
        isPending={isLogoutAllPending}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={() => void handleLogoutAll()}
      />
    </div>
  )
}
