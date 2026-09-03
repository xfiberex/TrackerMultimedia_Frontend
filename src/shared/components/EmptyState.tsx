import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  message: string
  action?: ReactNode
}

export default function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__text">{message}</p>
      {action}
    </section>
  )
}
