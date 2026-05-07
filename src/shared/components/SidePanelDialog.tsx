import { useEffect, useRef, useState, type ReactNode } from 'react'

const SIDE_PANEL_EXIT_DURATION_MS = 240

interface SidePanelDialogProps {
  open: boolean
  ariaLabel: string
  scrimLabel?: string
  disableClose?: boolean
  onClose: () => void
  children: ReactNode
}

export default function SidePanelDialog({
  open,
  ariaLabel,
  scrimLabel = 'Cerrar panel',
  disableClose = false,
  onClose,
  children,
}: SidePanelDialogProps) {
  const [isRendered, setIsRendered] = useState(open)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (closeTimeoutRef.current != null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    if (open) {
      setIsRendered(true)
      setIsClosing(false)
      return undefined
    }

    if (!isRendered) {
      return undefined
    }

    setIsClosing(true)
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsRendered(false)
      setIsClosing(false)
      closeTimeoutRef.current = null
    }, SIDE_PANEL_EXIT_DURATION_MS)

    return () => {
      if (closeTimeoutRef.current != null) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [isRendered, open])

  useEffect(() => {
    if (!isRendered) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !disableClose) {
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
  }, [disableClose, isRendered, onClose])

  if (!isRendered) {
    return null
  }

  return (
    <div className={`side-panel-layer${isClosing ? ' side-panel-layer--closing' : ''}`} role="presentation">
      <button
        type="button"
        className="side-panel-layer__scrim"
        aria-label={scrimLabel}
        onClick={() => {
          if (!disableClose) {
            onClose()
          }
        }}
      />

      <aside
        className={`side-panel${isClosing ? ' side-panel--closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <div className="side-panel__content">{children}</div>
      </aside>
    </div>
  )
}