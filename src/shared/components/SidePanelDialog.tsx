import { useEffect, useState, type ReactNode } from 'react'
import { useModalDialog } from '../hooks/useModalDialog'

const SIDE_PANEL_EXIT_DURATION_MS = 240

interface SidePanelDialogProps {
  open: boolean
  ariaLabel: string
  disableClose?: boolean
  variant?: 'side' | 'centered'
  onClose: () => void
  children: ReactNode
}

export default function SidePanelDialog({
  open,
  ariaLabel,
  disableClose = false,
  variant = 'side',
  onClose,
  children,
}: SidePanelDialogProps) {
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

    const timeoutId = window.setTimeout(() => setIsClosing(false), SIDE_PANEL_EXIT_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [isActuallyClosing])

  // Escape, tabulador acotado, foco inicial y devolución del foco al cerrar.
  const dialogRef = useModalDialog({
    open,
    rendered: isRendered,
    closeDisabled: disableClose,
    onClose,
  })

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
      {/*
        El fondo cierra al hacer clic, pero no es un control de teclado: era un
        <button> enfocable situado fuera del diálogo, así que el tabulador llegaba
        a él mientras los lectores de pantalla lo ocultaban por `aria-modal`. Quien
        usa teclado cierra con Escape o con el botón de cerrar del propio panel.
      */}
      <div
        className="side-panel-layer__scrim"
        aria-hidden="true"
        onClick={() => {
          if (!disableClose) {
            onClose()
          }
        }}
      />

      <aside
        ref={dialogRef as React.RefObject<HTMLElement>}
        className={`side-panel${isActuallyClosing ? ' side-panel--closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        <div className="side-panel__content">{children}</div>
      </aside>
    </div>
  )
}
