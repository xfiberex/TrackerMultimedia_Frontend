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
    <article className="search-card">
      {item.coverImageUrl ? (
        <img className="search-card__cover" src={item.coverImageUrl} alt={item.title} loading="lazy" />
      ) : (
        <div className="search-card__placeholder" aria-hidden="true">
          <SparklesIcon width={36} height={36} />
        </div>
      )}

      <div className="search-card__body">
        <h3 className="search-card__title">{item.title}</h3>
        <p className="search-card__alt">{item.alternativeTitle ?? 'Sin título alternativo'}</p>
        <p className="search-card__meta">
          {item.suggestedType}
          {' · '}
          {mediaSourceLabels[item.sourceType]}
          {' · '}
          {item.externalStatusLabel ?? 'Estado editorial sin dato'}
          {' · '}
          {item.releaseYear ?? 'Año sin dato'}
        </p>
        <p className="search-card__footer">Puntuación externa: {formatScore(item.externalScore)}</p>

        <div className="card-actions">
          <button className="button button--primary" onClick={() => onAdd(item)} disabled={isPending}>
            <PlusIcon width={18} height={18} />
            {isPending ? 'Guardando...' : 'Preparar importación'}
          </button>

          {item.referenceUrl ? (
            <a className="button button--secondary" href={item.referenceUrl} target="_blank" rel="noreferrer">
              <ArrowTopRightOnSquareIcon width={18} height={18} />
              Abrir
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}