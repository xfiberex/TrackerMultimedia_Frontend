import { useEffect, useRef } from 'react'

/**
 * Selector de lo que el navegador considera enfocable con el tabulador.
 * Se consulta en cada pulsación en vez de cachearse: el contenido de un diálogo
 * cambia mientras está abierto (botones que se deshabilitan al enviar un
 * formulario, campos que aparecen al elegir una opción), y una lista cacheada
 * dejaría el foco atrapado en un elemento que ya no lo admite.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Descarta lo que casa con el selector pero está oculto, por ejemplo dentro de
 * una sección colapsada con `display: none`.
 *
 * Deliberadamente **no** se usa `offsetParent !== null`, que es la comprobación
 * habitual y aquí sería un error: `offsetParent` también es `null` para cualquier
 * elemento dentro de un contenedor `position: fixed`, que es justo lo que es un
 * diálogo modal. Con ese filtro la lista salía vacía siempre y la trampa de foco
 * no llegaba a existir.
 */
function isVisible(element: HTMLElement): boolean {
  return typeof element.checkVisibility === 'function' ? element.checkVisibility() : true
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible)
}

const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]'

/**
 * Último elemento que tuvo el foco fuera de cualquier diálogo.
 *
 * Hace falta porque no basta con leer `document.activeElement` al abrir: React
 * aplica `autoFocus` durante el commit, **antes** de que corran los efectos, y
 * varios formularios de la aplicación autoenfocan su primer campo. Para cuando
 * este hook mira quién tenía el foco, ya lo tiene un campo de dentro del propio
 * diálogo, y al cerrarse ese campo ya no existe: el foco se perdía al <body>.
 *
 * El listener se instala al importar el módulo, que ocurre al cargar la
 * aplicación, mucho antes de que se pueda abrir ningún diálogo. Va en fase de
 * captura para no depender de que nadie detenga la propagación.
 */
let lastFocusOutsideDialog: HTMLElement | null = null

if (typeof document !== 'undefined') {
  document.addEventListener(
    'focusin',
    (event) => {
      const target = event.target
      if (target instanceof HTMLElement && !target.closest(DIALOG_SELECTOR)) {
        lastFocusOutsideDialog = target
      }
    },
    true,
  )
}

interface UseModalDialogOptions {
  /** El diálogo está abierto de cara al usuario. Gobierna foco y tecla Escape. */
  open: boolean
  /**
   * El diálogo sigue en el DOM. Durante la animación de salida es `true` con
   * `open` a `false`: el bloqueo del scroll debe durar hasta que desaparezca,
   * o la barra reaparece a mitad de la animación y el fondo pega un salto.
   */
  rendered: boolean
  /** Cerrar por Escape o por el fondo. Se desactiva mientras hay una operación en curso. */
  closeDisabled?: boolean
  onClose: () => void
}

/**
 * Implementa el patrón de diálogo modal de ARIA APG: foco inicial dentro del
 * diálogo, tabulador acotado a su contenido y devolución del foco al cerrarse.
 *
 * Devuelve la referencia que hay que colocar en el elemento con `role="dialog"`.
 * Ese elemento necesita `tabIndex={-1}` para poder recibir el foco cuando no
 * contiene ningún control enfocable.
 *
 * Para elegir qué recibe el foco al abrir, marca un control con
 * `data-dialog-autofocus`. Si no hay ninguno, se enfoca el primer elemento
 * enfocable, y si tampoco lo hay, el propio diálogo.
 */
export function useModalDialog({
  open,
  rendered,
  closeDisabled = false,
  onClose,
}: UseModalDialogOptions) {
  const containerRef = useRef<HTMLElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  // ── Foco inicial y devolución ──────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const container = containerRef.current
    if (!container) {
      return undefined
    }

    const activeElement = document.activeElement
    const activeIsOutside =
      activeElement instanceof HTMLElement && !container.contains(activeElement)
    previouslyFocusedRef.current = activeIsOutside ? activeElement : lastFocusOutsideDialog

    const preferred = container.querySelector<HTMLElement>('[data-dialog-autofocus]')
    const target = preferred ?? getFocusableElements(container)[0] ?? container
    target.focus()

    return () => {
      const toRestore = previouslyFocusedRef.current
      previouslyFocusedRef.current = null

      // Si quien lo abrió ya no está en el documento, no hay a dónde volver.
      if (!toRestore || !toRestore.isConnected) {
        return
      }

      // Se devuelve el foco en dos situaciones: si sigue dentro del diálogo, y si
      // se ha quedado sin dueño. Lo segundo pasa de verdad: cuando desaparece el
      // elemento que lo tenía, el navegador lo deja en el <body>, y ahí el
      // tabulador reempieza desde el principio de la página. Lo que no se hace es
      // robárselo a un elemento que lo haya recibido legítimamente.
      const active = document.activeElement
      const focoPerdido = active === null || active === document.body
      if (focoPerdido || container.contains(active)) {
        toRestore.focus()
      }
    }
  }, [open])

  // ── Escape y tabulador acotado ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!closeDisabled) {
          onClose()
        }
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const container = containerRef.current
      if (!container) {
        return
      }

      const focusable = getFocusableElements(container)
      if (focusable.length === 0) {
        // Sin nada que enfocar dentro, el tabulador no debe llevar al fondo.
        event.preventDefault()
        container.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      // El caso de `!container.contains(active)` no es teórico: basta con que el
      // usuario haga clic en el fondo, o que se elimine el elemento que tenía el foco.
      if (!container.contains(active)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
        return
      }

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, closeDisabled, onClose])

  // ── Bloqueo del scroll del fondo ───────────────────────────────────────────
  useEffect(() => {
    if (!rendered) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [rendered])

  return containerRef
}
