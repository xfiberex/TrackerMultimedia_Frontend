import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/useAuth'
import Loader from './Loader'

/**
 * Envuelve rutas protegidas.
 * - Si la sesión está cargando: muestra un spinner.
 * - Si no hay usuario: redirige a /login guardando la ruta de origen.
 * - Si hay usuario: renderiza la ruta solicitada.
 */
export default function AuthGuard() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <Loader />

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
