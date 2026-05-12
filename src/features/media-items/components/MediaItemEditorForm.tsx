import { useEffect, useState, type FormEvent } from 'react'
import {
  contentKindLabels,
  contentKinds,
  defaultProgressUnitByContentKind,
  mediaTrackingStatusLabels,
  mediaTrackingStatuses,
  progressUnitLabels,
  progressUnits,
  type CreateMediaItemInput,
  type MediaItem,
  type MediaItemCategory,
} from '@/features/media-items/schemas/mediaItemSchema'

type MediaItemDraft = {
  title: string
  alternativeTitle: string
  description: string
  contentKind: CreateMediaItemInput['contentKind']
  status: CreateMediaItemInput['status']
  releaseYear: string
  progressUnit: CreateMediaItemInput['progressUnit']
  progressCurrent: string
  progressTotal: string
  personalScore: string
  coverImageUrl: string
  referenceUrl: string
  startedAtUtc: string
  completedAtUtc: string
  notes: string
  categoryIds: string[]
}

interface MediaItemEditorFormProps {
  item: MediaItem | null
  availableCategories: MediaItemCategory[]
  error: string | null
  isPending: boolean
  onCancel: () => void
  onSubmit: (payload: CreateMediaItemInput) => void
}

function createDraft(item: MediaItem | null): MediaItemDraft {
  const contentKind = item?.contentKind ?? 'Series'

  return {
    title: item?.title ?? '',
    alternativeTitle: item?.alternativeTitle ?? '',
    description: item?.description ?? '',
    contentKind,
    status: item?.status ?? 'Planned',
    releaseYear: item?.releaseYear != null ? String(item.releaseYear) : '',
    progressUnit: item?.progressUnit ?? defaultProgressUnitByContentKind[contentKind],
    progressCurrent: String(item?.progressCurrent ?? item?.progressCount ?? 0),
    progressTotal: item?.progressTotal != null ? String(item.progressTotal) : '',
    personalScore: item?.personalScore != null ? String(item.personalScore) : '',
    coverImageUrl: item?.coverImageUrl ?? '',
    referenceUrl: item?.referenceUrl ?? '',
    startedAtUtc: toDateInputValue(item?.startedAtUtc),
    completedAtUtc: toDateInputValue(item?.completedAtUtc),
    notes: item?.notes ?? '',
    categoryIds: item?.categories?.map((category) => category.id) ?? [],
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

function toOptionalInteger(value: string): number | null {
  const parsed = toOptionalNumber(value)
  return parsed == null ? null : Math.trunc(parsed)
}

function toRequiredInteger(value: string, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback
}

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : ''
}

function toOptionalUtcDateString(value: string): string | null {
  const normalized = value.trim()

  if (normalized.length === 0) {
    return null
  }

  return new Date(`${normalized}T00:00:00.000Z`).toISOString()
}

export default function MediaItemEditorForm({ item, availableCategories, error, isPending, onCancel, onSubmit }: MediaItemEditorFormProps) {
  const isEditing = item !== null
  const [draft, setDraft] = useState<MediaItemDraft>(() => createDraft(item))

  // Resincronizar draft cuando cambia el item siendo editado
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setDraft(createDraft(item))
  }, [item])

  const updateField = <K extends keyof MediaItemDraft>(field: K, value: MediaItemDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleContentKindChange = (contentKind: MediaItemDraft['contentKind']) => {
    setDraft((current) => ({
      ...current,
      contentKind,
      progressUnit: defaultProgressUnitByContentKind[contentKind],
    }))
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

    const progressCurrent = toRequiredInteger(draft.progressCurrent, 0)
    const progressTotal = toOptionalInteger(draft.progressTotal)
    const preservedLegacyType = item?.type != null && item.contentKind === draft.contentKind ? item.type : null

    onSubmit({
      title: draft.title.trim(),
      alternativeTitle: trimOrNull(draft.alternativeTitle),
      type: preservedLegacyType,
      description: trimOrNull(draft.description),
      contentKind: draft.contentKind,
      status: draft.status,
      sourceType: item?.sourceType ?? 'Manual',
      externalId: item?.externalId ?? null,
      externalMediaKind: item?.externalMediaKind ?? null,
      externalStatusLabel: item?.externalStatusLabel ?? null,
      externalScore: item?.externalScore ?? null,
      coverImageUrl: trimOrNull(draft.coverImageUrl),
      referenceUrl: trimOrNull(draft.referenceUrl),
      releaseYear: toOptionalNumber(draft.releaseYear),
      progressUnit: draft.progressUnit,
      progressCount: progressCurrent,
      progressCurrent,
      progressTotal,
      currentSeason: item?.currentSeason ?? 1,
      personalScore: toOptionalNumber(draft.personalScore),
      startedAtUtc: toOptionalUtcDateString(draft.startedAtUtc),
      completedAtUtc: toOptionalUtcDateString(draft.completedAtUtc),
      notes: trimOrNull(draft.notes),
      categoryIds: draft.categoryIds.length > 0 ? draft.categoryIds : undefined,
    })
  }

  return (
    <form className="filters-form media-editor" aria-label="Editor de biblioteca" onSubmit={handleSubmit}>
      <div className="media-editor__header">
        <div>
          <h2 className="panel__title">{isEditing ? 'Editar elemento' : 'Nuevo elemento manual'}</h2>
          <p className="panel__description">
            {isEditing
              ? 'Ajusta el formato base, el progreso flexible y los metadatos visibles del elemento seleccionado.'
              : 'Crea un registro manual con el nuevo modelo flexible, sin depender del buscador externo.'}
          </p>
          {item?.sourceType !== 'Manual' ? (
            <p className="panel__description">El origen externo y sus identificadores se conservarán al guardar.</p>
          ) : null}
          {item?.type ? (
            <p className="panel__description">
              Si cambias el formato base, el tipo legado se limpiará para usar solo el dominio nuevo.
            </p>
          ) : null}
        </div>

        <button type="button" className="button button--ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      {error ? <div className="auth-error" role="alert">{error}</div> : null}

      <div className="control-grid">
        <div className="control">
          <label htmlFor="editor-title">Título principal</label>
          <input
            id="editor-title"
            className="input"
            value={draft.title}
            onChange={(event) => updateField('title', event.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="control">
          <label htmlFor="editor-alt-title">Título alternativo</label>
          <input
            id="editor-alt-title"
            className="input"
            value={draft.alternativeTitle}
            onChange={(event) => updateField('alternativeTitle', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-description">Descripción</label>
          <input
            id="editor-description"
            className="input"
            value={draft.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-content-kind">Formato base</label>
          <select
            id="editor-content-kind"
            className="select"
            value={draft.contentKind}
            onChange={(event) => handleContentKindChange(event.target.value as MediaItemDraft['contentKind'])}
          >
            {contentKinds.map((contentKind) => (
              <option key={contentKind} value={contentKind}>
                {contentKindLabels[contentKind]}
              </option>
            ))}
          </select>
        </div>

        <div className="control">
          <label htmlFor="editor-status">Estado del registro</label>
          <select
            id="editor-status"
            className="select"
            value={draft.status}
            onChange={(event) => updateField('status', event.target.value as MediaItemDraft['status'])}
          >
            {mediaTrackingStatuses.map((status) => (
              <option key={status} value={status}>
                {mediaTrackingStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="control control--span-full">
          <label>Categorías</label>
          {availableCategories.length > 0 ? (
            <div className="category-pills">
              {availableCategories.map((category) => {
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
            <p className="category-empty">Aún no tienes categorías. Créala desde la vista Categorías.</p>
          )}
        </div>

        <div className="control">
          <label htmlFor="editor-release-year">Año de estreno</label>
          <input
            id="editor-release-year"
            className="input"
            type="number"
            min="1900"
            max="2100"
            value={draft.releaseYear}
            onChange={(event) => updateField('releaseYear', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-progress-unit">Unidad de progreso</label>
          <select
            id="editor-progress-unit"
            className="select"
            value={draft.progressUnit}
            onChange={(event) => updateField('progressUnit', event.target.value as MediaItemDraft['progressUnit'])}
          >
            {progressUnits.map((progressUnit) => (
              <option key={progressUnit} value={progressUnit}>
                {progressUnitLabels[progressUnit]}
              </option>
            ))}
          </select>
        </div>

        <div className="control">
          <label htmlFor="editor-progress-current">Progreso actual</label>
          <input
            id="editor-progress-current"
            className="input"
            type="number"
            min="0"
            value={draft.progressCurrent}
            onChange={(event) => updateField('progressCurrent', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-progress-total">Progreso total</label>
          <input
            id="editor-progress-total"
            className="input"
            type="number"
            min="0"
            value={draft.progressTotal}
            onChange={(event) => updateField('progressTotal', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-score">Puntuación personal</label>
          <input
            id="editor-score"
            className="input"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={draft.personalScore}
            onChange={(event) => updateField('personalScore', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-cover">Portada URL</label>
          <input
            id="editor-cover"
            className="input"
            type="url"
            value={draft.coverImageUrl}
            onChange={(event) => updateField('coverImageUrl', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-reference">Enlace de referencia</label>
          <input
            id="editor-reference"
            className="input"
            type="url"
            value={draft.referenceUrl}
            onChange={(event) => updateField('referenceUrl', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-started-at">Fecha de inicio</label>
          <input
            id="editor-started-at"
            className="input"
            type="date"
            value={draft.startedAtUtc}
            onChange={(event) => updateField('startedAtUtc', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-completed-at">Fecha de finalización</label>
          <input
            id="editor-completed-at"
            className="input"
            type="date"
            value={draft.completedAtUtc}
            onChange={(event) => updateField('completedAtUtc', event.target.value)}
          />
        </div>
      </div>

      <div className="control">
        <label htmlFor="editor-notes">Notas personales</label>
        <textarea
          id="editor-notes"
          className="input media-editor__textarea"
          value={draft.notes}
          onChange={(event) => updateField('notes', event.target.value)}
        />
      </div>

      <div className="media-editor__actions">
        <button type="submit" className="button button--primary" disabled={isPending}>
          {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar nuevo registro'}
        </button>
      </div>
    </form>
  )
}