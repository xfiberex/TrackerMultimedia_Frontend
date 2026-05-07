import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/components/ToastProvider'
import type { Category } from '../schemas/categorySchema'

const getAllMock = vi.hoisted(() => vi.fn())
const createMock = vi.hoisted(() => vi.fn())
const updateMock = vi.hoisted(() => vi.fn())
const removeMock = vi.hoisted(() => vi.fn())

vi.mock('../api/CategoriesAPI', () => ({
  CategoriesApi: {
    getAll: getAllMock,
    create: createMock,
    update: updateMock,
    remove: removeMock,
  },
}))

import CategoriesView from './CategoriesView'

const categories: Category[] = [
  { id: 'cat-1', name: 'Backlog', color: '#336699', createdAtUtc: '2026-05-06T12:00:00.000Z' },
  { id: 'cat-2', name: 'Favoritos', color: null, createdAtUtc: '2026-05-06T12:30:00.000Z' },
]

function renderCategoriesView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <CategoriesView />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('CategoriesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAllMock.mockResolvedValue(categories)
    createMock.mockResolvedValue(categories[0])
    updateMock.mockResolvedValue({ ...categories[0], name: 'Retomar', color: '#445566' })
    removeMock.mockResolvedValue(undefined)
  })

  it('creates a category from the editor form', async () => {
    const user = userEvent.setup()

    renderCategoriesView()

    await user.type(await screen.findByLabelText('Nombre de la categoría'), '  Backlog  ')
    await user.type(screen.getByLabelText('Color'), '#336699')
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }))

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({
        name: 'Backlog',
        color: '#336699',
      })
    })

    expect(await screen.findByText('"Backlog" se creó correctamente.')).toBeInTheDocument()
  })

  it('loads an existing category into the form and updates it', async () => {
    const user = userEvent.setup()

    renderCategoriesView()

    const editButtons = await screen.findAllByRole('button', { name: 'Editar' })
    await user.click(editButtons[0])

    const nameInput = screen.getByLabelText('Nombre de la categoría')
    await user.clear(nameInput)
    await user.type(nameInput, 'Retomar')
    const colorInput = screen.getByLabelText('Color')
    await user.clear(colorInput)
    await user.type(colorInput, '#445566')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith('cat-1', {
        name: 'Retomar',
        color: '#445566',
      })
    })

    expect(await screen.findByText('"Retomar" se actualizó correctamente.')).toBeInTheDocument()
  })

  it('confirms and deletes a category through the dialog', async () => {
    const user = userEvent.setup()

    renderCategoriesView()

    const deleteButtons = await screen.findAllByRole('button', { name: 'Eliminar' })
    await user.click(deleteButtons[0])
    expect(screen.getByRole('alertdialog', { name: 'Eliminar la categoría "Backlog"' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Eliminar categoría' }))

    await waitFor(() => {
      expect(removeMock).toHaveBeenCalledWith('cat-1')
    })

    expect(await screen.findByText('"Backlog" se eliminó correctamente.')).toBeInTheDocument()
  })
})