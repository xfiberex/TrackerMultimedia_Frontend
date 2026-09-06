import { PencilSquareIcon, TrashIcon, TvIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  contentKindLabelKeys,
  mediaSourceLabels,
  mediaTrackingStatusLabelKeys,
  mediaTypeLabels,
  progressUnitShortLabelKeys,
  type MediaItem,
} from '@/features/media-items/schemas/mediaItemSchema'
import { formatScore } from '@/shared/utils'

interface MediaItemRowProps {
  item: MediaItem
  isDeleting?: boolean
  onDelete?: (item: MediaItem) => void
  onEdit?: (item: MediaItem) => void
}

function getKindLabel(item: MediaItem, t: TFunction): string {
  return item.type ? mediaTypeLabels[item.type] : t(contentKindLabelKeys[item.contentKind])
}

function getProgressLabel(item: MediaItem, t: TFunction): string {
  const current = item.progressCurrent ?? item.progressCount ?? 0
  const unidad = t(progressUnitShortLabelKeys[item.progressUnit])
  if (item.currentSeason > 1) {
    return t('tarjeta.progresoBreveTemporada', {
      temporada: String(item.currentSeason),
      unidad,
      actual: String(current),
    })
  }
  return t('tarjeta.progresoBreve', { unidad, actual: String(current) })
}

export default function MediaItemRow({
  item,
  isDeleting = false,
  onDelete,
  onEdit,
}: MediaItemRowProps) {
  const { t } = useTranslation()
  const statusClassName = `badge badge--${item.status.toLowerCase()}`
  const categories = item.categories ?? []

  return (
    <tr className="search-row">
      <td className="search-row__cover-cell">
        {item.coverImageUrl ? (
          <img
            className="search-row__thumb"
            src={item.coverImageUrl}
            alt={item.title}
            loading="lazy"
          />
        ) : (
          <div className="search-row__thumb-placeholder" aria-hidden="true">
            <TvIcon width={20} height={20} />
          </div>
        )}
      </td>

      <td className="search-row__title-cell">
        <span className="search-row__title">{item.title}</span>
        {item.alternativeTitle ? (
          <span className="search-row__alt">{item.alternativeTitle}</span>
        ) : null}
        {categories.length > 0 ? (
          <div className="row-categories">
            {categories.map((category) => (
              <span key={category.id} className="row-category-chip">
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
      </td>

      <td className="search-row__meta-cell">{getKindLabel(item, t)}</td>

      <td className="search-row__meta-cell">
        <span className={statusClassName}>{t(mediaTrackingStatusLabelKeys[item.status])}</span>
      </td>

      <td className="search-row__meta-cell">{mediaSourceLabels[item.sourceType]}</td>

      <td className="search-row__meta-cell">{getProgressLabel(item, t)}</td>

      <td className="search-row__meta-cell">{item.releaseYear ?? '—'}</td>

      <td className="search-row__meta-cell">{formatScore(item.personalScore)}</td>

      <td className="search-row__actions-cell">
        <div className="search-row__actions">
          {onEdit ? (
            <button className="button button--secondary" type="button" onClick={() => onEdit(item)}>
              <PencilSquareIcon width={16} height={16} />
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
              <TrashIcon width={16} height={16} />
              {isDeleting ? t('tarjeta.eliminando') : t('comun.eliminar')}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  )
}
