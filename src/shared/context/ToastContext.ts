import { createContext } from 'react'

export type ToastTone = 'info' | 'success' | 'danger'

export interface ShowToastOptions {
  title?: string
  message: string
  tone?: ToastTone
  durationMs?: number
}

export interface ToastContextValue {
  showToast: (options: ShowToastOptions) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
