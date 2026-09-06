import { useTranslation } from 'react-i18next'

interface LoaderProps {
  title?: string
  message?: string
}

export default function Loader({ title, message }: LoaderProps) {
  // Los valores por defecto se resuelven dentro del componente y no en la firma: un
  // parámetro por defecto se evalúa una vez por render, sí, pero escrito en la firma no
  // tendría acceso a `t` y volvería a dejar los textos incrustados.
  const { t } = useTranslation()

  return (
    <section className="loader">
      <div className="spinner" aria-hidden="true" />
      <h2 className="loader__title">{title ?? t('cargador.titulo')}</h2>
      <p className="loader__text">{message ?? t('cargador.mensaje')}</p>
    </section>
  )
}
