import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const TOAST_EXIT_DURATION_MS = 220

export type ToastTone = 'info' | 'success' | 'danger'

interface ShowToastOptions {
  title?: string
  message: string
  tone?: ToastTone
  durationMs?: number
}

interface ToastRecord extends ShowToastOptions {
  id: number
  tone: ToastTone
  isClosing: boolean
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

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

    setToasts((current) => current.map((toast) => (
      toast.id === toastId ? { ...toast, isClosing: true } : toast
    )))

    const removalTimeoutId = window.setTimeout(() => {
      removeToastImmediately(toastId)
    }, TOAST_EXIT_DURATION_MS)

    removalTimeoutIdsRef.current.set(toastId, removalTimeoutId)
  }

  useEffect(() => {
    return () => {
      dismissTimeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      dismissTimeoutIdsRef.current.clear()
      removalTimeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      removalTimeoutIdsRef.current.clear()
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

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider.')
  }

  return context
}