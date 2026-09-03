import { render, screen, within } from '@testing-library/react'
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

/** El componente renderiza un <tr>, así que necesita una tabla que lo contenga. */
function renderRow(item: SearchMediaItem, isPending: boolean, onAdd: () => void) {
  return render(
    <table>
      <tbody>
        <SearchResultCard item={item} isPending={isPending} onAdd={onAdd} />
      </tbody>
    </table>,
  )
}

describe('SearchResultCard', () => {
  it('renders fallback metadata and notifies when the quick import starts', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    renderRow(baseItem, false, onAdd)

    const row = screen.getByRole('row')
    expect(within(row).getByText('Naruto')).toBeInTheDocument()
    expect(within(row).getByText('Anime')).toBeInTheDocument()
    expect(within(row).getByText('Jikan')).toBeInTheDocument()

    // Sin estado editorial, sin año y sin puntuación se muestra un guion en cada celda.
    expect(within(row).getAllByText('—')).toHaveLength(2)
    expect(within(row).getByText('Sin puntuación')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /importar/i }))

    expect(onAdd).toHaveBeenCalledWith(baseItem)
  })

  it('shows the external link and pending state when applicable', () => {
    renderRow(
      {
        ...baseItem,
        coverImageUrl: 'https://img.test/naruto.jpg',
        alternativeTitle: 'ナルト',
        externalStatusLabel: 'Activo',
        externalScore: 8.4,
        releaseYear: 2002,
        referenceUrl: 'https://example.com/naruto',
      },
      true,
      vi.fn(),
    )

    expect(screen.getByRole('img', { name: 'Naruto' })).toHaveAttribute(
      'src',
      'https://img.test/naruto.jpg',
    )
    expect(screen.getByText('ナルト')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('2002')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled()

    // El enlace externo solo contiene un icono decorativo: su nombre accesible
    // tiene que venir del aria-label, o se anuncia como «enlace» sin más.
    expect(screen.getByRole('link', { name: /abrir naruto/i })).toHaveAttribute(
      'href',
      'https://example.com/naruto',
    )
  })
})
