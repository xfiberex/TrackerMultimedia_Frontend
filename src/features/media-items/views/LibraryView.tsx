import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  PlusIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import i18n from '@/shared/i18n'
import { CategoriesApi } from '@/features/categories/api/CategoriesAPI'
import { FormatsApi } from '@/features/catalog/api/FormatsAPI'
import { MediaItemsApi } from '@/features/media-items/api/MediaItemsAPI'
import MediaItemEditorForm from '@/features/media-items/components/MediaItemEditorForm'
import LibraryFilters from '@/features/media-items/components/LibraryFilters'
import MediaItemRow from '@/features/media-items/components/MediaItemRow'
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
import { downloadBlob, extractApiError, toPositiveInt } from '@/shared/utils'

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
        <ChevronDownIcon
          className="action-menu__chevron"
          width={16}
          height={16}
          aria-hidden="true"
        />
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

function getTransferFormatLabel(format: LibraryTransferFormat): string {
  return format === 'Json' ? 'JSON' : 'CSV'
}

/**
 * Une «3 creados», «1 actualizado» y «2 categorías nuevas» en una enumeración.
 *
 * Antes lo hacía una función a mano que pegaba « y » entre los dos últimos. Esa «y» es
 * española: en inglés hay que decir «and», y en muchos idiomas la coma de antes también
 * cambia. `Intl.ListFormat` es el que sabe eso para el idioma que se le pase, así que la
 * función a mano sobra.
 */
function enumerar(valores: string[], idioma: string): string {
  return new Intl.ListFormat(idioma, { style: 'long', type: 'conjunction' }).format(valores)
}

function buildImportToastMessage(result: LibraryImportResponse, t: TFunction): string {
  const details: string[] = []

  if (result.itemsCreated > 0) {
    details.push(t('biblioteca.importCreados', { count: result.itemsCreated }))
  }

  if (result.itemsUpdated > 0) {
    details.push(t('biblioteca.importActualizados', { count: result.itemsUpdated }))
  }

  if (result.categoriesCreated > 0) {
    details.push(t('biblioteca.importCategorias', { count: result.categoriesCreated }))
  }

  const formato = getTransferFormatLabel(result.format)

  // T2-29 sigue abierta: un JSON que no es una exportación no crea ni actualiza nada, así
  // que cae aquí y se anuncia como una importación correcta «sin cambios».
  if (details.length === 0) {
    return t('biblioteca.importSinCambios', { formato })
  }

  return t('biblioteca.importResumen', {
    formato,
    detalles: enumerar(details, i18n.language),
  })
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
    minPersonalScore: searchParams.get('minPersonalScore')
      ? Number(searchParams.get('minPersonalScore'))
      : undefined,
    maxPersonalScore: searchParams.get('maxPersonalScore')
      ? Number(searchParams.get('maxPersonalScore'))
      : undefined,
    sortBy: (searchParams.get('sortBy') as MediaItemsSortField | null) ?? 'CreatedAt',
    sortDirection: (searchParams.get('sortDirection') as SortDirection | null) ?? 'Desc',
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
  const [deleteCandidate, setDeleteCandidate] = useState<MediaItem | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const importJsonInputRef = useRef<HTMLInputElement | null>(null)
  const importCsvInputRef = useRef<HTMLInputElement | null>(null)
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { t } = useTranslation()

  const isEditorOpen = isCreateEditorOpen || editingItem !== null

  const libraryQuery = useQuery({
    queryKey: queryKeys.mediaItems.list(filters),
    queryFn: ({ signal }) => MediaItemsApi.getAll(filters, signal),
  })

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: ({ signal }) => CategoriesApi.getAll(signal),
  })

  const formatsQuery = useQuery({
    queryKey: queryKeys.formats.list(),
    queryFn: ({ signal }) => FormatsApi.getAll(signal),
  })

  const saveMutation = useMutation({
    mutationFn: async ({
      itemId,
      payload,
    }: {
      itemId: string | null
      payload: CreateMediaItemInput
    }) => {
      if (itemId) {
        return MediaItemsApi.update(itemId, payload)
      }

      return MediaItemsApi.create(payload)
    },
    onSuccess: (savedItem, variables) => {
      showToast({
        tone: 'success',
        message: variables.itemId
          ? t('biblioteca.actualizado', { titulo: savedItem.title })
          : t('biblioteca.agregado', { titulo: savedItem.title }),
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
          variables.itemId ? t('biblioteca.errorActualizar') : t('biblioteca.errorCrear'),
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
      showToast({ tone: 'success', message: t('biblioteca.eliminado', { titulo: item.title }) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (error) => {
      setDeleteCandidate(null)
      showToast({
        tone: 'danger',
        message: extractApiError(error, t('biblioteca.errorEliminar')),
      })
    },
    onSettled: () => {
      setPendingDeleteId(null)
    },
  })

  const exportMutation = useMutation({
    mutationFn: (format: LibraryTransferFormat) => MediaItemsApi.exportLibrary(format),
    onSuccess: ({ blob, fileName }, format) => {
      downloadBlob(blob, fileName)
      showToast({
        tone: 'success',
        message: t('biblioteca.exportado', { formato: getTransferFormatLabel(format) }),
      })
    },
    onError: (error, format) => {
      showToast({
        tone: 'danger',
        message: extractApiError(
          error,
          t('biblioteca.errorExportar', { formato: getTransferFormatLabel(format) }),
        ),
      })
    },
  })

  const importMutation = useMutation({
    mutationFn: ({ format, file }: { format: LibraryTransferFormat; file: File }) =>
      MediaItemsApi.importLibrary(format, file),
    onSuccess: (result) => {
      showToast({
        tone: 'success',
        message: buildImportToastMessage(result, t),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.root })
    },
    onError: (error, variables) => {
      showToast({
        tone: 'danger',
        message: extractApiError(
          error,
          t('biblioteca.errorImportar', { formato: getTransferFormatLabel(variables.format) }),
        ),
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

  const handleImportFileChange =
    (format: LibraryTransferFormat) => (event: React.ChangeEvent<HTMLInputElement>) => {
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
  const availableFormats = formatsQuery.data ?? []
  const response = libraryQuery.data
  const items = response?.items ?? []
  const appliedFilterCount = countAppliedFilters(filters)
  const hasItems = (response?.totalCount ?? 0) > 0
  const showStatusStack = Boolean(libraryQuery.isError || categoriesQuery.isError)
  const categoriesHelpText = categoriesQuery.isError ? t('biblioteca.categoriasAyuda') : undefined

  if (libraryQuery.isLoading && !response) {
    return (
      <Loader title={t('biblioteca.cargandoTitulo')} message={t('biblioteca.cargandoMensaje')} />
    )
  }

  return (
    <section className="page">
      <section className="hero-panel">
        <span className="hero-panel__eyebrow">
          <RectangleStackIcon width={18} height={18} />
          {t('biblioteca.eyebrow')}
        </span>
        <h1 className="hero-panel__title">{t('biblioteca.titulo')}</h1>
        <p className="hero-panel__description">{t('biblioteca.descripcion')}</p>
        <div className="hero-panel__meta">
          <span className="hero-chip">
            {t('biblioteca.registros', { count: response?.totalCount ?? 0 })}
          </span>
          <span className="hero-chip">
            {appliedFilterCount > 0
              ? t('biblioteca.filtrosActivos', { count: appliedFilterCount })
              : t('biblioteca.sinFiltros')}
          </span>
          <span className="hero-chip">
            {t('biblioteca.pagina', { numero: String(response?.page ?? filters.page ?? 1) })}
          </span>
        </div>
        <div className="hero-panel__actions">
          <button className="button button--primary" type="button" onClick={openCreateEditor}>
            <PlusIcon width={18} height={18} />
            {t('biblioteca.nuevoRegistro')}
          </button>
          <button
            className={`button button--secondary${isFiltersOpen ? ' button--active' : ''}`}
            type="button"
            onClick={() => setIsFiltersOpen((prev) => !prev)}
          >
            <AdjustmentsHorizontalIcon width={18} height={18} />
            {isFiltersOpen ? t('biblioteca.ocultarFiltros') : t('biblioteca.mostrarFiltros')}
            {appliedFilterCount > 0 ? ` (${appliedFilterCount})` : ''}
          </button>
          <TransferActionMenu
            label={t('biblioteca.importar')}
            icon={<ArrowUpTrayIcon width={18} height={18} />}
            disabled={importMutation.isPending}
            items={[
              { key: 'import-json', label: 'JSON', onSelect: () => triggerImportSelection('Json') },
              { key: 'import-csv', label: 'CSV', onSelect: () => triggerImportSelection('Csv') },
            ]}
          />
          <TransferActionMenu
            label={t('biblioteca.exportar')}
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
              <strong>{t('biblioteca.noSincronizadaTitulo')}</strong>
              <span>{t('biblioteca.noSincronizadaTexto')}</span>
            </div>
          ) : null}
          {categoriesQuery.isError ? (
            <div className="status-banner status-banner--warning" role="status">
              <strong>{t('biblioteca.categoriasNoCargadasTitulo')}</strong>
              <span>{t('biblioteca.categoriasNoCargadasTexto')}</span>
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
            <h2 className="results-title">{t('biblioteca.resultadosTitulo')}</h2>
            <p className="results-subtitle">
              {libraryQuery.isError
                ? t('biblioteca.resultadosError')
                : t('biblioteca.coincidencias', { count: response?.totalCount ?? 0 })}
            </p>
          </div>
        </div>

        {libraryQuery.isError ? (
          <EmptyState
            title={t('biblioteca.errorTitulo')}
            message={t('biblioteca.errorMensaje')}
            action={
              <button className="button button--primary" onClick={() => libraryQuery.refetch()}>
                {t('comun.reintentar')}
              </button>
            }
          />
        ) : null}

        {!libraryQuery.isError && items.length === 0 ? (
          <EmptyState
            title={t('biblioteca.vaciaTitulo')}
            message={t('biblioteca.vaciaMensaje')}
            action={
              <button className="button button--primary" type="button" onClick={openCreateEditor}>
                <PlusIcon width={18} height={18} />
                {t('biblioteca.agregarManual')}
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
                    <th>{t('descubrir.colTitulo')}</th>
                    <th>{t('descubrir.colTipo')}</th>
                    <th>{t('filtros.estado')}</th>
                    <th>{t('descubrir.colOrigen')}</th>
                    <th>{t('biblioteca.colProgreso')}</th>
                    <th>{t('descubrir.colAnio')}</th>
                    <th>{t('descubrir.colPuntuacion')}</th>
                    <th>{t('descubrir.colAcciones')}</th>
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
                {t('biblioteca.anterior')}
              </button>
              <span className="pagination__label">
                {t('biblioteca.paginaDe', {
                  actual: String(response?.page ?? 1),
                  total: String(response?.totalPages ?? 1),
                })}
              </span>
              <button
                className="button button--secondary"
                onClick={() =>
                  goToPage(Math.min((response?.page ?? 1) + 1, response?.totalPages ?? 1))
                }
                disabled={!response || response.page >= response.totalPages}
              >
                {t('biblioteca.siguiente')}
              </button>
            </div>
          </>
        ) : null}
      </section>

      {isEditorOpen ? (
        <SidePanelDialog
          open={isEditorOpen}
          ariaLabel={
            editingItem
              ? t('biblioteca.editarTitulo', { titulo: editingItem.title })
              : t('biblioteca.crearTitulo')
          }
          variant="centered"
          onClose={closeEditor}
        >
          <div className="side-panel__meta">
            <span className="hero-chip">
              <RectangleStackIcon width={16} height={16} />
              {editingItem ? t('biblioteca.edicionRapida') : t('biblioteca.registroManual')}
            </span>
            <p className="side-panel__hint">
              {editingItem ? t('biblioteca.pistaEdicion') : t('biblioteca.pistaCreacion')}
            </p>
          </div>

          <MediaItemEditorForm
            key={editingItem?.id ?? 'create'}
            item={editingItem}
            availableCategories={availableCategories}
            availableFormats={availableFormats.length > 0 ? availableFormats : undefined}
            error={editorError}
            isPending={saveMutation.isPending}
            onCancel={closeEditor}
            onSubmit={handleEditorSubmit}
          />
        </SidePanelDialog>
      ) : null}

      <ConfirmDialog
        open={deleteCandidate !== null}
        title={
          deleteCandidate
            ? t('biblioteca.dialogoTitulo', { titulo: deleteCandidate.title })
            : t('biblioteca.dialogoTituloGenerico')
        }
        message={t('biblioteca.dialogoMensaje')}
        confirmLabel={t('biblioteca.dialogoConfirmar')}
        cancelLabel={t('biblioteca.dialogoCancelar')}
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
