import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  ChevronDownIcon,
  PlusIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CategoriesApi } from '@/features/categories/api/CategoriesAPI'
import { MediaItemsApi } from '@/features/media-items/api/MediaItemsAPI'
import MediaItemEditorForm from '@/features/media-items/components/MediaItemEditorForm'
import LibraryFilters from '@/features/media-items/components/LibraryFilters'
import MediaItemRow from '@/features/media-items/components/MediaItemRow'
import MediaStatsPanel from '@/features/media-items/components/MediaStatsPanel'
import {
  type CreateMediaItemInput,
  type LibraryImportResponse,
  type LibraryTransferFormat,
  type MediaItem,
  type MediaItemsFilters,
  type MediaItemSourceType,
  type MediaItemsSortField,
  type MediaTrackingStatus,
  type MediaType,
  type SortDirection,
} from '@/features/media-items/schemas/mediaItemSchema'
import EmptyState from '@/shared/components/EmptyState'
import Loader from '@/shared/components/Loader'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import SidePanelDialog from '@/shared/components/SidePanelDialog'
import { useToast } from '@/shared/hooks/useToast'
import { queryKeys } from '@/shared/constants/queryKeys'
import { toPositiveInt } from '@/shared/utils'

type FilterPatch = Partial<Record<keyof MediaItemsFilters, string | number | string[] | undefined>>

interface TransferActionMenuItem {
  key: string
  label: string
  onSelect: () => void
  disabled?: boolean
}

function TransferActionMenu({
  label,
  icon,
  disabled = false,
  items,
}: {
  label: string
  icon: ReactNode
  disabled?: boolean
  items: TransferActionMenuItem[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const isMenuOpen = isOpen && !disabled

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  return (
    <div className={`action-menu${isMenuOpen ? ' action-menu--open' : ''}`} ref={rootRef}>
      <button
        className="button button--secondary action-menu__trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
      >
        {icon}
        <span className="action-menu__label">{label}</span>
        <ChevronDownIcon className="action-menu__chevron" width={16} height={16} aria-hidden="true" />
      </button>

      {isMenuOpen ? (
        <div className="action-menu__popover" role="menu" aria-label={label}>
          {items.map((item) => (
            <button
              key={item.key}
              className="action-menu__item"
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setIsOpen(false)
                item.onSelect()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function extractApiError(error: unknown, fallback: string): string {
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

function getTransferFormatLabel(format: LibraryTransferFormat): string {
  return format === 'Json' ? 'JSON' : 'CSV'
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function joinWithAnd(values: string[]): string {
  if (values.length <= 1) {
    return values[0] ?? ''
  }

  return `${values.slice(0, -1).join(', ')} y ${values[values.length - 1]}`
}

function buildImportToastMessage(result: LibraryImportResponse): string {
  const details: string[] = []

  if (result.itemsCreated > 0) {
    details.push(formatCount(result.itemsCreated, 'creado', 'creados'))
  }

  if (result.itemsUpdated > 0) {
    details.push(formatCount(result.itemsUpdated, 'actualizado', 'actualizados'))
  }

  if (result.categoriesCreated > 0) {
    details.push(formatCount(result.categoriesCreated, 'categoría nueva', 'categorías nuevas'))
  }

  if (details.length === 0) {
    return `Importación ${getTransferFormatLabel(result.format)} completada sin cambios.`
  }

  return `Importación ${getTransferFormatLabel(result.format)} completada: ${joinWithAnd(details)}.`
}

function downloadLibraryFile(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

function countAppliedFilters(filters: MediaItemsFilters): number {
  let total = 0

  if (filters.search) total += 1
  if (filters.type) total += 1
  if ((filters.categoryIds?.length ?? 0) > 0) total += 1
  if (filters.status) total += 1
  if (filters.sourceType) total += 1
  if (filters.createdFrom) total += 1
  if (filters.createdTo) total += 1
  if (typeof filters.minPersonalScore === 'number') total += 1
  if (typeof filters.maxPersonalScore === 'number') total += 1

  return total
}

function resolveFilters(searchParams: URLSearchParams): MediaItemsFilters {
  const categoryIds = searchParams.getAll('categoryIds').filter((value) => value.length > 0)

  return {
    search: searchParams.get('search') || undefined,
    type: (searchParams.get('type') as MediaType | null) ?? undefined,
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    status: (searchParams.get('status') as MediaTrackingStatus | null) ?? undefined,
    sourceType: (searchParams.get('sourceType') as MediaItemSourceType | null) ?? undefined,
    createdFrom: searchParams.get('createdFrom') || undefined,
    createdTo: searchParams.get('createdTo') || undefined,
    minPersonalScore: searchParams.get('minPersonalScore') ? Number(searchParams.get('minPersonalScore')) : undefined,
    maxPersonalScore: searchParams.get('maxPersonalScore') ? Number(searchParams.get('maxPersonalScore')) : undefined,
    sortBy: ((searchParams.get('sortBy') as MediaItemsSortField | null) ?? 'CreatedAt'),
    sortDirection: ((searchParams.get('sortDirection') as SortDirection | null) ?? 'Desc'),
    page: toPositiveInt(searchParams.get('page'), 1),
    pageSize: toPositiveInt(searchParams.get('pageSize'), 12),
  }
}

export default function LibraryView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = resolveFilters(searchParams)
  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const [editorError, setEditorError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [isCreateEditorOpen, setIsCreateEditorOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<MediaItem | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const importJsonInputRef = useRef<HTMLInputElement | null>(null)
  const importCsvInputRef = useRef<HTMLInputElement | null>(null)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const isEditorOpen = isCreateEditorOpen || editingItem !== null

  const libraryQuery = useQuery({
    queryKey: queryKeys.mediaItems.list(filters),
    queryFn: ({ signal }) => MediaItemsApi.getAll(filters, signal),
  })

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: ({ signal }) => CategoriesApi.getAll(signal),
  })

  const statsQuery = useQuery({
    queryKey: queryKeys.mediaItems.stats(),
    queryFn: ({ signal }) => MediaItemsApi.getStats(signal),
  })

  const saveMutation = useMutation({
    mutationFn: async ({ itemId, payload }: { itemId: string | null, payload: CreateMediaItemInput }) => {
      if (itemId) {
        return MediaItemsApi.update(itemId, payload)
      }

      return MediaItemsApi.create(payload)
    },
    onSuccess: (savedItem, variables) => {
      showToast({
        tone: 'success',
        message: variables.itemId
          ? `"${savedItem.title}" se actualizó correctamente.`
          : `"${savedItem.title}" se agregó a tu biblioteca.`,
      })
      setEditorError(null)
      setEditingItem(null)
      setIsCreateEditorOpen(false)
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (error, variables) => {
      setEditorError(
        extractApiError(
          error,
          variables.itemId ? 'No se pudo actualizar el elemento.' : 'No se pudo crear el elemento.',
        ),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
      setPendingDeleteId(item.id)
      await MediaItemsApi.remove(item.id)
      return item
    },
    onSuccess: (item) => {
      if (editingItem?.id === item.id) {
        setEditingItem(null)
        setIsCreateEditorOpen(false)
        setEditorError(null)
      }

      setDeleteCandidate(null)
      showToast({ tone: 'success', message: `"${item.title}" se eliminó de tu biblioteca.` })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (error) => {
      setDeleteCandidate(null)
      showToast({
        tone: 'danger',
        message: extractApiError(error, 'No se pudo eliminar el elemento.'),
      })
    },
    onSettled: () => {
      setPendingDeleteId(null)
    },
  })

  const exportMutation = useMutation({
    mutationFn: (format: LibraryTransferFormat) => MediaItemsApi.exportLibrary(format),
    onSuccess: ({ blob, fileName }, format) => {
      downloadLibraryFile(blob, fileName)
      showToast({
        tone: 'success',
        message: `Se descargó tu biblioteca en formato ${getTransferFormatLabel(format)}.`,
      })
    },
    onError: (error, format) => {
      showToast({
        tone: 'danger',
        message: extractApiError(error, `No se pudo exportar la biblioteca en ${getTransferFormatLabel(format)}.`),
      })
    },
  })

  const importMutation = useMutation({
    mutationFn: ({ format, file }: { format: LibraryTransferFormat; file: File }) => MediaItemsApi.importLibrary(format, file),
    onSuccess: (result) => {
      showToast({
        tone: 'success',
        message: buildImportToastMessage(result),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.root })
    },
    onError: (error, variables) => {
      showToast({
        tone: 'danger',
        message: extractApiError(error, `No se pudo importar el archivo ${getTransferFormatLabel(variables.format)}.`),
      })
    },
  })

  const applyFilterPatch = (patch: FilterPatch) => {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(patch).forEach(([key, value]) => {
      nextParams.delete(key)

      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry !== '') {
            nextParams.append(key, entry)
          }
        })
      } else if (value !== undefined && value !== '') {
        nextParams.set(key, String(value))
      }

      if (key !== 'page') {
        nextParams.set('page', '1')
      }
    })

    setSearchParams(nextParams)
  }

  const clearFilters = () => {
    const nextParams = new URLSearchParams()
    nextParams.set('page', '1')
    nextParams.set('pageSize', String(filters.pageSize ?? 12))
    setSearchParams(nextParams)
    setSearchInput('')
  }

  const openCreateEditor = () => {
    setEditorError(null)
    setEditingItem(null)
    setIsCreateEditorOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEditEditor = (item: MediaItem) => {
    setEditorError(null)
    setEditingItem(item)
    setIsCreateEditorOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeEditor = () => {
    setEditorError(null)
    setEditingItem(null)
    setIsCreateEditorOpen(false)
  }

  const handleEditorSubmit = (payload: CreateMediaItemInput) => {
    setEditorError(null)
    saveMutation.mutate({ itemId: editingItem?.id ?? null, payload })
  }

  const handleDeleteItem = (item: MediaItem) => {
    setDeleteCandidate(item)
  }

  const triggerImportSelection = (format: LibraryTransferFormat) => {
    if (format === 'Json') {
      importJsonInputRef.current?.click()
      return
    }

    importCsvInputRef.current?.click()
  }

  const handleImportFileChange = (format: LibraryTransferFormat) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''

    if (!file) {
      return
    }

    importMutation.mutate({ format, file })
  }

  const handleSearchSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    applyFilterPatch({ search: searchInput.trim() || undefined })
  }

  const goToPage = (page: number) => {
    applyFilterPatch({ page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const availableCategories = categoriesQuery.data ?? []
  const response = libraryQuery.data
  const items = response?.items ?? []
  const appliedFilterCount = countAppliedFilters(filters)
  const hasItems = (response?.totalCount ?? 0) > 0
  const showStatusStack = Boolean(libraryQuery.isError || statsQuery.isError || categoriesQuery.isError)
  const categoriesHelpText = categoriesQuery.isError
    ? 'Las categorías no están disponibles ahora mismo. Puedes seguir filtrando por texto, estado y origen.'
    : undefined

  if (libraryQuery.isLoading && !response && statsQuery.isLoading) {
    return <Loader title="Cargando biblioteca" message="Sincronizando filtros, listado y estadísticas." />
  }

  return (
    <section className="page">
      <section className="hero-panel">
        <span className="hero-panel__eyebrow">
          <RectangleStackIcon width={18} height={18} />
          Biblioteca
        </span>
        <h1 className="hero-panel__title">Tu biblioteca</h1>
        <p className="hero-panel__description">
          Encuentra, filtra y actualiza tu colección desde un único panel.
        </p>
        <div className="hero-panel__meta">
          <span className="hero-chip">{response?.totalCount ?? 0} registros</span>
          <span className="hero-chip">
            {appliedFilterCount > 0 ? `${appliedFilterCount} filtros activos` : 'Sin filtros extra'}
          </span>
          <span className="hero-chip">Página {response?.page ?? filters.page ?? 1}</span>
        </div>
        <div className="hero-panel__actions">
          <button className="button button--primary" type="button" onClick={openCreateEditor}>
            <PlusIcon width={18} height={18} />
            Nuevo registro
          </button>
          <button
            className={`button button--secondary${isFiltersOpen ? ' button--active' : ''}`}
            type="button"
            onClick={() => setIsFiltersOpen((prev) => !prev)}
          >
            <AdjustmentsHorizontalIcon width={18} height={18} />
            {isFiltersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            {appliedFilterCount > 0 ? ` (${appliedFilterCount})` : ''}
          </button>
          <button
            className={`button button--secondary${isStatsOpen ? ' button--active' : ''}`}
            type="button"
            onClick={() => setIsStatsOpen((prev) => !prev)}
          >
            <ChartBarIcon width={18} height={18} />
            {isStatsOpen ? 'Ocultar resumen' : 'Resumen'}
          </button>
          <TransferActionMenu
            label="Importar"
            icon={<ArrowUpTrayIcon width={18} height={18} />}
            disabled={importMutation.isPending}
            items={[
              { key: 'import-json', label: 'JSON', onSelect: () => triggerImportSelection('Json') },
              { key: 'import-csv', label: 'CSV', onSelect: () => triggerImportSelection('Csv') },
            ]}
          />
          <TransferActionMenu
            label="Exportar"
            icon={<ArrowDownTrayIcon width={18} height={18} />}
            disabled={exportMutation.isPending || libraryQuery.isError || !hasItems}
            items={[
              { key: 'export-json', label: 'JSON', onSelect: () => exportMutation.mutate('Json') },
              { key: 'export-csv', label: 'CSV', onSelect: () => exportMutation.mutate('Csv') },
            ]}
          />
        </div>
        <input
          ref={importJsonInputRef}
          data-testid="library-import-json-input"
          hidden
          type="file"
          accept=".json,application/json"
          onChange={handleImportFileChange('Json')}
        />
        <input
          ref={importCsvInputRef}
          data-testid="library-import-csv-input"
          hidden
          type="file"
          accept=".csv,text/csv"
          onChange={handleImportFileChange('Csv')}
        />
      </section>

      {showStatusStack ? (
        <div className="status-stack">
          {libraryQuery.isError ? (
            <div className="status-banner status-banner--danger" role="alert">
              <strong>La biblioteca no se sincronizó.</strong>
              <span>Reintenta la carga o revisa el backend antes de seguir editando.</span>
            </div>
          ) : null}
          {statsQuery.isError ? (
            <div className="status-banner status-banner--warning" role="status">
              <strong>Las estadísticas no están disponibles.</strong>
              <span>La colección sigue accesible, pero el resumen no pudo actualizarse.</span>
            </div>
          ) : null}
          {categoriesQuery.isError ? (
            <div className="status-banner status-banner--warning" role="status">
              <strong>Las categorías no se cargaron.</strong>
              <span>El editor y los filtros seguirán sin categorías hasta que vuelva la conexión.</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {isFiltersOpen ? (
        <section className="panel">
          <LibraryFilters
            categories={availableCategories}
            categoriesHelpText={categoriesHelpText}
            filters={filters}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSubmit={handleSearchSubmit}
            onFilterChange={applyFilterPatch}
            onClearFilters={clearFilters}
          />
        </section>
      ) : null}

      <section className="panel">
        <div className="results-header">
          <div>
            <h2 className="results-title">Resultados</h2>
            <p className="results-subtitle">
              {libraryQuery.isError
                ? 'No pudimos actualizar el listado con los criterios actuales.'
                : `${response?.totalCount ?? 0} coincidencias con los criterios actuales.`}
            </p>
          </div>
        </div>

        {libraryQuery.isError ? (
          <EmptyState
            title="No se pudo cargar la biblioteca"
            message="Verifica tu conexión o recarga la página."
            action={
              <button className="button button--primary" onClick={() => libraryQuery.refetch()}>
                Reintentar
              </button>
            }
          />
        ) : null}

        {!libraryQuery.isError && items.length === 0 ? (
          <EmptyState
            title="Tu biblioteca todavía está vacía"
            message="Usa Descubrir para importar títulos desde los catálogos activos o agrega un registro manual desde aquí."
            action={
              <button className="button button--primary" type="button" onClick={openCreateEditor}>
                <PlusIcon width={18} height={18} />
                Agregar manualmente
              </button>
            }
          />
        ) : null}

        {!libraryQuery.isError && items.length > 0 ? (
          <>
            <div className="search-table-wrapper">
              <table className="search-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Origen</th>
                    <th>Progreso</th>
                    <th>Año</th>
                    <th>Puntuación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <MediaItemRow
                      key={item.id}
                      item={item}
                      isDeleting={deleteMutation.isPending && pendingDeleteId === item.id}
                      onDelete={handleDeleteItem}
                      onEdit={openEditEditor}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                className="button button--secondary"
                onClick={() => goToPage(Math.max((response?.page ?? 1) - 1, 1))}
                disabled={(response?.page ?? 1) <= 1}
              >
                Anterior
              </button>
              <span className="pagination__label">
                Página {response?.page ?? 1} de {response?.totalPages ?? 1}
              </span>
              <button
                className="button button--secondary"
                onClick={() => goToPage(Math.min((response?.page ?? 1) + 1, response?.totalPages ?? 1))}
                disabled={!response || response.page >= response.totalPages}
              >
                Siguiente
              </button>
            </div>
          </>
        ) : null}
      </section>

      {isStatsOpen && statsQuery.data && !statsQuery.isError ? <MediaStatsPanel stats={statsQuery.data} /> : null}

      {isEditorOpen ? (
        <SidePanelDialog
          open={isEditorOpen}
          ariaLabel={editingItem ? `Editar ${editingItem.title}` : 'Crear elemento de biblioteca'}
          scrimLabel="Cerrar panel del editor"
          variant="centered"
          onClose={closeEditor}
        >
          <div className="side-panel__meta">
            <span className="hero-chip">
              <RectangleStackIcon width={16} height={16} />
              {editingItem ? 'Edición rápida' : 'Registro manual'}
            </span>
            <p className="side-panel__hint">
              {editingItem
                ? 'Ajusta la ficha seleccionada sin perder el contexto del listado ni los filtros actuales.'
                : 'Añade un nuevo elemento desde la biblioteca sin desplazar el contenido principal.'}
            </p>
          </div>

          <MediaItemEditorForm
            key={editingItem?.id ?? 'create'}
            item={editingItem}
            availableCategories={availableCategories}
            error={editorError}
            isPending={saveMutation.isPending}
            onCancel={closeEditor}
            onSubmit={handleEditorSubmit}
          />
        </SidePanelDialog>
      ) : null}

      <ConfirmDialog
        open={deleteCandidate !== null}
        title={deleteCandidate ? `Eliminar "${deleteCandidate.title}"` : 'Eliminar elemento'}
        message="Esta acción sacará el elemento de tu biblioteca. Podrás volver a crearlo o importarlo después, pero perderás su estado y notas actuales."
        confirmLabel="Eliminar elemento"
        cancelLabel="Conservar elemento"
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