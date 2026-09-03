import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import AuthGuard from './AuthGuard'

const useAuthMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/auth/context/useAuth', () => ({
  useAuth: useAuthMock,
}))

function LoginProbe() {
  const location = useLocation()
  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? 'none'
  return <div data-testid="login-probe">from:{fromPath}</div>
}

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the loader while auth state is still loading', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: true })

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/private" element={<div>private content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Cargando TrackerMultimedia')).toBeInTheDocument()
    expect(screen.queryByText('private content')).not.toBeInTheDocument()
  })

  it('redirects anonymous users to login and preserves the origin route', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false })

    render(
      <MemoryRouter initialEntries={['/discover']}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route element={<AuthGuard />}>
            <Route path="/discover" element={<div>discover content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('login-probe')).toHaveTextContent('from:/discover')
    expect(screen.queryByText('discover content')).not.toBeInTheDocument()
  })

  it('renders the protected outlet when a user is authenticated', () => {
    useAuthMock.mockReturnValue({
      user: { id: '1', email: 'user@test.com' },
      isLoading: false,
    })

    render(
      <MemoryRouter initialEntries={['/library']}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/library" element={<Outlet />}>
              <Route index element={<div>protected library</div>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('protected library')).toBeInTheDocument()
  })
})
