import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ShowToastOptions, type ToastTone } from '@/shared/context/ToastContext'

const TOAST_EXIT_DURATION_MS = 220

interface ToastRecord extends ShowToastOptions {
  id: number
  tone: ToastTone
  isClosing: boolean
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextIdRef = useRef(1)
  const dismissTimeoutIdsRef = useRef<Map<number, number>>(new Map())
  const removalTimeoutIdsRef = useRef<Map<number, number>>(new Map())

  const removeToastImmediately = (toastId: number) => {
    const dismissTimeoutId = dismissTimeoutIdsRef.current.get(toastId)
    const removalTimeoutId = removalTimeoutIdsRef.current.get(toastId)

    if (dismissTimeoutId) {
      window.clearTimeout(dismissTimeoutId)
      dismissTimeoutIdsRef.current.delete(toastId)
    }

    if (removalTimeoutId) {
      window.clearTimeout(removalTimeoutId)
      removalTimeoutIdsRef.current.delete(toastId)
    }

    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }

  const closeToast = (toastId: number) => {
    if (removalTimeoutIdsRef.current.has(toastId)) {
      return
    }

    const dismissTimeoutId = dismissTimeoutIdsRef.current.get(toastId)

    if (dismissTimeoutId) {
      window.clearTimeout(dismissTimeoutId)
      dismissTimeoutIdsRef.current.delete(toastId)
    }

    setToasts((current) =>
      current.map((toast) => (toast.id === toastId ? { ...toast, isClosing: true } : toast)),
    )

    const removalTimeoutId = window.setTimeout(() => {
      removeToastImmediately(toastId)
    }, TOAST_EXIT_DURATION_MS)

    removalTimeoutIdsRef.current.set(toastId, removalTimeoutId)
  }

  useEffect(() => {
    // Guardar referencias locales para evitar cambios durante cleanup
    const dismissTimeouts = dismissTimeoutIdsRef.current
    const removalTimeouts = removalTimeoutIdsRef.current

    return () => {
      dismissTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
      dismissTimeouts.clear()
      removalTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
      removalTimeouts.clear()
    }
  }, [])

  const showToast = ({ durationMs = 4200, title, message, tone = 'info' }: ShowToastOptions) => {
    const toastId = nextIdRef.current
    nextIdRef.current += 1

    setToasts((current) => [
      ...current,
      {
        id: toastId,
        title,
        message,
        tone,
        isClosing: false,
      },
    ])

    const timeoutId = window.setTimeout(() => {
      closeToast(toastId)
    }, durationMs)

    dismissTimeoutIdsRef.current.set(toastId, timeoutId)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <section
            key={toast.id}
            className={`toast toast--${toast.tone}${toast.isClosing ? ' toast--closing' : ''}`}
            role={toast.tone === 'danger' ? 'alert' : 'status'}
          >
            <div className="toast__body">
              {toast.title ? <p className="toast__title">{toast.title}</p> : null}
              <p className="toast__message">{toast.message}</p>
            </div>

            <button
              type="button"
              className="button button--ghost toast__dismiss"
              aria-label="Cerrar notificación"
              onClick={() => closeToast(toast.id)}
            >
              Cerrar
            </button>
          </section>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
