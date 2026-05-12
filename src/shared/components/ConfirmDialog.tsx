import { useEffect, useId, useRef, useState } from 'react'

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
  const [isClosing, setIsClosing] = useState(false)
  const isActuallyClosing = isClosing && !open
  const isRendered = open || isActuallyClosing
  const closeTimeoutRef = useRef<number | null>(null)
  const prevOpenRef = useRef(open)

  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open

    if (open || !wasOpen) {
      return undefined
    }

    setIsClosing(true)
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsClosing(false)
      closeTimeoutRef.current = null
    }, CONFIRM_DIALOG_EXIT_DURATION_MS)

    return () => {
      if (closeTimeoutRef.current != null) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [open])

  useEffect(() => {
    if (!isRendered) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPending, isRendered, onClose])

  if (!isRendered) {
    return null
  }

  return (
    <div className={`confirm-dialog-layer${isActuallyClosing ? ' confirm-dialog-layer--closing' : ''}`} role="presentation">
      <button
        type="button"
        className="confirm-dialog-layer__scrim"
        aria-label="Cerrar confirmación"
        onClick={() => {
          if (!isPending) {
            onClose()
          }
        }}
      />

      <section
        className={`confirm-dialog${tone === 'danger' ? ' confirm-dialog--danger' : ''}${isActuallyClosing ? ' confirm-dialog--closing' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="confirm-dialog__body">
          <h2 id={titleId} className="confirm-dialog__title">{title}</h2>
          <p className="confirm-dialog__message">{message}</p>
        </div>

        <div className="confirm-dialog__actions">
          <button type="button" className="button button--ghost" onClick={onClose} disabled={isPending}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button ${tone === 'danger' ? 'button--danger' : 'button--primary'}`}
            onClick={onConfirm}
            disabled={isPending}
            autoFocus
          >
            {isPending ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}