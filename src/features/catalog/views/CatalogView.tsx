import {
  ChevronDownIcon,
  PencilSquareIcon,
  PlusIcon,
  Squares2X2Icon,
  TagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CategoriesApi } from '@/features/categories/api/CategoriesAPI'
import type { Category, CreateCategoryInput } from '@/features/categories/schemas/categorySchema'
import { FormatsApi } from '@/features/catalog/api/FormatsAPI'
import type { CreateFormatInput, UserFormat } from '@/features/catalog/schemas/formatsSchema'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import EmptyState from '@/shared/components/EmptyState'
import Loader from '@/shared/components/Loader'
import SidePanelDialog from '@/shared/components/SidePanelDialog'
import { queryKeys } from '@/shared/constants/queryKeys'
import { useToast } from '@/shared/hooks/useToast'

// ── Shared helpers ────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#64748B',
]

function ColorPickerDropdown({
  value,
  onChange,
  labelId,
}: {
  value: string
  onChange: (color: string) => void
  /** Id del texto que etiqueta el control, para que el disparador tenga nombre accesible. */
  labelId: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(value.trim())

  return (
    <div className="color-picker-control" ref={rootRef}>
      <button
        type="button"
        className="color-picker-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${labelId} ${labelId}-value`}
      >
        <span
          className="color-picker-trigger__swatch"
          style={{ backgroundColor: isValidHex ? value.trim() : 'transparent' }}
        />
        <span className="color-picker-trigger__value" id={`${labelId}-value`}>
          {value.trim() || 'Sin color'}
        </span>
        <ChevronDownIcon
          className={`color-picker-trigger__chevron${isOpen ? ' color-picker-trigger__chevron--open' : ''}`}
          width={14}
          height={14}
        />
      </button>

      {isOpen ? (
        <div className="color-picker-popover" role="listbox" aria-label="Selector de color">
          <div className="color-picker-presets" role="group" aria-label="Colores predefinidos">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                role="option"
                aria-selected={value.trim() === color}
                className={`color-preset-btn${value.trim() === color ? ' color-preset-btn--active' : ''}`}
                style={{ backgroundColor: color }}
                title={color}
                onClick={() => {
                  onChange(color)
                  setIsOpen(false)
                }}
              />
            ))}
          </div>

          <div className="color-picker-native-row">
            <label htmlFor="cat-color-native">Personalizado</label>
            <input
              id="cat-color-native"
              type="color"
              className="color-picker-native"
              value={isValidHex ? value.trim() : '#000000'}
              onChange={(e) => onChange(e.target.value)}
            />
            <input
              type="text"
              className="color-picker-hex-input"
              placeholder="#336699"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-label="Valor hexadecimal del color"
            />
            {value.trim() ? (
              <button
                type="button"
                className="button button--ghost"
                style={{ minHeight: '2.25rem', padding: '0 0.75rem', fontSize: '0.82rem' }}
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                }}
              >
                Quitar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function extractApiError(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return fallback
  }
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (typeof data === 'string') return data
  if (typeof data === 'object' && data !== null) {
    if ('detail' in data && typeof data.detail === 'string') return data.detail
    if ('errors' in data && typeof data.errors === 'object' && data.errors !== null) {
      for (const fieldErrors of Object.values(data.errors as Record<string, unknown>)) {
        if (Array.isArray(fieldErrors) && typeof fieldErrors[0] === 'string') return fieldErrors[0]
      }
    }
  }
  return fallback
}

function trimOrNull(value: string): string | null {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

// ── Categories section ────────────────────────────────────────────────────────

type CategoryDraft = { name: string; color: string }

function makeCategoryDraft(cat: Category | null): CategoryDraft {
  return { name: cat?.name ?? '', color: cat?.color ?? '' }
}

function CategoriesSection() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [draft, setDraft] = useState<CategoryDraft>(() => makeCategoryDraft(null))
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Category | null>(null)

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: ({ signal }) => CategoriesApi.getAll(signal),
  })

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string | null; payload: CreateCategoryInput }) => {
      if (id) return CategoriesApi.update(id, payload)
      return CategoriesApi.create(payload)
    },
    onSuccess: (saved, variables) => {
      showToast({
        tone: 'success',
        message: variables.id
          ? `"${saved.name}" se actualizó correctamente.`
          : `"${saved.name}" se creó correctamente.`,
      })
      setIsModalOpen(false)
      setFormError(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.root })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (err, variables) => {
      setFormError(
        extractApiError(err, variables.id ? 'No se pudo actualizar la categoría.' : 'No se pudo crear la categoría.'),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (cat: Category) => {
      await CategoriesApi.remove(cat.id)
      return cat
    },
    onSuccess: (deleted) => {
      setDeleteCandidate(null)
      showToast({ tone: 'success', message: `"${deleted.name}" se eliminó correctamente.` })
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.root })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (err) => {
      setDeleteCandidate(null)
      showToast({ tone: 'danger', message: extractApiError(err, 'No se pudo eliminar la categoría.') })
    },
  })

  const categories = categoriesQuery.data ?? []

  const openCreate = () => {
    setEditingCategory(null)
    setDraft(makeCategoryDraft(null))
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setDraft(makeCategoryDraft(cat))
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    saveMutation.mutate({
      id: editingCategory?.id ?? null,
      payload: { name: draft.name.trim(), color: trimOrNull(draft.color) },
    })
  }

  if (categoriesQuery.isLoading && !categoriesQuery.data) {
    return <Loader title="Cargando categorías" />
  }

  return (
    <>
      <div className="catalog-section">
        <div className="catalog-section__header">
          <div>
            <h2 className="catalog-section__title">
              <TagIcon width={18} height={18} />
              Categorías
            </h2>
            <p className="catalog-section__description">
              Etiquetas personales para organizar tu biblioteca. Colores opcionales para diferenciar grupos.
            </p>
          </div>
          <button className="button button--primary" type="button" onClick={openCreate}>
            <PlusIcon width={18} height={18} />
            Nueva categoría
          </button>
        </div>

        {categoriesQuery.isError ? (
          <EmptyState
            title="No se pudieron cargar las categorías"
            message="Recarga la vista o revisa la conexión con el backend."
            action={
              <button className="button button--primary" type="button" onClick={() => categoriesQuery.refetch()}>
                Reintentar
              </button>
            }
          />
        ) : categories.length === 0 ? (
          <EmptyState
            title="Todavía no tienes categorías"
            message="Crea la primera para empezar a organizar tu biblioteca."
            action={
              <button className="button button--primary" type="button" onClick={openCreate}>
                <PlusIcon width={18} height={18} />
                Nueva categoría
              </button>
            }
          />
        ) : (
          <div className="search-table-wrapper">
            <table className="search-table">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="search-row">
                    <td className="search-row__meta-cell">
                      <div className="category-row__color">
                        <span
                          className="category-pill__swatch category-pill__swatch--lg"
                          style={{ backgroundColor: cat.color ?? 'transparent' }}
                          aria-hidden="true"
                        />
                        <span>{cat.color ?? 'Sin color'}</span>
                      </div>
                    </td>
                    <td className="search-row__title-cell">
                      <span className="search-row__title">{cat.name}</span>
                    </td>
                    <td className="search-row__actions-cell">
                      <div className="search-row__actions">
                        <button className="button button--secondary" type="button" onClick={() => openEdit(cat)}>
                          <PencilSquareIcon width={16} height={16} />
                          Editar
                        </button>
                        <button
                          className="button button--danger"
                          type="button"
                          onClick={() => setDeleteCandidate(cat)}
                          disabled={deleteMutation.isPending}
                        >
                          <TrashIcon width={16} height={16} />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SidePanelDialog
        open={isModalOpen}
        variant="centered"
        ariaLabel={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="catalog-modal">
          <div className="catalog-modal__header">
            <h3 className="catalog-modal__title">
              {editingCategory ? `Editar "${editingCategory.name}"` : 'Nueva categoría'}
            </h3>
            <button type="button" className="button button--ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
          </div>

          <form className="filters-form" onSubmit={handleSubmit}>
            {formError ? <div className="auth-error" role="alert">{formError}</div> : null}

            <div className="control">
              <label htmlFor="cat-name">Nombre</label>
              <input
                id="cat-name"
                className="input"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                required
                data-dialog-autofocus
              />
            </div>

            <div className="control">
              {/* Widget compuesto, no un control único: se nombra por aria-labelledby. */}
              <span className="control__label" id="format-color-label">Color</span>
              <ColorPickerDropdown
                labelId="format-color-label"
                value={draft.color}
                onChange={(color) => setDraft((d) => ({ ...d, color }))}
              />
            </div>

            <div className="catalog-modal__actions">
              <button type="submit" className="button button--primary" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Guardando…' : editingCategory ? 'Guardar cambios' : 'Crear categoría'}
              </button>
            </div>
          </form>
        </div>
      </SidePanelDialog>

      <ConfirmDialog
        open={deleteCandidate !== null}
        title={deleteCandidate ? `Eliminar "${deleteCandidate.name}"` : 'Eliminar categoría'}
        message="Esta categoría se eliminará de tu biblioteca y dejará de estar disponible en todos los registros."
        confirmLabel="Eliminar categoría"
        cancelLabel="Conservar"
        tone="danger"
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => { if (deleteCandidate) deleteMutation.mutate(deleteCandidate) }}
      />
    </>
  )
}

// ── Formats section ───────────────────────────────────────────────────────────

type FormatDraft = { name: string }

function makeFormatDraft(fmt: UserFormat | null): FormatDraft {
  return { name: fmt?.name ?? '' }
}

function FormatsSection() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFormat, setEditingFormat] = useState<UserFormat | null>(null)
  const [draft, setDraft] = useState<FormatDraft>(() => makeFormatDraft(null))
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<UserFormat | null>(null)

  const formatsQuery = useQuery({
    queryKey: queryKeys.formats.list(),
    queryFn: ({ signal }) => FormatsApi.getAll(signal),
  })

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string | null; payload: CreateFormatInput }) => {
      if (id) return FormatsApi.update(id, payload)
      return FormatsApi.create(payload)
    },
    onSuccess: (saved, variables) => {
      showToast({
        tone: 'success',
        message: variables.id
          ? `"${saved.name}" se actualizó correctamente.`
          : `"${saved.name}" se creó correctamente.`,
      })
      setIsModalOpen(false)
      setFormError(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.formats.root })
    },
    onError: (err, variables) => {
      setFormError(
        extractApiError(err, variables.id ? 'No se pudo actualizar el formato.' : 'No se pudo crear el formato.'),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (fmt: UserFormat) => {
      await FormatsApi.remove(fmt.id)
      return fmt
    },
    onSuccess: (deleted) => {
      setDeleteCandidate(null)
      showToast({ tone: 'success', message: `"${deleted.name}" se eliminó correctamente.` })
      void queryClient.invalidateQueries({ queryKey: queryKeys.formats.root })
    },
    onError: (err) => {
      setDeleteCandidate(null)
      showToast({ tone: 'danger', message: extractApiError(err, 'No se pudo eliminar el formato.') })
    },
  })

  const formats = formatsQuery.data ?? []

  const openCreate = () => {
    setEditingFormat(null)
    setDraft(makeFormatDraft(null))
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEdit = (fmt: UserFormat) => {
    setEditingFormat(fmt)
    setDraft(makeFormatDraft(fmt))
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    saveMutation.mutate({
      id: editingFormat?.id ?? null,
      payload: { name: draft.name.trim() },
    })
  }

  if (formatsQuery.isLoading && !formatsQuery.data) {
    return <Loader title="Cargando formatos" />
  }

  return (
    <>
      <div className="catalog-section">
        <div className="catalog-section__header">
          <div>
            <h2 className="catalog-section__title">
              <Squares2X2Icon width={18} height={18} />
              Formatos
            </h2>
            <p className="catalog-section__description">
              Etiquetas personales para clasificar el contenido de tu biblioteca: Anime, Serie, Película, Manga, etc.
            </p>
          </div>
          <button className="button button--primary" type="button" onClick={openCreate}>
            <PlusIcon width={18} height={18} />
            Nuevo formato
          </button>
        </div>

        {formatsQuery.isError ? (
          <EmptyState
            title="No se pudieron cargar los formatos"
            message="Recarga la vista o revisa la conexión con el backend."
            action={
              <button className="button button--primary" type="button" onClick={() => formatsQuery.refetch()}>
                Reintentar
              </button>
            }
          />
        ) : formats.length === 0 ? (
          <EmptyState
            title="Todavía no tienes formatos"
            message="Crea el primero para que aparezca en el selector de la biblioteca."
            action={
              <button className="button button--primary" type="button" onClick={openCreate}>
                <PlusIcon width={18} height={18} />
                Nuevo formato
              </button>
            }
          />
        ) : (
          <div className="search-table-wrapper">
            <table className="search-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {formats.map((fmt) => (
                  <tr key={fmt.id} className="search-row">
                    <td className="search-row__title-cell">
                      <span className="search-row__title">{fmt.name}</span>
                    </td>
                    <td className="search-row__actions-cell">
                      <div className="search-row__actions">
                        <button className="button button--secondary" type="button" onClick={() => openEdit(fmt)}>
                          <PencilSquareIcon width={16} height={16} />
                          Editar
                        </button>
                        <button
                          className="button button--danger"
                          type="button"
                          onClick={() => setDeleteCandidate(fmt)}
                          disabled={deleteMutation.isPending}
                        >
                          <TrashIcon width={16} height={16} />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SidePanelDialog
        open={isModalOpen}
        variant="centered"
        ariaLabel={editingFormat ? 'Editar formato' : 'Nuevo formato'}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="catalog-modal">
          <div className="catalog-modal__header">
            <h3 className="catalog-modal__title">
              {editingFormat ? `Editar "${editingFormat.name}"` : 'Nuevo formato'}
            </h3>
            <button type="button" className="button button--ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
          </div>

          <form className="filters-form" onSubmit={handleSubmit}>
            {formError ? <div className="auth-error" role="alert">{formError}</div> : null}

            <div className="control">
              <label htmlFor="fmt-name">Nombre del formato</label>
              <input
                id="fmt-name"
                className="input"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                required
                data-dialog-autofocus
                placeholder="Ej: OVA, Novela visual, Cortometraje…"
              />
            </div>

            <div className="catalog-modal__actions">
              <button type="submit" className="button button--primary" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Guardando…' : editingFormat ? 'Guardar cambios' : 'Crear formato'}
              </button>
            </div>
          </form>
        </div>
      </SidePanelDialog>

      <ConfirmDialog
        open={deleteCandidate !== null}
        title={deleteCandidate ? `Eliminar "${deleteCandidate.name}"` : 'Eliminar formato'}
        message="Este formato dejará de aparecer en el selector de la biblioteca. Los registros existentes no se verán afectados."
        confirmLabel="Eliminar formato"
        cancelLabel="Conservar"
        tone="danger"
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => { if (deleteCandidate) deleteMutation.mutate(deleteCandidate) }}
      />
    </>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

type CatalogTab = 'categories' | 'formats'

export default function CatalogView() {
  const [activeTab, setActiveTab] = useState<CatalogTab>('categories')

  return (
    <section className="page">
      <section className="hero-panel">
        <span className="hero-panel__eyebrow">
          <Squares2X2Icon width={18} height={18} />
          Catálogo
        </span>
        <h1 className="hero-panel__title">Tu catálogo personal</h1>
        <p className="hero-panel__description">
          Administra las categorías y formatos que usas para organizar y clasificar tu biblioteca multimedia.
        </p>
      </section>

      <div className="catalog-tabs">
        <button
          type="button"
          className={`catalog-tab${activeTab === 'categories' ? ' catalog-tab--active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <TagIcon width={16} height={16} />
          Categorías
        </button>
        <button
          type="button"
          className={`catalog-tab${activeTab === 'formats' ? ' catalog-tab--active' : ''}`}
          onClick={() => setActiveTab('formats')}
        >
          <Squares2X2Icon width={16} height={16} />
          Formatos
        </button>
      </div>

      <section className="panel">
        {activeTab === 'categories' ? <CategoriesSection /> : <FormatsSection />}
      </section>
    </section>
  )
}
