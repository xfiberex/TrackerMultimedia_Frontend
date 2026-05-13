import {
  MagnifyingGlassIcon,
  MoonIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  SunIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/useAuth'
import { useDarkMode } from '@/shared/hooks/useDarkMode'

const navigation = [
  {
    to: '/library',
    label: 'Biblioteca',
    icon: RectangleStackIcon,
  },
  {
    to: '/discover',
    label: 'Descubrir',
    icon: MagnifyingGlassIcon,
  },
  {
    to: '/catalog',
    label: 'Catálogo',
    icon: Squares2X2Icon,
  },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useDarkMode()

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__header-inner">
          <div className="app-shell__topbar">
            <div className="brand">
              <span className="brand__title">TrackerMultimedia</span>
              <span className="brand__subtitle">
                Gestiona y descubre tu contenido multimedia.
              </span>
            </div>

            <div className="user-menu">
              <NavLink
                to="/profile"
                className="user-menu__name"
                title={user?.email}
              >
                <UserCircleIcon width={16} height={16} />
                {user?.displayName}
              </NavLink>
              <button
                className="theme-toggle"
                type="button"
                onClick={toggle}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDark ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
              </button>
              <button
                className="button button--ghost"
                onClick={() => void logout()}
                type="button"
              >
                Salir
              </button>
            </div>
          </div>

          <nav className="app-nav" aria-label="Navegación principal">
            {navigation.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `app-nav__link${isActive ? ' app-nav__link--active' : ''}`
                  }
                >
                  <Icon width={18} height={18} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
