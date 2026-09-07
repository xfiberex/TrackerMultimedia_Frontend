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
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
          {value.trim() || t('categorias.sinColor')}
        </span>
        <ChevronDownIcon
          className={`color-picker-trigger__chevron${isOpen ? ' color-picker-trigger__chevron--open' : ''}`}
          width={14}
          height={14}
        />
      </button>

      {isOpen ? (
        <div
          className="color-picker-popover"
          role="listbox"
          aria-label={t('categorias.selectorColor')}
        >
          <div
            className="color-picker-presets"
            role="group"
            aria-label={t('categorias.coloresPredefinidos')}
          >
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
            <label htmlFor="cat-color-native">{t('categorias.personalizado')}</label>
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
              aria-label={t('categorias.hexadecimal')}
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
                {t('categorias.quitar')}
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
  const { t } = useTranslation()

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
          ? t('categorias.actualizada', { nombre: saved.name })
          : t('categorias.creada', { nombre: saved.name }),
      })
      setIsModalOpen(false)
      setFormError(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.root })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (err, variables) => {
      setFormError(
        extractApiError(
          err,
          variables.id ? t('categorias.errorActualizar') : t('categorias.errorCrear'),
        ),
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
      showToast({ tone: 'success', message: t('categorias.eliminada', { nombre: deleted.name }) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.root })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (err) => {
      setDeleteCandidate(null)
      showToast({
        tone: 'danger',
        message: extractApiError(err, t('categorias.errorEliminar')),
      })
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
    return <Loader title={t('categorias.cargandoTitulo')} />
  }

  return (
    <>
      <div className="catalog-section">
        <div className="catalog-section__header">
          <div>
            <h2 className="catalog-section__title">
              <TagIcon width={18} height={18} />
              {t('catalogo.pestanaCategorias')}
            </h2>
            <p className="catalog-section__description">{t('catalogo.categoriasDescripcion')}</p>
          </div>
          <button className="button button--primary" type="button" onClick={openCreate}>
            <PlusIcon width={18} height={18} />
            {t('catalogo.nuevaCategoria')}
          </button>
        </div>

        {categoriesQuery.isError ? (
          <EmptyState
            title={t('categorias.errorTitulo')}
            message={t('categorias.errorMensaje')}
            action={
              <button
                className="button button--primary"
                type="button"
                onClick={() => categoriesQuery.refetch()}
              >
                {t('comun.reintentar')}
              </button>
            }
          />
        ) : categories.length === 0 ? (
          <EmptyState
            title={t('catalogo.categoriasVaciaTitulo')}
            message={t('catalogo.categoriasVaciaMensaje')}
            action={
              <button className="button button--primary" type="button" onClick={openCreate}>
                <PlusIcon width={18} height={18} />
                {t('catalogo.nuevaCategoria')}
              </button>
            }
          />
        ) : (
          <div className="search-table-wrapper">
            <table className="search-table">
              <thead>
                <tr>
                  <th>{t('categorias.color')}</th>
                  <th>{t('catalogo.nombre')}</th>
                  <th>{t('tabla.colAcciones')}</th>
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
                        <span>{cat.color ?? t('categorias.sinColor')}</span>
                      </div>
                    </td>
                    <td className="search-row__title-cell">
                      <span className="search-row__title">{cat.name}</span>
                    </td>
                    <td className="search-row__actions-cell">
                      <div className="search-row__actions">
                        <button
                          className="button button--secondary"
                          type="button"
                          onClick={() => openEdit(cat)}
                        >
                          <PencilSquareIcon width={16} height={16} />
                          {t('comun.editar')}
                        </button>
                        <button
                          className="button button--danger"
                          type="button"
                          onClick={() => setDeleteCandidate(cat)}
                          disabled={deleteMutation.isPending}
                        >
                          <TrashIcon width={16} height={16} />
                          {t('comun.eliminar')}
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
        ariaLabel={editingCategory ? t('catalogo.editarCategoria') : t('catalogo.nuevaCategoria')}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="catalog-modal">
          <div className="catalog-modal__header">
            <h3 className="catalog-modal__title">
              {editingCategory
                ? t('catalogo.editarNombrado', { nombre: editingCategory.name })
                : t('catalogo.nuevaCategoria')}
            </h3>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setIsModalOpen(false)}
            >
              {t('comun.cancelar')}
            </button>
          </div>

          <form className="filters-form" onSubmit={handleSubmit}>
            {formError ? (
              <div className="auth-error" role="alert">
                {formError}
              </div>
            ) : null}

            <div className="control">
              <label htmlFor="cat-name">{t('catalogo.nombre')}</label>
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
              <span className="control__label" id="format-color-label">
                {t('categorias.color')}
              </span>
              <ColorPickerDropdown
                labelId="format-color-label"
                value={draft.color}
                onChange={(color) => setDraft((d) => ({ ...d, color }))}
              />
            </div>

            <div className="catalog-modal__actions">
              <button
                type="submit"
                className="button button--primary"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? t('comun.guardando')
                  : editingCategory
                    ? t('perfil.guardarCambios')
                    : t('categorias.crear')}
              </button>
            </div>
          </form>
        </div>
      </SidePanelDialog>

      <ConfirmDialog
        open={deleteCandidate !== null}
        title={
          deleteCandidate
            ? t('catalogo.eliminarNombrado', { nombre: deleteCandidate.name })
            : t('categorias.dialogoTituloGenerico')
        }
        message={t('catalogo.categoriaDialogoMensaje')}
        confirmLabel={t('categorias.dialogoConfirmar')}
        cancelLabel={t('catalogo.conservar')}
        tone="danger"
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) deleteMutation.mutate(deleteCandidate)
        }}
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
  const { t } = useTranslation()

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
          ? t('categorias.actualizada', { nombre: saved.name })
          : t('categorias.creada', { nombre: saved.name }),
      })
      setIsModalOpen(false)
      setFormError(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.formats.root })
    },
    onError: (err, variables) => {
      setFormError(
        extractApiError(
          err,
          variables.id ? t('catalogo.formatoErrorActualizar') : t('catalogo.formatoErrorCrear'),
        ),
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
      showToast({ tone: 'success', message: t('categorias.eliminada', { nombre: deleted.name }) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.formats.root })
    },
    onError: (err) => {
      setDeleteCandidate(null)
      showToast({
        tone: 'danger',
        message: extractApiError(err, t('catalogo.formatoErrorEliminar')),
      })
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
    return <Loader title={t('catalogo.formatosCargando')} />
  }

  return (
    <>
      <div className="catalog-section">
        <div className="catalog-section__header">
          <div>
            <h2 className="catalog-section__title">
              <Squares2X2Icon width={18} height={18} />
              {t('catalogo.pestanaFormatos')}
            </h2>
            <p className="catalog-section__description">{t('catalogo.formatosDescripcion')}</p>
          </div>
          <button className="button button--primary" type="button" onClick={openCreate}>
            <PlusIcon width={18} height={18} />
            {t('catalogo.nuevoFormato')}
          </button>
        </div>

        {formatsQuery.isError ? (
          <EmptyState
            title={t('catalogo.formatosErrorTitulo')}
            message={t('categorias.errorMensaje')}
            action={
              <button
                className="button button--primary"
                type="button"
                onClick={() => formatsQuery.refetch()}
              >
                {t('comun.reintentar')}
              </button>
            }
          />
        ) : formats.length === 0 ? (
          <EmptyState
            title={t('catalogo.formatosVaciaTitulo')}
            message={t('catalogo.formatosVaciaMensaje')}
            action={
              <button className="button button--primary" type="button" onClick={openCreate}>
                <PlusIcon width={18} height={18} />
                {t('catalogo.nuevoFormato')}
              </button>
            }
          />
        ) : (
          <div className="search-table-wrapper">
            <table className="search-table">
              <thead>
                <tr>
                  <th>{t('catalogo.nombre')}</th>
                  <th>{t('tabla.colAcciones')}</th>
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
                        <button
                          className="button button--secondary"
                          type="button"
                          onClick={() => openEdit(fmt)}
                        >
                          <PencilSquareIcon width={16} height={16} />
                          {t('comun.editar')}
                        </button>
                        <button
                          className="button button--danger"
                          type="button"
                          onClick={() => setDeleteCandidate(fmt)}
                          disabled={deleteMutation.isPending}
                        >
                          <TrashIcon width={16} height={16} />
                          {t('comun.eliminar')}
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
        ariaLabel={editingFormat ? t('catalogo.editarFormato') : t('catalogo.nuevoFormato')}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="catalog-modal">
          <div className="catalog-modal__header">
            <h3 className="catalog-modal__title">
              {editingFormat
                ? t('catalogo.editarNombrado', { nombre: editingFormat.name })
                : t('catalogo.nuevoFormato')}
            </h3>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setIsModalOpen(false)}
            >
              {t('comun.cancelar')}
            </button>
          </div>

          <form className="filters-form" onSubmit={handleSubmit}>
            {formError ? (
              <div className="auth-error" role="alert">
                {formError}
              </div>
            ) : null}

            <div className="control">
              <label htmlFor="fmt-name">{t('catalogo.nombreFormato')}</label>
              <input
                id="fmt-name"
                className="input"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                required
                data-dialog-autofocus
                placeholder={t('catalogo.nombreFormatoPista')}
              />
            </div>

            <div className="catalog-modal__actions">
              <button
                type="submit"
                className="button button--primary"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? t('comun.guardando')
                  : editingFormat
                    ? t('perfil.guardarCambios')
                    : t('catalogo.crearFormato')}
              </button>
            </div>
          </form>
        </div>
      </SidePanelDialog>

      <ConfirmDialog
        open={deleteCandidate !== null}
        title={
          deleteCandidate
            ? t('catalogo.eliminarNombrado', { nombre: deleteCandidate.name })
            : t('catalogo.formatoDialogoTituloGenerico')
        }
        message={t('catalogo.formatoDialogoMensaje')}
        confirmLabel={t('catalogo.formatoDialogoConfirmar')}
        cancelLabel={t('catalogo.conservar')}
        tone="danger"
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) deleteMutation.mutate(deleteCandidate)
        }}
      />
    </>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

type CatalogTab = 'categories' | 'formats'

export default function CatalogView() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<CatalogTab>('categories')

  return (
    <section className="page">
      <section className="hero-panel">
        <span className="hero-panel__eyebrow">
          <Squares2X2Icon width={18} height={18} />
          {t('catalogo.eyebrow')}
        </span>
        <h1 className="hero-panel__title">{t('catalogo.titulo')}</h1>
        <p className="hero-panel__description">{t('catalogo.descripcion')}</p>
      </section>

      <div className="catalog-tabs">
        <button
          type="button"
          className={`catalog-tab${activeTab === 'categories' ? ' catalog-tab--active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <TagIcon width={16} height={16} />
          {t('catalogo.pestanaCategorias')}
        </button>
        <button
          type="button"
          className={`catalog-tab${activeTab === 'formats' ? ' catalog-tab--active' : ''}`}
          onClick={() => setActiveTab('formats')}
        >
          <Squares2X2Icon width={16} height={16} />
          {t('catalogo.pestanaFormatos')}
        </button>
      </div>

      <section className="panel">
        {activeTab === 'categories' ? <CategoriesSection /> : <FormatsSection />}
      </section>
    </section>
  )
}
