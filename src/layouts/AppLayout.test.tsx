import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/shared/components/ToastProvider'
import type { User } from '@/features/auth/schemas/authSchema'

const logoutMock = vi.hoisted(() => vi.fn())
const authState = vi.hoisted(() => ({
  user: null as User | null,
  logout: logoutMock,
}))

vi.mock('@/features/auth/context/useAuth', () => ({
  useAuth: () => authState,
}))

import AppLayout from './AppLayout'

function renderAppLayout(initialEntry = '/library') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="library" element={<div>Library content</div>} />
            <Route path="categories" element={<div>Categories content</div>} />
            <Route path="profile" element={<div>Profile content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    logoutMock.mockResolvedValue(undefined)
    authState.user = {
      id: 'user-1',
      email: 'user@test.com',
      displayName: 'Tester',
      emailConfirmed: true,
      hasPassword: true,
      linkedProviders: ['password'],
    }
  })

  it('renders navigation, user data and the current outlet', () => {
    renderAppLayout('/library')

    expect(screen.getByRole('link', { name: 'Biblioteca' })).toHaveClass('app-nav__link--active')
    expect(screen.getByRole('link', { name: 'Catálogo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tester' })).toHaveAttribute('title', 'user@test.com')
    expect(screen.getByText('Library content')).toBeInTheDocument()
  })

  it('calls logout when the user clicks the sign-out button', async () => {
    const user = userEvent.setup()

    renderAppLayout('/categories')
    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(logoutMock).toHaveBeenCalled()
    expect(screen.getByText('Categories content')).toBeInTheDocument()
  })

  /// T3-16. `onClick={() => void logout()}` descartaba la promesa: un corte de red
  /// producía un *unhandled rejection* mudo. La sesión local se limpia igualmente
  /// —`logout` lo hace en un `finally`—, así que lo que hay que contar es lo otro.
  it('warns when the server could not be told about the sign-out', async () => {
    const user = userEvent.setup()
    logoutMock.mockRejectedValue(new Error('Network Error'))

    renderAppLayout('/library')
    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(await screen.findByText(/no se pudo avisar al servidor/i)).toBeInTheDocument()
  })
})
