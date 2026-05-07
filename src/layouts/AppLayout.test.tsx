import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route path="library" element={<div>Library content</div>} />
          <Route path="categories" element={<div>Categories content</div>} />
          <Route path="discover" element={<div>Discover content</div>} />
          <Route path="profile" element={<div>Profile content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(screen.getByRole('link', { name: 'Descubrir' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Categorías' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tester' })).toHaveAttribute('title', 'user@test.com')
    expect(screen.getByText('Library content')).toBeInTheDocument()
  })

  it('calls logout when the user clicks the sign-out button', async () => {
    const user = userEvent.setup()

    renderAppLayout('/discover')
    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(logoutMock).toHaveBeenCalled()
    expect(screen.getByText('Discover content')).toBeInTheDocument()
  })
})