import {
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
import { useToast } from '@/shared/components/ToastProvider'
import { queryKeys } from '@/shared/constants/queryKeys'

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

  // Resincronizar draft cuando cambia el category siendo editado
  useEffect(() => {
    setDraft(createDraft(editingCategory))
  }, [editingCategory])

  const saveMutation = useMutation({
    mutationFn: async ({ categoryId, payload }: { categoryId: string | null, payload: CreateCategoryInput }) => {
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.root })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (mutationError, variables) => {
      setError(
        extractCategoriesError(
          mutationError,
          variables.categoryId ? 'No se pudo actualizar la categoría.' : 'No se pudo crear la categoría.',
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
    focusEditor()
  }

  const resetForm = () => {
    setEditingCategory(null)
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
          Crea, renombra y elimina categorías personales para organizar tu biblioteca con tus propias reglas.
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
            <span>Puedes seguir preparando el editor, pero la lista no se refrescó correctamente.</span>
          </div>
        </div>
      ) : null}

      <section className="panel" ref={editorSectionRef}>
        <div className="panel__header">
          <div>
            <h2 className="panel__title">Editor de categorías</h2>
            <p className="panel__description">
              Usa colores opcionales para distinguir grupos como backlog, favoritos, pendientes o temporadas.
            </p>
          </div>
          {!isEditing ? (
            <span className="hero-chip">
              <PlusIcon width={16} height={16} />
              Nueva categoría
            </span>
          ) : null}
        </div>

        <form className="filters-form category-form" aria-label="Formulario de categorías" onSubmit={handleSubmit}>
          {error ? <div className="auth-error" role="alert">{error}</div> : null}

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
              <label htmlFor="category-color">Color</label>
              <input
                id="category-color"
                className="input"
                placeholder="#336699"
                value={draft.color}
                onChange={(event) => updateField('color', event.target.value)}
              />
            </div>
          </div>

          <div className="category-form__actions">
            {isEditing ? (
              <button type="button" className="button button--ghost" onClick={resetForm}>
                Cancelar edición
              </button>
            ) : null}

            <button type="submit" className="button button--primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="results-header">
          <div>
            <h2 className="results-title">Categorías disponibles</h2>
            <p className="results-subtitle">Cada categoría es privada para tu cuenta y puede asignarse a varios ítems.</p>
          </div>
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
          <ul className="category-list">
            {categories.map((category) => (
              <li key={category.id} className="category-list__item">
                <div className="category-list__info">
                  <span
                    className="category-pill__swatch"
                    style={{ backgroundColor: category.color ?? 'transparent' }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="category-list__title">{category.name}</p>
                    <p className="category-list__meta">{category.color ?? 'Sin color asignado'}</p>
                  </div>
                </div>

                <div className="card-actions__buttons">
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => {
                      setError(null)
                      setEditingCategory(category)
                      focusEditor()
                    }}
                  >
                    <PencilSquareIcon width={18} height={18} />
                    Editar
                  </button>

                  <button
                    className="button button--danger"
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={deleteMutation.isPending}
                  >
                    <TrashIcon width={18} height={18} />
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <ConfirmDialog
        open={deleteCandidate !== null}
        title={deleteCandidate ? `Eliminar la categoría "${deleteCandidate.name}"` : 'Eliminar categoría'}
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