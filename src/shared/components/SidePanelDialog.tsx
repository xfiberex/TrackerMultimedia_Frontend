import { useEffect, useRef, useState, type ReactNode } from 'react'

const SIDE_PANEL_EXIT_DURATION_MS = 240

interface SidePanelDialogProps {
  open: boolean
  ariaLabel: string
  scrimLabel?: string
  disableClose?: boolean
  variant?: 'side' | 'centered'
  onClose: () => void
  children: ReactNode
}

export default function SidePanelDialog({
  open,
  ariaLabel,
  scrimLabel = 'Cerrar panel',
  disableClose = false,
  variant = 'side',
  onClose,
  children,
}: SidePanelDialogProps) {
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
    }, SIDE_PANEL_EXIT_DURATION_MS)

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

  const isCentered = variant === 'centered'
  const layerClass = [
    'side-panel-layer',
    isCentered ? 'side-panel-layer--centered' : '',
    isActuallyClosing ? 'side-panel-layer--closing' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={layerClass} role="presentation">
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
        className={`side-panel${isActuallyClosing ? ' side-panel--closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <div className="side-panel__content">{children}</div>
      </aside>
    </div>
  )
}
