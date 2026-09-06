import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  contentKindLabelKeys,
  contentKinds,
  defaultProgressUnitByContentKind,
  mediaTrackingStatusLabelKeys,
  mediaTrackingStatuses,
  progressUnitLabelKeys,
  type CreateMediaItemInput,
  type MediaItem,
  type MediaItemCategory,
} from '@/features/media-items/schemas/mediaItemSchema'
import type { UserFormat } from '@/features/catalog/schemas/formatsSchema'

type MediaItemDraft = {
  title: string
  description: string
  contentKind: CreateMediaItemInput['contentKind']
  formatId: string | null
  status: CreateMediaItemInput['status']
  releaseYear: string
  currentSeason: string
  progressCurrent: string
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
  availableFormats?: UserFormat[]
  error: string | null
  isPending: boolean
  onCancel: () => void
  onSubmit: (payload: CreateMediaItemInput) => void
}

function createDraft(item: MediaItem | null): MediaItemDraft {
  const contentKind = item?.contentKind ?? 'Series'

  return {
    title: item?.title ?? '',
    description: item?.description ?? '',
    contentKind,
    formatId: item?.formatId ?? null,
    status: item?.status ?? 'Planned',
    releaseYear: item?.releaseYear != null ? String(item.releaseYear) : '',
    currentSeason: String(item?.currentSeason ?? 1),
    progressCurrent: String(item?.progressCurrent ?? item?.progressCount ?? 0),
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

export default function MediaItemEditorForm({
  item,
  availableCategories,
  availableFormats,
  error,
  isPending,
  onCancel,
  onSubmit,
}: MediaItemEditorFormProps) {
  const { t } = useTranslation()
  const isEditing = item !== null
  const [draft, setDraft] = useState<MediaItemDraft>(() => createDraft(item))
  const progressUnit = item?.progressUnit ?? defaultProgressUnitByContentKind[draft.contentKind]
  const progressLabel = t(progressUnitLabelKeys[progressUnit])

  const updateField = <K extends keyof MediaItemDraft>(field: K, value: MediaItemDraft[K]) => {
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

    const progressCurrent = toRequiredInteger(draft.progressCurrent, 0)
    const currentSeason = toRequiredInteger(draft.currentSeason, 1)
    const preservedLegacyType =
      item?.type != null && item.contentKind === draft.contentKind ? item.type : null

    onSubmit({
      title: draft.title.trim(),
      alternativeTitle: item?.alternativeTitle ?? null,
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
      progressUnit: item?.progressUnit ?? defaultProgressUnitByContentKind[draft.contentKind],
      progressCount: progressCurrent,
      progressCurrent,
      progressTotal: item?.progressTotal ?? null,
      currentSeason,
      personalScore: toOptionalNumber(draft.personalScore),
      userFormatId: draft.formatId ?? null,
      startedAtUtc: toOptionalUtcDateString(draft.startedAtUtc),
      completedAtUtc: toOptionalUtcDateString(draft.completedAtUtc),
      notes: trimOrNull(draft.notes),
      categoryIds: draft.categoryIds.length > 0 ? draft.categoryIds : undefined,
    })
  }

  return (
    <form
      className="filters-form media-editor"
      aria-label={t('editor.etiqueta')}
      onSubmit={handleSubmit}
    >
      <div className="media-editor__header">
        <div>
          <h2 className="panel__title">
            {isEditing ? t('editor.tituloEditar') : t('editor.tituloNuevo')}
          </h2>
          <p className="panel__description">
            {isEditing ? t('editor.descripcionEditar') : t('editor.descripcionNuevo')}
          </p>
          {item !== null && item.sourceType !== 'Manual' ? (
            <p className="panel__description">{t('editor.origenExterno')}</p>
          ) : null}
        </div>

        <button type="button" className="button button--ghost" onClick={onCancel}>
          {t('comun.cancelar')}
        </button>
      </div>

      {error ? (
        <div className="auth-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="control-grid">
        <div className="control control--span-full">
          <label htmlFor="editor-title">{t('editor.tituloPrincipal')}</label>
          <input
            id="editor-title"
            className="input"
            value={draft.title}
            onChange={(event) => updateField('title', event.target.value)}
            required
            data-dialog-autofocus
          />
        </div>

        <div className="control control--span-full">
          <label htmlFor="editor-description">{t('editor.descripcion')}</label>
          <input
            id="editor-description"
            className="input"
            value={draft.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-format">{t('editor.formato')}</label>
          {availableFormats && availableFormats.length > 0 ? (
            <select
              id="editor-format"
              className="select"
              value={draft.formatId ?? ''}
              onChange={(event) => updateField('formatId', event.target.value || null)}
            >
              <option value="">{t('editor.sinFormato')}</option>
              {availableFormats.map((fmt) => (
                <option key={fmt.id} value={fmt.id}>
                  {fmt.name}
                </option>
              ))}
            </select>
          ) : (
            <select
              id="editor-format"
              className="select"
              value={draft.contentKind}
              onChange={(event) =>
                updateField('contentKind', event.target.value as MediaItemDraft['contentKind'])
              }
            >
              {contentKinds.map((contentKind) => (
                <option key={contentKind} value={contentKind}>
                  {t(contentKindLabelKeys[contentKind])}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="control">
          <label htmlFor="editor-status">{t('editor.estadoRegistro')}</label>
          <select
            id="editor-status"
            className="select"
            value={draft.status}
            onChange={(event) =>
              updateField('status', event.target.value as MediaItemDraft['status'])
            }
          >
            {mediaTrackingStatuses.map((status) => (
              <option key={status} value={status}>
                {t(mediaTrackingStatusLabelKeys[status])}
              </option>
            ))}
          </select>
        </div>

        <div
          className="control control--span-full"
          role="group"
          aria-labelledby="editor-categories-label"
        >
          <span className="control__label" id="editor-categories-label">
            {t('editor.categorias')}
          </span>
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
            <p className="category-empty">{t('editor.sinCategorias')}</p>
          )}
        </div>

        <div className="control">
          <label htmlFor="editor-release-year">{t('editor.anioEstreno')}</label>
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
          <label htmlFor="editor-score">{t('editor.puntuacion')}</label>
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
          <label htmlFor="editor-season">{t('editor.temporada')}</label>
          <input
            id="editor-season"
            className="input"
            type="number"
            min="0"
            value={draft.currentSeason}
            onChange={(event) => updateField('currentSeason', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-chapter">{progressLabel}</label>
          <input
            id="editor-chapter"
            className="input"
            type="number"
            min="0"
            value={draft.progressCurrent}
            onChange={(event) => updateField('progressCurrent', event.target.value)}
          />
        </div>

        <div className="control control--span-full">
          <label htmlFor="editor-cover">{t('editor.portada')}</label>
          <input
            id="editor-cover"
            className="input"
            type="url"
            value={draft.coverImageUrl}
            onChange={(event) => updateField('coverImageUrl', event.target.value)}
          />
        </div>

        <div className="control control--span-full">
          <label htmlFor="editor-reference">{t('editor.referencia')}</label>
          <input
            id="editor-reference"
            className="input"
            type="url"
            value={draft.referenceUrl}
            onChange={(event) => updateField('referenceUrl', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-started-at">{t('editor.fechaInicio')}</label>
          <input
            id="editor-started-at"
            className="input"
            type="date"
            value={draft.startedAtUtc}
            onChange={(event) => updateField('startedAtUtc', event.target.value)}
          />
        </div>

        <div className="control">
          <label htmlFor="editor-completed-at">{t('editor.fechaFin')}</label>
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
        <label htmlFor="editor-notes">{t('editor.notas')}</label>
        <textarea
          id="editor-notes"
          className="input media-editor__textarea"
          value={draft.notes}
          onChange={(event) => updateField('notes', event.target.value)}
        />
      </div>

      <div className="media-editor__actions">
        <button type="submit" className="button button--primary" disabled={isPending}>
          {isPending
            ? t('comun.guardando')
            : isEditing
              ? t('perfil.guardarCambios')
              : t('editor.guardarNuevo')}
        </button>
      </div>
    </form>
  )
}
