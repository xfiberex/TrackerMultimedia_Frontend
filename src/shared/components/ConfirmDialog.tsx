import { useEffect, useId, useState } from 'react'
import { useModalDialog } from '../hooks/useModalDialog'

const CONFIRM_DIALOG_EXIT_DURATION_MS = 220

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  isPending?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId()
  const messageId = useId()
  const [isClosing, setIsClosing] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)

  // El cambio de `open` se procesa durante el render, no en un efecto. Con un
  // efecto había un render intermedio con `open` a false e `isClosing` todavía a
  // false: `isRendered` daba false, el diálogo se desmontaba y volvía a montarse
  // al instante para la animación de salida. Eso mandaba el foco al <body> y
  // reiniciaba el formulario durante los milisegundos de la animación.
  //
  // El valor anterior se guarda en estado y no en una ref porque durante el
  // render no se pueden leer refs; es el patrón que documenta React para ajustar
  // estado en respuesta a un cambio de props.
  if (prevOpen !== open) {
    setPrevOpen(open)
    // `open` a true tras un cierre a medias significa reapertura: se cancela.
    setIsClosing(!open)
  }

  const isActuallyClosing = isClosing && !open
  const isRendered = open || isActuallyClosing

  useEffect(() => {
    if (!isActuallyClosing) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setIsClosing(false), CONFIRM_DIALOG_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [isActuallyClosing])

  // Escape, tabulador acotado, foco inicial y devolución del foco al cerrar.
  const dialogRef = useModalDialog({
    open,
    rendered: isRendered,
    closeDisabled: isPending,
    onClose,
  })

  if (!isRendered) {
    return null
  }

  return (
    <div
      className={`confirm-dialog-layer${isActuallyClosing ? ' confirm-dialog-layer--closing' : ''}`}
      role="presentation"
    >
      {/* El fondo cierra al hacer clic, pero no entra en el orden de tabulación:
          quedaba fuera del diálogo, así que el teclado llegaba a él mientras los
          lectores de pantalla lo ocultaban por `aria-modal`. */}
      <div
        className="confirm-dialog-layer__scrim"
        aria-hidden="true"
        onClick={() => {
          if (!isPending) {
            onClose()
          }
        }}
      />

      <section
        ref={dialogRef as React.RefObject<HTMLElement>}
        className={`confirm-dialog${tone === 'danger' ? ' confirm-dialog--danger' : ''}${isActuallyClosing ? ' confirm-dialog--closing' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
      >
        <div className="confirm-dialog__body">
          <h2 id={titleId} className="confirm-dialog__title">
            {title}
          </h2>
          <p id={messageId} className="confirm-dialog__message">
            {message}
          </p>
        </div>

        <div className="confirm-dialog__actions">
          {/* En un diálogo destructivo el foco inicial va a «Cancelar»: quien
              confirma con Intro sin haber leído no debería borrar nada. */}
          <button
            type="button"
            className="button button--ghost"
            onClick={onClose}
            disabled={isPending}
            {...(tone === 'danger' ? { 'data-dialog-autofocus': true } : {})}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button ${tone === 'danger' ? 'button--danger' : 'button--primary'}`}
            onClick={onConfirm}
            disabled={isPending}
            {...(tone === 'danger' ? {} : { 'data-dialog-autofocus': true })}
          >
            {isPending ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
