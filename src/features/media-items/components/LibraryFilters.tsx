import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState, type FormEventHandler } from 'react'
import type { Category } from '@/features/categories/schemas/categorySchema'
import {
  mediaItemSourceTypes,
  mediaSortFieldLabels,
  mediaTrackingStatusLabels,
  mediaTrackingStatuses,
  mediaTypeLabels,
  mediaTypes,
  mediaSourceLabels,
  sortDirectionLabels,
  sortDirections,
  mediaItemsSortFields,
  type MediaItemsFilters,
} from '@/features/media-items/schemas/mediaItemSchema'

type FilterPatch = Partial<Record<keyof MediaItemsFilters, string | number | string[] | undefined>>

interface LibraryFiltersProps {
  categories: Category[]
  categoriesHelpText?: string
  filters: MediaItemsFilters
  searchInput: string
  onSearchInputChange: (value: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
  onFilterChange: (patch: FilterPatch) => void
  onClearFilters: () => void
}

function countAdvancedFilters(filters: MediaItemsFilters): number {
  let total = 0

  if ((filters.sortBy ?? 'CreatedAt') !== 'CreatedAt') total += 1
  if ((filters.sortDirection ?? 'Desc') !== 'Desc') total += 1
  if (typeof filters.minPersonalScore === 'number') total += 1
  if (typeof filters.maxPersonalScore === 'number') total += 1
  if (filters.createdFrom) total += 1
  if (filters.createdTo) total += 1
  if ((filters.pageSize ?? 12) !== 12) total += 1

  return total
}

export default function LibraryFilters({
  categories,
  categoriesHelpText,
  filters,
  searchInput,
  onSearchInputChange,
  onSubmit,
  onFilterChange,
  onClearFilters,
}: LibraryFiltersProps) {
  const advancedFilterCount = countAdvancedFilters(filters)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(advancedFilterCount > 0)

  useEffect(() => {
    if (advancedFilterCount > 0) {
      setIsAdvancedOpen(true)
    }
  }, [advancedFilterCount])

  const toggleCategoryFilter = (categoryId: string) => {
    const currentIds = filters.categoryIds ?? []
    const nextIds = currentIds.includes(categoryId)
      ? currentIds.filter((currentId) => currentId !== categoryId)
      : [...currentIds, categoryId]

    onFilterChange({ categoryIds: nextIds.length > 0 ? nextIds : undefined })
  }

  const selectedCategoryCount = filters.categoryIds?.length ?? 0

  return (
    <form className="filters-form" aria-label="Filtros de biblioteca" onSubmit={onSubmit}>
      <div className="panel__header panel__header--stack">
        <div>
          <h2 className="panel__title">Filtros de biblioteca</h2>
          <p className="panel__description">
            Busca por título, ordena por fecha o puntuación y segmenta por formato, estado, categorías y origen.
          </p>
        </div>
        <div className="panel__header-actions">
          <span className="hero-chip">
            <AdjustmentsHorizontalIcon width={18} height={18} />
            {selectedCategoryCount > 0
              ? `${selectedCategoryCount} categorías activas`
              : advancedFilterCount > 0
                ? `${advancedFilterCount} ajustes avanzados activos`
                : 'Vista compacta'}
          </span>
          <button type="button" className="button button--ghost" onClick={onClearFilters}>
            <SparklesIcon width={18} height={18} />
            Limpiar
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="control search-bar__field">
          <label htmlFor="library-search">Buscar título</label>
          <input
            id="library-search"
            className="input"
            placeholder="Naruto, Solo Leveling, Vagabond..."
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
          />
        </div>
        <button type="submit" className="button button--primary search-bar__submit">
          <MagnifyingGlassIcon width={18} height={18} />
          Buscar
        </button>
      </div>

      <div className="control-grid control-grid--compact">
        <div className="control">
          <label htmlFor="library-type">Formato</label>
          <select
            id="library-type"
            className="select"
            value={filters.type ?? ''}
            onChange={(event) => onFilterChange({ type: event.target.value || undefined })}
          >
            <option value="">Todos</option>
            {mediaTypes.map((type) => (
              <option key={type} value={type}>
                {mediaTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="control">
          <label htmlFor="library-status">Estado</label>
          <select
            id="library-status"
            className="select"
            value={filters.status ?? ''}
            onChange={(event) => onFilterChange({ status: event.target.value || undefined })}
          >
            <option value="">Todos</option>
            {mediaTrackingStatuses.map((status) => (
              <option key={status} value={status}>
                {mediaTrackingStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="control">
          <label htmlFor="library-source">Origen</label>
          <select
            id="library-source"
            className="select"
            value={filters.sourceType ?? ''}
            onChange={(event) => onFilterChange({ sourceType: event.target.value || undefined })}
          >
            <option value="">Todos</option>
            {mediaItemSourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {mediaSourceLabels[sourceType]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="control">
        <label>Categorías</label>
        {categories.length > 0 ? (
          <div className="category-pills">
            {categories.map((category) => {
              const isSelected = filters.categoryIds?.includes(category.id) ?? false

              return (
                <button
                  key={category.id}
                  type="button"
                  className={`category-pill${isSelected ? ' category-pill--active' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => toggleCategoryFilter(category.id)}
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
          <p className={`category-empty${categoriesHelpText ? ' category-empty--warning' : ''}`}>
            {categoriesHelpText ?? 'Todavía no has creado categorías para usar en filtros.'}
          </p>
        )}
      </div>

      <details
        className="filters-advanced"
        open={isAdvancedOpen}
        onToggle={(event) => setIsAdvancedOpen((event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="filters-advanced__summary">
          <div>
            <span className="filters-advanced__title">Más filtros y orden</span>
            <span className="filters-advanced__hint">
              Ajusta puntuación, fechas, orden y densidad del listado sin saturar la vista principal.
            </span>
          </div>
          <span className="hero-chip">
            <SparklesIcon width={16} height={16} />
            {advancedFilterCount > 0 ? `${advancedFilterCount} activos` : 'Opcional'}
          </span>
        </summary>

        <div className="control-grid filters-advanced__grid">
          <div className="control">
            <label htmlFor="library-sort-by">Ordenar por</label>
            <select
              id="library-sort-by"
              className="select"
              value={filters.sortBy ?? 'CreatedAt'}
              onChange={(event) => onFilterChange({ sortBy: event.target.value || undefined })}
            >
              {mediaItemsSortFields.map((sortBy) => (
                <option key={sortBy} value={sortBy}>
                  {mediaSortFieldLabels[sortBy]}
                </option>
              ))}
            </select>
          </div>

          <div className="control">
            <label htmlFor="library-sort-direction">Dirección</label>
            <select
              id="library-sort-direction"
              className="select"
              value={filters.sortDirection ?? 'Desc'}
              onChange={(event) => onFilterChange({ sortDirection: event.target.value || undefined })}
            >
              {sortDirections.map((direction) => (
                <option key={direction} value={direction}>
                  {sortDirectionLabels[direction]}
                </option>
              ))}
            </select>
          </div>

          <div className="control">
            <label htmlFor="library-min-score">Puntuación mínima</label>
            <input
              id="library-min-score"
              className="input"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={filters.minPersonalScore ?? ''}
              onChange={(event) =>
                onFilterChange({
                  minPersonalScore: event.target.value.trim().length > 0 ? Number(event.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="control">
            <label htmlFor="library-max-score">Puntuación máxima</label>
            <input
              id="library-max-score"
              className="input"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={filters.maxPersonalScore ?? ''}
              onChange={(event) =>
                onFilterChange({
                  maxPersonalScore: event.target.value.trim().length > 0 ? Number(event.target.value) : undefined,
                })
              }
            />
          </div>

          <div className="control">
            <label htmlFor="library-created-from">Agregado desde</label>
            <input
              id="library-created-from"
              className="input"
              type="date"
              value={filters.createdFrom ?? ''}
              onChange={(event) => onFilterChange({ createdFrom: event.target.value || undefined })}
            />
          </div>

          <div className="control">
            <label htmlFor="library-created-to">Agregado hasta</label>
            <input
              id="library-created-to"
              className="input"
              type="date"
              value={filters.createdTo ?? ''}
              onChange={(event) => onFilterChange({ createdTo: event.target.value || undefined })}
            />
          </div>

          <div className="control">
            <label htmlFor="library-page-size">Elementos por página</label>
            <select
              id="library-page-size"
              className="select"
              value={filters.pageSize ?? 12}
              onChange={(event) => onFilterChange({ pageSize: Number(event.target.value) })}
            >
              {[6, 12, 18, 24].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>
    </form>
  )
}