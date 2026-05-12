import {
  ArrowTopRightOnSquareIcon,
  PlusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { mediaSourceLabels } from '@/features/media-items/schemas/mediaItemSchema'
import type { SearchMediaItem } from '@/features/search/schemas/searchSchema'
import { formatScore } from '@/shared/utils'

interface SearchResultCardProps {
  item: SearchMediaItem
  isPending: boolean
  onAdd: (item: SearchMediaItem) => void
}

export default function SearchResultCard({ item, isPending, onAdd }: SearchResultCardProps) {
  return (
    <tr className="search-row">
      <td className="search-row__cover-cell">
        {item.coverImageUrl ? (
          <img className="search-row__thumb" src={item.coverImageUrl} alt={item.title} loading="lazy" />
        ) : (
          <div className="search-row__thumb-placeholder" aria-hidden="true">
            <SparklesIcon width={20} height={20} />
          </div>
        )}
      </td>
      <td className="search-row__title-cell">
        <span className="search-row__title">{item.title}</span>
        {item.alternativeTitle ? (
          <span className="search-row__alt">{item.alternativeTitle}</span>
        ) : null}
      </td>
      <td className="search-row__meta-cell">{item.suggestedType}</td>
      <td className="search-row__meta-cell">{mediaSourceLabels[item.sourceType]}</td>
      <td className="search-row__meta-cell">{item.externalStatusLabel ?? '—'}</td>
      <td className="search-row__meta-cell">{item.releaseYear ?? '—'}</td>
      <td className="search-row__meta-cell">{formatScore(item.externalScore)}</td>
      <td className="search-row__actions-cell">
        <div className="search-row__actions">
          <button className="button button--primary" onClick={() => onAdd(item)} disabled={isPending}>
            <PlusIcon width={16} height={16} />
            {isPending ? 'Guardando...' : 'Importar'}
          </button>
          {item.referenceUrl ? (
            <a className="button button--secondary" href={item.referenceUrl} target="_blank" rel="noreferrer">
              <ArrowTopRightOnSquareIcon width={16} height={16} />
            </a>
          ) : null}
        </div>
      </td>
    </tr>
  )
}
