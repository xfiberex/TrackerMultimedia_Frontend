import { useState, type FormEvent } from 'react'
import type { Category } from '@/features/categories/schemas/categorySchema'
import {
  mediaSourceLabels,
  mediaTrackingStatusLabels,
  mediaTrackingStatuses,
  type CreateMediaItemInput,
} from '@/features/media-items/schemas/mediaItemSchema'
import type { SearchMediaItem } from '@/features/search/schemas/searchSchema'
import { formatScore } from '@/shared/utils'

export interface SearchQuickAddInput {
  status: CreateMediaItemInput['status']
  categoryIds?: string[]
  personalScore: number | null
  notes: string | null
}

interface SearchQuickAddFormProps {
  item: SearchMediaItem
  categories: Category[]
  categoriesHelpText?: string
  error: string | null
  isPending: boolean
  onCancel: () => void
  onSubmit: (payload: SearchQuickAddInput) => void
}

type SearchQuickAddDraft = {
  status: CreateMediaItemInput['status']
  categoryIds: string[]
  personalScore: string
  notes: string
}

function createDraft(): SearchQuickAddDraft {
  return {
    status: 'Planned',
    categoryIds: [],
    personalScore: '',
    notes: '',
  }
}

function trimOrNull(value: string): string | null {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function toOptionalNumber(value: string): number | null {
  const normalized = value.trim()
  return normalized.length > 0 ? Number(normalized) : null
}

export default function SearchQuickAddForm({
  item,
  categories,
  categoriesHelpText,
  error,
  isPending,
  onCancel,
  onSubmit,
}: SearchQuickAddFormProps) {
  const [draft, setDraft] = useState<SearchQuickAddDraft>(() => createDraft())

  const updateField = <K extends keyof SearchQuickAddDraft>(field: K, value: SearchQuickAddDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const toggleCategory = (categoryId: string) => {
    setDraft((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((currentId) => currentId !== categoryId)
        : [...current.categoryIds, categoryId],
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    onSubmit({
      status: draft.status,
      categoryIds: draft.categoryIds.length > 0 ? draft.categoryIds : undefined,
      personalScore: toOptionalNumber(draft.personalScore),
      notes: trimOrNull(draft.notes),
    })
  }

  return (
    <form className="filters-form search-quick-add" aria-label="Importación rápida" onSubmit={handleSubmit}>
      <div className="search-quick-add__preview">
        {item.coverImageUrl ? (
          <img className="search-quick-add__cover" src={item.coverImageUrl} alt={item.title} loading="lazy" />
        ) : (
          <div className="search-quick-add__cover search-quick-add__cover--placeholder" aria-hidden="true">
            {item.suggestedType}
          </div>
        )}

        <div className="search-quick-add__summary">
          <h2 className="panel__title">{item.title}</h2>
          <p className="panel__description">{item.alternativeTitle ?? 'Sin título alternativo'}</p>
          <div className="badge-row">
            <span className="badge">{item.suggestedType}</span>
            <span className="badge badge--source">{mediaSourceLabels[item.sourceType]}</span>
            <span className="badge">{item.externalStatusLabel ?? 'Estado editorial sin dato'}</span>
            <span className="badge">{item.releaseYear ?? 'Año sin dato'}</span>
          </div>
          <p className="search-card__footer">Puntuación externa: {formatScore(item.externalScore)}</p>
        </div>
      </div>

      {error ? <div className="auth-error" role="alert">{error}</div> : null}

      <div className="control-grid search-quick-add__grid">
        <div className="control">
          <label htmlFor="quick-add-status">Estado inicial</label>
          <select
            id="quick-add-status"
            className="select"
            value={draft.status}
            onChange={(event) => updateField('status', event.target.value as SearchQuickAddDraft['status'])}
            autoFocus
          >
            {mediaTrackingStatuses.map((status) => (
              <option key={status} value={status}>
                {mediaTrackingStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="control">
          <label htmlFor="quick-add-score">Puntuación personal</label>
          <input
            id="quick-add-score"
            className="input"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={draft.personalScore}
            onChange={(event) => updateField('personalScore', event.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div className="control control--span-full">
          <label>Categorías</label>
          {categories.length > 0 ? (
            <div className="category-pills">
              {categories.map((category) => {
                const isSelected = draft.categoryIds.includes(category.id)

                return (
                  <button
                    key={category.id}
                    type="button"
                    className={`category-pill${isSelected ? ' category-pill--active' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <span
                      className="category-pill__swatch"
                      style={{ backgroundColor: category.color ?? 'transparent' }}
                      aria-hidden="true"
                    />
                    <span>{category.name}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className={`category-empty${categoriesHelpText ? ' category-empty--warning' : ''}`}>
              {categoriesHelpText ?? 'Todavía no tienes categorías para clasificar esta importación.'}
            </p>
          )}
        </div>
      </div>

      <div className="control">
        <label htmlFor="quick-add-notes">Notas de arranque</label>
        <textarea
          id="quick-add-notes"
          className="input media-editor__textarea"
          value={draft.notes}
          onChange={(event) => updateField('notes', event.target.value)}
          placeholder="Contexto personal, por qué lo agregas, punto de entrada..."
        />
      </div>

      <div className="search-quick-add__actions">
        <button type="button" className="button button--ghost" onClick={onCancel} disabled={isPending}>
          Cancelar
        </button>
        <button type="submit" className="button button--primary" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar en biblioteca'}
        </button>
      </div>
    </form>
  )
}