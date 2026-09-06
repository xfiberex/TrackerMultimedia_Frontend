import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { CategoriesApi } from '@/features/categories/api/CategoriesAPI'
import { MediaItemsApi } from '@/features/media-items/api/MediaItemsAPI'
import {
  mediaTrackingStatusLabelKeys,
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
  etiquetaTipoBusqueda,
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
import { extractApiError, toPositiveInt } from '@/shared/utils'

const PROVIDER_STORAGE_KEY = 'discover:enabledProviders'

function loadEnabledProviders(): string[] {
  try {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === 'string')
      }
    }
  } catch {
    /* ignore */
  }
  return ['anilist']
}

function saveEnabledProviders(keys: string[]): void {
  try {
    localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(keys))
  } catch {
    /* ignore */
  }
}

function getActiveProviders(
  providers: DiscoverProvider[],
  type: MediaSearchType,
): DiscoverProvider[] {
  return providers.filter((provider) => provider.supportedTypes.includes(type))
}

function formatProviderSupport(provider: DiscoverProvider, t: TFunction): string {
  const concreteTypes = provider.supportedTypes.filter((type) => type !== 'All')
  return concreteTypes.map((type) => etiquetaTipoBusqueda(type, t)).join(', ')
}

function resolveSearchFilters(searchParams: URLSearchParams): SearchMediaItemsFilters {
  return {
    query: searchParams.get('query') ?? '',
    type: (searchParams.get('type') as MediaSearchType | null) ?? 'All',
    limit: toPositiveInt(searchParams.get('limit'), 8),
  }
}

function mapSearchResultToCreatePayload(
  item: SearchMediaItem,
  overrides: SearchQuickAddInput,
): CreateMediaItemInput {
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
  const [enabledProviderKeys, setEnabledProviderKeys] = useState<string[]>(loadEnabledProviders)
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { t } = useTranslation()

  if (prevFiltersQuery !== filters.query) {
    setPrevFiltersQuery(filters.query)
    setQueryInput(filters.query)
  }

  const toggleProvider = (key: string) => {
    setEnabledProviderKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      saveEnabledProviders(next)
      return next
    })
  }

  const providersQuery = useQuery({
    queryKey: queryKeys.search.providers(),
    queryFn: ({ signal }) => SearchApi.getProviders(signal),
  })

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: ({ signal }) => CategoriesApi.getAll(signal),
  })

  const searchFilters: SearchMediaItemsFilters = {
    ...filters,
    providers: enabledProviderKeys,
  }

  const searchQuery = useQuery({
    queryKey: queryKeys.search.results(searchFilters),
    queryFn: ({ signal }) => SearchApi.search(searchFilters, signal),
    enabled: filters.query.trim().length >= 2 && enabledProviderKeys.length > 0,
  })

  const addMutation = useMutation({
    mutationFn: async ({
      item,
      overrides,
    }: {
      item: SearchMediaItem
      overrides: SearchQuickAddInput
    }) => {
      setPendingExternalId(item.externalId)
      return MediaItemsApi.create(mapSearchResultToCreatePayload(item, overrides))
    },
    onSuccess: (createdItem, variables) => {
      setQuickAddError(null)
      setSelectedItem(null)
      showToast({
        tone: 'success',
        message: t('descubrir.agregado', {
          titulo: createdItem.title,
          estado: t(mediaTrackingStatusLabelKeys[variables.overrides.status]),
        }),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItems.root })
    },
    onError: (error) => {
      setQuickAddError(extractApiError(error, t('descubrir.agregadoError')))
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
  const activeProviders = getActiveProviders(discoverProviders, filters.type ?? 'All').filter((p) =>
    enabledProviderKeys.includes(p.key),
  )
  const isSearchReady = queryInput.trim().length >= 2
  const activeProvidersLabel =
    activeProviders.length > 0
      ? activeProviders.map((provider) => provider.displayName).join(' · ')
      : t('descubrir.sinProveedores')
  const searchLoaderTitle =
    activeProviders.length === 1
      ? t('descubrir.consultando', { proveedor: activeProviders[0].displayName })
      : t('descubrir.consultandoVarios')
  const availableCategories = categoriesQuery.data ?? []
  const categoriesHelpText = categoriesQuery.isError
    ? t('descubrir.categoriasNoDisponibles')
    : undefined

  return (
    <section className="page">
      <section className="hero-panel">
        <span className="hero-panel__eyebrow">
          <SparklesIcon width={18} height={18} />
          {t('descubrir.eyebrow')}
        </span>
        <h1 className="hero-panel__title">{t('descubrir.titulo')}</h1>
        <p className="hero-panel__description">{t('descubrir.descripcion')}</p>
        <div className="hero-panel__meta">
          <span className="hero-chip">{etiquetaTipoBusqueda(filters.type ?? 'All', t)}</span>
          <span className="hero-chip">
            {filters.query ? `"${filters.query}"` : t('descubrir.sinBusqueda')}
          </span>
          <span className="hero-chip">{activeProvidersLabel}</span>
          <span className="hero-chip">
            {filters.query.trim().length >= 2 && !searchQuery.isLoading
              ? t('descubrir.listosParaImportar', { count: results.length })
              : t('descubrir.porTanda', { count: filters.limit ?? 8 })}
          </span>
        </div>
      </section>

      <section className="panel">
        <form className="filters-form" onSubmit={handleSearchSubmit}>
          <div className="panel__header">
            <div>
              <h2 className="panel__title">{t('descubrir.catalogosTitulo')}</h2>
              <p className="panel__description">{t('descubrir.catalogosDescripcion')}</p>
            </div>
          </div>

          <div className="search-bar">
            <div className="control search-bar__field">
              <label htmlFor="discover-query">{t('descubrir.consulta')}</label>
              <input
                id="discover-query"
                className="input"
                placeholder={t('descubrir.consultaPista')}
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
              {t('filtros.buscar')}
            </button>
          </div>

          <div className="control-grid">
            <div
              className="control control--span-full"
              role="group"
              aria-labelledby="discover-providers-label"
            >
              <span className="control__label" id="discover-providers-label">
                {t('descubrir.proveedores')}
              </span>
              {providersQuery.isError ? (
                <p className="category-empty">{t('descubrir.proveedoresError')}</p>
              ) : discoverProviders.length > 0 ? (
                <div className="provider-cards">
                  {discoverProviders.map((provider) => {
                    const isEnabled = enabledProviderKeys.includes(provider.key)
                    const switchId = `provider-switch-${provider.key}`
                    return (
                      <div
                        key={provider.key}
                        className={`provider-card${isEnabled ? ' provider-card--enabled' : ''}`}
                      >
                        <div className="provider-card__info">
                          <span className="provider-card__name">{provider.displayName}</span>
                          <span className="provider-card__types">
                            {formatProviderSupport(provider, t)}
                          </span>
                        </div>
                        <label
                          className="toggle-switch"
                          htmlFor={switchId}
                          aria-label={
                            isEnabled
                              ? t('descubrir.desactivarProveedor', {
                                  proveedor: provider.displayName,
                                })
                              : t('descubrir.activarProveedor', { proveedor: provider.displayName })
                          }
                        >
                          <input
                            id={switchId}
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => toggleProvider(provider.key)}
                          />
                          <span className="toggle-switch__track" />
                        </label>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="category-empty">{t('descubrir.proveedoresCargando')}</p>
              )}
            </div>

            <div className="control">
              <label htmlFor="discover-type">{t('descubrir.formato')}</label>
              <select
                id="discover-type"
                className="select"
                value={filters.type ?? 'All'}
                onChange={(event) => setOption('type', event.target.value || 'All')}
              >
                {mediaSearchTypes.map((type) => (
                  <option key={type} value={type}>
                    {etiquetaTipoBusqueda(type, t)}
                  </option>
                ))}
              </select>
            </div>

            <div className="control">
              <label htmlFor="discover-limit">{t('descubrir.cantidad')}</label>
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
            <h2 className="results-title">{t('descubrir.resultadosTitulo')}</h2>
            <p className="results-subtitle">
              {t('descubrir.resultadosSubtitulo', { count: results.length })}
            </p>
          </div>
        </div>

        {searchQuery.isLoading ? (
          <Loader title={searchLoaderTitle} message={t('descubrir.consultandoMensaje')} />
        ) : null}

        {!searchQuery.isLoading && enabledProviderKeys.length === 0 ? (
          <EmptyState
            title={t('descubrir.sinProveedores')}
            message={t('descubrir.sinProveedoresMensaje')}
          />
        ) : null}

        {!searchQuery.isLoading &&
        enabledProviderKeys.length > 0 &&
        filters.query.trim().length < 2 ? (
          <EmptyState
            title={t('descubrir.empiezaTitulo')}
            message={t('descubrir.empiezaMensaje')}
          />
        ) : null}

        {searchQuery.isError ? (
          <EmptyState
            title={t('descubrir.errorTitulo')}
            message={t('descubrir.errorMensaje')}
            action={
              <button className="button button--primary" onClick={() => searchQuery.refetch()}>
                {t('comun.reintentar')}
              </button>
            }
          />
        ) : null}

        {!searchQuery.isLoading &&
        !searchQuery.isError &&
        results.length === 0 &&
        filters.query.trim().length >= 2 &&
        enabledProviderKeys.length > 0 ? (
          <EmptyState
            title={t('descubrir.sinResultadosTitulo')}
            message={t('descubrir.sinResultadosMensaje')}
          />
        ) : null}

        {!searchQuery.isLoading && !searchQuery.isError && results.length > 0 ? (
          <div className="search-table-wrapper">
            <table className="search-table">
              <thead>
                <tr>
                  <th></th>
                  <th>{t('descubrir.colTitulo')}</th>
                  <th>{t('descubrir.colTipo')}</th>
                  <th>{t('descubrir.colOrigen')}</th>
                  <th>{t('descubrir.colEstadoEditorial')}</th>
                  <th>{t('descubrir.colAnio')}</th>
                  <th>{t('descubrir.colPuntuacion')}</th>
                  <th>{t('descubrir.colAcciones')}</th>
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
          ariaLabel={t('descubrir.importarTitulo', { titulo: selectedItem.title })}
          disableClose={addMutation.isPending}
          onClose={closeQuickAdd}
        >
          <div className="side-panel__meta">
            <span className="hero-chip">
              <SparklesIcon width={16} height={16} />
              {t('descubrir.importacionAsistida')}
            </span>
            <p className="side-panel__hint">{t('descubrir.importacionPista')}</p>
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
