interface LoaderProps {
  title?: string
  message?: string
}

export default function Loader({
  title = 'Cargando TrackerMultimedia',
  message = 'Preparando biblioteca, métricas y resultados para ti.',
}: LoaderProps) {
  return (
    <section className="loader">
      <div className="spinner" aria-hidden="true" />
      <h2 className="loader__title">{title}</h2>
      <p className="loader__text">{message}</p>
    </section>
  )
}