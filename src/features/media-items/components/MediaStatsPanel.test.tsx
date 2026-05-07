import { render, screen } from '@testing-library/react'
import MediaStatsPanel from './MediaStatsPanel'
import type { MediaItemsStatsResponse } from '../schemas/mediaItemSchema'

const stats: MediaItemsStatsResponse = {
  totalCount: 12,
  plannedCount: 4,
  inProgressCount: 3,
  completedCount: 2,
  onHoldCount: 1,
  droppedCount: 2,
  startedThisMonthCount: 5,
  completedThisMonthCount: 2,
  backlogWithoutStartCount: 3,
  averagePersonalScore: 7.5,
  scoredItemsCount: 6,
  contentKindBreakdown: [
    { contentKind: 'Series', count: 8 },
    { contentKind: 'Comic', count: 4 },
  ],
  sourceBreakdown: [
    { sourceType: 'Manual', count: 5 },
    { sourceType: 'Jikan', count: 7 },
  ],
  categoryBreakdown: [
    { categoryId: 'cat-1', categoryName: 'Backlog', color: '#336699', count: 4 },
    { categoryId: 'cat-2', categoryName: 'Favoritos', color: null, count: 2 },
  ],
  averageScoreByContentKind: [
    { contentKind: 'Series', averagePersonalScore: 8.2, scoredItemsCount: 5 },
    { contentKind: 'Comic', averagePersonalScore: 7.1, scoredItemsCount: 1 },
  ],
}

describe('MediaStatsPanel', () => {
  it('renders placeholder values when stats are unavailable', () => {
    render(<MediaStatsPanel />)

    expect(screen.getByText('Resumen de la biblioteca')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(6)
  })

  it('renders summary cards and translated breakdowns', () => {
    render(<MediaStatsPanel stats={stats} />)

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('7.5')).toBeInTheDocument()
    expect(screen.getAllByText('Serie')).toHaveLength(2)
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('Manual')).toBeInTheDocument()
    expect(screen.getByText('Jikan')).toBeInTheDocument()
    expect(screen.getByText('Backlog')).toBeInTheDocument()
    expect(screen.getByText('8.2')).toBeInTheDocument()
  })
})