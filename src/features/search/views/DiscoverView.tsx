import {
  MagnifyingGlassIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CategoriesApi } from '@/features/categories/api/CategoriesAPI'
import { MediaItemsApi } from '@/features/media-items/api/MediaItemsAPI'
import {
  mediaTrackingStatusLabels,
  mediaTypeToContentKind,
  mediaTypeToProgressUnit,
  type CreateMediaItemInput,
} from '@/features/media-items/schemas/mediaItemSchema'
import SearchQuickAddForm, {
  type SearchQuickAddInput,
} from '@/features/search/components/SearchQuickAddForm'
import SearchResultCard from '@/features/search/components/SearchResultCard'
import { SearchApi } from '@/features/search/api/SearchAPI'
import {
  mediaSearchTypeLabels,
  mediaSearchTypes,
  type DiscoverProvider,
  type MediaSearchType,
  type SearchMediaItem,
  type SearchMediaItemsFilters,
} from '@/features/search/schemas/searchSchema'
import EmptyState from '@/shared/components/EmptyState'
import Loader from '@/shared/components/Loader'
import SidePanelDialog from '@/shared/components/SidePanelDialog'
import { useToast } from '@/shared/hooks/useToast'
import { queryKeys } from '@/shared/constants/queryKeys'
import { toPositiveInt } from '@/shared/utils'

function getActiveProviders(providers: DiscoverProvider[], type: MediaSearchType): DiscoverProvider[] {
  return providers.filter((provider) => provider.supportedTypes.includes(type))
}

function formatProviderSupport(provider: DiscoverProvider): string {
  const concreteTypes = provider.supportedTypes.filter((type) => type !== 'All')
  return concreteTypes.map((type) => mediaSearchTypeLabels[type]).join(', ')
}

function resolveSearchFilters(searchParams: URLSearchParams): SearchMediaItemsFilters {
  return {
    query: searchParams.get('query') ?? '',
    type: ((searchParams.get('type') as MediaSearchType | null) ?? 'All'),
    limit: toPositiveInt(searchParams.get('limit'), 8),
  }
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

function mapSearchResultToCreatePayload(item: SearchMediaItem, overrides: SearchQuickAddInput): CreateMediaItemInput {
  return {
    title: item.title,
    alternativeTitle: item.alternativeTitle,
    type: item.suggestedType,
    description: null,
    contentKind: mediaTypeToContentKind[item.suggestedType],
    status: overrides.status,
    sourceType: item.sourceType,
    externalId: item.externalId,
    externalMediaKind: item.externalMediaKind,
    externalStatusLabel: item.externalStatusLabel,
    externalScore: item.externalScore,
    coverImageUrl: item.coverImageUrl,
    referenceUrl: item.referenceUrl,
    releaseYear: item.releaseYear,
    progressUnit: mediaTypeToProgressUnit[item.suggestedType],
    progressCount: 0,
    progressCurrent: 0,
    progressTotal: null,
    currentSeason: 1,
    personalScore: overrides.personalScore,
    startedAtUtc: null,
    completedAtUtc: null,
    notes: overrides.notes,
    categoryIds: overrides.categoryIds,
  }
}

export default function DiscoverView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = resolveSearchFilters(searchParams)
  const [prevFiltersQuery, setPrevFiltersQuery] = useState(filters.query)
  const [queryInput, setQueryInput] = useState(filters.query)
  const [quickAddError, setQuickAddError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<SearchMediaItem | null>(null)
  const [pendingExternalId, setPendingExternalId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  if (prevFiltersQuery !== filters.query) {
    setPrevFiltersQuery(filters.query)
    setQueryInput(filters.query)
  }

  const providersQuery = useQuery({
    queryKey: queryKeys.search.providers(),
    queryFn: ({ signal }) => SearchApi.getProviders(signal),
  })

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: ({ signal }) => CategoriesApi.getAll(signal),
  })

  const searchQuery = useQuery({
    queryKey: queryKeys.search.results(filters),
    queryFn: ({ signal }) => SearchApi.search(filters, signal),
    enabled: filters.query.trim().length >= 2,
  })

  const addMutation = useMutation({
    mutationFn: async ({ item, overrides }: { item: SearchMediaItem, overrides: SearchQuickAddInput }) => {
      setPendingExternalId(item.externalId)
      return MediaItemsApi.create(mapSearchResultToCreatePayload(item, overrides))
    },
    onSuccess: (createdItem, variables) => {
      setQuickAddError(null)
      setSelectedItem(null)
      showToast({
        tone: 'success',
        message: `"${createdItem.title}" fue agregado a tu biblioteca con estado ${mediaTrackingStatusLabels[variables.overrides.status]}.`,
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (error) => {
      setQuickAddError(
        extractApiError(error, 'No pudimos agregar el título a tu biblioteca. Vuelve a intentarlo en unos segundos.'),
      )
    },
    onSettled: () => {
      setPendingExternalId(null)
    },
  })

  const closeQuickAdd = () => {
    setQuickAddError(null)
    setSelectedItem(null)
  }

  const openQuickAdd = (item: SearchMediaItem) => {
    setQuickAddError(null)
    setSelectedItem(item)
  }

  const handleQuickAddSubmit = (payload: SearchQuickAddInput) => {
    if (!selectedItem) {
      return
    }

    addMutation.mutate({ item: selectedItem, overrides: payload })
  }

  const handleSearchSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const nextParams = new URLSearchParams(searchParams)
    const normalizedQuery = queryInput.trim()

    if (normalizedQuery.length > 0) {
      nextParams.set('query', normalizedQuery)
    } else {
      nextParams.delete('query')
    }

    nextParams.set('type', filters.type ?? 'All')
    nextParams.set('limit', String(filters.limit ?? 8))
    setSearchParams(nextParams)
  }

  const setOption = (key: keyof SearchMediaItemsFilters, value: string | number | undefined) => {
    const nextParams = new URLSearchParams(searchParams)

    if (value === undefined || value === '') {
      nextParams.delete(key)
    } else {
      nextParams.set(key, String(value))
    }

    setSearchParams(nextParams)
  }

  const results = searchQuery.data ?? []
  const discoverProviders = providersQuery.data ?? []
  const activeProviders = getActiveProviders(discoverProviders, filters.type ?? 'All')
  const isSearchReady = queryInput.trim().length >= 2
  const activeProvidersLabel = activeProviders.length > 0
    ? activeProviders.map((provider) => provider.displayName).join(' · ')
    : 'Sin proveedores activos'
  const searchLoaderTitle = activeProviders.length === 1
    ? `Consultando ${activeProviders[0].displayName}`
    : 'Consultando catálogos externos'
  const availableCategories = categoriesQuery.data ?? []
  const categoriesHelpText = categoriesQuery.isError
    ? 'Las categorías no están disponibles ahora mismo. Puedes importar igual y clasificarlas después desde Biblioteca.'
    : undefined

  return (
    <section className="page">
      <section className="hero-panel">
        <span className="hero-panel__eyebrow">
          <SparklesIcon width={18} height={18} />
          Descubrir
        </span>
        <h1 className="hero-panel__title">Descubrir contenido</h1>
        <p className="hero-panel__description">
          Busca en los catálogos externos disponibles y prepara cada importación antes de llevarla a tu biblioteca.
        </p>
        <div className="hero-panel__meta">
          <span className="hero-chip">{mediaSearchTypeLabels[filters.type ?? 'All']}</span>
          <span className="hero-chip">{filters.query ? `"${filters.query}"` : 'Sin búsqueda activa'}</span>
          <span className="hero-chip">{activeProvidersLabel}</span>
          <span className="hero-chip">
            {filters.query.trim().length >= 2 && !searchQuery.isLoading
              ? `${results.length} listos para importar`
              : `${filters.limit ?? 8} por tanda`}
          </span>
        </div>
      </section>

      <section className="panel">
        <form className="filters-form" onSubmit={handleSearchSubmit}>
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Catálogos externos</h2>
              <p className="panel__description">
                Elige el formato, revisa los proveedores activos y abre una importación asistida cuando un resultado merezca entrar.
              </p>
            </div>
          </div>

          <div className="search-bar">
            <div className="control search-bar__field">
              <label htmlFor="discover-query">Consulta</label>
              <input
                id="discover-query"
                className="input"
                placeholder="Naruto, Berserk, Solo Leveling..."
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
              />
            </div>

            <button
              type="submit"
              className="button button--primary search-bar__submit"
              disabled={!isSearchReady}
            >
              <MagnifyingGlassIcon width={18} height={18} />
              Buscar
            </button>
          </div>

          <div className="control-grid">
            <div className="control control--span-full">
              <label>Proveedores activos</label>
              {providersQuery.isError ? (
                <p className="category-empty">No se pudo cargar la lista de proveedores disponibles.</p>
              ) : activeProviders.length > 0 ? (
                <div className="category-pills">
                  {activeProviders.map((provider) => (
                    <span key={provider.key} className="category-pill">
                      <span>{provider.displayName}</span>
                      <span className="search-card__alt">{formatProviderSupport(provider)}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="category-empty">No hay proveedores activos para este tipo de búsqueda.</p>
              )}
            </div>

            <div className="control">
              <label htmlFor="discover-type">Formato</label>
              <select
                id="discover-type"
                className="select"
                value={filters.type ?? 'All'}
                onChange={(event) => setOption('type', event.target.value || 'All')}
              >
                {mediaSearchTypes.map((type) => (
                  <option key={type} value={type}>
                    {mediaSearchTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="control">
              <label htmlFor="discover-limit">Cantidad</label>
              <select
                id="discover-limit"
                className="select"
                value={filters.limit ?? 8}
                onChange={(event) => setOption('limit', Number(event.target.value))}
              >
                {[6, 8, 10, 12].map((limit) => (
                  <option key={limit} value={limit}>
                    {limit}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="results-header">
          <div>
            <h2 className="results-title">Resultados de catálogos externos</h2>
            <p className="results-subtitle">
              {results.length} {results.length === 1 ? 'resultado' : 'resultados'} listos para importar.
            </p>
          </div>
        </div>

        {searchQuery.isLoading ? (
          <Loader title={searchLoaderTitle} message="Buscando en los catálogos externos activos..." />
        ) : null}

        {!searchQuery.isLoading && filters.query.trim().length < 2 ? (
          <EmptyState
            title="Empieza con una búsqueda"
            message="Escribe al menos 2 caracteres para iniciar la búsqueda."
          />
        ) : null}

        {searchQuery.isError ? (
          <EmptyState
            title="No se pudo consultar los catálogos externos"
            message="Verifica tu conexión o vuelve a intentarlo más tarde."
            action={
              <button className="button button--primary" onClick={() => searchQuery.refetch()}>
                Reintentar
              </button>
            }
          />
        ) : null}

        {!searchQuery.isLoading && !searchQuery.isError && results.length === 0 && filters.query.trim().length >= 2 ? (
          <EmptyState
            title="Sin resultados"
            message="Prueba con otro nombre o cambia el tipo de búsqueda para ampliar el alcance."
          />
        ) : null}

        {!searchQuery.isLoading && !searchQuery.isError && results.length > 0 ? (
          <div className="search-table-wrapper">
            <table className="search-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Origen</th>
                  <th>Estado editorial</th>
                  <th>Año</th>
                  <th>Puntuación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <SearchResultCard
                    key={`${item.sourceType}:${item.externalMediaKind}:${item.externalId}`}
                    item={item}
                    isPending={addMutation.isPending && pendingExternalId === item.externalId}
                    onAdd={openQuickAdd}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {selectedItem ? (
        <SidePanelDialog
          open={selectedItem !== null}
          ariaLabel={`Importar ${selectedItem.title}`}
          scrimLabel="Cerrar importación rápida"
          disableClose={addMutation.isPending}
          onClose={closeQuickAdd}
        >
          <div className="side-panel__meta">
            <span className="hero-chip">
              <SparklesIcon width={16} height={16} />
              Importación asistida
            </span>
            <p className="side-panel__hint">
              Ajusta el estado inicial y etiqueta el contenido antes de guardarlo. El resto de metadatos llegará desde el catálogo externo.
            </p>
          </div>

          <SearchQuickAddForm
            key={selectedItem.externalId}
            item={selectedItem}
            categories={availableCategories}
            categoriesHelpText={categoriesHelpText}
            error={quickAddError}
            isPending={addMutation.isPending}
            onCancel={closeQuickAdd}
            onSubmit={handleQuickAddSubmit}
          />
        </SidePanelDialog>
      ) : null}
    </section>
  )
}