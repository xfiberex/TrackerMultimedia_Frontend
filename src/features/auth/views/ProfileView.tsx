import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import { useToast } from '@/shared/hooks/useToast'
import { AuthAPI } from '../api/AuthAPI'
import { useAuth } from '../context/useAuth'
import { downloadBlob, extractApiError } from '@/shared/utils'

export default function ProfileView() {
  const { user, refreshUser, logoutAll, deleteAccount } = useAuth()
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

  // --- Descarga de datos ---
  const [isExportPending, setIsExportPending] = useState(false)

  // --- Borrado de cuenta ---
  // La confirmación es doble a propósito: primero se escribe la credencial y solo
  // entonces se habilita el botón que abre el diálogo. Un único clic no puede
  // desencadenar la operación, que es la única del sistema sin vuelta atrás.
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Una cuenta creada con Google o GitHub no tiene contraseña que pedir, así que
  // confirma escribiendo su propia dirección. Misma regla que aplica el backend.
  const requiresPassword = user?.hasPassword ?? true
  const expectedConfirmation = requiresPassword ? null : (user?.email ?? '')
  const canOpenDeleteDialog = requiresPassword
    ? deleteConfirmation.length > 0
    : deleteConfirmation.trim().toLowerCase() === expectedConfirmation!.toLowerCase()

  const handleExportPersonalData = async () => {
    setIsExportPending(true)

    try {
      const { blob, fileName } = await AuthAPI.exportPersonalData()
      downloadBlob(blob, fileName)
      showToast({ tone: 'success', message: 'Se descargó el archivo con tus datos.' })
    } catch (error) {
      showToast({
        tone: 'danger',
        message: extractApiError(error, 'No se pudieron descargar tus datos.'),
      })
    } finally {
      setIsExportPending(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletePending(true)
    setDeleteError(null)

    try {
      await deleteAccount(
        requiresPassword
          ? { password: deleteConfirmation }
          : { confirmationEmail: deleteConfirmation.trim() },
      )
      setIsDeleteDialogOpen(false)
      showToast({ tone: 'success', message: 'Tu cuenta y todos tus datos se han borrado.' })
      navigate('/login', { replace: true })
    } catch (err) {
      // El diálogo se cierra y el error se muestra en el formulario, junto al campo que
      // hay que corregir. Dejarlo dentro del diálogo obligaría a leerlo y cerrarlo para
      // poder tocar el campo.
      setIsDeleteDialogOpen(false)
      setDeleteError(extractApiError(err, 'No se pudo borrar la cuenta.'))
    } finally {
      setIsDeletePending(false)
    }
  }

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
        <button type="button" className="button button--ghost" onClick={() => navigate(-1)}>
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

            {profileError ? (
              <div className="auth-error" role="alert">
                {profileError}
              </div>
            ) : null}

            <button type="submit" className="button button--primary" disabled={isProfilePending}>
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

            {pwError ? (
              <div className="auth-error" role="alert">
                {pwError}
              </div>
            ) : null}

            <button type="submit" className="button button--primary" disabled={isPwPending}>
              {isPwPending ? 'Actualizando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </section>

        <section className="profile-card">
          <h2 className="profile-card__title">Sesiones</h2>
          <p className="results-subtitle" style={{ marginBottom: '1rem' }}>
            Revoca todos los refresh tokens y fuerza un nuevo inicio de sesión en todos tus
            dispositivos.
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

        <section className="profile-card">
          <h2 className="profile-card__title">Descargar mis datos</h2>
          <p className="results-subtitle" style={{ marginBottom: '1rem' }}>
            Un archivo JSON con todo lo que se guarda de ti: los datos de la cuenta, los proveedores
            que tengas vinculados, tus sesiones abiertas, tus formatos y tu biblioteca completa con
            sus categorías. No incluye contraseñas ni tokens.
          </p>

          <button
            type="button"
            className="button button--secondary"
            onClick={() => void handleExportPersonalData()}
            disabled={isExportPending}
          >
            {isExportPending ? 'Preparando la descarga…' : 'Descargar mis datos'}
          </button>
        </section>

        <section className="profile-card">
          <h2 className="profile-card__title">Borrar la cuenta</h2>
          <p className="results-subtitle" style={{ marginBottom: '1rem' }}>
            Se borran tu cuenta y <strong>todo</strong> lo que contiene: tu biblioteca, tus
            categorías, tus formatos y tus sesiones. No hay forma de recuperarlo, y no se envía
            ninguna copia por correo.
          </p>

          <div className="field">
            <label htmlFor="delete-confirmation">
              {requiresPassword
                ? 'Escribe tu contraseña para continuar'
                : `Escribe ${expectedConfirmation} para continuar`}
            </label>
            <input
              id="delete-confirmation"
              type={requiresPassword ? 'password' : 'text'}
              value={deleteConfirmation}
              onChange={(e) => {
                setDeleteConfirmation(e.target.value)
                setDeleteError(null)
              }}
              autoComplete={requiresPassword ? 'current-password' : 'off'}
            />
          </div>

          {deleteError ? (
            <div className="auth-error" role="alert">
              {deleteError}
            </div>
          ) : null}

          <button
            type="button"
            className="button button--danger"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={!canOpenDeleteDialog || isDeletePending}
          >
            {isDeletePending ? 'Borrando…' : 'Borrar mi cuenta'}
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

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Borrar la cuenta definitivamente"
        message="Esto borra tu cuenta y todos tus datos: biblioteca, categorías, formatos y sesiones. La acción no se puede deshacer y no queda ninguna copia."
        confirmLabel="Sí, borrar mi cuenta"
        cancelLabel="Cancelar"
        tone="danger"
        isPending={isDeletePending}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => void handleDeleteAccount()}
      />
    </div>
  )
}
