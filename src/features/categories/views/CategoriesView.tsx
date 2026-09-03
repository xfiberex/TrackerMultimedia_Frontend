import {
  ChevronDownIcon,
  PencilSquareIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CategoriesApi } from '@/features/categories/api/CategoriesAPI'
import type { Category, CreateCategoryInput } from '@/features/categories/schemas/categorySchema'
import EmptyState from '@/shared/components/EmptyState'
import Loader from '@/shared/components/Loader'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import { useToast } from '@/shared/hooks/useToast'
import { queryKeys } from '@/shared/constants/queryKeys'

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
  const nativeRef = useRef<HTMLInputElement | null>(null)

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

  const displayColor = value.trim() || null
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
          style={{ backgroundColor: isValidHex ? (displayColor ?? 'transparent') : 'transparent' }}
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
            <label htmlFor="category-color-native">Personalizado</label>
            <input
              ref={nativeRef}
              id="category-color-native"
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

type CategoryDraft = {
  name: string
  color: string
}

function createDraft(category: Category | null): CategoryDraft {
  return {
    name: category?.name ?? '',
    color: category?.color ?? '',
  }
}

function trimOrNull(value: string): string | null {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function extractCategoriesError(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return fallback
  }

  const response = (error as { response?: { data?: unknown } }).response
  const data = response?.data

  if (typeof data === 'string') {
    return data
  }

  if (typeof data === 'object' && data !== null) {
    if ('detail' in data && typeof data.detail === 'string') {
      return data.detail
    }

    if ('errors' in data && typeof data.errors === 'object' && data.errors !== null) {
      for (const fieldErrors of Object.values(data.errors as Record<string, unknown>)) {
        if (Array.isArray(fieldErrors) && typeof fieldErrors[0] === 'string') {
          return fieldErrors[0]
        }
      }
    }
  }

  return fallback
}

export default function CategoriesView() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [draft, setDraft] = useState<CategoryDraft>(() => createDraft(null))
  const [error, setError] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Category | null>(null)
  const queryClient = useQueryClient()
  const editorSectionRef = useRef<HTMLElement | null>(null)
  const { showToast } = useToast()

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: ({ signal }) => CategoriesApi.getAll(signal),
  })

  const saveMutation = useMutation({
    mutationFn: async ({
      categoryId,
      payload,
    }: {
      categoryId: string | null
      payload: CreateCategoryInput
    }) => {
      if (categoryId) {
        return CategoriesApi.update(categoryId, payload)
      }

      return CategoriesApi.create(payload)
    },
    onSuccess: (savedCategory, variables) => {
      showToast({
        tone: 'success',
        message: variables.categoryId
          ? `"${savedCategory.name}" se actualizó correctamente.`
          : `"${savedCategory.name}" se creó correctamente.`,
      })
      setError(null)
      setEditingCategory(null)
      setDraft(createDraft(null))
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.root })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (mutationError, variables) => {
      setError(
        extractCategoriesError(
          mutationError,
          variables.categoryId
            ? 'No se pudo actualizar la categoría.'
            : 'No se pudo crear la categoría.',
        ),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (category: Category) => {
      await CategoriesApi.remove(category.id)
      return category
    },
    onSuccess: (deletedCategory) => {
      if (editingCategory?.id === deletedCategory.id) {
        setEditingCategory(null)
        setDraft(createDraft(null))
      }

      setDeleteCandidate(null)
      showToast({ tone: 'success', message: `"${deletedCategory.name}" se eliminó correctamente.` })
      setError(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.root })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (mutationError) => {
      setDeleteCandidate(null)
      showToast({
        tone: 'danger',
        message: extractCategoriesError(mutationError, 'No se pudo eliminar la categoría.'),
      })
    },
  })

  const categories = categoriesQuery.data ?? []
  const isEditing = editingCategory !== null

  const updateField = <K extends keyof CategoryDraft>(field: K, value: CategoryDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const focusEditor = () => {
    if (typeof editorSectionRef.current?.scrollIntoView === 'function') {
      editorSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const openFreshEditor = () => {
    setError(null)
    setEditingCategory(null)
    setDraft(createDraft(null))
    focusEditor()
  }

  const resetForm = () => {
    setEditingCategory(null)
    setDraft(createDraft(null))
    setError(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    saveMutation.mutate({
      categoryId: editingCategory?.id ?? null,
      payload: {
        name: draft.name.trim(),
        color: trimOrNull(draft.color),
      },
    })
  }

  const handleDelete = (category: Category) => {
    setDeleteCandidate(category)
  }

  if (categoriesQuery.isLoading && !categoriesQuery.data) {
    return <Loader title="Cargando categorías" message="Preparando tu taxonomía personal." />
  }

  return (
    <section className="page">
      <section className="hero-panel">
        <span className="hero-panel__eyebrow">
          <TagIcon width={18} height={18} />
          Categorías
        </span>
        <h1 className="hero-panel__title">Tus categorías</h1>
        <p className="hero-panel__description">
          Crea, renombra y elimina categorías personales para organizar tu biblioteca con tus
          propias reglas.
        </p>
        <div className="hero-panel__meta">
          <span className="hero-chip">{categories.length} categorías</span>
          <span className="hero-chip">Colores opcionales</span>
        </div>
        <div className="hero-panel__actions">
          <button className="button button--primary" type="button" onClick={openFreshEditor}>
            <PlusIcon width={18} height={18} />
            Abrir editor
          </button>
        </div>
      </section>

      {categoriesQuery.isError ? (
        <div className="status-stack">
          <div className="status-banner status-banner--warning" role="status">
            <strong>La taxonomía no se pudo sincronizar.</strong>
            <span>
              Puedes seguir preparando el editor, pero la lista no se refrescó correctamente.
            </span>
          </div>
        </div>
      ) : null}

      <section className="panel" ref={editorSectionRef}>
        <div className="panel__header">
          <div>
            <h2 className="panel__title">Editor de categorías</h2>
            <p className="panel__description">
              Usa colores opcionales para distinguir grupos como backlog, favoritos, pendientes o
              temporadas.
            </p>
          </div>
          {!isEditing ? (
            <span className="hero-chip">
              <PlusIcon width={16} height={16} />
              Nueva categoría
            </span>
          ) : null}
        </div>

        <form
          className="filters-form category-form"
          aria-label="Formulario de categorías"
          onSubmit={handleSubmit}
        >
          {error ? (
            <div className="auth-error" role="alert">
              {error}
            </div>
          ) : null}

          <div className="control-grid">
            <div className="control">
              <label htmlFor="category-name">Nombre de la categoría</label>
              <input
                id="category-name"
                className="input"
                value={draft.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
              />
            </div>

            <div className="control">
              {/* No es un <label>: el selector de color es un widget compuesto, no un
                  control único, así que se nombra por aria-labelledby desde el disparador. */}
              <span className="control__label" id="category-color-label">
                Color
              </span>
              <ColorPickerDropdown
                labelId="category-color-label"
                value={draft.color}
                onChange={(color) => updateField('color', color)}
              />
            </div>
          </div>

          <div className="category-form__actions">
            {isEditing ? (
              <button type="button" className="button button--ghost" onClick={resetForm}>
                Cancelar edición
              </button>
            ) : null}

            <button
              type="submit"
              className="button button--primary"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending
                ? 'Guardando…'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear categoría'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="results-header">
          <div>
            <h2 className="results-title">Categorías disponibles</h2>
            <p className="results-subtitle">
              Cada categoría es privada para tu cuenta y puede asignarse a varios ítems.
            </p>
          </div>
        </div>

        {categoriesQuery.isError ? (
          <EmptyState
            title="No se pudieron cargar las categorías"
            message="Recarga la vista o revisa la conexión con el backend."
            action={
              <button
                className="button button--primary"
                type="button"
                onClick={() => categoriesQuery.refetch()}
              >
                Reintentar
              </button>
            }
          />
        ) : null}

        {!categoriesQuery.isError && categories.length === 0 ? (
          <EmptyState
            title="Todavía no tienes categorías"
            message="Crea la primera para empezar a agrupar tu biblioteca con reglas propias."
            action={
              <button className="button button--primary" type="button" onClick={openFreshEditor}>
                <PlusIcon width={18} height={18} />
                Abrir editor
              </button>
            }
          />
        ) : null}

        {!categoriesQuery.isError && categories.length > 0 ? (
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
                {categories.map((category) => (
                  <tr key={category.id} className="search-row">
                    <td className="search-row__meta-cell">
                      <div className="category-row__color">
                        <span
                          className="category-pill__swatch category-pill__swatch--lg"
                          style={{ backgroundColor: category.color ?? 'transparent' }}
                          aria-hidden="true"
                        />
                        <span>{category.color ?? 'Sin color'}</span>
                      </div>
                    </td>
                    <td className="search-row__title-cell">
                      <span className="search-row__title">{category.name}</span>
                    </td>
                    <td className="search-row__actions-cell">
                      <div className="search-row__actions">
                        <button
                          className="button button--secondary"
                          type="button"
                          onClick={() => {
                            setError(null)
                            setEditingCategory(category)
                            setDraft(createDraft(category))
                            focusEditor()
                          }}
                        >
                          <PencilSquareIcon width={16} height={16} />
                          Editar
                        </button>
                        <button
                          className="button button--danger"
                          type="button"
                          onClick={() => handleDelete(category)}
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
        ) : null}
      </section>

      <ConfirmDialog
        open={deleteCandidate !== null}
        title={
          deleteCandidate ? `Eliminar la categoría "${deleteCandidate.name}"` : 'Eliminar categoría'
        }
        message="Esta categoría desaparecerá de tu taxonomía personal y dejará de estar disponible en Biblioteca y Descubrir."
        confirmLabel="Eliminar categoría"
        cancelLabel="Conservar categoría"
        tone="danger"
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            deleteMutation.mutate(deleteCandidate)
          }
        }}
      />
    </section>
  )
}
