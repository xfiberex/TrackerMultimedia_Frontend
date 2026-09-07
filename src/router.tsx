import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Loader from '@/shared/components/Loader'
import AuthGuard from '@/shared/components/AuthGuard'

const AppLayout = lazy(() => import('@/layouts/AppLayout'))
const CatalogView = lazy(() => import('@/features/catalog/views/CatalogView'))
const LibraryView = lazy(() => import('@/features/media-items/views/LibraryView'))
const LoginView = lazy(() => import('@/features/auth/views/LoginView'))
const RegisterView = lazy(() => import('@/features/auth/views/RegisterView'))
const ProfileView = lazy(() => import('@/features/auth/views/ProfileView'))
const ForgotPasswordView = lazy(() => import('@/features/auth/views/ForgotPasswordView'))
const ResetPasswordView = lazy(() => import('@/features/auth/views/ResetPasswordView'))
const OAuthCallbackView = lazy(() => import('@/features/auth/views/OAuthCallbackView'))
const ConfirmEmailView = lazy(() => import('@/features/auth/views/ConfirmEmailView'))
const ResendConfirmationView = lazy(() => import('@/features/auth/views/ResendConfirmationView'))
const LinkAccountView = lazy(() => import('@/features/auth/views/LinkAccountView'))

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/forgot-password" element={<ForgotPasswordView />} />
          <Route path="/reset-password" element={<ResetPasswordView />} />
          <Route path="/confirm-email" element={<ConfirmEmailView />} />
          <Route path="/resend-confirmation" element={<ResendConfirmationView />} />
          <Route path="/oauth-callback" element={<OAuthCallbackView />} />
          <Route path="/link-account" element={<LinkAccountView />} />

          {/* Rutas protegidas */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/library" replace />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/catalog" element={<CatalogView />} />
              <Route path="/profile" element={<ProfileView />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/library" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
