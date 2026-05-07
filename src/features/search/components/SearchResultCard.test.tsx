import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchResultCard from './SearchResultCard'
import type { SearchMediaItem } from '../schemas/searchSchema'

const baseItem: SearchMediaItem = {
  externalId: 10,
  title: 'Naruto',
  alternativeTitle: null,
  suggestedType: 'Anime',
  sourceType: 'Jikan',
  externalMediaKind: 'Anime',
  externalStatusLabel: null,
  externalScore: null,
  coverImageUrl: null,
  referenceUrl: null,
  releaseYear: null,
}

describe('SearchResultCard', () => {
  it('renders fallback metadata and notifies when the quick import starts', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<SearchResultCard item={baseItem} isPending={false} onAdd={onAdd} />)

    expect(screen.getByText('Naruto')).toBeInTheDocument()
    expect(screen.getByText('Sin título alternativo')).toBeInTheDocument()
    expect(screen.getByText('Anime · Jikan · Estado editorial sin dato · Año sin dato')).toBeInTheDocument()
    expect(screen.getByText('Puntuación externa: Sin puntuación')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /preparar importación/i }))

    expect(onAdd).toHaveBeenCalledWith(baseItem)
  })

  it('shows the external link and pending state when applicable', () => {
    render(
      <SearchResultCard
        item={{
          ...baseItem,
          coverImageUrl: 'https://img.test/naruto.jpg',
          alternativeTitle: 'ナルト',
          externalStatusLabel: 'Activo',
          externalScore: 8.4,
          releaseYear: 2002,
          referenceUrl: 'https://example.com/naruto',
        }}
        isPending={true}
        onAdd={vi.fn()}
      />, 
    )

    expect(screen.getByRole('img', { name: 'Naruto' })).toHaveAttribute('src', 'https://img.test/naruto.jpg')
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled()
    expect(screen.getByRole('link', { name: /abrir/i })).toHaveAttribute('href', 'https://example.com/naruto')
  })
})
