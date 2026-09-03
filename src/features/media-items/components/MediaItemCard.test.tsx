import { render, screen } from '@testing-library/react'
import MediaItemCard from './MediaItemCard'
import type { MediaItem } from '../schemas/mediaItemSchema'

const baseItem: MediaItem = {
  id: 'item-1',
  title: 'Frieren',
  alternativeTitle: null,
  type: null,
  description: null,
  contentKind: 'Movie',
  status: 'Planned',
  sourceType: 'Manual',
  externalId: null,
  externalMediaKind: null,
  externalStatusLabel: null,
  externalScore: null,
  coverImageUrl: null,
  referenceUrl: null,
  releaseYear: null,
  progressUnit: 'None',
  progressCount: 0,
  progressCurrent: 0,
  progressTotal: null,
  currentSeason: 1,
  personalScore: null,
  notes: null,
  categories: [],
  startedAtUtc: null,
  completedAtUtc: null,
  createdAtUtc: '2026-05-05T12:00:00.000Z',
  updatedAtUtc: '2026-05-05T12:00:00.000Z',
}

describe('MediaItemCard', () => {
  it('renders fallback labels when optional data is missing', () => {
    render(<MediaItemCard item={baseItem} />)

    expect(screen.getByText('Frieren')).toBeInTheDocument()
    expect(screen.getByText('Sin título alternativo')).toBeInTheDocument()
    expect(screen.getByText('Película')).toBeInTheDocument()
    expect(screen.getByText('Planeado')).toBeInTheDocument()
    expect(screen.getByText('Manual')).toBeInTheDocument()
    expect(screen.getByText('Año sin registrar · Sin progreso')).toBeInTheDocument()
    expect(screen.getByText('Sin puntuación')).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('renders cover, status badge and external labels when present', () => {
    render(
      <MediaItemCard
        item={{
          ...baseItem,
          type: 'Anime',
          contentKind: 'Series',
          coverImageUrl: 'https://img.test/frieren.jpg',
          alternativeTitle: 'Sousou no Frieren',
          status: 'InProgress',
          sourceType: 'Jikan',
          externalStatusLabel: 'Activo',
          releaseYear: 2023,
          progressUnit: 'Episodes',
          progressCount: 12,
          progressCurrent: 12,
          progressTotal: 24,
          currentSeason: 2,
          personalScore: 9.2,
          categories: [{ id: 'cat-1', name: 'Backlog', color: '#336699' }],
        }}
      />,
    )

    expect(screen.getByRole('img', { name: 'Frieren' })).toHaveAttribute(
      'src',
      'https://img.test/frieren.jpg',
    )
    expect(screen.getByText('En progreso')).toBeInTheDocument()
    expect(screen.getByText('Jikan')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Backlog')).toBeInTheDocument()
    expect(
      screen.getByText('Estreno 2023 · Progreso 12/24 episodios · Temporada 2'),
    ).toBeInTheDocument()
    expect(screen.getByText('9.2')).toBeInTheDocument()
  })
})
