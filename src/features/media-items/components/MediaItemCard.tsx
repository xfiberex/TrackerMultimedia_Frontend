import {
  CalendarDaysIcon,
  PencilSquareIcon,
  StarIcon,
  TrashIcon,
  TvIcon,
} from '@heroicons/react/24/outline'
import {
  mediaSourceLabels,
  mediaTrackingStatusLabels,
  contentKindLabels,
  mediaTypeLabels,
  progressUnitLabels,
  type MediaItem,
} from '@/features/media-items/schemas/mediaItemSchema'
import { formatDate, formatScore } from '@/shared/utils'

interface MediaItemCardProps {
  item: MediaItem
  isDeleting?: boolean
  onDelete?: (item: MediaItem) => void
  onEdit?: (item: MediaItem) => void
}

function getKindLabel(item: MediaItem): string {
  return item.type ? mediaTypeLabels[item.type] : contentKindLabels[item.contentKind]
}

function getProgressLabel(item: MediaItem): string {
  const progressCurrent = item.progressCurrent ?? item.progressCount

  if (progressCurrent <= 0 && item.progressTotal == null) {
    return 'Sin progreso'
  }

  if (item.progressUnit === 'None') {
    return `Progreso ${progressCurrent}`
  }

  const progressTotal = item.progressTotal != null ? `/${item.progressTotal}` : ''
  return `Progreso ${progressCurrent}${progressTotal} ${progressUnitLabels[item.progressUnit].toLowerCase()}`
}

function getSeasonLabel(item: MediaItem): string | null {
  if (item.currentSeason <= 1) {
    return null
  }

  if (item.type !== 'Anime' && item.type !== 'Donghua') {
    return null
  }

  return `Temporada ${item.currentSeason}`
}

export default function MediaItemCard({
  item,
  isDeleting = false,
  onDelete,
  onEdit,
}: MediaItemCardProps) {
  const statusClassName = `badge badge--${item.status.toLowerCase()}`
  const categories = item.categories ?? []
  const metadata = [
    item.releaseYear ? `Estreno ${item.releaseYear}` : 'Año sin registrar',
    getProgressLabel(item),
    getSeasonLabel(item),
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
        <p className="media-card__alt">{item.alternativeTitle ?? 'Sin título alternativo'}</p>

        <div className="badge-row">
          <span className="badge">{getKindLabel(item)}</span>
          <span className={statusClassName}>{mediaTrackingStatusLabels[item.status]}</span>
          <span className="badge badge--source">{mediaSourceLabels[item.sourceType]}</span>
          {item.externalStatusLabel ? (
            <span className="badge">{item.externalStatusLabel}</span>
          ) : null}
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
                  Editar
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
                  {isDeleting ? 'Eliminando…' : 'Eliminar'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
