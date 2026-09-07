import {
  CalendarDaysIcon,
  PencilSquareIcon,
  StarIcon,
  TrashIcon,
  TvIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  mediaTrackingStatusLabelKeys,
  contentKindLabelKeys,
  mediaTypeLabels,
  progressUnitLabelKeys,
  type MediaItem,
} from '@/features/media-items/schemas/mediaItemSchema'
import { formatDate, formatScore } from '@/shared/utils'

interface MediaItemCardProps {
  item: MediaItem
  isDeleting?: boolean
  onDelete?: (item: MediaItem) => void
  onEdit?: (item: MediaItem) => void
}

// Estas tres siguen siendo funciones de módulo, pero reciben `t`. Meterlas dentro del
// componente para alcanzar el hook las recrearía en cada render sin ganar nada; pasarlo
// como argumento las deja igual de puras que antes.
function getKindLabel(item: MediaItem, t: TFunction): string {
  return item.type ? mediaTypeLabels[item.type] : t(contentKindLabelKeys[item.contentKind])
}

function getProgressLabel(item: MediaItem, t: TFunction): string {
  const progressCurrent = item.progressCurrent ?? item.progressCount

  if (progressCurrent <= 0 && item.progressTotal == null) {
    return t('tarjeta.sinProgreso')
  }

  if (item.progressUnit === 'None') {
    return t('tarjeta.progreso', { actual: String(progressCurrent) })
  }

  const progressTotal = item.progressTotal != null ? `/${item.progressTotal}` : ''
  return t('tarjeta.progresoConUnidad', {
    actual: String(progressCurrent),
    total: progressTotal,
    unidad: t(progressUnitLabelKeys[item.progressUnit]).toLowerCase(),
  })
}

function getSeasonLabel(item: MediaItem, t: TFunction): string | null {
  if (item.currentSeason <= 1) {
    return null
  }

  if (item.type !== 'Anime' && item.type !== 'Donghua') {
    return null
  }

  return t('tarjeta.temporada', { numero: String(item.currentSeason) })
}

export default function MediaItemCard({
  item,
  isDeleting = false,
  onDelete,
  onEdit,
}: MediaItemCardProps) {
  const { t } = useTranslation()
  const statusClassName = `badge badge--${item.status.toLowerCase()}`
  const categories = item.categories ?? []
  const metadata = [
    item.releaseYear
      ? t('tarjeta.estreno', { anio: String(item.releaseYear) })
      : t('tarjeta.anioSinRegistrar'),
    getProgressLabel(item, t),
    getSeasonLabel(item, t),
  ].filter((part): part is string => part !== null)

  return (
    <article className="media-card">
      {item.coverImageUrl ? (
        <img
          className="media-card__cover"
          src={item.coverImageUrl}
          alt={item.title}
          loading="lazy"
        />
      ) : (
        <div className="media-card__placeholder" aria-hidden="true">
          <TvIcon width={36} height={36} />
        </div>
      )}

      <div className="media-card__body">
        <h3 className="media-card__title">{item.title}</h3>
        <p className="media-card__alt">
          {item.alternativeTitle ?? t('tarjeta.sinTituloAlternativo')}
        </p>

        <div className="badge-row">
          <span className="badge">{getKindLabel(item, t)}</span>
          <span className={statusClassName}>{t(mediaTrackingStatusLabelKeys[item.status])}</span>
        </div>

        {categories.length > 0 ? (
          <div className="badge-row">
            {categories.map((category) => (
              <span key={category.id} className="badge">
                <span
                  className="category-pill__swatch"
                  style={{ backgroundColor: category.color ?? 'transparent' }}
                  aria-hidden="true"
                />
                {category.name}
              </span>
            ))}
          </div>
        ) : null}

        <p className="media-card__meta">{metadata.join(' · ')}</p>

        <div className="card-actions">
          <div className="card-actions__meta">
            <span className="hero-chip">
              <StarIcon width={16} height={16} />
              {formatScore(item.personalScore)}
            </span>
            <span className="hero-chip">
              <CalendarDaysIcon width={16} height={16} />
              {formatDate(item.createdAtUtc)}
            </span>
          </div>

          {onEdit || onDelete ? (
            <div className="card-actions__buttons">
              {onEdit ? (
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => onEdit(item)}
                >
                  <PencilSquareIcon width={18} height={18} />
                  {t('comun.editar')}
                </button>
              ) : null}

              {onDelete ? (
                <button
                  className="button button--danger"
                  type="button"
                  onClick={() => onDelete(item)}
                  disabled={isDeleting}
                >
                  <TrashIcon width={18} height={18} />
                  {isDeleting ? t('tarjeta.eliminando') : t('comun.eliminar')}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
