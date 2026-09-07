import {
  MoonIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  SunIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/context/useAuth'
import LanguageToggle from '@/shared/components/LanguageToggle'
import { useDarkMode } from '@/shared/hooks/useDarkMode'
import { useToast } from '@/shared/hooks/useToast'

// La etiqueta ya no vive aquí: es la clave con la que se busca en el diccionario. El
// array sigue fuera del componente porque su contenido no depende del render.
const navigation = [
  {
    to: '/library',
    clave: 'nav.biblioteca',
    icon: RectangleStackIcon,
  },
  {
    to: '/catalog',
    clave: 'nav.catalogo',
    icon: Squares2X2Icon,
  },
] as const

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useDarkMode()
  const { showToast } = useToast()
  const { t } = useTranslation()

  // `logout` limpia la sesión local pase lo que pase —lo hace en un `finally`—, así que
  // aquí siempre se acaba fuera. Lo que puede fallar es avisar al servidor de que revoque
  // el token de refresco, y eso hay que decirlo: quedarse con `void logout()` descartaba
  // la promesa y un corte de red producía un *unhandled rejection* mudo.
  const handleLogout = () => {
    logout().catch(() => {
      showToast({
        tone: 'info',
        message: t('cabecera.cierreSinAvisar'),
      })
    })
  }

  return (
    <div className="app-shell">
      {/* WCAG 2.4.1: sin esto hay siete controles de cabecera antes del contenido
          en cada cambio de página. Solo es visible al recibir el foco. */}
      <a className="skip-link" href="#contenido">
        {t('cabecera.saltarAlContenido')}
      </a>

      <header className="app-shell__header">
        <div className="app-shell__header-inner">
          <div className="app-shell__topbar">
            <div className="brand">
              <span className="brand__title">TrackerMultimedia</span>
              <span className="brand__subtitle">{t('cabecera.subtitulo')}</span>
            </div>

            <div className="user-menu">
              <NavLink to="/profile" className="user-menu__name" title={user?.email}>
                <UserCircleIcon width={16} height={16} />
                {user?.displayName}
              </NavLink>
              <button
                className="theme-toggle"
                type="button"
                onClick={toggle}
                title={isDark ? t('cabecera.aModoClaro') : t('cabecera.aModoOscuro')}
                aria-label={isDark ? t('cabecera.aModoClaro') : t('cabecera.aModoOscuro')}
              >
                {isDark ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
              </button>
              <LanguageToggle />
              <button className="button button--ghost" onClick={handleLogout} type="button">
                {t('cabecera.salir')}
              </button>
            </div>
          </div>

          <nav className="app-nav" aria-label={t('cabecera.navegacionPrincipal')}>
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
                  <span>{t(item.clave)}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="app-shell__main" id="contenido" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
