import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import { useToast } from '@/shared/hooks/useToast'
import { AuthAPI } from '../api/AuthAPI'
import { useAuth } from '../context/useAuth'
import { downloadBlob, extractApiError } from '@/shared/utils'

export default function ProfileView() {
  const { user, refreshUser, logoutAll, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useTranslation()

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
      showToast({ tone: 'success', message: t('perfil.datosHecho') })
    } catch (error) {
      showToast({
        tone: 'danger',
        message: extractApiError(error, t('perfil.datosError')),
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
      showToast({ tone: 'success', message: t('perfil.borradoHecho') })
      navigate('/login', { replace: true })
    } catch (err) {
      // El diálogo se cierra y el error se muestra en el formulario, junto al campo que
      // hay que corregir. Dejarlo dentro del diálogo obligaría a leerlo y cerrarlo para
      // poder tocar el campo.
      setIsDeleteDialogOpen(false)
      setDeleteError(extractApiError(err, t('perfil.borradoError')))
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
      showToast({ tone: 'success', message: t('perfil.perfilActualizado') })
    } catch (err) {
      setProfileError(extractApiError(err, t('perfil.perfilError')))
    } finally {
      setIsProfilePending(false)
    }
  }

  const handlePasswordSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setPwError(null)

    if (newPassword !== confirmPassword) {
      setPwError(t('perfil.contrasenaNoCoinciden'))
      return
    }

    setIsPwPending(true)

    try {
      await AuthAPI.changePassword({ currentPassword, newPassword })
      showToast({ tone: 'success', message: t('perfil.contrasenaHecha') })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError(extractApiError(err, t('perfil.contrasenaError')))
    } finally {
      setIsPwPending(false)
    }
  }

  const handleLogoutAll = async () => {
    setIsLogoutAllPending(true)

    try {
      await logoutAll()
      setIsLogoutDialogOpen(false)
      showToast({ tone: 'success', message: t('perfil.sesionesHecho') })
      navigate('/login', { replace: true })
    } catch (err) {
      setIsLogoutDialogOpen(false)
      showToast({
        tone: 'danger',
        message: extractApiError(err, t('perfil.sesionesError')),
      })
    } finally {
      setIsLogoutAllPending(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <button type="button" className="button button--ghost" onClick={() => navigate(-1)}>
          {t('perfil.volver')}
        </button>
        <h1>{t('perfil.titulo')}</h1>
      </div>

      <div className="profile-sections">
        {/* Información de cuenta */}
        <section className="profile-card">
          <h2 className="profile-card__title">{t('perfil.cuentaTitulo')}</h2>

          <div className="control">
            <label htmlFor="email-readonly">{t('acceso.correo')}</label>
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
              <label htmlFor="displayName">{t('perfil.nombreMostrado')}</label>
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
              {isProfilePending ? t('comun.guardando') : t('perfil.guardarCambios')}
            </button>
          </form>
        </section>

        {/* Cambio de contraseña */}
        <section className="profile-card">
          <h2 className="profile-card__title">{t('perfil.contrasenaTitulo')}</h2>

          <form className="auth-form" onSubmit={handlePasswordSubmit} noValidate>
            <div className="control">
              <label htmlFor="currentPassword">{t('perfil.contrasenaActual')}</label>
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
              <label htmlFor="newPassword">{t('perfil.contrasenaNueva')}</label>
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
              <label htmlFor="confirmPassword">{t('perfil.contrasenaConfirmar')}</label>
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
              {isPwPending ? t('perfil.contrasenaActualizando') : t('perfil.contrasenaCambiar')}
            </button>
          </form>
        </section>

        <section className="profile-card">
          <h2 className="profile-card__title">{t('perfil.sesionesTitulo')}</h2>
          <p className="results-subtitle" style={{ marginBottom: '1rem' }}>
            {t('perfil.sesionesTexto')}
          </p>

          <button
            type="button"
            className="button button--secondary"
            onClick={() => setIsLogoutDialogOpen(true)}
            disabled={isLogoutAllPending}
          >
            {isLogoutAllPending ? t('perfil.sesionesCerrando') : t('perfil.sesionesCerrarTodas')}
          </button>
        </section>

        <section className="profile-card">
          <h2 className="profile-card__title">{t('perfil.datosTitulo')}</h2>
          <p className="results-subtitle" style={{ marginBottom: '1rem' }}>
            {t('perfil.datosTexto')}
          </p>

          <button
            type="button"
            className="button button--secondary"
            onClick={() => void handleExportPersonalData()}
            disabled={isExportPending}
          >
            {isExportPending ? t('perfil.datosPreparando') : t('perfil.datosDescargar')}
          </button>
        </section>

        <section className="profile-card">
          <h2 className="profile-card__title">{t('perfil.borradoTitulo')}</h2>
          <p className="results-subtitle" style={{ marginBottom: '1rem' }}>
            <Trans i18nKey="perfil.borradoTexto" components={{ destacado: <strong /> }} />
          </p>

          {/* Este bloque acumuló tres defectos de presentación, los tres invisibles para
              las pruebas de comportamiento y los tres vistos a simple vista:
              - `field` en vez de `control`, una clase que no existe en el CSS, así que la
                etiqueta y su campo salían pegados en la misma línea (T5-09);
              - el campo sin `className="input"`, con lo que el navegador pintaba su
                control nativo en medio de una pantalla que usa el del sistema de diseño;
              - y sin contenedor: las otras cuatro tarjetas separan sus elementos con el
                `gap` de `.auth-form`, y esta no es un formulario —no se envía, abre un
                diálogo—, así que el botón quedaba pegado al campo.
              `profile-danger` da ese mismo ritmo sin fingir un formulario, y
              `form-controls.test.ts` vigila desde ahora el segundo de los tres. */}
          <div className="profile-danger">
            <div className="control">
              <label htmlFor="delete-confirmation">
                {requiresPassword
                  ? t('perfil.borradoPideContrasena')
                  : // `expectedConfirmation` es `string | null`, y solo en esta rama se
                    // sabe que no es nulo. El texto anterior lo interpolaba con una
                    // plantilla, que habría escrito «Escribe null para continuar».
                    t('perfil.borradoPideCorreo', { correo: expectedConfirmation ?? '' })}
              </label>
              <input
                id="delete-confirmation"
                className="input"
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
              className="button button--danger profile-danger__accion"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={!canOpenDeleteDialog || isDeletePending}
            >
              {isDeletePending ? t('perfil.borradoEnCurso') : t('perfil.borradoBoton')}
            </button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={isLogoutDialogOpen}
        title={t('perfil.sesionesDialogoTitulo')}
        message={t('perfil.sesionesDialogoMensaje')}
        confirmLabel={t('perfil.sesionesDialogoConfirmar')}
        cancelLabel={t('perfil.sesionesDialogoCancelar')}
        tone="danger"
        isPending={isLogoutAllPending}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={() => void handleLogoutAll()}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title={t('perfil.borradoDialogoTitulo')}
        message={t('perfil.borradoDialogoMensaje')}
        confirmLabel={t('perfil.borradoDialogoConfirmar')}
        cancelLabel={t('comun.cancelar')}
        tone="danger"
        isPending={isDeletePending}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => void handleDeleteAccount()}
      />
    </div>
  )
}
