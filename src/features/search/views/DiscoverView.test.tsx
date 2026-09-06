import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ToastProvider } from '@/shared/components/ToastProvider'
import type { DiscoverProvider, SearchMediaItem } from '../schemas/searchSchema'

const getProvidersMock = vi.hoisted(() => vi.fn())
const searchMock = vi.hoisted(() => vi.fn())
const createMock = vi.hoisted(() => vi.fn())
const getAllCategoriesMock = vi.hoisted(() => vi.fn())

vi.mock('../api/SearchAPI', () => ({
  SearchApi: {
    getProviders: getProvidersMock,
    search: searchMock,
  },
}))

vi.mock('@/features/media-items/api/MediaItemsAPI', () => ({
  MediaItemsApi: {
    create: createMock,
  },
}))

vi.mock('@/features/categories/api/CategoriesAPI', () => ({
  CategoriesApi: {
    getAll: getAllCategoriesMock,
  },
}))

import DiscoverView from './DiscoverView'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location-search">{location.search}</output>
}

function renderDiscoverView(initialEntry = '/discover') {
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
              path="/discover"
              element={
                <>
                  <DiscoverView />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const searchItem: SearchMediaItem = {
  externalId: 7,
  title: 'Naruto',
  alternativeTitle: 'ナルト',
  suggestedType: 'Anime',
  sourceType: 'Jikan',
  externalMediaKind: 'Anime',
  externalStatusLabel: 'Activo',
  externalScore: 8.7,
  coverImageUrl: 'https://img.test/naruto.jpg',
  referenceUrl: 'https://example.com/naruto',
  releaseYear: 2002,
}

const providers: DiscoverProvider[] = [
  {
    key: 'jikan',
    displayName: 'Jikan',
    sourceType: 'Jikan',
    supportedTypes: ['All', 'Anime', 'Manga', 'Donghua', 'Manhwa', 'Manhua'],
  },
]

describe('DiscoverView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getProvidersMock.mockResolvedValue(providers)
    searchMock.mockResolvedValue([])
    createMock.mockResolvedValue({ title: 'Naruto' })
    getAllCategoriesMock.mockResolvedValue([
      { id: 'cat-1', name: 'Backlog', color: '#336699', createdAtUtc: '2026-05-06T10:00:00.000Z' },
    ])
  })

  it('shows the initial empty state and skips the search while the query is too short', () => {
    renderDiscoverView()

    expect(screen.getByText('Empieza con una búsqueda')).toBeInTheDocument()
    expect(
      screen.getByText('Escribe al menos 2 caracteres para iniciar la búsqueda.'),
    ).toBeInTheDocument()
    expect(searchMock).not.toHaveBeenCalled()
    expect(getProvidersMock).toHaveBeenCalledWith(expect.any(AbortSignal))
  })

  it('reads the filters from the URL and requests external results', async () => {
    searchMock.mockResolvedValue([searchItem])

    renderDiscoverView('/discover?query=naruto&type=Anime&limit=6')

    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith(
        { query: 'naruto', type: 'Anime', limit: 6, providers: expect.any(Array) },
        expect.any(AbortSignal),
      )
    })

    expect(await screen.findByText('Anime, Manga, Donghua, Manhwa, Manhua')).toBeInTheDocument()
    expect(await screen.findByText('Naruto')).toBeInTheDocument()
    // «listo», no «listos»: el texto anterior decía «1 resultado listos para importar»
    // porque el singular estaba resuelto a medias —se cambiaba el sustantivo y no el
    // adjetivo—, y esta línea lo daba por bueno. Al pasar la frase al diccionario con
    // las formas `_one` / `_other` de i18next, la concordancia la elige la biblioteca.
    expect(screen.getByText('1 resultado listo para importar.')).toBeInTheDocument()
  })

  it('submits a trimmed query and persists the selected options into the URL', async () => {
    const user = userEvent.setup()
    renderDiscoverView()

    await user.type(screen.getByLabelText('Consulta'), '  berserk  ')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith(
        { query: 'berserk', type: 'All', limit: 8, providers: expect.any(Array) },
        expect.any(AbortSignal),
      )
    })

    const locationOutput = screen.getByTestId('location-search').textContent ?? ''
    const params = new URLSearchParams(locationOutput)

    expect(params.get('query')).toBe('berserk')
    expect(params.get('type')).toBe('All')
    expect(params.get('limit')).toBe('8')
  })

  it('opens a quick import drawer, customizes the payload and shows success feedback', async () => {
    const user = userEvent.setup()
    searchMock.mockResolvedValue([searchItem])

    renderDiscoverView('/discover?query=naruto&type=Anime&limit=8')

    await screen.findByText('Naruto')
    await user.click(screen.getByRole('button', { name: /importar/i }))

    expect(screen.getByRole('dialog', { name: 'Importar Naruto' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Estado inicial'), 'Completed')
    await user.click(screen.getByRole('button', { name: 'Backlog' }))
    await user.type(screen.getByLabelText('Puntuación personal'), '9.5')
    await user.type(screen.getByLabelText('Notas de arranque'), '  Recomendado por un amigo  ')
    await user.click(screen.getByRole('button', { name: 'Guardar en biblioteca' }))

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({
        title: 'Naruto',
        alternativeTitle: 'ナルト',
        type: 'Anime',
        description: null,
        contentKind: 'Series',
        status: 'Completed',
        sourceType: 'Jikan',
        externalId: 7,
        externalMediaKind: 'Anime',
        externalStatusLabel: 'Activo',
        externalScore: 8.7,
        coverImageUrl: 'https://img.test/naruto.jpg',
        referenceUrl: 'https://example.com/naruto',
        releaseYear: 2002,
        progressUnit: 'Episodes',
        progressCount: 0,
        progressCurrent: 0,
        progressTotal: null,
        currentSeason: 1,
        personalScore: 9.5,
        startedAtUtc: null,
        completedAtUtc: null,
        notes: 'Recomendado por un amigo',
        categoryIds: ['cat-1'],
      })
    })

    expect(
      await screen.findByText('"Naruto" fue agregado a tu biblioteca con estado Completado.'),
    ).toBeInTheDocument()
  })
})
