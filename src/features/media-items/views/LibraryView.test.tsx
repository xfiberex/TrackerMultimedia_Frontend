import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ToastProvider } from '@/shared/components/ToastProvider'
import type { Category } from '@/features/categories/schemas/categorySchema'
import type { LibraryImportResponse, MediaItem, MediaItemsStatsResponse, PagedResponse } from '../schemas/mediaItemSchema'

const getAllCategoriesMock = vi.hoisted(() => vi.fn())
const getAllMock = vi.hoisted(() => vi.fn())
const getStatsMock = vi.hoisted(() => vi.fn())
const createMock = vi.hoisted(() => vi.fn())
const updateMock = vi.hoisted(() => vi.fn())
const removeMock = vi.hoisted(() => vi.fn())
const exportLibraryMock = vi.hoisted(() => vi.fn())
const importLibraryMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/categories/api/CategoriesAPI', () => ({
  CategoriesApi: {
    getAll: getAllCategoriesMock,
  },
}))

vi.mock('../api/MediaItemsAPI', () => ({
  MediaItemsApi: {
    getAll: getAllMock,
    getStats: getStatsMock,
    create: createMock,
    update: updateMock,
    remove: removeMock,
    exportLibrary: exportLibraryMock,
    importLibrary: importLibraryMock,
  },
}))

import LibraryView from './LibraryView'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location-search">{location.search}</output>
}

function renderLibraryView(initialEntry = '/library') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              path="/library"
              element={(
                <>
                  <LibraryView />
                  <LocationProbe />
                </>
              )}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const categories: Category[] = [
  { id: 'cat-1', name: 'Backlog', color: '#336699', createdAtUtc: '2026-05-06T10:00:00.000Z' },
  { id: 'cat-2', name: 'Favoritos', color: null, createdAtUtc: '2026-05-06T11:00:00.000Z' },
]

const libraryItem: MediaItem = {
  id: 'item-1',
  title: 'Frieren',
  alternativeTitle: 'Sousou no Frieren',
  type: 'Anime',
  description: null,
  contentKind: 'Series',
  status: 'InProgress',
  sourceType: 'Jikan',
  externalId: 99,
  externalMediaKind: 'Anime',
  externalStatusLabel: 'Activo',
  externalScore: 9,
  coverImageUrl: 'https://img.test/frieren.jpg',
  referenceUrl: 'https://example.com/frieren',
  releaseYear: 2023,
  progressUnit: 'Episodes',
  progressCount: 12,
  progressCurrent: 12,
  progressTotal: 28,
  currentSeason: 2,
  personalScore: 9.5,
  notes: null,
  categories: [{ id: 'cat-1', name: 'Backlog', color: '#336699' }],
  startedAtUtc: null,
  completedAtUtc: null,
  createdAtUtc: '2026-05-05T12:00:00.000Z',
  updatedAtUtc: '2026-05-06T12:00:00.000Z',
}

const stats: MediaItemsStatsResponse = {
  totalCount: 1,
  plannedCount: 0,
  inProgressCount: 1,
  completedCount: 0,
  onHoldCount: 0,
  droppedCount: 0,
  startedThisMonthCount: 1,
  completedThisMonthCount: 0,
  backlogWithoutStartCount: 0,
  averagePersonalScore: 9.5,
  scoredItemsCount: 1,
  contentKindBreakdown: [{ contentKind: 'Series', count: 1 }],
  sourceBreakdown: [{ sourceType: 'Jikan', count: 1 }],
  categoryBreakdown: [{ categoryId: 'cat-1', categoryName: 'Backlog', color: '#336699', count: 1 }],
  averageScoreByContentKind: [{ contentKind: 'Series', averagePersonalScore: 9.5, scoredItemsCount: 1 }],
}

function buildPagedResponse(overrides: Partial<PagedResponse<MediaItem>> = {}): PagedResponse<MediaItem> {
  return {
    items: [libraryItem],
    page: 1,
    pageSize: 12,
    totalCount: 1,
    totalPages: 1,
    ...overrides,
  }
}

describe('LibraryView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAllCategoriesMock.mockResolvedValue(categories)
    getAllMock.mockResolvedValue(buildPagedResponse())
    getStatsMock.mockResolvedValue(stats)
    createMock.mockResolvedValue(libraryItem)
    updateMock.mockResolvedValue(libraryItem)
    removeMock.mockResolvedValue(undefined)
    exportLibraryMock.mockResolvedValue({
      blob: new Blob(['{}'], { type: 'application/json' }),
      fileName: 'tracker-library.json',
    })
    importLibraryMock.mockResolvedValue({
      format: 'Json',
      itemsProcessed: 3,
      itemsCreated: 2,
      itemsUpdated: 1,
      categoriesCreated: 1,
    } satisfies LibraryImportResponse)
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:library-export'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
    window.scrollTo = vi.fn()
  })

  it('parses filters from the URL and requests the library with typed values', async () => {
    renderLibraryView(
      '/library?search=frieren&type=Anime&categoryIds=cat-1&categoryIds=cat-2&status=InProgress&sourceType=Jikan&createdFrom=2026-05-01&createdTo=2026-05-05&minPersonalScore=7.5&maxPersonalScore=9&sortBy=Title&sortDirection=Asc&page=2&pageSize=24',
    )

    await waitFor(() => {
      expect(getAllMock).toHaveBeenCalledWith(
        {
          search: 'frieren',
          type: 'Anime',
          categoryIds: ['cat-1', 'cat-2'],
          status: 'InProgress',
          sourceType: 'Jikan',
          createdFrom: '2026-05-01',
          createdTo: '2026-05-05',
          minPersonalScore: 7.5,
          maxPersonalScore: 9,
          sortBy: 'Title',
          sortDirection: 'Asc',
          page: 2,
          pageSize: 24,
        },
        expect.any(AbortSignal),
      )
    })

    expect(await screen.findByText('Frieren')).toBeInTheDocument()
  })

  it('clears filters, resets the search box and keeps the current page size', async () => {
    const user = userEvent.setup()
    getAllMock.mockResolvedValue(buildPagedResponse({ items: [], totalCount: 0, totalPages: 0 }))

    renderLibraryView('/library?search=frieren&type=Anime&categoryIds=cat-1&page=3&pageSize=24')

    // Los filtros están plegados por defecto: hay que desplegarlos primero.
    await user.click(await screen.findByRole('button', { name: /Mostrar filtros/ }))
    await user.click(screen.getByRole('button', { name: 'Limpiar' }))

    await waitFor(() => {
      expect(getAllMock).toHaveBeenLastCalledWith(
        {
          search: undefined,
          type: undefined,
          categoryIds: undefined,
          status: undefined,
          sourceType: undefined,
          createdFrom: undefined,
          createdTo: undefined,
          minPersonalScore: undefined,
          maxPersonalScore: undefined,
          sortBy: 'CreatedAt',
          sortDirection: 'Desc',
          page: 1,
          pageSize: 24,
        },
        expect.any(AbortSignal),
      )
    })

    expect(screen.getByLabelText('Buscar título')).toHaveValue('')
    const params = new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')
    expect(params.get('page')).toBe('1')
    expect(params.get('pageSize')).toBe('24')
    expect(params.get('search')).toBeNull()
    expect(params.getAll('categoryIds')).toEqual([])
  })

  it('submits a trimmed search term and resets the page to one', async () => {
    const user = userEvent.setup()

    renderLibraryView('/library?page=2&pageSize=12')

    // Los filtros están plegados por defecto: hay que desplegarlos primero.
    await user.click(await screen.findByRole('button', { name: /Mostrar filtros/ }))
    await user.type(screen.getByLabelText('Buscar título'), '  solo leveling  ')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => {
      expect(getAllMock).toHaveBeenLastCalledWith(
        {
          search: 'solo leveling',
          type: undefined,
          categoryIds: undefined,
          status: undefined,
          sourceType: undefined,
          createdFrom: undefined,
          createdTo: undefined,
          minPersonalScore: undefined,
          maxPersonalScore: undefined,
          sortBy: 'CreatedAt',
          sortDirection: 'Desc',
          page: 1,
          pageSize: 12,
        },
        expect.any(AbortSignal),
      )
    })

    const params = new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')
    expect(params.get('search')).toBe('solo leveling')
    expect(params.get('page')).toBe('1')
    expect(params.get('pageSize')).toBe('12')
  })

  it('moves to the next page and scrolls back to the top', async () => {
    const user = userEvent.setup()
    getAllMock.mockResolvedValue(buildPagedResponse({ page: 2, totalPages: 3 }))

    renderLibraryView('/library?page=2&pageSize=12')

    await user.click(await screen.findByRole('button', { name: 'Siguiente' }))

    await waitFor(() => {
      expect(getAllMock).toHaveBeenLastCalledWith(
        {
          search: undefined,
          type: undefined,
          categoryIds: undefined,
          status: undefined,
          sourceType: undefined,
          createdFrom: undefined,
          createdTo: undefined,
          minPersonalScore: undefined,
          maxPersonalScore: undefined,
          sortBy: 'CreatedAt',
          sortDirection: 'Desc',
          page: 3,
          pageSize: 12,
        },
        expect.any(AbortSignal),
      )
    })

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    expect(new URLSearchParams(screen.getByTestId('location-search').textContent ?? '').get('page')).toBe('3')
  })

  it('exports the library from the transfer dropdown', async () => {
    const user = userEvent.setup()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderLibraryView('/library')

    await user.click(await screen.findByRole('button', { name: 'Exportar' }))
    await user.click(screen.getByRole('menuitem', { name: 'JSON' }))

    await waitFor(() => {
      expect(exportLibraryMock).toHaveBeenCalledWith('Json')
    })

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:library-export')
    expect(await screen.findByText('Se descargó tu biblioteca en formato JSON.')).toBeInTheDocument()

    clickSpy.mockRestore()
  })

  it('imports a JSON backup from the transfer dropdown and refreshes related queries', async () => {
    const user = userEvent.setup()
    const file = new File(['{}'], 'tracker-library.json', { type: 'application/json' })

    renderLibraryView('/library')

    await user.click(await screen.findByRole('button', { name: 'Importar' }))
    await user.upload(screen.getByTestId('library-import-json-input'), file)

    await waitFor(() => {
      expect(importLibraryMock).toHaveBeenCalledWith('Json', file)
    })

    await waitFor(() => {
      expect(getAllMock.mock.calls.length).toBeGreaterThan(1)
      expect(getAllCategoriesMock.mock.calls.length).toBeGreaterThan(1)
    })

    expect(
      await screen.findByText('Importación JSON completada: 2 creados, 1 actualizado y 1 categoría nueva.'),
    ).toBeInTheDocument()
  })

  it('opens the editor inside a dialog drawer and closes it with escape', async () => {
    const user = userEvent.setup()

    renderLibraryView('/library')

    const trigger = await screen.findByRole('button', { name: 'Nuevo registro' })
    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Crear elemento de biblioteca' })
    expect(dialog).toBeInTheDocument()

    // Al abrirse, el foco entra en el diálogo: si se quedara en el botón de
    // fondo, el teclado seguiría navegando por el listado que hay detrás.
    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    })

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Crear elemento de biblioteca' })).not.toBeInTheDocument()
    })

    // Y al cerrarse vuelve al botón que lo abrió, no al principio de la página.
    expect(trigger).toHaveFocus()
  })

  it('creates a manual media item from the library editor', async () => {
    const user = userEvent.setup()
    createMock.mockResolvedValueOnce({
      ...libraryItem,
      id: 'item-created',
      title: 'Manual entry',
      alternativeTitle: null,
      type: null,
      description: null,
      contentKind: 'Comic',
      status: 'Completed',
      sourceType: 'Manual',
      externalId: null,
      externalMediaKind: null,
      externalStatusLabel: null,
      externalScore: null,
      releaseYear: 2024,
      progressUnit: 'Chapters',
      progressCount: 15,
      progressCurrent: 15,
      progressTotal: 15,
      currentSeason: 1,
      personalScore: 8.5,
      notes: 'Nota nueva',
      categories: [{ id: 'cat-2', name: 'Favoritos', color: null }],
      startedAtUtc: null,
      completedAtUtc: null,
      updatedAtUtc: '2026-05-06T12:05:00.000Z',
    })

    renderLibraryView('/library')

    await user.click(await screen.findByRole('button', { name: 'Nuevo registro' }))
    const editor = screen.getByRole('form', { name: 'Editor de biblioteca' })
    await user.type(within(editor).getByLabelText('Título principal'), '  Manual entry  ')
    await user.selectOptions(within(editor).getByLabelText('Formato'), 'Comic')
    await user.selectOptions(within(editor).getByLabelText('Estado del registro'), 'Completed')
    await user.click(within(editor).getByRole('button', { name: 'Favoritos' }))
    await user.type(within(editor).getByLabelText('Año de estreno'), '2024')
    await user.clear(within(editor).getByLabelText('Capítulos'))
    await user.type(within(editor).getByLabelText('Capítulos'), '15')
    await user.type(within(editor).getByLabelText('Puntuación personal (0–10)'), '8.5')
    await user.type(within(editor).getByLabelText('Notas personales'), '  Nota nueva  ')
    await user.click(within(editor).getByRole('button', { name: 'Guardar nuevo registro' }))

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({
        title: 'Manual entry',
        alternativeTitle: null,
        type: null,
        description: null,
        contentKind: 'Comic',
        status: 'Completed',
        sourceType: 'Manual',
        externalId: null,
        externalMediaKind: null,
        externalStatusLabel: null,
        externalScore: null,
        coverImageUrl: null,
        referenceUrl: null,
        releaseYear: 2024,
        progressUnit: 'Chapters',
        progressCount: 15,
        progressCurrent: 15,
        progressTotal: null,
        currentSeason: 1,
        personalScore: 8.5,
        userFormatId: null,
        startedAtUtc: null,
        completedAtUtc: null,
        notes: 'Nota nueva',
        categoryIds: ['cat-2'],
      })
    })

    expect(await screen.findByText('"Manual entry" se agregó a tu biblioteca.')).toBeInTheDocument()
  })

  it('loads an existing item into the editor and updates it', async () => {
    const user = userEvent.setup()
    updateMock.mockResolvedValueOnce({
      ...libraryItem,
      title: 'Frieren Final',
      status: 'Completed',
      progressUnit: 'Episodes',
      progressCount: 28,
      progressCurrent: 28,
      progressTotal: 28,
      personalScore: 9.8,
      notes: 'Gran cierre',
      categories: categories.map((category) => ({ id: category.id, name: category.name, color: category.color })),
    })

    renderLibraryView('/library')

    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const editor = screen.getByRole('form', { name: 'Editor de biblioteca' })

    const titleInput = within(editor).getByLabelText('Título principal')
    await user.clear(titleInput)
    await user.type(titleInput, 'Frieren Final')
    await user.selectOptions(within(editor).getByLabelText('Estado del registro'), 'Completed')
    await user.click(within(editor).getByRole('button', { name: 'Favoritos' }))
    await user.clear(within(editor).getByLabelText('Episodios'))
    await user.type(within(editor).getByLabelText('Episodios'), '28')
    await user.clear(within(editor).getByLabelText('Puntuación personal (0–10)'))
    await user.type(within(editor).getByLabelText('Puntuación personal (0–10)'), '9.8')
    await user.type(within(editor).getByLabelText('Notas personales'), 'Gran cierre')
    await user.click(within(editor).getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith('item-1', {
        title: 'Frieren Final',
        alternativeTitle: 'Sousou no Frieren',
        type: 'Anime',
        description: null,
        contentKind: 'Series',
        status: 'Completed',
        sourceType: 'Jikan',
        externalId: 99,
        externalMediaKind: 'Anime',
        externalStatusLabel: 'Activo',
        externalScore: 9,
        coverImageUrl: 'https://img.test/frieren.jpg',
        referenceUrl: 'https://example.com/frieren',
        releaseYear: 2023,
        progressUnit: 'Episodes',
        progressCount: 28,
        progressCurrent: 28,
        progressTotal: 28,
        currentSeason: 2,
        personalScore: 9.8,
        userFormatId: null,
        startedAtUtc: null,
        completedAtUtc: null,
        notes: 'Gran cierre',
        categoryIds: ['cat-1', 'cat-2'],
      })
    })

    expect(await screen.findByText('"Frieren Final" se actualizó correctamente.')).toBeInTheDocument()
  })

  it('toggles category filters and persists repeated query params', async () => {
    const user = userEvent.setup()

    renderLibraryView('/library')

    // Los filtros están plegados por defecto: hay que desplegarlos primero.
    await user.click(await screen.findByRole('button', { name: /Mostrar filtros/ }))
    const filtersForm = () => screen.getByRole('form', { name: 'Filtros de biblioteca' })
    await user.click(within(filtersForm()).getByRole('button', { name: 'Backlog' }))
    await user.click(within(filtersForm()).getByRole('button', { name: 'Favoritos' }))

    await waitFor(() => {
      expect(getAllMock).toHaveBeenLastCalledWith(
        {
          search: undefined,
          type: undefined,
          categoryIds: ['cat-1', 'cat-2'],
          status: undefined,
          sourceType: undefined,
          createdFrom: undefined,
          createdTo: undefined,
          minPersonalScore: undefined,
          maxPersonalScore: undefined,
          sortBy: 'CreatedAt',
          sortDirection: 'Desc',
          page: 1,
          pageSize: 12,
        },
        expect.any(AbortSignal),
      )
    })

    const params = new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')
    expect(params.getAll('categoryIds')).toEqual(['cat-1', 'cat-2'])
  })

  it('confirms and removes an item from the library through the dialog', async () => {
    const user = userEvent.setup()

    renderLibraryView('/library')

    await user.click(await screen.findByRole('button', { name: 'Eliminar' }))
    expect(screen.getByRole('alertdialog', { name: 'Eliminar "Frieren"' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Eliminar elemento' }))

    await waitFor(() => {
      expect(removeMock).toHaveBeenCalledWith('item-1')
    })

    expect(await screen.findByText('"Frieren" se eliminó de tu biblioteca.')).toBeInTheDocument()
  })
})