import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './authContextDef'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
